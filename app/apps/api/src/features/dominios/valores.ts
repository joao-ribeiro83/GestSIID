import type { FastifyInstance } from 'fastify';
import { query, type DbPool } from '../../db/oracle.ts';
import { requireRole } from '../../http/auth-guard.ts';

export interface DominioValor {
  CHAVE: string;
  DESIGNACAO: string | null;
  PRIORIDADE: number | null;
}

/** The record-group query every legacy form's domain select uses (STRUCTURE.md, BR-ADM-01). */
const VALORES_SQL =
  'SELECT CHAVE, DESIGNACAO, PRIORIDADE FROM CFG_VALORES_DOMINIO WHERE DOMINIO_ID = :id' +
  ' ORDER BY PRIORIDADE, CHAVE';

const CACHE_MS = 60_000;

/**
 * Shared with `features/dominios/routes.ts`: a write to `CFG_VALORES_DOMINIO` invalidates the
 * written domain's entry so the lookup feed never serves stale rows for the rest of the 60s
 * window. ponytail: a plain Map, no cache library; per-process only, fine for a single API instance.
 */
export function createDominiosCache() {
  const map = new Map<string, { rows: DominioValor[]; expires: number }>();
  return {
    get: (id: string): DominioValor[] | undefined => {
      const hit = map.get(id);
      return hit && hit.expires > Date.now() ? hit.rows : undefined;
    },
    set: (id: string, rows: DominioValor[]): void => {
      map.set(id, { rows, expires: Date.now() + CACHE_MS });
    },
    invalidate: (id: string): void => {
      map.delete(id);
    },
  };
}
export type DominiosCache = ReturnType<typeof createDominiosCache>;

/**
 * `GET /api/dominios/:dominioId/valores`: the lookup source for every domain-backed select in
 * the app (Step 4.1). Domain values change rarely, so each domain id is cached in memory for 60s.
 */
export function registerDominiosRoutes(
  app: FastifyInstance,
  deps: { pool: DbPool; callTimeoutMs: number; cache?: DominiosCache },
): void {
  const cache = deps.cache ?? createDominiosCache();
  const anyRole = requireRole('ADM', 'USER');

  app.get('/api/dominios/:dominioId/valores', { preHandler: anyRole }, async (request) => {
    const { dominioId } = request.params as { dominioId: string };
    const hit = cache.get(dominioId);
    if (hit) return { rows: hit };

    const rows = await query<DominioValor>(
      deps.pool,
      request.currentUser!,
      'dominios.valores',
      deps.callTimeoutMs,
      VALORES_SQL,
      { id: dominioId },
    );
    cache.set(dominioId, rows);
    return { rows };
  });
}
