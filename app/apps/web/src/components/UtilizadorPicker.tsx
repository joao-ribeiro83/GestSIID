import type { ListQuery } from '@gestsiid/shared';
import { Picker } from './Picker';

export interface UtilizadorRow {
  CDIDUSR: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (row: UtilizadorRow) => void;
}

// LOV_UTILIZADORES (`select cdidusr from m_usuarios`), read-only `utilizadoresLov` resource.
const QUERY: ListQuery = { filters: {}, sort: [], page: 1, size: 500 };

/** User picker (MASTER_PLAN Step 5.0): used by the USR screen's "Nova impressora" and
 * "Copiar do utilizador" dialogs. */
export function UtilizadorPicker({ open, onOpenChange, onSelect }: Props) {
  return (
    <Picker<UtilizadorRow>
      open={open}
      onOpenChange={onOpenChange}
      onSelect={onSelect}
      title="Escolher utilizador"
      listLabel="Utilizadores"
      endpoint="/utilizadores-lov"
      query={QUERY}
      searchLabel="Pesquisar utilizador"
      searchPlaceholder="Pesquisar por id"
      emptyLabel="Não existem registos."
      matches={(r, term) => r.CDIDUSR.toUpperCase().includes(term)}
      sort={(a, b) => a.CDIDUSR.localeCompare(b.CDIDUSR)}
      keyOf={(row) => row.CDIDUSR}
      renderOption={(row) => <span className="font-semibold">{row.CDIDUSR}</span>}
    />
  );
}
