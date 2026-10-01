import { expect, test, type Page } from '@playwright/test';

// Administração › Domínios (Step 4.6): FD_DOMINIOS_SIID, the first master-detail screen, against
// the dev server's in-memory store (6 domains + their values), never Oracle (CLAUDE.md HARD RULE).
// D-34: the list fills the page; a row's "Abrir valores do domínio" button opens its values on
// /administracao/dominios/<id>, and Voltar returns to the list.

const master = (page: Page) => page.getByRole('region', { name: 'Domínios', exact: true });
const masterGrid = (page: Page) => page.getByRole('grid', { name: 'Domínios' });
const masterFooter = (page: Page) => master(page).locator('[aria-live="polite"]');
const detail = (page: Page) => page.getByRole('region', { name: 'Valores do domínio' });
const detailGrid = (page: Page) => page.getByRole('grid', { name: 'Valores do domínio' });
const detailFooter = (page: Page) => detail(page).locator('[aria-live="polite"]');
const panel = (page: Page) => page.getByRole('dialog');
const row = (page: Page, text: string) =>
  masterGrid(page).getByRole('row').filter({ hasText: text }).first();
/** A data cell: td 0 is the gutter, td 1 the row's open button. */
const cell = (page: Page, text: string) => row(page, text).locator('td').nth(2);
const abrir = async (page: Page, id: string) => {
  await row(page, id).getByRole('button', { name: 'Abrir valores do domínio' }).click();
  await expect(page).toHaveURL(new RegExp(`/administracao/dominios/${id}$`));
};

test.use({ storageState: 'e2e/.auth/adm.json' });

test.beforeEach(async ({ page }) => {
  await page.goto('/administracao/dominios');
  await expect(masterFooter(page)).toHaveText('6 registos');
});

test('a domain opens only its own values, in PRIORIDADE order; Voltar returns', async ({ page }) => {
  await expect(detail(page)).toHaveCount(0); // the list fills the page

  await abrir(page, 'BINARIO');
  await expect(page.getByRole('heading', { level: 2 })).toContainText('BINARIO');
  await expect(detailFooter(page)).toHaveText('2 registos');
  const detailRows = detailGrid(page).locator('tbody tr');
  await expect(detailRows.nth(0)).toContainText('Não'); // PRIORIDADE 0
  await expect(detailRows.nth(1)).toContainText('Sim'); // PRIORIDADE 1

  await page.getByRole('button', { name: 'Voltar' }).click();
  await expect(masterFooter(page)).toHaveText('6 registos');
  await abrir(page, 'NIVEL_ACESSO');
  await expect(detailFooter(page)).toHaveText('0 registos');
});

test('Tipo/Formatação String only show for a STRING domain, Mínimo/Máximo only for an interval', async ({
  page,
}) => {
  await cell(page, 'NIVEL_ACESSO').dblclick(); // TIPO_INFORMACAO_RF='NUMBER'
  await expect(panel(page).getByLabel('Tipo String')).toHaveCount(0);
  await expect(panel(page).getByLabel('Formatação String')).toHaveCount(0);
  await expect(panel(page).getByLabel('Mínimo')).toHaveCount(0);
  await panel(page).getByRole('button', { name: 'Cancelar' }).click();

  await cell(page, 'BINARIO').dblclick(); // TIPO_INFORMACAO_RF='STRING'
  await expect(panel(page).getByLabel('Tipo String')).toBeVisible();
  await expect(panel(page).getByLabel('Formatação String')).toBeVisible();
  await expect(panel(page).getByLabel('Mínimo')).toHaveCount(0); // TIPO_DOMINIO_RF='L', not interval
  await panel(page).getByRole('button', { name: 'Cancelar' }).click();

  await cell(page, 'TIPO_STRING').dblclick(); // TIPO_DOMINIO_RF='I'
  await expect(panel(page).getByLabel('Mínimo')).toBeVisible();
  await expect(panel(page).getByLabel('Máximo')).toBeVisible();
});

test('toggling Tipo on a new domain shows the STRING fields live, before saving', async ({
  page,
}) => {
  await master(page).getByRole('button', { name: 'Novo' }).click();
  await expect(panel(page).getByLabel('Tipo String')).toBeVisible(); // initial value is STRING

  const tipoInformacao = panel(page).locator('#pf-TIPO_INFORMACAO_RF');
  await tipoInformacao.selectOption({ value: 'NUMBER' });
  await expect(panel(page).getByLabel('Tipo String')).toHaveCount(0);

  await tipoInformacao.selectOption({ value: 'STRING' });
  await expect(panel(page).getByLabel('Tipo String')).toBeVisible();
});

test('creates a domain value and deletes it', async ({ page }) => {
  await abrir(page, 'NIVEL_ACESSO');
  await expect(detailFooter(page)).toHaveText('0 registos');

  // Once loaded, the empty grid has its own "Novo" next to the toolbar's; use that one.
  await detailGrid(page).getByRole('button', { name: 'Novo' }).click();
  const first = detailGrid(page).locator('tbody tr').first();
  await first.locator('td').nth(1).dblclick(); // Chave
  await page.keyboard.type('ALTO');
  await page.keyboard.press('Tab');
  await page.keyboard.type('Alto'); // Designação
  await page.keyboard.press('Tab');
  await page.keyboard.type('Nível de acesso alto'); // Descrição
  await page.keyboard.press('Enter');
  await detail(page)
    .getByRole('region', { name: 'Alterações por guardar' })
    .getByRole('button', { name: 'Guardar' })
    .click();
  await expect(detailGrid(page).locator('tbody tr')).toHaveCount(1);
  await expect(detailGrid(page)).toContainText('ALTO');

  await detailGrid(page).locator('tbody tr').first().locator('td').nth(1).click();
  await detail(page).getByRole('button', { name: 'Apagar' }).click();
  await detail(page)
    .getByRole('region', { name: 'Alterações por guardar' })
    .getByRole('button', { name: 'Guardar' })
    .click();
  await expect(detailFooter(page)).toHaveText('0 registos');
});

test('cannot delete a domain that still has values', async ({ page }) => {
  await cell(page, 'BINARIO').click();
  await master(page).getByRole('button', { name: 'Apagar' }).click();
  await master(page)
    .getByRole('region', { name: 'Alterações por guardar' })
    .getByRole('button', { name: 'Guardar' })
    .click();
  await expect(
    master(page).getByRole('region', { name: 'Alterações por guardar' }),
  ).toContainText('registo mestre');
});
