import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { fixtures, mockApi } from './mocked-api';

const cards = ['wealth', 'allocation', 'income', 'expenses', 'cash-flow', 'current-situation'];
const surfaces =
  'app-wealth-history app-card, app-wealth-allocation app-card, app-dashboard-metric app-card, app-current-situation app-card';

test('all empty cards use shared centered states and a recorded zero cash flow stays visible', async ({
  page,
}) => {
  const store = fixtures();
  store['accounts'] = [];
  store['monthly-balances'] = [];
  store['transactions'] = [];
  await mockApi(page, store);
  await page.goto('/overview?month=2026-10');
  await expect(page.locator('app-loading-state')).toHaveCount(0);
  await expect(page.locator('app-empty-state:visible')).toHaveCount(6);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator(surfaces)).toHaveCount(6);
  await expect(
    page.locator('app-wealth-history').getByRole('link', { name: 'Completa i saldi', exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/dashboard-empty.png', fullPage: true });
  await page.route('**/api/dashboard/cash-flow**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        month: '2026-10',
        currency: 'EUR',
        amount: '0.00',
        transactionCount: 2,
        history: Array.from({ length: 12 }, (_, index) => ({
          month: '2026-' + String(index + 1).padStart(2, '0'),
          amount: '0.00',
          transactionCount: index === 9 ? 2 : 0,
        })),
      }),
    }),
  );
  await page.reload();
  const cashFlow = page.locator('app-dashboard-metric[kind="cash-flow"]');
  await expect(cashFlow.locator('.metric-value')).toContainText('0,00');
  await expect(cashFlow.locator('app-empty-state')).toHaveCount(0);
});

for (const width of [1440, 390]) {
  test(`failed cards use neutral centered feedback with reachable retry at ${width}px`, async ({
    page,
  }) => {
    await mockApi(page);
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    let fail = true;
    await page.route('**/api/dashboard/**', (route) =>
      fail ? route.fulfill({ status: 503, body: 'offline' }) : route.fallback(),
    );
    await page.goto('/overview?month=2026-10');
    await expect(page.getByRole('alert')).toHaveCount(width < 781 ? 4 : 6);
    await expect(page.locator('app-empty-state')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Riprova', exact: true })).toHaveCount(
      width < 781 ? 4 : 6,
    );
    const bounds = await page.locator('app-card app-error-state').evaluateAll((elements) =>
      elements.map((element) => {
        const body = element.parentElement!.getBoundingClientRect();
        const button = element.querySelector('button')!.getBoundingClientRect();
        return button.top >= body.top && button.bottom <= body.bottom;
      }),
    );
    expect(bounds.every(Boolean)).toBe(true);
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({ path: `test-results/dashboard-error-${width}.png`, fullPage: true });
    fail = false;
    const income = page.locator('app-dashboard-metric[kind="income"]');
    await income.getByRole('button', { name: 'Riprova', exact: true }).click();
    await expect(income.locator('.metric-value')).toContainText('2.800,00');
    await expect(page.getByRole('alert')).toHaveCount(width < 781 ? 3 : 5);
  });
}

test('missing snapshots keep all cards present and do not display fabricated allocation percentages', async ({
  page,
}) => {
  const store = fixtures();
  store['monthly-balances'] = [];
  await mockApi(page, store);
  await page.goto('/overview?month=2026-10');
  await expect(page.locator('app-loading-state')).toHaveCount(0);
  await expect(page.locator(surfaces)).toHaveCount(6);
  await expect(page.locator('app-wealth-history app-empty-state')).toBeVisible();
  await expect(page.locator('app-wealth-allocation app-empty-state')).toBeVisible();
  await expect(page.locator('app-wealth-allocation svg[role="img"]')).not.toBeVisible();
  await expect(page.locator('app-current-situation')).toContainText('Senza rilevazione: 4');
});

test('all six cards reserve their layout before data and load, fail and retry independently', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mockApi(page);
  const pending = new Map<string, () => void>();
  const requests: string[] = [];
  const calls = new Map<string, number>();
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    requests.push(url.pathname);
    if (!url.pathname.startsWith('/api/dashboard/')) return route.fallback();
    const card = url.pathname.split('/').at(-1)!;
    calls.set(card, (calls.get(card) || 0) + 1);
    if (calls.get(card) === 1) {
      await new Promise<void>((resolve) => pending.set(card, resolve));
      if (card === 'allocation') return route.fulfill({ status: 503, body: 'offline' });
    }
    return route.fallback();
  });
  await page.goto('/overview?month=2026-10');
  await expect.poll(() => pending.size).toBe(6);
  expect([...pending.keys()].sort()).toEqual([...cards].sort());
  await page.locator('.page-content > :not(router-outlet)').evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
  const bounds = await page.locator(surfaces).evaluateAll((elements) =>
    elements.map((element) => ({
      x: element.getBoundingClientRect().x,
      y: element.getBoundingClientRect().y,
      height: element.getBoundingClientRect().height,
    })),
  );
  expect(bounds).toHaveLength(6);
  await expect(page.locator('app-loading-state')).toHaveCount(6);
  await page.screenshot({ path: 'test-results/dashboard-loading.png', fullPage: true });
  pending.get('income')!();
  const income = page.locator('app-dashboard-metric[kind="income"]');
  await expect(income).toContainText('2.800,00');
  await expect(page.locator('app-loading-state')).toHaveCount(5);
  pending.get('allocation')!();
  const allocation = page.locator('app-wealth-allocation');
  await expect(allocation.getByRole('alert')).toBeVisible();
  await allocation.getByRole('button', { name: 'Riprova', exact: true }).click();
  await expect(allocation.locator('svg')).toBeVisible();
  expect(calls.get('income')).toBe(1);
  for (const card of cards.filter((card) => !['income', 'allocation'].includes(card)))
    pending.get(card)!();
  await expect(page.locator('app-loading-state')).toHaveCount(0);
  const loaded = await page.locator(surfaces).evaluateAll((elements) =>
    elements.map((element) => ({
      x: element.getBoundingClientRect().x,
      y: element.getBoundingClientRect().y,
      height: element.getBoundingClientRect().height,
    })),
  );
  expect(loaded).toEqual(bounds);
  expect(requests.every((path) => path.startsWith('/api/dashboard/'))).toBe(true);
  expect(errors).toEqual([]);
});

test('charts expose amounts on pointer and keyboard interaction and period changes only reload wealth', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mockApi(page);
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/dashboard/')) requests.push(new URL(request.url()).pathname);
  });
  await page.goto('/overview?month=2026-10');
  const history = page.locator('app-wealth-history');
  const point = history.locator('.chart-point').last();
  await point.focus();
  await expect(history.locator('app-chart-tooltip')).toContainText('ottobre 2026');
  await expect(history.locator('app-chart-tooltip')).toContainText('29.300,50');
  await page.keyboard.press('Escape');
  await expect(history.locator('app-chart-tooltip')).toHaveCount(0);
  await point.hover();
  await expect(history.locator('app-chart-tooltip')).toBeVisible();
  const allocation = page.locator('app-wealth-allocation');
  const cash = allocation.getByRole('button', { name: /Liquidità/ });
  await cash.focus();
  await expect(allocation.locator('app-chart-tooltip')).toContainText('Liquidità');
  await expect(allocation.locator('app-chart-tooltip')).toContainText('%');
  await history.getByRole('button', { name: '3 mesi', exact: true }).click();
  await expect(history.locator('.chart-point')).toHaveCount(3);
  for (const card of cards)
    expect(requests.filter((path) => path === `/api/dashboard/${card}`)).toHaveLength(
      card === 'wealth' ? 2 : 1,
    );
  expect(errors).toEqual([]);
});

test('dashboard remains neutral and accessible on mobile and chart values are available by touch', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mockApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/overview?month=2026-10');
  await expect(page.locator('app-loading-state')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Storico', exact: true }).click();
  const history = page.locator('app-wealth-history');
  await history.locator('.chart-point').last().dispatchEvent('click', { pointerType: 'touch' });
  await expect(history.locator('app-chart-tooltip')).toContainText('29.300,50');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
    ),
  ).toBe('#383c43');
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true });
  await page.getByRole('tab', { name: 'Situazione', exact: true }).click();
  await expect(page.locator('app-current-situation')).toContainText('31/10/2026');
  const currentTableFits = await page
    .locator('app-current-situation .table-viewport')
    .evaluate((element) => element.scrollWidth <= element.clientWidth + 1);
  expect(currentTableFits).toBe(true);
  await expect(
    page.locator('app-current-situation tbody tr').last().locator('.numeric'),
  ).toBeVisible();

  await page.screenshot({ path: 'test-results/dashboard-current-mobile.png', fullPage: true });
  await page.getByRole('tab', { name: 'Ripartizione', exact: true }).click();
  await expect(page.locator('app-wealth-allocation .allocation-legend')).toBeVisible();
  await page
    .locator('app-wealth-allocation')
    .getByRole('button', { name: /Pensione/ })
    .click();
  await expect(page.locator('app-wealth-allocation .donut-center')).toContainText('9.100,50');
  await page.screenshot({ path: 'test-results/dashboard-allocation-mobile.png', fullPage: true });

  expect(errors).toEqual([]);
});

test('current situation and allocation use latest records from different months and metrics follow the selected month', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-22T10:00:00+02:00'));
  const store = fixtures();
  const accounts = store['accounts'];
  store['monthly-balances'] = [
    { id: 'old', accountId: accounts[0].id, date: '2026-07-31', amount: '999.00' },
    { id: 'latest-zero', accountId: accounts[0].id, date: '2026-09-30', amount: '0.00' },
    { id: 'fund', accountId: accounts[1].id, date: '2026-08-31', amount: '123.45' },
  ];
  await mockApi(page, store);
  const requests: URL[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/dashboard/')) requests.push(new URL(request.url()));
  });
  await page.goto('/overview?month=2026-10');
  const current = page.locator('app-current-situation');
  await expect(current.locator('.situation-total')).toContainText('123,45');
  await expect(current).toContainText('30/09/2026');
  await expect(current).toContainText('31/08/2026');
  await expect(current).toContainText('0,00');
  await expect(current).toContainText('Senza rilevazione: 2');
  await expect(page.locator('app-wealth-allocation .donut-center')).toContainText('123,45');
  await expect(page.locator('app-accounts-card, app-dashboard-completion')).toHaveCount(0);
  expect(
    requests.some((url) =>
      ['/api/dashboard/accounts', '/api/dashboard/completion'].includes(url.pathname),
    ),
  ).toBe(false);
  for (const kind of ['income', 'expenses', 'cash-flow']) {
    expect(
      requests.find((url) => url.pathname.endsWith('/' + kind))?.searchParams.get('month'),
    ).toBe('2026-10');
  }
});

test('month navigation reloads each card and restores the selected month from the URL', async ({
  page,
}) => {
  const store = fixtures();
  store['transactions'].push({
    id: 'past-income',
    date: '2026-09-30',
    description: 'Synthetic income',
    amount: '100.00',
    type: 'INCOME',
    categoryId: 'c3',
  });
  store['transactions'].push({
    id: 'past-expense',
    date: '2026-09-01',
    description: 'Synthetic expense',
    amount: '25.00',
    type: 'EXPENSE',
    categoryId: 'c1',
  });
  await mockApi(page, store);
  const requests: URL[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/dashboard/')) requests.push(new URL(request.url()));
  });
  await page.goto('/overview?month=2026-10');
  await expect(page.locator('app-dashboard-metric[kind="income"] .metric-value')).toContainText(
    '2.800,00',
  );
  await page
    .locator('ui-datepicker')
    .getByRole('button', { name: 'Mese precedente', exact: true })
    .click();
  await expect(page).toHaveURL(/month=2026-09/);
  await expect(page.locator('app-dashboard-metric[kind="income"] .metric-value')).toContainText(
    '100,00',
  );
  await expect(page.locator('app-dashboard-metric[kind="expenses"] .metric-value')).toContainText(
    '25,00',
  );
  await expect(page.locator('app-dashboard-metric[kind="cash-flow"] .metric-value')).toContainText(
    '75,00',
  );
  await expect(page.locator('app-current-situation h2')).toContainText('settembre 2026');
  await expect(page.locator('app-current-situation tbody')).not.toContainText('31/10/2026');
  await expect(page.locator('app-current-situation tbody')).toContainText('30/09/2026');
  for (const card of cards)
    expect(
      requests.filter(
        (url) => url.pathname.endsWith('/' + card) && url.searchParams.get('month') === '2026-09',
      ),
    ).toHaveLength(1);
  await page.reload();
  await expect(page.locator('app-dashboard-metric[kind="cash-flow"] .metric-value')).toContainText(
    '75,00',
  );
  await page.goBack();
  await expect(page).toHaveURL(/month=2026-10/);
  await expect(page.locator('app-dashboard-metric[kind="income"] .metric-value')).toContainText(
    '2.800,00',
  );
});

test('annual metrics expose twelve months, support keyboard selection and open shared details on mobile', async ({
  page,
}) => {
  const store = fixtures();
  for (let number = 1; number < 10; number++) {
    const month = '2026-' + String(number).padStart(2, '0');
    store['transactions'].push({
      id: 'annual-income-' + number,
      date: month + '-15',
      amount: String(1000 + number * 100),
      type: 'INCOME',
      categoryId: 'c3',
      description: 'Synthetic income',
    });
    store['transactions'].push({
      id: 'annual-expense-' + number,
      date: month + '-15',
      amount: String(300 + number * 10),
      type: 'EXPENSE',
      categoryId: 'c1',
      description: 'Synthetic expense',
    });
  }
  await mockApi(page, store);
  await page.goto('/overview?month=2026-10');
  const income = page.locator('app-dashboard-metric[kind="income"]');
  await expect(income.locator('.annual-chart .chart-point')).toHaveCount(12);
  const january = income.locator('.annual-chart').getByRole('button', { name: /gennaio 2026/ });
  await january.focus();
  await expect(income.locator('app-chart-tooltip')).toContainText('1.100,00');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/month=2026-02/);
  await expect(income.locator('.metric-value')).toContainText('1.200,00');
  await page.screenshot({ path: 'test-results/dashboard-annual-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await income
    .getByRole('button', { name: 'Andamento annuale dei movimenti: Entrate', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('tbody tr')).toHaveCount(12);
  await expect(dialog.locator('thead th')).toHaveCount(2);
  await expect(dialog.locator('tbody button')).toHaveCount(0);
  await dialog.locator('.chart-point').last().dispatchEvent('click', { pointerType: 'touch' });
  await expect(page).toHaveURL(/month=2026-12/);
  await expect(income.locator('.metric-value')).toContainText('0,00');
  await expect(dialog.getByRole('heading', { name: /Entrate/ })).toContainText('2026');
  await page.screenshot({
    path: 'test-results/dashboard-annual-mobile-dialog.png',
    fullPage: true,
  });
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('wealth series can be toggled and monthly details include separate account types', async ({
  page,
}) => {
  await mockApi(page);
  await page.goto('/overview?month=2026-10');
  const history = page.locator('app-wealth-history');
  const svg = history.locator('svg[role="group"]');
  await expect(svg.locator('path:not(.series-area)')).toHaveCount(3);
  const investments = history.getByRole('button', { name: 'Investimenti', exact: true });
  await investments.click();
  await expect(investments).toHaveAttribute('aria-pressed', 'false');
  await expect(svg.locator('path:not(.series-area)')).toHaveCount(2);
  await history
    .getByRole('button', { name: 'Dettaglio delle rilevazioni mensili', exact: true })
    .click();
  for (const name of ['Liquidità', 'Investimenti', 'Pensione'])
    await expect(
      page.getByRole('dialog').getByRole('columnheader', { name, exact: true }),
    ).toBeVisible();
});

test('chart dialogs reuse shared content, are wide, and the current month button restores the dashboard', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-23T10:00:00+02:00'));
  await mockApi(page);
  await page.goto('/overview?month=2026-09');
  const current = page.getByRole('button', { name: 'Vai al mese attuale', exact: true });
  await current.click();
  await expect(page).toHaveURL(/month=2026-10/);
  await expect(current).toBeDisabled();
  const income = page.locator('app-dashboard-metric[kind="income"]');
  await income
    .getByRole('button', { name: 'Andamento annuale dei movimenti: Entrate', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('app-chart-data-table tbody tr')).toHaveCount(12);
  await expect(dialog.locator('app-time-series-chart')).toHaveCount(1);
  expect((await dialog.boundingBox())!.width).toBeGreaterThan(900);
  const chart = dialog.locator('app-time-series-chart');
  const point = chart.getByRole('button', { name: /ottobre 2026/ });
  await point.focus();
  await expect(chart.locator('app-chart-tooltip')).toBeVisible();
  const tooltip = await chart.locator('app-chart-tooltip').boundingBox();
  const box = await point.locator('circle').first().boundingBox();
  expect(tooltip!.x + tooltip!.width).toBeLessThanOrEqual(1440);
  expect(tooltip!.y).toBeGreaterThanOrEqual(0);
  expect(
    Math.min(
      Math.abs(tooltip!.x - (box!.x + box!.width)),
      Math.abs(tooltip!.x + tooltip!.width - box!.x),
    ),
  ).toBeLessThan(45);
  await page.screenshot({ path: 'test-results/chart-dialog-anchored-tooltip.png', fullPage: true });
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});
