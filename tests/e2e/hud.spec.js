import { test, expect } from '@playwright/test';

test.describe('HUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders coordinate rulers outside the board', async ({ page }) => {
    const panel = page.locator('.board-panel[data-side="player"]');
    await expect(panel.locator('.ruler--cols')).toHaveText('ABCDEFGHIJ');
    await expect(panel.locator('.ruler--rows')).toHaveText('12345678910');
    await expect(page.locator('[data-board="player"] .ruler--cols')).toHaveCount(0);
  });

  test('keeps exactly 100 cells per board', async ({ page }) => {
    await expect(page.locator('[data-board="player"] > .cell')).toHaveCount(100);
    await expect(page.locator('[data-board="ai"] > .cell')).toHaveCount(100);
  });

  test('shows placement board statuses', async ({ page }) => {
    await expect(page.locator('.board-panel[data-side="player"] .board-status__text')).toHaveText('AKTİV');
    await expect(page.locator('.board-panel[data-side="ai"] .board-status__text')).toHaveText('KİLİDLİ');
  });

  test('switches board statuses in battle', async ({ page }) => {
    await page.click('[data-action="auto-place"]');
    await expect(page.locator('.board-panel[data-side="player"] .board-status__text')).toHaveText('MÜDAFİƏ');
    await expect(page.locator('.board-panel[data-side="ai"] .board-status__text')).toHaveText('HƏDƏF AKTİVDİR');
  });

  test('hides the legend during placement and shows it in battle', async ({ page }) => {
    await expect(page.locator('.legend')).toBeHidden();
    await page.click('[data-action="auto-place"]');
    await expect(page.locator('.legend')).toBeVisible();
    await expect(page.locator('.legend__label')).toHaveText(['GƏMİ', 'VURULDU', 'YAN KEÇDİ']);
  });

  test('hides the operations bar in battle', async ({ page }) => {
    await expect(page.locator('[data-controls="placement"]')).toBeVisible();
    await page.click('[data-action="auto-place"]');
    await expect(page.locator('[data-controls="placement"]')).toBeHidden();
  });

  test('tracks the next ship and remaining fleet', async ({ page }) => {
    await expect(page.locator('.ops__size')).toHaveText('4 XANALI');
    await expect(page.locator('.ops__left')).toHaveText('· 10 GƏMİ QALIB');
    await page.click('[data-board="player"] [data-index="0"]');
    await expect(page.locator('.ops__size')).toHaveText('3 XANALI');
    await expect(page.locator('.ops__left')).toHaveText('· 9 GƏMİ QALIB');
  });

  test('reflects orientation in the chip', async ({ page }) => {
    await expect(page.locator('.chip__text')).toHaveText('ÜFÜQİ · R');
    await page.click('[data-action="rotate"]');
    await expect(page.locator('.chip__text')).toHaveText('ŞAQULİ · R');
  });

  test('marks an occupied cell with a state and an icon', async ({ page }) => {
    await page.click('[data-board="player"] [data-index="0"]');
    const cell = page.locator('[data-board="player"] [data-index="0"]');
    await expect(cell).toHaveClass(/ship/);
    await expect(cell.locator('.cell__marker use')).toHaveAttribute('href', '#i-ship');
  });

  test('shows the phase badge for each phase', async ({ page }) => {
    await expect(page.locator('.phase__label')).toHaveText('DONANMANI YERLƏŞDİR');
    await page.click('[data-action="auto-place"]');
    await expect(page.locator('.phase__label')).toHaveText('DÖYÜŞ');
  });
});
