import Fastify from 'fastify';
import { utilizadores } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import { SqlCall, type CrudStore, type Values } from '../../lib/crud.ts';
import { memoryStore } from '../dev/memoryStore.ts';
import { registerErrorHandler } from '../../http/errors.ts';
import { registerUtilizadoresRoutes } from './routes.ts';

const ana = {
  USERNAME: 'ANA',
  NOME: 'ANA SILVA',
  PASSWORD: 'HASH-DA-ANA',
  AMBIENTE_ID: 'GADOR_TESTES',
  UNIDADE_NEGOCIO_RF: 'DSI',
  TIPO_UTILIZADOR_RF: 'ADM',
  DATA_INICIO: '2020-01-01T00:00:00',
  DATA_FIM: '2030-12-31T00:00:00',
  NIVEL_ACESSO_RF: 0,
  CRIADO_POR: 'MIGRACAO',
  DATA_CRIACAO: '2010-10-07T12:02:28',
  ACTUALIZADO_POR: null,
  DATA_ACTUALIZACAO: null,
};

async function appWith(role: 'ADM' | 'USER' | null) {
  const app = Fastify();
  registerErrorHandler(app);
  app.decorateRequest('session', null as never);
  app.addHook('onRequest', async (req) => {
    (req as { session: unknown }).session = { user: role ? { username: 'JOAO', role } : undefined };
  });
  // What reaches the store is what would reach Oracle: record it.
  const inner = memoryStore(utilizadores, [ana]);
  const written: Values[] = [];
  const store: CrudStore = {
    ...inner,
    insert: (v, p, c) => (written.push(v), inner.insert(v, p, c)),
    update: (r, o, v, c) => (written.push(v), inner.update(r, o, v, c)),
  };
  registerUtilizadoresRoutes(app, { store, ambiente: 'GADOR_TESTES' });
  await app.ready();
  return { app, written };
}
type App = Awaited<ReturnType<typeof appWith>>['app'];

const novo = {
  USERNAME: 'bia',
  NOME: 'Bia Costa',
  PASSWORD: 's3gredo',
  UNIDADE_NEGOCIO_RF: 'DSI',
  TIPO_UTILIZADOR_RF: 'ADM',
  DATA_INICIO: '2026-01-01T00:00:00',
};
const post = (app: App, values: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: '/api/utilizadores', payload: { values } });
const put = async (app: App, id: string, values: Record<string, unknown>, orig = {}) => {
  const row = (await app.inject({ url: `/api/utilizadores?f[USERNAME]=${id}` })).json().rows[0];
  return app.inject({
    method: 'PUT',
    url: `/api/utilizadores/${row._rid}`,
    payload: { orig: { USERNAME: row.USERNAME, ...orig }, values },
  });
};

describe('utilizadores routes — the password is write-only', () => {
  it('GET list and GET one never carry PASSWORD', async () => {
    const { app } = await appWith('ADM');
    const list = await app.inject({ url: '/api/utilizadores' });
    expect(list.statusCode).toBe(200);
    expect(list.json().rows).toHaveLength(1);
    expect(list.json().rows[0]).toMatchObject({ USERNAME: 'ANA', NOME: 'ANA SILVA' });
    expect(list.body).not.toContain('PASSWORD');
    expect(list.body).not.toContain('HASH-DA-ANA');
    const one = await app.inject({ url: `/api/utilizadores/${list.json().rows[0]._rid}` });
    expect(one.body).not.toContain('PASSWORD');
  });

  it('POST hands the store USER_SECURITY.ENCRYPT(password) as a SQL call, never the plain text as a value', async () => {
    const { app, written } = await appWith('ADM');
    const r = await post(app, novo);
    expect(r.statusCode).toBe(201);
    expect(r.body).not.toContain('PASSWORD');
    expect(r.body).not.toContain('s3gredo');
    const pw = written[0]?.['PASSWORD'];
    expect(pw).toBeInstanceOf(SqlCall);
    expect((pw as SqlCall).template).toBe('RAWTOHEX(USER_SECURITY.ENCRYPT(?))');
    expect((pw as SqlCall).arg).toBe('s3gredo');
  });

  it('PUT with a PASSWORD re-encrypts it; PUT without one leaves the stored value alone', async () => {
    const { app, written } = await appWith('ADM');
    await put(app, 'ANA', { TIPO_UTILIZADOR_RF: 'ADM' });
    expect(written[0]).not.toHaveProperty('PASSWORD');
    await put(app, 'ANA', { PASSWORD: 'nova' });
    expect(written[1]?.['PASSWORD']).toBeInstanceOf(SqlCall);
    expect((written[1]?.['PASSWORD'] as SqlCall).arg).toBe('nova');
  });

  it('an empty or over-long PASSWORD is a 400 (48 characters = 96 hex digits fit the VARCHAR2(100))', async () => {
    const { app } = await appWith('ADM');
    expect((await post(app, { ...novo, PASSWORD: '' })).statusCode).toBe(400);
    const long = await post(app, { ...novo, PASSWORD: 'x'.repeat(49) });
    expect(long.json().fields).toMatchObject({ 'values.PASSWORD': 'Máximo 48 caracteres.' });
    expect((await post(app, { ...novo, PASSWORD: 'x'.repeat(48) })).statusCode).toBe(201);
  });

  it('cannot filter, sort or lock-check on PASSWORD (no way to probe the stored value)', async () => {
    const { app } = await appWith('ADM');
    expect((await app.inject({ url: '/api/utilizadores?f[PASSWORD]=x' })).statusCode).toBe(400);
    expect((await app.inject({ url: '/api/utilizadores?sort=PASSWORD:asc' })).statusCode).toBe(400);
    expect((await put(app, 'ANA', { NOME: 'X' }, { PASSWORD: 'HASH-DA-ANA' })).statusCode).toBe(
      400,
    );
  });
});

describe('utilizadores routes — server-set columns (PRE-INSERT / PRE-UPDATE)', () => {
  it('POST upper-cases USERNAME and NOME, forces the configured AMBIENTE_ID, NIVEL_ACESSO_RF 0 and the audit columns', async () => {
    const { app } = await appWith('ADM');
    const r = await post(app, novo);
    expect(r.json()).toMatchObject({
      USERNAME: 'BIA',
      NOME: 'BIA COSTA',
      AMBIENTE_ID: 'GADOR_TESTES',
      NIVEL_ACESSO_RF: 0,
      CRIADO_POR: 'JOAO',
      DATA_FIM: null,
    });
  });

  it('a client cannot set AMBIENTE_ID, NIVEL_ACESSO_RF or the audit columns', async () => {
    const { app } = await appWith('ADM');
    for (const extra of [{ AMBIENTE_ID: 'COSEC' }, { NIVEL_ACESSO_RF: 9 }, { CRIADO_POR: 'OUTRO' }])
      expect((await post(app, { ...novo, ...extra })).statusCode).toBe(400);
    expect((await put(app, 'ANA', { AMBIENTE_ID: 'COSEC' })).statusCode).toBe(400);
  });

  it('PUT stamps ACTUALIZADO_POR, resets NIVEL_ACESSO_RF to 0, and cannot rename USERNAME or NOME (UpdateAllowed=false)', async () => {
    const { app } = await appWith('ADM');
    const r = await put(app, 'ANA', { UNIDADE_NEGOCIO_RF: 'DSI', DATA_FIM: null });
    expect(r.json()).toMatchObject({ ACTUALIZADO_POR: 'JOAO', NIVEL_ACESSO_RF: 0, DATA_FIM: null });
    expect((await put(app, 'ANA', { USERNAME: 'X' })).statusCode).toBe(400);
    expect((await put(app, 'ANA', { NOME: 'X' })).statusCode).toBe(400);
  });
});

describe('utilizadores routes — validations from FD_UTILIZADORES_SIID', () => {
  it('POST requires USERNAME, NOME, PASSWORD, type, business unit and DATA_INICIO; DATA_FIM is optional', async () => {
    const { app } = await appWith('ADM');
    const r = await post(app, {});
    expect(r.statusCode).toBe(400);
    expect(Object.keys(r.json().fields).sort()).toEqual(
      ['USERNAME', 'NOME', 'PASSWORD', 'UNIDADE_NEGOCIO_RF', 'TIPO_UTILIZADOR_RF', 'DATA_INICIO']
        .map((c) => `values.${c}`)
        .sort(),
    );
    expect(r.json().fields['values.TIPO_UTILIZADOR_RF']).toBe('Campo obrigatório.');
  });

  it('DATA_INICIO after DATA_FIM is refused with the legacy message', async () => {
    const { app } = await appWith('ADM');
    const r = await post(app, {
      ...novo,
      DATA_INICIO: '2026-06-01T00:00:00',
      DATA_FIM: '2026-05-01T00:00:00',
    });
    expect(r.statusCode).toBe(400);
    expect(r.json().fields).toEqual({
      'values.DATA_FIM': 'A data de início é superior à data de fim.',
    });
    expect((await post(app, { ...novo, DATA_FIM: '2026-01-01T00:00:00' })).statusCode).toBe(201);
  });

  it('PUT checks a changed DATA_FIM against the stored DATA_INICIO (and the reverse)', async () => {
    const { app } = await appWith('ADM');
    const fim = await put(app, 'ANA', { DATA_FIM: '2019-12-31T00:00:00' });
    expect(fim.statusCode).toBe(400);
    expect(fim.json().fields['values.DATA_FIM']).toBe('A data de início é superior à data de fim.');
    expect((await put(app, 'ANA', { DATA_INICIO: '2031-01-01T00:00:00' })).statusCode).toBe(400);
    expect((await put(app, 'ANA', { DATA_INICIO: '2021-01-01T00:00:00' })).statusCode).toBe(200);
  });

  it('a repeated USERNAME is refused (primary key PK_USERNAME_CUT), whatever the case typed', async () => {
    const { app } = await appWith('ADM');
    const r = await post(app, { ...novo, USERNAME: 'ana' });
    expect(r.statusCode).toBe(409);
    expect(r.json().code).toBe('ORA_00001');
  });

  it('rejects over-long USERNAME (30) and NOME (100)', async () => {
    const { app } = await appWith('ADM');
    const r = await post(app, { ...novo, USERNAME: 'U'.repeat(31), NOME: 'N'.repeat(101) });
    expect(r.json().fields).toMatchObject({
      'values.USERNAME': 'Máximo 30 caracteres.',
      'values.NOME': 'Máximo 100 caracteres.',
    });
  });
});

describe('utilizadores routes — access', () => {
  it('DELETE removes a user', async () => {
    const { app } = await appWith('ADM');
    const row = (await app.inject({ url: '/api/utilizadores' })).json().rows[0];
    const r = await app.inject({
      method: 'DELETE',
      url: `/api/utilizadores/${row._rid}`,
      payload: { orig: { USERNAME: 'ANA' } },
    });
    expect(r.statusCode).toBe(204);
    expect((await app.inject({ url: '/api/utilizadores' })).json().rows).toHaveLength(0);
  });

  it('is ADM only: USER gets 403 on read and write, no session gets 401', async () => {
    const user = (await appWith('USER')).app;
    expect((await user.inject({ url: '/api/utilizadores' })).statusCode).toBe(403);
    expect((await post(user, novo)).statusCode).toBe(403);
    const anon = (await appWith(null)).app;
    expect((await anon.inject({ url: '/api/utilizadores' })).statusCode).toBe(401);
  });
});
