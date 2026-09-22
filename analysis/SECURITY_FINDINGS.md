# GestSIID — Security Findings (Oracle Forms 12c, pre-rewrite audit)

Produced 2026-09-14 by the `code-modernization:security-auditor` agent from the string dumps of the Forms binaries. All credential values are masked (≤4 chars + `****`); line numbers refer to the extracted text files under `analysis/`, not to the binary `.fmb`.

**Scope:** `CLAUDE.md`, `dev/**/*.bat`, `dev/sqlnet.log`, `analysis/forms-summary/T/*.plsql.txt|.md`, `analysis/forms-extracted/{T,P}/*.txt`, `webutil_106/` (version only), `testes/lib/ojdbc7.jar`, `GetImageFileName.jar`, `testes/ShowDOC.jar`, `testes/Combined-dist.jar` (manifest/strings only). Compiled `.fmx` in `prod/`, `testes/`, `dev/P` were grepped only to confirm embedded connect data (counts, no values).
**Method:** manual read of auth/password forms; pattern sweep for `FORMS_DDL`, `HOST`, `CLIENT_HOST`, `TEXT_IO`, `WEB.SHOW_DOCUMENT`, WebUtil transfer, `USER_TAB_PRIVS`/`USER_SYNONYMS`, dynamic `WHERE`/`ORDER BY`; menu-set comparison; jar manifest/constant-pool inspection.

## 1. Findings table

| ID | Sev | CWE | Title | Location | Masked evidence | Impact |
|---|---|---|---|---|---|---|
| SEC-001 | Critical | CWE-798 Hard-coded Credentials | DB service-account passwords compiled into the login form (all environments, incl. production) | `analysis/forms-extracted/T/FD_LOGIN_SIID.fmb.txt:500-523`; `analysis/forms-extracted/P/FD_LOGIN_SIID.fmb.txt:476-500`; compiled copies `prod/FD_LOGIN_SIID.fmx`, `testes/FD_LOGIN_SIID.fmx`, `dev/P/FD_LOGIN_SIID.fmx` | `v_username := 'SIID****'; v_password := 'CO****'` (DEV, TESTES); P variant: `v_username := 'DISC****'; v_password := 'SA****'; v_connect_string := 'COSEC01'`; `LOGON(v_username, v_password||'@'||v_connect_string, FALSE)`; commented `LOGON('DISC****FOR', …***:1530…)` (password = username) | Anyone holding an `.fmb`/`.fmx`, Forms-server filesystem access, or a runtime memory dump has schema-owner access to the production DB. Same 5-char password reused for the DEV and TESTES accounts. |
| SEC-002 | Critical | CWE-798 / CWE-260 Password in Config File | Plaintext DB credentials in 6 compile batch files | `dev/T/compile_testes.bat:4,8,12`; `dev/P/compile_producao.bat:4,8,12`; `dev/Copy of compile_testes.bat:3`; `dev/Copy of compile_testes (2).bat:3`; `dev/T/Copy of compile_testes.bat:3`; `dev/P/Copy of compile_prod.bat:3` | `userid=sii****/co****@cosec`, `userid=sii****/co****@gador`, `userid=DIS****/SA****@cosec01` | Production schema-owner password readable by anyone with repo/share access; matches the P login-form password, confirming it is live. |
| SEC-003 | High | CWE-798 / CWE-522 Insufficiently Protected Credentials | Client-side Java bean embeds JDBC URLs for test **and** production DB plus an HTTP authenticator | `testes/Combined-dist.jar` and `testes/ShowDOC.jar` → `ons/siid/ShowDoc.class`, `ons/siid/CustomAuthenticator.class` | constants `jdbc:oracle:thin:@***:1530:COSEC`, `jdbc:oracle:thin:@***:1521:COSEC01`; `CustomAuthenticator` with username/password/domain fields; SOAP namespace `http://www.link.pt/e-doclink/webservices/cosec`; jar bundles full `oracle/jdbc`, `oracle/net`, `oracle/security` | The bean runs in the end-user's browser JVM: DB credentials are either compiled in or pushed from the form to the workstation, and the production DB must be reachable from every desktop. |
| SEC-004 | High | CWE-285 Improper Authorization / CWE-602 Client-Side Enforcement | Admin vs user separation is UI-only; `_USER` menu can open every admin form | `analysis/forms-summary/T/FD_LOGIN_SIID.fmb.plsql.txt:46-50`; `MD_SIID_USER.mmb.plsql.txt:32,246,282,462`; `FD_GESTAO_SIID.fmb.plsql.txt:9` (typical guard) | `if t_user = 'ADM' then New_form('FD_GESTAO') else New_form('FD_GESTAO_USER')`; `MD_SIID_USER` contains `OPEN_FORM('FD_UTILIZADORES_SIID'…)`, `'FD_GESTORES_SIID'`, `'FD_PERMISSOES_SIID'`, `'FD_VARIAVEIS_SIID'`, `'FD_ALTERAR_PASSWORD'` (identical set to `MD_SIID` except `FD_GESTAO_SIID`→`_USER`); child forms only check `:PARAMETER.P_USERNAME IS NULL` | A non-admin creates ADM accounts, edits permissions, grants DB privileges. Every app user shares one DB identity, so nothing server-side distinguishes them. |
| SEC-005 | High | CWE-916 / CWE-327 / CWE-257 Recoverable Password Storage | Passwords stored as deterministic, reversible "ENCRYPT" output; compared by ciphertext equality | `FD_LOGIN_SIID.fmb.plsql.txt:27-35,41`; `analysis/forms-extracted/T/FD_UTILIZADORES_SIID.fmb.txt:798` | `IF USER_SECURITY.ENCRYPT(:LOGIN.PASSWORD) != PASS`; `:CFG_UTILIZADORES.PASSWORD := user_security.ENCRYPT(:PASSWORD)`; `:GLOBAL.PASS := user_security.ENCRYPT(...)` (never read) | Unsalted → equal passwords are visible as equal rows; if the package is symmetric (name says ENCRYPT, not HASH) every password is recoverable by anyone with package access. |
| SEC-006 | Medium | CWE-307 / CWE-613 Missing Brute-force Protection & Session Expiry | No lockout, no throttling, no password policy; account validity dates ignored at login | `FD_LOGIN_SIID.fmb.plsql.txt:19-33` | `WHERE USERNAME = :LOGIN.UTILIZADOR AND AMBIENTE_ID = :LOGIN.AMBIENTE` — no `DATA_INICIO`/`DATA_FIM` filter although `FD_UTILIZADORES_SIID` maintains them | Expired/disabled users still authenticate; unlimited online guessing against a 5-char-password culture. |
| SEC-007 | High | CWE-89 (DDL injection via `FORMS_DDL`) | Form item concatenated into `GRANT`/`REVOKE` executed as schema owner | `FD_GESTORES_SIID.fmb.plsql.txt:32-64` | `FORMS_DDL('grant select, insert, update, delete on svr_gestao_siid_tmp to '\|\|:utilizador)` (+22 more objects; matching `revoke`) | Enter `PUBLIC` or `X WITH GRANT OPTION` → schema objects granted to every DB account; reachable by any user per SEC-004. |
| SEC-008 | High | CWE-287 / CWE-620 Unverified Password Change | Shared "regeneration password" changeable by anyone without the old value | `FD_ALTERAR_PASSWORD.fmb.plsql.txt:13-17,60-66,78-95`; gate used at `FD_GESTAO_SIID.fmb.plsql.txt:2280`, `FD_GESTAO_SIID_USER.fmb.plsql.txt:3851`; menu `MD_SIID_USER.mmb.plsql.txt:282` | `If :PASSWORD = :CONFIRMACAO Then … FORMS_DDL('UPDATE SVR_VARIAVEIS_SIID SET VALOR='''\|\|passwordEncript\|\|''' WHERE TIPO_VARIAVEL_RF=''PASSWORD'' AND AMBIENTE_ID='''\|\|:GLOBAL.AMBIENTE_ID\|\|'''')`; dead code `FORMS_DDL('ALTER USER '\|\|USER\|\|' IDENTIFIED BY '\|\|:PASSWORD)` | Any user resets the secret that authorises regenerating/reprinting documents (insurance receipts, `MRECIBO`) or locks legitimate operators out; reactivating the dead code changes the shared DB account password for everyone. |
| SEC-009 | Medium | CWE-89 SQL Injection (string-built SQL) | `FORMS_DDL`/`Set_Block_Property` with concatenated values | `FD_ALTERAR_PASSWORD.fmb.plsql.txt:13`; `FD_GESTAO_SIID.fmb.plsql.txt:2073,2821`; `FD_GESTAO.fmb.plsql.txt:34`; `FD_GESTAO_USER.fmb.plsql.txt:34`; `FD_VARIAVEIS_SIID.fmb.plsql.txt:170` | `forms_ddl('UPDATE SVR_DOCUMENTOS SET LOTE_ID ='\|\|:GLOBAL.LOTE_CLONE_ID\|\|' WHERE ID = '\|\|V_ID)`; `ORDER_BY, P_COLUNA\|\|' '\|\|P_TIPO`; `create synonym … for '\|\|P_AMBIENTE\|\|'.…'`; `DEFAULT_WHERE, '… AMBIENTE_ID='''\|\|:GLOBAL.AMBIENTE_ID\|\|''''`; `Forms_DDL('COMMIT')` ×73 | Inputs are globals/derived today (low exploitability) but the pattern is pervasive and must not be ported. |
| SEC-010 | Medium | CWE-319 Cleartext Transmission / CWE-639 IDOR | Document viewer opens plain-HTTP URL keyed only by sequential `spoolid` | `FD_GESTAO_SIID.fmb.plsql.txt:2588-2606` (same in `_USER`, `_v2`) | `WEB.SHOW_DOCUMENT('http://ssiid-prod.cosec.pt:8090/FileServerSIID/restapi/FileServer/pdf/P?spoolid='\|\|:SVR_DOCUMENTOS.ID)`; test `ssiidt.cosec.pt:8090`; legacy `servimp.cosec.pt:8890` | Anyone on the network enumerates PDFs by ID and can sniff them; no token/auth is added by the form (verify `FileServerSIID` enforces auth independently). |
| SEC-011 | Medium | CWE-78 OS Command Injection / CWE-22 (dormant) | Commented-out but shipped `HOST`/`CLIENT_HOST`/`Text_IO`/registry/DLL code that builds shell commands and file paths from DB data | `FD_GESTAO_SIID.fmb.plsql.txt:2564,2610-2734,3115,4055` (`_USER`: 4422-4546) | `host(exec_path\|\|' '\|\|d_gerados\|\|…\|\|:SVR_DOCUMENTOS.nome_output\|\|'.pdf')`; `--HOST('CMD /C java -jar ShowDoc.jar …')`; `--CLIENT_HOST('CMD /C E:\SIID\teste5.pdf')`; `Text_IO.Fopen(fpath,'r')`; `ORA_FFI.LOAD_LIBRARY`; `Read_Registry('HKEY_CLASSES_ROOT\Applications\AcroRd32.exe…')` | Not live today (block is inside `/* */`, `WEB.SHOW_DOCUMENT` is the active path). One uncomment away from command injection on the Forms server or, via signed WebUtil, on every user PC. Delete, do not port. |
| SEC-012 | Medium | CWE-778 Insufficient Logging | No audit of login, user/role/permission changes, DB grants, or regeneration-password change; actor field is client-controlled | `FD_GESTAO_SIID.fmb.plsql.txt:4313` (`Reenvia_Email`); `analysis/forms-extracted/T/FD_UTILIZADORES_SIID.fmb.txt` PRE-INSERT | Only trail: `INSERT INTO ERR_ERROS_SIID (… 'DOCUMENTO REENVIADO POR EMAIL POR '\|\|v_utilizador …)` with `v_utilizador := :PARAMETER.P_USERNAME`; `:CFG_UTILIZADORES.CRIADO_POR := USER` (shared DB account) | Forensics impossible: an attacker names themselves via the URL parameter; audit columns record the service account. |
| SEC-013 | Medium | CWE-1104 Unmaintained Third-Party Components | WebUtil 1.0.6 (2004-2006), `ojdbc7` ***.0 (2014), 2004-era JDeveloper bean, Oracle Net *** client | `webutil_106/java/frmwebutil.jar` (2005-03), `webutil_106/webutil/d2kwut60.dll`, `JNIsharedstubs.dll` (2004-02), `jacob.jar/dll` 1.18 (2014); `testes/lib/ojdbc7.jar` manifest `Implementation-Version: ***.0`; `GetImageFileName.jar` `Created-By: Oracle JDeveloper 10g 9.0.5`; `dev/sqlnet.log` "TNS for 32-bit Windows: Version ***.0" | WebUtil 1.0.6 targets Forms 10g and is unsupported on 12c; it requires a fully-privileged signed applet (`sign_webutil.bat` self-signed, default keystore passwords). `ojdbc7` *** base build predates CVE-2016-3506 and all later CPUs. Applet/Java Web Start delivery is EOL in current browsers. |
| SEC-014 | Low | CWE-200 Information Exposure | Internal hosts/IPs, environment selector, username record group, `sqlnet.log`, `user.home` | `FD_LOGIN_SIID.fmb.plsql.txt:131,486-489`; `FD_CONFIGURACAO_MODELOS.fmb.plsql.txt:818`; `dev/sqlnet.log` (399 lines, 2021); IPs in SEC-001/003 | `SELECT NOME, USERNAME FROM CFG_UTILIZADORES WHERE AMBIENTE_ID=:LOGIN.AMBIENTE` (list population commented out at :131); login lets user choose `DEV` / `GADOR_TESTES` / `COSEC`; hosts `***:1530`, `***:1521`, `***:1530`, `ssiid-prod.cosec.pt`, `ssiidt.cosec.pt`, `servimp*.cosec.pt`, `www.link.pt` | Network map and user list available to anyone with a binary; pre-auth enumeration if the list is re-enabled. `sqlnet.log` itself leaks nothing beyond client version. |
| SEC-015 | Low | CWE-434 Unrestricted Upload | Template image upload validated only by a client-side file filter | `FD_CONFIGURACAO_MODELOS.fmb.plsql.txt:1477` → `Webutil_File_Transfer.Client_To_DB` into `DOC_SECCOES_DOCUMENTO` | `client_get_file_name(directory_name => :global.user_home, file_filter => 'JPG…\|PNG…\|All Files (*.*)…')` | Arbitrary bytes stored as "image" and embedded into generated documents. Note repo `webutil_106/server/webutil.cfg` has `transfer.database.enabled=FALSE` — deployed config evidently differs; confirm. |
| SEC-016 | Info | CWE-1164 Irrelevant Code | WIP/backup module copies carry the same secrets and risky code | `dev/T/FD_GESTAO_SIID_v2.fmb`, `dev/T/FD_CONFIGURACAO_MODELOS_old.fmb`, `dev/P/bck/`, four `Copy of compile_*.bat` | duplicates of SEC-001/002/007-011 content | Multiplies exposure and confuses rotation/clean-up. |

## 2. Finding details

### SEC-001 — Hard-coded DB credentials in `FD_LOGIN_SIID` ON-LOGON (Critical, CWE-798)
**Location:** `analysis/forms-extracted/T/FD_LOGIN_SIID.fmb.txt:498-524` (comment "fica assim provisoriamente" — "temporarily like this"); `analysis/forms-extracted/P/FD_LOGIN_SIID.fmb.txt:476-501`. Grep of deployed binaries: `prod/FD_LOGIN_SIID.fmx` contains the `***` connect descriptor and the production account name 3×; `testes/FD_LOGIN_SIID.fmx` contains the test account 3×.
**What it grants:** `SIID_D****`/`SIID_T****` — DEV and TEST schema owners (`***:1530/COSEC`, TNS `cosec`/`gador`); `DISC****` — **production** schema owner (TNS `COSEC01`, `***:1521`); commented `DISC****FOR` — password identical to account name (`***:1530/COSEC`). All look live: the production pair is byte-identical to `compile_producao.bat`.
**Exploit:** obtain any `.fmx` (Forms server `forms/` directory, backup, developer laptop) → `strings` → `sqlplus` as schema owner.
**Fix:** rotate all four accounts now (independent of rewrite). In Forms, remove the ON-LOGON hard-coding and use a `userid=` in the server-side `formsweb.cfg`/`default.env` with an OS-protected wallet, or Forms SSO. In the rewrite: see §3.

### SEC-002 — Plaintext credentials in compile scripts (Critical, CWE-798/260)
**Location:** six `.bat` files listed in the table. `CLAUDE.md` already warns about them.
**Exploit:** anyone with read access to the share/repo runs `sqlplus` against production.
**Fix:** delete the four `Copy of…` files; change the two live scripts to `frmcmp.exe userid=/@cosec01` with an Oracle wallet (`SQLNET.WALLET_OVERRIDE=TRUE`, `mkstore -createCredential`) or prompt for the password; add `*.bat` with `userid=` to a pre-commit secret scanner. Rotate.

### SEC-003 — Client-side bean with production JDBC URL and authenticator (High, CWE-798/522)
**Location:** `testes/Combined-dist.jar`, `testes/ShowDOC.jar` → `ons/siid/ShowDoc.class` (constants `jdbc:oracle:thin:@***:1521:COSEC01`, `jdbc:oracle:thin:@***:1530:COSEC`, plus 8-char constants beginning `PWD`, `Use`, `Pas`), `ons/siid/CustomAuthenticator.class` (`myU****`, `myP****`, `myD****` fields; `PasswordAuthentication`). Referenced from the form only through commented `HOST('CMD /C java -jar ShowDoc.jar …')`, but the jar is deployed under `testes/`.
**Exploit:** download the jar from the Forms server (`/forms/java/`), `javap -c` → connect directly to production from any desktop, bypassing the application entirely; the e-doclink SOAP account is reusable against `www.link.pt` services.
**Fix:** confirm with `javap -constants ons/siid/ShowDoc.class` whether values are compiled in; rotate regardless. Remove the bean from deployment (its function is already replaced by `WEB.SHOW_DOCUMENT`). Never ship DB drivers or credentials to clients; in the rewrite the browser talks only to the Node API.

### SEC-004 — Authorization enforced only by which form/menu is opened (High, CWE-285/602)
**Location:** `FD_LOGIN_SIID.fmb.plsql.txt:46-50`; `MD_SIID_USER.mmb.plsql.txt:32,246,282,462` (and 13 more `OPEN_FORM`s — the set equals `MD_SIID` except `FD_GESTAO_SIID`→`FD_GESTAO_SIID_USER`); every child form's WHEN-NEW-FORM-INSTANCE guard is `if :PARAMETER.P_USERNAME IS NULL THEN … EXIT_FORM` (e.g. `FD_GESTAO_SIID.fmb.plsql.txt:9`); `FD_GESTAO`/`FD_GESTAO_USER` have no guard. `USER_TAB_PRIVS`/`USER_SYNONYMS` queries (`FD_GESTAO.fmb.plsql.txt:84`) only discover the schema owner to build synonyms — they are not per-user checks because all users log on as the same DB account (SEC-001). Only visible difference between `FD_GESTAO_SIID` and `_USER`: the latter drops `PKG_SIID_UTIL.CAN_BE_UPLOADED_EDOC` and `REIMPRIMIR.NOVA_IMPRESSORA`; it still contains regenerate, annul, archive, e-mail resend and `WEB.SHOW_DOCUMENT`. Update from the Forms2XML dump (2026-09-14): `MD_SIID_USER` does disable the GADOR, CONFIGURAÇÃO, ADMINISTRAÇÃO, AUDITORIA and BACKUPS menu entries (`Enabled="false"`), so the admin forms are not reachable from the user menu in normal use. The control is still client-side only: the forms accept any `P_USERNAME` and can be opened by URL, so the finding stands at High.
**Exploit:** a `tipo_utilizador_rf <> 'ADM'` user opens *Utilizadores* from their own menu (or `…/frmservlet?form=FD_UTILIZADORES_SIID&otherparams=P_USERNAME=anything`) and inserts an ADM row; or opens `FD_GESTORES_SIID` and triggers SEC-007.
**Fix (Forms, interim):** in every admin form's WHEN-NEW-FORM-INSTANCE, re-query `CFG_UTILIZADORES.TIPO_UTILIZADOR_RF` for `:GLOBAL.USERNAME` and `EXIT_FORM` unless `'ADM'`; remove admin `OPEN_FORM`s from `MD_SIID_USER.mmb`; set `formsweb.cfg` `form=` fixed and disallow URL override. **Rewrite:** §3 RBAC.

### SEC-005 — Reversible, unsalted password "encryption" (High, CWE-916/327/257) — **CONFIRMED** from live DB source, 2026-09-15
**Location:** `FD_LOGIN_SIID.fmb.plsql.txt:27-35` (compare), `:41` (`:GLOBAL.PASS` retained, never read elsewhere), `analysis/forms-extracted/T/FD_UTILIZADORES_SIID.fmb.txt:798` (store). Regeneration secret uses a second scheme, `crypt_pkg.encryptStringRaw` (`FD_ALTERAR_PASSWORD.fmb.plsql.txt:11`); an older `pck_sg.F_INS_ENCRIPT` is commented. All three are named *encrypt*, deterministic (equality compare), with no per-user salt.

Confirmed by reading the actual package bodies from the DB (`analysis/db/packages/USER_SECURITY.sql`, `analysis/db/packages/CRYPT_PKG.sql`):
- **`USER_SECURITY.ENCRYPT(p_text VARCHAR2) RETURN RAW`** — not `VARCHAR2` as earlier inferred. It's plain DES (`DBMS_OBFUSCATION_TOOLKIT.DESEncrypt`) with a **hardcoded 8-byte key, the literal `'12345678'`**, same for every user and every environment. A matching `USER_SECURITY.DECRYPT(p_raw RAW) RETURN VARCHAR2` function exists in the same package — any session with `EXECUTE` on `USER_SECURITY` can decrypt every password in `CFG_UTILIZADORES.PASSWORD` directly, no rainbow table needed.
- **`CRYPT_PKG.ENCRYPTSTRINGRAW`** (used for the regeneration password, BR-AUTH-09/BR-DOC-14) is the same DES scheme, defaulting to a **hardcoded key, the literal `'Onsite@Cosec'`**, when called with no explicit key (which is how both `FD_ALTERAR_PASSWORD` and the `CONFIRMAR_PASSWORD` check call it). `CRYPT_PKG.DECRYPTSTRING`/`DECRYPTRAW` reverse it with the same default key.

**Exploit:** anyone with `EXECUTE` on `USER_SECURITY` or `CRYPT_PKG` (all users share the schema-owner session) calls `DECRYPT`/`DECRYPTSTRING` directly — no cracking or rainbow table required, the keys are hardcoded constants in the package body. Identical ciphertexts also reveal shared passwords across users even without the key.
**Fix:** on migration, do not import the column; force a reset flow. Store only Argon2id/bcrypt hashes (§3).

### SEC-006 — No lockout, throttling, policy or expiry enforcement (Medium, CWE-307/613)
**Location:** `FD_LOGIN_SIID.fmb.plsql.txt:19-33`; `FD_UTILIZADORES_SIID` maintains `DATA_INICIO`/`DATA_FIM` and `NIVEL_ACESSO_RF` that login never reads.
**Exploit:** a terminated employee whose `DATA_FIM` was set still logs in; unlimited guessing against short passwords.
**Fix:** add `AND SYSDATE BETWEEN DATA_INICIO AND NVL(DATA_FIM, SYSDATE)` now; rewrite: §3.

### SEC-007 — `GRANT … TO '||:utilizador` DDL injection (High, CWE-89)
**Location:** `FD_GESTORES_SIID.fmb.plsql.txt:32-55` (grant, 23 statements) and `:64-…` (revoke), executed as schema owner via `FORMS_DDL`.
**Exploit:** type `PUBLIC` (or `HR WITH GRANT OPTION`) in the manager username field and commit → every DB account can read/modify `SVR_DOCUMENTOS`, `MRECIBO`, `MPERSONA`, `DOC_PERMISSOES_IMPRESSAO`.
**Fix:** validate against `ALL_USERS` and `DBMS_ASSERT.ENQUOTE_NAME`/`SIMPLE_SQL_NAME` before concatenation; better, replace ad-hoc grants with a DB role granted by a definer-rights procedure. In the rewrite, no dynamic DDL from the app at all.

### SEC-008 — Shared regeneration password, no old-password check, reachable by all (High, CWE-287/620)
**Location:** `FD_ALTERAR_PASSWORD.fmb.plsql.txt:78-95` (only `:PASSWORD = :CONFIRMACAO`), `:13` (string-built `UPDATE`), `:17` (dead `ALTER USER … IDENTIFIED BY`), `:60-66` (`P_USERNAME` guard); consumer `FD_GESTAO_SIID.fmb.plsql.txt:2280`, `FD_GESTAO_SIID_USER.fmb.plsql.txt:3851`; menu entry for all users `MD_SIID_USER.mmb.plsql.txt:282`. The secret lives in `SVR_VARIAVEIS_SIID` (`TIPO_VARIAVEL_RF='PASSWORD'`), one row per `AMBIENTE_ID`.
**Exploit:** any user opens *Alterar password*, sets a new value, then regenerates/reprints receipts for arbitrary `spoolid`s under their own name (or denies service to operators).
**Fix:** replace the shared secret with a per-user permission (`REGENERATE_DOCUMENT`) checked server-side and audited; require current password + step-up for sensitive actions. Delete the dead `ALTER USER` block.

### SEC-009 — String-built SQL through `FORMS_DDL` / block properties (Medium, CWE-89)
**Location:** see table. `:GLOBAL.LOTE_CLONE_ID` is populated via `COPY()` from `CLONAR_DOCUMENTO.VALOR` (user-editable); `P_COLUNA`/`P_TIPO` come from item names; `P_AMBIENTE` from `USER_TAB_PRIVS`.
**Exploit:** currently limited (numeric/derived inputs), but `LOTE_CLONE_ID` `= 1 OR 1=1` style payloads reach an `UPDATE` executed without bind variables.
**Fix:** bind variables / static SQL in PL/SQL packages; in the rewrite `node-oracledb` binds only (§3).

### SEC-010 — Plain-HTTP, ID-keyed document links (Medium, CWE-319/639)
**Location:** `FD_GESTAO_SIID.fmb.plsql.txt:2599-2606`; older hosts at `:2588`.
**Exploit:** `curl http://ssiid-prod.cosec.pt:8090/FileServerSIID/restapi/FileServer/pdf/P?spoolid=N` for N = 1… from any LAN host; passive capture of receipts with personal data.
**Fix:** TLS only; the Node API must proxy/stream PDFs after an ownership/permission check, or issue short-lived signed URLs; never expose raw sequential IDs.

### SEC-011 — Dormant command-execution and file-system code (Medium, CWE-78/22)
**Location:** `FD_GESTAO_SIID.fmb.plsql.txt:2564` (registry read, commented), `:2610-2734` (comment block containing `host(exec_path||' '||d_gerados||…||:SVR_DOCUMENTOS.nome_output||'.pdf')` and `File_Exists(...)`), `:3115` (`ORA_FFI.LOAD_LIBRARY` in embedded `WIN_API` package), `:4055` (`Text_IO.Fopen`), commented `HOST('CMD /C java -jar ShowDoc.jar …')` and `CLIENT_HOST('CMD /C E:\SIID\teste5.pdf')`. Directory roots come from `SVR_VARIAVEIS_SIID` rows `PDF`/`BACKUP`/`ONLINE` (the "PATHS" reference in the inventory is the embedded d2kwutil library text, not a `PATHS` table; likewise `WIN.INI`). No live `WIN_API_*` call remains.
**Exploit (if reactivated):** a document whose `nome_output` contains `& calc.exe` executes on the Forms server; with WebUtil, on the user PC.
**Fix:** delete the blocks and the `WIN_API`/`d2kwutil` program units; do not port any shell-out.

### SEC-012 — Audit trail gaps (Medium, CWE-778)
**Location:** `FD_GESTAO_SIID.fmb.plsql.txt:4313` and siblings write to `ERR_ERROS_SIID` with `v_utilizador := :PARAMETER.P_USERNAME`; `FD_UTILIZADORES_SIID` PRE-INSERT sets `CRIADO_POR := USER` (shared account) while other forms use `:GLOBAL.USERNAME`; nothing logs authentication events, `CFG_PERMISSOES_SIID` changes, `FD_GESTORES_SIID` grants, or regeneration-password changes. E-mail resend address is `MAX(ATRIBUTO01)` from prior `SVR_QUEUE` rows, unvalidated.
**Fix:** §3 audit requirements.

### SEC-013 — Outdated components (Medium, CWE-1104)
- WebUtil 1.0.6: `frmwebutil.jar` 2005, `d2kwut60.dll`/`JNIsharedstubs.dll` 2004, JACOB 1.18 2014; needs a self-signed, all-permissions applet (`sign_webutil.bat` with default keystore passwords). Forms 12c ships its own WebUtil; mixing is unsupported. `create_webutil_db.sql` installs `WEBUTIL_DB`, a server-side file R/W package — check it is not installed in production.
- `ojdbc7.jar` ***.0 (2014): vulnerable to CVE-2016-3506 (CVSS 8.1, Oracle Net) unless it is a patched CPU build; `Combined-dist.jar` bundles another copy.
- `GetImageFileName.jar`: JDeveloper 9.0.5 (2004) applet bean.
- `dev/sqlnet.log`: Oracle Net client *** (2005) still in use on a dev box (only timeouts, no hosts leaked).
**Fix:** the rewrite removes all of them; until then patch `ojdbc`, and restrict the Forms server to modern-browser Java Web Start with the vendor WebUtil.

### SEC-014 / SEC-015 / SEC-016 — see table; fixes: strip hosts from code into environment config; server-side MIME/size validation with `sharp` re-encode for images; delete WIP copies and `bck/` before hand-over.

## 3. Requirements for the Node.js rewrite (Docker)

**Authentication & session**
1. Single login endpoint; users in a `users` table with `password_hash` = Argon2id (or bcrypt cost ≥ 12). Never migrate `CFG_UTILIZADORES.PASSWORD`; force a password-reset flow on first login. (Plan note: `DECISIONS.md` D-07 decides between this and keeping `USER_SECURITY.ENCRYPT` for a zero-migration cutover; if kept, schedule the hash migration as a follow-up.)
2. Sessions: server-side store with `httpOnly; Secure; SameSite=Lax` cookie, 8-h absolute / 30-min idle timeout, rotate ID on login, invalidate on password change. CSRF token on every state-changing request.
3. Rate-limit `/login` (e.g. 5/min/IP + 10/hour/user), lock after 10 failures, generic error message, enforce `DATA_INICIO`/`DATA_FIM`, password policy ≥ 12 chars, breached-password check.
4. Prefer SSO (OIDC/SAML against the corporate IdP) so the app never stores passwords; local accounts only as break-glass.

**Authorization (server-side RBAC)**
5. Roles in DB; every route guarded by middleware (`requireRole('ADM')`), never by hiding UI. Row-level checks for documents (`AMBIENTE_ID`, department/`CDDEPARTA`).
6. Sensitive actions (regenerate, annul, archive, resend, change permissions, create user) = explicit permissions + step-up re-auth; no shared "regeneration password".
7. Never trust identity from request parameters (`P_USERNAME` pattern); identity comes only from the session.

**Secrets & configuration**
8. All secrets (DB user/password, SMTP, e-doclink credentials, session key) via environment: `.env` for local dev only (git-ignored), Docker/Compose secrets in deployment; read once at boot; fail fast if missing. No environment selector in the UI — one image, config per environment.
9. Application DB account is **not** the schema owner: least-privilege user with `SELECT/INSERT/UPDATE/DELETE` on needed tables and `EXECUTE` on packages; no `GRANT`, `CREATE SYNONYM`, `ALTER USER` ability. Use `node-oracledb` connection pool, TLS (`tcps`) to the DB where available, wallet mounted read-only.
10. Add `gitleaks`/`trufflehog` in CI; the repo starts clean (no `.bat`, no credentials).

**Data access**
11. `node-oracledb` with bind parameters exclusively; allow-list any dynamic `ORDER BY` column; no string concatenation into SQL/DDL; no DDL from the app at all.
12. Explicit transactions (`autoCommit: false`, `commit()`/`rollback()` in `try/finally`).

**Files & documents**
13. Document download only through the API after permission check: stream from the file server (`FileServerSIID`) using a server-to-server call over HTTPS, or return a 5-minute signed URL. Non-sequential public IDs in URLs.
14. Uploads: size cap, MIME sniffing, re-encode images, store outside the web root or in DB BLOB, virus scan if available. No path built from user input; no `child_process` shell-outs.
15. No client-side DB access of any kind (kills SEC-003 permanently).

**Audit logging**
16. Append-only audit log (actor from session, action, target, before/after JSON, IP, UA, timestamp) for login success/failure, logout, user CRUD, role/permission changes, regenerate/annul/archive/resend, config changes. Structured JSON app logs with PII redaction; no passwords/tokens in logs.

**Platform hygiene**
17. Node LTS, `pnpm audit` in CI, `node:lts-slim`/alpine image, non-root user, read-only FS, security headers, HTTPS termination with HSTS, healthchecks, `oracledb` thin mode to avoid Instant Client CVE surface.

**Credential rotation (do now, before any rewrite work)**
- `SIID_D****` (DEV schema, `***:1530/COSEC`)
- `SIID_T****` (TEST schema, TNS `cosec`/`gador`)
- `DISC****` (**production** schema owner, TNS `COSEC01` / `***:1521`)
- `DISC****FOR` (`***:1530/COSEC`; verify whether the account still exists, drop or rotate)
- e-doclink web-service account embedded/handled by `CustomAuthenticator` (verify via `javap`)
- Regeneration password rows in `SVR_VARIAVEIS_SIID` for every `AMBIENTE_ID`
- All `CFG_UTILIZADORES` passwords (recoverable — treat as compromised)
- WebUtil jar-signing keystore used by `sign_webutil.bat`
- After rotation: purge the four `Copy of compile_*.bat`, `dev/sqlnet.log`, `bck/`, `_v2`/`_old` modules, and re-deploy `.fmx` built without hard-coded `LOGON`.
