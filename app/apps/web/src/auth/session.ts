import { queryOptions, useQuery } from '@tanstack/react-query';
import type { Role } from '@gestsiid/shared';
import { apiFetch, setCsrfToken } from '@/api/client';

export type Session = { username: string; nome: string; role: Role; ambiente: string };

/** `staleTime: Infinity` — a stale session is only ever discovered by a 401 (UI_SPEC §2.1). */
export const sessionQueryOptions = queryOptions({
  queryKey: ['auth', 'me'] as const,
  queryFn: async () => {
    const { user, csrf } = await apiFetch<{ user: Session; csrf: string }>('/auth/me');
    setCsrfToken(csrf);
    return user;
  },
  staleTime: Infinity,
  retry: false,
});

export function useSession() {
  return useQuery(sessionQueryOptions);
}
