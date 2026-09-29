import type oracledb from 'oracledb';
import { AppError, mapOracleError } from './errors.ts';

/**
 * Minimal structural subset of `oracledb.Connection` that the helpers below need. Declared with
 * its own (non-overloaded) call signatures rather than `Pick<oracledb.Connection, ...>`: TS
 * mapped/indexed access collapses an overloaded method down to only its last declared overload,
 * which is the `sql: object` form here, not the `sql: string` one this module actually calls.
 * A real pooled connection satisfies this structurally; tests pass a plain fake object instead
 * of standing up a database.
 */
export interface DbConnection {
  execute<T = unknown>(
    sql: string,
    binds?: oracledb.BindParameters,
    options?: oracledb.ExecuteOptions,
  ): Promise<oracledb.Result<T>>;
  executeMany<T = unknown>(
    sql: string,
    binds: oracledb.BindParameters[],
    options?: oracledb.ExecuteManyOptions,
  ): Promise<oracledb.Results<T>>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  close(options?: oracledb.CloseConnectionOptions): Promise<void>;
  clientId?: string;
  module?: string;
  action?: string;
  callTimeout?: number;
}

export interface DbPool {
  getConnection(): Promise<DbConnection>;
}

export interface SessionUser {
  username: string;
}

type Binds = Record<string, unknown> | unknown[];

/** Acquires a pooled connection, tags it for DBA tracing (§3), runs `fn`, always releases it. */
export async function withConnection<T>(
  pool: DbPool,
  user: SessionUser,
  action: string,
  callTimeoutMs: number,
  fn: (conn: DbConnection) => Promise<T>,
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    // Inside the try: a setter can throw (DPI-1050 on an old client), and the connection must
    // still go back to the pool.
    conn.clientId = user.username;
    conn.module = 'gestsiid';
    conn.action = action;
    conn.callTimeout = callTimeoutMs;
    return await fn(conn);
  } finally {
    await conn.close();
  }
}

export async function query<T = unknown>(
  pool: DbPool,
  user: SessionUser,
  action: string,
  callTimeoutMs: number,
  sql: string,
  binds: Binds = {},
): Promise<T[]> {
  return withConnection(pool, user, action, callTimeoutMs, async (conn) => {
    const result = await conn.execute<T>(sql, binds as oracledb.BindParameters);
    return (result.rows ?? []) as T[];
  });
}

export async function queryOne<T = unknown>(
  pool: DbPool,
  user: SessionUser,
  action: string,
  callTimeoutMs: number,
  sql: string,
  binds: Binds = {},
): Promise<T | undefined> {
  const rows = await query<T>(pool, user, action, callTimeoutMs, sql, binds);
  return rows[0];
}

/** One INSERT/UPDATE/DELETE statement, its own connection and commit. */
export async function execute(
  pool: DbPool,
  user: SessionUser,
  action: string,
  callTimeoutMs: number,
  sql: string,
  binds: Binds = {},
): Promise<oracledb.Result<unknown>> {
  return withConnection(pool, user, action, callTimeoutMs, async (conn) => {
    const result = await conn.execute(sql, binds as oracledb.BindParameters);
    await conn.commit();
    return result;
  });
}

export async function executeMany(
  pool: DbPool,
  user: SessionUser,
  action: string,
  callTimeoutMs: number,
  sql: string,
  binds: unknown[],
): Promise<oracledb.Results<unknown>> {
  return withConnection(pool, user, action, callTimeoutMs, async (conn) => {
    const result = await conn.executeMany(sql, binds as oracledb.BindParameters[]);
    await conn.commit();
    return result;
  });
}

/** App DML only (§3): commits on success, rolls back and rethrows on error, always releases. */
export async function withTransaction<T>(
  pool: DbPool,
  user: SessionUser,
  action: string,
  callTimeoutMs: number,
  fn: (conn: DbConnection) => Promise<T>,
): Promise<T> {
  return withConnection(pool, user, action, callTimeoutMs, async (conn) => {
    try {
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  });
}

/** Runs an anonymous PL/SQL block with IN/OUT binds and returns the typed outBinds. */
export async function callPlsql<T extends Record<string, unknown> = Record<string, unknown>>(
  conn: DbConnection,
  block: string,
  binds: Record<string, oracledb.BindParameter>,
): Promise<T> {
  const result = await conn.execute(block, binds);
  return (result.outBinds ?? {}) as T;
}

/**
 * `SELECT 1 FROM <table> WHERE <where> AND <each orig column null-safe equal> FOR UPDATE NOWAIT`
 * (§3). 0 rows → 409 REGISTO_ALTERADO; ORA-00054 (row locked) → 409 REGISTO_BLOQUEADO. Runs
 * before every UPDATE/DELETE the app issues.
 */
export async function lockRow(
  conn: DbConnection,
  table: string,
  where: string,
  whereBinds: Record<string, unknown>,
  orig: Record<string, unknown>,
): Promise<void> {
  const origEntries = Object.entries(orig);
  const origBindName = (i: number) => `__orig_${i}`;
  const origConditions = origEntries.map(
    ([column], i) =>
      `(${column} = :${origBindName(i)} OR (${column} IS NULL AND :${origBindName(i)} IS NULL))`,
  );
  const conditions = [where, ...origConditions].join(' AND ');
  const origBinds = Object.fromEntries(origEntries.map(([, value], i) => [origBindName(i), value]));
  const sql = `SELECT 1 FROM ${table} WHERE ${conditions} FOR UPDATE NOWAIT`;

  let result: oracledb.Result<unknown>;
  try {
    result = await conn.execute(sql, { ...whereBinds, ...origBinds } as oracledb.BindParameters);
  } catch (error) {
    const mapped = mapOracleError(error);
    if (mapped.code === 'REGISTO_BLOQUEADO') throw mapped;
    throw error;
  }

  if (!result.rows || result.rows.length === 0) {
    throw new AppError(
      409,
      'REGISTO_ALTERADO',
      'O registo foi alterado por outro utilizador. Volte a consultar.',
    );
  }
}

/**
 * Node-callback sessionCallback (Thick mode) for `createPool`: sets `CURRENT_SCHEMA` and the
 * fixed NLS masks on every new pooled connection (§3). `dbSchema` is validated by
 * `config.ts`'s Oracle-identifier regex at boot, so string interpolation here is safe — it
 * cannot be bound as an identifier.
 */
export function sessionCallback(
  dbSchema: string,
): (
  connection: DbConnection,
  requestedTag: string,
  callback: (error?: Error | null) => void,
) => void {
  return (connection, _requestedTag, callback) => {
    const sql = `ALTER SESSION SET CURRENT_SCHEMA = ${dbSchema} NLS_DATE_FORMAT = 'DD-MM-YYYY' NLS_NUMERIC_CHARACTERS = '.,'`;
    connection.execute(sql).then(
      () => callback(),
      (error: Error) => callback(error),
    );
  };
}

export interface PoolConfig {
  DB_USER: string;
  DB_PASSWORD: string;
  DB_CONNECT_STRING: string;
  DB_SCHEMA: string;
  DB_POOL_SIZE: number;
}

/** Fixed-size pool attrs (poolMin = poolMax, Oracle guidance) with the sessionCallback wired. */
export function buildPoolAttrs(config: PoolConfig): oracledb.PoolAttributes {
  return {
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    connectString: config.DB_CONNECT_STRING,
    poolMin: config.DB_POOL_SIZE,
    poolMax: config.DB_POOL_SIZE,
    poolIncrement: 0,
    queueTimeout: 10000,
    sessionCallback: sessionCallback(config.DB_SCHEMA),
  };
}
