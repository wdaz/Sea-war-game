import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    // Port is passed explicitly so the server never drifts to the next free
    // one: Playwright waits on exactly this port and would otherwise time out.
    command: 'npm run serve -- --port 3000',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
