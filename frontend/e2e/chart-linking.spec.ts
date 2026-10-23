import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi } from './mocked-api';

for (const width of [1440, 390]) {
  test(`chart and table share hover, focus and selection inside cards at ${width}px`, async ({
    page,
  }) => {
    await mockApi(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height: 900 });
    let requests = 0;
    page.on('request', (request) => {
      if (request.url().includes('/api/dashboard/')) requests++;
    });
    await page.goto('/overview?month=2026-10');
    await expect(page.locator('app-loading-state')).toHaveCount(0);
    await page
      .locator('app-dashboard-metric[kind="income"]')
      .getByRole('button', { name: 'Andamento annuale dei movimenti: Entrate', exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('.chart-dialog-body > app-card')).toHaveCount(2);
    const table = dialog.locator('app-chart-data-table');
    const chart = dialog.locator('app-time-series-chart');
    await expect(table.locator('thead th')).toHaveCount(2);
    const initialRequests = requests;
    const october = chart.getByRole('button', { name: /ottobre 2026/ });
    await october.hover();
    await expect(table.locator('tr[data-month="2026-10"]')).toHaveClass(/highlighted-month/);
    const viewport = table.locator('.table-viewport');
    const row = await table.locator('tr[data-month="2026-10"]').boundingBox();
    const visible = await viewport.boundingBox();
    expect(row!.y + row!.height).toBeLessThanOrEqual(visible!.y + visible!.height + 1);
    await page.mouse.move(0, 0);
    const january = table.locator('tr[data-month="2026-01"]');
    await january.focus();
    await expect(chart.getByRole('button', { name: /gennaio 2026/ })).toHaveClass(/is-highlighted/);
    await expect(chart.locator('app-chart-tooltip')).toContainText('gennaio 2026');
    await expect(january).toHaveClass(/highlighted-month/);
    expect(requests).toBe(initialRequests);
    await january.dispatchEvent('pointerenter');
    await expect(chart.locator('app-chart-tooltip')).toContainText('gennaio 2026');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/month=2026-01/);
    await expect(january).toHaveAttribute('aria-current', 'date');
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({ path: `test-results/chart-linking-${width}.png` });
  });
}

test('wealth popup retains shared local month selection without dashboard navigation', async ({
  page,
}) => {
  await mockApi(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/overview?month=2026-10');
  await page
    .getByRole('button', { name: 'Dettaglio delle rilevazioni mensili', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  const row = dialog.locator('tr[data-month="2026-09"]');
  await row.click();
  await expect(row).toHaveAttribute('aria-current', 'date');
  await expect(
    dialog.locator('app-time-series-chart').getByRole('button', { name: /settembre 2026/ }),
  ).toHaveClass(/is-current/);
  await expect(page).toHaveURL(/month=2026-10/);
  await expect(dialog.locator('thead th')).toHaveCount(5);
});
