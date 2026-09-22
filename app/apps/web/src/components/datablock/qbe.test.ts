import { describe, expect, it } from 'vitest';
import type { ColumnDef } from '@gestsiid/shared';
import { formatFilterText, nextSort, parseFilterText } from './qbe';

// UI_SPEC §3.3: typed filter text → list-query filters, and back.

const text: ColumnDef = { type: 'text', label: 'Nome', filter: ['eq', 'like', 'null', 'notnull'] };
const code: ColumnDef = { type: 'code', label: 'Código', filter: ['eq', 'in'] };
const num: ColumnDef = { type: 'number', label: 'Id', filter: ['eq'] };
const date: ColumnDef = { type: 'date', label: 'Data', filter: ['eq', 'from', 'to'] };

describe('parseFilterText', () => {
  it('empty text means no filter', () => {
    expect(parseFilterText(text, '   ')).toEqual({ filters: [] });
  });

  it('text: plain value is exact, % or _ switch to like', () => {
    expect(parseFilterText(text, 'HP')).toEqual({ filters: [{ op: 'eq', value: 'HP' }] });
    expect(parseFilterText(text, 'HP%')).toEqual({ filters: [{ op: 'like', value: 'HP%' }] });
    expect(parseFilterText(text, 'H_')).toEqual({ filters: [{ op: 'like', value: 'H_' }] });
  });

  it('code: always exact, even with %', () => {
    expect(parseFilterText(code, 'A%')).toEqual({ filters: [{ op: 'eq', value: 'A%' }] });
  });

  it('IS NULL / IS NOT NULL in any case', () => {
    expect(parseFilterText(text, ' is null ')).toEqual({ filters: [{ op: 'null' }] });
    expect(parseFilterText(text, 'IS NOT NULL')).toEqual({ filters: [{ op: 'notnull' }] });
  });

  it('number: digits with , or . decimal; anything else is an error', () => {
    expect(parseFilterText(num, '42')).toEqual({ filters: [{ op: 'eq', value: '42' }] });
    expect(parseFilterText(num, '4,5')).toEqual({ filters: [{ op: 'eq', value: '4.5' }] });
    expect(parseFilterText(num, '4x')).toEqual({ error: 'Valor numérico inválido.' });
  });

  it('date: DD-MM-AAAA or DDMMAAAA is one whole day', () => {
    expect(parseFilterText(date, '15-09-2026')).toEqual({
      filters: [{ op: 'eq', value: '2026-09-15' }],
    });
    expect(parseFilterText(date, '15092026')).toEqual({
      filters: [{ op: 'eq', value: '2026-09-15' }],
    });
  });

  it('date: ranges with either side open', () => {
    expect(parseFilterText(date, '01-09-2026..30-09-2026')).toEqual({
      filters: [
        { op: 'from', value: '2026-09-01' },
        { op: 'to', value: '2026-09-30' },
      ],
    });
    expect(parseFilterText(date, '01-09-2026..')).toEqual({
      filters: [{ op: 'from', value: '2026-09-01' }],
    });
    expect(parseFilterText(date, '..30-09-2026')).toEqual({
      filters: [{ op: 'to', value: '2026-09-30' }],
    });
  });

  it('date: impossible or malformed dates are an error', () => {
    expect(parseFilterText(date, '31-02-2026')).toEqual({
      error: 'Data inválida. Use DD-MM-AAAA.',
    });
    expect(parseFilterText(date, '2026-09-01')).toEqual({
      error: 'Data inválida. Use DD-MM-AAAA.',
    });
    expect(parseFilterText(date, '..')).toEqual({ error: 'Data inválida. Use DD-MM-AAAA.' });
  });
});

describe('nextSort (UI_SPEC §3.5)', () => {
  const s = (column: string, direction: 'asc' | 'desc' = 'asc') => ({ column, direction });

  it('click on another column → it becomes the only key, ascending', () => {
    expect(nextSort([s('A'), s('B')], 'C', false)).toEqual([s('C')]);
    expect(nextSort([s('A'), s('B')], 'B', false)).toEqual([s('B')]);
  });
  it('click on the first key → toggles its direction, keeps the others', () => {
    expect(nextSort([s('A'), s('B')], 'A', false)).toEqual([s('A', 'desc'), s('B')]);
  });
  it('shift+click appends, toggles an existing key, and a 4th replaces the 3rd', () => {
    expect(nextSort([s('A')], 'B', true)).toEqual([s('A'), s('B')]);
    expect(nextSort([s('A'), s('B')], 'B', true)).toEqual([s('A'), s('B', 'desc')]);
    expect(nextSort([s('A'), s('B'), s('C')], 'D', true)).toEqual([s('A'), s('B'), s('D')]);
  });
});

describe('formatFilterText', () => {
  it('is the inverse of parseFilterText', () => {
    for (const [def, t] of [
      [text, 'HP%'],
      [text, 'IS NULL'],
      [text, 'IS NOT NULL'],
      [num, '4.5'],
      [date, '15-09-2026'],
      [date, '01-09-2026..30-09-2026'],
      [date, '..30-09-2026'],
    ] as const) {
      const parsed = parseFilterText(def, t);
      expect('filters' in parsed && formatFilterText(parsed.filters)).toBe(t);
    }
  });

  it('no filters → empty text', () => {
    expect(formatFilterText(undefined)).toBe('');
  });
});
