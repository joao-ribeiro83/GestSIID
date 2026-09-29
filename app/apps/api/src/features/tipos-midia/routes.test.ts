import Fastify from 'fastify';
import { tiposMidia, unidadesMedida } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import { memoryStore } from '../dev/memoryStore.ts';
import { registerErrorHandler } from '../../http/errors.ts';
import { registerTiposMidiaRoutes } from './routes.ts';

const unit = (ID: string, FACTOR: number | null) => ({
  ID,
  NOME: ID,
  FACTOR,
  UNIDADE_BASE_ID: null,
  GEN_MEDIDA_RF: 'DIGITAL',
  CRIADO_POR: 'MIGRACAO',
  DATA_CRIACAO: '2010-02-15T12:52:27',
  ACTUALIZADO_POR: null,
  DATA_ACTUALIZACAO: null,
});
const units = [unit('KB', 1000), unit('GB', 1e9), unit('SEMFACTOR', null)];

const tipo = {
  ID: 'DVD-R47G',
  DESIGNACAO: 'DVD-R 4,7 Gb',
  DESCRICAO: null,
  GEN_MEDIDA_RF: 'DIGITAL',
  UNIDADE_MEDIDA_ID: 'GB',
  TAMANHO_MIDIA: 4.7,
  TAMANHO_BYTES: 4700000000,
  CRIADO_POR: 'MIGRACAO',
  DATA_CRIACAO: '2010-02-15T12:57:32',
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
  registerTiposMidiaRoutes(app, {
    store: memoryStore(tiposMidia, [tipo]),
    unidades: memoryStore(unidadesMedida, units),
  });
  await app.ready();
  return app;
}
type App = Awaited<ReturnType<typeof appWith>>;

const post = (app: App, values: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: '/api/tipos-midia', payload: { values } });
const put = async (app: App, id: string, values: Record<string, unknown>) => {
  const row = (await app.inject({ url: `/api/tipos-midia?f[ID]=${id}` })).json().rows[0];
  return app.inject({
    method: 'PUT',
    url: `/api/tipos-midia/${row._rid}`,
    payload: { orig: { ID: row.ID }, values },
  });
};

describe('tipos-midia routes', () => {
  it('GET lists rows through the generic list envelope', async () => {
    const app = await appWith('ADM');
    const r = await app.inject({ url: '/api/tipos-midia' });
    expect(r.statusCode).toBe(200);
    expect(r.json().rows).toMatchObject([{ ID: 'DVD-R47G', TAMANHO_BYTES: 4700000000 }]);
  });

  it('POST upper-cases the ID, defaults GEN_MEDIDA_RF to DIGITAL and stamps CRIADO_POR', async () => {
    const app = await appWith('ADM');
    const r = await post(app, { ID: 'cd700', DESIGNACAO: 'CD 700 Mb', UNIDADE_MEDIDA_ID: 'KB' });
    expect(r.statusCode).toBe(201);
    expect(r.json()).toMatchObject({ ID: 'CD700', GEN_MEDIDA_RF: 'DIGITAL', CRIADO_POR: 'JOAO' });
  });

  // POST-CHANGE: TAMANHO_BYTES := TRUNC(NVL(TAMANHO_MIDIA,1) * FACTOR of the unit).
  it('POST computes TAMANHO_BYTES from the unit factor, like Oracle NUMBER (8,54 GB is not 8539999999)', async () => {
    const app = await appWith('ADM');
    const r = await post(app, {
      ID: 'DVD-R85G',
      DESIGNACAO: 'DVD-R DL 8,54 Gb',
      UNIDADE_MEDIDA_ID: 'GB',
      TAMANHO_MIDIA: 8.54,
    });
    expect(r.json().TAMANHO_BYTES).toBe(8540000000);
  });

  it('POST without TAMANHO_MIDIA counts it as 1 (NVL), and an unknown unit has factor 1', async () => {
    const app = await appWith('ADM');
    const semTamanho = await post(app, { ID: 'A', DESIGNACAO: 'A', UNIDADE_MEDIDA_ID: 'KB' });
    expect(semTamanho.json().TAMANHO_BYTES).toBe(1000);
    const semUnidade = await post(app, { ID: 'B', DESIGNACAO: 'B', TAMANHO_MIDIA: 5 });
    expect(semUnidade.json().TAMANHO_BYTES).toBe(5);
  });

  it('POST with a unit whose FACTOR is null leaves TAMANHO_BYTES null (the trigger would too)', async () => {
    const app = await appWith('ADM');
    const r = await post(app, {
      ID: 'C',
      DESIGNACAO: 'C',
      UNIDADE_MEDIDA_ID: 'SEMFACTOR',
      TAMANHO_MIDIA: 2,
    });
    expect(r.json().TAMANHO_BYTES).toBeNull();
  });

  it('POST requires ID and DESIGNACAO, and rejects a client TAMANHO_BYTES or GEN_MEDIDA_RF', async () => {
    const app = await appWith('ADM');
    const missing = await post(app, { DESCRICAO: 'x' });
    expect(missing.statusCode).toBe(400);
    expect(missing.json().fields).toMatchObject({
      'values.ID': 'Campo obrigatório.',
      'values.DESIGNACAO': 'Campo obrigatório.',
    });
    expect((await post(app, { ID: 'D', DESIGNACAO: 'D', TAMANHO_BYTES: 1 })).statusCode).toBe(400);
    expect((await post(app, { ID: 'D', DESIGNACAO: 'D', GEN_MEDIDA_RF: 'X' })).statusCode).toBe(
      400,
    );
  });

  it('POST rejects a DESIGNACAO over 200 characters', async () => {
    const app = await appWith('ADM');
    const r = await post(app, { ID: 'E', DESIGNACAO: 'D'.repeat(201) });
    expect(r.json().fields).toMatchObject({ 'values.DESIGNACAO': 'Máximo 200 caracteres.' });
  });

  it('PUT changing only the unit recomputes TAMANHO_BYTES from the stored size', async () => {
    const app = await appWith('ADM');
    const r = await put(app, 'DVD-R47G', { UNIDADE_MEDIDA_ID: 'KB' });
    expect(r.json()).toMatchObject({
      UNIDADE_MEDIDA_ID: 'KB',
      TAMANHO_BYTES: 4700,
      ACTUALIZADO_POR: 'JOAO',
    });
  });

  it('PUT changing only the size recomputes TAMANHO_BYTES with the stored unit', async () => {
    const app = await appWith('ADM');
    const r = await put(app, 'DVD-R47G', { TAMANHO_MIDIA: 2 });
    expect(r.json().TAMANHO_BYTES).toBe(2000000000);
  });

  it('PUT of another field leaves TAMANHO_BYTES alone', async () => {
    const app = await appWith('ADM');
    const r = await put(app, 'DVD-R47G', { DESCRICAO: 'Disco' });
    expect(r.json()).toMatchObject({ DESCRICAO: 'Disco', TAMANHO_BYTES: 4700000000 });
  });

  it('USER can neither read nor write (menu is ADM only)', async () => {
    const app = await appWith('USER');
    expect((await app.inject({ url: '/api/tipos-midia' })).statusCode).toBe(403);
    expect((await post(app, { ID: 'F', DESIGNACAO: 'F' })).statusCode).toBe(403);
  });
});
