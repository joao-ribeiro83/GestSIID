import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { empregadosLov, funcoesDepartamento, perfisDepartamento } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import { registerErrorHandler } from '../../http/errors.ts';
import { memoryImageStore } from '../dev/memoryImageStore.ts';
import { memoryStore } from '../dev/memoryStore.ts';
import { memoryPerfisRepo } from './repo.ts';
import { registerPerfisDepartamentoRoutes } from './routes.ts';

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

const perfil = (ID: number, CDEMPLEA: string, CODIGO: string | null, FUNCAODEP_ID: string) => ({
  ID,
  CDEMPLEA,
  CDDEPARTA: 'OD68',
  DATA_INICIO: '2020-01-01T00:00:00',
  DATA_FIM: null,
  CODIGO,
  FUNCAODEP_ID,
  NOME: FUNCAODEP_ID === 'GCOM' ? 'Gestor Comercial' : 'Gestor de Conta',
  DESCRICAO: `Pessoa ${ID}`,
  EMAIL: null,
  TELEFONE: null,
  FAX: null,
  TELEMOVEL: null,
  CRIADO_POR: 'MIGRACAO',
  DATA_CRIACAO: '2020-01-01T10:00:00',
  ACTUALIZADO_POR: null,
  DATA_ACTUALIZACAO: null,
});
const perfis = [perfil(3, 'ZZ300X', 'GC300', 'GCON'), perfil(1, 'AA100X', 'GC100', 'GCOM')];
const empregados = [
  { CDEMPLEA: 'BB200Y', CDDEPARTA: 'OD68', SWACTIVO: 'S' },
  { CDEMPLEA: 'CC900Z', CDDEPARTA: 'OD01', SWACTIVO: 'N' },
  { CDEMPLEA: 'AA100X', CDDEPARTA: 'OD68', SWACTIVO: 'S' },
];
const funcoes = [
  { ID: 'GCOM', NOME: 'Gestor Comercial', REGISTO_VALIDO: 'S' },
  { ID: 'GCON', NOME: 'Gestor de Conta', REGISTO_VALIDO: 'S' },
  { ID: 'OLD', NOME: 'Antiga', REGISTO_VALIDO: 'N' },
];
// TTAPVAAT: NMTABLA 6 → função GCOM, 7 → GCON. GC100/GC300 are already used by the perfis above.
const ttapvaat = [
  { NMTABLA: 6, OTCLAVE1: 'GC100' },
  { NMTABLA: 6, OTCLAVE1: 'GC200' },
  { NMTABLA: 7, OTCLAVE1: 'GC300' },
  { NMTABLA: 7, OTCLAVE1: 'GC500' },
  { NMTABLA: 7, OTCLAVE1: 'NI' },
  { NMTABLA: 9, OTCLAVE1: 'GC200X' },
];

async function appWith(role: 'ADM' | 'USER' | null) {
  const app = Fastify();
  registerErrorHandler(app);
  await app.register(multipart);
  app.decorateRequest('session', null as never);
  app.addHook('onRequest', async (req) => {
    (req as { session: unknown }).session = { user: role ? { username: 'JOAO', role } : undefined };
  });
  const store = memoryStore(perfisDepartamento, perfis, { autoId: 'ID' });
  registerPerfisDepartamentoRoutes(app, {
    store,
    empregadosStore: memoryStore(empregadosLov, empregados),
    funcoesStore: memoryStore(funcoesDepartamento, funcoes),
    repo: memoryPerfisRepo({
      ttapvaat,
      funcoes,
      usados: async () => new Set(perfis.map((p) => p.CODIGO ?? '')),
    }),
    imageStore: memoryImageStore({
      exists: async (k) =>
        (await store.list({ filters: { ID: [{ op: 'eq', value: String(k['id']) }] }, sort: [], page: 1, size: 1 }, {}, { user: { username: 'J', role: 'ADM' } })).total > 0,
    }),
    maxBytes: 1024,
  });
  await app.ready();
  return app;
}

const novo = {
  CDEMPLEA: 'bb200y',
  CDDEPARTA: 'od68',
  DATA_INICIO: '2026-01-01T00:00:00',
  FUNCAODEP_ID: 'GCOM',
  DESCRICAO: 'Bruno',
  CODIGO: 'gc200',
};
const post = (app: Awaited<ReturnType<typeof appWith>>, values: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: '/api/perfis-departamento', payload: { values } });

describe('perfis-departamento CRUD', () => {
  it('lists by CDEMPLEA (form ORDER BY), ADM only', async () => {
    const app = await appWith('ADM');
    const r = await app.inject({ url: '/api/perfis-departamento' });
    expect(r.json().rows.map((x: { CDEMPLEA: string }) => x.CDEMPLEA)).toEqual(['AA100X', 'ZZ300X']);
    expect((await (await appWith('USER')).inject({ url: '/api/perfis-departamento' })).statusCode).toBe(403);
  });

  it('POST gives ID = MAX+1, upper-cases the typed codes and stamps the session user', async () => {
    const app = await appWith('ADM');
    const r = await post(app, novo);
    expect(r.statusCode).toBe(201);
    expect(r.json()).toMatchObject({
      ID: 4,
      CDEMPLEA: 'BB200Y',
      CDDEPARTA: 'OD68',
      CODIGO: 'GC200',
      CRIADO_POR: 'JOAO',
    });
  });

  it('POST refuses a client ID or audit column, and a missing required field', async () => {
    const app = await appWith('ADM');
    expect((await post(app, { ...novo, ID: 99 })).statusCode).toBe(400);
    expect((await post(app, { ...novo, CRIADO_POR: 'X' })).statusCode).toBe(400);
    const r = await post(app, { CDEMPLEA: 'BB200Y' });
    expect(r.statusCode).toBe(400);
    expect(Object.keys(r.json().fields)).toEqual(
      expect.arrayContaining([
        'values.CDDEPARTA',
        'values.DATA_INICIO',
        'values.FUNCAODEP_ID',
        'values.DESCRICAO',
      ]),
    );
  });

  it('PUT changes fields and stamps ACTUALIZADO_POR; CDDEPARTA is not editable', async () => {
    const app = await appWith('ADM');
    const [row] = (await app.inject({ url: '/api/perfis-departamento?f[ID]=1' })).json().rows;
    const { _rid, ...orig } = row;
    const put = (values: Record<string, unknown>) =>
      app.inject({
        method: 'PUT',
        url: `/api/perfis-departamento/${_rid}`,
        payload: { orig, values },
      });
    const ok = await put({ EMAIL: 'a@b.pt' });
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toMatchObject({ EMAIL: 'a@b.pt', ACTUALIZADO_POR: 'JOAO' });
    expect((await put({ CDDEPARTA: 'OD99' })).statusCode).toBe(400);
  });

  it('DELETE is refused for everyone, the ADM included (Forms deletes only unsaved rows)', async () => {
    const app = await appWith('ADM');
    const [row] = (await app.inject({ url: '/api/perfis-departamento?f[ID]=1' })).json().rows;
    const { _rid, ...orig } = row;
    const r = await app.inject({
      method: 'DELETE',
      url: `/api/perfis-departamento/${_rid}`,
      payload: { orig },
    });
    expect(r.statusCode).toBe(403);
    expect(r.json()).toMatchObject({ code: 'SEM_PERMISSAO' });
    expect((await app.inject({ url: '/api/perfis-departamento' })).json().total).toBe(2);
  });
});

describe('perfis-departamento sugestao (BR-ADM-04)', () => {
  const sugestao = (app: Awaited<ReturnType<typeof appWith>>, cdemplea: string) =>
    app.inject({ url: `/api/perfis-departamento/sugestao?cdemplea=${encodeURIComponent(cdemplea)}` });

  it('suggests the unused code containing the employee digits, with its função and name', async () => {
    const app = await appWith('ADM');
    // BB200Y → SUBSTR(x,3,LENGTH-3) = '200' → GC200 (nmtabla 6 → GCOM); GC200X is table 9: ignored
    expect((await sugestao(app, 'BB200Y')).json()).toEqual({
      CODIGO: 'GC200',
      FUNCAODEP_ID: 'GCOM',
      NOME: 'Gestor Comercial',
    });
  });

  it('skips codes already used by a perfil and codes shorter than the employee pattern needs', async () => {
    const app = await appWith('ADM');
    expect((await sugestao(app, 'AA100X')).json()).toEqual({
      CODIGO: null,
      FUNCAODEP_ID: null,
      NOME: null,
    });
    expect((await sugestao(app, 'AAB')).json().CODIGO).toBeNull();
  });

  it('takes the função of the suggested code (nmtabla 7 → GCON)', async () => {
    const app = await appWith('ADM');
    expect((await sugestao(app, 'QQ500Q')).json()).toEqual({
      CODIGO: 'GC500',
      FUNCAODEP_ID: 'GCON',
      NOME: 'Gestor de Conta',
    });
  });

  it('treats % and _ in the employee code as plain characters', async () => {
    const app = await appWith('ADM');
    expect((await sugestao(app, 'AA%%A')).json().CODIGO).toBeNull();
  });

  it('needs cdemplea (400) and an ADM (403)', async () => {
    const app = await appWith('ADM');
    expect((await app.inject({ url: '/api/perfis-departamento/sugestao' })).statusCode).toBe(400);
    expect((await sugestao(await appWith('USER'), 'BB200Y')).statusCode).toBe(403);
  });
});

describe('perfis-departamento lookups', () => {
  it('the employee LOV lists active employees only', async () => {
    const app = await appWith('ADM');
    const r = await app.inject({ url: '/api/empregados-lov' });
    expect(r.json().rows.map((x: { CDEMPLEA: string }) => x.CDEMPLEA)).toEqual(['AA100X', 'BB200Y']);
    expect((await app.inject({ url: '/api/empregados-lov?f[CDEMPLEA]=CC900Z' })).json().rows).toEqual([]);
    expect((await app.inject({ method: 'POST', url: '/api/empregados-lov', payload: { values: {} } })).statusCode).toBe(404);
  });

  it('the funções select feed lists valid funções by name descending', async () => {
    const app = await appWith('ADM');
    const r = await app.inject({ url: '/api/dominios/FUNCOES_DEPARTAMENTO/valores' });
    expect(r.json()).toEqual({
      rows: [
        { CHAVE: 'GCON', DESIGNACAO: 'Gestor de Conta' },
        { CHAVE: 'GCOM', DESIGNACAO: 'Gestor Comercial' },
      ],
    });
  });
});

describe('perfis-departamento assinatura', () => {
  const png = () => {
    const boundary = 'b0undary';
    const head = `--${boundary}\r\nContent-Disposition: form-data; name="ficheiro"; filename="a.png"\r\nContent-Type: image/png\r\n\r\n`;
    return {
      payload: Buffer.concat([Buffer.from(head), PNG, Buffer.from(`\r\n--${boundary}--\r\n`)]),
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    };
  };

  it('PUT, GET and DELETE the signature of a perfil by ID', async () => {
    const app = await appWith('ADM');
    const url = '/api/perfis-departamento/1/assinatura';
    expect((await app.inject({ url })).statusCode).toBe(204);
    expect((await app.inject({ method: 'PUT', url, ...png() })).statusCode).toBe(204);
    const r = await app.inject({ url });
    expect(r.headers['content-type']).toBe('image/png');
    expect(r.rawPayload.equals(PNG)).toBe(true);
    expect((await app.inject({ method: 'DELETE', url })).statusCode).toBe(204);
    expect((await app.inject({ url })).statusCode).toBe(204);
  });

  it('is 404 for a perfil that does not exist, 400 for a bad ID, 403 for a USER', async () => {
    const app = await appWith('ADM');
    expect((await app.inject({ method: 'PUT', url: '/api/perfis-departamento/99/assinatura', ...png() })).statusCode).toBe(404);
    expect((await app.inject({ url: '/api/perfis-departamento/abc/assinatura' })).statusCode).toBe(400);
    const user = await appWith('USER');
    expect((await user.inject({ url: '/api/perfis-departamento/1/assinatura' })).statusCode).toBe(403);
  });
});
