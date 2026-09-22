import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { registerErrorHandler } from '../../http/errors.ts';
import { registerSession } from '../../http/session.ts';
import { registerDevRoutes } from './routes.ts';

async function devApp() {
  const app = Fastify();
  registerErrorHandler(app);
  await registerSession(app, {
    SESSION_SECRET: 'x'.repeat(32),
    COOKIE_SECURE: false,
    BASE_PATH: '',
  });
  await app.register(registerDevRoutes);
  await app.ready();
  return app;
}

describe('dev demo routes (in memory, no Oracle)', () => {
  it('serves the seeded printers as a paged list, with a dev ADM user and no login', async () => {
    const app = await devApp();
    const body = (await app.inject({ url: '/api/demo-impressoras?size=10' })).json();
    expect(body.total).toBeGreaterThan(100);
    expect(body.rows).toHaveLength(10);
  });

  it('serves domain values for the select filters and editors', async () => {
    const app = await devApp();
    const body = (await app.inject({ url: '/api/dominios/TIPO_IMPRESSORA/valores' })).json();
    expect(body.rows).toContainEqual({ CHAVE: 'LASER', DESIGNACAO: 'Laser' });
    expect((await app.inject({ url: '/api/dominios/NAO_EXISTE/valores' })).json().rows).toEqual([]);
  });

  it('serves the detail block nested under its master key and writes go through', async () => {
    const app = await devApp();
    const first = (await app.inject({ url: '/api/demo-impressoras?f[ID]=1' })).json().rows[0];
    const detail = (await app.inject({ url: '/api/demo-impressoras/1/tabuleiros' })).json();
    expect(detail.total).toBeGreaterThan(0);
    expect(detail.rows.every((r: { IMPRESSORA_ID: number }) => r.IMPRESSORA_ID === 1)).toBe(true);

    const put = await app.inject({
      method: 'PUT',
      url: `/api/demo-impressoras/${first._rid}`,
      payload: { orig: { NOME: first.NOME }, values: { NOME: 'Renomeada' } },
    });
    expect(put.statusCode).toBe(200);
    expect(put.json()).toMatchObject({ NOME: 'Renomeada', ACTUALIZADO_POR: 'DEV' });
  });
});
