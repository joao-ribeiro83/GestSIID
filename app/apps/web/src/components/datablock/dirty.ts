import { valuesSchema, type Resource } from '@gestsiid/shared';

/**
 * The dirty overlay (UI_SPEC §3.10): unsaved rows keyed by `_rid` (`tmp:<uuid>` for new rows),
 * kept apart from the query cache so a refetch never overwrites an edit. Pure: the reducer,
 * the save plan (deletes → updates → inserts) and the runner that stops at the first error.
 */

export type GridRow = { _rid: string } & Record<string, unknown>;

export type RowStatus = 'saving' | 'error' | 'conflict' | 'locked';

export interface RowError {
  message: string;
  fields?: Record<string, string>;
}

export interface OverlayEntry {
  state: 'new' | 'dirty' | 'deleted';
  /** The row as read from the server (without `_rid`); null for new rows. */
  orig: Record<string, unknown> | null;
  /** Changed columns only. */
  values: Record<string, unknown>;
  status?: RowStatus;
  error?: RowError;
  /** Deleting a row with edits keeps them for an undelete. */
  wasDirty?: boolean;
}

export type Overlay = Record<string, OverlayEntry>;

export type DirtyAction =
  | { type: 'edit'; row: GridRow; col: string; value: unknown }
  | { type: 'insert'; rid: string; defaults: Record<string, unknown> }
  | { type: 'toggleDelete'; row: Pick<GridRow, '_rid'> & Partial<GridRow> }
  | { type: 'revert'; rid: string }
  | { type: 'status'; rid: string; status: RowStatus; error?: RowError }
  | { type: 'saved'; rid: string }
  | { type: 'discardAll' };

const origOf = (row: Partial<GridRow>): Record<string, unknown> => {
  const rest: Record<string, unknown> = { ...row };
  delete rest['_rid'];
  return rest;
};

function without(o: Overlay, rid: string): Overlay {
  const rest = { ...o };
  delete rest[rid];
  return rest;
}

export function dirtyReducer(o: Overlay, action: DirtyAction): Overlay {
  switch (action.type) {
    case 'edit': {
      const rid = action.row._rid;
      const cur = o[rid] ?? { state: 'dirty' as const, orig: origOf(action.row), values: {} };
      if (cur.state === 'deleted') return o;
      const values = { ...cur.values };
      if (
        cur.state === 'dirty' &&
        Object.is(cur.orig?.[action.col] ?? null, action.value ?? null)
      ) {
        delete values[action.col];
      } else {
        values[action.col] = action.value;
      }
      if (cur.state === 'dirty' && Object.keys(values).length === 0) return without(o, rid);
      return { ...o, [rid]: { state: cur.state, orig: cur.orig, values } };
    }
    case 'insert':
      return { [action.rid]: { state: 'new', orig: null, values: { ...action.defaults } }, ...o };
    case 'toggleDelete': {
      const rid = action.row._rid;
      const cur = o[rid];
      if (cur?.state === 'new') return without(o, rid);
      if (cur?.state === 'deleted') {
        return cur.wasDirty
          ? { ...o, [rid]: { state: 'dirty', orig: cur.orig, values: cur.values } }
          : without(o, rid);
      }
      return {
        ...o,
        [rid]: {
          state: 'deleted',
          orig: cur?.orig ?? origOf(action.row),
          values: cur?.values ?? {},
          wasDirty: !!cur,
        },
      };
    }
    case 'revert':
    case 'saved':
      return without(o, action.rid);
    case 'status': {
      const cur = o[action.rid];
      return cur
        ? { ...o, [action.rid]: { ...cur, status: action.status, error: action.error } }
        : o;
    }
    case 'discardAll':
      return {};
  }
}

export type SaveStep =
  | { kind: 'delete'; rid: string; orig: Record<string, unknown> }
  | { kind: 'update'; rid: string; orig: Record<string, unknown>; values: Record<string, unknown> }
  | { kind: 'insert'; rid: string; values: Record<string, unknown> };

/** Deletes → updates → inserts (§3.10 step 2), each group in overlay order. */
export function planSave(o: Overlay): SaveStep[] {
  const entries = Object.entries(o);
  return [
    ...entries
      .filter(([, e]) => e.state === 'deleted')
      .map(([rid, e]) => ({ kind: 'delete' as const, rid, orig: e.orig ?? {} })),
    ...entries
      .filter(([, e]) => e.state === 'dirty')
      .map(([rid, e]) => ({ kind: 'update' as const, rid, orig: e.orig ?? {}, values: e.values })),
    ...entries
      .filter(([, e]) => e.state === 'new')
      .map(([rid, e]) => ({ kind: 'insert' as const, rid, values: e.values })),
  ];
}

/** A row as the API's `origSchema` takes it: no `_rid`, no computed (`expr`) display columns. */
export function lockOrig(resource: Resource, row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).filter(([c]) => c !== '_rid' && !resource.columns[c]?.expr),
  );
}

/** Client-side check before anything is sent (§3.10 step 1), with the resource's own schemas. */
export function validateOverlay(o: Overlay, resource: Resource): Record<string, RowError> {
  const insert = valuesSchema(resource, 'insert');
  const update = valuesSchema(resource, 'update');
  const errors: Record<string, RowError> = {};
  for (const [rid, e] of Object.entries(o)) {
    if (e.state === 'deleted') continue;
    const r = (e.state === 'new' ? insert : update).safeParse(e.values);
    if (!r.success) {
      const fields: Record<string, string> = {};
      for (const issue of r.error.issues) {
        const key = String(issue.path[0] ?? '');
        fields[key] ??= issue.message;
      }
      const [col, msg] = Object.entries(fields)[0] ?? ['', ''];
      errors[rid] = { message: `${resource.columns[col]?.label ?? col}: ${msg}`, fields };
    }
  }
  return errors;
}

/** Sends the steps one at a time; on the first failure marks that row and stops (§3.10 step 4). */
export async function runSave(
  steps: SaveStep[],
  send: (step: SaveStep) => Promise<unknown>,
  dispatch: (action: DirtyAction) => void,
): Promise<{ ok: true } | { ok: false; failed: { rid: string; message: string } }> {
  for (const step of steps) {
    dispatch({ type: 'status', rid: step.rid, status: 'saving' });
    try {
      await send(step);
      dispatch({ type: 'saved', rid: step.rid });
    } catch (e) {
      const err = e as Error & { code?: string; fields?: Record<string, string> };
      const status: RowStatus =
        err.code === 'REGISTO_ALTERADO'
          ? 'conflict'
          : err.code === 'REGISTO_BLOQUEADO'
            ? 'locked'
            : 'error';
      // Server field keys are zod paths (`values.NOME`); cells are keyed by column.
      const fields =
        err.fields &&
        Object.fromEntries(
          Object.entries(err.fields).map(([k, v]) => [k.replace(/^values\./, ''), v]),
        );
      dispatch({ type: 'status', rid: step.rid, status, error: { message: err.message, fields } });
      return { ok: false, failed: { rid: step.rid, message: err.message } };
    }
  }
  return { ok: true };
}
