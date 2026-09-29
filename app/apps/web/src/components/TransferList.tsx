import { useId, useState, type KeyboardEvent } from 'react';
import { pt } from '@gestsiid/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface TransferColumn<Row> {
  label: string;
  value: (row: Row) => string;
  mono?: boolean;
}

export interface TransferSide<Row> {
  title: string;
  columns: TransferColumn<Row>[];
  rows: Row[];
  keyOf: (row: Row) => string;
}

interface Props<L, R> {
  left: TransferSide<L>;
  right: TransferSide<R>;
  onAdd: (keys: string[] | 'todos') => void;
  onRemove: (keys: string[] | 'todos') => void;
  /** Buttons off (UI_SPEC §4.4: until the three controls are set, or while a write runs). */
  disabled?: boolean;
  loading?: boolean;
}

/**
 * UI_SPEC §6.8: two multi-select listboxes with the four transfer buttons between them
 * (`ADD_TODOS` ⇉, `ADD_PERMISSAO` ➜, `REMOVE_PERMISSAO` ⬅, `REMOVE_TODOS` ⇇, the legacy order).
 * Keys: ArrowUp/Down move, Shift+Arrow extends, Space toggles, Enter transfers the selection.
 */
export function TransferList<L, R>({ left, right, onAdd, onRemove, disabled, loading }: Props<L, R>) {
  const [sel, setSel] = useState<{ left: Set<string>; right: Set<string> }>({
    left: new Set(),
    right: new Set(),
  });
  // Only keys still on screen count (rows move or reload under the selection).
  const live = <T,>(side: TransferSide<T>, keys: Set<string>) =>
    side.rows.map(side.keyOf).filter((k) => keys.has(k));
  const leftSel = live(left, sel.left);
  const rightSel = live(right, sel.right);

  const add = (keys: string[] | 'todos') => {
    setSel((s) => ({ ...s, left: new Set() }));
    onAdd(keys);
  };
  const remove = (keys: string[] | 'todos') => {
    setSel((s) => ({ ...s, right: new Set() }));
    onRemove(keys);
  };

  const buttons: [string, string, () => void, boolean][] = [
    ['⇉', 'Adicionar todos', () => add('todos'), left.rows.length === 0],
    ['➜', 'Adicionar seleccionados', () => add(leftSel), leftSel.length === 0],
    ['⬅', 'Retirar seleccionados', () => remove(rightSel), rightSel.length === 0],
    ['⇇', 'Retirar todos', () => remove('todos'), right.rows.length === 0],
  ];

  return (
    <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1.6fr)] items-start gap-3">
      <ListBox
        side={left}
        selected={sel.left}
        onSelect={(keys) => setSel((s) => ({ ...s, left: keys }))}
        onEnter={() => !disabled && leftSel.length > 0 && add(leftSel)}
        loading={loading}
      />
      <div className="flex flex-col gap-2 pt-10" role="group" aria-label="Transferir permissões">
        {buttons.map(([glyph, label, run, empty]) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            aria-label={label}
            title={label}
            disabled={disabled || empty}
            onClick={run}
            className="h-7 w-10 px-0 text-base"
          >
            <span aria-hidden="true">{glyph}</span>
          </Button>
        ))}
      </div>
      <ListBox
        side={right}
        selected={sel.right}
        onSelect={(keys) => setSel((s) => ({ ...s, right: keys }))}
        onEnter={() => !disabled && rightSel.length > 0 && remove(rightSel)}
        loading={loading}
      />
    </div>
  );
}

function ListBox<T>({
  side,
  selected,
  onSelect,
  onEnter,
  loading,
}: {
  side: TransferSide<T>;
  selected: Set<string>;
  onSelect: (keys: Set<string>) => void;
  onEnter: () => void;
  loading?: boolean;
}) {
  const id = useId();
  const [active, setActive] = useState(0);
  const keys = side.rows.map(side.keyOf);
  const at = Math.min(active, Math.max(keys.length - 1, 0));
  const cols = { gridTemplateColumns: `1.5rem repeat(${side.columns.length}, minmax(0, 1fr))` };

  const toggle = (k: string) => {
    const next = new Set(selected);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    onSelect(next);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (keys.length === 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.max(0, Math.min(keys.length - 1, at + (e.key === 'ArrowDown' ? 1 : -1)));
      setActive(next);
      document.getElementById(`${id}-${next}`)?.scrollIntoView({ block: 'nearest' });
      if (e.shiftKey) onSelect(new Set([...selected, keys[at]!, keys[next]!]));
    } else if (e.key === ' ') {
      e.preventDefault();
      toggle(keys[at]!);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <section aria-labelledby={`${id}-t`} className="flex min-w-0 flex-col gap-1">
      <h2 id={`${id}-t`} className="text-sm font-semibold">
        {side.title}
      </h2>
      <div className="flex h-80 flex-col overflow-hidden rounded-md border border-border">
        <div
          className="grid gap-2 border-b border-border bg-surface-header px-2 py-1 text-xs font-semibold"
          style={cols}
          aria-hidden="true"
        >
          <span />
          {side.columns.map((c) => (
            <span key={c.label}>{c.label}</span>
          ))}
        </div>
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-labelledby={`${id}-t`}
          aria-activedescendant={keys.length > 0 ? `${id}-${at}` : undefined}
          aria-busy={loading || undefined}
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="min-h-0 flex-1 overflow-auto outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          {loading && keys.length === 0 ? (
            Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="mx-2 my-2 h-4 animate-pulse rounded bg-muted" />
            ))
          ) : keys.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">{pt.db.semRegistos}</p>
          ) : (
            side.rows.map((row, i) => {
              const k = keys[i]!;
              const on = selected.has(k);
              return (
                <div
                  key={k}
                  id={`${id}-${i}`}
                  role="option"
                  aria-selected={on}
                  onClick={() => {
                    setActive(i);
                    toggle(k);
                  }}
                  style={cols}
                  className={cn(
                    'grid h-7 cursor-default items-center gap-2 px-2 text-sm',
                    on && 'bg-row-selected',
                    i === at && 'outline outline-1 -outline-offset-1 outline-ring',
                  )}
                >
                  <input
                    type="checkbox"
                    tabIndex={-1}
                    aria-hidden="true"
                    checked={on}
                    readOnly
                    className="pointer-events-none size-3.5 accent-primary"
                  />
                  {side.columns.map((c) => (
                    <span key={c.label} className={cn('truncate', c.mono && 'font-mono')}>
                      {c.value(row)}
                    </span>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {pt.db.registos(keys.length, String(keys.length), false)}
      </p>
    </section>
  );
}
