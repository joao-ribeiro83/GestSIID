import type { ListQuery } from '@gestsiid/shared';
import type { CrudCtx, Row } from '../../lib/crud.ts';

/** A new backup as FD_NOVO_BACKUP commits it (BR-BKP-03..05). */
export interface NovoBackup {
  /** `YYYY-MM`. */
  mes: string;
  tipoMidiaId: string;
  observacoes: string | null;
  /** The chosen documents, or every candidate of the month ("Seleccionar todos"). */
  ids: number[] | 'todos';
  /** `SVR_VARIAVEIS_SIID` `BACKUP` value ('' when missing); `DESTINO` = destino || NOME. */
  destino: string;
}

/** Data access of Gestão › Backups: `oracle.ts` (form SQL, A-02) and `memoria.ts` (tests, dev server). */
export interface BackupsRepo {
  meses(ctx: CrudCtx): Promise<{ MES: string; DATA: string }[]>;
  lista(q: ListQuery, ctx: CrudCtx): Promise<{ rows: Row[]; total: number }>;
  /** `q` already carries the month filters (the route forces them); `totalBytes` covers the whole month. */
  candidatos(q: ListQuery, mes: string, ctx: CrudCtx): Promise<{ rows: Row[]; total: number; totalBytes: number }>;
  criar(novo: NovoBackup, ctx: CrudCtx): Promise<{ ID: number; NOME: string }>;
  online(ids: number[], online: boolean, drive: string | null, ctx: CrudCtx): Promise<void>;
}
