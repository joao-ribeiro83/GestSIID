import { describe, expect, it } from 'vitest';
import { AppError, mapOracleError } from './errors.ts';

function oraError(message: string): Error {
  return new Error(message);
}

describe('mapOracleError', () => {
  it('maps ORA-00054 (row locked) to 409 REGISTO_BLOQUEADO', () => {
    const err = mapOracleError(oraError('ORA-00054: resource busy and acquire with NOWAIT specified'));
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('REGISTO_BLOQUEADO');
  });

  it('maps ORA-30006 (resource busy, wait timeout) to 409 REGISTO_BLOQUEADO', () => {
    const err = mapOracleError(oraError('ORA-30006: resource busy; acquire with WAIT timeout expired'));
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('REGISTO_BLOQUEADO');
  });

  it('maps a unique-key violation (ORA-00001) to 409 ORA_00001', () => {
    const err = mapOracleError(oraError('ORA-00001: unique constraint violated'));
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('ORA_00001');
  });

  it('maps a child-row foreign key violation (ORA-02292) to 409 ORA_02292 with catalogue #42 text', () => {
    const err = mapOracleError(oraError('ORA-02292: integrity constraint violated - child record found'));
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('ORA_02292');
    expect(err.message).toBe(
      'Impossível apagar registo mestre se existirem registos de detalhe correspondentes.',
    );
  });

  it.each(['ORA-01400: cannot insert NULL', 'ORA-01407: cannot update to NULL'])(
    'maps %s to 400 ORA_01400',
    (message) => {
      const err = mapOracleError(oraError(message));
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('ORA_01400');
    },
  );

  it.each(['ORA-12899: value too large for column', 'ORA-01438: value larger than specified precision'])(
    'maps %s to 400 ORA_12899',
    (message) => {
      const err = mapOracleError(oraError(message));
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('ORA_12899');
    },
  );

  it('maps ORA-02291 (missing parent key) to 422 ORA_02291', () => {
    const err = mapOracleError(oraError('ORA-02291: integrity constraint violated - parent key not found'));
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('ORA_02291');
  });

  it('maps ORA-02290 (check constraint) to 422 ORA_02290', () => {
    const err = mapOracleError(oraError('ORA-02290: check constraint violated'));
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('ORA_02290');
  });

  it.each([
    'ORA-03113: end-of-file on communication channel',
    'ORA-03114: not connected to ORACLE',
    'ORA-12154: TNS:could not resolve the connect identifier',
    'ORA-12514: TNS:listener does not currently know of service',
  ])('maps %s to 503 BD_INDISPONIVEL', (message) => {
    const err = mapOracleError(oraError(message));
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe('BD_INDISPONIVEL');
  });

  it('maps NJS-040 (pool queue timeout) to 503 BD_INDISPONIVEL', () => {
    const err = mapOracleError(oraError('NJS-040: connection request timed out'));
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe('BD_INDISPONIVEL');
  });

  it('maps DPI-1067 to 504 TEMPO_ESGOTADO', () => {
    const err = mapOracleError(oraError('DPI-1067: call timeout of 60000 ms exceeded'));
    expect(err.statusCode).toBe(504);
    expect(err.code).toBe('TEMPO_ESGOTADO');
  });

  it('maps ORA-01013 (user requested cancel) to 504 TEMPO_ESGOTADO', () => {
    const err = mapOracleError(oraError('ORA-01013: user requested cancel of current operation'));
    expect(err.statusCode).toBe(504);
    expect(err.code).toBe('TEMPO_ESGOTADO');
  });

  it('maps an ORA-20xxx package error to 422 ORA_20XXX using only the first line of the message', () => {
    const err = mapOracleError(
      oraError('ORA-20005: Documento já anulado.\nORA-06512: at "SIID.PKG_DOCUMENTOS_SVR", line 120'),
    );
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('ORA_20XXX');
    expect(err.message).toBe('ORA-20005: Documento já anulado.');
  });

  it('falls back to 500 ERRO for an unrecognized ORA code', () => {
    const err = mapOracleError(oraError('ORA-99999: something unmapped'));
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('ERRO');
    expect(err.message).toBe('Erro');
  });

  it('falls back to 500 ERRO for a non-Oracle error', () => {
    const err = mapOracleError(new Error('boom'));
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('ERRO');
  });

  it('keeps the raw message on the mapped error for logging as oraCode, never in the client message', () => {
    const err = mapOracleError(oraError('ORA-00054: resource busy and acquire with NOWAIT specified'));
    expect(err.oraCode).toBe('ORA-00054');
    expect(err.message).not.toContain('resource busy');
  });
});
