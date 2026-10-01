import { useRef, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquare, RefreshCw, Search, X } from 'lucide-react';
import { Tabs } from 'radix-ui';
import { toast } from 'sonner';
import { documentos, pt } from '@gestsiid/shared';
import { apiUrl } from '@/api/client';
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
import { cn } from '@/lib/utils';
import { Accoes } from './-acoes';
import type { DocRow } from './-common';
import { ClonarDialog, ProcurarDialog } from './-dialogs';
import { Anexos, Comentarios, Fila, Log, MaisInformacao, Parametros, TABS, type TabId } from './-tabs';

/**
 * Gestão › Documentos (UI_SPEC §4.2, MASTER_PLAN Step 7.3): `FD_GESTAO_SIID` / `_USER`.
 * Read-only list over `GET /api/documentos` with the six filter buttons, the sort buttons as
 * headers, row colours from POST-QUERY (`COR`, `COMENTARIO`), multi-selection (ticked ids or the
 * whole query, §4.2), the GENERICO popup as the row context menu, the ADM action toolbar
 * (hidden for USER, D-08) and the detail tabs. No tablespace gauge (D-13); no polling (§7).
 */
export const Route = createFileRoute('/_app/gestao/documentos')({
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

const tabCls =
  '-mb-px border-b-2 border-transparent px-3 py-1.5 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:border-primary data-[state=active]:font-semibold data-[state=active]:text-foreground';

/** Mostrar Documento: the window opens inside the click (no popup blocker), the PDF follows. */
async function mostrarDocumento(id: number) {
  const w = window.open('', '_blank');
  try {
    const res = await fetch(apiUrl(`/documentos/${id}/pdf`), { credentials: 'same-origin' });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new Error(body?.message ?? 'Documento não disponível.');
    }
    const url = URL.createObjectURL(await res.blob());
    if (w) w.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (e) {
    w?.close();
    toast.error((e as Error).message);
  }
}

function DocumentosScreen() {
  const { session } = Route.useRouteContext();
  const adm = session.role === 'ADM';
  const qc = useQueryClient();
  const grid = useRef<DataBlockHandle>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [preset, setPreset] = useState<string>('todos');
  const [extra, setExtra] = useState<ExtraQuery>({});
  const [selection, setSelection] = useState<Selection>({ mode: 'none' });
  const [current, setCurrent] = useState<DocRow | null>(null);
  const [tab, setTab] = useState<TabId>('info');
  const [procurar, setProcurar] = useState(false);
  const [clonar, setClonar] = useState<number | null>(null);

  const docId = current ? Number(current.ID) : null;
  const actualizar = () => void qc.invalidateQueries({ queryKey: ['/documentos'] });
  const mostrarGrupo = (id: number) => setExtra((e) => ({ ...e, grupo: String(id) }));
  const focarTabs = () => tabsRef.current?.querySelector<HTMLElement>('[role="tab"][data-state="active"]')?.focus();

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
            onClick={() => setTab('comentarios')}
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
    const irPara = (t: TabId) => () => setTab(t);
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

  // A list and a tabbed detail do not fit one laptop screen: the page scrolls, the grid keeps a height.
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* The shell already shows the page title (h1). */}
      <div className="flex flex-wrap items-center gap-2">
        {adm && (
          <Accoes
            selection={selection}
            onDone={() => {
              grid.current?.clearSelection();
              actualizar();
            }}
          />
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setProcurar(true)}>
            <Search /> Procurar por parâmetros
          </Button>
          <Button size="sm" variant="outline" onClick={actualizar}>
            <RefreshCw /> {pt.db.actualizar}
          </Button>
        </div>
      </div>

      <DataBlock<DocRow>
        className="h-[30rem] shrink-0"
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
        onRowActivate={(_, how) => (how === 'enter' ? focarTabs() : setTab('info'))}
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
            {extra.grupo && chip(`Grupo do documento ${extra.grupo}`, () => setExtra((e) => ({ ...e, grupo: undefined })))}
            {extra.params && chip('Procurar por parâmetros', () => setExtra((e) => ({ ...e, ...SEM_PARAMS })))}
          </div>
        )}
      />

      <section aria-label="Detalhe do documento" className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-sm font-semibold">
            {current ? (
              <>
                Documento <span className="font-mono">{current.ID}</span>
                <span className="font-normal text-muted-foreground">
                  {' · '}
                  <span className="font-mono">{current.MODELO_ID}</span>
                  {current.ESTADO ? ` · (${current.ESTADO})` : ''}
                </span>
              </>
            ) : (
              <span className="font-normal text-muted-foreground">{pt.db.seleccioneRegisto}</span>
            )}
          </h2>
          <Button size="sm" variant="outline" disabled={!current} onClick={() => docId && void mostrarDocumento(docId)}>
            Mostrar Documento
          </Button>
          <Button size="sm" variant="outline" disabled={!current} onClick={() => docId && mostrarGrupo(docId)}>
            Mostrar Grupo
          </Button>
          {adm && (
            <Button size="sm" variant="outline" disabled={!current} onClick={() => setClonar(docId)}>
              Clonar
            </Button>
          )}
        </div>
        <Tabs.Root ref={tabsRef} value={tab} onValueChange={(v) => setTab(v as TabId)} className="flex flex-col">
          <Tabs.List aria-label="Detalhe do documento" className="flex gap-1 overflow-x-auto border-b border-border">
            {TABS.map(([value, label]) => (
              <Tabs.Trigger key={value} value={value} className={cn(tabCls, 'shrink-0')}>
                {label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Tabs.Content value="info" className="pt-3">
            <MaisInformacao docId={docId} />
          </Tabs.Content>
          <Tabs.Content value="parametros" className="pt-3">
            <Parametros docId={docId} />
          </Tabs.Content>
          <Tabs.Content value="comentarios" className="pt-3">
            <Comentarios docId={docId} adm={adm} />
          </Tabs.Content>
          <Tabs.Content value="anexos" className="pt-3">
            <Anexos docId={docId} onOpen={mostrarGrupo} />
          </Tabs.Content>
          <Tabs.Content value="fila" className="pt-3">
            <Fila docId={docId} />
          </Tabs.Content>
          <Tabs.Content value="erros" className="pt-3">
            <Log docId={docId} />
          </Tabs.Content>
        </Tabs.Root>
      </section>

      <ProcurarDialog
        open={procurar}
        docId={docId}
        preset={preset}
        onClose={() => setProcurar(false)}
        onProcurar={(q) => {
          setExtra((e) => ({ ...e, ...SEM_PARAMS, ...q }));
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
  );
}
