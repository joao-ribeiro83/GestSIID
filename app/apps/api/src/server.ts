import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import oracledb from 'oracledb';
import { buildApp } from './app.ts';
import { configWarnings, loadConfig } from './config.ts';
import { buildPoolAttrs, query, type DbPool } from './db/oracle.ts';
import { oracleAuthRepo } from './features/auth/repo.ts';

/**
 * Boot sequence (§2): config → initOracleClient (Thick, D-31) → pool → GET_AMBIENTE_ID() check
 * (D-27, exit 1 on mismatch) → buildApp → listen. Not unit-tested: it needs a live Oracle
 * connection, which TEST_STRATEGY.md skips unless DB_CONNECT_STRING is set.
 */

const config = loadConfig();

oracledb.initOracleClient(config.ORACLE_CLIENT_LIB_DIR ? { libDir: config.ORACLE_CLIENT_LIB_DIR } : undefined);
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];
oracledb.fetchAsBuffer = [oracledb.BLOB];
oracledb.autoCommit = false;

// The real driver's overloaded Connection type doesn't collapse cleanly onto oracle.ts's
// DbConnection (see that file's doc comment) — cast once here, at the only place a real pool
// is created; every helper is otherwise exercised against a fake in oracle.test.ts.
const pool = (await oracledb.createPool(buildPoolAttrs(config))) as unknown as DbPool;
const systemUser = { username: 'gestsiid-system' };

const ambienteRow = await query<{ AMBIENTE: string }>(
  pool,
  systemUser,
  'boot.check-ambiente',
  config.DB_CALL_TIMEOUT_MS,
  'SELECT GET_AMBIENTE_ID() AS AMBIENTE FROM DUAL',
).then((rows) => rows[0]);

if (!ambienteRow || ambienteRow.AMBIENTE !== config.AMBIENTE_ID) {
  console.error(
    `AMBIENTE_ID mismatch (D-27): configured "${config.AMBIENTE_ID}", database returned "${ambienteRow?.AMBIENTE}".`,
  );
  process.exit(1);
}

const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'web', 'dist');

const app = await buildApp({
  config,
  ambiente: config.AMBIENTE_ID,
  distDir,
  authRepo: oracleAuthRepo(pool, config.DB_CALL_TIMEOUT_MS),
  db: { pool, callTimeoutMs: config.DB_CALL_TIMEOUT_MS },
  logger: { level: config.LOG_LEVEL },
  async checkDb() {
    const start = Date.now();
    await query(pool, systemUser, 'health', config.DB_CALL_TIMEOUT_MS, 'SELECT 1 FROM DUAL');
    return Date.now() - start;
  },
});

app.addHook('onClose', async () => {
  await (pool as unknown as oracledb.Pool).close(10);
});

let shuttingDown = false;
async function shutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  const forceExit = setTimeout(() => process.exit(1), 25_000);
  forceExit.unref();
  await app.close();
  clearTimeout(forceExit);
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

for (const warning of configWarnings(config)) app.log.warn(warning);
await app.listen({ port: config.PORT, host: '0.0.0.0' });
