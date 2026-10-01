import { expect, test, type Page } from '@playwright/test';

// Configuração › Permissões (MASTER_PLAN Step 5.4): FD_PERMISSOES_SIID against the dev server's
// in-memory repo, never Oracle (CLAUDE.md HARD RULE). The dev server may be reused between runs,
// so every test works on its own scope (a random far-future date, or its own Permissão type) and
// asserts relative counts, never a fixed total.

test.use({ storageState: 'e2e/.auth/adm.json' });

const block = (page: Page) => page.getByRole('region', { name: 'Permissões', exact: true });
const grid = (page: Page) => page.getByRole('grid', { name: 'Permissões' });
const footer = (page: Page) => block(page).locator('[aria-live="polite"]').first();
const total = async (page: Page) => {
  // While the grid loads, the footer already reads "0 registos": wait for the data.
  const table = block(page).locator('table[role="grid"]'); // CSS: still found while a dialog is open
  await expect(table).toBeVisible();
  await expect(table).not.toHaveAttribute('aria-busy', 'true');
  return Number(/(\d+)/.exec((await footer(page).textContent()) ?? '')?.[1] ?? '0');
};

const rand = (n: number) => Math.floor(Math.random() * n);
const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${pad(d.getUTCDate())}-${pad(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
/** Days no other run is likely to use (2150–2199, DD-MM-AAAA): a day, 5 days later, 6 days later. */
function diasUnicos(): [string, string, string] {
  const d = new Date(Date.UTC(2150 + rand(50), rand(12), 1 + rand(20)));
  const mais = (n: number) => fmt(new Date(d.getTime() + n * 86_400_000));
  return [fmt(d), mais(5), mais(6)];
}
const diaUnico = () => diasUnicos()[0];

test.beforeEach(async ({ page }) => {
  await page.goto('/configuracao/permissoes');
  await expect(footer(page)).toBeVisible();
});

async function todos(page: Page) {
  const b = block(page).getByRole('button', { name: 'Todos' });
  if ((await b.getAttribute('aria-pressed')) !== 'true') await b.click();
  await expect(b).toHaveAttribute('aria-pressed', 'true');
}

async function filtrarInicio(page: Page, dia: string) {
  const f = page.getByRole('textbox', { name: 'Filtro Início Validade' });
  await f.fill(dia);
  await f.press('Enter');
}

async function escolherModelo(page: Page, dialog: ReturnType<Page['getByRole']>, campo: string, id: string) {
  await dialog.getByRole('button', { name: `${campo}: Escolher…`, exact: true }).click();
  await page.getByRole('dialog', { name: 'Modelos' }).getByRole('option', { name: id, exact: true }).click();
}

async function escolherUtilizador(page: Page, dialog: ReturnType<Page['getByRole']>, campo: string, user: string) {
  await dialog.getByRole('button', { name: `${campo}: Escolher…`, exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Utilizadores' })
    .getByRole('option', { name: new RegExp(`^${user}`) })
    .click();
}

/** Adicionar Permissão through the dialog; returns once the dialog closed. */
async function novaPermissao(page: Page, v: { modelo: string; user: string; tipo: string; ini: string; fim: string }) {
  await block(page).getByRole('button', { name: 'Adicionar Permissão' }).click();
  const dlg = page.getByRole('dialog', { name: 'Adicionar Permissão' });
  await escolherModelo(page, dlg, 'Modelo', v.modelo);
  await escolherUtilizador(page, dlg, 'Utilizador', v.user);
  await dlg.getByRole('combobox', { name: 'Tipo Permissão' }).selectOption({ label: v.tipo });
  await dlg.getByRole('textbox', { name: 'Início Validade' }).fill(v.ini);
  await dlg.getByRole('textbox', { name: 'Fim Validade' }).fill(v.fim);
  await dlg.getByRole('button', { name: 'OK' }).click();
  return dlg;
}

// ── Geral ──────────────────────────────────────────────────────────────────────────────────

test('Geral: valid rows by default, Todos shows every row, ten sortable headers', async ({ page }) => {
  await expect(page.getByRole('tab', { name: 'Geral' })).toHaveAttribute('aria-selected', 'true');
  const todosBtn = block(page).getByRole('button', { name: 'Todos' });
  await expect(todosBtn).toHaveAttribute('aria-pressed', 'false');
  const validas = await total(page);

  await todosBtn.click();
  await expect(todosBtn).toHaveAttribute('aria-pressed', 'true');
  // The seed has an expired MOD2/USER2 row, so "Todos" always has more.
  await expect.poll(() => total(page)).toBeGreaterThan(validas);

  const sortable = grid(page).getByRole('columnheader').filter({ has: page.getByRole('button') });
  await expect(sortable).toHaveCount(10);
  const modelo = grid(page).getByRole('columnheader', { name: 'Modelo', exact: true });
  await modelo.getByRole('button').click();
  await expect(modelo).toHaveAttribute('aria-sort', 'ascending');
});

test('Adicionar Permissão: required fields, success, and overlap refused', async ({ page }) => {
  await block(page).getByRole('button', { name: 'Adicionar Permissão' }).click();
  const dlg = page.getByRole('dialog', { name: 'Adicionar Permissão' });
  await dlg.getByRole('button', { name: 'OK' }).click();
  await expect(dlg.getByRole('alert')).toHaveText('Todos os campos são obrigatórios, excepto a data de fim.');
  await dlg.getByRole('button', { name: 'Cancelar' }).click();
  await expect(dlg).toBeHidden();

  const dia = diaUnico();
  const v = { modelo: 'MOD4', user: 'USER2', tipo: 'ENVIAR POR MAIL', ini: dia, fim: dia };
  await novaPermissao(page, v);
  await expect(dlg).toBeHidden();
  await expect(page.getByText('Guardado.').first()).toBeVisible();

  await todos(page);
  await filtrarInicio(page, dia);
  const row = grid(page).getByRole('row').filter({ hasText: dia });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('MOD4');
  await expect(row).toContainText('USER2');
  await expect(row).toContainText('ENVIAR POR MAIL');

  await novaPermissao(page, v);
  await expect(dlg.getByRole('alert')).toHaveText('ERRO: Permissão já existe válida para o intervalo definido!!');
  await expect(dlg.getByLabel('Depart.', { exact: true })).toHaveText('DSI');
});

test('Alterar Validade: read-only key, new end date, empty start and overlap refused', async ({ page }) => {
  const [d1, d2, d3] = diasUnicos();
  const base = { modelo: 'MOD3', user: 'USER1', tipo: 'IMPRIMIR PDF' };
  await novaPermissao(page, { ...base, ini: d1, fim: d1 });
  await expect(page.getByRole('dialog', { name: 'Adicionar Permissão' })).toBeHidden();
  await novaPermissao(page, { ...base, ini: d2, fim: d2 });
  await expect(page.getByRole('dialog', { name: 'Adicionar Permissão' })).toBeHidden();

  await todos(page);
  await filtrarInicio(page, d2);
  await grid(page).getByRole('row').filter({ hasText: d2 }).click();
  await block(page).getByRole('button', { name: 'Alterar Validade' }).click();
  const dlg = page.getByRole('dialog', { name: 'Alterar Validade' });
  await expect(dlg.getByLabel('Modelo')).toHaveText('MOD3');
  await expect(dlg.getByLabel('Utilizador')).toHaveText('USER1');
  await expect(dlg.getByRole('textbox', { name: 'Início Validade' })).toHaveValue(d2);

  await dlg.getByRole('textbox', { name: 'Início Validade' }).fill('');
  await dlg.getByRole('button', { name: 'OK' }).click();
  await expect(dlg.getByRole('alert')).toHaveText("O Campo 'Data de Início' é de preenchimento obrigatório.");

  await dlg.getByRole('textbox', { name: 'Início Validade' }).fill(d1);
  await dlg.getByRole('button', { name: 'OK' }).click();
  await expect(dlg.getByRole('alert')).toHaveText(
    'ERRO: O intervalo de datas sobrepõe-se a uma permissão já existente!',
  );

  await dlg.getByRole('textbox', { name: 'Início Validade' }).fill(d2);
  await dlg.getByRole('textbox', { name: 'Fim Validade' }).fill(d3);
  await dlg.getByRole('button', { name: 'OK' }).click();
  await expect(dlg).toBeHidden();
  await expect(grid(page).getByRole('row').filter({ hasText: d2 })).toContainText(d3);
});

test('Retirar Permissão: confirm #36, the row ends on 01-01-1980', async ({ page }) => {
  const dia = diaUnico();
  await novaPermissao(page, { modelo: 'MOD2', user: 'USER4', tipo: 'GERAR DOCUMENTO', ini: dia, fim: dia });
  await expect(page.getByRole('dialog', { name: 'Adicionar Permissão' })).toBeHidden();

  await todos(page);
  await filtrarInicio(page, dia);
  const row = grid(page).getByRole('row').filter({ hasText: dia });
  await row.click();
  await block(page).getByRole('button', { name: 'Retirar Permissão' }).click();
  const confirm = page.getByRole('dialog', {
    name: 'Deseja anular a permissão do utilizador USER4 para o documento MOD2?',
  });
  await confirm.getByRole('button', { name: 'Sim' }).click();
  await expect(row).toContainText('01-01-1980');
});

test('Copiar do modelo: MOD1 permissions land on MOD4', async ({ page }) => {
  await block(page).getByRole('button', { name: 'Copiar do modelo...' }).click();
  const dlg = page.getByRole('dialog', { name: 'Copiar do modelo...' });
  await expect(dlg.getByRole('button', { name: 'OK' })).toBeDisabled();
  await escolherModelo(page, dlg, 'Modelo', 'MOD4');
  await escolherModelo(page, dlg, 'Copiar do modelo', 'MOD1');
  await dlg.getByRole('button', { name: 'OK' }).click();
  await expect(dlg).toBeHidden();

  const f = page.getByRole('textbox', { name: 'Filtro Modelo' });
  await f.fill('MOD4');
  await f.press('Enter');
  // MOD1 is valid for USER1 with VISUALIZAR in the seed.
  await expect(grid(page).getByRole('row').filter({ hasText: 'USER1' }).filter({ hasText: 'VISUALIZAR' })).not.toHaveCount(0);
});

test('Copiar do utilizador: USER1 permissions land on USER3', async ({ page }) => {
  await block(page).getByRole('button', { name: 'Copiar do utilizador...' }).click();
  const dlg = page.getByRole('dialog', { name: 'Copiar do utilizador...' });
  await escolherUtilizador(page, dlg, 'Utilizador', 'USER3');
  await expect(dlg.getByLabel('Depart.', { exact: true })).toHaveText('DFI');
  await escolherUtilizador(page, dlg, 'Copiar do utilizador', 'USER1');
  await dlg.getByRole('button', { name: 'OK' }).click();
  await expect(dlg).toBeHidden();

  const f = page.getByRole('textbox', { name: 'Filtro Utilizador' });
  await f.fill('USER3');
  await f.press('Enter');
  // USER1 holds MOD2 (IMPRIMIR DOCUMENTO) in the seed; USER3 did not.
  await expect(grid(page).getByRole('row').filter({ hasText: 'MOD2' })).not.toHaveCount(0);
});

// ── Utilizador / Modelos panels ────────────────────────────────────────────────────────────

const lista = (page: Page, nome: 'Sem Permissão' | 'Com Permissão') => page.getByRole('listbox', { name: nome });
const contagem = (page: Page, nome: 'Sem Permissão' | 'Com Permissão') =>
  page.getByRole('region', { name: nome }).locator('[aria-live="polite"]');
const botao = (page: Page, nome: string) => page.getByRole('button', { name: nome, exact: true });

async function limparCom(page: Page) {
  const retirarTodos = botao(page, 'Retirar todos');
  if (await retirarTodos.isEnabled()) {
    await retirarTodos.click();
    await page.getByRole('dialog').getByRole('button', { name: 'Sim' }).click();
  }
  await expect(contagem(page, 'Com Permissão')).toHaveText('0 registos');
}

test('Utilizador: buttons wait for the three controls; add/remove one, all, by mouse and keyboard', async ({ page }) => {
  await page.getByRole('tab', { name: 'Utilizador' }).click();
  await page.getByRole('combobox', { name: 'Departamento' }).selectOption({ label: 'DFI' });
  await expect(botao(page, 'Adicionar todos')).toBeDisabled();

  await page.getByRole('button', { name: 'Utilizador: Escolher…' }).click();
  const picker = page.getByRole('dialog', { name: 'Utilizadores' });
  await expect(picker.getByRole('option', { name: /^USER1/ })).toHaveCount(0); // DSI, filtered out
  await picker.getByRole('option', { name: /^USER4/ }).click();
  await expect(botao(page, 'Adicionar todos')).toBeDisabled();
  await page.getByRole('combobox', { name: 'Permissão' }).selectOption({ label: 'IMPRIMIR PDF' });

  await limparCom(page);
  await expect(contagem(page, 'Sem Permissão')).toHaveText('4 registos'); // MOD1–MOD4; MOD46 never

  // Keyboard: first row is active, Space selects it, Enter moves it.
  const sem = lista(page, 'Sem Permissão');
  await expect(botao(page, 'Adicionar todos')).toBeEnabled(); // lists reloaded, keys are the server's
  await sem.focus();
  await page.keyboard.press('Space');
  await expect(sem.getByRole('option', { name: 'MOD1' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(contagem(page, 'Com Permissão')).toHaveText('1 registo');
  await expect(lista(page, 'Com Permissão').getByRole('option').first()).toContainText('31-12-2200');

  await sem.getByRole('option', { name: 'MOD3' }).click();
  await botao(page, 'Adicionar seleccionados').click();
  await expect(contagem(page, 'Com Permissão')).toHaveText('2 registos');

  await botao(page, 'Adicionar todos').click();
  await expect(contagem(page, 'Sem Permissão')).toHaveText('0 registos');
  await expect(sem).toContainText('Não existem registos.');
  await expect(contagem(page, 'Com Permissão')).toHaveText('4 registos');

  await lista(page, 'Com Permissão').getByRole('option', { name: /MOD2/ }).click();
  await botao(page, 'Retirar seleccionados').click();
  await expect(contagem(page, 'Com Permissão')).toHaveText('3 registos');
  await expect(sem.getByRole('option', { name: 'MOD2' })).toBeVisible();

  await botao(page, 'Retirar todos').click();
  await page.getByRole('dialog', { name: 'Retirar as 3 permissões?' }).getByRole('button', { name: 'Sim' }).click();
  await expect(contagem(page, 'Com Permissão')).toHaveText('0 registos');
  await expect(contagem(page, 'Sem Permissão')).toHaveText('4 registos');
});

test('Modelos: the mirror panel moves users in and out', async ({ page }) => {
  await page.getByRole('tab', { name: 'Modelos' }).click();
  await page.getByRole('combobox', { name: 'Departamento' }).selectOption({ label: 'DFI' });
  await page.getByRole('button', { name: 'Modelo: Escolher…' }).click();
  await page.getByRole('dialog', { name: 'Modelos' }).getByRole('option', { name: 'MOD2', exact: true }).click();
  await page.getByRole('combobox', { name: 'Permissão' }).selectOption({ label: 'GUARDAR PDF' });

  await limparCom(page);
  await expect(contagem(page, 'Sem Permissão')).toHaveText('2 registos'); // USER3, USER4 (DFI)
  await lista(page, 'Sem Permissão').getByRole('option', { name: 'USER3' }).click();
  await botao(page, 'Adicionar seleccionados').click();
  await expect(lista(page, 'Com Permissão').getByRole('option', { name: /USER3/ })).toBeVisible();
  await expect(contagem(page, 'Sem Permissão')).toHaveText('1 registo');

  const com = lista(page, 'Com Permissão');
  await expect(botao(page, 'Retirar todos')).toBeEnabled();
  await com.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
  await expect(contagem(page, 'Com Permissão')).toHaveText('0 registos');
  await expect(contagem(page, 'Sem Permissão')).toHaveText('2 registos');
});

test('a refused transfer is shown at once and rolled back', async ({ page }) => {
  await page.getByRole('tab', { name: 'Utilizador' }).click();
  await page.getByRole('combobox', { name: 'Departamento' }).selectOption({ label: 'DSI' });
  await page.getByRole('button', { name: 'Utilizador: Escolher…' }).click();
  await page.getByRole('dialog', { name: 'Utilizadores' }).getByRole('option', { name: /^USER2/ }).click();
  await page.getByRole('combobox', { name: 'Permissão' }).selectOption({ label: 'GUARDAR 2ªs Vias' });
  await expect(contagem(page, 'Sem Permissão')).not.toHaveText('0 registos');
  const antes = await contagem(page, 'Sem Permissão').textContent();

  let solta!: () => void;
  const porta = new Promise<void>((r) => (solta = r));
  await page.route('**/api/permissoes/por-utilizador/USER2/add-all', async (route) => {
    await porta;
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'ERRO', message: 'Erro', requestId: 'e2e' }),
    });
  });

  await botao(page, 'Adicionar todos').click();
  await expect(contagem(page, 'Sem Permissão')).toHaveText('0 registos'); // optimistic
  solta();
  await expect(contagem(page, 'Sem Permissão')).toHaveText(antes ?? '');
  await expect(contagem(page, 'Com Permissão')).toHaveText('0 registos');
});
