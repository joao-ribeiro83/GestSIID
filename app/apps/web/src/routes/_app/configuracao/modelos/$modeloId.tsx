import { useMemo, useRef, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Tabs } from 'radix-ui';
import { DetailPage, tabCls } from '@/components/datablock/DetailPage';
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

const panelCls = 'flex flex-col gap-2 pt-3';

function ModeloScreen() {
  const { session } = Route.useRouteContext();
  const { modeloId } = Route.useParams();
  const tabGuard = useRef<TabGuard>(null);
  const [tab, setTab] = useState<string>('seccoes');
  const keys = useMemo(() => ({ MODELO_ID: modeloId }), [modeloId]);
  const tabProps = { keys, role: session.role, guardRef: tabGuard };

  const changeTab = async (next: string) => {
    if ((await tabGuard.current?.leave()) ?? true) setTab(next);
  };

  return (
    <DetailPage
      list="/configuracao/modelos"
      endpoint="/modelos"
      id={modeloId}
      label="Modelo"
      describe={(m) => String(m['DESCRICAO'] ?? '')}
    >
      {() => (
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
      )}
    </DetailPage>
  );
}
