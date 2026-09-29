import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { pt } from '@gestsiid/shared';
import { apiFetch, ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const Route = createFileRoute('/_app/configuracao/alterar-password')({
  component: AlterarPasswordDialog,
});

// D-07d: changes the shared document-regeneration password (Step 3.1's
// POST /auth/regeneracao-password), not the current user's own login password.
function AlterarPasswordDialog() {
  const navigate = useNavigate();
  const [actual, setActual] = useState('');
  const [nova, setNova] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function close() {
    void navigate({ to: '/' });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setSubmitting(true);
    try {
      await apiFetch(
        '/auth/regeneracao-password',
        { method: 'POST', body: JSON.stringify({ actual, nova, confirmacao }) },
        { quiet: true },
      );
      toast.success(pt.db.guardado);
      close();
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      // UI_SPEC catalogue #15: wrong current value lands on "Password actual".
      if (error.code === 'PASSWORD_ERRADA') setFieldErrors({ actual: error.message });
      else if (error.fields) setFieldErrors(error.fields); // #6: mismatch lands on "Confirmação".
      else toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alteração da Password de Regeração</DialogTitle>
        </DialogHeader>
        <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
          <PasswordField
            label="Password actual"
            id="actual"
            value={actual}
            onChange={setActual}
            error={fieldErrors.actual}
          />
          <PasswordField label="Password" id="nova" value={nova} onChange={setNova} error={fieldErrors.nova} />
          <PasswordField
            label="Confirmação"
            id="confirmacao"
            value={confirmacao}
            onChange={setConfirmacao}
            error={fieldErrors.confirmacao}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              {pt.cancelar}
            </Button>
            <Button type="submit" disabled={submitting}>
              {pt.db.guardar}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PasswordField({
  label,
  id,
  value,
  onChange,
  error,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      <input
        id={id}
        type="password"
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        aria-invalid={error ? true : undefined}
      />
      {error && <p className="text-xs text-field-error">{error}</p>}
    </div>
  );
}
