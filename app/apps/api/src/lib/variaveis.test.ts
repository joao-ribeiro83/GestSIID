import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DbConnection, DbPool } from '../db/oracle.ts';
import { createGetVariavel } from './variaveis.ts';

function fakePool(rows: Record<string, unknown>[] = [{ VALOR: '14' }]) {
  const execute = vi.fn().mockResolvedValue({ rows });
  const conn = { execute, close: vi.fn().mockResolvedValue(undefined) } as unknown as DbConnection;
  const pool: DbPool = { getConnection: vi.fn().mockResolvedValue(conn) };
  return { pool, execute };
}
const make = (pool: DbPool) =>
  createGetVariavel({ pool, ambiente: 'GADOR_TESTES', callTimeoutMs: 1000 });

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('getVariavel', () => {
  it('reads VALOR of the configured environment with binds only', async () => {
    const { pool, execute } = fakePool([{ VALOR: 'D:\\' }]);

    expect(await make(pool)('ONLINE')).toBe('D:\\');

    const [sql, binds] = execute.mock.calls[0]!;
    expect(sql).toMatch(/SELECT VALOR FROM SVR_VARIAVEIS_SIID/);
    expect(sql).not.toContain('ONLINE');
    expect(binds).toEqual({ ambiente: 'GADOR_TESTES', tipo: 'ONLINE' });
  });

  it('is null when the variable is not defined, or has no value', async () => {
    expect(await make(fakePool([]).pool)('BACKUP')).toBeNull();
    expect(await make(fakePool([{ VALOR: null }]).pool)('BACKUP')).toBeNull();
  });

  it('caches a name for 60 s, and asks again once the minute is over', async () => {
    const { pool, execute } = fakePool();
    const getVariavel = make(pool);

    await getVariavel('BACKUP');
    vi.advanceTimersByTime(59_999);
    await getVariavel('BACKUP');
    expect(execute).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    await getVariavel('BACKUP');
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('caches "not defined" too, and keeps each name apart', async () => {
    const { pool, execute } = fakePool([]);
    const getVariavel = make(pool);

    await getVariavel('BACKUP');
    await getVariavel('BACKUP');
    expect(execute).toHaveBeenCalledTimes(1);

    await getVariavel('ONLINE');
    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute.mock.calls[1]![1]).toMatchObject({ tipo: 'ONLINE' });
  });

  it('does not cache a failed read: the next call tries again', async () => {
    const { pool, execute } = fakePool();
    execute.mockRejectedValueOnce(new Error('ORA-03113'));
    const getVariavel = make(pool);

    await expect(getVariavel('BACKUP')).rejects.toThrow();
    expect(await getVariavel('BACKUP')).toBe('14');
    expect(execute).toHaveBeenCalledTimes(2);
  });
});
