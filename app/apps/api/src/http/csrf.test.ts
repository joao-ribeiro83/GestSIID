import { describe, expect, it } from 'vitest';
import { generateCsrfToken, verifyCsrfToken } from './csrf.ts';

describe('generateCsrfToken', () => {
  it('generates a 64-character hex token (randomBytes(32))', () => {
    const token = generateCsrfToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates a different token every call', () => {
    expect(generateCsrfToken()).not.toBe(generateCsrfToken());
  });
});

describe('verifyCsrfToken', () => {
  it('accepts a token that matches the session token', () => {
    const token = generateCsrfToken();
    expect(verifyCsrfToken(token, token)).toBe(true);
  });

  it('rejects a token that does not match', () => {
    expect(verifyCsrfToken(generateCsrfToken(), generateCsrfToken())).toBe(false);
  });

  it('rejects a missing provided token', () => {
    expect(verifyCsrfToken(generateCsrfToken(), undefined)).toBe(false);
  });

  it('rejects a 64-character non-hex token without throwing', () => {
    expect(verifyCsrfToken(generateCsrfToken(), 'z'.repeat(64))).toBe(false);
  });

  it('rejects a provided token of a different length without throwing', () => {
    expect(verifyCsrfToken(generateCsrfToken(), 'short')).toBe(false);
  });
});
