import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { impressoras, IMPRESSORAS_DOMINIOS } from '@gestsiid/shared';
import { DataBlock, type ColumnView } from '@/components/datablock/DataBlock';
import type { GridRow } from '@/components/datablock/dirty';
import { ImpressoraPicker, type ImpressoraRow } from '@/components/ImpressoraPicker';
import { Button } from '@/components/ui/button';

/** Configuração › Impressoras (Step 4.1 pilot): FD_IMPRESSORAS_SIID over SVR_IMPRESSORAS. */
export const Route = createFileRoute('/_app/configuracao/impressoras')({
  component: ImpressorasScreen,
});

const gsdevice = { source: 'dominio', dominioId: IMPRESSORAS_DOMINIOS.gsdevice } as const;
const valido = { source: 'dominio', dominioId: IMPRESSORAS_DOMINIOS.valido } as const;

// Form's field order (STRUCTURE.md §3.15): Id, Descrição, Endereço, Servidor, Válida, Dispositivo.
const columns: ColumnView<GridRow>[] = [
  { col: 'ID', width: 72 },
  { col: 'DESCRICAO', width: 260 },
  { col: 'ENDERECO', width: 160 },
  { col: 'SERVIDOR', width: 140 },
  { col: 'VALIDO', options: valido, width: 96 },
  { col: 'GSDEVICE_RF', options: gsdevice, header: 'Dispositivo', width: 160 },
  { col: 'CRIADO_POR', hidden: true },
  { col: 'DATA_CRIACAO', hidden: true },
  { col: 'ACTUALIZADO_POR', hidden: true },
  { col: 'DATA_ACTUALIZACAO', hidden: true },
];

function ImpressorasScreen() {
  const { session } = Route.useRouteContext();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">

      <DataBlock
        className="min-h-0 flex-1"
        heading="Impressoras"
        resource={impressoras}
        columns={columns}
        role={session.role}
        edit="inline"
        defaults={() => ({ VALIDO: 'S', GSDEVICE_RF: 'PXLCOLOR' })}
        toolbar={() => (
          <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
            Escolher impressora
          </Button>
        )}
      />

      <ImpressoraPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(row: ImpressoraRow) =>
          toast.success(`Impressora escolhida: ${row.ID} — ${row.DESCRICAO}`)
        }
      />
    </div>
  );
}
