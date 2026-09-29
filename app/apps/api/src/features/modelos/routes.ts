import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  modelos,
  modelosAtributosArquivo,
  modelosAtributosEdoc,
  modelosCondicoes,
  modelosParametrosOmissao,
  modelosSeccoes,
  MODELOS_DOMINIOS,
} from '@gestsiid/shared';
import { AppError } from '../../db/errors.ts';
import { auditHooks, crudRoutes, sessionCtx, type CrudStore } from '../../lib/crud.ts';
import { localNow } from '../permissoes/repo.ts';
import { normalizaData } from '../permissoes/rules.ts';
import type { AlvoRamo, ListaOpcoes, ModelosRepo, ModelosStores } from './repo.ts';
import { APAGAR_MESTRE, erroIntervalo, INICIO_SUPERIOR } from './rules.ts';

/**
 * `FD_CONFIGURACAO_MODELOS` (BR-MOD-01..14, ARCHITECTURE §10.1 "modelos"), ADM only. Per-row
 * crudRoutes for the master and each tab (path params = parent key column names), plus:
 *
 *   POST /api/modelos/:MODELO_ID/acoes/clonar                              Clonar Modelo (BR-MOD-03)
 *   POST /api/modelos/:MODELO_ID/seccoes/:TIPOSEC_ID/:ALINEA/acoes/clonar  Clonar alínea (BR-MOD-05)
 *   GET  /api/modelos/:MODELO_ID/parametros-report                         BR-MOD-08
 *   PUT  /api/modelos/:MODELO_ID/parametros-report/:N_PARAMETRO/omissao    BR-MOD-09 versioning
 *   GET  /api/dominios/{MODELOS_GENERICOS,TIPOS_CONTEUDO,CONTEXTOS_APR}/valores   select feeds (D-28)
 */

const ADM = modelos.roles.write;
const M = '/api/modelos/:MODELO_ID';

const semPermissao = async (): Promise<never> => {
  throw new AppError(403, 'SEM_PERMISSAO', 'Não tem permissão para esta operação.');
};

const DATA = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/;
// A real calendar instant (no 2026-02-30), so TO_DATE never sees a bad value.
const data = z
  .string()
  .regex(DATA)
  .transform(normalizaData)
  .refine((v) => {
    const t = Date.parse(`${v}Z`);
    return Number.isFinite(t) && new Date(t).toISOString().slice(0, 19) === v;
  }, 'Data inválida.');
const dataOpc = data.nullable().optional().transform((v) => v ?? null);
const textoOpc = (max: number) => z.string().max(max).nullable().optional().transform((v) => v || null);

const clonarBody = z.object({
  ID: z.string().min(1).max(10),
  DESCRICAO: z.string().min(1).max(240),
  N_COPIAS: z.number(),
  FORMA_CONTROLO_RF: z.enum(['C', 'V', 'U', 'UV']),
  DATA_INICIO: data,
  DATA_FIM: dataOpc,
});
const seccaoParams = z.object({
  MODELO_ID: z.string().min(1),
  TIPOSEC_ID: z.string().min(1),
  ALINEA: z.coerce.number().int(),
});
const modeloParams = z.object({ MODELO_ID: z.string().min(1) });
const parametroParams = z.object({ MODELO_ID: z.string().min(1), N_PARAMETRO: z.coerce.number().int() });
const omissaoBody = z.object({
  VALOR: textoOpc(240),
  DATA_INICIO: dataOpc,
  DATA_FIM: dataOpc,
  NOME_CONSULTA: textoOpc(240),
  CONSULTA_ONLINE: z.enum(['S', 'N']).default('N'),
});
const chaveQuery = z.object({ MODELO_ID: z.string().min(1).optional(), TIPOSEC_ID: z.string().min(1).optional() });

/** Block DOC_MODELOS_DOCUMENTO: Insert and Delete false (a model only comes from "Clonar"). */
const soActualizar = (store: CrudStore): CrudStore => ({ ...store, insert: semPermissao, remove: semPermissao });

/** ON-CHECK-DELETE-MASTER of DOC_SECCOES_DOCUMENTO: no delete while the section has conditions. */
function comGuardaCondicoes(store: CrudStore, condicoes: CrudStore): CrudStore {
  return {
    ...store,
    remove: async (rid, orig, ctx) => {
      const s = await store.get(rid, ctx);
      if (s) {
        const parent = { MODELO_ID: String(s['MODELO_ID']), TIPOSEC_ID: String(s['TIPOSEC_ID']), ALINEA: Number(s['ALINEA']) };
        const { total } = await condicoes.list({ filters: {}, sort: [], page: 1, size: 1 }, parent, ctx);
        if (total > 0) throw new AppError(409, 'ORA_02292', APAGAR_MESTRE);
      }
      return store.remove(rid, orig, ctx);
    },
  };
}

/** POST-CHANGE of DATA_INICIO / DATA_FIM on DOC_PARAMETROS_OMISSAO (BR-MOD-10).
 * ponytail: `now` is the app clock, not SYSDATE; they differ by the server clock drift only. */
function comIntervalos(store: CrudStore, now: () => string): CrudStore {
  const verifica = async (
    parent: { MODELO_ID: string; N_PARAMETRO: number },
    exceptoRid: string | undefined,
    ini: string,
    fim: string | null,
    mudou: { inicio: boolean; fim: boolean },
    ctx: Parameters<CrudStore['list']>[2],
  ) => {
    const { rows } = await store.list({ filters: {}, sort: [], page: 1, size: 100_000 }, parent, ctx);
    const outros = rows
      .filter((r) => r['_rid'] !== exceptoRid)
      .map((r) => ({ DATA_INICIO: String(r['DATA_INICIO']), DATA_FIM: (r['DATA_FIM'] as string | null) ?? null }));
    const erro = erroIntervalo(outros, ini, fim, now(), mudou);
    if (erro)
      throw new AppError(400, 'VALIDACAO', erro.mensagem, { fields: { [`values.${erro.campo}`]: erro.mensagem } });
  };
  return {
    ...store,
    insert: async (values, parent, ctx) => {
      const p = { MODELO_ID: String(parent['MODELO_ID']), N_PARAMETRO: Number(parent['N_PARAMETRO']) };
      const fim = (values['DATA_FIM'] as string | null | undefined) ?? null;
      await verifica(p, undefined, String(values['DATA_INICIO']), fim, { inicio: true, fim: true }, ctx);
      return store.insert(values, parent, ctx);
    },
    update: async (rid, orig, values, ctx) => {
      const mudou = { inicio: 'DATA_INICIO' in values, fim: 'DATA_FIM' in values };
      const row = mudou.inicio || mudou.fim ? await store.get(rid, ctx) : undefined;
      if (row) {
        const p = { MODELO_ID: String(row['MODELO_ID']), N_PARAMETRO: Number(row['N_PARAMETRO']) };
        const ini = String(mudou.inicio ? values['DATA_INICIO'] : row['DATA_INICIO']);
        const fim = ((mudou.fim ? values['DATA_FIM'] : row['DATA_FIM']) as string | null) ?? null;
        await verifica(p, rid, ini, fim, mudou, ctx);
      }
      return store.update(rid, orig, values, ctx);
    },
  };
}

/** eDoc / arquivo attributes: only CDRAMO changes, for the whole group (BR-MOD-11). */
function soRamo(store: CrudStore, repo: ModelosRepo, alvo: AlvoRamo): CrudStore {
  return {
    ...store,
    insert: semPermissao,
    remove: semPermissao,
    update: async (rid, orig, values, ctx) => {
      if (typeof values['CDRAMO'] === 'string')
        await repo.alterarRamo(ctx.user, alvo, rid, orig as { CDRAMO?: string | null }, values['CDRAMO']);
      const row = await store.get(rid, ctx);
      if (!row) throw new AppError(404, 'NAO_ENCONTRADO', 'Registo não encontrado.');
      return row;
    },
  };
}

export function registerModelosRoutes(
  app: FastifyInstance,
  deps: { stores: ModelosStores; repo: ModelosRepo; now?: () => string },
): void {
  const { stores, repo } = deps;
  const now = deps.now ?? localNow;

  crudRoutes(app, modelos, { store: soActualizar(stores.modelos), hooks: { beforeUpdate: auditHooks.beforeUpdate } });

  app.post(`${M}/acoes/clonar`, async (request, reply) => {
    const { user } = sessionCtx(request, ADM);
    const { MODELO_ID } = modeloParams.parse(request.params);
    const novo = clonarBody.parse(request.body);
    await repo.clonarModelo(user, MODELO_ID, novo);
    reply.status(201);
    return { ID: novo.ID };
  });

  crudRoutes(app, modelosSeccoes, {
    store: comGuardaCondicoes(stores.seccoes, stores.condicoes),
    hooks: auditHooks,
    path: `${M}/seccoes`,
  });

  app.post(`${M}/seccoes/:TIPOSEC_ID/:ALINEA/acoes/clonar`, async (request, reply) => {
    const { user } = sessionCtx(request, ADM);
    const key = seccaoParams.parse(request.params);
    const ALINEA = await repo.clonarSeccao(user, key);
    reply.status(201);
    return { ...key, ALINEA };
  });

  crudRoutes(app, modelosCondicoes, {
    store: stores.condicoes,
    hooks: auditHooks,
    path: `${M}/seccoes/:TIPOSEC_ID/:ALINEA/condicoes`,
  });

  app.get(`${M}/parametros-report`, async (request) => {
    const { user } = sessionCtx(request, ADM);
    const { MODELO_ID } = modeloParams.parse(request.params);
    return { rows: await repo.parametrosReport(user, MODELO_ID) };
  });

  app.put(`${M}/parametros-report/:N_PARAMETRO/omissao`, async (request) => {
    const { user } = sessionCtx(request, ADM);
    const { MODELO_ID, N_PARAMETRO } = parametroParams.parse(request.params);
    const pedido = omissaoBody.parse(request.body ?? {});
    if (pedido.DATA_INICIO && pedido.DATA_FIM && pedido.DATA_INICIO > pedido.DATA_FIM)
      throw new AppError(400, 'VALIDACAO', INICIO_SUPERIOR, { fields: { DATA_INICIO: INICIO_SUPERIOR } });
    const params = await repo.parametrosReport(user, MODELO_ID);
    if (!params.some((p) => p.N_PARAMETRO === N_PARAMETRO))
      throw new AppError(404, 'NAO_ENCONTRADO', 'Registo não encontrado.');
    return { operacoes: await repo.gravarOmissao(user, MODELO_ID, N_PARAMETRO, pedido) };
  });

  crudRoutes(app, modelosParametrosOmissao, {
    store: comIntervalos(stores.omissao, now),
    hooks: auditHooks,
    path: `${M}/parametros-report/:N_PARAMETRO/historico`,
  });

  crudRoutes(app, modelosAtributosEdoc, {
    store: soRamo(stores.atributosEdoc, repo, 'EDOC'),
    path: `${M}/atributos-edoc`,
  });
  crudRoutes(app, modelosAtributosArquivo, {
    store: soRamo(stores.atributosArquivo, repo, 'ARQUIVO'),
    path: `${M}/atributos-arquivo`,
  });

  // REC_GENERICOS without its 'DOC. NÃO GENERICO' / NULL row: the select's empty choice is that.
  app.get(`/api/dominios/${MODELOS_DOMINIOS.genericos}/valores`, async (request) => {
    const ctx = sessionCtx(request, ADM);
    const { rows } = await stores.modelos.list(
      {
        filters: { TIPO_DOCUMENTO_RF: [{ op: 'eq', value: 'GNR' }] },
        sort: [{ column: 'DESCRICAO', direction: 'asc' }],
        page: 1,
        size: 500,
      },
      {},
      ctx,
    );
    return { rows: rows.map((r) => ({ CHAVE: r['ID'], DESIGNACAO: r['DESCRICAO'] })) };
  });

  const opcoes = (lista: ListaOpcoes) =>
    app.get(`/api/dominios/${lista}/valores`, async (request) => {
      const { user } = sessionCtx(request, ADM);
      const { MODELO_ID, TIPOSEC_ID } = chaveQuery.parse(request.query);
      return repo.opcoes(user, lista, MODELO_ID && TIPOSEC_ID ? { MODELO_ID, TIPOSEC_ID } : undefined);
    });
  opcoes(MODELOS_DOMINIOS.tiposConteudo);
  opcoes(MODELOS_DOMINIOS.contextosApr);
}
