import oracledb from 'oracledb';
import { reports } from '@gestsiid/shared';
import { AppError, mapOracleError } from '../../db/errors.ts';
import { withTransaction, type DbPool } from '../../db/oracle.ts';
import { SqlExpr, type CrudCtx, type CrudStore, type Row, type Values } from '../../lib/crud.ts';
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

/**
 * Oracle: the report and its 3 parameters in ONE transaction, so a failure part-way (a timeout,
 * an ORA error) rolls everything back instead of leaving a report with too few parameters, which
 * `withParamCountCheck` would then refuse to edit and `withDeleteGuard` to delete.
 * `store` (the plain report store) reads the new row back with its `_rid`, after the commit.
 */
export function oracleReportsRepo(pool: DbPool, callTimeoutMs: number, store: CrudStore): ReportsRepo {
  return {
    criar: async (values, ctx) => {
      let rowid: string;
      try {
        rowid = await withTransaction(pool, ctx.user, 'reports.criar', callTimeoutMs, async (conn) => {
          // Columns come from the zod-checked request plus the hooks; only the resource's own
          // (plain Oracle identifiers) are ever pasted into the SQL. Values are binds or SqlExpr.
          const binds: Record<string, unknown> = {};
          const cols = Object.keys(values);
          const sqlValues = cols.map((c, i) => {
            if (!Object.hasOwn(reports.columns, c)) throw new Error(`Coluna desconhecida: ${c}`);
            const v = values[c];
            if (v instanceof SqlExpr) return v.sql;
            binds[`v${i}`] = v;
            return `:v${i}`;
          });
          const r = await conn.execute(
            `INSERT INTO SVR_REPORT_SIID (${cols.join(', ')}) VALUES (${sqlValues.join(', ')}) RETURNING ID, ROWID INTO :nid, :nrid`,
            {
              ...binds,
              nid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
              nrid: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 4000 },
            } as oracledb.BindParameters,
          );
          const out = r.outBinds as { nid: number[]; nrid: string[] };
          const reportId = out.nid[0];
          for (const p of FIXED_PARAMS) {
            await conn.execute(
              `INSERT INTO SVR_PARAMETROS_REPORT (REPORT_ID, N_PARAMETRO, NOME, TIPO_PARAMETRO_RF, OBRIGATORIO, CHECK_UNIQUE, VALIDO, CRIADO_POR, DATA_CRIACAO)
               VALUES (:rep, :n, :nome, :tipo, :obr, 'N', 'S', :por, SYSDATE)`,
              { rep: reportId, n: p.N_PARAMETRO, nome: p.NOME, tipo: p.TIPO_PARAMETRO_RF, obr: p.OBRIGATORIO, por: ctx.user.username },
            );
          }
          return out.nrid[0] ?? '';
        });
      } catch (e) {
        throw e instanceof AppError ? e : mapOracleError(e);
      }
      const row = await store.get(encodeRid(rowid), ctx);
      if (!row) throw new AppError(404, 'NAO_ENCONTRADO', 'Registo não encontrado.');
      return row;
    },
  };
}

/**
 * Memory (dev server, unit tests): the same rows through the CrudStores the routes use.
 * `parametros` must assign `N_PARAMETRO` itself (`withAutoParametro`).
 */
export function memoryReportsRepo(
  store: CrudStore,
  parametros: CrudStore,
  paramHooks: { beforeInsert?: (v: Values, ctx: CrudCtx) => Values },
): ReportsRepo {
  return {
    criar: async (values, ctx) => {
      const row = await store.insert(values, {}, ctx);
      for (const p of FIXED_PARAMS) {
        const v = { NOME: p.NOME, TIPO_PARAMETRO_RF: p.TIPO_PARAMETRO_RF, OBRIGATORIO: p.OBRIGATORIO, CHECK_UNIQUE: 'N', VALIDO: 'S' };
        await parametros.insert(paramHooks.beforeInsert?.(v, ctx) ?? v, { REPORT_ID: row['ID'] as number }, ctx);
      }
      return row;
    },
  };
}
