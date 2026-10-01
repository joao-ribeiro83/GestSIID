// Regression: ISSUE-003 — a USER who typed an ADM screen's URL got the full screen (grid, filters,
// toolbar) firing requests that all failed with 403; the layout now checks the leaf's roles.
// Found by /qa on 2026-10-01. Report: analysis/QA_REPORT.md
import { describe, expect, it } from 'vitest';
import { menuItemFor } from '@/menu';

describe('menuItemFor', () => {
  it('finds the leaf for its own path and for its sub-routes', () => {
    expect(menuItemFor('/administracao/utilizadores')?.id).toBe('utilizadores');
    expect(menuItemFor('/gestao/documentos/123')?.id).toBe('documentos');
    expect(menuItemFor('/configuracao/impressoras-associadas/documento')?.id).toBe('imp-documento');
  });

  it('does not match a path that only shares a prefix', () => {
    expect(menuItemFor('/configuracao/impressoras-associadas/utilizador')?.id).toBe('imp-utilizador');
    expect(menuItemFor('/configuracao/impressorasX')).toBeUndefined();
  });

  it('gives undefined outside the menu (home), so the layout renders it for every role', () => {
    expect(menuItemFor('/')).toBeUndefined();
  });

  it('marks every ADM screen as not for USER and Documentos as for both', () => {
    expect(menuItemFor('/configuracao/impressoras')?.roles).not.toContain('USER');
    expect(menuItemFor('/gestao/backups/novo')?.roles).not.toContain('USER');
    expect(menuItemFor('/gestao/documentos')?.roles).toEqual(['ADM', 'USER']);
  });
});
