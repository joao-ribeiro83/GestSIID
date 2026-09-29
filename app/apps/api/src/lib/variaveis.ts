import { query, type DbPool } from '../db/oracle.ts';

/**
 * The `SVR_VARIAVEIS_SIID` variables the legacy forms read (grep of `analysis/forms-summary/T`):
 * `PASSWORD` (FD_GESTAO_SIID, written by FD_ALTERAR_PASSWORD), `BACKUP` (FD_NOVO_BACKUP: backup
 * destination) and `ONLINE` (FD_BACKUPS_ONLINE: online drive, `'E:\'` when missing).
 */
export type VariavelNome = 'PASSWORD' | 'BACKUP' | 'ONLINE';

export type GetVariavel = (nome: VariavelNome) => Promise<string | null>;

const SQL =
  'SELECT VALOR FROM SVR_VARIAVEIS_SIID WHERE AMBIENTE_ID = :ambiente AND TIPO_VARIAVEL_RF = :tipo';
const CACHE_MS = 60_000;
const SYSTEM_USER = { username: 'gestsiid' }; // no request behind a config read

/**
 * `getVariavel(nome)`: `VALOR` of the configured environment, `null` when the variable is not
 * defined or empty (the caller supplies its default, like the forms' `NVL`). Each name is cached for
 * 60s, "not defined" included; a failed read is not cached. ponytail: a plain Map, per process — a
 * change saved on the Variáveis screen shows up in other requests within a minute.
 */
export function createGetVariavel(deps: {
  pool: DbPool;
  ambiente: string;
  callTimeoutMs: number;
}): GetVariavel {
  const cache = new Map<VariavelNome, { valor: string | null; expires: number }>();
  return async (nome) => {
    const hit = cache.get(nome);
    if (hit && hit.expires > Date.now()) return hit.valor;

    const [row] = await query<{ VALOR: string | null }>(
      deps.pool,
      SYSTEM_USER,
      'variaveis.get',
      deps.callTimeoutMs,
      SQL,
      { ambiente: deps.ambiente, tipo: nome },
    );
    const valor = row?.VALOR ?? null;
    cache.set(nome, { valor, expires: Date.now() + CACHE_MS });
    return valor;
  };
}
