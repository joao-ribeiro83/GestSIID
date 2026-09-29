import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { registerHealthRoute } from './routes.ts';

async function buildApp(checkDb: () => Promise<number>) {
  const app = Fastify();
  registerHealthRoute(app, { ambiente: 'GADOR_TESTES', checkDb });
  await app.ready();
  return app;
}

describe('GET /api/health', () => {
  it('returns 200 with ambiente and db latency when SELECT 1 FROM DUAL succeeds', async () => {
    const app = await buildApp(async () => 12);
    const res = await app.inject({ method: 'GET', url: '/api/health' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      ok: true,
      ambiente: 'GADOR_TESTES',
      db: { ok: true, latencyMs: 12 },
    });
  });

  it('returns 503 with db.ok false when the database check fails', async () => {
    const app = await buildApp(async () => {
      throw new Error('ORA-03113: end-of-file on communication channel');
    });
    const res = await app.inject({ method: 'GET', url: '/api/health' });

    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({
      ok: false,
      ambiente: 'GADOR_TESTES',
      db: { ok: false },
    });
  });

  it('is public: no session or auth needed to reach it', async () => {
    const app = await buildApp(async () => 1);
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(403);
  });

  it('mounts under BASE_PATH when configured (D-09)', async () => {
    const app = Fastify();
    registerHealthRoute(app, { ambiente: 'GADOR_TESTES', checkDb: async () => 5, basePath: '/gestsiid' });
    await app.ready();

    const res = await app.inject({ method: 'GET', url: '/gestsiid/api/health' });
    expect(res.statusCode).toBe(200);
  });
});
