import oracledb from 'oracledb';
import { reportParametros, reports } from '@gestsiid/shared';
import { AppError, mapOracleError } from '../../db/errors.ts';
import { withTransaction, type DbPool } from '../../db/oracle.ts';
import {
  SqlExpr,
  type CrudCtx,
  type CrudHooks,
  type CrudStore,
  type Row,
  type Values,
} from '../../lib/crud.ts';
import { encodeRid } from '../../lib/listQuery.ts';

/**
 * The 3 parameters every report starts with (FD_CONFIGURACAO_REPORTS WHEN-NEW-BLOCK-INSTANCE):
 * seeded with the report (`ReportsRepo.criar`) and name-locked afterwards (`withNomeLock`,
 * alerts `ALERTA_1PARAM..3PARAM`).
 */
export const FIXED_PARAMS = [
  { N_PARAMETRO: 1, NOME: '_USER', TIPO_PARAMETRO_RF: '2', OBRIGATORIO: 'S', ORDINAL: '1º' },
  { N_PARAMETRO: 2, NOME: 'P_USUARIO', TIPO_PARAMETRO_RF: '1', OBRIGATORIO: 'S', ORDINAL: '2º' },
  { N_PARAMETRO: 3, NOME: 'P_DATAACTUAL', TIPO_PARAMETRO_RF: '1', OBRIGATORIO: 'N', ORDINAL: '3º' },
] as const;

/** Creating a report = the report row + its 3 fixed parameters (WHEN-CREATE-RECORD). */
export interface ReportsRepo {
  /** `values` are the insert values after `reportsHooks` (ID sequence, audit). */
  criar(values: Values, ctx: CrudCtx): Promise<Row>;
}

/** One parameter's insert values, as both repos write them (hooks = audit columns). */
function paramValues(p: (typeof FIXED_PARAMS)[number], paramHooks: CrudHooks, ctx: CrudCtx): Values {
  const v = {
    NOME: p.NOME,
    TIPO_PARAMETRO_RF: p.TIPO_PARAMETRO_RF,
    OBRIGATORIO: p.OBRIGATORIO,
    CHECK_UNIQUE: 'N',
    VALIDO: 'S',
  };
  return paramHooks.beforeInsert?.(v, ctx) ?? v;
}

/**
 * `INSERT` over a resource's own columns (plain Oracle identifiers, checked against `columns`);
 * values are binds or `SqlExpr`. Same shape as `oracleStore.insert`, minus `SqlCall`/dates, which
 * `reportsHooks` / `auditHooks` never produce.
 */
function insertSql(table: string, columns: object, values: Values, returning = '') {
  const binds: Record<string, unknown> = {};
  const cols = Object.keys(values);
  const sqlValues = cols.map((c, i) => {
    if (!Object.hasOwn(columns, c)) throw new Error(`Coluna desconhecida: ${c}`);
    const v = values[c];
    if (v instanceof SqlExpr) return v.sql;
    binds[`v${i}`] = v;
    return `:v${i}`;
  });
  return { sql: `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${sqlValues.join(', ')})${returning}`, binds };
}

/**
 * Oracle: the report and its 3 parameters in ONE transaction, so a failure part-way (a timeout,
 * an ORA error) rolls everything back instead of leaving a report with too few parameters, which
 * `withParamCountCheck` would then refuse to edit and `withDeleteGuard` to delete.
 * `store` (the plain report store) reads the new row back with its `_rid`, after the commit; if
 * that read fails the report still exists, so the answer is the id and `_rid` (never an error
 * that would make the user create it twice).
 */
export function oracleReportsRepo(
  pool: DbPool,
  callTimeoutMs: number,
  store: CrudStore,
  paramHooks: CrudHooks,
): ReportsRepo {
  return {
    criar: async (values, ctx) => {
      let created: { id: number; rowid: string };
      try {
        created = await withTransaction(pool, ctx.user, 'reports.criar', callTimeoutMs, async (conn) => {
          const rep = insertSql(reports.source, reports.columns, values, ' RETURNING ID, ROWID INTO :nid, :nrid');
          const r = await conn.execute(rep.sql, {
            ...rep.binds,
            nid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
            nrid: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 4000 },
          } as oracledb.BindParameters);
          const out = r.outBinds as { nid: number[]; nrid: string[] };
          const [id, rowid] = [out.nid[0], out.nrid[0]];
          if (id == null || !rowid) throw new AppError(500, 'ERRO_INTERNO', 'Não foi possível criar o relatório.');
          const params = FIXED_PARAMS.map((p) =>
            insertSql(reportParametros.source, reportParametros.columns, {
              ...paramValues(p, paramHooks, ctx),
              REPORT_ID: id,
              N_PARAMETRO: p.N_PARAMETRO,
            }),
          );
          await conn.executeMany(params[0]!.sql, params.map((p) => p.binds) as oracledb.BindParameters[]);
          return { id, rowid };
        });
      } catch (e) {
        throw e instanceof AppError ? e : mapOracleError(e);
      }
      const _rid = encodeRid(created.rowid);
      return (await store.get(_rid, ctx).catch(() => undefined)) ?? { _rid, ID: created.id };
    },
  };
}

/**
 * Memory (dev server, unit tests): the same rows through the CrudStores the routes use.
 * `parametros` must assign `N_PARAMETRO` itself (`withAutoParametro`). A failed parameter insert
 * removes the report again, as the Oracle transaction would.
 */
export function memoryReportsRepo(
  store: CrudStore,
  parametros: CrudStore,
  paramHooks: CrudHooks,
): ReportsRepo {
  return {
    criar: async (values, ctx) => {
      const row = await store.insert(values, {}, ctx);
      try {
        for (const p of FIXED_PARAMS) {
          await parametros.insert(paramValues(p, paramHooks, ctx), { REPORT_ID: row['ID'] as number }, ctx);
        }
      } catch (e) {
        // ponytail: parameters already seeded stay behind (memory has no FK); ids never repeat.
        const { _rid, ...orig } = row;
        await store.remove(String(_rid), orig, ctx).catch(() => {});
        throw e;
      }
      return row;
    },
  };
}
