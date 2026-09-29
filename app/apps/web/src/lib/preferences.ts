import { useCallback, useState } from 'react';

/** UI_SPEC §1.3: theme is the `dark` class on `<html>`; `public/theme-init.js` applies it pre-paint. */
export function useTema(): [boolean, (escuro: boolean) => void] {
  const [escuro, setEscuro] = useState(() => document.documentElement.classList.contains('dark'));
  const set = useCallback((next: boolean) => {
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('gestsiid.tema', next ? 'escuro' : 'claro');
    } catch {
      /* private window / blocked storage: theme still applies for this load */
    }
    setEscuro(next);
  }, []);
  return [escuro, set];
}

/** UI-06: density defaults to compact; comfortable is a per-viewer localStorage switch. */
export function useDensidade(): [boolean, (confortavel: boolean) => void] {
  const [confortavel, setConfortavel] = useState(
    () => document.documentElement.dataset.densidade === 'confortavel',
  );
  const set = useCallback((next: boolean) => {
    if (next) {
      document.documentElement.dataset.densidade = 'confortavel';
    } else {
      delete document.documentElement.dataset.densidade;
    }
    try {
      localStorage.setItem('gestsiid.densidade', next ? 'confortavel' : 'compacta');
    } catch {
      /* private window / blocked storage */
    }
    setConfortavel(next);
  }, []);
  return [confortavel, set];
}

/** §2.1: sidebar collapse state persists across sessions (`gestsiid.menu` = 'recolhido'). */
export function useMenuRecolhido(): [boolean, (recolhido: boolean) => void] {
  const [recolhido, setRecolhido] = useState(() => {
    try {
      return localStorage.getItem('gestsiid.menu') === 'recolhido';
    } catch {
      return false;
    }
  });
  const set = useCallback((next: boolean) => {
    try {
      if (next) localStorage.setItem('gestsiid.menu', 'recolhido');
      else localStorage.removeItem('gestsiid.menu');
    } catch {
      /* private window / blocked storage */
    }
    setRecolhido(next);
  }, []);
  return [recolhido, set];
}
