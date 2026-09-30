import { defineResource, documentos, type ListQueryParam } from '@gestsiid/shared';
import { AppError } from '../db/errors.ts';
import type { BuiltSql } from '../lib/listQuery.ts';

/**
 * Server-only SQL of FD_GESTAO_SIID (ARCHITECTURE §4.1 "Documentos specifics"), copied from the
 * trigger text in analysis/forms-xml/T/FD_GESTAO_SIID_fmb.xml. Model codes stay constants here,
 * as in Forms (BR-XC-08). Nothing is written to SVR_GESTAO_SIID_TMP (§3): the form's temp-table
 * rows (Em erro, PROCURAR) become subqueries.
 */

/** ORDENACAO_DOCUMENTOS filter buttons, WHEN-BUTTON-PRESSED DEFAULT_WHERE (BR-DOC-03..07). */
export const PRESETS: Record<string, string> = {
  todos: '1 = 1',
  // The WHEN-MOUSE-CLICK copy (enter-query mode only) also lists R3.D28/R3.D28R; a normal click
  // runs this one.
  'em-branco':
    "DATA_EXECUCAO IS NOT NULL AND DECODE(DESTINATARIO,NULL,0,1) + DECODE(N_REFERENCIA,NULL,0,DECODE(MODELO_ID,'R3.D25',0,'R3.D25R',0,'R3.D27',0,'R3.D27R',0,1)) = 0" +
    " AND MODELO_ID NOT LIKE 'M%' AND DECODE(MODELO_ID,'I1.D55','A',MODELO_ID) NOT LIKE 'I%'" +
    " AND MODELO_ID != 'O1.OD58' AND MODELO_ID != 'O2.OD61' AND MODELO_ID != 'O2.OD69'",
  'nao-executados': 'estado is null',
  // The form's INSERT INTO SVR_GESTAO_SIID_TMP … SELECT, as a subquery (same ids, one per document).
  // MATERIALIZE stands in for the temp table: as a plain IN subquery the view query never finished
  // on the TEST schema (> 10 min); materialized, the first page takes ~1 s.
  'em-erro':
    "id IN (WITH E AS (SELECT /*+ MATERIALIZE */ DOCUMENTO_ID FROM (SELECT DOCUMENTO_ID FROM SVR_QUEUE Q WHERE ESTADO = 'ERRO'" +
    ' AND ID = (SELECT MAX(ID) FROM SVR_QUEUE QQ WHERE DOCUMENTO_ID = Q.DOCUMENTO_ID' +
    " AND DECODE(TIPO_QUEUE_RF,'REENVIAR','EXECUCAO',TIPO_QUEUE_RF) = DECODE(Q.TIPO_QUEUE_RF,'REENVIAR','EXECUCAO',Q.TIPO_QUEUE_RF)" +
    " AND NVL(DATA_EXECUCAO, DATA_FINALIZACAO) > (SELECT DECODE(QQ.TIPO_QUEUE_RF,'EXECUCAO',NVL(QQ.DATA_EXECUCAO, QQ.DATA_FINALIZACAO) - 1,MAX(NVL(DATA_EXECUCAO, DATA_FINALIZACAO)))" +
    " FROM SVR_QUEUE WHERE DOCUMENTO_ID = QQ.DOCUMENTO_ID AND TIPO_QUEUE_RF = 'EXECUCAO' GROUP BY DOCUMENTO_ID))" +
    ' GROUP BY DOCUMENTO_ID)) SELECT DOCUMENTO_ID FROM E)',
  'a-executar':
    "estado = 'A EXECUTAR' AND id >= (SELECT /*+ INDEX(Q) */ MIN(documento_id) FROM SVR_QUEUE Q WHERE ESTADO = 'EXECUCAO' AND TIPO_QUEUE_RF = 'EXECUCAO')",
  execucao:
    "estado = 'EXECUCAO' AND id >= (SELECT /*+ INDEX(Q) */ MIN(documento_id) FROM SVR_QUEUE Q WHERE ESTADO IN ('ESPERA','ENQUEUED') AND TIPO_QUEUE_RF = 'EXECUCAO')",
};

/** The list resource with its presets (the engine reads `resource.presets`). */
export const documentosServer = defineResource({ ...documentos, presets: PRESETS });

const invalido = (message: string) =>
  new AppError(400, 'VALIDACAO', 'Dados inválidos.', { fields: { param: message } });

/**
 * PROCURAR (BR-DOC-27): one `ID IN (…)` per non-empty `param[NOME]=VALOR`, ANDed (the form's
 * delete-not-in intersection); the model pattern on the first pair, like the form. Values are
 * LIKE patterns as typed (the user adds `%`; the SPA upper-cases, as the Forms item did).
 */
export function paramWhere(params: readonly ListQueryParam[] | undefined, modelo?: string): BuiltSql {
  const pares = (params ?? []).filter((p) => p.valor !== '');
  if (pares.length === 0) throw invalido('Indique o valor de pelo menos um parâmetro.');
  const binds: Record<string, unknown> = {};
  const sql = pares.map((p, i) => {
    binds[`en${i}`] = p.nome;
    binds[`ev${i}`] = p.valor;
    let s = `ID IN (SELECT DOCUMENTO_ID FROM SVR_PARAMETROS_DOC_NOME_VW WHERE NOME = :en${i} AND VALOR LIKE :ev${i}`;
    if (i === 0 && modelo !== undefined) {
      binds['em'] = modelo;
      s += ' AND MODELO_ID LIKE :em';
    }
    return `${s})`;
  });
  return { sql: sql.join(' AND '), binds };
}

// ── Mostrar grupo (menu MOSTRAR_GRUPO, BR-DOC-28) ────────────────────────────────────────────

/** `grupo=<id>`: a positive document id, else 400. */
export function grupoId(raw: string): number {
  const id = /^\d{1,15}$/.test(raw) ? Number(raw) : 0;
  if (id <= 0)
    throw new AppError(400, 'VALIDACAO', 'Dados inválidos.', { fields: { grupo: 'Documento inválido.' } });
  return id;
}

/** Grouped R3 models → their D1 counterpart. */
const PARES: Record<string, string> = {
  'R3.D25': 'D1.A7',
  'R3.D25R': 'D1.A7R',
  'R3.D27': 'D1.A5',
  'R3.D27R': 'D1.A5R',
};
const D1_PARA_R3 = Object.fromEntries(Object.entries(PARES).map(([r3, d1]) => [d1, r3]));

export const usaLote = (modelo: string | null) =>
  modelo !== null && (Object.hasOwn(PARES, modelo) || Object.hasOwn(D1_PARA_R3, modelo));

/** The LOTE_ORDEM bounds are read on this model (the form's DECODE: R3 → D1, else itself). */
export const contrapartida = (modelo: string) => PARES[modelo] ?? modelo;

/** `MODELO_ID IN (<pair>)`, D1 first. */
export function modeloPar(modelo: string): [string, string] {
  const r3 = D1_PARA_R3[modelo] ?? modelo;
  return [contrapartida(r3), r3];
}

export interface GrupoDoc {
  ID: number;
  MODELO_ID: string | null;
  LOTE_ID: number | null;
  LOTE_ORDEM: number | null;
  DESTINATARIO: string | null;
}

/** What the repo read for the plan: the parent (or the document) plus its attachments, and the
 * D1 LOTE_ORDEM bounds. The form built `id in (<parent>,<anexo>,…)` the same way. */
export interface GrupoLeitura {
  ids: number[];
  min: number | null;
  max: number | null;
}

export type GrupoPlano =
  | { tipo: 'anexos'; ids: number[] }
  | {
      tipo: 'lote';
      lote: number | null;
      ordemNula: boolean;
      min: number | null;
      max: number | null;
      /** Set when LOTE_ID or LOTE_ORDEM is null. */
      modelos: [string, string] | null;
      destinatario: string | null;
    };

export function planoGrupo(doc: GrupoDoc, l: GrupoLeitura): GrupoPlano {
  if (!usaLote(doc.MODELO_ID)) return { tipo: 'anexos', ids: l.ids };
  const semLote = doc.LOTE_ID === null || doc.LOTE_ORDEM === null;
  return {
    tipo: 'lote',
    lote: doc.LOTE_ID,
    ordemNula: doc.LOTE_ORDEM === null,
    min: doc.LOTE_ORDEM === null ? null : l.min,
    max: doc.LOTE_ORDEM === null ? null : l.max,
    modelos: semLote ? modeloPar(doc.MODELO_ID ?? '') : null,
    // Forms appended it unquoted (invalid SQL, no rows); with DESTINATARIO IS NULL it matches nothing.
    destinatario: semLote ? doc.DESTINATARIO : null,
  };
}

export function grupoSql(p: GrupoPlano): BuiltSql {
  if (p.tipo === 'anexos')
    // A literal id list, not a subquery: an OR / IN subquery made the query take 5-50 s.
    return {
      sql: `ID IN (${p.ids.map((_, i) => `:eg${i}`).join(', ')})`,
      binds: Object.fromEntries(p.ids.map((id, i) => [`eg${i}`, id])),
    };
  const parts: string[] = [];
  const binds: Record<string, unknown> = {};
  const add = (sql: string, name?: string, value?: unknown) => {
    parts.push(sql);
    if (name) binds[name] = value;
  };
  if (p.lote === null) add('LOTE_ID IS NULL');
  else add('LOTE_ID = :egl', 'egl', p.lote);
  if (p.ordemNula) add('LOTE_ORDEM IS NULL');
  if (p.min !== null) add('LOTE_ORDEM >= :egmin', 'egmin', p.min);
  if (p.max !== null) add('LOTE_ORDEM < :egmax', 'egmax', p.max);
  if (p.destinatario !== null) add('DESTINATARIO = :egd', 'egd', p.destinatario);
  if (p.modelos) {
    [binds['egm0'], binds['egm1']] = p.modelos;
    parts.push('DESTINATARIO IS NULL', 'MODELO_ID IN (:egm0, :egm1)');
  }
  return { sql: parts.join(' AND '), binds };
}

type Linha = Record<string, unknown>;

/** In-memory twin of {@link grupoSql} (dev server, unit tests). */
export function grupoMatch(p: GrupoPlano): (row: Linha) => boolean {
  if (p.tipo === 'anexos') {
    const ids = new Set<unknown>(p.ids);
    return (r) => ids.has(r['ID']);
  }
  return (r) => {
    const ordem = r['LOTE_ORDEM'] as number | null;
    return (
      (r['LOTE_ID'] ?? null) === p.lote &&
      (!p.ordemNula || ordem == null) &&
      (p.min === null || (ordem != null && ordem >= p.min)) &&
      (p.max === null || (ordem != null && ordem < p.max)) &&
      (p.destinatario === null || r['DESTINATARIO'] === p.destinatario) &&
      (!p.modelos || (r['DESTINATARIO'] == null && p.modelos.includes(r['MODELO_ID'] as string)))
    );
  };
}
