import { createFileRoute } from '@tanstack/react-router';
import { utilizadores, UTILIZADORES_DOMINIOS } from '@gestsiid/shared';
import { DataBlock, type ColumnView } from '@/components/datablock/DataBlock';
import type { GridRow } from '@/components/datablock/dirty';

/** Administração › Utilizadores (Step 4.3): FD_UTILIZADORES_SIID over CFG_UTILIZADORES. */
export const Route = createFileRoute('/_app/administracao/utilizadores')({
  component: UtilizadoresScreen,
});

const tipo = { source: 'dominio', dominioId: UTILIZADORES_DOMINIOS.tipo } as const;
const unidade = { source: 'dominio', dominioId: UTILIZADORES_DOMINIOS.unidadeNegocio } as const;

// Form's field order (STRUCTURE.md §3.19): Nome, Username, Password, Ambiente, Data Início/Fim,
// Tipo, Unidade Negócio. The password is never read back: the grid shows dots, like ConcealData.
const columns: ColumnView<GridRow>[] = [
  { col: 'NOME', width: 260 },
  { col: 'USERNAME', width: 160, mono: true },
  { col: 'PASSWORD', width: 112, render: () => '••••••••' },
  { col: 'AMBIENTE_ID', width: 144, mono: true },
  { col: 'DATA_INICIO', width: 112 },
  { col: 'DATA_FIM', width: 112 },
  { col: 'TIPO_UTILIZADOR_RF', options: tipo, width: 176 },
  { col: 'UNIDADE_NEGOCIO_RF', options: unidade, width: 144 },
  { col: 'NIVEL_ACESSO_RF', hidden: true },
  { col: 'CRIADO_POR', hidden: true },
  { col: 'DATA_CRIACAO', hidden: true },
  { col: 'ACTUALIZADO_POR', hidden: true },
  { col: 'DATA_ACTUALIZACAO', hidden: true },
];

function UtilizadoresScreen() {
  const { session } = Route.useRouteContext();
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <DataBlock
        className="min-h-0 flex-1"
        heading="Utilizadores"
        resource={utilizadores}
        columns={columns}
        role={session.role}
        edit="panel" // a secret field: edited in a form, not a grid cell
        defaults={() => ({ TIPO_UTILIZADOR_RF: 'ADM', UNIDADE_NEGOCIO_RF: 'DSI' })} // items' initial values
      />
    </div>
  );
}
