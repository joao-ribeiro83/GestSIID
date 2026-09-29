import oracledb from 'oracledb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.ts';
import { buildPoolAttrs, queryOne, type DbPool } from '../../db/oracle.ts';
import { oracleAuthRepo } from '../auth/repo.ts';
import { readOnlyPool } from '../../test/read-only-db.ts';

/**
 * Contract test against the TEST schema (TEST_STRATEGY.md, CLAUDE.md HARD RULE): reaches Oracle
 * only through readOnlyPool, so only GET / SELECT is exercised — POST/PUT/DELETE are tested with
 * memoryStore and a recording store in routes.test.ts, and the INSERT/UPDATE SQL text in
 * lib/crud.test.ts. Skipped unless DB_CONNECT_STRING is set; the authenticated cases need the
 * owner-given GESTSIID_TEST_USER / GESTSIID_TEST_PASSWORD and skip on their own without them.
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
  'utilizadores — TEST schema (read-only)',
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

    it('GET /api/utilizadores 401s without a session', async () => {
      expect((await app.inject({ url: '/api/utilizadores' })).statusCode).toBe(401);
    });

    describe.skipIf(!TEST_USER || !TEST_PASSWORD)('with the owner-given test account', () => {
      const login = async () =>
        cookieOf(
          await app.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: { utilizador: TEST_USER, password: TEST_PASSWORD },
          }),
        );

      it('GET /api/utilizadores lists the users over CFG_UTILIZADORES and never returns PASSWORD', async () => {
        const r = await app.inject({
          url: '/api/utilizadores?size=200',
          headers: { cookie: await login() },
        });

        expect(r.statusCode).toBe(200);
        const rows = r.json().rows as Record<string, unknown>[];
        expect(
          rows.some((u) => String(u['USERNAME']).toUpperCase() === TEST_USER!.toUpperCase()),
        ).toBe(true);
        for (const u of rows) expect(u).not.toHaveProperty('PASSWORD');
        expect(r.body).not.toMatch(/password/i);
      });

      it('the value the API would store, RAWTOHEX(USER_SECURITY.ENCRYPT(:p)), is what is stored for the test account', async () => {
        const row = await queryOne<{ N: number }>(
          pool,
          { username: TEST_USER! },
          'utilizadores.contract',
          30_000,
          `SELECT COUNT(*) AS N FROM CFG_UTILIZADORES
            WHERE UPPER(USERNAME) = UPPER(:u) AND PASSWORD = RAWTOHEX(USER_SECURITY.ENCRYPT(:p))`,
          { u: TEST_USER, p: TEST_PASSWORD },
        );
        expect(row?.N).toBe(1);
      });

      it('rejects a filter on PASSWORD before it reaches the database', async () => {
        const r = await app.inject({
          url: '/api/utilizadores?f[PASSWORD]=x',
          headers: { cookie: await login() },
        });
        expect(r.statusCode).toBe(400);
      });
    });
  },
);
