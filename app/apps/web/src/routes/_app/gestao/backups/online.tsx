import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { backups, pt } from '@gestsiid/shared';
import { apiFetch } from '@/api/client';
import { DataBlock, type Selection } from '@/components/datablock/DataBlock';
import { Button } from '@/components/ui/button';

/**
 * Gestão › Backups › Backups Online (UI_SPEC §4.6, Step 8.2): `FD_BACKUPS_ONLINE`.
 * Two read-only lists over `backups` (`MEDIA_ONLINE` N / S) with multi-selection; the buttons move
 * the ticked backups from one list to the other (`POST /api/backups/online`).
 */
export const Route = createFileRoute('/_app/gestao/backups/online')({
  component: BackupsOnlineScreen,
});

const ids = (s: Selection) => (s.mode === 'ids' ? s.ids.map(Number) : []);

function BackupsOnlineScreen() {
  const qc = useQueryClient();
  const [offline, setOffline] = useState<Selection>({ mode: 'none' });
  const [online, setOnline] = useState<Selection>({ mode: 'none' });

  const refetch = () => void qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith('/backups') });

  const mover = async (sel: Selection, vaiOnline: boolean) => {
    const escolhidos = ids(sel);
    if (escolhidos.length === 0) return void toast.warning(pt.backups.semSeleccao);
    await apiFetch('/backups/online', { method: 'POST', body: JSON.stringify({ ids: escolhidos, online: vaiOnline }) });
    toast.success(pt.backups.actualizados);
    refetch();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={refetch}>
          <RefreshCw /> {pt.db.actualizar}
        </Button>
      </div>

      <DataBlock
        className="h-64 shrink-0"
        heading="Offline"
        resource={backups}
        endpoint="/backups?f[MEDIA_ONLINE]=N"
        selection="multi"
        emptyText="Não existem registos."
        onSelectionChange={setOffline}
        columns={[
          { col: 'NOME', header: 'Nome', width: 200, mono: true },
          { col: 'MES_BACKUP', header: 'Mês', width: 104 },
          { col: 'TIPO_MIDIA_ID', header: 'Mídia', width: 112 },
          { col: 'TAMANHO_BACKUP', header: 'MB', width: 112, align: 'end' },
        ]}
      />

      <div className="flex justify-center gap-2">
        <Button size="sm" onClick={() => void mover(offline, true)}>
          <ArrowDown /> {pt.backups.colocarOnline}
        </Button>
        <Button size="sm" variant="outline" onClick={() => void mover(online, false)}>
          <ArrowUp /> {pt.backups.colocarOffline}
        </Button>
      </div>

      <DataBlock
        className="h-64 shrink-0"
        heading="Online"
        resource={backups}
        endpoint="/backups?f[MEDIA_ONLINE]=S"
        selection="multi"
        emptyText="Não existem registos."
        onSelectionChange={setOnline}
        columns={[
          { col: 'NOME', header: 'Nome', width: 200, mono: true },
          { col: 'MES_BACKUP', header: 'Mês', width: 104 },
          { col: 'TIPO_MIDIA_ID', header: 'Mídia', width: 112 },
          { col: 'DRIVE_ONLINE', header: 'Drive', width: 96 },
        ]}
      />
    </div>
  );
}
