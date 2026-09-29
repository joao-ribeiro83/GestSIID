import Fastify from 'fastify';
import { reports, reportParametros } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import { memoryStore } from '../dev/memoryStore.ts';
import { registerErrorHandler } from '../../http/errors.ts';
import { registerReportsCrudRoutes } from './routes.ts';

const report = (ID: number, over: Record<string, unknown> = {}) => ({
  ID,
  NOME: `Report ${ID}`,
  N_PARAMETROS: 3,
  VALIDO: 'S',
  NOME_FICHEIRO: null,
  DIRECTORIA_BASE: null,
  DIRECTORIA_DESTINO: null,
  OBSERVACAO: null,
  CRIADO_POR: 'MIGRACAO',
  DATA_CRIACAO: '2010-02-15T00:00:00',
  ACTUALIZADO_POR: null,
  DATA_ACTUALIZACAO: null,
  ...over,
});

const parametro = (
  REPORT_ID: number,
  N_PARAMETRO: number,
  NOME: string,
  over: Record<string, unknown> = {},
) => ({
  REPORT_ID,
  N_PARAMETRO,
  NOME,
  TIPO_PARAMETRO_RF: '1',
  OBRIGATORIO: 'N',
  CHECK_UNIQUE: 'N',
  VALIDO: 'S',
  DESCRICAO: null,
  CRIADO_POR: 'MIGRACAO',
  DATA_CRIACAO: '2010-02-15T00:00:00',
  ACTUALIZADO_POR: null,
  DATA_ACTUALIZACAO: null,
  ...over,
});

function appWith(rep: Record<string, unknown>[], par: Record<string, unknown>[]) {
  const app = Fastify();
  registerErrorHandler(app);
  app.decorateRequest('session', null as never);
  app.addHook('onRequest', async (req) => {
    (req as { session: unknown }).session = { user: { username: 'JOAO', role: 'ADM' } };
  });
  registerReportsCrudRoutes(app, {
    store: memoryStore(reports, rep, { autoId: 'ID' }),
    parametrosStore: memoryStore(reportParametros, par),
  });
  return app;
}

const post = (app: ReturnType<typeof appWith>, path: string, values: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: path, payload: { values } });

async function currentRow(app: ReturnType<typeof appWith>, path: string, key: string, value: unknown) {
  const rows = (await app.inject({ url: path })).json().rows as Record<string, unknown>[];
  return rows.find((r) => r[key] === value)!;
}

describe('reports routes (master)', () => {
  it('GET lists the reports', async () => {
    const app = appWith([report(1)], []);
    await app.ready();
    const r = await app.inject({ url: '/api/reports' });
    expect(r.statusCode).toBe(200);
    expect(r.json().rows).toMatchObject([{ ID: 1 }]);
  });

  it('POST assigns the sequence id and stamps CRIADO_POR/DATA_CRIACAO', async () => {
    const app = appWith([], []);
    await app.ready();
    const r = await post(app, '/api/reports', { NOME: 'Novo relatório', VALIDO: 'S' });
    expect(r.statusCode).toBe(201);
    expect(r.json()).toMatchObject({ NOME: 'Novo relatório', CRIADO_POR: 'JOAO' });
    expect(r.json().ID).not.toBeNull();
    expect(r.json().DATA_CRIACAO).toBeTruthy();
  });

  it('POST seeds the 3 fixed parameters (_USER, P_USUARIO, P_DATAACTUAL) on the new report', async () => {
    const app = appWith([], []);
    await app.ready();
    const created = (await post(app, '/api/reports', { NOME: 'Novo', VALIDO: 'S' })).json();

    const list = await app.inject({ url: `/api/reports/${created.ID}/parametros` });
    const rows = list.json().rows as Record<string, unknown>[];
    expect(rows).toMatchObject([
      { N_PARAMETRO: 1, NOME: '_USER', TIPO_PARAMETRO_RF: '2', OBRIGATORIO: 'S' },
      { N_PARAMETRO: 2, NOME: 'P_USUARIO', TIPO_PARAMETRO_RF: '1', OBRIGATORIO: 'S' },
      { N_PARAMETRO: 3, NOME: 'P_DATAACTUAL', TIPO_PARAMETRO_RF: '1', OBRIGATORIO: 'N' },
    ]);
  });

  it('a second report seeds its own 1/2/3 without clashing with the first report\'s', async () => {
    const app = appWith([], []);
    await app.ready();
    const a = (await post(app, '/api/reports', { NOME: 'A', VALIDO: 'S' })).json();
    const b = (await post(app, '/api/reports', { NOME: 'B', VALIDO: 'S' })).json();

    const listB = await app.inject({ url: `/api/reports/${b.ID}/parametros` });
    expect(listB.json().rows.map((r: { NOME: string }) => r.NOME)).toEqual([
      '_USER',
      'P_USUARIO',
      'P_DATAACTUAL',
    ]);
    expect(a.ID).not.toBe(b.ID);
  });

  it('PUT is refused when N_PARAMETROS does not match the number of parameter rows', async () => {
    const app = appWith(
      [report(1, { N_PARAMETROS: 3 })],
      [
        parametro(1, 1, '_USER'),
        parametro(1, 2, 'P_USUARIO'),
        parametro(1, 3, 'P_DATAACTUAL'),
        parametro(1, 4, 'P_EXTRA'),
      ],
    );
    await app.ready();
    const { _rid, ...orig } = await currentRow(app, '/api/reports', 'ID', 1);
    const r = await app.inject({
      method: 'PUT',
      url: `/api/reports/${_rid}`,
      payload: { orig, values: { OBSERVACAO: 'x' } },
    });
    expect(r.statusCode).toBe(400);
    expect(r.json().message).toMatch(/número de parâmetros inseridos/);
  });

  it('PUT is refused when N_PARAMETROS is null and there are parameter rows', async () => {
    const app = appWith(
      [report(1, { N_PARAMETROS: null })],
      [parametro(1, 1, '_USER'), parametro(1, 2, 'P_USUARIO'), parametro(1, 3, 'P_DATAACTUAL')],
    );
    await app.ready();
    const { _rid, ...orig } = await currentRow(app, '/api/reports', 'ID', 1);
    const r = await app.inject({
      method: 'PUT',
      url: `/api/reports/${_rid}`,
      payload: { orig, values: { OBSERVACAO: 'x' } },
    });
    expect(r.statusCode).toBe(400);
    expect(r.json().fields).toMatchObject({ 'values.N_PARAMETROS': expect.any(String) });
  });

  it('PUT succeeds when N_PARAMETROS matches the parameter row count', async () => {
    const app = appWith(
      [report(1, { N_PARAMETROS: 3 })],
      [parametro(1, 1, '_USER'), parametro(1, 2, 'P_USUARIO'), parametro(1, 3, 'P_DATAACTUAL')],
    );
    await app.ready();
    const { _rid, ...orig } = await currentRow(app, '/api/reports', 'ID', 1);
    const r = await app.inject({
      method: 'PUT',
      url: `/api/reports/${_rid}`,
      payload: { orig, values: { OBSERVACAO: 'x' } },
    });
    expect(r.statusCode).toBe(200);
  });

  it('PUT that also changes N_PARAMETROS to the correct new count succeeds', async () => {
    const app = appWith(
      [report(1, { N_PARAMETROS: 3 })],
      [parametro(1, 1, '_USER'), parametro(1, 2, 'P_USUARIO'), parametro(1, 3, 'P_DATAACTUAL'), parametro(1, 4, 'X')],
    );
    await app.ready();
    const { _rid, ...orig } = await currentRow(app, '/api/reports', 'ID', 1);
    const r = await app.inject({
      method: 'PUT',
      url: `/api/reports/${_rid}`,
      payload: { orig, values: { N_PARAMETROS: 4 } },
    });
    expect(r.statusCode).toBe(200);
  });

  it('DELETE is refused while the report still has parameter rows', async () => {
    const app = appWith([report(1)], [parametro(1, 1, '_USER')]);
    await app.ready();
    const { _rid, ...orig } = await currentRow(app, '/api/reports', 'ID', 1);
    const r = await app.inject({ method: 'DELETE', url: `/api/reports/${_rid}`, payload: { orig } });
    expect(r.statusCode).toBe(409);
    expect(r.json().message).toMatch(/registo mestre/);
  });

  it('DELETE succeeds once the report has no parameter rows', async () => {
    const app = appWith([report(9)], []);
    await app.ready();
    const { _rid, ...orig } = await currentRow(app, '/api/reports', 'ID', 9);
    const r = await app.inject({ method: 'DELETE', url: `/api/reports/${_rid}`, payload: { orig } });
    expect(r.statusCode).toBe(204);
  });
});

describe('report-parametros routes (detail)', () => {
  it('GET lists only the rows of the given report, ordered by N_PARAMETRO', async () => {
    const app = appWith(
      [report(1)],
      [parametro(1, 2, 'B'), parametro(1, 1, 'A'), parametro(2, 1, 'OUTRO')],
    );
    await app.ready();
    const r = await app.inject({ url: '/api/reports/1/parametros' });
    expect(r.statusCode).toBe(200);
    expect(r.json().rows.map((row: { NOME: string }) => row.NOME)).toEqual(['A', 'B']);
  });

  it('POST binds REPORT_ID from the URL and auto-assigns N_PARAMETRO as MAX+1', async () => {
    const app = appWith([report(1)], [parametro(1, 1, '_USER'), parametro(1, 2, 'P_USUARIO')]);
    await app.ready();
    const r = await post(app, '/api/reports/1/parametros', {
      NOME: 'NOVO_PARAM',
      TIPO_PARAMETRO_RF: '1',
      OBRIGATORIO: 'N',
      CHECK_UNIQUE: 'N',
      VALIDO: 'S',
    });
    expect(r.statusCode).toBe(201);
    expect(r.json()).toMatchObject({ REPORT_ID: 1, N_PARAMETRO: 3, NOME: 'NOVO_PARAM' });
  });

  it('the first parameter of an empty report gets N_PARAMETRO 1', async () => {
    const app = appWith([report(1)], []);
    await app.ready();
    const r = await post(app, '/api/reports/1/parametros', { NOME: 'X' });
    expect(r.json()).toMatchObject({ N_PARAMETRO: 1 });
  });

  it.each([
    [1, '_USER', "O 1º parâmetro é obrigatório ser '_USER'."],
    [2, 'P_USUARIO', "O 2º parâmetro é obrigatório ser 'P_USUARIO'."],
    [3, 'P_DATAACTUAL', "O 3º parâmetro é obrigatório ser 'P_DATAACTUAL'."],
  ])('PUT rejects renaming fixed parameter %i away from %s', async (n, fixedName, message) => {
    const app = appWith([report(1)], [parametro(1, n as number, fixedName as string)]);
    await app.ready();
    const { _rid, ...orig } = await currentRow(app, '/api/reports/1/parametros', 'N_PARAMETRO', n);
    const r = await app.inject({
      method: 'PUT',
      url: `/api/reports/1/parametros/${_rid}`,
      payload: { orig, values: { NOME: 'OUTRO_NOME' } },
    });
    expect(r.statusCode).toBe(400);
    expect(r.json().message).toBe(message);
    expect(r.json().fields).toMatchObject({ 'values.NOME': message });
  });

  it('PUT allows renaming a parameter that is not one of the 3 fixed ones', async () => {
    const app = appWith([report(1)], [parametro(1, 4, 'P_EXTRA')]);
    await app.ready();
    const { _rid, ...orig } = await currentRow(app, '/api/reports/1/parametros', 'N_PARAMETRO', 4);
    const r = await app.inject({
      method: 'PUT',
      url: `/api/reports/1/parametros/${_rid}`,
      payload: { orig, values: { NOME: 'OUTRO_NOME' } },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json().NOME).toBe('OUTRO_NOME');
  });

  it('PUT stamps ACTUALIZADO_POR/DATA_ACTUALIZACAO', async () => {
    const app = appWith([report(1)], [parametro(1, 4, 'P_EXTRA')]);
    await app.ready();
    const { _rid, ...orig } = await currentRow(app, '/api/reports/1/parametros', 'N_PARAMETRO', 4);
    const r = await app.inject({
      method: 'PUT',
      url: `/api/reports/1/parametros/${_rid}`,
      payload: { orig, values: { DESCRICAO: 'x' } },
    });
    expect(r.json()).toMatchObject({ ACTUALIZADO_POR: 'JOAO' });
    expect(r.json().DATA_ACTUALIZACAO).toBeTruthy();
  });
});
