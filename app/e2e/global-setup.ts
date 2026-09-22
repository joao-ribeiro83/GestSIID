import { request } from '@playwright/test';

const WEB_PORT = 5174;
const ADM_STATE = 'e2e/.auth/adm.json';

/**
 * Logs in once as the fake ADM user and saves the session cookie, so most specs can start
 * already authenticated instead of each calling POST /auth/login (login-throttle.ts allows only
 * 5 attempts/minute per IP — every spec re-logging in would trip it well before the suite ends).
 */
export default async function globalSetup(): Promise<void> {
  const ctx = await request.newContext({ baseURL: `http://127.0.0.1:${WEB_PORT}` });
  // The webServer's url check only guarantees the API responds; give the web dev server (proxy
  // target) a moment too by retrying briefly instead of failing on the first connection race.
  let res;
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      res = await ctx.post('/api/auth/login', { data: { utilizador: 'DEV', password: 'dev' } });
      if (res.ok()) break;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!res?.ok()) throw new Error('global-setup: could not log in the fake ADM user');
  await ctx.storageState({ path: ADM_STATE });
  await ctx.dispose();
}
