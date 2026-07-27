import { test, expect } from '@playwright/test';

test.describe('Scores and persistence', () => {
  test('scores start at 0', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-score="player"]')).toHaveText('0');
    await expect(page.locator('[data-score="ai"]')).toHaveText('0');
  });

  test('scores are visible after new game', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-action="auto-place"]');
    await page.click('[data-action="new-game"]');
    await expect(page.locator('[data-score="player"]')).toBeVisible();
    await expect(page.locator('[data-score="ai"]')).toBeVisible();
  });

  test('game returns to placement phase after new game', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-action="auto-place"]');
    await page.click('[data-action="new-game"]');
    await expect(page.locator('.game')).toHaveAttribute('data-phase', 'placement');
  });
});
