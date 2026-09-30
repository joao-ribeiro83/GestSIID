import Fastify from 'fastify';
import { defineResource, type Role } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import type { DbConnection, DbPool } from '../db/oracle.ts';
import { registerErrorHandler } from '../http/errors.ts';
import { memoryStore } from '../features/dev/memoryStore.ts';
import { auditHooks, crudRoutes, oracleStore, SqlCall, SYSDATE, type CrudStore } from './crud.ts';

const res = defineResource({
  name: 'impressoras',
  source: 'CFG_IMPRESSORAS',
  columns: {
    ID: { type: 'number', label: 'Id', filter: ['eq'], sort: true },
    NOME: {
      type: 'text',
      label: 'Nome',
      filter: ['eq', 'like'],
      sort: true,
      edit: true,
      required: true,
    },
    DATA_INICIO: { type: 'date', label: 'Data Início', edit: true },
    CRIADO_POR: { type: 'text', label: 'Criado Por' },
    DATA_CRIACAO: { type: 'date', label: 'Data Criação' },
    ACTUALIZADO_POR: { type: 'text', label: 'Actualizado Por' },
    DATA_ACTUALIZACAO: { type: 'date', label: 'Data Actualização' },
  },
  defaultSort: [{ column: 'ID', direction: 'asc' }],
  tiebreak: 'ID',
  roles: { read: ['ADM', 'USER'], write: ['ADM'] },
});

const seed = [
  {
    ID: 1,
    NOME: 'HP 1',
    DATA_INICIO: '2026-01-01T00:00:00',
    CRIADO_POR: 'A',
    DATA_CRIACAO: null,
    ACTUALIZADO_POR: null,
    DATA_ACTUALIZACAO: null,
  },
  {
    ID: 2,
    NOME: 'Xerox',
    DATA_INICIO: null,
    CRIADO_POR: 'A',
    DATA_CRIACAO: null,
    ACTUALIZADO_POR: null,
    DATA_ACTUALIZACAO: null,
  },
];

async function appWith(
  role: Role | null,
  store: CrudStore = memoryStore(res, seed, { autoId: 'ID' }),
  path?: string,
) {
  const app = Fastify();
  registerErrorHandler(app);
  app.decorateRequest('session', null as never);
  app.addHook('onRequest', async (req) => {
    (req as { session: unknown }).session = { user: role ? { username: 'JOAO', role } : undefined };
  });
  crudRoutes(app, res, { store, hooks: auditHooks, ...(path ? { path } : {}) });
  await app.ready();
  return app;
}

describe('crudRoutes — list and get', () => {
  it('GET list returns the paged envelope, filtered and sorted', async () => {
    const app = await appWith('USER');
    const r = await app.inject({ url: '/api/impressoras?f[NOME][like]=hp%25&sort=NOME:desc' });
    expect(r.statusCode).toBe(200);
    const body = r.json();
    expect(body).toMatchObject({ total: 1, totalCapped: false, page: 1, size: 50 });
    expect(body.rows).toHaveLength(1);
    expect(body.rows[0]).toMatchObject({ ID: 1, NOME: 'HP 1' });
    expect(typeof body.rows[0]._rid).toBe('string');
  });

  it('an unknown filter column or malformed key is a 400 VALIDACAO', async () => {
    const app = await appWith('ADM');
    expect((await app.inject({ url: '/api/impressoras?f[PASSWORD]=x' })).json().code).toBe(
      'VALIDACAO',
    );
    expect((await app.inject({ url: '/api/impressoras?f[NOME][regex]=x' })).statusCode).toBe(400);
    expect((await app.inject({ url: '/api/impressoras?sort=NOME;DROP:asc' })).statusCode).toBe(400);
  });

  it('GET one returns the row, or 404', async () => {
    const app = await appWith('ADM');
    const rid = (await app.inject({ url: '/api/impressoras' })).json().rows[1]._rid;
    expect((await app.inject({ url: `/api/impressoras/${rid}` })).json()).toMatchObject({
      NOME: 'Xerox',
    });
    expect((await app.inject({ url: '/api/impressoras/nope' })).statusCode).toBe(404);
  });
});

describe('crudRoutes — role guards', () => {
  it('no session user → 401 SESSAO_EXPIRADA', async () => {
    const r = await (await appWith(null)).inject({ url: '/api/impressoras' });
    expect(r.statusCode).toBe(401);
    expect(r.json().code).toBe('SESSAO_EXPIRADA');
  });

  it('USER may read but not write → 403 SEM_PERMISSAO', async () => {
    const app = await appWith('USER');
    const r = await app.inject({
      method: 'POST',
      url: '/api/impressoras',
      payload: { values: { NOME: 'Nova' } },
    });
    expect(r.statusCode).toBe(403);
    expect(r.json().code).toBe('SEM_PERMISSAO');
  });
});

describe('crudRoutes — writes', () => {
  it('POST inserts with the audit columns taken from the session', async () => {
    const app = await appWith('ADM');
    const r = await app.inject({
      method: 'POST',
      url: '/api/impressoras',
      payload: { values: { NOME: 'Nova' } },
    });
    expect(r.statusCode).toBe(201);
    expect(r.json()).toMatchObject({ ID: 3, NOME: 'Nova', CRIADO_POR: 'JOAO' });
    expect(r.json().DATA_CRIACAO).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('POST rejects audit columns and unknown columns in the body', async () => {
    const app = await appWith('ADM');
    for (const values of [
      { NOME: 'x', CRIADO_POR: 'EU' },
      { NOME: 'x', ID: 9 },
      { NOME: 'x', 'NOME=1--': 1 },
    ]) {
      const r = await app.inject({ method: 'POST', url: '/api/impressoras', payload: { values } });
      expect(r.statusCode).toBe(400);
    }
  });

  it('PUT updates only the sent columns and stamps ACTUALIZADO_POR', async () => {
    const app = await appWith('ADM');
    const row = (await app.inject({ url: '/api/impressoras' })).json().rows[0];
    const r = await app.inject({
      method: 'PUT',
      url: `/api/impressoras/${row._rid}`,
      payload: { orig: { NOME: 'HP 1' }, values: { NOME: 'HP 2' } },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ NOME: 'HP 2', ACTUALIZADO_POR: 'JOAO', CRIADO_POR: 'A' });
  });

  it('PUT with a stale orig → 409 REGISTO_ALTERADO', async () => {
    const app = await appWith('ADM');
    const row = (await app.inject({ url: '/api/impressoras' })).json().rows[0];
    const r = await app.inject({
      method: 'PUT',
      url: `/api/impressoras/${row._rid}`,
      payload: { orig: { NOME: 'outro valor' }, values: { NOME: 'HP 2' } },
    });
    expect(r.statusCode).toBe(409);
    expect(r.json().code).toBe('REGISTO_ALTERADO');
  });

  it('DELETE removes the row → 204', async () => {
    const app = await appWith('ADM');
    const row = (await app.inject({ url: '/api/impressoras' })).json().rows[0];
    const r = await app.inject({
      method: 'DELETE',
      url: `/api/impressoras/${row._rid}`,
      payload: { orig: { NOME: 'HP 1' } },
    });
    expect(r.statusCode).toBe(204);
    expect((await app.inject({ url: '/api/impressoras' })).json().total).toBe(1);
  });
});

describe('crudRoutes — detail path', () => {
  it('passes parent keys from the path to the store, typed by the column', async () => {
    const seen: unknown[] = [];
    const spy: CrudStore = {
      async list(_q, parent) {
        seen.push(parent);
        return { rows: [], total: 0 };
      },
      get: async () => undefined,
      insert: async () => ({}),
      update: async () => ({}),
      remove: async () => {},
    };
    const detail = defineResource({ ...res, parentKeys: ['ID'] });
    const app = Fastify();
    registerErrorHandler(app);
    app.decorateRequest('session', null as never);
    app.addHook('onRequest', async (req) => {
      (req as { session: unknown }).session = { user: { username: 'J', role: 'ADM' } };
    });
    crudRoutes(app, detail, { store: spy, path: '/api/master/:ID/detalhe' });
    await app.ready();
    expect((await app.inject({ url: '/api/master/7/detalhe' })).statusCode).toBe(200);
    expect(seen).toEqual([{ ID: 7 }]);
    expect((await app.inject({ url: '/api/master/x/detalhe' })).statusCode).toBe(400);
  });
});

describe('oracleStore — SQL', () => {
  function fakePool(results: unknown[]) {
    const calls: { sql: string; binds: Record<string, unknown> }[] = [];
    const conn: DbConnection = {
      async execute(sql: string, binds?: unknown) {
        calls.push({ sql, binds: (binds ?? {}) as Record<string, unknown> });
        return (results.shift() ?? { rows: [] }) as never;
      },
      executeMany: async () => ({}) as never,
      commit: async () => {
        calls.push({ sql: 'COMMIT', binds: {} });
      },
      rollback: async () => {
        calls.push({ sql: 'ROLLBACK', binds: {} });
      },
      close: async () => {},
    };
    const pool: DbPool = { getConnection: async () => conn };
    return { pool, calls };
  }
  const ctx = { user: { username: 'JOAO', role: 'ADM' as const } };

  it('list runs the list and count queries and URL-encodes the ROWID', async () => {
    const { pool } = fakePool([
      { rows: [{ ID: 1, _rid: 'AAAR3sAAEAAAACXAA+/' }] },
      { rows: [{ N: 1 }] },
    ]);
    const out = await oracleStore(pool, res, 1000).list(
      { filters: {}, sort: [], page: 1, size: 50 },
      {},
      ctx,
    );
    expect(out).toEqual({ rows: [{ ID: 1, _rid: 'AAAR3sAAEAAAACXAA-_' }], total: 1 });
  });

  it('list applies the per-role sort list of the session role (no SQL runs on a 400)', async () => {
    const { pool, calls } = fakePool([]);
    const limited = defineResource({ ...res, sortRoles: { USER: ['ID'] } });
    await expect(
      oracleStore(pool, limited, 1000).list(
        { filters: {}, sort: [{ column: 'NOME', direction: 'asc' }], page: 1, size: 50 },
        {},
        { user: { username: 'U', role: 'USER' } },
      ),
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDACAO' });
    expect(calls).toEqual([]);
  });

  it('insert binds values, converts dates, inlines SYSDATE and returns the ROWID', async () => {
    const { pool, calls } = fakePool([
      { outBinds: { rid: ['AAAR3sAAEAAAACXAAA'] } },
      { rows: [{ ID: 3 }] },
    ]);
    await oracleStore(pool, res, 1000).insert(
      {
        NOME: "O'Brien",
        DATA_INICIO: '2026-01-01T00:00:00',
        CRIADO_POR: 'JOAO',
        DATA_CRIACAO: SYSDATE,
      },
      {},
      ctx,
    );
    expect(calls[0]?.sql).toBe(
      'INSERT INTO CFG_IMPRESSORAS (NOME, DATA_INICIO, CRIADO_POR, DATA_CRIACAO) VALUES ' +
        '(:v0, TO_DATE(:v1,\'YYYY-MM-DD"T"HH24:MI:SS\'), :v2, SYSDATE) RETURNING ROWID INTO :rid',
    );
    expect(calls[0]?.binds).toMatchObject({ v0: "O'Brien", v1: '2026-01-01T00:00:00', v2: 'JOAO' });
    expect(calls.map((c) => c.sql)).toContain('COMMIT');
  });

  it('update locks the row with the original values (dates compared as text) before the UPDATE', async () => {
    const { pool, calls } = fakePool([
      { rows: [{ 1: 1 }] },
      { rowsAffected: 1 },
      { rows: [{ ID: 1 }] },
    ]);
    await oracleStore(pool, res, 1000).update(
      'AAAR3sAAEAAAACXAA-_',
      { NOME: 'HP 1', DATA_INICIO: '2026-01-01T00:00:00' },
      { NOME: 'HP 2' },
      ctx,
    );
    expect(calls[0]?.sql).toContain(
      'FROM CFG_IMPRESSORAS WHERE ROWID = :rid AND (NOME = :__orig_0',
    );
    expect(calls[0]?.sql).toContain('TO_CHAR(DATA_INICIO,\'YYYY-MM-DD"T"HH24:MI:SS\') = :__orig_1');
    expect(calls[0]?.sql).toContain('FOR UPDATE NOWAIT');
    expect(calls[0]?.binds).toMatchObject({ rid: 'AAAR3sAAEAAAACXAA+/' });
    expect(calls[1]?.sql).toBe(
      'UPDATE CFG_IMPRESSORAS SET NOME = :v0 WHERE ROWID = :rid RETURNING ROWID INTO :nrid',
    );
  });

  it('insert has room for the long logical ROWID of an index-organized table', async () => {
    const { pool, calls } = fakePool([{ outBinds: { rid: ['*BAnABgwFRDEuQTH+'] } }, { rows: [{ ID: 3 }] }]);
    await oracleStore(pool, res, 1000).insert({ NOME: 'x' }, {}, ctx);
    expect((calls[0]?.binds['rid'] as { maxSize: number }).maxSize).toBe(4000);
  });

  it('update re-reads the row by the ROWID the UPDATE returns (an IOT key change moves the row)', async () => {
    const { pool, calls } = fakePool([
      { rows: [{ 1: 1 }] },
      { rowsAffected: 1, outBinds: { nrid: ['*BAnNOVO+'] } },
      { rows: [{ ID: 1, _rid: '*BAnNOVO+' }] },
    ]);
    const row = await oracleStore(pool, res, 1000).update('*BAnABgwFRDEuQTVELHO-', {}, { NOME: 'HP 2' }, ctx);
    expect(calls[1]?.sql).toBe('UPDATE CFG_IMPRESSORAS SET NOME = :v0 WHERE ROWID = :rid RETURNING ROWID INTO :nrid');
    expect(calls[2]?.binds).toEqual({ rid: '*BAnNOVO+' });
    expect(row['_rid']).toBe('*BAnNOVO-');
  });

  it('a lock that finds no row rolls back with 409 REGISTO_ALTERADO', async () => {
    const { pool, calls } = fakePool([{ rows: [] }]);
    await expect(
      oracleStore(pool, res, 1000).remove('AAAR3sAAEAAAACXAA-_', { NOME: 'x' }, ctx),
    ).rejects.toMatchObject({ statusCode: 409, code: 'REGISTO_ALTERADO' });
    expect(calls.map((c) => c.sql)).toContain('ROLLBACK');
  });

  const secret = defineResource({
    name: 'utilizadores',
    source: 'CFG_UTILIZADORES',
    columns: {
      USERNAME: { type: 'code', label: 'Utilizador', insertOnly: true, required: true },
      PASSWORD: { type: 'text', label: 'Password', edit: true, writeOnly: true },
    },
    defaultSort: [{ column: 'USERNAME', direction: 'asc' }],
    tiebreak: 'USERNAME',
    roles: { read: ['ADM'], write: ['ADM'] },
  });
  const hash = (v: string) => new SqlCall('RAWTOHEX(USER_SECURITY.ENCRYPT(?))', v);

  it('insert puts a SqlCall in the same statement with its argument as a bind (no secret in the SQL text)', async () => {
    const { pool, calls } = fakePool([{ outBinds: { rid: ['AAAR3sAAEAAAACXAAA'] } }, { rows: [] }]);
    await oracleStore(pool, secret, 1000).insert(
      { USERNAME: 'ANA', PASSWORD: hash('s3gredo') },
      {},
      ctx,
    );
    expect(calls[0]?.sql).toBe(
      'INSERT INTO CFG_UTILIZADORES (USERNAME, PASSWORD) VALUES ' +
        '(:v0, RAWTOHEX(USER_SECURITY.ENCRYPT(:v1))) RETURNING ROWID INTO :rid',
    );
    expect(calls[0]?.sql).not.toContain('s3gredo');
    expect(calls[0]?.binds).toMatchObject({ v0: 'ANA', v1: 's3gredo' });
    // The read-back after the INSERT must not select the column either.
    expect(calls[1]?.sql).not.toContain('PASSWORD');
  });

  it('update sets it through the same SqlCall', async () => {
    const { pool, calls } = fakePool([{ rows: [{ 1: 1 }] }, { rowsAffected: 1 }, { rows: [] }]);
    await oracleStore(pool, secret, 1000).update(
      'AAAR3sAAEAAAACXAA-_',
      { USERNAME: 'ANA' },
      { PASSWORD: hash('nova') },
      ctx,
    );
    expect(calls[1]?.sql).toBe(
      'UPDATE CFG_UTILIZADORES SET PASSWORD = RAWTOHEX(USER_SECURITY.ENCRYPT(:v0)) WHERE ROWID = :rid RETURNING ROWID INTO :nrid',
    );
    expect(calls[1]?.binds).toMatchObject({ v0: 'nova' });
  });
});
