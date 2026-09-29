import { expect, test, type Page } from '@playwright/test';

// Administração › Tipos Mídia (Step 4.2): FD_TIPOS_MiDIA against the dev server's in-memory
// store, seeded with the 7 real media types and 11 units — never Oracle (CLAUDE.md HARD RULE).

const grid = (page: Page) => page.getByRole('grid', { name: 'Tipos de mídia' });
const block = (page: Page) => page.getByRole('region', { name: 'Tipos de mídia', exact: true });
const footer = (page: Page) => block(page).locator('[aria-live="polite"]');
const bar = (page: Page) => page.getByRole('region', { name: 'Alterações por guardar' });
const row = (page: Page, text: string) =>
  grid(page).getByRole('row').filter({ hasText: text }).first();
// Columns: 0 marker, 1 Id, 2 Designação, 3 U.M., 4 Tamanho, 5 Bytes.
const cell = (page: Page, text: string, n: number) => row(page, text).locator('td').nth(n);

test.use({ storageState: 'e2e/.auth/adm.json' });

test.beforeEach(async ({ page }) => {
  await page.goto('/administracao/tipos-midia');
  await expect(footer(page)).toHaveText('7 registos');
});

test('filters and sorts on the server', async ({ page }) => {
  const designacao = page.getByRole('textbox', { name: 'Filtro Designação' });
  await designacao.fill('DVD-RAM%');
  await designacao.press('Enter');
  await expect(footer(page)).toHaveText('3 registos');

  await block(page).getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(footer(page)).toHaveText('7 registos');

  const designacaoHeader = grid(page).getByRole('columnheader', {
    name: 'Designação',
    exact: true,
  });
  await designacaoHeader.getByRole('button').click();
  await designacaoHeader.getByRole('button').click();
  await expect(designacaoHeader).toHaveAttribute('aria-sort', 'descending');
});

test('U.M. shows the unit name and its select lists every unit by factor', async ({ page }) => {
  await expect(cell(page, 'DVD-R 4,7 Gb', 3)).toHaveText('Gigabytes');
  await expect(cell(page, 'DVD-R 4,7 Gb', 5)).toHaveText(/^4\s700\s000\s000$/);

  await cell(page, 'DVD-R 4,7 Gb', 3).dblclick();
  const options = cell(page, 'DVD-R 4,7 Gb', 3).locator('option');
  await expect(options).toHaveCount(12); // blank + the 11 units (RG_UNIDADES_MEDIDA)
  await expect(options.nth(1)).toHaveText('Bytes'); // ORDER BY FACTOR
  await expect(options.nth(11)).toHaveText('Pebibytes');
});

test('creates, recomputes Bytes on edit and deletes a media type', async ({ page }) => {
  await block(page).getByRole('button', { name: 'Novo' }).click();
  await expect(bar(page)).toContainText('1 novo');

  const firstRow = grid(page).locator('tbody tr').first();
  await firstRow.locator('td').nth(1).dblclick(); // Id
  await page.keyboard.type('cd');
  await page.keyboard.press('Tab');
  await page.keyboard.type('CD de teste'); // Designação
  await page.keyboard.press('Enter');
  await firstRow.locator('td').nth(4).dblclick(); // Tamanho; U.M. defaults to GB
  await page.keyboard.type('2');
  await page.keyboard.press('Enter');

  await bar(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(footer(page)).toHaveText('8 registos');
  await expect(cell(page, 'CD de teste', 1)).toHaveText('CD'); // upper-cased by the server
  await expect(cell(page, 'CD de teste', 3)).toHaveText('Gigabytes');
  await expect(cell(page, 'CD de teste', 5)).toHaveText(/^2\s000\s000\s000$/);

  // POST-CHANGE: Bytes follows the size…
  await cell(page, 'CD de teste', 4).dblclick();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('3');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ControlOrMeta+s');
  await expect(cell(page, 'CD de teste', 5)).toHaveText(/^3\s000\s000\s000$/);

  // …and the unit.
  await cell(page, 'CD de teste', 3).dblclick();
  await cell(page, 'CD de teste', 3).locator('select').selectOption({ label: 'Megabytes' });
  await page.keyboard.press('Enter');
  await page.keyboard.press('ControlOrMeta+s');
  await expect(cell(page, 'CD de teste', 5)).toHaveText(/^3\s000\s000$/);
  await expect(bar(page)).toBeHidden();

  await cell(page, 'CD de teste', 2).click();
  await block(page).getByRole('button', { name: 'Apagar' }).click();
  await expect(bar(page)).toContainText('apagado');
  await bar(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(footer(page)).toHaveText('7 registos');
});

test('a new row without Id, then without Designação, shows the required-field error', async ({
  page,
}) => {
  await block(page).getByRole('button', { name: 'Novo' }).click();
  await bar(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(bar(page)).toContainText('Id: Campo obrigatório.'); // the bar names the first error

  await grid(page).locator('tbody tr').first().locator('td').nth(1).dblclick();
  await page.keyboard.type('x');
  await page.keyboard.press('Enter');
  await bar(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(bar(page)).toContainText('Designação: Campo obrigatório.');
});
