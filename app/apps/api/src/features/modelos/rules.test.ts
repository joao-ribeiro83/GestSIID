import { describe, expect, it } from 'vitest';
import {
  APAGAR_MESTRE,
  FIM_EM_INTERVALO,
  INICIO_EM_INTERVALO,
  INICIO_SUPERIOR,
  MODELO_EXISTENTE,
  erroIntervalo,
  omissaoActual,
  planoOmissao,
  type Omissao,
  type PedidoOmissao,
} from './rules.ts';

/**
 * Characterization of FD_CONFIGURACAO_MODELOS (BR-MOD-03, BR-MOD-08..10): PARAMETROS_REPORT
 * WHEN-WINDOW-CLOSED and the Histórico WHEN-VALIDATE-ITEM date checks. Clock fixed at AGORA.
 */

const AGORA = '2026-09-29T10:00:00';

const om = (DATA_INICIO: string, DATA_FIM: string | null, VALOR: string | null = 'V'): Omissao => ({
  DATA_INICIO,
  DATA_FIM,
  VALOR,
  NOME_CONSULTA: null,
  CONSULTA_ONLINE: 'N',
});

const pedido = (over: Partial<PedidoOmissao> = {}): PedidoOmissao => ({
  VALOR: null,
  DATA_INICIO: null,
  DATA_FIM: null,
  NOME_CONSULTA: null,
  CONSULTA_ONLINE: 'N',
  ...over,
});

describe('messages', () => {
  it('keeps the exact Portuguese alert texts', () => {
    expect(MODELO_EXISTENTE).toBe('Já existe um modelo com esta referência');
    expect(APAGAR_MESTRE).toBe(
      'Impossível apagar registo mestre se existirem registos de detalhe correspondentes.',
    );
    expect(INICIO_SUPERIOR).toBe('A data de inicio é superior à data de fim.');
    expect(INICIO_EM_INTERVALO).toBe('A data de inicio econtra-se num intervalo já definido.');
    expect(FIM_EM_INTERVALO).toBe('A data de fim econtra-se num intervalo já definido.');
  });
});

describe('omissaoActual (BR-MOD-08, D-28)', () => {
  it('returns the closed row whose range contains now', () => {
    const actual = om('2026-01-01T00:00:00', '2026-12-31T00:00:00', 'ACTUAL');
    expect(omissaoActual([om('2025-01-01T00:00:00', '2025-12-31T00:00:00'), actual], AGORA)).toEqual(actual);
  });

  it('returns the open-ended row that started before now', () => {
    const aberta = om('2025-01-01T00:00:00', null, 'ABERTA');
    expect(omissaoActual([aberta], AGORA)).toEqual(aberta);
  });

  it('ignores an expired row', () => {
    expect(omissaoActual([om('2025-01-01T00:00:00', '2026-09-29T09:59:59')], AGORA)).toBeUndefined();
  });

  it('ignores a future row, also an open-ended one', () => {
    expect(omissaoActual([om('2026-09-29T10:00:01', null), om('2027-01-01T00:00:00', '2027-12-31T00:00:00')], AGORA)).toBeUndefined();
  });

  it('includes both bounds (DATA_INICIO = now, DATA_FIM = now)', () => {
    const inicio = om(AGORA, null, 'INICIO');
    const fim = om('2020-01-01T00:00:00', AGORA, 'FIM');
    expect(omissaoActual([inicio], AGORA)).toEqual(inicio);
    expect(omissaoActual([fim], AGORA)).toEqual(fim);
  });

  it('the latest DATA_INICIO wins when several rows contain now', () => {
    const antiga = om('2020-01-01T00:00:00', null, 'ANTIGA');
    const recente = om('2026-06-01T00:00:00', '2026-12-31T00:00:00', 'RECENTE');
    const meio = om('2024-01-01T00:00:00', null, 'MEIO');
    expect(omissaoActual([antiga, recente, meio], AGORA)).toEqual(recente);
  });

  it('no rows → undefined', () => {
    expect(omissaoActual([], AGORA)).toBeUndefined();
  });
});

describe('planoOmissao (BR-MOD-09)', () => {
  const fechada = om('2024-01-01T00:00:00', '2024-12-31T00:00:00', 'A');
  const aberta = om('2025-01-01T00:00:00', null, 'B');

  describe('1. nothing filled', () => {
    it('no date, no value, no end, no query, CONSULTA_ONLINE N → no operation', () => {
      expect(planoOmissao([fechada, aberta], pedido(), AGORA)).toEqual([]);
    });

    it('with no rows at all → no operation', () => {
      expect(planoOmissao([], pedido(), AGORA)).toEqual([]);
    });
  });

  describe('2. a row starts on the same day', () => {
    it('updates that row, keyed by its exact DATA_INICIO, with every field of the request', () => {
      const p = pedido({
        VALOR: 'NOVO',
        DATA_INICIO: '2025-01-01T15:30:00',
        DATA_FIM: '2027-01-01T00:00:00',
        NOME_CONSULTA: 'Q1',
        CONSULTA_ONLINE: 'S',
      });
      expect(planoOmissao([fechada, aberta], p, AGORA)).toEqual([
        {
          tipo: 'actualizar',
          DATA_INICIO: '2025-01-01T00:00:00',
          set: { VALOR: 'NOVO', DATA_FIM: '2027-01-01T00:00:00', NOME_CONSULTA: 'Q1', CONSULTA_ONLINE: 'S' },
        },
      ]);
    });

    it('matches a closed historical row too', () => {
      const p = pedido({ VALOR: 'X', DATA_INICIO: '2024-01-01T00:00:00' });
      expect(planoOmissao([fechada, aberta], p, AGORA)).toEqual([
        {
          tipo: 'actualizar',
          DATA_INICIO: '2024-01-01T00:00:00',
          set: { VALOR: 'X', DATA_FIM: null, NOME_CONSULTA: null, CONSULTA_ONLINE: 'N' },
        },
      ]);
    });

    it('re-saves the row even when nothing changed', () => {
      const p = pedido({ VALOR: 'B', DATA_INICIO: '2025-01-01T00:00:00' });
      expect(planoOmissao([aberta], p, AGORA)).toEqual([
        {
          tipo: 'actualizar',
          DATA_INICIO: '2025-01-01T00:00:00',
          set: { VALOR: 'B', DATA_FIM: null, NOME_CONSULTA: null, CONSULTA_ONLINE: 'N' },
        },
      ]);
    });
  });

  describe('3a. no open row', () => {
    it('inserts the request as given, DATA_FIM from the request', () => {
      const p = pedido({ VALOR: 'C', DATA_INICIO: '2026-01-01T00:00:00', DATA_FIM: '2026-12-31T00:00:00', NOME_CONSULTA: 'Q' });
      expect(planoOmissao([fechada], p, AGORA)).toEqual([
        {
          tipo: 'inserir',
          row: { DATA_INICIO: '2026-01-01T00:00:00', DATA_FIM: '2026-12-31T00:00:00', VALOR: 'C', NOME_CONSULTA: 'Q', CONSULTA_ONLINE: 'N' },
        },
      ]);
    });

    it('without a date the new row starts today at midnight', () => {
      expect(planoOmissao([], pedido({ VALOR: 'C' }), AGORA)).toEqual([
        {
          tipo: 'inserir',
          row: { DATA_INICIO: '2026-09-29T00:00:00', DATA_FIM: null, VALOR: 'C', NOME_CONSULTA: null, CONSULTA_ONLINE: 'N' },
        },
      ]);
    });

    it('CONSULTA_ONLINE S alone is enough to save', () => {
      expect(planoOmissao([], pedido({ CONSULTA_ONLINE: 'S' }), AGORA)).toEqual([
        {
          tipo: 'inserir',
          row: { DATA_INICIO: '2026-09-29T00:00:00', DATA_FIM: null, VALOR: null, NOME_CONSULTA: null, CONSULTA_ONLINE: 'S' },
        },
      ]);
    });
  });

  describe('3b. open row that starts earlier', () => {
    const open = om('2023-05-01T00:00:00', null, 'ABERTA');

    it.each([
      ['2026-03-15T08:00:00', '2026-03-14T08:00:00'],
      ['2026-03-01T00:00:00', '2026-02-28T00:00:00'],
      ['2024-03-01T00:00:00', '2024-02-29T00:00:00'],
      ['2025-01-01T00:00:00', '2024-12-31T00:00:00'],
    ])('new start %s closes the open row the day before (%s) and inserts', (inicio, vespera) => {
      const p = pedido({ VALOR: 'N', DATA_INICIO: inicio, DATA_FIM: '2030-01-01T00:00:00' });
      expect(planoOmissao([open], p, AGORA)).toEqual([
        { tipo: 'fechar', DATA_INICIO: '2023-05-01T00:00:00', DATA_FIM: vespera },
        {
          tipo: 'inserir',
          row: { DATA_INICIO: inicio, DATA_FIM: '2030-01-01T00:00:00', VALOR: 'N', NOME_CONSULTA: null, CONSULTA_ONLINE: 'N' },
        },
      ]);
    });

    it('without a date: closes yesterday and inserts today at midnight (the form failed with ORA-01400)', () => {
      expect(planoOmissao([fechada, aberta], pedido({ VALOR: 'HOJE' }), AGORA)).toEqual([
        { tipo: 'fechar', DATA_INICIO: '2025-01-01T00:00:00', DATA_FIM: '2026-09-28T00:00:00' },
        {
          tipo: 'inserir',
          row: { DATA_INICIO: '2026-09-29T00:00:00', DATA_FIM: null, VALOR: 'HOJE', NOME_CONSULTA: null, CONSULTA_ONLINE: 'N' },
        },
      ]);
    });
  });

  describe('3c. a historical value (start not after the open row)', () => {
    it('ends the day before the next later row, the request DATA_FIM ignored', () => {
      const p = pedido({ VALOR: 'H', DATA_INICIO: '2023-06-01T00:00:00', DATA_FIM: '2099-01-01T00:00:00' });
      expect(planoOmissao([fechada, aberta], p, AGORA)).toEqual([
        {
          tipo: 'inserir',
          row: { DATA_INICIO: '2023-06-01T00:00:00', DATA_FIM: '2023-12-31T00:00:00', VALOR: 'H', NOME_CONSULTA: null, CONSULTA_ONLINE: 'N' },
        },
      ]);
    });

    it('takes the nearest later start, not the open row, keeping its time', () => {
      const meio = om('2024-06-01T12:00:00', '2024-12-31T00:00:00', 'M');
      const p = pedido({ VALOR: 'H', DATA_INICIO: '2024-02-01T00:00:00' });
      expect(planoOmissao([aberta, meio], p, AGORA)).toEqual([
        {
          tipo: 'inserir',
          row: { DATA_INICIO: '2024-02-01T00:00:00', DATA_FIM: '2024-05-31T12:00:00', VALOR: 'H', NOME_CONSULTA: null, CONSULTA_ONLINE: 'N' },
        },
      ]);
    });

    it('no later row (open row started today at midnight, no date given) → DATA_FIM null', () => {
      const hoje = om('2026-09-29T00:00:00', null, 'HOJE');
      const p = pedido({ VALOR: 'Y', DATA_FIM: '2030-01-01T00:00:00' });
      expect(planoOmissao([fechada, hoje], p, AGORA)).toEqual([
        {
          tipo: 'inserir',
          row: { DATA_INICIO: '2026-09-29T00:00:00', DATA_FIM: null, VALOR: 'Y', NOME_CONSULTA: null, CONSULTA_ONLINE: 'N' },
        },
      ]);
    });

    it('an open row starting in the future bounds the new row', () => {
      const futura = om('2027-01-01T00:00:00', null, 'F');
      const p = pedido({ VALOR: 'H', DATA_INICIO: '2026-10-01T00:00:00' });
      expect(planoOmissao([futura], p, AGORA)).toEqual([
        {
          tipo: 'inserir',
          row: { DATA_INICIO: '2026-10-01T00:00:00', DATA_FIM: '2026-12-31T00:00:00', VALOR: 'H', NOME_CONSULTA: null, CONSULTA_ONLINE: 'N' },
        },
      ]);
    });
  });
});

describe('erroIntervalo (BR-MOD-10)', () => {
  const outros = [
    { DATA_INICIO: '2024-01-01T00:00:00', DATA_FIM: '2024-12-31T00:00:00' },
    { DATA_INICIO: '2025-06-01T00:00:00', DATA_FIM: null },
  ];
  const ambos = { inicio: true, fim: true };

  it('start after end → DATA_INICIO / INICIO_SUPERIOR, checked before the intervals', () => {
    expect(erroIntervalo(outros, '2024-06-01T00:00:00', '2024-03-01T00:00:00', AGORA, ambos)).toEqual({
      campo: 'DATA_INICIO',
      mensagem: INICIO_SUPERIOR,
    });
  });

  it('start after end is refused even when neither date changed', () => {
    expect(erroIntervalo([], '2023-06-01T00:00:00', '2023-03-01T00:00:00', AGORA, { inicio: false, fim: false })).toEqual({
      campo: 'DATA_INICIO',
      mensagem: INICIO_SUPERIOR,
    });
  });

  it('start equal to end is allowed', () => {
    expect(erroIntervalo(outros, '2023-03-01T00:00:00', '2023-03-01T00:00:00', AGORA, ambos)).toBeNull();
  });

  it('start inside another closed range → DATA_INICIO / INICIO_EM_INTERVALO', () => {
    expect(erroIntervalo(outros, '2024-05-05T00:00:00', null, AGORA, ambos)).toEqual({
      campo: 'DATA_INICIO',
      mensagem: INICIO_EM_INTERVALO,
    });
  });

  it.each(['2024-01-01T00:00:00', '2024-12-31T00:00:00'])('the range bounds are inclusive (start %s)', (ini) => {
    expect(erroIntervalo(outros, ini, null, AGORA, ambos)?.mensagem).toBe(INICIO_EM_INTERVALO);
  });

  it('an open row is bounded by now: a start before now conflicts, after now does not', () => {
    expect(erroIntervalo(outros, '2026-01-01T00:00:00', null, AGORA, ambos)?.mensagem).toBe(INICIO_EM_INTERVALO);
    expect(erroIntervalo(outros, AGORA, null, AGORA, ambos)?.mensagem).toBe(INICIO_EM_INTERVALO);
    expect(erroIntervalo(outros, '2026-09-29T10:00:01', null, AGORA, ambos)).toBeNull();
  });

  it('the start check runs only when the start changed', () => {
    expect(erroIntervalo(outros, '2024-05-05T00:00:00', null, AGORA, { inicio: false, fim: true })).toBeNull();
  });

  it('end inside another range → DATA_FIM / FIM_EM_INTERVALO', () => {
    expect(erroIntervalo(outros, '2023-01-01T00:00:00', '2024-02-01T00:00:00', AGORA, ambos)).toEqual({
      campo: 'DATA_FIM',
      mensagem: FIM_EM_INTERVALO,
    });
  });

  it('end inside the open row up to now conflicts', () => {
    expect(erroIntervalo(outros, '2025-02-01T00:00:00', '2025-07-01T00:00:00', AGORA, ambos)).toEqual({
      campo: 'DATA_FIM',
      mensagem: FIM_EM_INTERVALO,
    });
  });

  it('the end check runs only when the end changed', () => {
    expect(erroIntervalo(outros, '2023-01-01T00:00:00', '2024-02-01T00:00:00', AGORA, { inicio: true, fim: false })).toBeNull();
  });

  it('a null end never conflicts', () => {
    expect(erroIntervalo(outros, '2023-01-01T00:00:00', null, AGORA, ambos)).toBeNull();
  });

  it('both dates in a range → the start is reported first', () => {
    expect(erroIntervalo(outros, '2024-02-01T00:00:00', '2024-03-01T00:00:00', AGORA, ambos)).toEqual({
      campo: 'DATA_INICIO',
      mensagem: INICIO_EM_INTERVALO,
    });
  });

  it('a range that encloses another one is not caught (only the endpoints are tested)', () => {
    expect(erroIntervalo(outros, '2023-01-01T00:00:00', '2025-03-01T00:00:00', AGORA, ambos)).toBeNull();
  });

  it('no other rows → null', () => {
    expect(erroIntervalo([], '2024-05-05T00:00:00', '2024-06-05T00:00:00', AGORA, ambos)).toBeNull();
  });
});
