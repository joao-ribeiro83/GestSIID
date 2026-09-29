import { expect, test, type Page } from '@playwright/test';

// Administração › Utilizadores (Step 4.3): FD_UTILIZADORES_SIID against the dev server's
// in-memory store (3 users), never Oracle (CLAUDE.md HARD RULE).

const grid = (page: Page) => page.getByRole('grid', { name: 'Utilizadores' });
const block = (page: Page) => page.getByRole('region', { name: 'Utilizadores', exact: true });
const footer = (page: Page) => block(page).locator('[aria-live="polite"]');
const panel = (page: Page) => page.getByRole('dialog');
const row = (page: Page, text: string) =>
  grid(page).getByRole('row').filter({ hasText: text }).first();

test.use({ storageState: 'e2e/.auth/adm.json' });

test.beforeEach(async ({ page }) => {
  await page.goto('/administracao/utilizadores');
  await expect(footer(page)).toHaveText(/^[1-9]\d* registos$/); // not the transient 0
});

async function novo(page: Page, values: Record<string, string>) {
  await block(page).getByRole('button', { name: 'Novo' }).click();
  for (const [label, text] of Object.entries(values))
    await panel(page).getByLabel(label, { exact: false }).fill(text);
}

test('the list never carries the password: the grid shows dots and the API sends no PASSWORD', async ({
  page,
}) => {
  const body = page.waitForResponse((r) => r.url().includes('/api/utilizadores') && r.ok());
  await page.reload();
  expect(await (await body).text()).not.toMatch(/password/i);

  await expect(row(page, 'ANA SILVA')).toContainText('••••••••');
  await expect(row(page, 'ANA SILVA')).toContainText('DEV'); // AMBIENTE_ID
  await expect(row(page, 'ANA SILVA')).toContainText('ADMINISTRADOR'); // domain label
});

test('creates a user: password masked, username and name upper-cased, environment forced', async ({
  page,
}) => {
  const before = Number((await footer(page).innerText()).split(' ')[0]);
  await novo(page, {
    Nome: 'bia costa',
    Username: 'bia.costa',
    Password: 's3gredo',
    'Data Início': '01-01-2026',
  });
  await expect(panel(page).getByLabel('Password')).toHaveAttribute('type', 'password');
  await expect(panel(page).getByLabel('Tipo Utilizador')).toHaveValue('ADM'); // initial value
  await expect(panel(page).getByLabel('Ambiente')).toHaveCount(0); // not editable, not on a new row
  await panel(page).getByRole('button', { name: 'Guardar' }).click();

  await expect(footer(page)).toHaveText(`${before + 1} registos`);
  await expect(row(page, 'BIA COSTA')).toContainText('BIA.COSTA');
  await expect(row(page, 'BIA COSTA')).toContainText('DEV');
});

test('shows the required-field messages, the date-order message and the duplicate-key message', async ({
  page,
}) => {
  await block(page).getByRole('button', { name: 'Novo' }).click();
  await panel(page).getByRole('button', { name: 'Guardar' }).click();
  // Nome, Username, Password, Data Início (type and unit start filled in).
  await expect(panel(page).getByText('Campo obrigatório.')).toHaveCount(4);

  await panel(page).getByLabel('Nome').fill('Rui Novo');
  await panel(page).getByLabel('Username').fill('rui.novo');
  await panel(page).getByLabel('Password').fill('x');
  await panel(page).getByLabel('Data Início').fill('01-06-2026');
  await panel(page).getByLabel('Data Fim').fill('01-05-2026');
  await panel(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(panel(page).getByText('A data de início é superior à data de fim.')).toBeVisible();

  await panel(page).getByLabel('Data Fim').fill('');
  await panel(page).getByLabel('Username').fill('ana.silva'); // already there
  await panel(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(panel(page).getByRole('alert')).toHaveText(
    'Já existe um registo com estes valores.',
  );
});

test('edits a user: name and username are read-only, a blank password keeps the current one', async ({
  page,
}) => {
  await row(page, 'RUI COSTA').locator('td').nth(2).dblclick();
  await expect(panel(page).getByLabel('Nome')).toHaveCount(0); // shown as text, UpdateAllowed=false
  await expect(panel(page).getByText('RUI COSTA')).toBeVisible();
  await expect(panel(page).getByLabel('Password')).toHaveValue('');
  await expect(panel(page).getByLabel('Password')).toHaveAttribute(
    'placeholder',
    'Em branco: manter a actual',
  );

  await panel(page).getByLabel('Data Fim').fill('31-12-2099');
  await panel(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(panel(page)).toBeHidden();
  await expect(row(page, 'RUI COSTA')).toContainText('31-12-2099');
});

test('a new password can be set on an existing user without ever being shown', async ({ page }) => {
  await row(page, 'ANA SILVA').locator('td').nth(2).dblclick();
  await panel(page).getByLabel('Password').fill('outra-password');
  await panel(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(panel(page)).toBeHidden();
  await expect(page.getByText('outra-password')).toHaveCount(0);
});

test('deletes a user', async ({ page }) => {
  await novo(page, {
    Nome: 'Apagar Me',
    Username: 'apagar.me',
    Password: 'x',
    'Data Início': '01-01-2026',
  });
  await panel(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(row(page, 'APAGAR ME')).toBeVisible();
  const before = Number((await footer(page).innerText()).split(' ')[0]);

  await row(page, 'APAGAR ME').locator('td').nth(2).click();
  await block(page).getByRole('button', { name: 'Apagar' }).click();
  await page
    .getByRole('region', { name: 'Alterações por guardar' })
    .getByRole('button', { name: 'Guardar' })
    .click();
  await expect(footer(page)).toHaveText(`${before - 1} registos`);
});
