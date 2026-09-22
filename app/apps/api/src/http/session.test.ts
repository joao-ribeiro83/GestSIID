import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { registerSession } from './session.ts';

const SECRET = 'x'.repeat(32);

async function buildApp(overrides: { COOKIE_SECURE?: boolean; BASE_PATH?: string } = {}) {
  const app = Fastify({ trustProxy: true });
  const store = await registerSession(app, {
    SESSION_SECRET: SECRET,
    COOKIE_SECURE: overrides.COOKIE_SECURE ?? false,
    BASE_PATH: overrides.BASE_PATH ?? '',
  });

  // Routes always live under BASE_PATH in the real app (§2), and a cookie whose `path` is
  // BASE_PATH is only ever sent back for requests under it — so tests must mount here too.
  const basePath = overrides.BASE_PATH ?? '';
  app.post(`${basePath}/login`, async (request) => {
    request.session.set('user', { username: 'JRIBEIRO' });
    return { ok: true };
  });
  app.get(`${basePath}/me`, async (request) => ({ user: request.session.get('user') ?? null }));
  app.get(`${basePath}/anonymous`, async () => ({ ok: true }));

  await app.ready();
  return { app, store };
}

function cookieHeaderFrom(setCookie: string | string[] | undefined): string {
  const raw = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return raw?.split(';')[0] ?? '';
}

describe('registerSession', () => {
  let app: FastifyInstance;

  afterEach(async () => {
    await app.close();
  });

  it('sets an httpOnly, SameSite=Lax gestsiid.sid cookie on the path that touches the session', async () => {
    ({ app } = await buildApp());
    const res = await app.inject({ method: 'POST', url: '/login' });

    const setCookie = Array.isArray(res.headers['set-cookie'])
      ? res.headers['set-cookie'][0]
      : res.headers['set-cookie'];
    expect(setCookie).toContain('gestsiid.sid=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).not.toContain('Secure');
  });

  it('sets Secure on the session cookie when COOKIE_SECURE is true (behind TLS-terminating nginx, D-09)', async () => {
    ({ app } = await buildApp({ COOKIE_SECURE: true }));
    // trustProxy + X-Forwarded-Proto simulates nginx terminating TLS in front (D-09); over a
    // genuinely insecure connection @fastify/session intentionally skips a `Secure` cookie
    // rather than send one the browser would just drop.
    const res = await app.inject({
      method: 'POST',
      url: '/login',
      headers: { 'x-forwarded-proto': 'https' },
    });
    const setCookie = Array.isArray(res.headers['set-cookie'])
      ? res.headers['set-cookie'][0]
      : res.headers['set-cookie'];
    expect(setCookie).toContain('Secure');
  });

  it('round-trips session data through the custom store across two requests', async () => {
    ({ app } = await buildApp());
    const loginRes = await app.inject({ method: 'POST', url: '/login' });
    const cookie = cookieHeaderFrom(loginRes.headers['set-cookie']);

    const meRes = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });

    expect(meRes.json()).toEqual({ user: { username: 'JRIBEIRO' } });
  });

  it('does not set a cookie for a request that never touches the session (saveUninitialized: false)', async () => {
    ({ app } = await buildApp());
    const res = await app.inject({ method: 'GET', url: '/anonymous' });
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('scopes the cookie path to BASE_PATH when set, or / otherwise', async () => {
    ({ app } = await buildApp({ BASE_PATH: '/gestsiid' }));
    const res = await app.inject({ method: 'POST', url: '/gestsiid/login' });
    const setCookie = Array.isArray(res.headers['set-cookie'])
      ? res.headers['set-cookie'][0]
      : res.headers['set-cookie'];
    expect(setCookie).toContain('Path=/gestsiid');
  });
});
