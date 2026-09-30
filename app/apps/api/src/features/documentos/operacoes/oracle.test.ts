import { pt } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import type { DbConnection, DbPool } from '../../../db/oracle.ts';
import { oracleOperacoesDb } from './oracle.ts';
import { blocoClonar } from './regras.ts';

/**
 * oracleOperacoesDb against a fake connection that records SQL, binds, commits, rollbacks and
 * close arguments (no Oracle). Distinctive values (Z…X, 987654) make a literal in the SQL text
 * easy to spot: every value must travel as a bind (SEC-009). Pins BR-DOC-10..23, BR-DOC-25,
 * BR-DOC-36, D-12, D-17, D-20, A-01.
 */

type Answer = { rows?: unknown[]; rowsAffected?: number; outBinds?: unknown };
const DML = /^\s*(INSERT|UPDATE|DELETE|MERGE)\b/i;
const COMMIT = '<commit>';

function fakeDb(answer: (sql: string) => Answer = () => ({})) {
  const calls: { sql: string; binds: unknown }[] = [];
  const state = { commits: 0, rollbacks: 0, closes: 0 };
  const closeArgs: unknown[] = [];
  const conn = {
    async execute(sql: string, binds?: unknown) {
      calls.push({ sql, binds: binds ?? {} });
      return { rows: [], ...(DML.test(sql) ? { rowsAffected: 1 } : {}), ...answer(sql) };
    },
    async executeMany() {
      throw new Error('executeMany not expected');
    },
    async commit() {
      state.commits++;
      calls.push({ sql: COMMIT, binds: {} });
    },
    async rollback() {
      state.rollbacks++;
    },
    async close(...args: unknown[]) {
      state.closes++;
      closeArgs.push(args[0]);
    },
  } as unknown as DbConnection;
  const pool: DbPool = { getConnection: async () => conn };
  return { pool, calls, state, closeArgs, db: oracleOperacoesDb(pool, 1000) };
}

const bound = (binds: unknown) =>
  (Array.isArray(binds) ? binds : Object.values(binds as object)).map((v) =>
    String(v !== null && typeof v === 'object' && 'val' in v ? (v as { val: unknown }).val : v),
  );
const dml = (calls: { sql: string; binds: unknown }[]) => calls.filter((c) => DML.test(c.sql));
const sqls = (calls: { sql: string; binds: unknown }[]) => calls.filter((c) => c.sql !== COMMIT);
const LITERALS = ['ZUSERX', 'ZAMBX', 'ZMODX', 'ZIMPX', 'ZMAILX', 'ZDOMX', 'ZNOMEX', 'ZVALX', '987654', '987655', 'SUSPENSO'];
const noLiterals = (sql: string) => {
  for (const v of LITERALS) expect(sql).not.toContain(v);
};
const tableOf = (sql: string) => /^\s*(?:INSERT\s+INTO|UPDATE)\s+(\w+)/i.exec(sql)?.[1]?.toUpperCase();

const USER = { username: 'ZUSERX', nome: 'Zé', role: 'ADM' as const, ambiente: 'ZAMBX' };
const SELECT_DOCS = /^\s*SELECT\b[\s\S]*\bFROM\s+SVR_DOCUMENTOS\s+D\b/i;

describe('lerDocumentos (BR-DOC-13 scan: row + model + finished-print count)', () => {
  it('one id: one SELECT over SVR_DOCUMENTOS D LEFT JOIN DOC_MODELOS_DOCUMENTO M with the IMPRESSAO/TERMINADO count', async () => {
    const db = fakeDb((sql) =>
      SELECT_DOCS.test(sql)
        ? {
            rows: [
              { ID: 987654, ATRIBUTO9: null, DISPONIVEL_RF: 'ONLINE', N_IMPRESSOES: 2, ARQ_ID: null, MODELO_ID: 'ZMODX', LOTE_ID: null, MODO_EXPEDICAO_RF: 'I', IMPRESSAO_TERMINADA: 1 },
            ],
          }
        : {},
    );
    const docs = await db.db.lerDocumentos(USER, [987654]);
    expect(docs).toEqual([
      { ID: 987654, ATRIBUTO9: null, DISPONIVEL_RF: 'ONLINE', N_IMPRESSOES: 2, ARQ_ID: null, MODELO_ID: 'ZMODX', LOTE_ID: null, MODO_EXPEDICAO_RF: 'I', IMPRESSAO_TERMINADA: 1 },
    ]);
    expect(sqls(db.calls)).toHaveLength(1);
    const sql = db.calls[0]!.sql;
    expect(sql).toMatch(/\bLEFT\s+JOIN\s+DOC_MODELOS_DOCUMENTO\s+M\s+ON\s+M\.ID\s*=\s*D\.MODELO_ID\b/i);
    for (const c of ['D.ID', 'D.ATRIBUTO9', 'D.DISPONIVEL_RF', 'D.N_IMPRESSOES', 'D.ARQ_ID', 'D.MODELO_ID', 'D.LOTE_ID', 'M.MODO_EXPEDICAO_RF'])
      expect(sql).toContain(c);
    expect(sql).toMatch(/\(\s*SELECT\s+COUNT\(\*\)\s+FROM\s+SVR_QUEUE\s+Q\s+WHERE\s+Q\.DOCUMENTO_ID\s*=\s*D\.ID\s+AND\s+Q\.TIPO_QUEUE_RF\s*=\s*'IMPRESSAO'\s+AND\s+Q\.ESTADO\s*=\s*'TERMINADO'\s*\)\s+AS\s+IMPRESSAO_TERMINADA/i);
    expect(sql).toMatch(/\bWHERE\s+D\.ID\s+IN\s*\(\s*:i0\s*\)/i);
    expect(db.calls[0]!.binds).toEqual({ i0: 987654 });
    noLiterals(sql);
    expect(db.state).toEqual({ commits: 0, rollbacks: 0, closes: 1 });
  });

  it('1001 ids: two chunks — 1000 binds (:i0..:i999) then one (:i0) — results concatenated', async () => {
    let n = 0;
    const db = fakeDb((sql) => (SELECT_DOCS.test(sql) ? { rows: [{ ID: ++n, IMPRESSAO_TERMINADA: 0 }] } : {}));
    const ids = Array.from({ length: 1001 }, (_, i) => 100000 + i);
    const docs = await db.db.lerDocumentos(USER, ids);
    expect(docs.map((d) => d.ID)).toEqual([1, 2]);
    const selects = sqls(db.calls);
    expect(selects).toHaveLength(2);
    expect(selects[0]!.sql).toContain(':i999');
    expect(selects[0]!.sql).not.toContain(':i1000');
    expect(Object.keys(selects[0]!.binds as object)).toHaveLength(1000);
    expect(selects[1]!.sql).toMatch(/\bIN\s*\(\s*:i0\s*\)/);
    expect(selects[1]!.binds).toEqual({ i0: 101000 });
  });

  it('ids missing in the table are simply absent', async () => {
    const db = fakeDb(() => ({ rows: [] }));
    expect(await db.db.lerDocumentos(USER, [987654])).toEqual([]);
  });
});

describe('modoEdoc (BR-DOC-17, D-18)', () => {
  it('the Forms DECODE with PKG_SIID_UTIL.CAN_BE_UPLOADED_EDOC(:id) over SVR_DOCUMENTOS + DOC_MODELOS_DOCUMENTO', async () => {
    const db = fakeDb(() => ({ rows: [{ MODO: 'W' }] }));
    expect(await db.db.modoEdoc(USER, 987654)).toBe('W');
    const [c] = db.calls;
    expect(c?.sql).toContain('PKG_SIID_UTIL.CAN_BE_UPLOADED_EDOC(:id)');
    expect(c?.sql).toMatch(/DECODE\s*\(\s*M\.MODO_EXPEDICAO_RF\s*,\s*'W'\s*,\s*DECODE\s*\(/i);
    expect(c?.sql).toMatch(/\b0\s*,\s*'I'\s*,\s*M\.MODO_EXPEDICAO_RF/);
    expect(c?.sql).toMatch(/\bFROM\s+SVR_DOCUMENTOS\s+D\s*,\s*DOC_MODELOS_DOCUMENTO\s+M\b/i);
    expect(c?.sql).toMatch(/\bD\.ID\s*=\s*:id\b/);
    expect(c?.sql).toMatch(/\bD\.MODELO_ID\s*=\s*M\.ID\b/);
    expect(bound(c?.binds)).toEqual(['987654']);
    noLiterals(c?.sql ?? '');
  });

  it('no row → null', async () => {
    const db = fakeDb();
    expect(await db.db.modoEdoc(USER, 987654)).toBeNull();
    expect(db.state.commits).toBe(0);
  });
});

describe('ultimoEmail (BR-DOC-18)', () => {
  it('MAX(ATRIBUTO01) of the EMAIL queue rows of the document', async () => {
    const db = fakeDb(() => ({ rows: [{ V: 'ZMAILX@ZDOMX.PT' }] }));
    expect(await db.db.ultimoEmail(USER, 987654)).toBe('ZMAILX@ZDOMX.PT');
    const [c] = db.calls;
    expect(c?.sql).toMatch(/\bMAX\s*\(\s*ATRIBUTO01\s*\)/i);
    expect(c?.sql).toMatch(/\bFROM\s+SVR_QUEUE\b/i);
    expect(c?.sql).toMatch(/\bTIPO_QUEUE_RF\s*=\s*'EMAIL'/);
    expect(c?.sql).toMatch(/\bDOCUMENTO_ID\s*=\s*:id\b/);
    expect(bound(c?.binds)).toEqual(['987654']);
    noLiterals(c?.sql ?? '');
  });

  it('no EMAIL row (MAX null) → null', async () => {
    const db = fakeDb(() => ({ rows: [{ V: null }] }));
    expect(await db.db.ultimoEmail(USER, 987654)).toBeNull();
  });
});

describe('impressoraValida (BR-DOC-10: only VALIDO = S printers)', () => {
  it('SVR_IMPRESSORAS by bound id and VALIDO = S → true when a row exists', async () => {
    const db = fakeDb(() => ({ rows: [{ OK: 1 }] }));
    expect(await db.db.impressoraValida(USER, 'ZIMPX')).toBe(true);
    const [c] = db.calls;
    expect(c?.sql).toMatch(/\bFROM\s+SVR_IMPRESSORAS\b/i);
    expect(c?.sql).toMatch(/\bID\s*=\s*:id\b/);
    expect(c?.sql).toMatch(/\bVALIDO\s*=\s*'S'/);
    expect(bound(c?.binds)).toEqual(['ZIMPX']);
    noLiterals(c?.sql ?? '');
  });

  it('no row → false', async () => {
    const db = fakeDb();
    expect(await db.db.impressoraValida(USER, 'ZIMPX')).toBe(false);
  });
});

describe('enfileirar (SVR_QUEUE + ERR_ERROS_SIID in ONE transaction; BR-DOC-13, BR-DOC-36)', () => {
  const QUEUE_INSERT = /^\s*INSERT\s+INTO\s+SVR_QUEUE\s*\(\s*ID,\s*TIPO_QUEUE_RF,\s*DOCUMENTO_ID,\s*DATA_PEDIDO,\s*ESTADO,\s*IMPRESSORA_ID,\s*CRIADO_POR,\s*ATRIBUTO01\s*\)\s*VALUES\s*\(\s*ID_QUEUE_SEQ\.NEXTVAL,\s*:tipo,\s*:documento,\s*SYSDATE,\s*'ESPERA',\s*:impressora,\s*:utilizador,\s*:atributo01\s*\)/i;
  const ERRO_INSERT = /^\s*INSERT\s+INTO\s+ERR_ERROS_SIID\s*\(\s*ID,\s*TIPO_ERROSIID,\s*DATA_ERRO,\s*DESCRICAO,\s*DOCUMENTO_ID\s*\)\s*VALUES\s*\(\s*ID_ERROS_SEQ\.NEXTVAL,\s*'ERRO_DOC',\s*SYSDATE,\s*:descricao,\s*:documento\s*\)/i;

  it('two pedidos, the first with auditoria: SVR_QUEUE, ERR_ERROS_SIID, SVR_QUEUE in that order, one commit at the end', async () => {
    const db = fakeDb();
    await db.db.enfileirar(USER, [
      { tipo: 'EXECUCAO', documentoId: 987654, auditoria: 'DOCUMENTO REGERADO POR ZUSERX ' },
      { tipo: 'EMAIL', documentoId: 987655, impressoraId: 'ZIMPX', atributo01: 'ZMAILX@ZDOMX.PT' },
    ]);
    const writes = dml(db.calls);
    expect(writes.map((c) => tableOf(c.sql))).toEqual(['SVR_QUEUE', 'ERR_ERROS_SIID', 'SVR_QUEUE']);
    const [q1, e1, q2] = writes;
    expect(q1?.sql).toMatch(QUEUE_INSERT);
    expect(q1?.binds).toEqual({ tipo: 'EXECUCAO', documento: 987654, impressora: null, utilizador: 'ZUSERX', atributo01: null });
    expect(e1?.sql).toMatch(ERRO_INSERT);
    expect(e1?.binds).toEqual({ descricao: 'DOCUMENTO REGERADO POR ZUSERX ', documento: 987654 });
    expect(q2?.sql).toMatch(QUEUE_INSERT);
    expect(q2?.binds).toEqual({ tipo: 'EMAIL', documento: 987655, impressora: 'ZIMPX', utilizador: 'ZUSERX', atributo01: 'ZMAILX@ZDOMX.PT' });
    for (const c of writes) noLiterals(c.sql);
    // the commit is the last thing on the connection
    expect(db.calls.at(-1)?.sql).toBe(COMMIT);
    expect(db.state).toEqual({ commits: 1, rollbacks: 0, closes: 1 });
  });

  it('a pedido without auditoria writes no ERR_ERROS_SIID row (Reimprimir / 2ª via / Cópia)', async () => {
    const db = fakeDb();
    await db.db.enfileirar(USER, [{ tipo: '2.VIA', documentoId: 987654, impressoraId: null }]);
    expect(dml(db.calls).map((c) => tableOf(c.sql))).toEqual(['SVR_QUEUE']);
  });

  it('a failing second INSERT rolls everything back, nothing committed', async () => {
    let n = 0;
    const db = fakeDb((sql) => {
      if (DML.test(sql) && ++n === 2) throw new Error('ORA-01400: cannot insert NULL');
      return {};
    });
    await expect(
      db.db.enfileirar(USER, [
        { tipo: 'EXECUCAO', documentoId: 987654 },
        { tipo: 'EXECUCAO', documentoId: 987655 },
      ]),
    ).rejects.toMatchObject({ statusCode: expect.any(Number) });
    expect(db.state).toEqual({ commits: 0, rollbacks: 1, closes: 1 });
  });
});

describe('anular (BR-DOC-15, D-17: ANULAR does not commit; the app commits then re-reads DISPONIVEL_RF)', () => {
  const REREAD = /^\s*SELECT\s+DISPONIVEL_RF\s+FROM\s+SVR_DOCUMENTOS\s+WHERE\s+ID\s*=\s*:id\b/i;

  it('BEGIN PKG_DOCUMENTOS_SVR.ANULAR(:id, :utilizador); END; with the id as a STRING, commit, then the re-read', async () => {
    const db = fakeDb((sql) => (REREAD.test(sql) ? { rows: [{ DISPONIVEL_RF: 'ANU' }] } : {}));
    expect(await db.db.anular(USER, 987654)).toBe('ANU');
    expect(db.calls.map((c) => c.sql.replace(/\s+/g, ' ').trim())).toEqual([
      'BEGIN PKG_DOCUMENTOS_SVR.ANULAR(:id, :utilizador); END;',
      COMMIT,
      expect.stringMatching(REREAD),
    ]);
    expect(db.calls[0]!.binds).toEqual({ id: '987654', utilizador: 'ZUSERX' });
    expect((db.calls[0]!.binds as { id: unknown }).id).toBe('987654');
    expect(db.calls[2]!.binds).toEqual({ id: 987654 });
    for (const c of sqls(db.calls)) noLiterals(c.sql);
    expect(db.state).toEqual({ commits: 1, rollbacks: 0, closes: 1 });
  });

  it('no row after the call → undefined (no such document)', async () => {
    const db = fakeDb();
    expect(await db.db.anular(USER, 987654)).toBeUndefined();
  });

  it('a DISPONIVEL_RF other than ANU is returned as is (the service turns it into anularFalhou)', async () => {
    const db = fakeDb((sql) => (REREAD.test(sql) ? { rows: [{ DISPONIVEL_RF: 'ONLINE' }] } : {}));
    expect(await db.db.anular(USER, 987654)).toBe('ONLINE');
  });
});

describe('cancelar (BR-DOC-16, D-12)', () => {
  const FIVE = /\bESTADO\s+IN\s*\(\s*'TERMINADO',\s*'ESPERA',\s*'ENQUEUED',\s*'EM EXECUCAO',\s*'ERRO'\s*\)/;

  it('force false: one UPDATE per id restricted to the five states, one commit, sum of rowsAffected', async () => {
    const db = fakeDb((sql) => (DML.test(sql) ? { rowsAffected: 3 } : {}));
    expect(await db.db.cancelar(USER, [987654, 987655], false)).toBe(6);
    const updates = dml(db.calls);
    expect(updates).toHaveLength(2);
    for (const u of updates) {
      expect(u.sql).toMatch(/^\s*UPDATE\s+SVR_QUEUE\s+SET\s+ESTADO\s*=\s*'CANCELLED'\s+WHERE\b/i);
      expect(u.sql).toMatch(/\bTIPO_QUEUE_RF\s*=\s*'EXECUCAO'/);
      expect(u.sql).toMatch(/\bDOCUMENTO_ID\s*=\s*:id\b/);
      expect(u.sql).toMatch(FIVE);
      noLiterals(u.sql);
    }
    expect(bound(updates[0]?.binds)).toEqual(['987654']);
    expect(bound(updates[1]?.binds)).toEqual(['987655']);
    expect(db.state).toEqual({ commits: 1, rollbacks: 0, closes: 1 });
  });

  it('force true: no ESTADO filter (every EXECUCAO row of the document)', async () => {
    const db = fakeDb();
    await db.db.cancelar(USER, [987654], true);
    const [u] = dml(db.calls);
    expect(u?.sql).toMatch(/\bTIPO_QUEUE_RF\s*=\s*'EXECUCAO'/);
    expect(u?.sql).not.toMatch(/\bESTADO\s+IN\b/i);
    expect(u?.sql).toMatch(/\bDOCUMENTO_ID\s*=\s*:id\b/);
  });

  it('a failing UPDATE rolls back', async () => {
    const db = fakeDb((sql) => {
      if (DML.test(sql)) throw new Error('ORA-00054: resource busy');
      return {};
    });
    await expect(db.db.cancelar(USER, [987654], false)).rejects.toBeDefined();
    expect(db.state).toMatchObject({ commits: 0, rollbacks: 1 });
  });
});

describe('mudarEstadoFila (BR-DOC-21/22)', () => {
  it('ids: one UPDATE per document, states bound, sum of rowsAffected, one commit', async () => {
    const db = fakeDb((sql) => (DML.test(sql) ? { rowsAffected: 2 } : {}));
    expect(await db.db.mudarEstadoFila(USER, 'ESPERA', 'SUSPENSO', [987654, 987655])).toBe(4);
    const updates = dml(db.calls);
    expect(updates).toHaveLength(2);
    for (const u of updates) {
      expect(u.sql).toMatch(/^\s*UPDATE\s+SVR_QUEUE\s+SET\s+ESTADO\s*=\s*:para\s+WHERE\s+ESTADO\s*=\s*:de\s+AND\s+DOCUMENTO_ID\s*=\s*:id\s*$/i);
      noLiterals(u.sql);
    }
    expect(updates[0]?.binds).toEqual({ para: 'SUSPENSO', de: 'ESPERA', id: 987654 });
    expect(updates[1]?.binds).toEqual({ para: 'SUSPENSO', de: 'ESPERA', id: 987655 });
    expect(db.state).toEqual({ commits: 1, rollbacks: 0, closes: 1 });
  });

  it("'todos': one UPDATE over every row in the source state, of any document and type", async () => {
    const db = fakeDb((sql) => (DML.test(sql) ? { rowsAffected: 17 } : {}));
    expect(await db.db.mudarEstadoFila(USER, 'SUSPENSO', 'ESPERA', 'todos')).toBe(17);
    const updates = dml(db.calls);
    expect(updates).toHaveLength(1);
    expect(updates[0]?.sql).toMatch(/^\s*UPDATE\s+SVR_QUEUE\s+SET\s+ESTADO\s*=\s*:para\s+WHERE\s+ESTADO\s*=\s*:de\s*$/i);
    expect(updates[0]?.sql).not.toMatch(/DOCUMENTO_ID/);
    expect(updates[0]?.binds).toEqual({ para: 'ESPERA', de: 'SUSPENSO' });
    expect(db.state.commits).toBe(1);
  });
});

describe('cancelarPedido (BR-DOC-23: lock, then UPDATE restricted to ESPERA / TERMINADO)', () => {
  const LOCK = /FOR\s+UPDATE\s+NOWAIT/i;
  const pedidoDb = (locked: boolean, affected: number) =>
    fakeDb((sql) => {
      if (LOCK.test(sql)) return { rows: locked ? [{ 1: 1 }] : [] };
      if (DML.test(sql)) return { rowsAffected: affected };
      return {};
    });

  it('locks SVR_QUEUE by ID = :q AND DOCUMENTO_ID = :d, then UPDATE … WHERE ID = :q AND ESTADO IN (ESPERA, TERMINADO), one commit', async () => {
    const db = pedidoDb(true, 1);
    await db.db.cancelarPedido(USER, 987654, 987655);
    const lockAt = db.calls.findIndex((c) => LOCK.test(c.sql));
    expect(lockAt).toBe(0);
    const lock = db.calls[lockAt]!;
    expect(lock.sql).toMatch(/^\s*SELECT\s+1\s+FROM\s+SVR_QUEUE\s+WHERE\s+ID\s*=\s*:q\s+AND\s+DOCUMENTO_ID\s*=\s*:d\s+FOR\s+UPDATE\s+NOWAIT/i);
    expect(lock.binds).toEqual({ q: 987655, d: 987654 });
    const [u, ...resto] = dml(db.calls);
    expect(resto).toEqual([]);
    expect(db.calls.indexOf(u!)).toBeGreaterThan(lockAt);
    expect(u?.sql).toMatch(/^\s*UPDATE\s+SVR_QUEUE\s+SET\s+ESTADO\s*=\s*'CANCELLED'\s+WHERE\s+ID\s*=\s*:q\s+AND\s+ESTADO\s+IN\s*\(\s*'ESPERA',\s*'TERMINADO'\s*\)/i);
    expect(bound(u?.binds)).toEqual(['987655']);
    for (const c of sqls(db.calls)) noLiterals(c.sql);
    expect(db.state).toEqual({ commits: 1, rollbacks: 0, closes: 1 });
  });

  it('0 rows updated (state outside ESPERA/TERMINADO) → 409 PEDIDO_NAO_CANCELAVEL, rolled back', async () => {
    const db = pedidoDb(true, 0);
    await expect(db.db.cancelarPedido(USER, 987654, 987655)).rejects.toMatchObject({
      statusCode: 409,
      code: 'PEDIDO_NAO_CANCELAVEL',
      message: pt.documentos.pedidoNaoCancelavel,
    });
    expect(db.state).toEqual({ commits: 0, rollbacks: 1, closes: 1 });
  });

  it('the lock finds no row (queue id of another document) → 409 REGISTO_ALTERADO, no UPDATE', async () => {
    const db = pedidoDb(false, 1);
    await expect(db.db.cancelarPedido(USER, 987654, 987655)).rejects.toMatchObject({
      statusCode: 409,
      code: 'REGISTO_ALTERADO',
    });
    expect(dml(db.calls)).toEqual([]);
    expect(db.state.commits).toBe(0);
  });
});

describe('contagemFila', () => {
  it('COUNT(*) of SVR_QUEUE in the bound state', async () => {
    const db = fakeDb(() => ({ rows: [{ N: 42 }] }));
    expect(await db.db.contagemFila(USER, 'SUSPENSO')).toBe(42);
    const [c] = db.calls;
    expect(c?.sql).toMatch(/^\s*SELECT\s+COUNT\(\*\)\s+AS\s+N\s+FROM\s+SVR_QUEUE\s+WHERE\s+ESTADO\s*=\s*:estado\s*$/i);
    expect(c?.binds).toEqual({ estado: 'SUSPENSO' });
    noLiterals(c?.sql ?? '');
    expect(db.state).toEqual({ commits: 0, rollbacks: 0, closes: 1 });
  });
});

describe('clonar (BR-DOC-25, D-17, D-20, A-01: EXECUTA commits by itself)', () => {
  const BLOCK = /^\s*BEGIN\b/;
  const LOTE_UPDATE = /^\s*UPDATE\s+SVR_DOCUMENTOS\s+SET\s+LOTE_ID\s*=\s*:lote\s+WHERE\s+ID\s*=\s*:id\s*$/i;
  const cloneDb = (falha = false) =>
    fakeDb((sql) => {
      if (BLOCK.test(sql)) {
        if (falha) throw new Error('ORA-20001: modelo inválido');
        return { outBinds: { id: 987655 } };
      }
      return {};
    });
  const PARAMS = [
    { nome: 'ZNOMEX', valor: 'ZVALX' },
    { nome: 'P_ANO', valor: '2031' },
  ];

  it('the block is blocoClonar(n) with n0/v0/n1/v1, usuario, ambiente, modelo and an OUT id; no commit on that connection', async () => {
    const db = cloneDb();
    expect(await db.db.clonar(USER, { MODELO_ID: 'ZMODX', LOTE_ID: null }, PARAMS)).toBe(987655);
    const block = db.calls.find((c) => BLOCK.test(c.sql));
    expect(block?.sql).toBe(blocoClonar(2));
    const binds = block?.binds as Record<string, unknown>;
    expect(binds).toMatchObject({ n0: 'ZNOMEX', v0: 'ZVALX', n1: 'P_ANO', v1: '2031', usuario: 'ZUSERX', ambiente: 'ZAMBX', modelo: 'ZMODX' });
    expect(binds['id']).toMatchObject({ dir: expect.anything() });
    expect(Object.keys(binds).sort()).toEqual(['ambiente', 'id', 'modelo', 'n0', 'n1', 'usuario', 'v0', 'v1']);
    expect(dml(db.calls)).toEqual([]);
    expect(db.state).toEqual({ commits: 0, rollbacks: 0, closes: 1 });
    expect(db.closeArgs).toEqual([undefined]);
  });

  it('LOTE_ID 7: a separate bound UPDATE SVR_DOCUMENTOS SET LOTE_ID after the block, committed', async () => {
    const db = cloneDb();
    expect(await db.db.clonar(USER, { MODELO_ID: 'ZMODX', LOTE_ID: 7 }, [])).toBe(987655);
    expect(db.calls[0]?.sql).toBe(blocoClonar(0));
    const [u, ...resto] = dml(db.calls);
    expect(resto).toEqual([]);
    expect(u?.sql).toMatch(LOTE_UPDATE);
    expect(u?.binds).toEqual({ lote: 7, id: 987655 });
    expect(db.calls.indexOf(u!)).toBeGreaterThan(0);
    expect(db.calls.at(-1)?.sql).toBe(COMMIT);
    expect(db.state).toEqual({ commits: 1, rollbacks: 0, closes: 2 });
    for (const c of sqls(db.calls)) noLiterals(c.sql);
  });

  it('GET_ID_EXECUCAO -1 (the package swallowed an error) → 422 CLONAR_FALHOU, connection dropped, no UPDATE', async () => {
    const db = fakeDb((sql) => (BLOCK.test(sql) ? { outBinds: { id: -1 } } : {}));
    await expect(db.db.clonar(USER, { MODELO_ID: 'ZMODX', LOTE_ID: 7 }, [])).rejects.toMatchObject({
      statusCode: 422,
      code: 'CLONAR_FALHOU',
      message: pt.documentos.clonarFalhou,
    });
    expect(dml(db.calls)).toEqual([]);
    expect(db.closeArgs).toEqual([{ drop: true }]);
  });

  it('the block throws → rejects, the connection is dropped (close({ drop: true })) and no UPDATE runs', async () => {
    const db = cloneDb(true);
    await expect(db.db.clonar(USER, { MODELO_ID: 'ZMODX', LOTE_ID: 7 }, PARAMS)).rejects.toMatchObject({
      statusCode: 422,
      code: 'ORA_20XXX',
    });
    expect(dml(db.calls)).toEqual([]);
    expect(db.state.commits).toBe(0);
    expect(db.closeArgs).toEqual([{ drop: true }]);
  });
});
