import type { FastifyInstance } from 'fastify';

const CSP =
  "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; object-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'";

export interface SecurityHeadersConfig {
  COOKIE_SECURE: boolean;
}

/** One onSend hook, the fixed header set (ARCHITECTURE.md §5). HSTS only once TLS is in front. */
export function registerSecurityHeaders(app: FastifyInstance, config: SecurityHeadersConfig): void {
  app.addHook('onSend', async (_request, reply) => {
    reply.header('Content-Security-Policy', CSP);
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Referrer-Policy', 'same-origin');
    if (config.COOKIE_SECURE) {
      reply.header('Strict-Transport-Security', 'max-age=31536000');
    }
  });
}
