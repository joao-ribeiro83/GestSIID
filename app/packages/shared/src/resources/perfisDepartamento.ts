import { defineResource } from '../resource.ts';

/**
 * `FD_PERFIS_DEPARTAMENTO` (STRUCTURE.md §3.11, BR-ADM-04): `DOC_PERFIS_DEPARTAMENTO`, the
 * signature blocks of the management team, as ONE block. `ID` (MAX+1) and the audit columns are
 * set by the API. `CDEMPLEA`/`CDDEPARTA` come from the employee LOV (`CDDEPARTA` is filled with it
 * and never edited afterwards, as in the form: UpdateAllowed=false). The signature image
 * (`ASSINATURA`, BLOB) is not a column here: it has its own routes (ARCHITECTURE.md §6).
 * No delete: Forms deletes only unsaved rows, which never reach the server.
 */
export const perfisDepartamento = defineResource({
  name: 'perfis-departamento',
  source: 'DOC_PERFIS_DEPARTAMENTO',
  columns: {
    ID: { type: 'number', label: 'Id', filter: ['eq'], sort: true },
    CDEMPLEA: {
      type: 'code',
      label: 'Empregado',
      filter: ['eq', 'like'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 30,
    },
    CDDEPARTA: {
      type: 'code',
      label: 'Departamento',
      filter: ['eq', 'like'],
      sort: true,
      insertOnly: true,
      required: true,
      maxLength: 20,
    },
    DATA_INICIO: {
      type: 'date',
      label: 'Data Início',
      filter: ['eq', 'from', 'to'],
      sort: true,
      edit: true,
      required: true,
    },
    DATA_FIM: {
      type: 'date',
      label: 'Data Fim',
      filter: ['eq', 'from', 'to', 'null', 'notnull'],
      sort: true,
      edit: true,
    },
    CODIGO: {
      type: 'code',
      label: 'Código',
      filter: ['eq', 'like'],
      sort: true,
      edit: true,
      maxLength: 30,
    },
    FUNCAODEP_ID: {
      type: 'code',
      label: 'Função',
      filter: ['eq', 'in'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 15,
    },
    NOME: { type: 'text', label: 'Perfil', filter: ['eq', 'like'], sort: true, edit: true, maxLength: 240 },
    DESCRICAO: {
      type: 'text',
      label: 'Nome',
      filter: ['eq', 'like'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 240,
    },
    EMAIL: { type: 'text', label: 'Email', filter: ['eq', 'like'], edit: true, maxLength: 100 },
    TELEFONE: { type: 'text', label: 'Telefone', filter: ['eq', 'like'], edit: true, maxLength: 60 },
    FAX: { type: 'text', label: 'Fax', filter: ['eq', 'like'], edit: true, maxLength: 60 },
    TELEMOVEL: { type: 'text', label: 'Telemóvel', filter: ['eq', 'like'], edit: true, maxLength: 60 },
    CRIADO_POR: { type: 'text', label: 'Criado Por' },
    DATA_CRIACAO: { type: 'date', label: 'Data Criação', sort: true },
    ACTUALIZADO_POR: { type: 'text', label: 'Actualizado Por' },
    DATA_ACTUALIZACAO: { type: 'date', label: 'Data Actualização', sort: true },
  },
  defaultSort: [{ column: 'CDEMPLEA', direction: 'asc' }],
  tiebreak: 'ID',
  roles: { read: ['ADM'], write: ['ADM'] },
});

/** `LOV EMPREGADOS` (`select cdemplea, cddeparta from co_empleados where swactivo='S'`), read-only. */
export const empregadosLov = defineResource({
  name: 'empregados-lov',
  source: 'CO_EMPLEADOS',
  columns: {
    CDEMPLEA: { type: 'code', label: 'Empregado', filter: ['eq', 'like'], sort: true },
    CDDEPARTA: { type: 'code', label: 'Departamento', filter: ['eq', 'like'], sort: true },
    SWACTIVO: { type: 'code', label: 'Activo', filter: ['eq'] },
  },
  defaultSort: [{ column: 'CDEMPLEA', direction: 'asc' }],
  tiebreak: 'CDEMPLEA',
  roles: { read: ['ADM'], write: [] },
});

/** `RG FUNCOESDEP` (`doc_funcoes_departamento where registo_valido='S'`), read-only, feeds a select. */
export const funcoesDepartamento = defineResource({
  name: 'funcoes-departamento',
  source: 'DOC_FUNCOES_DEPARTAMENTO',
  columns: {
    ID: { type: 'code', label: 'Id', filter: ['eq'], sort: true },
    NOME: { type: 'text', label: 'Função', filter: ['eq', 'like'], sort: true },
    REGISTO_VALIDO: { type: 'code', label: 'Válido', filter: ['eq'] },
  },
  defaultSort: [{ column: 'NOME', direction: 'desc' }],
  tiebreak: 'ID',
  roles: { read: ['ADM'], write: [] },
});

/** Pseudo-domain id of the funções select (`GET /api/dominios/<id>/valores`). */
export const PERFIS_DOMINIOS = { funcoes: 'FUNCOES_DEPARTAMENTO' } as const;
