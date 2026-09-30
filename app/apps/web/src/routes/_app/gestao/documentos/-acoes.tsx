import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { pt } from '@gestsiid/shared';
import { ApiError, apiFetch } from '@/api/client';
import type { Selection } from '@/components/datablock/DataBlock';
import { ImpressoraPicker, type ImpressoraRow } from '@/components/ImpressoraPicker';
import { useConfirm } from '@/components/shell/confirm-dialog-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { agrupar, seleccaoBody, type Resultado } from './-common';

/**
 * The ORDENACAO_DOCUMENTOS action buttons (ADM only, D-08) and their dialogs (UI_SPEC §4.2
 * "Dialogs", analysis/DOCUMENT_STATES.md). Every button is enabled: with nothing selected it shows
 * #30 and sends nothing (UI-15). The server applies the per-state skip rules and answers
 * `{ ok, skipped }`; skipped documents are listed under their message.
 */

const MSG = pt.documentos;
type Impressao = 'reimprimir' | 'segunda-via' | 'copia';
type Fila = 'suspender' | 'retomar';

type Dlg =
  | { tipo: 'impressao'; acao: Impressao; label: string }
  | { tipo: 'password' }
  | { tipo: 'cancelar' }
  | { tipo: 'fila'; acao: Fila; label: string }
  | { tipo: 'resultado'; label: string; r: Resultado };

const inputCls =
  'h-8 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive';

export function Accoes({ selection, onDone }: { selection: Selection; onDone: () => void }) {
  const confirm = useConfirm();
  const [dlg, setDlg] = useState<Dlg | null>(null);
  const fechar = () => setDlg(null);

  const sel = () => {
    const body = seleccaoBody(selection);
    if (!body) toast.warning(pt.naoExistemDocumentosSeleccionados);
    return body;
  };
  const pergunta = (title: string, destructive = false) =>
    confirm({ title, kind: 'sim-nao', destructive }).then((v) => v === true);

  /** POST the action; 428 on Regerar opens the password dialog, other errors are toasted. */
  const executar = async (acao: string, label: string, body: object): Promise<void> => {
    let r: Resultado;
    try {
      r = await apiFetch<Resultado>(
        `/documentos/acoes/${acao}`,
        { method: 'POST', body: JSON.stringify(body) },
        { quiet: true },
      );
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 428) return setDlg({ tipo: 'password' });
      if (err.status !== 401) toast.error(err.message);
      return;
    }
    onDone();
    if (r.skipped.length > 0) return setDlg({ tipo: 'resultado', label, r });
    fechar();
    toast.success(
      r.pedidos !== undefined && r.ok.length === 0
        ? `${label}: ${r.pedidos} pedido(s) processado(s).`
        : `${label}: ${r.ok.length} documento(s) processado(s).`,
    );
  };

  const simples = async (acao: string, label: string, pergunta_: string, destructive = false) => {
    const body = sel();
    if (body && (await pergunta(pergunta_, destructive))) await executar(acao, label, body);
  };

  const regerar = () => simples('regerar', 'Regerar', MSG.desejaRegerar);
  const impressao = async (acao: Impressao, label: string) => {
    if (sel() && (await pergunta(MSG.desejaImprimir))) setDlg({ tipo: 'impressao', acao, label });
  };
  const cancelar = () => {
    if (sel()) setDlg({ tipo: 'cancelar' });
  };

  const grupo = (children: ReactNode) => <div className="flex items-center gap-1">{children}</div>;
  const btn = (label: string, onClick: () => void, destructive = false) => (
    <Button
      size="sm"
      variant="outline"
      onClick={onClick}
      className={destructive ? 'text-danger-text hover:text-danger-text' : undefined}
    >
      {label}
    </Button>
  );
  const sep = <span className="mx-1 h-5 w-px bg-border" aria-hidden />;

  return (
    <div role="toolbar" aria-label="Acções sobre os documentos" className="flex flex-wrap items-center gap-1">
      {grupo(
        <>
          {btn('Regerar', () => void regerar())}
          {btn('Reimprimir', () => void impressao('reimprimir', 'Reimprimir'))}
          {btn('2ª Via', () => void impressao('segunda-via', '2ª Via'))}
          {btn('Cópia', () => void impressao('copia', 'Cópia'))}
        </>,
      )}
      {sep}
      {grupo(
        <>
          {btn('Reenviar', () => void simples('reenviar-edoc', 'Reenviar', MSG.desejaReenviar))}
          {btn('Reenviar Email', () => void simples('reenviar-email', 'Reenviar Email', MSG.desejaReenviar))}
          {btn('Re-Arquivar', () => void simples('rearquivar', 'Re-Arquivar', MSG.desejaRearquivar))}
        </>,
      )}
      {sep}
      {grupo(
        <>
          {btn('Suspender', () => setDlg({ tipo: 'fila', acao: 'suspender', label: 'Suspender' }))}
          {btn('Retomar', () => setDlg({ tipo: 'fila', acao: 'retomar', label: 'Retomar' }))}
        </>,
      )}
      {sep}
      {grupo(
        <>
          {btn('Anular', () => void simples('anular', 'Anular', MSG.desejaAnular, true), true)}
          {btn('Cancelar', cancelar, true)}
        </>,
      )}

      <Dialog open={dlg !== null} onOpenChange={(o) => !o && fechar()}>
        <DialogContent className={dlg?.tipo === 'resultado' ? 'sm:max-w-lg' : 'sm:max-w-md'}>
          {dlg?.tipo === 'impressao' && (
            <ImpressaoForm
              label={dlg.label}
              onCancel={fechar}
              onOk={(impressoraId) => {
                const body = sel();
                if (body) return executar(dlg.acao, dlg.label, { ...body, ...(impressoraId ? { impressoraId } : {}) });
              }}
            />
          )}
          {dlg?.tipo === 'password' && (
            <PasswordForm
              onCancel={fechar}
              onOk={() => {
                const body = sel();
                if (body) return executar('regerar', 'Regerar', body);
              }}
            />
          )}
          {dlg?.tipo === 'cancelar' && (
            <CancelarForm
              onCancel={fechar}
              onOk={(force) => {
                const body = sel();
                if (body) return executar('cancelar', 'Cancelar', { ...body, force });
              }}
            />
          )}
          {dlg?.tipo === 'fila' && (
            <FilaForm
              acao={dlg.acao}
              label={dlg.label}
              onCancel={fechar}
              onOk={async (todos) => {
                if (!todos) {
                  const body = sel();
                  if (body) await executar(dlg.acao, dlg.label, body);
                  return;
                }
                const estado = dlg.acao === 'suspender' ? 'ESPERA' : 'SUSPENSO';
                const { n } = await apiFetch<{ n: number }>(`/documentos/fila/contagem?estado=${estado}`);
                const texto =
                  dlg.acao === 'suspender'
                    ? `Vão ser suspensos ${n} pedidos em espera. Continuar?`
                    : `Vão ser retomados ${n} pedidos suspensos. Continuar?`;
                if (await pergunta(texto)) await executar(dlg.acao, dlg.label, { todaFila: true });
              }}
            />
          )}
          {dlg?.tipo === 'resultado' && <ResultadoView label={dlg.label} r={dlg.r} onClose={fechar} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── dialogs ──────────────────────────────────────────────────────────────────────────────────

function Rodape({ onCancel, busy, okLabel = pt.ok }: { onCancel: () => void; busy: boolean; okLabel?: string }) {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel}>
        {pt.cancelar}
      </Button>
      <Button type="submit" disabled={busy}>
        {okLabel}
      </Button>
    </DialogFooter>
  );
}

/** Runs `onOk` once, keeps the dialog busy meanwhile. */
function useBusy() {
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => unknown) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  return [busy, run] as const;
}

/** REIMPRIMIR window (#8, BR-DOC-10): the document's printer, or another valid one. */
function ImpressaoForm(props: { label: string; onCancel: () => void; onOk: (impressoraId: string | null) => unknown }) {
  const [outra, setOutra] = useState(false);
  const [impressora, setImpressora] = useState<ImpressoraRow | null>(null);
  const [picker, setPicker] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [busy, run] = useBusy();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (outra && !impressora) return setErro('Campo obrigatório não preenchido.');
        void run(() => props.onOk(outra && impressora ? String(impressora.ID) : null));
      }}
      className="flex flex-col gap-4"
    >
      <DialogHeader>
        <DialogTitle>{props.label}</DialogTitle>
      </DialogHeader>
      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="sr-only">Impressora</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="impressora" checked={!outra} onChange={() => setOutra(false)} className="accent-primary" />
          {MSG.impressoraAssociada}
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="impressora" checked={outra} onChange={() => setOutra(true)} className="accent-primary" />
          {MSG.outraImpressora}
        </label>
        <div className="flex items-center gap-1 pl-6">
          <input
            readOnly
            aria-label="Impressoras"
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? 'impressora-erro' : undefined}
            value={impressora ? `${impressora.ID} — ${impressora.DESCRICAO ?? ''}` : ''}
            onFocus={() => setOutra(true)}
            onKeyDown={(e) => {
              if ((e.altKey && e.key === 'ArrowDown') || e.key === 'F9') {
                e.preventDefault();
                setPicker(true);
              }
            }}
            className={inputCls}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Escolher impressora"
            onClick={() => {
              setOutra(true);
              setPicker(true);
            }}
          >
            …
          </Button>
        </div>
        {erro && (
          <p id="impressora-erro" className="pl-6 text-xs text-field-error">
            {erro}
          </p>
        )}
      </fieldset>
      <Rodape onCancel={props.onCancel} busy={busy} />
      <ImpressoraPicker
        open={picker}
        onOpenChange={setPicker}
        onSelect={(row) => {
          setImpressora(row);
          setErro(null);
        }}
      />
    </form>
  );
}

/** CONFIRMAR_PASSWORD (#14, #15): the 428 of Regerar → reauth, then Regerar again. */
function PasswordForm(props: { onCancel: () => void; onOk: () => unknown }) {
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [busy, run] = useBusy();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void run(async () => {
          try {
            await apiFetch(
              '/auth/reauth-regeneracao',
              { method: 'POST', body: JSON.stringify({ password }) },
              { quiet: true },
            );
          } catch (err) {
            const ae = err as ApiError;
            if (ae.status !== 401) setErro(ae.status === 400 ? pt.passwordObrigatoria : ae.message);
            return;
          }
          await props.onOk();
        });
      }}
      className="flex flex-col gap-4"
    >
      <DialogHeader>
        <DialogTitle>Regerar</DialogTitle>
      </DialogHeader>
      <label className="flex flex-col gap-1 text-sm">
        {MSG.inserirPassword}
        <input
          type="password"
          autoFocus
          autoComplete="off"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErro(null);
          }}
          aria-invalid={erro ? true : undefined}
          className={inputCls}
        />
      </label>
      {erro && <p className="-mt-2 text-xs text-field-error">{erro}</p>}
      <Rodape onCancel={props.onCancel} busy={busy} />
    </form>
  );
}

/** #17 with the D-12 "Cancelar em todos os estados" option (off by default). */
function CancelarForm(props: { onCancel: () => void; onOk: (force: boolean) => unknown }) {
  const [force, setForce] = useState(false);
  const [busy, run] = useBusy();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => props.onOk(force));
      }}
      className="flex flex-col gap-4"
    >
      <DialogHeader>
        <DialogTitle>{MSG.desejaCancelar}</DialogTitle>
        <DialogDescription className="sr-only">Cancelar</DialogDescription>
      </DialogHeader>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="accent-primary" />
        {MSG.cancelarTodosEstados}
      </label>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={props.onCancel}>
          {pt.nao}
        </Button>
        <Button type="submit" variant="destructive" disabled={busy}>
          {pt.sim}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** SUSPENDER / RETOMAR windows (#23, #24): the selection, or the whole queue (D-28 count first). */
function FilaForm(props: { acao: Fila; label: string; onCancel: () => void; onOk: (todos: boolean) => unknown }) {
  const [todos, setTodos] = useState(false);
  const [busy, run] = useBusy();
  const [um, dois] =
    props.acao === 'suspender'
      ? [MSG.suspenderSeleccionados, MSG.suspenderTodos]
      : [MSG.retomarSeleccionados, MSG.retomarTodos];
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => props.onOk(todos));
      }}
      className="flex flex-col gap-4"
    >
      <DialogHeader>
        <DialogTitle>{props.label}</DialogTitle>
      </DialogHeader>
      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="sr-only">{props.label}</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="fila" checked={!todos} onChange={() => setTodos(false)} className="accent-primary" />
          {um}
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="fila" checked={todos} onChange={() => setTodos(true)} className="accent-primary" />
          {dois}
        </label>
      </fieldset>
      <Rodape onCancel={props.onCancel} busy={busy} />
    </form>
  );
}

/** Per-document result: what was processed, then each skip message with its spool ids. */
function ResultadoView({ label, r, onClose }: { label: string; r: Resultado; onClose: () => void }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{label}</DialogTitle>
        <DialogDescription>{`${r.ok.length} documento(s) processado(s).`}</DialogDescription>
      </DialogHeader>
      <div className="flex max-h-80 flex-col gap-3 overflow-auto">
        {agrupar(r.skipped).map((g) => (
          <section key={g.motivo} aria-label={g.motivo} className="flex flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm">{g.motivo}</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 shrink-0"
                onClick={() => void navigator.clipboard?.writeText(g.ids.join(', '))}
              >
                Copiar
              </Button>
            </div>
            <p className="rounded-md bg-muted px-2 py-1 font-mono text-xs break-words">{g.ids.join(', ')}</p>
          </section>
        ))}
      </div>
      <DialogFooter>
        <Button autoFocus onClick={onClose}>
          {pt.ok}
        </Button>
      </DialogFooter>
    </>
  );
}
