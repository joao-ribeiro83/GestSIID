import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** The shell's slot right of the h1 (UI_SPEC §2.1 "Page-level buttons on the right"). */
export const PageActionsSlot = createContext<HTMLElement | null>(null);

/** Renders a screen's page-level buttons into the shell header, next to the title. */
export function PageActions({ children }: { children: ReactNode }) {
  const slot = useContext(PageActionsSlot);
  return slot ? createPortal(children, slot) : null;
}
