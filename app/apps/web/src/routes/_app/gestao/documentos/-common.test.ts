import { describe, expect, it } from 'vitest';
import { parseListQuery } from '@gestsiid/shared';
import { tomDe } from '@/components/StatusBadge';
import { agrupar, paramsDe, seleccaoBody } from './-common';

describe('seleccaoBody (§4.2)', () => {
  it('none → null; ids → numbers', () => {
    expect(seleccaoBody({ mode: 'none' })).toBeNull();
    expect(seleccaoBody({ mode: 'ids', ids: ['7', 9] })).toEqual({ ids: [7, 9] });
  });

  it('consulta round-trips through the API parser: filters, preset, params, grupo; no page/sort', () => {
    const consulta = {
      filters: {
        MODELO_ID: [{ op: 'like' as const, value: 'R3%' }],
        ID: [{ op: 'in' as const, values: ['1', '2'] }],
        LOTE_ID: [{ op: 'null' as const }],
      },
      preset: 'em-erro',
      params: [
        { nome: 'P_ANO', valor: '2026' },
        { nome: 'P_ANO', valor: '2025' },
      ],
      paramModelo: 'R3.D25',
      grupo: '41',
    };
    const body = seleccaoBody({ mode: 'consulta', consulta, total: 3, capped: false });
    expect(body && 'consulta' in body).toBe(true);
    const parsed = parseListQuery((body as { consulta: object }).consulta);
    expect(parsed).toMatchObject({ ...consulta, sort: [], page: 1, size: 50 });
  });
});

describe('agrupar', () => {
  it('groups skipped ids under their message, in first-seen order', () => {
    expect(
      agrupar([
        { id: 3, motivo: 'B' },
        { id: 1, motivo: 'A' },
        { id: 5, motivo: 'B' },
      ]),
    ).toEqual([
      { motivo: 'B', ids: [3, 5] },
      { motivo: 'A', ids: [1] },
    ]);
  });
});

describe('paramsDe (Procurar)', () => {
  it('keeps only named rows with a value, upper-cases the name', () => {
    expect(
      paramsDe([
        { NOME: 'p_ano', VALOR: ' 2026 ' },
        { NOME: 'P_X', VALOR: '' },
        { NOME: '', VALOR: 'x' },
        { NOME: 'P_Y', VALOR: null },
      ]),
    ).toEqual([{ nome: 'P_ANO', valor: '2026' }]);
  });
});

describe('StatusBadge tone (UI_SPEC §6.3)', () => {
  it.each([
    ['EXECUCAO', 'documento', 'pending'],
    ['A EXECUTAR', 'documento', 'running'],
    ['IMPRESSO', 'documento', 'success'],
    ['ERRO', 'documento', 'danger'],
    ['EXECUCAO', 'fila', 'running'],
    ['ESPERA IMPRESSAO', 'documento', 'pending'],
    ['EM EXECUCAO', 'fila', 'running'],
    ['SUSPENSO', 'fila', 'neutral'],
    ['QUALQUER', 'fila', 'neutral'],
  ] as const)('%s (%s) → %s', (v, d, t) => expect(tomDe(v, d)).toBe(t));
});
