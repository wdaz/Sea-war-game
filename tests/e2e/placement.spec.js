import { test, expect } from '@playwright/test';

test.describe('Placement phase', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows placement controls on load', async ({ page }) => {
    await expect(page.locator('[data-controls="placement"]')).toBeVisible();
  });

  test('auto-place moves to battle phase', async ({ page }) => {
    await page.click('[data-action="auto-place"]');
    await expect(page.locator('.game')).toHaveAttribute('data-phase', 'battle');
  });

  test('rotate button updates message to Şaquli', async ({ page }) => {
    await page.click('[data-action="rotate"]');
    await expect(page.locator('[data-message]')).toContainText('Şaquli');
  });

  test('R key rotates direction', async ({ page }) => {
    await page.keyboard.press('r');
    await expect(page.locator('[data-message]')).toContainText('Şaquli');
  });

  test('clicking valid cell places ship and shows it', async ({ page }) => {
    await page.click('[data-board="player"] [data-index="0"]');
    await expect(
      page.locator('[data-board="player"] [data-index="0"]')
    ).toHaveClass(/ship/);
  });

  test('placement controls hidden in battle phase', async ({ page }) => {
    await page.click('[data-action="auto-place"]');
    await expect(page.locator('[data-controls="placement"]')).toBeHidden();
  });
});