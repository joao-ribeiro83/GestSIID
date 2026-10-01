import { describe, expect, it } from 'vitest';
import { ConfigError, configWarnings, parseConfig } from './config.ts';

const VALID_ENV = {
  DB_USER: 'siid_app',
  DB_PASSWORD: 'secret',
  DB_CONNECT_STRING: 'host:1521/SERVICE',
  DB_SCHEMA: 'SIID_TESTES',
  AMBIENTE_ID: 'GADOR_TESTES',
  SESSION_SECRET: 'x'.repeat(32),
  FILESERVER_BASE_URL: 'http://ssiidt.cosec.pt:8090/FileServerSIID/restapi/FileServer/pdf/T',
};

describe('parseConfig', () => {
  it('parses a minimal valid environment and applies every documented default', () => {
    const config = parseConfig(VALID_ENV);

    expect(config.NODE_ENV).toBe('production');
    expect(config.PORT).toBe(3000);
    expect(config.LOG_LEVEL).toBe('info');
    expect(config.BASE_PATH).toBe('');
    expect(config.DB_POOL_SIZE).toBe(4);
    expect(config.DB_CALL_TIMEOUT_MS).toBe(60000);
    expect(config.UV_THREADPOOL_SIZE).toBe(8);
    expect(config.ORACLE_CLIENT_LIB_DIR).toBe('');
    expect(config.COOKIE_SECURE).toBe(false);
    expect(config.TRUST_PROXY).toBe(false);
    expect(config.FILESERVER_TIMEOUT_MS).toBe(15000);
    expect(config.UPLOAD_MAX_MB).toBe(10);
    expect(config.DB_USER).toBe('siid_app');
  });

  it('coerces numeric and boolean strings from the environment', () => {
    const config = parseConfig({
      ...VALID_ENV,
      PORT: '4000',
      DB_POOL_SIZE: '10',
      UV_THREADPOOL_SIZE: '10',
      COOKIE_SECURE: 'true',
      TRUST_PROXY: '172.18.0.0/16',
    });

    expect(config.PORT).toBe(4000);
    expect(config.DB_POOL_SIZE).toBe(10);
    expect(config.COOKIE_SECURE).toBe(true);
    expect(config.TRUST_PROXY).toBe('172.18.0.0/16');
  });

  it("reads 'false' and '0' as false (not Boolean('false') === true)", () => {
    const config = parseConfig({ ...VALID_ENV, COOKIE_SECURE: 'false', TRUST_PROXY: 'false' });
    expect(config.COOKIE_SECURE).toBe(false);
    expect(config.TRUST_PROXY).toBe(false);
  });

  it("refuses TRUST_PROXY=true: it would trust a client-written X-Forwarded-For", () => {
    expect(() => parseConfig({ ...VALID_ENV, TRUST_PROXY: 'true' })).toThrow(/TRUST_PROXY/);
  });

  it('throws a ConfigError naming every missing required variable', () => {
    let error: unknown;
    try {
      parseConfig({});
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(ConfigError);
    const message = (error as ConfigError).message;
    expect(message).toContain('DB_USER');
    expect(message).toContain('DB_PASSWORD');
    expect(message).toContain('DB_CONNECT_STRING');
    expect(message).toContain('DB_SCHEMA');
    expect(message).toContain('AMBIENTE_ID');
    expect(message).toContain('SESSION_SECRET');
    expect(message).toContain('FILESERVER_BASE_URL');
  });

  it('rejects a DB_SCHEMA that is not a valid Oracle identifier (D-02)', () => {
    expect(() => parseConfig({ ...VALID_ENV, DB_SCHEMA: 'siid testes' })).toThrow(ConfigError);
  });

  it('rejects a SESSION_SECRET shorter than 32 characters', () => {
    expect(() => parseConfig({ ...VALID_ENV, SESSION_SECRET: 'too-short' })).toThrow(ConfigError);
  });

  it('rejects UV_THREADPOOL_SIZE below DB_POOL_SIZE (boot must refuse per ARCHITECTURE.md §2)', () => {
    expect(() =>
      parseConfig({ ...VALID_ENV, DB_POOL_SIZE: '8', UV_THREADPOOL_SIZE: '4' }),
    ).toThrow(ConfigError);
  });

  it('rejects a BASE_PATH that does not start with a slash', () => {
    expect(() => parseConfig({ ...VALID_ENV, BASE_PATH: 'gestsiid' })).toThrow(ConfigError);
  });

  it('accepts an empty BASE_PATH and a BASE_PATH with a leading slash', () => {
    expect(parseConfig({ ...VALID_ENV, BASE_PATH: '' }).BASE_PATH).toBe('');
    expect(parseConfig({ ...VALID_ENV, BASE_PATH: '/gestsiid' }).BASE_PATH).toBe('/gestsiid');
  });
});

describe('configWarnings', () => {
  it('warns when production sends the session cookie over plain HTTP', () => {
    const warnings = configWarnings(parseConfig(VALID_ENV));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/COOKIE_SECURE/);
  });

  it('warns when COOKIE_SECURE=true but the TLS proxy is not trusted (no cookie would be set)', () => {
    const warnings = configWarnings(parseConfig({ ...VALID_ENV, COOKIE_SECURE: 'true' }));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/TRUST_PROXY/);
  });

  it('is quiet with COOKIE_SECURE=true behind a trusted proxy, and in development', () => {
    expect(configWarnings(parseConfig({ ...VALID_ENV, COOKIE_SECURE: 'true', TRUST_PROXY: '10.0.0.1' }))).toEqual([]);
    expect(configWarnings(parseConfig({ ...VALID_ENV, NODE_ENV: 'development' }))).toEqual([]);
  });
});
