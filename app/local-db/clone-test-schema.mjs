// Copies the objects the app uses from the TEST schema into a LOCAL Oracle container, so QA can
// write freely without touching the real database (HARD RULE: ../../CLAUDE.md).
//
// The source connection runs SELECT / WITH only (same guard as apps/api/src/test/read-only-db.ts).
// Every write goes to the local container.
//
//   docker run -d --name gestsiid-oracle -p 1521:1521 -e ORACLE_PASSWORD=localqa \
//     -e APP_USER=SIID_TESTES -e APP_USER_PASSWORD=localqa gvenzl/oracle-free:23-slim-faststart
//   ORACLE_CLIENT_LIB_DIR=<Instant Client 19> node app/local-db/clone-test-schema.mjs
//
// Then run the app with ../.env.localdb (DB_USER/DB_PASSWORD=SIID_TESTES/localqa,
// DB_CONNECT_STRING=host.docker.internal:1521/FREEPDB1, other keys as ../.env).
//
// ponytail: tables over BIG rows are sampled (newest SAMPLE documents and their children,
// first SAMPLE rows elsewhere). Joins across sampled tables can return fewer rows than TEST.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OBF_BODY, OBF_SPEC } from './obfuscation-shim.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(here, '../apps/api/package.json'));
const oracledb = require('oracledb');

const BIG = 150_000;
const SAMPLE = 3_000;
const CHILD_CAP = 30_000;
const LOCAL = { connectString: process.env.LOCAL_DB ?? 'localhost:1521/FREEPDB1', password: process.env.LOCAL_PASSWORD ?? 'localqa' };

const env = Object.fromEntries(fs.readFileSync(path.join(here, '../../.env'), 'utf8').split(/\r?\n/)
  .filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_LIB_DIR || env.ORACLE_CLIENT_LIB_DIR });
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB, oracledb.NUMBER];
oracledb.fetchAsBuffer = [oracledb.BLOB];

const src = await oracledb.getConnection({ user: env.DB_USER, password: env.DB_PASSWORD, connectString: env.DB_CONNECT_STRING });
const read = async (sql, binds = {}, opts = {}) => {
  if (!/^\s*(SELECT|WITH)\b/i.test(sql) || /\bFOR\s+UPDATE\b/i.test(sql)) throw new Error(`READ-ONLY GUARD: ${sql.slice(0, 40)}`);
  return (await src.execute(sql, binds, opts)).rows;
};
const sys = await oracledb.getConnection({ user: 'sys', password: LOCAL.password, connectString: LOCAL.connectString, privilege: oracledb.SYSDBA });
const log = [];
const run = async (sql, binds = {}, quiet = false) => {
  try { return await sys.execute(sql, binds, { autoCommit: true }); }
  catch (e) { if (!quiet) log.push(`${e.message.split('\n')[0]} :: ${sql.slice(0, 120).replace(/\s+/g, ' ')}`); return null; }
};
const S = env.DB_SCHEMA;
const q = (s) => `"${s}"`;
// Unqualified names in DDL (DEFAULT seq.NEXTVAL, trigger ON t, view bodies) resolve in the owner's schema.
const asOwner = (o) => sys.execute(`ALTER SESSION SET CURRENT_SCHEMA = ${q(o)}`);

// ---- 1. Which objects: identifiers in the app code that name a schema object, plus everything
// they depend on (all_dependencies, transitive).
const tokens = new Set();
const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) {
  const p = path.join(d, f.name);
  if (f.isDirectory()) { if (!['node_modules', 'dist'].includes(f.name)) walk(p); }
  else if (/\.tsx?$/.test(f.name)) for (const m of fs.readFileSync(p, 'utf8').matchAll(/\b[A-Z][A-Z0-9_$#]{2,}\b/g)) tokens.add(m[0]);
} };
walk(path.join(here, '../apps/api/src')); walk(path.join(here, '../packages/shared/src'));
const own = await read(`SELECT object_name n, object_type t FROM all_objects WHERE owner = :s
  AND object_type IN ('TABLE','VIEW','SEQUENCE','PACKAGE','FUNCTION','PROCEDURE','SYNONYM','TYPE')`, { s: S });
const SKIP_OWNERS = `('SYS','PUBLIC','SYSTEM','XDB','MDSYS','CTXSYS','ORDSYS','WMSYS','OLAPSYS')`;
const seen = new Map();
let frontier = own.filter((o) => tokens.has(o.N)).map((o) => ({ owner: S, name: o.N, type: o.T }));
const sysDeps = new Set();
while (frontier.length) {
  const next = [];
  for (const o of frontier) {
    const k = `${o.owner}.${o.name}`;
    if (seen.has(k)) continue;
    seen.set(k, o);
    const deps = await read(`SELECT DISTINCT referenced_owner ro, referenced_name rn, referenced_type rt FROM all_dependencies
      WHERE owner = :o AND name = :n AND referenced_type <> 'NON-EXISTENT'`, { o: o.owner, n: o.name });
    for (const d of deps) {
      if (d.RO === 'SYS' && d.RT === 'PACKAGE') sysDeps.add(d.RN);
      else if (!SKIP_OWNERS.includes(`'${d.RO}'`) && !seen.has(`${d.RO}.${d.RN}`)) next.push({ owner: d.RO, name: d.RN, type: d.RT });
    }
  }
  frontier = next;
  // Triggers on copied tables are copied too, so walk what they use (TRG_SAVE_ALETA_RGEDOC -> CO_USRALERT).
  if (!frontier.length) {
    const tabs = [...seen.values()].filter((x) => x.type === 'TABLE');
    for (const t of tabs) for (const tr of await read(`SELECT owner, trigger_name FROM all_triggers WHERE table_owner = :o AND table_name = :t`, { o: t.owner, t: t.name })) {
      if (!seen.has(`${tr.OWNER}.${tr.TRIGGER_NAME}`)) frontier.push({ owner: tr.OWNER, name: tr.TRIGGER_NAME, type: 'TRIGGER' });
    }
  }
}
const objs = [...seen.values()];
const owners = [...new Set(objs.map((o) => o.owner))];
const of = (type) => objs.filter((o) => o.type === type);
console.log(`objects: ${objs.length} in ${owners.join(', ')}`);

// ---- 2. Local users.
for (const u of owners) {
  if (u !== 'SIID_TESTES') await run(`CREATE USER ${q(u)} IDENTIFIED BY ${LOCAL.password} QUOTA UNLIMITED ON USERS`, {}, true);
  await run(`GRANT CREATE SESSION, CREATE TABLE, CREATE VIEW, CREATE SEQUENCE, CREATE PROCEDURE, CREATE SYNONYM,
    CREATE TRIGGER, CREATE TYPE, UNLIMITED TABLESPACE TO ${q(u)}`);
  for (const p of sysDeps) await run(`GRANT EXECUTE ON SYS.${q(p)} TO ${q(u)}`, {}, true);
}

// ---- 3. Sequences first (column defaults use them; start past TEST's last number), then tables.
for (const s of of('SEQUENCE')) {
  const [r] = await read(`SELECT min_value, max_value, increment_by, cycle_flag, last_number FROM all_sequences WHERE sequence_owner = :o AND sequence_name = :n`, { o: s.owner, n: s.name });
  await run(`DROP SEQUENCE ${q(s.owner)}.${q(s.name)}`, {}, true);
  await run(`CREATE SEQUENCE ${q(s.owner)}.${q(s.name)} START WITH ${BigInt(r.LAST_NUMBER) + 1000n} INCREMENT BY ${r.INCREMENT_BY}
    MINVALUE ${r.MIN_VALUE} MAXVALUE ${r.MAX_VALUE} ${r.CYCLE_FLAG === 'Y' ? 'CYCLE' : 'NOCYCLE'}`);
}
const tables = of('TABLE');
const colsOf = new Map();
const LOBS = new Set(['CLOB', 'BLOB', 'LONG', 'LONG RAW', 'XMLTYPE']);
const typeSql = (c) => {
  const t = c.DATA_TYPE;
  if (t === 'VARCHAR2' || t === 'CHAR' || t === 'NVARCHAR2' || t === 'NCHAR') return `${t}(${c.CHAR_LENGTH} CHAR)`;
  if (t === 'NUMBER') return c.DATA_PRECISION != null ? `NUMBER(${c.DATA_PRECISION},${c.DATA_SCALE ?? 0})` : c.DATA_SCALE === '0' ? 'NUMBER(*,0)' : 'NUMBER';
  if (t === 'RAW') return `RAW(${c.DATA_LENGTH})`;
  if (t === 'LONG' || t === 'XMLTYPE') return 'CLOB';
  if (t === 'LONG RAW') return 'BLOB';
  return t; // DATE, TIMESTAMP(6), CLOB, BLOB, FLOAT
};
for (const t of tables) {
  const cols = await read(`SELECT column_name, data_type, data_length, char_length, data_precision, data_scale, nullable, data_default, virtual_column
    FROM all_tab_cols WHERE owner = :o AND table_name = :t AND hidden_column = 'NO' ORDER BY column_id`, { o: t.owner, t: t.name },
  { fetchInfo: { DATA_DEFAULT: { type: oracledb.STRING } } });
  colsOf.set(`${t.owner}.${t.name}`, cols);
  if (!cols.length) { log.push(`skip ${t.owner}.${t.name}: no visible columns`); continue; }
  const pk = await read(`SELECT c.constraint_name, cc.column_name FROM all_constraints c JOIN all_cons_columns cc
    ON cc.owner = c.owner AND cc.constraint_name = c.constraint_name WHERE c.owner = :o AND c.table_name = :t AND c.constraint_type = 'P' ORDER BY cc.position`, { o: t.owner, t: t.name });
  const iot = (await read(`SELECT iot_type FROM all_tables WHERE owner = :o AND table_name = :t`, { o: t.owner, t: t.name }))[0]?.IOT_TYPE === 'IOT';
  const defs = cols.map((c) => c.VIRTUAL_COLUMN === 'YES'
    ? `${q(c.COLUMN_NAME)} AS (${c.DATA_DEFAULT.trim()})`
    : `${q(c.COLUMN_NAME)} ${typeSql(c)}${c.DATA_DEFAULT?.trim() ? ` DEFAULT ${c.DATA_DEFAULT.trim()}` : ''}${c.NULLABLE === 'N' ? ' NOT NULL' : ''}`);
  if (pk.length) defs.push(`CONSTRAINT ${q(pk[0].CONSTRAINT_NAME)} PRIMARY KEY (${pk.map((p) => q(p.COLUMN_NAME)).join(', ')})`);
  await asOwner(t.owner);
  await run(`DROP TABLE ${q(t.owner)}.${q(t.name)} CASCADE CONSTRAINTS PURGE`, {}, true);
  await run(`CREATE TABLE ${q(t.owner)}.${q(t.name)} (\n${defs.join(',\n')}\n)${iot && pk.length ? ' ORGANIZATION INDEX OVERFLOW' : ''}`);
}
console.log(`tables created: ${tables.length}`);

// ---- 4. Data (sampled above BIG rows).
const counts = Object.fromEntries((await read(`SELECT owner || '.' || table_name k, NVL(num_rows, 0) n FROM all_tables
  WHERE owner IN (${owners.map((o) => `'${o}'`).join(',')})`)).map((r) => [r.K, Number(r.N)]));
const docSample = `SELECT ID FROM (SELECT ID FROM ${q(S)}."SVR_DOCUMENTOS" ORDER BY ID DESC) WHERE ROWNUM <= ${SAMPLE}`;
const where = (t, cols) => {
  if ((counts[`${t.owner}.${t.name}`] ?? 0) <= BIG) return '';
  if (t.owner === S && t.name === 'SVR_DOCUMENTOS') return `WHERE ID IN (${docSample})`;
  if (t.owner === S && cols.some((c) => c.COLUMN_NAME === 'DOCUMENTO_ID')) return `WHERE DOCUMENTO_ID IN (${docSample}) AND ROWNUM <= ${CHILD_CAP}`;
  return `WHERE ROWNUM <= ${SAMPLE}`;
};
const loaded = {};
for (const t of tables) {
  const cols = colsOf.get(`${t.owner}.${t.name}`).filter((c) => c.VIRTUAL_COLUMN === 'NO');
  const select = cols.map((c) => c.DATA_TYPE === 'XMLTYPE' ? `CASE WHEN x.${q(c.COLUMN_NAME)} IS NULL THEN NULL ELSE x.${q(c.COLUMN_NAME)}.getClobVal() END ${q(c.COLUMN_NAME)}` : `x.${q(c.COLUMN_NAME)}`).join(', ');
  const fetchInfo = Object.fromEntries(cols.filter((c) => c.DATA_TYPE === 'LONG').map((c) => [c.COLUMN_NAME, { type: oracledb.STRING }])
    .concat(cols.filter((c) => c.DATA_TYPE === 'LONG RAW').map((c) => [c.COLUMN_NAME, { type: oracledb.BUFFER }])));
  const ins = `INSERT INTO ${q(t.owner)}.${q(t.name)} (${cols.map((c) => q(c.COLUMN_NAME)).join(', ')}) VALUES (${cols.map((_, i) => `:${i + 1}`).join(', ')})`;
  const hasLob = cols.some((c) => LOBS.has(c.DATA_TYPE));
  let n = 0;
  let rs;
  try {
    const body = stripRead(`SELECT ${select} FROM ${q(t.owner)}.${q(t.name)} x ${where(t, cols)}`);
    rs = (await src.execute(body, {}, { resultSet: true, fetchInfo, outFormat: oracledb.OUT_FORMAT_ARRAY, fetchArraySize: 500 })).resultSet;
    for (let rows = await rs.getRows(500); rows.length; rows = await rs.getRows(500)) {
      if (hasLob) for (const r of rows) await sys.execute(ins, r.map((v, i) => bindOf(cols[i], v)));
      else await sys.executeMany(ins, rows, { bindDefs: cols.map((c, i) => bindDef(c, rows, i)) });
      n += rows.length;
    }
    await sys.commit();
  } catch (e) { log.push(`data ${t.owner}.${t.name}: ${e.message.split('\n')[0]}`); }
  finally { await rs?.close(); }
  loaded[`${t.owner}.${t.name}`] = n;
}
function stripRead(sql) { if (!/^\s*SELECT\b/i.test(sql) || /\bFOR\s+UPDATE\b/i.test(sql)) throw new Error('READ-ONLY GUARD'); return sql; }
function bindType(c) {
  if (['NUMBER', 'FLOAT'].includes(c.DATA_TYPE)) return oracledb.STRING; // fetched as string: no precision loss
  if (c.DATA_TYPE === 'DATE') return oracledb.DATE;
  if (c.DATA_TYPE.startsWith('TIMESTAMP')) return oracledb.DB_TYPE_TIMESTAMP;
  if (['RAW', 'BLOB', 'LONG RAW'].includes(c.DATA_TYPE)) return oracledb.BUFFER;
  return oracledb.STRING;
}
function bindDef(c, rows, i) {
  const type = bindType(c);
  if (type !== oracledb.STRING && type !== oracledb.BUFFER) return { type };
  // maxSize is in bytes: an accented character takes 2 in UTF-8.
  return { type, maxSize: Math.max(1, ...rows.map((r) => (typeof r[i] === 'string' ? Buffer.byteLength(r[i]) : r[i]?.length ?? 0))) };
}
function bindOf(c, v) {
  if (c.DATA_TYPE === 'CLOB' || c.DATA_TYPE === 'LONG' || c.DATA_TYPE === 'XMLTYPE') return { type: oracledb.DB_TYPE_CLOB, val: v };
  if (c.DATA_TYPE === 'BLOB' || c.DATA_TYPE === 'LONG RAW') return { type: oracledb.DB_TYPE_BLOB, val: v };
  return { type: bindType(c), val: v };
}
console.log(`rows loaded: ${Object.values(loaded).reduce((a, b) => a + b, 0)}`);

// ---- 5. Unique constraints/indexes, checks, FKs (NOVALIDATE: samples leave orphans).
for (const t of tables) {
  const T = `${q(t.owner)}.${q(t.name)}`;
  const cons = await read(`SELECT c.constraint_name cn, c.constraint_type ct, c.search_condition sc, c.r_owner ro, c.delete_rule dr,
      r.table_name rt, (SELECT LISTAGG('"' || column_name || '"', ',') WITHIN GROUP (ORDER BY position) FROM all_cons_columns x WHERE x.owner = c.owner AND x.constraint_name = c.constraint_name) cols,
      (SELECT LISTAGG('"' || column_name || '"', ',') WITHIN GROUP (ORDER BY position) FROM all_cons_columns x WHERE x.owner = r.owner AND x.constraint_name = r.constraint_name) rcols
    FROM all_constraints c LEFT JOIN all_constraints r ON r.owner = c.r_owner AND r.constraint_name = c.r_constraint_name
    WHERE c.owner = :o AND c.table_name = :t AND c.constraint_type IN ('U','C','R')`, { o: t.owner, t: t.name },
  { fetchInfo: { SC: { type: oracledb.STRING } } });
  for (const c of cons) {
    if (c.CT === 'U') await run(`ALTER TABLE ${T} ADD CONSTRAINT ${q(c.CN)} UNIQUE (${c.COLS}) ENABLE NOVALIDATE`);
    if (c.CT === 'C' && !/^\s*"?\w+"?\s+IS\s+NOT\s+NULL\s*$/i.test(c.SC)) await run(`ALTER TABLE ${T} ADD CONSTRAINT ${q(c.CN)} CHECK (${c.SC}) ENABLE NOVALIDATE`);
    if (c.CT === 'R' && seen.has(`${c.RO}.${c.RT}`)) await run(`ALTER TABLE ${T} ADD CONSTRAINT ${q(c.CN)} FOREIGN KEY (${c.COLS})
      REFERENCES ${q(c.RO)}.${q(c.RT)} (${c.RCOLS})${c.DR === 'CASCADE' ? ' ON DELETE CASCADE' : c.DR === 'SET NULL' ? ' ON DELETE SET NULL' : ''} ENABLE NOVALIDATE`);
  }
  const uix = await read(`SELECT i.index_name n, LISTAGG('"' || ic.column_name || '"', ',') WITHIN GROUP (ORDER BY ic.column_position) cols
    FROM all_indexes i JOIN all_ind_columns ic ON ic.index_owner = i.owner AND ic.index_name = i.index_name
    WHERE i.table_owner = :o AND i.table_name = :t AND i.uniqueness = 'UNIQUE' AND i.index_type = 'NORMAL'
      AND NOT EXISTS (SELECT 1 FROM all_constraints c WHERE c.owner = i.table_owner AND c.index_name = i.index_name)
    GROUP BY i.index_name`, { o: t.owner, t: t.name });
  for (const i of uix) await run(`CREATE UNIQUE INDEX ${q(t.owner)}.${q(i.N)} ON ${T} (${i.COLS})`);
}

// ---- 6. Synonyms, grants.
for (const s of of('SYNONYM')) {
  const [r] = await read(`SELECT table_owner, table_name FROM all_synonyms WHERE owner = :o AND synonym_name = :n`, { o: s.owner, n: s.name });
  if (r && owners.includes(r.TABLE_OWNER)) await run(`CREATE OR REPLACE SYNONYM ${q(s.owner)}.${q(s.name)} FOR ${q(r.TABLE_OWNER)}.${q(r.TABLE_NAME)}`);
}
for (const o of objs.filter((x) => x.owner !== S)) {
  const priv = ['TABLE', 'VIEW'].includes(o.type) ? 'SELECT, INSERT, UPDATE, DELETE' : ['PACKAGE', 'PROCEDURE', 'FUNCTION', 'TYPE'].includes(o.type) ? 'EXECUTE' : null;
  if (priv) for (const u of owners.filter((x) => x !== o.owner)) await run(`GRANT ${priv} ON ${q(o.owner)}.${q(o.name)} TO ${q(u)}`, {}, true);
}

// ---- 7. Code: types, views, packages/functions/procedures, then triggers; recompile at the end.
const source = async (o, type) => (await read(`SELECT text FROM all_source WHERE owner = :o AND name = :n AND type = :t ORDER BY line`, { o: o.owner, n: o.name, t: type })).map((r) => r.TEXT).join('');
// Oracle 23 has no DBMS_OBFUSCATION_TOOLKIT: install a DBMS_CRYPTO stand-in (obfuscation-shim.mjs).
for (const u of owners) {
  await run(`GRANT EXECUTE ON SYS.DBMS_CRYPTO TO ${q(u)}`);
  await asOwner(u);
  await run(`CREATE OR REPLACE ${OBF_SPEC.replace('PACKAGE ', `PACKAGE ${q(u)}.`)}`);
  await run(`CREATE OR REPLACE ${OBF_BODY.replace('PACKAGE BODY ', `PACKAGE BODY ${q(u)}.`)}`);
}
const createCode = async (o, text) => {
  if (!text) return;
  await asOwner(o.owner);
  await run(`CREATE OR REPLACE ${text.replace(/^\s*(TYPE|PACKAGE BODY|PACKAGE|FUNCTION|PROCEDURE|TRIGGER)\s+("?[\w$#]+"?\.)?/i, (_, kw) => `${kw} ${q(o.owner)}.`)}`);
};
for (let pass = 0; pass < 2; pass++) for (const o of of('TYPE')) await createCode(o, await source(o, 'TYPE')); // types may use each other
for (const o of of('VIEW')) {
  const [v] = await read(`SELECT text FROM all_views WHERE owner = :o AND view_name = :n`, { o: o.owner, n: o.name }, { fetchInfo: { TEXT: { type: oracledb.STRING } } });
  await asOwner(o.owner);
  await run(`CREATE OR REPLACE FORCE VIEW ${q(o.owner)}.${q(o.name)} AS ${v.TEXT}`);
}
for (const o of objs.filter((x) => ['FUNCTION', 'PROCEDURE', 'PACKAGE'].includes(x.type))) await createCode(o, await source(o, o.type));
for (const o of of('PACKAGE')) await createCode(o, await source(o, 'PACKAGE BODY'));
const trigs = await read(`SELECT owner, trigger_name, table_owner, table_name FROM all_triggers
  WHERE table_owner IN (${owners.map((o) => `'${o}'`).join(',')}) AND base_object_type = 'TABLE'`);
for (const tr of trigs.filter((x) => seen.has(`${x.TABLE_OWNER}.${x.TABLE_NAME}`))) {
  await createCode({ owner: tr.OWNER }, await source({ owner: tr.OWNER, name: tr.TRIGGER_NAME }, 'TRIGGER'));
}
// TEST hides CO_CNET_LOG's columns from this account; PCK_CNET_LOG only needs these two (%TYPE).
if (seen.has('GADOR_TESTES.CO_CNET_LOG')) await run(`CREATE TABLE "GADOR_TESTES"."CO_CNET_LOG" (CDFUNCIO VARCHAR2(100), MENSAGEM VARCHAR2(4000), DATA DATE DEFAULT SYSDATE)`);
for (const u of owners) await run(`BEGIN DBMS_UTILITY.COMPILE_SCHEMA(:u, FALSE); END;`, { u });
const invalid = (await sys.execute(`SELECT owner || '.' || object_name || ' (' || object_type || ')' x FROM dba_objects
  WHERE owner IN (${owners.map((o) => `'${o}'`).join(',')}) AND status <> 'VALID'`, [], { outFormat: oracledb.OUT_FORMAT_ARRAY })).rows.map((r) => r[0]);

const report = { loaded, invalid, errors: log };
fs.writeFileSync(path.join(here, 'clone-report.json'), JSON.stringify(report, null, 1));
console.log(`invalid objects: ${invalid.length}; errors: ${log.length}; details in app/local-db/clone-report.json`);
await src.close(); await sys.close();
