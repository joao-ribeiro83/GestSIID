import { expect, test, type Page } from '@playwright/test';

// Smoke test of the DataBlock on /dev/datablock (in-memory demo API, no Oracle):
// query by example, sort, paging, selection, inline edit + Guardar, the #46 guard,
// client validation, master/detail and the body keyboard map (UI_SPEC §3).

const grid = (page: Page, name = 'Impressoras') => page.getByRole('grid', { name });
const block = (page: Page, name = 'Impressoras') => page.getByRole('region', { name, exact: true });
const footer = (page: Page, name?: string) => block(page, name).locator('[aria-live="polite"]');
const nameCells = (page: Page) => grid(page).locator('tbody tr td:nth-child(4)');

test.beforeEach(async ({ page }) => {
  await page.goto('/dev/datablock');
  await expect(footer(page)).toHaveText('137 registos');
});

test('filters, sorts and pages on the server', async ({ page }) => {
  const nome = page.getByRole('textbox', { name: 'Filtro Nome' });
  await nome.fill('hp%');
  await expect(footer(page)).toHaveText('Filtros alterados. Prima Enter para consultar.');
  await nome.press('Enter');
  await expect(footer(page)).toHaveText('19 registos');
  for (const text of await nameCells(page).allTextContents()) expect(text).toMatch(/^HP /);

  // Invalid number: cell error, nothing sent.
  const id = page.getByRole('textbox', { name: 'Filtro Id' });
  await id.fill('4x');
  await id.press('Enter');
  await expect(id).toHaveAttribute('aria-invalid', 'true');
  await id.press('Escape');
  await block(page).getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(footer(page)).toHaveText('137 registos');

  // Sort by Id descending (click twice), check the first row and aria-sort.
  const idHeader = grid(page).getByRole('columnheader', { name: 'Id' });
  await idHeader.getByRole('button').click();
  await expect(idHeader).toHaveAttribute('aria-sort', 'ascending');
  await idHeader.getByRole('button').click();
  await expect(idHeader).toHaveAttribute('aria-sort', 'descending');
  await expect(grid(page).locator('tbody tr').first().locator('td').nth(2)).toHaveText('137');

  await block(page).getByRole('button', { name: 'Página seguinte' }).click();
  await expect(block(page).getByRole('textbox', { name: 'Página' })).toHaveValue('2');
  await expect(grid(page).locator('tbody tr').first().locator('td').nth(2)).toHaveText('87');
});

test('inline edit, Guardar, and the "Deseja gravar" guard', async ({ page }) => {
  const firstName = nameCells(page).first();
  const before = (await firstName.textContent()) ?? '';

  // Edit + leave the page of results → #46 → Cancelar keeps the edit.
  await firstName.dblclick();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('Alterada pelo teste');
  await page.keyboard.press('Enter');
  const bar = page.getByRole('region', { name: 'Alterações por guardar' });
  await expect(bar).toContainText('1 alterado');
  await block(page).getByRole('button', { name: 'Página seguinte' }).click();
  const dialog = page.getByRole('dialog', { name: 'Deseja gravar as alterações efectuadas?' });
  await dialog.getByRole('button', { name: 'Cancelar' }).click();
  await expect(block(page).getByRole('textbox', { name: 'Página' })).toHaveValue('1');
  await expect(bar).toBeVisible();

  // Não discards.
  await block(page).getByRole('button', { name: 'Página seguinte' }).click();
  await dialog.getByRole('button', { name: 'Não' }).click();
  await expect(bar).toBeHidden();
  await block(page).getByRole('button', { name: 'Página anterior' }).click();
  await expect(nameCells(page).first()).toHaveText(before);

  // Edit again and save with Ctrl+S: the server stamps ACTUALIZADO_POR.
  await nameCells(page).first().dblclick();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('Guardada pelo teste');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ControlOrMeta+s');
  await expect(page.getByText('Guardado.')).toBeVisible();
  await expect(bar).toBeHidden();
  const saved = grid(page).getByRole('row').filter({ hasText: 'Guardada pelo teste' }).first();
  await expect(saved).toContainText('DEV');
});

test('new row: client validation stops the save; Esc removes the row', async ({ page }) => {
  await block(page).getByRole('button', { name: 'Novo' }).first().click();
  const bar = page.getByRole('region', { name: 'Alterações por guardar' });
  await expect(bar).toContainText('1 novo');
  await bar.getByRole('button', { name: 'Guardar' }).click();
  await expect(bar).toContainText('Erro no registo 1: Nome: Campo obrigatório.');
  await grid(page).locator('tbody tr').first().locator('td').nth(3).click();
  await page.keyboard.press('Escape');
  await expect(bar).toBeHidden();
});

test('selection: ticks, select-all (whole query), clear', async ({ page }) => {
  const rows = grid(page).locator('tbody tr');
  await rows.nth(0).getByRole('checkbox', { name: 'Seleccionar registo' }).click();
  await rows
    .nth(2)
    .getByRole('checkbox', { name: 'Seleccionar registo' })
    .click({ modifiers: ['Shift'] });
  await expect(footer(page)).toHaveText('137 registos · 3 seleccionado(s)');
  await grid(page).getByRole('checkbox', { name: 'Seleccionar todos' }).click();
  await expect(block(page)).toContainText('Todos os 137 registos da consulta estão seleccionados.');
  await expect(page.getByTestId('selection-summary')).toHaveText('Selecção: toda a consulta');
  await block(page).getByRole('button', { name: 'Limpar selecção' }).click();
  await expect(page.getByTestId('selection-summary')).toHaveText('Sem selecção');
});

test('master/detail and the keyboard map', async ({ page }) => {
  await expect(block(page, 'Tabuleiros')).toContainText('Seleccione um registo.');
  await nameCells(page).first().click();
  await expect(footer(page)).toHaveText('Registo 1 de 137');
  await expect(footer(page, 'Tabuleiros')).toHaveText(/\d+ registos?/);

  // ArrowDown moves the current row (and the detail follows); Home/End move across cells.
  await page.keyboard.press('ArrowDown');
  await expect(footer(page)).toHaveText('Registo 2 de 137');
  await page.keyboard.press('End');
  await expect(page.locator(':focus')).toHaveAttribute('data-cell', /:7$/);
  await page.keyboard.press('Home');
  await expect(page.locator(':focus')).toHaveAttribute('data-cell', /:0$/);
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('textbox', { name: 'Filtro Id' })).toBeFocused();

  // Dirty detail + move the master → #46.
  const detailName = grid(page, 'Tabuleiros').locator('tbody tr').first().locator('td').nth(3);
  await detailName.dblclick();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('Tabuleiro editado');
  await page.keyboard.press('Enter');
  await nameCells(page).nth(3).click();
  const dialog = page.getByRole('dialog', { name: 'Deseja gravar as alterações efectuadas?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Não' }).click();
  await expect(footer(page)).toHaveText('Registo 4 de 137');
});
