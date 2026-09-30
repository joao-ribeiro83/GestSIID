import { useImperativeHandle, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { modelosCondicoes, modelosSeccoes, MODELOS_DOMINIOS, pt } from '@gestsiid/shared';
import { apiFetch } from '@/api/client';
import { DataBlock, type ColumnView, type DataBlockHandle } from '@/components/datablock/DataBlock';
import type { GridRow } from '@/components/datablock/dirty';
import { useDetailBlock } from '@/components/datablock/useDetailBlock';
import { ImageUpload } from '@/components/ImageUpload';
import { useConfirm } from '@/components/shell/confirm-dialog-provider';
import { Button } from '@/components/ui/button';
import { askAll, dom, enc, modeloPath, type TabProps } from './-common';

/**
 * Tab "Secções": `DOC_SECCOES_DOCUMENTO` of the current model, the section image pane
 * ("Assinatura", the form's BT_SELECT / BT_CLIENT_DB over WebUtil, now the Step 6.2 image routes)
 * and, below, `DOC_CONDICOES_APR` of the current section. The form asked ASK_COMMIT on leaving a
 * section record (POST-RECORD) but not on leaving a condition, so only the section grid asks on a
 * row change — conditions first, then sections.
 */

// CONSULTA_SECCOES buttons (Id Secção, Alínea), then the SECCOES canvas order.
const seccaoColumns: ColumnView<GridRow>[] = [
  { col: 'TIPOSEC_ID', width: 112, mono: true },
  { col: 'ALINEA', width: 88 },
  { col: 'TIPOCNTD_ID', options: dom(MODELOS_DOMINIOS.tiposConteudo), header: 'Tipo conteúdo', align: 'start', width: 140 },
  { col: 'TITULO', width: 200 },
  { col: 'TEXTO', width: 360 },
];

const condicaoColumns: ColumnView<GridRow>[] = [
  { col: 'CONTEXTO_ID', options: dom(MODELOS_DOMINIOS.contextosApr), align: 'start', width: 150 },
  { col: 'DATA_INICIO', width: 112 },
  { col: 'DATA_FIM', width: 112 },
  { col: 'CDUNIECO', width: 72 },
  { col: 'CDRAMO', width: 96, mono: true },
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ col: `ATRIBUTO${n}`, width: 120 })),
];

/** The value a new row takes from a select feed (D-28: the form's PRE-INSERT MAX, or null). */
function usePreSelected(lista: string, chave?: { MODELO_ID: string; TIPOSEC_ID: string }) {
  const qs = chave ? `?MODELO_ID=${enc(chave.MODELO_ID)}&TIPOSEC_ID=${enc(chave.TIPOSEC_ID)}` : '';
  return useQuery({
    queryKey: ['dominio', lista, qs],
    queryFn: () => apiFetch<{ preSelected?: number | null }>(`/dominios/${lista}/valores${qs}`),
    select: (d) => d.preSelected ?? null,
  }).data;
}

const isNew = (row: GridRow | null) => !!row?._rid.startsWith('tmp:');

export function Seccoes({ keys, role, guardRef }: TabProps) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const seccoes = useRef<DataBlockHandle>(null);
  const [seccao, setSeccao] = useState<GridRow | null>(null);
  const condicoes = useDetailBlock(seccao, {
    MODELO_ID: 'MODELO_ID',
    TIPOSEC_ID: 'TIPOSEC_ID',
    ALINEA: 'ALINEA',
  });
  const endpoint = `${modeloPath(keys)}/seccoes`;
  const c = condicoes.keys;
  const seccaoPath = c ? `${endpoint}/${enc(c['TIPOSEC_ID'])}/${enc(c['ALINEA'])}` : '';

  const leave = () =>
    askAll(condicoes.beforeMasterRowChange, async () => (await seccoes.current?.confirmLeave()) ?? true);
  useImperativeHandle(guardRef, () => ({ leave }));

  const tipoConteudo = usePreSelected(MODELOS_DOMINIOS.tiposConteudo);
  const contexto = usePreSelected(
    MODELOS_DOMINIOS.contextosApr,
    c ? { MODELO_ID: String(c['MODELO_ID']), TIPOSEC_ID: String(c['TIPOSEC_ID']) } : undefined,
  );
  const refresh = () => void qc.invalidateQueries({ queryKey: [endpoint] });

  // Popup SECCAO › Clonar (BR-MOD-05): a copy of the section with the next ALINEA.
  const clonar = async () => {
    if (!seccaoPath || !(await leave())) return;
    const ok = await confirm({
      title: 'Clonar',
      description: 'Esta operação é irreversível. Quer criar uma nova alinea à semelhança da existente?',
      kind: 'sim-nao',
    });
    if (ok !== true) return;
    try {
      await apiFetch(`${seccaoPath}/acoes/clonar`, { method: 'POST' });
      toast.success(pt.db.guardado);
      refresh();
    } catch {
      // apiFetch showed the server's message
    }
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_320px] grid-rows-[18rem_16rem] gap-3">
      <DataBlock
        className="min-h-0"
        heading="Secções"
        resource={modelosSeccoes}
        columns={seccaoColumns}
        role={role}
        edit="inline"
        endpoint={endpoint}
        master={{ keys }}
        handleRef={seccoes}
        defaults={() => (tipoConteudo != null ? { TIPOCNTD_ID: tipoConteudo } : {})}
        onCurrentRowChange={setSeccao}
        askOnRowLeave
        beforeCurrentRowChange={condicoes.beforeMasterRowChange}
        toolbar={() => (
          <Button size="sm" variant="outline" disabled={!seccaoPath} onClick={() => void clonar()}>
            Clonar
          </Button>
        )}
      />

      <div className="row-span-2 min-h-0 overflow-auto rounded-lg border border-border bg-card px-3 pb-3">
        {seccaoPath ? (
          <ImageUpload
            key={seccaoPath}
            path={`${seccaoPath}/imagem`}
            title="Assinatura"
            emptyText="Sem imagem"
            inputLabel="Abrir Ficheiro ..."
            saveLabel="Guardar imagem na BD"
            removeLabel="Limpar"
            confirmRemove="Remover a imagem desta alínea?"
            caption={seccao?.['TIPO_IMAGEM'] ? `Tipo ${String(seccao['TIPO_IMAGEM'])}` : undefined}
            onChange={refresh}
          />
        ) : (
          <p className="pt-3 text-sm text-muted-foreground">
            {isNew(seccao) ? 'Grave a secção para anexar a imagem.' : pt.db.seleccioneRegisto}
          </p>
        )}
      </div>

      <DataBlock
        className="min-h-0"
        heading="Condições"
        resource={modelosCondicoes}
        columns={condicaoColumns}
        role={role}
        edit="inline"
        endpoint={`${seccaoPath}/condicoes`}
        defaults={() => (contexto != null ? { CONTEXTO_ID: contexto } : {})}
        toolbar={() =>
          c && (
            <span className="text-sm font-medium">
              Condições da alínea{' '}
              <span className="font-mono">
                {String(c['TIPOSEC_ID'])}.{String(c['ALINEA'])}
              </span>
            </span>
          )
        }
        {...condicoes.detailProps}
      />
    </div>
  );
}
