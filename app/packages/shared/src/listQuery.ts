import { z } from 'zod';

/**
 * Parses and represents the GET /api/<resource> query-by-example contract
 * (ARCHITECTURE.md §4.1):
 *
 *   f[COL]=v            f[COL][like]=v        f[COL][from]=YYYY-MM-DD  f[COL][to]=YYYY-MM-DD
 *   f[COL][null]=1      f[COL][notnull]=1      preset=<name>
 *   sort=COL:asc,COL2:desc (up to 3 keys)      page=1                  size=50 (max 500)
 *
 * This module only parses the request shape into a typed object; building SQL from it is
 * `apps/api/src/db/listQuery.ts`'s job (it also knows the resource's declared columns, so it
 * is the layer that turns an unknown *column* into a 400 VALIDACAO). Bracket keys are parsed
 * here by hand (D-01 rejected `qs`): Fastify's default querystring parser hands us a flat
 * `{ "f[COL][like]": "v" }` object, not a nested one.
 */

export const FILTER_OPS = ['eq', 'like', 'from', 'to', 'null', 'notnull', 'in'] as const;
export type FilterOp = (typeof FILTER_OPS)[number];

/** `in` (repeated `f[COL][in]=v`) carries `values`; `null`/`notnull` carry nothing; the rest `value`. */
export interface ListQueryFilter {
  op: FilterOp;
  value?: string;
  values?: string[];
}

export interface ListQuerySort {
  column: string;
  direction: 'asc' | 'desc';
}

export interface ListQuery {
  filters: Record<string, ListQueryFilter[]>;
  preset?: string;
  sort: ListQuerySort[];
  page: number;
  size: number;
}

export interface PagedResult<Row> {
  rows: Row[];
  total: number;
  totalCapped: boolean;
  page: number;
  size: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 50;
const MAX_SIZE = 500;
const MAX_SORT_KEYS = 3;
const COUNT_CAP = 10_000;

const FILTER_KEY_RE = /^f\[([^[\]]+)\](?:\[([^[\]]+)\])?$/;
const SORT_ENTRY_RE = /^([A-Za-z0-9_]+):(asc|desc)$/;
const RESERVED_KEYS = new Set(['preset', 'sort', 'page', 'size']);

const rawQuerySchema = z.record(z.string(), z.union([z.string(), z.array(z.string())]));

function firstValue(v: string | string[]): string {
  return Array.isArray(v) ? (v[0] ?? '') : v;
}

function positiveIntOrDefault(raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.trunc(n) : fallback;
}

/** Parses a flat query-string object into a typed {@link ListQuery}. Throws on a malformed
 * key or value shape — an unrecognized filter operator, a mangled bracket key, an invalid sort
 * entry, or more than 3 sort keys (ARCHITECTURE.md §4.1: "never ignored"). */
export function parseListQuery(raw: unknown): ListQuery {
  const query = rawQuerySchema.parse(raw);

  // No prototype: a `f[__proto__]` key must stay a plain (unknown, rejected later) column name.
  const filters: Record<string, ListQueryFilter[]> = Object.create(null);
  for (const [key, rawValue] of Object.entries(query)) {
    if (RESERVED_KEYS.has(key)) continue;

    const match = FILTER_KEY_RE.exec(key);
    if (!match) {
      throw new Error(`Forma de pedido desconhecida: ${key}`);
    }
    const column = match[1];
    if (!column) {
      throw new Error(`Forma de pedido desconhecida: ${key}`);
    }
    const opToken = match[2];
    const op = (opToken ?? 'eq') as FilterOp;
    if (!FILTER_OPS.includes(op)) {
      throw new Error(`Operador de filtro desconhecido: ${String(opToken)}`);
    }

    const filter: ListQueryFilter =
      op === 'in'
        ? { op, values: Array.isArray(rawValue) ? rawValue : [rawValue] }
        : op === 'null' || op === 'notnull'
          ? { op }
          : { op, value: firstValue(rawValue) };
    const existing = filters[column] ?? [];
    existing.push(filter);
    filters[column] = existing;
  }

  const sort: ListQuerySort[] = [];
  const sortRaw = query['sort'];
  if (sortRaw !== undefined) {
    const parts = firstValue(sortRaw)
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parts.length > MAX_SORT_KEYS) {
      throw new Error('Demasiadas chaves de ordenação (máximo 3).');
    }
    for (const part of parts) {
      const m = SORT_ENTRY_RE.exec(part);
      const column = m?.[1];
      const direction = m?.[2];
      if (!column || (direction !== 'asc' && direction !== 'desc')) {
        throw new Error(`Ordenação inválida: ${part}`);
      }
      sort.push({ column, direction });
    }
  }

  const preset = query['preset'] !== undefined ? firstValue(query['preset']) : undefined;
  const page = positiveIntOrDefault(
    query['page'] !== undefined ? firstValue(query['page']) : undefined,
    DEFAULT_PAGE,
  );
  const requestedSize = positiveIntOrDefault(
    query['size'] !== undefined ? firstValue(query['size']) : undefined,
    DEFAULT_SIZE,
  );
  const size = Math.min(requestedSize, MAX_SIZE);

  return { filters, preset, sort, page, size };
}

/** Inverse of {@link parseListQuery}: the list request's query string (without `?`).
 * Default page/size and an empty sort are left out. */
export function toQueryString(q: ListQuery): string {
  const pairs: string[] = [];
  const params = {
    append: (k: string, v: string) =>
      pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`),
  };
  for (const [column, filters] of Object.entries(q.filters)) {
    for (const f of filters) {
      const key = f.op === 'eq' ? `f[${column}]` : `f[${column}][${f.op}]`;
      if (f.op === 'in') for (const v of f.values ?? []) params.append(key, v);
      else params.append(key, f.op === 'null' || f.op === 'notnull' ? '1' : (f.value ?? ''));
    }
  }
  if (q.preset !== undefined) params.append('preset', q.preset);
  if (q.sort.length > 0)
    params.append('sort', q.sort.map((s) => `${s.column}:${s.direction}`).join(','));
  if (q.page !== DEFAULT_PAGE) params.append('page', String(q.page));
  if (q.size !== DEFAULT_SIZE) params.append('size', String(q.size));
  return pairs.join('&');
}

/** Builds the `{ rows, total, totalCapped, page, size }` envelope every list route returns,
 * applying the 10 000-row count cap (ARCHITECTURE.md §4.1). */
export function pagedResult<Row>(
  rows: Row[],
  total: number,
  page: number,
  size: number,
): PagedResult<Row> {
  return {
    rows,
    total: Math.min(total, COUNT_CAP),
    totalCapped: total > COUNT_CAP,
    page,
    size,
  };
}
