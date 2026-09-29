import { defineResource } from '../resource.ts';

/**
 * `FD_CONFIGURACAO_REPORTS` (STRUCTURE.md §3.12, BR-ADM-05): master `SVR_REPORT_SIID` + detail
 * `SVR_PARAMETROS_REPORT` (`REPORT_ID`). `ID` comes from `ID_TEMPLATE_REPORT_SEQ.NEXTVAL` in the
 * form's WHEN-CREATE-RECORD — never client-writable (`apps/api/src/features/reports/routes.ts`
 * sets it via a hook, like `impressorasHooks`). `NOME`/`N_PARAMETROS` are `Required="false"` in
 * the legacy form despite always being filled in practice — left optional here to match.
 */
export const reports = defineResource({
  name: 'reports',
  source: 'SVR_REPORT_SIID',
  columns: {
    ID: { type: 'number', label: 'Id', filter: ['eq'], sort: true },
    NOME: {
      type: 'text',
      label: 'Descrição',
      filter: ['eq', 'like'],
      sort: true,
      edit: true,
      maxLength: 60,
    },
    N_PARAMETROS: { type: 'number', label: 'N.º Parâmetros', edit: true },
    VALIDO: {
      type: 'code',
      label: 'Válido',
      filter: ['eq', 'in'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 1,
    },
    NOME_FICHEIRO: { type: 'text', label: 'Nome de Ficheiro', edit: true, maxLength: 240 },
    DIRECTORIA_BASE: { type: 'text', label: 'Directoria Base', edit: true, maxLength: 240 },
    DIRECTORIA_DESTINO: { type: 'text', label: 'Directoria Destino', edit: true, maxLength: 240 },
    OBSERVACAO: { type: 'text', label: 'Observações', edit: true, maxLength: 240 },
    CRIADO_POR: { type: 'text', label: 'Criado Por' },
    DATA_CRIACAO: { type: 'date', label: 'Data Criação', sort: true },
    ACTUALIZADO_POR: { type: 'text', label: 'Actualizado Por' },
    DATA_ACTUALIZACAO: { type: 'date', label: 'Data Actualização', sort: true },
  },
  defaultSort: [{ column: 'NOME', direction: 'asc' }],
  tiebreak: 'ID',
  roles: { read: ['ADM'], write: ['ADM'] },
});

/**
 * Detail block "Parâmetros": `N_PARAMETRO` is server-assigned (1, then `MAX+1` per `REPORT_ID` —
 * the form's PRE-INSERT), never client-writable. `TIPO_PARAMETRO_RF` is a select over the
 * `TIPO_PARAMETRO` domain (`GET /api/dominios/TIPO_PARAMETRO/valores`, the same generic feed
 * every other domain-backed select in the app already reads — `features/dominios/valores.ts`).
 * Rows 1–3 of every report are seeded and name-locked by the API
 * (`apps/api/src/features/reports/routes.ts`); the screen shows that with `editableWhen`.
 */
export const reportParametros = defineResource({
  name: 'report-parametros',
  source: 'SVR_PARAMETROS_REPORT',
  parentKeys: ['REPORT_ID'],
  columns: {
    REPORT_ID: { type: 'number', label: 'Report', filter: ['eq'] },
    N_PARAMETRO: { type: 'number', label: 'Nº Parâmetro', sort: true },
    NOME: { type: 'text', label: 'Nome do Parâmetro', edit: true, maxLength: 240 },
    TIPO_PARAMETRO_RF: {
      type: 'code',
      label: 'Tipo de Parâmetro',
      edit: true,
      maxLength: 10,
    },
    OBRIGATORIO: { type: 'code', label: 'Obrigatório', edit: true, maxLength: 1 },
    CHECK_UNIQUE: { type: 'code', label: 'Único', edit: true, maxLength: 1 },
    VALIDO: { type: 'code', label: 'Válido', edit: true, maxLength: 1 },
    DESCRICAO: { type: 'text', label: 'Descrição', edit: true, maxLength: 240 },
    CRIADO_POR: { type: 'text', label: 'Criado Por' },
    DATA_CRIACAO: { type: 'date', label: 'Data Criação', sort: true },
    ACTUALIZADO_POR: { type: 'text', label: 'Actualizado Por' },
    DATA_ACTUALIZACAO: { type: 'date', label: 'Data Actualização', sort: true },
  },
  defaultSort: [{ column: 'N_PARAMETRO', direction: 'asc' }],
  tiebreak: 'N_PARAMETRO',
  roles: { read: ['ADM'], write: ['ADM'] },
});

/** Domain ids the Reports screen's own selects read (`GET /api/dominios/:id/valores`). */
export const REPORTS_DOMINIOS = { tipoParametro: 'TIPO_PARAMETRO' } as const;
