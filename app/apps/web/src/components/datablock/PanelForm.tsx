import { useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pt, valuesSchema, type Resource } from '@gestsiid/shared';
import { ApiError, apiFetch } from '@/api/client';
import { useConfirm } from '@/components/shell/confirm-dialog-provider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useDominio } from './CellEditor';
import type { ColumnView } from './DataBlock';
import type { GridRow } from './dirty';
import { formatCell, fromInput, toInput } from './format';

type FormValues = Record<string, string>;

interface Props {
  resource: Resource;
  columns: ColumnView<never>[];
  endpoint: string;
  /** null = new row. */
  row: GridRow | null;
  title: string;
  onClose: () => void;
}

/** Panel editing (§3.9): one request on Guardar, toast `Guardado.`, #46 when closing a dirty form. */
export function PanelForm({ resource, columns, endpoint, row, title, onClose }: Props) {
  const isNew = row === null;
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const editable = (col: string) => {
    const def = resource.columns[col];
    return !!def && (isNew ? !!(def.edit || def.insertOnly) : !!def.edit && !def.insertOnly);
  };
  const fields = columns.filter((c) => !c.hidden && (editable(c.col) || !isNew));

  // The resource's own values schema, fed from the text inputs (dates DD-MM-AAAA, numbers with , or .).
  const schema = useMemo(
    () => valuesSchema(resource, isNew ? 'insert' : 'update', fromInput),
    [resource, isNew],
  );
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: Object.fromEntries(
      fields
        .filter((c) => editable(c.col))
        .map((c) => [c.col, toInput(resource.columns[c.col]!, row?.[c.col])]),
    ),
  });
  const { errors, isSubmitting, dirtyFields } = form.formState;

  const submit = form.handleSubmit(async (parsed) => {
    const values = isNew
      ? parsed
      : Object.fromEntries(Object.entries(parsed).filter(([col]) => col in dirtyFields));
    try {
      if (isNew) {
        await apiFetch(
          endpoint,
          { method: 'POST', body: JSON.stringify({ values }) },
          { quiet: true },
        );
      } else {
        const { _rid, ...orig } = row;
        await apiFetch(
          `${endpoint}/${_rid}`,
          { method: 'PUT', body: JSON.stringify({ orig, values }) },
          { quiet: true },
        );
      }
    } catch (e) {
      const err = e as ApiError;
      for (const [key, message] of Object.entries(err.fields ?? {})) {
        form.setError(key.replace(/^values\./, ''), { message });
      }
      form.setError('root', { message: err.message });
      return;
    }
    toast.success(pt.db.guardado);
    await queryClient.invalidateQueries({ queryKey: [endpoint] });
    onClose();
  });

  const requestClose = async () => {
    if (!form.formState.isDirty) return onClose();
    const answer = await confirm({ title: pt.desejaGravar, kind: 'sim-nao-cancelar' });
    if (answer === true) await submit();
    else if (answer === false) onClose();
  };

  return (
    <Sheet open onOpenChange={(open) => !open && void requestClose()}>
      <SheetContent
        side="right"
        className="w-[480px] max-w-full gap-0 bg-background p-0 text-foreground"
        aria-describedby={undefined}
      >
        <form
          onSubmit={submit}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
              e.preventDefault();
              void submit();
            }
          }}
          className="flex h-full flex-col"
          noValidate
        >
          <div className="border-b border-border px-5 py-4">
            <SheetTitle>{title}</SheetTitle>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {errors.root && (
              <p
                role="alert"
                className="rounded-md border border-destructive px-3 py-2 text-sm text-danger-text"
              >
                {errors.root.message}
              </p>
            )}
            {fields.map((c) => {
              const def = resource.columns[c.col]!;
              const id = `pf-${c.col}`;
              const error = errors[c.col]?.message;
              if (!editable(c.col)) {
                return (
                  <div key={c.col} className="grid gap-1">
                    <span className="text-xs text-muted-foreground">{def.label}</span>
                    <span className="min-h-5 text-sm">{formatCell(def, row?.[c.col]) || '—'}</span>
                  </div>
                );
              }
              const inputCls = cn(
                'h-8 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
                def.type === 'number' && 'text-right tabular-nums',
                error && 'border-destructive',
              );
              return (
                <div key={c.col} className="grid gap-1">
                  <label htmlFor={id} className="text-xs font-semibold">
                    {def.label}
                    {def.required && <span aria-hidden> *</span>}
                  </label>
                  {c.options ? (
                    // Controlled: the options load after the form mounts, so the DOM value must follow state.
                    <DominioSelect
                      id={id}
                      dominioId={c.options.dominioId}
                      className={inputCls}
                      invalid={!!error}
                      {...form.register(c.col)}
                      value={form.watch(c.col) ?? ''}
                    />
                  ) : (
                    <input
                      id={id}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `${id}-err` : undefined}
                      placeholder={def.type === 'date' ? 'DD-MM-AAAA' : undefined}
                      maxLength={def.maxLength}
                      className={inputCls}
                      {...form.register(c.col)}
                    />
                  )}
                  {error && (
                    <span id={`${id}-err`} className="text-xs text-field-error">
                      {error}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
            <Button type="button" variant="outline" onClick={() => void requestClose()}>
              {pt.cancelar}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {pt.db.guardar}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function DominioSelect({
  dominioId,
  invalid,
  ...props
}: React.ComponentProps<'select'> & { dominioId: string; invalid: boolean }) {
  const { data = [] } = useDominio(dominioId);
  return (
    <select aria-invalid={invalid || undefined} {...props}>
      <option value="" />
      {data.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
