import { useRef, useState } from 'react';
import { createFileRoute, Outlet, useChildMatches, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { modelos, MODELOS_DOMINIOS, pt } from '@gestsiid/shared';
import { DataBlock, type ColumnView, type DataBlockHandle } from '@/components/datablock/DataBlock';
import type { GridRow } from '@/components/datablock/dirty';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { dom } from './-common';
import { CodigoBarrasForm, ModeloForm } from './-dialogs';

/**
 * Configuração › Modelos (UI_SPEC §4.3, MASTER_PLAN Step 6.3): `FD_CONFIGURACAO_MODELOS`.
 * Master `DOC_MODELOS_DOCUMENTO` (update only: a model comes from "Clonar", never deleted) with
 * the CONSULTA header buttons as its sort/filter columns and "Todos" as clear-filters. ASK_COMMIT
 * (#46) fired in POST-RECORD of the master: the grid asks (`askOnRowLeave`) before its current row
 * changes, and before the page is left (DataBlock route blocker).
 * D-34: the list fills the page; each row opens its four detail tabs on `$modeloId.tsx`. The list
 * stays mounted (hidden) under that page, so Voltar finds its filters, sort and page unchanged.
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

type Dlg = 'alterar' | 'clonar' | 'codigo';

function ModelosScreen() {
  const { session } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const detalhe = useChildMatches().length > 0; // a row's detail page is open (D-34)
  const master = useRef<DataBlockHandle>(null);
  const [current, setCurrent] = useState<GridRow | null>(null);
  const [dlg, setDlg] = useState<Dlg | null>(null);

  const leaveMaster = async () => (await master.current?.confirmLeave()) ?? true;
  // A dialog works on the saved row, so unsaved grid edits are settled first.
  const open = async (d: Dlg) => {
    if (await leaveMaster()) setDlg(d);
  };
  const done = () => {
    toast.success(pt.db.guardado);
    setDlg(null);
    void qc.invalidateQueries({ queryKey: ['/modelos'] });
  };

  return (
    <>
      <div className={detalhe ? 'hidden' : 'flex min-h-0 flex-1 flex-col'}>
        <DataBlock
          className="min-h-0 flex-1"
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
          rowOpenLabel="Abrir secções, parâmetros e atributos"
          inactive={detalhe}
          onRowOpen={(r) => void navigate({ to: '/configuracao/modelos/$modeloId', params: { modeloId: String(r['ID']) } })}
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
      <Outlet />
    </>
  );
}
