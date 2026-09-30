import { defineResource } from '../resource.ts';

/**
 * `FD_GESTAO_SIID` / `FD_GESTAO_SIID_USER` main block SVR_DOCUMENTOS over `SVR_DOCUMENTOS_VW`
 * (ARCHITECTURE §4.1 "Documentos specifics"). Read-only: operations are named actions (Step 7.2).
 * The six filter presets and the Mostrar grupo / parameter-search SQL are server-only
 * (`apps/api/src/resources-server/documentos.ts`).
 *
 * Columns = the visible list items (form x-order) plus what POST-QUERY needs for the row colours
 * (`DISPONIBILIDADE`, `ATRIBUTO9`) and `REPORT_ID` (PROCURAR_PARAMETROS copies it). `COR` and
 * `COMENTARIO` are the POST-QUERY results: visual attribute OFFLINE / ANULADO and the `***` marker.
 * Sort keys = the ORDENACAO_DOCUMENTOS buttons (D-19/A-05: FATURACAO_ELECTRONICA); USER sorts by
 * Spool (`ID`) only (D-08, A-08). Default = WHEN-NEW-FORM-INSTANCE `Ordenar_Por('ID','DESC')`.
 */

// Button REFERENCIA: Ordenar_Por(<this>, 'DESC'), copied verbatim from FD_GESTAO_SIID_fmb.xml.
const REFERENCIA_ORDEM =
  "TO_NUMBER(REPLACE(TRANSLATE (DECODE( SIGN(LENGTH(N_REFERENCIA) - 2 * INSTR(N_REFERENCIA,'/') + 1),1,SUBSTR(N_REFERENCIA,INSTR(N_REFERENCIA,'/')+1),-1, SUBSTR(N_REFERENCIA,1,INSTR(N_REFERENCIA,'/')-1), N_REFERENCIA),'0123456789-/','0123456789  '), ' ', ''))";

const TEXTO = ['eq', 'like', 'null', 'notnull'] as const;
const NUMERO = ['eq', 'null', 'notnull'] as const;

export const documentos = defineResource({
  name: 'documentos',
  source: 'SVR_DOCUMENTOS_VW',
  columns: {
    ID: { type: 'number', label: 'Id', filter: ['eq', 'in'], sort: true },
    DATA_PEDIDO: { type: 'date', label: 'Data Pedido', filter: ['eq', 'from', 'to', 'null', 'notnull'], sort: true },
    MODELO_ID: { type: 'text', label: 'Modelo', filter: TEXTO, sort: true },
    ESTADO: { type: 'text', label: 'Estado', filter: TEXTO, sort: true },
    CRIADO_POR: { type: 'text', label: 'Criado Por', filter: TEXTO, sort: true },
    N_REFERENCIA: { type: 'text', label: 'Referência', filter: TEXTO },
    DESTINATARIO: { type: 'text', label: 'Destinatário', filter: TEXTO, sort: true },
    FATURACAO_ELECTRONICA: { type: 'code', label: 'FE', filter: ['eq', 'null', 'notnull'], sort: true },
    LOTE_ID: { type: 'number', label: 'Lote', filter: NUMERO },
    LOTE_ORDEM: { type: 'number', label: 'Ordem', filter: NUMERO },
    REPORT_ID: { type: 'number', label: 'Report' },
    DISPONIBILIDADE: { type: 'code', label: 'Disponibilidade', filter: ['eq'] },
    ATRIBUTO9: { type: 'text', label: 'Atributo 9' },
    COR: {
      type: 'code',
      label: 'Cor',
      expr: "CASE WHEN DISPONIBILIDADE = 'OFF' THEN 'OFFLINE' WHEN DISPONIBILIDADE = 'ANU' OR ATRIBUTO9 = 'A' THEN 'ANULADO' END",
    },
    COMENTARIO: {
      type: 'code',
      label: 'Comentários',
      expr: "CASE WHEN EXISTS (SELECT 1 FROM SVR_DOCUMENTO_COMENTARIOS C WHERE C.DOCUMENTO_ID = SVR_DOCUMENTOS_VW.ID) THEN '***' END",
    },
  },
  sortAliases: {
    LOTE: ['LOTE_ID', 'LOTE_ORDEM'],
    REFERENCIA: [REFERENCIA_ORDEM],
  },
  sortRoles: { USER: ['ID'] },
  defaultSort: [{ column: 'ID', direction: 'desc' }],
  tiebreak: 'ID',
  roles: { read: ['ADM', 'USER'], write: [] },
});

const serie = (prefixo: string, de: number, ate: number) =>
  Array.from({ length: ate - de + 1 }, (_, i) => `${prefixo}${de + i}`);

/** DETALHES_DOCUMENTO items (a copy of the master row), `GET /api/documentos/:id` for ADM. */
export const DOCUMENTO_DETALHE = [
  'ESTADO', 'ID', 'MODELO_ID', 'REPORT_ID', 'AMBIENTE_ID', 'IMPRESSORA_ID', 'DESTINATARIO', 'MORADA',
  'CODIGO_POSTAL', 'PAIS', 'LOTE_ID', 'TIPO_OUTPUT', 'NOME_OUTPUT', 'N_REFERENCIA', 'N_IMPRESSOES',
  'N_ANEXOS', 'N_COPIAS', 'N_CAPAS', 'ULTIMA_VIA_POR', 'N_VIAS', 'EXECUTADO_POR', 'DATA_EXECUCAO',
  'IMPRESSO_POR', 'DATA_IMPRESSAO', 'CRIADO_POR', 'DATA_PEDIDO', 'LOTE_ORDEM', ...serie('ATRIBUTO', 1, 25),
  'VERSAO', 'DISPONIBILIDADE', 'TAMANHO_BYTES', 'EDOC_ID', 'ARQ_ID', 'REGISTO_EDOC', 'REGISTO_ARQUIVO',
  'DATA_ARQUIVO', ...serie('ATRIB_ARQ_', 1, 20),
] as const;

/** Columns USER never receives (D-08, ARCHITECTURE §5). */
export const DOCUMENTO_DETALHE_SO_ADM: readonly string[] = [
  ...serie('ATRIBUTO', 5, 8), ...serie('ATRIBUTO', 10, 25), ...serie('ATRIB_ARQ_', 1, 20),
  'ARQ_ID', 'EDOC_ID', 'REGISTO_ARQUIVO', 'REGISTO_EDOC', 'DATA_ARQUIVO',
];

/** Date columns of the detail (selected as `YYYY-MM-DDTHH:MM:SS` text). */
export const DOCUMENTO_DETALHE_DATAS: readonly string[] = ['DATA_EXECUCAO', 'DATA_IMPRESSAO', 'DATA_PEDIDO', 'DATA_ARQUIVO'];
