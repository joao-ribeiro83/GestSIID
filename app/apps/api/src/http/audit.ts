import type { FastifyRequest } from 'fastify';

/**
 * One pino audit line (ARCHITECTURE.md §5): `{ audit: true, event, user, role, ip, method, route,
 * reqId, details }`. Never put a password or hash in `details`.
 */
export function audit(request: FastifyRequest, event: string, details?: Record<string, unknown>): void {
  const user = request.currentUser;
  request.log.info(
    {
      audit: true,
      event,
      user: user?.username ?? null,
      role: user?.role ?? null,
      ip: request.ip,
      method: request.method,
      route: request.routeOptions.url,
      reqId: request.id,
      ...(details ? { details } : {}),
    },
    event,
  );
}
