import { randomBytes, timingSafeEqual } from 'node:crypto';

/** Per-session CSRF token (§5): `randomBytes(32)`, sent by the SPA as `x-csrf-token`. */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/** Constant-time compare; never throws on a mismatched length or a missing token. */
export function verifyCsrfToken(expected: string, provided: string | undefined): boolean {
  // Hex check first: Buffer.from(x, 'hex') stops at the first non-hex character, and
  // timingSafeEqual throws on buffers of different sizes.
  if (!provided || provided.length !== expected.length || !/^[0-9a-f]+$/i.test(provided)) return false;
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
}
