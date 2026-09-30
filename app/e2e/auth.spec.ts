import { expect, test, type Page } from '@playwright/test';

// Step 3.2 "Done when": login (ADM full menu, USER hides admin-only), wrong password alert,
// Alterar password (three fields, wrong current value, mismatch), logout, deep-link redirect.
// Against the Oracle-less dev server's fake AuthRepo (apps/api/src/features/auth/dev-repo.ts):
// ADM = DEV/dev, USER = USER1/user1, regeneration password = segredo123.

async function login(page: Page, utilizador: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Utilizador').fill(utilizador);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

test('ADM login shows the full menu', async ({ page }) => {
  await login(page, 'DEV', 'dev');
  await expect(page).toHaveURL('/');
  const nav = page.getByRole('navigation', { name: 'Menu' });
  await expect(nav.getByText('Configuração')).toBeVisible();
  await expect(nav.getByText('Administração')).toBeVisible();
  await expect(nav.getByText('Gador')).toBeVisible();
});

// The USER session from global-setup.ts (which logs USER1 in through the same API): one UI login
// less, so this spec plus global-setup stay within the throttle's 5 logins/minute per IP.
test.describe('USER session', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('hides admin-only menu entries', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Menu' });
    // "Gestão" (Documentos' parent) is the only group a USER may see; its child starts collapsed
    // on '/', so this checks group headers rather than expanding it.
    await expect(nav.getByText('Gestão')).toBeVisible();
    await expect(nav.getByText('Configuração')).toHaveCount(0);
    await expect(nav.getByText('Administração')).toHaveCount(0);
    await expect(nav.getByText('Gador')).toHaveCount(0);
  });
});

test('wrong password shows the Portuguese alert', async ({ page }) => {
  await login(page, 'DEV', 'password-errada');
  await expect(page.getByText('Utilizador e/ou password inválidos.')).toBeVisible();
  await expect(page).toHaveURL('/login');
});

test('deep links redirect to /login when unauthenticated', async ({ page }) => {
  await page.goto('/gestao/documentos');
  await expect(page).toHaveURL('/login');
});

test('logout returns to /login', async ({ page }) => {
  // Its own real login, not the shared adm.json state: this test destroys the session
  // server-side, which would break every other test still relying on that saved cookie.
  await login(page, 'DEV', 'dev');
  await expect(page).toHaveURL('/');
  await page.getByText('Utilizador de administração (DEV)').click();
  await page.getByRole('menuitem', { name: 'Sair' }).click();
  await expect(page).toHaveURL('/login');
});

test.describe('already logged in (shared ADM session from global-setup.ts)', () => {
  test.use({ storageState: 'e2e/.auth/adm.json' });

  test('Alterar password: wrong current value, mismatch, then success', async ({ page }) => {
    await page.goto('/configuracao/alterar-password');
    const dialog = page.getByRole('dialog', { name: 'Alteração da Password de Regeração' });
    await expect(dialog).toBeVisible();

    // Wrong current value → field error on "Password actual".
    await dialog.getByLabel('Password actual').fill('password-errada');
    await dialog.getByLabel('Password', { exact: true }).fill('nova-password-1');
    await dialog.getByLabel('Confirmação').fill('nova-password-1');
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialog.getByText('A password inserida está errada.')).toBeVisible();

    // Mismatch → field error on "Confirmação".
    await dialog.getByLabel('Password actual').fill('segredo123');
    await dialog.getByLabel('Password', { exact: true }).fill('nova-password-1');
    await dialog.getByLabel('Confirmação').fill('outra-password');
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialog.getByText('As passwords não coincidem. Alteração não efectuada.')).toBeVisible();

    // Correct → success toast, dialog closes; change it straight back (repeat-safe run).
    await dialog.getByLabel('Password actual').fill('segredo123');
    await dialog.getByLabel('Password', { exact: true }).fill('nova-password-1');
    await dialog.getByLabel('Confirmação').fill('nova-password-1');
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Guardado.')).toBeVisible();
    await expect(page).toHaveURL('/');

    await page.goto('/configuracao/alterar-password');
    const dialog2 = page.getByRole('dialog', { name: 'Alteração da Password de Regeração' });
    await dialog2.getByLabel('Password actual').fill('nova-password-1');
    await dialog2.getByLabel('Password', { exact: true }).fill('segredo123');
    await dialog2.getByLabel('Confirmação').fill('segredo123');
    await dialog2.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Guardado.')).toBeVisible();
  });
});
