import { createFileRoute } from '@tanstack/react-router';
import { tiposMidia, UNIDADES_DOMINIOS } from '@gestsiid/shared';
import { DataBlock, type ColumnView } from '@/components/datablock/DataBlock';
import type { GridRow } from '@/components/datablock/dirty';

/** Administração › Tipos Mídia (Step 4.2): FD_TIPOS_MiDIA over CFG_TIPOS_MIDIA. */
export const Route = createFileRoute('/_app/administracao/tipos-midia')({
  component: TiposMidiaScreen,
});

// Select fed by the Unidades de Medida list (RG_UNIDADES_MEDIDA, ordered by FACTOR).
const unidade = { source: 'dominio', dominioId: UNIDADES_DOMINIOS.todas } as const;

// Form's field order (STRUCTURE.md §3.18): Id, Designação, U.M., Tamanho, Bytes, Descrição.
const columns: ColumnView<GridRow>[] = [
  { col: 'ID', width: 112, mono: true },
  { col: 'DESIGNACAO', width: 240 },
  { col: 'UNIDADE_MEDIDA_ID', options: unidade, width: 128 },
  { col: 'TAMANHO_MIDIA', width: 96 },
  { col: 'TAMANHO_BYTES', width: 160 },
  { col: 'DESCRICAO', width: 280 },
  { col: 'GEN_MEDIDA_RF', hidden: true },
  { col: 'CRIADO_POR', hidden: true },
  { col: 'DATA_CRIACAO', hidden: true },
  { col: 'ACTUALIZADO_POR', hidden: true },
  { col: 'DATA_ACTUALIZACAO', hidden: true },
];

function TiposMidiaScreen() {
  const { session } = Route.useRouteContext();
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <DataBlock
        className="min-h-0 flex-1"
        heading="Tipos de mídia"
        resource={tiposMidia}
        columns={columns}
        role={session.role}
        edit="inline"
        defaults={() => ({ UNIDADE_MEDIDA_ID: 'GB' })} // item initial value in the form
      />
    </div>
  );
}
