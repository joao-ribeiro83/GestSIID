import type { FastifyInstance } from 'fastify';
import { variaveis } from '@gestsiid/shared';
import { AppError } from '../../db/errors.ts';
import { crudRoutes, type CrudCtx, type CrudHooks, type CrudStore } from '../../lib/crud.ts';

// Alert 'OK' of FD_VARIAVEIS_SIID, raised by WHEN-VALIDATE-ITEM of TIPO_VARIAVEL_RF.
const JA_ASSOCIADO = 'Este tipo de variável já está associado.';

/** The form's WHEN-CREATE-RECORD: `AMBIENTE_ID` is the configured environment. */
export const variaveisHooks = (ambiente: string): CrudHooks => ({
  beforeInsert: (v) => ({ ...v, AMBIENTE_ID: ambiente }),
});

/**
 * The form's default WHERE (`AMBIENTE_ID = <environment>`, password rows hidden — the resource's
 * `exclude`) applied to every read and write. A list is scoped in SQL; a row reached by rid is
 * checked, so a rid of another environment or of a PASSWORD row is a 404. The primary key clash
 * (ORA-00001) is the form's "type already associated" alert, on insert and on renaming the type.
 */
function scoped(store: CrudStore, ambiente: string): CrudStore {
  const hidden: readonly string[] = variaveis.exclude.values;
  const mine = async (rid: string, ctx: CrudCtx) => {
    const row = await store.get(rid, ctx);
    return row?.['AMBIENTE_ID'] === ambiente && !hidden.includes(String(row['TIPO_VARIAVEL_RF']))
      ? row
      : undefined;
  };
  const found = async (rid: string, ctx: CrudCtx) => {
    if (!(await mine(rid, ctx))) throw new AppError(404, 'NAO_ENCONTRADO', 'Registo não encontrado.');
  };
  const clash = (e: unknown) =>
    e instanceof AppError && e.code === 'ORA_00001'
      ? new AppError(409, 'ORA_00001', JA_ASSOCIADO, {
          fields: { 'values.TIPO_VARIAVEL_RF': JA_ASSOCIADO },
        })
      : e;

  return {
    list: (q, parent, ctx) =>
      store.list(
        { ...q, filters: { ...q.filters, AMBIENTE_ID: [{ op: 'eq', value: ambiente }] } },
        parent,
        ctx,
      ),
    get: mine,
    insert: (v, parent, ctx) =>
      store.insert(v, parent, ctx).catch((e: unknown) => {
        throw clash(e);
      }),
    update: async (rid, orig, v, ctx) => {
      await found(rid, ctx);
      return store.update(rid, orig, v, ctx).catch((e: unknown) => {
        throw clash(e);
      });
    },
    remove: async (rid, orig, ctx) => {
      await found(rid, ctx);
      return store.remove(rid, orig, ctx);
    },
  };
}

export function registerVariaveisRoutes(
  app: FastifyInstance,
  deps: { store: CrudStore; ambiente: string },
): void {
  crudRoutes(app, variaveis, {
    store: scoped(deps.store, deps.ambiente),
    hooks: variaveisHooks(deps.ambiente),
  });
}
