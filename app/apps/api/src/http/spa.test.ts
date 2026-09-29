import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { registerSpa } from './spa.ts';

let distDir: string;

async function makeFixtureDist(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'gestsiid-spa-'));
  await writeFile(join(dir, 'index.html'), '<!doctype html>\n<html>\n<head></head>\n<body>app</body>\n</html>\n');
  await mkdir(join(dir, 'assets'));
  await writeFile(join(dir, 'assets', 'app.abc123.js'), 'console.log("hi")');
  await writeFile(join(dir, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  return dir;
}

async function buildApp(basePath = ''): Promise<FastifyInstance> {
  const app = Fastify();
  app.get(`${basePath}/api/health`, async () => ({ ok: true }));
  await registerSpa(app, { distDir, basePath });
  await app.ready();
  return app;
}

beforeEach(async () => {
  distDir = await makeFixtureDist();
});

afterEach(async () => {
  await rm(distDir, { recursive: true, force: true });
});

describe('registerSpa', () => {
  it('serves index.html at / with an injected <base href> and no-cache', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/', headers: { accept: 'text/html' } });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.headers['cache-control']).toBe('no-cache');
    expect(res.body).toContain('<base href="/">');
  });

  it('injects the configured BASE_PATH into <base href>', async () => {
    const app = await buildApp('/gestsiid');
    const res = await app.inject({
      method: 'GET',
      url: '/gestsiid/',
      headers: { accept: 'text/html' },
    });

    expect(res.body).toContain('<base href="/gestsiid/">');
  });

  it('falls back to index.html for an unknown client route with Accept: text/html', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/gestao/documentos',
      headers: { accept: 'text/html' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('<base href="/">');
  });

  it('a file outside assets/ (not content-hashed) is revalidated, never cached as immutable', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/favicon.svg' });

    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it('serves a hashed asset with a long, immutable cache header', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/assets/app.abc123.js' });

    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toBe('max-age=31536000, immutable');
    expect(res.body).toBe('console.log("hi")');
  });

  it('does not SPA-fallback an unmatched /api/* path', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/does-not-exist',
      headers: { accept: 'text/html' },
    });

    expect(res.headers['content-type']).not.toContain('text/html');
  });

  it('does not SPA-fallback a request that does not accept html', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/gestao/documentos',
      headers: { accept: 'application/json' },
    });

    expect(res.headers['content-type']).not.toContain('text/html');
  });
});
