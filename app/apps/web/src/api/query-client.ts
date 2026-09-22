import { QueryClient } from '@tanstack/react-query';

/** ARCHITECTURE.md §7: no polling; a 30s staleTime plus refetch-on-focus is the whole refresh story. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
