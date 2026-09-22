import type { FastifyInstance } from 'fastify';
import { impressoras } from '@gestsiid/shared';
import { auditHooks, crudRoutes, SqlExpr, type CrudHooks, type CrudStore } from '../../lib/crud.ts';

/** `ID_IMPRESSORA_SEQ.NEXTVAL` (FD_IMPRESSORAS_SIID PRE-INSERT) — never from the client. */
export const impressorasHooks: CrudHooks = {
  beforeInsert: (v, ctx) => ({
    ...auditHooks.beforeInsert!(v, ctx),
    ID: new SqlExpr('ID_IMPRESSORA_SEQ.NEXTVAL'),
  }),
  beforeUpdate: auditHooks.beforeUpdate,
};

export function registerImpressorasRoutes(app: FastifyInstance, deps: { store: CrudStore }): void {
  crudRoutes(app, impressoras, { store: deps.store, hooks: impressorasHooks });
}
