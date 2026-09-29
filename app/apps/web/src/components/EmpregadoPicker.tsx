import type { ListQuery } from '@gestsiid/shared';
import { Picker } from './Picker';

export interface EmpregadoRow {
  CDEMPLEA: string;
  CDDEPARTA: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (row: EmpregadoRow) => void;
}

// LOV EMPREGADOS (`select cdemplea, cddeparta from co_empleados where swactivo='S'`); the API
// already keeps to the active ones.
const QUERY: ListQuery = { filters: {}, sort: [], page: 1, size: 500 };

/** Employee picker (FD_PERFIS_DEPARTAMENTO): returns the code and its department. */
export function EmpregadoPicker({ open, onOpenChange, onSelect }: Props) {
  return (
    <Picker<EmpregadoRow>
      open={open}
      onOpenChange={onOpenChange}
      onSelect={onSelect}
      title="Escolher empregado"
      listLabel="Empregados"
      endpoint="/empregados-lov"
      query={QUERY}
      searchLabel="Pesquisar empregado"
      searchPlaceholder="Pesquisar por código ou departamento"
      emptyLabel="Não existem registos."
      matches={(r, term) =>
        r.CDEMPLEA.toUpperCase().includes(term) || (r.CDDEPARTA ?? '').toUpperCase().includes(term)
      }
      sort={(a, b) => a.CDEMPLEA.localeCompare(b.CDEMPLEA)}
      keyOf={(row) => row.CDEMPLEA}
      renderOption={(row) => (
        <>
          <span className="font-semibold">{row.CDEMPLEA}</span>
          <span className="text-xs text-muted-foreground">{row.CDDEPARTA}</span>
        </>
      )}
    />
  );
}
