// Builds per-module summaries from the string dumps made by extract-fmb.js.
// Usage: node summarize-forms.js <extractedDir> <summaryDir>
// Writes <module>.md (inventory) and <module>.plsql.txt (all PL/SQL/SQL text) per module,
// plus INDEX.json with the cross-module facts (tables, packages, form calls, globals).
const fs = require('fs');
const path = require('path');

const [inDir, outDir] = process.argv.slice(2);
if (!inDir || !outDir) { console.error('usage: node summarize-forms.js <extractedDir> <summaryDir>'); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });

const uniq = a => [...new Set(a)].sort();
const grab = (s, re, g = 1) => { const r = []; let m; while ((m = re.exec(s))) r.push(m[g].toUpperCase()); return uniq(r); };
const TRIGGER_RE = /\b((?:WHEN|PRE|POST|ON|KEY)-[A-Z][A-Z0-9-]+)\b/g;
const SKIP_TABLES = new Set(['DUAL', 'SYS', 'THE', 'AND', 'WHERE', 'SELECT', 'TABLE']);

const index = {};
for (const f of fs.readdirSync(inDir).filter(f => f.endsWith('.txt'))) {
  const mod = f.replace(/\.txt$/, '');
  const chunks = fs.readFileSync(path.join(inDir, f), 'utf8').split('\n\n');
  const code = chunks.filter(c => /\b(BEGIN|DECLARE|PROCEDURE|FUNCTION|SELECT|INSERT|UPDATE|DELETE|IF\b|GO_BLOCK|EXECUTE_QUERY|MESSAGE\s*\()/i.test(c) && c.length > 15);
  const all = chunks.join('\n');
  const codeText = code.join('\n\n----\n\n');
  const U = codeText.toUpperCase();

  const tables = uniq([
    ...grab(codeText, /\bFROM\s+([A-Z_][A-Z0-9_.$@]*)/gi),
    ...grab(codeText, /\bINSERT\s+INTO\s+([A-Z_][A-Z0-9_.$@]*)/gi),
    ...grab(codeText, /\bUPDATE\s+([A-Z_][A-Z0-9_.$@]*)\s+SET\b/gi),
    ...grab(codeText, /\bDELETE\s+FROM\s+([A-Z_][A-Z0-9_.$@]*)/gi),
    ...grab(codeText, /\bJOIN\s+([A-Z_][A-Z0-9_.$@]*)/gi),
  ]).filter(t => !SKIP_TABLES.has(t) && !/^[(:]/.test(t));
  const s = {
    module: mod,
    strings: chunks.length,
    codeChunks: code.length,
    tables,
    packages: grab(codeText, /\b((?:PKG|PCK|PK)_[A-Z0-9_]+)\s*\./gi),
    dbCalls: uniq(grab(codeText, /\b([A-Z][A-Z0-9_]+\.[A-Z][A-Z0-9_]+)\s*\(/g).filter(x => !/^(DBMS_OUTPUT|GLOBAL|PARAMETER|SYSTEM)\./.test(x) && !/^:/.test(x))),
    triggers: grab(all, TRIGGER_RE),
    programUnits: grab(codeText, /(?:^|\n)\s*(?:PROCEDURE|FUNCTION)\s+([A-Z_][A-Z0-9_]*)/gi),
    formCalls: uniq([...grab(codeText, /\b(?:CALL_FORM|OPEN_FORM|NEW_FORM)\s*\(\s*'?([A-Z_][A-Z0-9_]*)/gi), ...grab(all, /\b(FD_[A-Z0-9_]+)\b/gi)]).filter(x => x !== mod.replace(/\.(fmb|mmb)$/i, '').toUpperCase()),
    globals: grab(codeText, /:GLOBAL\.([A-Z_][A-Z0-9_]*)/gi),
    parameters: grab(codeText, /:PARAMETER\.([A-Z_][A-Z0-9_]*)/gi),
    blocksItems: grab(codeText, /:([A-Z_][A-Z0-9_]*\.[A-Z_][A-Z0-9_]*)/gi).filter(x => !/^(GLOBAL|PARAMETER|SYSTEM)\./.test(x)),
    webutil: grab(all, /\b((?:WEBUTIL|CLIENT|OLE2|TEXT_IO|HOST)_?[A-Z0-9_]*)\s*[.(]/gi),
    builtins: uniq((U.match(/\b(HOST|OLE2|TEXT_IO|DBMS_LOB|UTL_FILE|DDE|FORMS_OLE|RUN_REPORT_OBJECT|RUN_PRODUCT|WEB\.SHOW_DOCUMENT|SET_CUSTOM_PROPERTY|GET_CUSTOM_PROPERTY|FBEAN|SHOW_LOV|EXECUTE_QUERY|COMMIT_FORM|POST|FORMS_DDL|CREATE_RECORD|DELETE_RECORD|SHOW_ALERT|EXIT_FORM|LOGON|LOGOUT|DBMS_CRYPTO|DBMS_OBFUSCATION_TOOLKIT|UTL_RAW|DBMS_SCHEDULER|DBMS_JOB|UTL_HTTP|UTL_SMTP|UTL_MAIL)\b/g) || [])),
    messages: uniq((codeText.match(/(?:MESSAGE|SET_ALERT_PROPERTY)\s*\([^'\n]*'([^']{4,120})'/gi) || []).map(m => m.replace(/^[^']*'/, '').replace(/'$/, ''))).slice(0, 60),
  };
  index[mod] = s;
  fs.writeFileSync(path.join(outDir, mod + '.plsql.txt'), codeText, 'utf8');
  const md = [`# ${mod}`, '',
    `strings: ${s.strings}, code chunks: ${s.codeChunks}`, '',
    ...['tables', 'packages', 'dbCalls', 'triggers', 'programUnits', 'formCalls', 'globals', 'parameters', 'blocksItems', 'webutil', 'builtins', 'messages']
      .map(k => `## ${k} (${s[k].length})\n${s[k].map(x => '- ' + x).join('\n') || '- (none)'}\n`)].join('\n');
  fs.writeFileSync(path.join(outDir, mod + '.md'), md, 'utf8');
}
fs.writeFileSync(path.join(outDir, 'INDEX.json'), JSON.stringify(index, null, 1), 'utf8');

// compact console overview
for (const [m, s] of Object.entries(index)) {
  console.log(`\n== ${m}  (code chunks ${s.codeChunks}, triggers ${s.triggers.length}, PUs ${s.programUnits.length})`);
  console.log(' tables:', s.tables.join(', '));
  console.log(' packages:', s.packages.join(', '));
  console.log(' formCalls:', s.formCalls.join(', '));
  console.log(' globals:', s.globals.join(', '));
  console.log(' params:', s.parameters.join(', '));
  console.log(' builtins:', s.builtins.join(', '));
  console.log(' webutil:', s.webutil.slice(0, 15).join(', '));
}
