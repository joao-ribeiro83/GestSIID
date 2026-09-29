import { useRef, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { impressorasAssociadasDoc, toQueryString, type ListQuery, type PagedResult } from '@gestsiid/shared';
import { apiFetch, ApiError } from '@/api/client';
import { DataBlock, type ColumnView } from '@/components/datablock/DataBlock';
import type { GridRow } from '@/components/datablock/dirty';
import { dmyToIso, isoToDmy } from '@/components/datablock/qbe';
import { ImpressoraPicker, type ImpressoraRow } from '@/components/ImpressoraPicker';
import { useConfirm } from '@/components/shell/confirm-dialog-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Configuração › Impressoras Associadas › Documento (MASTER_PLAN Step 5.0):
 * `FD_GESTAO_IMPRESSORAS_DOC` over `DOC_IMPRESSORAS_DOC` (STRUCTURE.md §3.7, BR-PRN-02). Flat
 * block like `impressoras.tsx`, not master-detail: `edit="none"`, every write goes through the
 * three toolbar dialogs, never inline/panel edit.
 *
 * Behaviour call (documented per the brief): the legacy `NOVA_IMPRESSORA.OK` trigger inserts
 * with `:DOC_IMPRESSORAS_DOC.MODELO_ID` (the grid's *current row*), not the dialog's own
 * `MODELO_ID` field — even though that field carries its own `LOV_MODELOS` LOV. Read literally
 * three times in the PL/SQL dump, not a one-off typo. "Nova impressora" here follows that
 * literally: it requires a current row (to know which model to add to) and shows that model as
 * read-only text, picking only the printer + dates.
 */
export const Route = createFileRoute('/_app/configuracao/impressoras-associadas/documento')({
  component: DocumentoScreen,
});

// Form's field order (STRUCTURE.md §3.7): Modelo, Impressora, Início Validade, Fim Validade.
// Point 10 of the brief: no joined printer description column — IMPRESSORA_ID shows plain/mono.
const columns: ColumnView<GridRow>[] = [
  { col: 'MODELO_ID', width: 100, mono: true },
  { col: 'IMPRESSORA_ID', header: 'Impressora', width: 100, mono: true },
  { col: 'DATA_INICIO', width: 116 },
  { col: 'DATA_FIM', width: 116 },
  { col: 'CRIADO_POR', hidden: true },
  { col: 'DATA_CRIACAO', hidden: true },
  { col: 'ACTUALIZADO_POR', hidden: true },
  { col: 'DATA_ACTUALIZACAO', hidden: true },
];

type ImpressoraLite = { ID: string; DESCRICAO: string | null; ENDERECO: string | null };

/** `impr.id||' - '||impr.descricao||' - '||impr.endereco` (POST-QUERY), looked up client-side —
 * mirrors how `ImpressoraPicker` already fetches the printers list (point 4 of the brief). */
async function impressoraLabel(id: string): Promise<string> {
  const q: ListQuery = { filters: { ID: [{ op: 'eq', value: id }] }, sort: [], page: 1, size: 1 };
  const res = await apiFetch<PagedResult<ImpressoraLite>>(`/impressoras?${toQueryString(q)}`);
  const row = res.rows[0];
  return row ? `${row.ID} - ${row.DESCRICAO} - ${row.ENDERECO}` : id;
}

function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Erro';
}

function DocumentoScreen() {
  const { session } = Route.useRouteContext();
  const confirm = useConfirm();
  const [current, setCurrent] = useState<GridRow | null>(null);
  // A ref, not state: the toolbar render prop runs inside DataBlock's render, so setting state
  // there (setState during a different component's render) trips React's dev warning.
  const refetchRef = useRef<() => void>(() => {});

  // "Nova impressora" (NOVA_IMPRESSORA): picker + dates, model = the current row's.
  const [novaOpen, setNovaOpen] = useState(false);
  const [novaPickerOpen, setNovaPickerOpen] = useState(false);
  const [novaImpressora, setNovaImpressora] = useState<ImpressoraRow | null>(null);
  const [novaDataIni, setNovaDataIni] = useState('');
  const [novaDataFim, setNovaDataFim] = useState('');
  const [novaError, setNovaError] = useState<string | null>(null);
  const [novaSaving, setNovaSaving] = useState(false);

  // "Alterar Validade" (ALTERAR_IMPRESSORA): dates only, same printer.
  const [alterarOpen, setAlterarOpen] = useState(false);
  const [alterarDataIni, setAlterarDataIni] = useState('');
  const [alterarDataFim, setAlterarDataFim] = useState('');
  const [alterarError, setAlterarError] = useState<string | null>(null);
  const [alterarSaving, setAlterarSaving] = useState(false);

  const openNova = () => {
    setNovaImpressora(null);
    setNovaDataIni('');
    setNovaDataFim('');
    setNovaError(null);
    setNovaOpen(true);
  };

  const submitNova = async () => {
    if (!current || !novaImpressora) return;
    const dataIni = dmyToIso(novaDataIni);
    if (!dataIni) return setNovaError('Início Validade: Data inválida.');
    const dataFim = novaDataFim.trim() === '' ? null : dmyToIso(novaDataFim);
    if (novaDataFim.trim() !== '' && !dataFim) return setNovaError('Fim Validade: Data inválida.');
    setNovaSaving(true);
    setNovaError(null);
    try {
      await apiFetch(
        '/impressoras-associadas-doc',
        {
          method: 'POST',
          body: JSON.stringify({
            values: {
              MODELO_ID: current['MODELO_ID'],
              IMPRESSORA_ID: novaImpressora.ID,
              DATA_INICIO: `${dataIni}T00:00:00`,
              DATA_FIM: dataFim ? `${dataFim}T00:00:00` : null,
            },
          }),
        },
        { quiet: true },
      );
      toast.success('Impressora associada.');
      setNovaOpen(false);
      refetchRef.current();
    } catch (e) {
      setNovaError(errorMessage(e));
    } finally {
      setNovaSaving(false);
    }
  };

  const openAlterar = () => {
    if (!current) return;
    setAlterarDataIni(current['DATA_INICIO'] ? isoToDmy(String(current['DATA_INICIO'])) : '');
    setAlterarDataFim(current['DATA_FIM'] ? isoToDmy(String(current['DATA_FIM'])) : '');
    setAlterarError(null);
    setAlterarOpen(true);
  };

  const submitAlterar = async () => {
    if (!current) return;
    const dataIni = dmyToIso(alterarDataIni);
    if (!dataIni) return setAlterarError('Início Validade: Data inválida.');
    const dataFim = alterarDataFim.trim() === '' ? null : dmyToIso(alterarDataFim);
    if (alterarDataFim.trim() !== '' && !dataFim) return setAlterarError('Fim Validade: Data inválida.');
    setAlterarSaving(true);
    setAlterarError(null);
    const { _rid, ...orig } = current;
    try {
      await apiFetch(
        `/impressoras-associadas-doc/${_rid}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            orig,
            values: { DATA_INICIO: `${dataIni}T00:00:00`, DATA_FIM: dataFim ? `${dataFim}T00:00:00` : null },
          }),
        },
        { quiet: true },
      );
      toast.success('Validade alterada.');
      setAlterarOpen(false);
      refetchRef.current();
    } catch (e) {
      setAlterarError(errorMessage(e));
    } finally {
      setAlterarSaving(false);
    }
  };

  const anular = async () => {
    if (!current) return;
    const impressora = await impressoraLabel(String(current['IMPRESSORA_ID']));
    const ok = await confirm({
      title: `Deseja anular a impressora '${impressora}' para o documento ${current['MODELO_ID']}?`,
      kind: 'sim-nao',
    });
    if (ok !== true) return;
    const { _rid, ...orig } = current;
    try {
      await apiFetch(`/impressoras-associadas-doc/${_rid}/anular`, {
        method: 'POST',
        body: JSON.stringify({ orig }),
      });
      toast.success('Impressora anulada.');
      refetchRef.current();
    } catch {
      // apiFetch already toasted the error.
    }
  };

  return (
    <main id="conteudo" className="flex h-dvh flex-col gap-3 bg-background p-4 text-foreground">
      <header>
        <h1 className="text-lg font-semibold">Impressoras Associadas › Documento</h1>
      </header>

      <DataBlock
        className="min-h-0 flex-1"
        heading="Impressoras Associadas por Documento"
        resource={impressorasAssociadasDoc}
        columns={columns}
        role={session.role}
        edit="none"
        canInsert={false}
        canUpdate={false}
        canDelete={false}
        onCurrentRowChange={setCurrent}
        toolbar={(ctx) => {
          refetchRef.current = ctx.refetch;
          return (
            <>
              <Button size="sm" variant="outline" disabled={!current} onClick={openNova}>
                Nova impressora
              </Button>
              <Button size="sm" variant="outline" disabled={!current} onClick={openAlterar}>
                Alterar Validade
              </Button>
              <Button size="sm" variant="outline" disabled={!current} onClick={() => void anular()}>
                Anular
              </Button>
            </>
          );
        }}
      />

      <Dialog open={novaOpen} onOpenChange={setNovaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir Nova Impressora</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 text-sm">
              <span>Modelo</span>
              <span className="flex h-8 items-center rounded-lg border border-input bg-muted px-2 font-mono">
                {String(current?.['MODELO_ID'] ?? '')}
              </span>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <span>Impressora</span>
              {/* Not a <label>: wrapping a <button> in one gives it the caption as its
                  accessible name, hiding "Escolher…"/the picked value (verified via
                  ariaSnapshot() while debugging the e2e specs). */}
              <Button
                type="button"
                variant="outline"
                className="justify-start"
                onClick={() => setNovaPickerOpen(true)}
              >
                {novaImpressora ? `${novaImpressora.ID} — ${novaImpressora.DESCRICAO}` : 'Escolher…'}
              </Button>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              Início Validade
              <input
                value={novaDataIni}
                onChange={(e) => setNovaDataIni(e.target.value)}
                placeholder="DD-MM-AAAA"
                aria-label="Início Validade"
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Fim Validade
              <input
                value={novaDataFim}
                onChange={(e) => setNovaDataFim(e.target.value)}
                placeholder="DD-MM-AAAA"
                aria-label="Fim Validade"
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
              />
            </label>
            {novaError && <p className="text-sm text-field-error">{novaError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={!novaImpressora || novaSaving} onClick={() => void submitNova()}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImpressoraPicker open={novaPickerOpen} onOpenChange={setNovaPickerOpen} onSelect={setNovaImpressora} />

      <Dialog open={alterarOpen} onOpenChange={setAlterarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Validade</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Início Validade
              <input
                value={alterarDataIni}
                onChange={(e) => setAlterarDataIni(e.target.value)}
                placeholder="DD-MM-AAAA"
                aria-label="Início Validade"
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Fim Validade
              <input
                value={alterarDataFim}
                onChange={(e) => setAlterarDataFim(e.target.value)}
                placeholder="DD-MM-AAAA"
                aria-label="Fim Validade"
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
              />
            </label>
            {alterarError && <p className="text-sm text-field-error">{alterarError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlterarOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={alterarSaving} onClick={() => void submitAlterar()}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
