import { useCallback, useMemo, useRef } from 'react';
import type { DataBlockHandle } from './DataBlock';
import type { GridRow } from './dirty';

/**
 * Master-detail wiring (UI_SPEC §3.11). Give it the master's current row and how the detail's
 * parent keys map to master columns; spread `detailProps` on the detail DataBlock and pass
 * `beforeMasterRowChange` to the master's `beforeCurrentRowChange`, so moving the master while
 * the detail is dirty asks #46 first.
 *
 *   const detail = useDetailBlock(currentPrinter, { IMPRESSORA_ID: 'ID' });
 *   <DataBlock … onCurrentRowChange={setCurrentPrinter} beforeCurrentRowChange={detail.beforeMasterRowChange} />
 *   <DataBlock … {...detail.detailProps} endpoint={`/impressoras/${detail.keys?.IMPRESSORA_ID}/tabuleiros`} />
 */
export function useDetailBlock(masterRow: GridRow | null, keyMap: Record<string, string>) {
  const handleRef = useRef<DataBlockHandle>(null);
  const isNewMaster = !!masterRow?._rid.startsWith('tmp:');

  const signature =
    masterRow && !isNewMaster
      ? JSON.stringify(Object.values(keyMap).map((c) => masterRow[c]))
      : null;
  const keys = useMemo(() => {
    if (!masterRow || isNewMaster) return null;
    return Object.fromEntries(
      Object.entries(keyMap).map(([k, c]) => [k, masterRow[c] as string | number]),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the key values, not the row object
  }, [signature]);

  const beforeMasterRowChange = useCallback(
    async () => (await handleRef.current?.confirmLeave()) ?? true,
    [],
  );

  return {
    keys,
    beforeMasterRowChange,
    detailProps: { master: { keys, newMaster: isNewMaster }, handleRef },
  };
}
