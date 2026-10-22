import { test, expect } from '@playwright/test';
import { fixtures, mockApi } from './mocked-api';

test('table results enter progressively after both initial load and refresh', async ({ page }) => {
  const store = fixtures();
  for (let index = 0; index < 20; index++)
    store['accounts'].push({ id: `motion-${index}`, name: `Conto ${index}`, type: 'CASH' });
  await mockApi(page, store);
  let release: () => void = () => {};
  await page.route('**/api/accounts**', async (route) => {
    await new Promise<void>((resolve) => (release = resolve));
    await route.fallback();
  });
  await page.goto('/accounts');
  const table = page.locator('app-data-table');
  await expect(table).toHaveAttribute('aria-busy', 'true');

  for (let load = 0; load < 2; load++) {
    release();
    await expect(table).toHaveAttribute('aria-busy', 'false');
    const motion = await table.locator('tbody').evaluate((body) => {
      const animations = [...body.querySelectorAll('tr')].map((row) => row.getAnimations()[0]);
      const first = animations[0]!;
      first.pause();
      first.currentTime = 0;
      const startOpacity = getComputedStyle(body.querySelector('tr')!).opacity;
      first.currentTime = 480;
      const endOpacity = getComputedStyle(body.querySelector('tr')!).opacity;
      first.finish();
      return {
        timings: animations.map((animation) => {
          const timing = animation.effect!.getTiming();
          return { duration: timing.duration, delay: timing.delay };
        }),
        startOpacity,
        endOpacity,
      };
    });
    expect(motion.startOpacity).toBe('0');
    expect(motion.endOpacity).toBe('1');
    expect(motion.timings[0]).toEqual({ duration: 480, delay: 0 });
    expect(motion.timings[1]).toEqual({ duration: 480, delay: 28 });
    expect(motion.timings.at(-1)?.delay).toBeLessThanOrEqual(168);
    if (load === 0) {
      await table.getByRole('button', { name: 'Pagina successiva', exact: true }).click();
      await expect(table).toHaveAttribute('aria-busy', 'true');
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(
    await table
      .locator('tbody tr')
      .evaluateAll((rows) => rows.flatMap((row) => row.getAnimations()).length),
  ).toBe(0);
});

test('shared dialogs, selects and calendars animate consistently and respect reduced motion', async ({
  page,
}) => {
  await mockApi(page);
  await page.goto('/accounts');
  const trigger = page.getByRole('button', { name: 'Nuovo conto', exact: true });
  await trigger.click();
  const dialog = page.locator('app-dialog-frame dialog');
  await expect(dialog).toBeVisible();
  expect(
    await dialog.evaluate((element) => ({
      name: getComputedStyle(element).animationName,
      duration: getComputedStyle(element).animationDuration,
    })),
  ).toEqual({ name: 'ui-dialog-enter', duration: '0.48s' });
  await dialog.locator('ui-select button').click();
  const panel = page.locator('.ui-popover-panel');
  await expect(panel).toBeVisible();
  expect(await panel.evaluate((element) => getComputedStyle(element).animationDuration)).toBe(
    '0.36s',
  );
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await page.goto('/balances');
  await page.getByRole('button', { name: 'Apri calendario' }).click();
  await expect(panel).toBeVisible();
  expect(await panel.evaluate((element) => getComputedStyle(element).animationName)).toBe(
    'ui-panel-enter',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await panel.evaluate((element) => element.getAnimations().length)).toBe(0);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Registra saldo', exact: true }).first().click();
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(
    0,
  );
});
