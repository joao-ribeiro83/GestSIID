import { DOCUMENTO_DETALHE_SO_ADM, parseListQuery } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import type { DbConnection, DbPool } from '../../db/oracle.ts';
import { oracleDocumentosRepo } from './repo.ts';

/** oracleDocumentosRepo on a fake connection: which SELECTs run, with which binds. Only SELECTs. */

function fakePool(answer: (sql: string, binds: Record<string, unknown>) => unknown[]) {
  const calls: { sql: string; binds: Record<string, unknown> }[] = [];
  const conn = {
    async execute(sql: string, binds?: unknown) {
      const b = (binds ?? {}) as Record<string, unknown>;
      calls.push({ sql, binds: b });
      return { rows: answer(sql, b) } as never;
    },
    executeMany: async () => ({}) as never,
    commit: async () => {},
    rollback: async () => {},
    close: async () => {},
  } as unknown as DbConnection;
  const pool: DbPool = { getConnection: async () => conn };
  return { pool, calls };
}

const adm = { user: { username: 'JOAO', role: 'ADM' as const } };

describe('oracleDocumentosRepo', () => {
  it('list: grupo on a grouped model reads the document, then the D1 bounds with NVL(:lote,-1) folded', async () => {
    const { pool, calls } = fakePool((sql) => {
      if (sql.includes('FROM SVR_DOCUMENTOS WHERE ID')) return [{ ID: 7, MODELO_ID: 'R3.D25', LOTE_ID: null, LOTE_ORDEM: 2, DESTINATARIO: null }];
      if (sql.startsWith('SELECT MAX')) return [{ V: 1 }];
      if (sql.startsWith('SELECT MIN')) return [{ V: null }];
      if (sql.startsWith('SELECT COUNT')) return [{ N: 0 }];
      return [];
    });
    await oracleDocumentosRepo(pool, 1000).list(parseListQuery({ grupo: '7' }), adm);
    const max = calls.find((c) => c.sql.startsWith('SELECT MAX'));
    expect(max?.binds).toEqual({ m: 'D1.A7', o: 2, l: -1 });
    const list = calls.find((c) => c.sql.includes('FROM SVR_DOCUMENTOS WHERE (LOTE'));
    expect(list?.sql).toContain('(LOTE_ID IS NULL AND LOTE_ORDEM >= :egmin AND DESTINATARIO IS NULL AND MODELO_ID IN (:egm0, :egm1))');
    expect(list?.binds).toMatchObject({ egmin: 1, egm0: 'D1.A7', egm1: 'R3.D25' });
    expect(calls.every((c) => /^\s*SELECT\b/i.test(c.sql))).toBe(true);
  });

  it('list: grupo on another model reads the attachment parent', async () => {
    const { pool, calls } = fakePool((sql) => {
      if (sql.includes('FROM SVR_DOCUMENTOS WHERE ID')) return [{ ID: 12, MODELO_ID: 'E.E1', LOTE_ID: null, LOTE_ORDEM: null, DESTINATARIO: 'X' }];
      if (sql.includes('FROM SVR_ANEXOS_DOCUMENTO WHERE ANEXODOC_ID')) return [{ DOCUMENTO_ID: 11 }];
      if (sql.includes('FROM SVR_ANEXOS_DOCUMENTO WHERE DOCUMENTO_ID')) return [{ ANEXODOC_ID: 12 }, { ANEXODOC_ID: 13 }];
      if (sql.startsWith('SELECT COUNT')) return [{ N: 0 }];
      return [];
    });
    await oracleDocumentosRepo(pool, 1000).list(parseListQuery({ grupo: '12' }), adm);
    expect(calls.find((c) => c.sql.includes('FROM SVR_DOCUMENTOS WHERE (ID IN'))?.binds).toMatchObject({ eg0: 11, eg1: 12, eg2: 13 });
  });

  it('list: grupo of a missing document is 404, before the list query', async () => {
    const { pool, calls } = fakePool(() => []);
    await expect(oracleDocumentosRepo(pool, 1000).list(parseListQuery({ grupo: '9' }), adm)).rejects.toMatchObject({ statusCode: 404 });
    expect(calls).toHaveLength(1);
  });

  it('list: params and preset go into one WHERE; USER sort limit applies', async () => {
    const { pool, calls } = fakePool((sql) => (sql.startsWith('SELECT COUNT') ? [{ N: 3 }] : []));
    const out = await oracleDocumentosRepo(pool, 1000).list(parseListQuery({ preset: 'nao-executados', 'param[P_ANO]': '2026' }), adm);
    expect(out.total).toBe(3);
    expect(calls[0]?.sql).toContain('FROM SVR_DOCUMENTOS_VW WHERE (estado is null) AND (ID IN (SELECT DOCUMENTO_ID FROM SVR_PARAMETROS_DOC_NOME_VW WHERE NOME = :en0 AND VALOR LIKE :ev0)) ORDER BY ID DESC');
    await expect(
      oracleDocumentosRepo(pool, 1000).list(parseListQuery({ sort: 'ESTADO:asc' }), { user: { username: 'U', role: 'USER' } }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('list: page ids and count from SVR_DOCUMENTOS, then the view rows by id, in page order', async () => {
    const { pool, calls } = fakePool((sql) => {
      if (sql.startsWith('SELECT COUNT')) return [{ N: 2 }];
      if (sql.includes('FROM SVR_DOCUMENTOS WHERE')) return [{ ID: 9 }, { ID: 4 }];
      if (sql.includes('FROM SVR_DOCUMENTOS_VW WHERE ID IN')) return [{ ID: 4, ESTADO: 'X' }, { ID: 9, ESTADO: 'Y' }];
      return [];
    });
    const out = await oracleDocumentosRepo(pool, 1000).list(parseListQuery({ preset: 'em-erro', sort: 'DATA_PEDIDO:desc' }), adm);
    expect(out).toEqual({ rows: [{ ID: 9, ESTADO: 'Y' }, { ID: 4, ESTADO: 'X' }], total: 2 });
    expect(calls[0]?.sql).toMatch(/FROM SVR_DOCUMENTOS WHERE \(id IN .*\) ORDER BY DATA_PEDIDO DESC, ID ASC OFFSET/);
    expect(calls[1]?.sql).toMatch(/SELECT 1 FROM SVR_DOCUMENTOS WHERE/);
    expect(calls[2]?.sql).toContain('FROM SVR_DOCUMENTOS_VW WHERE ID IN (:i0, :i1)');
    expect(calls[2]?.binds).toEqual({ i0: 9, i1: 4 });
  });

  it('list: an empty page skips the view read', async () => {
    const { pool, calls } = fakePool((sql) => (sql.startsWith('SELECT COUNT') ? [{ N: 0 }] : []));
    expect(await oracleDocumentosRepo(pool, 1000).list(parseListQuery({}), adm)).toEqual({ rows: [], total: 0 });
    expect(calls.some((c) => c.sql.includes('SVR_DOCUMENTOS_VW'))).toBe(false);
  });

  it('list: ESTADO / DISPONIBILIDADE in a preset, filter or sort → one query on the view', async () => {
    for (const raw of [{ preset: 'nao-executados' }, { preset: 'a-executar' }, { preset: 'execucao' }, { 'f[ESTADO]': 'ERRO' }, { 'f[DISPONIBILIDADE]': 'ANU' }, { sort: 'ESTADO:asc' }]) {
      const { pool, calls } = fakePool((sql) => (sql.startsWith('SELECT COUNT') ? [{ N: 0 }] : []));
      await oracleDocumentosRepo(pool, 1000).list(parseListQuery(raw), adm);
      expect(calls, JSON.stringify(raw)).toHaveLength(2);
      for (const c of calls) expect(c.sql).toMatch(/FROM SVR_DOCUMENTOS_VW/);
      expect(calls[1]?.sql).toContain('SELECT 1 FROM SVR_DOCUMENTOS_VW');
    }
  });

  it('detalhe: USER SQL never selects the ADM-only columns', async () => {
    const { pool, calls } = fakePool(() => []);
    await oracleDocumentosRepo(pool, 1000).detalhe(1, 'USER', adm.user);
    const cols = (calls[0]?.sql.match(/^SELECT (.*) FROM/)?.[1] ?? '').split(', ').map((c) => c.split(' AS ').pop());
    for (const c of DOCUMENTO_DETALHE_SO_ADM) expect(cols).not.toContain(c);
    expect(cols).toContain('ATRIBUTO9');
    expect(calls[0]?.sql).toContain("TO_CHAR(DATA_PEDIDO,'YYYY-MM-DD\"T\"HH24:MI:SS') AS DATA_PEDIDO");
  });

  it('conversao: exactly one row → its value; two rows → null', async () => {
    const one = fakePool(() => [{ V: '5' }]);
    expect(await oracleDocumentosRepo(one.pool, 1000).conversao('recibo', '9', adm.user)).toBe('5');
    expect(one.calls[0]?.binds).toEqual({ v: '9' });
    const two = fakePool(() => [{ V: '5' }, { V: '6' }]);
    expect(await oracleDocumentosRepo(two.pool, 1000).conversao('pessoa', 'X', adm.user)).toBeNull();
  });
});
