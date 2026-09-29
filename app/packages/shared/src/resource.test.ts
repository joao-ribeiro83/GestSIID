import { describe, expect, it } from 'vitest';
import { defineResource, origSchema, valuesSchema } from './resource.ts';

const impressoras = defineResource({
  name: 'impressoras',
  source: 'CFG_IMPRESSORAS',
  columns: {
    ID: { type: 'number', label: 'Id', filter: ['eq'], sort: true },
    NOME: {
      type: 'text',
      label: 'Nome',
      filter: ['eq', 'like'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 10,
    },
    CODIGO: { type: 'code', label: 'Código', filter: ['eq', 'in'], edit: true, insertOnly: true },
    PAGINAS: { type: 'number', label: 'Páginas', edit: true },
    DATA_INICIO: { type: 'date', label: 'Data Início', filter: ['eq', 'from', 'to'], edit: true },
    CRIADO_POR: { type: 'text', label: 'Criado Por' },
  },
  defaultSort: [{ column: 'NOME', direction: 'asc' }],
  tiebreak: 'ID',
  roles: { read: ['ADM', 'USER'], write: ['ADM'] },
});

describe('defineResource', () => {
  it('rejects a column name that is not a plain Oracle identifier', () => {
    expect(() =>
      defineResource({ ...impressoras, columns: { 'NOME; DROP': { type: 'text', label: 'x' } } }),
    ).toThrow(/identificador/i);
  });

  it('rejects a source that is not a plain identifier', () => {
    expect(() => defineResource({ ...impressoras, source: 'T WHERE 1=1' })).toThrow(
      /identificador/i,
    );
  });
});

describe('valuesSchema', () => {
  it('insert: accepts edit + insertOnly columns and requires the required ones', () => {
    const s = valuesSchema(impressoras, 'insert');
    expect(s.parse({ NOME: 'HP', CODIGO: 'X1' })).toEqual({ NOME: 'HP', CODIGO: 'X1' });
    expect(() => s.parse({ CODIGO: 'X1' })).toThrow();
  });

  it('rejects columns the client may not write (audit columns, read-only ids)', () => {
    const s = valuesSchema(impressoras, 'insert');
    expect(() => s.parse({ NOME: 'HP', CRIADO_POR: 'EU' })).toThrow();
    expect(() => s.parse({ NOME: 'HP', ID: 3 })).toThrow();
  });

  it('update: partial, and insertOnly columns are not updatable', () => {
    const s = valuesSchema(impressoras, 'update');
    expect(s.parse({ PAGINAS: 5 })).toEqual({ PAGINAS: 5 });
    expect(() => s.parse({ CODIGO: 'X2' })).toThrow();
  });

  it('checks types, max length and date shape', () => {
    const s = valuesSchema(impressoras, 'update');
    expect(() => s.parse({ NOME: 'x'.repeat(11) })).toThrow();
    expect(() => s.parse({ PAGINAS: '5' })).toThrow();
    expect(() => s.parse({ DATA_INICIO: '01-02-2026' })).toThrow();
    expect(s.parse({ DATA_INICIO: '2026-02-01T00:00:00', PAGINAS: null })).toEqual({
      DATA_INICIO: '2026-02-01T00:00:00',
      PAGINAS: null,
    });
  });

  it('a required text column rejects the empty string', () => {
    expect(() => valuesSchema(impressoras, 'update').parse({ NOME: '' })).toThrow();
  });
});

describe('origSchema', () => {
  it('accepts any known column and rejects unknown ones', () => {
    const s = origSchema(impressoras);
    expect(s.parse({ NOME: 'HP', CRIADO_POR: null })).toEqual({ NOME: 'HP', CRIADO_POR: null });
    expect(() => s.parse({ 'ID) OR (1': 1 })).toThrow();
  });
});

describe('writeOnly columns (a secret the client may send but never read back)', () => {
  const users = defineResource({
    name: 'utilizadores',
    source: 'CFG_UTILIZADORES',
    columns: {
      USERNAME: { type: 'code', label: 'Utilizador', insertOnly: true, required: true },
      PASSWORD: { type: 'text', label: 'Password', edit: true, required: true, writeOnly: true },
    },
    defaultSort: [{ column: 'USERNAME', direction: 'asc' }],
    tiebreak: 'USERNAME',
    roles: { read: ['ADM'], write: ['ADM'] },
  });

  it('valuesSchema accepts it: required on insert, optional on update', () => {
    expect(valuesSchema(users, 'insert').parse({ USERNAME: 'A', PASSWORD: 'x' })).toEqual({
      USERNAME: 'A',
      PASSWORD: 'x',
    });
    expect(() => valuesSchema(users, 'insert').parse({ USERNAME: 'A' })).toThrow();
    expect(valuesSchema(users, 'update').parse({})).toEqual({});
    expect(valuesSchema(users, 'update').parse({ PASSWORD: 'y' })).toEqual({ PASSWORD: 'y' });
  });

  it('origSchema rejects it, so a client cannot probe the stored value through the lock check', () => {
    expect(origSchema(users).safeParse({ USERNAME: 'A' }).success).toBe(true);
    expect(origSchema(users).safeParse({ PASSWORD: 'x' }).success).toBe(false);
  });
});

describe('expr columns (read-only, computed in SQL)', () => {
  const seccoes = defineResource({
    name: 'seccoes',
    source: 'DOC_SECCOES_DOCUMENTO',
    columns: {
      ALINEA: { type: 'number', label: 'Alínea', insertOnly: true },
      TIPO_IMAGEM: { type: 'code', label: 'Tipo', expr: "DECODE(1, 1, 'PNG')" },
    },
    defaultSort: [{ column: 'ALINEA', direction: 'asc' }],
    tiebreak: 'ALINEA',
    roles: { read: ['ADM'], write: ['ADM'] },
  });

  it('origSchema rejects it: the lock check would name a column the table does not have', () => {
    expect(origSchema(seccoes).safeParse({ ALINEA: 1 }).success).toBe(true);
    expect(origSchema(seccoes).safeParse({ TIPO_IMAGEM: 'PNG' }).success).toBe(false);
  });
});
