import { useCallback, useRef, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { backupsCandidatos, pt, type PagedResult } from '@gestsiid/shared';
import { ApiError, apiFetch } from '@/api/client';
import { DataBlock, type DataBlockHandle, type Selection } from '@/components/datablock/DataBlock';
import { formatNumber } from '@/components/datablock/format';
import { useConfirm } from '@/components/shell/confirm-dialog-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Gestão › Backups › Novo (UI_SPEC §4.5, MASTER_PLAN Step 8.2): `FD_NOVO_BACKUP`.
 * Step 1 `Criação de backups SIID`: month and notes. Step 2 `Documentos a salvaguardar`: the
 * month's candidates (multi-select, or the whole query), the media type and the running total.
 * `Backup` checks #49 / #30 / #50, asks for confirmation, then POSTs once; nothing is written
 * before that. No printer picker: the form never opened one (ARCHITECTURE §12 row 8.2).
 */
export const Route = createFileRoute('/_app/gestao/backups/novo')({
  component: NovoBackupScreen,
});

type Mes = { MES: string; DATA: string };
type Midia = { ID: string; DESIGNACAO: string; TAMANHO_BYTES: number | null };
type Candidato = { _rid: string; ID: number; TAMANHO_BYTES: number | null; [k: string]: unknown };
type Candidatos = PagedResult<Candidato> & { totalBytes: number };

const STEPS = ['Criação de backups SIID', 'Documentos a salvaguardar'] as const;

const field =
  'h-8 w-full max-w-md rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-field-error';
const gbytes = (bytes: number) => (bytes / 1024 ** 3).toLocaleString('pt-PT', { maximumFractionDigits: 2 });
const bytesTxt = (n: number) => `${formatNumber(n)} bytes`;

function Stepper({ step }: { step: 1 | 2 }) {
  return (
    <ol aria-label="Passos" className="flex items-center gap-3 text-sm">
      {STEPS.map((label, i) => (
        <li
          key={label}
          aria-current={step === i + 1 ? 'step' : undefined}
          className={cn('flex items-center gap-2', step === i + 1 ? 'font-semibold' : 'text-muted-foreground')}
        >
          <span
            className={cn(
              'grid size-6 place-items-center rounded-full border text-xs',
              step === i + 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
            )}
          >
            {i + 1}
          </span>
          {label}
          {i === 0 && <span aria-hidden className="ml-1 h-px w-10 bg-border" />}
        </li>
      ))}
    </ol>
  );
}

function NovoBackupScreen() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const grid = useRef<DataBlockHandle>(null);
  const [bytesPorId, setBytesPorId] = useState(() => new Map<number, number>());
  const [step, setStep] = useState<1 | 2>(1);
  const [mes, setMes] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [midiaId, setMidiaId] = useState('');
  const [selection, setSelection] = useState<Selection>({ mode: 'none' });
  const [erroMes, setErroMes] = useState<string | null>(null);
  const [erroMidia, setErroMidia] = useState<string | null>(null);
  const [alerta, setAlerta] = useState<string | null>(null);
  const [aEnviar, setAEnviar] = useState(false);

  const meses = useQuery({ queryKey: ['/backups/meses'], queryFn: () => apiFetch<{ rows: Mes[] }>('/backups/meses') });
  const midias = useQuery({
    queryKey: ['/tipos-midia', 'select'],
    queryFn: () => apiFetch<PagedResult<Midia>>('/tipos-midia?size=500'),
    enabled: step === 2,
  });
  // One row is enough: `totalBytes` covers every candidate of the month (consulta mode total).
  const totais = useQuery({
    queryKey: ['/backups/candidatos', 'totais', mes],
    queryFn: () => apiFetch<Candidatos>(`/backups/candidatos?mes=${mes}&size=1`),
    enabled: step === 2 && mes !== '',
  });

  const midia = midias.data?.rows.find((m) => m.ID === midiaId);
  const total = selection.mode === 'consulta' ? selection.total : selection.mode === 'ids' ? selection.ids.length : 0;
  const totalBackup =
    selection.mode === 'consulta'
      ? (totais.data?.totalBytes ?? 0)
      : selection.mode === 'ids'
        ? selection.ids.reduce<number>((s, id) => s + (bytesPorId.get(Number(id)) ?? 0), 0)
        : 0;

  // A new selection makes the last size / selection alert stale.
  const mudarSeleccao = useCallback((s: Selection) => {
    setSelection(s);
    setAlerta(null);
  }, []);
  // Stable: DataBlock calls it from an effect that depends on it.
  const guardarBytes = useCallback((rows: Candidato[]) => {
    setBytesPorId((m) => {
      const n = new Map(m);
      for (const r of rows) n.set(Number(r.ID), Number(r.TAMANHO_BYTES) || 0);
      return n;
    });
  }, []);

  const documentos = () => {
    if (!mes) return setErroMes(pt.backups.mesObrigatorio);
    setErroMes(null);
    setStep(2);
  };

  const voltar = () => {
    setSelection({ mode: 'none' });
    setAlerta(null);
    setStep(1);
  };

  const backup = async () => {
    setAlerta(null);
    setErroMidia(null);
    if (!midiaId) return setErroMidia(pt.backups.tipoMidiaObrigatorio);
    if (total === 0) return setAlerta(pt.naoExistemDocumentosSeleccionados);
    if (midia?.TAMANHO_BYTES != null && totalBackup > midia.TAMANHO_BYTES) return setAlerta(pt.backups.tamanhoMidia);
    if (!(await confirm({ title: pt.backups.confirmar(mes, total, bytesTxt(totalBackup)) }))) return;

    setAEnviar(true);
    try {
      const novo = await apiFetch<{ ID: number; NOME: string }>(
        '/backups',
        {
          method: 'POST',
          body: JSON.stringify({
            mes,
            tipoMidiaId: midiaId,
            observacoes: observacoes.trim() || null,
            ...(selection.mode === 'consulta' ? { todos: true } : { ids: selection.mode === 'ids' ? selection.ids : [] }),
          }),
        },
        { quiet: true },
      );
      toast.success(pt.backups.criado(novo.NOME));
      void qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith('/backups') });
      setBytesPorId(new Map());
      mudarSeleccao({ mode: 'none' });
      setMes('');
      setObservacoes('');
      setMidiaId('');
      setStep(1);
    } catch (e) {
      const err = e as ApiError;
      if (err.code === 'REGISTO_ALTERADO') {
        toast.error(err.message);
        grid.current?.clearSelection();
        void qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith('/backups') });
      } else setAlerta(Object.values(err.fields ?? {})[0] ?? err.message);
    } finally {
      setAEnviar(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Stepper step={step} />

      {step === 1 && (
        <section aria-label={STEPS[0]} className="flex max-w-2xl flex-col gap-3 rounded-lg border border-border p-4">
          {meses.isSuccess && meses.data.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Não existem registos.</p>
          ) : (
            <>
              <label className="grid gap-1 text-sm">
                Mês
                <select
                  className={field}
                  value={mes}
                  aria-invalid={erroMes ? true : undefined}
                  aria-describedby={erroMes ? 'erro-mes' : undefined}
                  onChange={(e) => {
                    setMes(e.target.value);
                    setErroMes(null);
                  }}
                >
                  <option value="">Meses para Backup</option>
                  {meses.data?.rows.map((m) => (
                    <option key={m.MES} value={m.MES}>
                      {m.MES}
                    </option>
                  ))}
                </select>
                {erroMes && (
                  <span id="erro-mes" role="alert" className="text-field-error">
                    {erroMes}
                  </span>
                )}
              </label>
              {(['Nome', 'Destino'] as const).map((l) => (
                <div key={l} className="grid gap-1 text-sm">
                  {l}
                  <span className="text-muted-foreground">{pt.backups.geradoAoCriar}</span>
                </div>
              ))}
              <label className="grid gap-1 text-sm">
                Observações
                <textarea
                  className={cn(field, 'h-20 max-w-none py-1')}
                  maxLength={2000}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </label>
              <div className="flex justify-end">
                <Button onClick={documentos}>Documentos</Button>
              </div>
            </>
          )}
        </section>
      )}

      {step === 2 && (
        <section aria-label={STEPS[1]} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-4">
            <label className="grid gap-1 text-sm">
              Tipos Mídia
              <select
                className={cn(field, 'w-64')}
                value={midiaId}
                aria-invalid={erroMidia ? true : undefined}
                aria-describedby={erroMidia ? 'erro-midia' : undefined}
                onChange={(e) => {
                  setMidiaId(e.target.value);
                  setErroMidia(null);
                  setAlerta(null);
                }}
              >
                <option value="">Tipos de Mídia de BACKUP</option>
                {midias.data?.rows.map((m) => (
                  <option key={m.ID} value={m.ID}>
                    {m.ID} — {m.DESIGNACAO}
                  </option>
                ))}
              </select>
              {erroMidia && (
                <span id="erro-midia" role="alert" className="text-field-error">
                  {erroMidia}
                </span>
              )}
            </label>
            <div className="grid gap-1 text-sm">
              Gbytes
              <output className="flex h-8 items-center text-muted-foreground">
                {midia?.TAMANHO_BYTES != null ? gbytes(midia.TAMANHO_BYTES) : '—'}
              </output>
            </div>
          </div>

          <DataBlock<Candidato>
            key={mes}
            className="h-[26rem] shrink-0"
            heading="Documentos a salvaguardar"
            resource={backupsCandidatos}
            endpoint={`/backups/candidatos?mes=${mes}`}
            selection="multi"
            emptyText="A consulta não obteve documentos."
            handleRef={grid}
            onSelectionChange={mudarSeleccao}
            onRowsLoaded={guardarBytes}
            columns={[
              { col: 'ID', header: 'Id', width: 88, align: 'end', mono: true },
              { col: 'MODELO_ID', header: 'Modelo', width: 96, mono: true },
              { col: 'N_REFERENCIA', header: 'Referência', width: 120 },
              { col: 'DATA_IMPRESSAO', header: 'Impresso a', width: 120 },
              { col: 'DATA_PEDIDO', header: 'Pedido a', width: 120 },
              { col: 'CRIADO_POR', header: 'Autor', width: 112 },
              { col: 'TAMANHO_BYTES', header: 'Bytes', width: 112, align: 'end' },
            ]}
          />

          <dl className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Total Bytes</dt>
              <dd className="font-mono">{totais.data ? formatNumber(totais.data.totalBytes) : '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Total Backup</dt>
              <dd className="font-mono">{formatNumber(totalBackup)}</dd>
            </div>
          </dl>

          {alerta && (
            <p role="alert" className="rounded-lg border border-field-error px-3 py-2 text-sm text-field-error">
              {alerta}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={voltar} disabled={aEnviar}>
              Voltar
            </Button>
            <Button onClick={() => void backup()} disabled={aEnviar}>
              Backup
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
