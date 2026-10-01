import { describe, expect, it, vi } from 'vitest';
import { AppError } from './errors.ts';
import {
  buildPoolAttrs,
  callPlsql,
  execute,
  executeMany,
  lockRow,
  query,
  queryOne,
  sessionCallback,
  withConnection,
  withTransaction,
  type DbConnection,
  type DbPool,
} from './oracle.ts';

function fakeConnection(overrides: Partial<DbConnection> = {}) {
  return {
    execute: vi.fn().mockResolvedValue({ rows: [] }),
    executeMany: vi.fn().mockResolvedValue({}),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as DbConnection;
}

function fakePool(conn: DbConnection): DbPool {
  return { getConnection: vi.fn().mockResolvedValue(conn) };
}

const USER = { username: 'JRIBEIRO' };
const ACTION = 'documentos.list';
const TIMEOUT = 60000;

describe('withConnection', () => {
  it('acquires a connection, tags it for tracing, runs fn, and always closes it', async () => {
    const conn = fakeConnection();
    const pool = fakePool(conn);

    const result = await withConnection(pool, USER, ACTION, TIMEOUT, async (c) => {
      expect(c.clientId).toBe('JRIBEIRO');
      expect(c.module).toBe('gestsiid');
      expect(c.action).toBe(ACTION);
      expect(c.callTimeout).toBe(TIMEOUT);
      return 'ok';
    });

    expect(result).toBe('ok');
    expect(conn.close).toHaveBeenCalledTimes(1);
  });

  it('closes the connection even when fn throws', async () => {
    const conn = fakeConnection();
    const pool = fakePool(conn);

    await expect(
      withConnection(pool, USER, ACTION, TIMEOUT, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(conn.close).toHaveBeenCalledTimes(1);
  });

  it('closes the connection even when tagging it throws (e.g. DPI-1050 on callTimeout)', async () => {
    const conn = fakeConnection();
    Object.defineProperty(conn, 'callTimeout', {
      set() {
        throw new Error('DPI-1050');
      },
    });
    await expect(withConnection(fakePool(conn), USER, ACTION, TIMEOUT, async () => 'ok')).rejects.toThrow('DPI-1050');
    expect(conn.close).toHaveBeenCalledTimes(1);
  });
});

describe('query / queryOne', () => {
  it('query returns the rows from conn.execute', async () => {
    const conn = fakeConnection({ execute: vi.fn().mockResolvedValue({ rows: [{ ID: 1 }, { ID: 2 }] }) });
    const pool = fakePool(conn);

    const rows = await query(pool, USER, ACTION, TIMEOUT, 'SELECT ID FROM T', {});

    expect(rows).toEqual([{ ID: 1 }, { ID: 2 }]);
    expect(conn.execute).toHaveBeenCalledWith('SELECT ID FROM T', {});
  });

  it('query returns an empty array when the driver returns no rows property', async () => {
    const conn = fakeConnection({ execute: vi.fn().mockResolvedValue({}) });
    const rows = await query(fakePool(conn), USER, ACTION, TIMEOUT, 'SELECT 1 FROM DUAL', {});
    expect(rows).toEqual([]);
  });

  it('queryOne returns the first row, or undefined when there are none', async () => {
    const conn = fakeConnection({ execute: vi.fn().mockResolvedValue({ rows: [{ ID: 1 }] }) });
    expect(await queryOne(fakePool(conn), USER, ACTION, TIMEOUT, 'SELECT 1', {})).toEqual({ ID: 1 });

    const empty = fakeConnection({ execute: vi.fn().mockResolvedValue({ rows: [] }) });
    expect(await queryOne(fakePool(empty), USER, ACTION, TIMEOUT, 'SELECT 1', {})).toBeUndefined();
  });
});

describe('execute / executeMany', () => {
  it('execute runs one statement and commits', async () => {
    const conn = fakeConnection({ execute: vi.fn().mockResolvedValue({ rowsAffected: 1 }) });
    const pool = fakePool(conn);

    const result = await execute(pool, USER, ACTION, TIMEOUT, 'UPDATE T SET X = :x', { x: 1 });

    expect(result).toEqual({ rowsAffected: 1 });
    expect(conn.commit).toHaveBeenCalledTimes(1);
  });

  it('executeMany runs a batch and commits', async () => {
    const conn = fakeConnection();
    const pool = fakePool(conn);
    const binds = [{ x: 1 }, { x: 2 }];

    await executeMany(pool, USER, ACTION, TIMEOUT, 'UPDATE T SET X = :x WHERE ID = :id', binds);

    expect(conn.executeMany).toHaveBeenCalledWith('UPDATE T SET X = :x WHERE ID = :id', binds);
    expect(conn.commit).toHaveBeenCalledTimes(1);
  });
});

describe('withTransaction', () => {
  it('commits when fn resolves', async () => {
    const conn = fakeConnection();
    const pool = fakePool(conn);

    await withTransaction(pool, USER, ACTION, TIMEOUT, async () => 'done');

    expect(conn.commit).toHaveBeenCalledTimes(1);
    expect(conn.rollback).not.toHaveBeenCalled();
  });

  it('rolls back and rethrows when fn throws', async () => {
    const conn = fakeConnection();
    const pool = fakePool(conn);

    await expect(
      withTransaction(pool, USER, ACTION, TIMEOUT, async () => {
        throw new Error('nope');
      }),
    ).rejects.toThrow('nope');

    expect(conn.rollback).toHaveBeenCalledTimes(1);
    expect(conn.commit).not.toHaveBeenCalled();
    expect(conn.close).toHaveBeenCalledTimes(1);
  });
});

describe('callPlsql', () => {
  it('runs the block and returns typed outBinds', async () => {
    const conn = fakeConnection({
      execute: vi.fn().mockResolvedValue({ outBinds: { id: 42 } }),
    });

    const outBinds = await callPlsql<{ id: number }>(conn, 'BEGIN :id := 42; END;', {});

    expect(outBinds).toEqual({ id: 42 });
  });

  it('returns an empty object when the block has no outBinds', async () => {
    const conn = fakeConnection({ execute: vi.fn().mockResolvedValue({}) });
    expect(await callPlsql(conn, 'BEGIN NULL; END;', {})).toEqual({});
  });
});

describe('lockRow', () => {
  it('locks the row FOR UPDATE NOWAIT with null-safe orig conditions and resolves when found', async () => {
    const conn = fakeConnection({ execute: vi.fn().mockResolvedValue({ rows: [{ '1': 1 }] }) });

    await lockRow(conn, 'DOC_MODELOS_DOCUMENTO', 'ID = :id', { id: 5 }, { NOME: 'X', DESCRICAO: null });

    const [sql, binds] = (conn.execute as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(sql).toContain('FOR UPDATE NOWAIT');
    expect(sql).toContain('ID = :id');
    expect(sql).toContain('NOME = :orig0 OR (NOME IS NULL AND :orig0 IS NULL)');
    expect(sql).toContain('DESCRICAO = :orig1 OR (DESCRICAO IS NULL AND :orig1 IS NULL)');
    expect(binds).toEqual({ id: 5, orig0: 'X', orig1: null });
  });

  it('throws 409 REGISTO_ALTERADO when the row is gone or already changed', async () => {
    const conn = fakeConnection({ execute: vi.fn().mockResolvedValue({ rows: [] }) });

    const err = await lockRow(conn, 'T', 'ID = :id', { id: 1 }, {}).catch((e) => e);

    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('REGISTO_ALTERADO');
  });

  it('maps ORA-00054 to 409 REGISTO_BLOQUEADO', async () => {
    const conn = fakeConnection({
      execute: vi.fn().mockRejectedValue(new Error('ORA-00054: resource busy and acquire with NOWAIT specified')),
    });

    const err = await lockRow(conn, 'T', 'ID = :id', { id: 1 }, {}).catch((e) => e);

    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('REGISTO_BLOQUEADO');
  });
});

describe('buildPoolAttrs', () => {
  it('builds a fixed-size pool (poolMin = poolMax) with the sessionCallback wired', () => {
    const attrs = buildPoolAttrs({
      DB_USER: 'app',
      DB_PASSWORD: 'secret',
      DB_CONNECT_STRING: 'host:1521/SVC',
      DB_SCHEMA: 'SIID_TESTES',
      DB_POOL_SIZE: 4,
    });

    expect(attrs.user).toBe('app');
    expect(attrs.password).toBe('secret');
    expect(attrs.connectString).toBe('host:1521/SVC');
    expect(attrs.poolMin).toBe(4);
    expect(attrs.poolMax).toBe(4);
    expect(attrs.poolIncrement).toBe(0);
    expect(typeof attrs.sessionCallback).toBe('function');
  });
});

describe('sessionCallback', () => {
  it('sets CURRENT_SCHEMA and the NLS masks, then calls back with no error', async () => {
    const conn = fakeConnection();
    const cb = sessionCallback('SIID_TESTES');

    await new Promise<void>((resolve, reject) => {
      cb(conn, '', (err) => (err ? reject(err) : resolve()));
    });

    const [sql] = (conn.execute as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(sql).toContain('ALTER SESSION SET CURRENT_SCHEMA = SIID_TESTES');
    expect(sql).toContain("NLS_DATE_FORMAT = 'DD-MM-YYYY'");
    expect(sql).toContain("NLS_NUMERIC_CHARACTERS = '.,'");
  });

  it('forwards a failure to the callback', async () => {
    const conn = fakeConnection({ execute: vi.fn().mockRejectedValue(new Error('ORA-00942')) });
    const cb = sessionCallback('SIID_TESTES');

    const err = await new Promise<Error | null>((resolve) => {
      cb(conn, '', (e) => resolve(e ?? null));
    });

    expect(err).toBeInstanceOf(Error);
  });
});
