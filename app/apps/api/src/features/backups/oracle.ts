import oracledb from 'oracledb';
import { backups, backupsCandidatos, pt } from '@gestsiid/shared';
import { AppError, mapOracleError } from '../../db/errors.ts';
import { withConnection, withTransaction, type DbConnection, type DbPool } from '../../db/oracle.ts';
import { oracleStore } from '../../lib/crud.ts';
import type { BackupsRepo } from './repo.ts';

/**
 * BackupsRepo on Oracle (Step 8.1): the FD_NOVO_BACKUP / FD_BACKUPS_ONLINE SQL, not the package
 * procedures (DECISIONS A-02), binds only. Creating a backup is one transaction, as the form's
 * commit was. Pinned by oracle.test.ts on a fake connection.
 */

// TRUNC(DATA_IMPRESSAO,'MONTH') = :mes as a range, so the DATA_IMPRESSAO index can serve it.
const DO_MES =
  "BACKUP_ID IS NULL AND DATA_IMPRESSAO >= TO_DATE(:mes,'YYYY-MM') AND DATA_IMPRESSAO < ADD_MONTHS(TO_DATE(:mes,'YYYY-MM'),1)";

// Record group MES_BACKUP. ponytail: a full scan of SVR_DOCUMENTOS, ~46 s on TEST (2026-10-01) —
// under DB_CALL_TIMEOUT_MS; faster only with an index (a DB change: the owner's call).
const MESES =
  "SELECT DISTINCT TO_CHAR(TRUNC(DATA_IMPRESSAO,'MONTH'),'YYYY-MM') AS MES, TO_CHAR(TRUNC(DATA_IMPRESSAO,'MONTH'),'DD/MM/YYYY') AS DATA " +
  'FROM SVR_DOCUMENTOS WHERE BACKUP_ID IS NULL AND DATA_IMPRESSAO IS NOT NULL ORDER BY 1 DESC';
const TOTAL_MES = `SELECT NVL(SUM(TAMANHO_BYTES),0) AS TOTAL FROM SVR_DOCUMENTOS WHERE ${DO_MES}`;

// OK button: the medium's size.
const MIDIA = 'SELECT TAMANHO_BYTES FROM CFG_TIPOS_MIDIA WHERE ID = :id';
// PRE-INSERT sequence + WHEN-VALIDATE-ITEM (MES_BACKUP) name, copied from the form: TO_CHAR(n,'00')
// keeps the sign blank (COSEC_202401_ 01) and `_` in the LIKE is a wildcard, as Forms ran it.
const NOME =
  "SELECT SEQ_BACKUP_ID.NEXTVAL AS ID, 'COSEC_'||TO_CHAR(TO_DATE(:mes,'YYYY-MM'),'YYYYMM')||'_'||" +
  "TO_CHAR((SELECT COUNT(*) FROM SVR_BACKUPS WHERE NOME LIKE 'COSEC_'||TO_CHAR(TO_DATE(:mes,'YYYY-MM'),'YYYYMM')||'%')+1,'00') AS NOME FROM DUAL";
const INSERE_BACKUP =
  'INSERT INTO SVR_BACKUPS (ID, NOME, MES_BACKUP, TIPO_MIDIA_ID, DESTINO, OBSERVACOES, CRIADO_POR, DATA_CRIACAO) ' +
  "VALUES (:id, :nome, TO_DATE(:mes,'YYYY-MM'), :midia, :destino, :observacoes, :utilizador, SYSDATE)";
// POST-INSERT cursor DOCUMENTOS_BACKUP, limited to the month's candidates (the form could only tick those).
const MARCA_TODOS = `UPDATE SVR_DOCUMENTOS SET BACKUP_ID = :backup WHERE ${DO_MES}`;
const MARCA_DOC = `UPDATE SVR_DOCUMENTOS SET BACKUP_ID = :backup WHERE ID = :doc AND ${DO_MES}`;
const TOTAL_BACKUP = 'SELECT NVL(SUM(TAMANHO_BYTES),0) AS TOTAL FROM SVR_DOCUMENTOS WHERE BACKUP_ID = :id';
const INSERE_FILA =
  'INSERT INTO SVR_QUEUE (ID, TIPO_QUEUE_RF, DOCUMENTO_ID, DATA_PEDIDO, ESTADO, CRIADO_POR) ' +
  "SELECT ID_QUEUE_SEQ.NEXTVAL, 'BACKUP', ID, SYSDATE, 'ESPERA', :utilizador FROM SVR_DOCUMENTOS WHERE BACKUP_ID = :id";

// FD_BACKUPS_ONLINE online / offline buttons; the drive is resolved by the route (variable ONLINE).
const ONLINE = 'UPDATE SVR_BACKUPS SET MEDIA_ONLINE = :s, DRIVE_ONLINE = :drive WHERE ID = :id';

const alterado = () => new AppError(409, 'REGISTO_ALTERADO', 'O registo foi alterado por outro utilizador. Volte a consultar.');
const invalido = (field: string, msg: string) => new AppError(400, 'VALIDACAO', 'Dados inválidos.', { fields: { [field]: msg } });

async function rows<T>(conn: DbConnection, sql: string, binds: Record<string, unknown> = {}): Promise<T[]> {
  return ((await conn.execute<T>(sql, binds as oracledb.BindParameters)).rows ?? []) as T[];
}

export function oracleBackupsRepo(pool: DbPool, callTimeoutMs: number): BackupsRepo {
  const listaStore = oracleStore(pool, backups, callTimeoutMs);
  const candidatosStore = oracleStore(pool, backupsCandidatos, callTimeoutMs);
  const mapped = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      throw e instanceof AppError ? e : mapOracleError(e);
    }
  };

  return {
    meses: (ctx) => mapped(() => withConnection(pool, ctx.user, 'backups.meses', callTimeoutMs, (conn) => rows(conn, MESES))),

    lista: (q, ctx) => listaStore.list(q, {}, ctx),

    candidatos: async (q, mes, ctx) => {
      const { rows: r, total } = await candidatosStore.list(q, {}, ctx);
      const totalBytes = await mapped(() =>
        withConnection(pool, ctx.user, 'backups.candidatos', callTimeoutMs, async (conn) =>
          (await rows<{ TOTAL: number }>(conn, TOTAL_MES, { mes }))[0]?.TOTAL ?? 0,
        ),
      );
      return { rows: r, total, totalBytes };
    },

    criar: (novo, ctx) =>
      mapped(() =>
        withTransaction(pool, ctx.user, 'backups.criar', callTimeoutMs, async (conn) => {
          const midia = (await rows<{ TAMANHO_BYTES: number | null }>(conn, MIDIA, { id: novo.tipoMidiaId }))[0];
          if (!midia) throw invalido('tipoMidiaId', pt.backups.tipoMidiaInexistente);

          const { ID, NOME: nome } = (await rows<{ ID: number; NOME: string }>(conn, NOME, { mes: novo.mes }))[0]!;
          await conn.execute(INSERE_BACKUP, {
            id: ID,
            nome,
            mes: novo.mes,
            midia: novo.tipoMidiaId,
            destino: novo.destino + nome,
            observacoes: novo.observacoes,
            utilizador: ctx.user.username,
          });

          if (novo.ids === 'todos') {
            const r = await conn.execute(MARCA_TODOS, { backup: ID, mes: novo.mes });
            if (!r.rowsAffected) throw invalido('seleccao', pt.naoExistemDocumentosSeleccionados);
          } else {
            const r = await conn.executeMany(
              MARCA_DOC,
              novo.ids.map((doc) => ({ backup: ID, doc, mes: novo.mes })),
            );
            if ((r.rowsAffected ?? 0) < novo.ids.length) throw alterado();
          }

          // OK button: IF MIDIA < TOTAL_BACKUP (a null size passes, as in PL/SQL).
          const total = (await rows<{ TOTAL: number }>(conn, TOTAL_BACKUP, { id: ID }))[0]?.TOTAL ?? 0;
          if (midia.TAMANHO_BYTES !== null && midia.TAMANHO_BYTES < total) throw invalido('tipoMidiaId', pt.backups.tamanhoMidia);

          await conn.execute(INSERE_FILA, { utilizador: ctx.user.username, id: ID });
          return { ID, NOME: nome };
        }),
      ),

    online: (ids, online, drive, ctx) =>
      mapped(() =>
        withTransaction(pool, ctx.user, 'backups.online', callTimeoutMs, async (conn) => {
          const s = online ? 'S' : 'N';
          const r = await conn.executeMany(ONLINE, ids.map((id) => ({ s, drive, id })));
          if ((r.rowsAffected ?? 0) < ids.length) throw alterado();
        }),
      ),
  };
}
