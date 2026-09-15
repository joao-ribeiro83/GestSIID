// Compares the Forms2XML dumps of dev/T and dev/P module by module and writes analysis/T_vs_P_DIFF.md.
// Usage: node diff-xml.js <formsXmlDir> <out.md>      (formsXmlDir has T/ and P/ subfolders)
const fs = require('fs');
const path = require('path');
const [root, out] = process.argv.slice(2);
if (!root || !out) { console.error('usage: node diff-xml.js <formsXmlDir> <out.md>'); process.exit(1); }

const IGNORE_ATTRS = new Set(['DirtyInfo']);
const CODE_ATTRS = new Set(['TriggerText', 'ProgramUnitText', 'RecordGroupQuery', 'WhereClause', 'OrderByClause', 'QueryDataSourceName', 'MenuItemCode', 'InitialValue', 'FormulaText', 'DefaultValue']);
const LAYOUT_ATTRS = /^(X|Y)Position$|^(Width|Height|ViewportX|ViewportY|ViewportWidth|ViewportHeight|DisplayPosition|MinimizedX|MinimizedY|WindowX|WindowY|ContainerX|ContainerY|Distance.*|ItemsDisplayed|.*FontSize|.*FontName|.*FontWeight|.*FontStyle|.*FontSpacing|Bevel|.*ColorName|.*Pattern|PromptAttachmentOffset|PromptAlignOffset|PromptDisplayStyle|StartPromptOffset|Zoom.*)$/;
const TEXT_ATTRS = new Set(['Label', 'Prompt', 'Title', 'Hint', 'Tooltip', 'AlertMessage', 'Button1Label', 'Button2Label', 'Button3Label', 'ConsoleWindow', 'Comment']);

// Forms2XML stores newlines inside attribute values as the literal text "&#10;" (so the file shows "&amp;#10;"):
// XML-decode first, then turn the literal character references into real newlines/tabs.
const dec = s => s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&#10;|&#x[aA];/g, '\n').replace(/&#13;|&#x[dD];/g, '').replace(/&#9;|&#x9;/g, '\t');

function parse(xml) {
  const map = new Map(); // path -> {attrs}
  const stack = [];
  const counters = [new Map()];
  const re = /<(\/?)([A-Za-z_][\w.-]*)((?:\s+[\w:.-]+="[^"]*")*)\s*(\/?)>/g;
  let m;
  while ((m = re.exec(xml))) {
    const [, close, tag, attrText, selfClose] = m;
    if (tag.startsWith('?')) continue;
    if (close) { stack.pop(); counters.pop(); continue; }
    const attrs = {};
    for (const a of attrText.matchAll(/([\w:.-]+)="([^"]*)"/g)) attrs[a[1]] = a[2];
    let key = tag;
    if (attrs.Name !== undefined) key += `[${attrs.Name}]`;
    else if (attrs.Index !== undefined) key += `#${attrs.Index}`;
    else { const c = counters[counters.length - 1]; const n = (c.get(tag) || 0) + 1; c.set(tag, n); if (n > 1 || tag === 'Graphics' || tag === 'Point') key += `#${n}`; }
    const p = [...stack, key].join('/');
    map.set(p, attrs);
    if (!selfClose) { stack.push(key); counters.push(new Map()); }
  }
  return map;
}

function lcsDiff(a, b) { // line diff -> array of ['=',' line'] | ['-',line] | ['+',line]
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const res = []; let i = 0, j = 0;
  while (i < n && j < m) { if (a[i] === b[j]) { res.push(['=', a[i]]); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) res.push(['-', a[i++]]); else res.push(['+', b[j++]]); }
  while (i < n) res.push(['-', a[i++]]); while (j < m) res.push(['+', b[j++]]);
  return res;
}
const norm = s => dec(s).replace(/\s+/g, ' ').trim();
const mask = s => s
  .replace(/(v_password\s*:=\s*')[^']*(')/gi, '$1***$2')
  .replace(/(v_username\s*:=\s*')([^']{0,4})[^']*(')/gi, '$1$2****$3')
  .replace(/(LOGON\s*\(\s*')([^']{0,4})[^']*('\s*,\s*')[^'@]*(@)/gi, '$1$2****$3***$4');

function hunks(oldText, newText, ctx = 2) {
  const a = dec(oldText).split('\n'), b = dec(newText).split('\n');
  const d = lcsDiff(a, b);
  const outL = []; let last = -ctx - 1;
  d.forEach((x, idx) => {
    if (x[0] !== '=') {
      for (let k = Math.max(last + 1, idx - ctx, 0); k < idx; k++) if (d[k][0] === '=') outL.push('  ' + d[k][1]);
      outL.push((x[0] === '-' ? '- ' : '+ ') + x[1]); last = idx;
    } else if (idx - last <= ctx && last >= 0) { outL.push('  ' + x[1]); last = idx; }
  });
  return mask(outL.join('\n'));
}

const tDir = path.join(root, 'T'), pDir = path.join(root, 'P');
const tFiles = new Set(fs.readdirSync(tDir).filter(f => f.endsWith('.xml')));
const pFiles = new Set(fs.readdirSync(pDir).filter(f => f.endsWith('.xml')));
const md = [`# dev/T vs dev/P — module differences`, '', `Generated ${new Date().toISOString().slice(0, 10)} by \`analysis/tools/diff-xml.js\` from the Forms2XML dumps in \`analysis/forms-xml/{T,P}\`. Attribute \`DirtyInfo\` ignored. Passwords masked.`, ''];
md.push('## Files present in only one folder', '');
for (const f of [...tFiles].filter(f => !pFiles.has(f)).sort()) md.push(`- only in T: \`${f}\``);
for (const f of [...pFiles].filter(f => !tFiles.has(f)).sort()) md.push(`- only in P: \`${f}\``);
md.push('', '## Summary', '', '| Module | Result | Code diffs | Text/label diffs | Layout-only diffs | Other attr diffs | Only in T | Only in P |', '|---|---|---|---|---|---|---|---|');
const details = [];
const summary = [];
for (const f of [...tFiles].filter(f => pFiles.has(f)).sort()) {
  const T = parse(fs.readFileSync(path.join(tDir, f), 'utf8'));
  const P = parse(fs.readFileSync(path.join(pDir, f), 'utf8'));
  const onlyT = [...T.keys()].filter(k => !P.has(k));
  const onlyP = [...P.keys()].filter(k => !T.has(k));
  const changes = { code: [], text: [], layout: [], other: [] };
  for (const [k, ta] of T) {
    const pa = P.get(k); if (!pa) continue;
    const keys = new Set([...Object.keys(ta), ...Object.keys(pa)]);
    for (const a of keys) {
      if (IGNORE_ATTRS.has(a)) continue;
      const tv = ta[a], pv = pa[a];
      if (tv === pv) continue;
      if (CODE_ATTRS.has(a)) { if (norm(tv || '') === norm(pv || '')) continue; changes.code.push({ k, a, tv: tv || '', pv: pv || '' }); }
      else if (TEXT_ATTRS.has(a)) changes.text.push({ k, a, tv, pv });
      else if (LAYOUT_ATTRS.test(a)) changes.layout.push({ k, a, tv, pv });
      else changes.other.push({ k, a, tv, pv });
    }
  }
  const total = onlyT.length + onlyP.length + changes.code.length + changes.text.length + changes.layout.length + changes.other.length;
  const result = total === 0 ? 'identical' : (changes.code.length || onlyT.length || onlyP.length || changes.text.length || changes.other.length) ? 'DIFFERENT' : 'layout only';
  md.push(`| ${f.replace(/_(fmb|mmb)\.xml$/, '')} | ${result} | ${changes.code.length} | ${changes.text.length} | ${changes.layout.length} | ${changes.other.length} | ${onlyT.length} | ${onlyP.length} |`);
  summary.push(`${f.replace(/_(fmb|mmb)\.xml$/, '').padEnd(32)} ${result.padEnd(11)} code=${changes.code.length} text=${changes.text.length} layout=${changes.layout.length} other=${changes.other.length} onlyT=${onlyT.length} onlyP=${onlyP.length}`);
  if (total === 0) continue;
  details.push(`## ${f.replace(/_(fmb|mmb)\.xml$/, '')}`, '');
  const short = p => p.replace(/^Module\/(FormModule|MenuModule)\[[^\]]*\]\//, '');
  if (onlyT.length) { details.push(`**Only in T (${onlyT.length}):**`, ...onlyT.slice(0, 60).map(k => `- \`${short(k)}\``), onlyT.length > 60 ? `- … ${onlyT.length - 60} more` : '', ''); }
  if (onlyP.length) { details.push(`**Only in P (${onlyP.length}):**`, ...onlyP.slice(0, 60).map(k => `- \`${short(k)}\``), onlyP.length > 60 ? `- … ${onlyP.length - 60} more` : '', ''); }
  if (changes.code.length) {
    details.push(`**Code differences (${changes.code.length}):**`, '');
    for (const c of changes.code) details.push(`\`${short(c.k)}\` · ${c.a} (− T / + P)`, '', '```diff', hunks(c.tv, c.pv), '```', '');
  }
  if (changes.text.length) { details.push(`**Text/label differences (${changes.text.length}):**`, ...changes.text.slice(0, 80).map(c => `- \`${short(c.k)}\` ${c.a}: T=\`${dec(c.tv ?? '')}\` → P=\`${dec(c.pv ?? '')}\``), ''); }
  if (changes.other.length) { details.push(`**Other property differences (${changes.other.length}):**`, ...changes.other.slice(0, 80).map(c => `- \`${short(c.k)}\` ${c.a}: T=\`${c.tv ?? ''}\` → P=\`${c.pv ?? ''}\``), changes.other.length > 80 ? `- … ${changes.other.length - 80} more` : '', ''); }
  if (changes.layout.length) {
    const byObj = new Map(); for (const c of changes.layout) byObj.set(short(c.k), (byObj.get(short(c.k)) || 0) + 1);
    details.push(`**Layout-only differences (${changes.layout.length} attributes on ${byObj.size} objects):** ` + [...byObj.entries()].slice(0, 40).map(([k, n]) => `\`${k}\` (${n})`).join(', ') + (byObj.size > 40 ? ' …' : ''), '');
  }
}
md.push('', ...details);
fs.writeFileSync(out, md.join('\n'), 'utf8');
console.log(summary.join('\n'));
console.log(`\nwrote ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
