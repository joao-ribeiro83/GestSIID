import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import type { AuthRepo } from './features/auth/repo.ts';
import { registerAuthRoutes } from './features/auth/routes.ts';
import { registerDevRoutes } from './features/dev/routes.ts';
import { registerHealthRoute } from './features/health/routes.ts';
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
  registerAuthGuard(app, { csrf: !deps.devMocks });

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

  if (deps.devMocks) await app.register(registerDevRoutes, { prefix: deps.config.BASE_PATH });

  if (deps.distDir)
    await registerSpa(app, { distDir: deps.distDir, basePath: deps.config.BASE_PATH });

  return app;
}
