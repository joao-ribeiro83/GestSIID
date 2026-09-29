import { describe, expect, it } from 'vitest';
import type { DbConnection, DbPool } from '../../db/oracle.ts';
import { readOnlyPool } from '../../test/read-only-db.ts';
import { oraclePermissoesRepo } from './repo.ts';

/**
 * oraclePermissoesRepo against a fake connection that records SQL and binds (no Oracle).
 * Distinctive values (Z…X, 987654, 2031/2032 dates) make a literal in the SQL text easy to spot.
 */

function fakeDb(rowsFor: (sql: string) => unknown[] = () => []) {
  const calls: { sql: string; binds: unknown }[] = [];
  const state = { commits: 0, rollbacks: 0, closes: 0 };
  const conn = {
    async execute(sql: string, binds?: unknown) {
      calls.push({ sql, binds: binds ?? {} });
      return { rows: rowsFor(sql) };
    },
    async executeMany() {
      throw new Error('executeMany not expected');
    },
    async commit() {
      state.commits++;
    },
    async rollback() {
      state.rollbacks++;
    },
    async close() {
      state.closes++;
    },
  } as unknown as DbConnection;
  const pool: DbPool = { getConnection: async () => conn };
  return { pool, conn, calls, state, repo: oraclePermissoesRepo(pool, 1000) };
}

/** Bound values as strings (plain values or `{ val }` bind objects, named or positional). */
const bound = (binds: unknown) =>
  (Array.isArray(binds) ? binds : Object.values(binds as object)).map((v) =>
    String(v !== null && typeof v === 'object' && 'val' in v ? (v as { val: unknown }).val : v),
  );

const USER = { username: 'JOAO' };
const KEY = {
  MODELO_ID: 'ZMODX',
  USERNAME: 'ZUSERX',
  UNIDADE_NEGOCIO_RF: 'ZUNX',
  TIPO_PERMISSAO_RF: 987654,
  DATA_INICIO: '2031-02-03T04:05:06',
};
const FIM = '2032-07-08T09:10:11';
const LITERALS = ['ZMODX', 'ZUSERX', 'ZUNX', '987654', '2031-02-03', '2032-07-08', 'ZADMINX'];
const KEY_COLS = ['MODELO_ID', 'USERNAME', 'UNIDADE_NEGOCIO_RF', 'TIPO_PERMISSAO_RF', 'DATA_INICIO'];

const noLiterals = (sql: string) => {
  for (const v of LITERALS) expect(sql).not.toContain(v);
};

describe('transactions', () => {
  it('write() commits exactly once and releases the connection on success', async () => {
    const db = fakeDb();
    await db.repo.write(USER, 'permissoes.test', async (tx) => {
      await tx.insert({ ...KEY, DATA_FIM: null }, 'ZADMINX');
      await tx.insert({ ...KEY, MODELO_ID: 'ZMOD2X', DATA_FIM: null }, 'ZADMINX');
    });
    expect(db.state).toEqual({ commits: 1, rollbacks: 0, closes: 1 });
  });

  it('write() rolls back without committing and rethrows when fn throws', async () => {
    const db = fakeDb();
    const boom = new Error('boom');
    await expect(
      db.repo.write(USER, 'permissoes.test', async (tx) => {
        await tx.insert({ ...KEY, DATA_FIM: null }, 'ZADMINX');
        throw boom;
      }),
    ).rejects.toBe(boom);
    expect(db.state).toEqual({ commits: 0, rollbacks: 1, closes: 1 });
  });

  it('read() never commits and releases the connection', async () => {
    const db = fakeDb();
    await db.repo.read(USER, 'permissoes.test', (tx) => tx.find({ USERNAME: 'ZUSERX' }));
    expect(db.state.commits).toBe(0);
    expect(db.state.closes).toBe(1);
  });

  it('tags the connection with the session username', async () => {
    const db = fakeDb();
    await db.repo.read(USER, 'permissoes.test', (tx) => tx.find({}));
    expect(db.conn.clientId).toBe('JOAO');
  });

  it('find() and sem() pass the read-only guard used by the contract test', async () => {
    const db = fakeDb();
    const repo = oraclePermissoesRepo(readOnlyPool(db.pool), 1000);
    await repo.read(USER, 'permissoes.test', async (tx) => {
      await tx.find({ USERNAME: 'ZUSERX', UNIDADE_NEGOCIO_RF: 'ZUNX', TIPO_PERMISSAO_RF: 987654 });
      await tx.sem({ UNIDADE_NEGOCIO_RF: 'ZUNX', TIPO_PERMISSAO_RF: 987654, USERNAME: 'ZUSERX' });
      await tx.sem({ UNIDADE_NEGOCIO_RF: 'ZUNX', TIPO_PERMISSAO_RF: 987654, MODELO_ID: 'ZMODX' });
    });
    expect(db.calls.length).toBeGreaterThanOrEqual(3);
  });
});

describe('lock()', () => {
  const lockSql = (db: ReturnType<typeof fakeDb>) => db.calls.find((c) => /FOR\s+UPDATE\s+NOWAIT/i.test(c.sql));

  it('selects the row FOR UPDATE NOWAIT on CFG_PERMISSOES_SIID, keyed by all five key columns', async () => {
    const db = fakeDb((sql) => (/FOR\s+UPDATE/i.test(sql) ? [{ 1: 1 }] : []));
    await db.repo.write(USER, 'permissoes.test', (tx) => tx.lock(KEY));
    const call = lockSql(db);
    expect(call?.sql).toMatch(/^\s*SELECT\b[\s\S]*\bCFG_PERMISSOES_SIID\b/i);
    for (const col of KEY_COLS) expect(call?.sql).toContain(col);
    expect(bound(call?.binds)).toEqual(expect.arrayContaining(['ZMODX', 'ZUSERX', 'ZUNX', '987654', KEY.DATA_INICIO]));
    noLiterals(call?.sql ?? '');
  });

  it('also compares the original DATA_FIM when given', async () => {
    const db = fakeDb((sql) => (/FOR\s+UPDATE/i.test(sql) ? [{ 1: 1 }] : []));
    await db.repo.write(USER, 'permissoes.test', (tx) => tx.lock(KEY, { DATA_FIM: FIM }));
    const call = lockSql(db);
    expect(call?.sql).toContain('DATA_FIM');
    expect(bound(call?.binds)).toContain(FIM);
  });

  it('no row → 409 REGISTO_ALTERADO (and the write rolls back)', async () => {
    const db = fakeDb(() => []);
    await expect(db.repo.write(USER, 'permissoes.test', (tx) => tx.lock(KEY))).rejects.toMatchObject({
      statusCode: 409,
      code: 'REGISTO_ALTERADO',
    });
    expect(db.state.commits).toBe(0);
  });
});

describe('insert()', () => {
  it('INSERT INTO CFG_PERMISSOES_SIID with every value bound and DATA_CRIACAO = SYSDATE', async () => {
    const db = fakeDb();
    await db.repo.write(USER, 'permissoes.test', (tx) => tx.insert({ ...KEY, DATA_FIM: FIM }, 'ZADMINX'));
    const call = db.calls.find((c) => /^\s*INSERT\b/i.test(c.sql));
    expect(call?.sql).toMatch(/INSERT\s+INTO\s+CFG_PERMISSOES_SIID\b/i);
    expect(call?.sql).toMatch(/CRIADO_POR/);
    expect(call?.sql).toMatch(/DATA_CRIACAO/);
    expect(call?.sql).toMatch(/SYSDATE/);
    noLiterals(call?.sql ?? '');
    expect(bound(call?.binds)).toEqual(
      expect.arrayContaining(['ZMODX', 'ZUSERX', 'ZUNX', '987654', KEY.DATA_INICIO, FIM, 'ZADMINX']),
    );
  });
});

describe('update()', () => {
  it('UPDATE CFG_PERMISSOES_SIID on the five-column key, values bound, DATA_ACTUALIZACAO = SYSDATE', async () => {
    const db = fakeDb();
    const novoIni = '2031-09-09T00:00:00';
    await db.repo.write(USER, 'permissoes.test', (tx) =>
      tx.update(KEY, { DATA_INICIO: novoIni, DATA_FIM: FIM }, 'ZADMINX'),
    );
    const call = db.calls.find((c) => /^\s*UPDATE\b/i.test(c.sql));
    expect(call?.sql).toMatch(/UPDATE\s+CFG_PERMISSOES_SIID\b/i);
    for (const col of [...KEY_COLS, 'DATA_FIM', 'ACTUALIZADO_POR', 'DATA_ACTUALIZACAO']) expect(call?.sql).toContain(col);
    expect(call?.sql).toMatch(/SYSDATE/);
    noLiterals(call?.sql ?? '');
    expect(call?.sql).not.toContain('2031-09-09');
    expect(bound(call?.binds)).toEqual(
      expect.arrayContaining(['ZMODX', 'ZUSERX', 'ZUNX', '987654', KEY.DATA_INICIO, novoIni, FIM, 'ZADMINX']),
    );
  });
});

describe('find()', () => {
  it('selects CFG_PERMISSOES_SIID with the filter values bound and returns the rows', async () => {
    const row = { ...KEY, DATA_FIM: null };
    const db = fakeDb(() => [row]);
    const rows = await db.repo.read(USER, 'permissoes.test', (tx) =>
      tx.find({ USERNAME: 'ZUSERX', UNIDADE_NEGOCIO_RF: 'ZUNX', TIPO_PERMISSAO_RF: 987654 }),
    );
    expect(rows).toEqual([row]);
    const call = db.calls.find((c) => /CFG_PERMISSOES_SIID/i.test(c.sql));
    expect(call?.sql).toMatch(/^\s*SELECT\b[\s\S]*\bFROM\s+CFG_PERMISSOES_SIID\b/i);
    noLiterals(call?.sql ?? '');
    expect(bound(call?.binds)).toEqual(expect.arrayContaining(['ZUSERX', 'ZUNX', '987654']));
  });
});

describe('sem()', () => {
  it('user scope: selects CTR_SEM_PERMISSAO_USER_VW with unit, type and user bound', async () => {
    const semRow = { MODELO_ID: 'ZMODX', USERNAME: 'ZUSERX', NOME: 'Z' };
    const db = fakeDb(() => [semRow]);
    const rows = await db.repo.read(USER, 'permissoes.test', (tx) =>
      tx.sem({ UNIDADE_NEGOCIO_RF: 'ZUNX', TIPO_PERMISSAO_RF: 987654, USERNAME: 'ZUSERX' }),
    );
    expect(rows).toEqual([semRow]);
    const call = db.calls.find((c) => /CTR_SEM_PERMISSAO_USER_VW/i.test(c.sql));
    expect(call?.sql).toMatch(/\bCTR_SEM_PERMISSAO_USER_VW\b/i);
    noLiterals(call?.sql ?? '');
    expect(bound(call?.binds)).toEqual(expect.arrayContaining(['ZUNX', '987654', 'ZUSERX']));
  });

  it('model scope: binds MODELO_ID instead of USERNAME', async () => {
    const db = fakeDb();
    await db.repo.read(USER, 'permissoes.test', (tx) =>
      tx.sem({ UNIDADE_NEGOCIO_RF: 'ZUNX', TIPO_PERMISSAO_RF: 987654, MODELO_ID: 'ZMODX' }),
    );
    const call = db.calls.find((c) => /CTR_SEM_PERMISSAO_USER_VW/i.test(c.sql));
    expect(call?.sql).toMatch(/\bCTR_SEM_PERMISSAO_USER_VW\b/i);
    noLiterals(call?.sql ?? '');
    expect(bound(call?.binds)).toEqual(expect.arrayContaining(['ZUNX', '987654', 'ZMODX']));
  });
});

describe('LOV reads', () => {
  it('utilizadores(): CFG_UTILIZADORES_VW, unit bound when given', async () => {
    const db = fakeDb();
    await db.repo.read(USER, 'permissoes.test', (tx) => tx.utilizadores('ZUNX'));
    const call = db.calls.find((c) => /CFG_UTILIZADORES_VW/i.test(c.sql));
    expect(call?.sql).toMatch(/UNIDADE_NEGOCIO_RF = :un/);
    noLiterals(call?.sql ?? '');
    expect(bound(call?.binds)).toEqual(['ZUNX']);
  });

  it('utilizadores() without a unit has no WHERE on it', async () => {
    const db = fakeDb();
    await db.repo.read(USER, 'permissoes.test', (tx) => tx.utilizadores());
    const call = db.calls.find((c) => /CFG_UTILIZADORES_VW/i.test(c.sql));
    expect(call?.sql).not.toMatch(/:un/);
  });

  it('modelos(): DOC_MODELOS_DOCUMENTO valid today (LOV_MODELOS)', async () => {
    const db = fakeDb();
    await db.repo.read(USER, 'permissoes.test', (tx) => tx.modelos());
    const call = db.calls.find((c) => /DOC_MODELOS_DOCUMENTO/i.test(c.sql));
    expect(call?.sql).toMatch(/SYSDATE BETWEEN DATA_INICIO AND NVL\s*\(DATA_FIM, SYSDATE \+ 1\)/i);
  });
});
