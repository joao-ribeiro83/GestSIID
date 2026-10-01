import { expect, test, type Page } from '@playwright/test';

// Configuração › Reports (Step 4.8): FD_CONFIGURACAO_REPORTS, with fixed leading parameters and the
// N_PARAMETROS rule, against the dev server's in-memory store, never Oracle (CLAUDE.md HARD RULE).
// D-34: the list fills the page; a row's "Abrir parâmetros" button opens its parameters on
// /configuracao/reports/<id>, and Voltar returns to the list as it was.

const master = (page: Page) => page.getByRole('region', { name: 'Reports', exact: true });
const masterGrid = (page: Page) => page.getByRole('grid', { name: 'Reports' });
const masterFooter = (page: Page) => master(page).locator('[aria-live="polite"]');
const detailGrid = (page: Page) => page.getByRole('grid', { name: 'Parâmetros' });
const panel = (page: Page) => page.getByRole('dialog');
const row = (page: Page, text: string) =>
  masterGrid(page).getByRole('row').filter({ hasText: text }).first();
/** A data cell: td 0 is the gutter, td 1 the row's open button. */
const cell = (page: Page, text: string, n = 0) => row(page, text).locator('td').nth(2 + n);
const abrir = async (page: Page, text: string) => {
  await row(page, text).getByRole('button', { name: 'Abrir parâmetros' }).click();
  await expect(page).toHaveURL(/\/configuracao\/reports\/\d+$/);
};

test.use({ storageState: 'e2e/.auth/adm.json' });

test.beforeEach(async ({ page }) => {
  await page.goto('/configuracao/reports');
  await expect(masterFooter(page)).toHaveText('2 registos');
});

test('a report opens its parameters on their own page, fixed rows first', async ({ page }) => {
  await abrir(page, 'Relatório de Impressões');
  await expect(page.getByRole('heading', { level: 2 })).toContainText('Relatório de Impressões');
  await expect(page.getByRole('navigation', { name: 'Localização' })).toContainText('Reports');
  const detailRows = detailGrid(page).locator('tbody tr');
  await expect(detailRows).toHaveCount(3);
  await expect(detailRows.nth(0)).toContainText('_USER');
  await expect(detailRows.nth(1)).toContainText('P_USUARIO');
  await expect(detailRows.nth(2)).toContainText('P_DATAACTUAL');
  await expect(masterGrid(page)).toBeHidden();
});

test('Voltar returns to the list with its filter unchanged', async ({ page }) => {
  const filtro = masterGrid(page).locator('thead input').first();
  await filtro.fill('%Backups%');
  await filtro.press('Enter');
  await expect(masterFooter(page)).toHaveText('1 registo');
  await abrir(page, 'Relatório de Backups');
  await page.getByRole('button', { name: 'Voltar' }).click();
  await expect(page).toHaveURL(/\/configuracao\/reports$/);
  await expect(masterFooter(page)).toHaveText('1 registo');
  await expect(filtro).toHaveValue('%Backups%');
});

test('the 3 fixed parameters\' Nome cannot be edited; a later one can', async ({ page }) => {
  await abrir(page, 'Relatório de Backups');
  const detailRows = detailGrid(page).locator('tbody tr');
  await expect(detailRows).toHaveCount(4);

  const fixedCell = detailRows.nth(0).locator('td').nth(1);
  await fixedCell.dblclick(); // fixed: _USER
  await expect(fixedCell.locator('input, select')).toHaveCount(0);
  await expect(detailRows.nth(0)).toContainText('_USER');

  const freeCell = detailRows.nth(3).locator('td').nth(1);
  await freeCell.dblclick(); // not fixed: P_TIPO_BACKUP
  await expect(freeCell.locator('input')).toHaveCount(1);
  await page.keyboard.press('Escape');
});

test('saving a report whose parameter count no longer matches N.º Parâmetros is refused', async ({
  page,
}) => {
  // Relatório de Backups: N_PARAMETROS=3 but 4 parameter rows are seeded.
  await cell(page, 'Relatório de Backups').dblclick();
  await panel(page).getByLabel('Observações').fill('Actualizado');
  await panel(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(panel(page).getByRole('alert')).toContainText('número de parâmetros');
});

test('cannot delete a report that still has parameters', async ({ page }) => {
  await cell(page, 'Relatório de Impressões').click();
  await master(page).getByRole('button', { name: 'Apagar' }).click();
  await master(page)
    .getByRole('region', { name: 'Alterações por guardar' })
    .getByRole('button', { name: 'Guardar' })
    .click();
  await expect(
    master(page).getByRole('region', { name: 'Alterações por guardar' }),
  ).toContainText('registo mestre');
});
