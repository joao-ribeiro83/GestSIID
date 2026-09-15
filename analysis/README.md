# analysis/ — what is here

Everything the Node.js rewrite plan was built from (2026-09-14). Start with `MASTER_PLAN.md`.

| File / folder | What it is | Commit? |
|---|---|---|
| `MASTER_PLAN.md` | Phased plan, one paste-ready Claude Code prompt per step with model, effort, skills, agents | yes |
| `ASSESSMENT.md` | Executive summary, inventory, debt, gaps, recommended pattern | yes |
| `STRUCTURE.md` | Structural map: roles, navigation, per-form sheets (blocks, items, triggers), DB inventory, T vs P differences | yes |
| `BUSINESS_RULES.md` | Given/When/Then rules per area with Portuguese messages | yes |
| `SECURITY_FINDINGS.md` | CWE-tagged findings (credentials masked) and requirements for the rewrite | yes |
| `tools/forms2xml.ps1` | Runs Oracle Forms2XML (from `I:\Middleware\Oracle_Home`) on every `.fmb`/`.mmb` in `dev/T` and `dev/P`, moves the XML into `forms-xml/`, masks passwords | yes |
| `forms-xml/{T,P}/` | Forms2XML output: every property of every module (items, LOVs, alerts, menus, canvases, full trigger text). Authoritative; prefer it over the string dumps | **no** (gitignored: carries the hardcoded passwords, masked) |
| `tools/diff-xml.js` → `T_vs_P_DIFF.md` | Property-by-property diff of the T and P XML dumps (code, labels, layout, added/removed objects); usernames/passwords/IPs masked | yes |
| `tools/plan-to-html.js` | Renders `MASTER_PLAN.md` as the interactive HTML artifact | yes |
| `tools/extract-fmb.js` | Dumps readable strings from `.fmb`/`.mmb` binaries (fallback when no Oracle tools) | yes |
| `tools/summarize-forms.js` | Builds per-module inventories (`.md`) and PL/SQL-only dumps (`.plsql.txt`) from the string dumps | yes |
| `forms-extracted/{T,P}/` | Raw string dumps of every module | **no** (gitignored: contained hardcoded passwords; now masked as `***`, keep local anyway) |
| `forms-summary/{T,P}/` | Per-module `.md` inventory, `.plsql.txt` code, `INDEX.json` | **no** (same reason) |
| `db/` | Created by Step 0.2 of the plan: live schema dump (tables, packages, sequences, grants) | yes, once produced |
| `DECISIONS.md` | Created by Step 0.3: answered open questions, binding for later steps | yes |
| `ARCHITECTURE.md` | Created by Step 1.1: binding architecture (stack, topology, DB layer, QBE/commit contracts, auth, files, conventions, form → route mapping) | yes |
| `architecture.mmd` → `architecture.svg` | C4 container/component diagram source and its render (gstack `diagram` skill) | yes |

## Regenerate the dumps

```powershell
node analysis\tools\extract-fmb.js dev\T analysis\forms-extracted\T
node analysis\tools\extract-fmb.js dev\P analysis\forms-extracted\P
node analysis\tools\summarize-forms.js analysis\forms-extracted\T analysis\forms-summary\T
node analysis\tools\summarize-forms.js analysis\forms-extracted\P analysis\forms-summary\P
```

Only needed if a `.fmb`/`.mmb` file changes. `T` (`dev/T`) is the newest source set; `P` is what was compiled for production.
After regenerating, mask the password literals again (they come back from the binaries):

```powershell
node -e "const fs=require('fs'),p=require('path');function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=p.join(d,e.name);if(e.isDirectory())walk(f);else if(/\.txt$/.test(e.name)){let t=fs.readFileSync(f,'utf8');t=t.replace(/(v_password\s*:=\s*')[^']*(')/gi,'$1***$2').replace(/(LOGON\s*\(\s*'[^']*'\s*,\s*')[^'@]*(@)/gi,'$1***$2');fs.writeFileSync(f,t)}}}walk('analysis/forms-extracted');walk('analysis/forms-summary')"
```
