import { defineResource, parseListQuery } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import { AppError } from '../db/errors.ts';
import { buildListQuery, decodeRid, encodeRid } from './listQuery.ts';

const res = defineResource({
  name: 'impressoras',
  source: 'CFG_IMPRESSORAS',
  columns: {
    ID: { type: 'number', label: 'Id', filter: ['eq', 'in'], sort: true },
    DOMINIO_ID: { type: 'code', label: 'Domínio' },
    NOME: {
      type: 'text',
      label: 'Nome',
      filter: ['eq', 'like', 'null', 'notnull'],
      sort: true,
      edit: true,
    },
    TIPO: { type: 'code', label: 'Tipo', filter: ['eq', 'in'] },
    DATA_INICIO: { type: 'date', label: 'Data Início', filter: ['eq', 'from', 'to'], sort: true },
    OBS: { type: 'text', label: 'Obs' },
  },
  defaultSort: [{ column: 'NOME', direction: 'asc' }],
  tiebreak: 'ID',
  roles: { read: ['ADM', 'USER'], write: ['ADM'] },
});

const detail = defineResource({ ...res, parentKeys: ['DOMINIO_ID'] });

const build = (raw: Record<string, string | string[]>, parent?: Record<string, string | number>) =>
  parent
    ? buildListQuery(detail, parseListQuery(raw), { parent })
    : buildListQuery(res, parseListQuery(raw));

function validationError(fn: () => unknown): AppError {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(AppError);
    expect((e as AppError).statusCode).toBe(400);
    expect((e as AppError).code).toBe('VALIDACAO');
    return e as AppError;
  }
  throw new Error('expected a VALIDACAO error');
}

describe('buildListQuery — SELECT', () => {
  it('selects every column, dates as ISO text, ROWID as _rid, paged with OFFSET/FETCH binds', () => {
    const { list } = build({ page: '3', size: '25' });
    expect(list.sql).toBe(
      'SELECT ID, DOMINIO_ID, NOME, TIPO, TO_CHAR(DATA_INICIO,\'YYYY-MM-DD"T"HH24:MI:SS\') AS DATA_INICIO, OBS, ' +
        'ROWIDTOCHAR(ROWID) AS "_rid" FROM CFG_IMPRESSORAS ORDER BY NOME ASC, ID ASC ' +
        'OFFSET :offset ROWS FETCH NEXT :size ROWS ONLY',
    );
    expect(list.binds).toEqual({ offset: 50, size: 25 });
  });

  it('count query caps at 10001 rows and shares the WHERE binds, without paging', () => {
    const { count } = build({ 'f[NOME]': 'HP' });
    expect(count.sql).toBe(
      'SELECT COUNT(*) AS N FROM (SELECT 1 FROM CFG_IMPRESSORAS WHERE NOME = :w0 FETCH FIRST 10001 ROWS ONLY)',
    );
    expect(count.binds).toEqual({ w0: 'HP' });
  });

  it('read-only resources select no ROWID (views may not have one)', () => {
    const view = defineResource({ ...res, roles: { read: ['ADM'], write: [] } });
    expect(buildListQuery(view, parseListQuery({})).list.sql).not.toContain('ROWID');
  });
});

describe('buildListQuery — WHERE per column type', () => {
  it('text eq is exact; like is case-insensitive with a backslash escape', () => {
    expect(build({ 'f[NOME]': 'HP' }).list.sql).toContain('WHERE NOME = :w0');
    const like = build({ 'f[NOME][like]': 'hp\\%%' }).list;
    expect(like.sql).toContain("WHERE UPPER(NOME) LIKE UPPER(:w0) ESCAPE '\\'");
    expect(like.binds['w0']).toBe('hp\\%%');
  });

  it('number eq binds a JS number; a non-number is a 400', () => {
    expect(build({ 'f[ID]': '42' }).list.binds['w0']).toBe(42);
    expect(build({ 'f[ID]': '4.5' }).list.binds['w0']).toBe(4.5);
    const err = validationError(() => build({ 'f[ID]': '4x' }));
    expect(err.fields).toHaveProperty('f[ID]');
  });

  it('date eq covers the whole day; from/to are inclusive whole days', () => {
    expect(build({ 'f[DATA_INICIO]': '2026-09-01' }).list.sql).toContain(
      "WHERE DATA_INICIO >= TO_DATE(:w0,'YYYY-MM-DD') AND DATA_INICIO < TO_DATE(:w0,'YYYY-MM-DD') + 1",
    );
    const range = build({
      'f[DATA_INICIO][from]': '2026-09-01',
      'f[DATA_INICIO][to]': '2026-09-30',
    }).list;
    expect(range.sql).toContain(
      "WHERE DATA_INICIO >= TO_DATE(:w0,'YYYY-MM-DD') AND DATA_INICIO < TO_DATE(:w1,'YYYY-MM-DD') + 1",
    );
    expect(range.binds).toMatchObject({ w0: '2026-09-01', w1: '2026-09-30' });
    validationError(() => build({ 'f[DATA_INICIO]': '01-09-2026' }));
    validationError(() => build({ 'f[DATA_INICIO]': '2026-02-30' }));
  });

  it('in binds one variable per value (numbers converted)', () => {
    const q = build({ 'f[TIPO][in]': ['A', 'B'], 'f[ID][in]': ['1', '2'] }).list;
    expect(q.sql).toContain('WHERE ID IN (:w0, :w1) AND TIPO IN (:w2, :w3)');
    expect(q.binds).toMatchObject({ w0: 1, w1: 2, w2: 'A', w3: 'B' });
  });

  it('IS NULL / IS NOT NULL take no bind', () => {
    expect(build({ 'f[NOME][null]': '1' }).list.sql).toContain('WHERE NOME IS NULL');
    expect(build({ 'f[NOME][notnull]': '1' }).list.sql).toContain('WHERE NOME IS NOT NULL');
  });

  it('parent keys are ANDed as binds before the filters', () => {
    const q = build({ 'f[NOME]': 'HP' }, { DOMINIO_ID: 'D1' }).list;
    expect(q.sql).toContain('WHERE DOMINIO_ID = :p0 AND NOME = :w0');
    expect(q.binds).toMatchObject({ p0: 'D1', w0: 'HP' });
  });

  it('a detail list without its parent key is a 400', () => {
    validationError(() => buildListQuery(detail, parseListQuery({})));
  });
});

describe('buildListQuery — allow-list (no injection)', () => {
  const hostile = [
    "x' OR '1'='1",
    '1; DROP TABLE CFG_UTILIZADORES --',
    ') UNION SELECT PASSWORD FROM CFG_UTILIZADORES --',
  ];

  it('filter values only ever appear as binds, never in the SQL text', () => {
    for (const v of hostile) {
      const { list, count } = build({ 'f[NOME]': v, 'f[NOME][like]': v, 'f[TIPO][in]': [v, v] });
      expect(list.sql).not.toContain(v);
      expect(count.sql).not.toContain(v);
      expect(Object.values(list.binds)).toContain(v);
    }
  });

  it('an unknown or hostile filter column is a 400 and never reaches SQL', () => {
    validationError(() => build({ 'f[PASSWORD]': 'x' }));
    validationError(() => build({ 'f[NOME) OR (1=1]': 'x' }));
    validationError(() => build({ 'f[nome]': 'x' }));
    validationError(() => build({ 'f[__proto__]': 'x' }));
  });

  it('an operator the column does not allow is a 400', () => {
    validationError(() => build({ 'f[OBS]': 'x' })); // no filter ops at all
    validationError(() => build({ 'f[TIPO][like]': 'x%' }));
  });

  it('sort accepts only sortable columns; unknown ones are a 400', () => {
    validationError(() => build({ sort: 'OBS:asc' }));
    validationError(() => build({ sort: 'PASSWORD:asc' }));
    const q = build({ sort: 'DATA_INICIO:desc,ID:asc' }).list;
    expect(q.sql).toContain('ORDER BY DATA_INICIO DESC, ID ASC OFFSET');
  });

  it('page and size are binds', () => {
    const q = build({ page: '2', size: '10' }).list;
    expect(q.sql).toContain('OFFSET :offset ROWS FETCH NEXT :size ROWS ONLY');
    expect(q.binds).toMatchObject({ offset: 10, size: 10 });
  });
});

describe('rid encoding', () => {
  it('makes a ROWID URL-safe and back', () => {
    const rowid = 'AAAR3sAAEAAAACXAAA+/';
    expect(encodeRid(rowid)).toBe('AAAR3sAAEAAAACXAAA-_');
    expect(decodeRid(encodeRid(rowid))).toBe(rowid);
  });

  it('rejects a rid that is not a ROWID shape', () => {
    expect(() => decodeRid("x' OR 1=1")).toThrow(AppError);
  });
});
