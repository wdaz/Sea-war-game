import { test, expect } from '@playwright/test';

// Guards scripts/serve.mjs. These properties are why the `serve` package was
// dropped, so they must not regress silently.
test.describe('Static server', () => {
  test('serves the app with correct MIME types', async ({ request }) => {
    const cases = [
      ['/', 'text/html'],
      ['/main.css', 'text/css'],
      ['/src/main.js', 'text/javascript'],
      ['/assets/fonts/fonts.css', 'text/css'],
      ['/assets/fonts/inter-latin-400-normal.woff2', 'font/woff2'],
    ];

    for (const [path, type] of cases) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
      expect(res.headers()['content-type'], path).toContain(type);
    }
  });

  test('refuses to serve hidden files or dependencies', async ({ request }) => {
    for (const path of ['/.git/config', '/.gitignore', '/node_modules/vitest/package.json']) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(404);
    }
  });

  // `/../package.json` is deliberately absent: normalisation collapses it to
  // `/package.json`, which is inside the root, so serving it is not an escape.
  // What must never succeed is reaching outside the root.
  test('rejects path traversal, encoded or not', async ({ request }) => {
    const escapes = [
      '/../../etc/passwd',
      '/%2e%2e%2f%2e%2e%2fetc/passwd',
      '/..%2f..%2fetc/passwd',
      '/....//package.json',
    ];

    for (const path of escapes) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(404);
    }
  });

  test('answers HEAD without a body and 404s unknown paths', async ({ request }) => {
    const head = await request.head('/main.css');
    expect(head.status()).toBe(200);
    expect(await head.body()).toHaveLength(0);

    const missing = await request.get('/does-not-exist.js');
    expect(missing.status()).toBe(404);
  });
});
