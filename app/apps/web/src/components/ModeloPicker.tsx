import type { ListQuery } from '@gestsiid/shared';
import { Picker } from './Picker';

export interface ModeloRow {
  ID: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (row: ModeloRow) => void;
}

// LOV_MODELOS (`select id from doc_modelos_documento`), read-only `modelosLov` resource.
const QUERY: ListQuery = { filters: {}, sort: [], page: 1, size: 500 };

/** Model picker (MASTER_PLAN Step 5.0): used by the USR screen's "Nova impressora" and
 * "Copiar do modelo"/"Copiar do utilizador" dialogs. */
export function ModeloPicker({ open, onOpenChange, onSelect }: Props) {
  return (
    <Picker<ModeloRow>
      open={open}
      onOpenChange={onOpenChange}
      onSelect={onSelect}
      title="Escolher modelo"
      listLabel="Modelos"
      endpoint="/modelos-lov"
      query={QUERY}
      searchLabel="Pesquisar modelo"
      searchPlaceholder="Pesquisar por id"
      emptyLabel="Não existem registos."
      matches={(r, term) => r.ID.toUpperCase().includes(term)}
      sort={(a, b) => a.ID.localeCompare(b.ID)}
      keyOf={(row) => row.ID}
      renderOption={(row) => <span className="font-semibold">{row.ID}</span>}
    />
  );
}
