import Fastify from 'fastify';
import { unidadesMedida } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import { memoryStore } from '../dev/memoryStore.ts';
import { registerErrorHandler } from '../../http/errors.ts';
import { registerUnidadesMedidaRoutes } from './routes.ts';

const unit = (ID: string, NOME: string, FACTOR: number, UNIDADE_BASE_ID: string | null) => ({
  ID,
  NOME,
  FACTOR,
  UNIDADE_BASE_ID,
  GEN_MEDIDA_RF: 'DIGITAL',
  CRIADO_POR: 'MIGRACAO',
  DATA_CRIACAO: '2010-02-15T12:52:27',
  ACTUALIZADO_POR: null,
  DATA_ACTUALIZACAO: null,
});
const seed = [
  unit('GB', 'Gigabytes', 1e9, 'BYTES'),
  unit('BYTES', 'Bytes', 1, null),
  unit('KB', 'Kilobytes', 1000, 'BYTES'),
];

async function appWith(role: 'ADM' | 'USER' | null) {
  const app = Fastify();
  registerErrorHandler(app);
  app.decorateRequest('session', null as never);
  app.addHook('onRequest', async (req) => {
    (req as { session: unknown }).session = { user: role ? { username: 'JOAO', role } : undefined };
  });
  registerUnidadesMedidaRoutes(app, { store: memoryStore(unidadesMedida, seed) });
  await app.ready();
  return app;
}

const post = (app: Awaited<ReturnType<typeof appWith>>, values: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: '/api/unidades-medida', payload: { values } });

describe('unidades-medida routes', () => {
  it('GET lists the units through the generic list envelope, by ID (form ORDER BY ID)', async () => {
    const app = await appWith('ADM');
    const r = await app.inject({ url: '/api/unidades-medida' });
    expect(r.statusCode).toBe(200);
    expect(r.json().rows.map((x: { ID: string }) => x.ID)).toEqual(['BYTES', 'GB', 'KB']);
  });

  it('POST upper-cases the typed ID, forces GEN_MEDIDA_RF DIGITAL and stamps CRIADO_POR', async () => {
    const app = await appWith('ADM');
    const r = await post(app, {
      ID: 'mb',
      NOME: 'Megabytes',
      FACTOR: 1e6,
      UNIDADE_BASE_ID: 'BYTES',
    });
    expect(r.statusCode).toBe(201);
    expect(r.json()).toMatchObject({ ID: 'MB', GEN_MEDIDA_RF: 'DIGITAL', CRIADO_POR: 'JOAO' });
  });

  it('POST requires the ID (Campo obrigatório.) and rejects a client GEN_MEDIDA_RF', async () => {
    const app = await appWith('ADM');
    const missing = await post(app, { NOME: 'Sem id' });
    expect(missing.statusCode).toBe(400);
    expect(missing.json().fields).toMatchObject({ 'values.ID': 'Campo obrigatório.' });
    expect((await post(app, { ID: 'X', GEN_MEDIDA_RF: 'ANALOGICO' })).statusCode).toBe(400);
  });

  it('POST rejects a NOME over 60 characters', async () => {
    const app = await appWith('ADM');
    const r = await post(app, { ID: 'X', NOME: 'N'.repeat(61) });
    expect(r.json().fields).toMatchObject({ 'values.NOME': 'Máximo 60 caracteres.' });
  });

  it('PUT stamps ACTUALIZADO_POR, and the ID can no longer be changed', async () => {
    const app = await appWith('ADM');
    const row = (await app.inject({ url: '/api/unidades-medida?f[ID]=KB' })).json().rows[0];
    const ok = await app.inject({
      method: 'PUT',
      url: `/api/unidades-medida/${row._rid}`,
      payload: { orig: { NOME: 'Kilobytes' }, values: { NOME: 'Quilobytes' } },
    });
    expect(ok.json()).toMatchObject({ NOME: 'Quilobytes', ACTUALIZADO_POR: 'JOAO' });
    const renamed = await app.inject({
      method: 'PUT',
      url: `/api/unidades-medida/${row._rid}`,
      payload: { orig: {}, values: { ID: 'KIB' } },
    });
    expect(renamed.statusCode).toBe(400);
  });

  it('USER can neither read nor write (menu is ADM only)', async () => {
    const app = await appWith('USER');
    expect((await app.inject({ url: '/api/unidades-medida' })).statusCode).toBe(403);
    expect((await post(app, { ID: 'X' })).statusCode).toBe(403);
  });

  it('feeds the Unidades Base select (RG_UNIDADES_BASE): only units without a base', async () => {
    const app = await appWith('ADM');
    const r = await app.inject({ url: '/api/dominios/UNIDADES_BASE/valores' });
    expect(r.json().rows).toEqual([{ CHAVE: 'BYTES', DESIGNACAO: 'Bytes' }]);
  });

  it('feeds the U.M. select (RG_UNIDADES_MEDIDA): every DIGITAL unit ordered by FACTOR', async () => {
    const app = await appWith('ADM');
    const r = await app.inject({ url: '/api/dominios/UNIDADES_MEDIDA/valores' });
    expect(r.json().rows.map((x: { CHAVE: string }) => x.CHAVE)).toEqual(['BYTES', 'KB', 'GB']);
    expect(r.json().rows[2]).toEqual({ CHAVE: 'GB', DESIGNACAO: 'Gigabytes' });
  });

  it('the select feeds need a session', async () => {
    const app = await appWith(null);
    expect((await app.inject({ url: '/api/dominios/UNIDADES_MEDIDA/valores' })).statusCode).toBe(
      401,
    );
  });
});
