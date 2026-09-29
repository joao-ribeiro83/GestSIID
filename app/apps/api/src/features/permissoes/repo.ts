import { AppError, mapOracleError } from '../../db/errors.ts';
import {
  lockRow,
  withConnection,
  withTransaction,
  type DbConnection,
  type DbPool,
  type SessionUser,
} from '../../db/oracle.ts';
import { dateSelect } from '../../lib/listQuery.ts';
import { semPermissao, sobrepoe, validaHoje, type Modelo, type Perm, type PermKey, type Scope, type SemRow, type Utilizador } from './rules.ts';

/**
 * Data access for FD_PERMISSOES_SIID. The routes run every action inside `read` (one pooled
 * connection, SELECT only) or `write` (one transaction: one commit, rollback on any throw).
 * `oraclePermissoesRepo` is bind-only SQL; `memoryPermissoesRepo` backs the unit tests and the dev
 * server with the same rules (`semPermissao` is the JS twin of CTR_SEM_PERMISSAO_USER_VW).
 */

export type PermFiltro = Partial<Pick<Perm, 'MODELO_ID' | 'USERNAME' | 'UNIDADE_NEGOCIO_RF' | 'TIPO_PERMISSAO_RF'>>;

export interface PermissoesTx {
  /** SYSDATE. */
  now(): Promise<string>;
  find(f: PermFiltro): Promise<Perm[]>;
  sem(scope: Scope): Promise<SemRow[]>;
  /** LOV_UTILIZADORES (CFG_UTILIZADORES_VW), one unit or all, by USERNAME. */
  utilizadores(un?: string): Promise<Utilizador[]>;
  /** LOV_MODELOS: models valid today, by ID. */
  modelos(): Promise<{ ID: string }[]>;
  /** Row gone, or DATA_FIM no longer `orig.DATA_FIM` → 409 REGISTO_ALTERADO. */
  lock(key: PermKey, orig?: { DATA_FIM: string | null }): Promise<void>;
  insert(p: Perm, criadoPor: string): Promise<void>;
  update(key: PermKey, set: { DATA_INICIO: string; DATA_FIM: string | null }, actualizadoPor: string): Promise<void>;
}

export interface PermissoesRepo {
  read<T>(user: SessionUser, action: string, fn: (tx: PermissoesTx) => Promise<T>): Promise<T>;
  write<T>(user: SessionUser, action: string, fn: (tx: PermissoesTx) => Promise<T>): Promise<T>;
}

// ── Oracle ───────────────────────────────────────────────────────────────────────────────────

const MASK = `'YYYY-MM-DD"T"HH24:MI:SS'`;
const TABLE = 'CFG_PERMISSOES_SIID';
const PERM_COLS = `MODELO_ID, USERNAME, UNIDADE_NEGOCIO_RF, TIPO_PERMISSAO_RF, ${dateSelect('DATA_INICIO')} AS DATA_INICIO, ${dateSelect('DATA_FIM')} AS DATA_FIM`;
const KEY_WHERE = `MODELO_ID = :m AND USERNAME = :u AND UNIDADE_NEGOCIO_RF = :un AND TIPO_PERMISSAO_RF = :t AND DATA_INICIO = TO_DATE(:ini, ${MASK})`;
const FILTER_COLS = ['MODELO_ID', 'USERNAME', 'UNIDADE_NEGOCIO_RF', 'TIPO_PERMISSAO_RF'] as const;

const keyBinds = (k: PermKey) => ({
  m: k.MODELO_ID,
  u: k.USERNAME,
  un: k.UNIDADE_NEGOCIO_RF,
  t: k.TIPO_PERMISSAO_RF,
  ini: k.DATA_INICIO,
});

function oracleTx(conn: DbConnection): PermissoesTx {
  const rows = async <T>(sql: string, binds: Record<string, unknown>) =>
    ((await conn.execute<T>(sql, binds as never)).rows ?? []) as T[];
  return {
    async now() {
      const [r] = await rows<{ AGORA: string }>(`SELECT ${dateSelect('SYSDATE')} AS AGORA FROM DUAL`, {});
      return String(r?.AGORA);
    },
    find(f) {
      const binds: Record<string, unknown> = {};
      const where = FILTER_COLS.filter((c) => f[c] !== undefined).map((c, i) => {
        binds[`f${i}`] = f[c];
        return `${c} = :f${i}`;
      });
      const sql = `SELECT ${PERM_COLS} FROM ${TABLE}${where.length ? ` WHERE ${where.join(' AND ')}` : ''}`;
      return rows<Perm>(sql, binds);
    },
    sem(scope) {
      const binds: Record<string, unknown> = { un: scope.UNIDADE_NEGOCIO_RF, t: scope.TIPO_PERMISSAO_RF };
      let extra = '';
      if (scope.USERNAME !== undefined) {
        binds['u'] = scope.USERNAME;
        extra += ' AND USERNAME = :u';
      }
      if (scope.MODELO_ID !== undefined) {
        binds['m'] = scope.MODELO_ID;
        extra += ' AND MODELO_ID = :m';
      }
      const order = scope.MODELO_ID === undefined ? 'MODELO_ID, USERNAME' : 'USERNAME';
      return rows<SemRow>(
        `SELECT MODELO_ID, USERNAME, NOME FROM CTR_SEM_PERMISSAO_USER_VW
          WHERE UNIDADE_NEGOCIO_RF = :un AND TIPO_PERMISSAO_RF = :t${extra} ORDER BY ${order}`,
        binds,
      );
    },
    utilizadores: (un) =>
      rows<Utilizador>(
        `SELECT USERNAME, NOME, UNIDADE_NEGOCIO_RF FROM CFG_UTILIZADORES_VW${un === undefined ? '' : ' WHERE UNIDADE_NEGOCIO_RF = :un'} ORDER BY USERNAME`,
        un === undefined ? {} : { un },
      ),
    modelos: () =>
      rows<{ ID: string }>(
        'SELECT ID FROM DOC_MODELOS_DOCUMENTO WHERE SYSDATE BETWEEN DATA_INICIO AND NVL(DATA_FIM, SYSDATE + 1) ORDER BY ID',
        {},
      ),
    lock: (key, orig) =>
      lockRow(conn, TABLE, KEY_WHERE, keyBinds(key), orig ? { [dateSelect('DATA_FIM')]: orig.DATA_FIM } : {}),
    async insert(p, criadoPor) {
      await conn.execute(
        `INSERT INTO ${TABLE} (MODELO_ID, USERNAME, UNIDADE_NEGOCIO_RF, TIPO_PERMISSAO_RF, DATA_INICIO, DATA_FIM, CRIADO_POR, DATA_CRIACAO)
         VALUES (:m, :u, :un, :t, TO_DATE(:ini, ${MASK}), TO_DATE(:fim, ${MASK}), :por, SYSDATE)`,
        { ...keyBinds(p), fim: p.DATA_FIM, por: criadoPor } as never,
      );
    },
    async update(key, set, actualizadoPor) {
      await conn.execute(
        `UPDATE ${TABLE} SET DATA_INICIO = TO_DATE(:nini, ${MASK}), DATA_FIM = TO_DATE(:nfim, ${MASK}),
                ACTUALIZADO_POR = :por, DATA_ACTUALIZACAO = SYSDATE
          WHERE ${KEY_WHERE}`,
        { ...keyBinds(key), nini: set.DATA_INICIO, nfim: set.DATA_FIM, por: actualizadoPor } as never,
      );
    },
  };
}

export function oraclePermissoesRepo(pool: DbPool, callTimeoutMs: number): PermissoesRepo {
  // ORA-00001 etc. → the §8 catalogue; anything else (AppErrors, bugs) passes through unchanged.
  const mapped = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      throw e instanceof Error && /ORA-\d+/.test(e.message) ? mapOracleError(e) : e;
    }
  };
  return {
    read: (user, action, fn) =>
      mapped(() => withConnection(pool, user, action, callTimeoutMs, (conn) => fn(oracleTx(conn)))),
    write: (user, action, fn) =>
      mapped(() => withTransaction(pool, user, action, callTimeoutMs, (conn) => fn(oracleTx(conn)))),
  };
}

// ── Memory (unit tests, dev server) ──────────────────────────────────────────────────────────

type StoredPerm = Perm & {
  CRIADO_POR?: string | null;
  DATA_CRIACAO?: string | null;
  ACTUALIZADO_POR?: string | null;
  DATA_ACTUALIZACAO?: string | null;
};

export const localNow = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 19);
};

const sameKey = (p: PermKey, k: PermKey) =>
  p.MODELO_ID === k.MODELO_ID &&
  p.USERNAME === k.USERNAME &&
  p.UNIDADE_NEGOCIO_RF === k.UNIDADE_NEGOCIO_RF &&
  p.TIPO_PERMISSAO_RF === k.TIPO_PERMISSAO_RF &&
  p.DATA_INICIO === k.DATA_INICIO;

/** TRG_PREVENT_DUPLICATE_PERM (AFTER STATEMENT on INSERT/UPDATE): more than one row of the same
 * user/model/type/unit overlapping the written row's period → ORA-20001, as oracleStore maps it. */
function trgPreventDuplicatePerm(rows: readonly Perm[], p: Perm): void {
  const n = rows.filter(
    (t) =>
      t.USERNAME === p.USERNAME &&
      t.MODELO_ID === p.MODELO_ID &&
      t.TIPO_PERMISSAO_RF === p.TIPO_PERMISSAO_RF &&
      t.UNIDADE_NEGOCIO_RF === p.UNIDADE_NEGOCIO_RF &&
      sobrepoe(p.DATA_INICIO, p.DATA_FIM, t.DATA_INICIO, t.DATA_FIM),
  ).length;
  if (n > 1)
    throw new AppError(
      422,
      'ORA_20XXX',
      `ORA-20001: Active permission already exists for user [${p.USERNAME}] model [${p.MODELO_ID}] type [${p.TIPO_PERMISSAO_RF}] unit [${p.UNIDADE_NEGOCIO_RF}]`,
      { oraCode: 'ORA-20001' },
    );
}

const REGISTO_ALTERADO = () =>
  new AppError(409, 'REGISTO_ALTERADO', 'O registo foi alterado por outro utilizador. Volte a consultar.');

export function memoryPermissoesRepo(
  seed: { perms: StoredPerm[]; modelos: Modelo[]; utilizadores: Utilizador[] },
  opts: { now?: () => string } = {},
): PermissoesRepo & { snapshot(): StoredPerm[] } {
  const clock = opts.now ?? localNow;
  let perms: StoredPerm[] = seed.perms.map((p) => ({ ...p }));
  const plain = ({ MODELO_ID, USERNAME, UNIDADE_NEGOCIO_RF, TIPO_PERMISSAO_RF, DATA_INICIO, DATA_FIM }: Perm): Perm => ({
    MODELO_ID,
    USERNAME,
    UNIDADE_NEGOCIO_RF,
    TIPO_PERMISSAO_RF,
    DATA_INICIO,
    DATA_FIM,
  });

  const tx = (rows: StoredPerm[]): PermissoesTx => ({
    now: async () => clock(),
    find: async (f) =>
      rows.filter((p) => FILTER_COLS.every((c) => f[c] === undefined || p[c] === f[c])).map(plain),
    sem: async (scope) => semPermissao(seed.modelos, seed.utilizadores, rows, scope, clock()),
    utilizadores: async (un) =>
      seed.utilizadores
        .filter((u) => un === undefined || u.UNIDADE_NEGOCIO_RF === un)
        .sort((a, b) => (a.USERNAME < b.USERNAME ? -1 : 1)),
    modelos: async () =>
      seed.modelos
        .filter((m) => validaHoje(m, clock()))
        .map(({ ID }) => ({ ID }))
        .sort((a, b) => (a.ID < b.ID ? -1 : 1)),
    async lock(key, orig) {
      const row = rows.find((p) => sameKey(p, key));
      if (!row || (orig && row.DATA_FIM !== orig.DATA_FIM)) throw REGISTO_ALTERADO();
    },
    async insert(p, criadoPor) {
      if (rows.some((r) => sameKey(r, p)))
        throw new AppError(409, 'ORA_00001', 'Já existe um registo com estes valores.');
      const row = { ...plain(p), CRIADO_POR: criadoPor, DATA_CRIACAO: clock(), ACTUALIZADO_POR: null, DATA_ACTUALIZACAO: null };
      rows.push(row);
      trgPreventDuplicatePerm(rows, row);
    },
    async update(key, set, actualizadoPor) {
      const row = rows.find((p) => sameKey(p, key));
      if (!row) return; // like an UPDATE matching 0 rows; the routes lock first
      Object.assign(row, set, { ACTUALIZADO_POR: actualizadoPor, DATA_ACTUALIZACAO: clock() });
      trgPreventDuplicatePerm(rows, row);
    },
  });

  return {
    read: (_user, _action, fn) => fn(tx(perms)),
    async write(_user, _action, fn) {
      const draft = perms.map((p) => ({ ...p }));
      const result = await fn(tx(draft));
      perms = draft;
      return result;
    },
    snapshot: () => perms.map((p) => ({ ...p })),
  };
}
