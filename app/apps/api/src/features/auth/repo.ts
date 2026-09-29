import { execute, queryOne, type DbPool } from '../../db/oracle.ts';

/** One CFG_UTILIZADORES row as login needs it; OK / ATIVO are computed in SQL (0/1). */
export interface LoginRow {
  USERNAME: string;
  NOME: string | null;
  TIPO_UTILIZADOR_RF: string | null;
  OK: number;
  ATIVO: number;
}

/**
 * Auth data access (ARCHITECTURE.md §5, D-07, A-04). Every hash is computed and compared inside
 * the database: passwords go in as binds and no hash ever comes back to Node. `routes.test.ts`
 * uses a fake; `routes.contract.test.ts` runs this against the TEST schema.
 */
export interface AuthRepo {
  findLogin(username: string, password: string, ambiente: string): Promise<LoginRow | undefined>;
  /** True when `password` is the environment's regeneration password (BR-DOC-14). */
  checkRegeneracao(password: string, ambiente: string, username: string): Promise<boolean>;
  /** Sets it to `nova` only when `actual` is the current value; false = `actual` wrong (D-07d). */
  setRegeneracao(actual: string, nova: string, ambiente: string, username: string): Promise<boolean>;
}

// FD_LOGIN_SIID compares `USER_SECURITY.ENCRYPT(:pwd) != PASSWORD`: PL/SQL turns the RAW into
// hex to compare it with the VARCHAR2 column, hence RAWTOHEX (A-04). DATA_INICIO/DATA_FIM per D-07b.
// Driven from DUAL so the hash runs for unknown users too (same timing): one row always comes
// back, with USERNAME null when the user does not exist.
const LOGIN_SQL = `SELECT u.USERNAME, u.NOME, u.TIPO_UTILIZADOR_RF,
       CASE WHEN u.PASSWORD = h.HASH THEN 1 ELSE 0 END AS OK,
       CASE WHEN u.DATA_INICIO <= SYSDATE AND NVL(u.DATA_FIM, SYSDATE) >= SYSDATE THEN 1 ELSE 0 END AS ATIVO
  FROM (SELECT RAWTOHEX(USER_SECURITY.ENCRYPT(:pwd)) AS HASH FROM DUAL) h
  LEFT JOIN CFG_UTILIZADORES u ON u.USERNAME = :u AND u.AMBIENTE_ID = :ambiente`;

const REGEN_WHERE = `TIPO_VARIAVEL_RF = 'PASSWORD' AND AMBIENTE_ID = :ambiente`;

const CHECK_REGEN_SQL = `SELECT 1 AS OK FROM SVR_VARIAVEIS_SIID
 WHERE ${REGEN_WHERE} AND VALOR = RAWTOHEX(CRYPT_PKG.ENCRYPTSTRINGRAW(:pwd))`;

// Check and write in one statement: 0 rows updated = wrong current value. A row locked by Forms
// makes the UPDATE wait, which DB_CALL_TIMEOUT_MS bounds (504 TEMPO_ESGOTADO).
const SET_REGEN_SQL = `UPDATE SVR_VARIAVEIS_SIID
   SET VALOR = RAWTOHEX(CRYPT_PKG.ENCRYPTSTRINGRAW(:nova))
 WHERE ${REGEN_WHERE} AND VALOR = RAWTOHEX(CRYPT_PKG.ENCRYPTSTRINGRAW(:actual))`;

export function oracleAuthRepo(pool: DbPool, callTimeoutMs: number): AuthRepo {
  return {
    async findLogin(username, password, ambiente) {
      const row = await queryOne<LoginRow>(pool, { username }, 'auth.login', callTimeoutMs, LOGIN_SQL, {
        pwd: password,
        u: username,
        ambiente,
      });
      return row?.USERNAME ? row : undefined;
    },

    async checkRegeneracao(password, ambiente, username) {
      const row = await queryOne(pool, { username }, 'auth.reauth-regeneracao', callTimeoutMs, CHECK_REGEN_SQL, {
        pwd: password,
        ambiente,
      });
      return row !== undefined;
    },

    async setRegeneracao(actual, nova, ambiente, username) {
      const result = await execute(pool, { username }, 'auth.regeneracao-password', callTimeoutMs, SET_REGEN_SQL, {
        nova,
        actual,
        ambiente,
      });
      return (result.rowsAffected ?? 0) > 0;
    },
  };
}
