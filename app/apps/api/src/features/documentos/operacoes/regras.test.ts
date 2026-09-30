import { pt } from '@gestsiid/shared';
import { describe, expect, it } from 'vitest';
import {
  anulado,
  auditoria,
  blocoClonar,
  CANCELAR_ESTADOS,
  EMAIL_RE,
  MSG,
  NOME_PARAMETRO_RE,
  motivoImpressao,
  motivoRearquivar,
  motivoReenviarEdoc,
  motivoReenviarEmail,
  motivoRegerar,
  PARAMETROS_RESERVADOS,
  precisaPassword,
  type DocOperacao,
} from './regras.ts';

/**
 * Pure rules of the Documentos batch operations (Step 7.2), pinned to the Forms program units
 * REIMPRIMIR / REGERAR / REENVIAR / REENVIA_EMAIL / REARQUIVAR / CLONAR and to the D-28 fixes.
 * The Portuguese texts are byte-exact copies of BUSINESS_RULES.md §3 (#7–#25).
 */

const d = (over: Partial<DocOperacao> = {}): DocOperacao => ({
  ID: 1,
  ATRIBUTO9: null,
  DISPONIVEL_RF: 'ONLINE',
  N_IMPRESSOES: 0,
  ARQ_ID: null,
  MODELO_ID: 'E.E1',
  LOTE_ID: null,
  MODO_EXPEDICAO_RF: 'I',
  IMPRESSAO_TERMINADA: 0,
  ...over,
});

describe('pt.documentos — catalogue texts (BR §3 #7–#25, byte-exact)', () => {
  it('MSG is the shared catalogue', () => {
    expect(MSG).toBe(pt.documentos);
  });

  it.each([
    ['desejaImprimir', 'Deseja imprimir os documentos selecionados?'],
    ['desejaRegerar', 'Deseja regerar os documentos selecionados?'],
    ['desejaAnular', 'Deseja anular os documentos selecionados?'],
    ['desejaCancelar', 'Deseja cancelar os documentos selecionados?'],
    ['desejaReenviar', 'Deseja reenviar os documentos selecionados?'],
    ['desejaRearquivar', 'Deseja re-arquivar os documentos selecionados?'],
    ['desejaCancelarPedido', 'Deseja cancelar este pedido?'],
    ['inserirPassword', 'Insira a password para regerar o(s) documento(s) seleccionado(s):'],
    ['impressoraAssociada', 'Imprimir documentos para a impressora associada'],
    ['outraImpressora', 'Outra impressora:'],
    ['impressosAnulados', 'Não foram impressos os documentos com os seguintes spool_id, por se encontrarem anulados:'],
    ['segundaViaSemImpressao', 'Para imprimir 2ª Via é necessário que o documento já tenha sido impresso.'],
    ['regeradosAnulados', 'Não foram Regerados os documentos com os seguintes spool_id, por se encontrarem anulados:'],
    ['reenviadosNaoEdoc', 'Não foram Reenviados os documentos com os seguintes spool_id, por não serem documentos para o EDoc:'],
    ['reenviadosNaoEmail', 'Não foram Reenviados os documentos com os seguintes spool_id, por não serem documentos de Email:'],
    ['rearquivadosNaoArquivo', 'Não foram Re-Arquivados os documentos com os seguintes spool_id, por não serem documentos para ARQUIVO:'],
    ['suspenderSeleccionados', 'Suspender documentos seleccionados'],
    ['suspenderTodos', 'Suspender todos os documentos em espera'],
    ['retomarSeleccionados', 'Retomar documentos seleccionados'],
    ['retomarTodos', 'Retomar todos os documentos suspensos'],
    ['cancelarTodosEstados', 'Cancelar em todos os estados'],
    ['documentoNaoEncontrado', 'Documento não encontrado.'],
    ['impressoraInvalida', 'Impressora inválida.'],
    ['pedidoNaoCancelavel', 'O pedido já não está em espera nem terminado.'],
    ['anularFalhou', 'A anulação não foi registada pelo servidor.'],
    ['seleccaoExcessiva', 'A selecção excede 10 000 documentos. Restrinja a consulta.'],
    ['clonarFalhou', 'O servidor não criou o documento. Consulte o log do documento de origem.'],
  ])('%s', (chave, texto) => {
    expect((pt.documentos as Record<string, string>)[chave]).toBe(texto);
  });

  it('NAO_TEM_REGISTOS text (D-26)', () => {
    expect(pt.naoExistemDocumentosSeleccionados).toBe('Não existem documentos seleccionados.');
  });
});

describe('anulado (A-06: ATRIBUTO9 = A OR DISPONIVEL_RF = ANU)', () => {
  it('ATRIBUTO9 A', () => expect(anulado(d({ ATRIBUTO9: 'A' }))).toBe(true));
  it('DISPONIVEL_RF ANU', () => expect(anulado(d({ DISPONIVEL_RF: 'ANU' }))).toBe(true));
  it('neither', () => expect(anulado(d())).toBe(false));
  it('other ATRIBUTO9 values are not annulled', () => expect(anulado(d({ ATRIBUTO9: 'B', DISPONIVEL_RF: 'OFF' }))).toBe(false));
});

describe('precisaPassword (BR-DOC-13)', () => {
  it('a document with a finished IMPRESSAO request', () => {
    expect(precisaPassword([d(), d({ IMPRESSAO_TERMINADA: 1 })])).toBe(true);
  });
  it('a model with MODO_EXPEDICAO_RF G', () => {
    expect(precisaPassword([d({ MODO_EXPEDICAO_RF: 'G' })])).toBe(true);
  });
  it('an annulled printed document still counts (the 428 is decided over the whole selection)', () => {
    expect(precisaPassword([d({ ATRIBUTO9: 'A', IMPRESSAO_TERMINADA: 2 })])).toBe(true);
  });
  it('never printed, non-G → false', () => {
    expect(precisaPassword([d(), d({ MODO_EXPEDICAO_RF: 'W' }), d({ MODO_EXPEDICAO_RF: null })])).toBe(false);
  });
  it('empty → false', () => expect(precisaPassword([])).toBe(false));
});

describe('motivoImpressao (BR-DOC-10/11/12, D-28 fix)', () => {
  it.each(['IMPRESSAO', '2.VIA', 'COPIA'] as const)('%s: annulled by ATRIBUTO9 → impressosAnulados', (tipo) => {
    expect(motivoImpressao(tipo, d({ ATRIBUTO9: 'A', N_IMPRESSOES: 3 }))).toBe(MSG.impressosAnulados);
  });
  it.each(['IMPRESSAO', '2.VIA', 'COPIA'] as const)('%s: annulled by DISPONIVEL_RF → impressosAnulados', (tipo) => {
    expect(motivoImpressao(tipo, d({ DISPONIVEL_RF: 'ANU', N_IMPRESSOES: 3 }))).toBe(MSG.impressosAnulados);
  });
  it('IMPRESSAO of a never-printed document → null', () => {
    expect(motivoImpressao('IMPRESSAO', d({ N_IMPRESSOES: 0 }))).toBeNull();
  });
  it('COPIA of a never-printed document → null (no prior-print requirement)', () => {
    expect(motivoImpressao('COPIA', d({ N_IMPRESSOES: 0 }))).toBeNull();
  });
  it('2.VIA with N_IMPRESSOES 0 → segundaViaSemImpressao', () => {
    expect(motivoImpressao('2.VIA', d({ N_IMPRESSOES: 0 }))).toBe(MSG.segundaViaSemImpressao);
  });
  it('2.VIA with N_IMPRESSOES null → segundaViaSemImpressao', () => {
    expect(motivoImpressao('2.VIA', d({ N_IMPRESSOES: null }))).toBe(MSG.segundaViaSemImpressao);
  });
  it('2.VIA with N_IMPRESSOES 3 → null', () => {
    expect(motivoImpressao('2.VIA', d({ N_IMPRESSOES: 3 }))).toBeNull();
  });
  it('2.VIA: annulled beats the never-printed check', () => {
    expect(motivoImpressao('2.VIA', d({ ATRIBUTO9: 'A', N_IMPRESSOES: 0 }))).toBe(MSG.impressosAnulados);
  });
});

describe('motivoRegerar (BR-DOC-13)', () => {
  it('annulled → regeradosAnulados', () => {
    expect(motivoRegerar(d({ ATRIBUTO9: 'A' }))).toBe(MSG.regeradosAnulados);
    expect(motivoRegerar(d({ DISPONIVEL_RF: 'ANU' }))).toBe(MSG.regeradosAnulados);
  });
  it('printed or G is no reason to skip (the password is the gate, not a skip)', () => {
    expect(motivoRegerar(d({ IMPRESSAO_TERMINADA: 5, MODO_EXPEDICAO_RF: 'G' }))).toBeNull();
  });
});

describe('motivoReenviarEdoc (BR-DOC-17)', () => {
  it('W → null', () => expect(motivoReenviarEdoc('W')).toBeNull());
  it.each(['I', 'G', null])('%s → reenviadosNaoEdoc', (modo) => {
    expect(motivoReenviarEdoc(modo)).toBe(MSG.reenviadosNaoEdoc);
  });
});

describe('motivoReenviarEmail / EMAIL_RE (BR-DOC-18, D-05)', () => {
  it('a valid address → null', () => {
    expect(motivoReenviarEmail('ana.silva@exemplo.pt')).toBeNull();
    expect(EMAIL_RE.test('a@b.c')).toBe(true);
  });
  it.each([null, '', 'semarroba', 'a@b', 'a b@c.pt'])('%j → reenviadosNaoEmail', (email) => {
    expect(motivoReenviarEmail(email)).toBe(MSG.reenviadosNaoEmail);
  });
  it('EMAIL_RE rejects two @', () => expect(EMAIL_RE.test('a@@b.pt')).toBe(false));
});

describe('motivoRearquivar (BR-DOC-19)', () => {
  // Forms (REARQUIVAR button): `DECODE(NVL(ARQ_ID, 0), 0, 'N', 'S')` — a NULL **and** a 0 ARQ_ID
  // both mean "não é documento para ARQUIVO". The spec writes `d.ARQ_ID == null`; the test pins
  // the Forms rule (0 is skipped too). Flagged in the report.
  it('ARQ_ID null → rearquivadosNaoArquivo', () => {
    expect(motivoRearquivar(d({ ARQ_ID: null }))).toBe(MSG.rearquivadosNaoArquivo);
  });
  it('ARQ_ID 0 → rearquivadosNaoArquivo (Forms NVL(ARQ_ID,0) = 0)', () => {
    expect(motivoRearquivar(d({ ARQ_ID: 0 }))).toBe(MSG.rearquivadosNaoArquivo);
  });
  it('ARQ_ID 5 → null', () => expect(motivoRearquivar(d({ ARQ_ID: 5 }))).toBeNull());
});

describe('auditoria — ERR_ERROS_SIID.DESCRICAO texts (BR-DOC-36, D-28)', () => {
  it('regerado keeps the trailing space of the Forms FORMS_DDL string', () => {
    expect(auditoria.regerado('JOAO')).toBe('DOCUMENTO REGERADO POR JOAO ');
  });
  it('reenviado says REENVIADO (D-28 fix of the Forms REGERADO)', () => {
    expect(auditoria.reenviado('JOAO')).toBe('DOCUMENTO REENVIADO POR JOAO');
  });
  it('email keeps the missing space before PARA (sic, REENVIA_EMAIL)', () => {
    expect(auditoria.email('JOAO', 'ana@exemplo.pt')).toBe('DOCUMENTO REENVIADO POR EMAIL POR JOAOPARA ana@exemplo.pt');
  });
  it('arquivado', () => {
    expect(auditoria.arquivado('JOAO')).toBe('DOCUMENTO ARQUIVADO POR JOAO');
  });
});

describe('blocoClonar (BR-DOC-25, D-17, D-20)', () => {
  it('0 parameters: only P_USUARIO, _USER, EXECUTA and GET_ID_EXECUCAO', () => {
    expect(blocoClonar(0)).toBe(
      "BEGIN PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_USUARIO', :usuario); " +
        "PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('_USER', :ambiente); " +
        'PKG_DOCUMENTOS_SVR.EXECUTA(:modelo); :id := PKG_DOCUMENTOS_SVR.GET_ID_EXECUCAO; END;',
    );
  });
  it('2 parameters: :n0/:v0 and :n1/:v1 first, in order', () => {
    expect(blocoClonar(2)).toBe(
      'BEGIN PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING(:n0, :v0); ' +
        'PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING(:n1, :v1); ' +
        "PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('P_USUARIO', :usuario); " +
        "PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING('_USER', :ambiente); " +
        'PKG_DOCUMENTOS_SVR.EXECUTA(:modelo); :id := PKG_DOCUMENTOS_SVR.GET_ID_EXECUCAO; END;',
    );
  });
});

describe('NOME_PARAMETRO_RE (clone parameter names are identifiers: the package concatenates them into SQL)', () => {
  it.each(['P_ANO', 'P_NMRECIBO', 'X', 'A1_B2', 'P'.repeat(30)])('%s is accepted', (nome) => {
    expect(NOME_PARAMETRO_RE.test(nome)).toBe(true);
  });
  it.each(["P'ANO", 'P ANO', 'P-ANO', 'P.ANO', '', 'P'.repeat(31), 'p_ano', 'P_ANO;', 'P,X'])('%j is refused', (nome) => {
    expect(NOME_PARAMETRO_RE.test(nome)).toBe(false);
  });
});

describe('constants', () => {
  it('PARAMETROS_RESERVADOS: the names the clone request may not set', () => {
    expect([...PARAMETROS_RESERVADOS]).toEqual(['P_ID', '_USER', 'P_USUARIO']);
  });
  it('CANCELAR_ESTADOS: the five states of BR-DOC-16, in the Forms order', () => {
    expect([...CANCELAR_ESTADOS]).toEqual(['TERMINADO', 'ESPERA', 'ENQUEUED', 'EM EXECUCAO', 'ERRO']);
  });
});
