import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { permissoes } from '@gestsiid/shared';
import { AppError } from '../../db/errors.ts';
import { crudRoutes, sessionCtx, type CrudStore } from '../../lib/crud.ts';
import type { PermissoesRepo, PermissoesTx } from './repo.ts';
import {
  FIM_ANULADA,
  FIM_BULK,
  JA_EXISTE,
  OBRIGATORIO,
  OBRIGATORIO_DATA_INICIO,
  SOBREPOE,
  conflitoAlterar,
  conflitoNova,
  diaAnterior,
  normalizaData,
  planoCopiaModelo,
  planoCopiaUtilizador,
  validaHoje,
  type Perm,
  type PermKey,
  type Scope,
} from './rules.ts';

/**
 * `FD_PERMISSOES_SIID` (BR-PERM-01..11), ADM only. The grid is a plain list over the view; every
 * write is a named route below, one transaction each (`repo.write`), audit columns from the
 * session. Rows have no id: they are addressed by the logical key and locked on it before an
 * UPDATE (the legacy form did not lock; a vanished row is 409 here instead of a silent no-op).
 *
 *   GET  /api/permissoes                                 list (?preset=validas = valid today)
 *   GET  /api/permissoes/por-utilizador/:username?un&tipo  { com, sem }   (CTR_USERS_SIID)
 *   GET  /api/permissoes/por-modelo/:modeloId?un&tipo      { com, sem }   (CTR_MODELOS_SIID)
 *   GET  /api/permissoes/utilizadores?un | /modelos        { rows }       (the form's LOVs)
 *   POST …/{add,add-all,remove,remove-all}              panel buttons > >> < <<
 *   POST /api/permissoes                                 NOVA_PERMISSAO
 *   PUT  /api/permissoes {orig, values}                  ALTERAR_PERMISSAO
 *   POST /api/permissoes/anular {orig}                   Retirar Permissão (DATA_FIM = 01/01/1980)
 *   POST /api/permissoes/copiar-modelo | copiar-utilizador
 */

const ROLES = permissoes.roles.read;

const DIA = /^(\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?)?$/;
// A real calendar instant (no 2026-02-30), so TO_DATE never sees a bad value.
const existe = (v: string) => {
  const n = normalizaData(v);
  const d = new Date(`${n}Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 19) === n;
};
const data = z.string().regex(DIA).refine((v) => v === '' || existe(v));
const dataObrig = data.pipe(z.string().min(1)).transform(normalizaData);
const fimOpc = data.nullable().optional().transform((v) => (v ? normalizaData(v) : null));
const texto = z.string().min(1);
const tipo = z.number().int();

const scopeQuery = z.object({ un: texto, tipo: z.string().regex(/^\d+$/).transform(Number) });
const addBody = <K extends string>(lista: K) =>
  z.object({ un: texto, tipo, [lista]: z.array(texto) }) as unknown as z.ZodType<
    { un: string; tipo: number } & Record<K, string[]>
  >;
const scopeBody = z.object({ un: texto, tipo });
const removeBody = <K extends string>(col: K) =>
  z.object({
    un: texto,
    tipo,
    linhas: z.array(z.object({ [col]: texto, DATA_INICIO: dataObrig })),
  }) as unknown as z.ZodType<{ un: string; tipo: number; linhas: (Record<K, string> & { DATA_INICIO: string })[] }>;

const novaBody = z.object({
  MODELO_ID: z.string().optional(),
  USERNAME: z.string().optional(),
  UNIDADE_NEGOCIO_RF: z.string().optional(),
  TIPO_PERMISSAO_RF: tipo.optional(),
  DATA_INICIO: data.optional(),
  DATA_FIM: fimOpc,
});
const origPerm = z.object({
  MODELO_ID: texto,
  USERNAME: texto,
  UNIDADE_NEGOCIO_RF: texto,
  TIPO_PERMISSAO_RF: tipo,
  DATA_INICIO: dataObrig,
  DATA_FIM: fimOpc,
});
const alterarBody = z.object({
  orig: origPerm,
  values: z.object({ DATA_INICIO: data.optional(), DATA_FIM: fimOpc }),
});
const anularBody = z.object({ orig: origPerm });
const copiarModeloBody = z.object({ MODELO_ID: texto, MODELO_ID_COPIAR: texto });
const copiarUtilizadorBody = z.object({
  USERNAME: texto,
  UNIDADE_NEGOCIO_RF: texto,
  USERNAME_COPIAR: texto,
  UNIDADE_NEGOCIO_RF_COPIAR: texto,
});

const regra = (message: string) => new AppError(400, 'VALIDACAO', message);

/** "Com permissão": the scope's rows valid today (PERMISSOES_USER / PERMISSOES_MODELOS PRE-QUERY). */
async function comPermissao(tx: PermissoesTx, scope: Scope): Promise<Perm[]> {
  const now = await tx.now();
  const by = scope.MODELO_ID === undefined ? 'MODELO_ID' : 'USERNAME';
  return (await tx.find(scope))
    .filter((p) => validaHoje(p, now))
    .sort((a, b) => (a[by] < b[by] ? -1 : a[by] > b[by] ? 1 : 0));
}

/** Ends each row: DATA_FIM = SYSDATE - 1 (REMOVE_PERMISSAO / REMOVE_TODOS). */
async function termina(tx: PermissoesTx, keys: PermKey[], user: string): Promise<{ removidos: number }> {
  const fim = diaAnterior(await tx.now());
  for (const k of keys) await tx.lock(k);
  for (const k of keys) await tx.update(k, { DATA_INICIO: k.DATA_INICIO, DATA_FIM: fim }, user);
  return { removidos: keys.length };
}

/** Inserts from SYSDATE to 31-12-2200, no overlap check (ADD_PERMISSAO / ADD_TODOS). */
async function concede(tx: PermissoesTx, pares: Omit<PermKey, 'DATA_INICIO'>[], user: string) {
  const now = await tx.now();
  for (const p of pares) await tx.insert({ ...p, DATA_INICIO: now, DATA_FIM: FIM_BULK }, user);
  return { inseridos: pares.length };
}

/** The four panel routes of one direction; `lado` fixes USERNAME (user panel) or MODELO_ID. */
function registerPainel(
  app: FastifyInstance,
  repo: PermissoesRepo,
  path: string,
  param: 'username' | 'modeloId',
  fixo: 'USERNAME' | 'MODELO_ID',
  lista: 'modelos' | 'utilizadores',
) {
  const livre = fixo === 'USERNAME' ? 'MODELO_ID' : 'USERNAME';
  const scopeOf = (request: FastifyRequest, un: string, t: number): Scope => ({
    UNIDADE_NEGOCIO_RF: un,
    TIPO_PERMISSAO_RF: t,
    [fixo]: (request.params as Record<string, string>)[param],
  });
  const add = addBody(lista);
  const remove = removeBody(livre);

  app.get(path, async (request) => {
    const { user } = sessionCtx(request, ROLES);
    const q = scopeQuery.parse(request.query);
    const scope = scopeOf(request, q.un, q.tipo);
    return repo.read(user, 'permissoes.painel', async (tx) => ({
      com: await comPermissao(tx, scope),
      sem: await tx.sem(scope),
    }));
  });

  app.post(`${path}/add`, async (request) => {
    const { user } = sessionCtx(request, ROLES);
    const b = add.parse(request.body);
    const scope = scopeOf(request, b.un, b.tipo);
    const pedidos = new Set(b[lista]);
    return repo.write(user, 'permissoes.add', async (tx) => {
      const sem = (await tx.sem(scope)).filter((s) => pedidos.has(s[livre]));
      return concede(tx, sem.map((s) => ({ ...scope, MODELO_ID: s.MODELO_ID, USERNAME: s.USERNAME })), user.username);
    });
  });

  app.post(`${path}/add-all`, async (request) => {
    const { user } = sessionCtx(request, ROLES);
    const b = scopeBody.parse(request.body);
    const scope = scopeOf(request, b.un, b.tipo);
    return repo.write(user, 'permissoes.add-all', async (tx) => {
      const sem = await tx.sem(scope);
      return concede(tx, sem.map((s) => ({ ...scope, MODELO_ID: s.MODELO_ID, USERNAME: s.USERNAME })), user.username);
    });
  });

  app.post(`${path}/remove`, async (request) => {
    const { user } = sessionCtx(request, ROLES);
    const b = remove.parse(request.body);
    const scope = scopeOf(request, b.un, b.tipo);
    const keys = b.linhas.map((l) => ({ ...scope, [livre]: l[livre], DATA_INICIO: l.DATA_INICIO }) as PermKey);
    return repo.write(user, 'permissoes.remove', (tx) => termina(tx, keys, user.username));
  });

  app.post(`${path}/remove-all`, async (request) => {
    const { user } = sessionCtx(request, ROLES);
    const b = scopeBody.parse(request.body);
    const scope = scopeOf(request, b.un, b.tipo);
    return repo.write(user, 'permissoes.remove-all', async (tx) =>
      termina(tx, await comPermissao(tx, scope), user.username),
    );
  });
}

export function registerPermissoesRoutes(
  app: FastifyInstance,
  deps: { store: CrudStore; repo: PermissoesRepo },
): void {
  const { repo } = deps;
  crudRoutes(app, permissoes, { store: deps.store });

  const lovQuery = z.object({ un: texto.optional() });
  app.get('/api/permissoes/utilizadores', async (request) => {
    const { user } = sessionCtx(request, ROLES);
    const { un } = lovQuery.parse(request.query);
    return { rows: await repo.read(user, 'permissoes.lov', (tx) => tx.utilizadores(un)) };
  });
  app.get('/api/permissoes/modelos', async (request) => {
    const { user } = sessionCtx(request, ROLES);
    return { rows: await repo.read(user, 'permissoes.lov', (tx) => tx.modelos()) };
  });
  registerPainel(app, repo, '/api/permissoes/por-utilizador/:username', 'username', 'USERNAME', 'modelos');
  registerPainel(app, repo, '/api/permissoes/por-modelo/:modeloId', 'modeloId', 'MODELO_ID', 'utilizadores');

  app.post('/api/permissoes', async (request, reply) => {
    const { user } = sessionCtx(request, ROLES);
    const b = novaBody.parse(request.body);
    const { MODELO_ID, USERNAME, UNIDADE_NEGOCIO_RF, TIPO_PERMISSAO_RF, DATA_INICIO } = b;
    if (!MODELO_ID || !USERNAME || !UNIDADE_NEGOCIO_RF || TIPO_PERMISSAO_RF === undefined || !DATA_INICIO)
      throw regra(OBRIGATORIO);
    const nova: Perm = {
      MODELO_ID,
      USERNAME,
      UNIDADE_NEGOCIO_RF,
      TIPO_PERMISSAO_RF,
      DATA_INICIO: normalizaData(DATA_INICIO),
      DATA_FIM: b.DATA_FIM,
    };
    await repo.write(user, 'permissoes.nova', async (tx) => {
      if (conflitoNova(await tx.find({ MODELO_ID, USERNAME, UNIDADE_NEGOCIO_RF, TIPO_PERMISSAO_RF }), nova))
        throw regra(JA_EXISTE);
      await tx.insert(nova, user.username);
    });
    reply.status(201);
    return nova;
  });

  app.put('/api/permissoes', async (request) => {
    const { user } = sessionCtx(request, ROLES);
    const { orig, values } = alterarBody.parse(request.body);
    if (!values.DATA_INICIO) throw regra(OBRIGATORIO_DATA_INICIO);
    const { DATA_FIM: fimAnterior, ...chave } = orig;
    const set = { DATA_INICIO: normalizaData(values.DATA_INICIO), DATA_FIM: values.DATA_FIM };
    await repo.write(user, 'permissoes.alterar', async (tx) => {
      await tx.lock(chave, { DATA_FIM: fimAnterior });
      const { MODELO_ID, USERNAME, UNIDADE_NEGOCIO_RF, TIPO_PERMISSAO_RF } = chave;
      const mesmaChave = await tx.find({ MODELO_ID, USERNAME, UNIDADE_NEGOCIO_RF, TIPO_PERMISSAO_RF });
      if (conflitoAlterar(mesmaChave, chave, set.DATA_INICIO, set.DATA_FIM)) throw regra(SOBREPOE);
      await tx.update(chave, set, user.username);
    });
    return { ...chave, ...set };
  });

  // "Retirar Permissão": rows are never deleted, only ended on the 1980 sentinel.
  app.post('/api/permissoes/anular', async (request) => {
    const { user } = sessionCtx(request, ROLES);
    const { DATA_FIM: fimAnterior, ...chave } = anularBody.parse(request.body).orig;
    const set = { DATA_INICIO: chave.DATA_INICIO, DATA_FIM: FIM_ANULADA };
    await repo.write(user, 'permissoes.anular', async (tx) => {
      await tx.lock(chave, { DATA_FIM: fimAnterior });
      await tx.update(chave, set, user.username);
    });
    return { ...chave, ...set };
  });

  app.post('/api/permissoes/copiar-modelo', async (request) => {
    const { user } = sessionCtx(request, ROLES);
    const { MODELO_ID, MODELO_ID_COPIAR } = copiarModeloBody.parse(request.body);
    return repo.write(user, 'permissoes.copiar-modelo', async (tx) => {
      const plano = planoCopiaModelo(
        await tx.find({ MODELO_ID: MODELO_ID_COPIAR }),
        await tx.find({ MODELO_ID }),
        MODELO_ID,
        await tx.now(),
      );
      for (const p of plano) await tx.insert(p, user.username);
      return { inseridos: plano.length };
    });
  });

  app.post('/api/permissoes/copiar-utilizador', async (request) => {
    const { user } = sessionCtx(request, ROLES);
    const b = copiarUtilizadorBody.parse(request.body);
    const alvo = { USERNAME: b.USERNAME, UNIDADE_NEGOCIO_RF: b.UNIDADE_NEGOCIO_RF };
    return repo.write(user, 'permissoes.copiar-utilizador', async (tx) => {
      const plano = planoCopiaUtilizador(
        await tx.find({ USERNAME: b.USERNAME_COPIAR, UNIDADE_NEGOCIO_RF: b.UNIDADE_NEGOCIO_RF_COPIAR }),
        await tx.find(alvo),
        alvo,
        await tx.now(),
      );
      for (const p of plano) await tx.insert(p, user.username);
      return { inseridos: plano.length };
    });
  });
}
