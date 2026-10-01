// Runs SQL on the LOCAL Oracle container only (never the TEST database).
//   node app/local-db/sql.mjs "SELECT ... FROM ..."      (one statement; PL/SQL blocks allowed)
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const oracledb = createRequire(path.join(here, '../apps/api/package.json'))('oracledb');
oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_LIB_DIR });
const conn = await oracledb.getConnection({ user: 'sys', password: process.env.LOCAL_PASSWORD ?? 'localqa',
  connectString: process.env.LOCAL_DB ?? 'localhost:1521/FREEPDB1', privilege: oracledb.SYSDBA });
const r = await conn.execute(process.argv[2], [], { autoCommit: true, outFormat: oracledb.OUT_FORMAT_ARRAY });
for (const row of r.rows ?? []) console.log(row.join(' | '));
if (r.rowsAffected != null) console.log(`rows affected: ${r.rowsAffected}`);
await conn.close();
