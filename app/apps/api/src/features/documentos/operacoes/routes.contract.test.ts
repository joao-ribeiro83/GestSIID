import oracledb from 'oracledb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildPoolAttrs, query, type DbPool } from '../../../db/oracle.ts';
import { readOnlyPool } from '../../../test/read-only-db.ts';
import { oracleDocumentosRepo } from '../repo.ts';
import { oracleOperacoesDb } from './oracle.ts';

/**
 * Contract test against the TEST schema (TEST_STRATEGY.md, CLAUDE.md HARD RULE): reaches Oracle
 * only through readOnlyPool and runs plain SELECTs. It proves that the objects the Step 7.2 SQL
 * names exist (sequences, package procedures, columns) and that the read methods of
 * oracleOperacoesDb run. NEVER selects a sequence NEXTVAL (that advances it), never calls
 * modoEdoc (it runs PKG_SIID_UTIL.CAN_BE_UPLOADED_EDOC), enfileirar, anular, cancelar,
 * mudarEstadoFila, cancelarPedido or clonar: those are pinned on a fake connection
 * (oracle.test.ts) and on the memory db (routes.test.ts). Skipped unless DB_CONNECT_STRING is set.
 */

const env = process.env;
const USER = { username: 'CONTRACT_TEST', nome: 'Contract test', role: 'ADM' as const, ambiente: env['AMBIENTE_ID'] ?? 'T' };
const T = 30_000;

type Linha = Record<string, unknown>;

describe.skipIf(!env['DB_CONNECT_STRING'])('documentos/operacoes — TEST schema (read-only)', { timeout: 60_000 }, () => {
  let realPool: oracledb.Pool;
  let pool: DbPool;
  let ultimos: number[] = [];

  const rows = (sql: string, binds: Record<string, unknown> = {}) => query<Linha>(pool, USER, 'contract', T, sql, binds);

  beforeAll(async () => {
    if (env['ORACLE_CLIENT_LIB_DIR']) oracledb.initOracleClient({ libDir: env['ORACLE_CLIENT_LIB_DIR'] });
    else oracledb.initOracleClient();
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    realPool = await oracledb.createPool(
      buildPoolAttrs({
        DB_USER: env['DB_USER'] ?? '',
        DB_PASSWORD: env['DB_PASSWORD'] ?? '',
        DB_CONNECT_STRING: env['DB_CONNECT_STRING'] ?? '',
        DB_SCHEMA: env['DB_SCHEMA'] ?? '',
        DB_POOL_SIZE: 2,
      }),
    );
    pool = readOnlyPool(realPool as unknown as DbPool);
    ultimos = (await rows('SELECT ID FROM SVR_DOCUMENTOS ORDER BY ID DESC FETCH FIRST 2 ROWS ONLY')).map((r) => Number(r['ID']));
    expect(ultimos, 'SVR_DOCUMENTOS of the TEST schema has fewer than 2 rows').toHaveLength(2);
  }, 60_000);

  afterAll(async () => {
    await realPool?.close(0);
  }, 60_000);

  it('the sequences ID_QUEUE_SEQ and ID_ERROS_SEQ exist (catalogue only — NEXTVAL is never selected)', async () => {
    const found = await rows(
      "SELECT SEQUENCE_NAME FROM ALL_SEQUENCES WHERE SEQUENCE_NAME IN ('ID_QUEUE_SEQ', 'ID_ERROS_SEQ')",
    );
    expect(new Set(found.map((r) => r['SEQUENCE_NAME']))).toEqual(new Set(['ID_QUEUE_SEQ', 'ID_ERROS_SEQ']));
  });

  it('the package procedures the operations call exist', async () => {
    const found = await rows(
      `SELECT OBJECT_NAME, PROCEDURE_NAME FROM ALL_PROCEDURES
        WHERE (OBJECT_NAME = 'PKG_DOCUMENTOS_SVR' AND PROCEDURE_NAME IN ('ANULAR', 'SET_PARAMETRO_STRING', 'EXECUTA', 'GET_ID_EXECUCAO'))
           OR (OBJECT_NAME = 'PKG_SIID_UTIL' AND PROCEDURE_NAME = 'CAN_BE_UPLOADED_EDOC')
           OR (OBJECT_NAME = 'CRYPT_PKG' AND PROCEDURE_NAME = 'ENCRYPTSTRINGRAW')`,
    );
    const pares = new Set(found.map((r) => `${r['OBJECT_NAME']}.${r['PROCEDURE_NAME']}`));
    for (const p of [
      'PKG_DOCUMENTOS_SVR.ANULAR',
      'PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING',
      'PKG_DOCUMENTOS_SVR.EXECUTA',
      'PKG_DOCUMENTOS_SVR.GET_ID_EXECUCAO',
      'PKG_SIID_UTIL.CAN_BE_UPLOADED_EDOC',
      'CRYPT_PKG.ENCRYPTSTRINGRAW',
    ])
      expect(pares, p).toContain(p);
  });

  it('SVR_QUEUE has the 8 columns the INSERT names; ERR_ERROS_SIID the 5; SVR_IMPRESSORAS has VALIDO', async () => {
    const cols = async (table: string) =>
      new Set((await rows('SELECT COLUMN_NAME FROM ALL_TAB_COLUMNS WHERE TABLE_NAME = :t', { t: table })).map((r) => r['COLUMN_NAME']));
    const queue = await cols('SVR_QUEUE');
    for (const c of ['ID', 'TIPO_QUEUE_RF', 'DOCUMENTO_ID', 'DATA_PEDIDO', 'ESTADO', 'IMPRESSORA_ID', 'CRIADO_POR', 'ATRIBUTO01'])
      expect(queue, `SVR_QUEUE.${c}`).toContain(c);
    const erros = await cols('ERR_ERROS_SIID');
    for (const c of ['ID', 'TIPO_ERROSIID', 'DATA_ERRO', 'DESCRICAO', 'DOCUMENTO_ID']) expect(erros, `ERR_ERROS_SIID.${c}`).toContain(c);
    expect(await cols('SVR_IMPRESSORAS')).toContain('VALIDO');
    const docs = await cols('SVR_DOCUMENTOS');
    for (const c of ['ATRIBUTO9', 'DISPONIVEL_RF', 'N_IMPRESSOES', 'ARQ_ID', 'MODELO_ID', 'LOTE_ID']) expect(docs, `SVR_DOCUMENTOS.${c}`).toContain(c);
    expect(await cols('DOC_MODELOS_DOCUMENTO')).toContain('MODO_EXPEDICAO_RF');
  });

  it('lerDocumentos of the two most recent ids returns both, IMPRESSAO_TERMINADA as a number', async () => {
    const docs = await oracleOperacoesDb(pool, T).lerDocumentos(USER, ultimos);
    expect(docs.map((d) => d.ID).sort()).toEqual([...ultimos].sort());
    for (const d of docs) {
      expect(typeof d.IMPRESSAO_TERMINADA).toBe('number');
      expect(d.IMPRESSAO_TERMINADA).toBeGreaterThanOrEqual(0);
      for (const c of ['ATRIBUTO9', 'DISPONIVEL_RF', 'N_IMPRESSOES', 'ARQ_ID', 'MODELO_ID', 'LOTE_ID', 'MODO_EXPEDICAO_RF']) expect(d).toHaveProperty(c);
    }
  });

  it('lerDocumentos of an id that does not exist returns nothing', async () => {
    expect(await oracleOperacoesDb(pool, T).lerDocumentos(USER, [-1])).toEqual([]);
  });

  it('ultimoEmail of the most recent document is a string or null', async () => {
    const v = await oracleOperacoesDb(pool, T).ultimoEmail(USER, ultimos[0]!);
    expect(v === null || typeof v === 'string').toBe(true);
  });

  it("impressoraValida('0') is false", async () => {
    expect(await oracleOperacoesDb(pool, T).impressoraValida(USER, '0')).toBe(false);
  });

  it("contagemFila('ESPERA') is a non-negative number", async () => {
    const n = await oracleOperacoesDb(pool, T).contagemFila(USER, 'ESPERA');
    expect(typeof n).toBe('number');
    expect(n).toBeGreaterThanOrEqual(0);
  });

  it('DocumentosRepo.ids resolves a consulta (preset todos, f[ID] = latest) to that id', async () => {
    const id = ultimos[0]!;
    const ids = await oracleDocumentosRepo(pool, T).ids(
      { preset: 'todos', filters: { ID: [{ op: 'eq', value: String(id) }] }, sort: [], page: 1, size: 50 },
      { user: USER },
    );
    expect(ids).toEqual([id]);
  });
});
