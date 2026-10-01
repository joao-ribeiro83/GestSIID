import { useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { dominiosValores } from '@gestsiid/shared';
import { DataBlock, type ColumnView } from '@/components/datablock/DataBlock';
import type { GridRow } from '@/components/datablock/dirty';
import { useRow } from '@/components/datablock/useRow';
import { Voltar } from '@/components/shell/page-actions';

/** A domain's values (D-34): the `CFG_VALORES_DOMINIO` detail of Administração › Domínios. */
export const Route = createFileRoute('/_app/administracao/dominios/$dominioId')({
  component: ValoresScreen,
});

// Tab "Lista" (STRUCTURE.md §3.16): Chave, Designação, Descrição, Data Início/Fim, Ordem.
const detailColumns: ColumnView<GridRow>[] = [
  { col: 'CHAVE', width: 120, mono: true },
  { col: 'DESIGNACAO', width: 200 },
  { col: 'DESCRICAO', width: 260 },
  { col: 'DATA_INICIO', width: 112 },
  { col: 'DATA_FIM', width: 112 },
  { col: 'PRIORIDADE', width: 88 },
  { col: 'DOMINIO_ID', hidden: true },
  { col: 'REGISTADO_POR', hidden: true },
  { col: 'DATA_REGISTO', hidden: true },
  { col: 'ACTUALIZADO_POR', hidden: true },
  { col: 'DATA_ACTUALIZACAO', hidden: true },
];

const today = () => `${new Date().toISOString().slice(0, 10)}T00:00:00`;

function ValoresScreen() {
  const { session } = Route.useRouteContext();
  const { dominioId } = Route.useParams();
  const dominio = useRow('/dominios', 'ID', dominioId).data;
  const master = useMemo(() => ({ keys: { DOMINIO_ID: dominioId } }), [dominioId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <Voltar to="/administracao/dominios" />
      <h2 className="text-sm font-semibold">
        Domínio <span className="font-mono">{dominioId}</span>
        {dominio && <span className="font-normal text-muted-foreground"> · {String(dominio['DESCRICAO'] ?? '')}</span>}
      </h2>
      <DataBlock
        className="min-h-0 flex-1"
        heading="Valores do domínio"
        resource={dominiosValores}
        columns={detailColumns}
        role={session.role}
        edit="inline"
        master={master}
        endpoint={`/dominios/${encodeURIComponent(dominioId)}/lista`}
        defaults={() => ({ DATA_INICIO: today(), PRIORIDADE: 0 })}
      />
    </div>
  );
}
