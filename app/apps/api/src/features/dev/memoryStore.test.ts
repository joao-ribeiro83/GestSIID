import { defineResource } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import { SqlCall } from '../../lib/crud.ts';
import { memoryStore } from './memoryStore.ts';

const res = defineResource({
  name: 'utilizadores',
  source: 'CFG_UTILIZADORES',
  columns: {
    USERNAME: { type: 'code', label: 'Utilizador', filter: ['eq'], insertOnly: true },
    PASSWORD: { type: 'text', label: 'Password', edit: true, writeOnly: true },
  },
  defaultSort: [{ column: 'USERNAME', direction: 'asc' }],
  tiebreak: 'USERNAME',
  roles: { read: ['ADM'], write: ['ADM'] },
});
const ctx = { user: { username: 'JOAO', role: 'ADM' as const } };
const q = { filters: {}, sort: [], page: 1, size: 50 };

describe('memoryStore', () => {
  it('never returns a write-only column, from insert, update, get or list', async () => {
    const store = memoryStore(res, [{ USERNAME: 'ANA', PASSWORD: 'seed' }]);
    const made = await store.insert(
      { USERNAME: 'BIA', PASSWORD: new SqlCall('H(?)', 'x') },
      {},
      ctx,
    );
    const [ana] = (await store.list(q, {}, ctx)).rows;
    const upd = await store.update(String(ana?.['_rid']), {}, { PASSWORD: 'y' }, ctx);
    const got = await store.get(String(made['_rid']), ctx);
    for (const row of [made, ana, upd, got, ...(await store.list(q, {}, ctx)).rows])
      expect(row).not.toHaveProperty('PASSWORD');
  });

  it('list leaves out the rows the resource excludes, and counts without them', async () => {
    const hidden = defineResource({ ...res, exclude: { column: 'USERNAME', values: ['ANA'] } });
    const store = memoryStore(hidden, [
      { USERNAME: 'ANA', PASSWORD: null },
      { USERNAME: 'BIA', PASSWORD: null },
    ]);
    const { rows, total } = await store.list(q, {}, ctx);
    expect(rows.map((r) => r['USERNAME'])).toEqual(['BIA']);
    expect(total).toBe(1);
  });

  it('list applies a preset through the predicate given for it', async () => {
    const withPreset = defineResource({ ...res, presets: { so_ana: "USERNAME = 'ANA'" } });
    const store = memoryStore(
      withPreset,
      [
        { USERNAME: 'ANA', PASSWORD: null },
        { USERNAME: 'BIA', PASSWORD: null },
      ],
      { presets: { so_ana: (r) => r['USERNAME'] === 'ANA' } },
    );
    const { rows, total } = await store.list({ ...q, preset: 'so_ana' }, {}, ctx);
    expect(rows.map((r) => r['USERNAME'])).toEqual(['ANA']);
    expect(total).toBe(1);
    expect((await store.list(q, {}, ctx)).total).toBe(2);
  });

  it('an update that moves a row onto another row\'s key is 409 ORA_00001 too', async () => {
    const store = memoryStore(res, [
      { USERNAME: 'ANA', PASSWORD: null },
      { USERNAME: 'BIA', PASSWORD: null },
    ]);
    const [, bia] = (await store.list(q, {}, ctx)).rows;
    await expect(
      store.update(String(bia?.['_rid']), { USERNAME: 'BIA' }, { USERNAME: 'ANA' }, ctx),
    ).rejects.toMatchObject({ statusCode: 409, code: 'ORA_00001' });
    // the same key on the same row is not a clash
    await expect(
      store.update(String(bia?.['_rid']), { USERNAME: 'BIA' }, { USERNAME: 'BIA' }, ctx),
    ).resolves.toMatchObject({ USERNAME: 'BIA' });
  });

  it('a second insert of the same key is 409 ORA_00001, like the primary key', async () => {
    const store = memoryStore(res, [{ USERNAME: 'ANA', PASSWORD: null }]);
    await expect(store.insert({ USERNAME: 'ANA' }, {}, ctx)).rejects.toMatchObject({
      statusCode: 409,
      code: 'ORA_00001',
    });
  });

  it('opts.dedupeKeys narrows a global tiebreak clash to rows that also share those columns (a flat resource with a composite real PK, e.g. impressoras-associadas-doc: MODELO_ID/IMPRESSORA_ID/DATA_INICIO)', async () => {
    const flat = defineResource({
      name: 'assoc',
      source: 'DOC_IMPRESSORAS_DOC',
      columns: {
        MODELO_ID: { type: 'code', label: 'Modelo', insertOnly: true },
        IMPRESSORA_ID: { type: 'code', label: 'Impressora', insertOnly: true },
        DATA_INICIO: { type: 'date', label: 'Início', edit: true },
      },
      defaultSort: [{ column: 'DATA_INICIO', direction: 'asc' }],
      tiebreak: 'DATA_INICIO',
      roles: { read: ['ADM'], write: ['ADM'] },
    });
    const store = memoryStore(flat, [], { dedupeKeys: ['MODELO_ID', 'IMPRESSORA_ID'] });
    await store.insert(
      { MODELO_ID: 'SRC', IMPRESSORA_ID: '1', DATA_INICIO: '2021-01-01T00:00:00' },
      {},
      ctx,
    );
    // Same DATA_INICIO (the global tiebreak), but a different MODELO_ID/IMPRESSORA_ID scope —
    // not a clash (this is what makes "copy the row to another model, same dates" possible).
    await expect(
      store.insert(
        { MODELO_ID: 'MOD1', IMPRESSORA_ID: '1', DATA_INICIO: '2021-01-01T00:00:00' },
        {},
        ctx,
      ),
    ).resolves.toMatchObject({ MODELO_ID: 'MOD1' });
    // Same DATA_INICIO AND the same MODELO_ID/IMPRESSORA_ID scope: still a clash.
    await expect(
      store.insert(
        { MODELO_ID: 'SRC', IMPRESSORA_ID: '1', DATA_INICIO: '2021-01-01T00:00:00' },
        {},
        ctx,
      ),
    ).rejects.toMatchObject({ statusCode: 409, code: 'ORA_00001' });
  });

  it('a detail resource\'s tiebreak clash is scoped to the parent, not global', async () => {
    const detail = defineResource({
      name: 'params',
      source: 'SVR_PARAMETROS_REPORT',
      parentKeys: ['REPORT_ID'],
      columns: {
        REPORT_ID: { type: 'number', label: 'Report' },
        N_PARAMETRO: { type: 'number', label: 'Nº' },
      },
      defaultSort: [{ column: 'N_PARAMETRO', direction: 'asc' }],
      tiebreak: 'N_PARAMETRO',
      roles: { read: ['ADM'], write: ['ADM'] },
    });
    const store = memoryStore(detail, []);
    await store.insert({ N_PARAMETRO: 1 }, { REPORT_ID: 1 }, ctx);
    // Report 2's own parameter 1 is not a clash with report 1's parameter 1.
    await expect(
      store.insert({ N_PARAMETRO: 1 }, { REPORT_ID: 2 }, ctx),
    ).resolves.toMatchObject({ REPORT_ID: 2, N_PARAMETRO: 1 });
    // A second parameter 1 within the same report is still a clash.
    await expect(store.insert({ N_PARAMETRO: 1 }, { REPORT_ID: 1 }, ctx)).rejects.toMatchObject({
      statusCode: 409,
      code: 'ORA_00001',
    });
  });
});

describe('memoryStore — sort aliases and per-role sort list (same rules as the SQL)', () => {
  const docs = defineResource({
    name: 'docs',
    source: 'DOCS',
    columns: {
      ID: { type: 'number', label: 'Id', sort: true },
      LOTE_ID: { type: 'number', label: 'Lote' },
      LOTE_ORDEM: { type: 'number', label: 'Ordem' },
    },
    sortAliases: { LOTE: ['LOTE_ID', 'LOTE_ORDEM'] },
    sortRoles: { USER: ['ID'] },
    defaultSort: [{ column: 'ID', direction: 'desc' }],
    tiebreak: 'ID',
    roles: { read: ['ADM', 'USER'], write: [] },
  });
  const store = memoryStore(docs, [
    { ID: 1, LOTE_ID: 1, LOTE_ORDEM: 2 },
    { ID: 2, LOTE_ID: 2, LOTE_ORDEM: 1 },
    { ID: 3, LOTE_ID: 1, LOTE_ORDEM: 1 },
  ]);

  it('sorts by every column of an alias', async () => {
    const { rows } = await store.list({ ...q, sort: [{ column: 'LOTE', direction: 'asc' }] }, {}, ctx);
    expect(rows.map((r) => r['ID'])).toEqual([3, 1, 2]);
  });

  it('USER sorting by a key outside its list is 400 VALIDACAO', async () => {
    const user = { user: { username: 'U', role: 'USER' as const } };
    await expect(
      store.list({ ...q, sort: [{ column: 'LOTE', direction: 'asc' }] }, {}, user),
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDACAO' });
  });
});
