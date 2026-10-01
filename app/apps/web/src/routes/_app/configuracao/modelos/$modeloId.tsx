import { useMemo, useRef, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Tabs } from 'radix-ui';
import { useRow } from '@/components/datablock/useRow';
import { Voltar } from '@/components/shell/page-actions';
import type { TabGuard } from './-common';
import { Seccoes } from './-seccoes';
import { Atributos, Parametros } from './-tabs';

/**
 * A model's detail (D-34): the four FD_CONFIGURACAO_MODELOS detail canvases as tabs, on the row's
 * own page. ASK_COMMIT (#46): each tab's grids ask before their current row changes, a tab asks
 * before another tab opens, and leaving the page asks through each DataBlock's route blocker.
 */
export const Route = createFileRoute('/_app/configuracao/modelos/$modeloId')({
  component: ModeloScreen,
});

const TABS = [
  ['seccoes', 'Secções'],
  ['parametros', 'Parâmetros'],
  ['atributos', 'Atributos'],
  ['atributos-arquivo', 'Atributos Arquivo'],
] as const;

const tabCls =
  '-mb-px border-b-2 border-transparent px-3 py-1.5 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:border-primary data-[state=active]:font-semibold data-[state=active]:text-foreground';
const panelCls = 'flex flex-col gap-2 pt-3';

function ModeloScreen() {
  const { session } = Route.useRouteContext();
  const { modeloId } = Route.useParams();
  const modelo = useRow('/modelos', 'ID', modeloId).data;
  const tabGuard = useRef<TabGuard>(null);
  const [tab, setTab] = useState<string>('seccoes');
  const keys = useMemo(() => ({ MODELO_ID: modeloId }), [modeloId]);
  const tabProps = { keys, role: session.role, guardRef: tabGuard };

  const changeTab = async (next: string) => {
    if ((await tabGuard.current?.leave()) ?? true) setTab(next);
  };

  return (
    <section aria-label="Detalhe do modelo" className="flex flex-col">
      <Voltar to="/configuracao/modelos" />
      <h2 className="text-sm font-semibold">
        Modelo <span className="font-mono">{modeloId}</span>
        {modelo && <span className="font-normal text-muted-foreground"> · {String(modelo['DESCRICAO'] ?? '')}</span>}
      </h2>
      <Tabs.Root value={tab} onValueChange={(v) => void changeTab(v)} activationMode="manual" className="flex flex-col">
        <Tabs.List aria-label="Detalhe do modelo" className="flex gap-1 border-b border-border">
          {TABS.map(([value, label]) => (
            <Tabs.Trigger key={value} value={value} className={tabCls}>
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {/* Only the open tab is mounted: leaving it asked #46 first, so nothing unsaved is lost. */}
        <Tabs.Content value="seccoes" className={panelCls}>
          <Seccoes {...tabProps} />
        </Tabs.Content>
        <Tabs.Content value="parametros" className={panelCls}>
          <Parametros {...tabProps} />
        </Tabs.Content>
        <Tabs.Content value="atributos" className={panelCls}>
          <Atributos {...tabProps} />
        </Tabs.Content>
        <Tabs.Content value="atributos-arquivo" className={panelCls}>
          <Atributos {...tabProps} arquivo />
        </Tabs.Content>
      </Tabs.Root>
    </section>
  );
}
