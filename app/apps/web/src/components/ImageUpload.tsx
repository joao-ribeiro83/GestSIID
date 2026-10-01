import { useState, type ReactNode } from 'react';
import { ApiError, apiFetch, apiUpload, apiUrl } from '@/api/client';
import { useConfirm } from '@/components/shell/confirm-dialog-provider';
import { Button } from '@/components/ui/button';

interface Props {
  /** API path of the image routes, e.g. `/perfis-departamento/12/assinatura`. Key the component by it. */
  path: string;
  title: string;
  /** Shown while the row has no image. */
  emptyText: string;
  /** Text of the file-picker button. */
  inputLabel: string;
  removeLabel: string;
  /** Two steps, as a form with a separate transfer button: picking a file only stages it and
   * this button sends it. Without it, picking a file sends it at once. */
  saveLabel?: string;
  /** Asked (Sim / Não) before the image is removed. */
  confirmRemove?: string;
  /** Under the preview (e.g. the stored image type). */
  caption?: ReactNode;
  /** After an upload or a removal, e.g. to refetch a decoded column. */
  onChange?: () => void;
}

const erro = (e: unknown) => (e instanceof ApiError ? e.message : 'Falha na operação.');

/**
 * Preview + upload (with progress) + remove for one `imageRoutes` image (ARCHITECTURE.md §6). The
 * preview is a plain `<img>` on the GET route (204 = no image); `?v=` defeats the browser cache
 * after a write. The server decides what is an image (415) and how big it may be (413): its
 * message is shown.
 */
export function ImageUpload(props: Props) {
  const { path, title } = props;
  const confirm = useConfirm();
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [staged, setStaged] = useState<File | null>(null);
  /** Upload progress 0..1; null = no upload running. */
  const [progress, setProgress] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);
  const busy = progress !== null || removing;

  const upload = async (file: File) => {
    const body = new FormData();
    body.append('ficheiro', file);
    setError(null);
    setProgress(0);
    try {
      await apiUpload(path, body, setProgress);
      setStaged(null);
      setState('loading');
      setVersion((v) => v + 1);
      props.onChange?.();
    } catch (e) {
      setError(erro(e));
    } finally {
      setProgress(null);
    }
  };

  const remove = async () => {
    if (props.confirmRemove) {
      const ok = await confirm({ title: props.confirmRemove, kind: 'sim-nao', destructive: true });
      if (ok !== true) return;
    }
    setRemoving(true);
    setError(null);
    try {
      await apiFetch(path, { method: 'DELETE' }, { quiet: true });
      setState('empty');
      props.onChange?.();
    } catch (e) {
      setError(erro(e));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <section aria-label={title} className="grid gap-2 border-t border-border pt-3">
      <h3 className="text-xs font-semibold">{title}</h3>
      {/* A checkered ground, so a transparent PNG/GIF shows what is really stored. */}
      <div className="grid min-h-24 place-items-center overflow-hidden rounded-md border border-border bg-[repeating-conic-gradient(var(--color-muted)_0_25%,var(--color-card)_0_50%)] bg-[length:16px_16px] p-2">
        {state !== 'empty' && (
          <img
            key={version}
            src={`${apiUrl(path)}?v=${version}`}
            alt={title}
            onLoad={() => setState('ok')}
            onError={() => setState('empty')}
            className={state === 'ok' ? 'max-h-40 max-w-full object-contain' : 'hidden'}
          />
        )}
        {state === 'empty' && (
          <p className="rounded-sm bg-card px-2 py-0.5 text-sm text-muted-foreground">
            {props.emptyText}
          </p>
        )}
      </div>
      {state === 'ok' && props.caption && (
        <p className="text-xs text-muted-foreground">{props.caption}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50"
        >
          <label>
            {props.inputLabel}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/bmp"
              disabled={busy}
              className="sr-only"
              onChange={(event) => {
                const input = event.currentTarget;
                const file = input.files?.[0];
                input.value = ''; // the same file can be picked again
                if (!file) return;
                if (props.saveLabel) setStaged(file);
                else void upload(file);
              }}
            />
          </label>
        </Button>
        {props.saveLabel && (
          <Button
            type="button"
            size="sm"
            disabled={!staged || busy}
            onClick={() => staged && void upload(staged)}
          >
            {props.saveLabel}
          </Button>
        )}
        {state === 'ok' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void remove()}
          >
            {props.removeLabel}
          </Button>
        )}
      </div>
      {staged && (
        <p className="truncate text-xs text-muted-foreground" title={staged.name}>
          {staged.name}
        </p>
      )}
      {progress !== null && (
        <progress
          value={progress}
          max={1}
          aria-label={`A enviar ${staged?.name ?? ''}`.trim()}
          className="h-1.5 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary"
        />
      )}
      {error && (
        <p role="alert" className="text-sm text-field-error">
          {error}
        </p>
      )}
    </section>
  );
}
