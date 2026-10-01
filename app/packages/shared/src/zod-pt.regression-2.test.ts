// Regression: ISSUE-007 — every first object parse in the SPA logged a CSP violation
// ("'script-src' was not explicitly set…"): zod probed eval with Function(''), which the CSP blocks.
// Found by /qa on 2026-10-01. Report: analysis/QA_REPORT.md
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import './index.ts';

describe('zod runs jitless', () => {
  it('never calls Function() while parsing an object', () => {
    const real = globalThis.Function;
    let calls = 0;
    globalThis.Function = new Proxy(real, { apply: () => { calls++; return () => {}; }, construct: () => { calls++; return () => {}; } });
    try {
      z.object({ a: z.string(), b: z.number() }).parse({ a: 'x', b: 1 });
    } finally {
      globalThis.Function = real;
    }
    expect(z.config().jitless).toBe(true);
    expect(calls).toBe(0);
  });
});
