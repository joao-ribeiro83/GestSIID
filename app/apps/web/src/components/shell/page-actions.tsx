import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** The shell's slot right of the h1 (UI_SPEC §2.1 "Page-level buttons on the right"). */
export const PageActionsSlot = createContext<HTMLElement | null>(null);

/** Renders a screen's page-level buttons into the shell header, next to the title. */
export function PageActions({ children }: { children: ReactNode }) {
  const slot = useContext(PageActionsSlot);
  return slot ? createPortal(children, slot) : null;
}

/**
 * "Voltar" on a row's detail page (D-34): back in history when the app has one (the list is
 * still mounted with its filters, sort and page), else to the list itself (a bookmarked link).
 */
export function Voltar({ to }: { to: string }) {
  const router = useRouter();
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();
  return (
    <PageActions>
      <Button variant="outline" onClick={() => (canGoBack ? router.history.back() : void navigate({ to }))}>
        <ArrowLeft /> Voltar
      </Button>
    </PageActions>
  );
}
