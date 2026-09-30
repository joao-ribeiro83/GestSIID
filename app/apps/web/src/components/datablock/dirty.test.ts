import { describe, expect, it } from 'vitest';
import { defineResource } from '@gestsiid/shared';
import {
  dirtyReducer,
  lockOrig,
  planSave,
  runSave,
  validateOverlay,
  type Overlay,
  type SaveStep,
} from './dirty';

// UI_SPEC §3.10: overlay keyed by rid, save order deletes → updates → inserts, stop at the first error.

const res = defineResource({
  name: 'x',
  source: 'X',
  columns: {
    ID: { type: 'number', label: 'Id' },
    NOME: { type: 'text', label: 'Nome', edit: true, required: true },
    OBS: { type: 'text', label: 'Obs', edit: true },
  },
  defaultSort: [],
  tiebreak: 'ID',
  roles: { read: ['ADM'], write: ['ADM'] },
});

const a = { _rid: 'a', ID: 1, NOME: 'A', OBS: null };
const b = { _rid: 'b', ID: 2, NOME: 'B', OBS: null };

function apply(...actions: Parameters<typeof dirtyReducer>[1][]): Overlay {
  return actions.reduce(dirtyReducer, {} as Overlay);
}

describe('dirtyReducer', () => {
  it('an edit back to the original value leaves the row clean', () => {
    const o = apply(
      { type: 'edit', row: a, col: 'NOME', value: 'Z' },
      { type: 'edit', row: a, col: 'NOME', value: 'A' },
    );
    expect(o).toEqual({});
  });

  it('delete toggles; deleting a new row just drops it', () => {
    expect(apply({ type: 'toggleDelete', row: a }).a?.state).toBe('deleted');
    expect(apply({ type: 'toggleDelete', row: a }, { type: 'toggleDelete', row: a })).toEqual({});
    const withNew = apply({ type: 'insert', rid: 'tmp:1', defaults: {} });
    expect(dirtyReducer(withNew, { type: 'toggleDelete', row: { _rid: 'tmp:1' } })).toEqual({});
  });

  it('undeleting keeps earlier edits', () => {
    const o = apply(
      { type: 'edit', row: a, col: 'OBS', value: 'x' },
      { type: 'toggleDelete', row: a },
      { type: 'toggleDelete', row: a },
    );
    expect(o.a).toMatchObject({ state: 'dirty', values: { OBS: 'x' } });
  });

  it('editing a row clears its error', () => {
    const o = apply(
      { type: 'edit', row: a, col: 'OBS', value: 'x' },
      { type: 'status', rid: 'a', status: 'error', error: { message: 'boom' } },
      { type: 'edit', row: a, col: 'OBS', value: 'y' },
    );
    expect(o.a?.status).toBeUndefined();
    expect(o.a?.error).toBeUndefined();
  });
});

describe('planSave', () => {
  it('orders deletes → updates → inserts, sending only changed columns and the original row', () => {
    const o = apply(
      { type: 'insert', rid: 'tmp:1', defaults: { NOME: 'N' } },
      { type: 'edit', row: b, col: 'OBS', value: 'nota' },
      { type: 'toggleDelete', row: a },
    );
    expect(planSave(o)).toEqual([
      { kind: 'delete', rid: 'a', orig: { ID: 1, NOME: 'A', OBS: null } },
      { kind: 'update', rid: 'b', orig: { ID: 2, NOME: 'B', OBS: null }, values: { OBS: 'nota' } },
      { kind: 'insert', rid: 'tmp:1', values: { NOME: 'N' } },
    ]);
  });
});

describe('validateOverlay', () => {
  it('flags invalid rows with field messages and passes valid ones', () => {
    const o = apply(
      { type: 'insert', rid: 'tmp:1', defaults: {} },
      { type: 'edit', row: b, col: 'OBS', value: 'ok' },
    );
    const errors = validateOverlay(o, res);
    expect(Object.keys(errors)).toEqual(['tmp:1']);
    expect(errors['tmp:1']?.fields).toHaveProperty('NOME');
  });
});

describe('runSave', () => {
  it('sends steps one at a time and stops at the first failure', async () => {
    const o = apply(
      { type: 'toggleDelete', row: a },
      { type: 'edit', row: b, col: 'OBS', value: 'x' },
      { type: 'insert', rid: 'tmp:1', defaults: { NOME: 'N' } },
    );
    const sent: string[] = [];
    const events: string[] = [];
    const result = await runSave(
      planSave(o),
      async (step: SaveStep) => {
        sent.push(step.rid);
        if (step.rid === 'b') throw Object.assign(new Error('Já existe.'), { code: 'ORA_00001' });
      },
      (action) =>
        events.push(
          `${action.type}:${'rid' in action ? action.rid : ''}:${'status' in action ? action.status : ''}`,
        ),
    );
    expect(sent).toEqual(['a', 'b']);
    expect(result).toEqual({ ok: false, failed: { rid: 'b', message: 'Já existe.' } });
    expect(events).toEqual(['status:a:saving', 'saved:a:', 'status:b:saving', 'status:b:error']);
  });

  it('marks a 409 REGISTO_ALTERADO as a conflict', async () => {
    const events: unknown[] = [];
    const steps: SaveStep[] = [{ kind: 'update', rid: 'a', orig: {}, values: {} }];
    await runSave(
      steps,
      async () => {
        throw Object.assign(new Error('alterado'), { code: 'REGISTO_ALTERADO' });
      },
      (action) => events.push(action),
    );
    expect(events.at(-1)).toMatchObject({ type: 'status', rid: 'a', status: 'conflict' });
  });
});

describe('lockOrig', () => {
  it('drops _rid and computed columns, which the API refuses in orig', () => {
    const r = defineResource({
      name: 'y',
      source: 'Y',
      columns: {
        ID: { type: 'number', label: 'Id' },
        TIPO: { type: 'code', label: 'Tipo', expr: "'X'" },
      },
      defaultSort: [],
      tiebreak: 'ID',
      roles: { read: ['ADM'], write: ['ADM'] },
    });
    expect(lockOrig(r, { _rid: 'a', ID: 1, TIPO: 'PNG' })).toEqual({ ID: 1 });
  });
});
