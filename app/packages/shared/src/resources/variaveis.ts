import { defineResource } from '../resource.ts';

/**
 * `FD_VARIAVEIS_SIID` (STRUCTURE.md §3.20): `SVR_VARIAVEIS_SIID`, one row per (environment, type),
 * PK `(AMBIENTE_ID, TIPO_VARIAVEL_RF)`. The screen shows the configured environment only and hides
 * the password variables (the form's DEFAULT_WHERE hides `PASSWORD`; `PASSWORD_OLD` is the previous
 * hash and is hidden too): `AMBIENTE_ID` is scoped and set by the API, never the client
 * (`apps/api/src/features/variaveis/routes.ts`). `TIPO_VARIAVEL_RF` is a select over the
 * `TIPO_VARIAVEL` domain and unique per environment. The table has no audit columns.
 */
export const variaveis = defineResource({
  name: 'variaveis',
  source: 'SVR_VARIAVEIS_SIID',
  columns: {
    AMBIENTE_ID: { type: 'code', label: 'Ambiente', filter: ['eq'] },
    TIPO_VARIAVEL_RF: {
      type: 'code',
      label: 'Tipo',
      filter: ['eq', 'in'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 16,
    },
    VALOR: {
      type: 'text',
      label: 'Valor',
      filter: ['eq', 'like', 'null', 'notnull'],
      sort: true,
      edit: true,
      maxLength: 2000,
    },
  },
  exclude: { column: 'TIPO_VARIAVEL_RF', values: ['PASSWORD', 'PASSWORD_OLD'] },
  defaultSort: [{ column: 'TIPO_VARIAVEL_RF', direction: 'asc' }],
  tiebreak: 'TIPO_VARIAVEL_RF', // unique within the one environment the screen lists
  roles: { read: ['ADM'], write: ['ADM'] },
});

/** Domain id of the type select (`GET /api/dominios/:id/valores`, CFG_VALORES_DOMINIO). */
export const VARIAVEIS_DOMINIOS = { tipo: 'TIPO_VARIAVEL' } as const;
