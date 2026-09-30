import multipart from '@fastify/multipart';
import Fastify from 'fastify';
import {
  modelos,
  modelosAtributosArquivo,
  modelosAtributosEdoc,
  modelosCondicoes,
  modelosParametrosOmissao,
  modelosSeccoes,
} from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import { registerErrorHandler } from '../../http/errors.ts';
import { memoryImageStore } from '../dev/memoryImageStore.ts';
import { memoryStore } from '../dev/memoryStore.ts';
import { memoryModelosRepo, type ModelosStores } from './repo.ts';
import {
  APAGAR_MESTRE,
  FIM_EM_INTERVALO,
  INICIO_EM_INTERVALO,
  INICIO_SUPERIOR,
  MODELO_EXISTENTE,
} from './rules.ts';
import { registerModelosRoutes } from './routes.ts';

/**
 * FD_CONFIGURACAO_MODELOS routes (BR-MOD-02..12) on memory stores and the memory repo, clock
 * fixed at NOW. The session user is JOAO; audit columns come from it, never from the body.
 */

const NOW = '2026-09-29T10:00:00';
const SEM_PERMISSAO = 'Não tem permissão para esta operação.';
const NAO_ENCONTRADO = 'Registo não encontrado.';

const MIG = {
  CRIADO_POR: 'MIGRACAO',
  DATA_CRIACAO: '2020-01-01T10:00:00',
  ACTUALIZADO_POR: null,
  DATA_ACTUALIZACAO: null,
};

const modelo = (ID: string, over: Record<string, unknown> = {}) => ({
  ID,
  DESCRICAO: `Modelo ${ID}`,
  N_COPIAS: 1,
  FORMA_CONTROLO_RF: 'C',
  DATA_INICIO: '2020-01-01T00:00:00',
  DATA_FIM: null,
  MODO_EXPEDICAO_RF: 'E',
  STAMP: 'S',
  MODO_CERTIFICADO_RF: '1',
  GENERICO_ID: null,
  MODO_PROTECAO_RF: '2',
  TIPO_DOCUMENTO_RF: 'DOC',
  REPORT_ID: null,
  N_ANEXOS: 0,
  MAX_IMPRESSOES: null,
  BARCODE_TYPE: null,
  BARCODE_FORMAT: null,
  BARCODE_WEIGHT: null,
  BARCODE_HEIGHT: null,
  BARCODE_X_POSITION: null,
  BARCODE_Y_POSITION: null,
  ...MIG,
  ...over,
});
const MODELOS = [
  modelo('M1', {
    DESCRICAO: 'Carta',
    GENERICO_ID: 'GEN1',
    REPORT_ID: 10,
    N_ANEXOS: 2,
    MAX_IMPRESSOES: 5,
    BARCODE_TYPE: 'CODE128',
    BARCODE_FORMAT: 'F',
    BARCODE_WEIGHT: 3,
    BARCODE_HEIGHT: 1,
    BARCODE_X_POSITION: 10,
    BARCODE_Y_POSITION: 20,
  }),
  modelo('M2', { DESCRICAO: 'Aviso' }),
  modelo('GEN1', { DESCRICAO: 'Genérico B', TIPO_DOCUMENTO_RF: 'GNR' }),
  modelo('GEN2', { DESCRICAO: 'Genérico A', TIPO_DOCUMENTO_RF: 'GNR' }),
];

const seccao = (MODELO_ID: string, TIPOSEC_ID: string, ALINEA: number, TIPOCNTD_ID: number, over: Record<string, unknown> = {}) => ({
  MODELO_ID,
  TIPOSEC_ID,
  ALINEA,
  TITULO: `${TIPOSEC_ID} ${ALINEA}`,
  TEXTO: `Texto ${TIPOSEC_ID} ${ALINEA}`,
  TIPOCNTD_ID,
  FORMULA_ID: null,
  TIPO_IMAGEM: null,
  ...MIG,
  ...over,
});
const SECCOES = [
  seccao('M1', 'CAB', 1, 2, { FORMULA_ID: 7, TIPO_IMAGEM: 'PNG' }),
  seccao('M1', 'CAB', 2, 3),
  seccao('M1', 'ROD', 1, 1),
  seccao('M2', 'CAB', 1, 0),
];

const condicao = (TIPOSEC_ID: string, ALINEA: number, CDUNIECO: number, CDRAMO: string, CONTEXTO_ID: number, over: Record<string, unknown> = {}) => ({
  MODELO_ID: 'M1',
  TIPOSEC_ID,
  ALINEA,
  DATA_INICIO: '2020-01-01T00:00:00',
  DATA_FIM: null,
  CDUNIECO,
  CDRAMO,
  CONTEXTO_ID,
  ATRIBUTO1: null,
  CRIADO_POR: 'MIGRACAO',
  DATA_CRIACAO: '2020-02-02T00:00:00',
  ACTUALIZADO_POR: null,
  DATA_ACTUALIZACAO: null,
  ...over,
});
const CONDICOES = [
  condicao('CAB', 1, 1, 'R1', 5, { ATRIBUTO1: 'a1' }),
  condicao('CAB', 1, 2, 'R2', 4),
  condicao('CAB', 2, 1, 'R1', 6),
];

const omissao = (MODELO_ID: string, N_PARAMETRO: number, VALOR: string, DATA_INICIO: string, DATA_FIM: string | null, over: Record<string, unknown> = {}) => ({
  MODELO_ID,
  N_PARAMETRO,
  VALOR,
  DATA_INICIO,
  DATA_FIM,
  NOME_CONSULTA: null,
  CONSULTA_ONLINE: 'N',
  ...MIG,
  ...over,
});
const OMISSAO = [
  omissao('M1', 1, 'antigo', '2024-01-01T00:00:00', '2024-12-31T00:00:00'),
  omissao('M1', 1, 'actual', '2025-01-01T00:00:00', null, { NOME_CONSULTA: 'Q1', CONSULTA_ONLINE: 'S' }),
  omissao('M1', 2, 'expirado', '2023-01-01T00:00:00', '2023-12-31T00:00:00'),
  omissao('M2', 1, 'outro', '2025-01-01T00:00:00', null),
];

const parametro = (REPORT_ID: number, N_PARAMETRO: number, NOME: string) => ({
  REPORT_ID,
  N_PARAMETRO,
  NOME,
  TIPO_PARAMETRO_RF: 'T',
  OBRIGATORIO: 'S',
  CHECK_UNIQUE: 'N',
  VALIDO: 'S',
  DESCRICAO: `Parâmetro ${NOME}`,
});
const PARAMETROS = [parametro(10, 2, 'P_DATA'), parametro(10, 1, 'P_NOME'), parametro(10, 3, 'P_SEM'), parametro(20, 1, 'OUTRO')];

const TIPOS_CONTEUDO = [
  { ID: 3, DESCRICAO: 'Imagem' },
  { ID: 1, DESCRICAO: 'Texto' },
  { ID: 2, DESCRICAO: 'Tabela' },
];
const CONTEXTOS = [
  { ID: 6, DESCRICAO: 'Contexto 6' },
  { ID: 4, DESCRICAO: null },
  { ID: 5, DESCRICAO: 'Contexto 5' },
];

const atributo = (MODELO_ID: string, N_ATRIBUTO: number) => ({
  MODELO_ID,
  CDUNIECO: 1,
  CDRAMO: 'R1',
  N_ATRIBUTO,
  DESCRICAO: `Atributo ${N_ATRIBUTO}`,
  NOME_PARAMETRO: `P${N_ATRIBUTO}`,
  ORDEM_PARAMETRO: N_ATRIBUTO,
  VALOR_OMISSAO: null,
  TIPO_PARAMETRO: 'T',
  DATA_INICIO: '2020-01-01T00:00:00',
  DATA_FIM: null,
  ...MIG,
});
const EDOC = [
  { EDOC_ID: 100, ...atributo('M1', 1) },
  { EDOC_ID: 100, ...atributo('M1', 2) },
  { EDOC_ID: 200, ...atributo('M1', 3) },
  { EDOC_ID: 100, ...atributo('M2', 1) },
];
const ARQUIVO = [
  { ARQ_ID: 100, ...atributo('M1', 1) },
  { ARQ_ID: 100, ...atributo('M1', 2) },
  { ARQ_ID: 200, ...atributo('M1', 3) },
  { ARQ_ID: 100, ...atributo('M2', 1) },
];

function appWith(role: 'ADM' | 'USER' | null = 'ADM') {
  const app = Fastify();
  registerErrorHandler(app);
  void app.register(multipart);
  app.decorateRequest('session', null as never);
  app.addHook('onRequest', async (req) => {
    (req as { session: unknown }).session = { user: role ? { username: 'JOAO', role } : undefined };
  });
  const stores: ModelosStores = {
    modelos: memoryStore(modelos, MODELOS),
    seccoes: memoryStore(modelosSeccoes, SECCOES, { dedupeKeys: ['TIPOSEC_ID'] }),
    condicoes: memoryStore(modelosCondicoes, CONDICOES, { dedupeKeys: ['CDUNIECO', 'CDRAMO', 'CONTEXTO_ID'] }),
    omissao: memoryStore(modelosParametrosOmissao, OMISSAO),
    atributosEdoc: memoryStore(modelosAtributosEdoc, EDOC, { dedupeKeys: ['EDOC_ID'] }),
    atributosArquivo: memoryStore(modelosAtributosArquivo, ARQUIVO, { dedupeKeys: ['ARQ_ID'] }),
  };
  const repo = memoryModelosRepo({
    stores,
    parametros: PARAMETROS,
    tiposConteudo: TIPOS_CONTEUDO,
    contextos: CONTEXTOS,
    now: () => NOW,
  });
  const imageStore = memoryImageStore({
    exists: (k) => SECCOES.some((s) => s.MODELO_ID === k['MODELO_ID'] && s.TIPOSEC_ID === k['TIPOSEC_ID'] && s.ALINEA === k['ALINEA']),
  });
  registerModelosRoutes(app, { stores, repo, imageStore, maxBytes: 1024, now: () => NOW });
  return app;
}

type App = ReturnType<typeof appWith>;
type Linha = Record<string, unknown> & { _rid: string };

const list = async (app: App, url: string) => (await app.inject({ url })).json() as { rows: Linha[]; total: number };
const rowsOf = async (app: App, url: string) => (await list(app, url)).rows;
const pick = (row: Record<string, unknown>, cols: readonly string[]) => Object.fromEntries(cols.map((c) => [c, row[c]]));
const origOf = (row: Linha) => Object.fromEntries(Object.entries(row).filter(([k]) => k !== '_rid' && k !== 'TIPO_IMAGEM'));
const post = (app: App, url: string, payload: unknown) => app.inject({ method: 'POST', url, payload: payload as object });
const put = (app: App, base: string, row: Linha, values: Record<string, unknown>, orig: Record<string, unknown> = origOf(row)) =>
  app.inject({ method: 'PUT', url: `${base}/${row._rid}`, payload: { orig, values } });
const del = (app: App, base: string, row: Linha) =>
  app.inject({ method: 'DELETE', url: `${base}/${row._rid}`, payload: { orig: origOf(row) } });

const CLONE = { ID: 'M9', DESCRICAO: 'Cópia da carta', N_COPIAS: 2, FORMA_CONTROLO_RF: 'UV', DATA_INICIO: '2026-10-01' };
const NOVO_MODELO = {
  DESCRICAO: 'Novo',
  FORMA_CONTROLO_RF: 'C',
  MODO_EXPEDICAO_RF: 'I',
  STAMP: 'N',
  MODO_CERTIFICADO_RF: '0',
  MODO_PROTECAO_RF: '0',
};
const OMI = '/api/modelos/M1/parametros-report/1/omissao';
const HIST = '/api/modelos/M1/parametros-report/1/historico';

describe('access (every route is ADM only)', () => {
  const routes: [string, string, unknown?][] = [
    ['GET', '/api/modelos'],
    ['PUT', '/api/modelos/m1', { orig: {}, values: { DESCRICAO: 'x' } }],
    ['POST', '/api/modelos', { values: NOVO_MODELO }],
    ['POST', '/api/modelos/M1/acoes/clonar', CLONE],
    ['GET', '/api/modelos/M1/seccoes'],
    ['POST', '/api/modelos/M1/seccoes', { values: { TIPOSEC_ID: 'NOV', ALINEA: 1, TIPOCNTD_ID: 1 } }],
    ['POST', '/api/modelos/M1/seccoes/CAB/1/acoes/clonar'],
    ['GET', '/api/modelos/M1/seccoes/CAB/1/condicoes'],
    ['GET', '/api/modelos/M1/parametros-report'],
    ['PUT', OMI, { VALOR: 'x' }],
    ['GET', HIST],
    ['POST', HIST, { values: { DATA_INICIO: '2027-01-01T00:00:00' } }],
    ['GET', '/api/modelos/M1/atributos-edoc'],
    ['GET', '/api/modelos/M1/atributos-arquivo'],
    ['GET', '/api/dominios/MODELOS_GENERICOS/valores'],
    ['GET', '/api/dominios/TIPOS_CONTEUDO/valores'],
    ['GET', '/api/dominios/CONTEXTOS_APR/valores'],
    ['GET', '/api/dominios/FORMA_CONTROLO/valores'],
  ];

  it.each(routes)('USER gets 403 SEM_PERMISSAO on %s %s', async (method, url, payload) => {
    const r = await appWith('USER').inject({ method: method as 'GET', url, ...(payload ? { payload: payload as object } : {}) });
    expect(r.statusCode).toBe(403);
    expect(r.json()).toMatchObject({ code: 'SEM_PERMISSAO', message: SEM_PERMISSAO });
  });

  it.each(routes)('no session gets 401 on %s %s', async (method, url, payload) => {
    const r = await appWith(null).inject({ method: method as 'GET', url, ...(payload ? { payload: payload as object } : {}) });
    expect(r.statusCode).toBe(401);
    expect(r.json().code).toBe('SESSAO_EXPIRADA');
  });
});

describe('GET /api/modelos (QBE list)', () => {
  it('lists every model by ID', async () => {
    const r = await list(appWith(), '/api/modelos');
    expect(r.rows.map((x) => x.ID)).toEqual(['GEN1', 'GEN2', 'M1', 'M2']);
    expect(r.total).toBe(4);
  });

  it.each([
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
  ])('sorts by the CONSULTA column %s', async (col) => {
    const r = await appWith().inject({ url: `/api/modelos?sort=${col}:desc` });
    expect(r.statusCode).toBe(200);
    expect(r.json().total).toBe(4);
  });

  it('sort=DESCRICAO:asc orders by description', async () => {
    const rows = await rowsOf(appWith(), '/api/modelos?sort=DESCRICAO:asc');
    expect(rows.map((x) => x.ID)).toEqual(['M2', 'M1', 'GEN2', 'GEN1']);
  });

  it('a column without a CONSULTA button is not sortable (400)', async () => {
    expect((await appWith().inject({ url: '/api/modelos?sort=REPORT_ID:asc' })).statusCode).toBe(400);
  });
});

describe('PUT /api/modelos/:rid (BR-MOD-02, BR-MOD-12, grid)', () => {
  const m1 = async (app: App) => (await rowsOf(app, '/api/modelos?f[ID]=M1'))[0]!;

  it('"Alterar Modelo" subset saves and stamps ACTUALIZADO_POR / DATA_ACTUALIZACAO', async () => {
    const app = appWith();
    const values = {
      DESCRICAO: 'Carta nova',
      N_COPIAS: 3,
      FORMA_CONTROLO_RF: 'V',
      DATA_INICIO: '2021-01-01T00:00:00',
      DATA_FIM: '2030-12-31T00:00:00',
    };
    const r = await put(app, '/api/modelos', await m1(app), values);
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ ...values, ACTUALIZADO_POR: 'JOAO', CRIADO_POR: 'MIGRACAO' });
    expect(r.json().DATA_ACTUALIZACAO).toBeTruthy();
    expect(await m1(app)).toMatchObject({ ...values, ACTUALIZADO_POR: 'JOAO' });
  });

  it('"Código Barras" subset saves the six BARCODE_* columns', async () => {
    const app = appWith();
    const values = {
      BARCODE_TYPE: 'QRCODE',
      BARCODE_FORMAT: 'X',
      BARCODE_WEIGHT: 2.5,
      BARCODE_HEIGHT: 1.5,
      BARCODE_X_POSITION: 1,
      BARCODE_Y_POSITION: 2,
    };
    expect((await put(app, '/api/modelos', await m1(app), values)).statusCode).toBe(200);
    expect(await m1(app)).toMatchObject({ ...values, DESCRICAO: 'Carta' });
  });

  it('grid subset saves the modes, STAMP and GENERICO_ID', async () => {
    const app = appWith();
    const values = {
      MODO_EXPEDICAO_RF: 'I',
      STAMP: 'N',
      MODO_CERTIFICADO_RF: '0',
      GENERICO_ID: 'GEN2',
      MODO_PROTECAO_RF: '0',
    };
    expect((await put(app, '/api/modelos', await m1(app), values)).statusCode).toBe(200);
    expect(await m1(app)).toMatchObject(values);
  });

  it.each([
    ['ID', 'M7'],
    ['REPORT_ID', 1],
    ['TIPO_DOCUMENTO_RF', 'GNR'],
    ['N_ANEXOS', 9],
    ['CRIADO_POR', 'X'],
    ['NAO_EXISTE', 'x'],
  ])('refuses the read-only or unknown column %s (400) and changes nothing', async (col, v) => {
    const app = appWith();
    const r = await put(app, '/api/modelos', await m1(app), { DESCRICAO: 'Outra', [col]: v });
    expect(r.statusCode).toBe(400);
    expect(r.json().code).toBe('VALIDACAO');
    expect(await m1(app)).toMatchObject({ ID: 'M1', DESCRICAO: 'Carta', REPORT_ID: 10 });
  });
});

describe('POST / DELETE /api/modelos (block Insert/Delete false)', () => {
  it('POST is 403 SEM_PERMISSAO for the ADM and creates nothing', async () => {
    const app = appWith();
    const r = await post(app, '/api/modelos', { values: NOVO_MODELO });
    expect(r.statusCode).toBe(403);
    expect(r.json()).toMatchObject({ code: 'SEM_PERMISSAO', message: SEM_PERMISSAO });
    expect((await list(app, '/api/modelos')).total).toBe(4);
  });

  it('DELETE is 403 SEM_PERMISSAO for the ADM and the model stays', async () => {
    const app = appWith();
    const [m2] = await rowsOf(app, '/api/modelos?f[ID]=M2');
    const r = await del(app, '/api/modelos', m2!);
    expect(r.statusCode).toBe(403);
    expect(r.json()).toMatchObject({ code: 'SEM_PERMISSAO', message: SEM_PERMISSAO });
    expect((await list(app, '/api/modelos?f[ID]=M2')).total).toBe(1);
  });
});

describe('POST /api/modelos/:MODELO_ID/acoes/clonar (BR-MOD-03)', () => {
  it('201 { ID } and the new model takes source and form values, DB defaults, no barcode, CRIADO_POR = user', async () => {
    const app = appWith();
    const r = await post(app, '/api/modelos/M1/acoes/clonar', CLONE);
    expect(r.statusCode).toBe(201);
    expect(r.json()).toEqual({ ID: 'M9' });
    const [m9] = await rowsOf(app, '/api/modelos?f[ID]=M9');
    expect(m9).toMatchObject({
      ID: 'M9',
      DESCRICAO: 'Cópia da carta',
      N_COPIAS: 2,
      FORMA_CONTROLO_RF: 'UV',
      DATA_INICIO: '2026-10-01T00:00:00',
      DATA_FIM: null,
      TIPO_DOCUMENTO_RF: 'DOC',
      REPORT_ID: 10,
      N_ANEXOS: 2,
      MAX_IMPRESSOES: 5,
      MODO_EXPEDICAO_RF: 'I',
      MODO_CERTIFICADO_RF: '0',
      MODO_PROTECAO_RF: '0',
      STAMP: 'N',
      GENERICO_ID: null,
      BARCODE_TYPE: null,
      BARCODE_FORMAT: null,
      BARCODE_WEIGHT: null,
      BARCODE_HEIGHT: null,
      BARCODE_X_POSITION: null,
      BARCODE_Y_POSITION: null,
      CRIADO_POR: 'JOAO',
    });
    expect((await list(app, '/api/modelos')).total).toBe(5);
  });

  it('accepts full timestamps and a DATA_FIM', async () => {
    const app = appWith();
    const body = { ...CLONE, DATA_INICIO: '2026-10-01T08:30:00', DATA_FIM: '2027-12-31T00:00:00' };
    expect((await post(app, '/api/modelos/M1/acoes/clonar', body)).statusCode).toBe(201);
    const [m9] = await rowsOf(app, '/api/modelos?f[ID]=M9');
    expect(m9).toMatchObject({ DATA_INICIO: '2026-10-01T08:30:00', DATA_FIM: '2027-12-31T00:00:00' });
  });

  it('copies every section with the new MODELO_ID and CRIADO_POR = user', async () => {
    const app = appWith();
    await post(app, '/api/modelos/M1/acoes/clonar', CLONE);
    const cols = ['MODELO_ID', 'TIPOSEC_ID', 'ALINEA', 'TITULO', 'TEXTO', 'TIPOCNTD_ID', 'FORMULA_ID', 'CRIADO_POR'];
    expect((await rowsOf(app, '/api/modelos/M9/seccoes')).map((s) => pick(s, cols))).toEqual([
      { MODELO_ID: 'M9', TIPOSEC_ID: 'CAB', ALINEA: 1, TITULO: 'CAB 1', TEXTO: 'Texto CAB 1', TIPOCNTD_ID: 2, FORMULA_ID: 7, CRIADO_POR: 'JOAO' },
      { MODELO_ID: 'M9', TIPOSEC_ID: 'CAB', ALINEA: 2, TITULO: 'CAB 2', TEXTO: 'Texto CAB 2', TIPOCNTD_ID: 3, FORMULA_ID: null, CRIADO_POR: 'JOAO' },
      { MODELO_ID: 'M9', TIPOSEC_ID: 'ROD', ALINEA: 1, TITULO: 'ROD 1', TEXTO: 'Texto ROD 1', TIPOCNTD_ID: 1, FORMULA_ID: null, CRIADO_POR: 'JOAO' },
    ]);
    expect((await list(app, '/api/modelos/M1/seccoes')).total).toBe(3);
  });

  it('copies every condition with all columns, CRIADO_POR / DATA_CRIACAO kept from the source', async () => {
    const app = appWith();
    await post(app, '/api/modelos/M1/acoes/clonar', CLONE);
    const cols = ['MODELO_ID', 'TIPOSEC_ID', 'ALINEA', 'DATA_INICIO', 'CDUNIECO', 'CDRAMO', 'CONTEXTO_ID', 'ATRIBUTO1', 'CRIADO_POR', 'DATA_CRIACAO'];
    const comum = { MODELO_ID: 'M9', DATA_INICIO: '2020-01-01T00:00:00', CRIADO_POR: 'MIGRACAO', DATA_CRIACAO: '2020-02-02T00:00:00' };
    expect((await rowsOf(app, '/api/modelos/M9/seccoes/CAB/1/condicoes')).map((c) => pick(c, cols))).toEqual([
      { ...comum, TIPOSEC_ID: 'CAB', ALINEA: 1, CDUNIECO: 2, CDRAMO: 'R2', CONTEXTO_ID: 4, ATRIBUTO1: null },
      { ...comum, TIPOSEC_ID: 'CAB', ALINEA: 1, CDUNIECO: 1, CDRAMO: 'R1', CONTEXTO_ID: 5, ATRIBUTO1: 'a1' },
    ]);
    expect((await rowsOf(app, '/api/modelos/M9/seccoes/CAB/2/condicoes')).map((c) => pick(c, cols))).toEqual([
      { ...comum, TIPOSEC_ID: 'CAB', ALINEA: 2, CDUNIECO: 1, CDRAMO: 'R1', CONTEXTO_ID: 6, ATRIBUTO1: null },
    ]);
    expect((await list(app, '/api/modelos/M1/seccoes/CAB/1/condicoes')).total).toBe(2);
  });

  it('an existing ID → 409 MODELO_EXISTENTE with the form text, nothing copied', async () => {
    const app = appWith();
    const r = await post(app, '/api/modelos/M1/acoes/clonar', { ...CLONE, ID: 'M2' });
    expect(r.statusCode).toBe(409);
    expect(r.json()).toMatchObject({ code: 'MODELO_EXISTENTE', message: MODELO_EXISTENTE, fields: { ID: MODELO_EXISTENTE } });
    expect(await rowsOf(app, '/api/modelos?f[ID]=M2')).toMatchObject([{ DESCRICAO: 'Aviso' }]);
    expect((await list(app, '/api/modelos/M2/seccoes')).total).toBe(1);
    expect((await list(app, '/api/modelos')).total).toBe(4);
  });

  it('an unknown source → 404 NAO_ENCONTRADO, nothing created', async () => {
    const app = appWith();
    const r = await post(app, '/api/modelos/NOPE/acoes/clonar', CLONE);
    expect(r.statusCode).toBe(404);
    expect(r.json()).toMatchObject({ code: 'NAO_ENCONTRADO', message: NAO_ENCONTRADO });
    expect((await list(app, '/api/modelos')).total).toBe(4);
    expect((await list(app, '/api/modelos/M9/seccoes')).total).toBe(0);
  });

  it.each([
    ['ID longer than 10', { ...CLONE, ID: 'M1234567890' }],
    ['ID missing', { DESCRICAO: 'x', N_COPIAS: 1, FORMA_CONTROLO_RF: 'C', DATA_INICIO: '2026-10-01' }],
    ['DESCRICAO missing', { ID: 'M9', N_COPIAS: 1, FORMA_CONTROLO_RF: 'C', DATA_INICIO: '2026-10-01' }],
    ['N_COPIAS missing', { ID: 'M9', DESCRICAO: 'x', FORMA_CONTROLO_RF: 'C', DATA_INICIO: '2026-10-01' }],
    ['FORMA_CONTROLO_RF missing', { ID: 'M9', DESCRICAO: 'x', N_COPIAS: 1, DATA_INICIO: '2026-10-01' }],
    ['FORMA_CONTROLO_RF not C/V/U/UV', { ...CLONE, FORMA_CONTROLO_RF: 'X' }],
    ['DATA_INICIO missing', { ID: 'M9', DESCRICAO: 'x', N_COPIAS: 1, FORMA_CONTROLO_RF: 'C' }],
    ['DATA_INICIO not a date', { ...CLONE, DATA_INICIO: '01-10-2026' }],
    ['DATA_INICIO not a calendar day', { ...CLONE, DATA_INICIO: '2026-13-45' }],
    ['DATA_FIM with hour 25', { ...CLONE, DATA_FIM: '2026-12-01T25:00:00' }],
  ])('%s → 400 VALIDACAO, nothing created', async (_what, body) => {
    const app = appWith();
    const r = await post(app, '/api/modelos/M1/acoes/clonar', body);
    expect(r.statusCode).toBe(400);
    expect(r.json().code).toBe('VALIDACAO');
    expect((await list(app, '/api/modelos')).total).toBe(4);
  });
});

describe('seccoes (tab Secções)', () => {
  const SEC = '/api/modelos/M1/seccoes';

  it('lists the sections of the model by TIPOSEC_ID, ALINEA, with TIPO_IMAGEM', async () => {
    const rows = await rowsOf(appWith(), SEC);
    expect(rows.map((s) => pick(s, ['MODELO_ID', 'TIPOSEC_ID', 'ALINEA', 'TIPO_IMAGEM']))).toEqual([
      { MODELO_ID: 'M1', TIPOSEC_ID: 'CAB', ALINEA: 1, TIPO_IMAGEM: 'PNG' },
      { MODELO_ID: 'M1', TIPOSEC_ID: 'CAB', ALINEA: 2, TIPO_IMAGEM: null },
      { MODELO_ID: 'M1', TIPOSEC_ID: 'ROD', ALINEA: 1, TIPO_IMAGEM: null },
    ]);
  });

  it('POST inserts under the model with CRIADO_POR / DATA_CRIACAO from the session', async () => {
    const app = appWith();
    const r = await post(app, SEC, { values: { TIPOSEC_ID: 'NOV', ALINEA: 1, TITULO: 'Nova', TEXTO: 't', TIPOCNTD_ID: 2 } });
    expect(r.statusCode).toBe(201);
    expect(r.json()).toMatchObject({ MODELO_ID: 'M1', TIPOSEC_ID: 'NOV', ALINEA: 1, TITULO: 'Nova', CRIADO_POR: 'JOAO', ACTUALIZADO_POR: null });
    expect(r.json().DATA_CRIACAO).toBeTruthy();
    expect((await list(app, SEC)).total).toBe(4);
  });

  it('POST without TIPOCNTD_ID → 400 on values.TIPOCNTD_ID', async () => {
    const r = await post(appWith(), SEC, { values: { TIPOSEC_ID: 'NOV', ALINEA: 1, TITULO: 'Nova' } });
    expect(r.statusCode).toBe(400);
    expect(Object.keys(r.json().fields)).toContain('values.TIPOCNTD_ID');
  });

  it.each([
    ['CRIADO_POR', 'X'],
    ['TIPO_IMAGEM', 'PNG'],
    ['FORMULA_ID', 1],
  ])('POST refuses the non-editable column %s (400)', async (col, v) => {
    const r = await post(appWith(), SEC, { values: { TIPOSEC_ID: 'NOV', ALINEA: 1, TIPOCNTD_ID: 2, [col]: v } });
    expect(r.statusCode).toBe(400);
  });

  it('PUT changes TITULO and stamps ACTUALIZADO_POR / DATA_ACTUALIZACAO', async () => {
    const app = appWith();
    const [cab2] = await rowsOf(app, `${SEC}?f[TIPOSEC_ID]=CAB&f[ALINEA]=2`);
    const r = await put(app, SEC, cab2!, { TITULO: 'Novo título', TIPOCNTD_ID: 1 });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ TITULO: 'Novo título', TIPOCNTD_ID: 1, ACTUALIZADO_POR: 'JOAO', CRIADO_POR: 'MIGRACAO' });
    expect(r.json().DATA_ACTUALIZACAO).toBeTruthy();
  });

  it('PUT cannot change the key TIPOSEC_ID (400)', async () => {
    const app = appWith();
    const [cab2] = await rowsOf(app, `${SEC}?f[TIPOSEC_ID]=CAB&f[ALINEA]=2`);
    expect((await put(app, SEC, cab2!, { TIPOSEC_ID: 'XYZ' })).statusCode).toBe(400);
  });

  it('DELETE of a section without conditions → 204 and it is gone', async () => {
    const app = appWith();
    const [rod] = await rowsOf(app, `${SEC}?f[TIPOSEC_ID]=ROD`);
    expect((await del(app, SEC, rod!)).statusCode).toBe(204);
    expect((await rowsOf(app, SEC)).map((s) => s.TIPOSEC_ID)).toEqual(['CAB', 'CAB']);
  });

  it('DELETE of a section with conditions → 409 ORA_02292 APAGAR_MESTRE and it stays', async () => {
    const app = appWith();
    const [cab1] = await rowsOf(app, `${SEC}?f[TIPOSEC_ID]=CAB&f[ALINEA]=1`);
    const r = await del(app, SEC, cab1!);
    expect(r.statusCode).toBe(409);
    expect(r.json()).toMatchObject({ code: 'ORA_02292', message: APAGAR_MESTRE });
    expect((await list(app, SEC)).total).toBe(3);
    expect((await list(app, `${SEC}/CAB/1/condicoes`)).total).toBe(2);
  });
});

describe('POST …/seccoes/:TIPOSEC_ID/:ALINEA/acoes/clonar (BR-MOD-05)', () => {
  it('201 with ALINEA = MAX+1 of the model and section type; the copy is audited as the user', async () => {
    const app = appWith();
    const r = await post(app, '/api/modelos/M1/seccoes/CAB/1/acoes/clonar', {});
    expect(r.statusCode).toBe(201);
    expect(r.json()).toEqual({ MODELO_ID: 'M1', TIPOSEC_ID: 'CAB', ALINEA: 3 });
    const [copia] = await rowsOf(app, '/api/modelos/M1/seccoes?f[TIPOSEC_ID]=CAB&f[ALINEA]=3');
    expect(copia).toMatchObject({
      MODELO_ID: 'M1',
      TITULO: 'CAB 1',
      TEXTO: 'Texto CAB 1',
      TIPOCNTD_ID: 2,
      CRIADO_POR: 'JOAO',
      ACTUALIZADO_POR: null,
      DATA_ACTUALIZACAO: null,
    });
  });

  it('does not copy the conditions', async () => {
    const app = appWith();
    await post(app, '/api/modelos/M1/seccoes/CAB/1/acoes/clonar', {});
    expect((await list(app, '/api/modelos/M1/seccoes/CAB/3/condicoes')).total).toBe(0);
    expect((await list(app, '/api/modelos/M1/seccoes/CAB/1/condicoes')).total).toBe(2);
  });

  it('the MAX is per section type and grows with each copy', async () => {
    const app = appWith();
    expect((await post(app, '/api/modelos/M1/seccoes/ROD/1/acoes/clonar', {})).json()).toEqual({ MODELO_ID: 'M1', TIPOSEC_ID: 'ROD', ALINEA: 2 });
    expect((await post(app, '/api/modelos/M1/seccoes/CAB/1/acoes/clonar', {})).json().ALINEA).toBe(3);
    expect((await post(app, '/api/modelos/M1/seccoes/CAB/1/acoes/clonar', {})).json().ALINEA).toBe(4);
  });

  it.each(['/api/modelos/M1/seccoes/XXX/1', '/api/modelos/M1/seccoes/CAB/9', '/api/modelos/NOPE/seccoes/CAB/1'])(
    'unknown section %s → 404',
    async (base) => {
      const app = appWith();
      const r = await post(app, `${base}/acoes/clonar`, {});
      expect(r.statusCode).toBe(404);
      expect(r.json().code).toBe('NAO_ENCONTRADO');
      expect((await list(app, '/api/modelos/M1/seccoes')).total).toBe(3);
    },
  );
});

describe('condicoes (detail of a section)', () => {
  const CON = '/api/modelos/M1/seccoes/CAB/1/condicoes';

  it('lists the conditions of that section only, by CONTEXTO_ID', async () => {
    const rows = await rowsOf(appWith(), CON);
    expect(rows.map((c) => pick(c, ['TIPOSEC_ID', 'ALINEA', 'CONTEXTO_ID']))).toEqual([
      { TIPOSEC_ID: 'CAB', ALINEA: 1, CONTEXTO_ID: 4 },
      { TIPOSEC_ID: 'CAB', ALINEA: 1, CONTEXTO_ID: 5 },
    ]);
  });

  it('POST inserts under the section with CRIADO_POR from the session', async () => {
    const app = appWith();
    const r = await post(app, CON, {
      values: { DATA_INICIO: '2026-01-01T00:00:00', CDUNIECO: 3, CDRAMO: 'R3', CONTEXTO_ID: 5, ATRIBUTO1: 'x' },
    });
    expect(r.statusCode).toBe(201);
    expect(r.json()).toMatchObject({ MODELO_ID: 'M1', TIPOSEC_ID: 'CAB', ALINEA: 1, CDRAMO: 'R3', CRIADO_POR: 'JOAO' });
    expect(r.json().DATA_CRIACAO).toBeTruthy();
    expect((await list(app, CON)).total).toBe(3);
  });

  it('POST without CONTEXTO_ID → 400 on values.CONTEXTO_ID', async () => {
    const r = await post(appWith(), CON, { values: { DATA_INICIO: '2026-01-01T00:00:00', CDUNIECO: 3, CDRAMO: 'R3' } });
    expect(r.statusCode).toBe(400);
    expect(Object.keys(r.json().fields)).toContain('values.CONTEXTO_ID');
  });

  it('PUT stamps ACTUALIZADO_POR', async () => {
    const app = appWith();
    const [c] = await rowsOf(app, CON);
    const r = await put(app, CON, c!, { ATRIBUTO2: 'b2' });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ ATRIBUTO2: 'b2', ACTUALIZADO_POR: 'JOAO' });
  });

  it('DELETE removes the condition', async () => {
    const app = appWith();
    const [c] = await rowsOf(app, CON);
    expect((await del(app, CON, c!)).statusCode).toBe(204);
    expect((await list(app, CON)).total).toBe(1);
  });
});

describe('GET /api/modelos/:MODELO_ID/parametros-report (BR-MOD-08)', () => {
  it('lists the report parameters by N_PARAMETRO with the current default and DETALHES', async () => {
    const r = await appWith().inject({ url: '/api/modelos/M1/parametros-report' });
    expect(r.statusCode).toBe(200);
    const rows = r.json().rows as Record<string, unknown>[];
    expect(r.json()).toMatchObject({ total: 3, totalCapped: false, page: 1 }); // the grid's envelope
    expect(rows.map((p) => p['_rid'])).toEqual(['1', '2', '3']);
    expect(rows).toHaveLength(3);
    expect(rows).toMatchObject([
      {
        ...parametro(10, 1, 'P_NOME'),
        VALOR: 'actual',
        DATA_INICIO: '2025-01-01T00:00:00',
        DATA_FIM: null,
        NOME_CONSULTA: 'Q1',
        CONSULTA_ONLINE: 'S',
        DETALHES: '***',
      },
      {
        ...parametro(10, 2, 'P_DATA'),
        VALOR: null,
        DATA_INICIO: null,
        DATA_FIM: null,
        NOME_CONSULTA: null,
        CONSULTA_ONLINE: 'N',
        DETALHES: '***',
      },
      {
        ...parametro(10, 3, 'P_SEM'),
        VALOR: null,
        DATA_INICIO: null,
        DATA_FIM: null,
        NOME_CONSULTA: null,
        CONSULTA_ONLINE: 'N',
        DETALHES: null,
      },
    ]);
  });

  it.each(['M2', 'NOPE'])('a model without a report (%s) → no rows', async (id) => {
    const r = await appWith().inject({ url: `/api/modelos/${id}/parametros-report` });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ rows: [], total: 0 });
  });
});

describe('PUT …/parametros-report/:N_PARAMETRO/omissao (BR-MOD-09)', () => {
  const hist = async (app: App, url = HIST) =>
    (await rowsOf(app, url)).map((h) => pick(h, ['DATA_INICIO', 'DATA_FIM', 'VALOR', 'NOME_CONSULTA', 'CONSULTA_ONLINE']));
  const ANTIGO = { DATA_INICIO: '2024-01-01T00:00:00', DATA_FIM: '2024-12-31T00:00:00', VALOR: 'antigo', NOME_CONSULTA: null, CONSULTA_ONLINE: 'N' };
  const ACTUAL = { DATA_INICIO: '2025-01-01T00:00:00', DATA_FIM: null, VALOR: 'actual', NOME_CONSULTA: 'Q1', CONSULTA_ONLINE: 'S' };

  it('a later start closes the open row the day before and inserts the new one', async () => {
    const app = appWith();
    const r = await app.inject({ method: 'PUT', url: OMI, payload: { VALOR: 'novo', DATA_INICIO: '2026-03-15T08:00:00' } });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({
      operacoes: [
        { tipo: 'fechar', DATA_INICIO: '2025-01-01T00:00:00', DATA_FIM: '2026-03-14T08:00:00' },
        {
          tipo: 'inserir',
          row: { DATA_INICIO: '2026-03-15T08:00:00', DATA_FIM: null, VALOR: 'novo', NOME_CONSULTA: null, CONSULTA_ONLINE: 'N' },
        },
      ],
    });
    expect(await hist(app)).toEqual([
      { DATA_INICIO: '2026-03-15T08:00:00', DATA_FIM: null, VALOR: 'novo', NOME_CONSULTA: null, CONSULTA_ONLINE: 'N' },
      { ...ACTUAL, DATA_FIM: '2026-03-14T08:00:00' },
      ANTIGO,
    ]);
    expect((await app.inject({ url: '/api/modelos/M1/parametros-report' })).json().rows[0]).toMatchObject({
      VALOR: 'novo',
      DATA_INICIO: '2026-03-15T08:00:00',
    });
  });

  it('without a date: closes yesterday and starts today at midnight', async () => {
    const app = appWith();
    const r = await app.inject({ method: 'PUT', url: OMI, payload: { VALOR: 'hoje' } });
    expect(r.statusCode).toBe(200);
    expect(r.json().operacoes).toEqual([
      { tipo: 'fechar', DATA_INICIO: '2025-01-01T00:00:00', DATA_FIM: '2026-09-28T00:00:00' },
      {
        tipo: 'inserir',
        row: { DATA_INICIO: '2026-09-29T00:00:00', DATA_FIM: null, VALOR: 'hoje', NOME_CONSULTA: null, CONSULTA_ONLINE: 'N' },
      },
    ]);
    expect((await hist(app)).map((h) => h.DATA_INICIO)).toEqual(['2026-09-29T00:00:00', '2025-01-01T00:00:00', '2024-01-01T00:00:00']);
  });

  it('a start on the same day as a row updates that row', async () => {
    const app = appWith();
    const r = await app.inject({
      method: 'PUT',
      url: OMI,
      payload: { VALOR: 'corrigido', DATA_INICIO: '2025-01-01T12:00:00', NOME_CONSULTA: 'Q2', CONSULTA_ONLINE: 'S' },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json().operacoes).toEqual([
      {
        tipo: 'actualizar',
        DATA_INICIO: '2025-01-01T00:00:00',
        set: { VALOR: 'corrigido', DATA_FIM: null, NOME_CONSULTA: 'Q2', CONSULTA_ONLINE: 'S' },
      },
    ]);
    expect(await hist(app)).toEqual([{ ...ACTUAL, VALOR: 'corrigido', NOME_CONSULTA: 'Q2' }, ANTIGO]);
  });

  it('a historical start ends the day before the next row, ignoring the given DATA_FIM', async () => {
    const app = appWith();
    const r = await app.inject({
      method: 'PUT',
      url: OMI,
      payload: { VALOR: 'velho', DATA_INICIO: '2023-06-01T00:00:00', DATA_FIM: '2099-01-01T00:00:00' },
    });
    expect(r.statusCode).toBe(200);
    expect(await hist(app)).toEqual([
      ACTUAL,
      ANTIGO,
      { DATA_INICIO: '2023-06-01T00:00:00', DATA_FIM: '2023-12-31T00:00:00', VALOR: 'velho', NOME_CONSULTA: null, CONSULTA_ONLINE: 'N' },
    ]);
  });

  it('an empty request (CONSULTA_ONLINE defaults to N) writes nothing', async () => {
    const app = appWith();
    const r = await app.inject({ method: 'PUT', url: OMI, payload: {} });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ operacoes: [] });
    expect(await hist(app)).toEqual([ACTUAL, ANTIGO]);
  });

  it('a parameter with no rows gets its first row', async () => {
    const app = appWith();
    const url = '/api/modelos/M1/parametros-report/3/omissao';
    const r = await app.inject({ method: 'PUT', url, payload: { VALOR: 'primeiro', DATA_INICIO: '2026-01-01T00:00:00' } });
    expect(r.statusCode).toBe(200);
    expect(await hist(app, '/api/modelos/M1/parametros-report/3/historico')).toEqual([
      { DATA_INICIO: '2026-01-01T00:00:00', DATA_FIM: null, VALOR: 'primeiro', NOME_CONSULTA: null, CONSULTA_ONLINE: 'N' },
    ]);
    expect(await hist(app, '/api/modelos/M2/parametros-report/1/historico')).toHaveLength(1);
  });

  it('DATA_INICIO after DATA_FIM → 400 VALIDACAO INICIO_SUPERIOR on DATA_INICIO, nothing written', async () => {
    const app = appWith();
    const r = await app.inject({
      method: 'PUT',
      url: OMI,
      payload: { VALOR: 'x', DATA_INICIO: '2026-05-01T00:00:00', DATA_FIM: '2026-04-01T00:00:00' },
    });
    expect(r.statusCode).toBe(400);
    expect(r.json()).toMatchObject({ code: 'VALIDACAO', message: INICIO_SUPERIOR, fields: { DATA_INICIO: INICIO_SUPERIOR } });
    expect(await hist(app)).toEqual([ACTUAL, ANTIGO]);
  });

  it.each(['/api/modelos/M1/parametros-report/9/omissao', '/api/modelos/M2/parametros-report/1/omissao'])(
    'a parameter that is not in the model report (%s) → 404, nothing written',
    async (url) => {
      const app = appWith();
      const r = await app.inject({ method: 'PUT', url, payload: { VALOR: 'x', DATA_INICIO: '2026-01-01T00:00:00' } });
      expect(r.statusCode).toBe(404);
      expect(await hist(app, '/api/modelos/M2/parametros-report/1/historico')).toHaveLength(1);
    },
  );

  it('an impossible date → 400, not 500', async () => {
    const r = await appWith().inject({ method: 'PUT', url: OMI, payload: { VALOR: 'x', DATA_INICIO: '2026-02-30T00:00:00' } });
    expect(r.statusCode).toBe(400);
  });

  it('CONSULTA_ONLINE other than S/N → 400', async () => {
    const r = await appWith().inject({ method: 'PUT', url: OMI, payload: { VALOR: 'x', CONSULTA_ONLINE: 'X' } });
    expect(r.statusCode).toBe(400);
  });
});

describe('historico (DOC_PARAMETROS_OMISSAO, BR-MOD-10)', () => {
  const byInicio = async (app: App, ini: string) => (await rowsOf(app, HIST)).find((h) => h.DATA_INICIO === ini)!;

  it('lists the rows of that model and parameter, newest first', async () => {
    const rows = await rowsOf(appWith(), HIST);
    expect(rows.map((h) => pick(h, ['MODELO_ID', 'N_PARAMETRO', 'VALOR']))).toEqual([
      { MODELO_ID: 'M1', N_PARAMETRO: 1, VALOR: 'actual' },
      { MODELO_ID: 'M1', N_PARAMETRO: 1, VALOR: 'antigo' },
    ]);
  });

  it('POST of a free range → 201 with CRIADO_POR from the session', async () => {
    const app = appWith();
    const r = await post(app, HIST, { values: { VALOR: 'v', DATA_INICIO: '2023-01-01T00:00:00', DATA_FIM: '2023-06-30T00:00:00' } });
    expect(r.statusCode).toBe(201);
    expect(r.json()).toMatchObject({ MODELO_ID: 'M1', N_PARAMETRO: 1, VALOR: 'v', CRIADO_POR: 'JOAO' });
    expect((await list(app, HIST)).total).toBe(3);
  });

  it('POST after now does not clash with the open row (bounded by now)', async () => {
    const app = appWith();
    expect((await post(app, HIST, { values: { VALOR: 'f', DATA_INICIO: '2027-01-01T00:00:00' } })).statusCode).toBe(201);
  });

  it('POST checks only the rows of the same parameter', async () => {
    const app = appWith();
    const r = await post(app, '/api/modelos/M1/parametros-report/2/historico', { values: { VALOR: 'v', DATA_INICIO: '2024-06-01T00:00:00' } });
    expect(r.statusCode).toBe(201);
  });

  it.each([
    ['start inside a range', { DATA_INICIO: '2024-06-01T00:00:00' }, 'values.DATA_INICIO', INICIO_EM_INTERVALO],
    ['start inside the open row', { DATA_INICIO: '2026-01-01T00:00:00' }, 'values.DATA_INICIO', INICIO_EM_INTERVALO],
    ['end inside a range', { DATA_INICIO: '2023-01-01T00:00:00', DATA_FIM: '2024-02-01T00:00:00' }, 'values.DATA_FIM', FIM_EM_INTERVALO],
    ['start after end', { DATA_INICIO: '2023-06-01T00:00:00', DATA_FIM: '2023-01-01T00:00:00' }, 'values.DATA_INICIO', INICIO_SUPERIOR],
  ])('POST with %s → 400 VALIDACAO with the rule text', async (_what, values, campo, mensagem) => {
    const app = appWith();
    const r = await post(app, HIST, { values: { VALOR: 'v', ...values } });
    expect(r.statusCode).toBe(400);
    expect(r.json()).toMatchObject({ code: 'VALIDACAO', message: mensagem, fields: { [campo]: mensagem } });
    expect((await list(app, HIST)).total).toBe(2);
  });

  it('POST without DATA_INICIO → 400', async () => {
    expect((await post(appWith(), HIST, { values: { VALOR: 'v' } })).statusCode).toBe(400);
  });

  it('PUT of VALOR only runs no date check and stamps ACTUALIZADO_POR', async () => {
    const app = appWith();
    const r = await put(app, HIST, await byInicio(app, '2024-01-01T00:00:00'), { VALOR: 'mudado' });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ VALOR: 'mudado', ACTUALIZADO_POR: 'JOAO' });
  });

  it('PUT ignores the edited row itself when checking the ranges', async () => {
    const app = appWith();
    const r = await put(app, HIST, await byInicio(app, '2024-01-01T00:00:00'), { DATA_INICIO: '2024-02-01T00:00:00' });
    expect(r.statusCode).toBe(200);
    expect(r.json().DATA_INICIO).toBe('2024-02-01T00:00:00');
  });

  it('PUT of DATA_FIM into another range → FIM_EM_INTERVALO on values.DATA_FIM', async () => {
    const app = appWith();
    const r = await put(app, HIST, await byInicio(app, '2024-01-01T00:00:00'), { DATA_FIM: '2025-02-01T00:00:00' });
    expect(r.statusCode).toBe(400);
    expect(r.json()).toMatchObject({ code: 'VALIDACAO', message: FIM_EM_INTERVALO, fields: { 'values.DATA_FIM': FIM_EM_INTERVALO } });
  });

  it('PUT of DATA_INICIO only compares with the stored DATA_FIM → INICIO_SUPERIOR', async () => {
    const app = appWith();
    const r = await put(app, HIST, await byInicio(app, '2024-01-01T00:00:00'), { DATA_INICIO: '2025-03-01T00:00:00' });
    expect(r.statusCode).toBe(400);
    expect(r.json()).toMatchObject({ code: 'VALIDACAO', message: INICIO_SUPERIOR, fields: { 'values.DATA_INICIO': INICIO_SUPERIOR } });
  });

  it('PUT of DATA_INICIO into another range → INICIO_EM_INTERVALO, row unchanged', async () => {
    const app = appWith();
    const r = await put(app, HIST, await byInicio(app, '2025-01-01T00:00:00'), { DATA_INICIO: '2024-06-01T00:00:00' });
    expect(r.statusCode).toBe(400);
    expect(r.json()).toMatchObject({ message: INICIO_EM_INTERVALO, fields: { 'values.DATA_INICIO': INICIO_EM_INTERVALO } });
    expect(await byInicio(app, '2025-01-01T00:00:00')).toMatchObject({ VALOR: 'actual' });
  });

  it('DELETE removes the row', async () => {
    const app = appWith();
    expect((await del(app, HIST, await byInicio(app, '2024-01-01T00:00:00'))).statusCode).toBe(204);
    expect((await rowsOf(app, HIST)).map((h) => h.VALOR)).toEqual(['actual']);
  });
});

describe.each([
  ['atributos-edoc', 'EDOC_ID'],
  ['atributos-arquivo', 'ARQ_ID'],
])('%s (BR-MOD-11)', (path, grupo) => {
  const URL = `/api/modelos/M1/${path}`;
  const ramos = async (app: App, url = URL) => (await rowsOf(app, url)).map((a) => pick(a, [grupo, 'N_ATRIBUTO', 'CDRAMO']));
  const first = async (app: App) => (await rowsOf(app, URL))[0]!;

  it('lists the attributes of the model', async () => {
    expect(await ramos(appWith())).toEqual([
      { [grupo]: 100, N_ATRIBUTO: 1, CDRAMO: 'R1' },
      { [grupo]: 100, N_ATRIBUTO: 2, CDRAMO: 'R1' },
      { [grupo]: 200, N_ATRIBUTO: 3, CDRAMO: 'R1' },
    ]);
  });

  it(`PUT CDRAMO changes every row of the same MODELO_ID + ${grupo}, others untouched`, async () => {
    const app = appWith();
    const r = await put(app, URL, await first(app), { CDRAMO: 'R9' });
    expect(r.statusCode).toBe(200);
    expect(await ramos(app)).toEqual([
      { [grupo]: 100, N_ATRIBUTO: 1, CDRAMO: 'R9' },
      { [grupo]: 100, N_ATRIBUTO: 2, CDRAMO: 'R9' },
      { [grupo]: 200, N_ATRIBUTO: 3, CDRAMO: 'R1' },
    ]);
    expect(await ramos(app, `/api/modelos/M2/${path}`)).toEqual([{ [grupo]: 100, N_ATRIBUTO: 1, CDRAMO: 'R1' }]);
  });

  it('PUT stamps ACTUALIZADO_POR on the edited row', async () => {
    const app = appWith();
    await put(app, URL, await first(app), { CDRAMO: 'R9' });
    expect(await first(app)).toMatchObject({ N_ATRIBUTO: 1, ACTUALIZADO_POR: 'JOAO' });
  });

  it.each([
    [{ CDRAMO: 'R9', DESCRICAO: 'x' }],
    [{ NOME_PARAMETRO: 'x' }],
    [{ CDRAMO: 'R9', CRIADO_POR: 'x' }],
  ])('PUT with a column other than CDRAMO (%o) → 400, nothing changed', async (values) => {
    const app = appWith();
    expect((await put(app, URL, await first(app), values)).statusCode).toBe(400);
    expect((await ramos(app)).every((a) => a.CDRAMO === 'R1')).toBe(true);
  });

  it('PUT with a stale orig.CDRAMO → 409 REGISTO_ALTERADO, nothing changed', async () => {
    const app = appWith();
    const row = await first(app);
    const r = await put(app, URL, row, { CDRAMO: 'R9' }, { ...origOf(row), CDRAMO: 'OLD' });
    expect(r.statusCode).toBe(409);
    expect(r.json().code).toBe('REGISTO_ALTERADO');
    expect((await ramos(app)).every((a) => a.CDRAMO === 'R1')).toBe(true);
  });

  it('POST → 403 SEM_PERMISSAO', async () => {
    const app = appWith();
    const r = await post(app, URL, { values: { CDRAMO: 'R1' } });
    expect(r.statusCode).toBe(403);
    expect(r.json()).toMatchObject({ code: 'SEM_PERMISSAO', message: SEM_PERMISSAO });
    expect((await list(app, URL)).total).toBe(3);
  });

  it('DELETE → 403 SEM_PERMISSAO', async () => {
    const app = appWith();
    const r = await del(app, URL, await first(app));
    expect(r.statusCode).toBe(403);
    expect(r.json()).toMatchObject({ code: 'SEM_PERMISSAO', message: SEM_PERMISSAO });
    expect((await list(app, URL)).total).toBe(3);
  });
});

describe('select feeds', () => {
  it('MODELOS_GENERICOS: models of type GNR by DESCRICAO', async () => {
    const r = await appWith().inject({ url: '/api/dominios/MODELOS_GENERICOS/valores' });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({
      rows: [
        { CHAVE: 'GEN2', DESIGNACAO: 'Genérico A' },
        { CHAVE: 'GEN1', DESIGNACAO: 'Genérico B' },
      ],
    });
  });

  it('FORMA_CONTROLO: the list item C, V, U, UV, each its own label', async () => {
    const r = await appWith().inject({ url: '/api/dominios/FORMA_CONTROLO/valores' });
    expect(r.statusCode).toBe(200);
    expect(r.json().rows).toEqual(['C', 'V', 'U', 'UV'].map((v) => ({ CHAVE: v, DESIGNACAO: v })));
  });

  it('TIPOS_CONTEUDO without a section: every type by ID, preSelected null', async () => {
    const r = await appWith().inject({ url: '/api/dominios/TIPOS_CONTEUDO/valores' });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({
      rows: [
        { CHAVE: 1, DESIGNACAO: 'Texto' },
        { CHAVE: 2, DESIGNACAO: 'Tabela' },
        { CHAVE: 3, DESIGNACAO: 'Imagem' },
      ],
      preSelected: null,
    });
  });

  it.each([
    ['M1', 'CAB', 3],
    ['M1', 'ROD', 1],
    ['M1', 'XXX', null],
    ['M2', 'CAB', null],
  ])('TIPOS_CONTEUDO for %s/%s preselects MAX(TIPOCNTD_ID) → %s (0 / none → null)', async (m, s, pre) => {
    const r = await appWith().inject({ url: `/api/dominios/TIPOS_CONTEUDO/valores?MODELO_ID=${m}&TIPOSEC_ID=${s}` });
    expect(r.statusCode).toBe(200);
    expect(r.json().preSelected).toBe(pre);
    expect(r.json().rows).toHaveLength(3);
  });

  it('CONTEXTOS_APR without a section: every context by ID, preSelected null', async () => {
    const r = await appWith().inject({ url: '/api/dominios/CONTEXTOS_APR/valores' });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({
      rows: [
        { CHAVE: 4, DESIGNACAO: null },
        { CHAVE: 5, DESIGNACAO: 'Contexto 5' },
        { CHAVE: 6, DESIGNACAO: 'Contexto 6' },
      ],
      preSelected: null,
    });
  });

  it.each([
    ['M1', 'CAB', 6],
    ['M1', 'ROD', null],
    ['M2', 'CAB', null],
  ])('CONTEXTOS_APR for %s/%s preselects MAX(CONTEXTO_ID) over all its alíneas → %s', async (m, s, pre) => {
    const r = await appWith().inject({ url: `/api/dominios/CONTEXTOS_APR/valores?MODELO_ID=${m}&TIPOSEC_ID=${s}` });
    expect(r.statusCode).toBe(200);
    expect(r.json().preSelected).toBe(pre);
  });
});

describe('seccoes imagem (Step 6.2, BR-MOD-06)', () => {
  const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
  const upload = (data: Buffer) => {
    const b = 'b0undary';
    const head = `--${b}\r\nContent-Disposition: form-data; name="ficheiro"; filename="a.png"\r\nContent-Type: image/png\r\n\r\n`;
    return {
      payload: Buffer.concat([Buffer.from(head), data, Buffer.from(`\r\n--${b}--\r\n`)]),
      headers: { 'content-type': `multipart/form-data; boundary=${b}` },
    };
  };
  const url = (m: string, s: string, a: string | number) => `/api/modelos/${m}/seccoes/${s}/${a}/imagem`;

  it('PUT, GET and DELETE the image of one section by MODELO_ID / TIPOSEC_ID / ALINEA', async () => {
    const app = appWith();
    expect((await app.inject({ url: url('M1', 'CAB', 1) })).statusCode).toBe(404);
    const up = await app.inject({ method: 'PUT', url: url('M1', 'CAB', 1), ...upload(PNG) });
    expect(up.statusCode).toBe(204);
    const r = await app.inject({ url: url('M1', 'CAB', 1) });
    expect(r.headers['content-type']).toBe('image/png');
    expect(r.rawPayload.equals(PNG)).toBe(true);
    expect((await app.inject({ url: url('M1', 'CAB', 2) })).statusCode).toBe(404); // other alínea, no image
    expect((await app.inject({ method: 'DELETE', url: url('M1', 'CAB', 1) })).statusCode).toBe(204);
    expect((await app.inject({ url: url('M1', 'CAB', 1) })).statusCode).toBe(404);
  });

  it('is 404 for a section that does not exist, 400 for a bad ALINEA, 403 for a USER', async () => {
    const app = appWith();
    expect((await app.inject({ method: 'PUT', url: url('M1', 'CAB', 9), ...upload(PNG) })).statusCode).toBe(404);
    expect((await app.inject({ method: 'DELETE', url: url('M9', 'CAB', 1) })).statusCode).toBe(404);
    for (const bad of ['x', '1e0', '0x1', '-1', '1.0'])
      expect((await app.inject({ url: url('M1', 'CAB', bad) })).statusCode, bad).toBe(400);
    expect((await app.inject({ url: url('M1', 'C'.repeat(11), 1) })).statusCode).toBe(400); // VARCHAR2(10)
    expect((await appWith('USER').inject({ url: url('M1', 'CAB', 1) })).statusCode).toBe(403);
  });

  it('refuses bytes that are not JPEG/PNG/GIF/BMP (415) and a file over the limit (413)', async () => {
    const app = appWith();
    expect((await app.inject({ method: 'PUT', url: url('M1', 'CAB', 1), ...upload(Buffer.from('%PDF-1.4')) })).statusCode).toBe(415);
    const big = Buffer.concat([PNG, Buffer.alloc(2048)]);
    expect((await app.inject({ method: 'PUT', url: url('M1', 'CAB', 1), ...upload(big) })).statusCode).toBe(413);
  });
});
