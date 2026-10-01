// Regression: ISSUE-005 — every edit, delete and image upload failed on Oracle with ORA-01036:
// lockRow bound `:__orig_N` and the image store `:__user` / `:__img`, and an Oracle bind name
// must start with a letter. Unit tests only compared SQL text and contract tests cannot lock rows.
// Found by /qa on 2026-10-01 (local Oracle copy). Report: analysis/QA_REPORT.md
import { describe, expect, it } from 'vitest';
import { oracleImageStore } from '../lib/imageRoutes.ts';
import { lockRow, type DbConnection, type DbPool } from './oracle.ts';

const ORACLE_BIND = /^[A-Za-z][A-Za-z0-9_$#]*$/;
/** `:name` placeholders outside string literals ('YYYY-MM-DD"T"HH24:MI:SS' has colons too). */
const placeholders = (sql: string) => [...sql.replace(/'[^']*'/g, "''").matchAll(/:(\w+)/g)].map((m) => m[1]);

function recorder() {
  const calls: { sql: string; binds: Record<string, unknown> }[] = [];
  const conn: DbConnection = {
    async execute(sql: string, binds?: unknown) {
      calls.push({ sql, binds: (binds ?? {}) as Record<string, unknown> });
      return { rows: [{ 1: 1 }], rowsAffected: 1 } as never;
    },
    executeMany: async () => ({}) as never,
    commit: async () => {},
    rollback: async () => {},
    close: async () => {},
  };
  const pool: DbPool = { getConnection: async () => conn };
  return { conn, pool, calls };
}

const expectOracleBinds = (calls: { sql: string; binds: Record<string, unknown> }[]) => {
  for (const { sql, binds } of calls) {
    for (const name of [...Object.keys(binds), ...placeholders(sql)]) expect(name, sql).toMatch(ORACLE_BIND);
  }
};

describe('bind names Oracle accepts', () => {
  it('lockRow: the optimistic-lock columns, a date expression and a null', async () => {
    const { conn, calls } = recorder();
    await lockRow(conn, 'CFG_TIPOS_MIDIA', 'ROWID = :rid', { rid: 'AAA' }, {
      ID: 'X',
      DESIGNACAO: null,
      "TO_CHAR(DATA_CRIACAO,'YYYY-MM-DD\"T\"HH24:MI:SS')": '2026-10-01T10:00:00',
    });
    expect(calls).toHaveLength(1);
    expectOracleBinds(calls);
  });

  it('image store: set (BLOB + audit user) and clear', async () => {
    const { pool, calls } = recorder();
    const store = oracleImageStore(pool, { table: 'DOC_PERFIS_DEPARTAMENTO', column: 'ASSINATURA', keyWhere: 'ID = :id' }, 1000);
    const ctx = { user: { username: 'JOAO', role: 'ADM' as const } };
    await store.set({ id: 7 }, Buffer.from('89504e47', 'hex'), ctx);
    await store.clear({ id: 7 }, ctx);
    expect(calls.some((c) => c.sql.startsWith('UPDATE'))).toBe(true);
    expectOracleBinds(calls);
  });
});
