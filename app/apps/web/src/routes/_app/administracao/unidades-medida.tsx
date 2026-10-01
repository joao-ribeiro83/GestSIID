import { createFileRoute } from '@tanstack/react-router';
import { unidadesMedida, UNIDADES_DOMINIOS } from '@gestsiid/shared';
import { DataBlock, type ColumnView } from '@/components/datablock/DataBlock';
import type { GridRow } from '@/components/datablock/dirty';

/** Administração › Unidades Medida (Step 4.2): FD_UNIDADES_MEDIDA over CFG_UNIDADES_MEDIDA. */
export const Route = createFileRoute('/_app/administracao/unidades-medida')({
  component: UnidadesMedidaScreen,
});

const base = { source: 'dominio', dominioId: UNIDADES_DOMINIOS.base } as const;

// Form's field order (STRUCTURE.md §3.17): Unidade, Nome, Factor, Unidade Base.
const columns: ColumnView<GridRow>[] = [
  { col: 'ID', width: 96, mono: true },
  { col: 'NOME', width: 240 },
  { col: 'FACTOR', width: 200 },
  { col: 'UNIDADE_BASE_ID', options: base, width: 160 },
  { col: 'GEN_MEDIDA_RF', hidden: true },
  { col: 'CRIADO_POR', hidden: true },
  { col: 'DATA_CRIACAO', hidden: true },
  { col: 'ACTUALIZADO_POR', hidden: true },
  { col: 'DATA_ACTUALIZACAO', hidden: true },
];

function UnidadesMedidaScreen() {
  const { session } = Route.useRouteContext();
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <DataBlock
        className="min-h-0 flex-1"
        heading="Unidades de medida"
        resource={unidadesMedida}
        columns={columns}
        role={session.role}
        edit="inline"
      />
    </div>
  );
}
