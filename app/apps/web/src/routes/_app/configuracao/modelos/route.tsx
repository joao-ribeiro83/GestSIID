import { useMemo, useRef, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs } from 'radix-ui';
import { toast } from 'sonner';
import { modelos, MODELOS_DOMINIOS, pt } from '@gestsiid/shared';
import { DataBlock, type ColumnView, type DataBlockHandle } from '@/components/datablock/DataBlock';
import type { GridRow } from '@/components/datablock/dirty';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { dom, type TabGuard } from './-common';
import { CodigoBarrasForm, ModeloForm } from './-dialogs';
import { Seccoes } from './-seccoes';
import { Atributos, Parametros } from './-tabs';

/**
 * Configuração › Modelos (UI_SPEC §4.3, MASTER_PLAN Step 6.3): `FD_CONFIGURACAO_MODELOS`.
 * Master `DOC_MODELOS_DOCUMENTO` (update only: a model comes from "Clonar", never deleted) with
 * the CONSULTA header buttons as its sort/filter columns and "Todos" as clear-filters; below it
 * one tab per detail canvas. ASK_COMMIT (#46) fired in POST-RECORD of the master, sections,
 * default-value and attribute blocks: here those grids ask (`askOnRowLeave`) before their current
 * row changes — the master after the open tab — and a tab asks before another tab opens. Leaving
 * the page asks through each DataBlock's route blocker.
 */
export const Route = createFileRoute('/_app/configuracao/modelos')({
  component: ModelosScreen,
});

// CONSULTA buttons, left to right.
const columns: ColumnView<GridRow>[] = [
  { col: 'ID', width: 112, mono: true },
  { col: 'DESCRICAO', width: 280 },
  { col: 'N_COPIAS', width: 88 },
  { col: 'FORMA_CONTROLO_RF', options: dom(MODELOS_DOMINIOS.formaControlo), width: 96 },
  { col: 'DATA_INICIO', width: 112 },
  { col: 'DATA_FIM', width: 112 },
  { col: 'MODO_EXPEDICAO_RF', options: dom(MODELOS_DOMINIOS.modoExpedicao), width: 160 },
  { col: 'STAMP', options: dom(MODELOS_DOMINIOS.binario), width: 112 },
  { col: 'MODO_CERTIFICADO_RF', options: dom(MODELOS_DOMINIOS.modoCertificado), width: 140 },
  { col: 'GENERICO_ID', options: dom(MODELOS_DOMINIOS.genericos), width: 180 },
  { col: 'MODO_PROTECAO_RF', options: dom(MODELOS_DOMINIOS.modoProtecao), width: 140 },
];

const TABS = [
  ['seccoes', 'Secções'],
  ['parametros', 'Parâmetros'],
  ['atributos', 'Atributos'],
  ['atributos-arquivo', 'Atributos Arquivo'],
] as const;

type Dlg = 'alterar' | 'clonar' | 'codigo';

const tabCls =
  '-mb-px border-b-2 border-transparent px-3 py-1.5 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:border-primary data-[state=active]:font-semibold data-[state=active]:text-foreground';
const panelCls = 'flex flex-col gap-2 pt-3';

function ModelosScreen() {
  const { session } = Route.useRouteContext();
  const qc = useQueryClient();
  const master = useRef<DataBlockHandle>(null);
  const tabGuard = useRef<TabGuard>(null);
  const [current, setCurrent] = useState<GridRow | null>(null);
  const [tab, setTab] = useState<string>('seccoes');
  const [dlg, setDlg] = useState<Dlg | null>(null);

  const modeloId = current ? String(current['ID']) : null;
  const keys = useMemo(() => (modeloId ? { MODELO_ID: modeloId } : null), [modeloId]);
  const tabProps = { keys, role: session.role, guardRef: tabGuard };

  const leaveTab = async () => (await tabGuard.current?.leave()) ?? true;
  const leaveMaster = async () => (await master.current?.confirmLeave()) ?? true;

  const changeTab = async (next: string) => {
    if (await leaveTab()) setTab(next);
  };
  // A dialog works on the saved row, so unsaved grid edits are settled first.
  const open = async (d: Dlg) => {
    if (await leaveMaster()) setDlg(d);
  };
  const done = () => {
    toast.success(pt.db.guardado);
    setDlg(null);
    void qc.invalidateQueries({ queryKey: ['/modelos'] });
  };

  // Three stacked grids and an image pane do not fit one laptop screen: the page scrolls and each
  // grid keeps a fixed height.
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">

      <DataBlock
        className="h-72 shrink-0"
        heading="Modelos"
        resource={modelos}
        columns={columns}
        role={session.role}
        edit="inline"
        canInsert={false}
        canDelete={false}
        clearFiltersLabel="Todos"
        handleRef={master}
        onCurrentRowChange={setCurrent}
        askOnRowLeave
        beforeCurrentRowChange={leaveTab}
        toolbar={({ refetch }) => (
          <>
            <Button size="sm" variant="outline" onClick={refetch}>
              Actualizar
            </Button>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
            <Button size="sm" variant="outline" disabled={!current} onClick={() => void open('alterar')}>
              Alterar Modelo
            </Button>
            <Button size="sm" variant="outline" disabled={!current} onClick={() => void open('codigo')}>
              Código Barras
            </Button>
            <Button size="sm" variant="outline" disabled={!current} onClick={() => void open('clonar')}>
              Clonar
            </Button>
          </>
        )}
      />

      <section aria-label="Detalhe do modelo" className="flex flex-col">
        <h2 className="text-sm font-semibold">
          {modeloId ? (
            <>
              Modelo <span className="font-mono">{modeloId}</span>
            </>
          ) : (
            <span className="font-normal text-muted-foreground">{pt.db.seleccioneRegisto}</span>
          )}
        </h2>
        <Tabs.Root
          value={tab}
          onValueChange={(v) => void changeTab(v)}
          activationMode="manual"
          className="flex flex-col"
        >
          <Tabs.List aria-label="Detalhe do modelo" className="flex gap-1 border-b border-border">
            {TABS.map(([value, label]) => (
              <Tabs.Trigger key={value} value={value} className={tabCls}>
                {label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {/* Only the open tab is mounted: leaving it asked #46 first, so nothing unsaved is lost. */}
          <Tabs.Content value="seccoes" className={panelCls}>
            <Seccoes {...tabProps} />
          </Tabs.Content>
          <Tabs.Content value="parametros" className={panelCls}>
            <Parametros {...tabProps} />
          </Tabs.Content>
          <Tabs.Content value="atributos" className={panelCls}>
            <Atributos {...tabProps} />
          </Tabs.Content>
          <Tabs.Content value="atributos-arquivo" className={panelCls}>
            <Atributos {...tabProps} arquivo />
          </Tabs.Content>
        </Tabs.Root>
      </section>

      <Dialog open={dlg !== null && !!current} onOpenChange={(o) => !o && setDlg(null)}>
        <DialogContent className="sm:max-w-md">
          {current && dlg === 'alterar' && (
            <ModeloForm modelo={current} onCancel={() => setDlg(null)} onDone={done} />
          )}
          {current && dlg === 'clonar' && (
            <ModeloForm modelo={current} clonar onCancel={() => setDlg(null)} onDone={done} />
          )}
          {current && dlg === 'codigo' && (
            <CodigoBarrasForm modelo={current} onCancel={() => setDlg(null)} onDone={done} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
