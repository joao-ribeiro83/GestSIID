import { createFileRoute } from '@tanstack/react-router';
import { variaveis, VARIAVEIS_DOMINIOS } from '@gestsiid/shared';
import { DataBlock, type ColumnView } from '@/components/datablock/DataBlock';
import type { GridRow } from '@/components/datablock/dirty';

/** Administração › Variáveis SIID (Step 4.4): FD_VARIAVEIS_SIID over SVR_VARIAVEIS_SIID. */
export const Route = createFileRoute('/_app/administracao/variaveis')({
  component: VariaveisScreen,
});

const tipo = { source: 'dominio', dominioId: VARIAVEIS_DOMINIOS.tipo } as const;

// Form's field order (STRUCTURE.md §3.20): Tipo, Valor. AMBIENTE_ID has no canvas in the form.
const columns: ColumnView<GridRow>[] = [
  { col: 'TIPO_VARIAVEL_RF', options: tipo, width: 200 },
  { col: 'VALOR', width: 520 },
  { col: 'AMBIENTE_ID', hidden: true },
];

function VariaveisScreen() {
  const { session } = Route.useRouteContext();
  return (
    <main id="conteudo" className="flex h-dvh flex-col gap-3 bg-background p-4 text-foreground">
      <header>
        <h1 className="text-lg font-semibold">Definição de variáveis do SIID</h1>
      </header>
      <DataBlock
        className="min-h-0 flex-1"
        heading="Variáveis SIID"
        resource={variaveis}
        columns={columns}
        role={session.role}
        edit="inline"
      />
    </main>
  );
}
