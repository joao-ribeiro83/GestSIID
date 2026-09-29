import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toQueryString, type ListQuery, type PagedResult } from '@gestsiid/shared';
import { apiFetch } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface PickerProps<Row> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (row: Row) => void;
  /** Dialog title (`Escolher impressora`, `Escolher modelo`, …). */
  title: string;
  /** `<ul role="listbox">`'s own accessible name — kept separate from `title` (the original
   * `ImpressoraPicker`'s listbox was labelled "Impressoras", not "Escolher impressora"). */
  listLabel: string;
  /** `apiFetch` path, e.g. `/impressoras`, `/modelos-lov`. */
  endpoint: string;
  query: ListQuery;
  searchLabel: string;
  searchPlaceholder: string;
  emptyLabel: string;
  errorLabel?: string;
  loadingLabel?: string;
  matches: (row: Row, term: string) => boolean;
  sort?: (a: Row, b: Row) => number;
  keyOf: (row: Row) => string | number;
  renderOption: (row: Row) => ReactNode;
}

/**
 * Generic searchable LOV dialog (MASTER_PLAN Step 5.0): fed by a resource's list endpoint,
 * client-side text filter + sort, one row per option. `ImpressoraPicker` was the only instance
 * of this shape ("generalise it when a second picker is needed", `app/CLAUDE.md`); `ModeloPicker`
 * / `UtilizadorPicker` are the second and third.
 */
export function Picker<Row>({
  open,
  onOpenChange,
  onSelect,
  title,
  listLabel,
  endpoint,
  query,
  searchLabel,
  searchPlaceholder,
  emptyLabel,
  errorLabel = 'Falha no Carregamento !!',
  loadingLabel = 'A carregar…',
  matches,
  sort,
  keyOf,
  renderOption,
}: PickerProps<Row>) {
  const [search, setSearch] = useState('');
  const list = useQuery({
    queryKey: [endpoint, 'picker', query],
    queryFn: () => apiFetch<PagedResult<Row>>(`${endpoint}?${toQueryString(query)}`),
    enabled: open,
  });

  const rows = useMemo(() => {
    const term = search.trim().toUpperCase();
    const filtered = (list.data?.rows ?? []).filter((r) => term === '' || matches(r, term));
    return sort ? [...filtered].sort(sort) : filtered;
  }, [list.data, search, matches, sort]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-[480px] flex-col gap-3">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <input
          autoFocus
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchLabel}
          className="h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <ul
          role="listbox"
          aria-label={listLabel}
          className="max-h-72 overflow-auto rounded-lg border border-border"
        >
          {list.isPending && <li className="p-3 text-sm text-muted-foreground">{loadingLabel}</li>}
          {list.isError && <li className="p-3 text-sm text-field-error">{errorLabel}</li>}
          {!list.isPending && !list.isError && rows.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">{emptyLabel}</li>
          )}
          {rows.map((row) => (
            <li key={keyOf(row)}>
              <button
                type="button"
                role="option"
                onClick={() => {
                  onSelect(row);
                  onOpenChange(false);
                }}
                className="flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent"
              >
                {renderOption(row)}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
