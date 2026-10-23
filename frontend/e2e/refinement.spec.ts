import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi, fixtures } from './mocked-api';

test('all list rows open reusable large editors, without intercepting delete', async ({ page }) => {
  await mockApi(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of [
    'accounts',
    'balances',
    'transactions',
    'categories',
    'investment-operations',
  ]) {
    await page.goto('/' + route);
    const row = page.locator('tbody tr').first();
    await row.locator('td').first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((el) => el.getBoundingClientRect().width)).toBe(800);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await row.focus();
    await expect(row).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await row.getByRole('button', { name: 'Elimina', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await expect(page.locator('dialog.form-dialog')).toHaveCount(0);
    await page.keyboard.press('Escape');
  }
});

test('instrument row opens summary and edit action keeps its independent behavior', async ({
  page,
}) => {
  await mockApi(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/portfolio');
  await page.locator('tbody tr td').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Riepilogo strumento' })).toBeVisible();
  await expect(dialog).toContainText('251,00');
  await expect(dialog).toContainText('Quantità netta registrata');
  await expect(dialog).toContainText('Operazioni registrate: 1');
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({ path: 'test-results/refinement-instrument.png' });
  await dialog.getByRole('button', { name: 'Modifica', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading')).toHaveText('Modifica strumento');
});

test('historical metric shows current month in progress and exact backend difference', async ({
  page,
}) => {
  const store = fixtures();
  store['transactions'].push({
    ...store['transactions'][0],
    id: 'historic',
    date: '2026-09-10',
    amount: '1000.00',
  });
  await mockApi(page, store);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/overview?month=2026-09');
  const metric = page.locator('app-dashboard-metric[kind="income"]');
  await metric.getByRole('button', { name: 'Confronta con oggi: Entrate', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('ottobre 2026');
  await expect(page.getByRole('dialog')).toContainText('1.800,00');
  await expect(page.getByRole('dialog')).toContainText('Il mese attuale è ancora in corso');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/refinement-comparison.png' });
  await page.getByRole('button', { name: 'Vai al mese attuale' }).click();
  await expect(metric.locator('app-month-comparison')).toHaveCount(0);
});

test('instrument summary fits narrow viewport with accessible internal scrolling', async ({
  page,
}) => {
  await mockApi(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/portfolio');
  await page.locator('tbody tr td').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('251,00');
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
  expect(await dialog.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  const content = dialog.locator('app-card > .card-body > .card-content');
  await content.focus();
  await page.keyboard.press('End');
  await expect.poll(() => content.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  const dividend = await dialog.getByText('Dividendi registrati', { exact: true }).boundingBox();
  const viewport = await content.boundingBox();
  expect(dividend!.y + dividend!.height).toBeLessThanOrEqual(viewport!.y + viewport!.height);
  await page.screenshot({ path: 'test-results/refinement-instrument-mobile.png' });
});
