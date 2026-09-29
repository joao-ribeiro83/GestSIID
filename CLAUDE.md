# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⛔ HARD RULE — NO CHANGES TO THE ORACLE DATABASE

Claude, tests and scripts are **NOT permitted to change the Oracle database** (owner's order, 2026-09-22).
- No INSERT, UPDATE, DELETE, MERGE, DDL, PL/SQL block, write-package call, `SELECT ... FOR UPDATE`, or COMMIT — not even on `ZZTEST_` rows, not in a rolled-back transaction, not "restored afterwards", not to repair an earlier mistake.
- Contract tests reach Oracle only through `app/apps/api/src/test/read-only-db.ts` (`readOnlyPool`). Write paths are tested with fakes only.
- Reading (plain SELECT) is allowed. If a task seems to need a DB change: stop and ask the owner. Give them the SQL; do not run it.
- Full rule: `analysis/TEST_STRATEGY.md` (top).

## What this is

**GestSIID** — an Oracle Forms 12c application (Portuguese-language) for printer fleet and document management. Forms cover: printers (`IMPRESSORAS`), print domains (`DOMINIOS`), users/managers (`UTILIZADORES`, `GESTORES`), permissions (`PERMISSOES`), document templates (`CONFIGURACAO_MODELOS`), report config (`CONFIGURACAO_REPORTS`), media types (`TIPOS_MIDIA`), measurement units (`UNIDADES_MEDIDA`), department profiles (`PERFIS_DEPARTAMENTO`), online backups (`BACKUPS_ONLINE`), and login (`FD_LOGIN_SIID`).

There is no README, no VCS history, and no build/test tooling beyond Oracle Forms itself — this guidance is derived entirely from the file layout and the `.bat`/`.err` files present.

## Repo layout

- `dev/P/` — production **source** (`.fmb` forms, `.mmb` menus, `.pll` library) plus compiled `.fmx`/`.mmx`/`.plx` siblings and per-file `.err` compile logs. `bck/` holds a dated backup of one form.
- `dev/T/` — test/staging **source**, same structure. Contains extra WIP/backup variants sitting next to the active files: `FD_GESTAO_SIID_v2.fmb` and `FD_CONFIGURACAO_MODELOS_old.fmb`. Treat these as drafts, not the live version, unless told otherwise.
- `prod/` — deployed production runtime binaries (`.fmx`/`.mmx`) only, no source.
- `testes/` — deployed test runtime binaries only, plus `lib/ojdbc7.jar` (Oracle JDBC driver) and Java bean archives (`ShowDOC.jar`, `Combined-dist.jar`).
- `webutil_106/` — vendor Oracle WebUtil 1.0.6 (client-side bridge for OLE/file transfer from the browser-hosted Forms applet). Third-party, do not modify.
- `GetImageFileName.jar` (root) — custom Java pluggable bean consumed by the forms. No source in this repo; binary only.

Naming convention: `FD_` = form, `MD_` = menu, `PKG_` = a PL/SQL package referenced from form code (e.g. `PKG_FICHIERS`, `PKG_TRANSFERTS` seen in compile logs).

## Two menu/form sets = two roles

`MD_SIID` (+ `FD_GESTAO_SIID`, `FD_PERMISSOES_SIID`, `FD_GESTAO`, ...) is the full-privilege admin set. `MD_SIID_USER` (+ `FD_GESTAO_SIID_USER`, `FD_GESTAO_USER`) is a parallel, restricted set for regular users. When a form exists in both a plain and `_USER` variant, the `_USER` one is the cut-down UI for non-admins — keep behavior consistent between the pair unless the task is specifically about permission differences.

## Oracle Forms tools on this machine

The `.bat` files point at `C:\Oracle\Middleware\Oracle_Home`, which does not exist here. A copy of that home (Fusion Middleware 12.2.1.4: Forms, Reports, WebLogic, JDK 1.8.0_211) is at **`I:\Middleware\Oracle_Home`**. Use it with `ORACLE_HOME=I:\Middleware\Oracle_Home` and `%ORACLE_HOME%\bin` on `PATH`:

- **Forms2XML** — dumps a `.fmb`/`.mmb`/`.olb` to XML with every property (items, LOVs, alerts, menus, canvases, trigger text). No DB needed. Run `pwsh -NoProfile -File analysis\tools\forms2xml.ps1` to convert everything in `dev/T` and `dev/P` into `analysis/forms-xml/{T,P}/` (gitignored: the XML carries the hardcoded passwords, the script masks them). Direct call (set `NLS_LANG=PORTUGUESE_PORTUGAL.AL32UTF8` and `-Dfile.encoding=UTF-8` first, otherwise every accented character becomes `?`):
  `%ORACLE_HOME%\oracle_common\jdk\bin\java.exe -Dfile.encoding=UTF-8 -classpath %ORACLE_HOME%\jlib\frmxmltools.jar;%ORACLE_HOME%\jlib\frmjdapi.jar;%ORACLE_HOME%\oracle_common\modules\oracle.xdk\xmlparserv2.jar oracle.forms.util.xmltools.Forms2XML OVERWRITE=YES USE_PROPERTY_IDS=NO <file.fmb>` — the XML lands next to the source file. Reverse: `forms\templates\scripts\frmxml2f.bat`.
- `bin\frmcmp.exe` (compiler, needs a DB connection), `bin\frmbld.exe` (Forms Builder GUI), `jlib\frmjdapi.jar` + `bin\frmjapi.dll` (Java API to read/modify modules programmatically).
- The text-only fallback (no Oracle tools) is `analysis/tools/extract-fmb.js` + `summarize-forms.js`; prefer the XML when both exist.

## Analysis for the Node.js rewrite

`analysis/` holds the modernization work: `MASTER_PLAN.md` (phased plan, one Claude Code prompt per step), `STRUCTURE.md`, `BUSINESS_RULES.md`, `SECURITY_FINDINGS.md`, `ASSESSMENT.md`, `README.md` (what each artifact is). Read `analysis/README.md` before touching them.

## Compiling

Compilation runs through Oracle Forms' `frmcmp.exe` (the `.bat` files hardcode `C:\Oracle\Middleware\Oracle_Home\bin\frmcmp.exe`; on this machine use `I:\Middleware\Oracle_Home\bin\frmcmp.exe`), against a live Oracle DB connection. There is no other build or test step.

- `dev/T/compile_testes.bat` — compiles all `.pll` → `.plx` (library), `.mmb` → `.mmx` (menu), `.fmb` → `.fmx` (form) in that directory against the test DB.
- `dev/P/compile_producao.bat` — same, against the production DB.
- Single-file compile follows the same pattern:
  `frmcmp.exe userid=<user>/<pass>@<tns> module=<name>.fmb module_type=form compile_all=yes batch=yes window_state=minimize`
- After compiling, check the module's `.err` file: `No compilation errors.` per unit means success; anything starting `FRM-` is a real error (e.g. `dev/FD_LOGIN_SIID.err` has a stale `FRM-10043: Cannot open file` from a past run).
- The `dev/T` and `dev/P` compile scripts use different TNS aliases (`cosec` vs `cosec01`/`gador` show up inconsistently across the `.bat` copies) — confirm which alias is live before running, don't assume.

**Credentials warning:** `compile_producao.bat` and `compile_testes.bat` embed a plaintext Oracle username/password on the `userid=` line. Don't echo these into chat, commits, or any future VCS history — they're live DB credentials sitting in plain files today.

## No automated tests

There's no test framework in this repo. "Testing" a change means compiling it clean (no `FRM-*` errors in the `.err` log) and, where possible, running the form in Forms Runtime against the test schema (`dev/T` / `testes/`) before it's promoted to `dev/P` / `prod/`.
