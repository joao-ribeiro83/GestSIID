import oracledb from 'oracledb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.ts';
import { buildPoolAttrs, queryOne, type DbPool } from '../../db/oracle.ts';
import { readOnlyPool } from '../../test/read-only-db.ts';
import { oracleAuthRepo } from './repo.ts';

/**
 * Contract tests against the TEST schema (TEST_STRATEGY.md): skipped unless DB_CONNECT_STRING is set.
 *
 * HARD RULE: these tests are NOT permitted to change the Oracle database. They reach Oracle only
 * through readOnlyPool, which refuses anything but a plain SELECT. They create no rows, change no
 * rows, and never commit. Write paths (regeneration-password change) are tested with a fake in
 * routes.test.ts only.
 *
 * The success-login case needs a real account that the owner gives through GESTSIID_TEST_USER /
 * GESTSIID_TEST_PASSWORD (not stored in the repo); without them that case skips.
 */

const env = process.env;
const TEST_USER = env['GESTSIID_TEST_USER'];
const TEST_PASSWORD = env['GESTSIID_TEST_PASSWORD'];

describe.skipIf(!env['DB_CONNECT_STRING'])('auth routes — TEST schema (read-only)', { timeout: 30_000 }, () => {
  let realPool: oracledb.Pool;
  let pool: DbPool;
  let app: FastifyInstance;
  const ambiente = env['AMBIENTE_ID'] ?? '';
  const read = <T>(sql: string, binds: Record<string, unknown> = {}) =>
    queryOne<T>(pool, { username: 'contract-test' }, 'test', 30_000, sql, binds);

  beforeAll(async () => {
    if (env['ORACLE_CLIENT_LIB_DIR']) oracledb.initOracleClient({ libDir: env['ORACLE_CLIENT_LIB_DIR'] });
    else oracledb.initOracleClient();
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT; // as server.ts
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
      config: { COOKIE_SECURE: false, TRUST_PROXY: false, BASE_PATH: '', SESSION_SECRET: 'x'.repeat(32) },
      ambiente,
      checkDb: async () => 0,
      distDir: null,
      authRepo: oracleAuthRepo(pool, 30_000),
      logger: { level: 'error' }, // a 500 prints its Oracle error
    });
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await realPool?.close(0);
  }, 60_000);

  let ip = 0;
  const login = (utilizador: string, password: string) =>
    app.inject({ method: 'POST', url: '/api/auth/login', payload: { utilizador, password }, remoteAddress: `10.9.0.${++ip}` });

  it('the guard is active: the regeneration-password UPDATE is refused before it reaches Oracle', async () => {
    await expect(oracleAuthRepo(pool, 30_000).setRegeneracao('a', 'b', 'ZZTEST_NONE', 'x')).rejects.toThrow(/READ-ONLY GUARD/);
  });

  it('unknown user → 401 LOGIN_INVALIDO', async () => {
    const res = await login('ZZTEST_NOBODY', 'x');
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('LOGIN_INVALIDO');
  });

  it('existing user, wrong password → 401 LOGIN_INVALIDO (the ENCRYPT compare runs in Oracle)', async (ctx) => {
    const row = await read<{ USERNAME: string }>(
      `SELECT USERNAME FROM CFG_UTILIZADORES WHERE AMBIENTE_ID = :a AND ROWNUM = 1`,
      { a: ambiente },
    );
    if (!row) ctx.skip();
    const res = await login(row!.USERNAME, `wrong-${Date.now()}`);
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('LOGIN_INVALIDO');
  });

  it('DATA_INICIO / DATA_FIM: the login SQL computes ATIVO = 0 for an expired user (SEC-006)', async (ctx) => {
    const row = await read<{ USERNAME: string }>(
      `SELECT USERNAME FROM CFG_UTILIZADORES WHERE AMBIENTE_ID = :a AND DATA_FIM < SYSDATE AND ROWNUM = 1`,
      { a: ambiente },
    );
    if (!row) ctx.skip(); // no expired user in this schema
    const found = await oracleAuthRepo(pool, 30_000).findLogin(row!.USERNAME, 'x', ambiente);
    expect(found).toMatchObject({ USERNAME: row!.USERNAME, OK: 0, ATIVO: 0 });
  });

  it('regeneration-password check SQL runs in Oracle (wrong value → false)', async () => {
    expect(await oracleAuthRepo(pool, 30_000).checkRegeneracao(`wrong-${Date.now()}`, ambiente, 'contract-test')).toBe(false);
  });

  describe.skipIf(!TEST_USER || !TEST_PASSWORD)('with the owner-given test account', () => {
    it('right password → 200 with the session user and role from TIPO_UTILIZADOR_RF', async () => {
      const row = await read<{ TIPO_UTILIZADOR_RF: string | null }>(
        `SELECT TIPO_UTILIZADOR_RF FROM CFG_UTILIZADORES WHERE USERNAME = :u AND AMBIENTE_ID = :a`,
        { u: TEST_USER!.toUpperCase(), a: ambiente },
      );
      const res = await login(TEST_USER!.toLowerCase(), TEST_PASSWORD!);
      expect(res.statusCode).toBe(200);
      expect(res.json().user).toMatchObject({
        username: TEST_USER!.toUpperCase(),
        role: row?.TIPO_UTILIZADOR_RF === 'ADM' ? 'ADM' : 'USER',
        ambiente,
      });
    });
  });
});
