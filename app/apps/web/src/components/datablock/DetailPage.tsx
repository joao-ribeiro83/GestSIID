import type { ReactNode } from 'react';
import { pt } from '@gestsiid/shared';
import { Voltar } from '@/components/shell/page-actions';
import type { GridRow } from './dirty';
import { useRow } from './useRow';

/** The detail pages' tab bar style (Modelos, Documentos). */
export const tabCls =
  '-mb-px border-b-2 border-transparent px-3 py-1.5 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:border-primary data-[state=active]:font-semibold data-[state=active]:text-foreground';

/**
 * A row's own page (D-34): Voltar in the page header, an h2 naming the row ("Modelo D1.A5 · …"),
 * then the secondary tables. The row is read by its key (so a bookmarked link works); a key that
 * matches no row — mistyped, not a number, or deleted meanwhile — shows "Registo não encontrado."
 * instead of grids that would offer to insert under it.
 */
export function DetailPage<Row extends GridRow>(props: {
  /** The list route, for Voltar without history. */
  list: string;
  /** List endpoint and key column the row is read from. */
  endpoint: string;
  keyCol?: string;
  id: string;
  /** "Modelo", "Documento"…; the h2 starts with it and the key. */
  label: string;
  describe?: (row: Row) => ReactNode;
  /** Buttons on the h2's line (Mostrar Documento…). */
  actions?: ReactNode;
  children: (row: Row) => ReactNode;
}) {
  const row = useRow<Row>(props.endpoint, props.keyCol ?? 'ID', props.id);
  const missing = row.isError || (row.isSuccess && row.data === null);
  return (
    <section aria-label={`${props.label} ${props.id}`} className="flex min-h-0 flex-1 flex-col gap-2">
      <Voltar to={props.list} />
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-sm font-semibold">
          {props.label} <span className="font-mono">{props.id}</span>
          {row.data && props.describe && (
            <span className="font-normal text-muted-foreground"> · {props.describe(row.data)}</span>
          )}
        </h2>
        {row.data && props.actions}
      </div>
      {missing && (
        <p role="alert" className="text-sm text-muted-foreground">
          {pt.db.registoNaoEncontrado}
        </p>
      )}
      {row.data && props.children(row.data)}
    </section>
  );
}
