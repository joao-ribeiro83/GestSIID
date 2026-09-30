import { useState, type ComponentProps, type FormEvent, type ReactNode } from 'react';
import { pt } from '@gestsiid/shared';
import { useDominio } from '@/components/datablock/CellEditor';
import { dmyToIso, isoToDmy } from '@/components/datablock/qbe';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/** Fields of a named-action dialog (a form's dialog canvas): label left, value right. */

export const inputCls =
  'h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';

export const dmy = (iso: string | null | undefined) => (iso ? isoToDmy(iso) : '');
export const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Erro'); // ApiError, or a thrown check

/** DD-MM-AAAA text → ISO datetime; '' → null; unreadable → false. */
export function dataIso(text: string): string | null | false {
  if (text.trim() === '') return null;
  const iso = dmyToIso(text);
  return iso ? `${iso}T00:00:00` : false;
}

/** Dialog body as a form: Enter submits, the server's rule message shows as a form alert. */
export function DialogForm({
  title,
  onCancel,
  submit,
  canSubmit = true,
  children,
}: {
  title: string;
  onCancel: () => void;
  submit: () => Promise<void>;
  canSubmit?: boolean;
  children: ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await submit();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      {error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-status-danger-bg px-3 py-2 text-sm text-danger-text">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3">{children}</div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {pt.cancelar}
        </Button>
        <Button type="submit" disabled={!canSubmit || saving}>
          {pt.ok}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] items-center gap-2 text-sm">
      <span>{label}</span>
      <output aria-label={label} className="flex h-8 items-center rounded-md bg-muted px-2">
        {value}
      </output>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  ...input
}: { label: string; value: string; onChange: (v: string) => void } & Omit<
  ComponentProps<'input'>,
  'value' | 'onChange'
>) {
  return (
    <label className="grid grid-cols-[8rem_1fr] items-center gap-2 text-sm">
      {label}
      <input {...input} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </label>
  );
}

export function DateField(props: { label: string; value: string; onChange: (v: string) => void }) {
  return <TextField {...props} placeholder="DD-MM-AAAA" />;
}

export function SelectField({
  label,
  ...select
}: { label: string } & ComponentProps<typeof DominioSelect>) {
  return (
    <label className="grid grid-cols-[8rem_1fr] items-center gap-2 text-sm">
      {label}
      <DominioSelect {...select} />
    </label>
  );
}

/** A CFG_VALORES_DOMINIO list: shows DESIGNACAO, keeps CHAVE; blank first (nothing chosen). */
export function DominioSelect({
  dominioId,
  value,
  onChange,
  className = inputCls,
  ...select
}: {
  dominioId: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
} & Omit<ComponentProps<'select'>, 'value' | 'onChange'>) {
  const opcoes = useDominio(dominioId);
  return (
    <select {...select} value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="" />
      {opcoes.data?.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
