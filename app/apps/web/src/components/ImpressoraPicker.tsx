import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toQueryString, type ListQuery, type PagedResult } from '@gestsiid/shared';
import { apiFetch } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface ImpressoraRow {
  ID: string | number;
  DESCRICAO: string | null;
  ENDERECO: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (row: ImpressoraRow) => void;
}

// LOV_IMPRESSORAS (MASTER_PLAN Step 4.1): valid printers only, ID/DESCRICAO/ENDERECO.
const QUERY: ListQuery = {
  filters: { VALIDO: [{ op: 'eq', value: 'S' }] },
  sort: [],
  page: 1,
  size: 500,
};

/**
 * Searchable printer picker (Step 4.1): fed by the same `/impressoras` list endpoint as the
 * DataBlock, sorted by numeric id client-side (the id is stored as text, `ID_IMPRESSORA_SEQ`
 * digits). Used by Reimprimir and Novo backup (future screens, MASTER_PLAN Step 4.1).
 */
export function ImpressoraPicker({ open, onOpenChange, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const list = useQuery({
    queryKey: ['impressoras', 'picker'],
    queryFn: () => apiFetch<PagedResult<ImpressoraRow>>(`/impressoras?${toQueryString(QUERY)}`),
    enabled: open,
  });

  const rows = useMemo(() => {
    const term = search.trim().toUpperCase();
    return (list.data?.rows ?? [])
      .filter(
        (r) =>
          term === '' ||
          String(r.ID).toUpperCase().includes(term) ||
          (r.DESCRICAO ?? '').toUpperCase().includes(term) ||
          (r.ENDERECO ?? '').toUpperCase().includes(term),
      )
      .sort((a, b) => Number(a.ID) - Number(b.ID));
  }, [list.data, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-[480px] flex-col gap-3">
        <DialogHeader>
          <DialogTitle>Escolher impressora</DialogTitle>
        </DialogHeader>
        <input
          autoFocus
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pesquisar por id, descrição ou endereço"
          aria-label="Pesquisar impressora"
          className="h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <ul
          role="listbox"
          aria-label="Impressoras"
          className="max-h-72 overflow-auto rounded-lg border border-border"
        >
          {list.isPending && <li className="p-3 text-sm text-muted-foreground">A carregar…</li>}
          {list.isError && <li className="p-3 text-sm text-field-error">Falha no Carregamento !!</li>}
          {!list.isPending && !list.isError && rows.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">Não existem registos.</li>
          )}
          {rows.map((row) => (
            <li key={row.ID}>
              <button
                type="button"
                role="option"
                onClick={() => {
                  onSelect(row);
                  onOpenChange(false);
                }}
                className="flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent"
              >
                <span className="font-semibold">
                  {row.ID} — {row.DESCRICAO}
                </span>
                {row.ENDERECO && <span className="text-xs text-muted-foreground">{row.ENDERECO}</span>}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
