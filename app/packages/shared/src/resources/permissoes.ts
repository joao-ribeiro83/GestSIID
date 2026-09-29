import { defineResource } from '../resource.ts';

/**
 * `FD_PERMISSOES_SIID` grid (block DOC_PERMISSOES_IMPRESSAO, BR-PERM-01/02) over
 * `CFG_PERMISSOES_SIID_VW`. Read-only here: every write is a named route in
 * `apps/api/src/features/permissoes/routes.ts`, keyed by the logical key
 * (USERNAME, MODELO_ID, UNIDADE_NEGOCIO_RF, TIPO_PERMISSAO_RF, DATA_INICIO) — the table has no id.
 * Preset `validas` = the form's DEFAULT_WHERE; no preset = the "Todos" button.
 *
 * ponytail: `tiebreak` is DATA_INICIO, not the 5-column key, so paging order among rows sharing
 * the sort columns and DATA_INICIO is not guaranteed stable. Add a key-list tiebreak to the engine
 * if paging duplicates ever show up.
 */
export const permissoes = defineResource({
  name: 'permissoes',
  source: 'CFG_PERMISSOES_SIID_VW',
  columns: {
    MODELO_ID: { type: 'code', label: 'Modelo', filter: ['eq', 'like', 'in'], sort: true },
    USERNAME: { type: 'code', label: 'Utilizador', filter: ['eq', 'like', 'in'], sort: true },
    NOME: { type: 'text', label: 'Nome', filter: ['eq', 'like'], sort: true },
    UNIDADE_NEGOCIO_RF: { type: 'code', label: 'Depart.', filter: ['eq', 'in'], sort: true },
    UNIDADE_NEGOCIO: { type: 'text', label: 'Departamento', filter: ['eq', 'like'], sort: true },
    AMBIENTE_ID: { type: 'code', label: 'Ambiente', filter: ['eq'] },
    TIPO_PERMISSAO_RF: { type: 'number', label: 'Tipo Permissão (código)', filter: ['eq', 'in'] },
    TIPO_PERMISSAO: { type: 'text', label: 'Tipo Permissão', filter: ['eq', 'like'], sort: true },
    DATA_INICIO: { type: 'date', label: 'Início Validade', filter: ['eq', 'from', 'to'], sort: true },
    DATA_FIM: {
      type: 'date',
      label: 'Fim Validade',
      filter: ['eq', 'from', 'to', 'null', 'notnull'],
      sort: true,
    },
    CRIADO_POR: { type: 'text', label: 'Criado Por', filter: ['eq', 'like'], sort: true },
    DATA_CRIACAO: { type: 'date', label: 'Data Criação', filter: ['eq', 'from', 'to'], sort: true },
    ACTUALIZADO_POR: { type: 'text', label: 'Actualizado Por', filter: ['eq', 'like'], sort: true },
    DATA_ACTUALIZACAO: {
      type: 'date',
      label: 'Data Actualização',
      filter: ['eq', 'from', 'to'],
      sort: true,
    },
  },
  presets: {
    validas: 'SYSDATE BETWEEN DATA_INICIO AND NVL(DATA_FIM, SYSDATE + 1)',
  },
  defaultSort: [{ column: 'TIPO_PERMISSAO', direction: 'asc' }],
  tiebreak: 'DATA_INICIO',
  roles: { read: ['ADM'], write: [] },
});
