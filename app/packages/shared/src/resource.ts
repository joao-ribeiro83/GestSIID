import { z } from 'zod';
import type { FilterOp, ListQuerySort } from './listQuery.ts';
import type { Role } from './role.ts';

/**
 * One definition per resource, shared by the API (SQL, request schemas, role guards) and the
 * SPA (DataBlock columns, filter inputs, editors) — ARCHITECTURE.md §4.1.
 *
 * Types: `text` (eq, like), `code` (a text key: eq, in), `number` (eq, in), `date` (eq, from, to).
 * Dates travel as `YYYY-MM-DDTHH:MM:SS` strings (§3), never as JS Dates.
 */
export type ColumnType = 'text' | 'code' | 'number' | 'date';

export interface ColumnDef {
  type: ColumnType;
  label: string;
  filter?: readonly FilterOp[];
  sort?: true;
  /** Editable on new and existing rows. */
  edit?: true;
  /** Editable on new rows only. */
  insertOnly?: true;
  required?: true;
  maxLength?: number;
  /** A secret: accepted in `values`, never selected, never in `orig`, no filter or sort. */
  writeOnly?: true;
}

export interface Resource<C extends string = string> {
  name: string;
  /** Table or view. */
  source: string;
  /** Detail resources: columns bound from the master's current row (§4.4). */
  parentKeys?: readonly C[];
  columns: Record<C, ColumnDef>;
  /** Rows the screen never shows (a form's DEFAULT_WHERE `col != 'X'`): `column NOT IN (values)`. */
  exclude?: { column: C; values: readonly string[] };
  /** Named server-side WHERE fragments picked with `?preset=<name>` (§4.1); no preset = none. */
  presets?: Record<string, string>;
  defaultSort: readonly ListQuerySort[];
  /** Unique column appended to every ORDER BY so paging is stable. */
  tiebreak: C;
  roles: { read: readonly Role[]; write: readonly Role[] };
}

type ValueOf<T extends ColumnType> = T extends 'number' ? number : string;

/** The row a list route returns for a resource: every column but the write-only ones (nullable) plus `_rid`. */
export type RowOf<R extends Resource> = {
  [K in keyof R['columns'] as R['columns'][K] extends { writeOnly: true } ? never : K]: ValueOf<
    R['columns'][K]['type']
  > | null;
} & { _rid: string };

// Oracle identifiers: these strings are pasted into SQL, so only plain names are allowed.
const IDENTIFIER_RE = /^[A-Z][A-Z0-9_$#]{0,29}$/;

function assertIdentifier(name: string): void {
  if (!IDENTIFIER_RE.test(name)) throw new Error(`Identificador inválido: ${name}`);
}

/** Identity with a check: table and column names must be plain Oracle identifiers. */
export function defineResource<const R extends Resource>(resource: R): R {
  assertIdentifier(resource.source);
  for (const column of Object.keys(resource.columns)) assertIdentifier(column);
  assertIdentifier(resource.tiebreak);
  if (resource.exclude) assertIdentifier(resource.exclude.column);
  return resource;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

function columnSchema(def: ColumnDef): z.ZodType {
  let base: z.ZodType;
  // `error` covers a missing/null value on a required column and a wrong type.
  if (def.type === 'number') {
    base = z.number({
      error: (i) => (i.input == null ? 'Campo obrigatório.' : 'Valor numérico inválido.'),
    });
  } else if (def.type === 'date') {
    base = z
      .string({ error: (i) => (i.input == null ? 'Campo obrigatório.' : 'Data inválida.') })
      .regex(DATE_RE, 'Data inválida.');
  } else {
    let s = z.string({ error: 'Campo obrigatório.' });
    if (def.maxLength !== undefined)
      s = s.max(def.maxLength, `Máximo ${def.maxLength} caracteres.`);
    if (def.required) s = s.min(1, 'Campo obrigatório.');
    base = s;
  }
  return def.required ? base : base.nullable();
}

/**
 * `insert`: `edit` + `insertOnly` columns, required ones must be present.
 * `update`: `edit` columns that are not `insertOnly`, all optional (only the changed ones travel).
 * Strict: any other key (audit columns, ids, typos) is rejected — the server sets those.
 */
export function valuesSchema(
  resource: Resource,
  mode: 'insert' | 'update',
  /** SPA forms: converts the raw input text (e.g. `DD-MM-AAAA`) before the check. */
  fromInput?: (def: ColumnDef, raw: string) => unknown,
) {
  const shape: Record<string, z.ZodType> = {};
  for (const [column, def] of Object.entries(resource.columns)) {
    const writable = mode === 'insert' ? def.edit || def.insertOnly : def.edit && !def.insertOnly;
    if (!writable) continue;
    const s = fromInput
      ? z.preprocess((v) => (typeof v === 'string' ? fromInput(def, v) : v), columnSchema(def))
      : columnSchema(def);
    shape[column] = mode === 'insert' && def.required ? s : s.optional();
  }
  return z.strictObject(shape);
}

/** `orig` of PUT/DELETE (the values the client last read, for the lock check): any known column. */
export function origSchema(resource: Resource) {
  const shape: Record<string, z.ZodType> = {};
  for (const [column, def] of Object.entries(resource.columns)) {
    if (def.writeOnly) continue;
    const base = def.type === 'number' ? z.number() : z.string();
    shape[column] = base.nullable().optional();
  }
  return z.strictObject(shape);
}
