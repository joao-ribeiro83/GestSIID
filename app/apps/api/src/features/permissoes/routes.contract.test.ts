import oracledb from 'oracledb';
import Fastify, { type FastifyInstance } from 'fastify';
import { permissoes } from '@gestsiid/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildPoolAttrs, type DbPool } from '../../db/oracle.ts';
import { registerErrorHandler } from '../../http/errors.ts';
import { oracleStore } from '../../lib/crud.ts';
import { readOnlyPool } from '../../test/read-only-db.ts';
import { oraclePermissoesRepo } from './repo.ts';
import { registerPermissoesRoutes } from './routes.ts';

/**
 * Contract test against the TEST schema (TEST_STRATEGY.md, CLAUDE.md HARD RULE): reaches Oracle
 * only through readOnlyPool and calls GET routes only. Every write path (add/remove, nova,
 * alterar, copiar) is tested on the in-memory repo in routes.test.ts and on a fake connection in
 * repo.test.ts. Skipped unless DB_CONNECT_STRING is set. The session is a fake ADM (no login).
 */

const env = process.env;
const DAY_MS = 86_400_000;
const COLUNAS = [
  'MODELO_ID',
  'USERNAME',
  'NOME',
  'UNIDADE_NEGOCIO_RF',
  'UNIDADE_NEGOCIO',
  'TIPO_PERMISSAO_RF',
  'TIPO_PERMISSAO',
  'DATA_INICIO',
  'DATA_FIM',
  'CRIADO_POR',
  'DATA_CRIACAO',
  'ACTUALIZADO_POR',
  'DATA_ACTUALIZACAO',
];

interface ListRow {
  MODELO_ID: string;
  USERNAME: string;
  UNIDADE_NEGOCIO_RF: string;
  TIPO_PERMISSAO_RF: number;
  DATA_INICIO: string;
  DATA_FIM: string | null;
}

describe.skipIf(!env['DB_CONNECT_STRING'])('permissoes — TEST schema (read-only)', { timeout: 30_000 }, () => {
  let realPool: oracledb.Pool;
  let app: FastifyInstance;

  beforeAll(async () => {
    if (env['ORACLE_CLIENT_LIB_DIR']) oracledb.initOracleClient({ libDir: env['ORACLE_CLIENT_LIB_DIR'] });
    else oracledb.initOracleClient();
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    realPool = await oracledb.createPool(
      buildPoolAttrs({
        DB_USER: env['DB_USER'] ?? '',
        DB_PASSWORD: env['DB_PASSWORD'] ?? '',
        DB_CONNECT_STRING: env['DB_CONNECT_STRING'] ?? '',
        DB_SCHEMA: env['DB_SCHEMA'] ?? '',
        DB_POOL_SIZE: 2,
      }),
    );
    const pool = readOnlyPool(realPool as unknown as DbPool);
    const t = 30_000;
    app = Fastify();
    registerErrorHandler(app);
    app.decorateRequest('session', null as never);
    app.addHook('onRequest', async (req) => {
      (req as { session: unknown }).session = { user: { username: 'CONTRACT_TEST', role: 'ADM' } };
    });
    registerPermissoesRoutes(app, {
      store: oracleStore(pool, permissoes, t),
      repo: oraclePermissoesRepo(pool, t),
    });
    await app.ready();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await realPool?.close(0);
  }, 60_000);

  /** First row valid today; the scope for the panel routes. No row = the comparison cannot run = fail. */
  async function primeiraValida(): Promise<ListRow> {
    const r = await app.inject({ url: '/api/permissoes?preset=validas&size=1' });
    expect(r.statusCode).toBe(200);
    const row = (r.json().rows as ListRow[])[0];
    expect(row, 'no permission valid today in the TEST schema: cannot run the panel checks').toBeDefined();
    return row!;
  }

  it('GET /api/permissoes returns the paged envelope with the view columns', async () => {
    const r = await app.inject({ url: '/api/permissoes' });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ page: 1, size: 50 });
    const rows = r.json().rows as Record<string, unknown>[];
    expect(rows.length).toBeGreaterThan(0);
    for (const c of COLUNAS) expect(rows[0]).toHaveProperty(c);
  });

  it('GET /api/permissoes?preset=validas returns only rows valid today, never more than "Todos"', async () => {
    const todas = (await app.inject({ url: '/api/permissoes' })).json().total as number;
    const r = await app.inject({ url: '/api/permissoes?preset=validas&size=200' });
    expect(r.statusCode).toBe(200);
    expect(r.json().total).toBeLessThanOrEqual(todas);
    // One day of slack each way: SYSDATE is the DB clock, not this machine's.
    const agora = Date.now();
    for (const row of r.json().rows as ListRow[]) {
      expect(Date.parse(row.DATA_INICIO)).toBeLessThanOrEqual(agora + DAY_MS);
      if (row.DATA_FIM !== null) expect(Date.parse(row.DATA_FIM)).toBeGreaterThanOrEqual(agora - DAY_MS);
    }
  });

  it('GET por-utilizador returns { com, sem } for the scope of a valid row, and that row is in com', async () => {
    const p = await primeiraValida();
    const r = await app.inject({
      url: `/api/permissoes/por-utilizador/${encodeURIComponent(p.USERNAME)}?un=${encodeURIComponent(p.UNIDADE_NEGOCIO_RF)}&tipo=${p.TIPO_PERMISSAO_RF}`,
    });
    expect(r.statusCode).toBe(200);
    const { com, sem } = r.json() as { com: ListRow[]; sem: { MODELO_ID: string; USERNAME: string }[] };
    expect(Array.isArray(com)).toBe(true);
    expect(Array.isArray(sem)).toBe(true);
    for (const c of com) expect(c).toMatchObject({ USERNAME: p.USERNAME, UNIDADE_NEGOCIO_RF: p.UNIDADE_NEGOCIO_RF });
    expect(com.map((c) => c.MODELO_ID)).toContain(p.MODELO_ID);
    const comIds = new Set(com.map((c) => c.MODELO_ID));
    for (const s of sem) expect(comIds.has(s.MODELO_ID)).toBe(false);
  });

  it('GET por-modelo returns { com, sem } for the scope of a valid row, and that row is in com', async () => {
    const p = await primeiraValida();
    const r = await app.inject({
      url: `/api/permissoes/por-modelo/${encodeURIComponent(p.MODELO_ID)}?un=${encodeURIComponent(p.UNIDADE_NEGOCIO_RF)}&tipo=${p.TIPO_PERMISSAO_RF}`,
    });
    expect(r.statusCode).toBe(200);
    const { com, sem } = r.json() as { com: ListRow[]; sem: { MODELO_ID: string; USERNAME: string }[] };
    expect(Array.isArray(com)).toBe(true);
    expect(Array.isArray(sem)).toBe(true);
    for (const c of com) expect(c).toMatchObject({ MODELO_ID: p.MODELO_ID, UNIDADE_NEGOCIO_RF: p.UNIDADE_NEGOCIO_RF });
    expect(com.map((c) => c.USERNAME)).toContain(p.USERNAME);
    const comUsers = new Set(com.map((c) => c.USERNAME));
    for (const s of sem) expect(comUsers.has(s.USERNAME)).toBe(false);
  });

  it('GET utilizadores / modelos read the LOV sources; a valid row user and model are listed', async () => {
    const p = await primeiraValida();
    const us = await app.inject({ url: `/api/permissoes/utilizadores?un=${encodeURIComponent(p.UNIDADE_NEGOCIO_RF)}` });
    expect(us.statusCode).toBe(200);
    const rows = us.json().rows as { USERNAME: string; UNIDADE_NEGOCIO_RF: string }[];
    for (const u of rows) expect(u.UNIDADE_NEGOCIO_RF).toBe(p.UNIDADE_NEGOCIO_RF);
    expect(rows.map((u) => u.USERNAME)).toContain(p.USERNAME);
    const ms = await app.inject({ url: '/api/permissoes/modelos' });
    expect(ms.statusCode).toBe(200);
    expect((ms.json().rows as { ID: string }[]).length).toBeGreaterThan(0);
  });
});
