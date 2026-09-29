import { useState } from 'react';
import { ApiError, apiFetch, apiUrl } from '@/api/client';
import { Button } from '@/components/ui/button';

interface Props {
  /** API path of the image routes, e.g. `/perfis-departamento/12/assinatura`. Key the component by it. */
  path: string;
  title: string;
  /** Shown while the row has no image. */
  emptyText: string;
  inputLabel: string;
  removeLabel: string;
}

/**
 * Preview + upload + remove for one `imageRoutes` image (ARCHITECTURE.md §6). The preview is a
 * plain `<img>` on the GET route (404 = no image); `?v=` defeats the browser cache after a write.
 * The server decides what is an image (415) and how big it may be (413): its message is shown.
 */
export function ImageUpload({ path, title, emptyText, inputLabel, removeLabel }: Props) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const call = async (init: RequestInit, done: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(path, init, { quiet: true });
      done();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Falha na operação.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label={title} className="grid gap-2 border-t border-border pt-3">
      <h3 className="text-xs font-semibold">{title}</h3>
      {state !== 'empty' && (
        <img
          key={version}
          src={`${apiUrl(path)}?v=${version}`}
          alt={title}
          onLoad={() => setState('ok')}
          onError={() => setState('empty')}
          className={
            state === 'ok'
              ? 'max-h-40 max-w-full self-start rounded border border-border object-contain'
              : 'hidden'
          }
        />
      )}
      {state === 'empty' && <p className="text-sm text-muted-foreground">{emptyText}</p>}
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/bmp"
          aria-label={inputLabel}
          disabled={busy}
          className="min-w-0 flex-1 text-sm"
          onChange={(event) => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            if (!file) return;
            const body = new FormData();
            body.append('ficheiro', file);
            input.value = ''; // the same file can be picked again
            void call({ method: 'PUT', body }, () => {
              setState('loading');
              setVersion((v) => v + 1);
            });
          }}
        />
        {state === 'ok' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void call({ method: 'DELETE' }, () => setState('empty'))}
          >
            {removeLabel}
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-field-error">
          {error}
        </p>
      )}
    </section>
  );
}
