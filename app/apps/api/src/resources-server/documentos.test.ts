import { describe, expect, it } from 'vitest';
import { AppError } from '../db/errors.ts';
import {
  contrapartida,
  grupoMatch,
  grupoSql,
  modeloPar,
  paramWhere,
  planoGrupo,
  PRESETS,
  usaLote,
} from './documentos.ts';

// FD_GESTAO_SIID filter buttons, PROCURAR and MOSTRAR_GRUPO (BR-DOC-03..07, BR-DOC-27, BR-DOC-28).

function erro400(fn: () => unknown): AppError {
  try {
    fn();
  } catch (e) {
    expect(e).toMatchObject({ statusCode: 400, code: 'VALIDACAO' });
    return e as AppError;
  }
  throw new Error('expected a 400 VALIDACAO');
}

describe('PRESETS — the six filter buttons', () => {
  it('has exactly the six Forms filters', () => {
    expect(Object.keys(PRESETS).sort()).toEqual(
      ['a-executar', 'em-branco', 'em-erro', 'execucao', 'nao-executados', 'todos'].sort(),
    );
  });

  it('copies the WHEN-BUTTON-PRESSED WHERE texts', () => {
    expect(PRESETS['nao-executados']).toBe('estado is null');
    expect(PRESETS['a-executar']).toContain("estado = 'A EXECUTAR' AND id >= (SELECT /*+ INDEX(Q) */ MIN(documento_id) FROM SVR_QUEUE Q WHERE ESTADO = 'EXECUCAO'");
    expect(PRESETS['execucao']).toContain("ESTADO IN ('ESPERA','ENQUEUED') AND TIPO_QUEUE_RF = 'EXECUCAO'");
    // The pressed button lists R3.D25/R/D27/R only (the enter-query copy also has R3.D28/R).
    expect(PRESETS['em-branco']).toContain("DECODE(MODELO_ID,'R3.D25',0,'R3.D25R',0,'R3.D27',0,'R3.D27R',0,1)) = 0");
    expect(PRESETS['em-branco']).not.toContain('R3.D28');
    expect(PRESETS['em-branco']).toContain("MODELO_ID != 'O2.OD69'");
  });

  it('Em erro is a subquery, never temp-table rows', () => {
    // MATERIALIZE: a plain IN subquery on the view never finished on the TEST schema (> 10 min).
    expect(PRESETS['em-erro']).toMatch(
      /^id IN \(WITH E AS \(SELECT \/\*\+ MATERIALIZE \*\/ DOCUMENTO_ID FROM \(SELECT DOCUMENTO_ID FROM SVR_QUEUE Q WHERE ESTADO = 'ERRO'/,
    );
    expect(PRESETS['em-erro']).toContain('NVL(DATA_EXECUCAO, DATA_FINALIZACAO) >');
    expect(Object.values(PRESETS).join(' ')).not.toMatch(/GESTAO_SIID_TMP/i);
  });

  it('Todos adds no condition', () => {
    expect(PRESETS['todos']).toBe('1 = 1');
  });
});

describe('paramWhere — Procurar por parâmetros (intersection)', () => {
  it('one pair → one IN over SVR_PARAMETROS_DOC_NOME_VW, values as binds', () => {
    expect(paramWhere([{ nome: 'P_NMRECIBO', valor: '12%' }])).toEqual({
      sql: 'ID IN (SELECT DOCUMENTO_ID FROM SVR_PARAMETROS_DOC_NOME_VW WHERE NOME = :en0 AND VALOR LIKE :ev0)',
      binds: { en0: 'P_NMRECIBO', ev0: '12%' },
    });
  });

  it('several pairs are ANDed; the model pattern goes on the first pair, as in the form', () => {
    const w = paramWhere(
      [
        { nome: 'A', valor: '1' },
        { nome: 'B', valor: '2' },
      ],
      'R3%',
    );
    expect(w.sql).toBe(
      'ID IN (SELECT DOCUMENTO_ID FROM SVR_PARAMETROS_DOC_NOME_VW WHERE NOME = :en0 AND VALOR LIKE :ev0 AND MODELO_ID LIKE :em) AND ' +
        'ID IN (SELECT DOCUMENTO_ID FROM SVR_PARAMETROS_DOC_NOME_VW WHERE NOME = :en1 AND VALOR LIKE :ev1)',
    );
    expect(w.binds).toEqual({ en0: 'A', ev0: '1', em: 'R3%', en1: 'B', ev1: '2' });
  });

  it('skips pairs with an empty value (the form skips rows without VALOR)', () => {
    expect(paramWhere([{ nome: 'A', valor: '' }, { nome: 'B', valor: '2' }]).binds).toEqual({ en0: 'B', ev0: '2' });
  });

  it('no non-empty value (with or without a model) is 400 VALIDACAO', () => {
    erro400(() => paramWhere([{ nome: 'A', valor: '' }]));
    erro400(() => paramWhere(undefined, 'R3%'));
  });
});

describe('Mostrar grupo — model pairs', () => {
  it('knows the eight grouped models', () => {
    for (const m of ['R3.D25', 'R3.D25R', 'R3.D27', 'R3.D27R', 'D1.A7', 'D1.A7R', 'D1.A5', 'D1.A5R'])
      expect(usaLote(m)).toBe(true);
    expect(usaLote('R3.D28')).toBe(false);
    expect(usaLote(null)).toBe(false);
  });

  it('R3 → D1 counterpart for the LOTE_ORDEM bounds; a D1 model stays itself', () => {
    expect(contrapartida('R3.D25')).toBe('D1.A7');
    expect(contrapartida('R3.D27R')).toBe('D1.A5R');
    expect(contrapartida('D1.A7')).toBe('D1.A7');
  });

  it('model pair, D1 first, from either side', () => {
    expect(modeloPar('R3.D25')).toEqual(['D1.A7', 'R3.D25']);
    expect(modeloPar('D1.A5R')).toEqual(['D1.A5R', 'R3.D27R']);
  });
});

describe('Mostrar grupo — plan and SQL', () => {
  const doc = { ID: 50, MODELO_ID: 'R3.D25', LOTE_ID: 7, LOTE_ORDEM: 3, DESTINATARIO: 'ANA' };

  it('any other model: the id list the repo read (parent + attachments), as the form built it', () => {
    const p = planoGrupo({ ...doc, MODELO_ID: 'E.E1' }, { ids: [40, 41, 43], min: null, max: null });
    expect(p).toEqual({ tipo: 'anexos', ids: [40, 41, 43] });
    expect(grupoSql(p)).toEqual({ sql: 'ID IN (:eg0, :eg1, :eg2)', binds: { eg0: 40, eg1: 41, eg2: 43 } });
  });

  it('grouped model with lote and ordem: same lote, LOTE_ORDEM within the D1 bounds', () => {
    const w = grupoSql(planoGrupo(doc, { ids: [50], min: 2, max: 5 }));
    expect(w).toEqual({
      sql: 'LOTE_ID = :egl AND LOTE_ORDEM >= :egmin AND LOTE_ORDEM < :egmax',
      binds: { egl: 7, egmin: 2, egmax: 5 },
    });
  });

  it('a missing bound adds no condition', () => {
    expect(grupoSql(planoGrupo(doc, { ids: [50], min: null, max: null })).sql).toBe('LOTE_ID = :egl');
  });

  it('no lote: LOTE_ID IS NULL, no recipient, the model pair', () => {
    const w = grupoSql(planoGrupo({ ...doc, LOTE_ID: null, DESTINATARIO: null }, { ids: [50], min: 1, max: null }));
    expect(w).toEqual({
      sql: 'LOTE_ID IS NULL AND LOTE_ORDEM >= :egmin AND DESTINATARIO IS NULL AND MODELO_ID IN (:egm0, :egm1)',
      binds: { egmin: 1, egm0: 'D1.A7', egm1: 'R3.D25' },
    });
  });

  it('no ordem: LOTE_ORDEM IS NULL and the model pair', () => {
    const w = grupoSql(planoGrupo({ ...doc, LOTE_ORDEM: null, DESTINATARIO: null }, { ids: [50], min: null, max: null }));
    expect(w.sql).toBe('LOTE_ID = :egl AND LOTE_ORDEM IS NULL AND DESTINATARIO IS NULL AND MODELO_ID IN (:egm0, :egm1)');
  });

  it('no lote but a recipient: the form built invalid SQL (no rows); here the conditions contradict', () => {
    const w = grupoSql(planoGrupo({ ...doc, LOTE_ID: null }, { ids: [50], min: null, max: null }));
    expect(w.sql).toContain('DESTINATARIO = :egd AND DESTINATARIO IS NULL');
    expect(w.binds).toMatchObject({ egd: 'ANA' });
  });

  it('grupoMatch is the in-memory twin of grupoSql', () => {
    const lote = planoGrupo(doc, { ids: [50], min: 2, max: 5 });
    const m = grupoMatch(lote);
    expect(m({ ID: 1, LOTE_ID: 7, LOTE_ORDEM: 2 })).toBe(true);
    expect(m({ ID: 2, LOTE_ID: 7, LOTE_ORDEM: 5 })).toBe(false);
    expect(m({ ID: 3, LOTE_ID: 8, LOTE_ORDEM: 3 })).toBe(false);

    const semLote = planoGrupo({ ...doc, LOTE_ID: null, LOTE_ORDEM: null, DESTINATARIO: null }, { ids: [50], min: null, max: null });
    const s = grupoMatch(semLote);
    expect(s({ ID: 4, LOTE_ID: null, LOTE_ORDEM: null, DESTINATARIO: null, MODELO_ID: 'D1.A7' })).toBe(true);
    expect(s({ ID: 5, LOTE_ID: null, LOTE_ORDEM: null, DESTINATARIO: 'X', MODELO_ID: 'D1.A7' })).toBe(false);
    expect(s({ ID: 6, LOTE_ID: null, LOTE_ORDEM: null, DESTINATARIO: null, MODELO_ID: 'D1.A5' })).toBe(false);

    const anexos = grupoMatch({ tipo: 'anexos', ids: [40, 41] });
    expect([40, 41, 42].map((ID) => anexos({ ID }))).toEqual([true, true, false]);
  });
});
