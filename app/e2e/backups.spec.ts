import { expect, test, type Page } from '@playwright/test';

// Gestão › Backups (Step 8.2): FD_NOVO_BACKUP and FD_BACKUPS_ONLINE against the dev server's
// in-memory backups (features/backups/memoria.ts) — never Oracle (CLAUDE.md HARD RULE).

test.use({ storageState: 'e2e/.auth/adm.json' });

const grid = (page: Page, name: string) => page.getByRole('grid', { name, exact: true });
const rows = (page: Page, name: string) => grid(page, name).locator('tbody tr');

/** Step 1 → 2 with the newest month that still has documents to save. */
async function passo2(page: Page): Promise<string> {
  await page.goto('/gestao/backups/novo');
  const mes = page.getByLabel('Mês');
  await expect(mes.locator('option')).not.toHaveCount(1);
  const valor = (await mes.locator('option').nth(1).getAttribute('value'))!;
  await mes.selectOption(valor);
  await page.getByRole('button', { name: 'Documentos' }).click();
  await expect(rows(page, 'Documentos a salvaguardar').first()).toBeVisible({ timeout: 20_000 });
  return valor;
}

test('step 1 needs the month (field error), step 2 checks media type (#49) and selection (#30)', async ({ page }) => {
  await page.goto('/gestao/backups/novo');
  await page.getByRole('button', { name: 'Documentos' }).click();
  await expect(page.getByRole('alert')).toHaveText("O campo 'Mês' é de preenchimento Obrigatorio.");

  await passo2(page);
  await page.getByRole('button', { name: 'Backup', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText("O campo 'Tipo Mídia' é de preenchimento Obrigatorio.");

  await page.getByLabel('Tipos Mídia').selectOption('DVD+R47G');
  await page.getByRole('button', { name: 'Backup', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Não existem documentos seleccionados.');
  await expect(page.getByText('Gbytes')).toBeVisible();
});

test('create a backup from a selection, then bring it online and offline again', async ({ page }) => {
  const mes = await passo2(page);
  await page.getByLabel('Tipos Mídia').selectOption('DVD+R47G');

  // Selection: the running total follows the ticked rows.
  await expect(page.getByText('Total Backup').locator('xpath=following-sibling::dd')).toHaveText('0');
  await rows(page, 'Documentos a salvaguardar').first().getByRole('checkbox', { name: 'Seleccionar registo' }).click();
  await expect(page.getByText('Total Backup').locator('xpath=following-sibling::dd')).not.toHaveText('0');

  await page.getByRole('button', { name: 'Backup', exact: true }).click();
  const confirmar = page.getByRole('dialog', { name: new RegExp(`^Criar o backup de ${mes} com 1 documentos`) });
  await expect(confirmar).toBeVisible();
  await confirmar.getByRole('button', { name: 'OK' }).click();

  const nome = `COSEC_${mes.replace('-', '')}_ 01`;
  await expect(page.getByText(`Backup ${nome} criado.`)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Documentos' })).toBeVisible(); // wizard back at step 1

  // Backups Online: the new backup is offline; online moves it to the other list.
  await page.goto('/gestao/backups/online');
  const offline = rows(page, 'Offline').filter({ hasText: nome });
  await expect(offline).toHaveCount(1);
  await page.getByRole('button', { name: 'Colocar online' }).click();
  await expect(page.getByText('Não existem backups seleccionados.')).toBeVisible();

  await offline.getByRole('checkbox', { name: 'Seleccionar registo' }).click();
  await page.getByRole('button', { name: 'Colocar online' }).click();
  await expect(page.getByText('Backups actualizados.')).toBeVisible();
  await expect(offline).toHaveCount(0);
  const online = rows(page, 'Online').filter({ hasText: nome });
  await expect(online).toHaveCount(1);
  await expect(online).toContainText('E:\\');

  await online.getByRole('checkbox', { name: 'Seleccionar registo' }).click();
  await page.getByRole('button', { name: 'Colocar offline' }).click();
  await expect(online).toHaveCount(0);
  await expect(offline).toHaveCount(1);
});
