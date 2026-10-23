import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { fixtures, mockApi } from './mocked-api';

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 1024, height: 600 },
  { width: 390, height: 844 },
]) {
  test(`dashboard fits the viewport at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    const store = fixtures();
    for (let index = 0; index < 15; index++)
      store['accounts'].push({ id: `viewport-${index}`, name: `Conto ${index}`, type: 'CASH' });
    await mockApi(page, store);
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/overview?month=2026-10');
    await expect(page.locator('app-loading-state')).toHaveCount(0);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Panoramica', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('contentinfo')).toHaveCount(0);
    await expect(page.getByText('Finanza personale', { exact: true })).toHaveCount(0);
    const assertContained = async () => {
      const result = await page.evaluate(() => {
        const main = document.querySelector('main')!;
        const board = document.querySelector('.dashboard-board')!.getBoundingClientRect();
        const visible = [
          ...document.querySelectorAll<HTMLElement>('.dashboard-panel, .metrics-grid'),
        ].filter((element) => getComputedStyle(element).display !== 'none');
        return {
          overflow: main.scrollHeight - main.clientHeight,
          documentOverflow: document.documentElement.scrollHeight - window.innerHeight,
          horizontal: main.scrollWidth - main.clientWidth,
          bottom: board.bottom,
          mainBottom: main.getBoundingClientRect().bottom,
          panelsInside: visible.every(
            (element) => element.getBoundingClientRect().bottom <= board.bottom + 1,
          ),
        };
      });
      expect(result.overflow).toBeLessThanOrEqual(1);
      expect(result.documentOverflow).toBe(0);
      expect(result.horizontal).toBeLessThanOrEqual(1);
      expect(result.bottom).toBeLessThanOrEqual(result.mainBottom);
      expect(result.panelsInside).toBe(true);
    };
    await assertContained();
    const metricsFit = await page
      .locator('app-dashboard-metric .card-content')
      .evaluateAll((elements) =>
        elements.every(
          (element) =>
            element.scrollHeight <= element.clientHeight + 1 &&
            element.scrollWidth <= element.clientWidth + 1,
        ),
      );
    expect(metricsFit).toBe(true);
    if (viewport.width <= 780 || viewport.height <= 650) {
      for (const tab of ['Ripartizione', 'Storico', 'Situazione']) {
        await page.getByRole('tab', { name: tab, exact: true }).click();
        await expect(page.getByRole('tabpanel', { name: tab, exact: true })).toBeVisible();
        await assertContained();
      }
      await page.getByRole('tab', { name: 'Situazione', exact: true }).focus();
      await page.keyboard.press('End');
      await expect(page.getByRole('tab', { name: 'Storico', exact: true })).toBeFocused();
      await expect(page.getByRole('tab', { name: 'Storico', exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    } else {
      await expect(page.locator('app-current-situation app-pagination')).toHaveCount(0);
      await expect(page.locator('app-current-situation tbody tr')).toHaveCount(19);
      const scroll = page.locator('app-current-situation .table-viewport');
      await scroll.focus();
      await page.keyboard.press('End');
      await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      const legendFits = await page.locator('app-wealth-allocation').evaluate((element) => {
        const card = element.getBoundingClientRect();
        return [...element.querySelectorAll('.allocation-legend button')].every(
          (button) => button.getBoundingClientRect().bottom <= card.bottom,
        );
      });
      expect(legendFits).toBe(true);
    }
    expect(await page.getByRole('main').evaluate((element) => element.scrollTop)).toBe(0);
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({
      path: `test-results/dashboard-fit-${viewport.width}-${viewport.height}.png`,
      fullPage: true,
    });
  });
}

test('monthly history details open in the shared dialog without expanding the dashboard', async ({
  page,
}) => {
  await mockApi(page);
  await page.goto('/overview?month=2026-10');
  await page
    .getByRole('button', { name: 'Dettaglio delle rilevazioni mensili', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('table')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  expect(await page.getByRole('main').evaluate((element) => element.scrollTop)).toBe(0);
});

test('all pages have plain section titles and use the shared header', async ({ page }) => {
  await mockApi(page);
  for (const [path, title] of [
    ['overview', 'Panoramica'],
    ['accounts', 'Conti'],
    ['balances', 'Saldi mensili'],
    ['transactions', 'Movimenti'],
    ['categories', 'Categorie'],
    ['portfolio', 'Strumenti finanziari'],
    ['investment-operations', 'Operazioni di investimento'],
  ]) {
    await page.goto('/' + path);
    await expect(page.locator('app-page-header h1')).toHaveText(title);
    await expect(page.locator('app-page-header')).not.toHaveAttribute('title');
    await expect(
      page.locator('app-page-header .eyebrow, app-page-header p, footer, .personal-space'),
    ).toHaveCount(0);
  }
});
