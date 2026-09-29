import type { FastifyInstance } from 'fastify';
import { tiposMidia } from '@gestsiid/shared';
import {
  auditHooks,
  crudRoutes,
  type CrudCtx,
  type CrudHooks,
  type CrudStore,
  type Row,
  type Values,
} from '../../lib/crud.ts';

/** FD_TIPOS_MiDIA PRE-INSERT: audit + `GEN_MEDIDA_RF` default `'DIGITAL'`; `ID` is upper-case. */
export const tiposMidiaHooks: CrudHooks = {
  beforeInsert: (v, ctx) => ({
    ...auditHooks.beforeInsert!(v, ctx),
    ID: String(v['ID']).toUpperCase(),
    GEN_MEDIDA_RF: 'DIGITAL',
  }),
  beforeUpdate: auditHooks.beforeUpdate,
};

/**
 * POST-CHANGE `TAMANHO_BYTES := TRUNC(NVL(TAMANHO_MIDIA,1) * FACTOR)`, FACTOR being the unit's
 * (`WHEN OTHERS` → 1 when the unit is not found; a null FACTOR stays null, as in the trigger).
 * `toPrecision(15)` drops binary float noise so 8,54 × 1e9 is 8540000000 like Oracle's NUMBER.
 */
async function bytesOf(unidades: CrudStore, row: Row, ctx: CrudCtx): Promise<number | null> {
  const id = row['UNIDADE_MEDIDA_ID'];
  let factor: unknown = 1;
  if (typeof id === 'string') {
    const found = await unidades.list(
      {
        filters: {
          ID: [{ op: 'eq', value: id }],
          GEN_MEDIDA_RF: [{ op: 'eq', value: 'DIGITAL' }],
        },
        sort: [],
        page: 1,
        size: 1,
      },
      {},
      ctx,
    );
    if (found.rows[0]) factor = found.rows[0]['FACTOR'];
  }
  if (typeof factor !== 'number') return null;
  return Math.trunc(Number((Number(row['TAMANHO_MIDIA'] ?? 1) * factor).toPrecision(15)));
}

/** The store with `TAMANHO_BYTES` filled server-side whenever the size or the unit is written. */
function withBytes(store: CrudStore, unidades: CrudStore): CrudStore {
  const touches = (v: Values) => 'TAMANHO_MIDIA' in v || 'UNIDADE_MEDIDA_ID' in v;
  return {
    ...store,
    insert: async (v, parent, ctx) =>
      store.insert({ ...v, TAMANHO_BYTES: await bytesOf(unidades, v, ctx) }, parent, ctx),
    update: async (rid, orig, v, ctx) => {
      if (!touches(v)) return store.update(rid, orig, v, ctx);
      const merged = { ...(await store.get(rid, ctx)), ...v };
      return store.update(
        rid,
        orig,
        { ...v, TAMANHO_BYTES: await bytesOf(unidades, merged, ctx) },
        ctx,
      );
    },
  };
}

export function registerTiposMidiaRoutes(
  app: FastifyInstance,
  deps: { store: CrudStore; unidades: CrudStore },
): void {
  crudRoutes(app, tiposMidia, {
    store: withBytes(deps.store, deps.unidades),
    hooks: tiposMidiaHooks,
  });
}
