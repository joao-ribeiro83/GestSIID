import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs } from 'radix-ui';
import { toast } from 'sonner';
import { useRow } from '@/components/datablock/useRow';
import { Voltar } from '@/components/shell/page-actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DocRow } from './-common';
import { ClonarDialog } from './-dialogs';
import { mostrarDocumento } from './-pdf';
import { Anexos, Comentarios, Fila, Log, MaisInformacao, Parametros, TABS, type TabId } from './-tabs';

/**
 * A document's detail (D-34): its six FD_GESTAO_SIID tabs and the row buttons (Mostrar
 * Documento, Mostrar Grupo, Clonar for ADM), on the row's own page. `?tab=` picks the open tab, so
 * the list's context menu ("Parâmetros", "Log", …) lands on the right one.
 */
export const Route = createFileRoute('/_app/gestao/documentos/$documentoId')({
  validateSearch: (s: Record<string, unknown>): { tab?: TabId } =>
    TABS.some(([id]) => id === s['tab']) ? { tab: s['tab'] as TabId } : {},
  component: DocumentoScreen,
});

const tabCls =
  '-mb-px border-b-2 border-transparent px-3 py-1.5 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:border-primary data-[state=active]:font-semibold data-[state=active]:text-foreground';

function DocumentoScreen() {
  const { session } = Route.useRouteContext();
  const adm = session.role === 'ADM';
  const { documentoId } = Route.useParams();
  const { tab = 'info' } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const qc = useQueryClient();
  const doc = useRow<DocRow>('/documentos', 'ID', documentoId).data;
  const [clonar, setClonar] = useState<number | null>(null);
  const docId = Number(documentoId);

  const setTab = (t: TabId) => void navigate({ search: { tab: t }, replace: true });
  const mostrarGrupo = (id: number) => void navigate({ to: '/gestao/documentos', search: { grupo: String(id) } });

  return (
    <section aria-label="Detalhe do documento" className="flex flex-col gap-2">
      <Voltar to="/gestao/documentos" />
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-sm font-semibold">
          Documento <span className="font-mono">{documentoId}</span>
          {doc && (
            <span className="font-normal text-muted-foreground">
              {' · '}
              <span className="font-mono">{doc.MODELO_ID}</span>
              {doc.ESTADO ? ` · (${doc.ESTADO})` : ''}
            </span>
          )}
        </h2>
        <Button size="sm" variant="outline" onClick={() => void mostrarDocumento(docId)}>
          Mostrar Documento
        </Button>
        <Button size="sm" variant="outline" onClick={() => mostrarGrupo(docId)}>
          Mostrar Grupo
        </Button>
        {adm && (
          <Button size="sm" variant="outline" onClick={() => setClonar(docId)}>
            Clonar
          </Button>
        )}
      </div>
      <Tabs.Root value={tab} onValueChange={(v) => setTab(v as TabId)} className="flex flex-col">
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

      <ClonarDialog
        docId={clonar}
        onClose={() => setClonar(null)}
        onClonado={(id) => {
          toast.success(`Documento clonado. Novo Spool Id: ${id}.`);
          setClonar(null);
          void qc.invalidateQueries({ queryKey: ['/documentos'] });
        }}
      />
    </section>
  );
}
