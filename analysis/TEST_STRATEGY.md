# GestSIID rewrite — Test strategy

Binding for `analysis/MASTER_PLAN.md` Step 1.3 and every step after it. Authority order: `analysis/DECISIONS.md` > `analysis/ARCHITECTURE.md` > this document > MASTER_PLAN step prompts (unchanged from ARCHITECTURE.md §0). This document describes how to test what D-01..D-31/A-01..A-09 already decided; it makes no new architecture or business-rule decisions.

Rule IDs (`BR-*`) are from `analysis/BUSINESS_RULES.md`; decision IDs (`D-*`, `A-*`) are from `analysis/DECISIONS.md`; phase/step numbers are from `analysis/MASTER_PLAN.md`.

> ## ⛔ HARD RULE — NO CHANGES TO THE ORACLE DATABASE
> Tests, scripts and Claude are **NOT permitted to change the Oracle database** (owner's order, 2026-09-22).
> - No INSERT, UPDATE, DELETE, MERGE, DDL, PL/SQL block, package call that writes, `SELECT ... FOR UPDATE`, or COMMIT — **not even on `ZZTEST_` rows, not even in a rolled-back transaction, not even "restored afterwards"**.
> - Contract tests reach Oracle **only** through `apps/api/src/test/read-only-db.ts` (`readOnlyPool`), which refuses anything but a plain SELECT.
> - Every write path (INSERT/UPDATE/DELETE, package calls) is tested with a **fake** db in unit tests. Never against Oracle.
> - E2E (Playwright) runs against the Oracle-less dev server with in-memory fakes, or only on read-only flows.
> - A test that needs data uses rows that already exist (read them), or an account the owner gives through env vars (e.g. `GESTSIID_TEST_USER` / `GESTSIID_TEST_PASSWORD`).
> - Any text below that says to insert, create, update, delete, clean up or roll back rows in Oracle is **superseded by this rule**.
> - If a step seems to need a DB change: stop and ask the owner. Do not do it.

---

## 1. Layers

| Layer | Tool | Target | DB |
|---|---|---|---|
| Unit | Vitest | `service.ts` under `apps/api/src/features/<feature>/` | mocked `apps/api/src/db/oracle.ts` exports |
| API contract | Vitest + `fastify.inject` | `apps/api/src/app.ts` (`buildApp(deps)`) | real, TEST Oracle schema |
| UI component | Vitest + Testing Library (jsdom) | `apps/web/src/components/datablock/` | none (mocked `api/client.ts`) |
| E2E | Playwright | built Docker image | real, TEST Oracle schema |
| Manual parity UAT | side-by-side | Forms (`dev/T`) vs the new app | shared TEST Oracle schema |

**Unit.** One `*.test.ts` next to each `service.ts` (ARCHITECTURE.md §8 project conventions: "Unit tests use a fake connection"). The fake stands in for the five helpers in `apps/api/src/db/oracle.ts`: `query`, `queryOne`, `execute`, `withTransaction`, `callPlsql`, `lockRow`. No `oracledb` import, no pool, no network. Covers pure rule logic: the annulled-document skip predicate (A-06), the regeneration-password gate (BR-DOC-13/14), the permission overlap checks (BR-PERM-04/05/10/11), the backup name/destination generator (BR-BKP-03), the printer date-overlap checks (BR-PRN-02/03), the Reports `N_PARAMETROS` check (BR-ADM-05).

**API contract tests.** `fastify.inject` against `buildApp(deps)` wired to the TEST schema through `readOnlyPool` (HARD RULE above). They skip unless `DB_CONNECT_STRING` is set: `describe.skipIf(!process.env.DB_CONNECT_STRING)`. They are **read-only**: list/detail/lookup endpoints and the read half of every rule (e.g. the login compare, the regeneration-password check), using rows that already exist. Write endpoints are covered by unit tests with a fake db; the contract suite only proves the guard refuses their SQL.

**UI component tests.** Vitest + Testing Library against `apps/web/src/components/datablock/`, per the task brief: selection state (tick / untick / "Seleccionar todos" against the resolved query, not just fetched rows — mirrors BR-DOC-08's "select all only covers fetched Forms records" being intentionally *not* replicated per §4.2 of ARCHITECTURE.md), dirty-row save order on "Gravar" (deletes → updates → inserts, ARCHITECTURE.md §4.3), and query-by-example filter construction (`f[COL]`, `f[COL][like]`, `f[COL][from]/[to]`, `f[COL][null]/[notnull]` per ARCHITECTURE.md §4.1, exercising the BR-DOC-06 "IS NULL" convention client-side equivalent).

**E2E.** Playwright specs in `e2e/` against the built image (`docker-compose.yml`) and the TEST schema, covering the login → shell → one screen per phase happy path plus the CI "smoke" subset (ARCHITECTURE.md §8, §9).

**Manual parity UAT.** Per D-10: Forms stays available on the same TEST schema during UAT. Testers run the same action in both apps and compare `SVR_QUEUE` / `SVR_DOCUMENTOS` / `ERR_ERROS_SIID` rows (D-10 consequence, proven at MASTER_PLAN Step 10.6). This is not automated; §2 below defines the trace-based equivalence that substitutes for it during development, and §3 is the checklist UAT works from.

---

## 2. Characterization approach

**Why tracing, not running.** There is no Oracle Forms runtime on this machine (CLAUDE.md "Oracle Forms tools on this machine" — Forms Builder/`frmcmp.exe` compile against a live DB but there is no Forms *Runtime* here, and no interactive Forms session is possible in this environment). Equivalence with the legacy app therefore cannot be established by running Forms side-by-side during development; it is established by:
1. Reading the exact SQL/PL/SQL the form runs, as already extracted into `analysis/forms-summary/T/<FORM>.plsql.txt` and quoted verbatim inside the numbered `BR-*` rules of `BUSINESS_RULES.md`.
2. Writing that SQL (or an equivalent proven identical by `EXPLAIN`/manual review) into the matching `apps/api/src/resources-server/<name>.ts` preset, hook, or named-action handler.
3. Asserting, in a contract test, that the two produce the same row set / same written rows for the same input, modulo the exclusions below.
4. Reserving the live side-by-side comparison (Forms actually running) for UAT (D-10, MASTER_PLAN Step 10.6), where a human or a scripted DB diff — not this test suite — is the oracle.

**What "same" excludes.** Per D-10's consequence and the ARCHITECTURE.md §11 verification table: comparisons ignore generated IDs (`ID_QUEUE_SEQ`, `ID_ERROS_SEQ`, `ID_DOCUMENTO_SEQ`, `SEQ_BACKUP_ID`, `ROWID`/`_rid`) and timestamps (`SYSDATE`-derived `DATA_PEDIDO`, `DATA_ERRO`, `DATA_CRIACAO`, `DATA_ACTUALIZACAO`). A contract test asserts on every other column, plus row *count* and *order* where the legacy form defines an order.

**Worked example 1 — BR-DOC-04 filter buttons → `documentos` presets.**
- Legacy query (from BR-DOC-04, sourced from `FD_GESTAO_SIID.plsql.txt`): "Não Executados" = `estado is null`; "Em Erro" = documents whose most recent queue row per request family has `ESTADO='ERRO'` later than the last EXECUCAO row, materialized into `SVR_GESTAO_SIID_TMP`; "A Executar" = `estado = 'A EXECUTAR' AND id >= (SELECT MIN(documento_id) FROM SVR_QUEUE WHERE ESTADO='EXECUCAO' AND TIPO_QUEUE_RF='EXECUCAO')`; "Execução" = the ESPERA/ENQUEUED mirror of that; "Em Branco" = the `DECODE(DESTINATARIO,…)+DECODE(N_REFERENCIA,…)=0` predicate with the hard-coded model list.
- Target endpoint: `GET /api/documentos?preset=nao-executados|em-erro|a-executar|execucao|em-branco|todos` (ARCHITECTURE.md §4.1: "Presets = the six Forms filters … SQL copied from `FD_GESTAO_SIID_fmb.xml` into `resources-server/documentos.ts`. 'Em erro' becomes a subquery instead of temp-table rows.").
- Contract test: seed (or select existing TEST-schema) documents in each state, call each `preset=`, assert the returned `ID` set equals the ID set the legacy SQL (run directly against the same schema in the test setup, as a raw comparison query) returns, ignoring sort tie-breaks not specified by BR-DOC-04. **[HARD RULE: no Oracle writes — use existing rows read-only, or a unit test with a fake db.]**
- Delivered by: Phase 7, Step 7.1 (list/filters) and Step 7.3 (toolbar wiring).

**Worked example 2 — BR-DOC-11 2ª via prior-print check.**
- Legacy rule: `REIMPRIMIR(id, printer, 'V')` reads `SVR_DOCUMENTOS.N_IMPRESSOES`; if `0`, the document is skipped with message #10 (`Para imprimir 2ª Via é necessário que o documento já tenha sido impresso.`); annulled documents are skipped regardless (message #9).
- Target endpoint: `POST /api/documentos/acoes/segunda-via { ids | consulta, impressoraId? }` (ARCHITECTURE.md §10.1 table: "`segunda-via` also `N_IMPRESSOES = 0` → message #10"; skip predicate is A-06's `ATRIBUTO9='A' OR DISPONIVEL_RF='ANU'`, an intended widening of the Forms `ATRIBUTO9='A'`-only test — see §3 D-28/A-06 checklist item).
- Contract test: one document with `N_IMPRESSOES=0` (not annulled) → appears in `skipped` with message #10, no `SVR_QUEUE` row inserted; one document with `N_IMPRESSOES>0` → `SVR_QUEUE` row `TIPO_QUEUE_RF='2.VIA', ESTADO='ESPERA'` inserted, `ok` includes its id; one annulled document → skipped with message #9, even if `N_IMPRESSOES>0`.
- Delivered by: Phase 7, Step 7.2.

**Worked example 3 — D-16 `SVR_DOCUMENTOS_VW.ESTADO` derivation.**
- The view itself is not ported (D-16: "The API reads `SVR_DOCUMENTOS_VW` as-is; the state logic is not re-implemented in Node"), so there is nothing to characterize *inside* Node — but the filter buttons and the detail screen consume its output, and D-16 records the exact label mapping (`Q_EXEC.ESTADO`: `ESPERA→WAIT`, `ENQUEUED→EXECUCAO`, `EXECUCAO→A EXECUTAR`, `ERRO→ERRO`; the `TERMINADO` sub-case table by `Q_LAST.TIPO_QUEUE_RF`×`ESTADO`, e.g. `IMPRESSAO+TERMINADO→IMPRESSO`; the `'ENQUEED'` typo branch and `WHEN NULL` dead branch, kept as-is).
- Contract test target: not a Node unit under test, but a **fixture-based regression** — insert `SVR_QUEUE` rows that hit each labeled branch (including the `'ENQUEED'` typo and the `TERMINADO`+`REENVIAR` combination) against `ZZTEST_`-prefixed documents, then assert `GET /api/documentos/:id` returns the exact `ESTADO` string the view produces, confirming the API does not re-derive or "fix" the label. **[HARD RULE: no Oracle writes — use existing rows read-only, or a unit test with a fake db.]**
- Delivered by: Phase 7, Step 7.1 (D-16's own consequence: "Quirks kept as-is … parity tests cover each label").

**Worked example 4 — D-22 printer resolution precedence.**
- Legacy/DB rule (settled by DB read, not by a form): five-level precedence — `DOC_IMPRESSOES_MODELO_USR` (user+model) → `DOC_IMPRESSOES_USER` (user) → `DOC_IMPRESSOES_DEP` (department) → `DOC_IMPRESSORAS_DOC` (model) → `SVR_AMBIENTES_IMPRESSAO.IMPRESSORA_ID` (environment default), each level scoped to rows valid today.
- The app never re-implements this resolution (D-22 consequence: "The app never resolves printers. It maintains the association tables … and passes the Reimprimir choice."), so there is no Node code path to unit-test. The test obligation is on the **screens that maintain the association tables**: Step 5.2 (`impressoras-associadas`).
- Contract test (per D-22's own consequence: "Parity tests for Step 5.2 insert associations at two levels and check the queue row gets the higher-priority printer"): insert a `DOC_IMPRESSOES_MODELO_USR` row and a `DOC_IMPRESSORAS_DOC` row for the same model with conflicting printers, trigger a print request for that user+model without an explicit `impressoraId`, and — since the app does not resolve printers itself — assert only that the app wrote a `SVR_QUEUE` row with `IMPRESSORA_ID IS NULL` (deferring to the server-side resolution), confirming the app does not short-circuit the precedence with its own (wrong) guess. **[HARD RULE: no Oracle writes — use existing rows read-only, or a unit test with a fake db.]**
- Delivered by: Phase 5, Step 5.2.

---

## 3. Parity checklist per form

One checkbox per `BR-*` rule, grouped by the MASTER_PLAN phase/step that delivers it. **P0** = blocks that phase from shipping if unmet: authentication (BR-AUTH-01..10), document state-transition / money-adjacent operations (regeneration password gating BR-DOC-13/14, annul BR-DOC-15, cancel BR-DOC-16), the five D-28 intended-difference fixes, and permissions (BR-PERM-01..11 — full text is in `BUSINESS_RULES.md` §2.3; every rule in that ID range is P0 for Phase 5).

### Phase 3 — Authentication and shell (Steps 3.1, 3.2)

- [ ] **P0** BR-AUTH-01 — empty username/password rejected (`SEM_UTILIZADOR`/`SEM_PASSWORD`, msgs #1/#2). *Source: FD_LOGIN_SIID.*
- [ ] **P0** BR-AUTH-02 — one fixed environment per build (D-02 replaces the dead selector; test asserts the login page shows a label, not a picker).
- [ ] **P0** BR-AUTH-03 — session opens as the technical DB account, never the app user's own DB credentials (D-30: Forms account only).
- [ ] **P0** BR-AUTH-04 — credential check `USERNAME`+`AMBIENTE_ID` exists AND `USER_SECURITY.ENCRYPT(pwd) = PASSWORD`; generic `LOGIN_INVALIDO` on either failure (msg #3), never a distinguishing message (D-07a).
- [ ] **P0** BR-AUTH-05 — `TIPO_UTILIZADOR_RF='ADM'` → ADM container/menu; otherwise USER (D-08).
- [ ] BR-AUTH-06 — session guard: no direct-open child form / route without a valid session (msg #5) — becomes the default-deny `onRequest` hook (ARCHITECTURE.md §5).
- [ ] BR-AUTH-07 — schema/synonym resolution — **not ported** (D-02 consequence: no `CREATE SYNONYM`/`DROP SYNONYM` at runtime); checklist item is a **negative test**: assert no DDL statement is ever issued by the app (code-review gate, not a runtime test, per D-11's "enforced in code review instead").
- [ ] BR-AUTH-08 — `GLOBAL.AMBIENTE_ID` fallback — **not ported**; `AMBIENTE_ID` is a fixed `.env` value validated at boot (D-27: `GET_AMBIENTE_ID() = AMBIENTE_ID` or exit 1). Test: boot with a mismatched `AMBIENTE_ID` and assert the process exits 1.
- [ ] **P0** BR-AUTH-09 / D-07d / A-04 — regeneration password change: current value required, `nova === confirmacao` (msg #6), write via `RAWTOHEX(CRYPT_PKG.ENCRYPTSTRINGRAW(:nova))`, ADM only (`PUT /api/admin/password-regeracao`).
- [ ] **P0** BR-AUTH-10 — two-tier role model: no row-level filtering by user anywhere in Documentos (functional restriction only) — regression test asserts a USER role sees the same row set as ADM for the same filter, only a reduced action set and column list (D-08).

### Phase 4 — CRUD engine pilot and Administração (Steps 4.1–4.6)

- [ ] BR-PRN-01 — printer catalogue CRUD, `VALIDO='S'` filter feeding the Reimprimir picker (Step 4.1).
- [ ] BR-BKP-07 — `CFG_TIPOS_MiDIA`: `FACTOR` copied from `CFG_UNIDADES_MEDIDA`, `TAMANHO_BYTES = TRUNC(NVL(TAMANHO_MIDIA,1) * FACTOR)` computed server-side (D-24) (Step 4.2).
- [ ] BR-BKP-08 — `CFG_UNIDADES_MEDIDA` plain CRUD (Step 4.2).
- [ ] BR-ADM-02 — Utilizadores: `DATA_INICIO > DATA_FIM` rejected (msg #43); `PASSWORD` write-only via `USER_SECURITY.ENCRYPT` (D-07a); `destroyUserSessions` fires after `PASSWORD`/`TIPO_UTILIZADOR_RF`/`DATA_INICIO`/`DATA_FIM` change or delete (Step 4.3).
- [ ] BR-ADM-07 — `SVR_AMBIENTES_IMPRESSAO` — no maintenance screen exists in Forms either; reference-only, read via lookups, no write test needed.
- [ ] BR-ADM-06 — Variáveis SIID: `AMBIENTE_ID` fixed, `TIPO_VARIAVEL_RF NOT IN ('PASSWORD','PASSWORD_OLD')` filtered out of the list (must never be exposed here — SEC risk, ARCHITECTURE.md §10 note), duplicate type per environment rejected (msg #58) (Step 4.4).
- [ ] ~~BR-ADM-03 (Gestores)~~ — **dropped, D-11.** Negative test: assert no `/api/gestores*` route exists and no grant/revoke DDL is reachable from any code path (Step 4.5 removed from MASTER_PLAN; test is a route-inventory assertion, not a feature test).
- [ ] BR-ADM-01 — Domínios/valores master-detail: conditional field visibility rule ported to `validate()` (STRING vs LISTA tabs), domain cannot be deleted while it has values (msg #42), NOT NULL defaults (`DATA_INICIO=SYSDATE`, `PRIORIDADE=0`, `VERSAO=0.0`, `REGISTADO_POR`) (Step 4.6).

### Phase 5 — Configuração (Steps 5.1–5.5)

- [ ] BR-ADM-05 — Reports: rows 1–3 fixed to `_USER`/`P_USUARIO`/`P_DATAACTUAL` and immutable by name (msgs #54–56); `N_PARAMETROS` must equal row count when ≥2 rows, skipped at 0/1 (msg #57); atomic master+details save (`POST /api/reports/guardar`, the one exception to per-row `crudRoutes`, ARCHITECTURE.md §4.3) (Step 5.1).
- [ ] BR-PRN-02 — Impressoras associadas › Documento: overlap check per model (msg #51), annul = both dates `01/01/1980` (msg #52) (Step 5.2).
- [ ] BR-PRN-03 — Impressoras associadas › Utilizador: overlap per model+user, copy-model/copy-user bulk operations (msg #53) (Step 5.2).
- [ ] BR-PRN-04 / **D-22** — printer resolution precedence is a DB/server concern, not app logic; app-side test is the worked example in §2 (Step 5.2).
- [ ] **P0** BR-PERM-01..11 — full permission rule set (entity/logical key, default-valid-today filter, nova/alterar/anular with overlap checks and the two different sentinel dates `01/01/1980` vs `SYSDATE-1`, bulk add/remove from user and model panels with **no** overlap check unlike single add, copy-model, copy-user) (Steps 5.3, 5.4). Every rule in this range blocks Phase 5 sign-off.
- [ ] BR-ADM-04 — Perfis de departamento: `ID=MAX+1` (retry on `ORA_00001` per ARCHITECTURE.md §10 note), auto-fill from `TTAPVAAT` on `CDEMPLEA` entry, delete allowed only for unsaved rows, `ASSINATURA` BLOB via `PUT|GET|DELETE /:id/assinatura` (Step 5.5).

### Phase 6 — Modelos (Steps 6.1–6.3)

- [ ] BR-MOD-01 — model entity, conditional lookups, header sort buttons (Step 6.1).
- [ ] BR-MOD-02 — Alterar modelo field subset (Step 6.1).
- [ ] BR-MOD-03 — Clonar modelo: `MODELO_EXISTENTE` check (msg #37), confirm dialog (msg #38), sections+conditions copied, barcode/expedition/certificate/protection/stamp/printers/permissions/default-parameters **not** copied (Step 6.1).
- [ ] **P0 (D-28 fix)** BR-MOD-04 / BR-MOD-07 — `TIPOCNTD_ID`/`CONTEXTO_ID`: Forms silently assigns `MAX` (a defect — both are FKs to lookup tables); rewrite shows a dropdown pre-selected with the Forms `MAX` value, required if none. Test must assert the dropdown, not a silent MAX write. (Step 6.3, cross-ref D-28.)
- [ ] BR-MOD-05 — Clonar alínea: `ALINEA = MAX(ALINEA)+1`, conditions not copied (msg #39) (Step 6.3).
- [ ] BR-MOD-06 — section image: upload via multipart replacing WebUtil `Client_To_DB`, signature-based type detection (JPEG/PNG/GIF/BMP), remove sets `IMAGEM=NULL` (Step 6.2).
- [ ] BR-MOD-09 — versioned default-parameter save logic (open-ended vs dated rows, close-and-insert vs update-in-place) (Step 6.1).
- [ ] BR-MOD-10 — default-parameter date validations (msgs #43–45) (Step 6.1).
- [ ] BR-MOD-11 — eDoc/archive attributes: only `CDRAMO` updatable (Step 6.1).
- [ ] BR-MOD-12 — barcode settings, six columns updated together (Step 6.1).
- [ ] BR-MOD-13 — unsaved-changes prompt (msg #46) — becomes the SPA dirty-state guard (Sim/Não/Cancelar), no server work (ARCHITECTURE.md §7) (Step 6.3).
- [ ] BR-MOD-14 — master-detail clear/query and filter-capture behaviour (Step 6.1/6.3).
- [ ] **P0 (D-28 fix)** BR-MOD-08 — load the *newest* valid default (`ORDER BY DATA_INICIO DESC FETCH FIRST 1 ROW ONLY`), not "any matching row via ROWNUM before ORDER BY" (Step 6.1, cross-ref D-28).
- [ ] ~~BR-MOD-15 (`_old` draft)~~ — superseded; do not migrate its extra WebUtil/host-command transfer paths. Negative test: no `Host()`, no `DB_To_Client`, no Java-bean file dialog in the rewrite.

### Phase 7 — Documentos (Steps 7.1–7.5)

Walked 2026-09-30. `[x]` = the named test passed on 2026-09-30 (`pnpm -r test`: api 1022, web 48, shared 33; `playwright test e2e/documentos.spec.ts e2e/auth.spec.ts`: 14/14), or a manual check says so. Test names below are `file › test`; `api/` = `app/apps/api/src/features/`, `ops/` = `api/documentos/operacoes/`. **Contract (Oracle parity) tests were not re-run on 2026-09-30:** the TEST DB answered `ORA-12170` twice. They are listed as a second source and must be re-run (`analysis/PHASE7_GAPS.md` G-1). Open items: `analysis/PHASE7_GAPS.md`.

- [x] BR-DOC-01 — default query (`SVR_DOCUMENTOS_VW`, `ID DESC`, filter "Todos") (Step 7.1). Evidence: `api/documentos/routes.test.ts › returns the envelope, default order ID DESC, the list columns only`; contract `BR-DOC-01 default list`.
- [x] BR-DOC-02 — row styling: OFFLINE (`DISPONIBILIDADE='OFF'`), ANULADO (`ATRIBUTO9='A'` or `DISPONIBILIDADE='ANU'`), `***` comment marker (Step 7.1). Evidence: `routes.test.ts › row colour: OFFLINE wins, ANULADO from …; *** when commented`; e2e `ADM › Comentários: Guardar adds the comment (BR-DOC-30), the ✎ marker appears`. No `OFF` row in TEST (G-3).
- [ ] BR-DOC-03 / **D-16** — document/queue state vocabularies and UI-driven transitions; see worked example 3 (§2) (Step 7.1). Not reproducible: needs one row per label branch, and no DB writes are allowed (G-2). Partial: contract `BR-DOC-02 rows …` compares the view's `ESTADO` as-is; `web/…/documentos/-common.test.ts › StatusBadge tone`.
- [x] **P0 (D-28 fix: BR-DOC-04's own filter set unchanged, no fix needed here)** BR-DOC-04 — six quick-filter presets; see worked example 1 (§2) (Steps 7.1, 7.3). Evidence: `routes.test.ts › presets pick their documents`; e2e `USER › no action toolbar …` (6 filter buttons). Oracle parity: contract `BR-DOC-04 presets: total and first 200 ids equal the form WHERE` (re-run pending, G-1).
- [x] BR-DOC-05 / BR-XC-01 — generic sort-toggle convention, incl. `LOTE` compound sort (`LOTE_ID, LOTE_ORDEM`) and `FATURACAO_ELECTRONICA` (A-05) (Step 7.1). Evidence: `routes.test.ts › sort LOTE = LOTE_ID, LOTE_ORDEM …`, `› ADM may use every sort button`; contract `BR-DOC-05 sorts`.
- [x] BR-DOC-06 — "IS NULL" typed into a query field → `<col> IS NULL` — becomes the `f[COL][null]=1` operator (ARCHITECTURE.md §4.1) (Step 7.1). Evidence: `routes.test.ts › QBE filters and the IS NULL convention combine with a preset`; contract `QBE filters (BR-DOC-06, BR-DOC-07)`.
- [x] BR-DOC-07 — ad-hoc query criteria persist as the active filter (`KEEP_QUERY` always `0` in practice — the `1` branch is dead, do not port it) (Step 7.1). Evidence: same two tests as BR-DOC-06; no `KEEP_QUERY` in `app/` (manual grep).
- [x] BR-DOC-08 — multi-selection semantics — **intended difference**: selection travels as `ids[]`/`consulta` in the request, not `SVR_GESTAO_SIID_TMP` rows (§4.2 of ARCHITECTURE.md; §11 "nothing is stored between requests"). Test asserts "Seleccionar todos" resolves against the *whole* query result, matching Forms' full-fetch behaviour, not just the visible page. Evidence: e2e `ADM › keyboard: Ctrl+A selects the whole query`; `ops/routes.test.ts › consulta with a preset resolves through the list query`.
- [x] BR-DOC-09 — batch actions requiring ≥1 selection show `Não existem documentos seleccionados.` (D-26 default text for the originally-blank msg #30) for Regerar/Reenviar/Reenviar Email/Re-Arquivar (Step 7.2/7.3). Evidence: `ops/routes.test.ts › selection: ids / consulta / errors (BR-DOC-09, D-26)`; e2e `… nothing selected → #30`.
- [x] **P0 + D-28/A-06** BR-DOC-10 — Reimprimir: **fixed** to skip annulled documents like 2ª via/Cópia (Forms bug where `VALIDACAO='F'` let annulled documents print); skip predicate widened to `ATRIBUTO9='A' OR DISPONIVEL_RF='ANU'` (A-06) (Step 7.2). Verify divergence from Forms is **exactly** this — no other Reimprimir behaviour changes. Evidence: `ops/routes.test.ts › %s skips annulled documents (ATRIBUTO9 A or DISPONIBILIDADE ANU) with #9`, `› reimprimir and copia of a never-printed document are fine`; `ops/regras.test.ts › motivoImpressao`; e2e `ADM › select → Reimprimir: annulled document skipped`.
- [x] **P0** BR-DOC-11 — 2ª via prior-print check (`N_IMPRESSOES=0` → msg #10); see worked example 2 (§2) (Step 7.2). Evidence: `ops/routes.test.ts › segunda-via of a never-printed document (N_IMPRESSOES 0) is skipped with #10`.
- [x] BR-DOC-12 — Cópia: no prior-print requirement, same annul skip (Step 7.2). Evidence: `ops/routes.test.ts › reimprimir and copia of a never-printed document are fine`, `› %s skips annulled documents …` (copia case).
- [x] **P0** BR-DOC-13 — Regerar: password required when any selected doc was already printed (`SVR_QUEUE TIPO_QUEUE_RF='IMPRESSAO' AND ESTADO='TERMINADO'`) or model `MODO_EXPEDICAO_RF='G'`; annulled skipped (msg #13) (Step 7.2). Evidence: `ops/regras.test.ts › precisaPassword (BR-DOC-13)`; `ops/routes.test.ts › with the reauth flag: printed and G documents are regenerated; annulled ones skipped and listed`.
- [x] **P0** BR-DOC-14 — `428 PASSWORD_REGERACAO_NECESSARIA` (msg #14) then `403 PASSWORD_ERRADA` (msg #15) on wrong password, compared as `RAWTOHEX(CRYPT_PKG.ENCRYPTSTRINGRAW(:pwd)) = VALOR`; only Regerar prompts, never Reimprimir/2ª via/Cópia (A-04) (Step 7.2). Evidence: `ops/routes.test.ts › a printed document in the selection and no reauth → 428 PASSWORD_REGERACAO_NECESSARIA`; `api/auth/routes.test.ts › wrong password → 403 PASSWORD_ERRADA, no flag`. Manual: only the `regerar` case reads the reauth flag (`ops/routes.ts`, `hasRegeneracaoReauth`).
- [x] **P0** BR-DOC-15 — Anular: `PKG_DOCUMENTOS_SVR.ANULAR` per document, no form-level precondition; per D-17/A-01 the call commits internally — app must re-read `DISPONIVEL_RF` after and report failure if it isn't `'ANU'` (Step 7.2). Evidence: `ops/oracle.test.ts › anular (BR-DOC-15, D-17 …)`; `ops/routes.test.ts › an unknown id is skipped; no pre-condition on already annulled documents`; e2e `ADM › select (Space) → Anular`.
- [x] **P0 + D-12** BR-DOC-16 — Cancelar: normal scope `ESTADO IN ('TERMINADO','ESPERA','ENQUEUED','EM EXECUCAO','ERRO')`; the hard-coded `AFREITAS` bypass becomes a `force` checkbox available to **every ADM** (D-12), off by default, audited with the force flag (Step 7.2). Verify no username string appears anywhere in the code path. Evidence: `ops/routes.test.ts › force false (default): only EXECUCAO rows in the five states …`, `› force true: …`; `ops/regras.test.ts › CANCELAR_ESTADOS`. Manual: the name was left in one comment in `ops/oracle.ts`; removed 2026-09-30; `grep -r AFREITAS app/apps app/packages` → 0 hits.
- [x] **P0 + D-28 fix** BR-DOC-17 — Reenviar (EDoc): `MODO_EXPEDICAO_RF='W'` and `CAN_BE_UPLOADED_EDOC(id)<>0` (D-18) gate; audit text **fixed** to `DOCUMENTO REENVIADO POR <user>` (Forms wrote the wrong `REGERADO` text — this is the fix, verify the exact new string, not a re-use of BR-DOC-36's other wording) (Step 7.2). Evidence: `ops/routes.test.ts › only model W documents that CAN_BE_UPLOADED_EDOC; REENVIAR row + REENVIADO audit line`; `ops/regras.test.ts › auditoria — ERR_ERROS_SIID.DESCRICAO texts`.
- [x] BR-DOC-18 — Reenviar Email: re-uses the last `EMAIL` queue row's address, format-validated server-side (D-05, an added check Forms lacked — not a D-28 item but still an intended difference) (Step 7.2). Evidence: `ops/routes.test.ts › POST …/reenviar-email (BR-DOC-18, D-05)`; `ops/regras.test.ts › motivoReenviarEmail / EMAIL_RE`.
- [x] BR-DOC-19 — Re-Arquivar: `ARQ_ID` not null gate (msg #22) (Step 7.2). Evidence: `ops/routes.test.ts › POST …/rearquivar (BR-DOC-19)`; `ops/regras.test.ts › motivoRearquivar`.
- [x] ~~BR-DOC-20 (Recriar XML)~~ — dead code in Forms (`FATURAELECTRONICA` is a sort button, not this action); **do not implement** `TOXML`/`RECRIAR` unless a new business request supersedes this. Negative test: no `POST .../recriar` route. Evidence: `ops/routes.test.ts › an unknown acao → 404 NAO_ENCONTRADO` (uses `recriar`).
- [x] **P0 (D-28 fix)** BR-DOC-21 — Suspender: scope unchanged (every `ESPERA` row across *all* request types when "todos" is chosen — this stays, it is not the bug), but the app must show a confirm dialog with the affected row **count** before committing (`GET /api/documentos/fila/contagem?estado=ESPERA`, ARCHITECTURE.md §10.1) — this confirmation is the fix (Step 7.2/7.3). Evidence: `ops/routes.test.ts › suspender todaFila: every ESPERA row of any document and type`, `› GET /api/documentos/fila/contagem (D-28 confirmation count)`. Manual: the dialog reads the count (`web/…/documentos/-acoes.tsx`, `fila/contagem`); no e2e for the dialog (G-4).
- [x] BR-DOC-22 — Retomar — **intended difference**: uses its own selected/all choice rather than reading the Suspender dialog's radio (a Forms bug per STRUCTURE §3.3, not replicated) (Step 7.2). Evidence: `ops/routes.test.ts › retomar ids: …`, `› retomar todaFila: every SUSPENSO row`.
- [x] BR-DOC-23 — single queue-row cancel, `ESTADO IN ('ESPERA','TERMINADO')` guard, confirm msg #25 (Step 7.4). Evidence: `ops/routes.test.ts › POST …/fila/:queueId/cancelar (BR-DOC-23)`; `ops/oracle.test.ts › cancelarPedido`.
- [x] BR-DOC-24 — queue window display: printer fallback to the document's own `IMPRESSORA_ID` (Step 7.1). Evidence: `routes.test.ts › comentarios …; fila by ID with the printer text; …`; contract `BR-DOC-24 fila`.
- [x] BR-DOC-25 — Clonar documento: one PL/SQL block (`SET_PARAMETRO_STRING`…`EXECUTA`…`GET_ID_EXECUCAO`) on one connection (D-17), `P_USUARIO` = session user (D-20), `LOTE_ID` inherited from the source document via a bound `UPDATE` (Step 7.2). Evidence: `ops/oracle.test.ts › clonar (BR-DOC-25 …)`; `ops/regras.test.ts › blocoClonar`; `ops/routes.test.ts › ADM: 201 { id }, new document with the same MODELO_ID / LOTE_ID …`.
- [x] BR-DOC-26 — parameter conversion helper (`P_NMRECIBO`→`MRECIBO`, `P_CDPERSON`→`MPERSONA`) — becomes `GET /api/documentos/conversoes/recibo|pessoa` (Step 7.2). Evidence: `routes.test.ts › GET /api/documentos/conversoes/* — CONVERTE_PARAM (BR-DOC-26)`; contract `BR-DOC-26 conversions`.
- [x] BR-DOC-27 — Procurar por parâmetros: intersection semantics across multiple `param[NOME]=VALOR` pairs, no-match message #26 (Step 7.1). Evidence: `routes.test.ts › two parameters intersect`, `› no match → empty list`; contract `BR-DOC-27 parameter search`.
- [x] BR-DOC-28 — Mostrar Grupo: model-pair/lote navigation vs. attachment navigation branches (Step 7.1). Evidence: `routes.test.ts › grouped model in a lote …`, `› any other model: the parent document and its attachments`; e2e `ADM › context menu GENERICO: Mostrar Grupo …`, `ADM › Anexos: … double-click opens the document group`.
- [x] BR-DOC-29 — Mostrar Documento → PDF proxy; test/prod URL switch (`BR-XC-07`) **replaced** by `FILESERVER_BASE_URL` per container (D-03/D-02) (Step 7.1). Evidence: `routes.test.ts › GET /api/documentos/:id/pdf — FileServerSIID proxy` (6 tests, USER too).
- [x] BR-DOC-30 — comments: sequence-assigned id, `***` marker feeds back into BR-DOC-02 (Step 7.4). Evidence: `ops/oracle.test.ts › comentar (BR-DOC-30 …)`; `ops/routes.test.ts › adds a comment: id from the sequence, session user, 201, and the GET tab and list marker see it`; e2e `ADM › Comentários: Guardar adds the comment`.
- [x] BR-DOC-31 — Parametros/Logs/Detalhes read-only detail windows (Step 7.1). Evidence: `routes.test.ts › GET /api/documentos/:id — detail by role (D-08)`, `› GET /api/documentos/:id/<tab>`; contract `BR-DOC-31 detail`.
- [x] ~~BR-DOC-32 (tablespace gauge)~~ — **dropped, D-13.** Negative test: no timer, no `/api/.../espaco` route, no `GD_ESPACO_BD` query anywhere. Evidence (manual, 2026-09-30): `grep -rl "GD_ESPACO\|/espaco\|USER_TS_QUOTAS" app/apps app/packages` → 0 hits.
- [ ] BR-DOC-33 — window-close semantics — mostly N/A (SPA has no modal-window rollback-on-close model); verify no orphaned client-side state after closing a dialog. Not checked (G-4).
- [x] BR-DOC-34 — explicit commit semantics — N/A in the rewrite (`autoCommit=false`, one transaction per request, ARCHITECTURE.md §3); no batching-then-single-commit behaviour to replicate beyond "batch actions commit once for the whole batch" for the non-package actions. Evidence: `ops/oracle.test.ts › enfileirar (SVR_QUEUE + ERR_ERROS_SIID in ONE transaction …)`.
- [x] BR-DOC-35 — USER variant toolbar subset — see the dedicated D-08/A-08/A-09 checklist item below.
- [x] BR-DOC-36 — audit lines in `ERR_ERROS_SIID` for Regerar/Reenviar/Reenviar Email/Re-Arquivar/Recriar (Recriar excluded, dead code) — exact text per action, with BR-DOC-17's text fixed by D-28 (Step 7.2/7.4). Evidence: `ops/regras.test.ts › auditoria — ERR_ERROS_SIID.DESCRICAO texts (BR-DOC-36, D-28)`; `ops/oracle.test.ts › enfileirar …`. The app audit log after a failed batch is a separate gap (G-5).
- [x] ~~BR-DOC-37 (legacy PDF path algorithm)~~ — disabled in Forms; **documented only**, not implemented (D-29). No test beyond a negative test: no filesystem/share access anywhere in the app (fits D-04). Evidence (manual, 2026-09-30): `node:fs` is used only by `api/../dev-server.ts` and `api/../http/spa.ts` (the SPA's own static files); no share paths.

**D-08 / A-08 / A-09 — USER-role restrictions: verify divergence is exactly this, no more.**
Diff re-checked 2026-09-30: normalized PL/SQL chunks of `forms-summary/T/FD_GESTAO_SIID.fmb.plsql.txt` vs `FD_GESTAO_SIID_USER.fmb.plsql.txt` (88 ADM-only chunks, 32 USER-only) match STRUCTURE.md §1: ADM-only `RECRIAR`, `REARQUIVAR`, `ID_COMENTARIO_DOCUMENTO_SEQ`, `CAN_BE_UPLOADED_EDOC`, `AFREITAS`; USER still has the clone block (`GET_ID_EXECUCAO`) and the queue cancel.
- [x] USER sort allow-list = `ID` only (Spool), even though the USER form's XML has non-Spool sort buttons wired (A-08) — confirm the API rejects any other `sort=` value for USER with `400 VALIDACAO`, not a silent ignore. Evidence: `routes.test.ts › USER sorts by Spool (ID) only: another key is 400, ID either way is fine`; `repo.test.ts › list: params and preset go into one WHERE; USER sort limit applies`; e2e `USER › no action toolbar, sort by Spool Id only, no Clonar`.
- [x] USER cannot Suspender/Retomar, even though the USER form has those buttons (A-08) — confirm `403 SEM_PERMISSAO`, and confirm the *ADM* path is unaffected. Evidence: `ops/routes.test.ts › USER → 403 SEM_PERMISSAO on every action and on the count; no session → 401`; ADM path: `› suspender ids: …`, `› retomar ids: …`.
- [x] USER cannot insert comments (read-only), even though the USER form's block has no PRE/POST-INSERT trigger blocking it at the DB level (A-08) — confirm the API-level `403`, not a UI-only hide. Evidence: `ops/routes.test.ts › POST /api/documentos/:id/comentarios … › USER → 403, no session → 401`; e2e `USER › Comentários is read-only for USER`.
- [x] ~~USER **can** reach Clonar and~~ single queue-row cancel (`POST /:docId/fila/:queueId/cancelar`) — confirm it is *not* accidentally locked to ADM. **Amended by the owner 2026-09-30:** Clonar is ADM only (the USER form's `GENERICO.CLONAR` item is `Enabled="false" Visible="false"`; ARCHITECTURE.md §5, DOCUMENT_STATES.md §4). Evidence: `ops/routes.test.ts › USER: an ESPERA row → 204 and CANCELLED`; `› USER → 403 SEM_PERMISSAO, nothing cloned (owner decision 2026-09-30: ADM only)`; e2e `USER › … no Clonar`.
- [x] USER detail payload omits `ATRIBUTO5..8`, `ATRIBUTO10..25`, `ATRIB_ARQ_1..20`, `ARQ_ID`, `EDOC_ID`, `REGISTO_ARQUIVO`, `REGISTO_EDOC`, `DATA_ARQUIVO` — confirm at the SQL/response level (D-08), not just hidden in the SPA. Evidence: `repo.test.ts › detalhe: USER SQL never selects the ADM-only columns`; `routes.test.ts › USER never receives the extended columns (absent, not null)`; contract `USER (D-08, BR-DOC-35): same values minus the extended columns`.
- [x] Impressoras Associadas and Alterar password sit under Configuração, **ADM only** (A-09 — Forms parity chosen over the earlier STRUCTURE.md placement under Gestão) — confirm a USER session gets `403` on both, matching a real Forms USER who never reached `CONFIGURAÇÃO_MENU` (`Enabled="false"` in `MD_SIID_USER`). Evidence: `api/impressoras-associadas/routes.test.ts › USER cannot write`; `api/auth/routes.test.ts › USER on an ADM route → 403 SEM_PERMISSAO` (regeneration password); `web/menu.test.ts › gives USER only Gestão › Documentos (D-08)`; GET 403: contract `ops/routes.contract.test.ts › USER session → 403 on ADM-only routes › Impressoras Associadas …` (added 2026-09-30, run pending, G-1).
- [x] Every ADM-only route returns `403 SEM_PERMISSAO` for USER, not `404` (would leak existence) and not a filtered empty list (would look like a data bug rather than a permission boundary). Evidence: `ops/routes.test.ts › USER → 403 SEM_PERMISSAO on every action and on the count` (now also `recriar`, a non-route: 403, not 404); the role check is the first line of every handler (`sessionCtx`, `lib/crud.ts`), so no list is filtered. Oracle-backed: contract `ops/routes.contract.test.ts › USER session → 403 on ADM-only routes (D-08, A-09)` (added 2026-09-30, run pending, G-1).

### Phase 8 — Backups (Steps 8.1, 8.2)

- [x] BR-BKP-01 — `SVR_BACKUPS` entity, one backup per document max (`BACKUP_ID`) (Step 8.1). Evidence: `api/backups/routes.test.ts › 201 { ID, NOME }; one SVR_BACKUPS row …`, `… ids … → 409 REGISTO_ALTERADO` (a document already in a backup is refused).
- [x] BR-BKP-02 — month list (`BACKUP_ID IS NULL AND DATA_IMPRESSAO IS NOT NULL`) and per-month candidate documents (Step 8.1). Evidence: `routes.test.ts › GET /api/backups/meses`, `GET /api/backups/candidatos` (month range incl. leap day, client filters replaced); `oracle.test.ts › meses`, `candidatos`; SQL run read-only on TEST 2026-10-01 (meses ~46 s full scan, under DB_CALL_TIMEOUT_MS).
- [x] BR-BKP-03 — generated `NOME` (`COSEC_YYYYMM_nn`) and `DESTINO` (`SVR_VARIAVEIS_SIID` `BACKUP` value || `NOME`) — copy the exact `TO_CHAR` expression from `FD_NOVO_BACKUP_fmb.xml`, including its leading-blank padding quirk noted in ARCHITECTURE.md §10.1 (Step 8.1). Evidence: `oracle.test.ts › the name is the form's expression in SQL …` (TO_CHAR(n,'00'), no LPAD); `routes.test.ts › the second backup of the same month is COSEC_YYYYMM_ 02`, `BACKUP variable missing → DESTINO is just NOME`. Name preview run on TEST: `COSEC_202609_ 01`.
- [x] BR-BKP-04 — validation before create: `NOME` (msg #48), `MIDIA_ID` (msg #49), `TAMANHO_BYTES >= TOTAL_BACKUP` (msg #50), ≥1 document selected (Step 8.1). Evidence: `routes.test.ts › POST /api/backups — validations` (#49 blank/missing, #50 incl. equal size passes and null size passes, #30 empty selection). `NOME` (#48) is server-generated, so its alert cannot occur.
- [x] BR-BKP-05 / **A-02** — committing a backup: `SVR_DOCUMENTOS.BACKUP_ID` update + `SVR_QUEUE('BACKUP','ESPERA')` insert **in the form's own transaction** — the `GERA_BACKUP`/`INSERE_DOCS_BACKUP` package procedures are **not called** (they differ from the form and swallow errors, A-02). Test must assert the app takes the Forms SQL path, not the package path. Evidence: `oracle.test.ts › criar` (step order midia → nome → insert → UPDATE → total → SVR_QUEUE insert → one commit; rollback on 409/400/failing insert; no package call in `features/backups/`).
- [ ] BR-BKP-06 — running total on select/unselect, "Seleccionar todos" recompute (Step 8.2).
- [x] BR-BKP-09 — Backups Online/Offline toggle: `DRIVE_ONLINE` set from `SVR_VARIAVEIS_SIID` `ONLINE` value with `NVL(MAX(VALOR),'E:\')` default when going online, cleared when going offline; `SET_BACKUP_ONLINE` package procedure **not called** (A-02, same reasoning as BR-BKP-05) (Step 8.1/8.2). Evidence: `routes.test.ts › POST /api/backups/online` (ONLINE variable, `E:\` default, offline clears the drive, unknown id → 409); `oracle.test.ts › online` (executeMany, one transaction). UI part: Step 8.2.

### Cross-cutting (BR-XC-*) — exercised inside the phases above, listed separately because they are not form-specific

- [ ] BR-XC-01 — generic sort-toggle convention — exercised by every grid; covered once at the DataBlock component level (Step 2.4) plus per-screen allow-list tests.
- [ ] BR-XC-02 — `FORMS_DDL` inventory — **fully replaced**, nothing to port; negative test per item (synonyms: BR-AUTH-07 above; grants: BR-ADM-03 above; ad-hoc commit/rollback: N/A, `autoCommit=false` design; password update: BR-AUTH-09; clone `LOTE_ID` update: BR-DOC-25, now a bound statement not `FORMS_DDL`; Regerar queue/audit insert: BR-DOC-13, plain bound DML).
- [ ] BR-XC-03 — privilege-based gating via catalogue lookups — **fully replaced** by `.env` configuration (D-02) and `config.roles` (D-08); negative test: no `USER_TAB_PRIVS`/`USER_SYNONYMS`/`ALL_USERS`/`ALL_OBJECTS` query anywhere in the app.
- [ ] BR-XC-04 — date-range start-not-after-end validations — one test per screen that has the rule: Utilizadores (BR-ADM-02), default parameters (BR-MOD-10), printer associations (BR-PRN-02/03), permissions (BR-PERM-04/05). Message text differs (`inicio` vs `início`) per rule — assert the exact legacy string, not a normalized one.
- [ ] BR-XC-05 — soft-delete sentinels: `01/01/1980` (permission/printer annul) vs `SYSDATE-1` (permission bulk remove) vs `31-12-2200` (permission bulk-add open end) vs `NULL` (permission single add/copy open end) — the rewrite keeps these exact values (no migration to a single representation is in scope); test each sentinel at its originating action.
- [ ] BR-XC-06 — audit columns: `CRIADO_POR`/`ACTUALIZADO_POR` get the **session user** everywhere in the rewrite, including the tables where Forms wrote the **DB account** (`SVR_BACKUPS`, `SVR_REPORT_SIID`/`SVR_PARAMETROS_REPORT`, `CFG_TIPOS_MiDIA`, `CFG_VALORES_DOMINIO.REGISTADO_POR`, `CFG_UTILIZADORES.CRIADO_POR`) — this is an **explicit, listed intended difference** (ARCHITECTURE.md §11 first row), not a bug. Checklist item: confirm every one of those five tables gets the session user in the rewrite, and confirm the parity test does *not* flag this as a mismatch.
- [ ] BR-XC-07 — `AMBIENTE_ID LIKE '%TESTE%'` test/prod file-server switch — **fully replaced** by `FILESERVER_BASE_URL` per container (D-02/D-03); negative test: no string match on `AMBIENTE_ID` anywhere for this purpose.
- [ ] BR-XC-08 — hard-coded values to externalize — checklist is one line per item, confirming it moved to config/constant, not that it still works: model-code lists (BR-DOC-04, BR-DOC-28 — `resources-server/documentos.ts` constants, ARCHITECTURE.md §4.1 "Forms had no configuration table for them either"), `AFREITAS` (removed, D-12), `COSEC_` prefix (BR-BKP-03), `E:\` default drive (BR-BKP-09), file-server URLs (`.env`, D-03), 1 h/90% gauge (dropped, D-13), DB accounts (`.env`, D-30), synonym/grant lists (removed, D-02/D-11), report parameter names (still literal strings in `resources-server`, by design — they are protocol, not configuration), image signatures (BR-MOD-06, a constant table), sentinels (BR-XC-05, kept literal).

### Dropped scope — no tests needed, confirm by absence

- [ ] D-06 — Auditoria › Médias Execução dropped entirely (Phase 9 removed from MASTER_PLAN). Negative test: no Auditoria menu entry, no route.
- [ ] D-11 — Gestores dropped (see BR-ADM-03 above).
- [ ] D-13 — tablespace gauge dropped (see BR-DOC-32 above).

---

## 4. Test data

**No test data is created in Oracle** (HARD RULE above). Contract tests read rows that already exist in the TEST schema and skip a case when no suitable row exists. Tests must not insert, update or delete anything — not in reference tables, not in `ZZTEST_` rows, not in a rolled-back transaction.

**Write paths** (crudRoutes, named actions, package calls such as `ANULAR` / Clonar, the regeneration-password change) are tested with a fake db in unit tests only.

**Accounts.** A test that needs a successful login uses an account the owner gives through `GESTSIID_TEST_USER` / `GESTSIID_TEST_PASSWORD` (never stored in the repo); without it, the case skips.

---

## 5. CI gates

Exact order, from `ARCHITECTURE.md` §8 "CI gates":

1. `gitleaks detect`
2. `pnpm audit --prod` (high and critical severities fail the build)
3. `pnpm -r lint`
4. `pnpm -r typecheck`
5. `pnpm -r test` (unit tests — no DB, run always)
6. **Contract tests** — run only when the `DB_CONNECT_STRING` secret exists in the CI environment; **skipped otherwise** (`describe.skipIf(!process.env.DB_CONNECT_STRING)` per §1 above). This matches `SECURITY_FINDINGS.md` §3 items 10 and 17, referenced by ARCHITECTURE.md §8: there is no Oracle 12.2 test image to spin up in CI (ARCHITECTURE.md §1 "Rejected" table: "MSW, testcontainers … there is no Oracle 12.2 test image, contract tests use the shared test schema (D-10)"), so a CI runner without network access to the shared TEST schema (or without the secret provisioned) legitimately has zero contract-test coverage for that run — this is accepted, not a failure.
7. Build image (Docker multi-stage build, ARCHITECTURE.md §2)
8. Playwright smoke (against the built image; also depends on `DB_CONNECT_STRING` being reachable — same conditional skip applies to any E2E spec that needs the TEST schema, though the login-page-renders / static-asset smoke checks can run without it)

No gate is reordered or renamed relative to ARCHITECTURE.md §8. A pull request from a fork, or any CI run without the DB secret provisioned, is expected to go green on gates 1–5 and 7 and show gates 6/8's DB-dependent specs as skipped, not failed — reviewers should treat an all-skipped contract-test run as normal for that context, and treat any contract-test *failure* (as opposed to skip) as blocking regardless of which gate number it's attached to.
