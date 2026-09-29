import { expect, test, type Page } from '@playwright/test';

// Configuração › Impressoras Associadas › Documento (MASTER_PLAN Step 5.0):
// FD_GESTAO_IMPRESSORAS_DOC against the dev server's in-memory store (3 seed rows across MOD1
// and MOD2), never Oracle (CLAUDE.md HARD RULE). Playwright runs with workers: 1 and the dev
// server's store is shared across specs, so the mutating test below works off a fresh
// MODELO_ID/printer/date combination it creates and cleans up itself, instead of a hard-coded
// global row count.

const grid = (page: Page) => page.getByRole('grid', { name: 'Impressoras Associadas por Documento' });
const block = (page: Page) =>
  page.getByRole('region', { name: 'Impressoras Associadas por Documento', exact: true });
const footer = (page: Page) => block(page).locator('[aria-live="polite"]');
const rows = (page: Page) => grid(page).locator('tbody tr');
// td:nth-child(1) is DataBlock's leading "row state" gutter cell (no click handler, no text); the
// first real data column (MODELO_ID here) is nth-child(2) — same pattern as impressoras.spec.ts's
// descricaoCells.
const modeloCells = (page: Page) => grid(page).locator('tbody tr td:nth-child(2)');

// The footer reads "N registos" with no current row, "Registo P de N" once a row is current
// (Nova impressora here always requires one first) — the total is always the *last* number.
async function total(page: Page): Promise<number> {
  const text = (await footer(page).textContent()) ?? '';
  const nums = text.match(/\d+/g) ?? ['0'];
  return Number(nums[nums.length - 1]);
}

test.use({ storageState: 'e2e/.auth/adm.json' });

test.beforeEach(async ({ page }) => {
  await page.goto('/configuracao/impressoras-associadas/documento');
  // Not just "visible": the footer renders with a transient "0 registos" before the initial
  // fetch resolves, so a `total()` read right after goto can race the real seed count.
  await expect(footer(page)).not.toHaveText('0 registos');
});

test('filters and sorts on the server', async ({ page }) => {
  const baseline = await total(page);

  const modelo = page.getByRole('textbox', { name: 'Filtro Modelo' });
  await modelo.fill('MOD1');
  await modelo.press('Enter');
  await expect(footer(page)).toHaveText('2 registos');
  for (const text of await modeloCells(page).allTextContents()) {
    expect(text).toBe('MOD1');
  }

  await block(page).getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(footer(page)).toHaveText(`${baseline} registos`);

  const header = grid(page).getByRole('columnheader', { name: 'Início Validade', exact: true });
  await header.getByRole('button').click();
  await expect(header).toHaveAttribute('aria-sort', 'ascending');
  await expect(rows(page).first()).toContainText('MOD2'); // MOD2's row starts earliest (2019)
});

test('Nova impressora, overlap rejection, Alterar Validade and Anular', async ({ page }) => {
  // "Nova impressora" (literal legacy quirk): the dialog reuses the *current row's* MODELO_ID,
  // not a picker of its own — pick a MOD1 row first.
  await rows(page).filter({ hasText: 'MOD1' }).first().locator('td:nth-child(2)').click();
  const novaButton = block(page).getByRole('button', { name: 'Nova impressora' });
  await expect(novaButton).toBeEnabled();
  await novaButton.click();

  const nova = page.getByRole('dialog', { name: 'Definir Nova Impressora' });
  await expect(nova).toContainText('MOD1');
  await nova.getByRole('button', { name: 'Escolher…' }).click();
  const picker = page.getByRole('dialog', { name: 'Escolher impressora' });
  await picker.getByRole('textbox', { name: 'Pesquisar impressora' }).fill('Impressora 9');
  await expect(picker.getByRole('option')).toHaveCount(1);
  await picker.getByRole('option').first().click();
  await expect(picker).toBeHidden();

  await nova.getByRole('textbox', { name: 'Início Validade' }).fill('01-09-2021');
  await nova.getByRole('textbox', { name: 'Fim Validade' }).fill('31-12-2021');
  const before = await total(page);
  await nova.getByRole('button', { name: 'OK' }).click();
  await expect(nova).toBeHidden();
  await expect.poll(() => total(page)).toBe(before + 1);

  const created = grid(page).getByRole('row').filter({ hasText: '01-09-2021' });
  await expect(created).toContainText('MOD1');
  await expect(created).toContainText('9');

  // Overlap rejection: another MOD1 range crossing the DATA_INICIO of the one just created
  // (2021-09-01) — the legacy check only catches a row whose own start/end date falls inside
  // the new range (or vice-versa), not a new range fully contained inside an existing one; this
  // range starts before and ends after the existing row's DATA_INICIO, so it is caught. Scope is
  // per MODELO_ID regardless of printer.
  await novaButton.click();
  await expect(nova).toBeVisible();
  await nova.getByRole('button', { name: 'Escolher…' }).click();
  await picker.getByRole('textbox', { name: 'Pesquisar impressora' }).fill('Impressora 11');
  await picker.getByRole('option').first().click();
  await nova.getByRole('textbox', { name: 'Início Validade' }).fill('01-08-2021');
  await nova.getByRole('textbox', { name: 'Fim Validade' }).fill('10-09-2021');
  await nova.getByRole('button', { name: 'OK' }).click();
  await expect(nova).toContainText(
    'As datas de início e de fim que introduziu são incompatíveis com outra configuração já introduzida.',
  );
  expect(await total(page)).toBe(before + 1); // unchanged
  await nova.getByRole('button', { name: 'Cancelar' }).click();

  // Alterar Validade: dates only, re-checked by the same overlap rule.
  await created.locator('td:nth-child(2)').click();
  await block(page).getByRole('button', { name: 'Alterar Validade' }).click();
  const alterar = page.getByRole('dialog', { name: 'Alterar Validade' });
  await expect(alterar.getByRole('textbox', { name: 'Início Validade' })).toHaveValue('01-09-2021');
  await alterar.getByRole('textbox', { name: 'Fim Validade' }).fill('30-09-2021');
  await alterar.getByRole('button', { name: 'OK' }).click();
  await expect(alterar).toBeHidden();
  const updated = grid(page).getByRole('row').filter({ hasText: '01-09-2021' });
  await expect(updated).toContainText('30-09-2021');

  // Anular: confirm text names the printer and model; dates become 01-01-1980.
  await updated.locator('td:nth-child(2)').click();
  await block(page).getByRole('button', { name: 'Anular' }).click();
  const confirm = page.getByRole('dialog').filter({ hasText: 'Deseja anular a impressora' });
  await expect(confirm).toContainText("Deseja anular a impressora '9 - Impressora 9 - 10.0.0.9' para o documento MOD1?");
  await confirm.getByRole('button', { name: 'Sim' }).click();
  await expect(grid(page).getByRole('row').filter({ hasText: '01-01-1980' })).toBeVisible();
});
