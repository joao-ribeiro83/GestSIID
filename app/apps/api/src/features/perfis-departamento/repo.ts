import { queryOne, type DbPool } from '../../db/oracle.ts';
import type { CrudCtx } from '../../lib/crud.ts';

/** What BR-ADM-04 fills in when an employee is chosen on a new profile. All null = no suggestion. */
export interface Sugestao {
  CODIGO: string | null;
  FUNCAODEP_ID: string | null;
  NOME: string | null;
}

export interface PerfisRepo {
  sugestao(cdemplea: string, ctx: CrudCtx): Promise<Sugestao>;
}

const NENHUMA: Sugestao = { CODIGO: null, FUNCAODEP_ID: null, NOME: null };

/**
 * `SUBSTR(CDEMPLEA, 3, LENGTH(CDEMPLEA) - 3)`: the employee code without its first two and last
 * characters. Nothing left → null (no suggestion): Forms' `LIKE '%'||NULL||'%'` matched every code.
 */
const padrao = (cdemplea: string) => cdemplea.slice(2, -1) || null;

// FD_PERFIS_DEPARTAMENTO CODIGO WHEN-NEW-ITEM-INSTANCE. Table 6 → função GCOM, 7 → GCON.
// KEEP (DENSE_RANK LAST) gives the função of the greatest code; Forms took MAX(id) and MAX(nome)
// independently, which could pair a code with the other função's name.
const SUGESTAO_SQL = `SELECT MAX(g.OTCLAVE1) AS CODIGO,
       MAX(f.ID) KEEP (DENSE_RANK LAST ORDER BY g.OTCLAVE1) AS FUNCAODEP_ID,
       MAX(f.NOME) KEEP (DENSE_RANK LAST ORDER BY g.OTCLAVE1) AS NOME
FROM TTAPVAAT g JOIN DOC_FUNCOES_DEPARTAMENTO f ON f.ID = DECODE(g.NMTABLA, 6, 'GCOM', 7, 'GCON')
WHERE g.NMTABLA IN (6, 7)
  AND NOT EXISTS (SELECT 1 FROM DOC_PERFIS_DEPARTAMENTO p WHERE p.CODIGO = g.OTCLAVE1)
  AND g.OTCLAVE1 LIKE :pat ESCAPE '\\'`;

export function oraclePerfisRepo(pool: DbPool, callTimeoutMs: number): PerfisRepo {
  return {
    async sugestao(cdemplea, ctx) {
      const p = padrao(cdemplea);
      if (p === null) return NENHUMA;
      const row = await queryOne<Sugestao>(
        pool,
        ctx.user,
        'perfis-departamento.sugestao',
        callTimeoutMs,
        SUGESTAO_SQL,
        { pat: `%${p.replace(/[\\%_]/g, '\\$&')}%` },
      );
      return row?.CODIGO ? { CODIGO: row.CODIGO, FUNCAODEP_ID: row.FUNCAODEP_ID, NOME: row.NOME } : NENHUMA;
    },
  };
}

/** Same rule over plain arrays, for the dev server and unit tests. */
export function memoryPerfisRepo(data: {
  ttapvaat: { NMTABLA: number; OTCLAVE1: string }[];
  funcoes: { ID: string; NOME: string }[];
  usados: () => Promise<ReadonlySet<string>>;
}): PerfisRepo {
  return {
    async sugestao(cdemplea) {
      const p = padrao(cdemplea);
      if (p === null) return NENHUMA;
      const usados = await data.usados();
      const hit = data.ttapvaat
        .filter((t) => (t.NMTABLA === 6 || t.NMTABLA === 7) && !usados.has(t.OTCLAVE1) && t.OTCLAVE1.includes(p))
        .sort((a, b) => (a.OTCLAVE1 < b.OTCLAVE1 ? 1 : -1))
        .flatMap((t) => {
          const f = data.funcoes.find((x) => x.ID === (t.NMTABLA === 6 ? 'GCOM' : 'GCON'));
          return f ? [{ CODIGO: t.OTCLAVE1, FUNCAODEP_ID: f.ID, NOME: f.NOME }] : [];
        })[0];
      return hit ?? NENHUMA;
    },
  };
}
