import type { ColumnDef } from '@gestsiid/shared';
import { dmyToIso, isoToDmy } from './qbe';

/** UI-10: `1 250` (non-breaking space), decimal comma. */
export function formatNumber(n: number): string {
  const [int = '', dec] = String(n).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return dec ? `${grouped},${dec}` : grouped;
}

/** Read-only cell text. */
export function formatCell(def: ColumnDef, v: unknown): string {
  if (v == null) return '';
  if (def.type === 'number' && typeof v === 'number') return formatNumber(v);
  if (def.type === 'date' && typeof v === 'string') {
    const time = v.slice(11, 16);
    return time && time !== '00:00' ? `${isoToDmy(v)} ${time}` : isoToDmy(v);
  }
  return String(v);
}

/** Editor text → row value. Unparseable text is returned as is, so the resource schema flags it. */
export function fromInput(def: ColumnDef, raw: string): unknown {
  const text = raw.trim();
  if (text === '') return def.required && (def.type === 'text' || def.type === 'code') ? '' : null;
  if (def.type === 'number')
    return /^-?\d+([.,]\d+)?$/.test(text) ? Number(text.replace(',', '.')) : text;
  if (def.type === 'date') {
    const iso = dmyToIso(text);
    return iso ? `${iso}T00:00:00` : text;
  }
  return text;
}

/** Row value → editor text. */
export function toInput(def: ColumnDef, v: unknown): string {
  if (v == null) return '';
  if (def.type === 'date' && typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v))
    return isoToDmy(v);
  if (def.type === 'number' && typeof v === 'number') return String(v).replace('.', ',');
  return String(v);
}
