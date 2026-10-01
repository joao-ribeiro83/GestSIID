// Regression: ISSUE-006 — Alterar password with empty fields showed zod's English default
// ("Too small: expected string to have >=1 characters") instead of a Portuguese message.
// Found by /qa on 2026-10-01. Report: analysis/QA_REPORT.md
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import './index.ts';

const msg = (schema: z.ZodType, value: unknown) => schema.safeParse(value).error?.issues[0]?.message;

describe('zod messages without an explicit one are Portuguese', () => {
  it('empty or missing string -> Campo obrigatório.', () => {
    expect(msg(z.string().min(1), '')).toBe('Campo obrigatório.');
    expect(msg(z.object({ actual: z.string() }), {})).toBe('Campo obrigatório.');
    expect(msg(z.string(), null)).toBe('Campo obrigatório.');
  });

  it('string over the limit -> Máximo N caracteres.', () => {
    expect(msg(z.string().max(3), 'abcd')).toBe('Máximo 3 caracteres.');
  });

  it('anything else -> Valor inválido.', () => {
    expect(msg(z.number(), 'x')).toBe('Valor inválido.');
    expect(msg(z.strictObject({}), { a: 1 })).toBe('Valor inválido.');
  });

  it('a schema-level message still wins', () => {
    expect(msg(z.string().min(1, 'Indique o nome.'), '')).toBe('Indique o nome.');
  });
});
