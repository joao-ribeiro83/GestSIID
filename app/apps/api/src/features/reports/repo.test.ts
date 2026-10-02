// Regression: PR #13 review — a new report and its 3 fixed parameters were 4 separate
// transactions; a failure part-way left a committed report that could not be edited or deleted.
import { describe, expect, it } from 'vitest';
import type { DbConnection, DbPool } from '../../db/oracle.ts';
import { auditHooks, SqlExpr, type CrudStore } from '../../lib/crud.ts';
import { memoryReportsRepo, oracleReportsRepo } from './repo.ts';

const ctx = { user: { username: 'JOAO', role: 'ADM' as const } };

/** A fake connection: `failOn` = the 1-based execute()/executeMany() call that throws (an ORA error). */
function fake(failOn?: number, getFails = false, nrid: string[] = ['AAAx/y+zAAA']) {
  const log: string[] = [];
  const bound: unknown[] = [];
  let n = 0;
  const step = (sql: string) => {
    n++;
    log.push(sql.trim().split(/\s+/).slice(0, 3).join(' '));
    if (n === failOn) throw new Error('ORA-12345: falha simulada');
  };
  const conn: DbConnection = {
    async execute(sql: string, binds?: unknown) {
      step(sql);
      return { outBinds: { nid: [77], nrid }, binds } as never;
    },
    async executeMany(sql: string, binds: unknown[]) {
      step(sql);
      bound.push(...binds);
      return {} as never;
    },
    commit: async () => void log.push('COMMIT'),
    rollback: async () => void log.push('ROLLBACK'),
    close: async () => {},
  };
  const pool: DbPool = { getConnection: async () => conn };
  const gets: string[] = [];
  const store = {
    get: async (rid: string) => {
      gets.push(rid);
      if (getFails) throw new Error('pool esgotado');
      return { _rid: rid, ID: 77 };
    },
  } as unknown as CrudStore;
  return { repo: oracleReportsRepo(pool, 1000, store, auditHooks), log, gets, bound };
}

const values = { NOME: 'Novo', N_PARAMETROS: 3, VALIDO: 'S', ID: new SqlExpr('ID_TEMPLATE_REPORT_SEQ.NEXTVAL') };

describe('oracleReportsRepo.criar', () => {
  it('inserts the report and its 3 fixed parameters, then commits once', async () => {
    const { repo, log, gets, bound } = fake();
    const row = await repo.criar(values, ctx);
    expect(log).toEqual(['INSERT INTO SVR_REPORT_SIID', 'INSERT INTO SVR_PARAMETROS_REPORT', 'COMMIT']);
    expect(bound).toHaveLength(3);
    expect(gets).toEqual(['AAAx_y-zAAA']); // read back after the commit, rid URL-safe
    expect(row).toMatchObject({ ID: 77 });
  });

  it('writes the audit columns of the parameter hooks', async () => {
    const { repo, bound } = fake();
    await repo.criar(values, ctx);
    expect(Object.values(bound[0] as object)).toContain('JOAO'); // CRIADO_POR
  });

  it.each([1, 2])('rolls everything back when statement %i fails (nothing committed)', async (failOn) => {
    const { repo, log, gets } = fake(failOn);
    await expect(repo.criar(values, ctx)).rejects.toMatchObject({ statusCode: expect.any(Number) });
    expect(log).toContain('ROLLBACK');
    expect(log).not.toContain('COMMIT');
    expect(gets).toEqual([]);
  });

  it('rolls back when Oracle returns no ROWID', async () => {
    const { repo, log } = fake(undefined, false, []);
    await expect(repo.criar(values, ctx)).rejects.toMatchObject({ statusCode: 500 });
    expect(log).toContain('ROLLBACK');
    expect(log).not.toContain('COMMIT');
  });

  it('answers with the id and _rid when the read-back after the commit fails', async () => {
    const { repo, log } = fake(undefined, true);
    const row = await repo.criar(values, ctx);
    expect(log).toContain('COMMIT');
    expect(row).toEqual({ _rid: 'AAAx_y-zAAA', ID: 77 });
  });

  it('refuses a column the resource does not have, before any SQL runs', async () => {
    const { repo, log } = fake();
    await expect(repo.criar({ ...values, 'X; DROP': 1 }, ctx)).rejects.toThrow();
    expect(log).not.toContain('COMMIT');
  });
});

describe('memoryReportsRepo.criar', () => {
  it('removes the report again when a parameter insert fails', async () => {
    const removed: string[] = [];
    const store = {
      insert: async () => ({ _rid: 'r1', ID: 5, NOME: 'X' }),
      remove: async (rid: string) => void removed.push(rid),
    } as unknown as CrudStore;
    const parametros = {
      insert: async () => {
        throw new Error('falha');
      },
    } as unknown as CrudStore;
    await expect(memoryReportsRepo(store, parametros, auditHooks).criar({}, ctx)).rejects.toThrow('falha');
    expect(removed).toEqual(['r1']);
  });
});
