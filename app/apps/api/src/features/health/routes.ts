import type { FastifyInstance } from 'fastify';

export interface HealthDeps {
  ambiente: string;
  /** Runs `SELECT 1 FROM DUAL` and resolves with the round-trip latency in ms. */
  checkDb: () => Promise<number>;
  /** '' or '/segment' (D-09); the route mounts at `${basePath}/api/health`. */
  basePath?: string;
}

/** GET /api/health (§2): public, `logLevel: 'warn'` so it doesn't spam info-level access logs. */
export function registerHealthRoute(app: FastifyInstance, deps: HealthDeps): void {
  const url = `${deps.basePath ?? ''}/api/health`;
  app.get(url, { logLevel: 'warn', config: { public: true } }, async (_request, reply) => {
    try {
      const latencyMs = await deps.checkDb();
      return { ok: true, ambiente: deps.ambiente, db: { ok: true, latencyMs } };
    } catch {
      reply.status(503);
      return { ok: false, ambiente: deps.ambiente, db: { ok: false } };
    }
  });
}
