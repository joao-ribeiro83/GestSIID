import { useState } from 'react';
import { toQueryString, type PagedResult } from '@gestsiid/shared';
import { apiFetch, type ApiError } from '@/api/client';
import type { ExtraQuery } from '@/components/datablock/DataBlock';
import { ModeloPicker } from '@/components/ModeloPicker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CONVERSOES, paramsDe, type ParamRow } from './-common';
import { useTab } from './-tabs';

/**
 * Procurar por parâmetros (#27, PROCURAR / PROCURAR_PARAMETROS), Clonar (CLONAR /
 * CLONAR_DOCUMENTO, ADM only) and Conversão de Parametros (#28, CONVERTE_PARAM) — UI_SPEC §4.2.
 */

const inputCls =
  'h-8 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive';

/** Nome / Valor grid; P_NMRECIBO and P_CDPERSON open the conversion on double-click or Alt+↓. */
function ParamGrid({
  label,
  rows,
  onChange,
  nomeEditavel,
}: {
  label: string;
  rows: ParamRow[];
  onChange: (rows: ParamRow[]) => void;
  nomeEditavel?: boolean;
}) {
  const [conv, setConv] = useState<number | null>(null);
  const set = (i: number, patch: Partial<ParamRow>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const convRow = conv === null ? null : rows[conv];
  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-border">
      <table aria-label={label} className="w-full table-fixed border-separate border-spacing-0 text-sm">
        <colgroup>
          <col style={{ width: 180 }} />
          <col />
        </colgroup>
        <thead className="sticky top-0 bg-surface-header">
          <tr className="h-8">
            <th scope="col" className="border-b border-border px-2 text-left font-semibold">Nome</th>
            <th scope="col" className="border-b border-border px-2 text-left font-semibold">Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const conversao = CONVERSOES[r.NOME];
            return (
              <tr key={i} className="h-8 [&>td]:border-b [&>td]:border-border">
                <td className="px-2 font-mono">
                  {nomeEditavel ? (
                    <input
                      aria-label={`Nome ${i + 1}`}
                      value={r.NOME}
                      maxLength={30}
                      onChange={(e) => set(i, { NOME: e.target.value.toUpperCase() })}
                      className={inputCls}
                    />
                  ) : (
                    r.NOME
                  )}
                </td>
                <td className="px-1">
                  <input
                    aria-label={`Valor ${r.NOME || i + 1}`}
                    value={r.VALOR ?? ''}
                    maxLength={2000}
                    title={conversao ? 'Duplo clique ou Alt+↓: Conversão de Parametros' : undefined}
                    onChange={(e) => set(i, { VALOR: e.target.value })}
                    onDoubleClick={() => conversao && setConv(i)}
                    onKeyDown={(e) => {
                      if (conversao && e.altKey && e.key === 'ArrowDown') {
                        e.preventDefault();
                        setConv(i);
                      }
                    }}
                    className={inputCls}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Dialog open={convRow != null} onOpenChange={(o) => !o && setConv(null)}>
        <DialogContent className="sm:max-w-sm">
          {convRow && (
            <ConversaoForm
              nome={convRow.NOME}
              onCancel={() => setConv(null)}
              onValor={(valor) => {
                set(conv!, { VALOR: valor });
                setConv(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConversaoForm({ nome, onCancel, onValor }: { nome: string; onCancel: () => void; onValor: (v: string) => void }) {
  const c = CONVERSOES[nome]!;
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void apiFetch<{ valor: string | null }>(
          `/documentos/conversoes/${c.tipo}?${c.query}=${encodeURIComponent(valor.trim())}`,
          {},
          { quiet: true },
        ).then(
          (r) => (r.valor === null ? setErro('Registo não encontrado.') : onValor(r.valor)),
          (err: ApiError) => setErro(err.status === 400 ? 'Valor inválido.' : err.message),
        );
      }}
      className="flex flex-col gap-4"
    >
      <DialogHeader>
        <DialogTitle>Conversão de Parametros</DialogTitle>
        <DialogDescription className="font-mono">{nome}</DialogDescription>
      </DialogHeader>
      <label className="flex flex-col gap-1 text-sm">
        {c.campo}
        <input
          autoFocus
          value={valor}
          onChange={(e) => {
            setValor(e.target.value);
            setErro(null);
          }}
          aria-invalid={erro ? true : undefined}
          className={inputCls}
        />
      </label>
      {erro && <p className="-mt-2 text-xs text-field-error">{erro}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={valor.trim() === ''}>
          OK
        </Button>
      </DialogFooter>
    </form>
  );
}

/** The current document's parameter names (`_USER`, `P_ID` already left out by the API). */
function useParametros(docId: number | null, comValores: boolean): ParamRow[] | null {
  const q = useTab(docId, 'parametros');
  if (docId === null) return [{ NOME: '', VALOR: '' }];
  if (!q.data) return null;
  return q.data.map((r) => ({ NOME: String(r['NOME']), VALOR: comValores ? ((r['VALOR'] as string | null) ?? '') : '' }));
}

export function ProcurarDialog(props: {
  open: boolean;
  docId: number | null;
  preset: string;
  onClose: () => void;
  onProcurar: (q: ExtraQuery) => void;
}) {
  return (
    <Dialog open={props.open} onOpenChange={(o) => !o && props.onClose()}>
      <DialogContent className="sm:max-w-lg">{props.open && <ProcurarForm {...props} />}</DialogContent>
    </Dialog>
  );
}

function ProcurarForm({ docId, preset, onClose, onProcurar }: Parameters<typeof ProcurarDialog>[0]) {
  const iniciais = useParametros(docId, false);
  const [rows, setRows] = useState<ParamRow[] | null>(null);
  const [modelo, setModelo] = useState('');
  const [picker, setPicker] = useState(false);
  const [alerta, setAlerta] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const atuais = rows ?? iniciais;

  const procurar = async () => {
    const params = paramsDe(atuais ?? []);
    if (params.length === 0) return setAlerta('Indique o valor de pelo menos um parâmetro.');
    const q: ExtraQuery = { params, ...(modelo.trim() ? { paramModelo: modelo.trim() } : {}) };
    setBusy(true);
    try {
      const r = await apiFetch<PagedResult<unknown>>(
        `/documentos?${toQueryString({ filters: {}, preset, ...q, sort: [], page: 1, size: 1 })}`,
      );
      if (r.total === 0) return setAlerta('A consulta não obteve documentos.');
      onProcurar(q);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void procurar();
      }}
      className="flex flex-col gap-4"
    >
      <DialogHeader>
        <DialogTitle>Procurar por parâmetros</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-1 text-sm">
        <label htmlFor="procurar-modelo">Procurar apenas no modelo:</label>
        <div className="flex items-center gap-1">
          <input
            id="procurar-modelo"
            value={modelo}
            onChange={(e) => setModelo(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if ((e.altKey && e.key === 'ArrowDown') || e.key === 'F9') {
                e.preventDefault();
                setPicker(true);
              }
            }}
            className={inputCls + ' font-mono'}
          />
          <Button type="button" variant="outline" size="sm" aria-label="Escolher modelo" onClick={() => setPicker(true)}>
            …
          </Button>
        </div>
      </div>
      {atuais === null ? (
        <p className="py-6 text-center text-sm text-muted-foreground">A carregar…</p>
      ) : (
        <ParamGrid
          label="Parâmetros a procurar"
          rows={atuais}
          nomeEditavel={docId === null}
          onChange={(r) => {
            setRows(r);
            setAlerta(null);
          }}
        />
      )}
      {docId === null && atuais && (
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setRows([...atuais, { NOME: '', VALOR: '' }])}>
          Adicionar parâmetro
        </Button>
      )}
      {alerta && (
        <p role="alert" className="rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
          {alerta}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy || atuais === null}>
          Procurar
        </Button>
      </DialogFooter>
      <ModeloPicker open={picker} onOpenChange={setPicker} onSelect={(m) => setModelo(m.ID)} />
    </form>
  );
}

export function ClonarDialog(props: { docId: number | null; onClose: () => void; onClonado: (id: number) => void }) {
  return (
    <Dialog open={props.docId !== null} onOpenChange={(o) => !o && props.onClose()}>
      <DialogContent className="sm:max-w-lg">
        {props.docId !== null && <ClonarForm {...props} docId={props.docId} />}
      </DialogContent>
    </Dialog>
  );
}

function ClonarForm({ docId, onClose, onClonado }: { docId: number; onClose: () => void; onClonado: (id: number) => void }) {
  const iniciais = useParametros(docId, true);
  const [rows, setRows] = useState<ParamRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const atuais = rows ?? iniciais;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!atuais) return;
        setBusy(true);
        apiFetch<{ id: number }>(`/documentos/${docId}/clonar`, {
          method: 'POST',
          body: JSON.stringify({ parametros: atuais.map((r) => ({ nome: r.NOME, valor: r.VALOR ?? '' })) }),
        })
          .then((r) => onClonado(r.id))
          .catch(() => undefined)
          .finally(() => setBusy(false));
      }}
      className="flex flex-col gap-4"
    >
      <DialogHeader>
        <DialogTitle>Clonar</DialogTitle>
        <DialogDescription>Documento {docId}</DialogDescription>
      </DialogHeader>
      {atuais === null ? (
        <p className="py-6 text-center text-sm text-muted-foreground">A carregar…</p>
      ) : (
        <ParamGrid label="Parâmetros do clone" rows={atuais} onChange={setRows} />
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy || atuais === null}>
          Clonar
        </Button>
      </DialogFooter>
    </form>
  );
}
