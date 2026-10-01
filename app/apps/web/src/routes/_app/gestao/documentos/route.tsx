import { useRef, useState } from 'react';
import { createFileRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquare, RefreshCw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { documentos, pt } from '@gestsiid/shared';
import {
  DataBlock,
  type ColumnView,
  type DataBlockHandle,
  type ExtraQuery,
  type Selection,
} from '@/components/datablock/DataBlock';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu';
import { PageActions } from '@/components/shell/page-actions';
import { Accoes } from './-acoes';
import type { DocRow } from './-common';
import { ClonarDialog, ProcurarDialog } from './-dialogs';
import { mostrarDocumento } from './-pdf';
import type { TabId } from './-tabs';

/**
 * Gestão › Documentos (UI_SPEC §4.2, MASTER_PLAN Step 7.3): `FD_GESTAO_SIID` / `_USER`.
 * Read-only list over `GET /api/documentos` with the six filter buttons, the sort buttons as
 * headers, row colours from POST-QUERY (`COR`, `COMENTARIO`), multi-selection (ticked ids or the
 * whole query, §4.2), the GENERICO popup as the row context menu and the ADM action toolbar
 * (hidden for USER, D-08). No tablespace gauge (D-13); no polling (§7).
 * D-34: the list fills the page; a row's tabs open on `$documentoId.tsx` (row button, Enter,
 * double-click, context menu). The list stays mounted (hidden) under that page, so Voltar finds its
 * filters, sort, page and selection unchanged. "Mostrar Grupo" lives in the URL (`?grupo=`), so the
 * detail page can set it too.
 */
export const Route = createFileRoute('/_app/gestao/documentos')({
  validateSearch: (s: Record<string, unknown>): { grupo?: string } =>
    typeof s['grupo'] === 'string' && /^\d+$/.test(s['grupo']) ? { grupo: s['grupo'] } : {},
  component: DocumentosScreen,
});

/** ORDENACAO_DOCUMENTOS filter buttons, left to right. */
const PRESETS = [
  ['todos', 'Todos'],
  ['em-branco', 'Em branco'],
  ['nao-executados', 'Não Executados'],
  ['em-erro', 'Em Erro'],
  ['a-executar', 'A Executar'],
  ['execucao', 'Em Execução'],
] as const;

const SEM_PARAMS: ExtraQuery = { params: undefined, paramModelo: undefined };

function DocumentosScreen() {
  const { session } = Route.useRouteContext();
  const { grupo } = Route.useSearch();
  const adm = session.role === 'ADM';
  const qc = useQueryClient();
  const navigate = useNavigate();
  const detalhe = useLocation().pathname !== '/gestao/documentos';
  const grid = useRef<DataBlockHandle>(null);
  const [preset, setPreset] = useState<string>('todos');
  const [params, setParams] = useState<ExtraQuery>({});
  const [selection, setSelection] = useState<Selection>({ mode: 'none' });
  const [current, setCurrent] = useState<DocRow | null>(null);
  const [procurar, setProcurar] = useState(false);
  const [clonar, setClonar] = useState<number | null>(null);

  const extra: ExtraQuery = { ...params, grupo };
  const actualizar = () => void qc.invalidateQueries({ queryKey: ['/documentos'] });
  const mostrarGrupo = (id: number) => void navigate({ to: '/gestao/documentos', search: { grupo: String(id) } });
  const abrir = (id: number, tab: TabId = 'info') =>
    void navigate({ to: '/gestao/documentos/$documentoId', params: { documentoId: String(id) }, search: { tab } });

  const columns: ColumnView<DocRow>[] = [
    {
      col: 'COMENTARIO',
      header: '✎',
      width: 32,
      align: 'center',
      render: (r) =>
        r.COMENTARIO ? (
          <button
            type="button"
            aria-label="Comentários"
            title="Comentários"
            onClick={() => abrir(Number(r.ID), 'comentarios')}
            className="inline-flex rounded-sm text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
          >
            <MessageSquare className="size-3.5" aria-hidden />
          </button>
        ) : null,
    },
    { col: 'ID', header: 'Spool Id', width: 88, align: 'end', mono: true },
    { col: 'DATA_PEDIDO', header: 'Data do pedido', width: 132 },
    { col: 'MODELO_ID', header: 'Modelo', width: 96, mono: true },
    {
      col: 'ESTADO',
      header: 'Estado',
      width: 128,
      render: (r) => <StatusBadge value={r.ESTADO} domain="documento" />,
    },
    { col: 'CRIADO_POR', header: 'Criado por', width: 104 },
    { col: 'N_REFERENCIA', header: 'Referência', width: 112, sortKey: 'REFERENCIA' },
    { col: 'DESTINATARIO', header: 'Destinatário', width: 184 },
    { col: 'FATURACAO_ELECTRONICA', header: 'FE', width: 40, align: 'center' },
    { col: 'LOTE_ID', header: 'Lote', width: 72, align: 'end', sortKey: 'LOTE' },
    { col: 'LOTE_ORDEM', header: 'Ordem', width: 64, align: 'end' },
  ];

  const menu = (row: DocRow) => {
    const id = Number(row.ID);
    const irPara = (t: TabId) => () => abrir(id, t);
    return (
      <>
        <ContextMenuItem onSelect={irPara('fila')}>Detalhes</ContextMenuItem>
        <ContextMenuItem onSelect={irPara('parametros')}>Parâmetros</ContextMenuItem>
        <ContextMenuItem onSelect={irPara('comentarios')}>Comentários</ContextMenuItem>
        <ContextMenuItem onSelect={irPara('erros')}>Log</ContextMenuItem>
        <ContextMenuItem onSelect={irPara('info')}>Mais Informação</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => mostrarGrupo(id)}>Mostrar Grupo</ContextMenuItem>
        <ContextMenuItem onSelect={() => void mostrarDocumento(id)}>Mostrar Documento</ContextMenuItem>
        {adm && <ContextMenuItem onSelect={() => setClonar(id)}>Clonar</ContextMenuItem>}
        <ContextMenuItem onSelect={() => setProcurar(true)}>Procurar por parâmetros</ContextMenuItem>
      </>
    );
  };

  const chip = (label: string, onRemove: () => void) => (
    <span className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-muted pl-2 text-sm">
      {label}
      <Button variant="ghost" size="icon" className="size-6" aria-label={`Remover ${label}`} onClick={onRemove}>
        <X className="size-3.5" />
      </Button>
    </span>
  );

  return (
    <>
      <div className={detalhe ? 'hidden' : 'flex min-h-0 flex-1 flex-col gap-3'}>
        {!detalhe && (
          <PageActions>
            <Button variant="outline" onClick={() => setProcurar(true)}>
              <Search /> Procurar por parâmetros
            </Button>
            <Button variant="outline" onClick={actualizar}>
              <RefreshCw /> {pt.db.actualizar}
            </Button>
          </PageActions>
        )}
        {adm && (
          <div className="flex flex-wrap items-center gap-2">
            <Accoes
              selection={selection}
              onDone={() => {
                grid.current?.clearSelection();
                actualizar();
              }}
            />
          </div>
        )}

        <DataBlock<DocRow>
          className="min-h-0 flex-1"
          heading="Documentos"
          resource={documentos}
          columns={columns}
          role={session.role}
          selection="multi"
          preset={preset}
          extraQuery={extra}
          emptyText="A consulta não obteve documentos."
          handleRef={grid}
          onSelectionChange={setSelection}
          onCurrentRowChange={setCurrent}
          rowTone={(r) => (r.COR === 'ANULADO' ? 'anulado' : r.COR === 'OFFLINE' ? 'offline' : null)}
          rowMenu={menu}
          rowOpenLabel="Abrir detalhe do documento"
          onRowOpen={(r) => abrir(Number(r.ID))}
          onRowActivate={(r) => abrir(Number(r.ID))}
          toolbar={() => (
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
              <div role="group" aria-label="Filtros" className="flex shrink-0 items-center gap-1">
                {PRESETS.map(([id, label]) => (
                  <Button
                    key={id}
                    size="sm"
                    variant={preset === id ? 'default' : 'outline'}
                    aria-pressed={preset === id}
                    className="h-7"
                    onClick={() => setPreset(id)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {grupo && chip(`Grupo do documento ${grupo}`, () => void navigate({ to: '/gestao/documentos', search: {} }))}
              {params.params && chip('Procurar por parâmetros', () => setParams(SEM_PARAMS))}
            </div>
          )}
        />

        <ProcurarDialog
          open={procurar}
          docId={current ? Number(current.ID) : null}
          preset={preset}
          onClose={() => setProcurar(false)}
          onProcurar={(q) => {
            setParams({ ...SEM_PARAMS, ...q });
            setProcurar(false);
          }}
        />
        <ClonarDialog
          docId={clonar}
          onClose={() => setClonar(null)}
          onClonado={(id) => {
            toast.success(`Documento clonado. Novo Spool Id: ${id}.`);
            setClonar(null);
            actualizar();
          }}
        />
      </div>
      <Outlet />
    </>
  );
}
