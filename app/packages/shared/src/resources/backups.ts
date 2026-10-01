import { defineResource } from '../resource.ts';

/**
 * `FD_BACKUPS_ONLINE` blocks OFFLINE / ONLINE (`MEDIA_ONLINE = 'N' | 'S'`, STRUCTURE.md §3):
 * `SVR_BACKUPS`, read-only. A backup is written only by `POST /api/backups` and its media flag by
 * `POST /api/backups/online` (apps/api features/backups); it cannot be edited once created (D-25).
 * `TAMANHO_BACKUP` is the OFFLINE POST-QUERY: MB, though the form labels it GB.
 */
export const backups = defineResource({
  name: 'backups',
  source: 'SVR_BACKUPS',
  columns: {
    ID: { type: 'number', label: 'Id', filter: ['eq', 'in'], sort: true },
    NOME: { type: 'text', label: 'Nome', filter: ['eq', 'like'], sort: true },
    MES_BACKUP: { type: 'date', label: 'Mês', filter: ['eq', 'from', 'to'], sort: true },
    TIPO_MIDIA_ID: { type: 'code', label: 'Tipo Mídia', filter: ['eq', 'in'], sort: true },
    DESTINO: { type: 'text', label: 'Destino', filter: ['like'] },
    OBSERVACOES: { type: 'text', label: 'Observações', filter: ['like'] },
    MEDIA_ONLINE: { type: 'code', label: 'Media Online', filter: ['eq'] },
    DRIVE_ONLINE: { type: 'text', label: 'Drive Online' },
    CRIADO_POR: { type: 'text', label: 'Criado Por', filter: ['eq', 'like'], sort: true },
    DATA_CRIACAO: { type: 'date', label: 'Data Criação', filter: ['eq', 'from', 'to'], sort: true },
    TAMANHO_BACKUP: {
      type: 'number',
      label: 'Gbytes',
      expr: 'SELECT SUM(D.TAMANHO_BYTES)/1024/1024 FROM SVR_DOCUMENTOS D WHERE D.BACKUP_ID = SVR_BACKUPS.ID',
    },
  },
  defaultSort: [{ column: 'ID', direction: 'desc' }],
  tiebreak: 'ID',
  roles: { read: ['ADM'], write: [] },
});

/**
 * `FD_NOVO_BACKUP` block DOCS_PORBACKUP: the printed, not-backed-up documents of one month. The
 * month and `BACKUP_ID IS NULL` are forced by the route as `DATA_IMPRESSAO` from/to and
 * `BACKUP_ID` null filters; the client filters nothing else. Sort as ORDENAR_POR did.
 */
export const backupsCandidatos = defineResource({
  name: 'backups-candidatos',
  source: 'SVR_DOCUMENTOS',
  columns: {
    ID: { type: 'number', label: 'Id', sort: true },
    MODELO_ID: { type: 'code', label: 'Modelo' },
    N_REFERENCIA: { type: 'text', label: 'Referência' },
    DATA_IMPRESSAO: { type: 'date', label: 'Data Impressão', filter: ['from', 'to'], sort: true },
    DATA_PEDIDO: { type: 'date', label: 'Data Pedido' },
    CRIADO_POR: { type: 'text', label: 'Criado Por' },
    TAMANHO_BYTES: { type: 'number', label: 'Tamanho', sort: true },
    BACKUP_ID: { type: 'number', label: 'Backup', filter: ['null'] },
  },
  defaultSort: [{ column: 'ID', direction: 'asc' }],
  tiebreak: 'ID',
  roles: { read: ['ADM'], write: [] },
});
