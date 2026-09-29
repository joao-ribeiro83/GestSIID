import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { perfisDepartamento, PERFIS_DOMINIOS } from '@gestsiid/shared';
import { apiFetch } from '@/api/client';
import { DataBlock, type ColumnView } from '@/components/datablock/DataBlock';
import type { GridRow } from '@/components/datablock/dirty';
import type { PanelFieldCtx } from '@/components/datablock/PanelForm';
import { EmpregadoPicker, type EmpregadoRow } from '@/components/EmpregadoPicker';
import { ImageUpload } from '@/components/ImageUpload';
import { Button } from '@/components/ui/button';

/**
 * Gador › Equipa de Gestão (OD68) (Step 5.5): FD_PERFIS_DEPARTAMENTO, `DOC_PERFIS_DEPARTAMENTO` as
 * one block edited in the side panel. The employee comes from the EMPREGADOS LOV; choosing one on a
 * profile without a code fills CODIGO, FUNCAODEP_ID and NOME (BR-ADM-04, the CODIGO
 * WHEN-NEW-ITEM-INSTANCE), never over what is already typed. No delete (Forms deletes only unsaved
 * rows). The signature (BLOB) is previewed, uploaded and removed in the panel once the row exists.
 */
export const Route = createFileRoute('/_app/gador/equipa-gestao')({
  component: EquipaGestaoScreen,
});

const funcoes = { source: 'dominio', dominioId: PERFIS_DOMINIOS.funcoes } as const;

interface Sugestao {
  CODIGO: string | null;
  FUNCAODEP_ID: string | null;
  NOME: string | null;
}

/** CDEMPLEA: typed values are refused by the LOV, so the input is read-only and a button opens it. */
function EmpregadoField({ form, id, className, isNew }: PanelFieldCtx) {
  const [open, setOpen] = useState(false);
  const fill = (name: string, value: string | null) => {
    if (value && !form.getValues(name)) form.setValue(name, value, { shouldDirty: true });
  };
  const choose = async (emp: EmpregadoRow) => {
    form.setValue('CDEMPLEA', emp.CDEMPLEA, { shouldDirty: true, shouldValidate: true });
    // CDDEPARTA cannot change once saved (UpdateAllowed=false), so only a new row takes it.
    if (isNew && emp.CDDEPARTA)
      form.setValue('CDDEPARTA', emp.CDDEPARTA, { shouldDirty: true, shouldValidate: true });
    if (form.getValues('CODIGO')) return;
    const s = await apiFetch<Sugestao>(
      `/perfis-departamento/sugestao?cdemplea=${encodeURIComponent(emp.CDEMPLEA)}`,
      {},
      { quiet: true },
    ).catch(() => null);
    if (!s?.CODIGO) return;
    fill('CODIGO', s.CODIGO);
    fill('FUNCAODEP_ID', s.FUNCAODEP_ID);
    fill('NOME', s.NOME);
  };
  return (
    <div className="flex gap-2">
      <input id={id} readOnly className={className} {...form.register('CDEMPLEA')} />
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Escolher empregado
      </Button>
      <EmpregadoPicker open={open} onOpenChange={setOpen} onSelect={(e) => void choose(e)} />
    </div>
  );
}

/** CDDEPARTA arrives with the employee; read-only. */
const DepartamentoField = ({ form, id, className }: PanelFieldCtx) => (
  <input id={id} readOnly className={className} {...form.register('CDDEPARTA')} />
);

// Form order (FD_PERFIS_DEPARTAMENTO canvas): empregado, departamento, datas, código, perfil, nome,
// email, telefone, fax, telemóvel.
const columns: ColumnView<GridRow>[] = [
  { col: 'CDEMPLEA', width: 120, mono: true, renderField: (c) => <EmpregadoField {...c} /> },
  { col: 'CDDEPARTA', width: 110, mono: true, renderField: (c) => <DepartamentoField {...c} /> },
  { col: 'DATA_INICIO', width: 112 },
  { col: 'DATA_FIM', width: 112 },
  { col: 'CODIGO', width: 100, mono: true },
  { col: 'FUNCAODEP_ID', options: funcoes, width: 160 },
  { col: 'NOME', width: 200 },
  { col: 'DESCRICAO', width: 220 },
  { col: 'EMAIL', width: 220 },
  { col: 'TELEFONE', width: 120 },
  { col: 'TELEMOVEL', width: 120 },
  { col: 'FAX', width: 120 },
  { col: 'ID', hidden: true },
  { col: 'CRIADO_POR', hidden: true },
  { col: 'DATA_CRIACAO', hidden: true },
  { col: 'ACTUALIZADO_POR', hidden: true },
  { col: 'DATA_ACTUALIZACAO', hidden: true },
];

function EquipaGestaoScreen() {
  const { session } = Route.useRouteContext();
  return (
    <main id="conteudo" className="flex h-dvh flex-col gap-3 bg-background p-4 text-foreground">
      <header>
        <h1 className="text-lg font-semibold">Equipa de Gestão (OD68)</h1>
      </header>
      <DataBlock
        className="min-h-0 flex-1"
        heading="Equipa de Gestão"
        resource={perfisDepartamento}
        columns={columns}
        role={session.role}
        edit="panel"
        canDelete={false}
        panelExtra={(row) =>
          row ? (
            <ImageUpload
              key={String(row['ID'])}
              path={`/perfis-departamento/${String(row['ID'])}/assinatura`}
              title="Assinatura"
              emptyText="Sem assinatura"
              inputLabel="Ficheiro da assinatura"
              removeLabel="Remover assinatura"
            />
          ) : (
            <p className="border-t border-border pt-3 text-sm text-muted-foreground">
              Grave o registo para anexar a assinatura.
            </p>
          )
        }
      />
    </main>
  );
}
