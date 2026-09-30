import { describe, expect, it } from 'vitest';
import { parseListQuery } from './listQuery.ts';

// List contract: ARCHITECTURE.md §4.1 (query by example, paging, sort).

describe('parseListQuery', () => {
  it('parses a column filter with an explicit operator', () => {
    const result = parseListQuery({ 'f[NOME][like]': 'ACME%' });
    expect(result.filters['NOME']).toEqual([{ op: 'like', value: 'ACME%' }]);
  });

  it('parses a bare column filter as eq', () => {
    const result = parseListQuery({ 'f[ID]': '42' });
    expect(result.filters['ID']).toEqual([{ op: 'eq', value: '42' }]);
  });

  it('parses a date range filter (from/to on the same column)', () => {
    const result = parseListQuery({
      'f[DATA_CRIACAO][from]': '2026-01-01',
      'f[DATA_CRIACAO][to]': '2026-01-31',
    });
    expect(result.filters['DATA_CRIACAO']).toEqual([
      { op: 'from', value: '2026-01-01' },
      { op: 'to', value: '2026-01-31' },
    ]);
  });

  it('parses null / notnull filters with no value', () => {
    const result = parseListQuery({ 'f[COMENTARIO][null]': '1' });
    expect(result.filters['COMENTARIO']).toEqual([{ op: 'null' }]);
  });

  it('parses preset and up to 3 sort keys', () => {
    const result = parseListQuery({ preset: 'todos', sort: 'NOME:asc,ID:desc' });
    expect(result.preset).toBe('todos');
    expect(result.sort).toEqual([
      { column: 'NOME', direction: 'asc' },
      { column: 'ID', direction: 'desc' },
    ]);
  });

  it('parses the Documentos search parameters: param[NOME] (repeatable), paramModelo, grupo', () => {
    const result = parseListQuery({
      'param[P_NMRECIBO]': '12%',
      'param[P_ANO]': ['2025', '2026'],
      paramModelo: 'R3%',
      grupo: '77',
    });
    expect(result.params).toEqual([
      { nome: 'P_NMRECIBO', valor: '12%' },
      { nome: 'P_ANO', valor: '2025' },
      { nome: 'P_ANO', valor: '2026' },
    ]);
    expect(result.paramModelo).toBe('R3%');
    expect(result.grupo).toBe('77');
    expect(result.filters).toEqual({});
  });

  it('leaves params, paramModelo and grupo out when absent', () => {
    const result = parseListQuery({ 'f[ID]': '1' });
    expect(result).not.toHaveProperty('params');
    expect(result).not.toHaveProperty('paramModelo');
    expect(result).not.toHaveProperty('grupo');
  });

  it('rejects a mangled param key', () => {
    expect(() => parseListQuery({ 'param[]': 'x' })).toThrow();
    expect(() => parseListQuery({ 'param[A][B]': 'x' })).toThrow();
  });

  it('rejects an unknown query shape: bad operator', () => {
    expect(() => parseListQuery({ 'f[NOME][bogus]': 'x' })).toThrow();
  });

  it('rejects an unknown query shape: extra bracket segment', () => {
    expect(() => parseListQuery({ 'f[NOME][like][x]': 'x' })).toThrow();
  });

  it('rejects more than 3 sort keys', () => {
    expect(() => parseListQuery({ sort: 'A:asc,B:asc,C:asc,D:asc' })).toThrow();
  });

  it('defaults page to 1 and size to 50 when absent', () => {
    const result = parseListQuery({});
    expect(result.page).toBe(1);
    expect(result.size).toBe(50);
  });

  it('clamps size to the 500 maximum', () => {
    const result = parseListQuery({ size: '9999' });
    expect(result.size).toBe(500);
  });

  it('falls back to the default size for a non-numeric size', () => {
    const result = parseListQuery({ size: 'abc' });
    expect(result.size).toBe(50);
  });
});

describe('in filter (multi-select domain filter)', () => {
  it('keeps every repeated f[COL][in] value', () => {
    const result = parseListQuery({ 'f[TIPO][in]': ['LASER', 'JACTO'] });
    expect(result.filters['TIPO']).toEqual([{ op: 'in', values: ['LASER', 'JACTO'] }]);
  });

  it('accepts a single f[COL][in] value', () => {
    const result = parseListQuery({ 'f[TIPO][in]': 'LASER' });
    expect(result.filters['TIPO']).toEqual([{ op: 'in', values: ['LASER'] }]);
  });
});

describe('toQueryString', () => {
  it('round-trips through parseListQuery', async () => {
    const { toQueryString } = await import('./listQuery.ts');
    const toSearchParams = (x: Parameters<typeof toQueryString>[0]) =>
      new URLSearchParams(toQueryString(x));
    const q = parseListQuery({
      'f[NOME][like]': 'HP%',
      'f[TIPO][in]': ['A', 'B'],
      'f[DATA][from]': '2026-01-01',
      'f[OBS][null]': '1',
      'param[P_ANO]': ['2025', '2026'],
      paramModelo: 'R3%',
      grupo: '9',
      sort: 'NOME:asc,ID:desc',
      page: '3',
      size: '25',
    });
    const back = parseListQuery(
      Object.fromEntries(
        [...new Set(toSearchParams(q).keys())].map((k) => {
          const all = toSearchParams(q).getAll(k);
          return [k, all.length > 1 ? all : (all[0] ?? '')];
        }),
      ),
    );
    expect(back).toEqual(q);
  });

  it('omits default page and size and empty sort', async () => {
    const { toQueryString } = await import('./listQuery.ts');
    expect(toQueryString(parseListQuery({}))).toBe('');
  });
});

describe('pagedResult', () => {
  it('builds the paged envelope and caps the total at 10000', async () => {
    const { pagedResult } = await import('./listQuery.ts');
    const result = pagedResult([1, 2, 3], 12000, 1, 50);
    expect(result).toEqual({ rows: [1, 2, 3], total: 10000, totalCapped: true, page: 1, size: 50 });
  });
});
