import { useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react';
import { pt, type Resource } from '@gestsiid/shared';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useDominio } from './CellEditor';
import type { ColumnView } from './DataBlock';

export type FilterValue = string | string[];

interface Props {
  resource: Resource;
  cols: ColumnView<never>[];
  /** Leading cells: gutter, and the select-all checkbox when selection is on. */
  lead: ReactNode;
  leadCount: number;
  sortOf: (key: string) => { dir: false | 'asc' | 'desc'; index: number; count: number };
  /** The sort key of a column for the current role (`ColumnView.sortKey` or the column), null = not sortable. */
  sortKeyOf: (c: ColumnView<never>) => string | null;
  onSort: (key: string, multi: boolean) => void;
  shown: (col: string) => FilterValue;
  isPending: (col: string) => boolean;
  errors: Record<string, string>;
  onChange: (col: string, v: FilterValue) => void;
  onExecute: (override?: Record<string, FilterValue>) => void;
  onEscape: (col: string) => void;
  onToBody: () => void;
}

const sortLabel = (dir: false | 'asc' | 'desc') =>
  dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : undefined;

/** Sticky column headers (sort, §3.5) and the query-by-example filter row (§3.3). */
export function HeaderRow({
  resource,
  cols,
  lead,
  leadCount,
  sortOf,
  sortKeyOf,
  onSort,
  shown,
  isPending,
  errors,
  onChange,
  onExecute,
  onEscape,
  onToBody,
}: Props) {
  // Arrow keys move between headers and down into the filter row (§3.14).
  const onHeaderKey = (e: React.KeyboardEvent<HTMLElement>, i: number, key: string | null) => {
    const row = e.currentTarget.closest('thead');
    const focus = (sel: string) => row?.querySelector<HTMLElement>(sel)?.focus();
    if (e.key === 'ArrowRight') focus(`[data-head="${i + 1}"]`);
    else if (e.key === 'ArrowLeft') focus(`[data-head="${i - 1}"]`);
    else if (e.key === 'ArrowDown') focus(`[data-filter="${i}"]`);
    else if (e.key === 'Enter' && e.shiftKey && key) onSort(key, true);
    else return;
    e.preventDefault();
  };

  return (
    <>
      <tr className="h-8 bg-surface-header">
        {lead}
        {cols.map((c, i) => {
          const def = resource.columns[c.col];
          if (!def) return null;
          const key = sortKeyOf(c);
          const { dir, index, count } = sortOf(key ?? c.col);
          const label = c.header ?? def.label;
          return (
            <th
              key={c.col}
              scope="col"
              aria-sort={index === 0 ? sortLabel(dir) : undefined}
              title={c.header ? def.label : undefined}
              className={cn(
                'border-b border-border px-2 text-sm font-semibold',
                align(c, def.type),
              )}
            >
              {key ? (
                <button
                  type="button"
                  data-head={i}
                  aria-label={c.header ? def.label : undefined}
                  onClick={(e) => onSort(key, e.shiftKey)}
                  onKeyDown={(e) => onHeaderKey(e, i, key)}
                  className="inline-flex max-w-full items-center gap-1 rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="truncate">{label}</span>
                  {dir && (
                    <span className="inline-flex items-start text-primary" aria-hidden>
                      {dir === 'asc' ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      )}
                      {count > 1 && <sup className="text-[10px]">{index + 1}</sup>}
                    </span>
                  )}
                </button>
              ) : (
                <span
                  data-head={i}
                  tabIndex={-1}
                  className="truncate"
                  onKeyDown={(e) => onHeaderKey(e, i, null)}
                >
                  {label}
                </span>
              )}
            </th>
          );
        })}
        <th aria-hidden className="border-b border-border" />
      </tr>
      <tr className="h-8 bg-surface-header">
        <td colSpan={leadCount} className="border-b border-r border-border" />
        {cols.map((c, i) => {
          const def = resource.columns[c.col];
          if (!def?.filter?.length) return <td key={c.col} className="border-b border-border" />;
          const error = errors[c.col];
          const pendingCls = isPending(c.col) && 'border-b border-dashed border-b-icon-pending';
          return (
            <td key={c.col} className="border-b border-border px-1">
              {c.options && def.filter.includes('in') ? (
                <MultiSelectFilter
                  index={i}
                  label={def.label}
                  dominioId={c.options.dominioId}
                  value={(shown(c.col) as string[]) ?? []}
                  onApply={(v) => {
                    onChange(c.col, v);
                    onExecute({ [c.col]: v });
                  }}
                  onToBody={onToBody}
                />
              ) : (
                <input
                  data-filter={i}
                  aria-label={`Filtro ${def.label}`}
                  aria-invalid={error ? true : undefined}
                  title={error}
                  value={shown(c.col) as string}
                  placeholder={def.type === 'date' ? 'DD-MM-AAAA..' : undefined}
                  onChange={(e) => onChange(c.col, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'F8') onExecute();
                    else if (e.key === 'Escape') onEscape(c.col);
                    else if (e.key === 'ArrowDown') onToBody();
                    else if (e.key === 'ArrowUp')
                      e.currentTarget
                        .closest('thead')
                        ?.querySelector<HTMLElement>(`[data-head="${i}"]`)
                        ?.focus();
                    else return;
                    e.preventDefault();
                  }}
                  className={cn(
                    'h-7 w-full rounded-sm border border-input bg-background px-1.5 text-sm font-normal outline-none focus-visible:border-ring',
                    def.type === 'number' && 'text-right',
                    pendingCls,
                    error && 'border-destructive outline outline-1 outline-destructive',
                  )}
                />
              )}
            </td>
          );
        })}
        <td aria-hidden className="border-b border-border" />
      </tr>
    </>
  );
}

export function align(c: { align?: 'start' | 'end' | 'center' }, type: string) {
  const a = c.align ?? (type === 'number' ? 'end' : 'start');
  return a === 'end' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';
}

/** Multi-select domain filter (`f[COL][in]`): applies when the menu closes with a change. */
function MultiSelectFilter(props: {
  index: number;
  label: string;
  dominioId: string;
  value: string[];
  onApply: (v: string[]) => void;
  onToBody: () => void;
}) {
  const { data: options = [] } = useDominio(props.dominioId);
  const [draft, setDraft] = useState<string[] | null>(null);
  const current = draft ?? props.value;
  const summary =
    current.length === 0
      ? pt.db.todos
      : current.map((v) => options.find((o) => o.value === v)?.label ?? v).join(', ');

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) setDraft(props.value);
        else {
          if (draft && draft.join() !== props.value.join()) props.onApply(draft);
          setDraft(null);
        }
      }}
    >
      <DropdownMenuTrigger
        data-filter={props.index}
        aria-label={`Filtro ${props.label}`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !e.altKey) {
            e.preventDefault();
            props.onToBody();
          }
        }}
        className="flex h-7 w-full items-center justify-between gap-1 rounded-sm border border-input bg-background px-1.5 text-left text-sm font-normal outline-none focus-visible:border-ring"
      >
        <span className={cn('truncate', current.length === 0 && 'text-muted-foreground')}>
          {summary}
        </span>
        <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.value}
            checked={current.includes(o.value)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(on) =>
              setDraft((d) => {
                const base = d ?? props.value;
                return on ? [...base, o.value] : base.filter((v) => v !== o.value);
              })
            }
          >
            {o.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
