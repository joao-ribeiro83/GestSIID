#!/usr/bin/env node
// Reads Forms2XML dumps (analysis/forms-xml/T/*_fmb.xml, *_mmb.xml) and writes
// a per-module markdown summary to analysis/forms-xml/summary/<module>.md.
// Plain Node, no dependencies: entities and child elements are attributes-only
// in these dumps (no mixed text content), so a small recursive-descent reader
// over the raw string is enough — no need for a full XML/DOM library.

'use strict';
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'forms-xml', 'T');
const OUT_DIR = path.join(__dirname, '..', 'forms-xml', 'summary');

// ---------- tiny XML reader ----------
// Node shape: { tag, attrs: {k:v}, children: [Node, ...] }

function parseXML(text) {
  let i = 0;
  const n = text.length;

  function skipWs() {
    while (i < n && /\s/.test(text[i])) i++;
  }

  function parseDecl() {
    // <?xml ... ?>
    if (text.startsWith('<?', i)) {
      const end = text.indexOf('?>', i);
      i = end + 2;
    }
  }

  function parseName() {
    const start = i;
    while (i < n && !/[\s/>]/.test(text[i])) i++;
    return text.slice(start, i);
  }

  function parseAttrs() {
    const attrs = {};
    while (true) {
      skipWs();
      if (text[i] === '/' || text[i] === '>') break;
      const nameStart = i;
      while (i < n && text[i] !== '=') i++;
      const attrName = text.slice(nameStart, i).trim();
      i++; // '='
      const quote = text[i];
      i++; // opening quote
      const valStart = i;
      while (i < n && text[i] !== quote) i++;
      const rawVal = text.slice(valStart, i);
      i++; // closing quote
      attrs[attrName] = decodeEntities(rawVal);
    }
    return attrs;
  }

  function parseElement() {
    // assumes text[i] === '<'
    i++; // consume '<'
    const tag = parseName();
    const attrs = parseAttrs();
    skipWs();
    if (text[i] === '/') {
      i += 2; // '/>'
      return { tag, attrs, children: [] };
    }
    i++; // '>'
    const children = [];
    while (true) {
      skipWs();
      if (text.startsWith('</', i)) {
        i = text.indexOf('>', i) + 1;
        break;
      }
      if (text[i] === '<') {
        children.push(parseElement());
      } else {
        break; // no mixed text content in these dumps
      }
    }
    return { tag, attrs, children };
  }

  skipWs();
  parseDecl();
  skipWs();
  return parseElement(); // <Module>
}

function decodeEntities(s) {
  s = s.replace(/&(amp|lt|gt|quot|apos|#x[0-9a-fA-F]+|#[0-9]+);/g, (m, ent) => {
    if (ent === 'amp') return '&';
    if (ent === 'lt') return '<';
    if (ent === 'gt') return '>';
    if (ent === 'quot') return '"';
    if (ent === 'apos') return "'";
    if (ent[0] === '#' && ent[1] === 'x') return String.fromCodePoint(parseInt(ent.slice(2), 16));
    return String.fromCodePoint(parseInt(ent.slice(1), 10));
  });
  // Forms2XML double-escapes newlines/tabs inside multi-line text (e.g. trigger
  // source): the raw file has "&amp;#10;", which the pass above turns into the
  // literal text "&#10;" (not a real newline) because &amp; decodes first and
  // the reference is never re-scanned. Fix those up explicitly.
  s = s.replace(/&#10;/g, '\n').replace(/&#x9;/g, '\t').replace(/&#13;/g, '\r');
  return s;
}

// ---------- credential masking ----------
function maskCredentials(s) {
  if (!s) return s;
  s = s.replace(/(v_password\s*:=\s*)'[^']*'/gi, "$1'***'");
  s = s.replace(/(LOGON\s*\(\s*'[^']*'\s*,\s*')[^']*(@)/gi, '$1***$2');
  s = s.replace(/(\bpass(?:word)?\s*:=\s*)'[^']*'/gi, "$1'***'");
  return s;
}

// ---------- markdown helpers ----------
function esc(v) {
  if (v === undefined || v === null || v === '') return '';
  return String(v).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

function table(headers, rows) {
  if (rows.length === 0) return '_none_\n';
  let out = `| ${headers.join(' | ')} |\n`;
  out += `| ${headers.map(() => '---').join(' | ')} |\n`;
  for (const row of rows) out += `| ${row.map(esc).join(' | ')} |\n`;
  return out;
}

function findAll(node, tag) {
  const out = [];
  (function walk(n) {
    for (const c of n.children) {
      if (c.tag === tag) out.push(c);
      walk(c);
    }
  })(node);
  return out;
}

function directChildren(node, tag) {
  return node.children.filter((c) => c.tag === tag);
}

// ---------- section builders ----------
function buildBlocksSection(form) {
  const blocks = directChildren(form, 'Block');
  let out = '';
  for (const block of blocks) {
    const a = block.attrs;
    out += `#### Block: ${a.Name}\n\n`;
    out += table(
      ['Query Data Source', 'Where', 'Order By', 'Records Displayed', 'Insert', 'Update', 'Delete'],
      [[a.QueryDataSourceName, a.WhereClause, a.OrderByClause, a.RecordsDisplayCount,
        a.InsertAllowed ?? 'true', a.UpdateAllowed ?? 'true', a.DeleteAllowed ?? 'true']]
    );

    const items = directChildren(block, 'Item');
    if (items.length) {
      out += '\n| Name | Type | DataType | MaxLen | Format | Required | Enabled | Visible | Canvas | Tab | X | Y | Prompt/Label | LOV | Default | Hint |\n';
      out += '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n';
      for (const item of items) {
        const ia = item.attrs;
        out += `| ${[
          ia.Name, ia.ItemType, ia.DataType, ia.MaximumLength, ia.FormatMask,
          ia.Required ?? 'false', ia.Enabled ?? 'true', ia.Visible ?? 'true',
          ia.CanvasName, ia.TabPageName, ia.XPosition, ia.YPosition,
          ia.Prompt || ia.Label, ia.LovName, ia.InitializeValue, ia.Hint || ia.Tooltip,
        ].map(esc).join(' | ')} |\n`;

        const listEls = directChildren(item, 'ListItemElement').filter((e) => e.attrs.Name || e.attrs.Value);
        if (listEls.length) {
          out += `  - List elements: ${listEls.map((e) => `${e.attrs.Name || '(blank)'}=${e.attrs.Value || ''}`).join(', ')}\n`;
        }
        const radios = directChildren(item, 'RadioButton');
        if (radios.length) {
          out += `  - Radio values: ${radios.map((r) => `${r.attrs.Label || r.attrs.Name}=${r.attrs.RadioButtonValue}`).join(', ')}\n`;
        }
      }
      out += '\n';
    }
  }
  return out || '_none_\n';
}

function buildAlertsSection(form) {
  const alerts = directChildren(form, 'Alert');
  const rows = alerts.map((al) => {
    const a = al.attrs;
    const buttons = [a.Button1Label, a.Button2Label, a.Button3Label].filter((b) => b).join(' / ');
    return [a.Name, a.Title, maskCredentials(a.AlertMessage), buttons, a.AlertStyle];
  });
  return table(['Name', 'Title', 'Message', 'Buttons', 'Style'], rows);
}

function buildLovRgSection(form) {
  let out = '#### LOVs\n\n';
  const lovs = directChildren(form, 'LOV');
  out += table(
    ['Name', 'Title', 'Record Group', 'Columns (Return Item)'],
    lovs.map((lov) => {
      const cols = directChildren(lov, 'LOVColumnMapping')
        .map((c) => `${c.attrs.Name}${c.attrs.ReturnItem ? `->${c.attrs.ReturnItem}` : ''}`)
        .join(', ');
      return [lov.attrs.Name, lov.attrs.Title, lov.attrs.RecordGroupName, cols];
    })
  );

  out += '\n#### Record Groups\n\n';
  const rgs = directChildren(form, 'RecordGroup');
  for (const rg of rgs) {
    const cols = directChildren(rg, 'RecordGroupColumn').map((c) => c.attrs.Name).join(', ');
    out += `- **${rg.attrs.Name}** (${rg.attrs.RecordGroupType || 'Query'}) — columns: ${cols || '_none_'}\n`;
    if (rg.attrs.RecordGroupQuery) {
      out += '  ```sql\n  ' + maskCredentials(rg.attrs.RecordGroupQuery).split('\n').join('\n  ') + '\n  ```\n';
    }
  }
  return out;
}

function buildTriggersSection(form) {
  const rows = [];
  function ownerWalk(node, owner) {
    for (const c of node.children) {
      if (c.tag === 'Trigger') {
        const text = maskCredentials(c.attrs.TriggerText || '');
        const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length);
        rows.push([owner, c.attrs.Name, lines.slice(0, 2).join(' / ')]);
      } else if (c.tag === 'Block') {
        ownerWalk(c, `Block:${c.attrs.Name}`);
      } else if (c.tag === 'Item') {
        ownerWalk(c, `Item:${owner.replace(/^Block:/, '')}.${c.attrs.Name}`);
      } else {
        ownerWalk(c, owner);
      }
    }
  }
  ownerWalk(form, 'Form');
  return table(['Owner', 'Trigger', 'First lines'], rows);
}

function buildProgramUnitsSection(form) {
  const units = directChildren(form, 'ProgramUnit');
  const rows = units.map((u) => {
    const text = u.attrs.ProgramUnitText || '';
    const paramMatch = /(?:PROCEDURE|FUNCTION)\s+\w+\s*\(([^)]*)\)/i.exec(text);
    const params = paramMatch ? paramMatch[1].replace(/\s+/g, ' ').trim() : '';
    const globals = [...new Set((text.match(/:GLOBAL\.[A-Z0-9_]+/gi) || []).map((g) => g.toUpperCase()))].join(', ');
    return [u.attrs.Name, u.attrs.ProgramUnitType, params, globals];
  });
  return table(['Name', 'Type', 'Parameters', 'Globals used'], rows);
}

function buildVisualAttributesSection(form) {
  const vas = directChildren(form, 'VisualAttribute');
  const vaRows = vas.map((v) => {
    const { Name, DirtyInfo, ...rest } = v.attrs;
    return [Name, Object.entries(rest).map(([k, val]) => `${k}=${val}`).join(', ')];
  });
  let out = table(['Name', 'Properties'], vaRows);

  const refs = new Set();
  findAll(form, 'Block').forEach((b) => {
    if (b.attrs.VisualAttributeName) refs.add(`Block:${b.attrs.Name} -> ${b.attrs.VisualAttributeName}`);
    if (b.attrs.RecordVisualAttributeGroupName) refs.add(`Block:${b.attrs.Name} (row) -> ${b.attrs.RecordVisualAttributeGroupName}`);
  });
  findAll(form, 'Item').forEach((it) => {
    if (it.attrs.VisualAttributeName) refs.add(`Item:${it.attrs.Name} -> ${it.attrs.VisualAttributeName}`);
    if (it.attrs.RecordVisualAttributeGroupName) refs.add(`Item:${it.attrs.Name} (row) -> ${it.attrs.RecordVisualAttributeGroupName}`);
  });
  if (refs.size) out += '\nReferenced by:\n' + [...refs].map((r) => `- ${r}`).join('\n') + '\n';
  return out;
}

function buildMenuSection(menuModule) {
  const menus = new Map(directChildren(menuModule, 'Menu').map((m) => [m.attrs.Name, m]));
  const seen = new Set();
  let out = '';

  function renderMenu(name, depth) {
    if (seen.has(name)) return `${'  '.repeat(depth)}- _${name} (circular ref, see above)_\n`;
    seen.add(name);
    const menu = menus.get(name);
    if (!menu) return `${'  '.repeat(depth)}- _${name} (not found)_\n`;
    let s = '';
    for (const item of directChildren(menu, 'MenuItem')) {
      const a = item.attrs;
      const visible = (a.Visible ?? a.VisibleInMenu ?? 'true') !== 'false';
      const enabled = (a.Enabled ?? 'true') !== 'false';
      const code = maskCredentials(a.MenuItemCode || '');
      const openForm = /OPEN_FORM\s*\(\s*'([^']+)'/i.exec(code);
      const target = a.SubMenuName ? `submenu:${a.SubMenuName}` : (openForm ? `OPEN_FORM('${openForm[1]}')` : (code ? '(inline PL/SQL)' : ''));
      s += `${'  '.repeat(depth)}- **${a.Label || a.Name}** [visible=${visible}, enabled=${enabled}] -> ${target}\n`;
      if (a.SubMenuName) s += renderMenu(a.SubMenuName, depth + 1);
    }
    return s;
  }

  out += renderMenu(menuModule.attrs.MainMenu, 0);
  return out;
}

// ---------- module dispatch ----------
function summarizeForm(root, moduleName) {
  const form = root.children.find((c) => c.tag === 'FormModule');
  let md = `# ${moduleName}\n\nSource: \`analysis/forms-xml/T/${moduleName}_fmb.xml\` (source: forms-xml)\n\n`;
  md += `Title: ${form.attrs.Title || ''} · Menu: ${form.attrs.MenuModule || ''}\n\n`;
  md += `## 1. Blocks & Items\n\n${buildBlocksSection(form)}\n`;
  md += `## 2. Alerts\n\n${buildAlertsSection(form)}\n`;
  md += `## 3. LOVs & Record Groups\n\n${buildLovRgSection(form)}\n`;
  md += `## 4. Triggers\n\n${buildTriggersSection(form)}\n`;
  md += `## 5. Program Units\n\n${buildProgramUnitsSection(form)}\n`;
  md += `## 6. Visual Attributes\n\n${buildVisualAttributesSection(form)}\n`;
  return md;
}

function summarizeMenu(root, moduleName) {
  const menuModule = root.children.find((c) => c.tag === 'MenuModule');
  let md = `# ${moduleName}\n\nSource: \`analysis/forms-xml/T/${moduleName}_mmb.xml\` (source: forms-xml)\n\n`;
  md += `Main menu: ${menuModule.attrs.MainMenu}\n\n`;
  md += `## Menu tree\n\n${buildMenuSection(menuModule)}`;
  return md;
}

// ---------- main ----------
function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`Source dir not found: ${SRC_DIR}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('_fmb.xml') || f.endsWith('_mmb.xml'));
  let count = 0;
  for (const file of files) {
    const isMenu = file.endsWith('_mmb.xml');
    const moduleName = file.replace(isMenu ? '_mmb.xml' : '_fmb.xml', '');
    const text = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
    const root = parseXML(text);
    const md = isMenu ? summarizeMenu(root, moduleName) : summarizeForm(root, moduleName);
    fs.writeFileSync(path.join(OUT_DIR, `${moduleName}.md`), md, 'utf8');
    count++;
    console.log(`wrote ${moduleName}.md`);
  }
  console.log(`\nDone: ${count} modules summarized to ${OUT_DIR}`);
}

main();
