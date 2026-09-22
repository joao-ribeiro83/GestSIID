import { defineResource } from '../resource.ts';

/**
 * `FD_IMPRESSORAS_SIID` (STRUCTURE.md §3.15, BUSINESS_RULES.md BR-PRN-01): `SVR_IMPRESSORAS`.
 * `ID` comes from `ID_IMPRESSORA_SEQ.NEXTVAL` in the form's PRE-INSERT — never client-writable
 * (`apps/api/src/features/impressoras/routes.ts` sets it via a hook, like `auditHooks`).
 * `GSPAPERSIZE_RF` (DB default `'A4'`) has no field or label in the form — left out of this
 * resource; the column keeps its DB default on insert.
 */
export const impressoras = defineResource({
  name: 'impressoras',
  source: 'SVR_IMPRESSORAS',
  columns: {
    ID: { type: 'code', label: 'Id', filter: ['eq', 'in'], sort: true },
    DESCRICAO: {
      type: 'text',
      label: 'Descrição',
      filter: ['eq', 'like', 'null', 'notnull'],
      sort: true,
      edit: true,
      maxLength: 240,
    },
    ENDERECO: {
      type: 'text',
      label: 'Endereço',
      filter: ['eq', 'like', 'null', 'notnull'],
      sort: true,
      edit: true,
      maxLength: 240,
    },
    SERVIDOR: {
      type: 'text',
      label: 'Servidor',
      filter: ['eq', 'like', 'null', 'notnull'],
      sort: true,
      edit: true,
      maxLength: 60,
    },
    // Domain BINARIO (S/N -> Sim/Não).
    VALIDO: {
      type: 'code',
      label: 'Válida',
      filter: ['eq', 'in', 'null', 'notnull'],
      sort: true,
      edit: true,
      maxLength: 1,
    },
    // Domain GSDEVICES, record group RG_GSDEVICES (ordered by PRIORIDADE).
    GSDEVICE_RF: {
      type: 'code',
      label: 'Dispositivo',
      filter: ['eq', 'in', 'null', 'notnull'],
      sort: true,
      edit: true,
      maxLength: 30,
    },
    CRIADO_POR: { type: 'text', label: 'Criado Por' },
    DATA_CRIACAO: { type: 'date', label: 'Data Criação', sort: true },
    ACTUALIZADO_POR: { type: 'text', label: 'Actualizado Por' },
    DATA_ACTUALIZACAO: { type: 'date', label: 'Data Actualização', sort: true },
  },
  defaultSort: [{ column: 'ID', direction: 'asc' }],
  tiebreak: 'ID',
  roles: { read: ['ADM', 'USER'], write: ['ADM'] },
});

/** Domain ids the Impressoras screen's selects read (`GET /api/dominios/:id/valores`). */
export const IMPRESSORAS_DOMINIOS = { gsdevice: 'GSDEVICES', valido: 'BINARIO' } as const;
