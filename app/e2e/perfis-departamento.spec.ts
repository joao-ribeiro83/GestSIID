import { expect, test, type Page } from '@playwright/test';

// Gador › Equipa de Gestão (Step 5.5): FD_PERFIS_DEPARTAMENTO against the dev server's in-memory
// stores (2 perfis, 3 active employees), never Oracle (CLAUDE.md HARD RULE). The dev store is shared
// by the whole run: the one test that saves uses its own employee (EF3003Z) and a unique name.

const block = (page: Page) => page.getByRole('region', { name: 'Equipa de Gestão', exact: true });
const grid = (page: Page) => page.getByRole('grid', { name: 'Equipa de Gestão' });
const panel = (page: Page) => page.getByRole('dialog');
const row = (page: Page, text: string) => grid(page).getByRole('row').filter({ hasText: text }).first();

// A real 1x1 PNG, so the <img> preview decodes.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

test.use({ storageState: 'e2e/.auth/adm.json' });

test.beforeEach(async ({ page }) => {
  await page.goto('/gador/equipa-gestao');
  await expect(row(page, 'Ana Ribeiro')).toBeVisible();
});

test('lists the perfis by employee and never offers to delete one', async ({ page }) => {
  await expect(grid(page).locator('tbody tr').first()).toContainText('AB1001X');
  await row(page, 'Ana Ribeiro').locator('td').nth(1).click();
  await expect(block(page).getByRole('button', { name: 'Apagar' })).toBeDisabled();
});

test('choosing an employee fills the department and the suggested code, função and perfil', async ({
  page,
}) => {
  await block(page).getByRole('button', { name: 'Novo' }).click();
  await panel(page).getByRole('button', { name: 'Escolher empregado' }).click();
  const options = page.getByRole('listbox', { name: 'Empregados' }).getByRole('option');
  await expect(options).toHaveCount(3); // GH4004W is not active
  await options.filter({ hasText: 'CD2002Y' }).click();

  await expect(panel(page).locator('#pf-CDEMPLEA')).toHaveValue('CD2002Y');
  await expect(panel(page).locator('#pf-CDDEPARTA')).toHaveValue('OD68');
  await expect(panel(page).locator('#pf-CODIGO')).toHaveValue('GC2002');
  await expect(panel(page).locator('#pf-FUNCAODEP_ID')).toHaveValue('GCOM');
  await expect(panel(page).locator('#pf-NOME')).toHaveValue('Gestor Comercial');
});

test('the suggestion never overwrites what the user already typed', async ({ page }) => {
  await block(page).getByRole('button', { name: 'Novo' }).click();
  await panel(page).locator('#pf-NOME').fill('Perfil à mão');
  await panel(page).getByRole('button', { name: 'Escolher empregado' }).click();
  await page.getByRole('option').filter({ hasText: 'CD2002Y' }).click();
  await expect(panel(page).locator('#pf-CODIGO')).toHaveValue('GC2002');
  await expect(panel(page).locator('#pf-NOME')).toHaveValue('Perfil à mão');
});

test('creates a perfil; the signature can only be added once it is saved', async ({ page }) => {
  await block(page).getByRole('button', { name: 'Novo' }).click();
  await expect(panel(page)).toContainText('Grave o registo para anexar a assinatura');
  await panel(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(panel(page)).toContainText('Campo obrigatório'); // Empregado, Nome, Data Início…

  const nome = `Carlos ${Date.now()}`;
  await panel(page).getByRole('button', { name: 'Escolher empregado' }).click();
  await page.getByRole('option').filter({ hasText: 'EF3003Z' }).click();
  await panel(page).locator('#pf-DESCRICAO').fill(nome);
  await panel(page).locator('#pf-DATA_INICIO').fill('01-01-2026');
  await panel(page).getByRole('button', { name: 'Guardar' }).click();

  await expect(row(page, nome)).toContainText('GC3003');
  await expect(row(page, nome)).toContainText('Gestor de Conta');
});

test('uploads a signature, previews it in the side panel, then removes it', async ({ page }) => {
  await row(page, 'Ana Ribeiro').dblclick();
  await expect(panel(page)).toContainText('Sem assinatura');

  await panel(page).getByLabel('Ficheiro da assinatura').setInputFiles({
    name: 'assinatura.png',
    mimeType: 'image/png',
    buffer: PNG,
  });
  const img = panel(page).getByRole('img', { name: 'Assinatura' });
  await expect(img).toBeVisible();
  await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(0);

  await panel(page).getByRole('button', { name: 'Remover assinatura' }).click();
  await expect(img).toHaveCount(0);
  await expect(panel(page)).toContainText('Sem assinatura');
});

test('refuses a file that is not an image, with the server message', async ({ page }) => {
  await row(page, 'Ana Ribeiro').dblclick();
  await panel(page).getByLabel('Ficheiro da assinatura').setInputFiles({
    name: 'nota.png', // the name says PNG, the bytes say text
    mimeType: 'image/png',
    buffer: Buffer.from('isto não é uma imagem'),
  });
  await expect(panel(page).getByRole('alert')).toContainText('Tipo de ficheiro não suportado');
  await expect(panel(page).getByRole('img', { name: 'Assinatura' })).toHaveCount(0);
});
