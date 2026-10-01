import { useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, History } from 'lucide-react';
import {
  modelosAtributosArquivo,
  modelosAtributosEdoc,
  modelosParametrosOmissao,
  modelosParametrosReport,
  MODELOS_DOMINIOS,
  type Role,
} from '@gestsiid/shared';
import { apiFetch } from '@/api/client';
import { DataBlock, type ColumnView, type DataBlockHandle } from '@/components/datablock/DataBlock';
import type { GridRow, SaveStep } from '@/components/datablock/dirty';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { dom, modeloPath, type TabProps } from './-common';

/**
 * Tabs "Parâmetros" (`SVR_PARAMETROS_REPORT` + the "Histórico" dialog over
 * `DOC_PARAMETROS_OMISSAO`), "Atributos" and "Atributos Arquivo". Each block asked ASK_COMMIT on
 * leaving a record (POST-RECORD), so each grid asks before its current row changes.
 */

/** The form's read-only check box (S/N). */
const check = (col: string) => (row: GridRow) =>
  row[col] === 'S' ? (
    <>
      <Check className="mx-auto size-4" aria-hidden />
      <span className="sr-only">Sim</span>
    </>
  ) : null;

const binario = dom(MODELOS_DOMINIOS.binario);

export function Parametros({ keys, role, guardRef }: TabProps) {
  const qc = useQueryClient();
  const grid = useRef<DataBlockHandle>(null);
  const [historico, setHistorico] = useState<GridRow | null>(null);
  const endpoint = `${modeloPath(keys)}/parametros-report`;
  const leave = async () => (await grid.current?.confirmLeave()) ?? true;
  useImperativeHandle(guardRef, () => ({ leave }));

  // DETALHES went to DOC_PARAMETROS_OMISSAO: leaving this record first (ASK_COMMIT).
  const abrir = useCallback(async (row: GridRow) => {
    if ((await grid.current?.confirmLeave()) ?? true) setHistorico(row);
  }, []);

  const columns = useMemo<ColumnView<GridRow>[]>(
    () => [
      { col: 'NOME', width: 180, mono: true },
      { col: 'NOME_CONSULTA', width: 180 },
      { col: 'OBRIGATORIO', width: 96, align: 'center', render: check('OBRIGATORIO') },
      { col: 'VALIDO', width: 72, align: 'center', render: check('VALIDO') },
      { col: 'CHECK_UNIQUE', width: 88, align: 'center', render: check('CHECK_UNIQUE') },
      { col: 'CONSULTA_ONLINE', width: 88, options: binario },
      { col: 'VALOR', width: 200 },
      { col: 'DATA_INICIO', width: 120 },
      { col: 'DATA_FIM', width: 112 },
      {
        col: 'DETALHES',
        width: 80,
        align: 'center',
        render: (row) =>
          row['DETALHES'] ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              aria-label="Histórico"
              onClick={(e) => {
                e.stopPropagation();
                void abrir(row);
              }}
            >
              <History />
            </Button>
          ) : null,
      },
    ],
    [abrir],
  );

  // "Guardar" = one PUT …/omissao per changed row: the API versions the value (BR-MOD-09).
  const saveStep = useCallback(
    async (step: SaveStep) => {
      if (step.kind !== 'update') return;
      const v = { ...step.orig, ...step.values };
      await apiFetch(
        `${endpoint}/${step.rid}/omissao`,
        {
          method: 'PUT',
          body: JSON.stringify({
            VALOR: v['VALOR'] ?? null,
            DATA_INICIO: v['DATA_INICIO'] ?? null,
            DATA_FIM: v['DATA_FIM'] ?? null,
            NOME_CONSULTA: v['NOME_CONSULTA'] ?? null,
            CONSULTA_ONLINE: v['CONSULTA_ONLINE'] || 'N',
          }),
        },
        { quiet: true },
      );
    },
    [endpoint],
  );

  return (
    <>
      <p className="text-sm font-medium">Parâmetros por Omissão do Modelo</p>
      <DataBlock
        className="h-[28rem]"
        heading="Parâmetros"
        resource={modelosParametrosReport}
        columns={columns}
        role={role}
        edit="inline"
        canInsert={false}
        canDelete={false}
        endpoint={endpoint}
        master={{ keys }}
        handleRef={grid}
        saveStep={saveStep}
        askOnRowLeave
      />
      {historico && keys && (
        <HistoricoDialog
          path={`${endpoint}/${String(historico['N_PARAMETRO'])}/historico`}
          keys={{ MODELO_ID: keys.MODELO_ID, N_PARAMETRO: Number(historico['N_PARAMETRO']) }}
          nome={String(historico['NOME'] ?? '')}
          role={role}
          onClose={() => {
            setHistorico(null);
            void qc.invalidateQueries({ queryKey: [endpoint] }); // the current value may have changed
          }}
        />
      )}
    </>
  );
}

const historicoColumns: ColumnView<GridRow>[] = [
  { col: 'VALOR', width: 200 },
  { col: 'DATA_INICIO', width: 112 },
  { col: 'DATA_FIM', width: 112 },
  { col: 'NOME_CONSULTA', width: 160 },
  { col: 'CONSULTA_ONLINE', width: 88, options: binario },
  { col: 'CRIADO_POR', width: 112 },
  { col: 'DATA_CRIACAO', width: 112 },
  { col: 'ACTUALIZADO_POR', width: 128 },
  { col: 'DATA_ACTUALIZACAO', width: 136 },
];

/** Dialog "Valor por Omissão": the value's history, edited in place (Novo / Guardar). */
function HistoricoDialog(props: {
  path: string;
  keys: { MODELO_ID: string; N_PARAMETRO: number };
  nome: string;
  role: Role;
  onClose: () => void;
}) {
  const grid = useRef<DataBlockHandle>(null);
  const leave = async () => (await grid.current?.confirmLeave()) ?? true;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) void leave().then((go) => go && props.onClose());
      }}
    >
      <DialogContent className="flex h-[70vh] w-[1040px] flex-col gap-3">
        <DialogTitle>Valor por Omissão</DialogTitle>
        <DialogDescription>Parâmetro {props.nome}</DialogDescription>
        <DataBlock
          className="min-h-0 flex-1"
          heading="Valor por Omissão"
          resource={modelosParametrosOmissao}
          columns={historicoColumns}
          role={props.role}
          edit="inline"
          endpoint={props.path}
          master={{ keys: props.keys }}
          handleRef={grid}
          defaults={() => ({ CONSULTA_ONLINE: 'N' })}
          askOnRowLeave
        />
      </DialogContent>
    </Dialog>
  );
}

/** "Atributos" (eDoc) and "Atributos Arquivo": only Ramo changes, for the whole group (BR-MOD-11). */
export function Atributos({ keys, role, guardRef, arquivo }: TabProps & { arquivo?: boolean }) {
  const grid = useRef<DataBlockHandle>(null);
  const leave = async () => (await grid.current?.confirmLeave()) ?? true;
  useImperativeHandle(guardRef, () => ({ leave }));
  const columns = useMemo<ColumnView<GridRow>[]>(
    () => [
      { col: arquivo ? 'ARQ_ID' : 'EDOC_ID', width: 80 },
      { col: 'MODELO_ID', width: 96, mono: true },
      { col: 'CDUNIECO', width: 64 },
      { col: 'CDRAMO', width: 96, mono: true },
      { col: 'DESCRICAO', width: 200 },
      { col: 'NOME_PARAMETRO', width: 180, mono: true },
      { col: 'ORDEM_PARAMETRO', width: 72 },
      { col: 'VALOR_OMISSAO', width: 140 },
      { col: 'TIPO_PARAMETRO', width: 136 },
      { col: 'DATA_INICIO', width: 112 },
      { col: 'DATA_FIM', width: 112 },
      { col: 'CRIADO_POR', width: 112 },
      { col: 'DATA_CRIACAO', width: 112 },
    ],
    [arquivo],
  );
  return (
    <DataBlock
      className="h-[28rem]"
      heading={arquivo ? 'Atributos Arquivo' : 'Atributos'}
      resource={arquivo ? modelosAtributosArquivo : modelosAtributosEdoc}
      columns={columns}
      role={role}
      edit="inline"
      canInsert={false}
      canDelete={false}
      endpoint={`${modeloPath(keys)}/${arquivo ? 'atributos-arquivo' : 'atributos-edoc'}`}
      master={{ keys }}
      handleRef={grid}
      askOnRowLeave
    />
  );
}
