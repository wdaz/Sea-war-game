import { test, expect } from '@playwright/test';

async function horizontalOverflow(page) {
  return page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth);
}

test.describe('Responsive layout', () => {
  for (const [label, width, height] of [['desktop', 1440, 900], ['tablet', 800, 900], ['mobile', 390, 844]]) {
    test(`has no horizontal overflow at ${label} width`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      expect(await horizontalOverflow(page)).toBe(false);
      await page.click('[data-action="auto-place"]');
      expect(await horizontalOverflow(page)).toBe(false);
    });
  }

  test('places boards side by side on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const player = await page.locator('.board-panel[data-side="player"]').boundingBox();
    const ai = await page.locator('.board-panel[data-side="ai"]').boundingBox();
    expect(ai.x).toBeGreaterThan(player.x + player.width - 1);
  });

  test('stacks boards with the AI board on top on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const player = await page.locator('.board-panel[data-side="player"]').boundingBox();
    const ai = await page.locator('.board-panel[data-side="ai"]').boundingBox();
    expect(ai.y).toBeLessThan(player.y);
  });

  test('keeps the grid square at every width', async ({ page }) => {
    for (const width of [1440, 800, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const box = await page.locator('[data-board="player"]').boundingBox();
      expect(Math.abs(box.width - box.height), `width ${width}`).toBeLessThan(1);
    }
  });
});
