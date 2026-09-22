import oracledb from 'oracledb';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  origSchema,
  parseListQuery,
  pagedResult,
  valuesSchema,
  type ListQuery,
  type Resource,
  type Role,
} from '@gestsiid/shared';
import { AppError, mapOracleError } from '../db/errors.ts';
import {
  lockRow,
  withConnection,
  withTransaction,
  type DbPool,
  type SessionUser,
} from '../db/oracle.ts';
import {
  bindValue,
  buildListQuery,
  dateSelect,
  decodeRid,
  encodeRid,
  selectList,
} from './listQuery.ts';

/**
 * Generic row routes for a resource (ARCHITECTURE.md §4.3):
 *   GET  <path>          list (query by example, §4.1)     GET    <path>/:rid  one row
 *   POST <path> {values}                                   PUT    <path>/:rid  {orig, values}
 *   DELETE <path>/:rid {orig}
 * Request bodies are validated by zod schemas generated from the resource (unknown and audit
 * columns rejected). Reads need `roles.read`, writes `roles.write`. The data access is a
 * {@link CrudStore}: {@link oracleStore} in production, an in-memory one for the dev demo.
 */

export type Values = Record<string, unknown>;
export type Row = Record<string, unknown>;
export type Parent = Record<string, string | number>;

export interface CrudCtx {
  user: SessionUser & { role: Role };
}

export interface CrudStore {
  list(q: ListQuery, parent: Parent, ctx: CrudCtx): Promise<{ rows: Row[]; total: number }>;
  get(rid: string, ctx: CrudCtx): Promise<Row | undefined>;
  insert(values: Values, parent: Parent, ctx: CrudCtx): Promise<Row>;
  update(rid: string, orig: Values, values: Values, ctx: CrudCtx): Promise<Row>;
  remove(rid: string, orig: Values, ctx: CrudCtx): Promise<void>;
}

export interface CrudHooks {
  beforeInsert?: (values: Values, ctx: CrudCtx) => Values;
  beforeUpdate?: (values: Values, ctx: CrudCtx) => Values;
}

/** A SQL expression a hook may put in `values` (server code only; request values are zod-checked
 * primitives, so this can never come from a client). */
export class SqlExpr {
  readonly sql: string;
  constructor(sql: string) {
    this.sql = sql;
  }
}
export const SYSDATE = new SqlExpr('SYSDATE');

/** Audit columns from the session user (D-08), never from the request. */
export const auditHooks: CrudHooks = {
  beforeInsert: (v, { user }) => ({ ...v, CRIADO_POR: user.username, DATA_CRIACAO: SYSDATE }),
  beforeUpdate: (v, { user }) => ({
    ...v,
    ACTUALIZADO_POR: user.username,
    DATA_ACTUALIZACAO: SYSDATE,
  }),
};

function sessionCtx(request: FastifyRequest, allowed: readonly Role[]): CrudCtx {
  const user = (request.session as { user?: CrudCtx['user'] } | null)?.user;
  if (!user) throw new AppError(401, 'SESSAO_EXPIRADA', 'A sessão expirou. Entre novamente.');
  if (!allowed.includes(user.role))
    throw new AppError(403, 'SEM_PERMISSAO', 'Não tem permissão para esta operação.');
  return { user };
}

function listQueryOf(raw: unknown): ListQuery {
  try {
    return parseListQuery(raw);
  } catch (e) {
    throw new AppError(400, 'VALIDACAO', 'Dados inválidos.', {
      fields: { query: (e as Error).message },
    });
  }
}

export interface CrudOptions {
  store: CrudStore;
  hooks?: CrudHooks;
  /** Default `/api/<name>`; a detail uses `/api/<master>/:KEY/<detail>` with one param per parent key. */
  path?: string;
}

export function crudRoutes(app: FastifyInstance, resource: Resource, opts: CrudOptions): void {
  const { store, hooks = {} } = opts;
  const path = opts.path ?? `/api/${resource.name}`;
  const { read, write } = resource.roles;

  const parentOf = (params: unknown): Parent => {
    const p = params as Record<string, string>;
    const parent: Parent = {};
    for (const key of resource.parentKeys ?? []) {
      const def = resource.columns[key];
      if (def) parent[key] = bindValue(def, p[key] ?? '', key);
    }
    return parent;
  };

  const insertBody = z.object({ values: valuesSchema(resource, 'insert') });
  const updateBody = z.object({
    orig: origSchema(resource),
    values: valuesSchema(resource, 'update'),
  });
  const deleteBody = z.object({ orig: origSchema(resource) });
  const ridParam = z.object({ rid: z.string().min(1) });

  app.get(path, async (request) => {
    const ctx = sessionCtx(request, read);
    const q = listQueryOf(request.query);
    const { rows, total } = await store.list(q, parentOf(request.params), ctx);
    return pagedResult(rows, total, q.page, q.size);
  });

  app.get(`${path}/:rid`, async (request) => {
    const ctx = sessionCtx(request, read);
    const row = await store.get(ridParam.parse(request.params).rid, ctx);
    if (!row) throw new AppError(404, 'NAO_ENCONTRADO', 'Registo não encontrado.');
    return row;
  });

  if (write.length === 0) return;

  app.post(path, async (request, reply) => {
    const ctx = sessionCtx(request, write);
    const parent = parentOf(request.params);
    const { values } = insertBody.parse(request.body);
    const row = await store.insert(hooks.beforeInsert?.(values, ctx) ?? values, parent, ctx);
    reply.status(201);
    return row;
  });

  app.put(`${path}/:rid`, async (request) => {
    const ctx = sessionCtx(request, write);
    const { rid } = ridParam.parse(request.params);
    const { orig, values } = updateBody.parse(request.body);
    return store.update(rid, orig, hooks.beforeUpdate?.(values, ctx) ?? values, ctx);
  });

  app.delete(`${path}/:rid`, async (request, reply) => {
    const ctx = sessionCtx(request, write);
    const { rid } = ridParam.parse(request.params);
    const { orig } = deleteBody.parse(request.body);
    await store.remove(rid, orig, ctx);
    reply.status(204);
  });
}

const DATE_MASK = `'YYYY-MM-DD"T"HH24:MI:SS'`;

/** Oracle-backed store: bind-only SQL, one transaction per write, `lockRow` before UPDATE/DELETE. */
export function oracleStore(pool: DbPool, resource: Resource, callTimeoutMs: number): CrudStore {
  const src = resource.source;
  const cols = resource.columns;
  const byRowid = `SELECT ${selectList(resource)} FROM ${src} WHERE ROWID = CHARTOROWID(:rid)`;
  const ridWhere = 'ROWID = CHARTOROWID(:rid)';
  const withRid = (row: Row) =>
    typeof row['_rid'] === 'string' ? { ...row, _rid: encodeRid(row['_rid']) } : row;

  // Column → SQL value text; SqlExpr inlined, dates through TO_DATE, everything else a bind.
  const valueSql = (column: string, value: unknown, bind: (v: unknown) => string) => {
    if (!Object.hasOwn(cols, column)) throw new Error(`Coluna desconhecida: ${column}`);
    if (value instanceof SqlExpr) return value.sql;
    const b = bind(value);
    return cols[column]?.type === 'date' ? `TO_DATE(${b},${DATE_MASK})` : b;
  };
  const binder = (binds: Record<string, unknown>) => {
    let n = 0;
    return (v: unknown) => {
      const name = `v${n++}`;
      binds[name] = v;
      return `:${name}`;
    };
  };
  // ORA-00001, ORA-02292, … → the §8 catalogue; AppErrors (409 lock, 404) pass through.
  const mapped = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      throw e instanceof AppError ? e : mapOracleError(e);
    }
  };
  // Dates are compared as the text the client read (lockRow pastes the key in as the column).
  const lockOrig = (orig: Values) =>
    Object.fromEntries(
      Object.entries(orig).map(([c, v]) => [cols[c]?.type === 'date' ? dateSelect(c) : c, v]),
    );

  return {
    list: (q, parent, ctx) =>
      mapped(() =>
        withConnection(pool, ctx.user, `${resource.name}.list`, callTimeoutMs, async (conn) => {
          const { list, count } = buildListQuery(resource, q, { parent });
          const rows =
            (await conn.execute<Row>(list.sql, list.binds as oracledb.BindParameters)).rows ?? [];
          const n = (
            await conn.execute<{ N: number }>(count.sql, count.binds as oracledb.BindParameters)
          ).rows?.[0]?.N;
          return { rows: rows.map(withRid), total: n ?? 0 };
        }),
      ),

    get: (rid, ctx) =>
      mapped(() =>
        withConnection(pool, ctx.user, `${resource.name}.get`, callTimeoutMs, async (conn) => {
          const row = (await conn.execute<Row>(byRowid, { rid: decodeRid(rid) })).rows?.[0];
          return row && withRid(row);
        }),
      ),

    insert: (values, parent, ctx) =>
      mapped(() =>
        withTransaction(pool, ctx.user, `${resource.name}.insert`, callTimeoutMs, async (conn) => {
          const all = { ...values, ...parent };
          const binds: Record<string, unknown> = {};
          const bind = binder(binds);
          const columns = Object.keys(all);
          const sqlValues = columns.map((c) => valueSql(c, all[c], bind));
          const sql = `INSERT INTO ${src} (${columns.join(', ')}) VALUES (${sqlValues.join(', ')}) RETURNING ROWID INTO :rid`;
          const result = await conn.execute(sql, {
            ...binds,
            rid: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 64 },
          } as oracledb.BindParameters);
          const rowid = (result.outBinds as { rid: string[] }).rid[0] ?? '';
          const row = (await conn.execute<Row>(byRowid, { rid: rowid })).rows?.[0] ?? {};
          return withRid(row);
        }),
      ),

    update: (rid, orig, values, ctx) =>
      mapped(() =>
        withTransaction(pool, ctx.user, `${resource.name}.update`, callTimeoutMs, async (conn) => {
          const rowid = decodeRid(rid);
          await lockRow(conn, src, ridWhere, { rid: rowid }, lockOrig(orig));
          const binds: Record<string, unknown> = {};
          const bind = binder(binds);
          const sets = Object.entries(values).map(([c, v]) => `${c} = ${valueSql(c, v, bind)}`);
          if (sets.length > 0) {
            await conn.execute(`UPDATE ${src} SET ${sets.join(', ')} WHERE ${ridWhere}`, {
              ...binds,
              rid: rowid,
            } as oracledb.BindParameters);
          }
          const row = (await conn.execute<Row>(byRowid, { rid: rowid })).rows?.[0] ?? {};
          return withRid(row);
        }),
      ),

    remove: (rid, orig, ctx) =>
      mapped(() =>
        withTransaction(pool, ctx.user, `${resource.name}.delete`, callTimeoutMs, async (conn) => {
          const rowid = decodeRid(rid);
          await lockRow(conn, src, ridWhere, { rid: rowid }, lockOrig(orig));
          await conn.execute(`DELETE FROM ${src} WHERE ${ridWhere}`, { rid: rowid });
        }),
      ),
  };
}
