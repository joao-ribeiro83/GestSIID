import type { FastifyInstance } from 'fastify';
import { utilizadores } from '@gestsiid/shared';
import { AppError } from '../../db/errors.ts';
import {
  auditHooks,
  crudRoutes,
  SqlCall,
  type CrudHooks,
  type CrudStore,
  type Values,
} from '../../lib/crud.ts';

// Same call the login compares against (auth/repo.ts LOGIN_SQL): PL/SQL turned the RAW into hex
// when the form assigned it to the VARCHAR2 item, so the hex is stored. Hashed inside the
// INSERT/UPDATE itself, the plain text is only ever a bind.
const encrypt = (password: unknown) => new SqlCall('RAWTOHEX(USER_SECURITY.ENCRYPT(?))', password);

/**
 * PRE-INSERT / PRE-UPDATE of FD_UTILIZADORES_SIID: audit, `NIVEL_ACESSO_RF := 0`, PASSWORD
 * encrypted (on update only when a new one is sent — the form re-encrypted whatever the item
 * held, i.e. the stored hash again, which is a bug not to port). `AMBIENTE_ID` is the configured
 * environment (WHEN-CREATE-RECORD: `GLOBAL.AMBIENTE_ID`); `USERNAME`/`NOME` are upper-case items.
 */
export function utilizadoresHooks(ambiente: string): CrudHooks {
  return {
    beforeInsert: (v, ctx) => ({
      ...auditHooks.beforeInsert!(v, ctx),
      USERNAME: String(v['USERNAME']).toUpperCase(),
      NOME: String(v['NOME']).toUpperCase(),
      PASSWORD: encrypt(v['PASSWORD']),
      AMBIENTE_ID: ambiente,
      NIVEL_ACESSO_RF: 0,
    }),
    beforeUpdate: (v, ctx) => ({
      ...auditHooks.beforeUpdate!(v, ctx),
      ...(v['PASSWORD'] !== undefined && { PASSWORD: encrypt(v['PASSWORD']) }),
      NIVEL_ACESSO_RF: 0,
    }),
  };
}

/** POST-CHANGE of DATA_INICIO / DATA_FIM: `Message('A data de início é superior à data de fim.')`. */
function checkDates(row: Values): void {
  const { DATA_INICIO: from, DATA_FIM: to } = row;
  if (typeof from === 'string' && typeof to === 'string' && from > to)
    throw new AppError(400, 'VALIDACAO', 'Dados inválidos.', {
      fields: { 'values.DATA_FIM': 'A data de início é superior à data de fim.' },
    });
}

/** The store with the date order checked on the row as it would be after the write. */
function withDateOrder(store: CrudStore): CrudStore {
  return {
    ...store,
    insert: (v, parent, ctx) => (checkDates(v), store.insert(v, parent, ctx)),
    update: async (rid, orig, v, ctx) => {
      if ('DATA_INICIO' in v || 'DATA_FIM' in v)
        checkDates({ ...(await store.get(rid, ctx)), ...v });
      return store.update(rid, orig, v, ctx);
    },
  };
}

export function registerUtilizadoresRoutes(
  app: FastifyInstance,
  deps: { store: CrudStore; ambiente: string },
): void {
  crudRoutes(app, utilizadores, {
    store: withDateOrder(deps.store),
    hooks: utilizadoresHooks(deps.ambiente),
  });
}
