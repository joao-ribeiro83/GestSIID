import { useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleAlert, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { pt, type ColumnDef } from '@gestsiid/shared';
import { apiFetch, type ApiError } from '@/api/client';
import { formatCell, formatNumber } from '@/components/datablock/format';
import { useConfirm } from '@/components/shell/confirm-dialog-provider';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * Detail tabs of the current document (UI_SPEC §4.2): Mais Informação (`GET /api/documentos/:id`,
 * DETALHES_DOCUMENTO), Parâmetros, Comentários, Anexos, Detalhes (the queue, SVR_QUEUE) and Log
 * (ERR_ERROS_SIID), each `GET /api/documentos/:id/<tab>` → `{ rows }`. Read-only here; the
 * comment insert is Step 7.4.
 */

type Row = Record<string, unknown>;
export type TabId = 'info' | 'parametros' | 'comentarios' | 'anexos' | 'fila' | 'erros';

export const TABS: [TabId, string][] = [
  ['info', 'Mais Informação'],
  ['parametros', 'Parâmetros'],
  ['comentarios', 'Comentários'],
  ['anexos', 'Anexos'],
  ['fila', 'Detalhes'],
  ['erros', 'Log'],
];

const data = (v: unknown) => formatCell({ type: 'date' } as ColumnDef, v);

export function useTab(docId: number | null, tab: Exclude<TabId, 'info'>) {
  return useQuery({
    queryKey: ['/documentos', docId, tab],
    queryFn: () => apiFetch<{ rows: Row[] }>(`/documentos/${docId}/${tab}`).then((r) => r.rows),
    enabled: docId !== null,
  });
}

// ── Mais Informação ──────────────────────────────────────────────────────────────────────────

const serie = (prefixo: string, label: string, de: number, ate: number): [string, string][] =>
  Array.from({ length: ate - de + 1 }, (_, i) => [`${prefixo}${de + i}`, `${label}${de + i}`]);

/** DETALHES_DOCUMENTO canvas, column by column (labels from the form). */
const INFO: [string, string][][] = [
  [
    ['ID', 'Id'], ['MODELO_ID', 'Modelo Id'], ['ESTADO', 'Estado'], ['IMPRESSORA_ID', 'Impressora Id'],
    ['REPORT_ID', 'Report Id'], ['AMBIENTE_ID', 'Ambiente Id'], ['LOTE_ID', 'Lote Id'], ['LOTE_ORDEM', 'Lote Ordem'],
    ['N_REFERENCIA', 'N Referência'], ['DESTINATARIO', 'Destinatário'], ['MORADA', 'Morada'],
    ['CODIGO_POSTAL', 'Código Postal'], ['PAIS', 'País'], ['REGISTO_EDOC', 'Registo Edoc'],
    ['REGISTO_ARQUIVO', 'Registo Arquivo'],
  ],
  [
    ['TIPO_OUTPUT', 'Tipo Output'], ['NOME_OUTPUT', 'Nome Output'], ['CRIADO_POR', 'Criado Por'],
    ['DATA_PEDIDO', 'Data Pedido'], ['EXECUTADO_POR', 'Executado Por'], ['DATA_EXECUCAO', 'Data Execução'],
    ['IMPRESSO_POR', 'Impresso Por'], ['DATA_IMPRESSAO', 'Data Impressão'],
  ],
  [
    ['VERSAO', 'Versão'], ['N_IMPRESSOES', 'N Impressões'], ['N_ANEXOS', 'N Anexos'], ['N_COPIAS', 'N Cópias'],
    ['N_CAPAS', 'N Capas'], ['ULTIMA_VIA_POR', 'Última Via Por'], ['N_VIAS', 'N Vias'],
    ['TAMANHO_BYTES', 'Tamanho ficheiro'], ['DISPONIBILIDADE', 'Disponibilidade'],
  ],
  [['EDOC_ID', 'Tipo Edoc Id'], ...serie('ATRIBUTO', 'Atributo', 1, 25)],
  [['ARQ_ID', 'Tipo Arquivo Id'], ...serie('ATRIB_ARQ_', 'Atrib. Arquivo ', 1, 20), ['DATA_ARQUIVO', 'Data Arquivo']],
];
const DATAS = new Set(['DATA_PEDIDO', 'DATA_EXECUCAO', 'DATA_IMPRESSAO', 'DATA_ARQUIVO']);

function valorInfo(col: string, v: unknown): ReactNode {
  if (v == null || v === '') return <span className="text-muted-foreground">—</span>;
  if (col === 'ESTADO') return <StatusBadge value={v} domain="documento" />;
  if (col === 'DISPONIBILIDADE') return <Disponibilidade value={String(v)} />;
  if (DATAS.has(col)) return data(v);
  if (typeof v === 'number') return formatNumber(v);
  return String(v);
}

export function Disponibilidade({ value }: { value: string }) {
  const tone =
    value === 'OFF'
      ? ['Offline', 'bg-status-offline-bg text-status-offline-fg']
      : value === 'ANU'
        ? ['Anulado', 'bg-status-anulado-bg text-status-anulado-fg']
        : value === 'EDC'
          ? ['EDC', 'bg-status-neutral-bg text-status-neutral-fg']
          : null;
  if (!tone) return <>{value}</>;
  return (
    <span className={cn('inline-flex h-5 items-center rounded-sm px-1.5 text-xs font-semibold', tone[1])}>
      {tone[0]}
    </span>
  );
}

export function MaisInformacao({ docId }: { docId: number | null }) {
  const q = useQuery({
    queryKey: ['/documentos', docId, 'info'],
    queryFn: () => apiFetch<Row>(`/documentos/${docId}`),
    enabled: docId !== null,
  });
  if (docId === null) return <Vazio>{pt.db.seleccioneRegisto}</Vazio>;
  if (q.isPending) return <Vazio>A carregar…</Vazio>;
  if (q.isError) return <Erro error={q.error as ApiError} />;
  const row = q.data;
  // USER receives fewer columns (D-08): a field the payload lacks is not rendered.
  const colunas = INFO.map((c) => c.filter(([col]) => col in row)).filter((c) => c.length > 0);
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-0 md:grid-cols-3 xl:grid-cols-5">
      {colunas.map((campos, i) => (
        <dl key={i} className="flex flex-col gap-2">
          {campos.map(([col, label]) => (
            <div key={col} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="truncate text-sm" title={row[col] == null ? undefined : String(row[col])}>
                {valorInfo(col, row[col])}
              </dd>
            </div>
          ))}
        </dl>
      ))}
    </div>
  );
}

// ── Simple read-only grids ───────────────────────────────────────────────────────────────────

interface Col {
  key: string;
  label: string;
  width?: number;
  cls?: string;
  render?: (row: Row) => ReactNode;
}

function Vazio({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

function Erro({ error }: { error: ApiError }) {
  return (
    <div className="py-8 text-center text-sm">
      <CircleAlert className="mx-auto mb-2 size-5 text-danger-text" aria-hidden />
      <p className="text-danger-text">{error.message}</p>
      {error.requestId && <p className="mt-1 text-xs text-muted-foreground">{pt.erro.ref(error.requestId)}</p>}
    </div>
  );
}

function Grelha({
  label,
  docId,
  tab,
  cols,
  acoes,
  onActivate,
}: {
  label: string;
  docId: number | null;
  tab: Exclude<TabId, 'info'>;
  cols: Col[];
  acoes?: (row: Row) => ReactNode;
  onActivate?: (row: Row) => void;
}) {
  const q = useTab(docId, tab);
  if (docId === null) return <Vazio>{pt.db.seleccioneRegisto}</Vazio>;
  if (q.isPending) return <Vazio>A carregar…</Vazio>;
  if (q.isError) return <Erro error={q.error as ApiError} />;
  if (q.data.length === 0) return <Vazio>{pt.db.semRegistos}</Vazio>;
  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-border">
      <table aria-label={label} className="w-full table-fixed border-separate border-spacing-0 text-sm">
        <colgroup>
          {cols.map((c) => (
            <col key={c.key} style={c.width ? { width: c.width } : undefined} />
          ))}
          {acoes && <col style={{ width: 40 }} />}
        </colgroup>
        <thead className="sticky top-0 bg-surface-header">
          <tr className="h-8">
            {cols.map((c) => (
              <th key={c.key} scope="col" className="border-b border-border px-2 text-left font-semibold">
                {c.label}
              </th>
            ))}
            {acoes && (
              <th scope="col" className="border-b border-border">
                <span className="sr-only">Acções</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {q.data.map((row, i) => (
            <tr
              key={i}
              tabIndex={onActivate ? 0 : undefined}
              onDoubleClick={() => onActivate?.(row)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onActivate && e.target === e.currentTarget) onActivate(row);
              }}
              className="h-7 outline-none hover:bg-row-hover focus-visible:bg-row-current [&>td]:border-b [&>td]:border-border"
            >
              {cols.map((c) => (
                <td key={c.key} className={cn('truncate px-2', c.cls)}>
                  {c.render ? c.render(row) : row[c.key] == null ? '' : String(row[c.key])}
                </td>
              ))}
              {acoes && <td className="text-center">{acoes(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const dataCol = (key: string, label: string): Col => ({ key, label, width: 132, render: (r) => data(r[key]) });

export function Parametros({ docId }: { docId: number | null }) {
  return (
    <Grelha
      label="Parâmetros"
      docId={docId}
      tab="parametros"
      cols={[
        { key: 'NOME', label: 'Nome', width: 220, cls: 'font-mono' },
        { key: 'VALOR', label: 'Valor' },
      ]}
    />
  );
}

export function Comentarios({ docId }: { docId: number | null }) {
  return (
    <Grelha
      label="Comentários"
      docId={docId}
      tab="comentarios"
      cols={[
        dataCol('DATA', 'Data'),
        { key: 'USER_ID', label: 'Utilizador', width: 104 },
        { key: 'COMENTARIO', label: 'Comentário', cls: 'whitespace-normal line-clamp-3' },
      ]}
    />
  );
}

export function Anexos({ docId }: { docId: number | null }) {
  return (
    <Grelha
      label="Anexos"
      docId={docId}
      tab="anexos"
      cols={[
        { key: 'ANEXODOC_ID', label: 'Spool Id', width: 120, cls: 'text-right font-mono tabular-nums' },
        { key: 'TIPO_ANEXO_RF', label: 'Tipo Anexo' },
      ]}
    />
  );
}

export function Log({ docId }: { docId: number | null }) {
  return (
    <Grelha
      label="Log"
      docId={docId}
      tab="erros"
      cols={[dataCol('DATA_ERRO', 'Data Log'), { key: 'DESCRICAO', label: 'Descrição' }]}
    />
  );
}

/** Queue rows; `Cancelar` only in ESPERA / TERMINADO (BR-DOC-23), ADM and USER. */
export function Fila({ docId }: { docId: number | null }) {
  const confirm = useConfirm();
  const qc = useQueryClient();
  const [resultado, setResultado] = useState<string | null>(null);

  const cancelar = async (row: Row) => {
    if (!(await confirm({ title: pt.documentos.desejaCancelarPedido, kind: 'sim-nao', destructive: true }))) return;
    try {
      await apiFetch(`/documentos/${docId}/fila/${String(row['ID'])}/cancelar`, { method: 'POST' });
      toast.success('Cancelar: 1 documento(s) processado(s).');
    } finally {
      void qc.invalidateQueries({ queryKey: ['/documentos'] });
    }
  };

  return (
    <>
      <Grelha
        label="Detalhes"
        docId={docId}
        tab="fila"
        onActivate={(row) => setResultado(row['RESULTADO'] == null ? '' : String(row['RESULTADO']))}
        cols={[
          { key: 'TIPO_QUEUE_RF', label: 'Detalhe', width: 96 },
          dataCol('DATA_PEDIDO', 'Data Pedido'),
          { key: 'CRIADO_POR', label: 'Criado Por', width: 104 },
          dataCol('DATA_EXECUCAO', 'Data Execução'),
          dataCol('DATA_FINALIZACAO', 'Data Finalização'),
          { key: 'ESTADO', label: 'Estado', width: 112, render: (r) => <StatusBadge value={r['ESTADO']} domain="fila" /> },
          { key: 'IMPRESSORA', label: 'Impressora', width: 180 },
          { key: 'RESULTADO', label: 'Resultado' },
        ]}
        acoes={(row) =>
          row['ESTADO'] === 'ESPERA' || row['ESTADO'] === 'TERMINADO' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-6" aria-label={`Pedido ${String(row['ID'])}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => void cancelar(row)}>Cancelar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null
        }
      />
      <Dialog open={resultado !== null} onOpenChange={(o) => !o && setResultado(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resultado</DialogTitle>
          </DialogHeader>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs">
            {resultado || '—'}
          </pre>
          <DialogFooter>
            <Button onClick={() => setResultado(null)}>{pt.ok}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
