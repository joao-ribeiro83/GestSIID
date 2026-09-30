import type { ColumnDef, ListQuery, ListQueryFilter, Resource, Role } from '@gestsiid/shared';
import { AppError } from '../db/errors.ts';

/**
 * List SQL for a resource (ARCHITECTURE.md §4.1). Every identifier in the SQL text comes from the
 * resource definition (checked by `defineResource`); every value from the request is a bind. A
 * filter or sort on a column the resource does not allow is a 400 VALIDACAO, never ignored.
 */

export interface BuiltSql {
  sql: string;
  binds: Record<string, unknown>;
}

export interface ListSql {
  list: BuiltSql;
  count: BuiltSql;
}

const COUNT_LIMIT = 10_001;
const MAX_IN_VALUES = 1000; // Oracle's IN-list limit.
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export const dateSelect = (column: string) => `TO_CHAR(${column},'YYYY-MM-DD"T"HH24:MI:SS')`;

function invalid(field: string, message: string): AppError {
  return new AppError(400, 'VALIDACAO', 'Dados inválidos.', { fields: { [field]: message } });
}

function isRealDay(v: string): boolean {
  if (!DAY_RE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
}

/** Converts a filter value to the bind type of its column, or throws a 400 for `field`. */
export function bindValue(def: ColumnDef, raw: string, field: string): string | number {
  if (def.type === 'number') {
    const n = Number(raw.replace(',', '.'));
    if (raw.trim() === '' || !Number.isFinite(n)) throw invalid(field, 'Valor numérico inválido.');
    return n;
  }
  if (def.type === 'date' && !isRealDay(raw)) throw invalid(field, 'Data inválida.');
  return raw;
}

/** `col = :b` style conditions for one column's filters. `bind` allocates a fresh bind name. */
function conditions(
  column: string,
  def: ColumnDef,
  f: ListQueryFilter,
  bind: (v: unknown) => string,
): string {
  const field = f.op === 'eq' ? `f[${column}]` : `f[${column}][${f.op}]`;
  if (!def.filter?.includes(f.op)) throw invalid(field, 'Filtro não permitido.');

  switch (f.op) {
    case 'null':
      return `${column} IS NULL`;
    case 'notnull':
      return `${column} IS NOT NULL`;
    case 'in': {
      const values = f.values ?? [];
      if (values.length === 0 || values.length > MAX_IN_VALUES)
        throw invalid(field, 'Lista de valores inválida.');
      return `${column} IN (${values.map((v) => bind(bindValue(def, v, field))).join(', ')})`;
    }
    case 'like':
      return `UPPER(${column}) LIKE UPPER(${bind(f.value ?? '')}) ESCAPE '\\'`;
    case 'from':
      return `${column} >= TO_DATE(${bind(bindValue(def, f.value ?? '', field))},'YYYY-MM-DD')`;
    case 'to':
      return `${column} < TO_DATE(${bind(bindValue(def, f.value ?? '', field))},'YYYY-MM-DD') + 1`;
    case 'eq': {
      const b = bind(bindValue(def, f.value ?? '', field));
      return def.type === 'date'
        ? `${column} >= TO_DATE(${b},'YYYY-MM-DD') AND ${column} < TO_DATE(${b},'YYYY-MM-DD') + 1`
        : `${column} = ${b}`;
    }
  }
}

/** WHERE clause (without the keyword) + binds; also used to resolve a `consulta` selection.
 * `extra`: the caller's own condition for `param` / `paramModelo` / `grupo` (only the Documentos
 * feature builds one); those parameters without it are a 400, never ignored. Its bind names must
 * not start with `w`, `p` or `x`. */
export function buildWhere(
  resource: Resource,
  q: Pick<ListQuery, 'filters' | 'preset' | 'params' | 'paramModelo' | 'grupo'>,
  parent: Record<string, string | number> = {},
  extra?: BuiltSql,
): BuiltSql {
  const binds: Record<string, unknown> = {};
  const parts: string[] = [];

  if (!extra && (q.params || q.paramModelo !== undefined || q.grupo !== undefined))
    throw invalid('query', 'Parâmetro de pesquisa não suportado nesta lista.');

  // Server-side text from the resource, picked by name only; ignored on resources without presets.
  if (resource.presets && q.preset !== undefined) {
    const sql = Object.hasOwn(resource.presets, q.preset) ? resource.presets[q.preset] : undefined;
    if (!sql) throw invalid('preset', 'Filtro predefinido desconhecido.');
    parts.push(`(${sql})`);
  }

  // Parent keys first; names come from the resource, values are binds.
  (resource.parentKeys ?? []).forEach((column, i) => {
    if (!Object.hasOwn(parent, column))
      throw invalid(column, 'Chave do registo principal em falta.');
    binds[`p${i}`] = parent[column];
    parts.push(`${column} = :p${i}`);
  });

  const { exclude } = resource;
  if (exclude && exclude.values.length > 0) {
    const names = exclude.values.map((value, i) => ((binds[`x${i}`] = value), `:x${i}`));
    parts.push(`${exclude.column} NOT IN (${names.join(', ')})`);
  }

  for (const key of Object.keys(q.filters)) {
    if (!Object.hasOwn(resource.columns, key)) throw invalid(`f[${key}]`, 'Coluna desconhecida.');
  }

  let n = 0;
  const bind = (v: unknown) => {
    const name = `w${n++}`;
    binds[name] = v;
    return `:${name}`;
  };
  for (const [column, def] of Object.entries(resource.columns)) {
    for (const f of q.filters[column] ?? []) parts.push(conditions(column, def, f, bind));
  }

  if (extra) {
    parts.push(`(${extra.sql})`);
    Object.assign(binds, extra.binds);
  }

  return { sql: parts.join(' AND '), binds };
}

function orderBy(resource: Resource, q: ListQuery, role?: Role): string {
  const aliases = resource.sortAliases ?? {};
  const forRole = role ? resource.sortRoles?.[role] : undefined;
  for (const s of q.sort) {
    const isColumn = Object.hasOwn(resource.columns, s.column) && resource.columns[s.column]?.sort;
    if ((!isColumn && !Object.hasOwn(aliases, s.column)) || (forRole && !forRole.includes(s.column))) {
      throw invalid('sort', `Ordenação não permitida: ${s.column}`);
    }
  }
  const keys = q.sort.length > 0 ? q.sort : resource.defaultSort;
  const terms = keys.flatMap((s) => {
    const dir = s.direction === 'desc' ? 'DESC' : 'ASC';
    const cols = Object.hasOwn(aliases, s.column) ? (aliases[s.column] ?? []) : [s.column];
    return cols.map((c) => `${c} ${dir}`);
  });
  if (!keys.some((s) => s.column === resource.tiebreak)) terms.push(`${resource.tiebreak} ASC`);
  return terms.join(', ');
}

export function selectList(resource: Resource): string {
  const cols = Object.entries(resource.columns)
    .filter(([, def]) => !def.writeOnly)
    .map(([c, def]) =>
      def.expr ? `(${def.expr}) AS ${c}` : def.type === 'date' ? `${dateSelect(c)} AS ${c}` : c,
    );
  // CAST, not ROWIDTOCHAR: index-organized tables (DOC_MODELOS_DOCUMENTO) have a logical UROWID.
  if (resource.roles.write.length > 0) cols.push('CAST(ROWID AS VARCHAR2(4000)) AS "_rid"');
  return cols.join(', ');
}

export function buildListQuery(
  resource: Resource,
  q: ListQuery,
  opts: { parent?: Record<string, string | number>; role?: Role; extra?: BuiltSql } = {},
): ListSql {
  const where = buildWhere(resource, q, opts.parent, opts.extra);
  const whereSql = where.sql ? ` WHERE ${where.sql}` : '';
  return {
    list: {
      sql:
        `SELECT ${selectList(resource)} FROM ${resource.source}${whereSql} ORDER BY ${orderBy(resource, q, opts.role)} ` +
        'OFFSET :skip ROWS FETCH NEXT :take ROWS ONLY',
      binds: { ...where.binds, skip: (q.page - 1) * q.size, take: q.size },
    },
    count: {
      sql: `SELECT COUNT(*) AS N FROM (SELECT 1 FROM ${resource.source}${whereSql} FETCH FIRST ${COUNT_LIMIT} ROWS ONLY)`,
      binds: where.binds,
    },
  };
}

// ROWID is base64-ish ([A-Za-z0-9+/]); `+` → `-` and `/` → `_` makes it safe in a URL segment (§4.1).
// A logical ROWID (index-organized table) starts with `*`, also URL-safe.
const RID_RE = /^\*?[A-Za-z0-9_-]{10,}$/;

export const encodeRid = (rowid: string) => rowid.replace(/\+/g, '-').replace(/\//g, '_');

export function decodeRid(rid: string): string {
  if (!RID_RE.test(rid)) throw new AppError(404, 'NAO_ENCONTRADO', 'Registo não encontrado.');
  return rid.replace(/-/g, '+').replace(/_/g, '/');
}
