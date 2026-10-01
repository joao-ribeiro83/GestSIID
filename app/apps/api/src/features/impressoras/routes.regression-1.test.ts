// Regression: ISSUE-004 — Novo + Guardar with nothing typed saved a printer with no Endereço
// (FD_IMPRESSORAS_SIID has ENDERECO, VALIDO and GSDEVICE_RF Required).
// Found by /qa on 2026-10-01. Report: analysis/QA_REPORT.md
import Fastify from 'fastify';
import { impressoras } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import { memoryStore } from '../dev/memoryStore.ts';
import { registerErrorHandler } from '../../http/errors.ts';
import { registerImpressorasRoutes } from './routes.ts';

async function admApp() {
  const app = Fastify();
  registerErrorHandler(app);
  app.decorateRequest('session', null as never);
  app.addHook('onRequest', async (req) => {
    (req as { session: unknown }).session = { user: { username: 'JOAO', role: 'ADM' } };
  });
  registerImpressorasRoutes(app, { store: memoryStore(impressoras, [], { autoId: 'ID' }) });
  await app.ready();
  return app;
}

const post = async (values: Record<string, unknown>) =>
  (await admApp()).inject({ method: 'POST', url: '/api/impressoras', payload: { values } });

describe('impressoras — required fields', () => {
  it('rejects an empty new printer and names each required field', async () => {
    const r = await post({});
    expect(r.statusCode).toBe(400);
    expect(Object.keys(r.json().fields)).toEqual(
      expect.arrayContaining(['values.ENDERECO', 'values.VALIDO', 'values.GSDEVICE_RF']),
    );
  });

  it.each(['ENDERECO', 'VALIDO', 'GSDEVICE_RF'])('rejects %s set to null or empty', async (col) => {
    const full = { ENDERECO: '10.0.0.1', VALIDO: 'S', GSDEVICE_RF: 'PXLCOLOR' };
    expect((await post({ ...full, [col]: null })).statusCode).toBe(400);
    expect((await post({ ...full, [col]: '' })).statusCode).toBe(400);
  });

  it('accepts a printer with the three required fields and no Descrição/Servidor', async () => {
    const r = await post({ ENDERECO: '10.0.0.1', VALIDO: 'S', GSDEVICE_RF: 'PXLCOLOR' });
    expect(r.statusCode).toBe(201);
  });
});
