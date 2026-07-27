import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('labels boards as groups, never grids', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-board="player"]')).toHaveAttribute('role', 'group');
    await expect(page.locator('[data-board="player"]')).toHaveAttribute('aria-label', 'SƏNİN DONANMAN');
    await expect(page.locator('[data-board="ai"]')).toHaveAttribute('aria-label', 'RƏQİB SULARI');
    await expect(page.locator('[role="grid"]')).toHaveCount(0);
  });

  test('names each cell by coordinate and state', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-board="player"] [data-index="0"]'))
      .toHaveAttribute('aria-label', 'A1 · boş');
    await expect(page.locator('[data-board="player"] [data-index="99"]'))
      .toHaveAttribute('aria-label', 'J10 · boş');

    await page.click('[data-board="player"] [data-index="0"]');
    await expect(page.locator('[data-board="player"] [data-index="0"]'))
      .toHaveAttribute('aria-label', 'A1 · gəmi');
  });

  test('exposes a single tab stop per interactive board', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-board="player"] [tabindex="0"]')).toHaveCount(1);
    await expect(page.locator('[data-board="ai"] [tabindex]')).toHaveCount(0);

    await page.click('[data-action="auto-place"]');
    await expect(page.locator('[data-board="ai"] [tabindex="0"]')).toHaveCount(1);
    await expect(page.locator('[data-board="player"] [tabindex]')).toHaveCount(0);
  });

  test('allows attacking with the keyboard', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-action="auto-place"]');

    await page.locator('[data-board="ai"] [data-index="0"]').focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    await expect(page.locator('[data-board="ai"] [data-index="1"]')).toHaveClass(/hit|miss/);
  });

  test('flags spent cells without disabling them', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-action="auto-place"]');
    await page.click('[data-board="ai"] [data-index="0"]');

    const cell = page.locator('[data-board="ai"] [data-index="0"]');
    await expect(cell).toHaveAttribute('data-spent', 'true');
    // Never aria-disabled: a second click is a real action that reports a message.
    expect(await cell.getAttribute('aria-disabled')).toBeNull();
    await cell.click();
    await expect(page.locator('[data-message]')).toContainText('artıq hücum edilib');
  });

  test('announces the message region politely', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-message]')).toHaveAttribute('aria-live', 'polite');
  });

  test('keeps decorative icons out of the accessibility tree', async ({ page }) => {
    await page.goto('/');
    const marked = await page.locator('svg').count();
    const hidden = await page.locator('svg[aria-hidden="true"]').count();
    expect(hidden).toBe(marked);
  });

  test('disables animation under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.click('[data-action="auto-place"]');
    const duration = await page.locator('[data-board="player"] [data-index="0"]')
      .evaluate((node) => getComputedStyle(node).transitionDuration);
    expect(duration).toBe('0s');
  });
});
