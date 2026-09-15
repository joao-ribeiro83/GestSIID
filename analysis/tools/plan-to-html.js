// Renders analysis/MASTER_PLAN.md as a single HTML page with phase navigation and copy buttons on prompts.
// Usage: node plan-to-html.js <MASTER_PLAN.md> <out.html>
const fs = require('fs');
const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('usage: node plan-to-html.js <MASTER_PLAN.md> <out.html>'); process.exit(1); }
const md = fs.readFileSync(src, 'utf8').split('\n');

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const nav = []; // {level, id, text}
let html = '';
let i = 0, stepOpen = false, phaseOpen = false;
const closeStep = () => { if (stepOpen) { html += '</section>\n'; stepOpen = false; } };
const closePhase = () => { closeStep(); if (phaseOpen) { html += '</section>\n'; phaseOpen = false; } };

while (i < md.length) {
  const line = md[i];
  if (/^```/.test(line)) {
    const lang = line.slice(3).trim();
    const body = [];
    i++;
    while (i < md.length && !/^```/.test(md[i])) body.push(md[i++]);
    i++;
    const text = body.join('\n');
    if (lang === 'mermaid') {
      if (!/C4Container/.test(text)) html += `<pre class="mermaid">${esc(text)}</pre>\n`;
    } else if (lang === 'text') {
      html += `<div class="prompt"><div class="prompt-bar"><span>Prompt — paste into Claude Code</span><button type="button" class="copy" data-copy>Copy prompt</button></div><pre><code>${esc(text)}</code></pre></div>\n`;
    } else {
      html += `<pre class="code"><code>${esc(text)}</code></pre>\n`;
    }
    continue;
  }
  if (/^# /.test(line)) { html += `<h1>${inline(line.slice(2))}</h1>\n`; i++; continue; }
  if (/^## /.test(line)) {
    closePhase();
    const text = line.slice(3); const id = slug(text);
    nav.push({ level: 2, id, text });
    const isPhase = /^Phase \d+/.test(text);
    if (isPhase) { html += `<section class="phase" id="${id}"><h2>${inline(text)}</h2>\n`; phaseOpen = true; }
    else html += `<h2 id="${id}">${inline(text)}</h2>\n`;
    i++; continue;
  }
  if (/^### /.test(line)) {
    closeStep();
    const text = line.slice(4); const id = slug(text);
    nav.push({ level: 3, id, text: text.replace(/^Step /, '') });
    const m = text.match(/^Step ([\d.]+) — (.*)$/);
    html += `<section class="step" id="${id}"><h3>${m ? `<span class="step-no">${m[1]}</span> ${inline(m[2])}` : inline(text)}</h3>\n`;
    stepOpen = true; i++; continue;
  }
  if (/^---\s*$/.test(line)) { i++; continue; }
  if (/^\|/.test(line)) {
    const rows = [];
    while (i < md.length && /^\|/.test(md[i])) rows.push(md[i++]);
    const cells = r => r.replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
    const head = cells(rows[0]);
    const body = rows.slice(2).map(cells);
    if (head.join() === 'Model,Effort,Skills,Agents' && body.length === 1) {
      const [model, effort, skills, agents] = body[0];
      const chips = s => s === 'none' ? '<span class="none">none</span>' : s.split(/,\s*/).map(x => `<code>${esc(x.replace(/`/g, ''))}</code>`).join(' ');
      html += `<div class="meta"><span class="chip model model-${esc(model)}">${esc(model)}</span><span class="chip effort">effort: ${esc(effort)}</span><span class="kv"><b>Skills</b> ${chips(skills)}</span><span class="kv"><b>Agents</b> ${chips(agents)}</span></div>\n`;
      continue;
    }
    html += `<div class="tbl"><table><thead><tr>${head.map(h => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>\n`;
    continue;
  }
  if (/^- /.test(line)) {
    const items = [];
    while (i < md.length && /^- /.test(md[i])) { let t = md[i++].slice(2); while (i < md.length && /^  \S/.test(md[i])) t += ' ' + md[i++].trim(); items.push(t); }
    html += `<ul>${items.map(t => `<li>${inline(t)}</li>`).join('')}</ul>\n`;
    continue;
  }
  if (/^\d+\. /.test(line)) {
    const items = [];
    while (i < md.length && /^\d+\. /.test(md[i])) { let t = md[i++].replace(/^\d+\. /, ''); while (i < md.length && /^  \S/.test(md[i])) t += ' ' + md[i++].trim(); items.push(t); }
    html += `<ol>${items.map(t => `<li>${inline(t)}</li>`).join('')}</ol>\n`;
    continue;
  }
  if (line.trim() === '') { i++; continue; }
  // paragraph (joins following non-empty plain lines)
  const para = [line];
  i++;
  while (i < md.length && md[i].trim() !== '' && !/^(#|```|\||- |\d+\. |---)/.test(md[i])) para.push(md[i++]);
  const text = para.join(' ');
  const m = text.match(/^\*\*(Inputs|Done when|Note|Outputs):\*\*\s*(.*)$/s);
  if (m) {
    // split "**Inputs:** ... **Done when:** ..." on the same paragraph
    const parts = text.split(/(?=\*\*(?:Inputs|Done when|Note|Outputs):\*\*)/);
    for (const p of parts) {
      const mm = p.match(/^\*\*([^*]+):\*\*\s*(.*)$/s);
      if (!mm) continue;
      const cls = mm[1] === 'Done when' ? 'done' : mm[1] === 'Note' ? 'note' : 'inputs';
      html += `<p class="callout ${cls}"><b>${esc(mm[1])}</b> ${inline(mm[2])}</p>\n`;
    }
    continue;
  }
  html += `<p>${inline(text)}</p>\n`;
}
closePhase();

const navHtml = nav.map(n => n.level === 2
  ? `<a class="n2" href="#${n.id}">${esc(n.text)}</a>`
  : `<a class="n3" href="#${n.id}">${esc(n.text)}</a>`).join('');

const page = `<title>GestSIID Rewrite Plan</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Serif:wght@600&display=swap">
<style>
:root{--bg:#f4f6f5;--paper:#ffffff;--ink:#1a232c;--muted:#5b6770;--line:#d7dde1;--accent:#0f6e6e;--accent-ink:#ffffff;--soft:#e6f1f0;--code-bg:#f0f3f2;--prompt-bg:#1d2a33;--prompt-ink:#e8eef1;--sonnet:#2f6db3;--opus:#6c48b0;--fable:#9a3a4f;--done:#f1efe3;--done-line:#c9c08a;--note:#fbeeea;--note-line:#e0a89b;--shadow:0 1px 2px rgba(20,30,40,.06)}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#121a20;--paper:#1a242c;--ink:#e6ebee;--muted:#9aa7b1;--line:#2c3942;--accent:#4fb3ad;--accent-ink:#0f1a1a;--soft:#1d3130;--code-bg:#22303a;--prompt-bg:#0e161c;--prompt-ink:#dce5ea;--sonnet:#7fb0ee;--opus:#b39aee;--fable:#e08aa0;--done:#2a2f24;--done-line:#6b6a3a;--note:#33231f;--note-line:#8a4d3c;--shadow:none}}
:root[data-theme="dark"]{--bg:#121a20;--paper:#1a242c;--ink:#e6ebee;--muted:#9aa7b1;--line:#2c3942;--accent:#4fb3ad;--accent-ink:#0f1a1a;--soft:#1d3130;--code-bg:#22303a;--prompt-bg:#0e161c;--prompt-ink:#dce5ea;--sonnet:#7fb0ee;--opus:#b39aee;--fable:#e08aa0;--done:#2a2f24;--done-line:#6b6a3a;--note:#33231f;--note-line:#8a4d3c;--shadow:none}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15px;line-height:1.55}
.wrap{display:grid;grid-template-columns:260px minmax(0,1fr);gap:40px;max-width:1240px;margin:0 auto;padding:32px 24px 96px}
@media (max-width:900px){.wrap{grid-template-columns:1fr;gap:16px}nav.side{position:static;max-height:none;border-bottom:1px solid var(--line);padding-bottom:16px}}
nav.side{position:sticky;top:16px;align-self:start;max-height:calc(100vh - 32px);overflow:auto;font-size:13px;padding-right:8px}
nav.side .eyebrow{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}
nav.side a{display:block;color:var(--ink);text-decoration:none;padding:3px 8px;border-left:2px solid transparent;border-radius:0 4px 4px 0}
nav.side a.n2{font-weight:600;margin-top:10px}
nav.side a.n3{color:var(--muted);padding-left:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
nav.side a:hover,nav.side a:focus-visible{background:var(--soft);border-left-color:var(--accent);outline:none}
main{min-width:0;max-width:80ch}
h1{font-family:"IBM Plex Serif",Georgia,serif;font-size:34px;line-height:1.15;margin:0 0 6px;text-wrap:balance}
h1+p{color:var(--muted);font-size:14px}
h2{font-size:22px;margin:44px 0 12px;padding-top:12px;border-top:1px solid var(--line);text-wrap:balance}
h3{font-size:17px;margin:0 0 10px;text-wrap:balance}
.step-no{display:inline-block;font-family:"IBM Plex Mono",ui-monospace,Menlo,monospace;font-weight:500;color:var(--accent);margin-right:6px}
section.step{background:var(--paper);border:1px solid var(--line);border-radius:6px;padding:18px 20px 14px;margin:18px 0;box-shadow:var(--shadow)}
p{margin:8px 0}
ul,ol{margin:8px 0 8px 22px;padding:0}
li{margin:3px 0}
code{font-family:"IBM Plex Mono",ui-monospace,Menlo,monospace;font-size:.9em;background:var(--code-bg);padding:1px 5px;border-radius:3px}
pre.code{background:var(--code-bg);padding:12px 14px;border-radius:6px;overflow-x:auto;font-size:13px;line-height:1.45}
pre.code code{background:none;padding:0}
.tbl{overflow-x:auto;margin:10px 0}
table{border-collapse:collapse;width:100%;font-size:13.5px}
th,td{text-align:left;vertical-align:top;padding:7px 10px;border-bottom:1px solid var(--line)}
th{font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}
td{font-variant-numeric:tabular-nums}
.meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin:6px 0 12px;font-size:13px}
.chip{display:inline-block;padding:2px 10px;border-radius:999px;font-weight:600;font-size:12.5px;letter-spacing:.02em}
.chip.model{color:#fff}
.model-sonnet{background:var(--sonnet)}.model-opus{background:var(--opus)}.model-fable{background:var(--fable)}
.chip.effort{background:var(--soft);color:var(--ink)}
.kv b{font-weight:600;color:var(--muted);margin-right:4px}
.kv code{margin-right:2px}
.none{color:var(--muted)}
.callout{padding:8px 12px;border-left:3px solid var(--line);background:var(--code-bg);border-radius:0 4px 4px 0;font-size:14px}
.callout.done{background:var(--done);border-left-color:var(--done-line)}
.callout.note{background:var(--note);border-left-color:var(--note-line)}
.callout b{margin-right:6px}
.prompt{margin:12px 0 4px;border-radius:6px;overflow:hidden;border:1px solid var(--line)}
.prompt-bar{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:6px 10px 6px 14px;background:var(--soft);font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}
.prompt pre{margin:0;padding:14px 16px;background:var(--prompt-bg);color:var(--prompt-ink);overflow-x:auto;font-family:"IBM Plex Mono",ui-monospace,Menlo,monospace;font-size:12.5px;line-height:1.5;white-space:pre-wrap;word-break:break-word}
.prompt pre code{background:none;padding:0;color:inherit;font-size:inherit}
button.copy{font:inherit;font-size:12px;letter-spacing:.04em;text-transform:uppercase;font-weight:600;background:var(--accent);color:var(--accent-ink);border:0;border-radius:4px;padding:5px 10px;cursor:pointer}
button.copy:hover{filter:brightness(1.08)}
button.copy:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
button.copy.ok{background:var(--muted)}
pre.mermaid{background:var(--paper);border:1px solid var(--line);border-radius:6px;padding:12px;overflow-x:auto}
@media (prefers-reduced-motion: reduce){*{transition:none!important}}
</style>
<div class="wrap">
<nav class="side"><p class="eyebrow">Contents</p>${navHtml}</nav>
<main>
${html}
</main>
</div>
<script>
document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{const t=b.closest('.prompt').querySelector('code').textContent;try{await navigator.clipboard.writeText(t);b.textContent='Copied';b.classList.add('ok');setTimeout(()=>{b.textContent='Copy prompt';b.classList.remove('ok')},1600)}catch(e){b.textContent='Select and copy manually'}}));
</script>
`;
fs.writeFileSync(out, page, 'utf8');
console.log(`wrote ${out} (${(page.length / 1024).toFixed(0)} KB, ${nav.filter(n => n.level === 3).length} steps)`);
