# GestSIID rewrite — Decisions

Binding for every later step of `analysis/MASTER_PLAN.md` (Step 0.3 output). One entry per decision.
Format: question, options considered, decision, date, consequences. "Default" means the owner said "you decide"
and the recommended option was recorded.

---

## D-01 — Source of truth

**Question:** Which source set is the truth for the rewrite: `dev/T` or `dev/P`? Are `FD_GESTAO_SIID_v2` and `FD_CONFIGURACAO_MODELOS_old` drafts to ignore?
**Options considered:** (a) `dev/T`, drafts ignored; (b) `dev/P`, drafts ignored.
**Decision:** (a) `dev/T` is the truth. `dev/T/FD_GESTAO_SIID_v2.fmb`, `dev/T/FD_CONFIGURACAO_MODELOS_old.fmb` and `dev/P/bck/` are ignored.
**Date:** 2026-09-15
**Consequences:**
- All analysis and parity tests use `analysis/forms-xml/T/`. Only 5 modules differ from P (`analysis/T_vs_P_DIFF.md`); none of the differences is business logic.
- Production connect data from the P login form goes to the production `.env`, never to code.
- The T image-picker bean in `FD_PERFIS_DEPARTAMENTO` is replaced by a plain file input (its target item is broken anyway, STRUCTURE.md §7).

## D-02 — Environment model

**Question:** Environment selector at login (as the Forms login list suggested) or one fixed environment per deployment?
**Options considered:** (a) one container per environment, `DB_SCHEMA` and `AMBIENTE_ID` fixed in `.env`, environment shown as a label; (b) selector at login with one pool per environment.
**Decision:** (a) one container per environment.
**Date:** 2026-09-15
**Consequences:**
- Evidence: each Forms build had one real list entry (T = `GADOR_TESTES`, P = `COSEC`); the DB dump shows `GET_AMBIENTE_ID()` returns `'GADOR_TESTES'`, `SVR_AMBIENTES_IMPRESSAO` has one row with that ID, and `SIID_TESTES.MRECIBO` is a synonym to `GADOR_TESTES.MRECIBO` (see D-27).
- `.env` holds `DB_USER`, `DB_CONNECT_STRING`, `DB_SCHEMA` (e.g. `SIID_TESTES`) and `AMBIENTE_ID` (e.g. `GADOR_TESTES`). The app fails fast at boot if one is missing.
- No `CREATE SYNONYM` / `DROP SYNONYM` at runtime (removes SEC-009 pattern). Objects are qualified by `DB_SCHEMA` or reached through existing synonyms.
- Every query that Forms filtered by `:GLOBAL.AMBIENTE_ID` binds the `.env` value instead.
- Login page shows the environment name as a read-only label.

## D-03 — Document viewer (FileServerSIID)

**Question:** URL per environment, credential, TLS, and proxy vs browser redirect for PDFs.
**Options considered:** (a) API proxies/streams the PDF after a permission check; (b) API returns the FileServerSIID URL and the browser opens it. Credential: none / some. TLS: yes later / stays HTTP.
**Decision:** (a) API proxy. FileServerSIID needs **no credential** and **stays on HTTP**.
**Date:** 2026-09-15
**Consequences:**
- `.env`: `FILESERVER_BASE_URL` per container. Test = `http://ssiidt.cosec.pt:8090/FileServerSIID/restapi/FileServer/pdf/T`; prod = `http://ssiid-prod.cosec.pt:8090/FileServerSIID/restapi/FileServer/pdf/P` (the Forms `LIKE '%TESTE%'` switch goes away; D-02). Query string `spoolid=<SVR_DOCUMENTOS.ID>`.
- Route `GET /api/documents/:id/pdf`: session required, document must be visible to the user (same filters as the list), then stream with `Content-Type: application/pdf`, `Content-Disposition: inline`. Upstream 404/timeout → clear error, no stack trace.
- The browser never sees the file server host (fixes SEC-010 for app users).
- **Accepted risk:** the API → FileServerSIID hop is plain HTTP and the file server itself is still open to anyone on the LAN. The API container must run on the same trusted server network. Record in Step 10.1; the fix (TLS + auth on FileServerSIID) belongs to the file-server owner.

## D-04 — Dead OS/file code and the queue processor

**Question:** Port HOST / CLIENT_HOST / TEXT_IO / WIN_API code? Does the external SVR_QUEUE processor keep running?
**Options considered:** (a) confirm: port nothing, processor unchanged; (b) processor will change.
**Decision:** (a). None of that code is ported. The SVR_QUEUE processor keeps running unchanged.
**Date:** 2026-09-15
**Consequences:**
- The app has no `child_process`, no file-share access, no registry/DLL calls (SEC-011 closed by omission).
- Every physical action = insert an `SVR_QUEUE` row (or call the `PKG_DOCUMENTOS_SVR` procedure that inserts it), exactly as the forms did. Row shapes are pinned by characterization tests (Step 1.3).
- Evidence from the DB: `PKG_DOCUMENTOS_SVR` only inserts queue rows (`'BACKUP'`/`'ESPERA'`, `'ANULADO'`/`'TERMINADO'`, `'EMAIL'`); nothing in the dumped packages sets `DISPONIVEL_RF='OFF'` or `DATA_IMPRESSAO` → the processor does.
- The app never waits for the processor; the Documentos screen shows progress through `SVR_DOCUMENTOS_VW.ESTADO` (D-16).

## D-05 — E-mail resend

**Question:** Is REENVIAR_EMAIL only a queue row (type `EMAIL`, `ATRIBUTO01` = address) sent by the processor, so the app needs no SMTP?
**Options considered:** (a) confirm, no SMTP in the app; (b) the app sends mail itself.
**Decision:** (a). The app has no SMTP settings.
**Date:** 2026-09-15
**Consequences:**
- Evidence: `PKG_DOCUMENTOS_SVR.EMAIL` / `REEMAIL` only call `PEDIDO_EMAIL*` (queue insert); no dumped package uses `UTL_SMTP` or `UTL_MAIL`.
- The resend dialog proposes the last address (`MAX(ATRIBUTO01)` of earlier EMAIL rows, as Forms did) and validates the address server-side before the insert.
- Any future app-sent mail (e.g. self-service password reset) is out of scope; password resets are done by an ADM (see D-07).

## D-06 — Auditoria › Médias Execução (MEDIAS_DOCUMENTOS)

**Question:** The menu item is a no-op (report call commented, item disabled in both menus). Rebuild as a page or drop?
**Options considered:** (a) drop; (b) rebuild as an ADM dashboard on `GD_EXECUCAO_SUCEDIDA_VW` / `GD_EXECUCAO_NAO_SUCEDIDA_VW` / `GD_ERROS_EXECUCAO_VW`.
**Decision:** (a) drop.
**Date:** 2026-09-15
**Consequences:**
- No Auditoria menu in the new app. MASTER_PLAN Phase 9 / Step 9.1 is removed.
- No Oracle Reports dependency of any kind.
- A future request is a new feature with its own spec, not parity work.

## D-07 — Authentication, session, regeneration password

**Question:** (a) Keep `CFG_UTILIZADORES` + `USER_SECURITY.ENCRYPT` or force a reset to Argon2id? (b) Enforce `DATA_INICIO`/`DATA_FIM`? (c) Session lifetime? (d) Shared regeneration password: keep (ADM only) or replace with a per-user permission?
**Options considered:** (a) keep with re-hash on login / force reset at cutover; (b) enforce / ignore like Forms; (c) 8 h absolute + 30 min idle / 8 h + 2 h idle; (d) keep shared, ADM only / per-user "may regenerate" permission.
**Decision:**
- (a) **Keep the login form's table and function, no Argon2id.** The API verifies by comparing `USER_SECURITY.ENCRYPT(:pwd)` (RAW) with `CFG_UTILIZADORES.PASSWORD` for `USERNAME` + `AMBIENTE_ID`, exactly like `FD_LOGIN_SIID`. ADM password set/reset in Utilizadores writes `USER_SECURITY.ENCRYPT(:pwd)` to the same column, like `FD_UTILIZADORES_SIID`. No new table, no second hash, no later switch. (First answer was "keep + re-hash on login into an Argon2id table"; the owner changed it on 2026-09-15.)
- (b) **Enforce** `DATA_INICIO <= SYSDATE AND NVL(DATA_FIM, SYSDATE) >= SYSDATE`, plus rate-limit and lockout per SECURITY_FINDINGS §3 item 3.
- (c) **8 h absolute, 30 min idle**, server-side session, `httpOnly; Secure; SameSite=Lax` cookie, ID rotated at login, CSRF token on writes.
- (d) **Keep the shared regeneration password, ADM only.** Stored as today (`SVR_VARIAVEIS_SIID`, `TIPO_VARIAVEL_RF='PASSWORD'`, `CRYPT_PKG.ENCRYPTSTRINGRAW`) so Forms and the app accept the same value during the parallel run. The change screen requires the current value, validates new = confirmation, uses binds (no `FORMS_DDL`), and writes an audit row.
**Date:** 2026-09-15
**Consequences:**
- No DB change. The app DB account needs `EXECUTE` on `USER_SECURITY` and `CRYPT_PKG` (the Forms account already has it).
- DB facts: `USER_SECURITY.ENCRYPT` returns RAW; `DB_FACTS.md` says Thick mode is required for this account (legacy verifier, NJS-116) unless the DBA resets the account password with a 12c verifier.
- Before go-live, run a query listing active users whose `DATA_FIM` is in the past, so nobody is locked out by surprise.
- "Alterar password" leaves the USER menu (see D-08). Users do not change their own login password in the app (Forms had no such screen); ADM resets it in Utilizadores.
- **Accepted risk:** SEC-005 stays open (passwords stay reversible DES). SEC-008 is reduced (ADM only + current value + audit), not closed. Both go to the Step 10.1 risk list. SECURITY_FINDINGS §3 item 1 (Argon2id, forced reset) does not apply.
- Regeneration/reprint actions still prompt for the shared password, verified server-side (never sent back to the browser).

## D-08 — USER role limits (closes OQ-2)

**Question:** Are the USER restrictions found in `MD_SIID_USER` and `FD_GESTAO_SIID_USER` (STRUCTURE.md §1) the intended ones?
**Options considered:** (a) yes, keep them, enforced server-side; (b) adjust some limits.
**Decision:** (a) keep them. Role = `CFG_UTILIZADORES.TIPO_UTILIZADOR_RF`: `'ADM'` → ADM, anything else → USER.
**Date:** 2026-09-15
**Consequences:**
- USER menu: Documentos only. No Gador, Configuração (which holds Impressoras Associadas and Alterar password, A-09), Administração, Backups, Auditoria.
- USER in Documentos: filters, sort by spool, select all, parameter search, comments (read-only), parameters, queue, logs, reduced details (no `ATRIBUTO5..8`, `ATRIBUTO10..25`, `ATRIB_ARQ_1..20`, `ARQ_ID`, `EDOC_ID`, `REGISTO_ARQUIVO`, `REGISTO_EDOC`, `DATA_ARQUIVO`), PDF view, clone. No toolbar actions (regerar, reimprimir, 2ª via, cópia, anular, cancelar, suspender, retomar, reenviar EDoc, reenviar e-mail, rearquivar, lote) and no comment insert.
- Clone and single-request cancel exist in the USER form's code, but their buttons are not named in the USER dump. Step 7.5 checks this in running Forms; if USER cannot reach them there, they are ADM only.
- Every ADM-only route has `requireRole('ADM')` in the API and returns 403 for USER; the USER API response for document details omits the extended columns (not just hidden in the UI). Closes SEC-004.
- Identity comes only from the session (never a `P_USERNAME`-style parameter); `CRIADO_POR`, `P_USUARIO`, `P_USER` get the session username.

## D-09 — Deployment target

**Question:** Docker Compose only or Kubernetes later? Reverse proxy and TLS termination? Domain name?
**Options considered:** Compose only / Kubernetes planned; existing proxy / add a proxy to compose; domain not decided / reuse the `ssiid(t)` hosts.
**Decision:**
- **Docker Compose only**, one compose file per environment.
- **No proxy and no TLS for now.** The app runs plain and simple while the forms are converted. Later, an nginx that belongs to another project will sit in front of it and terminate TLS.
- **Domain not decided.**
**Date:** 2026-09-15
**Consequences:**
- The compose file has no proxy service and no certificates. The web app and API are published on one HTTP port.
- `.env` settings needed so the later nginx needs no code change: `PUBLIC_BASE_URL` (open), `TRUST_PROXY` (default `false`; the nginx IP / CIDR list when nginx is in front — `true` is refused since Step 3.1, because it trusts a client-written `X-Forwarded-For`), `COOKIE_SECURE` (default `false` on plain HTTP; must be `true` behind nginx, otherwise D-07c's `Secure` cookie cannot work on HTTP), optional `BASE_PATH` so the app can live under a sub-path.
- **Open item before go-live (Step 10.6):** nginx in front with TLS, `COOKIE_SECURE=true`, HSTS, domain chosen. Running production on plain HTTP is not allowed (logins and PDFs would cross the network in clear text).
- No Kubernetes manifests. The API stays stateless apart from the session store, so a later move stays possible.

## D-10 — Parallel run

**Question:** Will Forms stay available during UAT for side-by-side comparison?
**Options considered:** (a) yes, both apps on the same schema during UAT; (b) hard cutover, parity by recorded tests only.
**Decision:** (a) Forms stays available during UAT.
**Date:** 2026-09-15
**Consequences:**
- The new app must not change shared data in a way Forms cannot read: no schema changes to existing tables; `CFG_UTILIZADORES.PASSWORD` and the regeneration password keep their legacy format (D-07), so a password set in one app works in the other.
- Step 10.6 parity: same action in both apps on the test schema, compare the `SVR_QUEUE` / `SVR_DOCUMENTOS` / `ERR_ERROS_SIID` rows written (ignoring IDs and timestamps).
- The queue processor serves both apps; UAT uses test documents only.
- Forms retirement date is a separate decision taken after UAT sign-off; nothing in the app depends on it.

## D-11 — Gador › Gestores (FD_GESTORES_SIID)

**Question:** The screen grants/revokes DB privileges on 23 objects to a typed Oracle account (SEC-007). Keep it as an audited ADM action or drop it?
**Options considered:** (a) drop, DBA manages grants; (b) keep as ADM action with `ALL_USERS` check + `DBMS_ASSERT` + audit.
**Decision:** (a) drop.
**Date:** 2026-09-15
**Consequences:**
- No Gestores screen, no DDL of any kind from the app (SEC-007 closed by omission). Gador menu keeps only Equipa de Gestão (OD68).
- The app uses the Forms account (D-30), which can run DDL; the rule is enforced in code review instead: no `GRANT` / `CREATE SYNONYM` / `ALTER USER` / `EXECUTE IMMEDIATE` DDL anywhere in the app.
- Hand-over note for the DBA: the 23 grant statements in `analysis/forms-xml/T/FD_GESTORES_SIID_fmb.xml` become a DB role script, if people still need direct DB access.
- MASTER_PLAN Step 4.5 is removed.

## D-12 — Hardcoded super-user `AFREITAS` in Cancelar

**Question:** Replace the `:PARAMETER.P_USERNAME = 'AFREITAS'` check (BR-DOC-16) by a role/permission, or drop it?
**Options considered:** (a) force-cancel for every ADM; (b) drop the exception, normal state filter for everyone.
**Decision:** (a) force-cancel for every ADM.
**Date:** 2026-09-15
**Consequences:**
- The Cancelar dialog (ADM only, D-08) gets a "Cancelar em todos os estados" checkbox, off by default.
- Off: `UPDATE SVR_QUEUE SET ESTADO='CANCELLED' WHERE TIPO_QUEUE_RF='EXECUCAO' AND ESTADO IN ('TERMINADO','ESPERA','ENQUEUED','EM EXECUCAO','ERRO') AND DOCUMENTO_ID=:id`. On: same without the `ESTADO` filter.
- Every cancel writes an audit row with actor, document IDs and whether force was used.
- No user name appears in code. No new table or column.

## D-13 — Tablespace gauge (GD_ESPACO_BD)

**Question:** Keep the hourly tablespace gauge as a widget on Documentos, or drop it?
**Options considered:** (a) drop; (b) keep as an ADM widget with extra DBA grants.
**Decision:** (a) drop.
**Date:** 2026-09-15
**Consequences:**
- Evidence: `GD_ESPACO_BD` reads `USER_TS_QUOTAS` / `USER_SEGMENTS` / `USER_FREE_SPACE`, so it reports the logged-in DB account. With the Forms account (D-30) it would still work; the owner chose to drop it anyway.
- No timer, no gauge, no grants on `DBA_*` views. Disk space monitoring stays with the DBA.

---

# Open questions OQ-1..OQ-16 (BUSINESS_RULES.md §4)

Entries marked **Settled by DB** were answered from `analysis/db/` (dump of `SIID_TESTES`, 2026-09-15) or `analysis/forms-xml/T/`, without asking.

## D-14 — OQ-1: USER_SECURITY.ENCRYPT and CRYPT_PKG.ENCRYPTSTRINGRAW

**Question:** Algorithm and key material of both functions.
**Options considered:** none (fact).
**Decision:** Settled by DB. Both are reversible DES (`DBMS_OBFUSCATION_TOOLKIT`) with hardcoded keys; `USER_SECURITY.ENCRYPT(p_text VARCHAR2) RETURN RAW`. See SEC-005.
**Date:** 2026-09-15
**Consequences:** The app calls these functions for verification only (D-07); it never calls `DECRYPT*`. Bind the result as RAW.

## D-15 — OQ-2: Menu role gating

**Question:** Which menu items does USER get?
**Options considered:** see D-08.
**Decision:** Settled by Forms2XML and confirmed by the owner in D-08.
**Date:** 2026-09-15
**Consequences:** See D-08.

## D-16 — OQ-3: SVR_DOCUMENTOS_VW derived columns

**Question:** How are `ESTADO` and `DISPONIBILIDADE` computed?
**Options considered:** none (fact).
**Decision:** Settled by DB (view SQL in `analysis/db/tables/SVR_DOCUMENTOS_VW.md`). `Q_EXEC` = latest `SVR_QUEUE` row of type `EXECUCAO`; `Q_LAST` = latest queue row with `DATA_PEDIDO` not null.
- `Q_EXEC.ESTADO`: `ESPERA`→`WAIT`, `ENQUEUED`→`EXECUCAO`, `EXECUCAO`→`A EXECUTAR`, `ERRO`→`ERRO`, other → itself.
- When `Q_EXEC.ESTADO='TERMINADO'`: label from `Q_LAST.TIPO_QUEUE_RF` × `Q_LAST.ESTADO` (REENVIAR, 2.VIA, EMAIL, ENVIAR, COPIA, IMPRESSAO, TOXML, ARQUIVO each map ESPERA/ENQUEED/EXECUCAO/TERMINADO to a label, e.g. IMPRESSAO+TERMINADO → `IMPRESSO`); same type as `Q_EXEC` → `WAIT`/`EXECUCAO`/`A EXECUTAR`/`ERRO`/`GERADO`; otherwise `<ESTADO> <TIPO>`.
- `DISPONIBILIDADE = NVL(DISPONIVEL_RF,'ONLINE')`; values seen in packages: `ONL`, `OFF`, `ANU`, `EDC`.
**Date:** 2026-09-15
**Consequences:**
- The API reads `SVR_DOCUMENTOS_VW` as-is; the state logic is not re-implemented in Node.
- Quirks kept as-is (they are what users see today): `'ENQUEED'` typo branch in the `TERMINADO` sub-cases, `WHEN NULL` never matches.
- Filter buttons (Em erro, A executar, Execução, …) filter on these labels; parity tests cover each label.

## D-17 — OQ-4: PKG_DOCUMENTOS_SVR ANULAR / SET_PARAMETRO_* / EXECUTA / GET_ID_EXECUCAO

**Question:** What ANULAR sets; whether EXECUTA inserts the document and queue row; whether parameter state is session-scoped.
**Options considered:** none (fact).
**Decision:** Settled by DB.
- `ANULAR(P_DOCID, P_USER)` → `ALTERA_DISPONIBILIDADE(…,'A')`: `UPDATE SVR_DOCUMENTOS SET DISPONIVEL_RF='ANU'` and `INSERT SVR_QUEUE (TIPO_QUEUE_RF='ANULADO', ESTADO='TERMINADO', CRIADO_POR=P_USER)`. It does not touch `ATRIBUTO9`. No commit inside. Any error is swallowed (`record_error` to `ERR_ERROS_SIID`) and not raised.
- `SET_PARAMETRO_STRING/NUMERO/DATA` append to a **package-global** list (`SLISTAPARAMETER`, `PARAMCOUNT`). `EXECUTA(p_nomedoc)` → `FPEDIDO_EXECUCAO` → `EXECUTA_DOCUMENTO`, which inserts `SVR_DOCUMENTOS` and an `SVR_QUEUE` row of type `EXECUCAO`, and **commits inside the package**; then the list is cleared. `GET_ID_EXECUCAO` returns the package-global `V_ID_EXEC`.
**Date:** 2026-09-15
**Consequences:**
- Node runs `SET_PARAMETRO_*` … `EXECUTA` … `GET_ID_EXECUCAO` in **one anonymous PL/SQL block on one connection**, never across pool checkouts. On error the block calls `DBMS_SESSION.MODIFY_PACKAGE_STATE(DBMS_SESSION.REINITIALIZE)` so a pooled connection never carries a half-built parameter list.
- The API cannot roll back an EXECUTA (package commits). Multi-document actions report per-document results.
- After ANULAR the API commits, then re-reads `DISPONIVEL_RF`; if it is not `ANU`, it reports failure (the package hides errors).

## D-18 — OQ-5: PKG_SIID_UTIL.CAN_BE_UPLOADED_EDOC

**Question:** Criteria for EDoc resend eligibility.
**Options considered:** none (fact).
**Decision:** Settled by DB. Returns 1 when the document's report parameter named `P_CDUNIECO` (position from `SVR_PARAMETROS_REPORT.N_PARAMETRO` → `PARAMETRO01..20`) is not null and matches a `DOC_ATRIBUTOS_EDOC` row with the same `MODELO_ID`, same `CDUNIECO`, and `DATA_PEDIDO` between `DATA_INICIO` and `DATA_FIM`. Any error → 0.
**Date:** 2026-09-15
**Consequences:** The API calls the function per document (bind `PI_ID`); the rule is not copied into Node.

## D-19 — OQ-6: FATURAELECTRONICA button

**Question:** What does the button do?
**Options considered:** none (fact).
**Decision:** Settled by Forms2XML: it is a sort button (`Ordenar_Por('FATURA_ELECTRONICA','ASC')`). `RECRIAR` (TOXML) is dead code.
**Date:** 2026-09-15
**Consequences:** One more allow-listed sort column; no RECRIAR action is ported.

## D-20 — OQ-7: Clone (GLOBAL.LOTE_CLONE_ID, P_USUARIO)

**Question:** Where the clone's LOTE_ID and P_USUARIO come from.
**Options considered:** none (fact).
**Decision:** Settled by Forms2XML. The clone inherits the source document's `LOTE_ID`; `P_USUARIO` = `v_utilizador := :PARAMETER.P_USERNAME` (the application user).
**Date:** 2026-09-15
**Consequences:** API passes the session username as `P_USUARIO`; the string-built `UPDATE SVR_DOCUMENTOS SET LOTE_ID=…` becomes a bound statement (SEC-009).

## D-21 — OQ-8: CFG_UTILIZADORES_VW and DOC_PERMISSOES_IMPRESSAO

**Question:** Column mapping and filtering of the two views.
**Options considered:** none (fact).
**Decision:** Settled by DB, Forms2XML and the owner.
- `CFG_UTILIZADORES_VW` does **not** read `CFG_UTILIZADORES` (that branch is commented out). It is: active employees `CO_EMPLEADOS` ⋈ `M_USUARIOS` (`USERNAME=CDEMPLEA`, `AMBIENTE_ID` = `'COSECSEMA'` if the username ends in `T`, else `'COSEC'`, `UNIDADE_NEGOCIO_RF=CDDEPARTA`, `TIPO_UTILIZADOR_RF='APPL'`, `NIVEL_ACESSO_RF=CDNIVEL`, `DATA_FIM` null, `SWACTIVO='S'`) UNION active web users `M_USUARIOS` with `CDPERFIL LIKE 'W%'` (`AMBIENTE_ID='COSECFOR'`, type `'NET'`). Only active people are listed.
- `DOC_PERMISSOES_IMPRESSAO` is **not a database object** (owner, 2026-09-15). It is the name of a Forms block in `FD_PERMISSOES_SIID`, held in memory. The block has `QueryDataSourceName="cfg_permissoes_siid_VW"`, no insert/update, and `KEY-EXEQRY` filters `SYSDATE BETWEEN DATA_INICIO AND NVL(DATA_FIM, SYSDATE+1)`. `CFG_PERMISSOES_SIID_VW` = `CFG_PERMISSOES_SIID` ⋈ `CFG_UTILIZADORES_VW` (adds `AMBIENTE_ID`, `NOME`) ⋈ `CFG_VALORES_DOMINIO` twice (`UNIDADE_NEGOCIO`, `TIPO_PERMISSAO` designations). The `create synonym` / `grant` lines for that name in `FD_GESTAO*` and `FD_GESTORES_SIID` point at nothing (dead, and not ported: D-02, D-11).
- Related fact: in `PKG_DOCUMENTOS_SVR`, a user named `ADMINISTRADOR` (and, in `HASPERMISSAO`, any user starting with `COSEC`) bypasses `CFG_PERMISSOES_SIID` checks.
**Date:** 2026-09-15
**Consequences:**
- The view is a people picker (LOV) only; app login uses `CFG_UTILIZADORES` (D-07).
- Step 5.3/5.4: the permissions list is a read query on `CFG_PERMISSOES_SIID_VW` with the date filter above (and without it for the "all" button); writes go to `CFG_PERMISSOES_SIID`. No table is created for `DOC_PERMISSOES_IMPRESSAO`.
- Because the view joins `CFG_UTILIZADORES_VW`, a permission of a user who is not active in `CO_EMPLEADOS`/`M_USUARIOS` does not appear in the list (same as Forms).
- The `ADMINISTRADOR`/`COSEC%` bypass lives in the DB; the app does not add or remove it. Listed in Step 5.3 rules.

## D-22 — OQ-9: Printer resolution

**Question:** Precedence between the printer tables when a document is printed.
**Options considered:** (a) the order coded in `PKG_DOCUMENTOS_SVR` is the business rule; (b) the order is wrong and must change.
**Decision:** (a). Order when a document executes: 1) `DOC_IMPRESSOES_MODELO_USR` (user + model), 2) `DOC_IMPRESSOES_USER` (user), 3) `DOC_IMPRESSOES_DEP` (user's department via `CO_EMPLEADOS.CDDEPARTA`, this environment), 4) `DOC_IMPRESSORAS_DOC` (model, this environment), 5) `SVR_AMBIENTES_IMPRESSAO.IMPRESSORA_ID` (environment default). Each level only counts rows valid today (`DATA_INICIO <= SYSDATE < NVL(DATA_FIM, SYSDATE+1)`). A printer chosen in Reimprimir is passed explicitly as `P_IMPRESSORA_ID`.
**Date:** 2026-09-15
**Consequences:**
- The app never resolves printers. It maintains the association tables (Impressoras Associadas, Perfis departamento, Impressoras) and passes the Reimprimir choice.
- Step 5.2 screens show the order as help text, so users know which association wins.
- Parity tests for Step 5.2 insert associations at two levels and check the queue row gets the higher-priority printer.

## D-23 — OQ-10: Attributes with no visible enforcement

**Question:** Are `NIVEL_ACESSO_RF`, `MAX_IMPRESSOES`, `N_ANEXOS`, `FORMA_CONTROLO_RF`, `MODO_CERTIFICADO_RF`, `MODO_PROTECAO_RF`, `STAMP`, `DOC_CONDICOES_APR.ATRIBUTO1..8` enforced? Meaning of `MODO_EXPEDICAO_RF` G, W, I?
**Options considered:** none (fact + recommended default).
**Decision:** Settled by DB, with a default for the app:
- Used by `PKG_DOCUMENTOS_SVR` (enforced in the DB): `FORMA_CONTROLO_RF` (C controlado, U único, UV único versionado, V versionado), `MODO_EXPEDICAO_RF` (A edoclink-alteração, E email, **G edoclink-garantia**, **I impresso**, M impresso e email, **W edoc API**), `MODO_CERTIFICADO_RF` (0 isento, 1 assinado, 2 selado).
- Only in install/seed scripts (`PKG_INSTALL_DOC`, `INS_PARAMETROS_DOC`), not in the execution package: `MAX_IMPRESSOES`, `N_ANEXOS`.
- Not referenced by any dumped package: `NIVEL_ACESSO_RF`, `MODO_PROTECAO_RF` (0 sem proteção, 1 marca de água); `STAMP` only in unrelated Discoverer `EUL4_*` code. `DOC_CONDICOES_APR` is read by `PKG_EBOND_API` / `PKG_INSTALL_DOC` (columns not traced).
- **Default:** the app stores and edits these as plain fields with domain dropdowns (`CFG_VALORES_DOMINIO`) and enforces none of them. Enforcement, if any, stays in the DB or the queue processor.
**Date:** 2026-09-15
**Consequences:** No business logic for these fields in Node; Step 6.1 uses domain LOVs for them.

## D-24 — OQ-11: CFG_TIPOS_MIDIA.TAMANHO_BYTES

**Question:** Entered directly or computed?
**Options considered:** none (fact).
**Decision:** Settled by Forms2XML + DB: computed by the form (`POST-CHANGE`: `TAMANHO_BYTES := TRUNC(NVL(TAMANHO_MIDIA,1) * FACTOR)`, factor from `CFG_UNIDADES_MEDIDA`). All 7 dumped rows match (e.g. 4.7 GB × 1 000 000 000 = 4 700 000 000).
**Date:** 2026-09-15
**Consequences:** The API computes it on insert/update; the field is read-only in the UI. Step 4.2 test covers it.

## D-25 — OQ-12: Backup and archive execution

**Question:** What the server does with BACKUP, ARQUIVO, TOXML, REENVIAR, EMAIL rows; who sets `DISPONIBILIDADE='OFF'` and `DATA_IMPRESSAO`.
**Options considered:** none (fact).
**Decision:** Settled by DB as far as the DB goes; the rest is the queue processor (D-04).
- New backup: the package sets `SVR_DOCUMENTOS.BACKUP_ID`, inserts `SVR_QUEUE('BACKUP','ESPERA')` per document, then sets `SVR_BACKUPS.DATA_CRIACAO` (from then on the backup cannot be changed) and commits.
- `SET_BACKUP_ONLINE(id, 'S'|'N')` sets `SVR_BACKUPS.MEDIA_ONLINE`.
- `ALTERA_DISPONIBILIDADE` can set `ONL`/`OFF`/`ANU`, but no dumped code calls it with `OFF`; nothing in the DB sets `DATA_IMPRESSAO`. Copying files, archiving, XML, EDoc resend and e-mail are done by the processor.
**Date:** 2026-09-15
**Consequences:** Phase 8 calls the package procedures and shows state; it does no file work. "Backup cannot be edited once `DATA_CRIACAO` is set" is an API rule.

## D-26 — OQ-13: Alert texts

**Question:** Texts of alerts not captured by the string dumps.
**Options considered:** none (fact + default).
**Decision:** Settled by Forms2XML (texts in `analysis/forms-xml/T/*_fmb.xml`). **Default** for the empty `NAO_TEM_REGISTOS` alert: `Não existem documentos seleccionados.`
**Date:** 2026-09-15
**Consequences:** Step 1.2 message catalogue uses the verbatim Portuguese texts plus this one default.

## D-27 — OQ-14: Environment identity

**Question:** Is `AMBIENTE_ID` equal to the owner of `MRECIBO` and to `SVR_AMBIENTES_IMPRESSAO.ID`? What are the production names?
**Options considered:** (a) verify production with a read-only discovery run before go-live; (b) plain `.env` value, set by the installer in production.
**Decision:**
- **Test — settled by DB:** `AMBIENTE_ID = 'GADOR_TESTES'` = `GET_AMBIENTE_ID()` = `SVR_AMBIENTES_IMPRESSAO.ID` = owner of `MRECIBO` (`SIID_TESTES.MRECIBO` → `GADOR_TESTES.MRECIBO`). App objects (`CFG_*`, `DOC_*`, `SVR_*`, packages) are in `SIID_TESTES`.
- **Production — (b):** `AMBIENTE_ID` (and `DB_SCHEMA`) are plain `.env` values. The owner sets the production values at install time. No production discovery run. (First answer was (a); the owner changed it on 2026-09-15.)
**Date:** 2026-09-15
**Consequences:**
- `.env.example` ships the test values `DB_SCHEMA=SIID_TESTES`, `AMBIENTE_ID=GADOR_TESTES`, with a comment: "change for production".
- At boot the API checks `GET_AMBIENTE_ID() = AMBIENTE_ID` and refuses to start if they differ (stops a test container pointing at production or the reverse).
- The domain `TIPO_AMBIENTE` in `CFG_VALORES_DOMINIO` lists `COSEC`, `COSECFOR`, `COSECSEMA` (older names, not `GADOR_TESTES`); the app does not use this domain for the environment.

## D-28 — OQ-15: Behaviours that look like defects

**Question:** Which of these are defects to fix in the new app: Reimprimir prints annulled documents (BR-DOC-10); "Suspender todos" suspends every waiting request of every type (BR-DOC-21); `TIPOCNTD_ID` / `CONTEXTO_ID` = MAX (BR-MOD-04/07); Reenviar audit text "REGERADO" (BR-DOC-17); `ROWNUM` before `ORDER BY` for the current default (BR-MOD-08); `AFREITAS` (BR-DOC-16, see D-12)?
**Options considered:** per item, fix or keep the Forms behaviour. For the IDs: MAX+1, dropdown defaulting to MAX, or silent MAX.
**Decision:**
- **BR-DOC-10 — fix:** Reimprimir skips annulled documents (`DISPONIVEL_RF='ANU'`), like 2ª via and Cópia, and lists them with the existing message `Não foram impressos os documentos com os seguintes spool_id, por se encontrarem anulados:`.
- **BR-DOC-21 — fix (confirmation only):** scope stays "every `SVR_QUEUE` row with `ESTADO='ESPERA'`", but the app first shows a confirm dialog with the row count, and commits explicitly.
- **BR-DOC-17 — fix:** the Reenviar (EDoc) audit row in `ERR_ERROS_SIID` says `REENVIADO` instead of `REGERADO`.
- **BR-MOD-08 — fix:** load the newest valid default: `… ORDER BY DATA_INICIO DESC FETCH FIRST 1 ROW ONLY`.
- **BR-MOD-04/07 — dropdown, default MAX.** The owner first picked MAX+1; the DB dump then showed both columns are foreign keys to lookup tables (`SECCAODOC_TIPOCNTD_FK` → `DOC_TIPOS_CONTEUDO`, `FK_CONTEXTO_DCA` → `DOC_CONTEXTOS_APR`, which has 1 row), so MAX+1 would fail every insert (ORA-02291). Re-asked; final: show a dropdown from the lookup table, pre-selected with the value Forms computes (`MAX` over the same `MODELO_ID` + `TIPOSEC_ID`); if that is 0/none, no pre-selection and the field is required.
- **BR-DOC-16 — see D-12.**
**Date:** 2026-09-15
**Consequences:**
- Step 1.3 parity tests list these five as **intended differences** from Forms; all other behaviour must match.
- During the parallel run (D-10) Forms still prints annulled documents on Reimprimir; UAT testers are told.
- The `DOC_CONTEXTOS_APR` and `DOC_TIPOS_CONTEUDO` lookups are read-only in the app (no screen maintains them today).

## D-29 — OQ-16: Legacy PDF storage

**Question:** Must the app still read old/backup PDFs from the `<gerados>` / backup share layout (BR-DOC-37)?
**Options considered:** (a) FileServerSIID only; (b) mount the shares and fall back to `PKG_DOCUMENTOS_SVR.GETDOCDIRECTORY` paths.
**Decision:** (a) FileServerSIID only, same as Forms today (the share fallback in Forms is commented out).
**Date:** 2026-09-15
**Consequences:**
- No SMB/share mounts in the container (fits D-04).
- When FileServerSIID has no file, the viewer shows `Documento não disponível` plus the reason from `DISPONIBILIDADE`: `OFF` → offline backup, `ANU` → anulado.
- `GETDOCDIRECTORY` layout (ONL: `<PDF var>YYYY\MM\DD\<NOME_OUTPUT>.pdf`; OFF + `MEDIA_ONLINE='S'`: `<DRIVE_ONLINE>\<backup>\pdf\YYYY\MM\DD\…`) stays documented only, for whoever runs FileServerSIID.

---

# Extra decisions

## D-30 — Oracle account used by the app

**Question:** Same Oracle account as Forms, or a new least-privilege account?
**Options considered:** (a) the Forms account (`SIID_TESTES` in test, its P counterpart in production); (b) a new account with only the grants the app needs.
**Decision:** (a) the Forms account.
**Date:** 2026-09-15
**Consequences:**
- No DBA work; all grants, synonyms and `EXECUTE` rights already exist.
- `.env`: `DB_USER`, `DB_PASSWORD`, `DB_CONNECT_STRING` per install; never in code or compose files.
- **Accepted risk:** the web app runs with schema-owner rights. Mitigation: bind variables only, allow-listed `ORDER BY`, no DDL (D-11). SECURITY_FINDINGS §3 item 9 does not apply. Step 10.1 risk list.
- `DB_SCHEMA` equals `DB_USER` in practice; keep both keys anyway so D-02 stays unchanged.

## D-31 — node-oracledb mode

**Question:** The Forms account has a password verifier Thin mode rejects (NJS-116). Instant Client in the image, or DBA resets the password?
**Options considered:** (a) Thick mode with Oracle Instant Client in the Docker image; (b) DBA resets the password with a 12c verifier, Thin mode.
**Decision:** (a) Thick mode, Instant Client in the image.
**Date:** 2026-09-15
**Consequences:**
- Step 2.3 Dockerfile installs Oracle Instant Client (Basic Light is enough for `WE8ISO8859P15`) and the API calls `oracledb.initOracleClient()` at boot; image grows about 100 MB; use a glibc base (`node:*-slim`, not alpine).
- No password change for Forms or the compile scripts.
- `NLS_LANG` / client charset: node-oracledb returns JS strings in UTF-16 regardless; set nothing unless Step 2.1 tests show wrong accented characters.
- SECURITY_FINDINGS §3 item 17 (Thin mode) does not apply; keep the Instant Client version patched.

---

# Amendments from Step 1.1 (2026-09-15)

Factual corrections found while writing `analysis/ARCHITECTURE.md` (critic review, checked against `analysis/forms-xml/T/` and `analysis/db/`). They correct facts inside existing decisions; no owner choice is changed.

- **A-01 (D-17):** "ANULAR … No commit inside" is wrong in practice. `PKG_DOCUMENTOS_SVR.record_error` inserts into `ERR_ERROS_SIID` and COMMITs (not an autonomous transaction), and `ANULAR` (via `ALTERA_DISPONIBILIDADE`), `EXECUTA_DOCUMENTO`, `GERA_BACKUP`, `INSERE_DOCS_BACKUP`, `SET_BACKUP_ONLINE` call it. Every package call commits the connection's pending work, so package calls never share a transaction with app DML. After an error in the clone block the connection is dropped (`close({ drop: true })`) instead of `DBMS_SESSION.MODIFY_PACKAGE_STATE`.
- **A-02 (D-25):** `FD_NOVO_BACKUP` never calls `GERA_BACKUP` / `INSERE_DOCS_BACKUP`; it inserts `SVR_BACKUPS`, updates `SVR_DOCUMENTOS.BACKUP_ID` and inserts `SVR_QUEUE ('BACKUP')` in one form transaction. The package procedures name backups differently, write the DB user, commit per call and swallow errors. `FD_BACKUPS_ONLINE` sets `DRIVE_ONLINE`, which `SET_BACKUP_ONLINE` does not. Parity reference for Phase 8 = the forms' SQL; the three package procedures are not called.
- **A-03 (D-31):** Instant Client **Basic**, not Basic Light: Basic Light supports only a short list of database character sets, and this database is `WE8ISO8859P15`. Step 2.3 proves the choice.
- **A-04 (D-07):** only Regerar asks for the regeneration password (BR-DOC-14); Reimprimir / 2ª via / Cópia never did. Stored values are hex strings, so compares and writes use `RAWTOHEX(CRYPT_PKG.ENCRYPTSTRINGRAW(:p))` and `RAWTOHEX(USER_SECURITY.ENCRYPT(:p))`. The login username is uppercased (`LOGIN.UTILIZADOR` has `CaseRestriction="Upper"`).
- **A-05 (D-19):** the view column is `FATURACAO_ELECTRONICA`; the Forms button's `FATURA_ELECTRONICA` does not exist.
- **A-06 (D-28, BR-DOC-10):** Forms skips annulled documents by `ATRIBUTO9 = 'A'` only, and `ANULAR` never sets `ATRIBUTO9`. The app's skip test for Regerar, Reimprimir, 2ª via and Cópia is `ATRIBUTO9 = 'A' OR DISPONIVEL_RF = 'ANU'` (intended difference).
- **A-07 (D-03):** the PDF route is `GET /api/documentos/:id/pdf` (Portuguese resource names).
- **A-08 (D-08):** Forms facts behind D-08 were incomplete. `FD_GESTAO_SIID_USER` has the `GENERICO` and `ESTADO_PEDIDO` popups attached (so clone and single queue cancel are reachable: USER gets them, per D-08's condition), and also has non-Spool sort buttons, Suspender / Retomar buttons and comment insert. Asked again with these facts (`ARCHITECTURE.md` §13 O-1), the owner confirmed D-08 as written on 2026-09-15: USER gets Spool-only sorting, no Suspender / Retomar, no comment insert (intended differences from the USER form).
- **A-09 (D-08):** D-08 gave USER Impressoras Associadas because STRUCTURE §2 placed it under Gestão. `forms-xml/T/MD_SIID_mmb.xml` nests **Impressoras Associadas** (Documento, Utilizador) and **Alterar password** in `CONFIGURAÇÃO_MENU`, and `MD_SIID_USER` has `CONFIGURAÇÃO` `Enabled="false"`, so a Forms USER never reached them (found in Step 1.2, UI_SPEC OP-1). Asked with these facts, the owner chose Forms parity on 2026-09-15: both sit under Configuração (`/configuracao/impressoras-associadas/*`, `/configuracao/alterar-password`), ADM only. USER menu = Gestão › Documentos. The `impressoras-associadas` API routes are ADM only.

---

# MASTER_PLAN steps affected by each decision

| Decision | Affected steps (analysis/MASTER_PLAN.md) | What changes |
|---|---|---|
| D-01 source = dev/T | 0.4, 1.3, every screen step 4.x–8.x | Use `analysis/forms-xml/T/` only; ignore `_v2`, `_old`, `bck/`. |
| D-02 one container per env | 1.1, 2.1, 2.3, 3.1, 3.2, 10.6 | `DB_SCHEMA` + `AMBIENTE_ID` in `.env`; env label on login; no synonym DDL. |
| D-03 PDF proxy, HTTP, no credential | 1.1, 2.1, 7.1, 10.1 | `FILESERVER_BASE_URL`; `GET /api/documents/:id/pdf` streams; accepted-risk entry. |
| D-04 no OS code, processor unchanged | 1.1, 7.2, 7.4, 8.1, 10.1 | Actions = queue rows / package calls only; no `child_process`, no shares. |
| D-05 no SMTP | 2.1, 7.2 | No `SMTP_*` env; server-side address validation on EMAIL queue insert. |
| D-06 drop Médias Execução | 3.2, 9.1 (removed), 10.6 | No Auditoria menu; Phase 9 deleted. |
| D-07 auth / session / regen password | 1.1, 2.1, 3.1, 3.2, 4.3, 4.4, 7.2, 10.1 | Login = `CFG_UTILIZADORES` + `USER_SECURITY.ENCRYPT`, no new table; date check; 8 h / 30 min; regen password ADM only with current value; Utilizadores writes `USER_SECURITY.ENCRYPT`; Variáveis must not expose `PASSWORD`/`PASSWORD_OLD` rows; SEC-005 accepted risk. |
| D-08 USER limits (+D-15) | 3.1, 3.2, 7.1, 7.3, 7.5, 10.1 | `requireRole('ADM')` on admin routes; USER detail payload reduced; verify clone / single-cancel reachability in 7.5. A-09: Impressoras Associadas and Alterar password under Configuração, ADM only (also 1.2, 5.2). |
| D-09 Compose, no proxy yet | 2.3, 10.1, 10.6 | No proxy service; `TRUST_PROXY`, `COOKIE_SECURE`, `PUBLIC_BASE_URL`, `BASE_PATH`; nginx + TLS + domain required before go-live. |
| D-10 parallel run | 1.3, 10.6 | Row-level parity on shared test schema; no changes to existing tables. |
| D-11 drop Gestores | 3.2, 4.5 (removed), 10.5 | No DDL; DBA hand-over note with the 23 grants. |
| D-12 force-cancel for ADM | 7.2, 7.3 | Checkbox + audit; no user name in code. |
| D-13 drop tablespace gauge | 7.1, 7.3 | No timer / widget. |
| D-14 crypto functions | 3.1 | Bind RAW result; never call `DECRYPT*`. |
| D-16 `SVR_DOCUMENTOS_VW` states | 1.3, 7.1 | Read the view as-is; parity test per state label. |
| D-17 package state + commits | 2.1, 7.2, 7.4, 10.4 | One PL/SQL block per EXECUTA sequence; reset package state on error; per-document results; re-read after ANULAR. |
| D-18 EDoc eligibility | 7.2 | Call `CAN_BE_UPLOADED_EDOC` per document. |
| D-19 FATURAELECTRONICA sort | 7.1 | Add to sort allow-list. |
| D-20 clone user / lote | 7.2 | Session user as `P_USUARIO`; bound `UPDATE`. |
| D-21 user view / permissions block | 4.3, 5.3, 5.4 | `CFG_UTILIZADORES_VW` = people picker; `DOC_PERMISSOES_IMPRESSAO` = Forms block over `CFG_PERMISSOES_SIID_VW`, no DB object; document `ADMINISTRADOR`/`COSEC%` bypass. |
| D-22 printer order | 5.2, 5.5, 7.2 | App maintains associations only; help text; precedence parity test. |
| D-23 unenforced attributes | 6.1, 6.3 | Plain fields with domain dropdowns; no enforcement in Node. |
| D-24 `TAMANHO_BYTES` | 4.2 | Computed server-side, read-only field. |
| D-25 backup execution | 8.1, 8.2 | Package calls; backup locked after `DATA_CRIACAO`. |
| D-26 alert texts | 1.2 | Verbatim catalogue + `NAO_TEM_REGISTOS` default text. |
| D-27 environment identity | 2.1, 2.3, 10.6 | `AMBIENTE_ID` / `DB_SCHEMA` in `.env`, set per install; boot check `GET_AMBIENTE_ID() = AMBIENTE_ID`. |
| D-28 defect fixes | 1.3, 6.1, 6.3, 7.2, 7.3 | Five intended differences; lookup dropdowns for `TIPOCNTD_ID` / `CONTEXTO_ID`. |
| D-29 FileServerSIID only | 7.1 | "Documento não disponível" + reason; no share fallback. |
| D-30 Forms Oracle account | 2.1, 10.1 | `DB_USER`/`DB_PASSWORD` in `.env`; no DBA work; owner-rights accepted risk. |
| D-31 Thick mode | 2.1, 2.3 | Instant Client in image, `initOracleClient()` at boot, glibc base image. |
