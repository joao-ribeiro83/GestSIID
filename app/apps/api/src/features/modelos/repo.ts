import { AppError, mapOracleError } from '../../db/errors.ts';
import {
  lockRow,
  withConnection,
  withTransaction,
  type DbConnection,
  type DbPool,
  type SessionUser,
} from '../../db/oracle.ts';
import { SYSDATE, type CrudCtx, type CrudStore, type Parent, type Row } from '../../lib/crud.ts';
import { dateSelect, decodeRid } from '../../lib/listQuery.ts';
import { localNow } from '../permissoes/repo.ts';
import {
  MODELO_EXISTENTE,
  omissaoActual,
  planoOmissao,
  type Omissao,
  type OpOmissao,
  type PedidoOmissao,
} from './rules.ts';

/**
 * Data access of FD_CONFIGURACAO_MODELOS beyond plain row CRUD: the two "Clonar" actions, the
 * report parameters with their current default, the BR-MOD-09 versioning, the D-28 lookups and
 * the BR-MOD-11 ramo change. Each write is one transaction. `oracleModelosRepo` is bind-only SQL;
 * `memoryModelosRepo` works on the same CrudStores the routes use (unit tests, dev server).
 */

export interface NovoModelo {
  ID: string;
  DESCRICAO: string;
  N_COPIAS: number;
  FORMA_CONTROLO_RF: string;
  DATA_INICIO: string;
  DATA_FIM: string | null;
}

export interface SeccaoKey {
  MODELO_ID: string;
  TIPOSEC_ID: string;
  ALINEA: number;
}

export interface ReportParametro {
  REPORT_ID: number;
  N_PARAMETRO: number;
  NOME: string | null;
  TIPO_PARAMETRO_RF: string | null;
  OBRIGATORIO: string | null;
  CHECK_UNIQUE: string | null;
  VALIDO: string | null;
  DESCRICAO: string | null;
}

export interface ParametroReport extends ReportParametro {
  VALOR: string | null;
  DATA_INICIO: string | null;
  DATA_FIM: string | null;
  NOME_CONSULTA: string | null;
  CONSULTA_ONLINE: string;
  DETALHES: '***' | null;
}

export type ListaOpcoes = 'TIPOS_CONTEUDO' | 'CONTEXTOS_APR';
export type Opcoes = { rows: { CHAVE: number; DESIGNACAO: string | null }[]; preSelected: number | null };
export type AlvoRamo = 'EDOC' | 'ARQUIVO';

export interface ModelosRepo {
  clonarModelo(user: SessionUser, origemId: string, novo: NovoModelo): Promise<void>;
  clonarSeccao(user: SessionUser, key: SeccaoKey): Promise<number>;
  parametrosReport(user: SessionUser, modeloId: string): Promise<ParametroReport[]>;
  gravarOmissao(
    user: SessionUser,
    modeloId: string,
    nParametro: number,
    pedido: PedidoOmissao,
  ): Promise<OpOmissao[]>;
  opcoes(
    user: SessionUser,
    lista: ListaOpcoes,
    chave?: { MODELO_ID: string; TIPOSEC_ID: string },
  ): Promise<Opcoes>;
  alterarRamo(
    user: SessionUser,
    alvo: AlvoRamo,
    rid: string,
    orig: { CDRAMO?: string | null },
    cdramo: string,
  ): Promise<void>;
}

export interface ModelosStores {
  modelos: CrudStore;
  seccoes: CrudStore;
  condicoes: CrudStore;
  omissao: CrudStore;
  atributosEdoc: CrudStore;
  atributosArquivo: CrudStore;
}

const naoEncontrado = () => new AppError(404, 'NAO_ENCONTRADO', 'Registo não encontrado.');
const modeloExistente = () =>
  new AppError(409, 'MODELO_EXISTENTE', MODELO_EXISTENTE, { fields: { ID: MODELO_EXISTENTE } });
const registoAlterado = () =>
  new AppError(409, 'REGISTO_ALTERADO', 'O registo foi alterado por outro utilizador. Volte a consultar.');

const OPCOES = {
  TIPOS_CONTEUDO: { tabela: 'DOC_TIPOS_CONTEUDO', coluna: 'TIPOCNTD_ID', origem: 'DOC_SECCOES_DOCUMENTO' },
  CONTEXTOS_APR: { tabela: 'DOC_CONTEXTOS_APR', coluna: 'CONTEXTO_ID', origem: 'DOC_CONDICOES_APR' },
} as const;

const RAMO = {
  EDOC: { tabela: 'DOC_ATRIBUTOS_EDOC', grupo: 'EDOC_ID', store: 'atributosEdoc' },
  ARQUIVO: { tabela: 'DOC_ATRIBUTOS_ARQUIVO', grupo: 'ARQ_ID', store: 'atributosArquivo' },
} as const;

// ── Oracle ───────────────────────────────────────────────────────────────────────────────────

const MASK = `'YYYY-MM-DD"T"HH24:MI:SS'`;
const date = (bind: string) => `TO_DATE(:${bind}, ${MASK})`;
const OMISSAO = 'DOC_PARAMETROS_OMISSAO';
const OMISSAO_KEY = `MODELO_ID = :m AND N_PARAMETRO = :n AND DATA_INICIO = ${date('ini')}`;

const PARAMETROS_SQL = `
SELECT p.REPORT_ID, p.N_PARAMETRO, p.NOME, p.TIPO_PARAMETRO_RF, p.OBRIGATORIO, p.CHECK_UNIQUE, p.VALIDO,
       p.DESCRICAO, o.VALOR, ${dateSelect('o.DATA_INICIO')} AS DATA_INICIO,
       ${dateSelect('o.DATA_FIM')} AS DATA_FIM, o.NOME_CONSULTA, NVL(o.CONSULTA_ONLINE, 'N') AS CONSULTA_ONLINE,
       CASE WHEN EXISTS (SELECT 1 FROM ${OMISSAO} h WHERE h.MODELO_ID = m.ID AND h.N_PARAMETRO = p.N_PARAMETRO)
            THEN '***' END AS DETALHES
  FROM DOC_MODELOS_DOCUMENTO m
  JOIN SVR_PARAMETROS_REPORT p ON p.REPORT_ID = m.REPORT_ID
  OUTER APPLY (SELECT d.VALOR, d.DATA_INICIO, d.DATA_FIM, d.NOME_CONSULTA, d.CONSULTA_ONLINE
                 FROM ${OMISSAO} d
                WHERE d.MODELO_ID = m.ID AND d.N_PARAMETRO = p.N_PARAMETRO
                  AND SYSDATE BETWEEN d.DATA_INICIO AND NVL(d.DATA_FIM, SYSDATE)
                ORDER BY d.DATA_INICIO DESC FETCH FIRST 1 ROW ONLY) o
 WHERE m.ID = :m
 ORDER BY p.N_PARAMETRO`;

async function rows<T>(conn: DbConnection, sql: string, binds: Record<string, unknown> = {}) {
  return ((await conn.execute<T>(sql, binds as never)).rows ?? []) as T[];
}

async function aplicarOmissao(conn: DbConnection, m: string, n: number, ops: OpOmissao[], por: string) {
  for (const op of ops) {
    if (op.tipo === 'inserir') {
      const r = op.row;
      await conn.execute(
        `INSERT INTO ${OMISSAO} (MODELO_ID, N_PARAMETRO, DATA_INICIO, VALOR, DATA_FIM, CRIADO_POR, DATA_CRIACAO, NOME_CONSULTA, CONSULTA_ONLINE)
         VALUES (:m, :n, ${date('ini')}, :valor, ${date('fim')}, :por, SYSDATE, :nc, :co)`,
        { m, n, ini: r.DATA_INICIO, valor: r.VALOR, fim: r.DATA_FIM, por, nc: r.NOME_CONSULTA, co: r.CONSULTA_ONLINE } as never,
      );
      continue;
    }
    const key = { m, n, ini: op.DATA_INICIO }; // locked by the read in gravarOmissao
    if (op.tipo === 'fechar') {
      await conn.execute(`UPDATE ${OMISSAO} SET DATA_FIM = ${date('fim')} WHERE ${OMISSAO_KEY}`, {
        ...key,
        fim: op.DATA_FIM,
      } as never);
    } else {
      const s = op.set;
      await conn.execute(
        `UPDATE ${OMISSAO} SET VALOR = :valor, DATA_FIM = ${date('fim')}, NOME_CONSULTA = :nc, CONSULTA_ONLINE = :co,
                ACTUALIZADO_POR = :por, DATA_ACTUALIZACAO = SYSDATE
          WHERE ${OMISSAO_KEY}`,
        { ...key, valor: s.VALOR, fim: s.DATA_FIM, nc: s.NOME_CONSULTA, co: s.CONSULTA_ONLINE, por } as never,
      );
    }
  }
}

export function oracleModelosRepo(pool: DbPool, callTimeoutMs: number): ModelosRepo {
  // ORA-* → the §8 catalogue; AppErrors and bugs pass through unchanged.
  const mapped = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      throw e instanceof Error && /ORA-\d+/.test(e.message) ? mapOracleError(e) : e;
    }
  };
  const read = <T>(user: SessionUser, action: string, fn: (c: DbConnection) => Promise<T>) =>
    mapped(() => withConnection(pool, user, action, callTimeoutMs, fn));
  const write = <T>(user: SessionUser, action: string, fn: (c: DbConnection) => Promise<T>) =>
    mapped(() => withTransaction(pool, user, action, callTimeoutMs, fn));

  return {
    clonarModelo: (user, origem, novo) =>
      write(user, 'modelos.clonar', async (conn) => {
        const [c] = await rows<{ N: number }>(
          conn,
          'SELECT COUNT(*) AS N FROM DOC_MODELOS_DOCUMENTO WHERE ID = :novo',
          { novo: novo.ID },
        );
        if ((c?.N ?? 0) > 0) throw modeloExistente();
        const b = { novo: novo.ID, origem, por: user.username };
        const r = await conn.execute(
          `INSERT INTO DOC_MODELOS_DOCUMENTO (ID, TIPO_DOCUMENTO_RF, REPORT_ID, N_ANEXOS, MAX_IMPRESSOES, DESCRICAO,
                  N_COPIAS, FORMA_CONTROLO_RF, DATA_INICIO, DATA_FIM, CRIADO_POR, DATA_CRIACAO)
           SELECT :novo, TIPO_DOCUMENTO_RF, REPORT_ID, N_ANEXOS, MAX_IMPRESSOES, :descricao, :copias, :forma,
                  ${date('ini')}, ${date('fim')}, :por, SYSDATE
             FROM DOC_MODELOS_DOCUMENTO WHERE ID = :origem`,
          {
            ...b,
            descricao: novo.DESCRICAO,
            copias: novo.N_COPIAS,
            forma: novo.FORMA_CONTROLO_RF,
            ini: novo.DATA_INICIO,
            fim: novo.DATA_FIM,
          } as never,
        );
        if (!r.rowsAffected) throw naoEncontrado();
        await conn.execute(
          `INSERT INTO DOC_SECCOES_DOCUMENTO (MODELO_ID, TIPOCNTD_ID, IMAGEM, CRIADO_POR, DATA_CRIACAO, FORMULA_ID,
                  TIPOSEC_ID, ALINEA, TITULO, TEXTO)
           SELECT :novo, TIPOCNTD_ID, IMAGEM, :por, SYSDATE, FORMULA_ID, TIPOSEC_ID, ALINEA, TITULO, TEXTO
             FROM DOC_SECCOES_DOCUMENTO WHERE MODELO_ID = :origem`,
          b as never,
        );
        await conn.execute(
          `INSERT INTO DOC_CONDICOES_APR (MODELO_ID, TIPOSEC_ID, ALINEA, CONTEXTO_ID, CRIADO_POR, DATA_CRIACAO,
                  DATA_INICIO, DATA_FIM, CDUNIECO, CDRAMO, ATRIBUTO1, ATRIBUTO2, ATRIBUTO3, ATRIBUTO4, ATRIBUTO5,
                  ATRIBUTO6, ATRIBUTO7, ATRIBUTO8)
           SELECT :novo, TIPOSEC_ID, ALINEA, CONTEXTO_ID, CRIADO_POR, DATA_CRIACAO, DATA_INICIO, DATA_FIM,
                  CDUNIECO, CDRAMO, ATRIBUTO1, ATRIBUTO2, ATRIBUTO3, ATRIBUTO4, ATRIBUTO5, ATRIBUTO6, ATRIBUTO7,
                  ATRIBUTO8
             FROM DOC_CONDICOES_APR WHERE MODELO_ID = :origem`,
          { novo: novo.ID, origem } as never,
        );
      }),

    clonarSeccao: (user, k) =>
      write(user, 'modelos.clonar-seccao', async (conn) => {
        const where = { m: k.MODELO_ID, t: k.TIPOSEC_ID };
        const [c] = await rows<{ N: number }>(
          conn,
          'SELECT NVL(MAX(ALINEA), 0) + 1 AS N FROM DOC_SECCOES_DOCUMENTO WHERE MODELO_ID = :m AND TIPOSEC_ID = :t',
          where,
        );
        const nova = c?.N ?? 1;
        const r = await conn.execute(
          `INSERT INTO DOC_SECCOES_DOCUMENTO (MODELO_ID, TIPOCNTD_ID, IMAGEM, CRIADO_POR, DATA_CRIACAO, FORMULA_ID,
                  TIPOSEC_ID, ALINEA, TITULO, TEXTO)
           SELECT MODELO_ID, TIPOCNTD_ID, IMAGEM, :por, SYSDATE, FORMULA_ID, TIPOSEC_ID, :nova, TITULO, TEXTO
             FROM DOC_SECCOES_DOCUMENTO WHERE MODELO_ID = :m AND TIPOSEC_ID = :t AND ALINEA = :a`,
          { ...where, a: k.ALINEA, nova, por: user.username } as never,
        );
        if (!r.rowsAffected) throw naoEncontrado();
        return nova;
      }),

    parametrosReport: (user, modeloId) =>
      read(user, 'modelos.parametros-report', (conn) =>
        rows<ParametroReport>(conn, PARAMETROS_SQL, { m: modeloId }),
      ),

    gravarOmissao: (user, m, n, pedido) =>
      write(user, 'modelos.omissao', async (conn) => {
        const [a] = await rows<{ AGORA: string }>(conn, `SELECT ${dateSelect('SYSDATE')} AS AGORA FROM DUAL`);
        const existentes = await rows<Omissao>(
          conn,
          `SELECT VALOR, ${dateSelect('DATA_INICIO')} AS DATA_INICIO, ${dateSelect('DATA_FIM')} AS DATA_FIM,
                  NOME_CONSULTA, CONSULTA_ONLINE
             FROM ${OMISSAO} WHERE MODELO_ID = :m AND N_PARAMETRO = :n FOR UPDATE NOWAIT`,
          { m, n },
        );
        const ops = planoOmissao(existentes, pedido, String(a?.AGORA));
        await aplicarOmissao(conn, m, n, ops, user.username);
        return ops;
      }),

    opcoes: (user, lista, chave) =>
      read(user, 'modelos.opcoes', async (conn) => {
        const o = OPCOES[lista];
        const lidas = await rows<Opcoes['rows'][number]>(
          conn,
          `SELECT ID AS CHAVE, DESCRICAO AS DESIGNACAO FROM ${o.tabela} ORDER BY ID`,
        );
        if (!chave) return { rows: lidas, preSelected: null };
        const [m] = await rows<{ N: number | null }>(
          conn,
          `SELECT MAX(${o.coluna}) AS N FROM ${o.origem} WHERE MODELO_ID = :m AND TIPOSEC_ID = :t`,
          { m: chave.MODELO_ID, t: chave.TIPOSEC_ID },
        );
        return { rows: lidas, preSelected: m?.N || null };
      }),

    alterarRamo: (user, alvo, ridIn, orig, cdramo) =>
      write(user, 'modelos.alterar-ramo', async (conn) => {
        const { tabela, grupo } = RAMO[alvo];
        const rid = decodeRid(ridIn);
        const byRid = 'ROWID = :rid';
        await lockRow(conn, tabela, byRid, { rid }, orig.CDRAMO === undefined ? {} : { CDRAMO: orig.CDRAMO });
        const doGrupo = `(MODELO_ID, ${grupo}) IN (SELECT MODELO_ID, ${grupo} FROM ${tabela} WHERE ${byRid})`;
        await lockRow(conn, tabela, doGrupo, { rid }, {});
        await conn.execute(
          `UPDATE ${tabela} SET ACTUALIZADO_POR = :por, DATA_ACTUALIZACAO = SYSDATE WHERE ${byRid}`,
          { por: user.username, rid },
        );
        // POST-CHANGE of CDRAMO: the whole MODELO_ID + EDOC_ID / ARQ_ID group takes the new ramo.
        await conn.execute(
          `UPDATE ${tabela} SET CDRAMO = :cdramo WHERE ${doGrupo}`,
          { cdramo, rid },
        );
      }),
  };
}

// ── Memory (unit tests, dev server) ──────────────────────────────────────────────────────────

/**
 * ponytail: the memory repo writes store by store with no rollback; checks run before the first
 * write, so only a failure between writes (e.g. a duplicate key mid-plan) leaves a partial result.
 */
export function memoryModelosRepo(deps: {
  stores: ModelosStores;
  parametros: ReportParametro[];
  tiposConteudo: { ID: number; DESCRICAO: string | null }[];
  contextos: { ID: number; DESCRICAO: string | null }[];
  now?: () => string;
}): ModelosRepo {
  const { stores } = deps;
  const clock = deps.now ?? localNow;
  const ctxOf = (user: SessionUser): CrudCtx => ({ user: { username: user.username, role: 'ADM' } });
  const all = async (store: CrudStore, parent: Parent, ctx: CrudCtx) =>
    (await store.list({ filters: {}, sort: [], page: 1, size: 100_000 }, parent, ctx)).rows;
  const modelo = async (id: string, ctx: CrudCtx) =>
    (await stores.modelos.list({ filters: { ID: [{ op: 'eq', value: id }] }, sort: [], page: 1, size: 1 }, {}, ctx))
      .rows[0];
  const semRid = (r: Row) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== '_rid'));
  const omissoes = async (m: string, n: number, ctx: CrudCtx) =>
    all(stores.omissao, { MODELO_ID: m, N_PARAMETRO: n }, ctx) as Promise<(Row & Omissao)[]>;

  return {
    async clonarModelo(user, origem, novo) {
      const ctx = ctxOf(user);
      if (await modelo(novo.ID, ctx)) throw modeloExistente();
      const src = await modelo(origem, ctx);
      if (!src) throw naoEncontrado();
      await stores.modelos.insert(
        {
          ...novo,
          TIPO_DOCUMENTO_RF: src['TIPO_DOCUMENTO_RF'],
          REPORT_ID: src['REPORT_ID'],
          N_ANEXOS: src['N_ANEXOS'],
          MAX_IMPRESSOES: src['MAX_IMPRESSOES'],
          // The Oracle column defaults (the INSERT does not name these columns).
          MODO_EXPEDICAO_RF: 'I',
          MODO_CERTIFICADO_RF: '0',
          MODO_PROTECAO_RF: '0',
          STAMP: 'N',
          CRIADO_POR: user.username,
          DATA_CRIACAO: SYSDATE,
        },
        {},
        ctx,
      );
      for (const s of await all(stores.seccoes, { MODELO_ID: origem }, ctx)) {
        const { TIPOSEC_ID, ALINEA, TIPOCNTD_ID, FORMULA_ID, TITULO, TEXTO, TIPO_IMAGEM } = s;
        await stores.seccoes.insert(
          { TIPOSEC_ID, ALINEA, TIPOCNTD_ID, FORMULA_ID, TITULO, TEXTO, TIPO_IMAGEM, CRIADO_POR: user.username, DATA_CRIACAO: SYSDATE },
          { MODELO_ID: novo.ID },
          ctx,
        );
        const chave = { TIPOSEC_ID: String(TIPOSEC_ID), ALINEA: Number(ALINEA) };
        for (const c of await all(stores.condicoes, { MODELO_ID: origem, ...chave }, ctx))
          await stores.condicoes.insert(semRid(c), { MODELO_ID: novo.ID, ...chave }, ctx);
      }
    },

    async clonarSeccao(user, k) {
      const ctx = ctxOf(user);
      const irmas = (await all(stores.seccoes, { MODELO_ID: k.MODELO_ID }, ctx)).filter(
        (s) => s['TIPOSEC_ID'] === k.TIPOSEC_ID,
      );
      const src = irmas.find((s) => s['ALINEA'] === k.ALINEA);
      if (!src) throw naoEncontrado();
      const nova = Math.max(...irmas.map((s) => Number(s['ALINEA']))) + 1;
      const { TIPOCNTD_ID, FORMULA_ID, TITULO, TEXTO, TIPO_IMAGEM } = src;
      await stores.seccoes.insert(
        {
          TIPOSEC_ID: k.TIPOSEC_ID,
          ALINEA: nova,
          TIPOCNTD_ID,
          FORMULA_ID,
          TITULO,
          TEXTO,
          TIPO_IMAGEM,
          CRIADO_POR: user.username,
          DATA_CRIACAO: SYSDATE,
          ACTUALIZADO_POR: null,
          DATA_ACTUALIZACAO: null,
        },
        { MODELO_ID: k.MODELO_ID },
        ctx,
      );
      return nova;
    },

    async parametrosReport(user, modeloId) {
      const ctx = ctxOf(user);
      const m = await modelo(modeloId, ctx);
      if (!m || m['REPORT_ID'] == null) return [];
      const agora = clock();
      const params = deps.parametros
        .filter((p) => p.REPORT_ID === m['REPORT_ID'])
        .sort((a, b) => a.N_PARAMETRO - b.N_PARAMETRO);
      return Promise.all(
        params.map(async (p) => {
          const hist = await omissoes(modeloId, p.N_PARAMETRO, ctx);
          const o = omissaoActual(hist, agora);
          return {
            ...p,
            VALOR: o?.VALOR ?? null,
            DATA_INICIO: o?.DATA_INICIO ?? null,
            DATA_FIM: o?.DATA_FIM ?? null,
            NOME_CONSULTA: o?.NOME_CONSULTA ?? null,
            CONSULTA_ONLINE: o?.CONSULTA_ONLINE ?? 'N',
            DETALHES: hist.length > 0 ? ('***' as const) : null,
          };
        }),
      );
    },

    async gravarOmissao(user, m, n, pedido) {
      const ctx = ctxOf(user);
      const existentes = await omissoes(m, n, ctx);
      const ops = planoOmissao(existentes, pedido, clock());
      const rid = (ini: string) => String(existentes.find((r) => r.DATA_INICIO === ini)?._rid);
      for (const op of ops) {
        if (op.tipo === 'inserir')
          await stores.omissao.insert(
            { ...op.row, CRIADO_POR: user.username, DATA_CRIACAO: SYSDATE },
            { MODELO_ID: m, N_PARAMETRO: n },
            ctx,
          );
        else if (op.tipo === 'fechar')
          await stores.omissao.update(rid(op.DATA_INICIO), {}, { DATA_FIM: op.DATA_FIM }, ctx);
        else
          await stores.omissao.update(
            rid(op.DATA_INICIO),
            {},
            { ...op.set, ACTUALIZADO_POR: user.username, DATA_ACTUALIZACAO: SYSDATE },
            ctx,
          );
      }
      return ops;
    },

    async opcoes(user, lista, chave) {
      const seed = lista === 'TIPOS_CONTEUDO' ? deps.tiposConteudo : deps.contextos;
      const rows = [...seed].sort((a, b) => a.ID - b.ID).map((r) => ({ CHAVE: r.ID, DESIGNACAO: r.DESCRICAO }));
      if (!chave) return { rows, preSelected: null };
      const ctx = ctxOf(user);
      const seccoes = (await all(stores.seccoes, { MODELO_ID: chave.MODELO_ID }, ctx)).filter(
        (s) => s['TIPOSEC_ID'] === chave.TIPOSEC_ID,
      );
      let valores = seccoes.map((s) => Number(s['TIPOCNTD_ID']));
      if (lista === 'CONTEXTOS_APR') {
        valores = [];
        for (const s of seccoes) {
          const parent = { MODELO_ID: chave.MODELO_ID, TIPOSEC_ID: chave.TIPOSEC_ID, ALINEA: Number(s['ALINEA']) };
          for (const c of await all(stores.condicoes, parent, ctx)) valores.push(Number(c['CONTEXTO_ID']));
        }
      }
      return { rows, preSelected: Math.max(0, ...valores) || null };
    },

    async alterarRamo(user, alvo, rid, orig, cdramo) {
      const ctx = ctxOf(user);
      const { grupo, store: nome } = RAMO[alvo];
      const store = stores[nome];
      const row = await store.get(rid, ctx);
      if (!row) throw registoAlterado();
      await store.update(
        rid,
        orig.CDRAMO === undefined ? {} : { CDRAMO: orig.CDRAMO },
        { CDRAMO: cdramo, ACTUALIZADO_POR: user.username, DATA_ACTUALIZACAO: SYSDATE },
        ctx,
      );
      for (const r of await all(store, { MODELO_ID: String(row['MODELO_ID']) }, ctx))
        if (r['_rid'] !== rid && r[grupo] === row[grupo])
          await store.update(String(r['_rid']), {}, { CDRAMO: cdramo }, ctx);
    },
  };
}
