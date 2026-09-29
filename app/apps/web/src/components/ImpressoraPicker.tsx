import type { ListQuery } from '@gestsiid/shared';
import { Picker } from './Picker';

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
 * Searchable printer picker (Step 4.1, generalised in Step 5.0 onto {@link Picker}): fed by the
 * same `/impressoras` list endpoint as the DataBlock, sorted by numeric id client-side (the id is
 * stored as text, `ID_IMPRESSORA_SEQ` digits). Used by Reimprimir and Novo backup (future
 * screens) and by the "Nova impressora"/"Alterar Validade" dialogs of Impressoras Associadas.
 */
export function ImpressoraPicker({ open, onOpenChange, onSelect }: Props) {
  return (
    <Picker<ImpressoraRow>
      open={open}
      onOpenChange={onOpenChange}
      onSelect={onSelect}
      title="Escolher impressora"
      listLabel="Impressoras"
      endpoint="/impressoras"
      query={QUERY}
      searchLabel="Pesquisar impressora"
      searchPlaceholder="Pesquisar por id, descrição ou endereço"
      emptyLabel="Não existem registos."
      matches={(r, term) =>
        String(r.ID).toUpperCase().includes(term) ||
        (r.DESCRICAO ?? '').toUpperCase().includes(term) ||
        (r.ENDERECO ?? '').toUpperCase().includes(term)
      }
      sort={(a, b) => Number(a.ID) - Number(b.ID)}
      keyOf={(row) => row.ID}
      renderOption={(row) => (
        <>
          <span className="font-semibold">
            {row.ID} — {row.DESCRICAO}
          </span>
          {row.ENDERECO && <span className="text-xs text-muted-foreground">{row.ENDERECO}</span>}
        </>
      )}
    />
  );
}
