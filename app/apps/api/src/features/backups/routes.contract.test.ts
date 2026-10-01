import oracledb from 'oracledb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { backups } from '@gestsiid/shared';
import { buildApp } from '../../app.ts';
import { buildPoolAttrs, type DbPool } from '../../db/oracle.ts';
import { oracleAuthRepo } from '../auth/repo.ts';
import { readOnlyPool } from '../../test/read-only-db.ts';

/**
 * Contract test against the TEST schema (TEST_STRATEGY.md, CLAUDE.md HARD RULE): reaches Oracle
 * only through readOnlyPool, so only GET is exercised — POST /api/backups and /api/backups/online
 * are tested with memoryBackupsRepo (routes.test.ts) and a fake connection (oracle.test.ts).
 * Skipped unless DB_CONNECT_STRING is set; the logged-in cases need the owner-given ADM account
 * GESTSIID_TEST_USER / GESTSIID_TEST_PASSWORD and skip on their own without it.
 * TEST has 0 SVR_BACKUPS rows (analysis/db/tables/SVR_BACKUPS.md), so the list checks the envelope.
 */

const env = process.env;
const TEST_USER = env['GESTSIID_TEST_USER'];
const TEST_PASSWORD = env['GESTSIID_TEST_PASSWORD'];

function cookieOf(res: { headers: Record<string, unknown> }): string {
  const raw = res.headers['set-cookie'];
  const first = Array.isArray(raw) ? raw[0] : String(raw);
  return first.split(';')[0]!;
}

describe.skipIf(!env['DB_CONNECT_STRING'])('backups — TEST schema (read-only)', { timeout: 60_000 }, () => {
  let realPool: oracledb.Pool;
  let pool: DbPool;
  let app: FastifyInstance;
  const ambiente = env['AMBIENTE_ID'] ?? '';

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
    pool = readOnlyPool(realPool as unknown as DbPool);
    app = await buildApp({
      config: { COOKIE_SECURE: false, TRUST_PROXY: false, BASE_PATH: '', SESSION_SECRET: 'x'.repeat(32) },
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

  it('GET /api/backups and /api/backups/meses 401 without a session', async () => {
    expect((await app.inject({ url: '/api/backups' })).statusCode).toBe(401);
    expect((await app.inject({ url: '/api/backups/meses' })).statusCode).toBe(401);
  });

  describe.skipIf(!TEST_USER || !TEST_PASSWORD)('with the owner-given ADM test account', () => {
    let cookie = '';
    beforeAll(async () => {
      const login = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { utilizador: TEST_USER, password: TEST_PASSWORD },
      });
      expect(login.statusCode).toBe(200);
      cookie = cookieOf(login);
    });
    const get = (url: string) => app.inject({ url, headers: { cookie } });

    it.each(['', '?f[MEDIA_ONLINE]=S', '?f[MEDIA_ONLINE]=N'])('GET /api/backups%s: paged envelope, row keys = the resource columns', async (qs) => {
      const r = await get(`/api/backups${qs}`);
      expect(r.statusCode).toBe(200);
      const body = r.json();
      expect(body).toMatchObject({ page: 1, size: 50, totalCapped: false });
      expect(typeof body.total).toBe('number');
      for (const row of body.rows as Record<string, unknown>[]) expect(Object.keys(row).sort()).toEqual(Object.keys(backups.columns).sort());
    });

    it('GET /api/backups/meses: { rows: [{ MES: YYYY-MM, DATA: 01/MM/YYYY }] }, newest first', async () => {
      const r = await get('/api/backups/meses');
      expect(r.statusCode).toBe(200);
      const rows = r.json().rows as { MES: string; DATA: string }[];
      for (const m of rows) {
        expect(m.MES).toMatch(/^\d{4}-\d{2}$/);
        expect(m.DATA).toBe(`01/${m.MES.slice(5)}/${m.MES.slice(0, 4)}`);
      }
      const meses = rows.map((m) => m.MES);
      expect(meses).toEqual([...meses].sort().reverse());
    });

    it('GET /api/backups/candidatos?mes=<newest month>: envelope + numeric totalBytes; rows of that month, not backed up', async (ctx) => {
      const mes = ((await get('/api/backups/meses')).json().rows as { MES: string }[])[0]?.MES;
      if (!mes) return ctx.skip();
      const r = await get(`/api/backups/candidatos?mes=${mes}&size=5`);
      expect(r.statusCode).toBe(200);
      const body = r.json();
      expect(body).toMatchObject({ page: 1, size: 5 });
      expect(body.total).toBeGreaterThan(0);
      expect(typeof body.totalBytes).toBe('number');
      expect(body.totalBytes).toBeGreaterThanOrEqual(0);
      for (const row of body.rows as Record<string, unknown>[]) {
        expect(String(row['DATA_IMPRESSAO'])).toMatch(new RegExp(`^${mes}-`));
        expect(row['BACKUP_ID']).toBeNull();
      }
    });
  });
});
