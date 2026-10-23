import { test, expect, Locator, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { fixtures, mockApi } from './mocked-api';

async function choose(page: Page, control: Locator, label: string): Promise<void> {
  await control.click();
  await page.getByRole('option', { name: label, exact: true }).click();
}

test('dashboard shows complete monthly data with Italian formatting', async ({ page }) => {
  await mockApi(page);
  await page.goto('/overview?month=2026-10');
  await expect(page.getByText('57.002,00', { exact: false }).first()).toBeVisible();
  await expect(page.locator('app-current-situation')).toContainText('Situazione attuale');
  await expect(
    page.getByRole('group', { name: 'Andamento delle rilevazioni mensili del patrimonio' }),
  ).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({ path: 'test-results/overview.png', fullPage: true });
});

test('account creation, editing and deletion preserve the API contract', async ({ page }) => {
  const store = await mockApi(page);
  await page.goto('/accounts');
  await page.getByRole('button', { name: 'Nuovo conto', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nome', { exact: true }).fill('Conto di prova');
  await choose(page, dialog.getByLabel('Tipo', { exact: true }), 'Liquidità');
  await dialog.getByRole('button', { name: 'Salva', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const row = page.getByRole('row').filter({ hasText: 'Conto di prova' });
  await expect(row).toBeVisible();
  expect(
    store['accounts'].some(
      (account) => account['name'] === 'Conto di prova' && account['type'] === 'CASH',
    ),
  ).toBe(true);
  await row.getByRole('button', { name: 'Modifica', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Nome', { exact: true }).fill('Conto aggiornato');
  await page.getByRole('dialog').getByRole('button', { name: 'Salva', exact: true }).click();
  const updated = page.getByRole('row').filter({ hasText: 'Conto aggiornato' });
  await expect(updated).toBeVisible();
  await updated.getByRole('button', { name: 'Elimina', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Elimina', exact: true }).click();
  await expect(updated).not.toBeVisible();
});

test('validation and translated conflicts preserve the entered form', async ({ page }) => {
  await mockApi(page);
  await page.goto('/accounts');
  const trigger = page.getByRole('button', { name: 'Nuovo conto', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Salva', exact: true }).click();
  await expect(dialog.getByText('Valore non valido.')).toBeVisible();
  await dialog.getByLabel('Nome', { exact: true }).fill('Conto quotidiano');
  await dialog.getByRole('button', { name: 'Salva', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Questo elemento esiste già');
  await expect(dialog.getByLabel('Nome', { exact: true })).toHaveValue('Conto quotidiano');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('recorded zero is saved as an exact decimal without changing transactions', async ({
  page,
}) => {
  const store = await mockApi(page);
  store['monthly-balances'] = [];
  await page.goto('/balances?month=2026-10&accountId=a1');
  await page.getByRole('button', { name: 'Registra saldo', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Conto', { exact: true })).toContainText('Conto quotidiano');
  await expect(dialog.getByLabel('Data', { exact: true })).toHaveValue('31/10/2026');
  await dialog.getByLabel('Importo', { exact: true }).fill('0,00');
  await dialog.getByRole('button', { name: 'Salva', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(store['monthly-balances'][0]['amount']).toBe('0.00');
  expect(store['transactions'].length).toBe(3);
  await expect(page.getByRole('cell', { name: '0,00', exact: false })).toBeVisible();
});

test('categories and expense forms work together without requiring a card', async ({ page }) => {
  const store = await mockApi(page);
  await page.goto('/categories');
  await page.getByRole('button', { name: 'Nuova categoria', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nome', { exact: true }).fill('Trasporti di prova');
  await choose(page, dialog.getByLabel('Tipo', { exact: true }), 'Uscita');
  await dialog.getByRole('button', { name: 'Salva', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('link', { name: 'Movimenti', exact: true }).click();
  await page.getByRole('button', { name: 'Nuovo movimento', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Descrizione', { exact: true }).fill('Acquisto di prova');
  await dialog.getByLabel('Importo', { exact: true }).fill('12,34');
  await choose(page, dialog.getByLabel('Categoria', { exact: true }), 'Trasporti di prova');
  await dialog.getByRole('button', { name: 'Salva', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const transaction = store['transactions'].find(
    (row) => row['description'] === 'Acquisto di prova',
  );
  expect(transaction?.['amount']).toBe('12.34');
  expect(transaction?.['type']).toBe('EXPENSE');
  expect(transaction).not.toHaveProperty('accountId');
});

test('investment operation form handles six decimals and dividends', async ({ page }) => {
  const store = await mockApi(page);
  await page.goto('/investment-operations');
  await page.getByRole('button', { name: 'Nuova operazione', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await choose(page, dialog.getByLabel('Strumento', { exact: true }), 'Fondo globale di esempio');
  await dialog.getByLabel('Importo', { exact: true }).fill('12,34');
  await dialog.getByLabel('Prezzo unitario', { exact: true }).fill('6,123456');
  await dialog.getByLabel('Quantità', { exact: true }).fill('2');
  await dialog.getByRole('button', { name: 'Salva', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(store['investment-operations'].at(-1)?.['unitPrice']).toBe('6.123456');
  await page.getByRole('button', { name: 'Nuova operazione', exact: true }).click();
  dialog = page.getByRole('dialog');
  await choose(page, dialog.getByLabel('Tipo', { exact: true }), 'Dividendo');
  await expect(dialog.getByLabel('Quantità', { exact: true })).not.toBeVisible();
  await choose(page, dialog.getByLabel('Strumento', { exact: true }), 'Fondo globale di esempio');
  await dialog.getByLabel('Importo', { exact: true }).fill('2,50');
  await dialog.getByRole('button', { name: 'Salva', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(store['investment-operations'].at(-1)?.['quantity']).toBeNull();
  expect(store['investment-operations'].at(-1)?.['amount']).toBe('2.50');
});

test('instrument form normalizes identifiers and supports editing', async ({ page }) => {
  const store = await mockApi(page);
  await page.goto('/portfolio');
  await page.getByRole('button', { name: 'Nuovo strumento', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nome', { exact: true }).fill('Strumento di prova');
  await dialog.getByLabel('Codice', { exact: true }).fill('sample');
  await dialog.getByRole('button', { name: 'Salva', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(store['instruments'].find((row) => row['name'] === 'Strumento di prova')?.['code']).toBe(
    'SAMPLE',
  );
  await page
    .getByRole('row')
    .filter({ hasText: 'Strumento di prova' })
    .getByRole('button', { name: 'Modifica', exact: true })
    .click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nome', { exact: true }).fill('Strumento aggiornato');
  await dialog.getByRole('button', { name: 'Salva', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Strumento aggiornato' })).toBeVisible();
});

test('existing category structure is read-only while its name remains editable', async ({
  page,
}) => {
  const store = await mockApi(page);
  await page.goto('/categories');
  await page
    .getByRole('row')
    .filter({ hasText: 'Spesa alimentare' })
    .getByRole('button', { name: 'Modifica', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Tipo', { exact: true })).toHaveAttribute('readonly', '');
  await expect(dialog.getByLabel('Categoria principale', { exact: true })).toHaveValue(
    'Casa e quotidianità',
  );
  await dialog.getByLabel('Nome', { exact: true }).fill('Alimentari');
  await dialog.getByRole('button', { name: 'Salva', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(store['categories'].find((row) => row.id === 'c2')?.['parentId']).toBe('c1');
  expect(store['categories'].find((row) => row.id === 'c2')?.['name']).toBe('Alimentari');
});

test('server pagination and filters survive reloading the URL', async ({ page }) => {
  const store = fixtures();
  for (let index = 0; index < 15; index++)
    store['accounts'].push({ id: 'extra-' + index, name: 'Prova ' + index, type: 'CASH' });
  await mockApi(page, store);
  await page.goto('/accounts');
  await expect(page.getByText('19 risultati')).toBeVisible();
  await page.getByRole('button', { name: 'Pagina successiva' }).click();
  await expect(page).toHaveURL(/page=1/);
  await expect(page.getByText('Pagina 2 di 2')).toBeVisible();
  await page.getByRole('searchbox').fill('quotidiano');
  await expect(page.getByText('1 risultato')).toBeVisible();
  await expect(page).toHaveURL(/name=quotidiano/);
  await page.reload();
  await expect(page.getByRole('searchbox')).toHaveValue('quotidiano');
  await expect(page.getByText('1 risultato')).toBeVisible();
});

test('empty, filtered and offline states remain distinct', async ({ page }) => {
  const store = fixtures();
  store['accounts'] = [];
  await mockApi(page, store);
  await page.goto('/accounts');
  await expect(page.getByRole('heading', { name: 'Nessun conto' })).toBeVisible();
  await page.getByRole('searchbox').fill('inesistente');
  await expect(page.getByRole('heading', { name: 'Nessun risultato' })).toBeVisible();
  await page.route('**/api/accounts**', (route) => route.fulfill({ status: 503, body: 'offline' }));
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Non riusciamo a raggiungere i tuoi dati');
  await expect(page.getByRole('heading', { name: 'Nessun risultato' })).not.toBeVisible();
});

test('mobile layouts and dialog keyboard interaction stay accessible', async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/overview?month=2026-10');
  await page.getByRole('tab', { name: 'Situazione', exact: true }).click();
  await expect(page.locator('app-current-situation')).toContainText('Situazione attuale');
  await page.screenshot({ path: 'test-results/overview-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('link', { name: 'Conti', exact: true }).click();
  await page.getByRole('button', { name: 'Nuovo conto', exact: true }).click();
  await expect(page.getByRole('dialog').getByLabel('Nome', { exact: true })).toBeFocused();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({ path: 'test-results/account-dialog-mobile.png', fullPage: true });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('shared select searches inside dialogs and Escape restores focus without closing the form', async ({
  page,
}) => {
  await mockApi(page);
  await page.goto('/transactions');
  await page.getByRole('button', { name: 'Nuovo movimento', exact: true }).click();
  const dialog = page.locator('app-dialog-frame dialog');
  const category = dialog.getByLabel('Categoria', { exact: true });
  await category.click();
  const search = page.getByRole('searchbox', { name: 'Cerca…', exact: true });
  await expect(search).toBeFocused();
  await search.fill('alimentare');
  await expect(page.getByRole('option')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/shared-select.png', fullPage: true });
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await expect(category).toBeFocused();
  await category.press('Enter');
  await page
    .getByRole('option', { name: 'Casa e quotidianità / Spesa alimentare', exact: true })
    .click();
  await expect(category).toContainText('Spesa alimentare');
});

test('shared datepicker supports Italian entry, calendar keyboard selection and mobile dialogs', async ({
  page,
}) => {
  const store = await mockApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/transactions');
  await page.getByRole('button', { name: 'Nuovo movimento', exact: true }).click();
  const dialog = page.locator('app-dialog-frame dialog');
  const date = dialog.getByLabel('Data', { exact: true });
  await date.fill('15/10/2026');
  await date.press('Tab');
  await date.press('Alt+ArrowDown');
  const calendar = page.locator('ui-calendar');
  await expect(calendar).toBeVisible();
  const day = calendar.getByRole('button', { name: 'giovedì 15 ottobre 2026', exact: true });
  await expect(day).toBeFocused();
  await day.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(calendar).not.toBeVisible();
  await expect(date).toHaveValue('16/10/2026');
  await date.press('Alt+ArrowDown');
  await page.screenshot({ path: 'test-results/shared-calendar-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Descrizione', { exact: true }).fill('Calendario di prova');
  await dialog.getByLabel('Importo', { exact: true }).fill('5,00');
  await choose(
    page,
    dialog.getByLabel('Categoria', { exact: true }),
    'Casa e quotidianità / Spesa alimentare',
  );
  await dialog.getByRole('button', { name: 'Salva', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(store['transactions'].at(-1)?.['date']).toBe('2026-10-16');
});

test('shared date range persists partial and complete filters and clears both dates', async ({
  page,
}) => {
  await mockApi(page);
  await page.goto('/transactions');
  await page.getByLabel('Data inizio', { exact: true }).fill('01/10/2026');
  await page.getByLabel('Data inizio', { exact: true }).press('Tab');
  await expect(page).toHaveURL(/from=2026-10-01/);
  await page.getByLabel('Data fine', { exact: true }).fill('31/10/2026');
  await page.getByLabel('Data fine', { exact: true }).press('Tab');
  await expect(page).toHaveURL(/to=2026-10-31/);
  await page.reload();
  await expect(page.getByLabel('Data inizio', { exact: true })).toHaveValue('01/10/2026');
  await expect(page.getByLabel('Data fine', { exact: true })).toHaveValue('31/10/2026');
  await page.getByRole('button', { name: 'Apri calendario' }).click();
  await expect(page.locator('ui-calendar')).toBeVisible();
  await page.screenshot({ path: 'test-results/shared-date-range.png', fullPage: true });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Cancella date' }).click();
  await expect(page).not.toHaveURL(/from=|to=/);
});

test('month mode shares the calendar and updates the overview URL', async ({ page }) => {
  await mockApi(page);
  await page.goto('/overview?month=2026-10');
  const month = page.getByLabel('Periodo della dashboard', { exact: true });
  await expect(month).toHaveValue('10/2026');
  await month.press('Alt+ArrowDown');
  await page
    .locator('ui-calendar')
    .getByRole('button', { name: 'settembre 2026', exact: true })
    .click();
  await expect(page).toHaveURL(/month=2026-09/);
  await expect(month).toHaveValue('09/2026');
});

test('month arrows update balance filters and keep the month label visually hidden', async ({
  page,
}) => {
  await mockApi(page);
  await page.goto('/balances?month=2026-01');
  const picker = page.locator('ui-datepicker');
  await picker.getByRole('button', { name: 'Mese precedente', exact: true }).click();
  await expect(page).toHaveURL(/month=2025-12/);
  await expect(page.getByLabel('Mese di riferimento', { exact: true })).toHaveValue('12/2025');
  await picker.getByRole('button', { name: 'Mese successivo', exact: true }).click();
  await expect(page).toHaveURL(/month=2026-01/);
  await expect(page.getByLabel('Mese di riferimento', { exact: true })).toHaveValue('01/2026');
  await expect(page.locator('label[for="balances-month"] > span')).toHaveClass('sr-only');
  await page.screenshot({ path: 'test-results/balances-month-navigation.png', fullPage: true });
});
