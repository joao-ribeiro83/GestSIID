import type { DbConnection, DbPool } from '../db/oracle.ts';

/**
 * HARD RULE: tests (and Claude) are NOT permitted to change the Oracle database. No INSERT,
 * UPDATE, DELETE, MERGE, DDL, PL/SQL block, commit, or row lock — not even on ZZTEST_ rows, not
 * even "restored afterwards". Every contract test must reach Oracle only through this wrapper.
 * Write paths are tested with fakes (see features/auth/routes.test.ts), never against Oracle.
 *
 * Known limit: a SELECT that calls a function with side effects cannot be detected here. Only
 * call functions known to be pure (USER_SECURITY.ENCRYPT, CRYPT_PKG.ENCRYPTSTRINGRAW).
 */

// Leading comments are stripped first, so `/* x */ UPDATE ...` cannot slip through.
const stripComments = (sql: string) => sql.replace(/^\s*(\/\*[\s\S]*?\*\/|--[^\n]*\n)*/g, '');
const READ = /^\s*(SELECT|WITH)\b/i;
const LOCK = /\bFOR\s+UPDATE\b/i;

function refuse(what: string): never {
  throw new Error(`READ-ONLY GUARD: tests may not change the Oracle database (${what}).`);
}

export function readOnlyPool(pool: DbPool): DbPool {
  return {
    async getConnection() {
      const conn = await pool.getConnection();
      // Rest args: forward exactly what the caller passed; node-oracledb rejects an explicit
      // `undefined` argument (NJS-005).
      const guarded = {
        async execute(...args: Parameters<DbConnection['execute']>) {
          const body = stripComments(args[0]);
          if (!READ.test(body) || LOCK.test(body)) refuse(body.slice(0, 40));
          return conn.execute(...args);
        },
        executeMany: async () => refuse('executeMany'),
        commit: async () => refuse('commit'),
        rollback: () => conn.rollback(),
        close: (...args: Parameters<DbConnection['close']>) => conn.close(...args),
      } as DbConnection;
      // Tracing tags (clientId, module, action, callTimeout) go to the real connection.
      return new Proxy(guarded, {
        set: (_t, key, value) => Reflect.set(conn, key, value),
        get: (t, key) => (key in t ? Reflect.get(t, key) : Reflect.get(conn, key)),
      });
    },
  };
}
