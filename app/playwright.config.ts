import { defineConfig } from '@playwright/test';

// Smoke specs run against the Vite dev server + the in-memory demo API (apps/api/src/dev-server.ts),
// so they need no Oracle. Specs that need the TEST schema self-skip without DB_CONNECT_STRING.
const API_PORT = 3200;
const WEB_PORT = 5174;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1, // one shared in-memory store: specs that write must not race
  reporter: 'list',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: `http://127.0.0.1:${WEB_PORT}`,
  },
  webServer: [
    {
      command: 'node --conditions=development apps/api/src/dev-server.ts',
      url: `http://127.0.0.1:${API_PORT}/api/demo-impressoras?size=1`,
      env: { DEV_API_PORT: String(API_PORT) },
      reuseExistingServer: !process.env['CI'],
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort --host 127.0.0.1`,
      cwd: './apps/web',
      url: `http://127.0.0.1:${WEB_PORT}/dev/datablock`,
      env: { DEV_API_PORT: String(API_PORT) },
      reuseExistingServer: !process.env['CI'],
    },
  ],
});
