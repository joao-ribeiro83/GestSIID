import type { FastifyInstance } from 'fastify';
import { dominios, dominiosValores } from '@gestsiid/shared';
import { AppError } from '../../db/errors.ts';
import {
  auditHooks,
  crudRoutes,
  SYSDATE,
  type CrudHooks,
  type CrudStore,
  type Parent,
  type Values,
} from '../../lib/crud.ts';
import type { DominiosCache } from './valores.ts';

const CANNOT_DELETE_WITH_DETAILS =
  'Impossível apagar registo mestre se existirem registos de detalhe correspondentes.';

/**
 * PRE-INSERT of `CFG_DOMINIOS` (WHEN-CREATE-RECORD): `REGISTADO_POR`/`DATA_REGISTO` from the
 * session (not `CRIADO_POR`/`DATA_CRIACAO` — this table's own naming), `ESTADO_REGISTO_RF:='N'`,
 * `DATA_ESTADO:=SYSDATE`. PRE-UPDATE reuses `auditHooks` — `ACTUALIZADO_POR`/`DATA_ACTUALIZACAO`
 * are named the same way here as everywhere else.
 */
export const dominiosHooks: CrudHooks = {
  beforeInsert: (v, { user }) => ({
    ...v,
    REGISTADO_POR: user.username,
    DATA_REGISTO: SYSDATE,
    ESTADO_REGISTO_RF: 'N',
    DATA_ESTADO: SYSDATE,
  }),
  beforeUpdate: auditHooks.beforeUpdate,
};

/** Same PRE-INSERT/PRE-UPDATE column names as the master, for `CFG_VALORES_DOMINIO`. */
export const dominiosValoresHooks: CrudHooks = {
  beforeInsert: (v, { user }) => ({ ...v, REGISTADO_POR: user.username, DATA_REGISTO: SYSDATE }),
  beforeUpdate: auditHooks.beforeUpdate,
};

/**
 * ON-CHECK-DELETE-MASTER: refuses the delete while `CFG_VALORES_DOMINIO` still has rows for this
 * domain, with the legacy message (also reachable from Oracle's own FK, `ORA_02292` in
 * `db/errors.ts` — this pre-check just gives the same answer without a round trip to the DB error).
 */
function withDeleteGuard(store: CrudStore, valoresStore: CrudStore): CrudStore {
  return {
    ...store,
    remove: async (rid, orig, ctx) => {
      const row = await store.get(rid, ctx);
      const id = row?.['ID'];
      if (typeof id === 'string') {
        const { total } = await valoresStore.list(
          { filters: {}, sort: [], page: 1, size: 1 },
          { DOMINIO_ID: id },
          ctx,
        );
        if (total > 0) throw new AppError(409, 'ORA_02292', CANNOT_DELETE_WITH_DETAILS);
      }
      return store.remove(rid, orig, ctx);
    },
  };
}

/** A write to a domain's values must not leave the lookup feed (`features/dominios/valores.ts`)
 * serving what it cached before the write. */
function withCacheInvalidation(store: CrudStore, cache: DominiosCache): CrudStore {
  const domId = (parent: Parent, orig: Values, row: Record<string, unknown>) =>
    String(parent['DOMINIO_ID'] ?? orig['DOMINIO_ID'] ?? row['DOMINIO_ID']);
  return {
    ...store,
    insert: async (values, parent, ctx) => {
      const row = await store.insert(values, parent, ctx);
      cache.invalidate(domId(parent, {}, row));
      return row;
    },
    update: async (rid, orig, values, ctx) => {
      const row = await store.update(rid, orig, values, ctx);
      cache.invalidate(domId({}, orig, row));
      return row;
    },
    remove: async (rid, orig, ctx) => {
      await store.remove(rid, orig, ctx);
      cache.invalidate(domId({}, orig, {}));
    },
  };
}

export function registerDominiosCrudRoutes(
  app: FastifyInstance,
  deps: { store: CrudStore; valoresStore: CrudStore; cache?: DominiosCache },
): void {
  crudRoutes(app, dominios, {
    store: withDeleteGuard(deps.store, deps.valoresStore),
    hooks: dominiosHooks,
  });
  crudRoutes(app, dominiosValores, {
    store: deps.cache ? withCacheInvalidation(deps.valoresStore, deps.cache) : deps.valoresStore,
    hooks: dominiosValoresHooks,
    path: '/api/dominios/:DOMINIO_ID/lista',
  });
}
