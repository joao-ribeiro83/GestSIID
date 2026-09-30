import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import Fastify from 'fastify';
import { DOCUMENTO_DETALHE, DOCUMENTO_DETALHE_SO_ADM } from '@gestsiid/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerErrorHandler } from '../../http/errors.ts';
import { memoryDocumentosRepo, type DocumentosSeed } from './repo.ts';
import { registerDocumentosRoutes } from './routes.ts';

/**
 * FD_GESTAO_SIID read side (Step 7.1) on the in-memory repo: list contract (presets, sorts,
 * USER sort limit, PROCURAR, Mostrar grupo), detail by role, tabs, CONVERTE_PARAM, and the PDF
 * proxy against a local fake FileServerSIID. The SQL itself is proven by routes.contract.test.ts.
 */

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
  ...over,
});

const SEED: DocumentosSeed = {
  documentos: [
    doc(1, { DESTINATARIO: null, N_REFERENCIA: null }), // em branco
    doc(2, { ESTADO: null, DATA_EXECUCAO: null }), // não executado
    doc(3, { ESTADO: 'ERRO', DISPONIBILIDADE: 'OFF' }),
    doc(4, { ESTADO: 'A EXECUTAR', ATRIBUTO9: 'A', ATRIBUTO10: 'x', ATRIB_ARQ_1: 'y' }),
    doc(5, { ESTADO: 'EXECUCAO', DISPONIBILIDADE: 'ANU' }),
    doc(6, { MODELO_ID: 'D1.A7', LOTE_ID: 9, LOTE_ORDEM: 1 }),
    doc(7, { MODELO_ID: 'R3.D25', LOTE_ID: 9, LOTE_ORDEM: 2 }),
    doc(8, { MODELO_ID: 'D1.A7', LOTE_ID: 9, LOTE_ORDEM: 3 }),
    doc(9, { MODELO_ID: 'R3.D25', LOTE_ID: 9, LOTE_ORDEM: 4 }),
    doc(10, { MODELO_ID: 'R3.D25', LOTE_ID: 8, LOTE_ORDEM: 1 }),
    doc(11, { MODELO_ID: 'M.CARTA' }),
    doc(12, { MODELO_ID: 'M.ANEXO' }),
  ],
  parametros: [
    { DOCUMENTO_ID: 1, NOME: 'P_NMRECIBO', VALOR: '123', N_PARAMETRO: 2, MODELO_ID: 'E.E1' },
    { DOCUMENTO_ID: 1, NOME: 'P_ANO', VALOR: '2026', N_PARAMETRO: 3, MODELO_ID: 'E.E1' },
    { DOCUMENTO_ID: 1, NOME: '_USER', VALOR: 'ANA', N_PARAMETRO: 1, MODELO_ID: 'E.E1' },
    { DOCUMENTO_ID: 1, NOME: 'P_ID', VALOR: '1', N_PARAMETRO: 4, MODELO_ID: 'E.E1' },
    { DOCUMENTO_ID: 2, NOME: 'P_NMRECIBO', VALOR: '124', N_PARAMETRO: 2, MODELO_ID: 'E.E1' },
    { DOCUMENTO_ID: 2, NOME: 'P_ANO', VALOR: '2025', N_PARAMETRO: 3, MODELO_ID: 'E.E1' },
    { DOCUMENTO_ID: 7, NOME: 'P_NMRECIBO', VALOR: '125', N_PARAMETRO: 2, MODELO_ID: 'R3.D25' },
  ],
  comentarios: [
    { DOCUMENTO_ID: 3, COMENTARIO_ID: 2, DATA: '2026-09-03T11:00:00', USER_ID: 'ANA', COMENTARIO: 'b' },
    { DOCUMENTO_ID: 3, COMENTARIO_ID: 1, DATA: '2026-09-03T10:00:00', USER_ID: 'ANA', COMENTARIO: 'a' },
  ],
  anexos: [
    { DOCUMENTO_ID: 11, ANEXODOC_ID: 12, TIPO_ANEXO_RF: 1 },
  ],
  fila: [
    { DOCUMENTO_ID: 3, ID: 31, TIPO_QUEUE_RF: 'EXECUCAO', DATA_PEDIDO: '2026-09-03T10:00:00', CRIADO_POR: 'ANA', DATA_EXECUCAO: null, DATA_FINALIZACAO: null, ESTADO: 'ERRO', IMPRESSORA_ID: null, IMPRESSORA: null, RESULTADO: 'falhou' },
    { DOCUMENTO_ID: 3, ID: 30, TIPO_QUEUE_RF: 'IMPRESSAO', DATA_PEDIDO: '2026-09-02T10:00:00', CRIADO_POR: 'ANA', DATA_EXECUCAO: null, DATA_FINALIZACAO: null, ESTADO: 'TERMINADO', IMPRESSORA_ID: '7', IMPRESSORA: 'HP - piso 1', RESULTADO: null },
  ],
  erros: [{ DOCUMENTO_ID: 3, ID: 5, DATA_ERRO: '2026-09-03T10:00:00', DESCRICAO: 'DOCUMENTO REGERADO POR ANA' }],
  recibos: [
    { NMRECINUE: 900, NMRECIBO: 12345 },
    { NMRECINUE: 901, NMRECIBO: 1 },
    { NMRECINUE: 901, NMRECIBO: 2 },
  ],
  pessoas: [{ CDIDEPER: '501234567', CDPERSON: 77 }],
};

const FILESERVER_OFF = { baseUrl: 'http://127.0.0.1:9/pdf/T', timeoutMs: 500 };

function appWith(opts: { role?: 'ADM' | 'USER'; fileServer?: { baseUrl: string; timeoutMs: number }; semSessao?: boolean } = {}) {
  const app = Fastify();
  registerErrorHandler(app);
  app.decorateRequest('session', null as never);
  app.addHook('onRequest', async (req) => {
    (req as { session: unknown }).session = opts.semSessao ? {} : { user: { username: 'JOAO', role: opts.role ?? 'ADM' } };
  });
  registerDocumentosRoutes(app, { repo: memoryDocumentosRepo(SEED), fileServer: opts.fileServer ?? FILESERVER_OFF });
  return app;
}

const adm = appWith();
const user = appWith({ role: 'USER' });

async function get(url: string, app = adm) {
  const r = await app.inject({ url });
  return { status: r.statusCode, body: r.json() as Record<string, unknown> & { rows: Record<string, unknown>[] } };
}
const ids = async (url: string, app = adm) => (await get(url, app)).body.rows.map((r) => r['ID']);

describe('GET /api/documentos — list', () => {
  it('returns the envelope, default order ID DESC, the list columns only', async () => {
    const { status, body } = await get('/api/documentos');
    expect(status).toBe(200);
    expect(body).toMatchObject({ total: 12, totalCapped: false, page: 1, size: 50 });
    expect(body.rows.map((r) => r['ID'])).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(Object.keys(body.rows[0] ?? {}).sort()).toEqual(
      ['ID', 'DATA_PEDIDO', 'MODELO_ID', 'ESTADO', 'CRIADO_POR', 'N_REFERENCIA', 'DESTINATARIO', 'FATURACAO_ELECTRONICA',
        'LOTE_ID', 'LOTE_ORDEM', 'REPORT_ID', 'DISPONIBILIDADE', 'ATRIBUTO9', 'COR', 'COMENTARIO'].sort(),
    );
  });

  it('row colour: OFFLINE wins, ANULADO from DISPONIBILIDADE ANU or ATRIBUTO9 A; *** when commented', async () => {
    const rows = (await get('/api/documentos?size=500')).body.rows;
    const by = (id: number) => rows.find((r) => r['ID'] === id);
    expect(by(3)).toMatchObject({ COR: 'OFFLINE', COMENTARIO: '***' });
    expect(by(4)).toMatchObject({ COR: 'ANULADO', COMENTARIO: null });
    expect(by(5)).toMatchObject({ COR: 'ANULADO' });
    expect(by(1)).toMatchObject({ COR: null });
  });

  it('presets pick their documents', async () => {
    expect(await ids('/api/documentos?preset=todos')).toHaveLength(12);
    expect(await ids('/api/documentos?preset=nao-executados')).toEqual([2]);
    expect(await ids('/api/documentos?preset=em-erro')).toEqual([3]);
    expect(await ids('/api/documentos?preset=a-executar')).toEqual([4]);
    expect(await ids('/api/documentos?preset=execucao')).toEqual([5]);
    expect(await ids('/api/documentos?preset=em-branco')).toEqual([1]);
  });

  it('an unknown preset, filter column or key is 400 VALIDACAO', async () => {
    for (const q of ['preset=x', 'f[NOPE]=1', 'bogus=1', 'sort=NOPE:asc']) {
      const r = await get(`/api/documentos?${q}`);
      expect(r.status, q).toBe(400);
      expect(r.body['code']).toBe('VALIDACAO');
    }
  });

  it('QBE filters and the IS NULL convention combine with a preset', async () => {
    expect(await ids('/api/documentos?f[MODELO_ID]=R3.D25&sort=ID:asc')).toEqual([7, 9, 10]);
    expect(await ids('/api/documentos?f[DESTINATARIO][null]=1')).toEqual([1]);
    expect(await ids('/api/documentos?preset=todos&f[LOTE_ID]=9&sort=ID:asc')).toEqual([6, 7, 8, 9]);
  });

  it('sort LOTE = LOTE_ID, LOTE_ORDEM in the requested direction, then ID', async () => {
    const got = await ids('/api/documentos?f[LOTE_ID][notnull]=1&sort=LOTE:desc');
    expect(got).toEqual([9, 8, 7, 6, 10]);
  });

  it('USER sorts by Spool (ID) only: another key is 400, ID either way is fine', async () => {
    const r = await get('/api/documentos?sort=MODELO_ID:asc', user);
    expect(r.status).toBe(400);
    expect(r.body['code']).toBe('VALIDACAO');
    expect((await ids('/api/documentos?sort=ID:asc', user))[0]).toBe(1);
  });

  it('ADM may use every sort button', async () => {
    for (const k of ['ID', 'DATA_PEDIDO', 'MODELO_ID', 'ESTADO', 'CRIADO_POR', 'DESTINATARIO', 'FATURACAO_ELECTRONICA', 'REFERENCIA', 'LOTE'])
      expect((await get(`/api/documentos?sort=${k}:asc`)).status, k).toBe(200);
  });
});

describe('GET /api/documentos — Procurar por parâmetros (intersection)', () => {
  it('one parameter, LIKE pattern', async () => {
    expect(await ids('/api/documentos?param[P_NMRECIBO]=12%25&sort=ID:asc')).toEqual([1, 2, 7]);
  });

  it('two parameters intersect', async () => {
    expect(await ids('/api/documentos?param[P_NMRECIBO]=12%25&param[P_ANO]=2026')).toEqual([1]);
  });

  it('the model pattern narrows the search', async () => {
    expect(await ids('/api/documentos?param[P_NMRECIBO]=12%25&paramModelo=R3%25')).toEqual([7]);
  });

  it('no match → empty list (the SPA shows the NAO_OBTEVE_DADOS text)', async () => {
    const { status, body } = await get('/api/documentos?param[P_NMRECIBO]=999');
    expect(status).toBe(200);
    expect(body).toMatchObject({ rows: [], total: 0 });
  });

  it('a model pattern without any parameter value is 400', async () => {
    expect((await get('/api/documentos?paramModelo=R3%25')).status).toBe(400);
  });
});

describe('GET /api/documentos?grupo= — Mostrar grupo', () => {
  it('grouped model in a lote: same lote, LOTE_ORDEM between the D1 neighbours', async () => {
    // Doc 7 (R3.D25, ordem 2): D1.A7 bounds in lote 9 → >= 1 (doc 6) and < 3 (doc 8).
    expect(await ids('/api/documentos?grupo=7&sort=ID:asc')).toEqual([6, 7]);
    expect(await ids('/api/documentos?grupo=9&sort=ID:asc')).toEqual([8, 9]);
  });

  it('any other model: the parent document and its attachments', async () => {
    expect(await ids('/api/documentos?grupo=12&sort=ID:asc')).toEqual([11, 12]);
    expect(await ids('/api/documentos?grupo=11&sort=ID:asc')).toEqual([11, 12]);
    expect(await ids('/api/documentos?grupo=1')).toEqual([1]);
  });

  it('an unknown document is 404, a non-numeric one 400', async () => {
    expect((await get('/api/documentos?grupo=999')).status).toBe(404);
    expect((await get('/api/documentos?grupo=abc')).status).toBe(400);
  });
});

describe('GET /api/documentos/:id — detail by role (D-08)', () => {
  it('ADM gets every DETALHES_DOCUMENTO column', async () => {
    const { status, body } = await get('/api/documentos/4');
    expect(status).toBe(200);
    expect(Object.keys(body).sort()).toEqual([...DOCUMENTO_DETALHE].sort());
    expect(body).toMatchObject({ ID: 4, ATRIBUTO10: 'x', ATRIB_ARQ_1: 'y' });
  });

  it('USER never receives the extended columns (absent, not null)', async () => {
    const { body } = await get('/api/documentos/4', user);
    for (const c of DOCUMENTO_DETALHE_SO_ADM) expect(body, c).not.toHaveProperty(c);
    expect(body).toMatchObject({ ID: 4, ATRIBUTO9: 'A', ATRIBUTO4: null });
  });

  it('unknown id → 404 NAO_ENCONTRADO; a bad id → 400', async () => {
    expect(await get('/api/documentos/999')).toMatchObject({ status: 404, body: { code: 'NAO_ENCONTRADO' } });
    expect((await get('/api/documentos/abc')).status).toBe(400);
    expect((await get('/api/documentos/0')).status).toBe(400);
  });

  it('no session → 401', async () => {
    expect((await appWith({ semSessao: true }).inject({ url: '/api/documentos/1' })).statusCode).toBe(401);
  });
});

describe('GET /api/documentos/:id/<tab>', () => {
  it('parametros: ordered by N_PARAMETRO, without _USER and P_ID', async () => {
    const { body } = await get('/api/documentos/1/parametros', user);
    expect(body.rows).toEqual([
      { NOME: 'P_NMRECIBO', VALOR: '123', N_PARAMETRO: 2 },
      { NOME: 'P_ANO', VALOR: '2026', N_PARAMETRO: 3 },
    ]);
  });

  it('comentarios ordered by COMENTARIO_ID; fila by ID with the printer text; erros; anexos', async () => {
    expect((await get('/api/documentos/3/comentarios')).body.rows.map((r) => r['COMENTARIO'])).toEqual(['a', 'b']);
    const fila = (await get('/api/documentos/3/fila')).body.rows;
    expect(fila.map((r) => r['ID'])).toEqual([30, 31]);
    expect(fila[0]).toMatchObject({ IMPRESSORA: 'HP - piso 1' });
    expect(fila[0]).not.toHaveProperty('DOCUMENTO_ID');
    expect((await get('/api/documentos/3/erros')).body.rows).toEqual([
      { ID: 5, DATA_ERRO: '2026-09-03T10:00:00', DESCRICAO: 'DOCUMENTO REGERADO POR ANA' },
    ]);
    expect((await get('/api/documentos/11/anexos')).body.rows).toEqual([
      { ANEXODOC_ID: 12, TIPO_ANEXO_RF: 1, MODELO_ID: 'M.ANEXO', ESTADO: 'IMPRESSO', DATA_PEDIDO: '2026-09-12T10:00:00' },
    ]);
  });

  it('a document without rows gives an empty list', async () => {
    expect((await get('/api/documentos/1/fila')).body.rows).toEqual([]);
  });
});

describe('GET /api/documentos/conversoes/* — CONVERTE_PARAM (BR-DOC-26)', () => {
  it('recibo: NMRECINUE → NMRECIBO; none or several rows → null (the form swallowed the error)', async () => {
    expect((await get('/api/documentos/conversoes/recibo?nmrecinue=900', user)).body).toEqual({ valor: '12345' });
    expect((await get('/api/documentos/conversoes/recibo?nmrecinue=901')).body).toEqual({ valor: null });
    expect((await get('/api/documentos/conversoes/recibo?nmrecinue=5')).body).toEqual({ valor: null });
  });

  it('pessoa: CDIDEPER → CDPERSON', async () => {
    expect((await get('/api/documentos/conversoes/pessoa?cdideper=501234567')).body).toEqual({ valor: '77' });
    expect((await get('/api/documentos/conversoes/pessoa?cdideper=X')).body).toEqual({ valor: null });
  });

  it('a missing or malformed value is 400', async () => {
    expect((await get('/api/documentos/conversoes/recibo?nmrecinue=12a')).status).toBe(400);
    expect((await get('/api/documentos/conversoes/recibo')).status).toBe(400);
    expect((await get('/api/documentos/conversoes/pessoa?cdideper=')).status).toBe(400);
  });
});

describe('GET /api/documentos/:id/pdf — FileServerSIID proxy (§6, D-03, D-29)', () => {
  const PDF = Buffer.from('%PDF-1.4 fake');
  let server: Server;
  let base: string;
  const pedidos: string[] = [];

  beforeAll(async () => {
    server = createServer((req, res) => {
      pedidos.push(req.url ?? '');
      const spool = new URL(req.url ?? '', 'http://x').searchParams.get('spoolid');
      if (spool === '1') res.writeHead(200, { 'content-type': 'application/pdf' }).end(PDF);
      else if (spool === '2') res.writeHead(200, { 'content-type': 'text/html' }).end('<html>erro</html>');
      else if (spool === '4') return; // never answers → timeout
      else if (spool === '6') {
        // A large PDF: headers at once, the rest after the timeout. The timeout covers the answer, not the download.
        res.writeHead(200, { 'content-type': 'application/pdf' });
        res.write(PDF.subarray(0, 4));
        setTimeout(() => res.end(PDF.subarray(4)), 600);
      }
      else res.writeHead(404).end();
    });
    await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/FileServerSIID/restapi/FileServer/pdf/T`;
  });
  afterAll(async () => {
    server.closeAllConnections();
    await new Promise((ok) => server.close(ok));
  });

  const pdfApp = (role: 'ADM' | 'USER' = 'ADM') => appWith({ role, fileServer: { baseUrl: base, timeoutMs: 300 } });

  it('streams the PDF inline, no caching, spoolid = the document id (USER too)', async () => {
    const r = await pdfApp('USER').inject({ url: '/api/documentos/1/pdf' });
    expect(r.statusCode).toBe(200);
    expect(r.headers['content-type']).toBe('application/pdf');
    expect(r.headers['content-disposition']).toBe('inline; filename="1.pdf"');
    expect(r.headers['cache-control']).toBe('private, no-store');
    expect(r.rawPayload.equals(PDF)).toBe(true);
    expect(pedidos.at(-1)).toBe('/FileServerSIID/restapi/FileServer/pdf/T?spoolid=1');
  });

  it('a slow download after a prompt answer is not cut by the timeout', async () => {
    const r = await pdfApp().inject({ url: '/api/documentos/6/pdf' });
    expect(r.statusCode).toBe(200);
    expect(r.rawPayload.equals(PDF)).toBe(true);
  });

  it('upstream 404 → 404 DOCUMENTO_NAO_DISPONIVEL with the DISPONIBILIDADE reason', async () => {
    const off = await pdfApp().inject({ url: '/api/documentos/3/pdf' });
    expect(off.statusCode).toBe(404);
    expect(off.json()).toMatchObject({ code: 'DOCUMENTO_NAO_DISPONIVEL', message: 'Documento não disponível: backup offline.' });
    const anu = await pdfApp().inject({ url: '/api/documentos/5/pdf' });
    expect(anu.json()).toMatchObject({ message: 'Documento não disponível: documento anulado.' });
  });

  it('a non-PDF answer is 404 too', async () => {
    const r = await pdfApp().inject({ url: '/api/documentos/2/pdf' });
    expect(r.statusCode).toBe(404);
    expect(r.json()).toMatchObject({ code: 'DOCUMENTO_NAO_DISPONIVEL', message: 'Documento não disponível.' });
  });

  it('timeout or network error → 502 DOCUMENTO_NAO_DISPONIVEL', async () => {
    const slow = await pdfApp().inject({ url: '/api/documentos/4/pdf' });
    expect(slow.statusCode).toBe(502);
    expect(slow.json()).toMatchObject({ code: 'DOCUMENTO_NAO_DISPONIVEL' });
    const down = await appWith().inject({ url: '/api/documentos/1/pdf' });
    expect(down.statusCode).toBe(502);
  });

  it('an unknown document is 404 NAO_ENCONTRADO without calling the file server', async () => {
    const antes = pedidos.length;
    const r = await pdfApp().inject({ url: '/api/documentos/999/pdf' });
    expect(r.statusCode).toBe(404);
    expect(r.json()).toMatchObject({ code: 'NAO_ENCONTRADO' });
    expect(pedidos.length).toBe(antes);
  });
});
