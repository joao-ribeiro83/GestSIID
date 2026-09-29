import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.ts';

let distDir: string;

async function makeFixtureDist(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'gestsiid-app-'));
  await writeFile(join(dir, 'index.html'), '<!doctype html>\n<html>\n<head></head>\n<body>app</body>\n</html>\n');
  return dir;
}

function deps(overrides: Partial<Parameters<typeof buildApp>[0]> = {}) {
  return {
    config: {
      COOKIE_SECURE: false,
      TRUST_PROXY: false,
      BASE_PATH: '',
      SESSION_SECRET: 'x'.repeat(32),
    },
    ambiente: 'GADOR_TESTES',
    checkDb: async () => 5,
    distDir,
    ...overrides,
  };
}

afterEach(async () => {
  await rm(distDir, { recursive: true, force: true });
});

describe('buildApp', () => {
  it('serves GET /api/health', async () => {
    distDir = await makeFixtureDist();
    const app = await buildApp(deps());
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json().ambiente).toBe('GADOR_TESTES');
    await app.close();
  });

  it('accepts a multipart signature upload on the dev app (multipart plugin is registered)', async () => {
    distDir = await makeFixtureDist();
    const app = await buildApp(deps({ devMocks: true }));
    const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
    const b = 'b0undary';
    const payload = Buffer.concat([
      Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="ficheiro"; filename="a.png"\r\nContent-Type: image/png\r\n\r\n`),
      png,
      Buffer.from(`\r\n--${b}--\r\n`),
    ]);
    const put = await app.inject({
      method: 'PUT',
      url: '/api/perfis-departamento/1/assinatura',
      payload,
      headers: { 'content-type': `multipart/form-data; boundary=${b}` },
    });
    expect(put.statusCode).toBe(204);
    const get = await app.inject({ url: '/api/perfis-departamento/1/assinatura' });
    expect(get.headers['content-type']).toBe('image/png');
    await app.close();
  });

  it('sets the fixed security headers on every response', async () => {
    distDir = await makeFixtureDist();
    const app = await buildApp(deps());
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    await app.close();
  });

  it('maps a thrown AppError through the central error handler', async () => {
    distDir = await makeFixtureDist();
    const app = await buildApp(deps());
    app.get('/api/_boom', async () => {
      const { AppError } = await import('./db/errors.ts');
      throw new AppError(409, 'REGISTO_ALTERADO', 'O registo foi alterado por outro utilizador. Volte a consultar.');
    });
    const res = await app.inject({ method: 'GET', url: '/api/_boom' });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe('REGISTO_ALTERADO');
    await app.close();
  });

  it('falls back to the SPA index.html for an unknown client route', async () => {
    distDir = await makeFixtureDist();
    const app = await buildApp(deps());
    const res = await app.inject({
      method: 'GET',
      url: '/gestao/documentos',
      headers: { accept: 'text/html' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('<base href="/">');
    await app.close();
  });

  it('mounts everything under BASE_PATH when configured', async () => {
    distDir = await makeFixtureDist();
    const app = await buildApp(deps({ config: { ...deps().config, BASE_PATH: '/gestsiid' } }));
    const res = await app.inject({ method: 'GET', url: '/gestsiid/api/health' });
    expect(res.statusCode).toBe(200);
    await app.close();
  });
});

describe('buildApp — TRUST_PROXY', () => {
  it('trusts only the listed proxy, so a client-written X-Forwarded-For entry is ignored', async () => {
    distDir = await makeFixtureDist();
    const app = await buildApp(deps({ config: { ...deps().config, TRUST_PROXY: '172.18.0.2' } }));
    app.get('/api/test/ip', async (req) => ({ ip: req.ip }));
    const res = await app.inject({
      method: 'GET',
      url: '/api/test/ip',
      remoteAddress: '172.18.0.2', // nginx
      headers: { 'x-forwarded-for': '6.6.6.6, 10.1.1.1' }, // client forged 6.6.6.6, nginx appended 10.1.1.1
    });
    expect(res.json().ip).toBe('10.1.1.1');
    await app.close();
  });
});
