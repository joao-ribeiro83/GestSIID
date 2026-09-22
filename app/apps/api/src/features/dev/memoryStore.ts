import type { ListQuery, ListQueryFilter, Resource } from '@gestsiid/shared';
import { AppError } from '../../db/errors.ts';
import { SqlExpr, type CrudStore, type Row } from '../../lib/crud.ts';
import { buildListQuery } from '../../lib/listQuery.ts';

/**
 * In-memory {@link CrudStore} for the `/dev/datablock` demo (no Oracle). Same contract as the
 * Oracle store: validation reuses `buildListQuery` (so the same 400s), filters follow the SQL
 * semantics, `orig` must match the stored row (409 otherwise), SYSDATE becomes "now".
 * ponytail: O(n) scans over a plain array; fine for a few hundred demo rows.
 */

const now = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

function likeRegex(pattern: string): RegExp {
  let re = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i] ?? '';
    if (ch === '\\' && i + 1 < pattern.length)
      re += (pattern[++i] ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    else if (ch === '%') re += '.*';
    else if (ch === '_') re += '.';
    else re += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`, 'is');
}

function matches(v: unknown, f: ListQueryFilter, type: string): boolean {
  if (f.op === 'null') return v == null;
  if (f.op === 'notnull') return v != null;
  if (v == null) return false;
  const conv = (x: string) => (type === 'number' ? Number(x.replace(',', '.')) : x);
  switch (f.op) {
    case 'like':
      return likeRegex(f.value ?? '').test(String(v));
    case 'in':
      return (f.values ?? []).map(conv).includes(v as never);
    case 'from':
      return String(v).slice(0, 10) >= (f.value ?? '');
    case 'to':
      return String(v).slice(0, 10) <= (f.value ?? '');
    case 'eq':
      return type === 'date' ? String(v).slice(0, 10) === f.value : v === conv(f.value ?? '');
  }
}

// Oracle: NULLs sort last ascending, first descending.
function compare(a: unknown, b: unknown): number {
  if (a == null || b == null) return a == null ? (b == null ? 0 : 1) : -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'pt');
}

export function memoryStore(
  resource: Resource,
  seed: Row[],
  opts: { autoId?: string } = {},
): CrudStore {
  let seq = 0;
  const rows: Row[] = seed.map((r) => ({ ...r, _rid: `m${++seq}` }));
  let nextId = Math.max(0, ...rows.map((r) => Number(opts.autoId ? r[opts.autoId] : 0) || 0)) + 1;

  const find = (rid: string) => rows.find((r) => r['_rid'] === rid);
  const resolve = (values: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, v instanceof SqlExpr ? now() : v]),
    );
  const lock = (rid: string, orig: Record<string, unknown>) => {
    const row = find(rid);
    if (!row || Object.entries(orig).some(([k, v]) => (row[k] ?? null) !== (v ?? null))) {
      throw new AppError(
        409,
        'REGISTO_ALTERADO',
        'O registo foi alterado por outro utilizador. Volte a consultar.',
      );
    }
    return row;
  };

  return {
    async list(q: ListQuery, parent) {
      buildListQuery(resource, q, { parent }); // same allow-list and value checks as the SQL
      const keys = [
        ...(q.sort.length > 0 ? q.sort : resource.defaultSort),
        { column: resource.tiebreak, direction: 'asc' as const },
      ];
      const hit = rows
        .filter((r) => Object.entries(parent).every(([k, v]) => r[k] === v))
        .filter((r) =>
          Object.entries(q.filters).every(([c, fs]) =>
            fs.every((f) => matches(r[c], f, resource.columns[c]?.type ?? 'text')),
          ),
        )
        .sort((a, b) => {
          for (const k of keys) {
            const c = compare(a[k.column], b[k.column]);
            if (c !== 0) return k.direction === 'desc' ? -c : c;
          }
          return 0;
        });
      const start = (q.page - 1) * q.size;
      return { rows: hit.slice(start, start + q.size).map((r) => ({ ...r })), total: hit.length };
    },

    async get(rid) {
      const row = find(rid);
      return row && { ...row };
    },

    async insert(values, parent) {
      const row: Row = Object.fromEntries(Object.keys(resource.columns).map((c) => [c, null]));
      Object.assign(row, resolve(values), parent, { _rid: `m${++seq}` });
      if (opts.autoId) row[opts.autoId] = nextId++;
      rows.push(row);
      return { ...row };
    },

    async update(rid, orig, values) {
      const row = lock(rid, orig);
      Object.assign(row, resolve(values));
      return { ...row };
    },

    async remove(rid, orig) {
      rows.splice(rows.indexOf(lock(rid, orig)), 1);
    },
  };
}
