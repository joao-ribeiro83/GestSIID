import type { FastifyInstance, FastifyRequest, preHandlerAsyncHookHandler } from 'fastify';
import { pt, type Role } from '@gestsiid/shared';
import { AppError } from '../db/errors.ts';
import { verifyCsrfToken } from './csrf.ts';

/** `session.user` (ARCHITECTURE.md §5), set only by POST /api/auth/login. */
export interface SessionUser {
  username: string;
  nome: string;
  role: Role;
  ambiente: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    /** The logged-in user; services fill CRIADO_POR / ACTUALIZADO_POR from it, never from the body. */
    readonly currentUser: SessionUser | undefined;
  }
  interface FastifyContextConfig {
    /** No session needed (health, login); also exempt from the CSRF check. */
    public?: boolean;
  }
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * `request.currentUser` plus the CSRF check (§5): every non-GET request that carries a logged-in
 * session must send the session's token as `x-csrf-token`. Login is exempt because it has no
 * user yet. `csrf: false` only for the Oracle-less dev server (its demo session has no token).
 */
export function registerAuthGuard(app: FastifyInstance, opts: { csrf: boolean }): void {
  app.decorateRequest('currentUser', {
    getter(this: FastifyRequest) {
      return this.session?.get('user') as SessionUser | undefined;
    },
  });

  if (!opts.csrf) return;
  app.addHook('onRequest', async (request) => {
    if (SAFE_METHODS.has(request.method) || request.routeOptions.config.public) return;
    if (!request.currentUser) return;
    const expected = request.session.get('csrf') as string | undefined;
    const provided = request.headers['x-csrf-token'];
    if (!expected || !verifyCsrfToken(expected, typeof provided === 'string' ? provided : undefined))
      throw new AppError(403, 'CSRF', pt.csrfInvalido);
  });
}

/** preHandler: 401 SESSAO_EXPIRADA without a session user, 403 SEM_PERMISSAO for another role. */
export function requireRole(...roles: Role[]): preHandlerAsyncHookHandler {
  return async (request) => {
    const user = request.currentUser;
    if (!user) throw new AppError(401, 'SESSAO_EXPIRADA', pt.sessaoExpirada);
    if (!roles.includes(user.role)) throw new AppError(403, 'SEM_PERMISSAO', pt.semPermissao);
  };
}
