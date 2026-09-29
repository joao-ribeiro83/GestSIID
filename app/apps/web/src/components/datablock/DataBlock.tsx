import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBlocker } from '@tanstack/react-router';
import {
  createColumnHelper,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import {
  CircleAlert,
  CircleHelp,
  Circle,
  Loader2,
  Lock,
  Minus,
  Plus,
  RefreshCw,
  SearchX,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  pt,
  toQueryString,
  valuesSchema,
  type ListQuery,
  type ListQueryFilter,
  type PagedResult,
  type Resource,
  type Role,
} from '@gestsiid/shared';
import { ApiError, apiFetch } from '@/api/client';
import { useConfirm } from '@/components/shell/confirm-dialog-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { CellEditor, useDominio, type CommitMove } from './CellEditor';
import { DirtyBar } from './DirtyBar';
import {
  dirtyReducer,
  planSave,
  runSave,
  validateOverlay,
  type GridRow,
  type OverlayEntry,
  type SaveStep,
} from './dirty';
import { Footer } from './Footer';
import { formatCell, formatNumber } from './format';
import { align, HeaderRow, type FilterValue } from './HeaderRow';
import { PanelForm } from './PanelForm';
import { formatFilterText, nextSort, parseFilterText } from './qbe';

/**
 * DataBlock (UI_SPEC §3): the Forms multi-record block over TanStack Table + TanStack Query.
 * The server filters (query by example), sorts and pages; the block keeps unsaved rows in a local
 * overlay until Guardar, and asks #46 before anything would throw them away.
 * Not in this step: presets bar, context chips, URL state, LOV cells, row tones, context menus.
 */

export type Selection =
  | { mode: 'none' }
  | { mode: 'ids'; ids: (string | number)[] }
  | {
      mode: 'consulta';
      consulta: Pick<ListQuery, 'filters' | 'preset'>;
      total: number;
      capped: boolean;
    };

export interface ColumnView<Row> {
  /** Key in `resource.columns`. */
  col: string;
  /** px; default by type: text 160, code 112, number 88, date 104. */
  width?: number;
  align?: 'start' | 'end' | 'center';
  mono?: boolean;
  hidden?: boolean;
  /** Shortened header; the full label goes to title/aria-label. */
  header?: string;
  render?: (row: Row) => ReactNode;
  /** Select filter (`in`), select editor and label lookup from a domain. */
  options?: { source: 'dominio'; dominioId: string };
  /** Panel editing only (`PanelForm`): the field only shows while this holds, over the form's
   * current (possibly unsaved) text values — e.g. `ENABLE_STRINGS`-style conditional fields. */
  visibleWhen?: (values: Record<string, string>) => boolean;
  /** Inline editing only: the cell is editable only while this holds, over the row's current
   * (possibly unsaved) values — e.g. a fixed/locked row whose name cannot be renamed. */
  editableWhen?: (row: Row) => boolean;
}

export interface DataBlockHandle {
  isDirty: () => boolean;
  save: () => Promise<boolean>;
  discard: () => void;
  /** #46 when dirty: true = go on (saved or discarded), false = stay. */
  confirmLeave: () => Promise<boolean>;
}

export interface DataBlockProps<Row extends GridRow = GridRow> {
  resource: Resource;
  columns: ColumnView<Row>[];
  /** Accessible name of the grid. */
  heading: string;
  /** apiFetch path; default `/${resource.name}`. */
  endpoint?: string;
  /** Detail blocks: the master's keys (null = no current master row). Use `useDetailBlock`. */
  master?: { keys: Record<string, string | number> | null; newMaster?: boolean };
  selection?: 'none' | 'multi';
  edit?: 'none' | 'inline' | 'panel';
  /** When given, writes are offered only if `resource.roles.write` includes it (the server decides anyway). */
  role?: Role;
  canInsert?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  /** Values of a new row. */
  defaults?: () => Record<string, unknown>;
  toolbar?: (ctx: { selection: Selection; current: Row | null; refetch: () => void }) => ReactNode;
  onCurrentRowChange?: (row: Row | null) => void;
  beforeCurrentRowChange?: () => Promise<boolean>;
  onSelectionChange?: (s: Selection) => void;
  handleRef?: Ref<DataBlockHandle>;
  emptyText?: string;
  pageSize?: number;
  className?: string;
  /** Named server-side filter (`resource.presets`); a change goes back to page 1. */
  preset?: string;
}

const MAX_IDS = 1000;
const ROW_H = 28;
const DEFAULT_WIDTH = { text: 160, code: 112, number: 88, date: 104 } as const;

const features = tableFeatures({ rowSortingFeature, rowPaginationFeature, rowSelectionFeature });
const helper = createColumnHelper<typeof features, GridRow>();

export function DataBlock<Row extends GridRow = GridRow>(props: DataBlockProps<Row>) {
  const { resource, heading, selection: selectionMode = 'none', edit = 'none' } = props;
  const endpoint = props.endpoint ?? `/${resource.name}`;
  const cols = useMemo(
    () => props.columns.filter((c) => !c.hidden && resource.columns[c.col]),
    [props.columns, resource],
  );
  const writable =
    edit !== 'none' &&
    (props.role ? resource.roles.write.includes(props.role) : resource.roles.write.length > 0);
  const canInsert =
    (props.canInsert ?? writable) && !props.master?.newMaster && props.master?.keys !== null;
  const canUpdate = props.canUpdate ?? writable;
  const canDelete = props.canDelete ?? writable;

  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const gridRef = useRef<HTMLDivElement>(null);

  // ── state ────────────────────────────────────────────────────────────────────────────────
  const [query, setQuery] = useState<ListQuery>({
    filters: {},
    sort: [],
    page: 1,
    size: props.pageSize ?? 50,
  });
  const [pending, setPending] = useState<Record<string, FilterValue>>({});
  const [filterErrors, setFilterErrors] = useState<Record<string, string>>({});
  const [overlay, dispatch] = useReducer(dirtyReducer, {});
  const [current, setCurrent] = useState<{ rid: string | null; col: number }>({
    rid: null,
    col: 0,
  });
  const [editing, setEditing] = useState<{ rid: string; col: string; initial?: string } | null>(
    null,
  );
  const [selection, setSelection] = useState<Selection>({ mode: 'none' });
  const [panel, setPanel] = useState<{ row: Row | null } | null>(null);
  const [barError, setBarError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const focusBody = useRef(false);
  const afterLoad = useRef<'first' | 'last' | null>(null);
  const lastClicked = useRef<number | null>(null);

  const isDirty = Object.keys(overlay).length > 0;
  // Read by the route blocker, Ctrl+S and the handle, which outlive a render.
  const dirtyRef = useRef(isDirty);
  useEffect(() => {
    dirtyRef.current = isDirty;
  }, [isDirty]);

  // ── data ─────────────────────────────────────────────────────────────────────────────────
  const masterKeys = props.master?.keys;
  const enabled = props.master === undefined || masterKeys !== null;
  const list = useQuery({
    queryKey: [endpoint, masterKeys ?? null, fetched],
    queryFn: () => apiFetch<PagedResult<Row>>(`${endpoint}?${toQueryString(fetched)}`),
    placeholderData: keepPreviousData,
    enabled,
  const fetched: ListQuery = props.preset === undefined ? query : { ...query, preset: props.preset };
    refetchOnWindowFocus: !isDirty,
  });
  const total = list.data?.total ?? 0;
  const capped = list.data?.totalCapped ?? false;

  const rows = useMemo<Row[]>(() => {
    const blank = Object.fromEntries(Object.keys(resource.columns).map((c) => [c, null]));
    const fresh = Object.entries(overlay)
      .filter(([, e]) => e.state === 'new')
      .map(([rid, e]) => ({ ...blank, ...(masterKeys ?? {}), ...e.values, _rid: rid }) as Row);
    const server = (enabled ? (list.data?.rows ?? []) : []).map((r) => {
      const e = overlay[r._rid];
      return e && e.state !== 'new' ? ({ ...r, ...e.values } as Row) : r;
    });
    return [...fresh, ...server];
  }, [overlay, list.data, enabled, masterKeys, resource]);

  const rowIndex = rows.findIndex((r) => r._rid === current.rid);
  const currentRow = rowIndex >= 0 ? (rows[rowIndex] ?? null) : null;

  // ── #46 guard ────────────────────────────────────────────────────────────────────────────
  /** `n` of "Erro no registo n": position on the page, or the key when the row is elsewhere. */
  const positionOf = (rid: string): number | string => {
    const i = rows.findIndex((r) => r._rid === rid);
    return i >= 0 ? i + 1 : rid;
  };

  const save = useCallback(async (): Promise<boolean> => {
    const errors = validateOverlay(overlay, resource);
    const invalid = Object.entries(errors);
    if (invalid.length > 0) {
      for (const [rid, error] of invalid) dispatch({ type: 'status', rid, status: 'error', error });
      const [rid, error] = invalid[0]!;
      setBarError(pt.db.erroNoRegisto(positionOf(rid), error.message));
      return false;
    }
    setSaving(true);
    const send = (step: SaveStep) => {
      const quiet = { quiet: true };
      if (step.kind === 'delete') {
        return apiFetch(
          `${endpoint}/${step.rid}`,
          { method: 'DELETE', body: JSON.stringify({ orig: step.orig }) },
          quiet,
        );
      }
      if (step.kind === 'update') {
        return apiFetch(
          `${endpoint}/${step.rid}`,
          { method: 'PUT', body: JSON.stringify({ orig: step.orig, values: step.values }) },
          quiet,
        );
      }
      return apiFetch(
        endpoint,
        { method: 'POST', body: JSON.stringify({ values: step.values }) },
        quiet,
      );
    };
    const result = await runSave(planSave(overlay), send, dispatch);
    setSaving(false);
    await queryClient.invalidateQueries({ queryKey: [endpoint] });
    if (result.ok) {
      setBarError(null);
      toast.success(pt.db.guardado);
      return true;
    }
    setBarError(pt.db.erroNoRegisto(positionOf(result.failed.rid), result.failed.message));
    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- positionOf only reads `rows`
  }, [overlay, resource, endpoint, queryClient, rows]);

  const discard = useCallback(() => {
    dispatch({ type: 'discardAll' });
    setBarError(null);
    setEditing(null);
  }, []);

  const confirmLeave = useCallback(async (): Promise<boolean> => {
    if (!dirtyRef.current) return true;
    const answer = await confirm({ title: pt.desejaGravar, kind: 'sim-nao-cancelar' });
    if (answer === 'cancelar') return false;
    if (answer === true) return save();
    discard();
    return true;
  }, [confirm, save, discard]);

  useImperativeHandle(
    props.handleRef,
    () => ({ isDirty: () => dirtyRef.current, save, discard, confirmLeave }),
    [save, discard, confirmLeave],
  );

  // Route change and tab close (§3.10 guards).
  useBlocker({
    shouldBlockFn: async () => !(await confirmLeave()),
    enableBeforeUnload: () => dirtyRef.current,
  });

  // Ctrl+S anywhere on the page saves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && dirtyRef.current && !panel) {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save, panel]);

  /** Every change of the executed query goes through here (#46 first). */
  const runQuery = async (next: (q: ListQuery) => ListQuery) => {
    if (!(await confirmLeave())) return false;
    setQuery(next);
    return true;
  };

  // ── master/detail ────────────────────────────────────────────────────────────────────────
  // A new master row resets the detail to page 1 with no current row (React's "reset on prop change").
  const masterSig = JSON.stringify(masterKeys ?? null);
  const [seenMaster, setSeenMaster] = useState(masterSig);
  if (seenMaster !== masterSig) {
    setSeenMaster(masterSig);
    setQuery((q) => (q.page === 1 ? q : { ...q, page: 1 }));
    setCurrent((c) => ({ ...c, rid: null }));
    setSelection({ mode: 'none' });
  }

  const currentSig = JSON.stringify(currentRow);
  const onCurrent = props.onCurrentRowChange;
  useEffect(() => {
    onCurrent?.(currentRow);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- by value, not by object identity
  const [seenPreset, setSeenPreset] = useState(props.preset);
  if (seenPreset !== props.preset) {
    setSeenPreset(props.preset);
    setQuery((q) => (q.page === 1 ? q : { ...q, page: 1 }));
    setSelection({ mode: 'none' });
  }

  }, [currentSig]);

  const moveTo = async (rid: string | null, col = current.col) => {
    if (
      rid !== current.rid &&
      props.beforeCurrentRowChange &&
      !(await props.beforeCurrentRowChange())
    )
      return;
    setCurrent({ rid, col: Math.max(0, Math.min(col, cols.length - 1)) });
  };

  // After a page change from the keyboard, land on the first/last row of the new page.
  useEffect(() => {
    if (!afterLoad.current || list.isPlaceholderData) return;
    const target = afterLoad.current === 'first' ? rows[0] : rows[rows.length - 1];
    afterLoad.current = null;
    if (target) void moveTo(target._rid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.data, list.isPlaceholderData]);

  // Keep DOM focus on the current cell while the keyboard drives the body.
  useEffect(() => {
    if (!focusBody.current || editing || !current.rid) return;
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-cell="${CSS.escape(current.rid)}:${current.col}"]`)
      ?.focus();
  }, [current, editing, rows]);

  // ── filters (§3.3) ───────────────────────────────────────────────────────────────────────
  const executedValue = (col: string): FilterValue => {
    const fs = query.filters[col];
    return fs?.[0]?.op === 'in' ? (fs[0].values ?? []) : formatFilterText(fs);
  };
  const shown = (col: string) => pending[col] ?? executedValue(col);
  const isPendingCol = (col: string) =>
    col in pending && String(pending[col]) !== String(executedValue(col));
  const filtersPending = cols.some((c) => isPendingCol(c.col));
  const filtersActive = Object.keys(query.filters).length > 0;

  const executeFilters = async (override: Record<string, FilterValue> = {}) => {
    const values = { ...pending, ...override };
    const filters: Record<string, ListQueryFilter[]> = {};
    const errors: Record<string, string> = {};
    for (const c of cols) {
      const def = resource.columns[c.col];
      if (!def?.filter?.length) continue;
      const v = c.col in values ? values[c.col]! : executedValue(c.col);
      if (Array.isArray(v)) {
        if (v.length > 0) filters[c.col] = [{ op: 'in', values: v }];
        continue;
      }
      const parsed = parseFilterText(def, v);
      if ('error' in parsed) errors[c.col] = parsed.error;
      else if (parsed.filters.length > 0) filters[c.col] = parsed.filters;
    }
    setFilterErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (await runQuery((q) => ({ ...q, filters, page: 1 }))) {
      setPending({});
      setSelection({ mode: 'none' });
      setCurrent((c) => ({ ...c, rid: null }));
    }
  };

  const clearFilters = async () => {
    if (await runQuery((q) => ({ ...q, filters: {}, page: 1 }))) {
      setPending({});
      setFilterErrors({});
      setSelection({ mode: 'none' });
    }
  };

  // ── sort (§3.5) ──────────────────────────────────────────────────────────────────────────
  const effectiveSort = query.sort.length > 0 ? query.sort : resource.defaultSort;
  const onSort = (col: string, multi: boolean) => {
    void runQuery((q) => ({ ...q, sort: nextSort(effectiveSort, col, multi), page: 1 }));
  };

  // ── selection (§3.7) ─────────────────────────────────────────────────────────────────────
  const idOf = (row: Row) => row[resource.tiebreak] as string | number;
  const selectedIds = useMemo(
    () => new Set(selection.mode === 'ids' ? selection.ids : []),
    [selection],
  );
  const isSelected = (row: Row) =>
    selection.mode === 'consulta' ? !row._rid.startsWith('tmp:') : selectedIds.has(idOf(row));

  const onSelectionChange = props.onSelectionChange;
  useEffect(() => onSelectionChange?.(selection), [selection, onSelectionChange]);

  const toggleRow = (index: number, range: boolean) => {
    if (selection.mode === 'consulta') return;
    const from =
      range && lastClicked.current !== null ? Math.min(lastClicked.current, index) : index;
    const to = range && lastClicked.current !== null ? Math.max(lastClicked.current, index) : index;
    const target = !isSelected(rows[index]!);
    const ids = new Set(selectedIds);
    for (let i = from; i <= to; i++) {
      const r = rows[i];
      if (!r || r._rid.startsWith('tmp:')) continue;
      if (target) ids.add(idOf(r));
      else ids.delete(idOf(r));
    }
    if (ids.size > MAX_IDS) {
      toast.error(pt.db.maxSeleccao);
      return;
    }
    lastClicked.current = index;
    setSelection(ids.size > 0 ? { mode: 'ids', ids: [...ids] } : { mode: 'none' });
  };

  const toggleAll = () =>
    setSelection(
      selection.mode === 'consulta'
        ? { mode: 'none' }
        : {
            mode: 'consulta',
            consulta: { filters: query.filters, preset: fetched.preset },
            total,
            capped,
          },
    );

  // ── TanStack Table: column model, sort indicators, selection state, page count ───────────
  const tableColumns = useMemo(
    () => cols.map((c) => helper.accessor((r) => r[c.col], { id: c.col })),
    [cols],
  );
  const table = useTable({
    features,
    columns: tableColumns,
    data: rows as GridRow[],
    getRowId: (r) => r._rid,
    manualSorting: true,
    manualPagination: true,
    enableMultiSort: true,
    maxMultiSortColCount: 3,
    rowCount: total,
    enableRowSelection: (r) => !r.original._rid.startsWith('tmp:'),
    state: {
      sorting: effectiveSort.map((s) => ({ id: s.column, desc: s.direction === 'desc' })),
      pagination: { pageIndex: query.page - 1, pageSize: query.size },
      rowSelection: Object.fromEntries(rows.filter(isSelected).map((r) => [r._rid, true])),
    },
  });
  const columnById = new Map(table.getAllLeafColumns().map((c) => [c.id, c]));
  const sortOf = (col: string) => {
    const column = columnById.get(col);
    return {
      dir: column?.getIsSorted() ?? false,
      index: column?.getSortIndex() ?? -1,
      count: effectiveSort.length,
    };
  };
  const pageCount = Math.max(1, table.getPageCount());

  // ── editing (§3.9) ───────────────────────────────────────────────────────────────────────
  const entryOf = (row: Row): OverlayEntry | undefined => overlay[row._rid];
  const isEditable = (row: Row, col: string) => {
    const def = resource.columns[col];
    const e = entryOf(row);
    if (edit !== 'inline' || !def || e?.state === 'deleted' || e?.status === 'saving') return false;
    const c = cols.find((c) => c.col === col);
    if (c?.editableWhen && !c.editableWhen(row)) return false;
    return e?.state === 'new'
      ? canInsert && !!(def.edit || def.insertOnly)
      : canUpdate && !!def.edit && !def.insertOnly;
  };

  const startEdit = (row: Row, colIndex: number, initial?: string) => {
    const c = cols[colIndex];
    if (!c || !isEditable(row, c.col)) return false;
    setEditing({ rid: row._rid, col: c.col, initial });
    return true;
  };

  const commit = (row: Row, col: string, value: unknown, move: CommitMove) => {
    dispatch({ type: 'edit', row, col, value });
    const e = entryOf(row);
    const schema = valuesSchema(resource, e?.state === 'new' ? 'insert' : 'update').shape[col];
    const check = schema?.safeParse(value);
    if (check && !check.success) {
      const message = check.error.issues[0]?.message ?? '';
      dispatch({
        type: 'status',
        rid: row._rid,
        status: 'error',
        error: {
          message: `${resource.columns[col]?.label}: ${message}`,
          fields: { [col]: message },
        },
      });
    }
    setEditing(null);
    if (move === 'blur') return;
    focusBody.current = true;
    if (move === 'stay') return setCurrent((c) => ({ ...c }));
    // Tab / Shift+Tab: next/previous editable cell, wrapping to the next/previous row.
    const step = move === 'next' ? 1 : -1;
    const flat = rows.length * cols.length;
    let pos = rowIndex * cols.length + current.col;
    for (let n = 0; n < flat; n++) {
      pos += step;
      if (pos < 0 || pos >= flat) break;
      const r = rows[Math.floor(pos / cols.length)]!;
      const ci = pos % cols.length;
      if (isEditable(r, cols[ci]!.col)) {
        void moveTo(r._rid, ci).then(() => startEdit(r, ci));
        return;
      }
    }
  };

  const insertRow = () => {
    if (!canInsert) return;
    if (edit === 'panel') return setPanel({ row: null });
    const rid = `tmp:${crypto.randomUUID()}`;
    dispatch({ type: 'insert', rid, defaults: props.defaults?.() ?? {} });
    const first = cols.findIndex((c) => {
      const def = resource.columns[c.col];
      return def?.edit || def?.insertOnly;
    });
    focusBody.current = true;
    void moveTo(rid, Math.max(0, first));
  };

  const toggleDelete = () => {
    if (!canDelete) return;
    const targets =
      selection.mode === 'ids' ? rows.filter(isSelected) : currentRow ? [currentRow] : [];
    for (const row of targets) dispatch({ type: 'toggleDelete', row });
  };

  // ── body keyboard map (§3.14) ────────────────────────────────────────────────────────────
  const visibleRowCount = () =>
    Math.max(1, Math.floor(((gridRef.current?.clientHeight ?? 400) - 64) / ROW_H));
  const onBodyKey = (e: React.KeyboardEvent) => {
    if (editing || rowIndex < 0 || !currentRow) return;
    const colMax = cols.length - 1;
    const go = (i: number, col = current.col) => {
      const r = rows[Math.max(0, Math.min(i, rows.length - 1))];
      if (r) void moveTo(r._rid, col);
    };
    const key = e.key;
    focusBody.current = true;
    if (key === 'ArrowDown') {
      if (rowIndex === rows.length - 1 && query.page < pageCount) {
        afterLoad.current = 'first';
        void runQuery((q) => ({ ...q, page: q.page + 1 }));
      } else go(rowIndex + 1);
    } else if (key === 'ArrowUp') {
      if (rowIndex === 0) {
        focusBody.current = false;
        gridRef.current?.querySelector<HTMLElement>(`[data-filter="${current.col}"]`)?.focus();
      } else go(rowIndex - 1);
    } else if (key === 'ArrowLeft') go(rowIndex, Math.max(0, current.col - 1));
    else if (key === 'ArrowRight') go(rowIndex, Math.min(colMax, current.col + 1));
    else if (key === 'Home' && e.ctrlKey) go(0);
    else if (key === 'End' && e.ctrlKey) go(rows.length - 1);
    else if (key === 'Home') go(rowIndex, 0);
    else if (key === 'End') go(rowIndex, colMax);
    else if ((key === 'PageDown' || key === 'PageUp') && e.altKey) {
      const page = query.page + (key === 'PageDown' ? 1 : -1);
      if (page >= 1 && page <= pageCount) void runQuery((q) => ({ ...q, page }));
    } else if (key === 'PageDown') go(rowIndex + visibleRowCount());
    else if (key === 'PageUp') go(rowIndex - visibleRowCount());
    else if (key === ' ' && selectionMode === 'multi') toggleRow(rowIndex, e.shiftKey);
    else if (key === 'Enter' || key === 'F2') {
      if (edit === 'panel' && key === 'Enter' && canUpdate) setPanel({ row: currentRow });
      else startEdit(currentRow, current.col);
    } else if (key === 'Insert') insertRow();
    else if (key === 'Delete' && e.ctrlKey) toggleDelete();
    else if (key === 'Escape') {
      const entry = entryOf(currentRow);
      if (entry?.state === 'deleted' || entry?.state === 'new')
        dispatch({ type: 'toggleDelete', row: currentRow });
      else if (entry) dispatch({ type: 'revert', rid: currentRow._rid });
      else return;
    } else if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && edit === 'inline') {
      if (!startEdit(currentRow, current.col, key)) return;
    } else return;
    e.preventDefault();
  };

  // ── render ───────────────────────────────────────────────────────────────────────────────
  const leadCount = selectionMode === 'multi' ? 2 : 1;
  const colWidth = (c: ColumnView<Row>) => c.width ?? DEFAULT_WIDTH[resource.columns[c.col]!.type];
  const offset = (query.page - 1) * query.size;
  const counter = filtersPending
    ? pt.db.filtrosPendentes
    : (currentRow
        ? pt.db.registo(offset + rowIndex + 1, formatNumber(total), capped)
        : pt.db.registos(total, formatNumber(total), capped)) +
      (selection.mode === 'ids' ? ` · ${pt.db.seleccionados(selection.ids.length)}` : '');

  const headerCheckbox = (
    <th scope="col" className="w-8 border-b border-r border-border">
      <input
        type="checkbox"
        aria-label={pt.db.seleccionarTodos}
        checked={selection.mode === 'consulta'}
        ref={(el) => {
          if (el) el.indeterminate = selection.mode === 'ids';
        }}
        onChange={toggleAll}
        className="size-3.5 accent-primary"
      />
    </th>
  );
  const lead = (
    <>
      <th scope="col" className={cn('w-6 border-b border-border', leadCount === 1 && 'border-r')}>
        <span className="sr-only">Estado</span>
      </th>
      {selectionMode === 'multi' && headerCheckbox}
    </>
  );

  let body: ReactNode;
  const span = cols.length + leadCount + 1;
  if (props.master && masterKeys === null) {
    body = (
      <StateRow span={span}>
        {props.master.newMaster ? pt.db.guardeMestre : pt.db.seleccioneRegisto}
      </StateRow>
    );
  } else if (list.isPending && enabled) {
    body = Array.from({ length: 8 }, (_, i) => (
      <tr key={i} className="h-7 border-b border-border">
        <td colSpan={span} className="px-2">
          <div className="h-3 w-full animate-pulse rounded-sm bg-muted motion-reduce:animate-none" />
        </td>
      </tr>
    ));
  } else if (list.isError && !list.data) {
    const err = list.error as ApiError;
    body = (
      <StateRow span={span}>
        <CircleAlert className="mx-auto mb-2 size-5 text-danger-text" aria-hidden />
        <p className="text-danger-text">{err.message}</p>
        {err.requestId && (
          <p className="mt-1 text-xs text-muted-foreground">{pt.erro.ref(err.requestId)}</p>
        )}
        <Button variant="outline" size="sm" className="mt-3" onClick={() => void list.refetch()}>
          {pt.erro.tentarNovamente}
        </Button>
      </StateRow>
    );
  } else if (rows.length === 0) {
    body = filtersActive ? (
      <StateRow span={span}>
        <SearchX className="mx-auto mb-2 size-5 text-muted-foreground" aria-hidden />
        <p>{props.emptyText ?? pt.db.consultaSemRegistos}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => void clearFilters()}>
          {pt.db.limparFiltros}
        </Button>
      </StateRow>
    ) : (
      <StateRow span={span}>
        <p>{props.emptyText ?? pt.db.semRegistos}</p>
        {canInsert && (
          <Button size="sm" className="mt-3" onClick={insertRow}>
            <Plus /> {pt.db.novo}
          </Button>
        )}
      </StateRow>
    );
  } else {
    body = table.getRowModel().rows.map((tr, i) => {
      const row = tr.original as Row;
      const entry = entryOf(row);
      const isCurrent = row._rid === current.rid;
      const msgId = `${heading}-${row._rid}-msg`.replace(/\W/g, '');
      const error = entry?.error;
      return (
        <RowView
          key={row._rid}
          row={row}
          index={i}
          entry={entry}
          isCurrent={isCurrent}
          selected={tr.getIsSelected()}
          msgId={error ? msgId : undefined}
          span={span}
          onConflictRefresh={() => {
            dispatch({ type: 'revert', rid: row._rid });
            void list.refetch();
          }}
        >
          <td className={cn('w-6 border-border text-center', leadCount === 1 && 'border-r')}>
            <Gutter entry={entry} />
          </td>
          {selectionMode === 'multi' && (
            <td className="w-8 border-r border-border text-center">
              <input
                type="checkbox"
                aria-label={pt.db.seleccionarRegisto}
                checked={tr.getIsSelected()}
                aria-disabled={selection.mode === 'consulta' || undefined}
                disabled={row._rid.startsWith('tmp:')}
                onChange={() => {}}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRow(i, e.shiftKey);
                }}
                className="size-3.5 accent-primary"
              />
            </td>
          )}
          {tr.getAllCells().map((cell, ci) => {
            const c = cols[ci]!;
            const def = resource.columns[c.col]!;
            const isEditing = editing?.rid === row._rid && editing.col === c.col;
            const changed = entry?.state === 'dirty' && c.col in entry.values;
            const fieldError = error?.fields?.[c.col];
            return (
              <td
                key={cell.id}
                data-cell={`${row._rid}:${ci}`}
                tabIndex={isCurrent && current.col === ci ? 0 : -1}
                title={fieldError}
                onClick={() => {
                  focusBody.current = true;
                  void moveTo(row._rid, ci);
                }}
                onDoubleClick={() => {
                  if (edit === 'panel' && canUpdate) setPanel({ row });
                  else startEdit(row, ci);
                }}
                className={cn(
                  'h-7 max-w-0 truncate px-2 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                  align(c, def.type),
                  c.mono && 'font-mono',
                  def.type === 'number' && 'tabular-nums',
                  changed && 'bg-row-dirty-cell',
                  fieldError && 'ring-2 ring-inset ring-destructive',
                  entry?.state === 'deleted' && 'text-muted-foreground line-through',
                  isEditing && 'px-0.5',
                )}
              >
                {isEditing ? (
                  <CellEditor
                    def={def}
                    value={cell.getValue()}
                    initial={editing.initial}
                    dominioId={c.options?.dominioId}
                    label={def.label}
                    onCommit={(v, move) => commit(row, c.col, v, move)}
                    onCancel={() => {
                      setEditing(null);
                      focusBody.current = true;
                      setCurrent((cur) => ({ ...cur }));
                    }}
                  />
                ) : c.render ? (
                  c.render(row)
                ) : c.options ? (
                  <DominioLabel dominioId={c.options.dominioId} value={cell.getValue()} />
                ) : (
                  formatCell(def, cell.getValue())
                )}
              </td>
            );
          })}
          <td aria-hidden />
        </RowView>
      );
    });
  }

  const custom = props.toolbar?.({
    selection,
    current: currentRow,
    refetch: () => void list.refetch(),
  });
  const hasFilters = cols.some((c) => resource.columns[c.col]?.filter?.length);

  return (
    <section
      aria-label={heading}
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card',
        props.className,
      )}
    >
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">{custom}</div>
        {hasFilters && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={pt.db.ajudaFiltros}>
                  <CircleHelp />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-w-sm p-3 text-sm">
                <DropdownMenuLabel className="px-0 pt-0">{pt.db.ajudaFiltros}</DropdownMenuLabel>
                <ul className="list-disc space-y-1 pl-4">
                  {pt.db.ajudaLinhas.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void clearFilters()}
              disabled={!filtersActive && !filtersPending}
            >
              {pt.db.limparFiltros}
            </Button>
          </>
        )}
        {edit !== 'none' && (
          <>
            <Button
              size="sm"
              onClick={insertRow}
              disabled={!canInsert}
              title={props.master?.newMaster ? pt.db.guardeMestre : undefined}
            >
              <Plus /> {pt.db.novo}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDelete}
              disabled={!canDelete || (!currentRow && selection.mode !== 'ids')}
            >
              <Trash2 /> {pt.db.apagar}
            </Button>
          </>
        )}
      </div>

      {selection.mode === 'consulta' && (
        <div className="flex h-8 shrink-0 items-center gap-3 border-b border-border bg-row-selected px-3 text-sm">
          <span>{pt.db.todosSeleccionados(formatNumber(selection.total), selection.capped)}</span>
          <Button
            variant="link"
            size="sm"
            className="h-6 px-0"
            onClick={() => setSelection({ mode: 'none' })}
          >
            {pt.db.limparSeleccao}
          </Button>
        </div>
      )}

      <div ref={gridRef} className="relative min-h-0 flex-1 overflow-auto">
        <table
          role="grid"
          aria-label={heading}
          aria-busy={list.isFetching || undefined}
          aria-rowcount={total}
          className="w-full table-fixed border-separate border-spacing-0 text-sm"
        >
          <colgroup>
            <col style={{ width: 24 }} />
            {selectionMode === 'multi' && <col style={{ width: 32 }} />}
            {cols.map((c) => (
              <col key={c.col} style={{ width: colWidth(c) }} />
            ))}
            <col />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <HeaderRow
              resource={resource}
              cols={cols as ColumnView<never>[]}
              lead={lead}
              leadCount={leadCount}
              sortOf={sortOf}
              onSort={onSort}
              shown={shown}
              isPending={isPendingCol}
              errors={filterErrors}
              onChange={(col, v) => setPending((p) => ({ ...p, [col]: v }))}
              onExecute={(o) => void executeFilters(o)}
              onEscape={(col) =>
                setPending((p) =>
                  shown(col) === '' || (Array.isArray(shown(col)) && shown(col).length === 0)
                    ? {}
                    : { ...p, [col]: '' },
                )
              }
              onToBody={() => {
                const r = rows[0];
                if (!r) return;
                focusBody.current = true;
                void moveTo(currentRow?._rid ?? r._rid);
              }}
            />
            {list.isFetching && list.data && (
              <tr aria-hidden>
                <td colSpan={span} className="h-0.5 p-0">
                  <div className="h-0.5 w-full animate-pulse bg-primary motion-reduce:animate-none" />
                </td>
              </tr>
            )}
          </thead>
          <tbody onKeyDown={onBodyKey}>{body}</tbody>
        </table>
      </div>

      {isDirty && (
        <DirtyBar
          overlay={overlay}
          error={barError}
          saving={saving}
          onCancel={discard}
          onSave={() => void save()}
        />
      )}
      <Footer
        counter={counter}
        page={query.page}
        pageCount={pageCount}
        capped={capped}
        pageFull={(list.data?.rows.length ?? 0) >= query.size}
        size={query.size}
        onPage={(page) => void runQuery((q) => ({ ...q, page }))}
        onSize={(size) => void runQuery((q) => ({ ...q, size, page: 1 }))}
      />

      {panel && (
        <PanelForm
          resource={resource}
          columns={props.columns as ColumnView<never>[]}
          endpoint={endpoint}
          row={panel.row}
          defaults={props.defaults?.()}
          title={panel.row ? `${heading} ${String(idOf(panel.row))}` : `${heading} · ${pt.db.novo}`}
          onClose={() => setPanel(null)}
        />
      )}
    </section>
  );
}

function StateRow({ span, children }: { span: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={span} className="py-10 text-center text-sm text-muted-foreground">
        {children}
      </td>
    </tr>
  );
}

function RowView(props: {
  row: GridRow;
  index: number;
  entry: OverlayEntry | undefined;
  isCurrent: boolean;
  selected: boolean;
  msgId: string | undefined;
  span: number;
  onConflictRefresh: () => void;
  children: ReactNode;
}) {
  const { entry, isCurrent, selected } = props;
  const errorish =
    entry?.status === 'error' || entry?.status === 'conflict' || entry?.status === 'locked';
  return (
    <>
      <tr
        aria-selected={selected || undefined}
        aria-rowindex={props.index + 1}
        aria-describedby={props.msgId}
        className={cn(
          'border-b border-border [&>td]:border-b [&>td]:border-border hover:bg-row-hover',
          isCurrent &&
            'bg-row-current [&>td:first-child]:shadow-[inset_2px_0_0_var(--row-current-bar)]',
          selected && 'bg-row-selected',
          entry?.state === 'new' && '[&>td:first-child]:shadow-[inset_2px_0_0_var(--row-new-bar)]',
          entry?.state === 'deleted' && 'bg-row-deleted',
          errorish && 'bg-row-error',
        )}
      >
        {props.children}
      </tr>
      {errorish && entry?.error && (
        <tr>
          <td
            colSpan={props.span}
            id={props.msgId}
            className="h-5 border-b border-border bg-row-error px-8 text-xs text-field-error"
          >
            {entry.error.message}
            {entry.status === 'conflict' && (
              <button
                type="button"
                className="ml-2 font-semibold underline"
                onClick={props.onConflictRefresh}
              >
                {pt.db.actualizar}
              </button>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

/** Row state icon (§3.8), with a tooltip and screen-reader text. */
function Gutter({ entry }: { entry: OverlayEntry | undefined }) {
  if (!entry) return null;
  const e = pt.db.estado;
  const [Icon, label, cls] =
    entry.status === 'saving'
      ? [Loader2, e.aGuardar, 'size-3 animate-spin motion-reduce:animate-none']
      : entry.status === 'error'
        ? [CircleAlert, e.erro, 'text-icon-danger']
        : entry.status === 'conflict'
          ? [RefreshCw, e.conflito, 'text-icon-danger']
          : entry.status === 'locked'
            ? [Lock, e.conflito, 'text-icon-danger']
            : entry.state === 'new'
              ? [Plus, e.novo, 'text-status-success-fg']
              : entry.state === 'deleted'
                ? [Minus, e.apagado, 'text-icon-danger']
                : [Circle, e.alterado, 'size-2 fill-icon-pending text-icon-pending'];
  return (
    <span title={label} className="inline-flex items-center justify-center">
      <Icon className={cn('size-3.5', cls)} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

function DominioLabel({ dominioId, value }: { dominioId: string; value: unknown }) {
  const { data } = useDominio(dominioId);
  if (value == null) return null;
  return <>{data?.find((o) => o.value === value)?.label ?? String(value)}</>;
}
