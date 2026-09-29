import { expect, test, type Page } from '@playwright/test';

// Configuração › Reports (Step 4.8): FD_CONFIGURACAO_REPORTS, master-detail with fixed leading
// parameters and the N_PARAMETROS rule, against the dev server's in-memory store, never Oracle
// (CLAUDE.md HARD RULE).

const master = (page: Page) => page.getByRole('region', { name: 'Reports', exact: true });
const masterGrid = (page: Page) => page.getByRole('grid', { name: 'Reports' });
const masterFooter = (page: Page) => master(page).locator('[aria-live="polite"]');
const detail = (page: Page) => page.getByRole('region', { name: 'Parâmetros' });
const detailGrid = (page: Page) => page.getByRole('grid', { name: 'Parâmetros' });
const panel = (page: Page) => page.getByRole('dialog');
const row = (page: Page, text: string) =>
  masterGrid(page).getByRole('row').filter({ hasText: text }).first();

test.use({ storageState: 'e2e/.auth/adm.json' });

test.beforeEach(async ({ page }) => {
  await page.goto('/configuracao/reports');
  await expect(masterFooter(page)).toHaveText('2 registos');
});

test('selecting a report shows its parameters, fixed rows first', async ({ page }) => {
  await row(page, 'Relatório de Impressões').locator('td').nth(1).click();
  const detailRows = detailGrid(page).locator('tbody tr');
  await expect(detailRows).toHaveCount(3);
  await expect(detailRows.nth(0)).toContainText('_USER');
  await expect(detailRows.nth(1)).toContainText('P_USUARIO');
  await expect(detailRows.nth(2)).toContainText('P_DATAACTUAL');
});

test('the 3 fixed parameters\' Nome cannot be edited; a later one can', async ({ page }) => {
  await row(page, 'Relatório de Backups').locator('td').nth(1).click();
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
  await row(page, 'Relatório de Backups').locator('td').nth(1).dblclick();
  await panel(page).getByLabel('Observações').fill('Actualizado');
  await panel(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(panel(page).getByRole('alert')).toContainText('número de parâmetros');
});

test('cannot delete a report that still has parameters', async ({ page }) => {
  await row(page, 'Relatório de Impressões').locator('td').nth(1).click();
  await master(page).getByRole('button', { name: 'Apagar' }).click();
  await master(page)
    .getByRole('region', { name: 'Alterações por guardar' })
    .getByRole('button', { name: 'Guardar' })
    .click();
  await expect(
    master(page).getByRole('region', { name: 'Alterações por guardar' }),
  ).toContainText('registo mestre');
});
