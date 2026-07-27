import { test, expect } from '@playwright/test';

test.describe('Gameover and scores', () => {
  test('scores start at 0', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-score="player"]')).toHaveText('0');
    await expect(page.locator('[data-score="ai"]')).toHaveText('0');
  });

  test('sinking all AI ships ends the game and increments the player score', async ({ page }) => {
    const placements = [
      0.001, 0.1, 0.201, 0.1, 0.251, 0.1, 0.401, 0.1, 0.441, 0.1,
      0.481, 0.1, 0.091, 0.1, 0.291, 0.1, 0.601, 0.1, 0.661, 0.1,
      0.001, 0.1, 0.201, 0.1, 0.251, 0.1, 0.401, 0.1, 0.441, 0.1,
      0.481, 0.1, 0.091, 0.1, 0.291, 0.1, 0.601, 0.1, 0.661, 0.1,
    ];
    const aiMisses = Array.from({ length: 30 }, () => 0.999);

    await page.addInitScript((randomValues) => {
      let index = 0;
      const originalRandom = Math.random;
      Math.random = () => randomValues[index++] ?? originalRandom();
    }, [...placements, ...aiMisses]);

    await page.goto('/');
    await page.click('[data-action="auto-place"]');

    for (const cell of [0, 1, 2, 3, 20, 21, 22, 25, 26, 27, 40, 41, 44, 45, 48, 49, 9, 29, 60, 66]) {
      await page.click(`[data-board="ai"] [data-index="${cell}"]`);
    }

    await expect(page.locator('.game')).toHaveAttribute('data-phase', 'gameover');
    await expect(page.locator('[data-score="player"]')).toHaveText('1');
    await expect(page.locator('[data-message]')).toContainText('qalibisiniz');
  });

  test('new game returns to placement phase after reset', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-action="auto-place"]');
    await page.click('[data-action="new-game"]');
    await expect(page.locator('[data-score="player"]')).toBeVisible();
    await expect(page.locator('[data-score="ai"]')).toBeVisible();
    await expect(page.locator('.game')).toHaveAttribute('data-phase', 'placement');
  });
});
