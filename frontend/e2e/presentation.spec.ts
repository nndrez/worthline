import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi } from './mocked-api';

test('page and editor headings omit repeated descriptions across all modules', async ({ page }) => {
  await mockApi(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [route, action] of [
    ['accounts', 'Nuovo conto'],
    ['balances', 'Registra saldo'],
    ['transactions', 'Nuovo movimento'],
    ['categories', 'Nuova categoria'],
    ['portfolio', 'Nuovo strumento'],
    ['investment-operations', 'Nuova operazione'],
  ]) {
    await page.goto('/' + route);
    await expect(page.locator('app-page-header p')).toHaveCount(0);
    await page.getByRole('button', { name: action, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('header p, header .eyebrow, .field-hint')).toHaveCount(0);
    await page.keyboard.press('Escape');
  }
  await page.goto('/overview?month=2026-10');
  await expect(page.locator('app-current-situation h2')).toBeVisible();
  await expect(page.locator('app-loading-state')).toHaveCount(0);
  await expect(
    page.locator('.situation-heading p, .section-heading p, .chart-caption span'),
  ).toHaveCount(0);
  await page.screenshot({ path: 'test-results/presentation-dashboard.png', fullPage: true });
});

for (const width of [1440, 390]) {
  test(`shared popup table headers and scrollbars remain minimal and accessible at ${width}px`, async ({
    page,
  }) => {
    await mockApi(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/overview?month=2026-10');
    await page
      .locator('app-dashboard-metric[kind="income"]')
      .getByRole('button', { name: 'Andamento annuale dei movimenti: Entrate', exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('header p, header .eyebrow')).toHaveCount(0);
    const table = dialog.locator('app-data-table');
    await expect(table).not.toHaveClass(/has-plain-header/);
    const appearance = await table.evaluate((element) => {
      const head = element.querySelector('th')!;
      const viewport = element.querySelector('.table-viewport')!;
      return {
        background: getComputedStyle(head).backgroundColor,
        transform: getComputedStyle(head).textTransform,
        position: getComputedStyle(head).position,
        scrollbar: getComputedStyle(viewport).scrollbarWidth,
        gutter: getComputedStyle(viewport).scrollbarGutter,
        color: getComputedStyle(viewport).scrollbarColor,
      };
    });
    expect(appearance).toMatchObject({
      transform: 'none',
      position: 'sticky',
      scrollbar: 'thin',
      gutter: 'auto',
    });
    expect(appearance.color).toContain('0.3');
    const scroll = table.locator('.table-viewport');
    await scroll.focus();
    await page.keyboard.press('End');
    await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({ path: `test-results/presentation-popup-${width}.png`, fullPage: true });
  });
}
