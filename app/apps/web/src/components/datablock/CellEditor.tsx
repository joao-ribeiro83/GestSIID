import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@gestsiid/shared';
import { apiFetch } from '@/api/client';
import { cn } from '@/lib/utils';
import { fromInput, toInput } from './format';

/** Domain values (`GET /api/dominios/:id/valores`) for select filters, editors and cell labels. */
export function useDominio(dominioId: string | undefined) {
  return useQuery({
    queryKey: ['dominio', dominioId],
    queryFn: () =>
      apiFetch<{ rows: { CHAVE: string; DESIGNACAO: string }[] }>(
        `/dominios/${encodeURIComponent(dominioId ?? '')}/valores`,
      ),
    enabled: dominioId !== undefined,
    staleTime: Infinity,
    select: (d) => d.rows.map((r) => ({ value: r.CHAVE, label: r.DESIGNACAO })),
  });
}

/** `blur`: focus already went elsewhere, so the grid must not pull it back. */
export type CommitMove = 'stay' | 'next' | 'prev' | 'blur';

interface Props {
  def: ColumnDef;
  value: unknown;
  /** A printable key that started the edit replaces the value (§3.9). */
  initial?: string;
  dominioId?: string;
  label: string;
  onCommit: (value: unknown, move: CommitMove) => void;
  onCancel: () => void;
}

/** Inline cell editor: Enter commits and stays, Tab/Shift+Tab commit and move, Esc cancels. */
export function CellEditor({ def, value, initial, dominioId, label, onCommit, onCancel }: Props) {
  const ref = useRef<HTMLInputElement & HTMLSelectElement>(null);
  const [text, setText] = useState(initial ?? toInput(def, value));
  const dominio = useDominio(dominioId);
  // Enter/Tab/Esc already ended the edit; a blur from the unmount must not commit again.
  const done = useRef(false);

  useEffect(() => {
    ref.current?.focus();
    if (initial === undefined && ref.current instanceof HTMLInputElement) ref.current.select();
  }, [initial]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape') done.current = true;
    if (e.key === 'Enter') {
      e.preventDefault();
      onCommit(fromInput(def, text), 'stay');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onCommit(fromInput(def, text), e.shiftKey ? 'prev' : 'next');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };
  const common = {
    ref,
    'aria-label': label,
    onKeyDown,
    onBlur: () => {
      if (!done.current) onCommit(fromInput(def, text), 'blur');
    },
    className: cn(
      'h-7 w-full rounded-sm border border-ring bg-background px-1.5 text-sm outline-none',
      def.type === 'number' && 'text-right tabular-nums',
    ),
  };

  if (dominioId) {
    return (
      <select {...common} value={text} onChange={(e) => setText(e.target.value)}>
        <option value="" />
        {(dominio.data ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      {...common}
      value={text}
      inputMode={def.type === 'number' ? 'decimal' : undefined}
      placeholder={def.type === 'date' ? 'DD-MM-AAAA' : undefined}
      maxLength={def.maxLength}
      onChange={(e) => setText(e.target.value)}
    />
  );
}
