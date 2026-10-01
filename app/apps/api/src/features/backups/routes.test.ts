import { Writable } from 'node:stream';
import Fastify from 'fastify';
import { pt } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import { registerErrorHandler } from '../../http/errors.ts';
import type { Row } from '../../lib/crud.ts';
import type { GetVariavel, VariavelNome } from '../../lib/variaveis.ts';
import { memoryBackupsRepo } from './memoria.ts';
import { registerBackupsRoutes } from './routes.ts';

/**
 * FD_NOVO_BACKUP and FD_BACKUPS_ONLINE (Step 8.1) over memoryBackupsRepo and a fake getVariavel:
 * month list, candidates of a month with the running total, creating a backup (name, destination,
 * BACKUP_ID, BACKUP queue rows, medium-size check) and moving backups online / offline. ADM only.
 * The SQL itself is pinned by oracle.test.ts. Pins BR-BKP-01..06, BR-BKP-09, messages #30/#49/#50.
 */

const MB = 1024 * 1024;

const doc = (ID: number, DATA_IMPRESSAO: string | null, TAMANHO_BYTES: number | null, BACKUP_ID: number | null = null): Row => ({
  ID,
  MODELO_ID: 'E.E1',
  N_REFERENCIA: `REF${ID}`,
  DATA_IMPRESSAO,
  DATA_PEDIDO: '2026-01-01T09:00:00',
  CRIADO_POR: 'ANA',
  TAMANHO_BYTES,
  BACKUP_ID,
});

const backup = (ID: number, NOME: string, MEDIA_ONLINE: 'S' | 'N', DRIVE_ONLINE: string | null): Row => ({
  ID,
  NOME,
  MES_BACKUP: `${NOME.slice(6, 10)}-${NOME.slice(10, 12)}-01T00:00:00`,
  TIPO_MIDIA_ID: 'DVD',
  DESTINO: `\\\\SRV\\BK\\${NOME}`,
  OBSERVACOES: null,
  MEDIA_ONLINE,
  DRIVE_ONLINE,
  CRIADO_POR: 'ANA',
  DATA_CRIACAO: '2026-07-02T10:00:00',
});

/** A fresh fixture per app: the routes mutate it. */
const dados = () => ({
  documentos: [
    doc(1, '2026-08-03T10:00:00', 1000), // August candidate
    doc(2, '2026-08-31T23:59:59', 3000), // August candidate, last second of the month
    doc(3, '2026-08-15T09:00:00', null), // August candidate, size unknown (counts 0)
    doc(4, '2026-08-10T10:00:00', 1 * MB, 70), // August, already in backup 70
    doc(5, '2026-07-31T23:59:59', 200), // July candidate (the only one)
    doc(6, '2026-09-01T00:00:00', 400), // September candidate
    doc(7, null, 100), // never printed: never a candidate
    doc(8, '2026-06-05T10:00:00', 2 * MB, 70), // June, fully backed up
    doc(9, '2024-02-29T12:00:00', 10), // leap day
  ],
  tiposMidia: [
    { ID: 'DVD', TAMANHO_BYTES: 4000 },
    { ID: 'CD', TAMANHO_BYTES: 3999 },
    { ID: 'USB', TAMANHO_BYTES: null },
  ] as Row[],
  backups: [backup(70, 'COSEC_202606_ 01', 'N', null), backup(71, 'COSEC_202605_ 01', 'S', 'E:\\')],
  fila: [] as Row[],
});

type Opts = { role?: 'ADM' | 'USER'; semSessao?: boolean; variaveis?: Partial<Record<VariavelNome, string | null>>; logs?: Record<string, unknown>[] };

function appWith(opts: Opts = {}) {
  const d = dados();
  const logs = opts.logs;
  const stream = new Writable({
    write(chunk, _enc, cb) {
      for (const line of String(chunk).split('\n').filter(Boolean)) logs?.push(JSON.parse(line));
      cb();
    },
  });
  const app = Fastify(logs ? { logger: { stream } } : {});
  registerErrorHandler(app);
  app.decorateRequest('session', null as never);
  app.addHook('onRequest', async (req) => {
    (req as { session: unknown }).session = opts.semSessao
      ? {}
      : { user: { username: 'JOAO', nome: 'João', role: opts.role ?? 'ADM', ambiente: 'T' }, get: () => undefined };
  });
  const variaveis = opts.variaveis ?? { BACKUP: '\\\\SRV\\BK\\', ONLINE: 'F:\\' };
  const getVariavel: GetVariavel = async (nome) => variaveis[nome] ?? null;
  registerBackupsRoutes(app, { repo: memoryBackupsRepo(d), getVariavel });
  const get = async (url: string) => {
    const r = await app.inject({ url });
    return { status: r.statusCode, body: (r.body ? r.json() : {}) as Record<string, unknown> };
  };
  const send = async (method: 'POST' | 'PUT' | 'DELETE', url: string, body?: unknown) => {
    const r = await app.inject({ method, url, ...(body === undefined ? {} : { payload: body as object }) });
    return { status: r.statusCode, body: (r.body ? r.json() : {}) as Record<string, unknown> };
  };
  const criar = (body: unknown) => send('POST', '/api/backups', body);
  const docBackup = (id: number) => d.documentos.find((x) => x['ID'] === id)?.['BACKUP_ID'];
  return { app, d, get, send, criar, docBackup };
}

const rows = (body: Record<string, unknown>) => body['rows'] as Row[];
const ids = (body: Record<string, unknown>) => rows(body).map((r) => r['ID']);
const snapshot = (d: ReturnType<typeof dados>) => JSON.stringify(d);

describe('GET /api/backups/meses (BR-BKP-02)', () => {
  it('months with printed, not-backed-up documents, newest first, { MES: YYYY-MM, DATA: DD/MM/YYYY }', async () => {
    const r = await appWith().get('/api/backups/meses');
    expect(r.status).toBe(200);
    expect(r.body).toEqual({
      rows: [
        { MES: '2026-09', DATA: '01/09/2026' },
        { MES: '2026-08', DATA: '01/08/2026' },
        { MES: '2026-07', DATA: '01/07/2026' },
        { MES: '2024-02', DATA: '01/02/2024' },
      ],
    });
  });
});

describe('GET /api/backups/candidatos (BR-BKP-02, BR-BKP-06)', () => {
  it('only documents of that month with BACKUP_ID null; DATA_IMPRESSAO null, other months and backed-up ones excluded', async () => {
    const r = await appWith().get('/api/backups/candidatos?mes=2026-08&sort=ID:asc');
    expect(r.status).toBe(200);
    expect(ids(r.body)).toEqual([1, 2, 3]);
    expect(r.body).toMatchObject({ total: 3, totalCapped: false, page: 1, size: 50 });
  });

  it('totalBytes is the sum of NVL(TAMANHO_BYTES,0) over the whole month, not the page', async () => {
    const r = await appWith().get('/api/backups/candidatos?mes=2026-08&size=1&sort=ID:asc');
    expect(rows(r.body)).toHaveLength(1);
    expect(r.body).toMatchObject({ total: 3, totalBytes: 4000, size: 1 });
  });

  it('a month with no candidate → empty rows, total 0, totalBytes 0', async () => {
    const r = await appWith().get('/api/backups/candidatos?mes=2026-06');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ rows: [], total: 0, totalBytes: 0 });
  });

  it('the last day of a leap February is inside the month (to = 2024-02-29)', async () => {
    const r = await appWith().get('/api/backups/candidatos?mes=2024-02');
    expect(r.status).toBe(200);
    expect(ids(r.body)).toEqual([9]);
  });

  it('client filters on DATA_IMPRESSAO / BACKUP_ID are replaced by the month and BACKUP_ID null', async () => {
    const r = await appWith().get(
      '/api/backups/candidatos?mes=2026-07&f[DATA_IMPRESSAO][from]=2000-01-01&f[DATA_IMPRESSAO][to]=2099-12-31&f[BACKUP_ID][notnull]=1',
    );
    expect(r.status).toBe(200);
    expect(ids(r.body)).toEqual([5]);
    expect(r.body['totalBytes']).toBe(200);
  });

  it('sort by TAMANHO_BYTES and by DATA_IMPRESSAO', async () => {
    const t = appWith();
    // doc 3 has TAMANHO_BYTES null; where Oracle puts it (NULLS FIRST on DESC) is not pinned here.
    const porTamanho = await t.get('/api/backups/candidatos?mes=2026-08&sort=TAMANHO_BYTES:desc');
    expect(ids(porTamanho.body).filter((id) => id !== 3)).toEqual([2, 1]);
    const porTamanhoAsc = await t.get('/api/backups/candidatos?mes=2026-08&sort=TAMANHO_BYTES:asc');
    expect(ids(porTamanhoAsc.body).filter((id) => id !== 3)).toEqual([1, 2]);
    const porData = await t.get('/api/backups/candidatos?mes=2026-08&sort=DATA_IMPRESSAO:asc');
    expect(ids(porData.body)).toEqual([1, 3, 2]);
  });

  it.each(['', 'mes=', 'mes=2026-13', 'mes=2026-00', 'mes=2026-8', 'mes=08-2026', 'mes=2026-08-01'])('bad or missing mes (%s) → 400 VALIDACAO', async (qs) => {
    const r = await appWith().get(`/api/backups/candidatos?${qs}`);
    expect(r.status).toBe(400);
    expect(r.body['code']).toBe('VALIDACAO');
  });
});

describe('GET /api/backups (BR-BKP-09 lists of FD_BACKUPS_ONLINE)', () => {
  it('paged envelope; TAMANHO_BACKUP = SUM(TAMANHO_BYTES)/1024/1024 of the documents, null without documents', async () => {
    const r = await appWith().get('/api/backups?sort=ID:asc');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ total: 2, totalCapped: false, page: 1, size: 50 });
    expect(rows(r.body).map((b) => [b['ID'], b['TAMANHO_BACKUP']])).toEqual([
      [70, 3],
      [71, null],
    ]);
  });

  it('f[MEDIA_ONLINE]=N is the OFFLINE list, =S the ONLINE list', async () => {
    const t = appWith();
    expect(ids((await t.get('/api/backups?f[MEDIA_ONLINE]=N')).body)).toEqual([70]);
    expect(ids((await t.get('/api/backups?f[MEDIA_ONLINE]=S')).body)).toEqual([71]);
  });

  it('a backup cannot be changed or deleted (D-25): PUT / DELETE /api/backups/:rid → 404, generic { values } POST → 400; nothing changed', async () => {
    const t = appWith();
    const antes = snapshot(t.d);
    expect((await t.send('PUT', '/api/backups/AAAAAAAAAAAAAAAAAA', { orig: {}, values: { NOME: 'X' } })).status).toBe(404);
    expect((await t.send('DELETE', '/api/backups/AAAAAAAAAAAAAAAAAA', { orig: {} })).status).toBe(404);
    const generic = await t.criar({ values: { NOME: 'X', MES_BACKUP: '2026-08-01' } });
    expect(generic.status).toBe(400);
    expect(snapshot(t.d)).toBe(antes);
  });
});

describe('POST /api/backups — validations (BR-BKP-04, #30 #49 #50)', () => {
  it.each([{}, { tipoMidiaId: '' }, { tipoMidiaId: '   ' }])('tipoMidiaId missing / blank (%j) → 400 fields.tipoMidiaId = #49, nothing written', async (midia) => {
    const t = appWith();
    const antes = snapshot(t.d);
    const r = await t.criar({ mes: '2026-08', ids: [1], ...midia });
    expect(r.status).toBe(400);
    expect(r.body).toMatchObject({ code: 'VALIDACAO', fields: { tipoMidiaId: pt.backups.tipoMidiaObrigatorio } });
    expect(snapshot(t.d)).toBe(antes);
  });

  it('unknown tipoMidiaId → 400 fields.tipoMidiaId = tipoMidiaInexistente, nothing written', async () => {
    const t = appWith();
    const antes = snapshot(t.d);
    const r = await t.criar({ mes: '2026-08', tipoMidiaId: 'NAOHA', ids: [1] });
    expect(r.status).toBe(400);
    expect(r.body).toMatchObject({ code: 'VALIDACAO', fields: { tipoMidiaId: pt.backups.tipoMidiaInexistente } });
    expect(snapshot(t.d)).toBe(antes);
  });

  it.each([{}, { ids: [] }])('no selection (%j) → 400 fields.seleccao = #30, nothing written', async (sel) => {
    const t = appWith();
    const antes = snapshot(t.d);
    const r = await t.criar({ mes: '2026-08', tipoMidiaId: 'DVD', ...sel });
    expect(r.status).toBe(400);
    expect(r.body).toMatchObject({ code: 'VALIDACAO', fields: { seleccao: pt.naoExistemDocumentosSeleccionados } });
    expect(snapshot(t.d)).toBe(antes);
  });

  it("todos over a month without candidates → 400 fields.seleccao = #30, nothing written", async () => {
    const t = appWith();
    const antes = snapshot(t.d);
    const r = await t.criar({ mes: '2026-06', tipoMidiaId: 'DVD', todos: true });
    expect(r.status).toBe(400);
    expect(r.body).toMatchObject({ code: 'VALIDACAO', fields: { seleccao: pt.naoExistemDocumentosSeleccionados } });
    expect(snapshot(t.d)).toBe(antes);
  });

  it('both ids and todos → 400 VALIDACAO', async () => {
    const r = await appWith().criar({ mes: '2026-08', tipoMidiaId: 'DVD', ids: [1], todos: true });
    expect(r.status).toBe(400);
    expect(r.body['code']).toBe('VALIDACAO');
  });

  it.each([undefined, '', '2026-13', '2026-8', '2026-08-01', 202608])('bad mes (%j) → 400 VALIDACAO', async (mes) => {
    const r = await appWith().criar({ mes, tipoMidiaId: 'DVD', ids: [1] });
    expect(r.status).toBe(400);
    expect(r.body['code']).toBe('VALIDACAO');
  });

  it.each([{ nome: 'X' }, { destino: 'C:\\' }, { CRIADO_POR: 'X' }])('an unknown key (%j) → 400 VALIDACAO (strict body)', async (extra) => {
    const r = await appWith().criar({ mes: '2026-08', tipoMidiaId: 'DVD', ids: [1], ...extra });
    expect(r.status).toBe(400);
    expect(r.body['code']).toBe('VALIDACAO');
  });

  it('medium smaller than the chosen documents (CD 3999 < 4000) → 400 fields.tipoMidiaId = #50 and NOTHING changed', async () => {
    const t = appWith();
    const antes = snapshot(t.d);
    const r = await t.criar({ mes: '2026-08', tipoMidiaId: 'CD', todos: true });
    expect(r.status).toBe(400);
    expect(r.body).toMatchObject({ code: 'VALIDACAO', fields: { tipoMidiaId: pt.backups.tamanhoMidia } });
    expect(snapshot(t.d)).toBe(antes);
  });

  it('medium exactly the size of the selection (DVD 4000 = 4000) is accepted (form: MIDIA < TOTAL)', async () => {
    expect((await appWith().criar({ mes: '2026-08', tipoMidiaId: 'DVD', todos: true })).status).toBe(201);
  });

  it('medium with TAMANHO_BYTES null is accepted whatever the total', async () => {
    expect((await appWith().criar({ mes: '2026-08', tipoMidiaId: 'USB', todos: true })).status).toBe(201);
  });

  it.each([
    [[1, 4], 'already in backup 70'],
    [[1, 5], 'of another month'],
    [[1, 7], 'never printed'],
    [[1, 999], 'does not exist'],
  ])('ids %j (one %s) → 409 REGISTO_ALTERADO, nothing changed', async (sel) => {
    const t = appWith();
    const antes = snapshot(t.d);
    const r = await t.criar({ mes: '2026-08', tipoMidiaId: 'DVD', ids: sel });
    expect(r.status).toBe(409);
    expect(r.body['code']).toBe('REGISTO_ALTERADO');
    expect(snapshot(t.d)).toBe(antes);
  });
});

describe('POST /api/backups — effects (BR-BKP-01, BR-BKP-03, BR-BKP-05)', () => {
  it('201 { ID, NOME }; one SVR_BACKUPS row: NOME COSEC_YYYYMM_ 01, MES_BACKUP first day, DESTINO = BACKUP variable + NOME, MEDIA_ONLINE N, CRIADO_POR user', async () => {
    const t = appWith();
    const r = await t.criar({ mes: '2026-08', tipoMidiaId: 'DVD', observacoes: 'caixa 3', ids: [1, 2] });
    expect(r.status).toBe(201);
    expect(r.body).toEqual({ ID: expect.any(Number), NOME: 'COSEC_202608_ 01' });
    expect(t.d.backups).toHaveLength(3);
    const novo = t.d.backups.find((b) => b['ID'] === r.body['ID'])!;
    expect(novo).toMatchObject({
      NOME: 'COSEC_202608_ 01',
      TIPO_MIDIA_ID: 'DVD',
      DESTINO: '\\\\SRV\\BK\\COSEC_202608_ 01',
      OBSERVACOES: 'caixa 3',
      MEDIA_ONLINE: 'N',
      DRIVE_ONLINE: null,
      CRIADO_POR: 'JOAO',
    });
    expect(String(novo['MES_BACKUP'])).toMatch(/^2026-08-01/);
    expect(novo['DATA_CRIACAO']).toEqual(expect.any(String));
  });

  it('observacoes absent → null', async () => {
    const t = appWith();
    const r = await t.criar({ mes: '2026-08', tipoMidiaId: 'DVD', ids: [1] });
    expect(t.d.backups.find((b) => b['ID'] === r.body['ID'])?.['OBSERVACOES']).toBeNull();
  });

  it('BACKUP variable missing → DESTINO is just NOME', async () => {
    const t = appWith({ variaveis: { BACKUP: null } });
    const r = await t.criar({ mes: '2026-08', tipoMidiaId: 'DVD', ids: [1] });
    expect(t.d.backups.find((b) => b['ID'] === r.body['ID'])?.['DESTINO']).toBe('COSEC_202608_ 01');
  });

  it('the second backup of the same month is COSEC_YYYYMM_ 02; another month starts at 01', async () => {
    const t = appWith();
    expect((await t.criar({ mes: '2026-08', tipoMidiaId: 'DVD', ids: [1] })).body['NOME']).toBe('COSEC_202608_ 01');
    expect((await t.criar({ mes: '2026-08', tipoMidiaId: 'DVD', ids: [2] })).body['NOME']).toBe('COSEC_202608_ 02');
    expect((await t.criar({ mes: '2026-07', tipoMidiaId: 'DVD', ids: [5] })).body['NOME']).toBe('COSEC_202607_ 01');
  });

  it('only the chosen documents get BACKUP_ID; one BACKUP/ESPERA queue row per document, CRIADO_POR user', async () => {
    const t = appWith();
    const r = await t.criar({ mes: '2026-08', tipoMidiaId: 'DVD', ids: [1, 3] });
    const id = r.body['ID'];
    expect([t.docBackup(1), t.docBackup(2), t.docBackup(3)]).toEqual([id, null, id]);
    expect(t.d.fila).toHaveLength(2);
    expect(t.d.fila.map((q) => q['DOCUMENTO_ID']).sort()).toEqual([1, 3]);
    for (const q of t.d.fila) {
      expect(q).toMatchObject({ TIPO_QUEUE_RF: 'BACKUP', ESTADO: 'ESPERA', CRIADO_POR: 'JOAO' });
      expect(typeof q['ID']).toBe('number');
    }
  });

  it('todos: true takes every candidate of the month and nothing else', async () => {
    const t = appWith();
    const r = await t.criar({ mes: '2026-08', tipoMidiaId: 'DVD', todos: true });
    const id = r.body['ID'];
    expect([1, 2, 3].map(t.docBackup)).toEqual([id, id, id]);
    expect([4, 5, 6, 7, 8, 9].map(t.docBackup)).toEqual([70, null, null, null, 70, null]);
    expect(t.d.fila.map((q) => q['DOCUMENTO_ID']).sort()).toEqual([1, 2, 3]);
  });

  it('afterwards the documents are no longer candidates, and an emptied month leaves /meses', async () => {
    const t = appWith();
    await t.criar({ mes: '2026-08', tipoMidiaId: 'DVD', ids: [1] });
    expect(ids((await t.get('/api/backups/candidatos?mes=2026-08&sort=ID:asc')).body)).toEqual([2, 3]);
    await t.criar({ mes: '2026-07', tipoMidiaId: 'DVD', ids: [5] });
    const meses = rows((await t.get('/api/backups/meses')).body).map((m) => m['MES']);
    expect(meses).toEqual(['2026-09', '2026-08', '2024-02']);
  });

  it('the new backup shows in the OFFLINE list with its TAMANHO_BACKUP', async () => {
    const t = appWith();
    const r = await t.criar({ mes: '2026-08', tipoMidiaId: 'DVD', ids: [1, 2] });
    const offline = rows((await t.get('/api/backups?f[MEDIA_ONLINE]=N')).body);
    expect(offline.find((b) => b['ID'] === r.body['ID'])?.['TAMANHO_BACKUP']).toBeCloseTo(4000 / MB, 12);
  });

  it('writes a backups.criar audit line', async () => {
    const logs: Record<string, unknown>[] = [];
    const t = appWith({ logs });
    const r = await t.criar({ mes: '2026-08', tipoMidiaId: 'DVD', ids: [1] });
    expect(r.status).toBe(201);
    expect(logs.filter((l) => l['audit'] === true && l['event'] === 'backups.criar')).toHaveLength(1);
  });
});

describe('POST /api/backups/online (BR-BKP-09)', () => {
  it("online true → 204, MEDIA_ONLINE S and DRIVE_ONLINE = ONLINE variable", async () => {
    const t = appWith();
    const r = await t.send('POST', '/api/backups/online', { ids: [70], online: true });
    expect(r.status).toBe(204);
    expect(t.d.backups.find((b) => b['ID'] === 70)).toMatchObject({ MEDIA_ONLINE: 'S', DRIVE_ONLINE: 'F:\\' });
  });

  it("ONLINE variable missing → DRIVE_ONLINE 'E:\\' (the form's NVL)", async () => {
    const t = appWith({ variaveis: { BACKUP: '\\\\SRV\\BK\\', ONLINE: null } });
    await t.send('POST', '/api/backups/online', { ids: [70], online: true });
    expect(t.d.backups.find((b) => b['ID'] === 70)).toMatchObject({ MEDIA_ONLINE: 'S', DRIVE_ONLINE: 'E:\\' });
  });

  it('online false → 204, MEDIA_ONLINE N and DRIVE_ONLINE null', async () => {
    const t = appWith();
    const r = await t.send('POST', '/api/backups/online', { ids: [71], online: false });
    expect(r.status).toBe(204);
    expect(t.d.backups.find((b) => b['ID'] === 71)).toMatchObject({ MEDIA_ONLINE: 'N', DRIVE_ONLINE: null });
  });

  it('an unknown id → 409 REGISTO_ALTERADO, nothing changed', async () => {
    const t = appWith();
    const antes = snapshot(t.d);
    const r = await t.send('POST', '/api/backups/online', { ids: [70, 999], online: true });
    expect(r.status).toBe(409);
    expect(r.body['code']).toBe('REGISTO_ALTERADO');
    expect(snapshot(t.d)).toBe(antes);
  });

  it.each([{ ids: [], online: true }, { ids: [70, 70], online: true }, { ids: [70] }, { ids: [70], online: 'S' }, { ids: [70], online: true, drive: 'Z:\\' }])(
    'bad body %j → 400 VALIDACAO, nothing changed',
    async (body) => {
      const t = appWith();
      const antes = snapshot(t.d);
      const r = await t.send('POST', '/api/backups/online', body);
      expect(r.status).toBe(400);
      expect(r.body['code']).toBe('VALIDACAO');
      expect(snapshot(t.d)).toBe(antes);
    },
  );

  it('writes a backups.online audit line', async () => {
    const logs: Record<string, unknown>[] = [];
    const t = appWith({ logs });
    await t.send('POST', '/api/backups/online', { ids: [70], online: true });
    expect(logs.filter((l) => l['audit'] === true && l['event'] === 'backups.online')).toHaveLength(1);
  });
});

describe('roles: ADM only', () => {
  const GETS = ['/api/backups', '/api/backups/meses', '/api/backups/candidatos?mes=2026-08'];

  it('USER → 403 SEM_PERMISSAO on every route, nothing changed', async () => {
    const t = appWith({ role: 'USER' });
    const antes = snapshot(t.d);
    for (const url of GETS) {
      const r = await t.get(url);
      expect(r.status, url).toBe(403);
      expect(r.body['code']).toBe('SEM_PERMISSAO');
    }
    const c = await t.criar({ mes: '2026-08', tipoMidiaId: 'DVD', ids: [1] });
    expect(c.status).toBe(403);
    expect(c.body['code']).toBe('SEM_PERMISSAO');
    const o = await t.send('POST', '/api/backups/online', { ids: [70], online: true });
    expect(o.status).toBe(403);
    expect(o.body['code']).toBe('SEM_PERMISSAO');
    expect(snapshot(t.d)).toBe(antes);
  });

  it('no session → 401 on every route', async () => {
    const t = appWith({ semSessao: true });
    for (const url of GETS) expect((await t.get(url)).status, url).toBe(401);
    expect((await t.criar({ mes: '2026-08', tipoMidiaId: 'DVD', ids: [1] })).status).toBe(401);
    expect((await t.send('POST', '/api/backups/online', { ids: [70], online: true })).status).toBe(401);
  });
});
