import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import { impressoras } from '@gestsiid/shared';
import { oracleStore } from './lib/crud.ts';
import type { DbPool } from './db/oracle.ts';
import type { AuthRepo } from './features/auth/repo.ts';
import { registerAuthRoutes } from './features/auth/routes.ts';
import { registerDevRoutes } from './features/dev/routes.ts';
import { registerDominiosRoutes } from './features/dominios/valores.ts';
import { registerHealthRoute } from './features/health/routes.ts';
import { registerImpressorasRoutes } from './features/impressoras/routes.ts';
import { registerAuthGuard } from './http/auth-guard.ts';
import { registerErrorHandler } from './http/errors.ts';
import { LoginThrottle } from './http/login-throttle.ts';
import { registerSecurityHeaders } from './http/security-headers.ts';
import { registerSession } from './http/session.ts';
import { registerSpa } from './http/spa.ts';

export interface AppConfig {
  COOKIE_SECURE: boolean;
  /** false, or the reverse proxy's address(es) / CIDR (config.ts). */
  TRUST_PROXY: string | false;
  BASE_PATH: string;
  SESSION_SECRET: string;
}

export interface AppDeps {
  config: AppConfig;
  ambiente: string;
  /** Runs `SELECT 1 FROM DUAL` and resolves with the round-trip latency in ms. */
  checkDb: () => Promise<number>;
  /** The built SPA (`apps/web/dist`); null = API only (dev server before a web build). */
  distDir: string | null;
  /** `/api/auth/*` data access; absent = no auth routes (the Oracle-less dev server). */
  authRepo?: AuthRepo;
  /** pino options; audit lines (§5) go here. Default: no logging. */
  logger?: FastifyServerOptions['logger'];
  /** `/dev/datablock` in-memory demo API (dev-server.ts only). */
  devMocks?: boolean;
  /** Oracle-backed resource routes (Impressoras, the domain lookup, …); absent = none registered. */
  db?: { pool: DbPool; callTimeoutMs: number };
}

/**
 * Assembles the Fastify app (§2, §8): security headers, session, the central error handler,
 * `GET /api/health`, and the static SPA with its client-route fallback. Tests call this
 * directly with fake deps instead of booting a real DB pool.
 */
export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({ trustProxy: deps.config.TRUST_PROXY, logger: deps.logger ?? false });

  registerSecurityHeaders(app, deps.config);
  registerErrorHandler(app);
  await registerSession(app, deps.config);
  // CSRF stays on whenever real login is possible, even in the Oracle-less dev server
  // (Step 3.2): only the auto-login dev demo (no authRepo) can skip it.
  registerAuthGuard(app, { csrf: deps.authRepo ? true : !deps.devMocks });

  registerHealthRoute(app, {
    ambiente: deps.ambiente,
    checkDb: deps.checkDb,
    basePath: deps.config.BASE_PATH,
  });

  if (deps.authRepo) {
    const throttle = new LoginThrottle();
    throttle.start();
    app.addHook('onClose', async () => throttle.stop());
    registerAuthRoutes(app, {
      repo: deps.authRepo,
      throttle,
      ambiente: deps.ambiente,
      basePath: deps.config.BASE_PATH,
    });
  }

  if (deps.devMocks)
    await app.register(registerDevRoutes, {
      prefix: deps.config.BASE_PATH,
      autoLogin: !deps.authRepo,
    });

  if (deps.db) {
    const { pool, callTimeoutMs } = deps.db;
    await app.register(
      async (sub) => {
        registerImpressorasRoutes(sub, { store: oracleStore(pool, impressoras, callTimeoutMs) });
        registerDominiosRoutes(sub, { pool, callTimeoutMs });
      },
      { prefix: deps.config.BASE_PATH },
    );
  }

  if (deps.distDir)
    await registerSpa(app, { distDir: deps.distDir, basePath: deps.config.BASE_PATH });

  return app;
}
