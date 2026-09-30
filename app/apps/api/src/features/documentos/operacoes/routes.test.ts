import Fastify from 'fastify';
import { DOCUMENTO_DETALHE, pt } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import { registerErrorHandler } from '../../../http/errors.ts';
import type { Row } from '../../../lib/crud.ts';
import { memoryDocumentosRepo, type DocumentosSeed } from '../repo.ts';
import { registerDocumentosRoutes } from '../routes.ts';
import { memoryOperacoesDb } from './memoria.ts';
import { registerOperacoesRoutes } from './routes.ts';

/**
 * FD_GESTAO_SIID batch operations (Step 7.2) over the in-memory OperacoesDb + DocumentosRepo:
 * selection (ids / consulta / todaFila), every action's happy path and every skip rule, the
 * regeneration reauth gate (BR-DOC-13/14, A-04), Clonar (BR-DOC-25), the queue-row cancel
 * (BR-DOC-23) and the ESPERA / SUSPENSO count. The SQL itself is pinned by oracle.test.ts.
 */

const M = pt.documentos;
const FILESERVER_OFF = { baseUrl: 'http://127.0.0.1:9/pdf/T', timeoutMs: 500 };

const doc = (ID: number, over: Record<string, unknown> = {}) => ({
  ...Object.fromEntries(DOCUMENTO_DETALHE.map((c) => [c, null])),
  ID,
  MODELO_ID: 'E.E1',
  ESTADO: 'IMPRESSO',
  DATA_PEDIDO: `2026-09-${String(ID).padStart(2, '0')}T10:00:00`,
  DATA_EXECUCAO: '2026-09-01T10:00:00',
  CRIADO_POR: 'ANA',
  DESTINATARIO: 'CLIENTE',
  DISPONIBILIDADE: 'ONLINE',
  FATURACAO_ELECTRONICA: null,
  N_IMPRESSOES: 0,
  ...over,
});

const fila = (ID: number, DOCUMENTO_ID: number, TIPO_QUEUE_RF: string, ESTADO: string, over: Record<string, unknown> = {}) => ({
  ID,
  DOCUMENTO_ID,
  TIPO_QUEUE_RF,
  ESTADO,
  DATA_PEDIDO: '2026-09-01T10:00:00',
  CRIADO_POR: 'ANA',
  DATA_EXECUCAO: null,
  DATA_FINALIZACAO: null,
  IMPRESSORA_ID: null,
  IMPRESSORA: null,
  RESULTADO: null,
  ATRIBUTO01: null,
  ...over,
});

/** A fresh seed per app: the operations mutate it. */
const seed = (): DocumentosSeed => ({
  documentos: [
    doc(1, { N_IMPRESSOES: 2 }), // printed (fila 101 IMPRESSAO/TERMINADO); no ARQ_ID; model I
    doc(2, { DESTINATARIO: null, N_REFERENCIA: null }), // never printed; the only "em branco"
    doc(3, { ATRIBUTO9: 'A', N_IMPRESSOES: 1 }), // annulled by ATRIBUTO9, and printed (fila 103)
    doc(4, { DISPONIBILIDADE: 'ANU', N_IMPRESSOES: 1 }), // annulled by DISPONIVEL_RF
    doc(5, { MODELO_ID: 'G.G1' }), // model MODO_EXPEDICAO_RF G, never printed
    doc(6, { MODELO_ID: 'W.W1' }), // model W, CAN_BE_UPLOADED_EDOC = 1
    doc(7, { MODELO_ID: 'W.W1' }), // model W, CAN_BE_UPLOADED_EDOC = 0
    doc(8), // EMAIL rows with valid addresses (108, 109)
    doc(9), // EMAIL row with an invalid address (110)
    doc(10, { ARQ_ID: 55 }),
    doc(11, { ARQ_ID: null }),
    doc(12), // ESPERA rows 112 (EXECUCAO), 113 (IMPRESSAO); SUSPENSO rows 114 (EXECUCAO), 115 (EMAIL)
    doc(13), // EXECUCAO rows 116 (state EXECUCAO), 118 (ERRO); IMPRESSAO 117 (ESPERA)
    doc(14, { MODELO_ID: 'R3.D25', LOTE_ID: 7, LOTE_ORDEM: 1 }), // clone source
    doc(15), // queue rows 119 (EXECUCAO/ESPERA), 120 (IMPRESSAO/TERMINADO), 121 (EXECUCAO/EXECUCAO), 122 (EMAIL/SUSPENSO)
    doc(16, { MODELO_ID: null }), // no model: cannot be cloned
  ],
  parametros: [
    { DOCUMENTO_ID: 14, NOME: '_USER', VALOR: 'ANA', N_PARAMETRO: 1, MODELO_ID: 'R3.D25' },
    { DOCUMENTO_ID: 14, NOME: 'P_NMRECIBO', VALOR: '125', N_PARAMETRO: 2, MODELO_ID: 'R3.D25' },
    { DOCUMENTO_ID: 14, NOME: 'P_ANO', VALOR: '2026', N_PARAMETRO: 3, MODELO_ID: 'R3.D25' },
    { DOCUMENTO_ID: 14, NOME: 'P_ID', VALOR: '14', N_PARAMETRO: 4, MODELO_ID: 'R3.D25' },
  ],
  fila: [
    fila(101, 1, 'IMPRESSAO', 'TERMINADO', { IMPRESSORA_ID: '7', IMPRESSORA: 'HP - piso 1' }),
    fila(103, 3, 'IMPRESSAO', 'TERMINADO'),
    fila(108, 8, 'EMAIL', 'TERMINADO', { ATRIBUTO01: 'ana@exemplo.pt' }),
    fila(109, 8, 'EMAIL', 'TERMINADO', { ATRIBUTO01: 'beto@exemplo.pt' }),
    fila(110, 9, 'EMAIL', 'TERMINADO', { ATRIBUTO01: 'sem-arroba' }),
    fila(112, 12, 'EXECUCAO', 'ESPERA'),
    fila(113, 12, 'IMPRESSAO', 'ESPERA'),
    fila(114, 12, 'EXECUCAO', 'SUSPENSO'),
    fila(115, 12, 'EMAIL', 'SUSPENSO'),
    fila(116, 13, 'EXECUCAO', 'EXECUCAO'),
    fila(117, 13, 'IMPRESSAO', 'ESPERA'),
    fila(118, 13, 'EXECUCAO', 'ERRO'),
    fila(119, 15, 'EXECUCAO', 'ESPERA'),
    fila(120, 15, 'IMPRESSAO', 'TERMINADO'),
    fila(121, 15, 'EXECUCAO', 'EXECUCAO'),
    fila(122, 15, 'EMAIL', 'SUSPENSO'),
  ],
  erros: [],
  modelos: [
    { ID: 'E.E1', MODO_EXPEDICAO_RF: 'I' },
    { ID: 'G.G1', MODO_EXPEDICAO_RF: 'G' },
    { ID: 'W.W1', MODO_EXPEDICAO_RF: 'W' },
    { ID: 'R3.D25', MODO_EXPEDICAO_RF: null },
  ],
  impressorasValidas: ['7'],
  edocOk: [6],
});

type Opts = { role?: 'ADM' | 'USER'; reauth?: boolean; semSessao?: boolean };

function appWith(opts: Opts = {}) {
  const s = seed();
  const app = Fastify();
  registerErrorHandler(app);
  app.decorateRequest('session', null as never);
  const reauthUntil = opts.reauth ? Date.now() + 60_000 : undefined;
  app.addHook('onRequest', async (req) => {
    (req as { session: unknown }).session = opts.semSessao
      ? {}
      : {
          user: { username: 'JOAO', nome: 'João', role: opts.role ?? 'ADM', ambiente: 'T' },
          get: (k: string) => (k === 'regeneracaoAte' ? reauthUntil : undefined),
        };
  });
  const repo = memoryDocumentosRepo(s);
  registerDocumentosRoutes(app, { repo, fileServer: FILESERVER_OFF });
  registerOperacoesRoutes(app, { db: memoryOperacoesDb(s), repo });
  const post = async (url: string, body?: unknown) => {
    const r = await app.inject({ method: 'POST', url, ...(body === undefined ? {} : { payload: body }) });
    return { status: r.statusCode, body: (r.body ? r.json() : {}) as Record<string, unknown> };
  };
  const acao = (nome: string, body: unknown) => post(`/api/documentos/acoes/${nome}`, body);
  const row = (id: number) => s.fila!.find((q) => q['ID'] === id)!;
  const rowsOf = (docId: number) => s.fila!.filter((q) => q['DOCUMENTO_ID'] === docId);
  return { app, s, post, acao, row, rowsOf };
}

const ok = (body: Record<string, unknown>) => body['ok'] as number[];
const skipped = (body: Record<string, unknown>) => body['skipped'] as { id: number; motivo: string }[];
const ultimaFila = (s: DocumentosSeed, docId: number) => s.fila!.filter((q) => q['DOCUMENTO_ID'] === docId).at(-1) as Row;
const errosDe = (s: DocumentosSeed, docId: number) => s.erros!.filter((e) => e['DOCUMENTO_ID'] === docId).map((e) => e['DESCRICAO']);

describe('POST /api/documentos/acoes/regerar (BR-DOC-13/14, A-04, A-06)', () => {
  it('a never-printed, non-G document needs no reauth: EXECUCAO/ESPERA row + audit line with the trailing space', async () => {
    const t = appWith();
    const r = await t.acao('regerar', { ids: [2] });
    expect(r).toMatchObject({ status: 200, body: { ok: [2], skipped: [] } });
    expect(ultimaFila(t.s, 2)).toMatchObject({
      DOCUMENTO_ID: 2,
      TIPO_QUEUE_RF: 'EXECUCAO',
      ESTADO: 'ESPERA',
      CRIADO_POR: 'JOAO',
      IMPRESSORA_ID: null,
      ATRIBUTO01: null,
    });
    expect(typeof ultimaFila(t.s, 2)['ID']).toBe('number');
    expect(errosDe(t.s, 2)).toEqual(['DOCUMENTO REGERADO POR JOAO ']);
  });

  it('a printed document in the selection and no reauth → 428 PASSWORD_REGERACAO_NECESSARIA, nothing written', async () => {
    const t = appWith();
    const antes = t.s.fila!.length;
    const r = await t.acao('regerar', { ids: [2, 1] });
    expect(r.status).toBe(428);
    expect(r.body).toMatchObject({ code: 'PASSWORD_REGERACAO_NECESSARIA', message: M.inserirPassword });
    expect(t.s.fila).toHaveLength(antes);
    expect(t.s.erros).toEqual([]);
  });

  it('a model G document needs the reauth even when never printed', async () => {
    expect((await appWith().acao('regerar', { ids: [5] })).status).toBe(428);
  });

  it('an annulled printed document still triggers the 428 (decided over the whole selection)', async () => {
    expect((await appWith().acao('regerar', { ids: [3] })).status).toBe(428);
    expect((await appWith().acao('regerar', { ids: [2, 3] })).status).toBe(428);
  });

  it('with the reauth flag: printed and G documents are regenerated; annulled ones skipped and listed', async () => {
    const t = appWith({ reauth: true });
    const r = await t.acao('regerar', { ids: [1, 5, 3, 4, 2] });
    expect(r.status).toBe(200);
    expect(ok(r.body)).toEqual([1, 5, 2]);
    expect(skipped(r.body)).toEqual([
      { id: 3, motivo: M.regeradosAnulados },
      { id: 4, motivo: M.regeradosAnulados },
    ]);
    for (const id of [1, 5, 2]) expect(ultimaFila(t.s, id)).toMatchObject({ TIPO_QUEUE_RF: 'EXECUCAO', ESTADO: 'ESPERA' });
    expect(t.s.fila!.filter((q) => q['DOCUMENTO_ID'] === 3)).toHaveLength(1);
    expect(t.s.erros!.map((e) => e['DOCUMENTO_ID'])).toEqual([1, 5, 2]);
  });

  it('an id that does not exist is skipped with the catalogue text', async () => {
    const r = await appWith().acao('regerar', { ids: [2, 999] });
    expect(r.status).toBe(200);
    expect(skipped(r.body)).toEqual([{ id: 999, motivo: 'Documento não encontrado.' }]);
    expect(ok(r.body)).toEqual([2]);
  });

  it('a body field the action does not take (force, impressoraId, todaFila) → 400 VALIDACAO', async () => {
    for (const extra of [{ force: true }, { impressoraId: '7' }, { todaFila: true }]) {
      const r = await appWith({ reauth: true }).acao('regerar', { ids: [2], ...extra });
      expect(r.status, JSON.stringify(extra)).toBe(400);
      expect(r.body['code']).toBe('VALIDACAO');
    }
  });
});

describe('POST /api/documentos/acoes/reimprimir | segunda-via | copia (BR-DOC-10/11/12, D-28)', () => {
  it.each([
    ['reimprimir', 'IMPRESSAO'],
    ['segunda-via', '2.VIA'],
    ['copia', 'COPIA'],
  ])('%s of a printed document: %s/ESPERA row with IMPRESSORA_ID null, no audit line, no reauth needed', async (acao, tipo) => {
    const t = appWith();
    const r = await t.acao(acao, { ids: [1] });
    expect(r).toMatchObject({ status: 200, body: { ok: [1], skipped: [] } });
    expect(ultimaFila(t.s, 1)).toMatchObject({ TIPO_QUEUE_RF: tipo, ESTADO: 'ESPERA', CRIADO_POR: 'JOAO', IMPRESSORA_ID: null, ATRIBUTO01: null });
    expect(t.s.erros).toEqual([]);
  });

  it('a model G document is printed without reauth (only Regerar asks for the password, A-04)', async () => {
    const t = appWith();
    expect((await t.acao('reimprimir', { ids: [5] })).status).toBe(200);
    expect((await t.acao('segunda-via', { ids: [1] })).status).toBe(200);
    expect((await t.acao('copia', { ids: [5] })).status).toBe(200);
  });

  it.each(['reimprimir', 'segunda-via', 'copia'])('%s skips annulled documents (ATRIBUTO9 A or DISPONIBILIDADE ANU) with #9', async (acao) => {
    const t = appWith();
    const r = await t.acao(acao, { ids: [3, 4, 1] });
    expect(r.status).toBe(200);
    expect(ok(r.body)).toEqual([1]);
    expect(skipped(r.body)).toEqual([
      { id: 3, motivo: M.impressosAnulados },
      { id: 4, motivo: M.impressosAnulados },
    ]);
    expect(t.rowsOf(3)).toHaveLength(1);
    expect(t.rowsOf(4)).toHaveLength(0);
  });

  it('segunda-via of a never-printed document (N_IMPRESSOES 0) is skipped with #10', async () => {
    const t = appWith();
    const r = await t.acao('segunda-via', { ids: [2, 1] });
    expect(skipped(r.body)).toEqual([{ id: 2, motivo: M.segundaViaSemImpressao }]);
    expect(ok(r.body)).toEqual([1]);
    expect(t.rowsOf(2)).toHaveLength(0);
  });

  it('reimprimir and copia of a never-printed document are fine', async () => {
    const t = appWith();
    expect((await t.acao('reimprimir', { ids: [2] })).body).toEqual({ ok: [2], skipped: [] });
    expect((await t.acao('copia', { ids: [2] })).body).toEqual({ ok: [2], skipped: [] });
    expect(t.rowsOf(2).map((q) => q['TIPO_QUEUE_RF'])).toEqual(['IMPRESSAO', 'COPIA']);
  });

  it('impressoraId: a valid printer lands on the row; absent → null; invalid → 400 VALIDACAO fields.impressoraId and nothing written', async () => {
    const t = appWith();
    const r = await t.acao('reimprimir', { ids: [1], impressoraId: '7' });
    expect(r.status).toBe(200);
    expect(ultimaFila(t.s, 1)).toMatchObject({ TIPO_QUEUE_RF: 'IMPRESSAO', IMPRESSORA_ID: '7' });
    const antes = t.s.fila!.length;
    const bad = await t.acao('copia', { ids: [1], impressoraId: '99' });
    expect(bad.status).toBe(400);
    expect(bad.body).toMatchObject({ code: 'VALIDACAO', fields: { impressoraId: M.impressoraInvalida } });
    expect(t.s.fila).toHaveLength(antes);
    expect((await t.acao('segunda-via', { ids: [1], impressoraId: '' })).status).toBe(400);
  });

  it('an unknown id is skipped', async () => {
    const r = await appWith().acao('copia', { ids: [999] });
    expect(r).toMatchObject({ status: 200, body: { ok: [], skipped: [{ id: 999, motivo: M.documentoNaoEncontrado }] } });
  });
});

describe('POST /api/documentos/acoes/anular (BR-DOC-15, D-17)', () => {
  it('DISPONIBILIDADE becomes ANU and an ANULADO/TERMINADO queue row appears; no audit line', async () => {
    const t = appWith();
    const r = await t.acao('anular', { ids: [1, 2] });
    expect(r).toMatchObject({ status: 200, body: { ok: [1, 2], skipped: [] } });
    for (const id of [1, 2]) {
      expect(t.s.documentos.find((d) => d['ID'] === id)?.['DISPONIBILIDADE']).toBe('ANU');
      expect(ultimaFila(t.s, id)).toMatchObject({ TIPO_QUEUE_RF: 'ANULADO', ESTADO: 'TERMINADO', CRIADO_POR: 'JOAO' });
    }
    expect(t.s.erros).toEqual([]);
    // the read side sees it (detail and queue tab read the seed live)
    expect((await t.app.inject({ url: '/api/documentos/1' })).json()).toMatchObject({ ID: 1, DISPONIBILIDADE: 'ANU' });
    const filaTab = (await t.app.inject({ url: '/api/documentos/1/fila' })).json().rows as Row[];
    expect(filaTab.at(-1)).toMatchObject({ TIPO_QUEUE_RF: 'ANULADO', ESTADO: 'TERMINADO' });
  });

  it('an unknown id is skipped; no pre-condition on already annulled documents', async () => {
    const r = await appWith().acao('anular', { ids: [999, 4] });
    expect(ok(r.body)).toEqual([4]);
    expect(skipped(r.body)).toEqual([{ id: 999, motivo: M.documentoNaoEncontrado }]);
  });

  it('impressoraId or force on anular → 400', async () => {
    expect((await appWith().acao('anular', { ids: [1], impressoraId: '7' })).status).toBe(400);
    expect((await appWith().acao('anular', { ids: [1], force: true })).status).toBe(400);
  });
});

describe('POST /api/documentos/acoes/cancelar (BR-DOC-16, D-12)', () => {
  it('force false (default): only EXECUCAO rows in the five states; a row in state EXECUCAO and an IMPRESSAO row stay', async () => {
    const t = appWith();
    const r = await t.acao('cancelar', { ids: [13] });
    expect(r).toMatchObject({ status: 200, body: { ok: [13], skipped: [], pedidos: 1 } });
    expect(t.row(118)['ESTADO']).toBe('CANCELLED');
    expect(t.row(116)['ESTADO']).toBe('EXECUCAO');
    expect(t.row(117)['ESTADO']).toBe('ESPERA');
  });

  it('force true: every EXECUCAO row of the document, still never the other types', async () => {
    const t = appWith();
    const r = await t.acao('cancelar', { ids: [13], force: true });
    expect(r.body).toMatchObject({ ok: [13], pedidos: 2 });
    expect(t.row(116)['ESTADO']).toBe('CANCELLED');
    expect(t.row(118)['ESTADO']).toBe('CANCELLED');
    expect(t.row(117)['ESTADO']).toBe('ESPERA');
  });

  it('only the selected documents are touched; a document without rows counts 0', async () => {
    const t = appWith();
    const r = await t.acao('cancelar', { ids: [12, 1], force: false });
    expect(r.body).toMatchObject({ ok: [12, 1], skipped: [], pedidos: 1 });
    expect(t.row(112)['ESTADO']).toBe('CANCELLED');
    expect(t.row(113)['ESTADO']).toBe('ESPERA');
    expect(t.row(118)['ESTADO']).toBe('ERRO');
  });

  it('force must be a boolean', async () => {
    expect((await appWith().acao('cancelar', { ids: [13], force: 'sim' })).status).toBe(400);
  });
});

describe('POST /api/documentos/acoes/suspender | retomar (BR-DOC-21/22, D-28)', () => {
  it('suspender ids: every ESPERA row of those documents, of any type; other documents untouched', async () => {
    const t = appWith();
    const r = await t.acao('suspender', { ids: [12] });
    expect(r).toMatchObject({ status: 200, body: { ok: [12], skipped: [], pedidos: 2 } });
    expect(t.row(112)['ESTADO']).toBe('SUSPENSO');
    expect(t.row(113)['ESTADO']).toBe('SUSPENSO');
    expect(t.row(117)['ESTADO']).toBe('ESPERA');
    expect(t.row(119)['ESTADO']).toBe('ESPERA');
  });

  it('suspender todaFila: every ESPERA row of any document and type; ok is empty', async () => {
    const t = appWith();
    const r = await t.acao('suspender', { todaFila: true });
    expect(r).toMatchObject({ status: 200, body: { ok: [], skipped: [], pedidos: 4 } });
    for (const id of [112, 113, 117, 119]) expect(t.row(id)['ESTADO'], String(id)).toBe('SUSPENSO');
    expect(t.row(116)['ESTADO']).toBe('EXECUCAO');
    expect(t.row(120)['ESTADO']).toBe('TERMINADO');
  });

  it('retomar ids: SUSPENSO rows of those documents back to ESPERA', async () => {
    const t = appWith();
    const r = await t.acao('retomar', { ids: [12] });
    expect(r.body).toMatchObject({ ok: [12], pedidos: 2 });
    expect(t.row(114)['ESTADO']).toBe('ESPERA');
    expect(t.row(115)['ESTADO']).toBe('ESPERA');
    expect(t.row(122)['ESTADO']).toBe('SUSPENSO');
  });

  it('retomar todaFila: every SUSPENSO row', async () => {
    const t = appWith();
    const r = await t.acao('retomar', { todaFila: true });
    expect(r.body).toMatchObject({ ok: [], pedidos: 3 });
    for (const id of [114, 115, 122]) expect(t.row(id)['ESTADO'], String(id)).toBe('ESPERA');
  });

  it('todaFila false without a selection is no selection → 400', async () => {
    expect((await appWith().acao('suspender', { todaFila: false })).status).toBe(400);
  });

  it('todaFila true together with ids or consulta → 400, nothing changed', async () => {
    const t = appWith();
    expect((await t.acao('suspender', { todaFila: true, ids: [12] })).status).toBe(400);
    expect((await t.acao('retomar', { todaFila: true, consulta: { preset: 'todos' } })).status).toBe(400);
    expect(t.row(112)['ESTADO']).toBe('ESPERA');
    expect(t.row(114)['ESTADO']).toBe('SUSPENSO');
  });
});

describe('POST /api/documentos/acoes/reenviar-edoc (BR-DOC-17, D-18, D-28)', () => {
  it('only model W documents that CAN_BE_UPLOADED_EDOC; REENVIAR row + REENVIADO audit line', async () => {
    const t = appWith();
    const r = await t.acao('reenviar-edoc', { ids: [6, 7, 1, 999] });
    expect(r.status).toBe(200);
    expect(ok(r.body)).toEqual([6]);
    expect(skipped(r.body)).toEqual([
      { id: 7, motivo: M.reenviadosNaoEdoc },
      { id: 1, motivo: M.reenviadosNaoEdoc },
      { id: 999, motivo: M.documentoNaoEncontrado },
    ]);
    expect(ultimaFila(t.s, 6)).toMatchObject({ TIPO_QUEUE_RF: 'REENVIAR', ESTADO: 'ESPERA', CRIADO_POR: 'JOAO', ATRIBUTO01: null });
    expect(errosDe(t.s, 6)).toEqual(['DOCUMENTO REENVIADO POR JOAO']);
    expect(t.rowsOf(7)).toHaveLength(0);
    expect(t.s.erros).toHaveLength(1);
  });
});

describe('POST /api/documentos/acoes/reenviar-email (BR-DOC-18, D-05)', () => {
  it('re-sends to the last (MAX) address of the EMAIL rows; invalid or missing address → skipped with #20', async () => {
    const t = appWith();
    const r = await t.acao('reenviar-email', { ids: [8, 9, 1] });
    expect(r.status).toBe(200);
    expect(ok(r.body)).toEqual([8]);
    expect(skipped(r.body)).toEqual([
      { id: 9, motivo: M.reenviadosNaoEmail },
      { id: 1, motivo: M.reenviadosNaoEmail },
    ]);
    expect(ultimaFila(t.s, 8)).toMatchObject({ TIPO_QUEUE_RF: 'EMAIL', ESTADO: 'ESPERA', CRIADO_POR: 'JOAO', ATRIBUTO01: 'beto@exemplo.pt', IMPRESSORA_ID: null });
    expect(errosDe(t.s, 8)).toEqual(['DOCUMENTO REENVIADO POR EMAIL POR JOAOPARA beto@exemplo.pt']);
    expect(t.rowsOf(9)).toHaveLength(1);
  });
});

describe('POST /api/documentos/acoes/rearquivar (BR-DOC-19)', () => {
  it('only documents with an ARQ_ID; ARQUIVO row + ARQUIVADO audit line', async () => {
    const t = appWith();
    const r = await t.acao('rearquivar', { ids: [10, 11, 1] });
    expect(r.status).toBe(200);
    expect(ok(r.body)).toEqual([10]);
    expect(skipped(r.body)).toEqual([
      { id: 11, motivo: M.rearquivadosNaoArquivo },
      { id: 1, motivo: M.rearquivadosNaoArquivo },
    ]);
    expect(ultimaFila(t.s, 10)).toMatchObject({ TIPO_QUEUE_RF: 'ARQUIVO', ESTADO: 'ESPERA', CRIADO_POR: 'JOAO' });
    expect(errosDe(t.s, 10)).toEqual(['DOCUMENTO ARQUIVADO POR JOAO']);
  });
});

describe('selection: ids / consulta / errors (BR-DOC-09, D-26)', () => {
  it('consulta with a preset resolves through the list query (em-branco → document 2)', async () => {
    const t = appWith();
    const r = await t.acao('reimprimir', { consulta: { preset: 'em-branco' } });
    expect(r).toMatchObject({ status: 200, body: { ok: [2], skipped: [] } });
  });

  it('consulta with a column filter (f[MODELO_ID]) selects the whole result, page and size ignored', async () => {
    const t = appWith();
    const r = await t.acao('anular', { consulta: { 'f[MODELO_ID]': 'W.W1', size: '1' } });
    expect(r.status).toBe(200);
    expect([...ok(r.body)].sort()).toEqual([6, 7]);
  });

  it('consulta matching nothing → 422 SEM_SELECCAO with the NAO_TEM_REGISTOS text', async () => {
    const r = await appWith().acao('reimprimir', { consulta: { 'f[MODELO_ID]': 'NADA' } });
    expect(r.status).toBe(422);
    expect(r.body).toMatchObject({ code: 'SEM_SELECCAO', message: 'Não existem documentos seleccionados.' });
  });

  it('consulta with an unknown filter column → 400 VALIDACAO', async () => {
    const r = await appWith().acao('reimprimir', { consulta: { 'f[NOPE]': '1' } });
    expect(r.status).toBe(400);
    expect(r.body['code']).toBe('VALIDACAO');
  });

  it('both ids and consulta, or neither → 400', async () => {
    const t = appWith();
    expect((await t.acao('reimprimir', { ids: [1], consulta: { preset: 'todos' } })).status).toBe(400);
    expect((await t.acao('reimprimir', {})).status).toBe(400);
    expect((await t.acao('reimprimir', undefined)).status).toBe(400);
  });

  it('ids: empty, more than 1000, duplicates, zero, negative or non-integer → 400', async () => {
    const t = appWith();
    for (const ids of [[], Array.from({ length: 1001 }, (_, i) => i + 1), [1, 1], [0], [-1], [1.5], ['1']]) {
      const r = await t.acao('reimprimir', { ids });
      expect(r.status, JSON.stringify(ids).slice(0, 30)).toBe(400);
      expect(r.body['code']).toBe('VALIDACAO');
    }
  });

  it('exactly 1000 distinct ids is accepted', async () => {
    const r = await appWith().acao('reimprimir', { ids: Array.from({ length: 1000 }, (_, i) => i + 1) });
    expect(r.status).toBe(200);
    expect(ok(r.body)).toContain(1);
  });

  it('a consulta of more than 10 000 documents → 422 SELECCAO_EXCESSIVA, nothing written', async () => {
    const grande: DocumentosSeed = { documentos: Array.from({ length: 10_001 }, (_, i) => doc(i + 1)), fila: [], erros: [] };
    const app = Fastify();
    registerErrorHandler(app);
    app.decorateRequest('session', null as never);
    app.addHook('onRequest', async (req) => {
      (req as { session: unknown }).session = { user: { username: 'JOAO', nome: 'João', role: 'ADM', ambiente: 'T' }, get: () => undefined };
    });
    const repo = memoryDocumentosRepo(grande);
    registerOperacoesRoutes(app, { db: memoryOperacoesDb(grande), repo });
    const r = await app.inject({ method: 'POST', url: '/api/documentos/acoes/reimprimir', payload: { consulta: { preset: 'todos' } } });
    expect(r.statusCode).toBe(422);
    expect(r.json()).toMatchObject({ code: 'SELECCAO_EXCESSIVA', message: M.seleccaoExcessiva });
    expect(grande.fila).toEqual([]);
    const ok = await app.inject({ method: 'POST', url: '/api/documentos/acoes/reimprimir', payload: { consulta: { 'f[ID][from]': '2026-01-01' } } }).catch(() => undefined);
    expect(ok?.statusCode).toBe(400); // ID is not a date column: the consulta is validated like the list
  });

  it('the list reflects anular and clonar (the dev server reads the seed live)', async () => {
    const t = appWith();
    await t.acao('anular', { ids: [1] });
    const lista = (await t.app.inject({ url: '/api/documentos?f[ID]=1' })).json().rows as Row[];
    expect(lista[0]).toMatchObject({ ID: 1, DISPONIBILIDADE: 'ANU', COR: 'ANULADO' });
    await t.post('/api/documentos/14/clonar', { parametros: [] });
    expect((await t.app.inject({ url: '/api/documentos?f[ID]=17' })).json().total).toBe(1);
  });

  it('an unknown acao → 404 NAO_ENCONTRADO', async () => {
    const r = await appWith().acao('recriar', { ids: [1] });
    expect(r.status).toBe(404);
    expect(r.body['code']).toBe('NAO_ENCONTRADO');
  });

  it('USER → 403 SEM_PERMISSAO on every action and on the count; no session → 401', async () => {
    const user = appWith({ role: 'USER' });
    for (const a of ['regerar', 'reimprimir', 'segunda-via', 'copia', 'anular', 'cancelar', 'suspender', 'retomar', 'reenviar-edoc', 'reenviar-email', 'rearquivar']) {
      const r = await user.acao(a, { ids: [1] });
      expect(r.status, a).toBe(403);
      expect(r.body['code']).toBe('SEM_PERMISSAO');
    }
    expect((await user.app.inject({ url: '/api/documentos/fila/contagem?estado=ESPERA' })).statusCode).toBe(403);
    const anon = appWith({ semSessao: true });
    expect((await anon.acao('reimprimir', { ids: [1] })).status).toBe(401);
    expect((await anon.app.inject({ url: '/api/documentos/fila/contagem?estado=ESPERA' })).statusCode).toBe(401);
    expect((await anon.post('/api/documentos/14/clonar', { parametros: [] })).status).toBe(401);
    expect((await anon.post('/api/documentos/15/fila/119/cancelar')).status).toBe(401);
    expect(user.s.fila!.every((q) => q['CRIADO_POR'] === 'ANA')).toBe(true);
  });
});

describe('POST /api/documentos/:id/clonar (BR-DOC-25, D-17, D-20)', () => {
  const PARAMS = [
    { nome: 'P_NMRECIBO', valor: '126' },
    { nome: 'P_ANO', valor: '' },
  ];

  it('USER → 403 SEM_PERMISSAO, nothing cloned (owner decision 2026-09-30: ADM only)', async () => {
    const t = appWith({ role: 'USER' });
    const r = await t.post('/api/documentos/14/clonar', { parametros: PARAMS });
    expect(r.status).toBe(403);
    expect(r.body['code']).toBe('SEM_PERMISSAO');
    expect(t.s.documentos).toHaveLength(16);
  });

  it.each(['ADM'] as const)('%s: 201 { id }, new document with the same MODELO_ID / LOTE_ID, CRIADO_POR JOAO, EXECUCAO/ESPERA row, non-empty parametros stored', async (role) => {
    const t = appWith({ role });
    const r = await t.post('/api/documentos/14/clonar', { parametros: PARAMS });
    expect(r.status).toBe(201);
    expect(r.body).toEqual({ id: 17 });
    const novo = t.s.documentos.find((d) => d['ID'] === 17);
    expect(novo).toMatchObject({ MODELO_ID: 'R3.D25', LOTE_ID: 7, CRIADO_POR: 'JOAO', ESTADO: null });
    expect(t.rowsOf(17)).toEqual([expect.objectContaining({ TIPO_QUEUE_RF: 'EXECUCAO', ESTADO: 'ESPERA', CRIADO_POR: 'JOAO' })]);
    const params = t.s.parametros!.filter((p) => p['DOCUMENTO_ID'] === 17);
    expect(params.map((p) => [p['NOME'], p['VALOR']])).toEqual([['P_NMRECIBO', '126']]);
    // the read side sees the clone (detail and parametros tab read the seed live)
    const detalhe = await t.app.inject({ url: '/api/documentos/17' });
    expect(detalhe.statusCode).toBe(200);
    expect(detalhe.json()).toMatchObject({ ID: 17, MODELO_ID: 'R3.D25', LOTE_ID: 7, CRIADO_POR: 'JOAO' });
    const tab = (await t.app.inject({ url: '/api/documentos/17/parametros' })).json().rows as Row[];
    expect(tab.map((p) => p['NOME'])).toEqual(['P_NMRECIBO']);
  });

  it('a source without LOTE_ID clones with LOTE_ID null', async () => {
    const t = appWith();
    const r = await t.post('/api/documentos/1/clonar', { parametros: [] });
    expect(r.status).toBe(201);
    expect(t.s.documentos.find((d) => d['ID'] === 17)).toMatchObject({ MODELO_ID: 'E.E1', LOTE_ID: null });
  });

  it.each(['P_ID', '_USER', 'P_USUARIO'])('a reserved parameter name (%s) → 400 VALIDACAO fields.parametros, nothing cloned', async (nome) => {
    const t = appWith();
    const r = await t.post('/api/documentos/14/clonar', { parametros: [{ nome, valor: 'x' }] });
    expect(r.status).toBe(400);
    expect(r.body).toMatchObject({ code: 'VALIDACAO', fields: { parametros: expect.any(String) } });
    expect(t.s.documentos).toHaveLength(16);
  });

  it('a nome that is not an identifier (quote, space, punctuation) → 400 fields.parametros, nothing cloned (SEC: the package concatenates names into SQL)', async () => {
    const t = appWith();
    for (const nome of ["P'ANO", 'P ANO', 'P-ANO', 'P,X', 'P_ANO;']) {
      const r = await t.post('/api/documentos/14/clonar', { parametros: [{ nome, valor: '1' }] });
      expect(r.status, nome).toBe(400);
      expect(r.body).toMatchObject({ code: 'VALIDACAO', fields: { parametros: expect.any(String) } });
    }
    expect(t.s.documentos).toHaveLength(16);
  });

  it('a lower-case nome is upper-cased before the package call (UPPER(P_NOMEPAR)); a reserved name in lower case is still refused', async () => {
    const t = appWith();
    expect((await t.post('/api/documentos/14/clonar', { parametros: [{ nome: 'p_id', valor: '1' }] })).status).toBe(400);
    const r = await t.post('/api/documentos/14/clonar', { parametros: [{ nome: 'p_ano', valor: '2027' }] });
    expect(r.status).toBe(201);
    expect(t.s.parametros!.filter((p) => p['DOCUMENTO_ID'] === 17).map((p) => p['NOME'])).toEqual(['P_ANO']);
  });

  it('shape: nome 1..30, valor 0..4000, parametros required', async () => {
    const t = appWith();
    expect((await t.post('/api/documentos/14/clonar', { parametros: [{ nome: 'X'.repeat(31), valor: '1' }] })).status).toBe(400);
    expect((await t.post('/api/documentos/14/clonar', { parametros: [{ nome: '', valor: '1' }] })).status).toBe(400);
    expect((await t.post('/api/documentos/14/clonar', { parametros: [{ nome: 'P_ANO', valor: 'x'.repeat(2001) }] })).status).toBe(400); // PARAMETROnn is VARCHAR2(2000)
    expect((await t.post('/api/documentos/14/clonar', {})).status).toBe(400);
    const muitos = Array.from({ length: 101 }, (_, i) => ({ nome: `P${i}`, valor: '1' }));
    expect((await t.post('/api/documentos/14/clonar', { parametros: muitos })).status).toBe(400);
    expect(t.s.documentos).toHaveLength(16);
    expect((await t.post('/api/documentos/14/clonar', { parametros: [{ nome: 'P_ANO', valor: 'x'.repeat(2000) }] })).status).toBe(201);
  });

  it('unknown id, or a document without a model → 404 NAO_ENCONTRADO; bad id → 400', async () => {
    const t = appWith();
    expect(await t.post('/api/documentos/999/clonar', { parametros: [] })).toMatchObject({ status: 404, body: { code: 'NAO_ENCONTRADO' } });
    expect(await t.post('/api/documentos/16/clonar', { parametros: [] })).toMatchObject({ status: 404, body: { code: 'NAO_ENCONTRADO' } });
    expect((await t.post('/api/documentos/abc/clonar', { parametros: [] })).status).toBe(400);
  });
});

describe('POST /api/documentos/:docId/fila/:queueId/cancelar (BR-DOC-23)', () => {
  it.each(['USER', 'ADM'] as const)('%s: an ESPERA row → 204 and CANCELLED', async (role) => {
    const t = appWith({ role });
    const r = await t.post('/api/documentos/15/fila/119/cancelar');
    expect(r.status).toBe(204);
    expect(t.row(119)['ESTADO']).toBe('CANCELLED');
  });

  it('a TERMINADO row can be cancelled too', async () => {
    const t = appWith({ role: 'USER' });
    expect((await t.post('/api/documentos/15/fila/120/cancelar')).status).toBe(204);
    expect(t.row(120)['ESTADO']).toBe('CANCELLED');
  });

  it('a row in EXECUCAO → 409 PEDIDO_NAO_CANCELAVEL, unchanged', async () => {
    const t = appWith({ role: 'USER' });
    const r = await t.post('/api/documentos/15/fila/121/cancelar');
    expect(r.status).toBe(409);
    expect(r.body).toMatchObject({ code: 'PEDIDO_NAO_CANCELAVEL', message: M.pedidoNaoCancelavel });
    expect(t.row(121)['ESTADO']).toBe('EXECUCAO');
  });

  it('a queue id of another document → 409 REGISTO_ALTERADO, unchanged', async () => {
    const t = appWith({ role: 'USER' });
    const r = await t.post('/api/documentos/1/fila/119/cancelar');
    expect(r.status).toBe(409);
    expect(r.body['code']).toBe('REGISTO_ALTERADO');
    expect(t.row(119)['ESTADO']).toBe('ESPERA');
  });

  it('non-numeric ids → 400', async () => {
    const t = appWith();
    expect((await t.post('/api/documentos/x/fila/119/cancelar')).status).toBe(400);
    expect((await t.post('/api/documentos/15/fila/0/cancelar')).status).toBe(400);
  });
});

describe('GET /api/documentos/fila/contagem (D-28 confirmation count)', () => {
  it('ESPERA and SUSPENSO counts over every document and type', async () => {
    const t = appWith();
    const espera = await t.app.inject({ url: '/api/documentos/fila/contagem?estado=ESPERA' });
    expect(espera.statusCode).toBe(200);
    expect(espera.json()).toEqual({ n: 4 });
    const suspenso = await t.app.inject({ url: '/api/documentos/fila/contagem?estado=SUSPENSO' });
    expect(suspenso.json()).toEqual({ n: 3 });
  });

  it('another state or none → 400 VALIDACAO', async () => {
    const t = appWith();
    expect((await t.app.inject({ url: '/api/documentos/fila/contagem?estado=TERMINADO' })).statusCode).toBe(400);
    expect((await t.app.inject({ url: '/api/documentos/fila/contagem' })).statusCode).toBe(400);
  });

  it('the count follows the writes', async () => {
    const t = appWith();
    await t.acao('suspender', { todaFila: true });
    expect((await t.app.inject({ url: '/api/documentos/fila/contagem?estado=ESPERA' })).json()).toEqual({ n: 0 });
    expect((await t.app.inject({ url: '/api/documentos/fila/contagem?estado=SUSPENSO' })).json()).toEqual({ n: 7 });
  });
});
