import type { Ref } from 'react';
import type { Role } from '@gestsiid/shared';

/** What the screen asks a tab before the model, the tab or the page changes: its blocks'
 * "Deseja gravar as alterações efectuadas?" (#46, the form's ASK_COMMIT). true = go on. */
export interface TabGuard {
  leave: () => Promise<boolean>;
}

export interface TabProps {
  /** The current model; null = no current row (the tab shows "Seleccione um registo."). */
  keys: { MODELO_ID: string } | null;
  role: Role;
  guardRef: Ref<TabGuard>;
}

export const dom = (dominioId: string) => ({ source: 'dominio', dominioId }) as const;
export const enc = (v: unknown) => encodeURIComponent(String(v ?? ''));
export const modeloPath = (keys: TabProps['keys']) => `/modelos/${enc(keys?.MODELO_ID)}`;

/** Asks each in turn; stops at the first "Cancelar". */
export async function askAll(...asks: (() => Promise<boolean>)[]): Promise<boolean> {
  for (const ask of asks) if (!(await ask())) return false;
  return true;
}
