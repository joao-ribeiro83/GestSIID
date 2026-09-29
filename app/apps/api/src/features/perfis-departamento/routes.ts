import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  empregadosLov,
  funcoesDepartamento,
  perfisDepartamento,
  PERFIS_DOMINIOS,
} from '@gestsiid/shared';
import { AppError } from '../../db/errors.ts';
import {
  auditHooks,
  crudRoutes,
  sessionCtx,
  SqlExpr,
  type CrudHooks,
  type CrudStore,
  type Values,
} from '../../lib/crud.ts';
import { imageRoutes, type ImageStore } from '../../lib/imageRoutes.ts';
import type { PerfisRepo } from './repo.ts';

/**
 * `FD_PERFIS_DEPARTAMENTO` (BR-ADM-04), ADM only, one block.
 *
 *   GET|POST|PUT /api/perfis-departamento        CRUD (no DELETE: Forms deletes only unsaved rows)
 *   GET  /api/perfis-departamento/sugestao?cdemplea=   CODIGO / FUNCAODEP_ID / NOME for a new row
 *   PUT|GET|DELETE /api/perfis-departamento/:id/assinatura   the ASSINATURA BLOB (ARCHITECTURE §6)
 *   GET  /api/empregados-lov                     LOV EMPREGADOS (active employees)
 *   GET  /api/dominios/FUNCOES_DEPARTAMENTO/valores   select over the valid funções
 */

const upper = (v: Values, cols: readonly string[]): Values => {
  const out = { ...v };
  for (const c of cols) if (typeof out[c] === 'string') out[c] = out[c].toUpperCase();
  return out;
};

/** PRE-INSERT: `ID = MAX(ID)+1` (a race is ORA-00001 → 409, the user retries); CaseRestriction Upper. */
export const perfisHooks: CrudHooks = {
  beforeInsert: (v, ctx) => ({
    ...upper(auditHooks.beforeInsert!(v, ctx), ['CDEMPLEA', 'CDDEPARTA', 'CODIGO']),
    ID: new SqlExpr('(SELECT NVL(MAX(ID), 0) + 1 FROM DOC_PERFIS_DEPARTAMENTO)'),
  }),
  beforeUpdate: (v, ctx) => upper(auditHooks.beforeUpdate!(v, ctx), ['CDEMPLEA', 'CODIGO']),
};

/** The block has DELETE_ALLOWED only for unsaved records, which never reach the API. */
const noDelete = (store: CrudStore): CrudStore => ({
  ...store,
  remove: async () => {
    throw new AppError(403, 'SEM_PERMISSAO', 'Não tem permissão para esta operação.');
  },
});

/** A record group's WHERE (`swactivo='S'`, `registo_valido='S'`) forced on every read. */
const only = (store: CrudStore, column: string, value: string): CrudStore => ({
  ...store,
  list: (q, parent, ctx) =>
    store.list({ ...q, filters: { ...q.filters, [column]: [{ op: 'eq', value }] } }, parent, ctx),
  get: async (rid, ctx) => {
    const row = await store.get(rid, ctx);
    return row?.[column] === value ? row : undefined;
  },
});

const idParams = z.object({ id: z.coerce.number().int().positive() });
const sugestaoQuery = z.object({ cdemplea: z.string().min(1).max(30) });

export function registerPerfisDepartamentoRoutes(
  app: FastifyInstance,
  deps: {
    store: CrudStore;
    empregadosStore: CrudStore;
    funcoesStore: CrudStore;
    repo: PerfisRepo;
    imageStore: ImageStore;
    maxBytes: number;
  },
): void {
  const { read } = perfisDepartamento.roles;

  // Registered before the CRUD routes' `/:rid` (a static path wins anyway).
  app.get('/api/perfis-departamento/sugestao', async (request) => {
    const ctx = sessionCtx(request, read);
    const { cdemplea } = sugestaoQuery.parse(request.query);
    return deps.repo.sugestao(cdemplea, ctx);
  });

  crudRoutes(app, perfisDepartamento, {
    store: noDelete(deps.store),
    hooks: perfisHooks,
  });

  imageRoutes(app, {
    path: '/api/perfis-departamento/:id/assinatura',
    store: deps.imageStore,
    key: (params) => ({ id: idParams.parse(params).id }),
    roles: perfisDepartamento.roles.write,
    maxBytes: deps.maxBytes,
  });

  crudRoutes(app, empregadosLov, { store: only(deps.empregadosStore, 'SWACTIVO', 'S') });

  const funcoes = only(deps.funcoesStore, 'REGISTO_VALIDO', 'S');
  app.get(`/api/dominios/${PERFIS_DOMINIOS.funcoes}/valores`, async (request) => {
    const ctx = sessionCtx(request, funcoesDepartamento.roles.read);
    const { rows } = await funcoes.list(
      { filters: {}, sort: funcoesDepartamento.defaultSort.slice(), page: 1, size: 500 },
      {},
      ctx,
    );
    return { rows: rows.map((r) => ({ CHAVE: r['ID'], DESIGNACAO: r['NOME'] })) };
  });
}
