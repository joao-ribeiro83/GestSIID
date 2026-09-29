import { expect, test, type Page } from '@playwright/test';

// Administração › Variáveis SIID (Step 4.4): FD_VARIAVEIS_SIID against the dev server's in-memory
// store (5 variables of the environment + 3 rows that must never show), never Oracle
// (CLAUDE.md HARD RULE).

const grid = (page: Page) => page.getByRole('grid', { name: 'Variáveis SIID' });
const block = (page: Page) => page.getByRole('region', { name: 'Variáveis SIID', exact: true });
const footer = (page: Page) => block(page).locator('[aria-live="polite"]');
const bar = (page: Page) => page.getByRole('region', { name: 'Alterações por guardar' });
const row = (page: Page, text: string) =>
  grid(page).getByRole('row').filter({ hasText: text }).first();
// Columns: 0 marker, 1 Tipo, 2 Valor.
const cell = (page: Page, text: string, n: number) => row(page, text).locator('td').nth(n);

test.use({ storageState: 'e2e/.auth/adm.json' });

test.beforeEach(async ({ page }) => {
  await page.goto('/administracao/variaveis');
  await expect(footer(page)).toHaveText('5 registos');
});

test('shows the environment\'s variables, never the password ones nor another environment\'s', async ({
  page,
}) => {
  const body = page.waitForResponse((r) => r.url().includes('/api/variaveis') && r.ok());
  await page.reload();
  const text = await (await body).text();
  expect(text).not.toMatch(/PASSWORD|HASH-|de outro ambiente/);

  await expect(cell(page, '14', 1)).toHaveText('Limite de notificações'); // domain label
  await expect(grid(page)).not.toContainText('SLB');
});

test('edits a value and refuses a type that is already associated', async ({ page }) => {
  await cell(page, '\\\\servidor\\documentos\\backup', 2).dblclick();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('E:\\backups');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ControlOrMeta+s');
  await expect(bar(page)).toBeHidden();
  await expect(row(page, 'E:\\backups')).toBeVisible();

  await block(page).getByRole('button', { name: 'Novo' }).click();
  const first = grid(page).locator('tbody tr').first();
  await first.locator('td').nth(1).dblclick();
  await first.locator('td').nth(1).locator('select').selectOption({ label: 'Destino dos backups' });
  await page.keyboard.press('Enter');
  await bar(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(bar(page)).toContainText('Este tipo de variável já está associado.');
});

test('creates and deletes a variable', async ({ page }) => {
  await block(page).getByRole('button', { name: 'Novo' }).click();
  const first = grid(page).locator('tbody tr').first();
  await first.locator('td').nth(1).dblclick();
  await first.locator('td').nth(1).locator('select').selectOption({ label: 'Ghostscript' });
  await page.keyboard.press('Enter');
  await first.locator('td').nth(2).dblclick();
  await page.keyboard.type('C:\\gs\\gswin64.exe');
  await page.keyboard.press('Enter');
  await bar(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(footer(page)).toHaveText('6 registos');

  await cell(page, 'Ghostscript', 1).click();
  await block(page).getByRole('button', { name: 'Apagar' }).click();
  await bar(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(footer(page)).toHaveText('5 registos');
});
