import { createFileRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { reports } from '@gestsiid/shared';
import { DataBlock, type ColumnView } from '@/components/datablock/DataBlock';
import type { GridRow } from '@/components/datablock/dirty';

/**
 * Configuração › Reports (Step 4.8): FD_CONFIGURACAO_REPORTS, master `SVR_REPORT_SIID` + detail
 * `SVR_PARAMETROS_REPORT`. Every report's 1st–3rd parameters (`_USER`/`P_USUARIO`/`P_DATAACTUAL`)
 * are seeded by the API on creation and their `NOME` is locked (`editableWhen`); `N_PARAMETROS`
 * must match the parameter count, enforced server-side (`features/reports/routes.ts`).
 * D-34: the list fills the page; each row opens its parameters on `reports.$reportId.tsx`. The list
 * stays mounted (hidden) under that page, so Voltar finds its filters, sort and page unchanged.
 */
export const Route = createFileRoute('/_app/configuracao/reports')({
  component: ReportsScreen,
});

// FD_CONFIGURACAO_REPORTS field order (STRUCTURE.md §3.12): Descrição, N.º Parâmetros, Válido,
// Nome de Ficheiro, Directoria Base, Directoria Destino, Observações.
const masterColumns: ColumnView<GridRow>[] = [
  { col: 'NOME', width: 260 },
  { col: 'N_PARAMETROS', width: 120 },
  { col: 'VALIDO', width: 96 },
  { col: 'NOME_FICHEIRO', width: 220 },
  { col: 'DIRECTORIA_BASE', width: 220 },
  { col: 'DIRECTORIA_DESTINO', width: 220 },
  { col: 'OBSERVACAO', width: 320 },
  { col: 'ID', hidden: true },
  { col: 'CRIADO_POR', hidden: true },
  { col: 'DATA_CRIACAO', hidden: true },
  { col: 'ACTUALIZADO_POR', hidden: true },
  { col: 'DATA_ACTUALIZACAO', hidden: true },
];

function ReportsScreen() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const detalhe = useLocation().pathname !== '/configuracao/reports';

  return (
    <>
      <div className={detalhe ? 'hidden' : 'flex min-h-0 flex-1 flex-col'}>
        <DataBlock
          className="min-h-0 flex-1"
          heading="Reports"
          resource={reports}
          columns={masterColumns}
          role={session.role}
          edit="panel"
          defaults={() => ({ N_PARAMETROS: 3, VALIDO: 'S' })}
          rowOpenLabel="Abrir parâmetros"
          onRowOpen={(r) => void navigate({ to: '/configuracao/reports/$reportId', params: { reportId: String(r['ID']) } })}
        />
      </div>
      <Outlet />
    </>
  );
}
