import Fastify from 'fastify';
import { impressoras } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import { memoryStore } from '../dev/memoryStore.ts';
import { registerErrorHandler } from '../../http/errors.ts';
import { registerImpressorasRoutes } from './routes.ts';

const seed = [
  {
    ID: 1,
    DESCRICAO: 'HP 1',
    ENDERECO: '10.0.0.1',
    SERVIDOR: 'PRINT01',
    VALIDO: 'S',
    GSDEVICE_RF: 'PXLCOLOR',
    CRIADO_POR: 'MIGRACAO',
    DATA_CRIACAO: '2020-01-01T00:00:00',
    ACTUALIZADO_POR: null,
    DATA_ACTUALIZACAO: null,
  },
];

async function appWith(role: 'ADM' | 'USER' | null) {
  const app = Fastify();
  registerErrorHandler(app);
  app.decorateRequest('session', null as never);
  app.addHook('onRequest', async (req) => {
    (req as { session: unknown }).session = { user: role ? { username: 'JOAO', role } : undefined };
  });
  registerImpressorasRoutes(app, { store: memoryStore(impressoras, seed, { autoId: 'ID' }) });
  await app.ready();
  return app;
}

describe('impressoras routes', () => {
  it('GET lists rows through the generic list envelope', async () => {
    const app = await appWith('USER');
    const r = await app.inject({ url: '/api/impressoras' });
    expect(r.statusCode).toBe(200);
    expect(r.json().rows).toMatchObject([{ ID: 1, DESCRICAO: 'HP 1' }]);
  });

  it('POST assigns the id via the sequence hook and stamps CRIADO_POR, not the client', async () => {
    const app = await appWith('ADM');
    const r = await app.inject({
      method: 'POST',
      url: '/api/impressoras',
      payload: { values: { DESCRICAO: 'Nova', ENDERECO: '10.0.0.1', VALIDO: 'S', GSDEVICE_RF: 'PXLCOLOR' } },
    });
    expect(r.statusCode).toBe(201);
    expect(r.json()).toMatchObject({ ID: 2, DESCRICAO: 'Nova', CRIADO_POR: 'JOAO' });
  });

  it('POST rejects a client-supplied ID (server-generated only)', async () => {
    const app = await appWith('ADM');
    const r = await app.inject({
      method: 'POST',
      url: '/api/impressoras',
      payload: { values: { ID: '99', DESCRICAO: 'Nova' } },
    });
    expect(r.statusCode).toBe(400);
  });

  it('USER cannot write', async () => {
    const app = await appWith('USER');
    const r = await app.inject({
      method: 'POST',
      url: '/api/impressoras',
      payload: { values: { DESCRICAO: 'Nova' } },
    });
    expect(r.statusCode).toBe(403);
  });

  it('PUT stamps ACTUALIZADO_POR from the session', async () => {
    const app = await appWith('ADM');
    const row = (await app.inject({ url: '/api/impressoras' })).json().rows[0];
    const r = await app.inject({
      method: 'PUT',
      url: `/api/impressoras/${row._rid}`,
      payload: { orig: { DESCRICAO: 'HP 1' }, values: { DESCRICAO: 'HP 1 (alterada)' } },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ DESCRICAO: 'HP 1 (alterada)', ACTUALIZADO_POR: 'JOAO' });
  });
});
