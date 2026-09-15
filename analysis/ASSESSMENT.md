# GestSIID — Modernization Assessment

Date: 2026-09-14. Method: no Oracle tooling on the analysis machine, so the `.fmb`/`.mmb` binaries were string-dumped
(`analysis/tools/extract-fmb.js`) and summarised (`analysis/tools/summarize-forms.js`); three agents then read the dumps
(`STRUCTURE.md`, `SECURITY_FINDINGS.md`, `BUSINESS_RULES.md`). The database was not reachable (listeners on the two hosts named in
the login form timed out), so table shapes and package bodies remain to be confirmed in Step 0.2 of `MASTER_PLAN.md`.

## Executive summary

GestSIID is a Portuguese Oracle Forms 12c front end for an insurance document engine ("SIID"): 21 forms and 2 menus over one Oracle
schema per environment, with a browser applet, WebUtil 1.0.6 and a Java bean. Most business logic is in form triggers (validation,
date versioning, permission overlap, cloning); document actions are rows inserted into a work queue processed by an external batch
engine, and only annul/clone/EDoc checks call DB packages. The estate is small (about 0.9 MB of extracted PL/SQL text, most of it
duplicated across the admin/user pair) but carries critical security debt: production DB credentials compiled into the login form and
compile scripts, UI-only role separation, DDL injection in the managers form, reversible password storage.
Recommended pattern: **Rebuild** (cross-stack rewrite of the UI tier in Node.js, database and queue processor unchanged),
executed by the phased plan in `analysis/MASTER_PLAN.md`.

## System inventory

| Item | Count / size |
|---|---|
| Forms (`.fmb`, dev/T) | 21 active + 2 drafts (`FD_GESTAO_SIID_v2`, `FD_CONFIGURACAO_MODELOS_old`) |
| Menus (`.mmb`) | 2 (`MD_SIID`, `MD_SIID_USER`), PL/SQL-identical except the Documentos target |
| Extracted PL/SQL/SQL text (dev/T) | 927 KB across 25 modules; largest `FD_GESTAO_SIID_USER` 171 KB, `FD_GESTAO_SIID` 125 KB, `FD_CONFIGURACAO_MODELOS` 88 KB, `FD_PERMISSOES_SIID` 46 KB |
| Triggers (from compile logs) | `FD_GESTAO_SIID` ~95, `FD_CONFIGURACAO_MODELOS` ~90, `FD_PERMISSOES_SIID` ~65 |
| Form-level packages | `WIN_API`, `WIN_API_ENVIRONMENT` (dead), `PKG_FICHIERS`, `PKG_TRANSFERTS` (WebUtil wrappers) |
| DB packages used | `PKG_DOCUMENTOS_SVR`, `PKG_SIID_UTIL`, `USER_SECURITY`, `CRYPT_PKG` (not in repo) |
| Tables / views touched | ~35 (CFG_*, DOC_*, SVR_*, ERR_ERROS_SIID, GD_ESPACO_BD, core tables MRECIBO, MPERSONA, M_USUARIOS, CO_EMPLEADOS, TTAPVAAT) |
| Client-side components | Java applet, WebUtil 1.0.6 (2004–2006), `GetImageFileName.jar` (2004), `ShowDOC.jar` / `Combined-dist.jar` (bundle ojdbc7 12.1.0.2) |
| Tests | none; build = `frmcmp.exe` against a live DB |

Tech fingerprint: Oracle Forms 12c (`frmcmp` in `C:\Oracle\Middleware\Oracle_Home`), Oracle Net aliases `cosec`, `cosec01`, `gador`;
document PDFs served by a separate REST service (FileServerSIID); Oracle Reports referenced but disabled.

## Architecture at a glance

See `STRUCTURE.md` §1–§5 (domain table, per-form sheets, Mermaid diagram). Domains: session/login, documents (main), backups,
printers, templates (modelos), report parameters, permissions, administration lookups, DB managers.

## Technical debt (top 10)

1. Hardcoded DB credentials and connect descriptors in `FD_LOGIN_SIID` ON-LOGON and in six `.bat` files (SEC-001/002).
2. Role separation implemented by which form/menu opens, not enforced anywhere (SEC-004).
3. Runtime `CREATE/DROP SYNONYM` and `GRANT/REVOKE` DDL from forms (`FD_GESTAO`, `FD_GESTORES_SIID`) (SEC-007/009).
4. Business rules hand-written in triggers and duplicated between `FD_GESTAO_SIID` and `_USER` (171 KB vs 125 KB of near-identical code).
5. `FORMS_DDL('COMMIT')` used ~73 times; string-built SQL in several places.
6. Dead OS-integration code (HOST, TEXT_IO, registry, `WIN_API`, `ShowDoc.jar`) still compiled into three forms (SEC-011).
7. Shared document-regeneration password changeable by any user without the old value (SEC-008).
8. Hardcoded super-user `'AFREITAS'` in Cancelar; hardcoded model ids in the "Em branco" filter and the group view.
9. Unmaintained client components: WebUtil 1.0.6, ojdbc7 12.1.0.2, 2004-era beans (SEC-013).
10. Stale/duplicate sources: `_v2`, `_old`, `bck/`, four "Copy of" compile scripts; `prod/*.fmx` older than `dev/P` sources for most forms.

## Security findings

See `SECURITY_FINDINGS.md` (16 findings, 2 critical, 5 high). Credential inventory is masked there; rotation list in its §3.

## Documentation gaps (top 5)

1. Who runs the `SVR_QUEUE` processor, where it writes files, and the full list of `TIPO_QUEUE_RF` / `ESTADO` values.
2. `SVR_DOCUMENTOS_VW.ESTADO` derivation and the DB package bodies (`PKG_DOCUMENTOS_SVR`, `USER_SECURITY`, `CRYPT_PKG`).
3. Whether `MD_SIID_USER` menu items are disabled by property (not visible in dumps).
4. How `CFG_UTILIZADORES.PASSWORD` is hashed on insert (trigger vs form) and how `LOGIN.AMBIENTE` is populated.
5. Meaning of the environment concept (`AMBIENTE_ID` = owner schema of `MRECIBO`) versus the login environment list.

## Relative scale

Extracted logic ≈ 0.9 MB of PL/SQL text (roughly 25–30 KSLOC including duplication; ~15 KSLOC unique). COCOMO-II index
2.94 × 15^1.10 ≈ 58 — a relative size measure only, not a timeline or cost; agentic transformation does not follow that curve.

## Recommended modernization pattern

**Rebuild** the presentation and form-logic tier in Node.js (Fastify API + React SPA) in one Docker image; keep Oracle, its packages and
the queue processor. Route: the phased plan in `analysis/MASTER_PLAN.md` (Phases 0–10, one Claude Code prompt per step).
