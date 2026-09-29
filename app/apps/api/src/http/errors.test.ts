import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AppError } from '../db/errors.ts';
import { registerErrorHandler } from './errors.ts';

async function buildApp() {
  const app = Fastify();
  registerErrorHandler(app);

  app.get('/app-error', async () => {
    throw new AppError(409, 'REGISTO_ALTERADO', 'O registo foi alterado por outro utilizador. Volte a consultar.');
  });
  app.get('/app-error-fields', async () => {
    throw new AppError(422, 'ALERTA_1PARAM', 'A linha 1 tem de ser _USER.', {
      fields: { NOME: 'A linha 1 tem de ser _USER.' },
    });
  });
  app.get('/zod-error', async () => {
    z.object({ nome: z.string() }).parse({});
  });
  app.post('/json', async () => ({ ok: true }));
  app.get('/boom', async () => {
    throw new Error('unexpected wiring bug');
  });

  await app.ready();
  return app;
}

describe('registerErrorHandler', () => {
  it('maps an AppError to its own status, code and message with the request id', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/app-error' });

    expect(res.statusCode).toBe(409);
    const body = res.json();
    expect(body.code).toBe('REGISTO_ALTERADO');
    expect(body.message).toBe('O registo foi alterado por outro utilizador. Volte a consultar.');
    expect(typeof body.requestId).toBe('string');
    expect(body.requestId.length).toBeGreaterThan(0);
  });

  it('includes fields on an AppError that carries them', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/app-error-fields' });

    expect(res.statusCode).toBe(422);
    expect(res.json().fields).toEqual({ NOME: 'A linha 1 tem de ser _USER.' });
  });

  it('maps a Zod validation error to 400 VALIDACAO with per-field messages', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/zod-error' });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.code).toBe('VALIDACAO');
    expect(body.message).toBe('Dados inválidos.');
    expect(body.fields).toBeDefined();
  });

  it('maps any other error to 500 ERRO without leaking the internal message', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/boom' });

    expect(res.statusCode).toBe(500);
    const body = res.json();
    expect(body.code).toBe('ERRO');
    expect(body.message).toBe('Erro');
    expect(JSON.stringify(body)).not.toContain('unexpected wiring bug');
  });

  it('answers a client mistake (malformed JSON, 400) with its own 4xx, not a 500', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/json',
      headers: { 'content-type': 'application/json' },
      payload: '{"a":',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: 'PEDIDO_INVALIDO', message: 'Pedido inválido.' });
  });

  it('keeps the status of other 4xx Fastify errors (415 unsupported type)', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/json',
      headers: { 'content-type': 'application/x-nada' },
      payload: 'x',
    });
    expect(res.statusCode).toBe(415);
    expect(res.json().code).toBe('PEDIDO_INVALIDO');
  });
});
