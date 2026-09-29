import { expect, test, type Page } from '@playwright/test';

// Step 4.1 "Done when": filter, sort, create, edit, delete, a validation error, the picker —
// against the dev server's in-memory impressoras store (apps/api/src/features/dev/routes.ts),
// never against Oracle (CLAUDE.md HARD RULE).

const grid = (page: Page) => page.getByRole('grid', { name: 'Impressoras' });
const block = (page: Page) => page.getByRole('region', { name: 'Impressoras', exact: true });
const footer = (page: Page) => block(page).locator('[aria-live="polite"]');
const descricaoCells = (page: Page) => grid(page).locator('tbody tr td:nth-child(3)');

test.use({ storageState: 'e2e/.auth/adm.json' });

test.beforeEach(async ({ page }) => {
  await page.goto('/configuracao/impressoras');
  await expect(footer(page)).toHaveText('12 registos');
});

test('filters and sorts on the server', async ({ page }) => {
  const descricao = page.getByRole('textbox', { name: 'Filtro Descrição' });
  await descricao.fill('Impressora 1%');
  await descricao.press('Enter');
  await expect(footer(page)).toHaveText('4 registos'); // Impressora 1, 10, 11, 12
  for (const text of await descricaoCells(page).allTextContents()) {
    expect(text).toMatch(/^Impressora 1/);
  }

  await block(page).getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(footer(page)).toHaveText('12 registos');

  // Id is the resource's default sort, so its header already reads "ascending" unclicked;
  // sort by Descrição instead, like datablock.spec.ts does with a non-default column.
  const descricaoHeader = grid(page).getByRole('columnheader', { name: 'Descrição', exact: true });
  await descricaoHeader.getByRole('button').click();
  await expect(descricaoHeader).toHaveAttribute('aria-sort', 'ascending');
  await descricaoHeader.getByRole('button').click();
  await expect(descricaoHeader).toHaveAttribute('aria-sort', 'descending');
});

test('creates, edits and deletes a printer', async ({ page }) => {
  await block(page).getByRole('button', { name: 'Novo' }).click();
  const bar = page.getByRole('region', { name: 'Alterações por guardar' });
  await expect(bar).toContainText('1 novo');

  const firstRow = grid(page).locator('tbody tr').first();
  await firstRow.locator('td').nth(2).dblclick(); // Descrição
  await page.keyboard.type('Impressora de teste');
  await page.keyboard.press('Tab');
  await page.keyboard.type('10.0.0.99'); // Endereço
  await page.keyboard.press('Enter');

  // The footer only updates once the list refetches after a successful save, so waiting on it
  // (rather than the "Guardado." toast, which can stack across the several saves below) is the
  // robust sync point.
  await bar.getByRole('button', { name: 'Guardar' }).click();
  await expect(footer(page)).toHaveText('13 registos');

  const created = grid(page).getByRole('row').filter({ hasText: 'Impressora de teste' }).first();
  await expect(created).toContainText('10.0.0.99');

  // Edit.
  await created.locator('td').nth(2).dblclick();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('Impressora editada');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ControlOrMeta+s');
  await expect(grid(page).getByRole('row').filter({ hasText: 'Impressora editada' })).toBeVisible();
  await expect(bar).toBeHidden();

  // Delete.
  const editedRow = grid(page).getByRole('row').filter({ hasText: 'Impressora editada' }).first();
  await editedRow.locator('td').nth(2).click();
  const apagar = block(page).getByRole('button', { name: 'Apagar' });
  await expect(apagar).toBeEnabled();
  await apagar.click();
  await expect(bar).toContainText('apagado');
  await bar.getByRole('button', { name: 'Guardar' }).click();
  await expect(footer(page)).toHaveText('12 registos');
});

test('new row: a value over the column length shows the field error', async ({ page }) => {
  await block(page).getByRole('button', { name: 'Novo' }).click();
  const bar = page.getByRole('region', { name: 'Alterações por guardar' });

  const firstRow = grid(page).locator('tbody tr').first();
  await firstRow.locator('td').nth(4).dblclick(); // Servidor, maxLength 60
  const servidorInput = firstRow.locator('td').nth(4).locator('input');
  // fill() respects the input's native maxlength (it stops at 60); set the DOM value directly,
  // through React's tracked-value setter, to actually exceed it and exercise the zod check.
  await servidorInput.evaluate((el: HTMLInputElement, value: string) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, 'S'.repeat(61));
  await page.keyboard.press('Enter');

  await bar.getByRole('button', { name: 'Guardar' }).click();
  await expect(bar).toContainText('Servidor: Máximo 60 caracteres.');
});

test('the printer picker searches and selects a valid printer', async ({ page }) => {
  await block(page).getByRole('button', { name: 'Escolher impressora' }).click();
  const dialog = page.getByRole('dialog', { name: 'Escolher impressora' });
  await expect(dialog).toBeVisible();

  await dialog.getByRole('textbox', { name: 'Pesquisar impressora' }).fill('Impressora 3');
  const options = dialog.getByRole('option');
  await expect(options).toHaveCount(1);
  await options.first().click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText(/Impressora escolhida: 3 — Impressora 3/)).toBeVisible();
});
