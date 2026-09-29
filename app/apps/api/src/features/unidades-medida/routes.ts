import type { FastifyInstance } from 'fastify';
import { unidadesMedida, UNIDADES_DOMINIOS, type ListQuery } from '@gestsiid/shared';
import {
  auditHooks,
  crudRoutes,
  sessionCtx,
  type CrudHooks,
  type CrudStore,
} from '../../lib/crud.ts';

/**
 * FD_UNIDADES_MEDIDA: `ID` is typed by the user, upper-case (item CaseRestriction); PRE-INSERT
 * audit; `GEN_MEDIDA_RF` is off-canvas with initial value `'DIGITAL'`, so the server sets it.
 */
export const unidadesMedidaHooks: CrudHooks = {
  beforeInsert: (v, ctx) => ({
    ...auditHooks.beforeInsert!(v, ctx),
    ID: String(v['ID']).toUpperCase(),
    GEN_MEDIDA_RF: 'DIGITAL',
  }),
  beforeUpdate: auditHooks.beforeUpdate,
};

const byFactor: ListQuery['sort'] = [{ column: 'FACTOR', direction: 'asc' }];

export function registerUnidadesMedidaRoutes(
  app: FastifyInstance,
  deps: { store: CrudStore },
): void {
  crudRoutes(app, unidadesMedida, { store: deps.store, hooks: unidadesMedidaHooks });

  // Select feeds, in the `/dominios/:id/valores` shape the DataBlock selects already read
  // (a static path wins over the `:dominioId` route). Straight from the store: no extra SQL.
  const feed = (dominioId: string, filters: ListQuery['filters']) =>
    app.get(`/api/dominios/${dominioId}/valores`, async (request) => {
      const ctx = sessionCtx(request, unidadesMedida.roles.read);
      const { rows } = await deps.store.list(
        { filters, sort: byFactor, page: 1, size: 500 },
        {},
        ctx,
      );
      return { rows: rows.map((r) => ({ CHAVE: r['ID'], DESIGNACAO: r['NOME'] })) };
    });
  // RG_UNIDADES_BASE: SELECT NOME, ID ... WHERE UNIDADE_BASE_ID IS NULL
  feed(UNIDADES_DOMINIOS.base, { UNIDADE_BASE_ID: [{ op: 'null' }] });
  // RG_UNIDADES_MEDIDA: ... WHERE GEN_MEDIDA_RF = :TIPOS_MIDIA.GEN_MEDIDA_RF ORDER BY FACTOR
  feed(UNIDADES_DOMINIOS.todas, { GEN_MEDIDA_RF: [{ op: 'eq', value: 'DIGITAL' }] });
}
