import { createFileRoute, Outlet, useChildMatches, useNavigate } from '@tanstack/react-router';
import { dominios, DOMINIOS_DOMINIOS } from '@gestsiid/shared';
import { DataBlock, type ColumnView } from '@/components/datablock/DataBlock';
import type { GridRow } from '@/components/datablock/dirty';

/**
 * Administração › Domínios (Step 4.6): FD_DOMINIOS_SIID, master `CFG_DOMINIOS` + detail
 * `CFG_VALORES_DOMINIO` — the first master-detail production screen. `TIPO_STRING_RF` /
 * `FORMATACAO_STRING_RF` only show for a `STRING` domain; `VALOR_MINIMO`/`VALOR_MAXIMO` only for
 * an interval (`TIPO_DOMINIO_RF='I'`) domain (`ENABLE_STRINGS`/`ENABLE_VALORES`).
 * D-34: the list fills the page; each row opens its values on `dominios.$dominioId.tsx`. The list
 * stays mounted (hidden) under that page, so Voltar finds its filters, sort and page unchanged.
 */
export const Route = createFileRoute('/_app/administracao/dominios')({
  component: DominiosScreen,
});

const tipoInformacao = { source: 'dominio', dominioId: DOMINIOS_DOMINIOS.tipoInformacao } as const;
const tipoDominio = { source: 'dominio', dominioId: DOMINIOS_DOMINIOS.tipoDominio } as const;
const tipoString = { source: 'dominio', dominioId: DOMINIOS_DOMINIOS.tipoString } as const;
const formatacaoString = {
  source: 'dominio',
  dominioId: DOMINIOS_DOMINIOS.formatacaoString,
} as const;
const binario = { source: 'dominio', dominioId: DOMINIOS_DOMINIOS.binario } as const;

const isString = (v: Record<string, string>) => v['TIPO_INFORMACAO_RF'] === 'STRING';
const isIntervalo = (v: Record<string, string>) => v['TIPO_DOMINIO_RF'] === 'I';

// Form's field order (STRUCTURE.md §3.16): Id, Descrição, Tipo Domínio, Sistema?, Tipo
// informação, Tipo/Formatação string (só STRING), Tamanho, Precisão, Mínimo/Máximo (só
// intervalo), Default, Observação.
const masterColumns: ColumnView<GridRow>[] = [
  { col: 'ID', width: 140, mono: true },
  { col: 'DESCRICAO', width: 260 },
  { col: 'TIPO_INFORMACAO_RF', options: tipoInformacao, width: 132 },
  { col: 'TIPO_DOMINIO_RF', options: tipoDominio, width: 140 },
  { col: 'TIPO_STRING_RF', options: tipoString, width: 132, visibleWhen: isString },
  { col: 'FORMATACAO_STRING_RF', options: formatacaoString, width: 152, visibleWhen: isString },
  { col: 'VALOR_MINIMO', width: 112, visibleWhen: isIntervalo },
  { col: 'VALOR_MAXIMO', width: 112, visibleWhen: isIntervalo },
  { col: 'TAMANHO_MAXIMO', width: 96 },
  { col: 'PRECISAO', width: 88 },
  { col: 'VALOR_COMUM', width: 120 },
  { col: 'DOMINIO_SISTEMA_BN', options: binario, width: 96 },
  { col: 'OBSERVACAO', width: 320 },
  { col: 'ESTADO_REGISTO_RF', hidden: true },
  { col: 'DATA_ESTADO', hidden: true },
  { col: 'REGISTADO_POR', hidden: true },
  { col: 'DATA_REGISTO', hidden: true },
  { col: 'ACTUALIZADO_POR', hidden: true },
  { col: 'DATA_ACTUALIZACAO', hidden: true },
];

function DominiosScreen() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const detalhe = useChildMatches().length > 0; // a row's detail page is open (D-34)

  return (
    <>
      <div className={detalhe ? 'hidden' : 'flex min-h-0 flex-1 flex-col'}>
        <DataBlock
          className="min-h-0 flex-1"
          heading="Domínios"
          resource={dominios}
          columns={masterColumns}
          role={session.role}
          edit="panel" // 19 fields with conditional ones: a form, not a grid row
          defaults={() => ({
            TIPO_INFORMACAO_RF: 'STRING',
            TIPO_DOMINIO_RF: 'L',
            TIPO_STRING_RF: 'A',
            FORMATACAO_STRING_RF: 'M',
            DOMINIO_SISTEMA_BN: 'N',
          })}
          rowOpenLabel="Abrir valores do domínio"
          inactive={detalhe}
          onRowOpen={(r) => void navigate({ to: '/administracao/dominios/$dominioId', params: { dominioId: String(r['ID']) } })}
        />
      </div>
      <Outlet />
    </>
  );
}
