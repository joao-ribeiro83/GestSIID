import { describe, expect, it } from 'vitest';
import type { DbConnection, DbPool } from '../../db/oracle.ts';
import { readOnlyPool } from '../../test/read-only-db.ts';
import { oracleImageStore } from '../../lib/imageRoutes.ts';
import { oracleModelosRepo, SECCAO_IMAGEM } from './repo.ts';
import { MODELO_EXISTENTE, type PedidoOmissao } from './rules.ts';

/**
 * oracleModelosRepo against a fake connection that records SQL and binds (no Oracle).
 * Distinctive values (Z…X, 987654, 2031 dates) make a literal in the SQL text easy to spot.
 * Scalar reads (COUNT, MAX) are answered as `{ N }`.
 */

type Answer = { rows?: unknown[]; rowsAffected?: number };
const DML = /^\s*(INSERT|UPDATE|DELETE|MERGE)\b/i;

function fakeDb(answer: (sql: string) => Answer = () => ({})) {
  const calls: { sql: string; binds: unknown }[] = [];
  const state = { commits: 0, rollbacks: 0, closes: 0 };
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
    },
    async rollback() {
      state.rollbacks++;
    },
    async close() {
      state.closes++;
    },
  } as unknown as DbConnection;
  const pool: DbPool = { getConnection: async () => conn };
  return { pool, calls, state, repo: oracleModelosRepo(pool, 1000) };
}

const bound = (binds: unknown) =>
  (Array.isArray(binds) ? binds : Object.values(binds as object)).map((v) =>
    String(v !== null && typeof v === 'object' && 'val' in v ? (v as { val: unknown }).val : v),
  );
const dml = (calls: { sql: string; binds: unknown }[]) => calls.filter((c) => DML.test(c.sql));
const LITERALS = ['ZORIGX', 'ZNOVOX', 'ZDESCX', 'ZMODX', 'ZSECX', 'ZVALORX', 'ZRAMOX', 'ZNOVORX', '987654', '2031-', 'JOAO'];
const noLiterals = (sql: string) => {
  for (const v of LITERALS) expect(sql).not.toContain(v);
};

const USER = { username: 'JOAO' };
const NOVO = {
  ID: 'ZNOVOX',
  DESCRICAO: 'ZDESCX',
  N_COPIAS: 987654,
  FORMA_CONTROLO_RF: 'UV',
  DATA_INICIO: '2031-02-03T00:00:00',
  DATA_FIM: '2031-12-31T00:00:00',
};
const COUNT = /\bCOUNT\s*\(/i;

describe('clonarModelo (BR-MOD-03)', () => {
  const clone = (existe: number, copiados = 1) =>
    fakeDb((sql) => {
      if (COUNT.test(sql)) return { rows: [{ N: existe }] };
      if (/^\s*INSERT\s+INTO\s+DOC_MODELOS_DOCUMENTO\b/i.test(sql)) return { rowsAffected: copiados };
      return {};
    });

  it('an existing ID → 409 MODELO_EXISTENTE, no INSERT, nothing committed', async () => {
    const db = clone(1);
    await expect(db.repo.clonarModelo(USER, 'ZORIGX', NOVO)).rejects.toMatchObject({
      statusCode: 409,
      code: 'MODELO_EXISTENTE',
      message: MODELO_EXISTENTE,
      fields: { ID: MODELO_EXISTENTE },
    });
    const count = db.calls.find((c) => COUNT.test(c.sql));
    expect(count?.sql).toMatch(/\bDOC_MODELOS_DOCUMENTO\b/i);
    expect(bound(count?.binds)).toContain('ZNOVOX');
    expect(dml(db.calls)).toEqual([]);
    expect(db.state.commits).toBe(0);
    expect(db.state.closes).toBe(1);
  });

  it('happy path: model, sections (with IMAGEM) and conditions by INSERT … SELECT, in that order, one commit', async () => {
    const db = clone(0);
    await db.repo.clonarModelo(USER, 'ZORIGX', NOVO);
    const inserts = dml(db.calls);
    expect(inserts.map((c) => /^\s*INSERT\s+INTO\s+(\w+)/i.exec(c.sql)?.[1]?.toUpperCase())).toEqual([
      'DOC_MODELOS_DOCUMENTO',
      'DOC_SECCOES_DOCUMENTO',
      'DOC_CONDICOES_APR',
    ]);
    const [modelo, seccoes, condicoes] = inserts;
    expect(modelo?.sql).toMatch(/\bSELECT\b[\s\S]*\bFROM\s+DOC_MODELOS_DOCUMENTO\b/i);
    expect(seccoes?.sql).toMatch(/\bSELECT\b[\s\S]*\bFROM\s+DOC_SECCOES_DOCUMENTO\b/i);
    expect(seccoes?.sql).toMatch(/\bIMAGEM\b/);
    expect(condicoes?.sql).toMatch(/\bSELECT\b[\s\S]*\bFROM\s+DOC_CONDICOES_APR\b/i);
    expect(bound(modelo?.binds)).toEqual(
      expect.arrayContaining(['ZNOVOX', 'ZORIGX', 'ZDESCX', '987654', 'UV', NOVO.DATA_INICIO, NOVO.DATA_FIM, 'JOAO']),
    );
    expect(bound(seccoes?.binds)).toEqual(expect.arrayContaining(['ZNOVOX', 'ZORIGX', 'JOAO']));
    expect(bound(condicoes?.binds)).toEqual(expect.arrayContaining(['ZNOVOX', 'ZORIGX']));
    for (const c of db.calls) noLiterals(c.sql);
    expect(db.calls.findIndex((c) => COUNT.test(c.sql))).toBeLessThan(db.calls.indexOf(modelo!));
    expect(db.state).toEqual({ commits: 1, rollbacks: 0, closes: 1 });
  });

  it('an unknown source (model INSERT copies 0 rows) → 404 NAO_ENCONTRADO, rolled back, no detail INSERT', async () => {
    const db = clone(0, 0);
    await expect(db.repo.clonarModelo(USER, 'ZORIGX', NOVO)).rejects.toMatchObject({
      statusCode: 404,
      code: 'NAO_ENCONTRADO',
      message: 'Registo não encontrado.',
    });
    expect(dml(db.calls)).toHaveLength(1);
    expect(db.state).toEqual({ commits: 0, rollbacks: 1, closes: 1 });
  });
});

describe('gravarOmissao (BR-MOD-09)', () => {
  const ABERTA = { DATA_INICIO: '2025-01-01T00:00:00', DATA_FIM: null, VALOR: 'velho', NOME_CONSULTA: null, CONSULTA_ONLINE: 'N' };
  const omissaoDb = (rows: unknown[], falha?: RegExp) =>
    fakeDb((sql) => {
      if (falha?.test(sql)) throw new Error('ORA-00001');
      if (/^\s*SELECT\b[\s\S]*\bDOC_PARAMETROS_OMISSAO\b/i.test(sql)) return { rows };
      if (/\bFROM\s+DUAL\b/i.test(sql)) return { rows: [{ AGORA: '2030-06-15T10:00:00' }] };
      return {};
    });
  const pedido = (over: Partial<PedidoOmissao>): PedidoOmissao => ({
    VALOR: 'ZVALORX',
    DATA_INICIO: null,
    DATA_FIM: null,
    NOME_CONSULTA: null,
    CONSULTA_ONLINE: 'N',
    ...over,
  });

  it('reads the rows of the model and parameter with binds', async () => {
    const db = omissaoDb([ABERTA]);
    await db.repo.gravarOmissao(USER, 'ZMODX', 987654, pedido({ DATA_INICIO: '2031-02-03T04:05:06' }));
    const read = db.calls.find((c) => /^\s*SELECT\b[\s\S]*\bDOC_PARAMETROS_OMISSAO\b/i.test(c.sql));
    expect(bound(read?.binds)).toEqual(expect.arrayContaining(['ZMODX', '987654']));
    noLiterals(read?.sql ?? '');
  });

  it('close + insert: UPDATE the open row then INSERT the new one, dates bound, one commit', async () => {
    const db = omissaoDb([ABERTA]);
    const ops = await db.repo.gravarOmissao(
      USER,
      'ZMODX',
      987654,
      pedido({ DATA_INICIO: '2031-02-03T04:05:06', NOME_CONSULTA: 'ZCONSX', CONSULTA_ONLINE: 'S' }),
    );
    expect(ops).toEqual([
      { tipo: 'fechar', DATA_INICIO: '2025-01-01T00:00:00', DATA_FIM: '2031-02-02T04:05:06' },
      {
        tipo: 'inserir',
        row: { DATA_INICIO: '2031-02-03T04:05:06', DATA_FIM: null, VALOR: 'ZVALORX', NOME_CONSULTA: 'ZCONSX', CONSULTA_ONLINE: 'S' },
      },
    ]);
    const [fechar, inserir, ...resto] = dml(db.calls);
    expect(resto).toEqual([]);
    expect(fechar?.sql).toMatch(/^\s*UPDATE\s+DOC_PARAMETROS_OMISSAO\b[\s\S]*\bDATA_FIM\b/i);
    expect(bound(fechar?.binds)).toEqual(expect.arrayContaining(['ZMODX', '987654', '2025-01-01T00:00:00', '2031-02-02T04:05:06']));
    expect(inserir?.sql).toMatch(/^\s*INSERT\s+INTO\s+DOC_PARAMETROS_OMISSAO\b/i);
    expect(bound(inserir?.binds)).toEqual(
      expect.arrayContaining(['ZMODX', '987654', '2031-02-03T04:05:06', 'ZVALORX', 'ZCONSX', 'S']),
    );
    noLiterals(fechar?.sql ?? '');
    noLiterals(inserir?.sql ?? '');
    expect(fechar?.sql).not.toContain('2025-01-01');
    expect(db.state).toEqual({ commits: 1, rollbacks: 0, closes: 1 });
  });

  it('same day: one UPDATE keyed by the stored DATA_INICIO, no INSERT', async () => {
    const db = omissaoDb([ABERTA]);
    const ops = await db.repo.gravarOmissao(USER, 'ZMODX', 987654, pedido({ DATA_INICIO: '2025-01-01T09:00:00' }));
    expect(ops).toEqual([
      {
        tipo: 'actualizar',
        DATA_INICIO: '2025-01-01T00:00:00',
        set: { VALOR: 'ZVALORX', DATA_FIM: null, NOME_CONSULTA: null, CONSULTA_ONLINE: 'N' },
      },
    ]);
    const writes = dml(db.calls);
    expect(writes).toHaveLength(1);
    expect(writes[0]?.sql).toMatch(/^\s*UPDATE\s+DOC_PARAMETROS_OMISSAO\b/i);
    expect(bound(writes[0]?.binds)).toEqual(expect.arrayContaining(['ZMODX', '987654', '2025-01-01T00:00:00', 'ZVALORX']));
    noLiterals(writes[0]?.sql ?? '');
  });

  it('nothing filled → no operation and no DML', async () => {
    const db = omissaoDb([ABERTA]);
    expect(await db.repo.gravarOmissao(USER, 'ZMODX', 987654, pedido({ VALOR: null }))).toEqual([]);
    expect(dml(db.calls)).toEqual([]);
  });

  it('reads the rows FOR UPDATE NOWAIT, so two saves cannot plan from the same rows', async () => {
    const db = omissaoDb([ABERTA]);
    await db.repo.gravarOmissao(USER, 'ZMODX', 987654, pedido({ DATA_INICIO: '2031-02-03T04:05:06' }));
    const read = db.calls.findIndex((c) => /^\s*SELECT\b[\s\S]*\bDOC_PARAMETROS_OMISSAO\b/i.test(c.sql));
    expect(db.calls[read]?.sql).toMatch(/FOR\s+UPDATE\s+NOWAIT/i);
    expect(read).toBeLessThan(db.calls.findIndex((c) => DML.test(c.sql)));
  });

  it('a failing statement rolls the whole plan back', async () => {
    const db = omissaoDb([ABERTA], /^\s*INSERT\b/i);
    await expect(
      db.repo.gravarOmissao(USER, 'ZMODX', 987654, pedido({ DATA_INICIO: '2031-02-03T04:05:06' })),
    ).rejects.toBeDefined();
    expect(db.state).toMatchObject({ commits: 0, rollbacks: 1 });
  });
});

describe('alterarRamo (BR-MOD-11)', () => {
  const RID = 'AAAR3sAAEAAAACXAAA';
  const LOCK = /FOR\s+UPDATE\s+NOWAIT/i;
  const ramoDb = (existe: boolean) =>
    fakeDb((sql) =>
      /^\s*SELECT\b[\s\S]*\bDOC_ATRIBUTOS_(EDOC|ARQUIVO)\b/i.test(sql)
        ? { rows: existe ? [{ MODELO_ID: 'ZMODX', EDOC_ID: 4242, ARQ_ID: 4242, CDRAMO: 'ZRAMOX' }] : [] }
        : {},
    );

  it.each([
    ['EDOC', 'DOC_ATRIBUTOS_EDOC', 'EDOC_ID', 'DOC_ATRIBUTOS_ARQUIVO'],
    ['ARQUIVO', 'DOC_ATRIBUTOS_ARQUIVO', 'ARQ_ID', 'DOC_ATRIBUTOS_EDOC'],
  ] as const)('%s: locks the row FOR UPDATE NOWAIT on orig.CDRAMO before any UPDATE of %s', async (alvo, tabela, grupo, outra) => {
    const db = ramoDb(true);
    await db.repo.alterarRamo(USER, alvo, RID, { CDRAMO: 'ZRAMOX' }, 'ZNOVORX');
    const lockAt = db.calls.findIndex((c) => LOCK.test(c.sql));
    expect(lockAt).toBeGreaterThanOrEqual(0);
    const lock = db.calls[lockAt]!;
    expect(lock.sql).toMatch(new RegExp(`\\b${tabela}\\b`));
    expect(lock.sql).toMatch(/\bCDRAMO\b/);
    expect(bound(lock.binds)).toEqual(expect.arrayContaining([RID, 'ZRAMOX']));
    const updates = db.calls.map((c, i) => ({ ...c, i })).filter((c) => /^\s*UPDATE\b/i.test(c.sql));
    expect(updates.length).toBeGreaterThan(0);
    for (const u of updates) {
      expect(u.i).toBeGreaterThan(lockAt);
      expect(u.sql).toMatch(new RegExp(`^\\s*UPDATE\\s+${tabela}\\b`, 'i'));
      expect(u.sql).not.toContain(outra);
      noLiterals(u.sql);
    }
    const ramo = updates.find((u) => new RegExp(`\\b${grupo}\\b`).test(u.sql) && /\bCDRAMO\b/.test(u.sql));
    expect(ramo).toBeDefined();
    expect(bound(ramo?.binds)).toContain('ZNOVORX');
    const audit = updates.find((u) => /\bACTUALIZADO_POR\b/.test(u.sql));
    expect(audit).toBeDefined();
    expect(bound(audit?.binds)).toContain('JOAO');
    expect(db.state).toEqual({ commits: 1, rollbacks: 0, closes: 1 });
  });

  it('locks the whole group (every row the UPDATE will change) before any UPDATE', async () => {
    const db = ramoDb(true);
    await db.repo.alterarRamo(USER, 'EDOC', RID, { CDRAMO: 'ZRAMOX' }, 'ZNOVORX');
    const grupo = db.calls.findIndex((c) => LOCK.test(c.sql) && /\(MODELO_ID, EDOC_ID\) IN/.test(c.sql));
    expect(grupo).toBeGreaterThanOrEqual(0);
    expect(grupo).toBeLessThan(db.calls.findIndex((c) => /^\s*UPDATE\b/i.test(c.sql)));
  });

  it('row changed or gone → 409 REGISTO_ALTERADO, no UPDATE, nothing committed', async () => {
    const db = ramoDb(false);
    await expect(db.repo.alterarRamo(USER, 'EDOC', RID, { CDRAMO: 'ZRAMOX' }, 'ZNOVORX')).rejects.toMatchObject({
      statusCode: 409,
      code: 'REGISTO_ALTERADO',
    });
    expect(dml(db.calls)).toEqual([]);
    expect(db.state.commits).toBe(0);
  });
});

describe('opcoes (D-28 pre-selection)', () => {
  const MAX = /\bMAX\s*\(/i;
  const opcoesDb = (max: number | null) =>
    fakeDb((sql) => {
      if (MAX.test(sql)) return { rows: [{ N: max }] };
      if (/\bFROM\s+DOC_TIPOS_CONTEUDO\b/i.test(sql)) return { rows: [{ CHAVE: 1, DESIGNACAO: 'Texto' }, { CHAVE: 2, DESIGNACAO: null }] };
      if (/\bFROM\s+DOC_CONTEXTOS_APR\b/i.test(sql)) return { rows: [{ CHAVE: 5, DESIGNACAO: 'Contexto 5' }] };
      return {};
    });
  const CHAVE = { MODELO_ID: 'ZMODX', TIPOSEC_ID: 'ZSECX' };

  it('TIPOS_CONTEUDO: rows of DOC_TIPOS_CONTEUDO and MAX(TIPOCNTD_ID) of the model section type', async () => {
    const db = opcoesDb(4);
    expect(await db.repo.opcoes(USER, 'TIPOS_CONTEUDO', CHAVE)).toEqual({
      rows: [
        { CHAVE: 1, DESIGNACAO: 'Texto' },
        { CHAVE: 2, DESIGNACAO: null },
      ],
      preSelected: 4,
    });
    const max = db.calls.find((c) => MAX.test(c.sql));
    expect(max?.sql).toMatch(/MAX\s*\(\s*TIPOCNTD_ID\s*\)[\s\S]*\bDOC_SECCOES_DOCUMENTO\b/i);
    expect(bound(max?.binds)).toEqual(expect.arrayContaining(['ZMODX', 'ZSECX']));
    noLiterals(max?.sql ?? '');
  });

  it('CONTEXTOS_APR: rows of DOC_CONTEXTOS_APR and MAX(CONTEXTO_ID) of DOC_CONDICOES_APR', async () => {
    const db = opcoesDb(6);
    expect(await db.repo.opcoes(USER, 'CONTEXTOS_APR', CHAVE)).toEqual({
      rows: [{ CHAVE: 5, DESIGNACAO: 'Contexto 5' }],
      preSelected: 6,
    });
    const max = db.calls.find((c) => MAX.test(c.sql));
    expect(max?.sql).toMatch(/MAX\s*\(\s*CONTEXTO_ID\s*\)[\s\S]*\bDOC_CONDICOES_APR\b/i);
    expect(bound(max?.binds)).toEqual(expect.arrayContaining(['ZMODX', 'ZSECX']));
  });

  it.each([0, null])('MAX %s → preSelected null', async (max) => {
    const db = opcoesDb(max);
    expect((await db.repo.opcoes(USER, 'TIPOS_CONTEUDO', CHAVE)).preSelected).toBeNull();
  });

  it('without a chave runs no MAX query and preSelected is null', async () => {
    const db = opcoesDb(4);
    expect((await db.repo.opcoes(USER, 'TIPOS_CONTEUDO')).preSelected).toBeNull();
    expect(db.calls.some((c) => MAX.test(c.sql))).toBe(false);
  });

  it('never writes or commits', async () => {
    const db = opcoesDb(4);
    await db.repo.opcoes(USER, 'CONTEXTOS_APR', CHAVE);
    expect(dml(db.calls)).toEqual([]);
    expect(db.state.commits).toBe(0);
    expect(db.state.closes).toBe(1);
  });
});

describe('read paths pass the read-only guard used by the contract test', () => {
  it('opcoes and parametrosReport run through readOnlyPool', async () => {
    const db = fakeDb((sql) => (/\bMAX\s*\(/i.test(sql) ? { rows: [{ N: 0 }] } : {}));
    const repo = oracleModelosRepo(readOnlyPool(db.pool), 1000);
    await repo.opcoes(USER, 'TIPOS_CONTEUDO', { MODELO_ID: 'ZMODX', TIPOSEC_ID: 'ZSECX' });
    await repo.opcoes(USER, 'CONTEXTOS_APR', { MODELO_ID: 'ZMODX', TIPOSEC_ID: 'ZSECX' });
    expect(await repo.parametrosReport(USER, 'ZMODX')).toEqual([]);
    expect(db.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('parametrosReport binds the model id', async () => {
    const db = fakeDb();
    await db.repo.parametrosReport(USER, 'ZMODX');
    expect(db.calls.some((c) => bound(c.binds).includes('ZMODX'))).toBe(true);
    for (const c of db.calls) noLiterals(c.sql);
  });
});

describe('SECCAO_IMAGEM (DOC_SECCOES_DOCUMENTO.IMAGEM, Step 6.2)', () => {
  const ctx = { user: { ...USER, role: 'ADM' as const } };
  const key = { MODELO_ID: 'ZMODX', TIPOSEC_ID: 'ZSECX', ALINEA: 987654 };
  const img = Buffer.from('89504e470d0a1a0a', 'hex');

  it('locks and updates one section by its three key columns, binds only', async () => {
    const db = fakeDb((sql) => (/FOR UPDATE/.test(sql) ? { rows: [{ 1: 1 }] } : {}));
    expect(await oracleImageStore(db.pool, SECCAO_IMAGEM, 1000).set(key, img, ctx)).toBe(true);
    const where = 'WHERE MODELO_ID = :MODELO_ID AND TIPOSEC_ID = :TIPOSEC_ID AND ALINEA = :ALINEA';
    expect(db.calls[0]?.sql).toBe(`SELECT 1 FROM DOC_SECCOES_DOCUMENTO ${where} FOR UPDATE NOWAIT`);
    expect(db.calls[1]?.sql).toBe(
      `UPDATE DOC_SECCOES_DOCUMENTO SET IMAGEM = :__img, ACTUALIZADO_POR = :__user, DATA_ACTUALIZACAO = SYSDATE ${where}`,
    );
    expect(db.calls[1]?.binds).toMatchObject({ ...key, __user: USER.username });
    expect(db.state.commits).toBe(1);
    for (const c of db.calls) noLiterals(c.sql);
  });

  it('a section locked by another session is 409 REGISTO_BLOQUEADO and nothing is written', async () => {
    const db = fakeDb((sql) => {
      if (/FOR UPDATE/.test(sql)) throw new Error('ORA-00054: resource busy and acquire with NOWAIT specified');
      return {};
    });
    await expect(oracleImageStore(db.pool, SECCAO_IMAGEM, 1000).clear(key, ctx)).rejects.toMatchObject({
      statusCode: 409,
      code: 'REGISTO_BLOQUEADO',
    });
    expect(dml(db.calls)).toEqual([]);
  });
});
