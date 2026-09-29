import { toast } from 'sonner';
import { pt } from '@gestsiid/shared';
import { queryClient } from '@/api/query-client';

/** ARCHITECTURE.md §8: every non-2xx response body has this shape. */
export type ApiErrorBody = {
  code: string;
  message: string;
  requestId: string;
  fields?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  requestId?: string;

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.message ?? 'Erro');
    this.status = status;
    this.code = body?.code ?? 'ERRO';
    this.fields = body?.fields;
    this.requestId = body?.requestId;
  }
}

// Set once by main.tsx after the router exists (this module must not import it — main.tsx →
// router.ts → routeTree.gen.ts statically imports every route, which would cycle back here).
let onSessionExpired: (() => void) | null = null;

/** UI-27 (simplified, D-08 has no dirty-DataBlock reauth modal yet): wires the redirect to /login. */
export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

let csrfToken: string | null = null;

/** Set from the `/api/auth/me` and `/api/auth/login` responses (ARCHITECTURE.md §5). */
export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

const apiBase = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`;

/** Absolute-path URL of an API path, for `<img src>` and the like (fetch calls use `apiFetch`). */
export const apiUrl = (path: string): string => `${apiBase}${path}`;

/**
 * `credentials: 'same-origin'` sends the session cookie; every non-GET request carries the CSRF
 * token. Error bodies are toasted here except 401 (handled by route guards / re-login, UI-27) and
 * `quiet` calls, whose caller shows the error itself (a DataBlock row error, §3.8).
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  opts: { quiet?: boolean } = {},
): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  if (method !== 'GET' && csrfToken) headers.set('x-csrf-token', csrfToken);
  if (typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    method,
    headers,
    credentials: 'same-origin',
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new ApiError(res.status, body as ApiErrorBody | null);
    // /auth/login's 401 is a login failure, shown inline by the login form; /auth/me's 401 is
    // the normal "not logged in yet" case, handled quietly by the router's beforeLoad guard.
    // Every other 401 is a session that expired mid-use (UI-27).
    if (res.status === 401 && path !== '/auth/login' && path !== '/auth/me') {
      toast.error(pt.sessaoExpirada);
      queryClient.clear();
      onSessionExpired?.();
    } else if (res.status !== 401 && !opts.quiet) {
      toast.error(error.message);
    }
    throw error;
  }

  return body as T;
}
