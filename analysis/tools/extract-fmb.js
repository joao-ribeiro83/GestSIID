// Dumps readable strings (PL/SQL, object names, SQL, labels) out of binary Oracle Forms
// modules (.fmb/.mmb/.pll) so the logic can be read without Forms Builder / frmf2xml.
// Usage: node extract-fmb.js <inputDir> <outputDir>
// ponytail: naive byte-run scan, no .fmb structure parsing; good enough to read triggers,
// program units, block/item/table names and LOV queries.
const fs = require('fs');
const path = require('path');

const [inDir, outDir] = process.argv.slice(2);
if (!inDir || !outDir) { console.error('usage: node extract-fmb.js <inputDir> <outputDir>'); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });

const MIN = 4;
const isText = b => (b >= 0x20 && b <= 0xfe) || b === 9 || b === 10 || b === 13;

for (const f of fs.readdirSync(inDir)) {
  if (!/\.(fmb|mmb|pll)$/i.test(f) || /^webutil/i.test(f)) continue;
  const buf = fs.readFileSync(path.join(inDir, f));
  const out = [];
  let start = -1;
  for (let i = 0; i <= buf.length; i++) {
    const ok = i < buf.length && isText(buf[i]);
    if (ok && start < 0) start = i;
    if (!ok && start >= 0) {
      if (i - start >= MIN) out.push(buf.toString('latin1', start, i).replace(/\r\n?/g, '\n'));
      start = -1;
    }
  }
  const dest = path.join(outDir, f + '.txt');
  fs.writeFileSync(dest, out.join('\n\n'), 'utf8');
  console.log(`${f}: ${out.length} strings -> ${dest}`);
}
