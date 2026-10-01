// Regression: FINDING-002 — the home tab read "GestSIID · GestSIID · GADOR_TESTES".
// Found by /design-review on 2026-10-01. Report: analysis/QA_REPORT.md
import { describe, expect, it } from 'vitest';
import { pageTitle } from '@/components/shell/app-shell';

describe('pageTitle', () => {
  it('does not repeat GestSIID on the home page', () => {
    expect(pageTitle('GestSIID', 'GADOR_TESTES')).toBe('GestSIID · GADOR_TESTES');
  });
  it('is <h1> · GestSIID · <ambiente> elsewhere, and drops a missing ambiente', () => {
    expect(pageTitle('Documentos', 'GADOR_TESTES')).toBe('Documentos · GestSIID · GADOR_TESTES');
    expect(pageTitle('Documentos')).toBe('Documentos · GestSIID');
  });
});
