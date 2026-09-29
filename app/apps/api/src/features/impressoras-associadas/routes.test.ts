import Fastify from 'fastify';
import {
  impressorasAssociadasDoc,
  impressorasAssociadasUsr,
  modelosLov,
  utilizadoresLov,
} from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import { memoryStore } from '../dev/memoryStore.ts';
import { registerErrorHandler } from '../../http/errors.ts';
import { registerImpressorasAssociadasRoutes } from './routes.ts';

const DATAS_INCOMPAT =
  'As datas de início e de fim que introduziu são incompatíveis com outra configuração já introduzida.  Por favor, altere as configurações de modo a eliminar a incompatibilidade.';

const docRow = (over: Record<string, unknown> = {}) => ({
  MODELO_ID: 'MOD1',
  AMBIENTE_ID: 'AMB',
  IMPRESSORA_ID: '1',
  DATA_INICIO: '2020-01-01T00:00:00',
  DATA_FIM: '2020-06-30T00:00:00',
  CRIADO_POR: 'MIGRACAO',
  DATA_CRIACAO: '2019-12-01T00:00:00',
  ACTUALIZADO_POR: null,
  DATA_ACTUALIZACAO: null,
  ...over,
});

const usrRow = (over: Record<string, unknown> = {}) => ({
  MODELO_ID: 'MOD1',
  CDEMPLEA: 'USER1',
  IMPRESSORA_ID: '1',
  DATA_INICIO: '2020-01-01T00:00:00',
  DATA_FIM: '2020-06-30T00:00:00',
  CRIADO_POR: 'MIGRACAO',
  DATA_CRIACAO: '2019-12-01T00:00:00',
  ACTUALIZADO_POR: null,
  DATA_ACTUALIZACAO: null,
  ...over,
});

function appWith(opts: {
  doc?: Record<string, unknown>[];
  usr?: Record<string, unknown>[];
  modelos?: Record<string, unknown>[];
  utilizadores?: Record<string, unknown>[];
  role?: 'ADM' | 'USER';
}) {
  const app = Fastify();
  registerErrorHandler(app);
  app.decorateRequest('session', null as never);
  app.addHook('onRequest', async (req) => {
    (req as { session: unknown }).session = {
      user: { username: 'JOAO', role: opts.role ?? 'ADM' },
    };
  });
  registerImpressorasAssociadasRoutes(app, {
    docStore: memoryStore(impressorasAssociadasDoc, opts.doc ?? [], {
      dedupeKeys: ['MODELO_ID', 'IMPRESSORA_ID'],
    }),
    usrStore: memoryStore(impressorasAssociadasUsr, opts.usr ?? [], {
      dedupeKeys: ['MODELO_ID', 'CDEMPLEA', 'IMPRESSORA_ID'],
    }),
    modelosStore: memoryStore(modelosLov, opts.modelos ?? [{ ID: 'MOD1' }, { ID: 'MOD2' }]),
    utilizadoresStore: memoryStore(
      utilizadoresLov,
      opts.utilizadores ?? [{ CDIDUSR: 'USER1' }, { CDIDUSR: 'USER2' }],
    ),
    ambiente: 'AMB',
  });
  return app;
}

const post = (app: ReturnType<typeof appWith>, path: string, values: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: path, payload: { values } });

async function currentRow(app: ReturnType<typeof appWith>, path: string, matches: (r: Record<string, unknown>) => boolean) {
  const rows = (await app.inject({ url: path })).json().rows as Record<string, unknown>[];
  return rows.find(matches)!;
}

describe('modelos-lov / utilizadores-lov', () => {
  it('GET lists model ids', async () => {
    const app = appWith({});
    await app.ready();
    const r = await app.inject({ url: '/api/modelos-lov' });
    expect(r.statusCode).toBe(200);
    expect(r.json().rows).toMatchObject([{ ID: 'MOD1' }, { ID: 'MOD2' }]);
  });

  it('GET lists user ids', async () => {
    const app = appWith({});
    await app.ready();
    const r = await app.inject({ url: '/api/utilizadores-lov' });
    expect(r.statusCode).toBe(200);
    expect(r.json().rows).toMatchObject([{ CDIDUSR: 'USER1' }, { CDIDUSR: 'USER2' }]);
  });

  it('is read-only: no POST route is registered', async () => {
    const app = appWith({});
    await app.ready();
    const r = await app.inject({ method: 'POST', url: '/api/modelos-lov', payload: { values: { ID: 'X' } } });
    expect(r.statusCode).toBe(404);
  });
});

describe('impressoras-associadas-doc routes', () => {
  it('GET lists rows', async () => {
    const app = appWith({ doc: [docRow()] });
    await app.ready();
    const r = await app.inject({ url: '/api/impressoras-associadas-doc' });
    expect(r.statusCode).toBe(200);
    expect(r.json().rows).toMatchObject([{ MODELO_ID: 'MOD1' }]);
  });

  it('POST sets AMBIENTE_ID from the boot config and stamps CRIADO_POR/DATA_CRIACAO', async () => {
    const app = appWith({});
    await app.ready();
    const r = await post(app, '/api/impressoras-associadas-doc', {
      MODELO_ID: 'MOD1',
      IMPRESSORA_ID: '1',
      DATA_INICIO: '2021-01-01T00:00:00',
      DATA_FIM: '2021-12-31T00:00:00',
    });
    expect(r.statusCode).toBe(201);
    expect(r.json()).toMatchObject({ AMBIENTE_ID: 'AMB', CRIADO_POR: 'JOAO', MODELO_ID: 'MOD1' });
    expect(r.json().DATA_CRIACAO).toBeTruthy();
  });

  it('POST rejects a client-supplied AMBIENTE_ID (server-set only)', async () => {
    const app = appWith({});
    await app.ready();
    const r = await post(app, '/api/impressoras-associadas-doc', {
      MODELO_ID: 'MOD1',
      AMBIENTE_ID: 'OUTRO',
      IMPRESSORA_ID: '1',
      DATA_INICIO: '2021-01-01T00:00:00',
    });
    expect(r.statusCode).toBe(400);
  });

  it('POST succeeds with DATA_INICIO after DATA_FIM when the scope has zero existing rows (legacy quirk: the date-order check lives inside the cursor loop)', async () => {
    const app = appWith({ doc: [] });
    await app.ready();
    const r = await post(app, '/api/impressoras-associadas-doc', {
      MODELO_ID: 'MOD1',
      IMPRESSORA_ID: '1',
      DATA_INICIO: '2021-12-31T00:00:00',
      DATA_FIM: '2021-01-01T00:00:00',
    });
    expect(r.statusCode).toBe(201);
  });

  it('POST rejects an overlapping range in the same MODELO_ID scope with the exact alert text', async () => {
    const app = appWith({
      doc: [docRow({ DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: '2020-06-30T00:00:00' })],
    });
    await app.ready();
    const r = await post(app, '/api/impressoras-associadas-doc', {
      MODELO_ID: 'MOD1',
      IMPRESSORA_ID: '2',
      DATA_INICIO: '2020-06-01T00:00:00',
      DATA_FIM: '2020-12-31T00:00:00',
    });
    expect(r.statusCode).toBe(400);
    expect(r.json().message).toBe(DATAS_INCOMPAT);
    expect(r.json().fields).toMatchObject({ 'values.DATA_FIM': DATAS_INCOMPAT });
  });

  it('POST accepts a non-overlapping range right after an existing one ends', async () => {
    const app = appWith({
      doc: [docRow({ DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: '2020-06-30T00:00:00' })],
    });
    await app.ready();
    const r = await post(app, '/api/impressoras-associadas-doc', {
      MODELO_ID: 'MOD1',
      IMPRESSORA_ID: '2',
      DATA_INICIO: '2020-07-01T00:00:00',
      DATA_FIM: '2020-12-31T00:00:00',
    });
    expect(r.statusCode).toBe(201);
  });

  it('POST ignores rows of a different MODELO_ID scope', async () => {
    const app = appWith({
      doc: [docRow({ MODELO_ID: 'MOD2', DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: null })],
    });
    await app.ready();
    const r = await post(app, '/api/impressoras-associadas-doc', {
      MODELO_ID: 'MOD1',
      IMPRESSORA_ID: '1',
      DATA_INICIO: '2020-03-01T00:00:00',
      DATA_FIM: '2020-06-30T00:00:00',
    });
    expect(r.statusCode).toBe(201);
  });

  it('PUT (Alterar Validade) rejects an overlap with another row in scope', async () => {
    const app = appWith({
      doc: [
        docRow({ IMPRESSORA_ID: '1', DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: '2020-03-31T00:00:00' }),
        docRow({ IMPRESSORA_ID: '2', DATA_INICIO: '2020-04-01T00:00:00', DATA_FIM: '2020-06-30T00:00:00' }),
      ],
    });
    await app.ready();
    const row = await currentRow(app, '/api/impressoras-associadas-doc', (r) => r['IMPRESSORA_ID'] === '1');
    const { _rid, ...orig } = row;
    const r = await app.inject({
      method: 'PUT',
      url: `/api/impressoras-associadas-doc/${_rid}`,
      payload: { orig, values: { DATA_FIM: '2020-04-15T00:00:00' } },
    });
    expect(r.statusCode).toBe(400);
    expect(r.json().message).toBe(DATAS_INCOMPAT);
  });

  it('PUT succeeds when the only overlap is with the row\'s own previous boundary dates (excluded from the check)', async () => {
    const app = appWith({
      doc: [docRow({ IMPRESSORA_ID: '1', DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: '2020-06-30T00:00:00' })],
    });
    await app.ready();
    const row = await currentRow(app, '/api/impressoras-associadas-doc', (r) => r['IMPRESSORA_ID'] === '1');
    const { _rid, ...orig } = row;
    const r = await app.inject({
      method: 'PUT',
      url: `/api/impressoras-associadas-doc/${_rid}`,
      payload: { orig, values: { DATA_FIM: '2020-08-31T00:00:00' } },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ DATA_FIM: '2020-08-31T00:00:00', ACTUALIZADO_POR: 'JOAO' });
  });

  it('PUT boundary-exclusion quirk: a row matching either previous boundary date is excluded from the check, not just the exact edited row', async () => {
    // Row A (being edited) currently DATA_INICIO=2020-01-01 DATA_FIM=2020-03-31.
    // Row B shares A's *previous* DATA_FIM boundary (2020-03-31) even though it is a different
    // row entirely (different IMPRESSORA_ID) — the legacy cursor excludes it too (De Morgan on
    // "data_inicio != anterior_ini AND data_fim != anterior_fim"), so it must NOT block the PUT.
    const app = appWith({
      doc: [
        docRow({ IMPRESSORA_ID: '1', DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: '2020-03-31T00:00:00' }),
        docRow({ IMPRESSORA_ID: '2', DATA_INICIO: '2020-09-01T00:00:00', DATA_FIM: '2020-03-31T00:00:00' }),
      ],
    });
    await app.ready();
    const row = await currentRow(app, '/api/impressoras-associadas-doc', (r) => r['IMPRESSORA_ID'] === '1');
    const { _rid, ...orig } = row;
    const r = await app.inject({
      method: 'PUT',
      url: `/api/impressoras-associadas-doc/${_rid}`,
      payload: { orig, values: { DATA_INICIO: '2020-02-01T00:00:00', DATA_FIM: '2020-08-31T00:00:00' } },
    });
    expect(r.statusCode).toBe(200);
  });

  it('POST /anular sets both dates to 1980-01-01 and bypasses the overlap check entirely', async () => {
    const app = appWith({
      doc: [
        docRow({ IMPRESSORA_ID: '1', DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: '2020-06-30T00:00:00' }),
        // Overlaps what row 1 would become if annulled to 1980-01-01 in the normal sense — but
        // anular must never run verificar_datas_*, so this must not block it.
        docRow({ IMPRESSORA_ID: '2', DATA_INICIO: '1980-01-01T00:00:00', DATA_FIM: '1980-01-01T00:00:00' }),
      ],
    });
    await app.ready();
    const row = await currentRow(app, '/api/impressoras-associadas-doc', (r) => r['IMPRESSORA_ID'] === '1');
    const { _rid, ...orig } = row;
    const r = await app.inject({
      method: 'POST',
      url: `/api/impressoras-associadas-doc/${_rid}/anular`,
      payload: { orig },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({
      DATA_INICIO: '1980-01-01T00:00:00',
      DATA_FIM: '1980-01-01T00:00:00',
      ACTUALIZADO_POR: 'JOAO',
    });
  });

  it('USER cannot write', async () => {
    const app = appWith({ role: 'USER' });
    await app.ready();
    const r = await post(app, '/api/impressoras-associadas-doc', {
      MODELO_ID: 'MOD1',
      IMPRESSORA_ID: '1',
      DATA_INICIO: '2021-01-01T00:00:00',
    });
    expect(r.statusCode).toBe(403);
  });
});

describe('impressoras-associadas-usr routes', () => {
  it('GET lists rows', async () => {
    const app = appWith({ usr: [usrRow()] });
    await app.ready();
    const r = await app.inject({ url: '/api/impressoras-associadas-usr' });
    expect(r.statusCode).toBe(200);
    expect(r.json().rows).toMatchObject([{ MODELO_ID: 'MOD1', CDEMPLEA: 'USER1' }]);
  });

  it('POST has no AMBIENTE_ID column and stamps CRIADO_POR', async () => {
    const app = appWith({});
    await app.ready();
    const r = await post(app, '/api/impressoras-associadas-usr', {
      MODELO_ID: 'MOD1',
      CDEMPLEA: 'USER1',
      IMPRESSORA_ID: '1',
      DATA_INICIO: '2021-01-01T00:00:00',
    });
    expect(r.statusCode).toBe(201);
    expect(r.json()).toMatchObject({ CRIADO_POR: 'JOAO', MODELO_ID: 'MOD1', CDEMPLEA: 'USER1' });
    expect(r.json()).not.toHaveProperty('AMBIENTE_ID');
  });

  it('the scope is MODELO_ID + CDEMPLEA: an overlap for a different user in the same model is allowed', async () => {
    const app = appWith({
      usr: [usrRow({ CDEMPLEA: 'USER1', DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: '2020-06-30T00:00:00' })],
    });
    await app.ready();
    const r = await post(app, '/api/impressoras-associadas-usr', {
      MODELO_ID: 'MOD1',
      CDEMPLEA: 'USER2',
      IMPRESSORA_ID: '1',
      DATA_INICIO: '2020-02-01T00:00:00',
      DATA_FIM: '2020-05-31T00:00:00',
    });
    expect(r.statusCode).toBe(201);
  });

  it('rejects an overlap for the same MODELO_ID + CDEMPLEA scope with the exact alert text', async () => {
    const app = appWith({
      usr: [usrRow({ DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: '2020-06-30T00:00:00' })],
    });
    await app.ready();
    const r = await post(app, '/api/impressoras-associadas-usr', {
      MODELO_ID: 'MOD1',
      CDEMPLEA: 'USER1',
      IMPRESSORA_ID: '2',
      DATA_INICIO: '2020-06-15T00:00:00',
      DATA_FIM: '2020-12-31T00:00:00',
    });
    expect(r.statusCode).toBe(400);
    expect(r.json().message).toBe(DATAS_INCOMPAT);
  });

  it('POST /anular includes the user in the confirm-relevant lookup fields and stamps audit', async () => {
    const app = appWith({ usr: [usrRow({ IMPRESSORA_ID: '1' })] });
    await app.ready();
    const row = await currentRow(app, '/api/impressoras-associadas-usr', (r) => r['IMPRESSORA_ID'] === '1');
    const { _rid, ...orig } = row;
    const r = await app.inject({
      method: 'POST',
      url: `/api/impressoras-associadas-usr/${_rid}/anular`,
      payload: { orig },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ DATA_INICIO: '1980-01-01T00:00:00', DATA_FIM: '1980-01-01T00:00:00' });
  });

  describe('copiar-modelo', () => {
    it('copies non-expired rows of the source model into the target model, keyed by (cdemplea, data_inicio)', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const future = `${Number(today.slice(0, 4)) + 1}-01-01T00:00:00`;
      const past = '2000-01-01T00:00:00';
      const app = appWith({
        usr: [
          usrRow({ MODELO_ID: 'SRC', CDEMPLEA: 'USER1', IMPRESSORA_ID: '1', DATA_INICIO: '2021-01-01T00:00:00', DATA_FIM: future }),
          usrRow({ MODELO_ID: 'SRC', CDEMPLEA: 'USER2', IMPRESSORA_ID: '2', DATA_INICIO: '2021-02-01T00:00:00', DATA_FIM: null }),
          // expired: must not be copied
          usrRow({ MODELO_ID: 'SRC', CDEMPLEA: 'USER1', IMPRESSORA_ID: '3', DATA_INICIO: past, DATA_FIM: past }),
          // already present in the target model for (USER1, 2021-01-01): must be skipped
          usrRow({ MODELO_ID: 'MOD1', CDEMPLEA: 'USER1', IMPRESSORA_ID: '9', DATA_INICIO: '2021-01-01T00:00:00', DATA_FIM: null }),
        ],
      });
      await app.ready();
      const r = await app.inject({
        method: 'POST',
        url: '/api/impressoras-associadas-usr/copiar-modelo',
        payload: { MODELO_ID: 'MOD1', MODELO_ID_COPIAR: 'SRC' },
      });
      expect(r.statusCode).toBe(200);

      const list = (await app.inject({ url: '/api/impressoras-associadas-usr?size=200' })).json()
        .rows as Record<string, unknown>[];
      const copied = list.filter((row) => row['MODELO_ID'] === 'MOD1' && row['CDEMPLEA'] === 'USER2');
      expect(copied).toHaveLength(1);
      expect(copied[0]).toMatchObject({ IMPRESSORA_ID: '2', CRIADO_POR: 'JOAO' });
      // USER1/2021-01-01 already existed in the target -> not duplicated.
      expect(list.filter((row) => row['MODELO_ID'] === 'MOD1' && row['CDEMPLEA'] === 'USER1')).toHaveLength(1);
    });
  });

  describe('copiar-utilizador', () => {
    it('copies non-expired rows of the source user into the target user, keyed by (modelo_id, data_inicio)', async () => {
      const future = `${Number(new Date().toISOString().slice(0, 4)) + 1}-01-01T00:00:00`;
      const app = appWith({
        usr: [
          usrRow({ MODELO_ID: 'MOD1', CDEMPLEA: 'USER1', IMPRESSORA_ID: '1', DATA_INICIO: '2021-01-01T00:00:00', DATA_FIM: future }),
          usrRow({ MODELO_ID: 'MOD2', CDEMPLEA: 'USER1', IMPRESSORA_ID: '2', DATA_INICIO: '2021-02-01T00:00:00', DATA_FIM: null }),
          // already present for the target user under MOD1/2021-01-01 -> skipped
          usrRow({ MODELO_ID: 'MOD1', CDEMPLEA: 'USER2', IMPRESSORA_ID: '9', DATA_INICIO: '2021-01-01T00:00:00', DATA_FIM: null }),
        ],
      });
      await app.ready();
      const r = await app.inject({
        method: 'POST',
        url: '/api/impressoras-associadas-usr/copiar-utilizador',
        payload: { CDEMPLEA: 'USER2', CDEMPLEA_COPIAR: 'USER1' },
      });
      expect(r.statusCode).toBe(200);

      const list = (await app.inject({ url: '/api/impressoras-associadas-usr?size=200' })).json()
        .rows as Record<string, unknown>[];
      const copied = list.filter((row) => row['CDEMPLEA'] === 'USER2' && row['MODELO_ID'] === 'MOD2');
      expect(copied).toHaveLength(1);
      expect(copied[0]).toMatchObject({ IMPRESSORA_ID: '2' });
      expect(list.filter((row) => row['CDEMPLEA'] === 'USER2' && row['MODELO_ID'] === 'MOD1')).toHaveLength(1);
    });
  });
});
