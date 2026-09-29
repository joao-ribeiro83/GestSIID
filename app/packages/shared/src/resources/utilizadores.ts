import { defineResource } from '../resource.ts';

/**
 * `FD_UTILIZADORES_SIID` (STRUCTURE.md §3.19): `CFG_UTILIZADORES`, the application's own users.
 * `USERNAME` and `NOME` are typed upper-case and cannot change afterwards (item UpdateAllowed=false).
 * `PASSWORD` is write-only: the API stores `USER_SECURITY.ENCRYPT(password)` and never returns it;
 * 48 characters is the most whose 8-byte-padded DES output (2 hex digits per byte) fits the
 * VARCHAR2(100) column. `AMBIENTE_ID` (the configured environment) and `NIVEL_ACESSO_RF` (always 0)
 * are set by the API, never the client (`apps/api/src/features/utilizadores/routes.ts`).
 * `TIPO_UTILIZADOR_RF` / `UNIDADE_NEGOCIO_RF` are selects over the domains of the same name.
 */
export const utilizadores = defineResource({
  name: 'utilizadores',
  source: 'CFG_UTILIZADORES',
  columns: {
    USERNAME: {
      type: 'code',
      label: 'Username',
      filter: ['eq', 'in'],
      sort: true,
      insertOnly: true,
      required: true,
      maxLength: 30,
    },
    NOME: {
      type: 'text',
      label: 'Nome',
      filter: ['eq', 'like'],
      sort: true,
      insertOnly: true,
      required: true,
      maxLength: 100,
    },
    PASSWORD: {
      type: 'text',
      label: 'Password',
      edit: true,
      required: true,
      maxLength: 48,
      writeOnly: true,
    },
    AMBIENTE_ID: { type: 'code', label: 'Ambiente', filter: ['eq'], sort: true },
    UNIDADE_NEGOCIO_RF: {
      type: 'code',
      label: 'Unidade Negócio',
      filter: ['eq', 'in'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 3,
    },
    TIPO_UTILIZADOR_RF: {
      type: 'code',
      label: 'Tipo Utilizador',
      filter: ['eq', 'in'],
      sort: true,
      edit: true,
      required: true,
      maxLength: 4,
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
    NIVEL_ACESSO_RF: { type: 'number', label: 'Nível Acesso', filter: ['eq'] },
    CRIADO_POR: { type: 'text', label: 'Criado Por' },
    DATA_CRIACAO: { type: 'date', label: 'Data Criação', sort: true },
    ACTUALIZADO_POR: { type: 'text', label: 'Actualizado Por' },
    DATA_ACTUALIZACAO: { type: 'date', label: 'Data Actualização', sort: true },
  },
  defaultSort: [{ column: 'NOME', direction: 'asc' }],
  tiebreak: 'USERNAME',
  roles: { read: ['ADM'], write: ['ADM'] },
});

/** Domain ids of the two selects (`GET /api/dominios/:id/valores`, CFG_VALORES_DOMINIO). */
export const UTILIZADORES_DOMINIOS = {
  tipo: 'TIPO_UTILIZADOR',
  unidadeNegocio: 'UNIDADE_NEGOCIO',
} as const;
