import Fastify from 'fastify';
import { variaveis } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import { memoryStore } from '../dev/memoryStore.ts';
import { registerErrorHandler } from '../../http/errors.ts';
import { registerVariaveisRoutes } from './routes.ts';

const AMBIENTE = 'GADOR_TESTES';
const v = (AMBIENTE_ID: string, TIPO_VARIAVEL_RF: string, VALOR: string | null) => ({
  AMBIENTE_ID,
  TIPO_VARIAVEL_RF,
  VALOR,
});
// memoryStore numbers rows m1, m2, … in seed order; the tests below use those rids directly.
const seed = [
  v(AMBIENTE, 'BACKUP', '\\\\ssiidt\\documentos\\backup\\teste'), // m1
  v(AMBIENTE, 'LIMITE_NOTIF', '14'), // m2
  v(AMBIENTE, 'PASSWORD', 'HASH'), // m3 — hidden by the form's DEFAULT_WHERE
  v(AMBIENTE, 'PASSWORD_OLD', 'HASH-OLD'), // m4 — the previous hash: hidden as well
  v('COSEC', 'SLB', 'outro ambiente'), // m5
];

async function appWith(role: 'ADM' | 'USER' | null) {
  const app = Fastify();
  registerErrorHandler(app);
  app.decorateRequest('session', null as never);
  app.addHook('onRequest', async (req) => {
    (req as { session: unknown }).session = { user: role ? { username: 'JOAO', role } : undefined };
  });
  registerVariaveisRoutes(app, { store: memoryStore(variaveis, seed), ambiente: AMBIENTE });
  await app.ready();
  return app;
}
type App = Awaited<ReturnType<typeof appWith>>;

const post = (app: App, values: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: '/api/variaveis', payload: { values } });
const put = (app: App, rid: string, orig: Record<string, unknown>, values: Record<string, unknown>) =>
  app.inject({ method: 'PUT', url: `/api/variaveis/${rid}`, payload: { orig, values } });
const listed = async (app: App, query = '') =>
  (await app.inject({ url: `/api/variaveis${query}` })).json();

describe('variaveis routes — what the screen shows (default WHERE)', () => {
  it('lists only the configured environment and never the PASSWORD rows', async () => {
    const app = await appWith('ADM');
    const r = await listed(app);
    expect(r.rows.map((x: { TIPO_VARIAVEL_RF: string }) => x.TIPO_VARIAVEL_RF)).toEqual([
      'BACKUP',
      'LIMITE_NOTIF',
    ]);
    expect(r.total).toBe(2);
  });

  it('a client filter cannot switch the environment', async () => {
    const app = await appWith('ADM');
    const r = await listed(app, '?f[AMBIENTE_ID]=COSEC');
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0].AMBIENTE_ID).toBe(AMBIENTE);
  });

  it('GET one, PUT and DELETE are 404 for a hidden row and for another environment', async () => {
    const app = await appWith('ADM');
    for (const [rid, orig] of [
      ['m3', { TIPO_VARIAVEL_RF: 'PASSWORD' }],
      ['m4', { TIPO_VARIAVEL_RF: 'PASSWORD_OLD' }],
      ['m5', { TIPO_VARIAVEL_RF: 'SLB' }],
    ] as const) {
      expect((await app.inject({ url: `/api/variaveis/${rid}` })).statusCode).toBe(404);
      expect((await put(app, rid, orig, { VALOR: 'x' })).statusCode).toBe(404);
      const del = await app.inject({
        method: 'DELETE',
        url: `/api/variaveis/${rid}`,
        payload: { orig },
      });
      expect(del.statusCode).toBe(404);
    }
  });
});

describe('variaveis routes — writes', () => {
  it('POST forces AMBIENTE_ID to the configured environment; VALOR is optional', async () => {
    const app = await appWith('ADM');
    const r = await post(app, { TIPO_VARIAVEL_RF: 'GS' });
    expect(r.statusCode).toBe(201);
    expect(r.json()).toMatchObject({ AMBIENTE_ID: AMBIENTE, TIPO_VARIAVEL_RF: 'GS', VALOR: null });
  });

  it('a client cannot send AMBIENTE_ID', async () => {
    const app = await appWith('ADM');
    expect((await post(app, { TIPO_VARIAVEL_RF: 'GS', AMBIENTE_ID: 'COSEC' })).statusCode).toBe(400);
  });

  it('POST requires the type and limits it to 16 and VALOR to 2000 characters', async () => {
    const app = await appWith('ADM');
    const missing = await post(app, { VALOR: 'x' });
    expect(missing.json().fields).toEqual({ 'values.TIPO_VARIAVEL_RF': 'Campo obrigatório.' });
    const long = await post(app, { TIPO_VARIAVEL_RF: 'T'.repeat(17), VALOR: 'V'.repeat(2001) });
    expect(long.json().fields).toEqual({
      'values.TIPO_VARIAVEL_RF': 'Máximo 16 caracteres.',
      'values.VALOR': 'Máximo 2000 caracteres.',
    });
    expect((await post(app, { TIPO_VARIAVEL_RF: 'T'.repeat(16), VALOR: 'V'.repeat(2000) })).statusCode).toBe(201);
  });

  it('a type already defined in the environment is refused with the form\'s alert text', async () => {
    const app = await appWith('ADM');
    const r = await post(app, { TIPO_VARIAVEL_RF: 'BACKUP', VALOR: 'outro' });
    expect(r.statusCode).toBe(409);
    expect(r.json().message).toBe('Este tipo de variável já está associado.');
    expect(r.json().fields).toEqual({
      'values.TIPO_VARIAVEL_RF': 'Este tipo de variável já está associado.',
    });
  });

  it('PUT changes VALOR; renaming the type to one already used gets the same refusal', async () => {
    const app = await appWith('ADM');
    const ok = await put(app, 'm2', { TIPO_VARIAVEL_RF: 'LIMITE_NOTIF' }, { VALOR: '20' });
    expect(ok.json()).toMatchObject({ TIPO_VARIAVEL_RF: 'LIMITE_NOTIF', VALOR: '20' });
    const dup = await put(app, 'm2', { TIPO_VARIAVEL_RF: 'LIMITE_NOTIF' }, { TIPO_VARIAVEL_RF: 'BACKUP' });
    expect(dup.statusCode).toBe(409);
    expect(dup.json().message).toBe('Este tipo de variável já está associado.');
  });

  it('DELETE removes a visible variable', async () => {
    const app = await appWith('ADM');
    const r = await app.inject({
      method: 'DELETE',
      url: '/api/variaveis/m2',
      payload: { orig: { TIPO_VARIAVEL_RF: 'LIMITE_NOTIF' } },
    });
    expect(r.statusCode).toBe(204);
    expect((await listed(app)).total).toBe(1);
  });
});

describe('variaveis routes — access', () => {
  it('is ADM only: USER gets 403 on read and write, no session gets 401', async () => {
    const user = await appWith('USER');
    expect((await user.inject({ url: '/api/variaveis' })).statusCode).toBe(403);
    expect((await post(user, { TIPO_VARIAVEL_RF: 'GS' })).statusCode).toBe(403);
    const anon = await appWith(null);
    expect((await anon.inject({ url: '/api/variaveis' })).statusCode).toBe(401);
  });
});
