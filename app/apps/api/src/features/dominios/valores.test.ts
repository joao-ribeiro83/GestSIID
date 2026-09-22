import Fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';
import type { DbConnection, DbPool } from '../../db/oracle.ts';
import { registerErrorHandler } from '../../http/errors.ts';
import { registerDominiosRoutes } from './valores.ts';

function fakePool(rows: Record<string, unknown>[]) {
  const execute = vi.fn().mockResolvedValue({ rows });
  const conn = { execute, close: vi.fn().mockResolvedValue(undefined) } as unknown as DbConnection;
  const pool: DbPool = { getConnection: vi.fn().mockResolvedValue(conn) };
  return { pool, execute };
}

async function appWith(pool: DbPool) {
  const app = Fastify();
  registerErrorHandler(app);
  app.decorateRequest('currentUser', { getter: () => ({ username: 'JOAO', role: 'ADM' }) });
  registerDominiosRoutes(app, { pool, callTimeoutMs: 1000 });
  await app.ready();
  return app;
}

describe('GET /api/dominios/:dominioId/valores', () => {
  it('returns the rows the query gives, ordered by PRIORIDADE, CHAVE', async () => {
    const { pool, execute } = fakePool([{ CHAVE: 'S', DESIGNACAO: 'Sim', PRIORIDADE: 0 }]);
    const app = await appWith(pool);

    const r = await app.inject({ url: '/api/dominios/BINARIO/valores' });

    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ rows: [{ CHAVE: 'S', DESIGNACAO: 'Sim', PRIORIDADE: 0 }] });
    const [sql, binds] = execute.mock.calls[0]!;
    expect(sql).toMatch(/ORDER BY PRIORIDADE, CHAVE/);
    expect(sql).toMatch(/FROM CFG_VALORES_DOMINIO/);
    expect(binds).toEqual({ id: 'BINARIO' });
  });

  it('caches a domain for 60s: a second request within the window does not query again', async () => {
    const { pool, execute } = fakePool([{ CHAVE: 'S', DESIGNACAO: 'Sim', PRIORIDADE: 0 }]);
    const app = await appWith(pool);

    await app.inject({ url: '/api/dominios/BINARIO/valores' });
    await app.inject({ url: '/api/dominios/BINARIO/valores' });

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('a different domain id gets its own cache entry (its own query)', async () => {
    const { pool, execute } = fakePool([{ CHAVE: 'PXLCOLOR', DESIGNACAO: 'HP color', PRIORIDADE: 0 }]);
    const app = await appWith(pool);

    await app.inject({ url: '/api/dominios/BINARIO/valores' });
    await app.inject({ url: '/api/dominios/GSDEVICES/valores' });

    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute.mock.calls[1]![1]).toEqual({ id: 'GSDEVICES' });
  });

  it('requires a logged-in session', async () => {
    const { pool } = fakePool([]);
    const app = Fastify();
    registerErrorHandler(app);
    app.decorateRequest('currentUser', { getter: () => undefined });
    registerDominiosRoutes(app, { pool, callTimeoutMs: 1000 });
    await app.ready();

    const r = await app.inject({ url: '/api/dominios/BINARIO/valores' });
    expect(r.statusCode).toBe(401);
  });
});
