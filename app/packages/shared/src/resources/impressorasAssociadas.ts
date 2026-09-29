import { defineResource } from '../resource.ts';

/**
 * `FD_GESTAO_IMPRESSORAS_DOC` (STRUCTURE.md §3.7, BR-PRN-02): `DOC_IMPRESSORAS_DOC`. Flat block
 * (Insert/Update=false, Delete=true at block level; rows queried unfiltered, 25/page) — modelled
 * like the `impressoras` pilot, not master-detail. `MODELO_ID`/`IMPRESSORA_ID` are set only by the
 * "Nova impressora" dialog (never inline, never updatable afterwards): `insertOnly`. `AMBIENTE_ID`
 * stands in for the legacy `user_synonyms WHERE table_name='MRECIBO'` lookup — the API sets it from
 * the boot-resolved `AMBIENTE_ID` (`apps/api/src/features/impressoras-associadas/routes.ts`), like
 * `impressorasHooks`. All writes go through custom dialogs (Nova/Alterar Validade/Anular) driven by
 * the screen's toolbar, never inline/panel edit or a real DELETE (`edit: 'none'` on the DataBlock;
 * the DELETE route stays registered for engine consistency but the SPA never calls it).
 *
 * ponytail: neither table has a natural single-column key (real PK is the 3–4 column composite
 * below); `tiebreak` picks `DATA_INICIO` as the least-bad single column for `memoryStore`'s
 * dev/e2e dedup check (`sameParent` is vacuously true with no `parentKeys`, so it's a global
 * check) — real Oracle enforces the true PK (`PK_CHAVE_DIMPD`). Keep dev-seed/e2e fixture rows
 * collision-free on `DATA_INICIO` rather than engineering around this ceiling.
 */
export const impressorasAssociadasDoc = defineResource({
  name: 'impressoras-associadas-doc',
  source: 'DOC_IMPRESSORAS_DOC',
  columns: {
    MODELO_ID: {
      type: 'code',
      label: 'Modelo',
      filter: ['eq', 'like'],
      sort: true,
      insertOnly: true,
      required: true,
      maxLength: 10,
    },
    AMBIENTE_ID: { type: 'code', label: 'Ambiente', maxLength: 30 },
    IMPRESSORA_ID: {
      type: 'code',
      label: 'Impressora',
      filter: ['eq'],
      sort: true,
      insertOnly: true,
      required: true,
      maxLength: 30,
    },
    DATA_INICIO: {
      type: 'date',
      label: 'Início Validade',
      filter: ['eq', 'from', 'to'],
      sort: true,
      edit: true,
      required: true,
    },
    DATA_FIM: {
      type: 'date',
      label: 'Fim Validade',
      filter: ['eq', 'from', 'to', 'null', 'notnull'],
      sort: true,
      edit: true,
    },
    CRIADO_POR: { type: 'text', label: 'Criado Por', sort: true },
    DATA_CRIACAO: { type: 'date', label: 'Data Criação', sort: true },
    ACTUALIZADO_POR: { type: 'text', label: 'Actualizado Por', sort: true },
    DATA_ACTUALIZACAO: { type: 'date', label: 'Data Actualização', sort: true },
  },
  defaultSort: [
    { column: 'MODELO_ID', direction: 'asc' },
    { column: 'DATA_INICIO', direction: 'asc' },
  ],
  tiebreak: 'DATA_INICIO',
  roles: { read: ['ADM'], write: ['ADM'] },
});

/**
 * `FD_GESTAO_IMPRESSORAS_USR` (STRUCTURE.md §3.8, BR-PRN-03): `DOC_IMPRESSOES_MODELO_USR`. Same
 * flat shape as {@link impressorasAssociadasDoc}, scoped by `MODELO_ID` + `CDEMPLEA` instead of
 * `MODELO_ID` alone. No `AMBIENTE_ID` column on this table. Two bulk-copy dialogs (Copiar do
 * modelo / Copiar do utilizador) are custom routes, not `crudRoutes` (see the feature routes).
 */
export const impressorasAssociadasUsr = defineResource({
  name: 'impressoras-associadas-usr',
  source: 'DOC_IMPRESSOES_MODELO_USR',
  columns: {
    MODELO_ID: {
      type: 'code',
      label: 'Modelo',
      filter: ['eq', 'like'],
      sort: true,
      insertOnly: true,
      required: true,
      maxLength: 10,
    },
    CDEMPLEA: {
      type: 'code',
      label: 'Utilizador',
      filter: ['eq', 'like'],
      sort: true,
      insertOnly: true,
      required: true,
      maxLength: 30,
    },
    IMPRESSORA_ID: {
      type: 'code',
      label: 'Impressora',
      filter: ['eq'],
      sort: true,
      insertOnly: true,
      required: true,
      maxLength: 30,
    },
    DATA_INICIO: {
      type: 'date',
      label: 'Início Validade',
      filter: ['eq', 'from', 'to'],
      sort: true,
      edit: true,
      required: true,
    },
    DATA_FIM: {
      type: 'date',
      label: 'Fim Validade',
      filter: ['eq', 'from', 'to', 'null', 'notnull'],
      sort: true,
      edit: true,
    },
    CRIADO_POR: { type: 'text', label: 'Criado Por', sort: true },
    DATA_CRIACAO: { type: 'date', label: 'Data Criação', sort: true },
    ACTUALIZADO_POR: { type: 'text', label: 'Actualizado Por', sort: true },
    DATA_ACTUALIZACAO: { type: 'date', label: 'Data Actualização', sort: true },
  },
  defaultSort: [
    { column: 'MODELO_ID', direction: 'asc' },
    { column: 'CDEMPLEA', direction: 'asc' },
    { column: 'DATA_INICIO', direction: 'asc' },
  ],
  tiebreak: 'DATA_INICIO',
  roles: { read: ['ADM'], write: ['ADM'] },
});

/**
 * `LOV_MODELOS` (`select id from doc_modelos_documento`), read-only (`write: []` → `crudRoutes`
 * registers GET only, `crud.ts`). Backs `ModeloPicker`.
 */
export const modelosLov = defineResource({
  name: 'modelos-lov',
  source: 'DOC_MODELOS_DOCUMENTO',
  columns: {
    ID: { type: 'code', label: 'Modelo', filter: ['eq', 'like'], sort: true },
  },
  defaultSort: [{ column: 'ID', direction: 'asc' }],
  tiebreak: 'ID',
  roles: { read: ['ADM'], write: [] },
});

/**
 * `LOV_UTILIZADORES` (`select cdidusr from m_usuarios`), read-only. `M_USUARIOS` lives in schema
 * GADOR_TESTES but the legacy form selects it unqualified via an existing synonym/grant — same
 * bare name here. Backs `UtilizadorPicker`.
 */
export const utilizadoresLov = defineResource({
  name: 'utilizadores-lov',
  source: 'M_USUARIOS',
  columns: {
    CDIDUSR: { type: 'code', label: 'Utilizador', filter: ['eq', 'like'], sort: true },
  },
  defaultSort: [{ column: 'CDIDUSR', direction: 'asc' }],
  tiebreak: 'CDIDUSR',
  roles: { read: ['ADM'], write: [] },
});
