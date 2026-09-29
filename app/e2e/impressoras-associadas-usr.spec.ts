import { expect, test, type Page } from '@playwright/test';

// Configuração › Impressoras Associadas › Utilizador (MASTER_PLAN Step 5.0):
// FD_GESTAO_IMPRESSORAS_USR against the dev server's in-memory store (3 seed rows), never Oracle
// (CLAUDE.md HARD RULE). As in impressoras-associadas-doc.spec.ts, the mutating test works off
// fresh MODELO_ID/CDEMPLEA combinations (MOD3/USER3, MOD4, USER4) rather than a hard-coded total.

const grid = (page: Page) => page.getByRole('grid', { name: 'Impressoras Associadas por Utilizador' });
const block = (page: Page) =>
  page.getByRole('region', { name: 'Impressoras Associadas por Utilizador', exact: true });
const footer = (page: Page) => block(page).locator('[aria-live="polite"]');

async function total(page: Page): Promise<number> {
  const text = (await footer(page).textContent()) ?? '';
  return Number(/(\d+)/.exec(text)?.[1] ?? '0');
}

test.use({ storageState: 'e2e/.auth/adm.json' });

test.beforeEach(async ({ page }) => {
  await page.goto('/configuracao/impressoras-associadas/utilizador');
  await expect(footer(page)).toBeVisible();
});

test('filters and sorts on the server', async ({ page }) => {
  const baseline = await total(page);

  const modelo = page.getByRole('textbox', { name: 'Filtro Modelo' });
  await modelo.fill('MOD1');
  await modelo.press('Enter');
  await expect(footer(page)).toHaveText('2 registos');

  await block(page).getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(footer(page)).toHaveText(`${baseline} registos`);

  const header = grid(page).getByRole('columnheader', { name: 'Início Validade', exact: true });
  await header.getByRole('button').click();
  await expect(header).toHaveAttribute('aria-sort', 'ascending');
});

test('Nova impressora (own Modelo/Utilizador pickers), overlap rejection, Alterar Validade and Anular', async ({
  page,
}) => {
  // Unlike the Documento screen, USR's "Nova impressora" really does use its own dialog fields —
  // no current row is required.
  const novaButton = block(page).getByRole('button', { name: 'Nova impressora' });
  await expect(novaButton).toBeEnabled();
  await novaButton.click();

  const nova = page.getByRole('dialog', { name: 'Definir Nova Impressora' });
  await nova.getByRole('button', { name: 'Escolher…' }).nth(0).click();
  const modeloPicker = page.getByRole('dialog', { name: 'Escolher modelo' });
  await modeloPicker.getByRole('option', { name: 'MOD3', exact: true }).click();

  await nova.getByRole('button', { name: 'Escolher…' }).nth(0).click();
  const utilizadorPicker = page.getByRole('dialog', { name: 'Escolher utilizador' });
  await utilizadorPicker.getByRole('option', { name: 'USER3', exact: true }).click();

  await nova.getByRole('button', { name: 'Escolher…' }).nth(0).click();
  const impressoraPicker = page.getByRole('dialog', { name: 'Escolher impressora' });
  await impressoraPicker.getByRole('textbox', { name: 'Pesquisar impressora' }).fill('Impressora 9');
  await impressoraPicker.getByRole('option').first().click();

  await nova.getByRole('textbox', { name: 'Início Validade' }).fill('01-01-2022');
  await nova.getByRole('textbox', { name: 'Fim Validade' }).fill('31-12-2022');
  const before = await total(page);
  await nova.getByRole('button', { name: 'OK' }).click();
  await expect(nova).toBeHidden();
  await expect(footer(page)).toHaveText(`${before + 1} registos`);

  const created = grid(page).getByRole('row').filter({ hasText: '01-01-2022' });
  await expect(created).toContainText('MOD3');
  await expect(created).toContainText('USER3');

  // Overlap rejection: same MOD3/USER3 scope, a range crossing the just-created row's
  // DATA_INICIO (2022-01-01) — the legacy check only catches a row whose own start/end falls
  // inside the new range (or vice-versa), not a new range fully contained inside an existing one.
  await novaButton.click();
  await expect(nova).toBeVisible();
  await nova.getByRole('button', { name: 'Escolher…' }).nth(0).click();
  await page.getByRole('dialog', { name: 'Escolher modelo' }).getByRole('option', { name: 'MOD3', exact: true }).click();
  await nova.getByRole('button', { name: 'Escolher…' }).nth(0).click();
  await page.getByRole('dialog', { name: 'Escolher utilizador' }).getByRole('option', { name: 'USER3', exact: true }).click();
  await nova.getByRole('button', { name: 'Escolher…' }).nth(0).click();
  const impressoraPicker2 = page.getByRole('dialog', { name: 'Escolher impressora' });
  await impressoraPicker2.getByRole('textbox', { name: 'Pesquisar impressora' }).fill('Impressora 11');
  await impressoraPicker2.getByRole('option').first().click();
  await nova.getByRole('textbox', { name: 'Início Validade' }).fill('01-12-2021');
  await nova.getByRole('textbox', { name: 'Fim Validade' }).fill('15-01-2022');
  await nova.getByRole('button', { name: 'OK' }).click();
  await expect(nova).toContainText(
    'As datas de início e de fim que introduziu são incompatíveis com outra configuração já introduzida.',
  );
  await expect(footer(page)).toHaveText(`${before + 1} registos`);
  await nova.getByRole('button', { name: 'Cancelar' }).click();

  // Alterar Validade.
  await created.locator('td:nth-child(2)').click();
  await block(page).getByRole('button', { name: 'Alterar Validade' }).click();
  const alterar = page.getByRole('dialog', { name: 'Alterar Validade' });
  await expect(alterar.getByRole('textbox', { name: 'Início Validade' })).toHaveValue('01-01-2022');
  await alterar.getByRole('textbox', { name: 'Fim Validade' }).fill('30-11-2022');
  await alterar.getByRole('button', { name: 'OK' }).click();
  await expect(alterar).toBeHidden();
  const updated = grid(page).getByRole('row').filter({ hasText: '01-01-2022' });
  await expect(updated).toContainText('30-11-2022');

  // Anular: confirm text names the printer, user and model.
  await updated.locator('td:nth-child(2)').click();
  await block(page).getByRole('button', { name: 'Anular' }).click();
  const confirm = page.getByRole('dialog').filter({ hasText: 'Deseja anular a impressora' });
  await expect(confirm).toContainText(
    "Deseja anular a impressora '9 - Impressora 9 - 10.0.0.9' do utilizador USER3 para o documento MOD3?",
  );
  await confirm.getByRole('button', { name: 'Sim' }).click();
  await expect(grid(page).getByRole('row').filter({ hasText: '01-01-1980' })).toBeVisible();
});

test('Copiar do modelo copies the source model\'s unexpired rows into the target model', async ({ page }) => {
  await block(page).getByRole('button', { name: 'Copiar do modelo…' }).click();
  const dialog = page.getByRole('dialog', { name: 'Copiar do modelo…' });

  await dialog.getByRole('button', { name: 'Escolher…' }).nth(0).click();
  await page.getByRole('dialog', { name: 'Escolher modelo' }).getByRole('option', { name: 'MOD4', exact: true }).click();
  await dialog.getByRole('button', { name: 'Escolher…' }).nth(0).click();
  await page.getByRole('dialog', { name: 'Escolher modelo' }).getByRole('option', { name: 'MOD2', exact: true }).click();

  const before = await total(page);
  await dialog.getByRole('button', { name: 'OK' }).click();
  await expect(dialog).toBeHidden();
  await expect(footer(page)).toHaveText(`${before + 1} registos`);

  const copied = grid(page).getByRole('row').filter({ hasText: 'MOD4' }).filter({ hasText: 'USER2' });
  await expect(copied).toBeVisible();
});

test('Copiar do utilizador copies the source user\'s unexpired rows into the target user', async ({ page }) => {
  await block(page).getByRole('button', { name: 'Copiar do utilizador…' }).click();
  const dialog = page.getByRole('dialog', { name: 'Copiar do utilizador…' });

  // USER1 (not USER2): USER2's own rows are mutated by the "Copiar do modelo" spec above (a
  // fresh MOD4/USER2 row); USER1's single unexpired seed row (MOD1/printer2, open-ended) stays
  // untouched by every other spec in this file, so this test's expected +1 delta holds
  // regardless of execution order relative to the other specs.
  await dialog.getByRole('button', { name: 'Escolher…' }).nth(0).click();
  await page.getByRole('dialog', { name: 'Escolher utilizador' }).getByRole('option', { name: 'USER4', exact: true }).click();
  await dialog.getByRole('button', { name: 'Escolher…' }).nth(0).click();
  await page.getByRole('dialog', { name: 'Escolher utilizador' }).getByRole('option', { name: 'USER1', exact: true }).click();

  const before = await total(page);
  await dialog.getByRole('button', { name: 'OK' }).click();
  await expect(dialog).toBeHidden();
  await expect(footer(page)).toHaveText(`${before + 1} registos`);

  const copied = grid(page).getByRole('row').filter({ hasText: 'MOD1' }).filter({ hasText: 'USER4' });
  await expect(copied).toBeVisible();
});
