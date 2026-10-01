import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { registerSecurityHeaders } from './security-headers.ts';

async function buildApp(cookieSecure: boolean) {
  const app = Fastify();
  registerSecurityHeaders(app, { COOKIE_SECURE: cookieSecure });
  app.get('/x', async () => ({ ok: true }));
  await app.ready();
  return app;
}

describe('registerSecurityHeaders', () => {
  it('sets the fixed CSP, nosniff and referrer-policy headers on every response', async () => {
    const app = await buildApp(false);
    const res = await app.inject({ method: 'GET', url: '/x' });

    expect(res.headers['content-security-policy']).toBe(
      "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; object-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'",
    );
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('same-origin');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(res.headers['cross-origin-resource-policy']).toBe('same-origin');
    expect(res.headers['origin-agent-cluster']).toBe('?1');
    expect(res.headers['x-permitted-cross-domain-policies']).toBe('none');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('omits Strict-Transport-Security when COOKIE_SECURE is false', async () => {
    const app = await buildApp(false);
    const res = await app.inject({ method: 'GET', url: '/x' });
    expect(res.headers['strict-transport-security']).toBeUndefined();
  });

  it('sets Strict-Transport-Security only when COOKIE_SECURE is true', async () => {
    const app = await buildApp(true);
    const res = await app.inject({ method: 'GET', url: '/x' });
    expect(res.headers['strict-transport-security']).toBe('max-age=31536000');
  });
});
