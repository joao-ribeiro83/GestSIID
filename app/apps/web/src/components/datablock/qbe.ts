import { pt, type ColumnDef, type ListQueryFilter, type ListQuerySort } from '@gestsiid/shared';

/**
 * Query by example (UI_SPEC §3.3): the text typed in a filter cell ↔ list-query filters. Pure.
 * text: exact, or `like` when it has `%`/`_` · code: exact · number: digits (`,` or `.`)
 * date: `DD-MM-AAAA` / `DDMMAAAA`, or a range `a..b` with either side open · any: IS [NOT] NULL.
 */

export type QbeResult = { filters: ListQueryFilter[] } | { error: string };

const DMY_RE = /^(\d{2})-?(\d{2})-?(\d{4})$/;

/** `DD-MM-AAAA` → `YYYY-MM-DD`, or null when it is not a real day. */
export function dmyToIso(text: string): string | null {
  const m = DMY_RE.exec(text.trim());
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(iso) ? iso : null;
}

/** `YYYY-MM-DD[T…]` → `DD-MM-AAAA`. */
export function isoToDmy(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}-${m}-${y}`;
}

export function parseFilterText(def: ColumnDef, raw: string): QbeResult {
  const text = raw.trim();
  if (text === '') return { filters: [] };
  if (/^is\s+null$/i.test(text)) return { filters: [{ op: 'null' }] };
  if (/^is\s+not\s+null$/i.test(text)) return { filters: [{ op: 'notnull' }] };

  switch (def.type) {
    case 'number':
      return /^-?\d+([.,]\d+)?$/.test(text)
        ? { filters: [{ op: 'eq', value: text.replace(',', '.') }] }
        : { error: pt.db.numeroInvalido };
    case 'date': {
      if (!text.includes('..')) {
        const day = dmyToIso(text);
        return day ? { filters: [{ op: 'eq', value: day }] } : { error: pt.db.dataInvalida };
      }
      const [fromText = '', toText = ''] = text.split('..');
      const filters: ListQueryFilter[] = [];
      for (const [op, part] of [
        ['from', fromText],
        ['to', toText],
      ] as const) {
        if (part.trim() === '') continue;
        const day = dmyToIso(part);
        if (!day) return { error: pt.db.dataInvalida };
        filters.push({ op, value: day });
      }
      return filters.length > 0 ? { filters } : { error: pt.db.dataInvalida };
    }
    case 'text':
      return {
        filters: [
          { op: /[%_]/.test(text) && def.filter?.includes('like') ? 'like' : 'eq', value: text },
        ],
      };
    case 'code':
      return { filters: [{ op: 'eq', value: text }] };
  }
}

/** Header sort (§3.5): click → only key (first key: toggle); shift+click → append/toggle, max 3. */
export function nextSort(
  cur: readonly ListQuerySort[],
  column: string,
  multi: boolean,
): ListQuerySort[] {
  const flip = (s: ListQuerySort): ListQuerySort => ({
    column: s.column,
    direction: s.direction === 'asc' ? 'desc' : 'asc',
  });
  const i = cur.findIndex((s) => s.column === column);
  if (!multi)
    return i === 0 ? cur.map((s, k) => (k === 0 ? flip(s) : s)) : [{ column, direction: 'asc' }];
  if (i >= 0) return cur.map((s, k) => (k === i ? flip(s) : s));
  return [...cur.slice(0, 2), { column, direction: 'asc' }];
}

/** Inverse of {@link parseFilterText}, to show the executed filter again. `in` has no text form. */
export function formatFilterText(filters: ListQueryFilter[] | undefined): string {
  if (!filters || filters.length === 0) return '';
  const from = filters.find((f) => f.op === 'from')?.value;
  const to = filters.find((f) => f.op === 'to')?.value;
  if (from !== undefined || to !== undefined) {
    return `${from ? isoToDmy(from) : ''}..${to ? isoToDmy(to) : ''}`;
  }
  const f = filters[0];
  if (!f) return '';
  if (f.op === 'null') return 'IS NULL';
  if (f.op === 'notnull') return 'IS NOT NULL';
  if (f.op === 'in') return '';
  const v = f.value ?? '';
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? isoToDmy(v) : v;
}
