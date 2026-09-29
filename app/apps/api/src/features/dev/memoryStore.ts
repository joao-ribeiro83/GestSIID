import type { ListQuery, ListQueryFilter, Resource } from '@gestsiid/shared';
import { AppError } from '../../db/errors.ts';
import { SqlExpr, type CrudStore, type Row } from '../../lib/crud.ts';
import { buildListQuery } from '../../lib/listQuery.ts';

/**
 * In-memory {@link CrudStore} for the `/dev/datablock` demo (no Oracle). Same contract as the
 * Oracle store: validation reuses `buildListQuery` (so the same 400s), filters follow the SQL
 * semantics, `orig` must match the stored row (409 otherwise), SYSDATE becomes "now", a repeated
 * key is 409 ORA_00001. Write-only columns (`SqlCall` values included) are not kept at all.
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
  /** `dedupeKeys`: extra columns a clashing row must also share, beyond `tiebreak` (and the
   * parent scope) — for a flat resource whose real PK is composite and whose `tiebreak` is
   * just "the least-bad single column" (e.g. `impressoras-associadas-doc`'s PK is
   * `AMBIENTE_ID`/`MODELO_ID`/`IMPRESSORA_ID`/`DATA_INICIO`, `tiebreak` is only `DATA_INICIO`):
   * without this, copying a row's exact dates into a different `MODELO_ID` scope would falsely
   * 409 against the untouched source row, since `sameParent` is vacuously true with no
   * `parentKeys`. */
  opts: {
    autoId?: string;
    dedupeKeys?: readonly string[];
    /** JS twin of each `resource.presets` SQL fragment. */
    presets?: Record<string, (row: Row) => boolean>;
  } = {},
): CrudStore {
  let seq = 0;
  const secret = new Set(
    Object.entries(resource.columns)
      .filter(([, d]) => d.writeOnly)
      .map(([c]) => c),
  );
  const visible = (o: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(o).filter(([k]) => !secret.has(k)));
  const rows: Row[] = seed.map((r) => ({ ...visible(r), _rid: `m${++seq}` }));
  let nextId = Math.max(0, ...rows.map((r) => Number(opts.autoId ? r[opts.autoId] : 0) || 0)) + 1;

  const find = (rid: string) => rows.find((r) => r['_rid'] === rid);
  const presetOf = (name: string) => {
    const test = opts.presets?.[name];
    if (!test) throw new Error(`memoryStore: sem predicado para o preset ${name}`);
    return test;
  };
  // A detail resource's tiebreak (e.g. N_PARAMETRO) is only unique within its parent
  // (REPORT_ID); a master has no parentKeys, so this stays a global check for it.
  const sameParent = (r: Row, parent: Record<string, unknown>) =>
    (resource.parentKeys ?? []).every((k) => r[k] === parent[k]);
  const dedupeKeys = opts.dedupeKeys ?? [];
  const sameDedupeScope = (r: Row, owner: Record<string, unknown>) =>
    dedupeKeys.every((k) => r[k] === owner[k]);
  const resolve = (values: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(visible(values)).map(([k, v]) => [k, v instanceof SqlExpr ? now() : v]),
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
        .filter((r) => !resource.exclude?.values.includes(String(r[resource.exclude.column])))
        .filter((r) => q.preset === undefined || !resource.presets || presetOf(q.preset)(r))
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
      const key = values[resource.tiebreak];
      const owner = { ...parent, ...values };
      if (
        key != null &&
        rows.some(
          (r) => r[resource.tiebreak] === key && sameParent(r, parent) && sameDedupeScope(r, owner),
        )
      )
        throw new AppError(409, 'ORA_00001', 'Já existe um registo com estes valores.');
      const row: Row = Object.fromEntries(
        Object.keys(resource.columns)
          .filter((c) => !secret.has(c))
          .map((c) => [c, null]),
      );
      Object.assign(row, resolve(values), parent, { _rid: `m${++seq}` });
      if (opts.autoId) row[opts.autoId] = nextId++;
      rows.push(row);
      return { ...row };
    },

    async update(rid, orig, values) {
      const row = lock(rid, orig);
      const key = values[resource.tiebreak];
      if (
        key != null &&
        rows.some(
          (r) => r !== row && r[resource.tiebreak] === key && sameParent(r, row) && sameDedupeScope(r, row),
        )
      )
        throw new AppError(409, 'ORA_00001', 'Já existe um registo com estes valores.');
      Object.assign(row, resolve(values));
      return { ...row };
    },

    async remove(rid, orig) {
      rows.splice(rows.indexOf(lock(rid, orig)), 1);
    },
  };
}
