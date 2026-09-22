import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { pt } from '@gestsiid/shared';
import { apiFetch, ApiError, setCsrfToken } from '@/api/client';
import { queryClient } from '@/api/query-client';
import { sessionQueryOptions, type Session } from '@/auth/session';
import { useHealth } from '@/api/health';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { data: health } = useHealth();
  const [utilizador, setUtilizador] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!utilizador.trim()) errors.utilizador = pt.utilizadorObrigatorio;
    if (!password) errors.password = pt.passwordObrigatoria;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const { user, csrf } = await apiFetch<{ user: Session; csrf: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ utilizador, password }),
      });
      setCsrfToken(csrf);
      queryClient.setQueryData(sessionQueryOptions.queryKey, user);
      await navigate({ to: '/' });
    } catch (error) {
      // apiFetch skips the automatic toast on 401 (it also covers session-expiry); show it here.
      if (error instanceof ApiError) toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted px-4">
      <form
        onSubmit={(event) => void onSubmit(event)}
        noValidate
        className="flex w-full max-w-[360px] flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-e2"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">GestSIID</h1>
          {health?.ambiente && <span className="text-xs text-muted-foreground">{health.ambiente}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="utilizador" className="text-sm">
            Utilizador
          </label>
          <input
            id="utilizador"
            className="h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={utilizador}
            onChange={(event) => setUtilizador(event.target.value)}
            autoComplete="username"
          />
          {fieldErrors.utilizador && <p className="text-xs text-field-error">{fieldErrors.utilizador}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
          {fieldErrors.password && <p className="text-xs text-field-error">{fieldErrors.password}</p>}
        </div>
        <Button type="submit" disabled={submitting}>
          Entrar
        </Button>
      </form>
    </div>
  );
}
