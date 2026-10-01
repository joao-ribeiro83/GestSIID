import { expect, test, type Page } from '@playwright/test';

// Gestão › Documentos (Step 7.3): FD_GESTAO_SIID against the dev server's in-memory documents
// (features/dev/documentosSeed.ts), never Oracle (CLAUDE.md HARD RULE). Seed facts used here:
// lote 9 = documents 33..36, where 33 (DISPONIBILIDADE ANU) and 34 (ATRIBUTO9 'A') are annulled;
// lote 10 = documents 37..40, 37 is a plain ONLINE document; 41 carries attachments 42 and 43.

const grid = (page: Page) => page.getByRole('grid', { name: 'Documentos' });
const row = (page: Page, id: number) =>
  grid(page).locator('tbody tr').filter({ has: page.getByRole('gridcell', { name: String(id), exact: true }) });
const dialog = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });
const toolbar = (page: Page) => page.getByRole('toolbar', { name: 'Acções sobre os documentos' });

/** Filters the list by Lote with Enter (the Forms Execute Query). */
async function lote(page: Page, n: number) {
  const filtro = grid(page).getByLabel('Filtro Lote');
  await filtro.fill(String(n));
  await filtro.press('Enter');
  await expect(grid(page).locator('tbody tr')).toHaveCount(4);
}

const tick = (page: Page, id: number) => row(page, id).getByRole('checkbox', { name: 'Seleccionar registo' }).click();

/** D-34: a row's tabs live on its own page, opened by the row button; Voltar returns. */
async function abrir(page: Page, id: number) {
  await row(page, id).getByRole('button', { name: 'Abrir detalhe do documento' }).click();
  await expect(page).toHaveURL(new RegExp(`/gestao/documentos/${id}(\\?|$)`));
  await expect(page.getByRole('heading', { name: `Documento ${id}` })).toBeVisible();
}
const voltar = (page: Page) => page.getByRole('button', { name: 'Voltar' }).click();

test.describe('ADM', () => {
  test.use({ storageState: 'e2e/.auth/adm.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/gestao/documentos');
    await expect(grid(page).locator('tbody tr').first()).toBeVisible({ timeout: 20_000 }); // cold browser
  });

  test('select → Reimprimir: annulled document skipped and listed; the other gets a print request', async ({ page }) => {
    await lote(page, 9);
    // POST-QUERY colours: both annulled documents are red.
    await expect(row(page, 33)).toHaveAttribute('data-tone', 'anulado');
    await expect(row(page, 34)).toHaveAttribute('data-tone', 'anulado');
    await expect(row(page, 35)).not.toHaveAttribute('data-tone', /.+/);

    await tick(page, 33);
    await tick(page, 35);
    await expect(page.getByText('· 2 seleccionado(s)')).toBeVisible();

    await toolbar(page).getByRole('button', { name: 'Reimprimir', exact: true }).click();
    const pergunta = dialog(page, 'Deseja imprimir os documentos selecionados?');
    await pergunta.getByRole('button', { name: 'Sim' }).click();

    const reimprimir = dialog(page, 'Reimprimir');
    await expect(reimprimir.getByLabel('Imprimir documentos para a impressora associada')).toBeChecked();
    await reimprimir.getByRole('button', { name: 'OK' }).click();

    // Result summary (#9): 35 processed, 33 skipped with the form's message.
    const resultado = dialog(page, 'Reimprimir');
    await expect(resultado).toContainText('1 documento(s) processado(s).');
    const grupo = resultado.getByRole('region', {
      name: 'Não foram impressos os documentos com os seguintes spool_id, por se encontrarem anulados:',
    });
    await expect(grupo).toContainText('33');
    await resultado.getByRole('button', { name: 'OK' }).click();
    await expect(resultado).toBeHidden();

    // Selection cleared; the new request is in 35's queue (Detalhes tab).
    await expect(row(page, 35).getByRole('checkbox')).not.toBeChecked();
    await abrir(page, 35);
    await page.getByRole('tab', { name: 'Detalhes' }).click();
    const fila = page.getByRole('table', { name: 'Detalhes' });
    await expect(fila.locator('tr').filter({ hasText: 'IMPRESSAO' }).filter({ hasText: 'ESPERA' }).first()).toBeVisible();
  });

  test('select (Space) → Anular: the document turns annulled and its queue shows ANULADO', async ({ page }) => {
    await lote(page, 10);
    await row(page, 37).getByRole('gridcell', { name: '37', exact: true }).click();
    await page.keyboard.press(' ');
    await expect(row(page, 37)).toHaveAttribute('aria-selected', 'true');

    await toolbar(page).getByRole('button', { name: 'Anular', exact: true }).click();
    await dialog(page, 'Deseja anular os documentos selecionados?').getByRole('button', { name: 'Sim' }).click();
    await expect(page.getByText('Anular: 1 documento(s) processado(s).')).toBeVisible();

    await expect(row(page, 37)).toHaveAttribute('data-tone', 'anulado');
    await abrir(page, 37);
    await page.getByRole('tab', { name: 'Detalhes' }).click();
    await expect(page.getByRole('table', { name: 'Detalhes' })).toContainText('ANULADO');
  });

  test('keyboard: Ctrl+A selects the whole query; nothing selected → #30', async ({ page }) => {
    await toolbar(page).getByRole('button', { name: 'Regerar', exact: true }).click();
    await expect(page.getByText('Não existem documentos seleccionados.')).toBeVisible();

    await lote(page, 2);
    await row(page, 5).getByRole('gridcell', { name: '5', exact: true }).click();
    await page.keyboard.press('Control+a');
    await expect(page.getByText('Todos os 4 registos da consulta estão seleccionados.')).toBeVisible();
  });

  test('context menu GENERICO: Mostrar Grupo adds the group chip; the ADM menu has Clonar', async ({ page }) => {
    const filtro = grid(page).getByLabel('Filtro Id');
    await filtro.fill('41');
    await filtro.press('Enter');
    await row(page, 41).getByRole('gridcell', { name: '41', exact: true }).click({ button: 'right' });
    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitem')).toHaveText([
      'Detalhes', 'Parâmetros', 'Comentários', 'Log', 'Mais Informação',
      'Mostrar Grupo', 'Mostrar Documento', 'Clonar', 'Procurar por parâmetros',
    ]);
    await menu.getByRole('menuitem', { name: 'Mostrar Grupo' }).click();
    await expect(page.getByText('Grupo do documento 41')).toBeVisible();
    await page.getByRole('button', { name: 'Limpar filtros' }).click();
    // Attachments 42 and 43 travel with 41.
    await expect(row(page, 42)).toBeVisible();
    await expect(row(page, 43)).toBeVisible();
  });

  test('Comentários: Guardar adds the comment (BR-DOC-30), the ✎ marker appears, blank text cannot be saved', async ({ page }) => {
    await lote(page, 10);
    await expect(row(page, 38).getByRole('button', { name: 'Comentários' })).toHaveCount(0);
    await abrir(page, 38);
    await page.getByRole('tab', { name: 'Comentários' }).click();

    const texto = page.getByRole('textbox', { name: 'Comentário' });
    const guardar = page.getByRole('button', { name: 'Guardar' });
    await expect(guardar).toBeDisabled();
    await texto.fill('   ');
    await expect(guardar).toBeDisabled();

    await texto.fill('Morada confirmada por telefone');
    await guardar.click();
    await expect(page.getByText('Guardado.')).toBeVisible();
    await expect(texto).toHaveValue('');
    const tabela = page.getByRole('table', { name: 'Comentários' });
    await expect(tabela.getByRole('row').filter({ hasText: 'Morada confirmada por telefone' })).toHaveCount(1);
    // Back on the list (its Lote filter kept), the ✎ marker opens the Comentários tab.
    await voltar(page);
    await expect(grid(page).locator('tbody tr')).toHaveCount(4);
    await row(page, 38).getByRole('button', { name: 'Comentários' }).click();
    await expect(page.getByRole('tab', { name: 'Comentários' })).toHaveAttribute('aria-selected', 'true');
  });

  test('Anexos: Spool Id / Modelo / Estado / Data do pedido; double-click opens the document group', async ({ page }) => {
    const filtro = grid(page).getByLabel('Filtro Id');
    await filtro.fill('41');
    await filtro.press('Enter');
    await abrir(page, 41);
    await page.getByRole('tab', { name: 'Anexos' }).click();
    const tabela = page.getByRole('table', { name: 'Anexos' });
    await expect(tabela.getByRole('columnheader')).toHaveText(['Spool Id', 'Modelo', 'Estado', 'Data do pedido']);
    await expect(tabela.locator('tbody tr')).toHaveCount(2);
    await tabela.locator('tbody tr').filter({ hasText: '42' }).dblclick();
    await expect(page.getByText('Grupo do documento 42')).toBeVisible();
  });
});

test.describe('USER', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('no action toolbar, sort by Spool Id only, no Clonar', async ({ page }) => {
    await page.goto('/gestao/documentos');
    await expect(grid(page).locator('tbody tr').first()).toBeVisible({ timeout: 20_000 });

    await expect(page.getByRole('group', { name: 'Filtros' }).getByRole('button')).toHaveCount(6);
    await expect(page.getByRole('button', { name: 'Procurar por parâmetros' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Actualizar' })).toBeVisible();
    await expect(toolbar(page)).toHaveCount(0);
    for (const b of ['Regerar', 'Reimprimir', '2ª Via', 'Cópia', 'Reenviar', 'Anular', 'Suspender', 'Retomar', 'Clonar'])
      await expect(page.getByRole('button', { name: b, exact: true })).toHaveCount(0);

    // D-08: only the Spool Id header sorts.
    const cabecalho = grid(page).locator('thead');
    await expect(cabecalho.getByRole('button', { name: 'Id', exact: true })).toBeVisible();
    await expect(cabecalho.getByRole('button', { name: 'Modelo', exact: true })).toHaveCount(0);

    await grid(page).locator('tbody tr').first().locator('td').nth(3).click({ button: 'right' });
    await expect(page.getByRole('menuitem', { name: 'Mostrar Grupo' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Clonar' })).toHaveCount(0);
  });

  test('Comentários is read-only for USER: the grid, no Comentário box, no Guardar (D-08)', async ({ page }) => {
    await page.goto('/gestao/documentos');
    await expect(grid(page).locator('tbody tr').first()).toBeVisible({ timeout: 20_000 });
    await grid(page).locator('tbody tr').first().getByRole('button', { name: 'Abrir detalhe do documento' }).click();
    await page.getByRole('tab', { name: 'Comentários' }).click();
    await expect(page.getByRole('tabpanel', { name: 'Comentários' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Comentário' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Guardar' })).toHaveCount(0);
  });
});
