import { pt, type ListQuery } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import type { DbConnection, DbPool } from '../../db/oracle.ts';
import type { CrudCtx } from '../../lib/crud.ts';
import { oracleBackupsRepo } from './oracle.ts';

/**
 * oracleBackupsRepo against a fake connection that records SQL, binds, executeMany rows, commits,
 * rollbacks and closes (no Oracle). Distinctive values (Z…X, 987654, 2031-07) make a literal in the
 * SQL text easy to spot: every value must travel as a bind (SEC-009). The SQL is the forms' SQL
 * (DECISIONS A-02): FD_NOVO_BACKUP for meses / candidatos / criar, FD_BACKUPS_ONLINE for online.
 * Pins BR-BKP-01..06 and BR-BKP-09.
 */

type Answer = { rows?: unknown[]; rowsAffected?: number };
type Call = { sql: string; binds: unknown; many?: boolean };
const DML = /^\s*(INSERT|UPDATE|DELETE|MERGE)\b/i;
const COMMIT = '<commit>';

function fakeDb(answer: (sql: string, binds: unknown) => Answer = () => ({})) {
  const calls: Call[] = [];
  const state = { commits: 0, rollbacks: 0, closes: 0 };
  const conn = {
    async execute(sql: string, binds?: unknown) {
      calls.push({ sql, binds: binds ?? {} });
      return { rows: [], ...(DML.test(sql) ? { rowsAffected: 1 } : {}), ...answer(sql, binds) };
    },
    async executeMany(sql: string, binds: unknown[]) {
      calls.push({ sql, binds, many: true });
      return { rowsAffected: binds.length, ...answer(sql, binds) };
    },
    async commit() {
      state.commits++;
      calls.push({ sql: COMMIT, binds: {} });
    },
    async rollback() {
      state.rollbacks++;
    },
    async close() {
      state.closes++;
    },
  } as unknown as DbConnection;
  const pool: DbPool = { getConnection: async () => conn };
  return { calls, state, repo: oracleBackupsRepo(pool, 1000) };
}

const sqls = (calls: Call[]) => calls.filter((c) => c.sql !== COMMIT);
const dml = (calls: Call[]) => calls.filter((c) => DML.test(c.sql));
const LITERALS = ['ZUSERX', 'ZAMBX', 'ZMIDX', 'ZDESTX', 'ZOBSX', 'ZDRVX', '987654', '987660', '987661', '2031', '203107'];
const noLiterals = (sql: string) => {
  for (const v of LITERALS) expect(sql).not.toContain(v);
};

const CTX: CrudCtx = { user: { username: 'ZUSERX', nome: 'Zé', role: 'ADM', ambiente: 'ZAMBX' } as CrudCtx['user'] };
const q = (filters: ListQuery['filters'] = {}, over: Partial<ListQuery> = {}): ListQuery => ({ filters, sort: [], page: 1, size: 50, ...over });

describe('meses (BR-BKP-02 record group MES_BACKUP)', () => {
  it('the form query: distinct printed, not-backed-up months, YYYY-MM and DD/MM/YYYY, newest first; no binds, no commit', async () => {
    const db = fakeDb(() => ({ rows: [{ MES: '2031-07', DATA: '01/07/2031' }, { MES: '2031-06', DATA: '01/06/2031' }] }));
    expect(await db.repo.meses(CTX)).toEqual([
      { MES: '2031-07', DATA: '01/07/2031' },
      { MES: '2031-06', DATA: '01/06/2031' },
    ]);
    const [c, ...resto] = sqls(db.calls);
    expect(resto).toEqual([]);
    expect(c!.sql).toMatch(/^\s*SELECT\s+DISTINCT\s+TO_CHAR\(\s*TRUNC\(\s*DATA_IMPRESSAO\s*,\s*'MONTH'\s*\)\s*,\s*'YYYY-MM'\s*\)\s+AS\s+MES\s*,/i);
    expect(c!.sql).toMatch(/TO_CHAR\(\s*TRUNC\(\s*DATA_IMPRESSAO\s*,\s*'MONTH'\s*\)\s*,\s*'DD\/MM\/YYYY'\s*\)\s+AS\s+DATA\b/i);
    expect(c!.sql).toMatch(/\bFROM\s+SVR_DOCUMENTOS\s+WHERE\s+BACKUP_ID\s+IS\s+NULL\s+AND\s+DATA_IMPRESSAO\s+IS\s+NOT\s+NULL\s+ORDER\s+BY\s+1\s+DESC\s*$/i);
    expect(db.state).toMatchObject({ commits: 0, rollbacks: 0 });
    expect(db.state.closes).toBeGreaterThanOrEqual(1);
  });
});

describe('lista (BR-BKP-09: SVR_BACKUPS with TAMANHO_BACKUP = SUM(TAMANHO_BYTES)/1024/1024)', () => {
  it('selects from SVR_BACKUPS with the TAMANHO_BACKUP subquery; f[MEDIA_ONLINE]=S is a bind', async () => {
    const db = fakeDb((sql) => (/COUNT\(\*\)\s+AS\s+N\b/i.test(sql) ? { rows: [{ N: 1 }] } : { rows: [{ ID: 987654, NOME: 'COSEC_203107_ 01' }] }));
    const r = await db.repo.lista(q({ MEDIA_ONLINE: [{ op: 'eq', value: 'S' }] }), CTX);
    expect(r).toEqual({ rows: [{ ID: 987654, NOME: 'COSEC_203107_ 01' }], total: 1 });
    const list = sqls(db.calls).find((c) => /OFFSET\s+:skip\s+ROWS/i.test(c.sql));
    expect(list?.sql).toMatch(/\bFROM\s+SVR_BACKUPS\b/i);
    expect(list?.sql).toMatch(
      /\(\s*SELECT\s+SUM\(\s*D\.TAMANHO_BYTES\s*\)\s*\/\s*1024\s*\/\s*1024\s+FROM\s+SVR_DOCUMENTOS\s+D\s+WHERE\s+D\.BACKUP_ID\s*=\s*SVR_BACKUPS\.ID\s*\)\s+AS\s+TAMANHO_BACKUP/i,
    );
    expect(list?.sql).toMatch(/\bMEDIA_ONLINE\s*=\s*:w\d+/);
    expect(Object.values(list?.binds as object)).toContain('S');
    expect(db.state.commits).toBe(0);
  });
});

describe('candidatos (BR-BKP-02 block DOCS_PORBACKUP, BR-BKP-06 running total)', () => {
  const MES_TOTAL =
    /^\s*SELECT\s+NVL\(\s*SUM\(\s*TAMANHO_BYTES\s*\)\s*,\s*0\s*\)\s+AS\s+TOTAL\s+FROM\s+SVR_DOCUMENTOS\s+WHERE\s+BACKUP_ID\s+IS\s+NULL\s+AND\s+DATA_IMPRESSAO\s*>=\s*TO_DATE\(\s*:mes\s*,\s*'YYYY-MM'\s*\)\s+AND\s+DATA_IMPRESSAO\s*<\s*ADD_MONTHS\(\s*TO_DATE\(\s*:mes\s*,\s*'YYYY-MM'\s*\)\s*,\s*1\s*\)\s*$/i;
  const filtrado = q(
    { DATA_IMPRESSAO: [{ op: 'from', value: '2031-07-01' }, { op: 'to', value: '2031-07-31' }], BACKUP_ID: [{ op: 'null' }] },
    { size: 2 },
  );

  it('the list over SVR_DOCUMENTOS carries the route filters as binds; totalBytes comes from the month total query, not the page', async () => {
    const db = fakeDb((sql) => {
      if (MES_TOTAL.test(sql)) return { rows: [{ TOTAL: 7340032 }] };
      if (/COUNT\(\*\)\s+AS\s+N\b/i.test(sql)) return { rows: [{ N: 3 }] };
      return { rows: [{ ID: 987660, TAMANHO_BYTES: 1 }, { ID: 987661, TAMANHO_BYTES: null }] };
    });
    const r = await db.repo.candidatos(filtrado, '2031-07', CTX);
    expect(r).toEqual({ rows: [{ ID: 987660, TAMANHO_BYTES: 1 }, { ID: 987661, TAMANHO_BYTES: null }], total: 3, totalBytes: 7340032 });

    const list = sqls(db.calls).find((c) => /OFFSET\s+:skip\s+ROWS/i.test(c.sql));
    expect(list?.sql).toMatch(/\bFROM\s+SVR_DOCUMENTOS\b/i);
    expect(list?.sql).toMatch(/\bBACKUP_ID\s+IS\s+NULL\b/);
    expect(Object.values(list?.binds as object)).toEqual(expect.arrayContaining(['2031-07-01', '2031-07-31']));

    const total = sqls(db.calls).find((c) => MES_TOTAL.test(c.sql));
    expect(total?.binds).toEqual({ mes: '2031-07' });
    for (const c of sqls(db.calls)) noLiterals(c.sql);
    expect(dml(db.calls)).toEqual([]);
    expect(db.state.commits).toBe(0);
  });
});

describe('criar (BR-BKP-03/04/05, A-02: the form SQL in ONE transaction)', () => {
  const MIDIA = /^\s*SELECT\s+TAMANHO_BYTES\s+FROM\s+CFG_TIPOS_MIDIA\s+WHERE\s+ID\s*=\s*:id\s*$/i;
  const NOME = /SEQ_BACKUP_ID\.NEXTVAL\s+AS\s+ID\b/i;
  const BKP_INSERT =
    /^\s*INSERT\s+INTO\s+SVR_BACKUPS\s*\(\s*ID,\s*NOME,\s*MES_BACKUP,\s*TIPO_MIDIA_ID,\s*DESTINO,\s*OBSERVACOES,\s*CRIADO_POR,\s*DATA_CRIACAO\s*\)\s*VALUES\s*\(\s*:id,\s*:nome,\s*TO_DATE\(\s*:mes\s*,\s*'YYYY-MM'\s*\),\s*:midia,\s*:destino,\s*:observacoes,\s*:utilizador,\s*SYSDATE\s*\)\s*$/i;
  const MES_RANGE =
    /\bBACKUP_ID\s+IS\s+NULL\s+AND\s+DATA_IMPRESSAO\s*>=\s*TO_DATE\(\s*:mes\s*,\s*'YYYY-MM'\s*\)\s+AND\s+DATA_IMPRESSAO\s*<\s*ADD_MONTHS\(\s*TO_DATE\(\s*:mes\s*,\s*'YYYY-MM'\s*\)\s*,\s*1\s*\)/i;
  const DOC_UPDATE = /^\s*UPDATE\s+SVR_DOCUMENTOS\s+SET\s+BACKUP_ID\s*=\s*:backup\s+WHERE\b/i;
  const TOTAL = /^\s*SELECT\s+NVL\(\s*SUM\(\s*TAMANHO_BYTES\s*\)\s*,\s*0\s*\)\s+AS\s+TOTAL\s+FROM\s+SVR_DOCUMENTOS\s+WHERE\s+BACKUP_ID\s*=\s*:id\s*$/i;
  const QUEUE_INSERT =
    /^\s*INSERT\s+INTO\s+SVR_QUEUE\s*\(\s*ID,\s*TIPO_QUEUE_RF,\s*DOCUMENTO_ID,\s*DATA_PEDIDO,\s*ESTADO,\s*CRIADO_POR\s*\)\s*SELECT\s+ID_QUEUE_SEQ\.NEXTVAL,\s*'BACKUP',\s*ID,\s*SYSDATE,\s*'ESPERA',\s*:utilizador\s+FROM\s+SVR_DOCUMENTOS\s+WHERE\s+BACKUP_ID\s*=\s*:id\s*$/i;

  const NOVO = { mes: '2031-07', tipoMidiaId: 'ZMIDX', observacoes: 'ZOBSX', ids: [987660, 987661], destino: 'ZDESTX\\' };

  const criarDb = (o: { midia?: unknown[]; afetados?: number; total?: number; falha?: RegExp } = {}) =>
    fakeDb((sql) => {
      if (o.falha?.test(sql)) throw new Error('ORA-01400: cannot insert NULL');
      if (MIDIA.test(sql)) return { rows: o.midia ?? [{ TAMANHO_BYTES: 5000 }] };
      if (NOME.test(sql)) return { rows: [{ ID: 987654, NOME: 'COSEC_203107_ 01' }] };
      if (DOC_UPDATE.test(sql) && o.afetados !== undefined) return { rowsAffected: o.afetados };
      if (TOTAL.test(sql)) return { rows: [{ TOTAL: o.total ?? 3000 }] };
      return {};
    });

  const passo = (c: Call) =>
    c.sql === COMMIT
      ? 'commit'
      : MIDIA.test(c.sql)
        ? 'midia'
        : NOME.test(c.sql)
          ? 'nome'
          : BKP_INSERT.test(c.sql)
            ? 'backup'
            : DOC_UPDATE.test(c.sql)
              ? c.many
                ? 'docs*'
                : 'docs'
              : TOTAL.test(c.sql)
                ? 'total'
                : QUEUE_INSERT.test(c.sql)
                  ? 'fila'
                  : `?? ${c.sql}`;

  it('ids: midia, nome, SVR_BACKUPS insert, executeMany BACKUP_ID update, total, SVR_QUEUE insert, then ONE commit; returns { ID, NOME }', async () => {
    const db = criarDb();
    expect(await db.repo.criar(NOVO, CTX)).toEqual({ ID: 987654, NOME: 'COSEC_203107_ 01' });
    expect(db.calls.map(passo)).toEqual(['midia', 'nome', 'backup', 'docs*', 'total', 'fila', 'commit']);
    expect(db.state).toEqual({ commits: 1, rollbacks: 0, closes: 1 });
    for (const c of sqls(db.calls)) noLiterals(c.sql);
  });

  it('the medium lookup binds the id', async () => {
    const db = criarDb();
    await db.repo.criar(NOVO, CTX);
    expect(db.calls.find((c) => MIDIA.test(c.sql))?.binds).toEqual({ id: 'ZMIDX' });
  });

  it("the name is the form's expression in SQL: 'COSEC_'||YYYYMM||'_'||TO_CHAR(count+1,'00') from DUAL, :mes bound (BR-BKP-03)", async () => {
    const db = criarDb();
    await db.repo.criar(NOVO, CTX);
    const c = db.calls.find((x) => NOME.test(x.sql))!;
    expect(c.sql).toMatch(/'COSEC_'\s*\|\|\s*TO_CHAR\(\s*TO_DATE\(\s*:mes\s*,\s*'YYYY-MM'\s*\)\s*,\s*'YYYYMM'\s*\)\s*\|\|\s*'_'\s*\|\|\s*TO_CHAR\(/i);
    expect(c.sql).toMatch(
      /\(\s*SELECT\s+COUNT\(\*\)\s+FROM\s+SVR_BACKUPS\s+WHERE\s+NOME\s+LIKE\s+'COSEC_'\s*\|\|\s*TO_CHAR\(\s*TO_DATE\(\s*:mes\s*,\s*'YYYY-MM'\s*\)\s*,\s*'YYYYMM'\s*\)\s*\|\|\s*'%'\s*\)/i,
    );
    // TO_CHAR(n,'00') keeps Oracle's sign blank: COSEC_203107_ 01, as Forms stored it. Not LPAD.
    expect(c.sql).toMatch(/\+\s*1\s*,\s*'00'\s*\)/);
    expect(c.sql).not.toMatch(/LPAD/i);
    expect(c.sql).toMatch(/\bFROM\s+DUAL\s*$/i);
    expect(c.binds).toEqual({ mes: '2031-07' });
  });

  it('SVR_BACKUPS insert: DESTINO = destino + NOME, CRIADO_POR = session user, MES_BACKUP = TO_DATE(:mes), SYSDATE (BR-BKP-01, BR-BKP-03)', async () => {
    const db = criarDb();
    await db.repo.criar(NOVO, CTX);
    expect(db.calls.find((c) => BKP_INSERT.test(c.sql))?.binds).toEqual({
      id: 987654,
      nome: 'COSEC_203107_ 01',
      mes: '2031-07',
      midia: 'ZMIDX',
      destino: 'ZDESTX\\COSEC_203107_ 01',
      observacoes: 'ZOBSX',
      utilizador: 'ZUSERX',
    });
  });

  it('empty destino (variable BACKUP missing) → DESTINO is just NOME; observacoes null stays null', async () => {
    const db = criarDb();
    await db.repo.criar({ ...NOVO, destino: '', observacoes: null }, CTX);
    expect(db.calls.find((c) => BKP_INSERT.test(c.sql))?.binds).toMatchObject({ destino: 'COSEC_203107_ 01', observacoes: null });
  });

  it('ids: executeMany of the UPDATE restricted to candidates of the month, one row { backup, doc, mes } per id (BR-BKP-05)', async () => {
    const db = criarDb();
    await db.repo.criar(NOVO, CTX);
    const u = db.calls.find((c) => DOC_UPDATE.test(c.sql))!;
    expect(u.many).toBe(true);
    expect(u.sql).toMatch(/\bWHERE\s+ID\s*=\s*:doc\s+AND\s+/i);
    expect(u.sql).toMatch(MES_RANGE);
    expect(u.binds).toEqual([
      { backup: 987654, doc: 987660, mes: '2031-07' },
      { backup: 987654, doc: 987661, mes: '2031-07' },
    ]);
  });

  it('ids: fewer rows updated than ids (a document already backed up / of another month) → 409 REGISTO_ALTERADO, rolled back, no queue insert', async () => {
    const db = criarDb({ afetados: 1 });
    await expect(db.repo.criar(NOVO, CTX)).rejects.toMatchObject({ statusCode: 409, code: 'REGISTO_ALTERADO' });
    expect(db.calls.some((c) => QUEUE_INSERT.test(c.sql))).toBe(false);
    expect(db.state).toEqual({ commits: 0, rollbacks: 1, closes: 1 });
  });

  it("'todos': one execute of the same UPDATE without ID = :doc, binds { backup, mes }", async () => {
    const db = criarDb({ afetados: 4 });
    await db.repo.criar({ ...NOVO, ids: 'todos' }, CTX);
    expect(db.calls.map(passo)).toEqual(['midia', 'nome', 'backup', 'docs', 'total', 'fila', 'commit']);
    const u = db.calls.find((c) => DOC_UPDATE.test(c.sql))!;
    expect(u.sql).not.toMatch(/:doc\b/);
    expect(u.sql).toMatch(MES_RANGE);
    expect(u.binds).toEqual({ backup: 987654, mes: '2031-07' });
  });

  it("'todos' over a month with no candidate (0 rows) → 400 VALIDACAO fields.seleccao = #30, rolled back", async () => {
    const db = criarDb({ afetados: 0 });
    await expect(db.repo.criar({ ...NOVO, ids: 'todos' }, CTX)).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDACAO',
      fields: { seleccao: pt.naoExistemDocumentosSeleccionados },
    });
    expect(db.calls.some((c) => QUEUE_INSERT.test(c.sql))).toBe(false);
    expect(db.state).toEqual({ commits: 0, rollbacks: 1, closes: 1 });
  });

  it('total query binds the new backup id', async () => {
    const db = criarDb();
    await db.repo.criar(NOVO, CTX);
    expect(db.calls.find((c) => TOTAL.test(c.sql))?.binds).toEqual({ id: 987654 });
  });

  it('medium TAMANHO_BYTES < total → 400 VALIDACAO fields.tipoMidiaId = #50, rolled back, no queue insert (BR-BKP-04)', async () => {
    const db = criarDb({ midia: [{ TAMANHO_BYTES: 2999 }], total: 3000 });
    await expect(db.repo.criar(NOVO, CTX)).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDACAO',
      fields: { tipoMidiaId: pt.backups.tamanhoMidia },
    });
    expect(db.calls.some((c) => QUEUE_INSERT.test(c.sql))).toBe(false);
    expect(db.state).toEqual({ commits: 0, rollbacks: 1, closes: 1 });
  });

  it('medium TAMANHO_BYTES equal to the total passes (the form tests MIDIA < TOTAL)', async () => {
    const db = criarDb({ midia: [{ TAMANHO_BYTES: 3000 }], total: 3000 });
    await expect(db.repo.criar(NOVO, CTX)).resolves.toEqual({ ID: 987654, NOME: 'COSEC_203107_ 01' });
    expect(db.state.commits).toBe(1);
  });

  it('medium TAMANHO_BYTES null passes whatever the total (NULL < n is not true in PL/SQL)', async () => {
    const db = criarDb({ midia: [{ TAMANHO_BYTES: null }], total: 9e12 });
    await expect(db.repo.criar(NOVO, CTX)).resolves.toEqual({ ID: 987654, NOME: 'COSEC_203107_ 01' });
    expect(db.calls.some((c) => QUEUE_INSERT.test(c.sql))).toBe(true);
    expect(db.state.commits).toBe(1);
  });

  it('unknown medium → 400 VALIDACAO fields.tipoMidiaId = tipoMidiaInexistente, nothing written, rolled back', async () => {
    const db = criarDb({ midia: [] });
    await expect(db.repo.criar(NOVO, CTX)).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDACAO',
      fields: { tipoMidiaId: pt.backups.tipoMidiaInexistente },
    });
    expect(dml(db.calls)).toEqual([]);
    expect(db.state).toEqual({ commits: 0, rollbacks: 1, closes: 1 });
  });

  it('the queue insert binds { utilizador, id } (one ESPERA/BACKUP row per document of the backup)', async () => {
    const db = criarDb();
    await db.repo.criar(NOVO, CTX);
    expect(db.calls.find((c) => QUEUE_INSERT.test(c.sql))?.binds).toEqual({ utilizador: 'ZUSERX', id: 987654 });
  });

  it('a failing queue insert rolls everything back, nothing committed', async () => {
    const db = criarDb({ falha: QUEUE_INSERT });
    await expect(db.repo.criar(NOVO, CTX)).rejects.toBeDefined();
    expect(db.state).toEqual({ commits: 0, rollbacks: 1, closes: 1 });
  });
});

describe('online (BR-BKP-09: FD_BACKUPS_ONLINE buttons, one transaction)', () => {
  const ONLINE = /^\s*UPDATE\s+SVR_BACKUPS\s+SET\s+MEDIA_ONLINE\s*=\s*:s\s*,\s*DRIVE_ONLINE\s*=\s*:drive\s+WHERE\s+ID\s*=\s*:id\s*$/i;

  it("online true: executeMany with s 'S' and the drive bound, one commit", async () => {
    const db = fakeDb();
    await db.repo.online([987654, 987660], true, 'ZDRVX', CTX);
    const [u, ...resto] = dml(db.calls);
    expect(resto).toEqual([]);
    expect(u?.many).toBe(true);
    expect(u?.sql).toMatch(ONLINE);
    expect(u?.binds).toEqual([
      { s: 'S', drive: 'ZDRVX', id: 987654 },
      { s: 'S', drive: 'ZDRVX', id: 987660 },
    ]);
    noLiterals(u!.sql);
    expect(db.calls.at(-1)?.sql).toBe(COMMIT);
    expect(db.state).toEqual({ commits: 1, rollbacks: 0, closes: 1 });
  });

  it("online false: s 'N' and drive null", async () => {
    const db = fakeDb();
    await db.repo.online([987654], false, null, CTX);
    expect(dml(db.calls)[0]?.binds).toEqual([{ s: 'N', drive: null, id: 987654 }]);
  });

  it('fewer rows updated than ids (unknown backup) → 409 REGISTO_ALTERADO, rolled back', async () => {
    const db = fakeDb((sql) => (ONLINE.test(sql) ? { rowsAffected: 1 } : {}));
    await expect(db.repo.online([987654, 987660], true, 'ZDRVX', CTX)).rejects.toMatchObject({ statusCode: 409, code: 'REGISTO_ALTERADO' });
    expect(db.state).toEqual({ commits: 0, rollbacks: 1, closes: 1 });
  });
});
