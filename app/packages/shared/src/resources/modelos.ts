import { defineResource, type ColumnDef } from '../resource.ts';

/**
 * `FD_CONFIGURACAO_MODELOS` (STRUCTURE.md §3, BR-MOD-01..14): master `DOC_MODELOS_DOCUMENTO` and
 * one detail resource per tab. Routes: `apps/api/src/features/modelos/routes.ts`
 * (ARCHITECTURE §10.1 "modelos"). Audit columns are set by the API from the session.
 */

const audit = {
  CRIADO_POR: { type: 'text', label: 'Criado Por' },
  DATA_CRIACAO: { type: 'date', label: 'Data Criação' },
  ACTUALIZADO_POR: { type: 'text', label: 'Actualizado Por' },
  DATA_ACTUALIZACAO: { type: 'date', label: 'Data Actualização' },
} as const satisfies Record<string, ColumnDef>;

const DATAS = ['eq', 'from', 'to', 'null', 'notnull'] as const;

/**
 * Block `DOC_MODELOS_DOCUMENTO` (Insert false, Delete false: a model is only created by "Clonar",
 * never deleted). The grid, "Alterar Modelo" (DESCRICAO, N_COPIAS, FORMA_CONTROLO_RF, DATA_INICIO,
 * DATA_FIM — BR-MOD-02) and "Código Barras" (the six BARCODE_* — BR-MOD-12) all save through
 * `PUT /api/modelos/:rid` with their own column subset. The CONSULTA header buttons are the
 * sortable columns; "Todos" clears the filters (SPA). Selects: FORMA_CONTROLO_RF is a static list
 * C/V/U/UV; the MODO_* / STAMP / BARCODE_TYPE lists are domains (`MODELOS_DOMINIOS`).
 */
export const modelos = defineResource({
  name: 'modelos',
  source: 'DOC_MODELOS_DOCUMENTO',
  columns: {
    ID: { type: 'code', label: 'Id', filter: ['eq', 'like'], sort: true, maxLength: 10 },
    DESCRICAO: {
      type: 'text',
      label: 'Descrição',
      filter: ['eq', 'like', 'null', 'notnull'],
      sort: true,
      edit: true,
      maxLength: 240,
    },
    N_COPIAS: {
      type: 'number',
      label: 'Nº Cópias',
      filter: ['eq', 'null', 'notnull'],
      sort: true,
      edit: true,
    },
    FORMA_CONTROLO_RF: {
      type: 'code',
      label: 'Unicidade',
      filter: ['eq', 'in'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 2,
    },
    DATA_INICIO: { type: 'date', label: 'Data Início', filter: DATAS, sort: true, edit: true },
    DATA_FIM: { type: 'date', label: 'Data Fim', filter: DATAS, sort: true, edit: true },
    MODO_EXPEDICAO_RF: {
      type: 'code',
      label: 'Modo Expedição',
      filter: ['eq', 'in'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 2,
    },
    STAMP: {
      type: 'code',
      label: 'Código Barras',
      filter: ['eq', 'in'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 1,
    },
    MODO_CERTIFICADO_RF: {
      type: 'code',
      label: 'Modo Certificado',
      filter: ['eq', 'in'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 5,
    },
    GENERICO_ID: {
      type: 'code',
      label: 'Tipo Genérico',
      filter: ['eq', 'in', 'null', 'notnull'],
      sort: true,
      edit: true,
      maxLength: 10,
    },
    MODO_PROTECAO_RF: {
      type: 'code',
      label: 'Modo Proteção',
      filter: ['eq', 'in'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 5,
    },
    TIPO_DOCUMENTO_RF: { type: 'code', label: 'Tipo Documento', filter: ['eq'] },
    REPORT_ID: { type: 'number', label: 'Report', filter: ['eq'] },
    N_ANEXOS: { type: 'number', label: 'Nº Anexos' },
    MAX_IMPRESSOES: { type: 'number', label: 'Máx. Impressões' },
    BARCODE_TYPE: {
      type: 'code',
      label: 'Tipo de código de barras',
      edit: true,
      maxLength: 20,
    },
    BARCODE_FORMAT: { type: 'text', label: 'Formato', edit: true, maxLength: 240 },
    BARCODE_WEIGHT: { type: 'number', label: 'Largura (cm)', edit: true },
    BARCODE_HEIGHT: { type: 'number', label: 'Altura (cm)', edit: true },
    BARCODE_X_POSITION: { type: 'number', label: 'Posição X', edit: true },
    BARCODE_Y_POSITION: { type: 'number', label: 'Posição Y', edit: true },
    ...audit,
  },
  defaultSort: [
    { column: 'ID', direction: 'asc' },
    { column: 'DATA_INICIO', direction: 'asc' },
  ],
  tiebreak: 'ID',
  roles: { read: ['ADM'], write: ['ADM'] },
});

/**
 * `DBMS_LOB.SUBSTR(IMAGEM, 4, 1)` compared with the signatures of WHEN-NEW-RECORD-INSTANCE
 * (BR-MOD-06); no image or an unknown signature → NULL, as in the form (its ELSE never set the item).
 */
const TIPO_IMAGEM_SQL =
  "CASE WHEN RAWTOHEX(DBMS_LOB.SUBSTR(IMAGEM, 4, 1)) IN ('49492A00', '4D4D002A') " +
  "OR INSTR(RAWTOHEX(DBMS_LOB.SUBSTR(IMAGEM, 4, 1)), '424D') > 0 THEN 'BMP' " +
  "ELSE DECODE(RAWTOHEX(DBMS_LOB.SUBSTR(IMAGEM, 4, 1)), 'FFD8FFE0', 'JPEG', '89504E47', 'PNG', " +
  "'47494638', 'GIF', '504E4745', 'TIFF') END";

/**
 * Tab "Secções" (`DOC_SECCOES_DOCUMENTO`, PK MODELO_ID + TIPOSEC_ID + ALINEA). The CONSULTA_SECCOES
 * buttons sort `TIPOSEC_ID, ALINEA` / `ALINEA, TIPOSEC_ID`. `TIPOCNTD_ID` is a required select over
 * `DOC_TIPOS_CONTEUDO` with the form's MAX pre-selected (D-28). The IMAGEM BLOB is never a column
 * (Step 6.2 image routes); `TIPO_IMAGEM` is decoded from its first bytes.
 */
export const modelosSeccoes = defineResource({
  name: 'modelos-seccoes',
  source: 'DOC_SECCOES_DOCUMENTO',
  parentKeys: ['MODELO_ID'],
  columns: {
    MODELO_ID: { type: 'code', label: 'Modelo', filter: ['eq'], maxLength: 10 },
    TIPOSEC_ID: {
      type: 'code',
      label: 'Id Secção',
      filter: ['eq', 'like'],
      sort: true,
      insertOnly: true,
      required: true,
      maxLength: 10,
    },
    ALINEA: {
      type: 'number',
      label: 'Alínea',
      filter: ['eq'],
      sort: true,
      insertOnly: true,
      required: true,
    },
    TITULO: { type: 'text', label: 'Título', filter: ['eq', 'like'], edit: true, maxLength: 60 },
    TEXTO: { type: 'text', label: 'Texto', filter: ['like'], edit: true, maxLength: 2000 },
    TIPOCNTD_ID: { type: 'number', label: 'Tipo de Conteúdo', edit: true, required: true },
    FORMULA_ID: { type: 'number', label: 'Fórmula' },
    TIPO_IMAGEM: { type: 'code', label: 'Tipo Imagem', expr: TIPO_IMAGEM_SQL },
    ...audit,
  },
  defaultSort: [
    { column: 'TIPOSEC_ID', direction: 'asc' },
    { column: 'ALINEA', direction: 'asc' },
  ],
  tiebreak: 'ALINEA',
  roles: { read: ['ADM'], write: ['ADM'] },
});

const atributos = Object.fromEntries(
  [1, 2, 3, 4, 5, 6, 7, 8].map((n) => [
    `ATRIBUTO${n}`,
    { type: 'text', label: `Atributo${n}`, filter: ['eq', 'like'], edit: true, maxLength: 100 },
  ]),
) as Record<
  `ATRIBUTO${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`,
  { type: 'text'; label: string; filter: ['eq', 'like']; edit: true; maxLength: 100 }
>;

/**
 * Detail of a section (`DOC_CONDICOES_APR`, relation DOC_SECCOES_DOC_DOC_CONDICOES_). `CONTEXTO_ID`
 * is a required select over `DOC_CONTEXTOS_APR` with the form's MAX pre-selected (D-28). The
 * ATRIBUTO1..8 are plain fields (D-23).
 */
export const modelosCondicoes = defineResource({
  name: 'modelos-condicoes',
  source: 'DOC_CONDICOES_APR',
  parentKeys: ['MODELO_ID', 'TIPOSEC_ID', 'ALINEA'],
  columns: {
    MODELO_ID: { type: 'code', label: 'Modelo', filter: ['eq'], maxLength: 10 },
    TIPOSEC_ID: { type: 'code', label: 'Secção', filter: ['eq'], maxLength: 10 },
    ALINEA: { type: 'number', label: 'Alínea', filter: ['eq'] },
    DATA_INICIO: {
      type: 'date',
      label: 'Data Inicio',
      filter: DATAS,
      sort: true,
      edit: true,
      required: true,
    },
    DATA_FIM: { type: 'date', label: 'Data Fim', filter: DATAS, sort: true, edit: true },
    CDUNIECO: {
      type: 'number',
      label: 'U.E.',
      filter: ['eq'],
      sort: true,
      edit: true,
      required: true,
    },
    CDRAMO: {
      type: 'code',
      label: 'Ramo',
      filter: ['eq', 'like'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 10,
    },
    CONTEXTO_ID: {
      type: 'number',
      label: 'Contexto',
      filter: ['eq'],
      sort: true,
      edit: true,
      required: true,
    },
    ...atributos,
    ...audit,
  },
  defaultSort: [
    { column: 'CONTEXTO_ID', direction: 'asc' },
    { column: 'CDUNIECO', direction: 'asc' },
    { column: 'CDRAMO', direction: 'asc' },
    { column: 'DATA_INICIO', direction: 'asc' },
  ],
  tiebreak: 'DATA_INICIO',
  roles: { read: ['ADM'], write: ['ADM'] },
});

/**
 * Tab "Parâmetros" (block `SVR_PARAMETROS_REPORT`, read by `GET …/parametros-report`, BR-MOD-08):
 * the report's parameters with the model's current default value. Not a table of its own: a row
 * saves through `PUT …/parametros-report/:N_PARAMETRO/omissao` (BR-MOD-09), `_rid` = N_PARAMETRO.
 * OBRIGATORIO / VALIDO / CHECK_UNIQUE are the form's read-only check boxes; DETALHES = `***` when
 * the parameter has a history.
 */
export const modelosParametrosReport = defineResource({
  name: 'modelos-parametros-report',
  source: 'SVR_PARAMETROS_REPORT',
  columns: {
    N_PARAMETRO: { type: 'number', label: 'Nº Parâmetro' },
    NOME: { type: 'text', label: 'Nome' },
    NOME_CONSULTA: { type: 'text', label: 'Nome Consulta', edit: true, maxLength: 240 },
    OBRIGATORIO: { type: 'code', label: 'Obrigatório' },
    VALIDO: { type: 'code', label: 'Válido' },
    CHECK_UNIQUE: { type: 'code', label: 'Unicidade' },
    CONSULTA_ONLINE: { type: 'code', label: 'Consulta', edit: true, maxLength: 1 },
    VALOR: { type: 'text', label: 'Valor por Omissão', edit: true, maxLength: 240 },
    DATA_INICIO: { type: 'date', label: 'Inicio Vigência', edit: true },
    DATA_FIM: { type: 'date', label: 'Fim Vigência', edit: true },
    DETALHES: { type: 'code', label: 'Histórico' },
  },
  defaultSort: [{ column: 'N_PARAMETRO', direction: 'asc' }],
  tiebreak: 'N_PARAMETRO',
  roles: { read: ['ADM'], write: ['ADM'] },
});

/**
 * "Histórico" of a report parameter's default value (`DOC_PARAMETROS_OMISSAO`, PK MODELO_ID +
 * N_PARAMETRO + DATA_INICIO). Date rules BR-MOD-10 are checked by the API. The current value is
 * edited through `PUT …/parametros-report/:N_PARAMETRO/omissao` (BR-MOD-09 versioning).
 */
export const modelosParametrosOmissao = defineResource({
  name: 'modelos-parametros-omissao',
  source: 'DOC_PARAMETROS_OMISSAO',
  parentKeys: ['MODELO_ID', 'N_PARAMETRO'],
  columns: {
    MODELO_ID: { type: 'code', label: 'Modelo', filter: ['eq'], maxLength: 10 },
    N_PARAMETRO: { type: 'number', label: 'Nº Parâmetro', filter: ['eq'] },
    VALOR: { type: 'text', label: 'Valor', filter: ['eq', 'like'], edit: true, maxLength: 240 },
    DATA_INICIO: {
      type: 'date',
      label: 'Data Inicio',
      filter: DATAS,
      sort: true,
      edit: true,
      required: true,
    },
    DATA_FIM: { type: 'date', label: 'Data Fim', filter: DATAS, sort: true, edit: true },
    NOME_CONSULTA: { type: 'text', label: 'Nome Consulta', edit: true, maxLength: 240 },
    CONSULTA_ONLINE: { type: 'code', label: 'Consulta', edit: true, maxLength: 1 },
    ...audit,
  },
  defaultSort: [{ column: 'DATA_INICIO', direction: 'desc' }],
  tiebreak: 'DATA_INICIO',
  roles: { read: ['ADM'], write: ['ADM'] },
});

const atributoCols = {
  MODELO_ID: { type: 'code', label: 'Modelo', filter: ['eq'], maxLength: 10 },
  CDUNIECO: { type: 'number', label: 'UE', filter: ['eq'], sort: true },
  CDRAMO: {
    type: 'code',
    label: 'Ramo',
    filter: ['eq', 'like'],
    sort: true,
    edit: true,
    required: true,
    maxLength: 10,
  },
  N_ATRIBUTO: { type: 'number', label: 'Nº Atributo', sort: true },
  DESCRICAO: { type: 'text', label: 'Descrição', filter: ['like'] },
  NOME_PARAMETRO: { type: 'text', label: 'Nome Parâmetro', filter: ['eq', 'like'], sort: true },
  ORDEM_PARAMETRO: { type: 'number', label: 'Ordem', sort: true },
  VALOR_OMISSAO: { type: 'text', label: 'Valor Omissão' },
  TIPO_PARAMETRO: { type: 'code', label: 'Tipo de Parâmetro', filter: ['eq'] },
  DATA_INICIO: { type: 'date', label: 'Data Inicio', filter: DATAS, sort: true },
  DATA_FIM: { type: 'date', label: 'Data Fim', filter: DATAS, sort: true },
  ...audit,
} as const satisfies Record<string, ColumnDef>;

/**
 * Tab "Atributos" (`DOC_ATRIBUTOS_EDOC`): only `CDRAMO` is editable, and changing it changes the
 * ramo of every attribute of the same `MODELO_ID` + `EDOC_ID` (POST-CHANGE, BR-MOD-11).
 */
export const modelosAtributosEdoc = defineResource({
  name: 'modelos-atributos-edoc',
  source: 'DOC_ATRIBUTOS_EDOC',
  parentKeys: ['MODELO_ID'],
  columns: {
    EDOC_ID: { type: 'number', label: 'Edoc_id', filter: ['eq'], sort: true },
    ...atributoCols,
  },
  defaultSort: [
    { column: 'EDOC_ID', direction: 'asc' },
    { column: 'N_ATRIBUTO', direction: 'asc' },
  ],
  tiebreak: 'N_ATRIBUTO',
  roles: { read: ['ADM'], write: ['ADM'] },
});

/** Tab "Atributos Arquivo" (`DOC_ATRIBUTOS_ARQUIVO`): as eDoc, grouped by `ARQ_ID` (BR-MOD-11). */
export const modelosAtributosArquivo = defineResource({
  name: 'modelos-atributos-arquivo',
  source: 'DOC_ATRIBUTOS_ARQUIVO',
  parentKeys: ['MODELO_ID'],
  columns: {
    ARQ_ID: { type: 'number', label: 'Arq Id', filter: ['eq'], sort: true },
    ...atributoCols,
  },
  defaultSort: [
    { column: 'ARQ_ID', direction: 'asc' },
    { column: 'CDUNIECO', direction: 'asc' },
    { column: 'CDRAMO', direction: 'asc' },
    { column: 'N_ATRIBUTO', direction: 'asc' },
  ],
  tiebreak: 'N_ATRIBUTO',
  roles: { read: ['ADM'], write: ['ADM'] },
});

/**
 * Select feeds (`GET /api/dominios/:id/valores`). The first five are real domains
 * (`CFG_VALORES_DOMINIO`); the last three are pseudo-domain feeds of the modelos feature
 * (`GENERICOS` = REC_GENERICOS; `TIPOS_CONTEUDO` / `CONTEXTOS_APR` also return `preSelected`
 * for `?MODELO_ID=&TIPOSEC_ID=`, D-28). `FORMA_CONTROLO` is the static list item of
 * FORMA_CONTROLO_RF (C, V, U, UV), served the same way so the grid can show it as a select.
 */
export const MODELOS_DOMINIOS = {
  modoExpedicao: 'MODO_EXPEDICAO',
  modoCertificado: 'MODO_CERTIFICADO',
  modoProtecao: 'MODO_PROTECAO',
  binario: 'BINARIO',
  codigosBarras: 'CODIGOS BARRAS',
  genericos: 'MODELOS_GENERICOS',
  tiposConteudo: 'TIPOS_CONTEUDO',
  contextosApr: 'CONTEXTOS_APR',
  formaControlo: 'FORMA_CONTROLO',
} as const;
