import { test, expect } from '@playwright/test';

test.describe('Battle phase', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('[data-action="auto-place"]');
  });

  test('clicking AI board cell marks it as hit or miss', async ({ page }) => {
    await page.click('[data-board="ai"] [data-index="0"]');
    await expect(
      page.locator('[data-board="ai"] [data-index="0"]')
    ).toHaveClass(/hit|miss/);
  });

  test('clicking same AI cell twice shows already-attacked message', async ({ page }) => {
    await page.click('[data-board="ai"] [data-index="0"]');
    await page.click('[data-board="ai"] [data-index="0"]');
    await expect(page.locator('[data-message]')).toContainText('artıq hücum edilib');
  });

  test('new-game button resets to placement phase', async ({ page }) => {
    await page.click('[data-action="new-game"]');
    await expect(page.locator('.game')).toHaveAttribute('data-phase', 'placement');
  });

  test('player board also receives AI attack after player attacks', async ({ page }) => {
    await page.click('[data-board="ai"] [data-index="0"]');
    const attacked = await page.locator('[data-board="player"] .hit, [data-board="player"] .miss').count();
    expect(attacked).toBeGreaterThanOrEqual(1);
  });
});