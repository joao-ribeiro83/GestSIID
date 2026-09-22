import { useRef, useState } from 'react';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { DEMO_DOMINIOS, demoImpressoras, demoTabuleiros } from '@gestsiid/shared';
import {
  DataBlock,
  type ColumnView,
  type DataBlockHandle,
  type Selection,
} from '@/components/datablock/DataBlock';
import type { GridRow } from '@/components/datablock/dirty';
import { useDetailBlock } from '@/components/datablock/useDetailBlock';
import { cn } from '@/lib/utils';

/**
 * `/dev/datablock` (dev builds only): the DataBlock over the in-memory demo API
 * (`apps/api/src/dev-server.ts`), master printers + detail trays. Playwright drives it.
 */
export const Route = createFileRoute('/dev/datablock')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: DataBlockDemo,
});

const tipo = { source: 'dominio', dominioId: DEMO_DOMINIOS.tipo } as const;
const midia = { source: 'dominio', dominioId: DEMO_DOMINIOS.midia } as const;

const impressoraCols: ColumnView<GridRow>[] = [
  { col: 'ID', width: 64 },
  { col: 'NOME', width: 300 },
  { col: 'CODIGO', mono: true },
  { col: 'TIPO', options: tipo, width: 132 },
  { col: 'PAGINAS_MIN' },
  { col: 'DATA_INICIO' },
  { col: 'ACTUALIZADO_POR', width: 120 },
  { col: 'DATA_ACTUALIZACAO', width: 132 },
  { col: 'CRIADO_POR', hidden: true },
  { col: 'DATA_CRIACAO', hidden: true },
];

const tabuleiroCols: ColumnView<GridRow>[] = [
  { col: 'TABULEIRO', width: 96 },
  { col: 'MIDIA', options: midia, width: 132 },
  { col: 'DESCRICAO', width: 320 },
];

const today = () => `${new Date().toISOString().slice(0, 10)}T00:00:00`;

function DataBlockDemo() {
  const [mode, setMode] = useState<'inline' | 'panel'>('inline');
  const [current, setCurrent] = useState<GridRow | null>(null);
  const [selection, setSelection] = useState<Selection>({ mode: 'none' });
  const detail = useDetailBlock(current, { IMPRESSORA_ID: 'ID' });
  const master = useRef<DataBlockHandle>(null);

  return (
    <main id="conteudo" className="flex h-dvh flex-col gap-3 bg-background p-4 text-foreground">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">DataBlock</h1>
          <p className="text-sm text-muted-foreground">
            Dados de demonstração em memória. Nada é gravado em Oracle.
          </p>
        </div>
        <div
          role="group"
          aria-label="Modo de edição"
          className="inline-flex rounded-lg border border-border p-0.5 text-sm"
        >
          {(['inline', 'panel'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              // Switching remounts the grid: ask #46 first, like any other way out of a dirty block.
              onClick={async () => {
                if (m !== mode && (await master.current?.confirmLeave()) !== false) setMode(m);
              }}
              className={cn(
                'h-7 rounded-md px-3 font-semibold',
                mode === m ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
              )}
            >
              {m === 'inline' ? 'Na grelha' : 'Painel lateral'}
            </button>
          ))}
        </div>
      </header>

      <DataBlock
        key={mode}
        handleRef={master}
        className="min-h-0 flex-[55]"
        heading="Impressoras"
        resource={demoImpressoras}
        columns={impressoraCols}
        selection="multi"
        edit={mode}
        defaults={() => ({ DATA_INICIO: today() })}
        onCurrentRowChange={setCurrent}
        beforeCurrentRowChange={detail.beforeMasterRowChange}
        onSelectionChange={setSelection}
        toolbar={() => (
          <span className="truncate text-sm text-muted-foreground" data-testid="selection-summary">
            {selection.mode === 'ids'
              ? `Ids seleccionados: ${selection.ids.join(', ')}`
              : selection.mode === 'consulta'
                ? 'Selecção: toda a consulta'
                : 'Sem selecção'}
          </span>
        )}
      />

      <DataBlock
        className="min-h-0 flex-[45]"
        heading="Tabuleiros"
        resource={demoTabuleiros}
        columns={tabuleiroCols}
        edit="inline"
        endpoint={`/demo-impressoras/${detail.keys?.IMPRESSORA_ID ?? 0}/tabuleiros`}
        pageSize={25}
        {...detail.detailProps}
        toolbar={() => (
          <span className="truncate text-sm font-semibold">
            {current ? `Tabuleiros de ${String(current['NOME'])}` : 'Tabuleiros'}
          </span>
        )}
      />
    </main>
  );
}
