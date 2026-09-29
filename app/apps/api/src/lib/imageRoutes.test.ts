import Fastify from 'fastify';
import { z } from 'zod';
import multipart from '@fastify/multipart';
import oracledb from 'oracledb';
import { describe, expect, it } from 'vitest';
import type { DbConnection, DbPool } from '../db/oracle.ts';
import { registerErrorHandler } from '../http/errors.ts';
import { memoryImageStore } from '../features/dev/memoryImageStore.ts';
import { imageRoutes, oracleImageStore, sniffImage, type ImageStore } from './imageRoutes.ts';

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
const JPEG = Buffer.from('ffd8ffe000104a464946', 'hex');
const GIF = Buffer.from('474946383961010001', 'hex');
const BMP = Buffer.from('424d1e000000000000', 'hex');

function multipartBody(
  parts: { name: string; filename?: string; type?: string; data: Buffer | string }[],
) {
  const boundary = `----t${Math.random().toString(16).slice(2)}`;
  const chunks: Buffer[] = [];
  for (const p of parts) {
    const disp = `form-data; name="${p.name}"${p.filename ? `; filename="${p.filename}"` : ''}`;
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: ${disp}\r\n${p.type ? `Content-Type: ${p.type}\r\n` : ''}\r\n`,
      ),
      Buffer.from(p.data),
      Buffer.from('\r\n'),
    );
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return {
    payload: Buffer.concat(chunks),
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
  };
}
const file = (data: Buffer | string, name = 'ficheiro') =>
  multipartBody([{ name, filename: 'a.bin', type: 'application/octet-stream', data }]);

const URL = '/api/coisas/7/foto';

async function appWith(role: 'ADM' | 'USER' | null, store?: ImageStore, maxBytes = 1024) {
  const app = Fastify();
  registerErrorHandler(app);
  await app.register(multipart);
  app.decorateRequest('session', null as never);
  app.addHook('onRequest', async (req) => {
    (req as { session: unknown }).session = { user: role ? { username: 'JOAO', role } : undefined };
  });
  const s = store ?? memoryImageStore({ exists: (k) => k['id'] === 7 });
  imageRoutes(app, {
    path: '/api/coisas/:id/foto',
    store: s,
    key: (params) => ({ id: z.coerce.number().int().positive().parse(params['id']) }),
    roles: ['ADM'],
    maxBytes,
  });
  await app.ready();
  return { app, store: s };
}
const put = (app: Awaited<ReturnType<typeof appWith>>['app'], body: ReturnType<typeof file>) =>
  app.inject({ method: 'PUT', url: URL, ...body });

describe('sniffImage', () => {
  it('recognises JPEG, PNG, GIF and BMP by their first bytes, nothing else', () => {
    expect(sniffImage(JPEG)).toBe('image/jpeg');
    expect(sniffImage(PNG)).toBe('image/png');
    expect(sniffImage(GIF)).toBe('image/gif');
    expect(sniffImage(BMP)).toBe('image/bmp');
    expect(sniffImage(Buffer.from('<svg onload=alert(1)>'))).toBeNull();
    expect(sniffImage(Buffer.alloc(0))).toBeNull();
  });
});

describe('imageRoutes', () => {
  it.each([
    ['PNG', PNG, 'image/png'],
    ['JPEG', JPEG, 'image/jpeg'],
    ['GIF', GIF, 'image/gif'],
    ['BMP', BMP, 'image/bmp'],
  ])('PUT stores a %s and GET returns the same bytes with a safe header set', async (_n, bytes, mime) => {
    const { app } = await appWith('ADM');
    expect((await put(app, file(bytes))).statusCode).toBe(204);
    const r = await app.inject({ url: URL });
    expect(r.statusCode).toBe(200);
    expect(r.headers['content-type']).toBe(mime);
    expect(r.headers['cache-control']).toBe('private, no-store');
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.rawPayload.equals(bytes)).toBe(true);
  });

  it('PUT refuses bytes that are not an allowed image (415), whatever the declared type', async () => {
    const { app } = await appWith('ADM');
    const svg = multipartBody([
      { name: 'ficheiro', filename: 'x.png', type: 'image/png', data: '<svg onload=alert(1)>' },
    ]);
    const r = await put(app, svg);
    expect(r.statusCode).toBe(415);
    expect(r.json()).toMatchObject({ code: 'TIPO_FICHEIRO_INVALIDO' });
    expect((await put(app, file(Buffer.alloc(0)))).statusCode).toBe(415);
  });

  it('PUT refuses a file over the limit (413) and stores nothing', async () => {
    const { app } = await appWith('ADM', undefined, 64);
    const big = Buffer.concat([PNG, Buffer.alloc(100)]);
    const r = await put(app, file(big));
    expect(r.statusCode).toBe(413);
    expect(r.json()).toMatchObject({ code: 'FICHEIRO_GRANDE' });
    expect((await app.inject({ url: URL })).statusCode).toBe(404);
  });

  it('PUT refuses a request that is not multipart (415)', async () => {
    const { app } = await appWith('ADM');
    const r = await app.inject({ method: 'PUT', url: URL, payload: { a: 1 } });
    expect(r.statusCode).toBe(415);
  });

  it('PUT needs the field "ficheiro" and no other field (400)', async () => {
    const { app } = await appWith('ADM');
    expect((await put(app, file(PNG, 'outro'))).statusCode).toBe(400);
    const withField = multipartBody([
      { name: 'nome', data: 'x' },
      { name: 'ficheiro', filename: 'a.png', type: 'image/png', data: PNG },
    ]);
    expect((await put(app, withField)).statusCode).toBe(400);
    const none = multipartBody([{ name: 'nada', data: 'x' }]);
    expect((await put(app, none)).statusCode).toBe(400);
  });

  it('PUT on a key with no row is 404', async () => {
    const { app } = await appWith('ADM');
    const r = await app.inject({ method: 'PUT', url: '/api/coisas/8/foto', ...file(PNG) });
    expect(r.statusCode).toBe(404);
  });

  it('GET is 404 when there is no image; bytes of no known type are sent as an attachment', async () => {
    const { app, store } = await appWith('ADM');
    expect((await app.inject({ url: URL })).statusCode).toBe(404);
    await store.set({ id: 7 }, Buffer.from('legacy bytes'), { user: { username: 'J', role: 'ADM' } });
    const r = await app.inject({ url: URL });
    expect(r.headers['content-type']).toBe('application/octet-stream');
    expect(r.headers['content-disposition']).toBe('attachment');
    expect(r.headers['x-content-type-options']).toBe('nosniff');
  });

  it('DELETE removes the image (204) and 404s on a key with no row', async () => {
    const { app } = await appWith('ADM');
    await put(app, file(PNG));
    expect((await app.inject({ method: 'DELETE', url: URL })).statusCode).toBe(204);
    expect((await app.inject({ url: URL })).statusCode).toBe(404);
    expect((await app.inject({ method: 'DELETE', url: '/api/coisas/8/foto' })).statusCode).toBe(404);
  });

  it('refuses a USER (403) and no session (401) on all three verbs; a bad key is 400', async () => {
    const user = (await appWith('USER')).app;
    const anon = (await appWith(null)).app;
    for (const app of [user, anon]) {
      const codes = [
        (await app.inject({ url: URL })).statusCode,
        (await put(app, file(PNG))).statusCode,
        (await app.inject({ method: 'DELETE', url: URL })).statusCode,
      ];
      expect(codes).toEqual(app === user ? [403, 403, 403] : [401, 401, 401]);
    }
    const { app } = await appWith('ADM');
    const bad = await app.inject({ url: '/api/coisas/abc/foto' });
    expect(bad.statusCode).toBe(400);
  });
});

describe('oracleImageStore', () => {
  const ctx = { user: { username: 'JOAO', role: 'ADM' as const } };
  function fakePool(results: unknown[]) {
    const calls: { sql: string; binds: Record<string, unknown>; options?: unknown }[] = [];
    const conn: DbConnection = {
      async execute(sql: string, binds?: unknown, options?: unknown) {
        calls.push({ sql, binds: (binds ?? {}) as Record<string, unknown>, options });
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
  const cfg = { table: 'DOC_PERFIS_DEPARTAMENTO', column: 'ASSINATURA', keyWhere: 'ID = :id' };

  it('set locks the row, binds the Buffer as a BLOB plus the session user, then commits', async () => {
    const { pool, calls } = fakePool([{ rows: [{ 1: 1 }] }, { rowsAffected: 1 }]);
    const ok = await oracleImageStore(pool, cfg, 1000).set({ id: 7 }, PNG, ctx);
    expect(ok).toBe(true);
    expect(calls[0]?.sql).toBe(
      'SELECT 1 FROM DOC_PERFIS_DEPARTAMENTO WHERE ID = :id FOR UPDATE NOWAIT',
    );
    expect(calls[1]?.sql).toBe(
      'UPDATE DOC_PERFIS_DEPARTAMENTO SET ASSINATURA = :__img, ACTUALIZADO_POR = :__user, ' +
        'DATA_ACTUALIZACAO = SYSDATE WHERE ID = :id',
    );
    expect(calls[1]?.binds).toEqual({
      id: 7,
      __img: { val: PNG, type: oracledb.DB_TYPE_BLOB },
      __user: 'JOAO',
    });
    expect(calls.at(-1)?.sql).toBe('COMMIT');
  });

  it('set on a missing row returns false and writes nothing', async () => {
    const { pool, calls } = fakePool([{ rows: [] }]);
    expect(await oracleImageStore(pool, cfg, 1000).set({ id: 9 }, PNG, ctx)).toBe(false);
    expect(calls.map((c) => c.sql)).toEqual([expect.stringContaining('FOR UPDATE NOWAIT'), 'COMMIT']); // no UPDATE issued
  });

  it('set rolls back and rethrows when the UPDATE fails', async () => {
    const { pool, calls } = fakePool([{ rows: [{ 1: 1 }] }]);
    const conn = await pool.getConnection();
    const inner = conn.execute.bind(conn);
    let n = 0;
    conn.execute = (async (...a: Parameters<typeof inner>) => {
      if (++n === 2) throw Object.assign(new Error('ORA-12899'), { errorNum: 12899 });
      return inner(...a);
    }) as typeof conn.execute;
    await expect(oracleImageStore(pool, cfg, 1000).set({ id: 7 }, PNG, ctx)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(calls.at(-1)?.sql).toBe('ROLLBACK');
  });

  it('clear sets the column to NULL under the same lock', async () => {
    const { pool, calls } = fakePool([{ rows: [{ 1: 1 }] }, { rowsAffected: 1 }]);
    expect(await oracleImageStore(pool, cfg, 1000).clear({ id: 7 }, ctx)).toBe(true);
    expect(calls[1]?.sql).toBe(
      'UPDATE DOC_PERFIS_DEPARTAMENTO SET ASSINATURA = NULL, ACTUALIZADO_POR = :__user, ' +
        'DATA_ACTUALIZACAO = SYSDATE WHERE ID = :id',
    );
    expect(calls[1]?.binds).toEqual({ id: 7, __user: 'JOAO' });
  });

  it('get fetches the BLOB as a Buffer; no row or NULL is null', async () => {
    const { pool, calls } = fakePool([{ rows: [{ IMG: PNG }] }, { rows: [] }, { rows: [{ IMG: null }] }]);
    const store = oracleImageStore(pool, cfg, 1000);
    expect(await store.get({ id: 7 }, ctx)).toBe(PNG);
    expect(calls[0]?.sql).toBe('SELECT ASSINATURA AS IMG FROM DOC_PERFIS_DEPARTAMENTO WHERE ID = :id');
    expect(calls[0]?.options).toEqual({ fetchInfo: { IMG: { type: oracledb.BUFFER } } });
    expect(await store.get({ id: 8 }, ctx)).toBeNull();
    expect(await store.get({ id: 9 }, ctx)).toBeNull();
  });

  it('audit columns can be renamed or dropped, and a bad identifier is refused', async () => {
    const { pool, calls } = fakePool([{ rows: [{ 1: 1 }] }, { rowsAffected: 1 }]);
    await oracleImageStore(pool, { ...cfg, audit: null }, 1000).set({ id: 7 }, PNG, ctx);
    expect(calls[1]?.sql).toBe(
      'UPDATE DOC_PERFIS_DEPARTAMENTO SET ASSINATURA = :__img WHERE ID = :id',
    );
    expect(() => oracleImageStore(pool, { ...cfg, column: 'A; DROP TABLE X' }, 1000)).toThrow();
  });
});
