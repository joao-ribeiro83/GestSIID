import { describe, expect, it } from 'vitest';
import type { DbConnection, DbPool } from '../../db/oracle.ts';
import { SqlExpr } from '../../lib/crud.ts';
import { oraclePerfisRepo } from './repo.ts';
import { perfisHooks } from './routes.ts';

const ctx = { user: { username: 'JOAO', role: 'ADM' as const } };

function fakePool(rows: unknown[]) {
  const calls: { sql: string; binds: unknown }[] = [];
  const conn = {
    execute: async (sql: string, binds?: unknown) => {
      calls.push({ sql, binds });
      return { rows };
    },
    close: async () => {},
  } as unknown as DbConnection;
  const pool: DbPool = { getConnection: async () => conn };
  return { pool, calls };
}

describe('oraclePerfisRepo.sugestao', () => {
  it('binds the escaped middle of the employee code as a LIKE pattern', async () => {
    const { pool, calls } = fakePool([
      { CODIGO: 'GC200', FUNCAODEP_ID: 'GCOM', NOME: 'Gestor Comercial' },
    ]);
    const r = await oraclePerfisRepo(pool, 1000).sugestao('BB2_0%Y', ctx);
    expect(r).toEqual({ CODIGO: 'GC200', FUNCAODEP_ID: 'GCOM', NOME: 'Gestor Comercial' });
    expect(calls[0]?.binds).toEqual({ pat: '%2\\_0\\%%' });
    expect(calls[0]?.sql).toContain("LIKE :pat ESCAPE '\\'");
    expect(calls[0]?.sql).toContain('NOT EXISTS (SELECT 1 FROM DOC_PERFIS_DEPARTAMENTO');
  });

  it('a row of NULLs (no match) and a too-short code give no suggestion; the short one runs no SQL', async () => {
    const none = { CODIGO: null, FUNCAODEP_ID: null, NOME: null };
    const { pool, calls } = fakePool([none]);
    expect(await oraclePerfisRepo(pool, 1000).sugestao('BB200Y', ctx)).toEqual(none);
    expect(await oraclePerfisRepo(pool, 1000).sugestao('AAB', ctx)).toEqual(none);
    expect(calls).toHaveLength(1);
  });
});

describe('perfisHooks', () => {
  it('insert takes ID = MAX+1 in SQL and upper-cases the typed codes', () => {
    const v = perfisHooks.beforeInsert!({ CDEMPLEA: 'ab1' }, ctx);
    expect(v['ID']).toBeInstanceOf(SqlExpr);
    expect((v['ID'] as SqlExpr).sql).toBe('(SELECT NVL(MAX(ID), 0) + 1 FROM DOC_PERFIS_DEPARTAMENTO)');
    expect(v['CDEMPLEA']).toBe('AB1');
    expect(v['CRIADO_POR']).toBe('JOAO');
  });
});
