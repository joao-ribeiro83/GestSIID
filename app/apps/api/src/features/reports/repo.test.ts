// Regression: PR #13 review — a new report and its 3 fixed parameters were 4 separate
// transactions; a failure part-way left a committed report that could not be edited or deleted.
import { describe, expect, it } from 'vitest';
import type { DbConnection, DbPool } from '../../db/oracle.ts';
import { SqlExpr, type CrudStore } from '../../lib/crud.ts';
import { oracleReportsRepo } from './repo.ts';

const ctx = { user: { username: 'JOAO', role: 'ADM' as const } };

/** A fake connection: `failOn` = the 1-based execute() call that throws (an ORA error). */
function fake(failOn?: number) {
  const log: string[] = [];
  let n = 0;
  const conn: DbConnection = {
    async execute(sql: string, binds?: unknown) {
      n++;
      log.push(sql.trim().split(/\s+/).slice(0, 3).join(' '));
      if (n === failOn) throw new Error('ORA-12345: falha simulada');
      if (sql.includes('RETURNING ID, ROWID')) return { outBinds: { nid: [77], nrid: ['AAAx/y+zAAA'] }, binds } as never;
      return { rowsAffected: 1 } as never;
    },
    executeMany: async () => ({}) as never,
    commit: async () => void log.push('COMMIT'),
    rollback: async () => void log.push('ROLLBACK'),
    close: async () => {},
  };
  const pool: DbPool = { getConnection: async () => conn };
  const gets: string[] = [];
  const store = { get: async (rid: string) => (gets.push(rid), { _rid: rid, ID: 77 }) } as unknown as CrudStore;
  return { repo: oracleReportsRepo(pool, 1000, store), log, gets };
}

const values = { NOME: 'Novo', N_PARAMETROS: 3, VALIDO: 'S', ID: new SqlExpr('ID_TEMPLATE_REPORT_SEQ.NEXTVAL') };

describe('oracleReportsRepo.criar', () => {
  it('inserts the report and its 3 fixed parameters, then commits once', async () => {
    const { repo, log, gets } = fake();
    const row = await repo.criar(values, ctx);
    expect(log).toEqual([
      'INSERT INTO SVR_REPORT_SIID',
      'INSERT INTO SVR_PARAMETROS_REPORT',
      'INSERT INTO SVR_PARAMETROS_REPORT',
      'INSERT INTO SVR_PARAMETROS_REPORT',
      'COMMIT',
    ]);
    expect(gets).toEqual(['AAAx_y-zAAA']); // read back after the commit, rid URL-safe
    expect(row).toMatchObject({ ID: 77 });
  });

  it.each([2, 3, 4])('rolls everything back when insert %i fails (nothing committed)', async (failOn) => {
    const { repo, log, gets } = fake(failOn);
    await expect(repo.criar(values, ctx)).rejects.toMatchObject({ statusCode: expect.any(Number) });
    expect(log).toContain('ROLLBACK');
    expect(log).not.toContain('COMMIT');
    expect(gets).toEqual([]);
  });

  it('refuses a column the resource does not have, before any SQL runs', async () => {
    const { repo, log } = fake();
    await expect(repo.criar({ ...values, 'X; DROP': 1 }, ctx)).rejects.toThrow();
    expect(log).not.toContain('COMMIT');
  });
});
