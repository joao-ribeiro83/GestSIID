import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { reportParametros, reports, REPORTS_DOMINIOS } from '@gestsiid/shared';
import { DataBlock, type ColumnView } from '@/components/datablock/DataBlock';
import type { GridRow } from '@/components/datablock/dirty';
import { useDetailBlock } from '@/components/datablock/useDetailBlock';

/**
 * Configuração › Reports (Step 4.8): FD_CONFIGURACAO_REPORTS, master `SVR_REPORT_SIID` + detail
 * `SVR_PARAMETROS_REPORT`. Every report's 1st–3rd parameters (`_USER`/`P_USUARIO`/`P_DATAACTUAL`)
 * are seeded by the API on creation and their `NOME` is locked (`editableWhen`); `N_PARAMETROS`
 * must match the parameter count, enforced server-side (`features/reports/routes.ts`).
 */
export const Route = createFileRoute('/_app/configuracao/reports')({
  component: ReportsScreen,
});

const tipoParametro = { source: 'dominio', dominioId: REPORTS_DOMINIOS.tipoParametro } as const;
const FIXED_NAMES = ['_USER', 'P_USUARIO', 'P_DATAACTUAL'];
const isFixedParam = (row: Record<string, unknown>) => FIXED_NAMES.includes(String(row['NOME']));

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

function ReportsScreen() {
  const { session } = Route.useRouteContext();
  const [current, setCurrent] = useState<GridRow | null>(null);
  const detail = useDetailBlock(current, { REPORT_ID: 'ID' });

  return (
    <main id="conteudo" className="flex h-dvh flex-col gap-3 bg-background p-4 text-foreground">
      <header>
        <h1 className="text-lg font-semibold">Reports</h1>
      </header>
      <DataBlock
        className="min-h-0 flex-[45]"
        heading="Reports"
        resource={reports}
        columns={masterColumns}
        role={session.role}
        edit="panel"
        defaults={() => ({ N_PARAMETROS: 3, VALIDO: 'S' })}
        onCurrentRowChange={setCurrent}
        beforeCurrentRowChange={detail.beforeMasterRowChange}
      />
      <DataBlock
        className="min-h-0 flex-[55]"
        heading="Parâmetros"
        resource={reportParametros}
        columns={detailColumns}
        role={session.role}
        edit="inline"
        endpoint={`/reports/${detail.keys?.['REPORT_ID'] ?? ''}/parametros`}
        defaults={() => ({ OBRIGATORIO: 'N', CHECK_UNIQUE: 'N', VALIDO: 'S' })}
        {...detail.detailProps}
      />
    </main>
  );
}
