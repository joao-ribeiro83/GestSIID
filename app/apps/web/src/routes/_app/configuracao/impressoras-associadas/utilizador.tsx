import { useRef, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { impressorasAssociadasUsr, toQueryString, type ListQuery, type PagedResult } from '@gestsiid/shared';
import { apiFetch, ApiError } from '@/api/client';
import { DataBlock, type ColumnView } from '@/components/datablock/DataBlock';
import type { GridRow } from '@/components/datablock/dirty';
import { dmyToIso, isoToDmy } from '@/components/datablock/qbe';
import { ImpressoraPicker, type ImpressoraRow } from '@/components/ImpressoraPicker';
import { ModeloPicker, type ModeloRow } from '@/components/ModeloPicker';
import { UtilizadorPicker, type UtilizadorRow } from '@/components/UtilizadorPicker';
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
 * Configuração › Impressoras Associadas › Utilizador (MASTER_PLAN Step 5.0):
 * `FD_GESTAO_IMPRESSORAS_USR` over `DOC_IMPRESSOES_MODELO_USR` (STRUCTURE.md §3.8, BR-PRN-03).
 * Same flat shape as the Documento screen, scoped by `MODELO_ID` + `CDEMPLEA`, plus the two
 * "Copiar…" bulk-copy dialogs (`COPIAR_MODELO`, `COPIAR_UTILIZADOR`) that the Documento form does
 * not have. Unlike the Documento screen, `NOVA_IMPRESSORA.OK` here really does read
 * `:NOVA_IMPRESSORA.MODELO_ID`/`:NOVA_IMPRESSORA.CDEMPLEA` (its own dialog fields), so "Nova
 * impressora" does not require a pre-selected current row.
 */
export const Route = createFileRoute('/_app/configuracao/impressoras-associadas/utilizador')({
  component: UtilizadorScreen,
});

// Form's field order (STRUCTURE.md §3.8): Modelo, Utilizador, Impressora, Início/Fim Validade.
const columns: ColumnView<GridRow>[] = [
  { col: 'MODELO_ID', width: 100, mono: true },
  { col: 'CDEMPLEA', header: 'Utilizador', width: 100, mono: true },
  { col: 'IMPRESSORA_ID', header: 'Impressora', width: 100, mono: true },
  { col: 'DATA_INICIO', width: 116 },
  { col: 'DATA_FIM', width: 116 },
  { col: 'CRIADO_POR', hidden: true },
  { col: 'DATA_CRIACAO', hidden: true },
  { col: 'ACTUALIZADO_POR', hidden: true },
  { col: 'DATA_ACTUALIZACAO', hidden: true },
];

type ImpressoraLite = { ID: string; DESCRICAO: string | null; ENDERECO: string | null };

async function impressoraLabel(id: string): Promise<string> {
  const q: ListQuery = { filters: { ID: [{ op: 'eq', value: id }] }, sort: [], page: 1, size: 1 };
  const res = await apiFetch<PagedResult<ImpressoraLite>>(`/impressoras?${toQueryString(q)}`);
  const row = res.rows[0];
  return row ? `${row.ID} - ${row.DESCRICAO} - ${row.ENDERECO}` : id;
}

function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Erro';
}

function UtilizadorScreen() {
  const { session } = Route.useRouteContext();
  const confirm = useConfirm();
  const [current, setCurrent] = useState<GridRow | null>(null);
  const refetchRef = useRef<() => void>(() => {});

  // "Nova impressora" (NOVA_IMPRESSORA): modelo + utilizador + impressora + dates.
  const [novaOpen, setNovaOpen] = useState(false);
  const [modeloPickerOpen, setModeloPickerOpen] = useState(false);
  const [utilizadorPickerOpen, setUtilizadorPickerOpen] = useState(false);
  const [impressoraPickerOpen, setImpressoraPickerOpen] = useState(false);
  const [novaModelo, setNovaModelo] = useState<ModeloRow | null>(null);
  const [novaUtilizador, setNovaUtilizador] = useState<UtilizadorRow | null>(null);
  const [novaImpressora, setNovaImpressora] = useState<ImpressoraRow | null>(null);
  const [novaDataIni, setNovaDataIni] = useState('');
  const [novaDataFim, setNovaDataFim] = useState('');
  const [novaError, setNovaError] = useState<string | null>(null);
  const [novaSaving, setNovaSaving] = useState(false);

  // "Alterar Validade": dates only, same model/user/printer.
  const [alterarOpen, setAlterarOpen] = useState(false);
  const [alterarDataIni, setAlterarDataIni] = useState('');
  const [alterarDataFim, setAlterarDataFim] = useState('');
  const [alterarError, setAlterarError] = useState<string | null>(null);
  const [alterarSaving, setAlterarSaving] = useState(false);

  // "Copiar do modelo" / "Copiar do utilizador".
  const [copiarModeloOpen, setCopiarModeloOpen] = useState(false);
  const [copiarModeloTargetPicker, setCopiarModeloTargetPicker] = useState(false);
  const [copiarModeloSourcePicker, setCopiarModeloSourcePicker] = useState(false);
  const [copiarModeloTarget, setCopiarModeloTarget] = useState<ModeloRow | null>(null);
  const [copiarModeloSource, setCopiarModeloSource] = useState<ModeloRow | null>(null);
  const [copiarModeloError, setCopiarModeloError] = useState<string | null>(null);
  const [copiarModeloSaving, setCopiarModeloSaving] = useState(false);

  const [copiarUtilizadorOpen, setCopiarUtilizadorOpen] = useState(false);
  const [copiarUtilizadorTargetPicker, setCopiarUtilizadorTargetPicker] = useState(false);
  const [copiarUtilizadorSourcePicker, setCopiarUtilizadorSourcePicker] = useState(false);
  const [copiarUtilizadorTarget, setCopiarUtilizadorTarget] = useState<UtilizadorRow | null>(null);
  const [copiarUtilizadorSource, setCopiarUtilizadorSource] = useState<UtilizadorRow | null>(null);
  const [copiarUtilizadorError, setCopiarUtilizadorError] = useState<string | null>(null);
  const [copiarUtilizadorSaving, setCopiarUtilizadorSaving] = useState(false);

  const openNova = () => {
    setNovaModelo(null);
    setNovaUtilizador(null);
    setNovaImpressora(null);
    setNovaDataIni('');
    setNovaDataFim('');
    setNovaError(null);
    setNovaOpen(true);
  };

  const submitNova = async () => {
    if (!novaModelo || !novaUtilizador || !novaImpressora) return;
    const dataIni = dmyToIso(novaDataIni);
    if (!dataIni) return setNovaError('Início Validade: Data inválida.');
    const dataFim = novaDataFim.trim() === '' ? null : dmyToIso(novaDataFim);
    if (novaDataFim.trim() !== '' && !dataFim) return setNovaError('Fim Validade: Data inválida.');
    setNovaSaving(true);
    setNovaError(null);
    try {
      await apiFetch(
        '/impressoras-associadas-usr',
        {
          method: 'POST',
          body: JSON.stringify({
            values: {
              MODELO_ID: novaModelo.ID,
              CDEMPLEA: novaUtilizador.CDIDUSR,
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
        `/impressoras-associadas-usr/${_rid}`,
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
      title: `Deseja anular a impressora '${impressora}' do utilizador ${current['CDEMPLEA']} para o documento ${current['MODELO_ID']}?`,
      kind: 'sim-nao',
    });
    if (ok !== true) return;
    const { _rid, ...orig } = current;
    try {
      await apiFetch(`/impressoras-associadas-usr/${_rid}/anular`, {
        method: 'POST',
        body: JSON.stringify({ orig }),
      });
      toast.success('Impressora anulada.');
      refetchRef.current();
    } catch {
      // apiFetch already toasted the error.
    }
  };

  const openCopiarModelo = () => {
    setCopiarModeloTarget(null);
    setCopiarModeloSource(null);
    setCopiarModeloError(null);
    setCopiarModeloOpen(true);
  };

  const submitCopiarModelo = async () => {
    if (!copiarModeloTarget || !copiarModeloSource) return;
    setCopiarModeloSaving(true);
    setCopiarModeloError(null);
    try {
      await apiFetch(
        '/impressoras-associadas-usr/copiar-modelo',
        {
          method: 'POST',
          body: JSON.stringify({
            MODELO_ID: copiarModeloTarget.ID,
            MODELO_ID_COPIAR: copiarModeloSource.ID,
          }),
        },
        { quiet: true },
      );
      toast.success('Configurações copiadas.');
      setCopiarModeloOpen(false);
      refetchRef.current();
    } catch (e) {
      setCopiarModeloError(errorMessage(e));
    } finally {
      setCopiarModeloSaving(false);
    }
  };

  const openCopiarUtilizador = () => {
    setCopiarUtilizadorTarget(null);
    setCopiarUtilizadorSource(null);
    setCopiarUtilizadorError(null);
    setCopiarUtilizadorOpen(true);
  };

  const submitCopiarUtilizador = async () => {
    if (!copiarUtilizadorTarget || !copiarUtilizadorSource) return;
    setCopiarUtilizadorSaving(true);
    setCopiarUtilizadorError(null);
    try {
      await apiFetch(
        '/impressoras-associadas-usr/copiar-utilizador',
        {
          method: 'POST',
          body: JSON.stringify({
            CDEMPLEA: copiarUtilizadorTarget.CDIDUSR,
            CDEMPLEA_COPIAR: copiarUtilizadorSource.CDIDUSR,
          }),
        },
        { quiet: true },
      );
      toast.success('Configurações copiadas.');
      setCopiarUtilizadorOpen(false);
      refetchRef.current();
    } catch (e) {
      setCopiarUtilizadorError(errorMessage(e));
    } finally {
      setCopiarUtilizadorSaving(false);
    }
  };

  return (
    <main id="conteudo" className="flex h-dvh flex-col gap-3 bg-background p-4 text-foreground">
      <header>
        <h1 className="text-lg font-semibold">Impressoras Associadas › Utilizador</h1>
      </header>

      <DataBlock
        className="min-h-0 flex-1"
        heading="Impressoras Associadas por Utilizador"
        resource={impressorasAssociadasUsr}
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
              <Button size="sm" variant="outline" onClick={openNova}>
                Nova impressora
              </Button>
              <Button size="sm" variant="outline" disabled={!current} onClick={openAlterar}>
                Alterar Validade
              </Button>
              <Button size="sm" variant="outline" disabled={!current} onClick={() => void anular()}>
                Anular
              </Button>
              <Button size="sm" variant="outline" onClick={openCopiarModelo}>
                Copiar do modelo…
              </Button>
              <Button size="sm" variant="outline" onClick={openCopiarUtilizador}>
                Copiar do utilizador…
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
            {/* <div>+<span>, not <label>: a <label> wrapping a <button> gives the button the
                caption as its accessible name, hiding "Escolher…"/the picked value (verified via
                ariaSnapshot() while debugging the e2e specs). */}
            <div className="flex flex-col gap-1 text-sm">
              <span>Modelo</span>
              <Button type="button" variant="outline" className="justify-start" onClick={() => setModeloPickerOpen(true)}>
                {novaModelo ? novaModelo.ID : 'Escolher…'}
              </Button>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <span>Utilizador</span>
              <Button
                type="button"
                variant="outline"
                className="justify-start"
                onClick={() => setUtilizadorPickerOpen(true)}
              >
                {novaUtilizador ? novaUtilizador.CDIDUSR : 'Escolher…'}
              </Button>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <span>Impressora</span>
              <Button
                type="button"
                variant="outline"
                className="justify-start"
                onClick={() => setImpressoraPickerOpen(true)}
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
            <Button
              disabled={!novaModelo || !novaUtilizador || !novaImpressora || novaSaving}
              onClick={() => void submitNova()}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ModeloPicker open={modeloPickerOpen} onOpenChange={setModeloPickerOpen} onSelect={setNovaModelo} />
      <UtilizadorPicker
        open={utilizadorPickerOpen}
        onOpenChange={setUtilizadorPickerOpen}
        onSelect={setNovaUtilizador}
      />
      <ImpressoraPicker
        open={impressoraPickerOpen}
        onOpenChange={setImpressoraPickerOpen}
        onSelect={setNovaImpressora}
      />

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

      <Dialog open={copiarModeloOpen} onOpenChange={setCopiarModeloOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copiar do modelo…</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 text-sm">
              <span>Modelo (destino)</span>
              <Button
                type="button"
                variant="outline"
                className="justify-start"
                onClick={() => setCopiarModeloTargetPicker(true)}
              >
                {copiarModeloTarget ? copiarModeloTarget.ID : 'Escolher…'}
              </Button>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <span>Modelo a copiar (origem)</span>
              <Button
                type="button"
                variant="outline"
                className="justify-start"
                onClick={() => setCopiarModeloSourcePicker(true)}
              >
                {copiarModeloSource ? copiarModeloSource.ID : 'Escolher…'}
              </Button>
            </div>
            {copiarModeloError && <p className="text-sm text-field-error">{copiarModeloError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopiarModeloOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!copiarModeloTarget || !copiarModeloSource || copiarModeloSaving}
              onClick={() => void submitCopiarModelo()}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ModeloPicker
        open={copiarModeloTargetPicker}
        onOpenChange={setCopiarModeloTargetPicker}
        onSelect={setCopiarModeloTarget}
      />
      <ModeloPicker
        open={copiarModeloSourcePicker}
        onOpenChange={setCopiarModeloSourcePicker}
        onSelect={setCopiarModeloSource}
      />

      <Dialog open={copiarUtilizadorOpen} onOpenChange={setCopiarUtilizadorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copiar do utilizador…</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 text-sm">
              <span>Utilizador (destino)</span>
              <Button
                type="button"
                variant="outline"
                className="justify-start"
                onClick={() => setCopiarUtilizadorTargetPicker(true)}
              >
                {copiarUtilizadorTarget ? copiarUtilizadorTarget.CDIDUSR : 'Escolher…'}
              </Button>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <span>Utilizador a copiar (origem)</span>
              <Button
                type="button"
                variant="outline"
                className="justify-start"
                onClick={() => setCopiarUtilizadorSourcePicker(true)}
              >
                {copiarUtilizadorSource ? copiarUtilizadorSource.CDIDUSR : 'Escolher…'}
              </Button>
            </div>
            {copiarUtilizadorError && <p className="text-sm text-field-error">{copiarUtilizadorError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopiarUtilizadorOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!copiarUtilizadorTarget || !copiarUtilizadorSource || copiarUtilizadorSaving}
              onClick={() => void submitCopiarUtilizador()}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UtilizadorPicker
        open={copiarUtilizadorTargetPicker}
        onOpenChange={setCopiarUtilizadorTargetPicker}
        onSelect={setCopiarUtilizadorTarget}
      />
      <UtilizadorPicker
        open={copiarUtilizadorSourcePicker}
        onOpenChange={setCopiarUtilizadorSourcePicker}
        onSelect={setCopiarUtilizadorSource}
      />
    </main>
  );
}
