import oracledb from 'oracledb';
import { pt } from '@gestsiid/shared';
import { AppError, mapOracleError } from '../../../db/errors.ts';
import {
  callPlsql,
  lockRow,
  withConnection,
  withTransaction,
  type DbConnection,
  type DbPool,
  type SessionUser,
} from '../../../db/oracle.ts';
import { blocoClonar, CANCELAR_ESTADOS, type DocOperacao } from './regras.ts';
import type { OperacoesDb } from './servico.ts';

/**
 * OperacoesDb on Oracle (Step 7.2): the same SVR_QUEUE / ERR_ERROS_SIID inserts and package
 * calls as FD_GESTAO_SIID, binds only. Queue + audit rows of one batch share one transaction
 * (Forms: one FORMS_DDL('COMMIT') after the loop); every PKG_DOCUMENTOS_SVR call runs alone
 * because the package commits by itself (A-01). Pinned by oracle.test.ts on a fake connection.
 */

const CHUNK = 1000; // Oracle IN-list limit

const LER_DOCUMENTOS =
  'SELECT D.ID, D.ATRIBUTO9, D.DISPONIVEL_RF, D.N_IMPRESSOES, D.ARQ_ID, D.MODELO_ID, D.LOTE_ID, M.MODO_EXPEDICAO_RF, ' +
  "(SELECT COUNT(*) FROM SVR_QUEUE Q WHERE Q.DOCUMENTO_ID = D.ID AND Q.TIPO_QUEUE_RF = 'IMPRESSAO' AND Q.ESTADO = 'TERMINADO') AS IMPRESSAO_TERMINADA " +
  'FROM SVR_DOCUMENTOS D LEFT JOIN DOC_MODELOS_DOCUMENTO M ON M.ID = D.MODELO_ID WHERE D.ID IN (';

// ORDENACAO_DOCUMENTOS.REENVIAR: the DECODE as the form ran it (D-18: the rule stays in the package).
const MODO_EDOC =
  "SELECT DECODE(M.MODO_EXPEDICAO_RF, 'W', DECODE(PKG_SIID_UTIL.CAN_BE_UPLOADED_EDOC(:id), 0, 'I', M.MODO_EXPEDICAO_RF), M.MODO_EXPEDICAO_RF) AS MODO " +
  'FROM SVR_DOCUMENTOS D, DOC_MODELOS_DOCUMENTO M WHERE D.ID = :id AND D.MODELO_ID = M.ID';

const ULTIMO_EMAIL = "SELECT MAX(ATRIBUTO01) AS V FROM SVR_QUEUE WHERE TIPO_QUEUE_RF = 'EMAIL' AND DOCUMENTO_ID = :id";
const IMPRESSORA_VALIDA = "SELECT 1 AS OK FROM SVR_IMPRESSORAS WHERE ID = :id AND VALIDO = 'S'";

// Program units REIMPRIMIR / REGERAR / REENVIAR / REENVIA_EMAIL / REARQUIVAR, one column list for all.
const INSERE_FILA =
  'INSERT INTO SVR_QUEUE (ID, TIPO_QUEUE_RF, DOCUMENTO_ID, DATA_PEDIDO, ESTADO, IMPRESSORA_ID, CRIADO_POR, ATRIBUTO01) ' +
  "VALUES (ID_QUEUE_SEQ.NEXTVAL, :tipo, :documento, SYSDATE, 'ESPERA', :impressora, :utilizador, :atributo01)";
const INSERE_ERRO =
  'INSERT INTO ERR_ERROS_SIID (ID, TIPO_ERROSIID, DATA_ERRO, DESCRICAO, DOCUMENTO_ID) ' +
  "VALUES (ID_ERROS_SEQ.NEXTVAL, 'ERRO_DOC', SYSDATE, :descricao, :documento)";

const ANULAR = 'BEGIN PKG_DOCUMENTOS_SVR.ANULAR(:id, :utilizador); END;';
const DISPONIVEL = 'SELECT DISPONIVEL_RF FROM SVR_DOCUMENTOS WHERE ID = :id';

// ORDENACAO_DOCUMENTOS.CANCELAR; the state list is the form's normal branch (D-12 `force` drops it).
const CANCELAR = "UPDATE SVR_QUEUE SET ESTADO = 'CANCELLED' WHERE TIPO_QUEUE_RF = 'EXECUCAO' AND DOCUMENTO_ID = :id";
const CANCELAR_FILTRO = ` AND ESTADO IN (${CANCELAR_ESTADOS.map((e) => `'${e}'`).join(', ')})`;

// SUSPENDER.OK / RETOMAR.OK cursors folded into one UPDATE per document (or one for all).
const MUDA_ESTADO = 'UPDATE SVR_QUEUE SET ESTADO = :para WHERE ESTADO = :de';
// Popup ESTADO_PEDIDO.CANCELAR.
const CANCELA_PEDIDO = "UPDATE SVR_QUEUE SET ESTADO = 'CANCELLED' WHERE ID = :q AND ESTADO IN ('ESPERA', 'TERMINADO')";
const CONTAGEM = 'SELECT COUNT(*) AS N FROM SVR_QUEUE WHERE ESTADO = :estado';
const DOCUMENTO_EXISTE = 'SELECT 1 AS OK FROM SVR_DOCUMENTOS WHERE ID = :id';
// Block SVR_DOCUMENTO_COMENTARIOS: PRE-INSERT sequence, DATA / USER_ID from the block defaults (D-08).
const COMENTAR =
  'INSERT INTO SVR_DOCUMENTO_COMENTARIOS (COMENTARIO_ID, DATA, COMENTARIO, USER_ID, DOCUMENTO_ID) ' +
  'VALUES (ID_COMENTARIO_DOCUMENTO_SEQ.NEXTVAL, SYSDATE, :comentario, :utilizador, :documento) RETURNING COMENTARIO_ID INTO :id';
const LOTE_CLONE = 'UPDATE SVR_DOCUMENTOS SET LOTE_ID = :lote WHERE ID = :id';

type Binds = Record<string, unknown>;

async function rows<T>(conn: DbConnection, sql: string, binds: Binds): Promise<T[]> {
  return ((await conn.execute<T>(sql, binds as oracledb.BindParameters)).rows ?? []) as T[];
}

async function affected(conn: DbConnection, sql: string, binds: Binds): Promise<number> {
  return (await conn.execute(sql, binds as oracledb.BindParameters)).rowsAffected ?? 0;
}

export function oracleOperacoesDb(pool: DbPool, callTimeoutMs: number): OperacoesDb {
  const mapped = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      throw e instanceof AppError ? e : mapOracleError(e);
    }
  };
  const read = <T>(user: SessionUser, action: string, fn: (conn: DbConnection) => Promise<T>) =>
    mapped(() => withConnection(pool, user, `documentos.${action}`, callTimeoutMs, fn));
  const write = <T>(user: SessionUser, action: string, fn: (conn: DbConnection) => Promise<T>) =>
    mapped(() => withTransaction(pool, user, `documentos.${action}`, callTimeoutMs, fn));

  return {
    lerDocumentos: (user, ids) =>
      read(user, 'operacoes.ler', async (conn) => {
        const out: DocOperacao[] = [];
        for (let i = 0; i < ids.length; i += CHUNK) {
          const chunk = ids.slice(i, i + CHUNK);
          out.push(
            ...(await rows<DocOperacao>(
              conn,
              `${LER_DOCUMENTOS}${chunk.map((_, j) => `:i${j}`).join(', ')})`,
              Object.fromEntries(chunk.map((id, j) => [`i${j}`, id])),
            )),
          );
        }
        return out;
      }),

    modoEdoc: (user, id) =>
      read(user, 'reenviar-edoc', async (conn) => (await rows<{ MODO: string | null }>(conn, MODO_EDOC, { id }))[0]?.MODO ?? null),

    ultimoEmail: (user, id) =>
      read(user, 'reenviar-email', async (conn) => (await rows<{ V: string | null }>(conn, ULTIMO_EMAIL, { id }))[0]?.V ?? null),

    impressoraValida: (user, id) =>
      read(user, 'impressora', async (conn) => (await rows(conn, IMPRESSORA_VALIDA, { id })).length > 0),

    enfileirar: (user, pedidos) =>
      write(user, 'enfileirar', async (conn) => {
        for (const p of pedidos) {
          await conn.execute(INSERE_FILA, {
            tipo: p.tipo,
            documento: p.documentoId,
            impressora: p.impressoraId ?? null,
            utilizador: user.username,
            atributo01: p.atributo01 ?? null,
          });
          if (p.auditoria !== undefined)
            await conn.execute(INSERE_ERRO, { descricao: p.auditoria, documento: p.documentoId });
        }
      }),

    // Program unit ANULA: P_DOCID is VARCHAR2 (Forms passed TO_CHAR). The package commits its own
    // record_error rows (A-01); the app commits the rest, then reads the outcome (D-17).
    anular: (user, id) =>
      read(user, 'anular', async (conn) => {
        await conn.execute(ANULAR, { id: String(id), utilizador: user.username });
        await conn.commit();
        return (await rows<{ DISPONIVEL_RF: string | null }>(conn, DISPONIVEL, { id }))[0]?.DISPONIVEL_RF;
      }),

    cancelar: (user, ids, force) =>
      write(user, 'cancelar', async (conn) => {
        const sql = force ? CANCELAR : CANCELAR + CANCELAR_FILTRO;
        let n = 0;
        for (const id of ids) n += await affected(conn, sql, { id });
        return n;
      }),

    mudarEstadoFila: (user, de, para, alvo) =>
      write(user, para === 'SUSPENSO' ? 'suspender' : 'retomar', async (conn) => {
        if (alvo === 'todos') return affected(conn, MUDA_ESTADO, { para, de });
        let n = 0;
        for (const id of alvo) n += await affected(conn, `${MUDA_ESTADO} AND DOCUMENTO_ID = :id`, { para, de, id });
        return n;
      }),

    cancelarPedido: (user, documentoId, queueId) =>
      write(user, 'fila.cancelar', async (conn) => {
        await lockRow(conn, 'SVR_QUEUE', 'ID = :q AND DOCUMENTO_ID = :d', { q: queueId, d: documentoId }, {});
        if ((await affected(conn, CANCELA_PEDIDO, { q: queueId })) === 0)
          throw new AppError(409, 'PEDIDO_NAO_CANCELAVEL', pt.documentos.pedidoNaoCancelavel);
      }),

    comentar: (user, documentoId, comentario) =>
      write(user, 'comentar', async (conn) => {
        if ((await rows(conn, DOCUMENTO_EXISTE, { id: documentoId })).length === 0)
          throw new AppError(404, 'NAO_ENCONTRADO', 'Registo não encontrado.');
        const r = await conn.execute<unknown>(COMENTAR, {
          comentario,
          utilizador: user.username,
          documento: documentoId,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        });
        return (r.outBinds as { id: number[] }).id[0]!;
      }),

    contagemFila: (user, estado) =>
      read(user, 'fila.contagem', async (conn) => (await rows<{ N: number }>(conn, CONTAGEM, { estado }))[0]?.N ?? 0),

    // CLONAR.CLONAR: one block on one connection (D-17). EXECUTA commits inside the package, so
    // there is nothing to commit here; a failure leaves package state behind, so the connection
    // is dropped instead of returned to the pool (A-01).
    clonar: async (user, origem, parametros) => {
      const conn = await pool.getConnection();
      let id: number;
      try {
        conn.clientId = user.username;
        conn.module = 'gestsiid';
        conn.action = 'documentos.clonar';
        conn.callTimeout = callTimeoutMs;
        const binds: Record<string, unknown> = { usuario: user.username, ambiente: user.ambiente, modelo: origem.MODELO_ID };
        parametros.forEach((p, i) => {
          binds[`n${i}`] = p.nome;
          binds[`v${i}`] = p.valor;
        });
        binds['id'] = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER };
        // node-oracledb accepts plain scalars as IN binds; callPlsql's map type only names the object form.
        id = (await callPlsql<{ id: number }>(conn, blocoClonar(parametros.length), binds as Record<string, oracledb.BindParameter>)).id;
        // FPEDIDO_EXECUCAO swallows every error (record_error, RETURN -1): the failure is in the
        // source document's log, not in an exception.
        if (!(id > 0)) throw new AppError(422, 'CLONAR_FALHOU', pt.documentos.clonarFalhou);
      } catch (e) {
        await conn.close({ drop: true });
        throw e instanceof AppError ? e : mapOracleError(e);
      }
      await conn.close();
      // GLOBAL.LOTE_CLONE_ID (D-20): the Forms FORMS_DDL string was a no-op when the lote was null.
      if (origem.LOTE_ID !== null)
        await write(user, 'clonar.lote', (c) => c.execute(LOTE_CLONE, { lote: origem.LOTE_ID, id }));
      return id;
    },
  };
}
