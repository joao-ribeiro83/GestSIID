import { toast } from 'sonner';

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

let csrfToken: string | null = null;

/** Set from the `/api/auth/me` and `/api/auth/login` responses (ARCHITECTURE.md §5). */
export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

const apiBase = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`;

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
    if (res.status !== 401 && !opts.quiet) toast.error(error.message);
    throw error;
  }

  return body as T;
}
