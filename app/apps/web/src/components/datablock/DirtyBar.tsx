import { Circle } from 'lucide-react';
import { pt } from '@gestsiid/shared';
import { Button } from '@/components/ui/button';
import type { Overlay } from './dirty';

/** Sticky bar while rows are unsaved (§3.10): counts, first error, Cancelar / Guardar. */
export function DirtyBar(props: {
  overlay: Overlay;
  error: string | null;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const entries = Object.values(props.overlay);
  const text = pt.db.alteracoes({
    novos: entries.filter((e) => e.state === 'new').length,
    alterados: entries.filter((e) => e.state === 'dirty').length,
    apagados: entries.filter((e) => e.state === 'deleted').length,
  });
  return (
    <div
      role="region"
      aria-label={pt.db.alteracoesRegiao}
      className="flex h-11 shrink-0 items-center gap-4 border-t border-border bg-dirty-bar-bg px-3 text-sm text-dirty-bar-fg"
    >
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <Circle className="size-2 fill-icon-pending text-icon-pending" aria-hidden />
        {text}
      </span>
      <span
        role="alert"
        className="min-w-0 flex-1 truncate text-field-error"
        title={props.error ?? undefined}
      >
        {props.error}
      </span>
      <Button variant="outline" size="sm" onClick={props.onCancel} disabled={props.saving}>
        {pt.cancelar}
      </Button>
      <Button size="sm" onClick={props.onSave} disabled={props.saving}>
        {pt.db.guardar}
        <kbd className="rounded-sm border border-primary-foreground/40 px-1 font-mono text-[10px] font-normal">
          Ctrl S
        </kbd>
      </Button>
    </div>
  );
}
