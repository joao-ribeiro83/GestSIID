import oracledb from 'oracledb';
import Fastify, { type FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { buildPoolAttrs, type DbPool } from '../../db/oracle.ts';
import { registerErrorHandler } from '../../http/errors.ts';
import { readOnlyPool } from '../../test/read-only-db.ts';
import { oracleDocumentosRepo } from './repo.ts';
import { registerDocumentosRoutes } from './routes.ts';

/**
 * Contract + trace-based parity test against the TEST schema (TEST_STRATEGY.md §2, CLAUDE.md HARD
 * RULE): reaches Oracle only through readOnlyPool and calls GET routes only. Each case runs the
 * legacy FD_GESTAO_SIID SQL (copied from analysis/forms-xml/T/FD_GESTAO_SIID_fmb.xml) directly and
 * compares ids / values with the API. The form's Em Erro temp-table INSERT is replaced by the same
 * SELECT as a subquery; nothing here writes. Fixtures (document ids) are found read-only at run
 * time; a missing fixture fails the test, it never skips. Skipped unless DB_CONNECT_STRING is set.
 * The session is a fake user whose role the test switches (ADM by default).
 *
 * The TEST schema is live: a document created between the API call and the direct SELECT shifts
 * the first page of "todos" / ID DESC. Re-run before suspecting the code.
 */

const env = process.env;
let role: 'ADM' | 'USER' = 'ADM';

/* ============== legacy form SQL + fixture lookups (begin): self-contained, no imports ============== */

type Row = Record<string, unknown>;
type Q = (sql: string, binds?: Record<string, unknown>) => Promise<Row[]>;

const CAP = 10_000;
const iso = (col: string) => `TO_CHAR(${col}, 'YYYY-MM-DD"T"HH24:MI:SS') AS ${col}`;
const seq = (prefix: string, from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `${prefix}${from + i}`);

/** Em Erro: the form INSERTs this SELECT into SVR_GESTAO_SIID_TMP and joins it; here it is a subquery. */
const EM_ERRO_SELECT = `SELECT DOCUMENTO_ID FROM SVR_QUEUE Q WHERE ESTADO = 'ERRO'
AND ID = (SELECT MAX(ID) FROM SVR_QUEUE QQ WHERE DOCUMENTO_ID = Q.DOCUMENTO_ID
  AND DECODE(TIPO_QUEUE_RF,'REENVIAR','EXECUCAO',TIPO_QUEUE_RF) = DECODE(Q.TIPO_QUEUE_RF,'REENVIAR','EXECUCAO',Q.TIPO_QUEUE_RF)
  AND NVL(DATA_EXECUCAO, DATA_FINALIZACAO) > (SELECT DECODE(QQ.TIPO_QUEUE_RF,'EXECUCAO',NVL(QQ.DATA_EXECUCAO, QQ.DATA_FINALIZACAO) - 1,MAX(NVL(DATA_EXECUCAO, DATA_FINALIZACAO)))
    FROM SVR_QUEUE WHERE DOCUMENTO_ID = QQ.DOCUMENTO_ID AND TIPO_QUEUE_RF = 'EXECUCAO' GROUP BY DOCUMENTO_ID))
GROUP BY DOCUMENTO_ID`;

/** WHEN-BUTTON-PRESSED on ORDENACAO_DOCUMENTOS.* (BR-DOC-04). null = no WHERE. */
const PRESET_WHERE: Record<string, string | null> = {
  todos: null,
  'nao-executados': 'estado is null',
  'a-executar':
    "estado = 'A EXECUTAR' AND id >= (SELECT /*+ INDEX(Q) */ MIN(documento_id) FROM SVR_QUEUE Q WHERE ESTADO = 'EXECUCAO' AND TIPO_QUEUE_RF = 'EXECUCAO')",
  execucao:
    "estado = 'EXECUCAO' AND id >= (SELECT /*+ INDEX(Q) */ MIN(documento_id) FROM SVR_QUEUE Q WHERE ESTADO IN ('ESPERA','ENQUEUED') AND TIPO_QUEUE_RF = 'EXECUCAO')",
  'em-branco':
    "DATA_EXECUCAO IS NOT NULL AND DECODE(DESTINATARIO,NULL,0,1) + DECODE(N_REFERENCIA,NULL,0,DECODE(MODELO_ID,'R3.D25',0,'R3.D25R',0,'R3.D27',0,'R3.D27R',0,1)) = 0 AND MODELO_ID NOT LIKE 'M%' AND DECODE(MODELO_ID,'I1.D55','A',MODELO_ID) NOT LIKE 'I%' AND MODELO_ID != 'O1.OD58' AND MODELO_ID != 'O2.OD61' AND MODELO_ID != 'O2.OD69'",
  'em-erro': `id IN (${EM_ERRO_SELECT})`,
};

const REFERENCIA_EXPR =
  "TO_NUMBER(REPLACE(TRANSLATE (DECODE( SIGN(LENGTH(N_REFERENCIA) - 2 * INSTR(N_REFERENCIA,'/') + 1),1,SUBSTR(N_REFERENCIA,INSTR(N_REFERENCIA,'/')+1),-1, SUBSTR(N_REFERENCIA,1,INSTR(N_REFERENCIA,'/')-1), N_REFERENCIA),'0123456789-/','0123456789  '), ' ', ''))";

/** API sort → the form's ORDER BY text (ORDENAR_POR first press, its toggle, the LOTE button; BR-DOC-05).
 * FATURACAO_ELECTRONICA: the form passes the typo FATURA_ELECTRONICA (A-05). */
const SORT_ORDER: [string, string][] = [
  ['ID:desc', 'ID DESC'],
  ['ID:asc', 'ID ASC'],
  ['DATA_PEDIDO:desc', 'DATA_PEDIDO DESC'],
  ['MODELO_ID:asc', 'MODELO_ID ASC'],
  ['MODELO_ID:desc', 'MODELO_ID DESC'],
  ['ESTADO:asc', 'ESTADO ASC'],
  ['CRIADO_POR:asc', 'CRIADO_POR ASC'],
  ['DESTINATARIO:asc', 'DESTINATARIO ASC'],
  ['FATURACAO_ELECTRONICA:asc', 'FATURACAO_ELECTRONICA ASC'],
  ['REFERENCIA:desc', `${REFERENCIA_EXPR} DESC`],
  ['LOTE:desc', 'LOTE_ID DESC, LOTE_ORDEM DESC'],
  ['LOTE:asc', 'LOTE_ID ASC, LOTE_ORDEM ASC'],
];

/** Forms has no tiebreak; the API appends ID ASC when ID is not a sort key, so the comparison does too. */
const tiebreak = (order: string) => (/^ID (ASC|DESC)$/.test(order) ? order : `${order}, ID ASC`);
const whereOf = (where: string | null) => (where ? ` WHERE ${where}` : '');
/** The form block query (data source SVR_DOCUMENTOS_VW), one page. */
const formIdsSql = (where: string | null, order: string, n: number, offset = 0) =>
  `SELECT ID FROM SVR_DOCUMENTOS_VW${whereOf(where)} ORDER BY ${tiebreak(order)} OFFSET ${offset} ROWS FETCH NEXT ${n} ROWS ONLY`;
/** COUNT capped like the API (min(count, CAP + 1)): the full view COUNT takes about two minutes. */
const formCountSql = (where: string | null) =>
  `SELECT COUNT(*) AS N FROM (SELECT 1 FROM SVR_DOCUMENTOS_VW${whereOf(where)} FETCH FIRST ${CAP + 1} ROWS ONLY)`;

/** PROCURAR (BR-DOC-27): the first row seeds the temp table (with the model when given), every
 * further row deletes the ids it does not match; here the same SELECTs joined by INTERSECT. */
function formParamSql(rows: { nome: string; valor: string }[], modelo?: string) {
  const binds: Record<string, unknown> = {};
  const parts = rows.map((r, i) => {
    binds[`n${i}`] = r.nome;
    binds[`v${i}`] = r.valor;
    const withModel = i === 0 && modelo !== undefined;
    if (withModel) binds['modelo'] = modelo;
    return (
      `select distinct b.documento_id from svr_parametros_doc_nome_vw b where b.valor like :v${i} and b.nome = :n${i}` +
      (withModel ? ' and b.modelo_id like :modelo' : '')
    );
  });
  return { sql: parts.join(' INTERSECT '), binds };
}
/** The form then joins SVR_DOCUMENTOS_VW to the temp-table ids; here a literal list of those ids
 * (numbers read from the DB). `ID IN (<subquery>)` on the view takes about 90 s, the list < 1 s. */
const idListWhere = (ids: number[]) => {
  if (ids.length === 0) return '1 = 0';
  const chunks: string[] = [];
  for (let i = 0; i < ids.length; i += 1000) chunks.push(`ID IN (${ids.slice(i, i + 1000).map(Number).join(',')})`);
  return `(${chunks.join(' OR ')})`;
};
/** Em Erro as the form runs it: the SELECT fills the id set (the temp table there, a literal list
 * here), then the view is joined to it. `id IN (<select>)` on the view ran for over four minutes,
 * the list of ~22 000 ids about 25 s. */
const formPresetWhere = async (q: Q, preset: string) =>
  preset === 'em-erro'
    ? idListWhere((await q(EM_ERRO_SELECT)).map((r) => Number(r['DOCUMENTO_ID'])))
    : PRESET_WHERE[preset]!;
async function formParamWhere(q: Q, rows: { nome: string; valor: string }[], modelo?: string) {
  const { sql, binds } = formParamSql(rows, modelo);
  return idListWhere((await q(sql, binds)).map((r) => Number(r['DOCUMENTO_ID'])));
}

const MODELOS_LOTE = ['R3.D25', 'R3.D25R', 'R3.D27', 'R3.D27R', 'D1.A7', 'D1.A7R', 'D1.A5', 'D1.A5R'];
const PAR_LOTE: Record<string, string> = {
  'R3.D25': "'D1.A7','R3.D25'",
  'D1.A7': "'D1.A7','R3.D25'",
  'R3.D25R': "'D1.A7R','R3.D25R'",
  'D1.A7R': "'D1.A7R','R3.D25R'",
  'R3.D27': "'D1.A5','R3.D27'",
  'D1.A5': "'D1.A5','R3.D27'",
  'R3.D27R': "'D1.A5R','R3.D27R'",
  'D1.A5R': "'D1.A5R','R3.D27R'",
};
const DECODE_PAR = "DECODE(:m,'R3.D25','D1.A7','R3.D25R','D1.A7R','R3.D27','D1.A5','R3.D27R','D1.A5R',:m)";
interface GrupoDoc {
  ID: number;
  MODELO_ID: string;
  LOTE_ID: number | null;
  LOTE_ORDEM: number | null;
  DESTINATARIO: string | null;
}
const GRUPO_DOC_COLS = 'ID, MODELO_ID, LOTE_ID, LOTE_ORDEM, DESTINATARIO';

/** Menu MOSTRAR_GRUPO (BR-DOC-28): the DEFAULT_WHERE Forms builds from the current row. Returns null
 * when Forms appended the unquoted `DESTINATARIO = <text>`: the query errors (or, for an all-digit
 * text, contradicts `DESTINATARIO IS NULL`), so Forms shows no rows. */
async function formGrupoWhere(q: Q, d: GrupoDoc): Promise<string | null> {
  if (MODELOS_LOTE.includes(d.MODELO_ID)) {
    const lote = d.LOTE_ID === null ? '(LOTE_ID IS NULL)' : `(LOTE_ID = ${d.LOTE_ID})`;
    let min = '';
    let max = '';
    if (d.LOTE_ORDEM === null) max = ' and (LOTE_ORDEM IS NULL)';
    else {
      const b = { m: d.MODELO_ID, ordem: d.LOTE_ORDEM, lote: d.LOTE_ID };
      const [lo] = await q(
        `SELECT MAX(LOTE_ORDEM) AS V FROM SVR_DOCUMENTOS WHERE MODELO_ID = ${DECODE_PAR} AND LOTE_ORDEM <= :ordem AND NVL(LOTE_ID,-1) = NVL(:lote,-1)`,
        b,
      );
      if (lo?.['V'] != null) min = ` and (LOTE_ORDEM >= ${Number(lo['V'])})`;
      const [hi] = await q(
        `SELECT MIN(LOTE_ORDEM) AS V FROM SVR_DOCUMENTOS WHERE MODELO_ID = ${DECODE_PAR} AND LOTE_ORDEM > :ordem AND NVL(LOTE_ID,'-1') = NVL(:lote,-1)`,
        b,
      );
      if (hi?.['V'] != null) max = ` and (LOTE_ORDEM < ${Number(hi['V'])})`;
    }
    let modelo = '';
    if (d.LOTE_ID === null || d.LOTE_ORDEM === null) {
      if (d.DESTINATARIO !== null) return null;
      modelo = ` and DESTINATARIO IS NULL and (MODELO_ID IN (${PAR_LOTE[d.MODELO_ID]}))`;
    }
    return lote + min + max + modelo;
  }
  const [p] = await q('select documento_id AS V from svr_anexos_documento where anexodoc_id = :id', { id: d.ID });
  const parent = p ? Number(p['V']) : d.ID;
  const anexos = await q('select anexodoc_id AS V from svr_anexos_documento where documento_id = :p', { p: parent });
  return `id in (${[parent, ...anexos.map((a) => Number(a['V']))].join(',')})`;
}

/** Tab blocks (BR-DOC-24, BR-DOC-30, BR-DOC-31); dates as the API sends them. */
const TAB_SQL: Record<string, string> = {
  parametros:
    "SELECT NOME, VALOR, N_PARAMETRO FROM SVR_PARAMETROS_DOC_NOME_VW WHERE DOCUMENTO_ID = :id AND NOME NOT IN ('_USER','P_ID') ORDER BY N_PARAMETRO",
  comentarios: `SELECT COMENTARIO_ID, ${iso('DATA')}, USER_ID, COMENTARIO FROM SVR_DOCUMENTO_COMENTARIOS WHERE DOCUMENTO_ID = :id ORDER BY COMENTARIO_ID`,
  anexos: 'SELECT ANEXODOC_ID, TIPO_ANEXO_RF FROM SVR_ANEXOS_DOCUMENTO WHERE DOCUMENTO_ID = :id ORDER BY ANEXODOC_ID',
  fila: `SELECT ID, TIPO_QUEUE_RF, ${iso('DATA_PEDIDO')}, CRIADO_POR, ${iso('DATA_EXECUCAO')}, ${iso('DATA_FINALIZACAO')}, ESTADO, IMPRESSORA_ID, RESULTADO, DOCUMENTO_ID FROM SVR_QUEUE WHERE DOCUMENTO_ID = :id ORDER BY ID, DATA_PEDIDO, TIPO_QUEUE_RF`,
  erros: `SELECT ID, ${iso('DATA_ERRO')}, DESCRICAO FROM ERR_ERROS_SIID WHERE DOCUMENTO_ID = :id ORDER BY ID`,
};

/** SVR_QUEUE POST-QUERY (BR-DOC-24). No row: the trigger has no handler, Forms raised ORA-01403 and
 * IMPRESSORA stayed empty. */
async function formFilaImpressora(q: Q, r: Row): Promise<string | null> {
  if (!['IMPRESSAO', 'COPIA', '2.VIA'].includes(String(r['TIPO_QUEUE_RF']))) return null;
  const found =
    r['IMPRESSORA_ID'] !== null
      ? await q("select impr.descricao||' - '||impr.endereco AS V from svr_impressoras impr where impr.id = :i", {
          i: r['IMPRESSORA_ID'],
        })
      : await q(
          "select impr.descricao||' - '||impr.endereco AS V from svr_documentos doc, svr_impressoras impr where impr.id = doc.impressora_id and doc.id = :d",
          { d: r['DOCUMENTO_ID'] },
        );
  return (found[0]?.['V'] as string | undefined) ?? null;
}

/** DETALHES_DOCUMENTO (BR-DOC-31); USER loses the extended columns (DECISIONS D-08, SEC-004). */
const DETALHE_ADM = [
  'ESTADO', 'ID', 'MODELO_ID', 'REPORT_ID', 'AMBIENTE_ID', 'IMPRESSORA_ID', 'DESTINATARIO', 'MORADA',
  'CODIGO_POSTAL', 'PAIS', 'LOTE_ID', 'TIPO_OUTPUT', 'NOME_OUTPUT', 'N_REFERENCIA', 'N_IMPRESSOES',
  'N_ANEXOS', 'N_COPIAS', 'N_CAPAS', 'ULTIMA_VIA_POR', 'N_VIAS', 'EXECUTADO_POR', 'DATA_EXECUCAO',
  'IMPRESSO_POR', 'DATA_IMPRESSAO', 'CRIADO_POR', 'DATA_PEDIDO', 'LOTE_ORDEM', ...seq('ATRIBUTO', 1, 25),
  'VERSAO', 'DISPONIBILIDADE', 'TAMANHO_BYTES', 'EDOC_ID', 'ARQ_ID', 'REGISTO_EDOC', 'REGISTO_ARQUIVO',
  'DATA_ARQUIVO', ...seq('ATRIB_ARQ_', 1, 20),
];
const DETALHE_USER_EXCLUI = [
  ...seq('ATRIBUTO', 5, 8), ...seq('ATRIBUTO', 10, 25), ...seq('ATRIB_ARQ_', 1, 20),
  'ARQ_ID', 'EDOC_ID', 'REGISTO_ARQUIVO', 'REGISTO_EDOC', 'DATA_ARQUIVO',
];
const DATE_COLS = new Set(['DATA_EXECUCAO', 'DATA_IMPRESSAO', 'DATA_PEDIDO', 'DATA_ARQUIVO']);
const DETALHE_SQL = `SELECT ${DETALHE_ADM.map((c) => (DATE_COLS.has(c) ? iso(c) : c)).join(', ')} FROM SVR_DOCUMENTOS_VW WHERE ID = :id`;

/** List columns, minus the two POST-QUERY ones (COR, COMENTARIO) that the test derives itself. */
const LIST_BASE = [
  'ID', 'DATA_PEDIDO', 'MODELO_ID', 'ESTADO', 'CRIADO_POR', 'N_REFERENCIA', 'DESTINATARIO',
  'FATURACAO_ELECTRONICA', 'LOTE_ID', 'LOTE_ORDEM', 'REPORT_ID', 'DISPONIBILIDADE', 'ATRIBUTO9',
];
const listRowsSql = (ids: number[]) =>
  `SELECT ${LIST_BASE.map((c) => (DATE_COLS.has(c) ? iso(c) : c)).join(', ')},
     (SELECT COUNT(*) FROM SVR_DOCUMENTO_COMENTARIOS C WHERE C.DOCUMENTO_ID = V.ID) AS N_COMENTARIOS
   FROM SVR_DOCUMENTOS_VW V WHERE ID IN (${ids.map(Number).join(',')})`;
/** SVR_DOCUMENTOS POST-QUERY (BR-DOC-02). */
const formCor = (r: Row) =>
  r['DISPONIBILIDADE'] === 'OFF' ? 'OFFLINE' : r['DISPONIBILIDADE'] === 'ANU' || r['ATRIBUTO9'] === 'A' ? 'ANULADO' : null;

/** CONVERTE_PARAM.OK (BR-DOC-26). */
const RECIBO_SQL = 'SELECT TO_CHAR(NMRECIBO) AS V FROM MRECIBO WHERE NMRECINUE = :v';
const PESSOA_SQL = 'SELECT TO_CHAR(CDPERSON) AS V FROM MPERSONA WHERE CDIDEPER = :v';

const one = async (q: Q, sql: string, binds: Record<string, unknown> = {}) => (await q(sql, binds))[0];
const idOf = async (q: Q, sql: string, what: string) => {
  const v = (await one(q, sql))?.['V'];
  if (v == null) throw new Error(`fixture missing in the TEST schema: ${what}`);
  return Number(v);
};

/** Read-only fixture lookups. Each throws (test fails) when the schema has no such row. */
const fixtures = {
  maxId: (q: Q) => idOf(q, 'SELECT MAX(ID) AS V FROM SVR_DOCUMENTOS', 'any document'),
  /** Optional: the TEST schema has no DISPONIVEL_RF = 'OFF' row (2026-09-30: null, ANU, EDC, ERR, ONL). */
  offline: async (q: Q) =>
    (await one(q, "SELECT ID AS V FROM SVR_DOCUMENTOS WHERE DISPONIVEL_RF = 'OFF' AND ROWNUM = 1"))?.['V'] as number | undefined,
  anuladoDisp: (q: Q) => idOf(q, "SELECT ID AS V FROM SVR_DOCUMENTOS WHERE DISPONIVEL_RF = 'ANU' AND ROWNUM = 1", 'DISPONIVEL_RF = ANU'),
  anuladoAtr9: (q: Q) =>
    idOf(q, "SELECT ID AS V FROM SVR_DOCUMENTOS WHERE ATRIBUTO9 = 'A' AND NVL(DISPONIVEL_RF,'ONLINE') NOT IN ('OFF','ANU') AND ROWNUM = 1", 'ATRIBUTO9 = A'),
  comentado: (q: Q) => idOf(q, 'SELECT MAX(DOCUMENTO_ID) AS V FROM SVR_DOCUMENTO_COMENTARIOS', 'a document with comments'),
  anexo: (q: Q) => idOf(q, 'SELECT MAX(ANEXODOC_ID) AS V FROM SVR_ANEXOS_DOCUMENTO', 'an attachment'),
  comAnexos: (q: Q) => idOf(q, 'SELECT MAX(DOCUMENTO_ID) AS V FROM SVR_ANEXOS_DOCUMENTO', 'a document with attachments'),
  comErros: (q: Q) => idOf(q, 'SELECT MAX(DOCUMENTO_ID) AS V FROM ERR_ERROS_SIID', 'a document with ERR_ERROS_SIID rows'),
  filaComImpressora: (q: Q) =>
    idOf(q, "SELECT MAX(DOCUMENTO_ID) AS V FROM SVR_QUEUE WHERE TIPO_QUEUE_RF IN ('IMPRESSAO','COPIA','2.VIA') AND IMPRESSORA_ID IS NOT NULL", 'a print queue row with IMPRESSORA_ID'),
  filaSemImpressora: (q: Q) =>
    idOf(q, "SELECT MAX(DOCUMENTO_ID) AS V FROM SVR_QUEUE WHERE TIPO_QUEUE_RF IN ('IMPRESSAO','COPIA','2.VIA') AND IMPRESSORA_ID IS NULL", 'a print queue row without IMPRESSORA_ID'),
  grupoDoc: async (q: Q, id: number) => {
    const r = await one(q, `SELECT ${GRUPO_DOC_COLS} FROM SVR_DOCUMENTOS WHERE ID = :id`, { id });
    if (!r) throw new Error(`fixture missing: document ${id}`);
    return r as unknown as GrupoDoc;
  },
  /** An R3.D25 inside a lote whose D1.A7 orders bound it on both sides, and that lote's first D1.A7. */
  grupoLote: async (q: Q): Promise<GrupoDoc[]> => {
    const lote = await idOf(
      q,
      "SELECT MAX(LOTE_ID) AS V FROM SVR_DOCUMENTOS WHERE MODELO_ID = 'D1.A7' AND LOTE_ORDEM > 0",
      'a lote with two D1.A7 documents',
    );
    const rows = (await q(
      `SELECT ${GRUPO_DOC_COLS} FROM SVR_DOCUMENTOS WHERE LOTE_ID = :lote AND MODELO_ID IN ('R3.D25','D1.A7') AND LOTE_ORDEM IS NOT NULL ORDER BY LOTE_ORDEM, ID`,
      { lote },
    )) as unknown as GrupoDoc[];
    const a7 = rows.filter((r) => r.MODELO_ID === 'D1.A7');
    const d25 = rows.find((r) => r.MODELO_ID === 'R3.D25' && r.LOTE_ORDEM! > a7[0]!.LOTE_ORDEM!);
    if (!d25) throw new Error(`fixture missing: an R3.D25 after the first D1.A7 in lote ${lote}`);
    return [d25, a7[0]!];
  },
  grupoLoteNulo: async (q: Q, comDestinatario: boolean) =>
    (await one(
      q,
      `SELECT ${GRUPO_DOC_COLS} FROM SVR_DOCUMENTOS WHERE MODELO_ID IN (${MODELOS_LOTE.map((m) => `'${m}'`).join(',')})
       AND (LOTE_ID IS NULL OR LOTE_ORDEM IS NULL) AND DESTINATARIO IS ${comDestinatario ? 'NOT ' : ''}NULL AND ROWNUM = 1`,
    )) as unknown as GrupoDoc | undefined,
  /** The newest document with two or more parameters; long all-digit values first (selective). */
  parametros: async (q: Q) => {
    const id = await idOf(q, 'SELECT MAX(ID) AS V FROM SVR_DOCUMENTOS', 'any document');
    const rows = await q(
      `SELECT NOME, VALOR, MODELO_ID FROM SVR_PARAMETROS_DOC_NOME_VW
       WHERE DOCUMENTO_ID = :id AND NOME NOT IN ('_USER','P_ID') AND VALOR IS NOT NULL
       ORDER BY CASE WHEN LENGTH(VALOR) >= 6 AND TRANSLATE(VALOR, 'x0123456789', 'x') IS NULL THEN 0 ELSE 1 END, LENGTH(VALOR) DESC, N_PARAMETRO`,
      { id },
    );
    if (rows.length < 2) throw new Error(`fixture missing: document ${id} has fewer than two parameters`);
    const p = rows.map((r) => ({ nome: String(r['NOME']), valor: String(r['VALOR']) }));
    const curto = p[p.length - 1]!;
    const outro = await one(
      q,
      'SELECT VALOR AS V FROM SVR_PARAMETROS_DOC_NOME_VW WHERE NOME = :n AND VALOR != :v AND DOCUMENTO_ID BETWEEN :id - 50000 AND :id AND ROWNUM = 1',
      { n: curto.nome, v: curto.valor, id },
    );
    const letras = p.find((r) => r.valor.toLowerCase() !== r.valor);
    return {
      id,
      modelo: String(rows[0]!['MODELO_ID']),
      forte: p[0]!,
      curto,
      curtoOutroValor: outro ? String(outro['V']) : undefined,
      letras,
    };
  },
  recibo: async (q: Q) => {
    for (const r of await q('SELECT TO_CHAR(NMRECINUE) AS V FROM MRECIBO WHERE NMRECINUE IS NOT NULL AND ROWNUM <= 50')) {
      const v = String(r['V']);
      const found = await q(RECIBO_SQL, { v });
      if (found.length === 1) return { v, valor: String(found[0]!['V']) };
    }
    throw new Error('fixture missing: an MRECIBO.NMRECINUE held by exactly one row');
  },
  reciboDuplicado: async (q: Q) =>
    (await one(q, 'SELECT TO_CHAR(NMRECINUE) AS V FROM MRECIBO WHERE NMRECINUE IS NOT NULL GROUP BY NMRECINUE HAVING COUNT(*) > 1 FETCH FIRST 1 ROWS ONLY'))?.[
      'V'
    ] as string | undefined,
  reciboInexistente: async (q: Q) => String((await one(q, 'SELECT TO_CHAR(NVL(MAX(NMRECINUE), 0) + 1) AS V FROM MRECIBO'))!['V']),
  pessoa: async (q: Q) => {
    for (const r of await q('SELECT CDIDEPER AS V FROM MPERSONA WHERE ROWNUM <= 50')) {
      const v = String(r['V']);
      const found = await q(PESSOA_SQL, { v });
      if (found.length === 1) return { v, valor: String(found[0]!['V']) };
    }
    throw new Error('fixture missing: an MPERSONA.CDIDEPER held by exactly one row');
  },
};

/* ============================ legacy form SQL + fixture lookups (end) ============================ */

interface Envelope {
  rows: Row[];
  total: number;
  totalCapped: boolean;
  page: number;
  size: number;
}

describe.skipIf(!env['DB_CONNECT_STRING'])('documentos — TEST schema (read-only, parity with FD_GESTAO_SIID)', { timeout: 60_000 }, () => {
  let realPool: oracledb.Pool;
  let pool: DbPool;
  let app: FastifyInstance;

  const direct: Q = async (sql, binds = {}) => {
    const conn = await pool.getConnection();
    try {
      return (await conn.execute<Row>(sql, binds as oracledb.BindParameters)).rows ?? [];
    } finally {
      await conn.close();
    }
  };
  const get = (url: string) => app.inject({ url });
  const list = async (url: string): Promise<Envelope> => {
    const r = await get(url);
    expect(r.statusCode, `${url} → ${r.body.slice(0, 300)}`).toBe(200);
    return r.json() as Envelope;
  };
  const idsOf = (rows: Row[]) => rows.map((r) => Number(r['ID']));
  const ids = async (url: string) => idsOf((await list(url)).rows);
  const formIds = async (where: string | null, order: string, n: number, binds: Record<string, unknown> = {}) =>
    idsOf(await direct(formIdsSql(where, order, n), binds));
  const formCount = async (where: string | null, binds: Record<string, unknown> = {}) =>
    Number((await direct(formCountSql(where), binds))[0]!['N']);
  const expectError = async (url: string, status: number, code: string) => {
    const r = await get(url);
    expect(r.statusCode, `${url} → ${r.body.slice(0, 300)}`).toBe(status);
    expect(r.json()).toMatchObject({ code });
  };
  /** API page (size n, sort ID:desc unless the url says otherwise) + total == the form query. */
  const expectSameAsForm = async (url: string, where: string | null, binds: Record<string, unknown> = {}, n = 500) => {
    const api = await list(url);
    const count = await formCount(where, binds);
    expect(api.total, `${url} total`).toBe(Math.min(count, CAP));
    expect(api.totalCapped, `${url} totalCapped`).toBe(count > CAP);
    expect(idsOf(api.rows), `${url} ids`).toEqual(await formIds(where, 'ID DESC', n, binds));
    return api;
  };

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
    app = Fastify();
    registerErrorHandler(app);
    app.decorateRequest('session', null as never);
    app.addHook('onRequest', async (req) => {
      (req as { session: unknown }).session = { user: { username: 'CONTRACT_TEST', role } };
    });
    registerDocumentosRoutes(app, {
      repo: oracleDocumentosRepo(pool, 120_000),
      fileServer: { baseUrl: 'http://127.0.0.1:9/pdf/T', timeoutMs: 1000 },
    });
    await app.ready();
  }, 60_000);

  afterEach(() => {
    role = 'ADM';
  });

  afterAll(async () => {
    await app?.close();
    await realPool?.close(0);
  }, 60_000);

  describe('list', () => {
    it('BR-DOC-01 default list: envelope, ID DESC, page 3 of size 20 equals the form query at OFFSET 40', async () => {
      const first = await list('/api/documentos');
      expect(first).toMatchObject({ page: 1, size: 50 });
      expect(typeof first.total).toBe('number');
      expect(typeof first.totalCapped).toBe('boolean');
      expect(idsOf(first.rows)).toEqual(await formIds(null, 'ID DESC', 50));
      const p3 = await list('/api/documentos?page=3&size=20');
      expect(p3).toMatchObject({ page: 3, size: 20 });
      expect(idsOf(p3.rows)).toEqual(idsOf(await direct(formIdsSql(null, 'ID DESC', 20, 40))));
    });

    it('size above 500 is clamped to 500', async () => {
      const r = await list('/api/documentos?size=1000');
      expect(r.size).toBe(500);
      expect(r.rows.length).toBeLessThanOrEqual(500);
    });

    it('BR-DOC-02 rows carry the list columns; COR and COMENTARIO follow POST-QUERY (first page + ANU, ATRIBUTO9, commented and, if any, OFF documents)', async () => {
      const page = (await list('/api/documentos?size=50')).rows;
      const offline = await fixtures.offline(direct);
      const especiais = [
        ...(offline === undefined ? [] : [offline]),
        await fixtures.anuladoDisp(direct),
        await fixtures.anuladoAtr9(direct),
        await fixtures.comentado(direct),
      ];
      const extra = (await list(`/api/documentos?${especiais.map((id) => `f[ID][in]=${id}`).join('&')}&size=50`)).rows;
      expect(idsOf(extra).sort()).toEqual([...especiais].sort());
      const apiRows = [...page, ...extra];
      const expected = new Map(
        (await direct(listRowsSql(idsOf(apiRows)))).map((r) => {
          const { N_COMENTARIOS, ...base } = r;
          return [Number(r['ID']), { ...base, COR: formCor(r), COMENTARIO: Number(N_COMENTARIOS) > 0 ? '***' : null }];
        }),
      );
      for (const row of apiRows) expect(row, `document ${String(row['ID'])}`).toEqual(expected.get(Number(row['ID'])));
      expect(extra.map((r) => r['COR'])).toEqual(expect.arrayContaining(offline === undefined ? ['ANULADO'] : ['OFFLINE', 'ANULADO']));
      expect(extra.map((r) => r['COMENTARIO'])).toContain('***');
      for (const row of page)
        if (row['DATA_PEDIDO'] !== null) expect(row['DATA_PEDIDO']).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/);
    });

    it('unknown preset, sort key or filter column → 400 VALIDACAO', async () => {
      await expectError('/api/documentos?preset=nao-existe', 400, 'VALIDACAO');
      await expectError('/api/documentos?sort=NAO_EXISTE:asc', 400, 'VALIDACAO');
      await expectError('/api/documentos?f[NAO_EXISTE]=1', 400, 'VALIDACAO');
    });
  });

  describe('BR-DOC-04 presets: total and first 200 ids equal the form WHERE (ID DESC)', () => {
    it.each(Object.keys(PRESET_WHERE))(
      'preset %s',
      async (preset) => {
        const where = await formPresetWhere(direct, preset);
        const api = await list(`/api/documentos?preset=${preset}&size=200`);
        const count = await formCount(where);
        expect(api.total).toBe(Math.min(count, CAP));
        expect(api.totalCapped).toBe(count > CAP);
        expect(idsOf(api.rows)).toEqual(await formIds(where, 'ID DESC', 200));
      },
      600_000, // em-erro: about 1 min on the direct side; the API side may be slower
    );
  });

  describe('BR-DOC-05 sorts (preset todos): first 100 ids equal the form ORDER BY + ID ASC tiebreak', () => {
    it.each(SORT_ORDER)(
      'sort=%s',
      async (sort, order) => {
        const url = `/api/documentos?preset=todos&sort=${sort}&size=100`;
        let expected: number[];
        try {
          expected = await formIds(null, order, 100);
        } catch (e) {
          // REFERENCIA only: the form's TO_NUMBER raises ORA-01722 when an N_REFERENCIA keeps a
          // non-digit after TRANSLATE. Forms then shows an error and no rows; the API must not
          // return a list either.
          if (!sort.startsWith('REFERENCIA') || !/ORA-01722/.test(String(e))) throw e;
          const r = await get(url);
          expect(r.statusCode, r.body.slice(0, 300)).toBeGreaterThanOrEqual(400);
          return;
        }
        expect(await ids(url)).toEqual(expected);
      },
      300_000,
    );
  });

  describe('QBE filters (BR-DOC-06, BR-DOC-07)', () => {
    it('preset em-branco + f[MODELO_ID]=<model of its first row> equals the preset WHERE AND MODELO_ID = :m', async () => {
      const base = PRESET_WHERE['em-branco']!;
      const [first] = await direct(formIdsSql(base, 'ID DESC', 1));
      expect(first, 'the em-branco preset is empty in the TEST schema: no model to filter on').toBeDefined();
      const [row] = await direct('SELECT MODELO_ID FROM SVR_DOCUMENTOS WHERE ID = :id', { id: first!['ID'] });
      const m = String(row!['MODELO_ID']);
      await expectSameAsForm(
        `/api/documentos?preset=em-branco&f[MODELO_ID]=${encodeURIComponent(m)}&sort=ID:desc&size=100`,
        `(${base}) AND MODELO_ID = :m`,
        { m },
        100,
      );
    }, 300_000);

    it('preset todos + f[MODELO_ID]=<model of the newest document> equals MODELO_ID = :m', async () => {
      const id = await fixtures.maxId(direct);
      const m = String((await direct('SELECT MODELO_ID FROM SVR_DOCUMENTOS WHERE ID = :id', { id }))[0]!['MODELO_ID']);
      await expectSameAsForm(`/api/documentos?preset=todos&f[MODELO_ID]=${encodeURIComponent(m)}&size=100`, 'MODELO_ID = :m', { m }, 100);
    }, 120_000);

    it('f[DESTINATARIO][null]=1 equals DESTINATARIO IS NULL (typing "IS NULL" in the form)', async () => {
      await expectSameAsForm('/api/documentos?f[DESTINATARIO][null]=1&size=100', 'DESTINATARIO IS NULL', {}, 100);
    }, 120_000);
  });

  describe('BR-DOC-27 parameter search', () => {
    // Timeouts cover the API side: a search over SVR_PARAMETROS_DOC_NOME_VW can take a minute or more.
    const T = 300_000;
    let fx: Awaited<ReturnType<typeof fixtures.parametros>> | undefined;
    const fixture = async () => (fx ??= await fixtures.parametros(direct));
    type P = { nome: string; valor: string };
    const url = (ps: P[], extra = '') =>
      `/api/documentos?${ps.map((p) => `param[${encodeURIComponent(p.nome)}]=${encodeURIComponent(p.valor)}`).join('&')}${extra}&sort=ID:desc&size=500`;

    it('one name/value', async () => {
      const f = await fixture();
      const api = await expectSameAsForm(url([f.forte]), await formParamWhere(direct, [f.forte]));
      expect(idsOf(api.rows)).toContain(f.id);
    }, T);

    it('two names intersect', async () => {
      const f = await fixture();
      const api = await expectSameAsForm(url([f.forte, f.curto]), await formParamWhere(direct, [f.forte, f.curto]));
      expect(idsOf(api.rows)).toContain(f.id);
    }, T);

    it('paramModelo restricts the first row by MODELO_ID LIKE', async () => {
      const f = await fixture();
      await expectSameAsForm(
        url([f.forte], `&paramModelo=${encodeURIComponent(f.modelo)}`),
        await formParamWhere(direct, [f.forte], f.modelo),
      );
    }, T);

    it('the value is a LIKE pattern (% wildcard)', async () => {
      const f = await fixture();
      const p = { nome: f.forte.nome, valor: `${f.forte.valor.slice(0, -1)}%` };
      await expectSameAsForm(url([p]), await formParamWhere(direct, [p]));
    }, T);

    it('LIKE is case-sensitive, as in the form (lower-cased value)', async () => {
      const f = await fixture();
      expect(f.letras, `document ${f.id} has no parameter value with upper-case letters`).toBeDefined();
      const p = { nome: f.letras!.nome, valor: f.letras!.valor.toLowerCase() };
      await expectSameAsForm(url([p]), await formParamWhere(direct, [p]));
    }, T);

    it('a pair that intersects to nothing → total 0', async () => {
      const f = await fixture();
      expect(f.curtoOutroValor, `no other value of ${f.curto.nome} near document ${f.id}`).toBeDefined();
      const other = { nome: f.curto.nome, valor: f.curtoOutroValor! };
      expect(await formParamWhere(direct, [f.forte, other]), 'fixture: the form search is not empty').toBe('1 = 0');
      expect(await list(url([f.forte, other]))).toMatchObject({ total: 0, totalCapped: false, rows: [] });
    }, T);
  });

  describe('BR-DOC-28 Mostrar Grupo: grupo=<id> equals the DEFAULT_WHERE Forms builds from the row', () => {
    const check = async (d: GrupoDoc) => {
      const where = await formGrupoWhere(direct, d);
      expect(where, `document ${d.ID}: the form query errors, not a comparable case`).not.toBeNull();
      await expectSameAsForm(`/api/documentos?grupo=${d.ID}&sort=ID:desc&size=500`, where);
    };

    it('lote branch, LOTE_ID and LOTE_ORDEM set (R3.D25 bounded by D1.A7 orders, and the D1.A7 itself)', async () => {
      for (const d of await fixtures.grupoLote(direct)) await check(d);
    }, 120_000);

    it('lote branch, LOTE_ID or LOTE_ORDEM null, no DESTINATARIO', async () => {
      const d = await fixtures.grupoLoteNulo(direct, false);
      expect(d, 'fixture missing: a lote-model document with null LOTE_ID/LOTE_ORDEM and no DESTINATARIO').toBeDefined();
      await check(d!);
    }, 120_000);

    it('lote branch, null LOTE_ID/LOTE_ORDEM with DESTINATARIO: Forms query fails → API returns an empty list', async () => {
      const d = await fixtures.grupoLoteNulo(direct, true);
      if (!d) return; // optional case: no such row in the TEST schema
      expect(await formGrupoWhere(direct, d)).toBeNull();
      expect(await list(`/api/documentos?grupo=${d.ID}&sort=ID:desc&size=500`)).toMatchObject({ total: 0, rows: [] });
    }, 120_000);

    it('attachment branch: an attachment, its parent, and a document outside the lote models', async () => {
      const anexo = await fixtures.anexo(direct);
      const parent = await fixtures.comAnexos(direct);
      const newest = await fixtures.maxId(direct);
      for (const id of [anexo, parent, newest]) {
        const d = await fixtures.grupoDoc(direct, id);
        if (MODELOS_LOTE.includes(d.MODELO_ID)) throw new Error(`fixture: document ${id} has lote model ${d.MODELO_ID}`);
        await check(d);
      }
      const where = (await formGrupoWhere(direct, await fixtures.grupoDoc(direct, anexo)))!;
      expect(where.split(',').length, `attachment ${anexo}: parent + attachments`).toBeGreaterThan(1);
    }, 120_000);
  });

  describe('BR-DOC-31 detail', () => {
    const detalheEsperado = async (id: number) => {
      const [row] = await direct(DETALHE_SQL, { id });
      expect(row, `document ${id} not in SVR_DOCUMENTOS_VW`).toBeDefined();
      return row!;
    };

    it('ADM: every detail column equals a direct SELECT (newest and a commented document)', async () => {
      for (const id of [await fixtures.maxId(direct), await fixtures.comentado(direct)]) {
        const r = await get(`/api/documentos/${id}`);
        expect(r.statusCode, r.body.slice(0, 300)).toBe(200);
        expect(r.json()).toEqual(await detalheEsperado(id));
      }
    });

    it('USER (D-08, BR-DOC-35): same values minus the extended columns, whose keys are absent', async () => {
      const id = await fixtures.comentado(direct);
      const full = await detalheEsperado(id);
      role = 'USER';
      const r = await get(`/api/documentos/${id}`);
      expect(r.statusCode, r.body.slice(0, 300)).toBe(200);
      const body = r.json() as Row;
      for (const c of DETALHE_USER_EXCLUI) expect(body).not.toHaveProperty(c);
      const expected = Object.fromEntries(Object.entries(full).filter(([k]) => !DETALHE_USER_EXCLUI.includes(k)));
      expect(body).toEqual(expected);
    });

    it('unknown id → 404 NAO_ENCONTRADO; invalid id → 400 VALIDACAO', async () => {
      const id = (await fixtures.maxId(direct)) + 1000;
      await expectError(`/api/documentos/${id}`, 404, 'NAO_ENCONTRADO');
      await expectError('/api/documentos/-1', 400, 'VALIDACAO');
      await expectError('/api/documentos/abc', 400, 'VALIDACAO');
    });
  });

  describe('tabs: rows equal the form block query for a document that has rows', () => {
    const tab = async (id: number, name: string) => {
      const r = await get(`/api/documentos/${id}/${name}`);
      expect(r.statusCode, r.body.slice(0, 300)).toBe(200);
      return (r.json() as { rows: Row[] }).rows;
    };
    const expectTab = async (id: number, name: string) => {
      const expected = await direct(TAB_SQL[name]!, { id });
      expect(expected.length, `fixture: document ${id} has no ${name} rows`).toBeGreaterThan(0);
      expect(await tab(id, name)).toEqual(expected);
    };

    it('BR-DOC-31 parametros (without _USER and P_ID)', async () => {
      const id = await fixtures.maxId(direct);
      await expectTab(id, 'parametros');
      expect((await tab(id, 'parametros')).map((r) => r['NOME'])).not.toContain('_USER');
    });

    it('BR-DOC-30 comentarios', async () => expectTab(await fixtures.comentado(direct), 'comentarios'));

    it('BR-DOC-28 anexos', async () => expectTab(await fixtures.comAnexos(direct), 'anexos'));

    it('BR-DOC-31 erros', async () => expectTab(await fixtures.comErros(direct), 'erros'));

    it('BR-DOC-24 fila: IMPRESSORA from the queue printer, else the document printer (POST-QUERY)', async () => {
      for (const id of [await fixtures.filaComImpressora(direct), await fixtures.filaSemImpressora(direct)]) {
        const raw = await direct(TAB_SQL['fila']!, { id });
        expect(raw.length, `fixture: document ${id} has no queue rows`).toBeGreaterThan(0);
        const expected: Row[] = [];
        for (const r of raw) {
          const row: Row = { ...r, IMPRESSORA: await formFilaImpressora(direct, r) };
          delete row['DOCUMENTO_ID'];
          expected.push(row);
        }
        expect(await tab(id, 'fila'), `document ${id}`).toEqual(expected);
      }
    });
  });

  describe('BR-DOC-35 / D-08 USER sorting (Spool only)', () => {
    it('USER sort=MODELO_ID:asc → 400 VALIDACAO', async () => {
      role = 'USER';
      await expectError('/api/documentos?sort=MODELO_ID:asc', 400, 'VALIDACAO');
    });

    it('USER sort=ID:asc → 200, ids equal ORDER BY ID ASC', async () => {
      role = 'USER';
      expect(await ids('/api/documentos?sort=ID:asc&size=50')).toEqual(await formIds(null, 'ID ASC', 50));
    }, 300_000); // ID ASC over the whole view: about 40 s on the direct side
  });

  describe('BR-DOC-26 conversions (CONVERTE_PARAM)', () => {
    const valor = async (url: string) => {
      const r = await get(url);
      expect(r.statusCode, r.body.slice(0, 300)).toBe(200);
      return r.json() as { valor: string | null };
    };

    it('recibo: NMRECINUE held by one row → its NMRECIBO; duplicated or unknown → null', async () => {
      const f = await fixtures.recibo(direct);
      expect(await valor(`/api/documentos/conversoes/recibo?nmrecinue=${f.v}`)).toEqual({ valor: f.valor });
      const inexistente = await fixtures.reciboInexistente(direct);
      expect(await valor(`/api/documentos/conversoes/recibo?nmrecinue=${inexistente}`)).toEqual({ valor: null });
      const dup = await fixtures.reciboDuplicado(direct);
      if (dup) expect(await valor(`/api/documentos/conversoes/recibo?nmrecinue=${dup}`)).toEqual({ valor: null });
    });

    it('pessoa: CDIDEPER held by one row → its CDPERSON; unknown → null', async () => {
      const f = await fixtures.pessoa(direct);
      expect(await valor(`/api/documentos/conversoes/pessoa?cdideper=${encodeURIComponent(f.v)}`)).toEqual({ valor: f.valor });
      const nada = 'ZZ_NAO_EXISTE_0000';
      expect(await direct(PESSOA_SQL, { v: nada }), 'fixture: the unknown CDIDEPER exists').toEqual([]);
      expect(await valor(`/api/documentos/conversoes/pessoa?cdideper=${nada}`)).toEqual({ valor: null });
    });
  });
});
