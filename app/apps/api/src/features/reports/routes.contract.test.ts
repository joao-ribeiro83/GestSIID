import oracledb from 'oracledb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.ts';
import { buildPoolAttrs, type DbPool } from '../../db/oracle.ts';
import { oracleAuthRepo } from '../auth/repo.ts';
import { readOnlyPool } from '../../test/read-only-db.ts';

/**
 * Contract test against the TEST schema (TEST_STRATEGY.md, CLAUDE.md HARD RULE): reaches Oracle
 * only through readOnlyPool, so only GET is exercised — POST/PUT/DELETE (including the fixed
 * parameter seed, the NOME lock and the N_PARAMETROS check) are tested with memoryStore in
 * routes.test.ts. Skipped unless DB_CONNECT_STRING is set; the authenticated cases also need
 * GESTSIID_TEST_USER / GESTSIID_TEST_PASSWORD.
 */

const env = process.env;
const TEST_USER = env['GESTSIID_TEST_USER'];
const TEST_PASSWORD = env['GESTSIID_TEST_PASSWORD'];

function cookieOf(res: { headers: Record<string, unknown> }): string {
  const raw = res.headers['set-cookie'];
  const first = Array.isArray(raw) ? raw[0] : String(raw);
  return first.split(';')[0]!;
}

describe.skipIf(!env['DB_CONNECT_STRING'])(
  'reports / report-parametros — TEST schema (read-only)',
  { timeout: 30_000 },
  () => {
    let realPool: oracledb.Pool;
    let pool: DbPool;
    let app: FastifyInstance;
    const ambiente = env['AMBIENTE_ID'] ?? '';

    beforeAll(async () => {
      if (env['ORACLE_CLIENT_LIB_DIR'])
        oracledb.initOracleClient({ libDir: env['ORACLE_CLIENT_LIB_DIR'] });
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
      pool = readOnlyPool(realPool as unknown as DbPool);
      app = await buildApp({
        config: {
          COOKIE_SECURE: false,
          TRUST_PROXY: false,
          BASE_PATH: '',
          SESSION_SECRET: 'x'.repeat(32),
        },
        ambiente,
        checkDb: async () => 0,
        distDir: null,
        authRepo: oracleAuthRepo(pool, 30_000),
        db: { pool, callTimeoutMs: 30_000 },
        logger: { level: 'error' },
      });
    }, 60_000);

    afterAll(async () => {
      await app?.close();
      await realPool?.close(0);
    }, 60_000);

    it('GET /api/reports 401s without a session', async () => {
      expect((await app.inject({ url: '/api/reports' })).statusCode).toBe(401);
    });

    describe.skipIf(!TEST_USER || !TEST_PASSWORD)('with the owner-given test account', () => {
      it('GET /api/reports returns the paged envelope over SVR_REPORT_SIID', async () => {
        const login = await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          payload: { utilizador: TEST_USER, password: TEST_PASSWORD },
        });
        const cookie = cookieOf(login);

        const r = await app.inject({ url: '/api/reports', headers: { cookie } });

        expect(r.statusCode).toBe(200);
        expect(r.json()).toMatchObject({ page: 1, size: 50 });
        expect(Array.isArray(r.json().rows)).toBe(true);
      });

      it('GET /api/reports/:REPORT_ID/parametros returns only that report\'s parameters', async () => {
        const login = await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          payload: { utilizador: TEST_USER, password: TEST_PASSWORD },
        });
        const cookie = cookieOf(login);

        const reportRow = (
          await app.inject({ url: '/api/reports?size=1', headers: { cookie } })
        ).json().rows[0] as { ID: number } | undefined;
        if (!reportRow) return; // an empty TEST schema has nothing to scope by

        const r = await app.inject({
          url: `/api/reports/${reportRow.ID}/parametros?size=200`,
          headers: { cookie },
        });

        expect(r.statusCode).toBe(200);
        const rows = r.json().rows as { REPORT_ID: number }[];
        for (const row of rows) expect(row.REPORT_ID).toBe(reportRow.ID);
      });
    });
  },
);
