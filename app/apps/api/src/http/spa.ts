import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance, FastifyReply } from 'fastify';

export interface SpaConfig {
  distDir: string;
  /** '' or '/segment' (D-09); the same value used for the API prefix and the cookie path. */
  basePath: string;
}

/**
 * Serves the built SPA (`apps/web/dist`) at `/` and falls back to `index.html` for any
 * unmatched GET whose path is not under `${basePath}/api` and whose Accept header wants html
 * (client-side routing). `index.html` is read once at startup and gets `<base href>` injected
 * (§2); hashed assets get a one-year immutable cache, `index.html` gets `no-cache`.
 *
 * `/` is registered explicitly rather than left to `@fastify/static`'s `index` option: static
 * treats a request that resolves to a directory as a listing and returns 403 instead of falling
 * through to a 404/fallback, so the root would never reach our SPA fallback logic otherwise.
 */
export async function registerSpa(app: FastifyInstance, config: SpaConfig): Promise<void> {
  const rawHtml = await readFile(join(config.distDir, 'index.html'), 'utf8');
  const html = rawHtml.replace('<head>', `<head>\n<base href="${config.basePath}/">`);
  const apiPrefix = `${config.basePath}/api`;

  const sendIndex = (reply: FastifyReply) => reply.header('Cache-Control', 'no-cache').type('text/html').send(html);

  app.get('/', async (_request, reply) => sendIndex(reply));

  await app.register(fastifyStatic, {
    root: config.distDir,
    prefix: '/',
    index: false,
    setHeaders(reply) {
      reply.header('Cache-Control', 'max-age=31536000, immutable');
    },
  });

  app.setNotFoundHandler((request, reply) => {
    const accept = request.headers.accept ?? '';
    const isApi = request.raw.url?.startsWith(apiPrefix) ?? false;

    if (request.method === 'GET' && !isApi && accept.includes('text/html')) {
      sendIndex(reply);
      return;
    }

    reply
      .status(404)
      .send({ code: 'NAO_ENCONTRADO', message: 'Registo não encontrado.', requestId: request.id });
  });
}
