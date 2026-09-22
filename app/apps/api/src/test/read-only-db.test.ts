import { describe, expect, it, vi } from 'vitest';
import type { DbConnection, DbPool } from '../db/oracle.ts';
import { readOnlyPool } from './read-only-db.ts';

function fakePool() {
  const conn = {
    execute: vi.fn(async () => ({ rows: [] })),
    executeMany: vi.fn(async () => ({})),
    commit: vi.fn(async () => {}),
    rollback: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
  };
  const pool: DbPool = { getConnection: async () => conn as unknown as DbConnection };
  return { pool, conn };
}

describe('readOnlyPool — the Oracle DB must never be changed by tests', () => {
  it.each(['SELECT 1 FROM DUAL', '  select * from t', 'WITH x AS (SELECT 1 FROM DUAL) SELECT * FROM x'])(
    'lets a plain read through: %s',
    async (sql) => {
      const { pool, conn } = fakePool();
      const c = await readOnlyPool(pool).getConnection();
      await c.execute(sql);
      expect(conn.execute).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    'INSERT INTO T VALUES (1)',
    'UPDATE T SET A = 1',
    'DELETE FROM T',
    'MERGE INTO T USING ...',
    'BEGIN PKG.X; END;',
    'CALL PKG.X()',
    'CREATE TABLE X (A NUMBER)',
    'SELECT 1 FROM T FOR UPDATE NOWAIT',
    '/* comment */ UPDATE T SET A = 1',
  ])('blocks anything that is not a plain read: %s', async (sql) => {
    const { pool, conn } = fakePool();
    const c = await readOnlyPool(pool).getConnection();
    await expect(c.execute(sql)).rejects.toThrow(/READ-ONLY GUARD/);
    expect(conn.execute).not.toHaveBeenCalled();
  });

  it('blocks executeMany and commit', async () => {
    const { pool, conn } = fakePool();
    const c = await readOnlyPool(pool).getConnection();
    await expect(c.executeMany('SELECT 1 FROM DUAL', [])).rejects.toThrow(/READ-ONLY GUARD/);
    await expect(c.commit()).rejects.toThrow(/READ-ONLY GUARD/);
    expect(conn.executeMany).not.toHaveBeenCalled();
    expect(conn.commit).not.toHaveBeenCalled();
  });

  it('still closes and rolls back', async () => {
    const { pool, conn } = fakePool();
    const c = await readOnlyPool(pool).getConnection();
    await c.rollback();
    await c.close();
    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.close).toHaveBeenCalled();
  });

  it('forwards exactly the arguments given (the real driver rejects an explicit undefined)', async () => {
    const { pool, conn } = fakePool();
    const c = await readOnlyPool(pool).getConnection();
    await c.execute('SELECT 1 FROM DUAL');
    await c.close();
    expect(conn.execute.mock.calls[0]).toEqual(['SELECT 1 FROM DUAL']);
    expect(conn.close.mock.calls[0]).toEqual([]);
  });
});
