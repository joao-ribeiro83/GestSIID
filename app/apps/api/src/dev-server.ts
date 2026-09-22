import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.ts';

/**
 * Dev-only server without Oracle: the `/dev/datablock` in-memory demo API, plus the built SPA
 * when `apps/web/dist` exists (Playwright builds it first). With `vite` running instead, its
 * `/api` proxy points here. Never used by the Docker image (`server.ts` is).
 */

const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'web', 'dist');
const port = Number(process.env['DEV_API_PORT'] ?? 3200);

const app = await buildApp({
  config: {
    COOKIE_SECURE: false,
    TRUST_PROXY: false,
    BASE_PATH: '',
    SESSION_SECRET: 'dev-server-only-not-a-secret-0000',
  },
  ambiente: 'DEV',
  checkDb: async () => 0,
  distDir: existsSync(join(distDir, 'index.html')) ? distDir : null,
  devMocks: true,
});

await app.listen({ port, host: '127.0.0.1' });
console.log(`dev API (in-memory demo) on http://127.0.0.1:${port}`);
