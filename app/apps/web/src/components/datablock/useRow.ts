import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import type { GridRow } from './dirty';

/**
 * One row of a list endpoint by its key (`?f[COL]=value&size=1`), for a detail page's header
 * (D-34). Keyed under the endpoint, so invalidating the list (`['/modelos']`) refreshes it too.
 */
export function useRow<Row extends GridRow = GridRow>(endpoint: string, col: string, value: string) {
  return useQuery({
    queryKey: [endpoint, 'row', col, value],
    queryFn: async () => {
      // Quiet: a mistyped key (400) is shown by the page as "Registo não encontrado.", not a toast.
      const r = await apiFetch<{ rows: Row[] }>(
        `${endpoint}?f[${col}]=${encodeURIComponent(value)}&size=1`,
        undefined,
        { quiet: true },
      );
      return r.rows[0] ?? null;
    },
  });
}
