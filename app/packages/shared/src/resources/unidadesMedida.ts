import { defineResource } from '../resource.ts';

/**
 * `FD_UNIDADES_MEDIDA` (STRUCTURE.md §3.17): `CFG_UNIDADES_MEDIDA`, block WHERE
 * `GEN_MEDIDA_RF='DIGITAL'` ORDER BY `ID`. The user types the `ID` (upper-case, `insertOnly`);
 * `GEN_MEDIDA_RF` is not on the canvas — the API forces `'DIGITAL'` (item initial value).
 */
export const unidadesMedida = defineResource({
  name: 'unidades-medida',
  source: 'CFG_UNIDADES_MEDIDA',
  columns: {
    ID: {
      type: 'code',
      label: 'Unidade',
      filter: ['eq', 'in'],
      sort: true,
      insertOnly: true,
      required: true,
      maxLength: 10,
    },
    NOME: {
      type: 'text',
      label: 'Nome',
      filter: ['eq', 'like', 'null', 'notnull'],
      sort: true,
      edit: true,
      maxLength: 60,
    },
    FACTOR: {
      type: 'number',
      label: 'Factor',
      filter: ['eq', 'in', 'null', 'notnull'],
      sort: true,
      edit: true,
    },
    // List RG_UNIDADES_BASE: the units that have no base themselves.
    UNIDADE_BASE_ID: {
      type: 'code',
      label: 'Unidade Base',
      filter: ['eq', 'in', 'null', 'notnull'],
      sort: true,
      edit: true,
      maxLength: 10,
    },
    GEN_MEDIDA_RF: { type: 'code', label: 'Gen Medida', filter: ['eq'] },
    CRIADO_POR: { type: 'text', label: 'Criado Por' },
    DATA_CRIACAO: { type: 'date', label: 'Data Criação', sort: true },
    ACTUALIZADO_POR: { type: 'text', label: 'Actualizado Por' },
    DATA_ACTUALIZACAO: { type: 'date', label: 'Data Actualização', sort: true },
  },
  defaultSort: [{ column: 'ID', direction: 'asc' }],
  tiebreak: 'ID',
  roles: { read: ['ADM'], write: ['ADM'] },
});

/**
 * Select feeds served from this table, read through `GET /api/dominios/:id/valores` like every
 * domain-backed select (the API answers these two ids from `CFG_UNIDADES_MEDIDA`, not from
 * `CFG_VALORES_DOMINIO`): `base` = RG_UNIDADES_BASE, `todas` = RG_UNIDADES_MEDIDA.
 */
export const UNIDADES_DOMINIOS = { base: 'UNIDADES_BASE', todas: 'UNIDADES_MEDIDA' } as const;
