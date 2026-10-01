import { useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { reportParametros, REPORTS_DOMINIOS } from '@gestsiid/shared';
import { DataBlock, type ColumnView } from '@/components/datablock/DataBlock';
import type { GridRow } from '@/components/datablock/dirty';
import { useRow } from '@/components/datablock/useRow';
import { Voltar } from '@/components/shell/page-actions';

/**
 * A report's parameters (D-34): the `SVR_PARAMETROS_REPORT` detail of Configuração › Reports, on
 * its own page. `N_PARAMETROS` must match the parameter count (server-side, D-33).
 */
export const Route = createFileRoute('/_app/configuracao/reports/$reportId')({
  component: ParametrosScreen,
});

const tipoParametro = { source: 'dominio', dominioId: REPORTS_DOMINIOS.tipoParametro } as const;
const FIXED_NAMES = ['_USER', 'P_USUARIO', 'P_DATAACTUAL'];
const isFixedParam = (row: Record<string, unknown>) => FIXED_NAMES.includes(String(row['NOME']));

// Frame "Parâmetros" (tabular): Nome do Parâmetro, Tipo de Parâmetro, Obrigatório, Único, Válido,
// Descrição. The 3 fixed parameters' Nome cannot be edited (WHEN-NEW-ITEM-INSTANCE).
const detailColumns: ColumnView<GridRow>[] = [
  { col: 'NOME', width: 220, editableWhen: (row) => !isFixedParam(row) },
  { col: 'TIPO_PARAMETRO_RF', options: tipoParametro, width: 220 },
  { col: 'OBRIGATORIO', width: 100 },
  { col: 'CHECK_UNIQUE', width: 90 },
  { col: 'VALIDO', width: 90 },
  { col: 'DESCRICAO', width: 240 },
  { col: 'REPORT_ID', hidden: true },
  { col: 'N_PARAMETRO', hidden: true },
  { col: 'CRIADO_POR', hidden: true },
  { col: 'DATA_CRIACAO', hidden: true },
  { col: 'ACTUALIZADO_POR', hidden: true },
  { col: 'DATA_ACTUALIZACAO', hidden: true },
];

function ParametrosScreen() {
  const { session } = Route.useRouteContext();
  const { reportId } = Route.useParams();
  const report = useRow('/reports', 'ID', reportId).data;
  const master = useMemo(() => ({ keys: { REPORT_ID: Number(reportId) } }), [reportId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <Voltar to="/configuracao/reports" />
      <h2 className="text-sm font-semibold">
        Report <span className="font-mono">{reportId}</span>
        {report && (
          <span className="font-normal text-muted-foreground">
            {' · '}
            {String(report['NOME'] ?? '')} · N.º Parâmetros {String(report['N_PARAMETROS'] ?? '—')}
          </span>
        )}
      </h2>
      <DataBlock
        className="min-h-0 flex-1"
        heading="Parâmetros"
        resource={reportParametros}
        columns={detailColumns}
        role={session.role}
        edit="inline"
        master={master}
        endpoint={`/reports/${reportId}/parametros`}
        defaults={() => ({ OBRIGATORIO: 'N', CHECK_UNIQUE: 'N', VALIDO: 'S' })}
      />
    </div>
  );
}
