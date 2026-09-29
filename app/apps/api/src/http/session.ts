import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import type { FastifyInstance } from 'fastify';
import { SessionStore } from './session-store.ts';

// Session data (§5): { user: { username, nome, role, ambiente }, createdAt, csrf }. An index
// signature (rather than listing those fields) keeps @fastify/session's `Session` type
// structurally equal to the plain `Record<string, unknown>` SessionStore stores and returns.
declare module 'fastify' {
  interface Session {
    [key: string]: unknown;
  }
}

export interface SessionPluginConfig {
  SESSION_SECRET: string;
  COOKIE_SECURE: boolean;
  BASE_PATH: string;
}

/**
 * Cookie + server-side session (§5): `gestsiid.sid`, httpOnly, SameSite=Lax, rolling (idle
 * expiry refreshed on every touch), `saveUninitialized: false` so a plain page load or health
 * check creates no session. Absolute (8h) and idle (30min) lifetime live in {@link SessionStore}.
 */
export async function registerSession(
  app: FastifyInstance,
  config: SessionPluginConfig,
): Promise<SessionStore> {
  const store = new SessionStore();

  await app.register(fastifyCookie);
  await app.register(fastifySession, {
    secret: config.SESSION_SECRET,
    cookieName: 'gestsiid.sid',
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.COOKIE_SECURE,
      path: config.BASE_PATH || '/',
    },
    saveUninitialized: false,
    rolling: true,
    // @fastify/session types its Store around its own `Session` class (which always carries a
    // `cookie` field); our store just persists plain session data keyed by sid, which is what
    // it actually calls at runtime. See session-store.ts's doc comment.
    store: store as unknown as fastifySession.SessionStore,
  });

  app.addHook('onClose', () => {
    store.stop();
  });

  return store;
}
