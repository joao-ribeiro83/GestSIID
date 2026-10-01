// Regression: PR #13 review — the shared Portuguese zod fallback (packages/shared/src/zod-pt.ts)
// replaced the boot errors' detail ("expected number…") with "Valor inválido.".
import { describe, expect, it } from 'vitest';
import '@gestsiid/shared'; // installs the global fallback, as app.ts does before boot
import { parseConfig } from './config.ts';

const VALID_ENV = {
  DB_USER: 'siid_app',
  DB_PASSWORD: 'secret',
  DB_CONNECT_STRING: 'host:1521/SERVICE',
  DB_SCHEMA: 'SIID_TESTES',
  AMBIENTE_ID: 'GADOR_TESTES',
  SESSION_SECRET: 'x'.repeat(32),
  FILESERVER_BASE_URL: 'http://fs/pdf/T',
};

describe('parseConfig messages', () => {
  it('keeps zod\'s English detail for the operator', () => {
    expect(() => parseConfig({ ...VALID_ENV, PORT: 'abc' })).toThrow(/PORT: .*expected number/);
    expect(() => parseConfig({ ...VALID_ENV, PORT: 'abc' })).not.toThrow(/Valor inválido/);
  });
});
