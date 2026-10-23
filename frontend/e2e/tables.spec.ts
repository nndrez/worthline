import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { fixtures, mockApi } from './mocked-api';

function manyAccounts() {
  const store = fixtures();
  for (let index = 0; index < 22; index++)
    store['accounts'].push({
      id: `table-${index}`,
      name: `Conto prova ${String(index).padStart(2, '0')}`,
      type: 'CASH',
    });
  return store;
}

async function finishPageEntry(page: import('@playwright/test').Page): Promise<void> {
  await page.locator('.list-page').evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
}

for (const viewport of [
  { width: 1440, height: 800 },
  { width: 390, height: 844 },
]) {
  test(`only table rows scroll at ${viewport.width}px, while headings, filters and pagination stay visible`, async ({
    page,
  }) => {
    await mockApi(page, manyAccounts());
    await page.setViewportSize(viewport);
    await page.goto('/accounts');
    const table = page.locator('app-data-table');
    await expect(table).toHaveAttribute('aria-busy', 'false');
    await finishPageEntry(page);
    const scroll = table.getByRole('region');
    const heading = page.getByRole('heading', { name: 'Conti' });
    const toolbar = table.locator('.toolbar');
    const pager = table.getByRole('navigation', { name: 'Paginazione' });
    const header = table.locator('th').first();
    await expect
      .poll(() =>
        page.getByRole('main').evaluate((element) => element.scrollHeight - element.clientHeight),
      )
      .toBeLessThanOrEqual(1);
    const before = await Promise.all([
      heading.boundingBox(),
      toolbar.boundingBox(),
      pager.boundingBox(),
      header.boundingBox(),
    ]);
    await scroll.focus();
    await page.keyboard.press('PageDown');
    await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    const after = await Promise.all([
      heading.boundingBox(),
      toolbar.boundingBox(),
      pager.boundingBox(),
      header.boundingBox(),
    ]);
    before.forEach((box, index) => expect(after[index]?.y).toBeCloseTo(box!.y, 1));
    expect(await page.getByRole('main').evaluate((element) => element.scrollTop)).toBe(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await page.screenshot({
      path: `test-results/table-contained-${viewport.width}.png`,
      fullPage: true,
    });
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
  });
}

test('pagination retains rows and geometry during loading, disables stale actions, and reveals new rows', async ({
  page,
}) => {
  await mockApi(page, manyAccounts());
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/api/accounts**', async (route) => {
    if (new URL(route.request().url()).searchParams.get('page') === '1') await gate;
    await route.fallback();
  });
  await page.goto('/accounts');
  const table = page.locator('app-data-table');
  await expect(table).toHaveAttribute('aria-busy', 'false');
  await finishPageEntry(page);
  const original = await table.locator('tbody tr').first().innerText();
  const bounds = await table.boundingBox();
  const scroll = table.getByRole('region');
  await scroll.evaluate((element) => (element.scrollTop = 180));
  await table.getByRole('button', { name: 'Pagina successiva', exact: true }).click();
  await expect(table).toHaveAttribute('aria-busy', 'true');
  expect(await table.locator('tbody tr').first().innerText()).toBe(original);
  await expect(table.locator('.table-content')).toHaveAttribute('inert', '');
  await expect(
    table.getByRole('button', { name: 'Pagina successiva', exact: true }),
  ).toBeDisabled();
  expect(await table.boundingBox()).toEqual(bounds);
  await page.screenshot({ path: 'test-results/table-refresh.png', fullPage: true });
  release();
  await expect(table).toHaveAttribute('aria-busy', 'false');
  await expect(table.locator('tbody tr').first()).not.toHaveText(original);
  await expect(table.locator('.table-content')).not.toHaveAttribute('inert');
  await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBe(0);
  await expect(table.getByText('Pagina 2 di 3')).toBeVisible();
});

test('initial load has a shared spinner and errors replace old rows without becoming empty results', async ({
  page,
}) => {
  await mockApi(page, manyAccounts());
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  let initial = true;
  let fail = true;
  await page.route('**/api/accounts**', async (route) => {
    if (initial) {
      initial = false;
      await gate;
    }
    if (new URL(route.request().url()).searchParams.get('page') === '1' && fail) {
      fail = false;
      await route.fulfill({ status: 503, body: 'offline' });
      return;
    }
    await route.fallback();
  });
  await page.goto('/accounts');
  const table = page.locator('app-data-table');
  await expect(table.locator('app-loading-state ui-spinner')).toBeVisible();
  await finishPageEntry(page);
  const bounds = await table.boundingBox();
  await page.screenshot({ path: 'test-results/table-skeleton.png', fullPage: true });
  release();
  await expect(table).toHaveAttribute('aria-busy', 'false');
  await expect(table.locator('app-loading-state')).toHaveCount(0);
  expect(await table.boundingBox()).toEqual(bounds);
  await table.getByRole('button', { name: 'Pagina successiva', exact: true }).click();
  await expect(table.getByRole('alert')).toContainText('Non riusciamo a raggiungere i tuoi dati');
  await expect(table.locator('tbody tr')).toHaveCount(0);
  await expect(table.getByRole('heading', { name: 'Nessun risultato' })).toHaveCount(0);
  await table.getByRole('button', { name: 'Riprova', exact: true }).click();
  await expect(table.getByRole('alert')).toHaveCount(0);
  await expect(table.locator('tbody tr')).toHaveCount(12);
});

test('all list pages use the shared table, route tabs remain active with filters, and reduced motion is respected', async ({
  page,
}) => {
  await mockApi(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of [
    '/accounts',
    '/balances?month=2026-10',
    '/transactions',
    '/categories',
    '/portfolio',
    '/investment-operations',
  ]) {
    await page.goto(route);
    const table = page.locator('app-data-table');
    await expect(table).toHaveAttribute('aria-busy', 'false');
    await expect(table.getByRole('region')).toBeVisible();
    expect(
      await page
        .locator('.list-page')
        .evaluate((element) => getComputedStyle(element).animationName),
    ).toBe('none');
  }
  await page.goto('/balances?month=2026-10');
  await expect(
    page.locator('app-tabs').getByRole('link', { name: 'Saldi mensili', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await page.locator('app-tabs').getByRole('link', { name: 'Conti', exact: true }).click();
  await expect(page).toHaveURL(/\/accounts$/);
  await expect(
    page.locator('app-tabs').getByRole('link', { name: 'Conti', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
});
