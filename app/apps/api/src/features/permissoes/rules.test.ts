import { describe, expect, it } from 'vitest';
import {
  FIM_BULK,
  JA_EXISTE,
  OBRIGATORIO,
  OBRIGATORIO_DATA_INICIO,
  SOBREPOE,
  conflitoAlterar,
  conflitoNova,
  diaAnterior,
  naoExpirada,
  normalizaData,
  planoCopiaModelo,
  planoCopiaUtilizador,
  semPermissao,
  sobrepoe,
  validaHoje,
  type Modelo,
  type Perm,
  type Utilizador,
} from './rules.ts';

/**
 * Characterization of FD_PERMISSOES_SIID (BR-PERM-01..11). The trigger text is the oracle:
 * NOVA_PERMISSAO.OK, ALTERAR_PERMISSAO.OK, COPIAR_PERMISSOES(_UTILIZADOR).OK,
 * CTR_USERS_SIID / CTR_MODELOS_SIID ADD_* / REMOVE_*, view CTR_SEM_PERMISSAO_USER_VW.
 */

const NOW = '2026-09-28T10:00:00';

const perm = (over: Partial<Perm> = {}): Perm => ({
  MODELO_ID: 'M1',
  USERNAME: 'ANA',
  UNIDADE_NEGOCIO_RF: 'DSI',
  TIPO_PERMISSAO_RF: 1,
  DATA_INICIO: '2026-01-01T00:00:00',
  DATA_FIM: null,
  ...over,
});

describe('messages and sentinels', () => {
  it('keeps the exact Portuguese alert texts (BR-PERM-04, BR-PERM-05)', () => {
    expect(OBRIGATORIO).toBe('Todos os campos são obrigatórios, excepto a data de fim.');
    expect(OBRIGATORIO_DATA_INICIO).toBe("O Campo 'Data de Início' é de preenchimento obrigatório.");
    expect(JA_EXISTE).toBe('ERRO: Permissão já existe válida para o intervalo definido!!');
    expect(SOBREPOE).toBe('ERRO: O intervalo de datas sobrepõe-se a uma permissão já existente!');
  });

  it('bulk add ends on 2200-12-31 (BR-PERM-07: TO_DATE(31-12-2200))', () => {
    expect(FIM_BULK).toBe('2200-12-31T00:00:00');
  });
});

describe('normalizaData', () => {
  it('turns a date-only value into midnight', () => {
    expect(normalizaData('2026-09-28')).toBe('2026-09-28T00:00:00');
  });

  it('leaves a full timestamp unchanged', () => {
    expect(normalizaData('2026-09-28T10:11:12')).toBe('2026-09-28T10:11:12');
  });
});

describe('validaHoje — SYSDATE BETWEEN DATA_INICIO AND NVL(DATA_FIM, SYSDATE+1) (BR-PERM-02)', () => {
  it('open-ended row that started before now is valid', () => {
    expect(validaHoje({ DATA_INICIO: '2026-01-01T00:00:00', DATA_FIM: null }, NOW)).toBe(true);
  });

  it('open-ended row that starts later is not valid', () => {
    expect(validaHoje({ DATA_INICIO: '2026-09-28T10:00:01', DATA_FIM: null }, NOW)).toBe(false);
  });

  it('both ends are inclusive: DATA_INICIO = now is valid', () => {
    expect(validaHoje({ DATA_INICIO: NOW, DATA_FIM: '2026-12-31T00:00:00' }, NOW)).toBe(true);
  });

  it('both ends are inclusive: DATA_FIM = now is valid', () => {
    expect(validaHoje({ DATA_INICIO: '2026-01-01T00:00:00', DATA_FIM: NOW }, NOW)).toBe(true);
  });

  it('DATA_FIM at midnight today is already expired at 10:00 (DATE has a time part)', () => {
    expect(validaHoje({ DATA_INICIO: '2026-01-01T00:00:00', DATA_FIM: '2026-09-28T00:00:00' }, NOW)).toBe(
      false,
    );
  });

  it('a row removed from a panel (DATA_FIM = SYSDATE-1) is not valid', () => {
    expect(validaHoje({ DATA_INICIO: '2026-01-01T00:00:00', DATA_FIM: '2026-09-27T10:00:00' }, NOW)).toBe(
      false,
    );
  });
});

describe('naoExpirada — SYSDATE <= NVL(DATA_FIM, SYSDATE) (BR-PERM-10/11 copy filter)', () => {
  it('open-ended is not expired', () => {
    expect(naoExpirada({ DATA_FIM: null }, NOW)).toBe(true);
  });

  it('DATA_FIM = now is not expired', () => {
    expect(naoExpirada({ DATA_FIM: NOW }, NOW)).toBe(true);
  });

  it('DATA_FIM one second before now is expired', () => {
    expect(naoExpirada({ DATA_FIM: '2026-09-28T09:59:59' }, NOW)).toBe(false);
  });
});

describe('sobrepoe — aIni <= NVL(bFim, 9999-12-31) AND NVL(aFim, 9999-12-31) >= bIni', () => {
  it('ranges that touch on the same instant overlap (both ends inclusive)', () => {
    expect(sobrepoe('2026-01-31T00:00:00', null, '2026-01-01T00:00:00', '2026-01-31T00:00:00')).toBe(true);
  });

  it('a range starting the day after the other ends does not overlap', () => {
    expect(
      sobrepoe('2026-02-01T00:00:00', '2026-02-28T00:00:00', '2026-01-01T00:00:00', '2026-01-31T00:00:00'),
    ).toBe(false);
  });

  it('a range ending the day before the other starts does not overlap', () => {
    expect(
      sobrepoe('2025-01-01T00:00:00', '2025-12-31T00:00:00', '2026-01-01T00:00:00', '2026-12-31T00:00:00'),
    ).toBe(false);
  });

  it('an open-ended existing row blocks a range starting years later (9999 sentinel, not SYSDATE)', () => {
    expect(sobrepoe('2030-01-01T00:00:00', '2030-12-31T00:00:00', '2026-01-01T00:00:00', null)).toBe(true);
  });

  it('an open-ended new range overlaps a row that starts in the far future', () => {
    expect(sobrepoe('2026-01-01T00:00:00', null, '2199-01-01T00:00:00', '2199-12-31T00:00:00')).toBe(true);
  });

  it('two open-ended ranges always overlap', () => {
    expect(sobrepoe('2030-01-01T00:00:00', null, '2020-01-01T00:00:00', null)).toBe(true);
  });

  it('an annulled row (DATA_FIM 1980-01-01 before its DATA_INICIO) overlaps nothing after 1980', () => {
    expect(sobrepoe('2020-06-01T00:00:00', null, '2020-01-01T00:00:00', '1980-01-01T00:00:00')).toBe(false);
  });
});

describe('diaAnterior — SYSDATE - 1 (BR-PERM-08 remove)', () => {
  it('keeps the time and goes back one day', () => {
    expect(diaAnterior('2026-09-28T10:00:00')).toBe('2026-09-27T10:00:00');
  });

  it('rolls over to the end of February', () => {
    expect(diaAnterior('2026-03-01T08:30:15')).toBe('2026-02-28T08:30:15');
  });

  it('rolls over to 29 February in a leap year', () => {
    expect(diaAnterior('2028-03-01T00:00:00')).toBe('2028-02-29T00:00:00');
  });

  it('rolls over the year', () => {
    expect(diaAnterior('2026-01-01T00:00:00')).toBe('2025-12-31T00:00:00');
  });
});

describe('conflitoNova (BR-PERM-04 NOVA_PERMISSAO.OK count)', () => {
  const existente = perm({ DATA_INICIO: '2026-01-01T00:00:00', DATA_FIM: '2026-06-30T00:00:00' });

  it('overlap with a row of the same user, model, type and unit conflicts', () => {
    const nova = perm({ DATA_INICIO: '2026-06-01T00:00:00', DATA_FIM: null });
    expect(conflitoNova([existente], nova)).toBe(true);
  });

  it('a new range starting on the existing DATA_FIM conflicts (inclusive)', () => {
    const nova = perm({ DATA_INICIO: '2026-06-30T00:00:00', DATA_FIM: null });
    expect(conflitoNova([existente], nova)).toBe(true);
  });

  it('a new range starting the day after the existing DATA_FIM does not conflict', () => {
    const nova = perm({ DATA_INICIO: '2026-07-01T00:00:00', DATA_FIM: null });
    expect(conflitoNova([existente], nova)).toBe(false);
  });

  it('an expired row still counts (the check has no validity filter)', () => {
    const velha = perm({ DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: '2020-12-31T00:00:00' });
    const nova = perm({ DATA_INICIO: '2020-06-01T00:00:00', DATA_FIM: '2020-07-01T00:00:00' });
    expect(conflitoNova([velha], nova)).toBe(true);
  });

  it.each([
    ['USERNAME', { USERNAME: 'BIA' }],
    ['MODELO_ID', { MODELO_ID: 'M2' }],
    ['TIPO_PERMISSAO_RF', { TIPO_PERMISSAO_RF: 2 }],
    ['UNIDADE_NEGOCIO_RF', { UNIDADE_NEGOCIO_RF: 'DFI' }],
  ] as const)('an overlapping row with another %s does not conflict', (_col, over) => {
    const nova = perm({ ...over, DATA_INICIO: '2026-03-01T00:00:00', DATA_FIM: null });
    expect(conflitoNova([existente], nova)).toBe(false);
  });

  it('no rows, no conflict', () => {
    expect(conflitoNova([], perm())).toBe(false);
  });
});

describe('conflitoAlterar (BR-PERM-05 ALTERAR_PERMISSAO.OK count)', () => {
  const editada = perm({ DATA_INICIO: '2026-01-01T00:00:00', DATA_FIM: '2026-03-31T00:00:00' });
  const outra = perm({ DATA_INICIO: '2026-04-01T00:00:00', DATA_FIM: '2026-06-30T00:00:00' });
  const chave = {
    MODELO_ID: editada.MODELO_ID,
    USERNAME: editada.USERNAME,
    UNIDADE_NEGOCIO_RF: editada.UNIDADE_NEGOCIO_RF,
    TIPO_PERMISSAO_RF: editada.TIPO_PERMISSAO_RF,
    DATA_INICIO: editada.DATA_INICIO,
  };

  it('the edited row itself is excluded (DATA_INICIO != DATA_INI_ANTERIOR)', () => {
    expect(conflitoAlterar([editada], chave, '2025-06-01T00:00:00', null)).toBe(false);
  });

  it('extending into another row of the same key conflicts', () => {
    expect(conflitoAlterar([editada, outra], chave, '2026-01-01T00:00:00', '2026-04-01T00:00:00')).toBe(true);
  });

  it('ending the day before the other row starts does not conflict', () => {
    expect(conflitoAlterar([editada, outra], chave, '2026-01-01T00:00:00', '2026-03-31T23:59:59')).toBe(false);
  });

  it('removing the end date (open-ended) conflicts with a later row', () => {
    expect(conflitoAlterar([editada, outra], chave, '2026-01-01T00:00:00', null)).toBe(true);
  });

  it('an overlapping row of another type does not conflict', () => {
    const tipo2 = perm({ ...outra, TIPO_PERMISSAO_RF: 2 });
    expect(conflitoAlterar([editada, tipo2], chave, '2026-01-01T00:00:00', null)).toBe(false);
  });

  it('an overlapping row of another user does not conflict', () => {
    const bia = perm({ ...outra, USERNAME: 'BIA' });
    expect(conflitoAlterar([editada, bia], chave, '2026-01-01T00:00:00', null)).toBe(false);
  });
});

describe('semPermissao — CTR_SEM_PERMISSAO_USER_VW (BR-PERM-07, BR-PERM-09)', () => {
  const modelos: Modelo[] = [
    { ID: 'M2', REPORT_ID: 2, DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: null },
    { ID: 'M1', REPORT_ID: 1, DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: null },
    { ID: 'M46', REPORT_ID: 46, DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: null },
    { ID: 'MEXP', REPORT_ID: 1, DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: '2026-09-28T09:59:59' },
    { ID: 'MFUT', REPORT_ID: 1, DATA_INICIO: '2026-09-28T10:00:01', DATA_FIM: null },
    { ID: 'MNOW', REPORT_ID: 1, DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: NOW },
  ];
  const utilizadores: Utilizador[] = [
    { USERNAME: 'BIA', NOME: 'Beatriz', UNIDADE_NEGOCIO_RF: 'DSI' },
    { USERNAME: 'ANA', NOME: 'Ana', UNIDADE_NEGOCIO_RF: 'DSI' },
    { USERNAME: 'CARLOS', NOME: 'Carlos', UNIDADE_NEGOCIO_RF: 'DFI' },
  ];
  const doAna = { UNIDADE_NEGOCIO_RF: 'DSI', TIPO_PERMISSAO_RF: 1, USERNAME: 'ANA' };
  const ids = (rows: { MODELO_ID: string }[]) => rows.map((r) => r.MODELO_ID);

  it('user scope: every model valid today, sorted by MODELO_ID, as { MODELO_ID, USERNAME, NOME }', () => {
    expect(semPermissao(modelos, utilizadores, [], doAna, NOW)).toEqual([
      { MODELO_ID: 'M1', USERNAME: 'ANA', NOME: 'Ana' },
      { MODELO_ID: 'M2', USERNAME: 'ANA', NOME: 'Ana' },
      { MODELO_ID: 'MNOW', USERNAME: 'ANA', NOME: 'Ana' },
    ]);
  });

  it('excludes REPORT_ID 46, expired models and models not yet started', () => {
    const r = ids(semPermissao(modelos, utilizadores, [], doAna, NOW));
    expect(r).not.toContain('M46');
    expect(r).not.toContain('MEXP');
    expect(r).not.toContain('MFUT');
  });

  it('excludes a model whose REPORT_ID is NULL (SQL: NULL <> 46 is not true)', () => {
    const semReport: Modelo[] = [{ ID: 'MNULL', REPORT_ID: null, DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: null }];
    expect(semPermissao(semReport, utilizadores, [], doAna, NOW)).toEqual([]);
  });

  it('a permission valid today hides the model', () => {
    const r = ids(semPermissao(modelos, utilizadores, [perm({ MODELO_ID: 'M1' })], doAna, NOW));
    expect(r).toEqual(['M2', 'MNOW']);
  });

  it('an expired permission makes the model reappear', () => {
    const removida = perm({ MODELO_ID: 'M1', DATA_FIM: '2026-09-27T10:00:00' });
    expect(ids(semPermissao(modelos, utilizadores, [removida], doAna, NOW))).toContain('M1');
  });

  it('a permission that starts in the future does not hide the model', () => {
    const futura = perm({ MODELO_ID: 'M1', DATA_INICIO: '2026-10-01T00:00:00' });
    expect(ids(semPermissao(modelos, utilizadores, [futura], doAna, NOW))).toContain('M1');
  });

  it('a permission of another type does not hide the model', () => {
    const tipo2 = perm({ MODELO_ID: 'M1', TIPO_PERMISSAO_RF: 2 });
    expect(ids(semPermissao(modelos, utilizadores, [tipo2], doAna, NOW))).toContain('M1');
  });

  it('a permission in another unit does not hide the model', () => {
    const dfi = perm({ MODELO_ID: 'M1', UNIDADE_NEGOCIO_RF: 'DFI' });
    expect(ids(semPermissao(modelos, utilizadores, [dfi], doAna, NOW))).toContain('M1');
  });

  it('a user who is not in the scope unit gets an empty list', () => {
    const carlosEmDsi = { UNIDADE_NEGOCIO_RF: 'DSI', TIPO_PERMISSAO_RF: 1, USERNAME: 'CARLOS' };
    expect(semPermissao(modelos, utilizadores, [], carlosEmDsi, NOW)).toEqual([]);
  });

  it('model scope: only users of the unit, sorted by USERNAME', () => {
    const doM1 = { UNIDADE_NEGOCIO_RF: 'DSI', TIPO_PERMISSAO_RF: 1, MODELO_ID: 'M1' };
    expect(semPermissao(modelos, utilizadores, [], doM1, NOW)).toEqual([
      { MODELO_ID: 'M1', USERNAME: 'ANA', NOME: 'Ana' },
      { MODELO_ID: 'M1', USERNAME: 'BIA', NOME: 'Beatriz' },
    ]);
  });

  it('model scope: a user with a valid permission is left out', () => {
    const doM1 = { UNIDADE_NEGOCIO_RF: 'DSI', TIPO_PERMISSAO_RF: 1, MODELO_ID: 'M1' };
    const r = semPermissao(modelos, utilizadores, [perm({ MODELO_ID: 'M1', USERNAME: 'ANA' })], doM1, NOW);
    expect(r.map((x) => x.USERNAME)).toEqual(['BIA']);
  });

  it('model scope: a REPORT_ID 46 model has no users without permission', () => {
    const doM46 = { UNIDADE_NEGOCIO_RF: 'DSI', TIPO_PERMISSAO_RF: 1, MODELO_ID: 'M46' };
    expect(semPermissao(modelos, utilizadores, [], doM46, NOW)).toEqual([]);
  });
});

describe('planoCopiaModelo (BR-PERM-10 COPIAR_PERMISSOES.OK)', () => {
  const src = (over: Partial<Perm> = {}) => perm({ MODELO_ID: 'M1', ...over });

  it('copies a source row onto the target model, keeping user, unit, type and dates', () => {
    const a = src({ DATA_INICIO: '2026-01-01T00:00:00', DATA_FIM: '2026-12-31T00:00:00' });
    expect(planoCopiaModelo([a], [], 'M2', NOW)).toEqual([{ ...a, MODELO_ID: 'M2' }]);
  });

  it('keeps open-ended rows', () => {
    expect(planoCopiaModelo([src({ DATA_FIM: null })], [], 'M2', NOW)).toHaveLength(1);
  });

  it('keeps rows that have not started yet (only SYSDATE <= NVL(DATA_FIM, SYSDATE) is checked)', () => {
    const futura = src({ DATA_INICIO: '2027-01-01T00:00:00', DATA_FIM: null });
    expect(planoCopiaModelo([futura], [], 'M2', NOW)).toHaveLength(1);
  });

  it('keeps a row whose DATA_FIM is exactly now', () => {
    expect(planoCopiaModelo([src({ DATA_FIM: NOW })], [], 'M2', NOW)).toHaveLength(1);
  });

  it('skips expired rows', () => {
    const expirada = src({ DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: '2020-12-31T00:00:00' });
    expect(planoCopiaModelo([expirada], [], 'M2', NOW)).toEqual([]);
  });

  it('skips a row ending at midnight today (already past at 10:00)', () => {
    expect(planoCopiaModelo([src({ DATA_FIM: '2026-09-28T00:00:00' })], [], 'M2', NOW)).toEqual([]);
  });

  it('skips when the target has the same user, unit and type overlapping', () => {
    const alvo = perm({ MODELO_ID: 'M2', DATA_INICIO: '2026-05-01T00:00:00', DATA_FIM: '2026-05-31T00:00:00' });
    expect(planoCopiaModelo([src()], [alvo], 'M2', NOW)).toEqual([]);
  });

  it('skips when the only overlap is on a single shared instant', () => {
    const a = src({ DATA_INICIO: '2026-01-01T00:00:00', DATA_FIM: null });
    const alvo = perm({ MODELO_ID: 'M2', DATA_INICIO: '2025-01-01T00:00:00', DATA_FIM: '2026-01-01T00:00:00' });
    expect(planoCopiaModelo([a], [alvo], 'M2', NOW)).toEqual([]);
  });

  it('skips even when the overlapping target row is itself expired (NOT EXISTS has no validity filter)', () => {
    const alvo = perm({ MODELO_ID: 'M2', DATA_INICIO: '2026-02-01T00:00:00', DATA_FIM: '2026-03-01T00:00:00' });
    expect(planoCopiaModelo([src()], [alvo], 'M2', NOW)).toEqual([]);
  });

  it('copies when the target overlap is of another type (fix #6a: overlap is per type)', () => {
    const alvo = perm({ MODELO_ID: 'M2', TIPO_PERMISSAO_RF: 2 });
    expect(planoCopiaModelo([src()], [alvo], 'M2', NOW)).toHaveLength(1);
  });

  it('copies when the target overlap is in another unit', () => {
    const alvo = perm({ MODELO_ID: 'M2', UNIDADE_NEGOCIO_RF: 'DFI' });
    expect(planoCopiaModelo([src()], [alvo], 'M2', NOW)).toHaveLength(1);
  });

  it('copies when the target row of the same key does not overlap', () => {
    const alvo = perm({ MODELO_ID: 'M2', DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: '2020-12-31T00:00:00' });
    expect(planoCopiaModelo([src()], [alvo], 'M2', NOW)).toHaveLength(1);
  });

  it('compares with the target as it was before the copy: two overlapping source rows are both copied', () => {
    const a = src({ DATA_INICIO: '2026-01-01T00:00:00', DATA_FIM: null });
    const b = src({ DATA_INICIO: '2026-06-01T00:00:00', DATA_FIM: null });
    expect(planoCopiaModelo([a, b], [], 'M2', NOW)).toHaveLength(2);
  });

  it('copying a model onto itself inserts nothing', () => {
    const rows = [src(), src({ USERNAME: 'BIA' })];
    expect(planoCopiaModelo(rows, rows, 'M1', NOW)).toEqual([]);
  });
});

describe('planoCopiaUtilizador (BR-PERM-11 COPIAR_PERMISSOES_UTILIZADOR.OK)', () => {
  const alvo = { USERNAME: 'BIA', UNIDADE_NEGOCIO_RF: 'DFI' };
  const doAlvo = (over: Partial<Perm> = {}) => perm({ USERNAME: 'BIA', UNIDADE_NEGOCIO_RF: 'DFI', ...over });

  it('copies onto the target user and unit, keeping model, type and dates', () => {
    const a = perm({ MODELO_ID: 'M7', TIPO_PERMISSAO_RF: 3, DATA_FIM: '2027-01-01T00:00:00' });
    expect(planoCopiaUtilizador([a], [], alvo, NOW)).toEqual([
      { ...a, USERNAME: 'BIA', UNIDADE_NEGOCIO_RF: 'DFI' },
    ]);
  });

  it('skips expired rows', () => {
    expect(planoCopiaUtilizador([perm({ DATA_FIM: '2026-09-27T10:00:00' })], [], alvo, NOW)).toEqual([]);
  });

  it('keeps open-ended rows', () => {
    expect(planoCopiaUtilizador([perm({ DATA_FIM: null })], [], alvo, NOW)).toHaveLength(1);
  });

  it('skips when the target has the same model and type overlapping', () => {
    expect(planoCopiaUtilizador([perm()], [doAlvo({ DATA_INICIO: '2026-05-01T00:00:00' })], alvo, NOW)).toEqual([]);
  });

  it('copies when the target overlap is of another type', () => {
    expect(planoCopiaUtilizador([perm()], [doAlvo({ TIPO_PERMISSAO_RF: 2 })], alvo, NOW)).toHaveLength(1);
  });

  it('copies when the target overlap is on another model', () => {
    expect(planoCopiaUtilizador([perm()], [doAlvo({ MODELO_ID: 'M9' })], alvo, NOW)).toHaveLength(1);
  });

  it('copies when the target row of the same model and type does not overlap', () => {
    const velha = doAlvo({ DATA_INICIO: '2020-01-01T00:00:00', DATA_FIM: '2020-12-31T00:00:00' });
    expect(planoCopiaUtilizador([perm()], [velha], alvo, NOW)).toHaveLength(1);
  });

  it('copying a user onto itself inserts nothing', () => {
    const rows = [perm(), perm({ MODELO_ID: 'M2' })];
    expect(planoCopiaUtilizador(rows, rows, { USERNAME: 'ANA', UNIDADE_NEGOCIO_RF: 'DSI' }, NOW)).toEqual([]);
  });
});
