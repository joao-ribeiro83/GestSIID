// Regression: QA question (a), owner decision 2026-10-01 — "Tamanho" (TAMANHO_MAXIMO) is Required
// in FD_DOMINIOS_SIID; the new app let a domain be saved without it.
// Report: analysis/QA_REPORT.md §4
import Fastify from 'fastify';
import { dominios, dominiosValores } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import { memoryStore } from '../dev/memoryStore.ts';
import { registerErrorHandler } from '../../http/errors.ts';
import { createDominiosCache } from './valores.ts';
import { registerDominiosCrudRoutes } from './routes.ts';

async function post(values: Record<string, unknown>) {
  const app = Fastify();
  registerErrorHandler(app);
  app.decorateRequest('session', null as never);
  app.addHook('onRequest', async (req) => {
    (req as { session: unknown }).session = { user: { username: 'JOAO', role: 'ADM' } };
  });
  registerDominiosCrudRoutes(app, {
    store: memoryStore(dominios, []),
    valoresStore: memoryStore(dominiosValores, []),
    cache: createDominiosCache(),
  });
  return app.inject({ method: 'POST', url: '/api/dominios', payload: { values } });
}

const novo = { ID: 'ZZ_DOM', DESCRICAO: 'Teste', TIPO_INFORMACAO_RF: 'STRING', TIPO_DOMINIO_RF: 'L', DOMINIO_SISTEMA_BN: 'N' };

describe('dominios — Tamanho is required', () => {
  it.each([undefined, null])('refuses a new domain with Tamanho %s', async (tamanho) => {
    const r = await post({ ...novo, ...(tamanho === undefined ? {} : { TAMANHO_MAXIMO: tamanho }) });
    expect(r.statusCode).toBe(400);
    expect(r.json().fields).toHaveProperty('values.TAMANHO_MAXIMO', 'Campo obrigatório.');
  });

  it('accepts it with a Tamanho', async () => {
    expect((await post({ ...novo, TAMANHO_MAXIMO: 30 })).statusCode).toBe(201);
  });
});
