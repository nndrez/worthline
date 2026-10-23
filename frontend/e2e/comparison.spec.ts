import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { fixtures, mockApi } from './mocked-api';
for (const width of [1440, 390]) {
  test(`historical comparison stays out of cards and opens shared details at ${width}px`, async ({
    page,
  }) => {
    const store = fixtures();
    store['transactions'].push({
      ...store['transactions'][0],
      id: 'past',
      date: '2026-09-05',
      amount: '1000.00',
    });
    await mockApi(page, store);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height: 900 });
    let requests = 0;
    page.on('request', (request) => {
      if (request.url().includes('/api/dashboard/')) requests++;
    });
    await page.goto('/overview?month=2026-09');
    const metric = page.locator('app-dashboard-metric[kind="income"]');
    await expect(metric.locator('.metric-value')).toContainText('1.000,00');
    await expect(metric.locator('app-month-comparison')).not.toContainText('1.800,00');
    await expect(page.locator('app-loading-state')).toHaveCount(0);
    const before = requests;
    await metric.getByRole('button', { name: 'Confronta con oggi: Entrate', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('1.000,00');
    await expect(dialog).toContainText('2.800,00');
    await expect(dialog).toContainText('1.800,00');
    await expect(dialog.locator('app-card')).toHaveCount(2);
    await expect(dialog).toContainText('ancora in corso');
    expect(requests).toBe(before);
    expect(await dialog.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({ path: `test-results/comparison-dialog-${width}.png` });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(
      metric.getByRole('button', { name: 'Confronta con oggi: Entrate', exact: true }),
    ).toBeFocused();
    await page.getByRole('button', { name: 'Vai al mese attuale' }).click();
    await expect(metric.locator('app-month-comparison')).toHaveCount(0);
    await page.screenshot({ path: `test-results/comparison-dashboard-${width}.png` });
  });
}
test('missing selected amount does not produce a fabricated comparison', async ({ page }) => {
  await mockApi(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/overview?month=2026-09');
  await page
    .locator('app-dashboard-metric[kind="income"]')
    .getByRole('button', { name: 'Confronta con oggi: Entrate', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('app-card').first()).toContainText('—');
  await expect(dialog).toContainText('Dati insufficienti');
  await expect(dialog.locator('.comparison-result strong')).toHaveCount(0);
});
