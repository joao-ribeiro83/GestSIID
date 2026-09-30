import oracledb from 'oracledb';
import {
  defineResource,
  DOCUMENTO_DETALHE,
  type ColumnDef,
  DOCUMENTO_DETALHE_DATAS,
  DOCUMENTO_DETALHE_SO_ADM,
  type ListQuery,
  type Role,
} from '@gestsiid/shared';
import { AppError, mapOracleError } from '../../db/errors.ts';
import { withConnection, type DbConnection, type DbPool, type SessionUser } from '../../db/oracle.ts';
import type { CrudCtx, Row } from '../../lib/crud.ts';
import { buildListQuery, buildWhere, dateSelect, selectList, type BuiltSql } from '../../lib/listQuery.ts';
import {
  contrapartida,
  documentosServer,
  grupoId,
  grupoMatch,
  grupoSql,
  paramWhere,
  planoGrupo,
  usaLote,
  type GrupoDoc,
  type GrupoLeitura,
} from '../../resources-server/documentos.ts';
import { likeRegex, memoryStore } from '../dev/memoryStore.ts';

/**
 * Read side of FD_GESTAO_SIID (Step 7.1). `oracleDocumentosRepo`: bind-only SELECTs over
 * SVR_DOCUMENTOS_VW and the detail tables, one pooled connection per call, nothing written
 * (no SVR_GESTAO_SIID_TMP, ARCHITECTURE §3). `memoryDocumentosRepo`: the same contract on seed
 * rows, for the dev server and the unit tests.
 */

export const TABS = ['parametros', 'comentarios', 'anexos', 'fila', 'erros'] as const;
export type Tab = (typeof TABS)[number];
export type Conversao = 'recibo' | 'pessoa';

export interface DocumentosRepo {
  list(q: ListQuery, ctx: CrudCtx): Promise<{ rows: Row[]; total: number }>;
  /** DETALHES_DOCUMENTO columns; USER gets the reduced list (D-08). */
  detalhe(id: number, role: Role, user: SessionUser): Promise<Row | undefined>;
  tab(tab: Tab, id: number, user: SessionUser): Promise<Row[]>;
  /** CONVERTE_PARAM: exactly one match, else null (the form swallowed the error). */
  conversao(tipo: Conversao, valor: string, user: SessionUser): Promise<string | null>;
  /** `DISPONIBILIDADE` of the document; undefined = no such document. */
  disponibilidade(id: number, user: SessionUser): Promise<string | undefined>;
  /** Every id of the query (no paging, no sort): the `consulta` selection of the batch actions (§4.2). */
  ids(q: ListQuery, ctx: CrudCtx): Promise<number[]>;
}

export const colunasDetalhe = (role: Role) =>
  role === 'ADM' ? [...DOCUMENTO_DETALHE] : DOCUMENTO_DETALHE.filter((c) => !DOCUMENTO_DETALHE_SO_ADM.includes(c));

const NAO_ENCONTRADO = () => new AppError(404, 'NAO_ENCONTRADO', 'Registo não encontrado.');

// ── Oracle ───────────────────────────────────────────────────────────────────────────────────

const TAB_SQL: Record<Tab, string> = {
  // ARCHITECTURE §10.1: `_USER` and `P_ID` hidden; SVR_PARAMETROS_DOCUMENTO is not readable.
  parametros:
    "SELECT NOME, VALOR, N_PARAMETRO FROM SVR_PARAMETROS_DOC_NOME_VW WHERE DOCUMENTO_ID = :id AND NOME NOT IN ('_USER', 'P_ID') ORDER BY N_PARAMETRO",
  comentarios: `SELECT COMENTARIO_ID, ${dateSelect('DATA')} AS DATA, USER_ID, COMENTARIO FROM SVR_DOCUMENTO_COMENTARIOS WHERE DOCUMENTO_ID = :id ORDER BY COMENTARIO_ID`,
  // Step 7.4 (UI_SPEC Anexos): the attached document's Modelo / Estado / Data do pedido.
  anexos:
    `SELECT A.ANEXODOC_ID, A.TIPO_ANEXO_RF, V.MODELO_ID, V.ESTADO, ${dateSelect('V.DATA_PEDIDO')} AS DATA_PEDIDO ` +
    'FROM SVR_ANEXOS_DOCUMENTO A LEFT JOIN SVR_DOCUMENTOS_VW V ON V.ID = A.ANEXODOC_ID WHERE A.DOCUMENTO_ID = :id ORDER BY A.ANEXODOC_ID',
  // Block SVR_QUEUE (ORDER BY id, data_pedido, tipo_queue_rf) + POST-QUERY printer text (BR-DOC-24):
  // the queue row's printer, else the document's.
  fila:
    `SELECT Q.ID, Q.TIPO_QUEUE_RF, ${dateSelect('Q.DATA_PEDIDO')} AS DATA_PEDIDO, Q.CRIADO_POR, ` +
    `${dateSelect('Q.DATA_EXECUCAO')} AS DATA_EXECUCAO, ${dateSelect('Q.DATA_FINALIZACAO')} AS DATA_FINALIZACAO, ` +
    "Q.ESTADO, Q.IMPRESSORA_ID, CASE WHEN Q.TIPO_QUEUE_RF IN ('IMPRESSAO', 'COPIA', '2.VIA') THEN " +
    "(SELECT I.DESCRICAO || ' - ' || I.ENDERECO FROM SVR_IMPRESSORAS I WHERE I.ID = NVL(Q.IMPRESSORA_ID, " +
    '(SELECT D.IMPRESSORA_ID FROM SVR_DOCUMENTOS D WHERE D.ID = Q.DOCUMENTO_ID))) END AS IMPRESSORA, Q.RESULTADO ' +
    'FROM SVR_QUEUE Q WHERE Q.DOCUMENTO_ID = :id ORDER BY Q.ID, Q.DATA_PEDIDO, Q.TIPO_QUEUE_RF',
  erros: `SELECT ID, ${dateSelect('DATA_ERRO')} AS DATA_ERRO, DESCRICAO FROM ERR_ERROS_SIID WHERE DOCUMENTO_ID = :id ORDER BY ID`,
};

const CONVERSAO_SQL: Record<Conversao, string> = {
  recibo: 'SELECT TO_CHAR(NMRECIBO) AS V FROM MRECIBO WHERE NMRECINUE = :v FETCH FIRST 2 ROWS ONLY',
  pessoa: 'SELECT TO_CHAR(CDPERSON) AS V FROM MPERSONA WHERE CDIDEPER = :v FETCH FIRST 2 ROWS ONLY',
};

const detalheSql = (role: Role) =>
  `SELECT ${colunasDetalhe(role)
    .map((c) => (DOCUMENTO_DETALHE_DATAS.includes(c) ? `${dateSelect(c)} AS ${c}` : c))
    .join(', ')} FROM SVR_DOCUMENTOS_VW WHERE ID = :id`;

async function rows<T = Row>(conn: DbConnection, sql: string, binds: Record<string, unknown>): Promise<T[]> {
  return ((await conn.execute<T>(sql, binds as oracledb.BindParameters)).rows ?? []) as T[];
}

/** MOSTRAR_GRUPO reads: the document, then the D1 LOTE_ORDEM bounds or the attachment parent. */
async function leituraGrupo(conn: DbConnection, id: number): Promise<{ doc: GrupoDoc; leitura: GrupoLeitura }> {
  const [doc] = await rows<GrupoDoc>(
    conn,
    'SELECT ID, MODELO_ID, LOTE_ID, LOTE_ORDEM, DESTINATARIO FROM SVR_DOCUMENTOS WHERE ID = :id',
    { id },
  );
  if (!doc) throw NAO_ENCONTRADO();
  const leitura: GrupoLeitura = { ids: [id], min: null, max: null };
  if (usaLote(doc.MODELO_ID)) {
    if (doc.LOTE_ORDEM !== null) {
      // The form's two SELECT … INTO, with NVL(:LOTE_ID,-1) folded into the bind.
      const b = { m: contrapartida(doc.MODELO_ID ?? ''), o: doc.LOTE_ORDEM, l: doc.LOTE_ID ?? -1 };
      const cond = 'FROM SVR_DOCUMENTOS WHERE MODELO_ID = :m AND NVL(LOTE_ID,-1) = :l AND LOTE_ORDEM';
      leitura.min = (await rows<{ V: number | null }>(conn, `SELECT MAX(LOTE_ORDEM) AS V ${cond} <= :o`, b))[0]?.V ?? null;
      leitura.max = (await rows<{ V: number | null }>(conn, `SELECT MIN(LOTE_ORDEM) AS V ${cond} > :o`, b))[0]?.V ?? null;
    }
  } else {
    // ponytail: the form's SELECT INTO failed on several parents; the lowest one is taken here.
    const [pai] = await rows<{ DOCUMENTO_ID: number }>(
      conn,
      'SELECT DOCUMENTO_ID FROM SVR_ANEXOS_DOCUMENTO WHERE ANEXODOC_ID = :id ORDER BY DOCUMENTO_ID FETCH FIRST 1 ROW ONLY',
      { id },
    );
    const paiId = pai?.DOCUMENTO_ID ?? id;
    const anexos = await rows<{ ANEXODOC_ID: number }>(
      conn,
      'SELECT ANEXODOC_ID FROM SVR_ANEXOS_DOCUMENTO WHERE DOCUMENTO_ID = :id ORDER BY ANEXODOC_ID',
      { id: paiId },
    );
    leitura.ids = [paiId, ...anexos.map((a) => a.ANEXODOC_ID)];
  }
  return { doc, leitura };
}

/** `param` / `paramModelo` / `grupo` → the extra WHERE of the list, or none. */
async function extraWhere(conn: DbConnection, q: ListQuery): Promise<BuiltSql | undefined> {
  const parts: BuiltSql[] = [];
  if (q.params || q.paramModelo !== undefined) parts.push(paramWhere(q.params, q.paramModelo));
  if (q.grupo !== undefined) {
    const { doc, leitura } = await leituraGrupo(conn, grupoId(q.grupo));
    parts.push(grupoSql(planoGrupo(doc, leitura)));
  }
  if (parts.length === 0) return undefined;
  return { sql: parts.map((p) => p.sql).join(' AND '), binds: Object.assign({}, ...parts.map((p) => p.binds)) };
}

/**
 * Two-phase list. SVR_DOCUMENTOS_VW is slow per row: sorting or filtering the whole view took
 * 37-52 s on the TEST schema, and so did its count. When the WHERE and ORDER BY use no
 * view-computed column, the page ids and the count come from SVR_DOCUMENTOS (one view row per
 * document; the same columns), then the page rows from the view by id (0.2-1.7 s in all).
 * ESTADO and DISPONIBILIDADE exist only in the view: those queries read the view directly
 * (as slow as the form; a job for Step 10).
 * ponytail: a document whose queue rows all lack DATA_PEDIDO drops out of the view (0 in TEST);
 * it would be counted but skipped on its page.
 */
const SO_NA_VISTA = { presets: ['nao-executados', 'a-executar', 'execucao'], colunas: ['ESTADO', 'DISPONIBILIDADE'] };
const documentosBase = defineResource({
  ...documentosServer,
  source: 'SVR_DOCUMENTOS',
  columns: Object.fromEntries(
    Object.entries(documentosServer.columns as Record<string, ColumnDef>).filter(
      ([c, d]) => !d.expr && !SO_NA_VISTA.colunas.includes(c),
    ),
  ),
});
/** §4.2: a `consulta` selection above this is refused (SELECCAO_EXCESSIVA); the list count cap. */
export const MAX_SELECCAO = 10_000;
const precisaVista = (q: ListQuery) =>
  (q.preset !== undefined && SO_NA_VISTA.presets.includes(q.preset)) ||
  SO_NA_VISTA.colunas.some((c) => q.filters[c] || q.sort.some((s) => s.column === c));

export function oracleDocumentosRepo(pool: DbPool, callTimeoutMs: number): DocumentosRepo {
  const run = async <T>(user: SessionUser, action: string, fn: (conn: DbConnection) => Promise<T>) => {
    try {
      return await withConnection(pool, user, `documentos.${action}`, callTimeoutMs, fn);
    } catch (e) {
      throw e instanceof AppError ? e : mapOracleError(e);
    }
  };

  return {
    list: (q, ctx) =>
      run(ctx.user, 'list', async (conn) => {
        const extra = await extraWhere(conn, q);
        const opts = { role: ctx.user.role, extra };
        if (precisaVista(q)) {
          const { list, count } = buildListQuery(documentosServer, q, opts);
          const found = await rows(conn, list.sql, list.binds);
          const [n] = await rows<{ N: number }>(conn, count.sql, count.binds);
          return { rows: found, total: n?.N ?? 0 };
        }
        const { list, count } = buildListQuery(documentosBase, q, opts);
        const ids = (await rows<{ ID: number }>(conn, list.sql, list.binds)).map((r) => r.ID);
        const [n] = await rows<{ N: number }>(conn, count.sql, count.binds);
        if (ids.length === 0) return { rows: [], total: n?.N ?? 0 };
        // size ≤ 500, under Oracle's 1000-item IN limit.
        const byId = new Map<unknown, Row>(
          (
            await rows<Row>(
              conn,
              `SELECT ${selectList(documentosServer)} FROM SVR_DOCUMENTOS_VW WHERE ID IN (${ids.map((_, i) => `:i${i}`).join(', ')})`,
              Object.fromEntries(ids.map((id, i) => [`i${i}`, id])),
            )
          ).map((r) => [r['ID'], r]),
        );
        return { rows: ids.flatMap((id): Row[] => { const r = byId.get(id); return r ? [r] : []; }), total: n?.N ?? 0 };
      }),

    ids: (q, ctx) =>
      run(ctx.user, 'ids', async (conn) => {
        const extra = await extraWhere(conn, q);
        const resource = precisaVista(q) ? documentosServer : documentosBase;
        const where = buildWhere(resource, q, undefined, extra);
        // One row past the §4.2 cap is enough for the route to refuse the selection.
        const sql = `SELECT ID FROM ${resource.source}${where.sql ? ` WHERE ${where.sql}` : ''} FETCH FIRST ${MAX_SELECCAO + 1} ROWS ONLY`;
        return (await rows<{ ID: number }>(conn, sql, where.binds)).map((r) => r.ID);
      }),

    detalhe: (id, role, user) =>
      run(user, 'detalhe', async (conn) => (await rows(conn, detalheSql(role), { id }))[0]),

    tab: (tab, id, user) => run(user, tab, (conn) => rows(conn, TAB_SQL[tab], { id })),

    conversao: (tipo, valor, user) =>
      run(user, `conversao.${tipo}`, async (conn) => {
        const found = await rows<{ V: string | null }>(conn, CONVERSAO_SQL[tipo], { v: valor });
        return found.length === 1 ? (found[0]?.V ?? null) : null;
      }),

    disponibilidade: (id, user) =>
      run(user, 'pdf', async (conn) => {
        const [r] = await rows<{ DISPONIBILIDADE: string }>(
          conn,
          'SELECT DISPONIBILIDADE FROM SVR_DOCUMENTOS_VW WHERE ID = :id',
          { id },
        );
        return r?.DISPONIBILIDADE;
      }),
  };
}

// ── Memory (dev server, unit tests) ──────────────────────────────────────────────────────────

export interface DocumentosSeed {
  /** SVR_DOCUMENTOS_VW rows: every DETALHES_DOCUMENTO column plus FATURACAO_ELECTRONICA. */
  documentos: Row[];
  /** SVR_PARAMETROS_DOC_NOME_VW: DOCUMENTO_ID, NOME, VALOR, N_PARAMETRO, MODELO_ID. */
  parametros?: Row[];
  comentarios?: Row[];
  /** DOCUMENTO_ID, ANEXODOC_ID, TIPO_ANEXO_RF. */
  anexos?: Row[];
  /** SVR_QUEUE rows with the computed IMPRESSORA text. */
  fila?: Row[];
  erros?: Row[];
  recibos?: { NMRECINUE: number; NMRECIBO: number }[];
  pessoas?: { CDIDEPER: string; CDPERSON: number }[];
  /** Step 7.2 (operacoes/memoria.ts): DOC_MODELOS_DOCUMENT dispatch modes, valid printer ids,
   * ids for which PKG_SIID_UTIL.CAN_BE_UPLOADED_EDOC would return 1. */
  modelos?: { ID: string; MODO_EXPEDICAO_RF: string | null }[];
  impressorasValidas?: string[];
  edocOk?: number[];
}

const TAB_COLUNAS: Record<Tab, { cols: string[]; ordem: string }> = {
  parametros: { cols: ['NOME', 'VALOR', 'N_PARAMETRO'], ordem: 'N_PARAMETRO' },
  comentarios: { cols: ['COMENTARIO_ID', 'DATA', 'USER_ID', 'COMENTARIO'], ordem: 'COMENTARIO_ID' },
  anexos: { cols: ['ANEXODOC_ID', 'TIPO_ANEXO_RF', 'MODELO_ID', 'ESTADO', 'DATA_PEDIDO'], ordem: 'ANEXODOC_ID' },
  fila: {
    cols: ['ID', 'TIPO_QUEUE_RF', 'DATA_PEDIDO', 'CRIADO_POR', 'DATA_EXECUCAO', 'DATA_FINALIZACAO', 'ESTADO', 'IMPRESSORA_ID', 'IMPRESSORA', 'RESULTADO'],
    ordem: 'ID',
  },
  erros: { cols: ['ID', 'DATA_ERRO', 'DESCRICAO'], ordem: 'ID' },
};

const pick = (r: Row, cols: readonly string[]) => Object.fromEntries(cols.map((c) => [c, r[c] ?? null]));

export function memoryDocumentosRepo(seed: DocumentosSeed): DocumentosRepo {
  const docs = seed.documentos;
  const tabela = (tab: Tab): Row[] =>
    ({ parametros: seed.parametros, comentarios: seed.comentarios, anexos: seed.anexos, fila: seed.fila, erros: seed.erros })[tab] ?? [];
  const fila = seed.fila ?? [];
  const listCols = Object.keys(documentosServer.columns);

  // Rebuilt on every list: the Step 7.2 operations mutate the seed (anular, clonar) and the dev
  // list must show it, like the Forms re-query did.
  const listRows = () => {
    const comentados = new Set((seed.comentarios ?? []).map((c) => c['DOCUMENTO_ID']));
    return docs.map((d) => ({
      ...pick(d, listCols),
      COR: d['DISPONIBILIDADE'] === 'OFF' ? 'OFFLINE' : d['DISPONIBILIDADE'] === 'ANU' || d['ATRIBUTO9'] === 'A' ? 'ANULADO' : null,
      COMENTARIO: comentados.has(d['ID']) ? '***' : null,
    }));
  };
  const vazio = (v: unknown) => v == null;
  const store = () => memoryStore(documentosServer, listRows(), {
    // ponytail: JS twins of PRESETS, close enough for dev/unit data (the SQL is contract-tested):
    // Em erro = the document's last queue row is ERRO; A executar / Execução ignore the MIN(id) cut.
    presets: {
      todos: () => true,
      'em-branco': (r) => {
        const d = docs.find((x) => x['ID'] === r['ID']) ?? {};
        const m = String(r['MODELO_ID'] ?? '');
        const refConta = !vazio(r['N_REFERENCIA']) && !['R3.D25', 'R3.D25R', 'R3.D27', 'R3.D27R'].includes(m);
        return (
          !vazio(d['DATA_EXECUCAO']) &&
          vazio(r['DESTINATARIO']) &&
          !refConta &&
          !m.startsWith('M') &&
          (m === 'I1.D55' || !m.startsWith('I')) &&
          !['O1.OD58', 'O2.OD61', 'O2.OD69'].includes(m)
        );
      },
      'nao-executados': (r) => vazio(r['ESTADO']),
      'em-erro': (r) => {
        const ultima = fila.filter((q) => q['DOCUMENTO_ID'] === r['ID']).sort((a, b) => Number(b['ID']) - Number(a['ID']))[0];
        return ultima?.['ESTADO'] === 'ERRO';
      },
      'a-executar': (r) => r['ESTADO'] === 'A EXECUTAR',
      execucao: (r) => r['ESTADO'] === 'EXECUCAO',
    },
  });

  const porParametros = (q: ListQuery): Set<unknown> => {
    paramWhere(q.params, q.paramModelo); // same 400s
    const pares = (q.params ?? []).filter((p) => p.valor !== '');
    const sets = pares.map((p, i) => {
      const valor = likeRegex(p.valor, 's');
      const modelo = i === 0 && q.paramModelo !== undefined ? likeRegex(q.paramModelo, 's') : null;
      return new Set(
        (seed.parametros ?? [])
          .filter((r) => r['NOME'] === p.nome && r['VALOR'] != null && valor.test(String(r['VALOR'])))
          .filter((r) => !modelo || modelo.test(String(r['MODELO_ID'] ?? '')))
          .map((r) => r['DOCUMENTO_ID']),
      );
    });
    return sets.reduce((a, b) => new Set([...a].filter((x) => b.has(x))));
  };

  const porGrupo = (raw: string): Set<unknown> => {
    const id = grupoId(raw);
    const d = docs.find((x) => x['ID'] === id) as unknown as GrupoDoc | undefined;
    if (!d) throw NAO_ENCONTRADO();
    const leitura: GrupoLeitura = { ids: [id], min: null, max: null };
    if (usaLote(d.MODELO_ID) && d.LOTE_ORDEM !== null) {
      const m = contrapartida(d.MODELO_ID ?? '');
      const ordens = docs
        .filter((x) => x['MODELO_ID'] === m && (x['LOTE_ID'] ?? -1) === (d.LOTE_ID ?? -1) && x['LOTE_ORDEM'] != null)
        .map((x) => Number(x['LOTE_ORDEM']));
      const abaixo = ordens.filter((o) => o <= Number(d.LOTE_ORDEM));
      const acima = ordens.filter((o) => o > Number(d.LOTE_ORDEM));
      leitura.min = abaixo.length ? Math.max(...abaixo) : null;
      leitura.max = acima.length ? Math.min(...acima) : null;
    } else if (!usaLote(d.MODELO_ID)) {
      const anexos = seed.anexos ?? [];
      const pai = Number(anexos.find((a) => a['ANEXODOC_ID'] === id)?.['DOCUMENTO_ID'] ?? id);
      leitura.ids = [pai, ...anexos.filter((a) => a['DOCUMENTO_ID'] === pai).map((a) => Number(a['ANEXODOC_ID']))];
    }
    const match = grupoMatch(planoGrupo(d, leitura));
    return new Set(docs.filter(match).map((x) => x['ID']));
  };

  return {
    async list(q, ctx) {
      const { params, paramModelo, grupo, ...base } = q;
      let ids: Set<unknown> | undefined;
      if (params || paramModelo !== undefined) ids = porParametros(q);
      if (grupo !== undefined) {
        const g = porGrupo(grupo);
        ids = ids ? new Set([...ids].filter((x) => g.has(x))) : g;
      }
      if (ids) {
        const values = ids.size > 0 ? [...ids].map(String) : ['-1'];
        base.filters = { ...base.filters, ID: [...(base.filters['ID'] ?? []), { op: 'in', values }] };
      }
      const { rows, total } = await store().list(base, {}, ctx);
      // Read-only resource: no `_rid`, as in the Oracle list.
      return { rows: rows.map((r) => pick(r, listCols)), total };
    },

    async ids(q, ctx) {
      const { rows } = await this.list({ ...q, sort: [], page: 1, size: MAX_SELECCAO + 1 }, ctx);
      return rows.map((r) => Number(r['ID']));
    },

    async detalhe(id, role) {
      const d = docs.find((x) => x['ID'] === id);
      return d && pick(d, colunasDetalhe(role));
    },

    async tab(tab, id) {
      const { cols, ordem } = TAB_COLUNAS[tab];
      return tabela(tab)
        .filter((r) => r['DOCUMENTO_ID'] === id)
        .filter((r) => tab !== 'parametros' || !['_USER', 'P_ID'].includes(String(r['NOME'])))
        .sort((a, b) => Number(a[ordem]) - Number(b[ordem]))
        .map((r) => pick(tab === 'anexos' ? { ...docs.find((d) => d['ID'] === r['ANEXODOC_ID']), ...r } : r, cols));
    },

    async conversao(tipo, valor) {
      const hits =
        tipo === 'recibo'
          ? (seed.recibos ?? []).filter((r) => String(r.NMRECINUE) === valor).map((r) => r.NMRECIBO)
          : (seed.pessoas ?? []).filter((r) => r.CDIDEPER === valor).map((r) => r.CDPERSON);
      return hits.length === 1 ? String(hits[0]) : null;
    },

    async disponibilidade(id) {
      return docs.find((x) => x['ID'] === id)?.['DISPONIBILIDADE'] as string | undefined;
    },
  };
}
