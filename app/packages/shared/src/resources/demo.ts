import { defineResource } from '../resource.ts';

/**
 * Demo resources for `/dev/datablock` (served in memory by `apps/api/src/features/dev`). They
 * cover every column type and filter kind the DataBlock supports, plus a master/detail pair.
 */

export const demoImpressoras = defineResource({
  name: 'demo-impressoras',
  source: 'DEMO_IMPRESSORAS',
  columns: {
    ID: { type: 'number', label: 'Id', filter: ['eq', 'in', 'null', 'notnull'], sort: true },
    NOME: {
      type: 'text',
      label: 'Nome',
      filter: ['eq', 'like', 'null', 'notnull'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 40,
    },
    CODIGO: {
      type: 'code',
      label: 'Código',
      filter: ['eq', 'in'],
      sort: true,
      insertOnly: true,
      required: true,
      maxLength: 10,
    },
    TIPO: {
      type: 'code',
      label: 'Tipo',
      filter: ['in', 'null', 'notnull'],
      sort: true,
      edit: true,
    },
    PAGINAS_MIN: {
      type: 'number',
      label: 'Pág./min',
      filter: ['eq', 'null', 'notnull'],
      sort: true,
      edit: true,
    },
    DATA_INICIO: {
      type: 'date',
      label: 'Data Início',
      filter: ['eq', 'from', 'to', 'null', 'notnull'],
      sort: true,
      edit: true,
      required: true,
    },
    CRIADO_POR: { type: 'text', label: 'Criado Por' },
    DATA_CRIACAO: { type: 'date', label: 'Data Criação', sort: true },
    ACTUALIZADO_POR: { type: 'text', label: 'Actualizado Por' },
    DATA_ACTUALIZACAO: { type: 'date', label: 'Data Actualização', sort: true },
  },
  defaultSort: [{ column: 'NOME', direction: 'asc' }],
  tiebreak: 'ID',
  roles: { read: ['ADM', 'USER'], write: ['ADM'] },
});

export const demoTabuleiros = defineResource({
  name: 'demo-tabuleiros',
  source: 'DEMO_TABULEIROS',
  parentKeys: ['IMPRESSORA_ID'],
  columns: {
    ID: { type: 'number', label: 'Id', sort: true },
    IMPRESSORA_ID: { type: 'number', label: 'Impressora' },
    TABULEIRO: {
      type: 'number',
      label: 'Tabuleiro',
      filter: ['eq'],
      sort: true,
      edit: true,
      required: true,
    },
    MIDIA: {
      type: 'code',
      label: 'Mídia',
      filter: ['in', 'null', 'notnull'],
      sort: true,
      edit: true,
    },
    DESCRICAO: {
      type: 'text',
      label: 'Descrição',
      filter: ['eq', 'like'],
      edit: true,
      maxLength: 60,
    },
  },
  defaultSort: [{ column: 'TABULEIRO', direction: 'asc' }],
  tiebreak: 'ID',
  roles: { read: ['ADM', 'USER'], write: ['ADM'] },
});

/** Domain ids the demo selects use (`GET /api/dominios/:id/valores`). */
export const DEMO_DOMINIOS = { tipo: 'TIPO_IMPRESSORA', midia: 'TIPO_MIDIA' } as const;
