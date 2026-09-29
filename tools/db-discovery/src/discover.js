// GestSIID DB discovery — plain node-oracledb, no other deps. Writes analysis/db/*.
// Run: npm run discover  (reads ../../.env via Node's built-in --env-file)
import oracledb from "oracledb";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(HERE, "../../../analysis/db");

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];
oracledb.fetchAsBuffer = [oracledb.BLOB];

// Thin mode can't authenticate against accounts with a pre-11g password verifier (NJS-116).
// Reuse the OCI client already shipped with the Oracle Forms/Reports middleware install instead
// of downloading a separate Instant Client.
if (process.env.ORACLE_CLIENT_LIB_DIR) {
  oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_LIB_DIR });
}

const IDENT_RE = /^[A-Za-z][A-Za-z0-9_$#]*$/;
function ident(name) {
  if (!IDENT_RE.test(name)) throw new Error(`Refusing to interpolate unsafe identifier: ${name}`);
  return name;
}
function qualified(owner, name) {
  return `"${ident(owner)}"."${ident(name)}"`;
}

// STRUCTURE.md §4 "Database inventory" — explicit tables/views (dictionary rows excluded, they're not app objects)
const EXPLICIT_OBJECTS = [
  "SVR_DOCUMENTOS", "SVR_DOCUMENTOS_VW", "SVR_QUEUE", "SVR_GESTAO_SIID_TMP",
  "SVR_DOCUMENTO_COMENTARIOS", "SVR_PARAMETROS_DOCUMENTO", "SVR_PARAMETROS_DOC_NOME_VW",
  "SVR_ANEXOS_DOCUMENTO", "ERR_ERROS_SIID", "SVR_IMPRESSORAS", "SVR_VARIAVEIS_SIID",
  "SVR_BACKUPS", "SVR_AMBIENTES_IMPRESSAO", "SVR_REPORT_SIID", "SVR_PARAMETROS_REPORT",
  "DOC_MODELOS_DOCUMENTO", "DOC_SECCOES_DOCUMENTO", "DOC_CONDICOES_APR",
  "DOC_PARAMETROS_OMISSAO", "DOC_ATRIBUTOS_EDOC", "DOC_ATRIBUTOS_ARQUIVO", "DOC_PARAMETRO",
  "CFG_PERMISSOES_SIID", "DOC_PERMISSOES_IMPRESSAO", "DOC_IMPRESSORAS_DOC",
  "DOC_IMPRESSOES_MODELO_USR", "DOC_PERFIS_DEPARTAMENTO", "DOC_FUNCOES_DEPARTAMENTO",
  "CFG_UTILIZADORES", "CFG_UTILIZADORES_VW", "CFG_DOMINIOS", "CFG_VALORES_DOMINIO",
  "CFG_TIPOS_MIDIA", "CFG_UNIDADES_MEDIDA",
  "MRECIBO", "MPERSONA", "M_USUARIOS", "CO_EMPLEADOS", "TTAPVAAT", "GD_ESPACO_BD",
];
const PREFIXES = ["CFG_", "DOC_", "SVR_", "ERR_", "GD_"];
const LOOKUP_TABLES = [
  "CFG_VALORES_DOMINIO", "CFG_TIPOS_MIDIA", "CFG_UNIDADES_MEDIDA",
  "SVR_VARIAVEIS_SIID", "SVR_AMBIENTES_IMPRESSAO",
];
const EXPLICIT_PACKAGES = [
  "PKG_DOCUMENTOS_SVR", "PCK_SG", "PKG_SIID_UTIL", "PKG_FICHIERS",
  "PKG_TRANSFERTS", "PCK_ERRGE", "USER_SECURITY",
];
const EXPLICIT_SEQUENCES = [
  "ID_QUEUE_SEQ", "ID_ERROS_SEQ", "ID_COMENTARIO_DOCUMENTO_SEQ", "SEQ_SVR_GS_TMP",
  "ID_DOCUMENTO_SEQ", "SEQ_BACKUP_ID", "ID_IMPRESSORA_SEQ", "ID_TEMPLATE_REPORT_SEQ",
];

function mdTable(headers, rows) {
  if (rows.length === 0) return "_(none)_\n";
  const esc = (v) => String(v ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${headers.map((h) => esc(r[h])).join(" | ")} |`).join("\n");
  return `${head}\n${sep}\n${body}\n`;
}

// These dumps get committed: never write a password or a (reversible DES) password hash.
// PASSWORD columns (e.g. SVR_AMBIENTES_IMPRESSAO) and SVR_VARIAVEIS_SIID.VALOR on PASSWORD* rows.
function maskSecrets(row) {
  const out = { ...row };
  if ("PASSWORD" in out && out.PASSWORD != null) out.PASSWORD = "***";
  if (String(out.TIPO_VARIAVEL_RF ?? "").startsWith("PASSWORD") && out.VALOR != null) out.VALOR = "***";
  return out;
}

async function main() {
  const { DB_USER, DB_PASSWORD, DB_CONNECT_STRING, DB_SCHEMA } = process.env;
  if (!DB_USER || !DB_PASSWORD || !DB_CONNECT_STRING || !DB_SCHEMA) {
    throw new Error("Missing DB_USER, DB_PASSWORD, DB_CONNECT_STRING or DB_SCHEMA — fill in .env first (see .env.example)");
  }
  ident(DB_SCHEMA);

  await mkdir(path.join(OUT_DIR, "tables"), { recursive: true });
  await mkdir(path.join(OUT_DIR, "packages"), { recursive: true });

  const facts = { surprises: [] };

  let connection;
  try {
    connection = await oracledb.getConnection({
      user: DB_USER,
      password: DB_PASSWORD,
      connectString: DB_CONNECT_STRING,
    });
  } catch (err) {
    facts.connectError = err.message;
    facts.mode = err.message.includes("NJS-116")
      ? "THIN CONNECT FAILED (NJS-116: old password verifier, e.g. 10G/pre-11g style). The DB or this account uses a legacy password hash Thin mode can't authenticate. Thick mode (initOracleClient + Oracle Instant Client) is required. Stopping: the rest of this script assumes a working thin connection."
      : "THIN CONNECT FAILED — DB may be older than Oracle 12.1, or another connection problem occurred. Thick mode (initOracleClient + Instant Client) may be required. Stopping: the rest of this script assumes a working thin connection.";
    await writeFile(path.join(OUT_DIR, "DB_FACTS.md"), renderFacts(facts), "utf8");
    console.error("Connection failed:", err.message);
    process.exitCode = 1;
    return;
  }

  try {
    await connection.execute(`ALTER SESSION SET CURRENT_SCHEMA = ${ident(DB_SCHEMA)}`);

    facts.mode = oracledb.thin
      ? "Thin mode — connected fine, so the DB (and this account's password verifier) support Oracle 12.1+ thin auth."
      : `Thick mode (OCI client via initOracleClient, libDir=${process.env.ORACLE_CLIENT_LIB_DIR}) — required because this account's password verifier is a legacy type Thin mode rejects (NJS-116).`;

    facts.banner = await safeScalar(connection, `SELECT banner FROM v$version WHERE ROWNUM = 1`, "banner");
    facts.nlsCharacterset = await safeScalar(connection, `SELECT value FROM nls_database_parameters WHERE parameter = 'NLS_CHARACTERSET'`, "value");
    facts.nlsNcharCharacterset = await safeScalar(connection, `SELECT value FROM nls_database_parameters WHERE parameter = 'NLS_NCHAR_CHARACTERSET'`, "value");
    facts.dbTimeZone = await safeScalar(connection, `SELECT dbtimezone FROM dual`, "DBTIMEZONE");

    // --- resolve tables/views ---
    const resolved = new Map(); // name -> {owner, type}
    for (const name of EXPLICIT_OBJECTS) {
      const r = await connection.execute(
        `SELECT owner, object_type FROM all_objects WHERE object_name = :name AND object_type IN ('TABLE','VIEW') ORDER BY owner FETCH FIRST 1 ROW ONLY`,
        { name }
      );
      if (r.rows.length) resolved.set(name, { owner: r.rows[0].OWNER, type: r.rows[0].OBJECT_TYPE });
      else facts.surprises.push(`Table/view \`${name}\` (named in STRUCTURE.md §4) was NOT FOUND or not accessible to ${DB_USER}.`);
    }
    const likeClauses = PREFIXES.map((_, i) => `object_name LIKE :p${i} ESCAPE '\\'`).join(" OR ");
    const likeBinds = Object.fromEntries(PREFIXES.map((p, i) => [`p${i}`, `${p.replace(/_/g, "\\_")}%`]));
    const owned = await connection.execute(
      `SELECT object_name, object_type FROM all_objects WHERE owner = :schema AND object_type IN ('TABLE','VIEW') AND (${likeClauses}) ORDER BY object_name`,
      { schema: DB_SCHEMA, ...likeBinds }
    );
    for (const row of owned.rows) {
      if (!resolved.has(row.OBJECT_NAME)) resolved.set(row.OBJECT_NAME, { owner: DB_SCHEMA, type: row.OBJECT_TYPE });
    }

    const tableNames = [...resolved.keys()].sort();
    for (const name of tableNames) {
      await writeTableDoc(connection, name, resolved.get(name), OUT_DIR);
    }
    facts.tableCount = tableNames.length;

    // --- packages / procedures / functions ---
    const pkgResolved = new Map(); // name -> {owner, types:Set}
    for (const name of EXPLICIT_PACKAGES) {
      const r = await connection.execute(
        `SELECT owner, object_type FROM all_objects WHERE object_name = :name AND object_type IN ('PACKAGE','PACKAGE BODY','PROCEDURE','FUNCTION') ORDER BY owner`,
        { name }
      );
      if (r.rows.length === 0) {
        facts.surprises.push(`Package \`${name}\` was NOT FOUND or not accessible to ${DB_USER}.`);
        continue;
      }
      const owner = r.rows[0].OWNER;
      const types = new Set(r.rows.filter((x) => x.OWNER === owner).map((x) => x.OBJECT_TYPE));
      pkgResolved.set(name, { owner, types });
    }
    const ownedPkgs = await connection.execute(
      `SELECT object_name, object_type FROM all_objects WHERE owner = :schema AND object_type IN ('PACKAGE','PACKAGE BODY','PROCEDURE','FUNCTION') ORDER BY object_name`,
      { schema: DB_SCHEMA }
    );
    for (const row of ownedPkgs.rows) {
      const entry = pkgResolved.get(row.OBJECT_NAME) ?? { owner: DB_SCHEMA, types: new Set() };
      entry.types.add(row.OBJECT_TYPE);
      pkgResolved.set(row.OBJECT_NAME, entry);
    }
    const pkgNames = [...pkgResolved.keys()].sort();
    for (const name of pkgNames) {
      await writePackageDoc(connection, name, pkgResolved.get(name), OUT_DIR);
    }
    facts.packageCount = pkgNames.length;
    if (pkgResolved.has("USER_SECURITY")) {
      facts.userSecurityNote = "See packages/USER_SECURITY.sql for the exact ENCRYPT signature (source text, not guessed).";
    }

    // --- sequences ---
    const seqRows = await connection.execute(
      `SELECT sequence_owner, sequence_name, min_value, max_value, increment_by, last_number, cache_size, cycle_flag
       FROM all_sequences
       WHERE sequence_owner = :schema OR sequence_name IN (${EXPLICIT_SEQUENCES.map((_, i) => `:s${i}`).join(",")})
       ORDER BY sequence_name`,
      { schema: DB_SCHEMA, ...Object.fromEntries(EXPLICIT_SEQUENCES.map((s, i) => [`s${i}`, s])) }
    );
    const foundSeq = new Set(seqRows.rows.map((r) => r.SEQUENCE_NAME));
    for (const s of EXPLICIT_SEQUENCES) {
      if (!foundSeq.has(s)) facts.surprises.push(`Sequence \`${s}\` (named in STRUCTURE.md §4) was NOT FOUND or not accessible.`);
    }
    await writeFile(
      path.join(OUT_DIR, "sequences.md"),
      `# Sequences\n\n${mdTable(
        ["SEQUENCE_OWNER", "SEQUENCE_NAME", "MIN_VALUE", "MAX_VALUE", "INCREMENT_BY", "LAST_NUMBER", "CACHE_SIZE", "CYCLE_FLAG"],
        seqRows.rows
      )}`,
      "utf8"
    );

    // --- synonyms ---
    const synRows = await connection.execute(
      `SELECT owner, synonym_name, table_owner, table_name, db_link
       FROM all_synonyms WHERE owner IN ('PUBLIC', :dbUser) ORDER BY owner, synonym_name`,
      { dbUser: DB_USER.toUpperCase() }
    );
    await writeFile(
      path.join(OUT_DIR, "synonyms.md"),
      `# Synonyms visible to ${DB_USER}\n\nShows which schema really owns each object behind a PUBLIC or private synonym.\n\n${mdTable(
        ["OWNER", "SYNONYM_NAME", "TABLE_OWNER", "TABLE_NAME", "DB_LINK"],
        synRows.rows
      )}`,
      "utf8"
    );

    // --- grants ---
    const grantTargets = [...tableNames, ...pkgNames, ...EXPLICIT_SEQUENCES];
    const grantRows = [];
    for (const name of grantTargets) {
      const r = await connection.execute(
        `SELECT table_name, grantee, privilege, grantable
         FROM all_tab_privs WHERE table_name = :name AND (grantee = :dbUser OR grantee = 'PUBLIC')
         ORDER BY grantee, privilege`,
        { name, dbUser: DB_USER.toUpperCase() }
      );
      grantRows.push(...r.rows);
    }
    grantRows.sort((a, b) => (a.TABLE_NAME + a.GRANTEE + a.PRIVILEGE).localeCompare(b.TABLE_NAME + b.GRANTEE + b.PRIVILEGE));
    await writeFile(
      path.join(OUT_DIR, "grants.md"),
      `# Grants on discovered objects for ${DB_USER}\n\n${mdTable(["TABLE_NAME", "GRANTEE", "PRIVILEGE", "GRANTABLE"], grantRows)}`,
      "utf8"
    );

    await writeFile(path.join(OUT_DIR, "DB_FACTS.md"), renderFacts(facts), "utf8");
    console.log(`Done. ${tableNames.length} tables/views, ${pkgNames.length} packages. See ${OUT_DIR}`);
  } finally {
    await connection.close();
  }
}

async function safeScalar(connection, sql, col, binds = {}) {
  try {
    const r = await connection.execute(sql, binds);
    return r.rows[0]?.[col.toUpperCase()] ?? r.rows[0]?.[col] ?? null;
  } catch (err) {
    return `(query failed: ${err.message})`;
  }
}

async function writeTableDoc(connection, name, { owner, type }, outDir) {
  const cols = await connection.execute(
    `SELECT column_name, data_type, data_length, data_precision, data_scale, nullable, data_default, column_id
     FROM all_tab_columns WHERE owner = :owner AND table_name = :name ORDER BY column_id`,
    { owner, name }
  );
  const comments = await connection.execute(
    `SELECT column_name, comments FROM all_col_comments WHERE owner = :owner AND table_name = :name`,
    { owner, name }
  );
  const commentByCol = new Map(comments.rows.map((r) => [r.COLUMN_NAME, r.COMMENTS]));
  const tableComment = await safeScalar(
    connection,
    `SELECT comments FROM all_tab_comments WHERE owner = :owner AND table_name = :name`,
    "comments",
    { owner, name }
  );

  const colRows = cols.rows.map((c) => ({
    NAME: c.COLUMN_NAME,
    TYPE: c.DATA_TYPE,
    LENGTH: c.DATA_LENGTH,
    PRECISION: c.DATA_PRECISION,
    SCALE: c.DATA_SCALE,
    NULLABLE: c.NULLABLE,
    DEFAULT: c.DATA_DEFAULT,
    COMMENT: commentByCol.get(c.COLUMN_NAME) ?? "",
  }));

  const constraints = await connection.execute(
    `SELECT cons.constraint_name, cons.constraint_type, col.column_name, col.position
     FROM all_constraints cons JOIN all_cons_columns col
       ON cons.constraint_name = col.constraint_name AND cons.owner = col.owner
     WHERE cons.owner = :owner AND cons.table_name = :name AND cons.constraint_type IN ('P','U')
     ORDER BY cons.constraint_name, col.position`,
    { owner, name }
  );
  const fks = await connection.execute(
    `SELECT cons.constraint_name, col.column_name, col.position,
            r.owner AS r_owner, r.table_name AS r_table_name
     FROM all_constraints cons
       JOIN all_cons_columns col ON cons.constraint_name = col.constraint_name AND cons.owner = col.owner
       JOIN all_constraints r ON cons.r_constraint_name = r.constraint_name AND cons.r_owner = r.owner
     WHERE cons.owner = :owner AND cons.table_name = :name AND cons.constraint_type = 'R'
     ORDER BY cons.constraint_name, col.position`,
    { owner, name }
  );
  const indexes = await connection.execute(
    `SELECT ind.index_name, ind.uniqueness, col.column_name, col.column_position
     FROM all_indexes ind JOIN all_ind_columns col
       ON ind.index_name = col.index_name AND ind.owner = col.index_owner
     WHERE ind.table_owner = :owner AND ind.table_name = :name
     ORDER BY ind.index_name, col.column_position`,
    { owner, name }
  );

  let rowCount = null;
  let viewText = null;
  let lookupRows = null;
  if (type === "TABLE") {
    rowCount = await safeScalar(connection, `SELECT COUNT(*) AS cnt FROM ${qualified(owner, name)}`, "cnt");
  } else if (type === "VIEW") {
    viewText = await safeScalar(connection, `SELECT text FROM all_views WHERE owner = :owner AND view_name = :name`, "text", { owner, name });
  }
  if (LOOKUP_TABLES.includes(name) && colRows.length > 0) {
    const orderBy = colRows.map((c) => `"${ident(c.NAME)}"`).join(", ");
    try {
      const r = await connection.execute(`SELECT * FROM ${qualified(owner, name)} ORDER BY ${orderBy} FETCH FIRST 200 ROWS ONLY`);
      lookupRows = r;
    } catch (err) {
      lookupRows = { error: err.message };
    }
  }

  const lines = [`# ${name}`, ""];
  lines.push(`Owner: \`${owner}\` &nbsp; Type: \`${type}\``);
  if (tableComment) lines.push(`\n> ${tableComment}`);
  if (rowCount !== null) lines.push(`\nRow count: **${rowCount}**`);
  lines.push("\n## Columns\n");
  lines.push(mdTable(["NAME", "TYPE", "LENGTH", "PRECISION", "SCALE", "NULLABLE", "DEFAULT", "COMMENT"], colRows));
  lines.push("\n## Primary / unique keys\n");
  lines.push(mdTable(["CONSTRAINT_NAME", "CONSTRAINT_TYPE", "COLUMN_NAME", "POSITION"], constraints.rows));
  lines.push("\n## Foreign keys\n");
  lines.push(mdTable(["CONSTRAINT_NAME", "COLUMN_NAME", "POSITION", "R_OWNER", "R_TABLE_NAME"], fks.rows));
  lines.push("\n## Indexes\n");
  lines.push(mdTable(["INDEX_NAME", "UNIQUENESS", "COLUMN_NAME", "COLUMN_POSITION"], indexes.rows));
  if (viewText !== null) {
    lines.push("\n## View SQL text\n");
    lines.push("```sql\n" + viewText + "\n```");
  }
  if (lookupRows) {
    lines.push("\n## First 200 rows\n");
    if (lookupRows.error) lines.push(`_(query failed: ${lookupRows.error})_`);
    else lines.push(mdTable(lookupRows.metaData.map((m) => m.name), lookupRows.rows.map(maskSecrets)));
  }

  await writeFile(path.join(outDir, "tables", `${name}.md`), lines.join("\n") + "\n", "utf8");
}

async function writePackageDoc(connection, name, { owner, types }, outDir) {
  const parts = [`-- ${name} (owner: ${owner})\n`];
  const missingParts = [];
  for (const [label, type] of [["SPEC", "PACKAGE"], ["BODY", "PACKAGE BODY"]]) {
    if (!types.has(type)) {
      if (label === "SPEC" && !types.has("PROCEDURE") && !types.has("FUNCTION")) missingParts.push(label);
      continue;
    }
    const src = await connection.execute(
      `SELECT text FROM all_source WHERE owner = :owner AND name = :name AND type = :type ORDER BY line`,
      { owner, name, type }
    );
    parts.push(`-- ===== ${label} (${type}) =====`);
    parts.push(src.rows.map((r) => r.TEXT).join(""));
  }
  for (const type of ["PROCEDURE", "FUNCTION"]) {
    if (types.has(type)) {
      const src = await connection.execute(
        `SELECT text FROM all_source WHERE owner = :owner AND name = :name AND type = :type ORDER BY line`,
        { owner, name, type }
      );
      parts.push(`-- ===== ${type} =====`);
      parts.push(src.rows.map((r) => r.TEXT).join(""));
    }
  }
  if (missingParts.length) parts.push(`-- NOTE: ${missingParts.join(", ")} not accessible/found for this account.`);
  await writeFile(path.join(outDir, "packages", `${name}.sql`), parts.join("\n\n") + "\n", "utf8");
}

function renderFacts(f) {
  const lines = ["# DB_FACTS", ""];
  if (f.connectError) {
    lines.push(`**Connection FAILED**: ${f.connectError}`, "", f.mode, "");
    return lines.join("\n");
  }
  lines.push(`- Connect mode: ${f.mode}`);
  lines.push(`- Banner: ${f.banner}`);
  lines.push(`- NLS_CHARACTERSET: ${f.nlsCharacterset}`);
  lines.push(`- NLS_NCHAR_CHARACTERSET: ${f.nlsNcharCharacterset}`);
  lines.push(`- DB time zone: ${f.dbTimeZone}`);
  lines.push(`- Tables/views discovered: ${f.tableCount}`);
  lines.push(`- Packages/procedures/functions discovered: ${f.packageCount}`);
  if (f.userSecurityNote) lines.push(`- ${f.userSecurityNote}`);
  lines.push("", "## Surprises", "");
  if (f.surprises.length === 0) lines.push("_(none)_");
  else for (const s of f.surprises) lines.push(`- ${s}`);
  return lines.join("\n") + "\n";
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
