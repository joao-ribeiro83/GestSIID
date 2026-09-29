import { defineResource } from '../resource.ts';

/**
 * `FD_TIPOS_MiDIA` (STRUCTURE.md §3.18): `CFG_TIPOS_MIDIA`. The user types the `ID` (upper-case,
 * `insertOnly`). `GEN_MEDIDA_RF` (PRE-INSERT default `'DIGITAL'`) and `TAMANHO_BYTES` (POST-CHANGE
 * `TRUNC(NVL(TAMANHO_MIDIA,1) * factor of the unit)`) are set by the API, never the client
 * (`apps/api/src/features/tipos-midia/routes.ts`). `UNIDADE_MEDIDA_ID` is a select fed by the
 * Unidades de Medida list (`UNIDADES_DOMINIOS.todas`).
 */
export const tiposMidia = defineResource({
  name: 'tipos-midia',
  source: 'CFG_TIPOS_MIDIA',
  columns: {
    ID: {
      type: 'code',
      label: 'Id',
      filter: ['eq', 'in'],
      sort: true,
      insertOnly: true,
      required: true,
      maxLength: 10,
    },
    DESIGNACAO: {
      type: 'text',
      label: 'Designação',
      filter: ['eq', 'like', 'null', 'notnull'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 200,
    },
    DESCRICAO: {
      type: 'text',
      label: 'Descrição',
      filter: ['eq', 'like', 'null', 'notnull'],
      sort: true,
      edit: true,
      maxLength: 2000,
    },
    GEN_MEDIDA_RF: { type: 'code', label: 'Gen Medida', filter: ['eq'] },
    UNIDADE_MEDIDA_ID: {
      type: 'code',
      label: 'U.M.',
      filter: ['eq', 'in', 'null', 'notnull'],
      sort: true,
      edit: true,
      maxLength: 10,
    },
    TAMANHO_MIDIA: {
      type: 'number',
      label: 'Tamanho',
      filter: ['eq', 'in', 'null', 'notnull'],
      sort: true,
      edit: true,
    },
    TAMANHO_BYTES: {
      type: 'number',
      label: 'Bytes',
      filter: ['eq', 'in', 'null', 'notnull'],
      sort: true,
    },
    CRIADO_POR: { type: 'text', label: 'Criado Por' },
    DATA_CRIACAO: { type: 'date', label: 'Data Criação', sort: true },
    ACTUALIZADO_POR: { type: 'text', label: 'Actualizado Por' },
    DATA_ACTUALIZACAO: { type: 'date', label: 'Data Actualização', sort: true },
  },
  defaultSort: [{ column: 'ID', direction: 'asc' }],
  tiebreak: 'ID',
  roles: { read: ['ADM'], write: ['ADM'] },
});
