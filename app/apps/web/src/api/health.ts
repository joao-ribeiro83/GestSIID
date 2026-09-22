import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';

export type Health = { ok: boolean; ambiente: string; db: { ok: boolean; latencyMs?: number } };

/** §2.1: `staleTime: Infinity`, no retry — the badge only ever refreshes on a fresh mount. */
export function useHealth() {
  return useQuery({
    queryKey: ['health'] as const,
    queryFn: () => apiFetch<Health>('/health'),
    staleTime: Infinity,
    retry: false,
  });
}
