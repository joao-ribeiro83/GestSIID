import { toQueryString, type ListQueryParam } from '@gestsiid/shared';
import type { Selection } from '@/components/datablock/DataBlock';

/** A row of `GET /api/documentos` (the `documentos` resource). */
export interface DocRow {
  _rid: string;
  ID: number;
  MODELO_ID: string | null;
  ESTADO: string | null;
  COR: 'OFFLINE' | 'ANULADO' | null;
  COMENTARIO: string | null;
  [col: string]: unknown;
}

/** `POST /api/documentos/acoes/:acao` answer (ARCHITECTURE §4.3). */
export interface Resultado {
  ok: number[];
  skipped: { id: number; motivo: string }[];
  pedidos?: number;
}

/** A parameter row of Procurar / Clonar (`SVR_PARAMETROS_DOC_NOME_VW`). */
export interface ParamRow {
  NOME: string;
  VALOR: string | null;
}

/** Names whose value can be converted (CONVERTE_PARAM, #28) and the label of the source value. */
export const CONVERSOES: Record<string, { tipo: 'recibo' | 'pessoa'; campo: string; query: string }> = {
  P_NMRECIBO: { tipo: 'recibo', campo: 'NMRECINUE', query: 'nmrecinue' },
  P_CDPERSON: { tipo: 'pessoa', campo: 'CDIDEPER', query: 'cdideper' },
};

/**
 * The batch-action selection body (§4.2): the ticked ids, or the executed list query as the flat
 * query-string object `GET /api/documentos` takes (the API parses it with the same `parseListQuery`).
 * Repeated keys (`f[COL][in]`, the same `param[NOME]` twice) become arrays.
 */
export function seleccaoBody(s: Selection): { ids: number[] } | { consulta: Record<string, string | string[]> } | null {
  if (s.mode === 'none') return null;
  if (s.mode === 'ids') return { ids: s.ids.map(Number) };
  const consulta: Record<string, string | string[]> = {};
  const qs = toQueryString({ ...s.consulta, sort: [], page: 1, size: 50 });
  for (const [k, v] of new URLSearchParams(qs)) {
    const prev = consulta[k];
    consulta[k] = prev === undefined ? v : [...(Array.isArray(prev) ? prev : [prev]), v];
  }
  return { consulta };
}

/** Skipped documents grouped under their message, in the order the API reported them (#9, #13…). */
export function agrupar(skipped: Resultado['skipped']): { motivo: string; ids: number[] }[] {
  const groups = new Map<string, number[]>();
  for (const { id, motivo } of skipped) groups.set(motivo, [...(groups.get(motivo) ?? []), id]);
  return [...groups].map(([motivo, ids]) => ({ motivo, ids }));
}

/** Procurar: rows with a value become `param[NOME]=VALOR` (Forms skipped the empty ones). */
export const paramsDe = (rows: ParamRow[]): ListQueryParam[] =>
  rows
    .filter((r) => r.NOME.trim() !== '' && (r.VALOR ?? '').trim() !== '')
    .map((r) => ({ nome: r.NOME.trim().toUpperCase(), valor: (r.VALOR ?? '').trim() }));
