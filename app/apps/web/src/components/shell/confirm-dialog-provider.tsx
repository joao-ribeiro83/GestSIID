import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { pt } from '@gestsiid/shared';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type ConfirmOptions = {
  title: string;
  description?: string;
  /** 'sim-nao' → Sim/Não; 'ok-cancelar' (default) → OK/Cancelar; 'sim-nao-cancelar' → all three (#46). */
  kind?: 'sim-nao' | 'ok-cancelar' | 'sim-nao-cancelar';
  destructive?: boolean;
};

/** `'cancelar'` only comes back from a 'sim-nao-cancelar' dialog (its Cancelar button, Esc, overlay). */
export type ConfirmValue = boolean | 'cancelar';

type Confirm = (options: ConfirmOptions) => Promise<ConfirmValue>;

const ConfirmContext = createContext<Confirm | null>(null);

export function useConfirm(): Confirm {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmDialogProvider');
  return ctx;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<{
    options: ConfirmOptions;
    resolve: (value: ConfirmValue) => void;
  } | null>(null);

  const confirm = useCallback<Confirm>(
    (options) => new Promise((resolve) => setPending({ options, resolve })),
    [],
  );

  const settle = (value: ConfirmValue) => {
    pending?.resolve(value);
    setPending(null);
  };

  const kind = pending?.options.kind;
  const threeWay = kind === 'sim-nao-cancelar';
  const confirmLabel = kind === 'sim-nao' || threeWay ? pt.sim : pt.ok;
  const cancelLabel = kind === 'sim-nao' || threeWay ? pt.nao : pt.cancelar;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={pending !== null}
        onOpenChange={(open) => !open && settle(threeWay ? 'cancelar' : false)}
      >
        <DialogContent>
          {pending && (
            <>
              <DialogHeader>
                <DialogTitle>{pending.options.title}</DialogTitle>
                {pending.options.description && (
                  <DialogDescription>{pending.options.description}</DialogDescription>
                )}
              </DialogHeader>
              <DialogFooter>
                {threeWay && (
                  <Button variant="outline" onClick={() => settle('cancelar')}>
                    {pt.cancelar}
                  </Button>
                )}
                <Button variant="outline" onClick={() => settle(false)}>
                  {cancelLabel}
                </Button>
                <Button
                  variant={pending.options.destructive ? 'destructive' : 'default'}
                  onClick={() => settle(true)}
                >
                  {confirmLabel}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
