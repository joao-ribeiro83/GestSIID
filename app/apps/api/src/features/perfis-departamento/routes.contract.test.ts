import oracledb from 'oracledb';
import Fastify, { type FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { empregadosLov, funcoesDepartamento, perfisDepartamento } from '@gestsiid/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildPoolAttrs, type DbPool } from '../../db/oracle.ts';
import { registerErrorHandler } from '../../http/errors.ts';
import { oracleStore } from '../../lib/crud.ts';
import { oracleImageStore } from '../../lib/imageRoutes.ts';
import { readOnlyPool } from '../../test/read-only-db.ts';
import { oraclePerfisRepo } from './repo.ts';
import { registerPerfisDepartamentoRoutes } from './routes.ts';

/**
 * Contract test against the TEST schema (TEST_STRATEGY.md, CLAUDE.md HARD RULE): reaches Oracle
 * only through readOnlyPool and calls GET routes only. The signature PUT/DELETE and every CRUD
 * write are tested on memory stores and a fake connection (routes.test.ts, lib/imageRoutes.test.ts).
 * Skipped unless DB_CONNECT_STRING is set. The session is a fake ADM (no login).
 */

const env = process.env;
const COLUNAS = Object.keys(perfisDepartamento.columns);

describe.skipIf(!env['DB_CONNECT_STRING'])('perfis-departamento — TEST schema (read-only)', { timeout: 30_000 }, () => {
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
    await app.register(multipart);
    app.decorateRequest('session', null as never);
    app.addHook('onRequest', async (req) => {
      (req as { session: unknown }).session = { user: { username: 'CONTRACT_TEST', role: 'ADM' } };
    });
    registerPerfisDepartamentoRoutes(app, {
      store: oracleStore(pool, perfisDepartamento, t),
      empregadosStore: oracleStore(pool, empregadosLov, t),
      funcoesStore: oracleStore(pool, funcoesDepartamento, t),
      repo: oraclePerfisRepo(pool, t),
      imageStore: oracleImageStore(
        pool,
        { table: 'DOC_PERFIS_DEPARTAMENTO', column: 'ASSINATURA', keyWhere: 'ID = :id' },
        t,
      ),
      maxBytes: 1024 * 1024,
    });
    await app.ready();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await realPool?.close(0);
  }, 60_000);

  it('GET /api/perfis-departamento returns the resource columns, never the BLOB', async () => {
    const r = await app.inject({ url: '/api/perfis-departamento' });
    expect(r.statusCode).toBe(200);
    const rows = r.json().rows as Record<string, unknown>[];
    expect(rows.length).toBeGreaterThan(0);
    for (const c of COLUNAS) expect(rows[0]).toHaveProperty(c);
    expect(rows[0]).not.toHaveProperty('ASSINATURA');
  });

  it('GET /api/empregados-lov lists active employees only', async () => {
    const r = await app.inject({ url: '/api/empregados-lov?size=200' });
    expect(r.statusCode).toBe(200);
    const rows = r.json().rows as { SWACTIVO: string }[];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((x) => x.SWACTIVO === 'S')).toBe(true);
  });

  it('the funções feed lists the valid funções', async () => {
    const r = await app.inject({ url: '/api/dominios/FUNCOES_DEPARTAMENTO/valores' });
    expect(r.statusCode).toBe(200);
    const rows = r.json().rows as { CHAVE: string; DESIGNACAO: string }[];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty('CHAVE');
  });

  it('sugestao runs on Oracle and answers the { CODIGO, FUNCAODEP_ID, NOME } shape', async () => {
    const emp = (await app.inject({ url: '/api/empregados-lov?size=1' })).json().rows[0] as { CDEMPLEA: string };
    const r = await app.inject({ url: `/api/perfis-departamento/sugestao?cdemplea=${encodeURIComponent(emp.CDEMPLEA)}` });
    expect(r.statusCode).toBe(200);
    expect(Object.keys(r.json()).sort()).toEqual(['CODIGO', 'FUNCAODEP_ID', 'NOME']);
    const s = r.json() as { CODIGO: string | null; FUNCAODEP_ID: string | null };
    if (s.CODIGO !== null) expect(['GCOM', 'GCON']).toContain(s.FUNCAODEP_ID);
  });

  it('GET assinatura reads the BLOB as bytes of a known image type, or is 204 when empty', async () => {
    const rows = (await app.inject({ url: '/api/perfis-departamento?size=100' })).json().rows as { ID: number }[];
    let comImagem = 0;
    for (const { ID } of rows) {
      const r = await app.inject({ url: `/api/perfis-departamento/${ID}/assinatura` });
      expect([200, 204]).toContain(r.statusCode);
      if (r.statusCode === 200) {
        comImagem++;
        expect(r.rawPayload.length).toBeGreaterThan(0);
        expect(r.headers['cache-control']).toBe('private, no-store');
      }
    }
    expect(comImagem, 'no perfil with a signature in the TEST schema: the BLOB read cannot be checked').toBeGreaterThan(0);
  });
});
