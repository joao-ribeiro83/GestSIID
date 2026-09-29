import { describe, expect, it } from 'vitest';
import { pt } from './pt.ts';

describe('pt', () => {
  it('has the common confirmation labels', () => {
    expect(pt.sim).toBe('Sim');
    expect(pt.nao).toBe('Não');
    expect(pt.ok).toBe('OK');
    expect(pt.cancelar).toBe('Cancelar');
  });

  it('has the D-26 empty-selection text', () => {
    expect(pt.naoExistemDocumentosSeleccionados).toBe('Não existem documentos seleccionados.');
  });

  it('formats a dynamic message with the skipped ids (example text-with-values function, §8)', () => {
    expect(pt.naoImpressosAnulados([12, 34])).toBe(
      'Os seguintes documentos não foram impressos por estarem anulados: 12, 34',
    );
  });
});
