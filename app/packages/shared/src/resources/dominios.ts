import { defineResource } from '../resource.ts';

/**
 * `FD_DOMINIOS_SIID` (STRUCTURE.md §3.16, BR-ADM-01): master `CFG_DOMINIOS` + detail
 * `CFG_VALORES_DOMINIO` (`DOMINIO_ID`), the first master-detail screen. `TIPO_STRING_RF` /
 * `FORMATACAO_STRING_RF` only matter when `TIPO_INFORMACAO_RF='STRING'`; `VALOR_MINIMO` /
 * `VALOR_MAXIMO` only when `TIPO_DOMINIO_RF='I'` (`ENABLE_STRINGS`/`ENABLE_VALORES` — a screen
 * concern, not enforced here). `ESTADO_REGISTO_RF`/`DATA_ESTADO`/`REGISTADO_POR`/`DATA_REGISTO`
 * are set by the API on insert (`apps/api/src/features/dominios/routes.ts`), like
 * `ACTUALIZADO_POR`/`DATA_ACTUALIZACAO` on update.
 */
export const dominios = defineResource({
  name: 'dominios',
  source: 'CFG_DOMINIOS',
  columns: {
    ID: {
      type: 'code',
      label: 'Id',
      filter: ['eq', 'like'],
      sort: true,
      insertOnly: true,
      required: true,
      maxLength: 60,
    },
    DESCRICAO: {
      type: 'text',
      label: 'Descrição',
      filter: ['eq', 'like', 'null', 'notnull'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 200,
    },
    TIPO_INFORMACAO_RF: {
      type: 'code',
      label: 'Tipo',
      filter: ['eq', 'in'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 30,
    },
    TIPO_DOMINIO_RF: {
      type: 'code',
      label: 'Tipo Domínio',
      filter: ['eq', 'in'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 1,
    },
    TIPO_STRING_RF: { type: 'code', label: 'Tipo String', edit: true, maxLength: 1 },
    FORMATACAO_STRING_RF: { type: 'code', label: 'Formatação String', edit: true, maxLength: 1 },
    TAMANHO_MAXIMO: { type: 'number', label: 'Tamanho', edit: true },
    PRECISAO: { type: 'number', label: 'Precisão', edit: true },
    VALOR_MINIMO: { type: 'text', label: 'Mínimo', edit: true, maxLength: 40 },
    VALOR_MAXIMO: { type: 'text', label: 'Máximo', edit: true, maxLength: 40 },
    DOMINIO_SISTEMA_BN: {
      type: 'code',
      label: 'Sistema?',
      edit: true,
      required: true,
      maxLength: 1,
    },
    VALOR_COMUM: { type: 'text', label: 'Default', edit: true, maxLength: 30 },
    OBSERVACAO: { type: 'text', label: 'Observação', edit: true, maxLength: 2000 },
    ESTADO_REGISTO_RF: { type: 'text', label: 'Estado' },
    DATA_ESTADO: { type: 'date', label: 'Data Estado', sort: true },
    REGISTADO_POR: { type: 'text', label: 'Registado Por' },
    DATA_REGISTO: { type: 'date', label: 'Data Registo', sort: true },
    ACTUALIZADO_POR: { type: 'text', label: 'Actualizado Por' },
    DATA_ACTUALIZACAO: { type: 'date', label: 'Data Actualização', sort: true },
  },
  defaultSort: [
    { column: 'DOMINIO_SISTEMA_BN', direction: 'desc' },
    { column: 'ID', direction: 'asc' },
  ],
  tiebreak: 'ID',
  roles: { read: ['ADM'], write: ['ADM'] },
});

/**
 * Detail block (tab "Lista"): `DOMINIO_ID`/`CHAVE`/`DESIGNACAO`/`DESCRICAO`/`DATA_INICIO`/
 * `PRIORIDADE`/`REGISTADO_POR`/`DATA_REGISTO` are NOT NULL by generated `WHEN-VALIDATE-ITEM`
 * triggers (`SYS_C00443332..40`), not the DB (BR-ADM-01) — `required: true` here regardless.
 * Mounted at `/api/dominios/:DOMINIO_ID/lista`, distinct from the read-only lookup feed at
 * `/api/dominios/:dominioId/valores` (`features/dominios/valores.ts`) that every domain-backed
 * select in the app already reads; a write here invalidates that feed's cache for the domain.
 */
export const dominiosValores = defineResource({
  name: 'dominios-valores',
  source: 'CFG_VALORES_DOMINIO',
  parentKeys: ['DOMINIO_ID'],
  columns: {
    DOMINIO_ID: { type: 'code', label: 'Domínio', filter: ['eq'], maxLength: 60 },
    CHAVE: {
      type: 'code',
      label: 'Chave',
      filter: ['eq', 'like'],
      sort: true,
      insertOnly: true,
      required: true,
      maxLength: 30,
    },
    DESIGNACAO: {
      type: 'text',
      label: 'Designação',
      filter: ['eq', 'like'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 60,
    },
    DESCRICAO: {
      type: 'text',
      label: 'Descrição',
      edit: true,
      required: true,
      maxLength: 200,
    },
    DATA_INICIO: { type: 'date', label: 'Data Início', sort: true, edit: true, required: true },
    DATA_FIM: { type: 'date', label: 'Data Fim', sort: true, edit: true },
    PRIORIDADE: { type: 'number', label: 'Ordem', sort: true, edit: true, required: true },
    REGISTADO_POR: { type: 'text', label: 'Registado Por' },
    DATA_REGISTO: { type: 'date', label: 'Data Registo', sort: true },
    ACTUALIZADO_POR: { type: 'text', label: 'Actualizado Por' },
    DATA_ACTUALIZACAO: { type: 'date', label: 'Data Actualização', sort: true },
  },
  defaultSort: [{ column: 'PRIORIDADE', direction: 'asc' }],
  tiebreak: 'CHAVE',
  roles: { read: ['ADM'], write: ['ADM'] },
});

/**
 * Domain ids that are themselves domains-of-domains, fed by the same lookup endpoint
 * (`GET /api/dominios/:id/valores`) as any other select; `binario` feeds `DOMINIO_SISTEMA_BN`
 * as a checkbox-style select, like `IMPRESSORAS_DOMINIOS.valido` does for `VALIDO`.
 */
export const DOMINIOS_DOMINIOS = {
  tipoInformacao: 'TIPO_INFORMACAO',
  tipoDominio: 'TIPO_DOMINIO',
  tipoString: 'TIPO_STRING',
  formatacaoString: 'FORMATACAO_STRING',
  binario: 'BINARIO',
} as const;
