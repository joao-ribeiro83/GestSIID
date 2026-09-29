import { expect, test, type Page } from '@playwright/test';

// Administração › Unidades Medida (Step 4.2): FD_UNIDADES_MEDIDA against the dev server's
// in-memory store, seeded with the 11 real units — never Oracle (CLAUDE.md HARD RULE).

const grid = (page: Page) => page.getByRole('grid', { name: 'Unidades de medida' });
const block = (page: Page) => page.getByRole('region', { name: 'Unidades de medida', exact: true });
const footer = (page: Page) => block(page).locator('[aria-live="polite"]');
const bar = (page: Page) => page.getByRole('region', { name: 'Alterações por guardar' });
const row = (page: Page, text: string) =>
  grid(page).getByRole('row').filter({ hasText: text }).first();

test.use({ storageState: 'e2e/.auth/adm.json' });

test.beforeEach(async ({ page }) => {
  await page.goto('/administracao/unidades-medida');
  await expect(footer(page)).toHaveText('11 registos');
});

test('filters and sorts on the server', async ({ page }) => {
  const nome = page.getByRole('textbox', { name: 'Filtro Nome' });
  await nome.fill('Gi%');
  await nome.press('Enter');
  await expect(footer(page)).toHaveText('2 registos'); // Gigabytes, Gibibytes

  await block(page).getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(footer(page)).toHaveText('11 registos');

  const factor = grid(page).getByRole('columnheader', { name: 'Factor', exact: true });
  await factor.getByRole('button').click();
  await expect(factor).toHaveAttribute('aria-sort', 'ascending');
  await expect(grid(page).locator('tbody tr').first()).toContainText('Bytes');
});

test('the Unidade Base column is a select fed by the base units', async ({ page }) => {
  // Kilobytes has base BYTES: the cell shows its name, not the key.
  await expect(row(page, 'Kilobytes').locator('td').nth(4)).toHaveText('Bytes');

  await row(page, 'Kilobytes').locator('td').nth(4).dblclick();
  const options = row(page, 'Kilobytes').locator('td').nth(4).locator('option');
  await expect(options).toHaveText(['', 'Bytes']); // RG_UNIDADES_BASE: only units without a base
});

test('creates (ID upper-cased by the server), edits and deletes a unit', async ({ page }) => {
  await block(page).getByRole('button', { name: 'Novo' }).click();
  await expect(bar(page)).toContainText('1 novo');

  const firstRow = grid(page).locator('tbody tr').first();
  await firstRow.locator('td').nth(1).dblclick(); // Unidade (ID)
  await page.keyboard.type('xb');
  await page.keyboard.press('Tab');
  await page.keyboard.type('Xabytes'); // Nome
  await page.keyboard.press('Tab');
  await page.keyboard.type('1000000000000000000'); // Factor
  await page.keyboard.press('Enter');

  await bar(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(footer(page)).toHaveText('12 registos');
  await expect(row(page, 'Xabytes').locator('td').nth(1)).toHaveText('XB');

  await row(page, 'Xabytes').locator('td').nth(2).dblclick();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('Xabytes editada');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ControlOrMeta+s');
  await expect(row(page, 'Xabytes editada')).toBeVisible();
  await expect(bar(page)).toBeHidden();

  await row(page, 'Xabytes editada').locator('td').nth(2).click();
  await block(page).getByRole('button', { name: 'Apagar' }).click();
  await expect(bar(page)).toContainText('apagado');
  await bar(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(footer(page)).toHaveText('11 registos');
});

test('a new row without the ID shows the required-field error', async ({ page }) => {
  await block(page).getByRole('button', { name: 'Novo' }).click();
  await bar(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(bar(page)).toContainText('Unidade: Campo obrigatório.');
});

test('a Nome over 60 characters shows the field error', async ({ page }) => {
  await block(page).getByRole('button', { name: 'Novo' }).click();
  const firstRow = grid(page).locator('tbody tr').first();
  await firstRow.locator('td').nth(1).dblclick();
  await page.keyboard.type('Z');
  await page.keyboard.press('Enter');

  await firstRow.locator('td').nth(2).dblclick();
  // fill() would stop at the input's maxlength; set the DOM value past it (see PILOT_NOTES.md).
  await firstRow
    .locator('td')
    .nth(2)
    .locator('input')
    .evaluate((el: HTMLInputElement, value: string) => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )!.set!;
      setter.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, 'N'.repeat(61));
  await page.keyboard.press('Enter');

  await bar(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(bar(page)).toContainText('Nome: Máximo 60 caracteres.');
});
