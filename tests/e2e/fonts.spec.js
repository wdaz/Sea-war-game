import { test, expect } from '@playwright/test';

// Every Azerbaijani letter the interface actually renders.
const AZ = 'ƏəĞğIıİiÖöŞşÜüÇç';

const FAMILIES = [
  { family: 'Saira Condensed', weight: 700 },
  { family: 'Inter', weight: 400 },
  { family: 'IBM Plex Mono', weight: 400 },
];

test.describe('Fonts', () => {
  test('makes no third-party requests', async ({ page }) => {
    const external = [];
    page.on('request', (r) => {
      const { host } = new URL(r.url());
      if (host && !host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
        external.push(r.url());
      }
    });

    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    expect(external).toEqual([]);
  });

  test('serves every family from assets/fonts', async ({ page }) => {
    const fontRequests = [];
    page.on('request', (r) => {
      if (r.resourceType() === 'font') fontRequests.push(new URL(r.url()).pathname);
    });

    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    expect(fontRequests.length).toBeGreaterThan(0);
    for (const path of fontRequests) {
      expect(path, path).toMatch(/^\/assets\/fonts\/.+\.woff2$/);
    }
  });

  test('every family covers the Azerbaijani alphabet', async ({ page }) => {
    await page.goto('/');

    const missing = await page.evaluate(async ({ AZ, FAMILIES }) => {
      for (const { family, weight } of FAMILIES) {
        await document.fonts.load(`${weight} 40px "${family}"`, AZ);
      }
      await document.fonts.ready;

      // A glyph absent from the family is drawn by the fallback, so the width
      // matches the fallback exactly. Two very different fallbacks are compared
      // so a coincidental match cannot pass.
      function width(fontFamily, ch, weight) {
        const span = document.createElement('span');
        span.textContent = ch;
        span.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;'
          + `font-size:80px;font-weight:${weight};font-family:${fontFamily}`;
        document.body.append(span);
        const value = span.getBoundingClientRect().width;
        span.remove();
        return value;
      }

      const gaps = [];
      for (const { family, weight } of FAMILIES) {
        for (const ch of AZ) {
          const viaMono = width(`"${family}", monospace`, ch, weight);
          const mono = width('monospace', ch, weight);
          const viaCursive = width(`"${family}", cursive`, ch, weight);
          const cursive = width('cursive', ch, weight);
          const absent = Math.abs(viaMono - mono) < 0.3 && Math.abs(viaCursive - cursive) < 0.3;
          if (absent) gaps.push(`${family}: ${ch}`);
        }
      }
      return gaps;
    }, { AZ, FAMILIES });

    expect(missing).toEqual([]);
  });

  test('renders headings in the display family', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const family = await page.locator('.board-panel__title')
      .first()
      .evaluate((node) => getComputedStyle(node).fontFamily);

    expect(family).toContain('Saira Condensed');
  });
});
