import type { ColumnDef, ListQuery, ListQueryFilter, Resource } from '@gestsiid/shared';
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

/** WHERE clause (without the keyword) + binds; also used to resolve a `consulta` selection. */
export function buildWhere(
  resource: Resource,
  q: Pick<ListQuery, 'filters'>,
  parent: Record<string, string | number> = {},
): BuiltSql {
  const binds: Record<string, unknown> = {};
  const parts: string[] = [];

  // Parent keys first; names come from the resource, values are binds.
  (resource.parentKeys ?? []).forEach((column, i) => {
    if (!Object.hasOwn(parent, column))
      throw invalid(column, 'Chave do registo principal em falta.');
    binds[`p${i}`] = parent[column];
    parts.push(`${column} = :p${i}`);
  });

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

  return { sql: parts.join(' AND '), binds };
}

function orderBy(resource: Resource, q: ListQuery): string {
  for (const s of q.sort) {
    if (!Object.hasOwn(resource.columns, s.column) || !resource.columns[s.column]?.sort) {
      throw invalid('sort', `Ordenação não permitida: ${s.column}`);
    }
  }
  const keys = q.sort.length > 0 ? q.sort : resource.defaultSort;
  const terms = keys.map((s) => `${s.column} ${s.direction === 'desc' ? 'DESC' : 'ASC'}`);
  if (!keys.some((s) => s.column === resource.tiebreak)) terms.push(`${resource.tiebreak} ASC`);
  return terms.join(', ');
}

export function selectList(resource: Resource): string {
  const cols = Object.entries(resource.columns).map(([c, def]) =>
    def.type === 'date' ? `${dateSelect(c)} AS ${c}` : c,
  );
  if (resource.roles.write.length > 0) cols.push('ROWIDTOCHAR(ROWID) AS "_rid"');
  return cols.join(', ');
}

export function buildListQuery(
  resource: Resource,
  q: ListQuery,
  opts: { parent?: Record<string, string | number> } = {},
): ListSql {
  const where = buildWhere(resource, q, opts.parent);
  const whereSql = where.sql ? ` WHERE ${where.sql}` : '';
  return {
    list: {
      sql:
        `SELECT ${selectList(resource)} FROM ${resource.source}${whereSql} ORDER BY ${orderBy(resource, q)} ` +
        'OFFSET :offset ROWS FETCH NEXT :size ROWS ONLY',
      binds: { ...where.binds, offset: (q.page - 1) * q.size, size: q.size },
    },
    count: {
      sql: `SELECT COUNT(*) AS N FROM (SELECT 1 FROM ${resource.source}${whereSql} FETCH FIRST ${COUNT_LIMIT} ROWS ONLY)`,
      binds: where.binds,
    },
  };
}

// ROWID is base64-ish ([A-Za-z0-9+/]); `+` → `-` and `/` → `_` makes it safe in a URL segment (§4.1).
const RID_RE = /^[A-Za-z0-9_-]{10,}$/;

export const encodeRid = (rowid: string) => rowid.replace(/\+/g, '-').replace(/\//g, '_');

export function decodeRid(rid: string): string {
  if (!RID_RE.test(rid)) throw new AppError(404, 'NAO_ENCONTRADO', 'Registo não encontrado.');
  return rid.replace(/-/g, '+').replace(/_/g, '/');
}
