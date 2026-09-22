import { describe, expect, it } from 'vitest';
import type { ColumnDef } from '@gestsiid/shared';
import { formatCell, formatNumber, fromInput, toInput } from './format';

const num: ColumnDef = { type: 'number', label: 'n' };
const date: ColumnDef = { type: 'date', label: 'd' };
const text: ColumnDef = { type: 'text', label: 't' };
const req: ColumnDef = { type: 'text', label: 't', required: true };

describe('formatNumber (UI-10)', () => {
  it('groups thousands with a non-breaking space', () => {
    expect(formatNumber(1250)).toBe('1 250');
    expect(formatNumber(512340)).toBe('512 340');
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(4.5)).toBe('4,5');
  });
});

describe('formatCell', () => {
  it('dates show DD-MM-AAAA, with the time only when it is not midnight', () => {
    expect(formatCell(date, '2026-09-15T00:00:00')).toBe('15-09-2026');
    expect(formatCell(date, '2026-09-15T10:02:00')).toBe('15-09-2026 10:02');
  });
  it('null is empty', () => {
    expect(formatCell(text, null)).toBe('');
  });
});

describe('fromInput / toInput (editor text ↔ row value)', () => {
  it('number: accepts , or .; empty is null; junk stays text so the schema rejects it', () => {
    expect(fromInput(num, '4,5')).toBe(4.5);
    expect(fromInput(num, '')).toBeNull();
    expect(fromInput(num, '4x')).toBe('4x');
  });
  it('date: DD-MM-AAAA → ISO at midnight; junk stays text', () => {
    expect(fromInput(date, '15-09-2026')).toBe('2026-09-15T00:00:00');
    expect(fromInput(date, '31-02-2026')).toBe('31-02-2026');
  });
  it('text: empty is null, except for required columns (so the message is "Campo obrigatório.")', () => {
    expect(fromInput(text, '  ')).toBeNull();
    expect(fromInput(req, '')).toBe('');
    expect(fromInput(text, ' HP ')).toBe('HP');
  });
  it('toInput is the display text of a value', () => {
    expect(toInput(date, '2026-09-15T00:00:00')).toBe('15-09-2026');
    expect(toInput(num, 4.5)).toBe('4,5');
    expect(toInput(text, null)).toBe('');
  });
});
