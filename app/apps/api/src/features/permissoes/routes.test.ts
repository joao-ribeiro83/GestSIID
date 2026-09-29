import Fastify from 'fastify';
import { permissoes } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import { memoryStore } from '../dev/memoryStore.ts';
import { registerErrorHandler } from '../../http/errors.ts';
import { memoryPermissoesRepo } from './repo.ts';
import {
  FIM_BULK,
  JA_EXISTE,
  OBRIGATORIO,
  OBRIGATORIO_DATA_INICIO,
  SOBREPOE,
  validaHoje,
  type Modelo,
  type Perm,
  type Utilizador,
} from './rules.ts';
import { registerPermissoesRoutes } from './routes.ts';

/**
 * FD_PERMISSOES_SIID routes (BR-PERM-02..11) on the in-memory repo, clock fixed at NOW.
 * The session user is JOAO; every audit column must come from it, never from the body.
 */

const NOW = '2026-09-28T10:00:00';
const ONTEM = '2026-09-27T10:00:00'; // SYSDATE - 1
const REGISTO_ALTERADO = 'REGISTO_ALTERADO';

const modelo = (ID: string, REPORT_ID = 1): Modelo => ({
  ID,
  REPORT_ID,
  DATA_INICIO: '2020-01-01T00:00:00',
  DATA_FIM: null,
});
const MODELOS: Modelo[] = [modelo('M1'), modelo('M2'), modelo('M3'), modelo('M46', 46)];
const UTILIZADORES: Utilizador[] = [
  { USERNAME: 'ANA', NOME: 'Ana', UNIDADE_NEGOCIO_RF: 'DSI' },
  { USERNAME: 'BIA', NOME: 'Beatriz', UNIDADE_NEGOCIO_RF: 'DSI' },
  { USERNAME: 'DAVI', NOME: 'Davi', UNIDADE_NEGOCIO_RF: 'DSI' },
  { USERNAME: 'CARLOS', NOME: 'Carlos', UNIDADE_NEGOCIO_RF: 'DFI' },
];

const perm = (over: Partial<Perm> = {}): Perm => ({
  MODELO_ID: 'M1',
  USERNAME: 'ANA',
  UNIDADE_NEGOCIO_RF: 'DSI',
  TIPO_PERMISSAO_RF: 1,
  DATA_INICIO: '2026-01-01T00:00:00',
  DATA_FIM: null,
  ...over,
});

const viewRow = (over: Record<string, unknown> = {}) => ({
  MODELO_ID: 'M1',
  USERNAME: 'ANA',
  NOME: 'Ana',
  UNIDADE_NEGOCIO_RF: 'DSI',
  UNIDADE_NEGOCIO: 'Sistemas',
  AMBIENTE_ID: 'AMB',
  TIPO_PERMISSAO_RF: 1,
  TIPO_PERMISSAO: 'Impressão',
  DATA_INICIO: '2026-01-01T00:00:00',
  DATA_FIM: null,
  CRIADO_POR: 'MIGRACAO',
  DATA_CRIACAO: '2025-12-01T00:00:00',
  ACTUALIZADO_POR: null,
  DATA_ACTUALIZACAO: null,
  ...over,
});

function appWith(opts: { perms?: Perm[]; view?: Record<string, unknown>[]; role?: 'ADM' | 'USER' } = {}) {
  const app = Fastify();
  registerErrorHandler(app);
  app.decorateRequest('session', null as never);
  app.addHook('onRequest', async (req) => {
    (req as { session: unknown }).session = { user: { username: 'JOAO', role: opts.role ?? 'ADM' } };
  });
  const repo = memoryPermissoesRepo(
    { perms: opts.perms ?? [], modelos: MODELOS, utilizadores: UTILIZADORES },
    { now: () => NOW },
  );
  const store = memoryStore(permissoes, opts.view ?? [], {
    presets: { validas: (r: Record<string, unknown>) => validaHoje(r as Perm, NOW) },
  } as never);
  registerPermissoesRoutes(app, { store, repo });
  return { app, repo };
}

type App = ReturnType<typeof appWith>['app'];
const post = (app: App, url: string, payload: unknown) => app.inject({ method: 'POST', url, payload });
const put = (app: App, payload: unknown) => app.inject({ method: 'PUT', url: '/api/permissoes', payload });
const PERM_COLS = ['MODELO_ID', 'USERNAME', 'UNIDADE_NEGOCIO_RF', 'TIPO_PERMISSAO_RF', 'DATA_INICIO', 'DATA_FIM'] as const;
/** The repo rows reduced to the Perm columns (seeded rows may come back with null audit columns). */
const plain = (repo: ReturnType<typeof appWith>['repo']) =>
  repo.snapshot().map((p) => Object.fromEntries(PERM_COLS.map((c) => [c, p[c]])));
const find = (repo: ReturnType<typeof appWith>['repo'], m: Partial<Perm>) =>
  repo.snapshot().filter((p) => Object.entries(m).every(([k, v]) => p[k as keyof Perm] === v));

describe('access (every route is ADM only)', () => {
  const routes: [string, string, unknown?][] = [
    ['GET', '/api/permissoes'],
    ['GET', '/api/permissoes/por-utilizador/ANA?un=DSI&tipo=1'],
    ['GET', '/api/permissoes/por-modelo/M1?un=DSI&tipo=1'],
    ['POST', '/api/permissoes/por-utilizador/ANA/add', { un: 'DSI', tipo: 1, modelos: ['M1'] }],
    ['POST', '/api/permissoes/por-utilizador/ANA/add-all', { un: 'DSI', tipo: 1 }],
    ['POST', '/api/permissoes/por-utilizador/ANA/remove', { un: 'DSI', tipo: 1, linhas: [] }],
    ['POST', '/api/permissoes/por-utilizador/ANA/remove-all', { un: 'DSI', tipo: 1 }],
    ['POST', '/api/permissoes/por-modelo/M1/add', { un: 'DSI', tipo: 1, utilizadores: ['ANA'] }],
    ['POST', '/api/permissoes/por-modelo/M1/add-all', { un: 'DSI', tipo: 1 }],
    ['POST', '/api/permissoes/por-modelo/M1/remove', { un: 'DSI', tipo: 1, linhas: [] }],
    ['POST', '/api/permissoes/por-modelo/M1/remove-all', { un: 'DSI', tipo: 1 }],
    [
      'POST',
      '/api/permissoes',
      { MODELO_ID: 'M1', USERNAME: 'ANA', UNIDADE_NEGOCIO_RF: 'DSI', TIPO_PERMISSAO_RF: 1, DATA_INICIO: '2026-10-01' },
    ],
    ['PUT', '/api/permissoes', { orig: perm(), values: { DATA_INICIO: '2026-01-01', DATA_FIM: null } }],
    ['POST', '/api/permissoes/copiar-modelo', { MODELO_ID: 'M2', MODELO_ID_COPIAR: 'M1' }],
    ['POST', '/api/permissoes/anular', { orig: perm() }],
    [
      'POST',
      '/api/permissoes/copiar-utilizador',
      { USERNAME: 'BIA', UNIDADE_NEGOCIO_RF: 'DSI', USERNAME_COPIAR: 'ANA', UNIDADE_NEGOCIO_RF_COPIAR: 'DSI' },
    ],
  ];

  it.each(routes)('USER gets 403 SEM_PERMISSAO on %s %s', async (method, url, payload) => {
    const { app, repo } = appWith({ role: 'USER', perms: [perm()] });
    const r = await app.inject({ method: method as 'GET', url, ...(payload ? { payload: payload as object } : {}) });
    expect(r.statusCode).toBe(403);
    expect(r.json().code).toBe('SEM_PERMISSAO');
    expect(plain(repo)).toEqual([perm()]);
  });
});

describe('GET /api/permissoes (BR-PERM-02 list)', () => {
  const view = [
    viewRow({ MODELO_ID: 'M1' }),
    viewRow({ MODELO_ID: 'M2', DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: '2020-12-31T00:00:00' }),
    viewRow({ MODELO_ID: 'M3', DATA_INICIO: '2027-01-01T00:00:00' }),
  ];

  it('without a preset lists every row ("Todos")', async () => {
    const { app } = appWith({ view });
    const r = await app.inject({ url: '/api/permissoes' });
    expect(r.statusCode).toBe(200);
    expect(r.json().total).toBe(3);
  });

  it('preset=validas lists only rows valid today', async () => {
    const { app } = appWith({ view });
    const r = await app.inject({ url: '/api/permissoes?preset=validas' });
    expect(r.statusCode).toBe(200);
    expect((r.json().rows as { MODELO_ID: string }[]).map((x) => x.MODELO_ID)).toEqual(['M1']);
  });
});

describe('GET /api/permissoes/por-utilizador/:username (BR-PERM-07 panel)', () => {
  const perms = [
    perm({ MODELO_ID: 'M2' }),
    perm({ MODELO_ID: 'M1' }),
    perm({ MODELO_ID: 'M3', DATA_FIM: ONTEM }), // removed yesterday
    perm({ MODELO_ID: 'M3', TIPO_PERMISSAO_RF: 2 }),
    perm({ MODELO_ID: 'M3', UNIDADE_NEGOCIO_RF: 'DFI' }),
  ];

  it('com = valid rows of the user, unit and type sorted by MODELO_ID', async () => {
    const { app } = appWith({ perms });
    const r = await app.inject({ url: '/api/permissoes/por-utilizador/ANA?un=DSI&tipo=1' });
    expect(r.statusCode).toBe(200);
    expect(r.json().com).toMatchObject([perm({ MODELO_ID: 'M1' }), perm({ MODELO_ID: 'M2' })]);
  });

  it('sem = valid models without a valid permission, REPORT_ID 46 left out', async () => {
    const { app } = appWith({ perms });
    const r = await app.inject({ url: '/api/permissoes/por-utilizador/ANA?un=DSI&tipo=1' });
    expect(r.json().sem).toMatchObject([{ MODELO_ID: 'M3', USERNAME: 'ANA', NOME: 'Ana' }]);
  });

  it.each([
    ['un missing', '?tipo=1'],
    ['tipo missing', '?un=DSI'],
    ['tipo not a number', '?un=DSI&tipo=abc'],
  ])('%s → 400', async (_what, qs) => {
    const { app } = appWith({ perms });
    expect((await app.inject({ url: `/api/permissoes/por-utilizador/ANA${qs}` })).statusCode).toBe(400);
  });
});

describe('GET /api/permissoes/por-modelo/:modeloId (BR-PERM-09 panel)', () => {
  const perms = [perm({ USERNAME: 'BIA' }), perm({ USERNAME: 'ANA' }), perm({ USERNAME: 'DAVI', DATA_FIM: ONTEM })];

  it('com = valid rows of the model, unit and type sorted by USERNAME', async () => {
    const { app } = appWith({ perms });
    const r = await app.inject({ url: '/api/permissoes/por-modelo/M1?un=DSI&tipo=1' });
    expect(r.statusCode).toBe(200);
    expect(r.json().com).toMatchObject([perm({ USERNAME: 'ANA' }), perm({ USERNAME: 'BIA' })]);
  });

  it('sem = users of the unit without a valid permission', async () => {
    const { app } = appWith({ perms });
    const r = await app.inject({ url: '/api/permissoes/por-modelo/M1?un=DSI&tipo=1' });
    expect(r.json().sem).toMatchObject([{ MODELO_ID: 'M1', USERNAME: 'DAVI', NOME: 'Davi' }]);
  });

  it('un missing → 400', async () => {
    const { app } = appWith({ perms });
    expect((await app.inject({ url: '/api/permissoes/por-modelo/M1?tipo=1' })).statusCode).toBe(400);
  });
});

describe('POST …/por-utilizador/:username/add and add-all (BR-PERM-07)', () => {
  const url = '/api/permissoes/por-utilizador/ANA';

  it('inserts from now to 2200-12-31 with CRIADO_POR from the session', async () => {
    const { app, repo } = appWith({});
    const r = await post(app, `${url}/add`, { un: 'DSI', tipo: 1, modelos: ['M1'] });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ inseridos: 1 });
    expect(repo.snapshot()).toEqual([
      expect.objectContaining({
        ...perm({ DATA_INICIO: NOW, DATA_FIM: FIM_BULK }),
        CRIADO_POR: 'JOAO',
        DATA_CRIACAO: NOW,
      }),
    ]);
  });

  it('ignores models that are not in the "sem" list (already granted, REPORT_ID 46, unknown)', async () => {
    const { app, repo } = appWith({ perms: [perm({ MODELO_ID: 'M1' })] });
    const r = await post(app, `${url}/add`, { un: 'DSI', tipo: 1, modelos: ['M1', 'M46', 'NOPE', 'M2'] });
    expect(r.json()).toEqual({ inseridos: 1 });
    expect(find(repo, { DATA_INICIO: NOW }).map((p) => p.MODELO_ID)).toEqual(['M2']);
  });

  it('the form does no overlap check, but TRG_PREVENT_DUPLICATE_PERM does: a future permission → 422, nothing added', async () => {
    const { app, repo } = appWith({ perms: [perm({ MODELO_ID: 'M1', DATA_INICIO: '2027-01-01T00:00:00' })] });
    const r = await post(app, `${url}/add`, { un: 'DSI', tipo: 1, modelos: ['M2', 'M1'] });
    expect(r.statusCode).toBe(422);
    expect(r.json()).toMatchObject({ code: 'ORA_20XXX' });
    expect(r.json().message).toMatch(/^ORA-20001: Active permission already exists/);
    expect(repo.snapshot()).toHaveLength(1);
  });

  it('add-all inserts the whole "sem" list', async () => {
    const { app, repo } = appWith({ perms: [perm({ MODELO_ID: 'M1' })] });
    const r = await post(app, `${url}/add-all`, { un: 'DSI', tipo: 1 });
    expect(r.json()).toEqual({ inseridos: 2 });
    expect(find(repo, { DATA_INICIO: NOW }).map((p) => p.MODELO_ID).sort()).toEqual(['M2', 'M3']);
  });

  it('add-all with an empty "sem" list inserts nothing', async () => {
    const perms = ['M1', 'M2', 'M3'].map((MODELO_ID) => perm({ MODELO_ID }));
    const { app, repo } = appWith({ perms });
    const r = await post(app, `${url}/add-all`, { un: 'DSI', tipo: 1 });
    expect(r.json()).toEqual({ inseridos: 0 });
    expect(repo.snapshot()).toHaveLength(3);
  });

  it.each([
    ['modelos not an array', { un: 'DSI', tipo: 1, modelos: 'M1' }],
    ['tipo missing', { un: 'DSI', modelos: ['M1'] }],
    ['tipo not a number', { un: 'DSI', tipo: 'x', modelos: ['M1'] }],
  ])('%s → 400', async (_what, body) => {
    const { app, repo } = appWith({});
    expect((await post(app, `${url}/add`, body)).statusCode).toBe(400);
    expect(repo.snapshot()).toEqual([]);
  });
});

describe('POST …/por-utilizador/:username/remove and remove-all (BR-PERM-08)', () => {
  const url = '/api/permissoes/por-utilizador/ANA';

  it('sets DATA_FIM = SYSDATE-1 with ACTUALIZADO_POR from the session', async () => {
    const { app, repo } = appWith({ perms: [perm()] });
    const r = await post(app, `${url}/remove`, {
      un: 'DSI',
      tipo: 1,
      linhas: [{ MODELO_ID: 'M1', DATA_INICIO: '2026-01-01T00:00:00' }],
    });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ removidos: 1 });
    expect(repo.snapshot()).toEqual([
      expect.objectContaining({ ...perm({ DATA_FIM: ONTEM }), ACTUALIZADO_POR: 'JOAO', DATA_ACTUALIZACAO: NOW }),
    ]);
  });

  it('a removed model moves from "com" to "sem"', async () => {
    const { app } = appWith({ perms: [perm()] });
    await post(app, `${url}/remove`, { un: 'DSI', tipo: 1, linhas: [{ MODELO_ID: 'M1', DATA_INICIO: '2026-01-01' }] });
    const r = (await app.inject({ url: `${url}?un=DSI&tipo=1` })).json();
    expect(r.com).toEqual([]);
    expect((r.sem as { MODELO_ID: string }[]).map((s) => s.MODELO_ID)).toContain('M1');
  });

  it('a row that no longer exists → 409 REGISTO_ALTERADO and nothing changes', async () => {
    const { app, repo } = appWith({ perms: [perm()] });
    const r = await post(app, `${url}/remove`, {
      un: 'DSI',
      tipo: 1,
      linhas: [
        { MODELO_ID: 'M1', DATA_INICIO: '2026-01-01T00:00:00' },
        { MODELO_ID: 'M2', DATA_INICIO: '2026-01-01T00:00:00' },
      ],
    });
    expect(r.statusCode).toBe(409);
    expect(r.json().code).toBe(REGISTO_ALTERADO);
    expect(repo.snapshot()).toEqual([expect.objectContaining(perm())]);
    expect(repo.snapshot()[0]?.ACTUALIZADO_POR ?? null).toBeNull();
  });

  it('a row of another type is not in scope → 409', async () => {
    const { app } = appWith({ perms: [perm({ TIPO_PERMISSAO_RF: 2 })] });
    const r = await post(app, `${url}/remove`, {
      un: 'DSI',
      tipo: 1,
      linhas: [{ MODELO_ID: 'M1', DATA_INICIO: '2026-01-01T00:00:00' }],
    });
    expect(r.statusCode).toBe(409);
  });

  it('remove-all ends every "com" row and leaves expired rows alone', async () => {
    const expirada = perm({ MODELO_ID: 'M3', DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: '2020-12-31T00:00:00' });
    const { app, repo } = appWith({ perms: [perm({ MODELO_ID: 'M1' }), perm({ MODELO_ID: 'M2' }), expirada] });
    const r = await post(app, `${url}/remove-all`, { un: 'DSI', tipo: 1 });
    expect(r.json()).toEqual({ removidos: 2 });
    expect(find(repo, { DATA_FIM: ONTEM }).map((p) => p.MODELO_ID).sort()).toEqual(['M1', 'M2']);
    expect(find(repo, { MODELO_ID: 'M3' })[0]?.ACTUALIZADO_POR ?? null).toBeNull();
  });

  it('linhas not an array → 400', async () => {
    const { app } = appWith({ perms: [perm()] });
    expect((await post(app, `${url}/remove`, { un: 'DSI', tipo: 1, linhas: 'M1' })).statusCode).toBe(400);
  });
});

describe('POST …/por-modelo/:modeloId/add, add-all, remove, remove-all (BR-PERM-09)', () => {
  const url = '/api/permissoes/por-modelo/M1';

  it('add inserts only users in "sem" (a user of another unit is ignored)', async () => {
    const { app, repo } = appWith({});
    const r = await post(app, `${url}/add`, { un: 'DSI', tipo: 1, utilizadores: ['ANA', 'CARLOS'] });
    expect(r.json()).toEqual({ inseridos: 1 });
    expect(repo.snapshot()).toEqual([
      expect.objectContaining({
        ...perm({ DATA_INICIO: NOW, DATA_FIM: FIM_BULK }),
        CRIADO_POR: 'JOAO',
        DATA_CRIACAO: NOW,
      }),
    ]);
  });

  it('add-all inserts every user of the unit without permission', async () => {
    const { app, repo } = appWith({ perms: [perm({ USERNAME: 'BIA' })] });
    const r = await post(app, `${url}/add-all`, { un: 'DSI', tipo: 1 });
    expect(r.json()).toEqual({ inseridos: 2 });
    expect(find(repo, { DATA_INICIO: NOW }).map((p) => p.USERNAME).sort()).toEqual(['ANA', 'DAVI']);
  });

  it('remove sets DATA_FIM = SYSDATE-1 on the listed users', async () => {
    const { app, repo } = appWith({ perms: [perm({ USERNAME: 'ANA' }), perm({ USERNAME: 'BIA' })] });
    const r = await post(app, `${url}/remove`, {
      un: 'DSI',
      tipo: 1,
      linhas: [{ USERNAME: 'BIA', DATA_INICIO: '2026-01-01T00:00:00' }],
    });
    expect(r.json()).toEqual({ removidos: 1 });
    expect(find(repo, { USERNAME: 'BIA' })[0]).toMatchObject({ DATA_FIM: ONTEM, ACTUALIZADO_POR: 'JOAO' });
    expect(find(repo, { USERNAME: 'ANA' })[0]?.DATA_FIM).toBeNull();
  });

  it('remove of a missing row → 409 and nothing changes', async () => {
    const { app, repo } = appWith({ perms: [perm({ USERNAME: 'ANA' })] });
    const r = await post(app, `${url}/remove`, {
      un: 'DSI',
      tipo: 1,
      linhas: [
        { USERNAME: 'ANA', DATA_INICIO: '2026-01-01T00:00:00' },
        { USERNAME: 'BIA', DATA_INICIO: '2026-01-01T00:00:00' },
      ],
    });
    expect(r.statusCode).toBe(409);
    expect(find(repo, { USERNAME: 'ANA' })[0]?.DATA_FIM).toBeNull();
  });

  it('remove-all ends every "com" row of the model', async () => {
    const { app, repo } = appWith({ perms: [perm({ USERNAME: 'ANA' }), perm({ USERNAME: 'BIA' }), perm({ MODELO_ID: 'M2' })] });
    const r = await post(app, `${url}/remove-all`, { un: 'DSI', tipo: 1 });
    expect(r.json()).toEqual({ removidos: 2 });
    expect(find(repo, { MODELO_ID: 'M2' })[0]?.DATA_FIM).toBeNull();
  });
});

describe('POST /api/permissoes — Nova permissão (BR-PERM-04)', () => {
  const nova = (over: Record<string, unknown> = {}) => ({
    MODELO_ID: 'M1',
    USERNAME: 'ANA',
    UNIDADE_NEGOCIO_RF: 'DSI',
    TIPO_PERMISSAO_RF: 1,
    DATA_INICIO: '2026-10-01T00:00:00',
    DATA_FIM: '2026-12-31T00:00:00',
    ...over,
  });

  it('201 with the inserted row; CRIADO_POR/DATA_CRIACAO from the session and SYSDATE', async () => {
    const { app, repo } = appWith({});
    const r = await post(app, '/api/permissoes', nova());
    expect(r.statusCode).toBe(201);
    expect(r.json()).toMatchObject(nova());
    expect(repo.snapshot()).toEqual([expect.objectContaining({ ...nova(), CRIADO_POR: 'JOAO', DATA_CRIACAO: NOW })]);
  });

  it('DATA_FIM is optional (open-ended)', async () => {
    const { app, repo } = appWith({});
    const semFim: Record<string, unknown> = nova();
    delete semFim['DATA_FIM'];
    expect((await post(app, '/api/permissoes', semFim)).statusCode).toBe(201);
    expect(repo.snapshot()[0]?.DATA_FIM).toBeNull();
  });

  it('a date-only DATA_INICIO is stored at midnight', async () => {
    const { app, repo } = appWith({});
    await post(app, '/api/permissoes', nova({ DATA_INICIO: '2026-10-01', DATA_FIM: null }));
    expect(repo.snapshot()[0]?.DATA_INICIO).toBe('2026-10-01T00:00:00');
  });

  it.each(['MODELO_ID', 'USERNAME', 'UNIDADE_NEGOCIO_RF', 'TIPO_PERMISSAO_RF', 'DATA_INICIO'])(
    'missing %s → 400 OBRIGATORIO',
    async (col) => {
      const { app, repo } = appWith({});
      const body: Record<string, unknown> = nova();
      delete body[col];
      const r = await post(app, '/api/permissoes', body);
      expect(r.statusCode).toBe(400);
      expect(r.json().message).toBe(OBRIGATORIO);
      expect(repo.snapshot()).toEqual([]);
    },
  );

  it.each(['MODELO_ID', 'USERNAME', 'UNIDADE_NEGOCIO_RF', 'DATA_INICIO'])(
    'empty %s → 400 OBRIGATORIO',
    async (col) => {
      const { app } = appWith({});
      const r = await post(app, '/api/permissoes', nova({ [col]: '' }));
      expect(r.statusCode).toBe(400);
      expect(r.json().message).toBe(OBRIGATORIO);
    },
  );

  it.each(['2026-13-45', '2026-02-30', '2026-10-01T25:00:00'])('impossible date %s → 400, never reaches TO_DATE', async (d) => {
    const { app, repo } = appWith({});
    expect((await post(app, '/api/permissoes', nova({ DATA_INICIO: d }))).statusCode).toBe(400);
    expect((await post(app, '/api/permissoes', nova({ DATA_FIM: d }))).statusCode).toBe(400);
    expect(repo.snapshot()).toEqual([]);
  });

  it('TIPO_PERMISSAO_RF not a number → 400', async () => {
    const { app } = appWith({});
    expect((await post(app, '/api/permissoes', nova({ TIPO_PERMISSAO_RF: 'abc' }))).statusCode).toBe(400);
  });

  it('overlap with the same user/model/type/unit → 400 JA_EXISTE and nothing inserted', async () => {
    const existente = perm({ DATA_INICIO: '2026-01-01T00:00:00', DATA_FIM: '2026-10-15T00:00:00' });
    const { app, repo } = appWith({ perms: [existente] });
    const r = await post(app, '/api/permissoes', nova());
    expect(r.statusCode).toBe(400);
    expect(r.json()).toMatchObject({ code: 'VALIDACAO', message: JA_EXISTE });
    expect(plain(repo)).toEqual([existente]);
  });

  it('starting on the existing DATA_FIM overlaps (inclusive) → JA_EXISTE', async () => {
    const { app } = appWith({ perms: [perm({ DATA_FIM: '2026-10-01T00:00:00' })] });
    expect((await post(app, '/api/permissoes', nova())).json().message).toBe(JA_EXISTE);
  });

  it('an open-ended existing row blocks a range years later (9999-12-31 sentinel) → JA_EXISTE', async () => {
    const { app } = appWith({ perms: [perm({ DATA_FIM: null })] });
    const r = await post(app, '/api/permissoes', nova({ DATA_INICIO: '2030-01-01', DATA_FIM: '2030-12-31' }));
    expect(r.json().message).toBe(JA_EXISTE);
  });

  it('starting the day after the existing row ends → 201', async () => {
    const { app } = appWith({ perms: [perm({ DATA_FIM: '2026-09-30T00:00:00' })] });
    expect((await post(app, '/api/permissoes', nova())).statusCode).toBe(201);
  });

  it('an overlapping row of another type does not block → 201', async () => {
    const { app } = appWith({ perms: [perm({ TIPO_PERMISSAO_RF: 2 })] });
    expect((await post(app, '/api/permissoes', nova())).statusCode).toBe(201);
  });

  it('CRIADO_POR in the body never reaches the row', async () => {
    const { app, repo } = appWith({});
    await post(app, '/api/permissoes', nova({ CRIADO_POR: 'HACKER' }));
    expect(repo.snapshot().some((p) => p.CRIADO_POR === 'HACKER')).toBe(false);
  });
});

describe('PUT /api/permissoes — Alterar permissão (BR-PERM-05)', () => {
  const orig = perm({ DATA_INICIO: '2026-01-01T00:00:00', DATA_FIM: '2026-03-31T00:00:00' });
  const outra = perm({ DATA_INICIO: '2026-04-01T00:00:00', DATA_FIM: '2026-06-30T00:00:00' });

  it('updates both dates, stamps ACTUALIZADO_POR/DATA_ACTUALIZACAO and returns the row', async () => {
    const { app, repo } = appWith({ perms: [orig] });
    const values = { DATA_INICIO: '2026-02-01T00:00:00', DATA_FIM: '2026-02-28T00:00:00' };
    const r = await put(app, { orig, values });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ ...orig, ...values });
    expect(repo.snapshot()).toEqual([
      expect.objectContaining({ ...orig, ...values, ACTUALIZADO_POR: 'JOAO', DATA_ACTUALIZACAO: NOW }),
    ]);
  });

  it('date-only values are stored at midnight; DATA_FIM null makes it open-ended', async () => {
    const { app, repo } = appWith({ perms: [orig] });
    await put(app, { orig, values: { DATA_INICIO: '2025-12-01', DATA_FIM: null } });
    expect(repo.snapshot()[0]).toMatchObject({ DATA_INICIO: '2025-12-01T00:00:00', DATA_FIM: null });
  });

  it.each([
    ['empty', { DATA_INICIO: '', DATA_FIM: null }],
    ['missing', { DATA_FIM: null }],
  ])('%s DATA_INICIO → 400 OBRIGATORIO_DATA_INICIO', async (_what, values) => {
    const { app, repo } = appWith({ perms: [orig] });
    const r = await put(app, { orig, values });
    expect(r.statusCode).toBe(400);
    expect(r.json().message).toBe(OBRIGATORIO_DATA_INICIO);
    expect(plain(repo)).toEqual([orig]);
  });

  it('overlap with another row of the same key → 400 SOBREPOE and nothing changes', async () => {
    const { app, repo } = appWith({ perms: [orig, outra] });
    const r = await put(app, { orig, values: { DATA_INICIO: orig.DATA_INICIO, DATA_FIM: '2026-04-01T00:00:00' } });
    expect(r.statusCode).toBe(400);
    expect(r.json()).toMatchObject({ code: 'VALIDACAO', message: SOBREPOE });
    expect(plain(repo)).toEqual([orig, outra]);
  });

  it('overlapping only its own previous range is fine', async () => {
    const { app } = appWith({ perms: [orig, outra] });
    const r = await put(app, { orig, values: { DATA_INICIO: '2025-06-01T00:00:00', DATA_FIM: '2026-03-31T23:59:59' } });
    expect(r.statusCode).toBe(200);
  });

  it('orig DATA_FIM changed meanwhile → 409 REGISTO_ALTERADO and nothing changes', async () => {
    const actual = perm({ ...orig, DATA_FIM: '2026-05-01T00:00:00' });
    const { app, repo } = appWith({ perms: [actual] });
    const r = await put(app, { orig, values: { DATA_INICIO: orig.DATA_INICIO, DATA_FIM: '2026-02-01T00:00:00' } });
    expect(r.statusCode).toBe(409);
    expect(r.json().code).toBe(REGISTO_ALTERADO);
    expect(plain(repo)).toEqual([actual]);
  });

  it('orig row gone → 409 REGISTO_ALTERADO', async () => {
    const { app } = appWith({ perms: [] });
    const r = await put(app, { orig, values: { DATA_INICIO: orig.DATA_INICIO, DATA_FIM: null } });
    expect(r.statusCode).toBe(409);
  });

  it('orig missing → 400', async () => {
    const { app } = appWith({ perms: [orig] });
    expect((await put(app, { values: { DATA_INICIO: '2026-01-01', DATA_FIM: null } })).statusCode).toBe(400);
  });
});

describe('POST /api/permissoes/anular — Retirar Permissão (BR-PERM-06)', () => {
  const orig = perm({ DATA_INICIO: '2026-01-01T00:00:00', DATA_FIM: '2026-12-31T00:00:00' });

  it('sets DATA_FIM = 01/01/1980 on the row, stamps ACTUALIZADO_POR/DATA_ACTUALIZACAO, never deletes', async () => {
    const { app, repo } = appWith({ perms: [orig] });
    const r = await post(app, '/api/permissoes/anular', { orig });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ ...orig, DATA_FIM: '1980-01-01T00:00:00' });
    expect(repo.snapshot()).toEqual([
      expect.objectContaining({
        ...orig,
        DATA_FIM: '1980-01-01T00:00:00',
        ACTUALIZADO_POR: 'JOAO',
        DATA_ACTUALIZACAO: NOW,
      }),
    ]);
  });

  it('an annulled row leaves "com" and its model returns to "sem"', async () => {
    const { app } = appWith({ perms: [orig] });
    await post(app, '/api/permissoes/anular', { orig });
    const r = (await app.inject({ url: '/api/permissoes/por-utilizador/ANA?un=DSI&tipo=1' })).json();
    expect(r.com).toEqual([]);
    expect((r.sem as { MODELO_ID: string }[]).map((s) => s.MODELO_ID)).toContain('M1');
  });

  it('orig DATA_FIM changed meanwhile → 409 REGISTO_ALTERADO and nothing changes', async () => {
    const actual = perm({ ...orig, DATA_FIM: null });
    const { app, repo } = appWith({ perms: [actual] });
    const r = await post(app, '/api/permissoes/anular', { orig });
    expect(r.statusCode).toBe(409);
    expect(r.json().code).toBe(REGISTO_ALTERADO);
    expect(plain(repo)).toEqual([actual]);
  });

  it('orig missing → 400', async () => {
    const { app } = appWith({ perms: [orig] });
    expect((await post(app, '/api/permissoes/anular', {})).statusCode).toBe(400);
  });
});

describe('POST /api/permissoes/copiar-modelo (BR-PERM-10)', () => {
  it('copies non-expired rows not already covered in the target, CRIADO_POR from the session', async () => {
    const { app, repo } = appWith({
      perms: [
        perm({ MODELO_ID: 'M1', USERNAME: 'ANA' }),
        perm({ MODELO_ID: 'M1', USERNAME: 'BIA', DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: '2020-12-31T00:00:00' }),
        perm({ MODELO_ID: 'M1', USERNAME: 'CARLOS', UNIDADE_NEGOCIO_RF: 'DFI' }),
        perm({ MODELO_ID: 'M2', USERNAME: 'CARLOS', UNIDADE_NEGOCIO_RF: 'DFI', DATA_INICIO: '2026-06-01T00:00:00' }),
      ],
    });
    const r = await post(app, '/api/permissoes/copiar-modelo', { MODELO_ID: 'M2', MODELO_ID_COPIAR: 'M1' });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ inseridos: 1 });
    expect(find(repo, { MODELO_ID: 'M2', USERNAME: 'ANA' })).toEqual([
      expect.objectContaining({ ...perm({ MODELO_ID: 'M2' }), CRIADO_POR: 'JOAO', DATA_CRIACAO: NOW }),
    ]);
  });

  it('copying a model onto itself inserts nothing', async () => {
    const { app, repo } = appWith({ perms: [perm()] });
    const r = await post(app, '/api/permissoes/copiar-modelo', { MODELO_ID: 'M1', MODELO_ID_COPIAR: 'M1' });
    expect(r.json()).toEqual({ inseridos: 0 });
    expect(repo.snapshot()).toHaveLength(1);
  });

  it('MODELO_ID_COPIAR missing → 400', async () => {
    const { app } = appWith({});
    expect((await post(app, '/api/permissoes/copiar-modelo', { MODELO_ID: 'M2' })).statusCode).toBe(400);
  });
});

describe('POST /api/permissoes/copiar-utilizador (BR-PERM-11)', () => {
  const body = { USERNAME: 'BIA', UNIDADE_NEGOCIO_RF: 'DFI', USERNAME_COPIAR: 'ANA', UNIDADE_NEGOCIO_RF_COPIAR: 'DSI' };

  it('copies the source user+unit rows onto the target, skipping expired and covered ones', async () => {
    const { app, repo } = appWith({
      perms: [
        perm({ MODELO_ID: 'M1' }),
        perm({ MODELO_ID: 'M2', DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: '2020-12-31T00:00:00' }),
        perm({ MODELO_ID: 'M3' }),
        perm({ MODELO_ID: 'M3', USERNAME: 'BIA', UNIDADE_NEGOCIO_RF: 'DFI', DATA_INICIO: '2026-05-01T00:00:00' }),
      ],
    });
    const r = await post(app, '/api/permissoes/copiar-utilizador', body);
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ inseridos: 1 });
    expect(find(repo, { USERNAME: 'BIA', MODELO_ID: 'M1' })).toEqual([
      expect.objectContaining({
        ...perm({ USERNAME: 'BIA', UNIDADE_NEGOCIO_RF: 'DFI' }),
        CRIADO_POR: 'JOAO',
        DATA_CRIACAO: NOW,
      }),
    ]);
  });

  it('rows of the source user in another unit are not copied', async () => {
    const { app } = appWith({ perms: [perm({ UNIDADE_NEGOCIO_RF: 'DFI' })] });
    const r = await post(app, '/api/permissoes/copiar-utilizador', body);
    expect(r.json()).toEqual({ inseridos: 0 });
  });

  it('UNIDADE_NEGOCIO_RF_COPIAR missing → 400', async () => {
    const { app } = appWith({});
    const rest: Record<string, unknown> = { ...body };
    delete rest['UNIDADE_NEGOCIO_RF_COPIAR'];
    expect((await post(app, '/api/permissoes/copiar-utilizador', rest)).statusCode).toBe(400);
  });
});
