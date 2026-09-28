import Fastify from 'fastify';
import { dominios, dominiosValores } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import { memoryStore } from '../dev/memoryStore.ts';
import { registerErrorHandler } from '../../http/errors.ts';
import { createDominiosCache } from './valores.ts';
import { registerDominiosCrudRoutes } from './routes.ts';

const dominio = (ID: string, over: Record<string, unknown> = {}) => ({
  ID,
  DESCRICAO: `Domínio ${ID}`,
  TIPO_INFORMACAO_RF: 'STRING',
  TIPO_DOMINIO_RF: 'L',
  TIPO_STRING_RF: 'A',
  FORMATACAO_STRING_RF: 'M',
  TAMANHO_MAXIMO: null,
  PRECISAO: null,
  VALOR_MINIMO: null,
  VALOR_MAXIMO: null,
  DOMINIO_SISTEMA_BN: 'N',
  VALOR_COMUM: null,
  OBSERVACAO: null,
  ESTADO_REGISTO_RF: 'N',
  DATA_ESTADO: '2010-02-15T00:00:00',
  REGISTADO_POR: 'MIGRACAO',
  DATA_REGISTO: '2010-02-15T00:00:00',
  ACTUALIZADO_POR: null,
  DATA_ACTUALIZACAO: null,
  ...over,
});

const valor = (DOMINIO_ID: string, CHAVE: string, over: Record<string, unknown> = {}) => ({
  DOMINIO_ID,
  CHAVE,
  DESIGNACAO: CHAVE,
  DESCRICAO: CHAVE,
  DATA_INICIO: '2010-02-15T00:00:00',
  DATA_FIM: null,
  PRIORIDADE: 0,
  REGISTADO_POR: 'MIGRACAO',
  DATA_REGISTO: '2010-02-15T00:00:00',
  ACTUALIZADO_POR: null,
  DATA_ACTUALIZACAO: null,
  ...over,
});

function appWith(dom: Record<string, unknown>[], val: Record<string, unknown>[], cache = createDominiosCache()) {
  const app = Fastify();
  registerErrorHandler(app);
  app.decorateRequest('session', null as never);
  app.addHook('onRequest', async (req) => {
    (req as { session: unknown }).session = { user: { username: 'JOAO', role: 'ADM' } };
  });
  const valoresStore = memoryStore(dominiosValores, val);
  registerDominiosCrudRoutes(app, {
    store: memoryStore(dominios, dom),
    valoresStore,
    cache,
  });
  return { app, valoresStore, cache };
}

const post = (app: ReturnType<typeof appWith>['app'], path: string, values: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: path, payload: { values } });

async function currentRow(app: ReturnType<typeof appWith>['app'], path: string, key: string, value: unknown) {
  const rows = (await app.inject({ url: path })).json().rows as Record<string, unknown>[];
  return rows.find((r) => r[key] === value)!;
}

describe('dominios routes (master)', () => {
  it('GET lists the domains', async () => {
    const { app } = appWith([dominio('BINARIO')], []);
    await app.ready();
    const r = await app.inject({ url: '/api/dominios' });
    expect(r.statusCode).toBe(200);
    expect(r.json().rows).toMatchObject([{ ID: 'BINARIO' }]);
  });

  it('POST stamps REGISTADO_POR/DATA_REGISTO and the novo lifecycle fields', async () => {
    const { app } = appWith([], []);
    await app.ready();
    const r = await post(app, '/api/dominios', {
      ID: 'NOVO_DOM',
      DESCRICAO: 'Novo domínio',
      TIPO_INFORMACAO_RF: 'STRING',
      TIPO_DOMINIO_RF: 'L',
      DOMINIO_SISTEMA_BN: 'N',
    });
    expect(r.statusCode).toBe(201);
    expect(r.json()).toMatchObject({
      REGISTADO_POR: 'JOAO',
      ESTADO_REGISTO_RF: 'N',
    });
    expect(r.json().DATA_REGISTO).toBeTruthy();
    expect(r.json().DATA_ESTADO).toBeTruthy();
  });

  it('DELETE is refused while the domain still has detail rows', async () => {
    const { app } = appWith([dominio('BINARIO')], [valor('BINARIO', 'S')]);
    await app.ready();
    const { _rid, ...orig } = await currentRow(app, '/api/dominios', 'ID', 'BINARIO');
    const r = await app.inject({
      method: 'DELETE',
      url: `/api/dominios/${_rid}`,
      payload: { orig },
    });
    expect(r.statusCode).toBe(409);
    expect(r.json().message).toMatch(/registo mestre/);
  });

  it('DELETE succeeds once the domain has no detail rows', async () => {
    const { app } = appWith([dominio('VAZIO')], []);
    await app.ready();
    const { _rid, ...orig } = await currentRow(app, '/api/dominios', 'ID', 'VAZIO');
    const r = await app.inject({
      method: 'DELETE',
      url: `/api/dominios/${_rid}`,
      payload: { orig },
    });
    expect(r.statusCode).toBe(204);
  });

  it('USER can neither read nor write (Administração is ADM only)', async () => {
    const app = Fastify();
    registerErrorHandler(app);
    app.decorateRequest('session', null as never);
    app.addHook('onRequest', async (req) => {
      (req as { session: unknown }).session = { user: { username: 'ANA', role: 'USER' } };
    });
    registerDominiosCrudRoutes(app, {
      store: memoryStore(dominios, [dominio('BINARIO')]),
      valoresStore: memoryStore(dominiosValores, []),
    });
    await app.ready();
    expect((await app.inject({ url: '/api/dominios' })).statusCode).toBe(403);
  });
});

describe('dominios-valores routes (detail)', () => {
  it('GET lists only the rows of the given domain, ordered by PRIORIDADE', async () => {
    const { app } = appWith(
      [dominio('BINARIO')],
      [valor('BINARIO', 'S', { PRIORIDADE: 1 }), valor('BINARIO', 'N', { PRIORIDADE: 0 }), valor('OUTRO', 'X')],
    );
    await app.ready();
    const r = await app.inject({ url: '/api/dominios/BINARIO/lista' });
    expect(r.statusCode).toBe(200);
    expect(r.json().rows.map((row: { CHAVE: string }) => row.CHAVE)).toEqual(['N', 'S']);
  });

  it('POST binds DOMINIO_ID from the URL and stamps REGISTADO_POR/DATA_REGISTO', async () => {
    const { app } = appWith([dominio('BINARIO')], []);
    await app.ready();
    const r = await post(app, '/api/dominios/BINARIO/lista', {
      CHAVE: 'S',
      DESIGNACAO: 'Sim',
      DESCRICAO: 'Sim',
      DATA_INICIO: '2026-01-01T00:00:00',
      PRIORIDADE: 0,
    });
    expect(r.statusCode).toBe(201);
    expect(r.json()).toMatchObject({ DOMINIO_ID: 'BINARIO', REGISTADO_POR: 'JOAO' });
  });

  it('a write invalidates the lookup cache for that domain, so the next read is fresh', async () => {
    const cache = createDominiosCache();
    cache.set('BINARIO', [{ CHAVE: 'STALE', DESIGNACAO: 'Antigo', PRIORIDADE: 0 }]);
    const { app } = appWith([dominio('BINARIO')], [], cache);
    await app.ready();

    await post(app, '/api/dominios/BINARIO/lista', {
      CHAVE: 'S',
      DESIGNACAO: 'Sim',
      DESCRICAO: 'Sim',
      DATA_INICIO: '2026-01-01T00:00:00',
      PRIORIDADE: 0,
    });

    expect(cache.get('BINARIO')).toBeUndefined();
  });
});
