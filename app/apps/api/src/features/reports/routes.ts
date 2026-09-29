import type { FastifyInstance } from 'fastify';
import { reportParametros, reports } from '@gestsiid/shared';
import { AppError } from '../../db/errors.ts';
import {
  auditHooks,
  crudRoutes,
  SqlExpr,
  type CrudHooks,
  type CrudStore,
} from '../../lib/crud.ts';

const CANNOT_DELETE_WITH_DETAILS =
  'Impossível apagar registo mestre se existirem registos de detalhe correspondentes.';

const N_PARAM_ERRADO =
  'O número de parâmetros inseridos tem que ser igual ao número de parâmetros na informação do relatório.';

/**
 * The 3 parameters every report starts with (FD_CONFIGURACAO_REPORTS WHEN-NEW-BLOCK-INSTANCE):
 * seeded on the report's creation (`withFixedParamSeed`) and name-locked afterwards
 * (`withNomeLock`, alerts `ALERTA_1PARAM..3PARAM`).
 */
const FIXED_PARAMS = [
  { N_PARAMETRO: 1, NOME: '_USER', TIPO_PARAMETRO_RF: '2', OBRIGATORIO: 'S', ORDINAL: '1º' },
  { N_PARAMETRO: 2, NOME: 'P_USUARIO', TIPO_PARAMETRO_RF: '1', OBRIGATORIO: 'S', ORDINAL: '2º' },
  { N_PARAMETRO: 3, NOME: 'P_DATAACTUAL', TIPO_PARAMETRO_RF: '1', OBRIGATORIO: 'N', ORDINAL: '3º' },
] as const;

/** `id_template_report_seq.nextVal` (FD_CONFIGURACAO_REPORTS WHEN-CREATE-RECORD). */
export const reportsHooks: CrudHooks = {
  beforeInsert: (v, ctx) => ({
    ...auditHooks.beforeInsert!(v, ctx),
    ID: new SqlExpr('ID_TEMPLATE_REPORT_SEQ.NEXTVAL'),
  }),
  beforeUpdate: auditHooks.beforeUpdate,
};

export const reportParametrosHooks: CrudHooks = auditHooks;

/** PRE-INSERT of `SVR_PARAMETROS_REPORT`: `N_PARAMETRO` 1, else `MAX(N_PARAMETRO)+1`, per report. */
function withAutoParametro(store: CrudStore): CrudStore {
  return {
    ...store,
    insert: async (values, parent, ctx) => {
      const { rows } = await store.list(
        { filters: {}, sort: [{ column: 'N_PARAMETRO', direction: 'desc' }], page: 1, size: 1 },
        parent,
        ctx,
      );
      const max = Number(rows[0]?.['N_PARAMETRO'] ?? 0);
      return store.insert({ ...values, N_PARAMETRO: max + 1 }, parent, ctx);
    },
  };
}

/** WHEN-VALIDATE-RECORD: rows 1–3's `NOME` cannot change away from its fixed value. */
function withNomeLock(store: CrudStore): CrudStore {
  return {
    ...store,
    update: async (rid, orig, values, ctx) => {
      const fixed = FIXED_PARAMS.find((p) => p.N_PARAMETRO === Number(orig['N_PARAMETRO']));
      if (fixed && 'NOME' in values && values['NOME'] !== fixed.NOME) {
        const msg = `O ${fixed.ORDINAL} parâmetro é obrigatório ser '${fixed.NOME}'.`;
        throw new AppError(400, 'VALIDACAO', msg, { fields: { 'values.NOME': msg } });
      }
      return store.update(rid, orig, values, ctx);
    },
  };
}

/** WHEN-CREATE-RECORD: a brand new report gets its 3 fixed parameters right away. */
function withFixedParamSeed(store: CrudStore, autoParametros: CrudStore): CrudStore {
  return {
    ...store,
    insert: async (values, parent, ctx) => {
      const row = await store.insert(values, parent, ctx);
      const reportId = row['ID'] as number;
      for (const p of FIXED_PARAMS) {
        await autoParametros.insert(
          reportParametrosHooks.beforeInsert!(
            {
              NOME: p.NOME,
              TIPO_PARAMETRO_RF: p.TIPO_PARAMETRO_RF,
              OBRIGATORIO: p.OBRIGATORIO,
              CHECK_UNIQUE: 'N',
              VALIDO: 'S',
            },
            ctx,
          ),
          { REPORT_ID: reportId },
          ctx,
        );
      }
      return row;
    },
  };
}

/** KEY-COMMIT: once a report has parameter rows, `N_PARAMETROS` must equal their count. */
function withParamCountCheck(store: CrudStore, autoParametros: CrudStore): CrudStore {
  return {
    ...store,
    update: async (rid, orig, values, ctx) => {
      const reportId = orig['ID'] as number;
      const nParametros = 'N_PARAMETROS' in values ? values['N_PARAMETROS'] : orig['N_PARAMETROS'];
      const { total } = await autoParametros.list(
        { filters: {}, sort: [], page: 1, size: 1 },
        { REPORT_ID: reportId },
        ctx,
      );
      if (total > 0 && (nParametros == null || Number(nParametros) !== total)) {
        throw new AppError(400, 'VALIDACAO', N_PARAM_ERRADO, {
          fields: { 'values.N_PARAMETROS': N_PARAM_ERRADO },
        });
      }
      return store.update(rid, orig, values, ctx);
    },
  };
}

/** ON-CHECK-DELETE-MASTER: refuses the delete while `SVR_PARAMETROS_REPORT` still has rows. */
function withDeleteGuard(store: CrudStore, autoParametros: CrudStore): CrudStore {
  return {
    ...store,
    remove: async (rid, orig, ctx) => {
      const row = await store.get(rid, ctx);
      const id = row?.['ID'];
      if (typeof id === 'number') {
        const { total } = await autoParametros.list(
          { filters: {}, sort: [], page: 1, size: 1 },
          { REPORT_ID: id },
          ctx,
        );
        if (total > 0) throw new AppError(409, 'ORA_02292', CANNOT_DELETE_WITH_DETAILS);
      }
      return store.remove(rid, orig, ctx);
    },
  };
}

export function registerReportsCrudRoutes(
  app: FastifyInstance,
  deps: { store: CrudStore; parametrosStore: CrudStore },
): void {
  const autoParametros = withAutoParametro(deps.parametrosStore);
  const reportsStore = withParamCountCheck(
    withDeleteGuard(deps.store, autoParametros),
    autoParametros,
  );

  crudRoutes(app, reports, {
    store: withFixedParamSeed(reportsStore, autoParametros),
    hooks: reportsHooks,
  });
  crudRoutes(app, reportParametros, {
    store: withNomeLock(autoParametros),
    hooks: reportParametrosHooks,
    path: '/api/reports/:REPORT_ID/parametros',
  });
}
