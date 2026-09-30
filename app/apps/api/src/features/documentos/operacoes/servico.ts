import { pt } from '@gestsiid/shared';
import { AppError } from '../../../db/errors.ts';
import type { SessionUser } from '../../../http/auth-guard.ts';
import {
  auditoria,
  motivoImpressao,
  motivoRearquivar,
  motivoReenviarEdoc,
  motivoReenviarEmail,
  motivoRegerar,
  MSG,
  NOME_PARAMETRO_RE,
  PARAMETROS_RESERVADOS,
  precisaPassword,
  type DocOperacao,
  type TipoImpressao,
} from './regras.ts';

/**
 * One function per toolbar action of FD_GESTAO_SIID (Step 7.2, DOCUMENT_STATES.md §2–§4). Each
 * one reads through the {@link OperacoesDb} port, applies the pure rules of regras.ts and writes
 * the same rows the form wrote, reporting the outcome per document. The roles are the routes'
 * business; `user` only supplies CRIADO_POR / P_USUARIO / P_USER (D-08).
 */

export type TipoQueue = 'EXECUCAO' | TipoImpressao | 'REENVIAR' | 'EMAIL' | 'ARQUIVO';
export type EstadoFila = 'ESPERA' | 'SUSPENSO';

export interface PedidoFila {
  tipo: TipoQueue;
  documentoId: number;
  impressoraId?: string | null;
  atributo01?: string | null;
  /** ERR_ERROS_SIID.DESCRICAO written right after the queue row (BR-DOC-36). */
  auditoria?: string;
}

export interface Resultado {
  ok: number[];
  skipped: { id: number; motivo: string }[];
  /** Queue rows changed (cancelar, suspender, retomar). */
  pedidos?: number;
}

export interface Parametro {
  nome: string;
  valor: string;
}

export interface OperacoesDb {
  /** Ids missing in SVR_DOCUMENTOS are simply absent. */
  lerDocumentos(user: SessionUser, ids: number[]): Promise<DocOperacao[]>;
  /** The Forms DECODE incl. PKG_SIID_UTIL.CAN_BE_UPLOADED_EDOC (BR-DOC-17, D-18); null = no row. */
  modoEdoc(user: SessionUser, id: number): Promise<string | null>;
  /** MAX(ATRIBUTO01) of the document's EMAIL rows (BR-DOC-18). */
  ultimoEmail(user: SessionUser, id: number): Promise<string | null>;
  impressoraValida(user: SessionUser, id: string): Promise<boolean>;
  /** One transaction: every queue row (+ its audit row) or none. */
  enfileirar(user: SessionUser, pedidos: PedidoFila[]): Promise<void>;
  /** PKG_DOCUMENTOS_SVR.ANULAR, commit, re-read DISPONIVEL_RF; undefined = no such document (D-17). */
  anular(user: SessionUser, id: number): Promise<string | null | undefined>;
  /** Rows updated (D-12 `force` drops the state filter). */
  cancelar(user: SessionUser, ids: number[], force: boolean): Promise<number>;
  mudarEstadoFila(user: SessionUser, de: EstadoFila, para: EstadoFila, alvo: number[] | 'todos'): Promise<number>;
  /** 409 REGISTO_ALTERADO when the row is not the document's; 409 PEDIDO_NAO_CANCELAVEL when not ESPERA/TERMINADO. */
  cancelarPedido(user: SessionUser, documentoId: number, queueId: number): Promise<void>;
  contagemFila(user: SessionUser, estado: EstadoFila): Promise<number>;
  /** BR-DOC-30: COMENTARIO_ID from ID_COMENTARIO_DOCUMENTO_SEQ, DATA = SYSDATE, USER_ID = session user; 404 when the document does not exist. */
  comentar(user: SessionUser, documentoId: number, comentario: string): Promise<number>;
  /** SET_PARAMETRO_STRING… EXECUTA … GET_ID_EXECUCAO, then LOTE_ID (D-17, D-20); the new id. */
  clonar(user: SessionUser, origem: { MODELO_ID: string; LOTE_ID: number | null }, parametros: Parametro[]): Promise<number>;
}

const semSeleccao = () => new AppError(422, 'SEM_SELECCAO', pt.naoExistemDocumentosSeleccionados);
const naoEncontrado = () => new AppError(404, 'NAO_ENCONTRADO', 'Registo não encontrado.');

/** Per-document walk in selection order: `regra` gives a skip motivo or null; `pedido` the queue row. */
async function porDocumento(
  db: OperacoesDb,
  user: SessionUser,
  ids: number[],
  regra: (d: DocOperacao) => Promise<string | null> | string | null,
  pedido: (d: DocOperacao) => Promise<PedidoFila> | PedidoFila,
  lidos?: DocOperacao[],
): Promise<Resultado> {
  if (ids.length === 0) throw semSeleccao();
  const docs = new Map((lidos ?? (await db.lerDocumentos(user, ids))).map((d) => [d.ID, d]));
  const r: Resultado = { ok: [], skipped: [] };
  const pedidos: PedidoFila[] = [];
  for (const id of ids) {
    const d = docs.get(id);
    if (!d) {
      r.skipped.push({ id, motivo: MSG.documentoNaoEncontrado });
      continue;
    }
    const motivo = await regra(d);
    if (motivo) r.skipped.push({ id, motivo });
    else {
      pedidos.push(await pedido(d));
      r.ok.push(id);
    }
  }
  if (pedidos.length > 0) await db.enfileirar(user, pedidos);
  return r;
}

/** BR-DOC-13/14: the 428 is decided over the whole selection before any write. */
export async function regerar(db: OperacoesDb, user: SessionUser, ids: number[], reauth: boolean): Promise<Resultado> {
  if (ids.length === 0) throw semSeleccao();
  const docs = await db.lerDocumentos(user, ids);
  if (!reauth && precisaPassword(docs)) throw new AppError(428, 'PASSWORD_REGERACAO_NECESSARIA', MSG.inserirPassword);
  return porDocumento(
    db,
    user,
    ids,
    motivoRegerar,
    (d) => ({ tipo: 'EXECUCAO', documentoId: d.ID, auditoria: auditoria.regerado(user.username) }),
    docs,
  );
}

/** BR-DOC-10/11/12: `impressoraId` null = the document's own printer. */
export async function imprimir(
  db: OperacoesDb,
  user: SessionUser,
  ids: number[],
  tipo: TipoImpressao,
  impressoraId: string | null,
): Promise<Resultado> {
  if (ids.length === 0) throw semSeleccao();
  if (impressoraId !== null && !(await db.impressoraValida(user, impressoraId)))
    throw new AppError(400, 'VALIDACAO', 'Dados inválidos.', { fields: { impressoraId: MSG.impressoraInvalida } });
  return porDocumento(
    db,
    user,
    ids,
    (d) => motivoImpressao(tipo, d),
    (d) => ({ tipo, documentoId: d.ID, impressoraId }),
  );
}

/** BR-DOC-15: no precondition; the outcome is read back after each package call (D-17). */
export async function anular(db: OperacoesDb, user: SessionUser, ids: number[]): Promise<Resultado> {
  if (ids.length === 0) throw semSeleccao();
  const r: Resultado = { ok: [], skipped: [] };
  for (const id of ids) {
    const estado = await db.anular(user, id);
    if (estado === 'ANU') r.ok.push(id);
    else r.skipped.push({ id, motivo: estado === undefined ? MSG.documentoNaoEncontrado : MSG.anularFalhou });
  }
  return r;
}

export async function cancelar(db: OperacoesDb, user: SessionUser, ids: number[], force: boolean): Promise<Resultado> {
  if (ids.length === 0) throw semSeleccao();
  return { ok: ids, skipped: [], pedidos: await db.cancelar(user, ids, force) };
}

export async function suspender(db: OperacoesDb, user: SessionUser, alvo: number[] | 'todos'): Promise<Resultado> {
  return mudarFila(db, user, 'ESPERA', 'SUSPENSO', alvo);
}

export async function retomar(db: OperacoesDb, user: SessionUser, alvo: number[] | 'todos'): Promise<Resultado> {
  return mudarFila(db, user, 'SUSPENSO', 'ESPERA', alvo);
}

async function mudarFila(db: OperacoesDb, user: SessionUser, de: EstadoFila, para: EstadoFila, alvo: number[] | 'todos') {
  if (alvo !== 'todos' && alvo.length === 0) throw semSeleccao();
  return { ok: alvo === 'todos' ? [] : alvo, skipped: [], pedidos: await db.mudarEstadoFila(user, de, para, alvo) };
}

export function reenviarEdoc(db: OperacoesDb, user: SessionUser, ids: number[]): Promise<Resultado> {
  return porDocumento(
    db,
    user,
    ids,
    async (d) => motivoReenviarEdoc(await db.modoEdoc(user, d.ID)),
    (d) => ({ tipo: 'REENVIAR', documentoId: d.ID, auditoria: auditoria.reenviado(user.username) }),
  );
}

export function reenviarEmail(db: OperacoesDb, user: SessionUser, ids: number[]): Promise<Resultado> {
  const emails = new Map<number, string | null>();
  return porDocumento(
    db,
    user,
    ids,
    async (d) => {
      const email = await db.ultimoEmail(user, d.ID);
      emails.set(d.ID, email);
      return motivoReenviarEmail(email);
    },
    (d) => {
      const email = emails.get(d.ID) ?? '';
      return { tipo: 'EMAIL', documentoId: d.ID, atributo01: email, auditoria: auditoria.email(user.username, email) };
    },
  );
}

export function rearquivar(db: OperacoesDb, user: SessionUser, ids: number[]): Promise<Resultado> {
  return porDocumento(db, user, ids, motivoRearquivar, (d) => ({
    tipo: 'ARQUIVO',
    documentoId: d.ID,
    auditoria: auditoria.arquivado(user.username),
  }));
}

/**
 * BR-DOC-25: names are upper-cased (the package does UPPER too) and must be identifiers
 * (NOME_PARAMETRO_RE); reserved names are refused; empty values are dropped (Forms skipped null
 * VALOR).
 */
export async function clonar(db: OperacoesDb, user: SessionUser, id: number, parametros: Parametro[]): Promise<{ id: number }> {
  const invalido = (msg: string) => new AppError(400, 'VALIDACAO', 'Dados inválidos.', { fields: { parametros: msg } });
  const limpos = parametros.map((p) => ({ nome: p.nome.toUpperCase(), valor: p.valor }));
  const mau = limpos.find((p) => !NOME_PARAMETRO_RE.test(p.nome));
  if (mau) throw invalido(`Nome de parâmetro inválido: ${mau.nome}`);
  const reservado = limpos.find((p) => (PARAMETROS_RESERVADOS as readonly string[]).includes(p.nome));
  if (reservado) throw invalido(`O parâmetro ${reservado.nome} é definido pelo servidor.`);
  const [origem] = await db.lerDocumentos(user, [id]);
  if (!origem || origem.MODELO_ID === null) throw naoEncontrado();
  const novo = await db.clonar(user, { MODELO_ID: origem.MODELO_ID, LOTE_ID: origem.LOTE_ID }, limpos.filter((p) => p.valor !== ''));
  return { id: novo };
}
