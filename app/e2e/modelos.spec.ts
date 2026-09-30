import { expect, test, type Page } from '@playwright/test';

// Configuração › Modelos (Step 6.3): FD_CONFIGURACAO_MODELOS against the dev server's in-memory
// stores, never Oracle (CLAUDE.md HARD RULE). A model only comes from "Clonar", so "create model"
// is a clone of MOD2 under a new reference, unique per run (the dev stores outlive a run).

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const ASK = 'Deseja gravar as alterações efectuadas?';

const master = (page: Page) => page.getByRole('region', { name: 'Modelos', exact: true });
const masterGrid = (page: Page) => page.getByRole('grid', { name: 'Modelos' });
const seccoes = (page: Page) => page.getByRole('region', { name: 'Secções' });
const seccoesGrid = (page: Page) => page.getByRole('grid', { name: 'Secções' });
const imagem = (page: Page) => page.getByRole('region', { name: 'Assinatura' });
const dialog = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });
/** A master toolbar button (the grid has a sort button with the same name, "Código Barras"). */
const accao = (page: Page, name: string) => master(page).getByRole('button', { name, exact: true }).first();

/** Filters the master by Id and makes that model the current row. */
async function abrirModelo(page: Page, id: string) {
  const filtro = masterGrid(page).getByLabel('Filtro Id');
  await filtro.fill(id);
  await filtro.press('Enter');
  await masterGrid(page).locator('tbody tr').filter({ hasText: id }).locator('td').nth(1).click();
  await expect(page.getByRole('heading', { name: `Modelo ${id}` })).toBeVisible();
}

test.use({ storageState: 'e2e/.auth/adm.json' });

test.beforeEach(async ({ page }) => {
  await page.goto('/configuracao/modelos');
  await expect(masterGrid(page)).toContainText('MOD1', { timeout: 20_000 }); // a fresh browser loads cold
});

test('create a model (Clonar) → add a section with an image → save → reopen', async ({ page }) => {
  const id = `E2E${Date.now().toString(36).slice(-6).toUpperCase()}`;

  // Clonar Modelo: the new reference, then #38.
  await abrirModelo(page, 'MOD2');
  await accao(page, 'Clonar').click();
  const clonar = dialog(page, 'Clonar Modelo');
  await clonar.getByLabel('Modelo').fill(id);
  await clonar.getByLabel('Descrição').fill('Modelo criado pelo e2e');
  await clonar.getByRole('button', { name: 'OK' }).click();
  const irreversivel = dialog(page, 'Clonar');
  await expect(irreversivel).toContainText('Esta operação é irreversível.');
  await irreversivel.getByRole('button', { name: 'Sim' }).click();
  await expect(clonar).toBeHidden();

  // The clone has MOD2's section; add one of its own.
  await abrirModelo(page, id);
  await expect(seccoesGrid(page)).toContainText('Cabeçalho');
  await seccoes(page).getByRole('button', { name: 'Novo' }).click();
  await page.keyboard.type('ANEXO'); // Id Secção (the new row opens on its first cell)
  await page.keyboard.press('Tab');
  await page.keyboard.type('1'); // Alínea
  await page.keyboard.press('Tab');
  await seccoesGrid(page).getByRole('combobox', { name: 'Tipo de Conteúdo' }).selectOption({ label: 'Imagem' });
  await page.keyboard.press('Tab');
  await page.keyboard.type('Anexo com imagem'); // Título
  await page.keyboard.press('Enter');
  await seccoes(page)
    .getByRole('region', { name: 'Alterações por guardar' })
    .getByRole('button', { name: 'Guardar' })
    .click();
  await expect(seccoes(page).getByRole('region', { name: 'Alterações por guardar' })).toBeHidden();

  // The image: pick the file, then send it (the form's two buttons), with progress.
  await seccoesGrid(page).locator('tbody tr').filter({ hasText: 'ANEXO' }).locator('td').nth(1).click();
  await expect(imagem(page)).toContainText('Sem imagem');
  await imagem(page).getByLabel('Abrir Ficheiro ...').setInputFiles({
    name: 'anexo.png',
    mimeType: 'image/png',
    buffer: PNG,
  });
  await expect(imagem(page)).toContainText('anexo.png');
  await imagem(page).getByRole('button', { name: 'Guardar imagem na BD' }).click();
  await expect(imagem(page).getByRole('img', { name: 'Assinatura' })).toBeVisible();

  // Reopen: a fresh page shows the model, its new section and the stored image.
  await page.reload();
  await abrirModelo(page, id);
  const anexo = seccoesGrid(page).locator('tbody tr').filter({ hasText: 'ANEXO' });
  await expect(anexo).toContainText('Anexo com imagem');
  await expect(anexo).toContainText('Imagem'); // Tipo conteúdo shown by its label
  await anexo.locator('td').nth(1).click();
  await expect(imagem(page).getByRole('img', { name: 'Assinatura' })).toBeVisible();

  // Limpar asks, then removes.
  await imagem(page).getByRole('button', { name: 'Limpar' }).click();
  await dialog(page, 'Remover a imagem desta alínea?').getByRole('button', { name: 'Sim' }).click();
  await expect(imagem(page)).toContainText('Sem imagem');
});

test('Clonar with a reference that exists shows #37 in the dialog', async ({ page }) => {
  await abrirModelo(page, 'MOD2');
  await accao(page, 'Clonar').click();
  const clonar = dialog(page, 'Clonar Modelo');
  await clonar.getByLabel('Modelo').fill('MOD1');
  await clonar.getByRole('button', { name: 'OK' }).click();
  await dialog(page, 'Clonar').getByRole('button', { name: 'Sim' }).click();
  await expect(clonar.getByRole('alert')).toHaveText('Já existe um modelo com esta referência');
});

test('Alterar Modelo saves its fields; Código Barras shows the stored barcode', async ({ page }) => {
  await abrirModelo(page, 'MOD2');
  await accao(page, 'Alterar Modelo').click();
  const alterar = dialog(page, 'Alterar Modelo');
  await expect(alterar.getByLabel('Modelo')).toHaveText('MOD2');
  await alterar.getByLabel('Nº de Cópias').fill('3');
  await alterar.getByRole('button', { name: 'OK' }).click();
  await expect(alterar).toBeHidden();
  await expect(masterGrid(page).locator('tbody tr').filter({ hasText: 'MOD2' })).toContainText('3');

  await abrirModelo(page, 'MOD1');
  await accao(page, 'Código Barras').click();
  const codigo = dialog(page, 'Código Barras');
  await expect(codigo.getByLabel('Largura (cm)')).toHaveValue('4');
  await expect(codigo).toContainText('(Origem do documento é o canto superior esquerdo e medida em cm)');
  await codigo.getByRole('button', { name: 'Cancelar' }).click();
});

test('unsaved rows ask "Deseja gravar…" where ASK_COMMIT did: section row, tab, master row', async ({
  page,
}) => {
  await abrirModelo(page, 'MOD1');
  const titulo = seccoesGrid(page).locator('tbody tr').filter({ hasText: 'Cabeçalho' }).locator('td').nth(4);
  const editarTitulo = async (texto: string) => {
    await titulo.dblclick();
    await page.keyboard.press('Control+A');
    await page.keyboard.type(texto);
    await page.keyboard.press('Enter');
  };
  const pergunta = page.getByRole('dialog', { name: ASK });

  // Another section: POST-RECORD of DOC_SECCOES_DOCUMENTO. Cancelar stays.
  await editarTitulo('Cabeçalho alterado');
  await seccoesGrid(page).locator('tbody tr').filter({ hasText: 'Corpo (continuação)' }).locator('td').nth(1).click();
  await pergunta.getByRole('button', { name: 'Cancelar' }).click();
  await expect(seccoes(page).getByRole('region', { name: 'Alterações por guardar' })).toBeVisible();

  // Another tab asks too.
  await page.getByRole('tab', { name: 'Parâmetros' }).click();
  await pergunta.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByRole('tab', { name: 'Secções' })).toHaveAttribute('aria-selected', 'true');

  // Another model: POST-RECORD of the master. Não discards and moves. "Todos" = clear filters.
  await accao(page, 'Todos').click();
  await masterGrid(page).locator('tbody tr').filter({ hasText: 'MOD2' }).locator('td').nth(1).click();
  await expect(pergunta).toBeVisible();
  await pergunta.getByRole('button', { name: 'Não' }).click();
  await expect(page.getByRole('heading', { name: 'Modelo MOD2' })).toBeVisible();
  await expect(seccoes(page).getByRole('region', { name: 'Alterações por guardar' })).toBeHidden();
});

test('Parâmetros tab: the report parameters, and the history dialog of a parameter', async ({ page }) => {
  await abrirModelo(page, 'MOD1');
  await page.getByRole('tab', { name: 'Parâmetros' }).click();
  const grid = page.getByRole('grid', { name: 'Parâmetros' });
  await expect(grid).toContainText('P_PAIS');
  await grid.locator('tbody tr').filter({ hasText: 'P_PAIS' }).getByRole('button', { name: 'Histórico' }).click();
  const hist = dialog(page, 'Valor por Omissão');
  await expect(hist.getByRole('grid', { name: 'Valor por Omissão' })).toContainText('PT');
  await page.keyboard.press('Escape');
  await expect(hist).toBeHidden();
});
