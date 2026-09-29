import oracledb from 'oracledb';
import Fastify, { type FastifyInstance } from 'fastify';
import {
  modelos,
  modelosAtributosArquivo,
  modelosAtributosEdoc,
  modelosCondicoes,
  modelosParametrosOmissao,
  modelosSeccoes,
} from '@gestsiid/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildPoolAttrs, type DbPool } from '../../db/oracle.ts';
import { registerErrorHandler } from '../../http/errors.ts';
import { oracleStore } from '../../lib/crud.ts';
import { readOnlyPool } from '../../test/read-only-db.ts';
import { oracleModelosRepo } from './repo.ts';
import { registerModelosRoutes } from './routes.ts';

/**
 * Contract test against the TEST schema (TEST_STRATEGY.md, CLAUDE.md HARD RULE): reaches Oracle
 * only through readOnlyPool and calls GET routes only. Clonar, omissao, CRUD writes and the ramo
 * change are tested on memory stores and a fake connection (routes.test.ts, repo.test.ts).
 * Skipped unless DB_CONNECT_STRING is set. The session is a fake ADM (no login).
 */

const env = process.env;
const SORTS = [
  'ID',
  'DESCRICAO',
  'N_COPIAS',
  'FORMA_CONTROLO_RF',
  'DATA_INICIO',
  'DATA_FIM',
  'GENERICO_ID',
  'MODO_EXPEDICAO_RF',
  'MODO_CERTIFICADO_RF',
  'STAMP',
  'MODO_PROTECAO_RF',
];

type Linha = Record<string, unknown>;

describe.skipIf(!env['DB_CONNECT_STRING'])('modelos — TEST schema (read-only)', { timeout: 30_000 }, () => {
  let realPool: oracledb.Pool;
  let app: FastifyInstance;
  let alvo: { ID: string; seccao: { TIPOSEC_ID: string; ALINEA: number } } | undefined;

  const get = (url: string) => app.inject({ url });
  const rowsOf = async (url: string) => {
    const r = await get(url);
    expect(r.statusCode, `${url} ${r.body}`).toBe(200);
    return r.json().rows as Linha[];
  };
  /** The first model (of the first 20) that has sections. */
  const modeloComSeccoes = async () => {
    if (alvo) return alvo;
    for (const m of await rowsOf('/api/modelos?size=20')) {
      const ID = String(m['ID']);
      const [s] = await rowsOf(`/api/modelos/${encodeURIComponent(ID)}/seccoes?size=1`);
      if (s) {
        alvo = { ID, seccao: { TIPOSEC_ID: String(s['TIPOSEC_ID']), ALINEA: Number(s['ALINEA']) } };
        return alvo;
      }
    }
    throw new Error('no model with sections among the first 20 of the TEST schema');
  };
  const base = async () => `/api/modelos/${encodeURIComponent((await modeloComSeccoes()).ID)}`;

  beforeAll(async () => {
    if (env['ORACLE_CLIENT_LIB_DIR']) oracledb.initOracleClient({ libDir: env['ORACLE_CLIENT_LIB_DIR'] });
    else oracledb.initOracleClient();
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    realPool = await oracledb.createPool(
      buildPoolAttrs({
        DB_USER: env['DB_USER'] ?? '',
        DB_PASSWORD: env['DB_PASSWORD'] ?? '',
        DB_CONNECT_STRING: env['DB_CONNECT_STRING'] ?? '',
        DB_SCHEMA: env['DB_SCHEMA'] ?? '',
        DB_POOL_SIZE: 2,
      }),
    );
    const pool = readOnlyPool(realPool as unknown as DbPool);
    const t = 30_000;
    app = Fastify();
    registerErrorHandler(app);
    app.decorateRequest('session', null as never);
    app.addHook('onRequest', async (req) => {
      (req as { session: unknown }).session = { user: { username: 'CONTRACT_TEST', role: 'ADM' } };
    });
    registerModelosRoutes(app, {
      stores: {
        modelos: oracleStore(pool, modelos, t),
        seccoes: oracleStore(pool, modelosSeccoes, t),
        condicoes: oracleStore(pool, modelosCondicoes, t),
        omissao: oracleStore(pool, modelosParametrosOmissao, t),
        atributosEdoc: oracleStore(pool, modelosAtributosEdoc, t),
        atributosArquivo: oracleStore(pool, modelosAtributosArquivo, t),
      },
      repo: oracleModelosRepo(pool, t),
    });
    await app.ready();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await realPool?.close(0);
  }, 60_000);

  it('GET /api/modelos returns every resource column', async () => {
    const rows = await rowsOf('/api/modelos');
    expect(rows.length).toBeGreaterThan(0);
    for (const c of Object.keys(modelos.columns)) expect(rows[0]).toHaveProperty(c);
  });

  it.each(SORTS)('GET /api/modelos?sort=%s:desc runs on Oracle', async (col) => {
    expect((await get(`/api/modelos?sort=${col}:desc&size=5`)).statusCode).toBe(200);
  });

  it('GET seccoes of a model: rows carry TIPO_IMAGEM, never the IMAGEM BLOB', async () => {
    const rows = await rowsOf(`${await base()}/seccoes`);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r).toHaveProperty('TIPO_IMAGEM');
      expect(r).not.toHaveProperty('IMAGEM');
      expect([null, 'BMP', 'JPEG', 'PNG', 'GIF', 'TIFF']).toContain(r['TIPO_IMAGEM']);
    }
  });

  it('GET condicoes of the first section', async () => {
    const { seccao } = await modeloComSeccoes();
    const rows = await rowsOf(`${await base()}/seccoes/${encodeURIComponent(seccao.TIPOSEC_ID)}/${seccao.ALINEA}/condicoes`);
    for (const r of rows) expect(r).toMatchObject({ TIPOSEC_ID: seccao.TIPOSEC_ID, ALINEA: seccao.ALINEA });
  });

  it('GET parametros-report of a model with a report answers the ParametroReport shape, and historico of its first parameter', async () => {
    const m = (await rowsOf('/api/modelos?size=100')).find((x) => x['REPORT_ID'] != null);
    expect(m, 'no model with a REPORT_ID among the first 100 of the TEST schema').toBeDefined();
    const url = `/api/modelos/${encodeURIComponent(String(m?.['ID']))}/parametros-report`;
    const rows = await rowsOf(url);
    for (const r of rows) {
      expect(r['REPORT_ID']).toBe(m?.['REPORT_ID']);
      for (const c of ['N_PARAMETRO', 'NOME', 'VALOR', 'DATA_INICIO', 'DATA_FIM', 'NOME_CONSULTA', 'CONSULTA_ONLINE', 'DETALHES'])
        expect(r).toHaveProperty(c);
      expect([null, '***']).toContain(r['DETALHES']);
    }
    const [p] = rows;
    if (p) {
      const hist = await rowsOf(`${url}/${Number(p['N_PARAMETRO'])}/historico`);
      if (p['DETALHES'] === '***') expect(hist.length).toBeGreaterThan(0);
      for (const h of hist) expect(h['N_PARAMETRO']).toBe(p['N_PARAMETRO']);
    }
  });

  it.each(['atributos-edoc', 'atributos-arquivo'])('GET %s of a model', async (path) => {
    const rows = await rowsOf(`${await base()}/${path}`);
    for (const r of rows) expect(r).toHaveProperty('CDRAMO');
  });

  it('the MODELOS_GENERICOS feed lists { CHAVE, DESIGNACAO }', async () => {
    const r = await get('/api/dominios/MODELOS_GENERICOS/valores');
    expect(r.statusCode).toBe(200);
    for (const x of r.json().rows as Linha[]) expect(Object.keys(x).sort()).toEqual(['CHAVE', 'DESIGNACAO']);
  });

  it.each(['TIPOS_CONTEUDO', 'CONTEXTOS_APR'])('the %s feed: rows, preSelected null without a section, a number or null with one', async (feed) => {
    const sem = await get(`/api/dominios/${feed}/valores`);
    expect(sem.statusCode).toBe(200);
    expect(sem.json().rows.length).toBeGreaterThan(0);
    expect(sem.json().preSelected).toBeNull();
    const { ID, seccao } = await modeloComSeccoes();
    const com = await get(
      `/api/dominios/${feed}/valores?MODELO_ID=${encodeURIComponent(ID)}&TIPOSEC_ID=${encodeURIComponent(seccao.TIPOSEC_ID)}`,
    );
    expect(com.statusCode).toBe(200);
    const pre = com.json().preSelected as number | null;
    if (pre !== null) expect(pre).toBeGreaterThan(0);
  });
});
