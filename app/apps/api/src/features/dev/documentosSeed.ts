import { DOCUMENTO_DETALHE } from '@gestsiid/shared';
import type { Row } from '../../lib/crud.ts';
import type { DocumentosSeed } from '../documentos/repo.ts';

/**
 * Dev-server documents for Gestão › Documentos (Step 7.1 fixture, used by the Step 7.3 e2e):
 * 300 generated rows, deterministic (index arithmetic, no random), covering every state label of
 * SVR_DOCUMENTOS_VW (D-16), every preset, the OFFLINE / ANULADO colours, comments, lote groups
 * (D1.A7 / R3.D25), attachments, parameters, queue rows with printers and log rows.
 */

const N = 300;
const ESTADOS = [null, 'WAIT', 'EXECUCAO', 'A EXECUTAR', 'ERRO', 'GERADO', 'IMPRESSO', 'WAIT IMP', 'EMAIL SENT', 'REENVIADO', 'ARQUIVADO', 'COPIADO'];
const MODELOS = ['E.E1', 'E.E12', 'R3.D28', 'O1.OD58', 'M.CARTA', 'I1.D55'];
const DISPONIBILIDADE = ['ONLINE', 'ONL', 'ONL', 'ONL', 'OFF', 'ANU', 'EDC'];
const PESSOAS = ['ANA', 'BIA', 'CARLOS', 'DEV'];

const dia = (i: number, h = 10) => {
  const d = new Date(Date.UTC(2026, 0, 1) + i * 86_400_000);
  return `${d.toISOString().slice(0, 10)}T${String(h).padStart(2, '0')}:00:00`;
};

export function documentosSeed(): DocumentosSeed {
  const vazio = Object.fromEntries(DOCUMENTO_DETALHE.map((c) => [c, null]));
  const documentos: Row[] = [];
  const parametros: Row[] = [];
  const comentarios: Row[] = [];
  const anexos: Row[] = [];
  const fila: Row[] = [];
  const erros: Row[] = [];
  let queueId = 1000;

  for (let i = 1; i <= N; i++) {
    const estado = ESTADOS[i % ESTADOS.length] ?? null;
    // 1..40: lote groups of 4 (D1.A7, R3.D25, D1.A7, R3.D25) in 10 lotes; the rest cycle MODELOS.
    const emLote = i <= 40;
    const modelo = emLote ? (i % 2 === 1 ? 'D1.A7' : 'R3.D25') : (MODELOS[i % MODELOS.length] ?? 'E.E1');
    const emBranco = i % 13 === 0; // no recipient, no reference
    documentos.push({
      ...vazio,
      ID: i,
      MODELO_ID: modelo,
      ESTADO: estado,
      REPORT_ID: 10 + (i % 3),
      AMBIENTE_ID: 'SIID_TESTES',
      IMPRESSORA_ID: String(1 + (i % 5)),
      DESTINATARIO: emBranco ? null : `CLIENTE ${i}`,
      MORADA: `Rua ${i}`,
      CODIGO_POSTAL: '1000-001',
      PAIS: 'PORTUGAL',
      N_REFERENCIA: emBranco ? null : `${i}/2026`,
      LOTE_ID: emLote ? 1 + Math.floor((i - 1) / 4) : null,
      LOTE_ORDEM: emLote ? 1 + ((i - 1) % 4) : null,
      TIPO_OUTPUT: 'PDF',
      NOME_OUTPUT: `DOC_${i}`,
      N_IMPRESSOES: i % 4,
      N_ANEXOS: 0,
      N_COPIAS: 1,
      N_VIAS: 1,
      CRIADO_POR: PESSOAS[i % PESSOAS.length],
      DATA_PEDIDO: dia(i % 270),
      DATA_EXECUCAO: estado === null ? null : dia(i % 270, 11),
      EXECUTADO_POR: estado === null ? null : 'SIID',
      ATRIBUTO1: `A1-${i}`,
      ATRIBUTO9: i % 17 === 0 ? 'A' : null,
      ATRIBUTO10: `A10-${i}`,
      ATRIB_ARQ_1: `ARQ-${i}`,
      ARQ_ID: i % 6 === 0 ? i : null,
      VERSAO: 1,
      DISPONIBILIDADE: DISPONIBILIDADE[i % DISPONIBILIDADE.length],
      TAMANHO_BYTES: 20_000 + i * 37,
      FATURACAO_ELECTRONICA: i % 3 === 0 ? 'S' : i % 3 === 1 ? 'N' : null,
    });

    parametros.push(
      { DOCUMENTO_ID: i, NOME: '_USER', VALOR: PESSOAS[i % PESSOAS.length], N_PARAMETRO: 1, MODELO_ID: modelo },
      { DOCUMENTO_ID: i, NOME: 'P_NMRECIBO', VALOR: String(500_000 + i), N_PARAMETRO: 2, MODELO_ID: modelo },
      { DOCUMENTO_ID: i, NOME: 'P_ANO', VALOR: String(2024 + (i % 3)), N_PARAMETRO: 3, MODELO_ID: modelo },
    );

    if (i % 7 === 0)
      comentarios.push({ DOCUMENTO_ID: i, COMENTARIO_ID: i, DATA: dia(i % 270, 12), USER_ID: 'ANA', COMENTARIO: `Comentário ${i}` });

    if (estado !== null) {
      const falhou = estado === 'ERRO';
      fila.push({
        DOCUMENTO_ID: i, ID: queueId++, TIPO_QUEUE_RF: 'EXECUCAO', DATA_PEDIDO: dia(i % 270), CRIADO_POR: 'SIID',
        DATA_EXECUCAO: dia(i % 270, 11), DATA_FINALIZACAO: dia(i % 270, 11), ESTADO: falhou ? 'ERRO' : 'TERMINADO',
        IMPRESSORA_ID: null, IMPRESSORA: null, RESULTADO: falhou ? 'ORA-20001: falha na geração' : null,
      });
      if (!falhou && i % 2 === 0)
        fila.push({
          DOCUMENTO_ID: i, ID: queueId++, TIPO_QUEUE_RF: 'IMPRESSAO', DATA_PEDIDO: dia(i % 270, 12), CRIADO_POR: 'ANA',
          DATA_EXECUCAO: dia(i % 270, 12), DATA_FINALIZACAO: dia(i % 270, 12), ESTADO: 'TERMINADO',
          IMPRESSORA_ID: null, IMPRESSORA: `Impressora ${1 + (i % 5)} - piso ${i % 3}`, RESULTADO: null,
        });
      if (modelo === 'E.E12')
        fila.push({
          DOCUMENTO_ID: i, ID: queueId++, TIPO_QUEUE_RF: 'EMAIL', DATA_PEDIDO: dia(i % 270, 13), CRIADO_POR: 'SIID',
          DATA_EXECUCAO: dia(i % 270, 13), DATA_FINALIZACAO: dia(i % 270, 13), ESTADO: 'TERMINADO',
          IMPRESSORA_ID: null, IMPRESSORA: null, RESULTADO: null, ATRIBUTO01: i % 4 === 0 ? 'sem-arroba' : `cliente${i}@exemplo.pt`,
        });
      if (i % 5 === 0) erros.push({ DOCUMENTO_ID: i, ID: i, DATA_ERRO: dia(i % 270, 13), DESCRICAO: 'DOCUMENTO REGERADO POR ANA' });
    }
  }

  // Attachments: 41 carries 42 and 43; 61 carries 62.
  anexos.push(
    { DOCUMENTO_ID: 41, ANEXODOC_ID: 42, TIPO_ANEXO_RF: 1 },
    { DOCUMENTO_ID: 41, ANEXODOC_ID: 43, TIPO_ANEXO_RF: 1 },
    { DOCUMENTO_ID: 61, ANEXODOC_ID: 62, TIPO_ANEXO_RF: 2 },
  );

  return {
    documentos,
    parametros,
    comentarios,
    anexos,
    fila,
    erros,
    recibos: [{ NMRECINUE: 900001, NMRECIBO: 500001 }],
    pessoas: [{ CDIDEPER: '501234567', CDPERSON: 7001 }],
    // Step 7.2 actions: O1.OD58 needs the regeneration password (G), R3.D28 goes to EDoc (W,
    // only even ids can be uploaded); printers 1..5 are the seed's IMPRESSORA_ID values.
    modelos: [
      { ID: 'E.E1', MODO_EXPEDICAO_RF: 'I' },
      { ID: 'E.E12', MODO_EXPEDICAO_RF: 'E' },
      { ID: 'R3.D28', MODO_EXPEDICAO_RF: 'W' },
      { ID: 'O1.OD58', MODO_EXPEDICAO_RF: 'G' },
      { ID: 'M.CARTA', MODO_EXPEDICAO_RF: 'M' },
      { ID: 'I1.D55', MODO_EXPEDICAO_RF: 'I' },
      { ID: 'D1.A7', MODO_EXPEDICAO_RF: 'I' },
      { ID: 'R3.D25', MODO_EXPEDICAO_RF: 'I' },
    ],
    impressorasValidas: ['1', '2', '3', '4', '5'],
    edocOk: documentos.filter((d) => d['MODELO_ID'] === 'R3.D28' && Number(d['ID']) % 2 === 0).map((d) => Number(d['ID'])),
  };
}
