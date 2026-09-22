# GestSIID - Business Rules Extracted from the Oracle Forms 12c Source (branch dev/T)

Produced 2026-09-14 by the `code-modernization:business-rules-extractor` agent.

Purpose: rule inventory for the Node.js rewrite. Everything below was mined from the text extracted out of the .fmb/.mmb binaries (`analysis/forms-summary/T/*.plsql.txt`, `analysis/forms-extracted/T/*.txt`) and the compile logs in `dev/P/*.err`. No Oracle tool was run and no database was queried, so anything that lives in a PL/SQL package body (PKG_DOCUMENTOS_SVR, PKG_SIID_UTIL, USER_SECURITY, CRYPT_PKG) or in a view (SVR_DOCUMENTOS_VW, DOC_PERMISSOES_IMPRESSAO, CFG_UTILIZADORES_VW, SVR_PARAMETROS_DOC_NOME_VW) is out of reach and is listed in section 4 (Open questions).

Confidence legend used on every rule:

- **clear** - the logic is explicit in the form code.
- **inferred** - deduced from names, LOV/record-group SQL, string dumps or block layout.
- **unknown** - the form only calls something that lives in the database; behaviour must be confirmed.

Source citations are `MODULE :: trigger / program unit (block.item)`. Trigger-to-block mapping for the three big forms comes from `dev/P/FD_GESTAO_SIID.err`, `dev/P/FD_CONFIGURACAO_MODELOS.err` and `dev/P/FD_PERMISSOES_SIID.err`. `FD_GESTAO_SIID_v2.fmb` contains the same PL/SQL as `FD_GESTAO_SIID.fmb` (only a truncated comment differs) and is not cited separately. `FD_CONFIGURACAO_MODELOS_old.fmb` is a superseded draft (see BR-MOD-15).

Credential note: `FD_LOGIN_SIID :: ON-LOGON` and the `compile_*.bat` scripts embed database usernames and passwords. They are referenced here as `<credential - masked>` and are never reproduced.

Untrusted-content note: no instruction-shaped text aimed at automated tools was found in the source. The only narrative comment blocks are developer change notes in FD_PERMISSOES_SIID ("CORRECTED: alter_permission.sql", "FIX #5/#6/#7"); they were treated as data and cross-checked against the executable code.

Rule count: 101 rules (AUTH 10, DOC 37, PERM 11, MOD 15, BKP 9, PRN 4, ADM 7, XC 8), a message catalogue of 60 user-facing texts and 16 open questions.

---

## 1. Domain glossary (Portuguese term -> meaning as the code uses it)

| Term | Meaning in GestSIID |
|---|---|
| **SIID** | The document-production back office; every table prefix SVR_, DOC_, CFG_, ERR_ belongs to it. |
| **Documento** | One generated output (a spool). Row of SVR_DOCUMENTOS, shown through the view SVR_DOCUMENTOS_VW. Its ID is called **spool_id** in messages. Columns the forms use: MODELO_ID, ESTADO (view-computed), DATA_PEDIDO, DATA_EXECUCAO, DATA_IMPRESSAO, N_IMPRESSOES, DESTINATARIO, N_REFERENCIA, LOTE_ID, LOTE_ORDEM, IMPRESSORA_ID, CRIADO_POR, IMPRESSO_POR, DISPONIBILIDADE / DISPONIVEL_RF, ATRIBUTO9, ARQ_ID, BACKUP_ID, TAMANHO_BYTES, NOME_OUTPUT. |
| **Modelo** | A document template/model: row of DOC_MODELOS_DOCUMENTO, identified by a text code such as R3.D25, D1.A7R, O2.OD61. Owns sections, conditions, default parameters, printers, permissions, eDoc/archive attributes and barcode settings. |
| **Secção / alínea** | A block of content of a model (DOC_SECCOES_DOCUMENTO, key MODELO_ID + TIPOSEC_ID + ALINEA): title, text, optional image, formula. **Alínea** is the ordinal of the section within its section type (TIPOSEC_ID). |
| **Condição (APR)** | Applicability condition attached to a section (DOC_CONDICOES_APR, key adds CONTEXTO_ID): business unit (CDUNIECO), branch (CDRAMO), attributes 1-8, validity dates. |
| **Parâmetro (de report / por omissão)** | A parameter of the report behind a model (SVR_PARAMETROS_REPORT, numbered N_PARAMETRO). A **parâmetro por omissão** (DOC_PARAMETROS_OMISSAO) is a dated default value for that parameter on a given model. Document-level parameter values live in SVR_PARAMETROS_DOCUMENTO (searched through SVR_PARAMETROS_DOC_NOME_VW). |
| **Lote / lote_ordem** | Batch id and position inside the batch for documents produced together (LOTE_ID, LOTE_ORDEM). "Mostrar Grupo" navigates a batch. |
| **Queue / fila (SVR_QUEUE)** | Work request for the background print server. TIPO_QUEUE_RF in: EXECUCAO (generate), IMPRESSAO (print), 2.VIA (second copy), COPIA (copy), REENVIAR (resend to eDoc), EMAIL, TOXML (recreate XML / e-invoice), ARQUIVO (re-archive), BACKUP. ESTADO in: ESPERA, ENQUEUED, EM EXECUCAO, EXECUCAO, TERMINADO, ERRO, CANCELLED, SUSPENSO. The forms never execute work; they only enqueue rows in ESPERA. |
| **Executar / a executar / execução** | Document generation by the server. View ESTADO values seen in code: NULL (não executado), A EXECUTAR, EXECUCAO; IMPRESSO appears only in commented code. |
| **Regerar** | Re-generate a document: enqueue a new EXECUCAO request. Protected by the **password de regeração** when the document was already printed or its model has expedition mode G. |
| **Reimprimir** | Print again to the associated printer or to another printer (IMPRESSAO request). |
| **2ª Via** | Second copy: a print request typed 2.VIA, only allowed if the document was printed at least once (N_IMPRESSOES <> 0). |
| **Cópia** | A print request typed COPIA (no prior-print requirement). |
| **Anular / anulado** | Cancel a document for good via PKG_DOCUMENTOS_SVR.ANULAR; the UI recognises an annulled document by ATRIBUTO9 = 'A' or DISPONIBILIDADE = 'ANU'. Annulled documents are skipped by regerar / 2ª via / cópia. |
| **Cancelar** | Cancel pending or finished EXECUCAO queue requests (ESTADO -> CANCELLED); also cancel a single queue row from the queue window. |
| **Reenviar** | Re-send a document to the **EDoc** platform (REENVIAR request); allowed only for models with MODO_EXPEDICAO_RF = 'W' that PKG_SIID_UTIL.CAN_BE_UPLOADED_EDOC accepts. |
| **Reenviar Email** | Re-send by e-mail to the address of the previous EMAIL request. |
| **Rearquivar / Re-Arquivar** | Enqueue an ARQUIVO request for documents that already have an archive id (ARQ_ID). |
| **Recriar (XML) / Fatura electrónica** | Enqueue a TOXML request (procedure RECRIAR), used for the electronic-invoice XML. |
| **Suspender / Retomar** | Put queue rows ESPERA -> SUSPENSO (selected documents or every waiting row) and back. |
| **Clonar (documento)** | Produce a new document from the same model with edited parameter values, through PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING + EXECUTA. |
| **Clonar (modelo / alínea)** | Copy a model (with its sections and conditions) under a new code, or copy a section as a new alínea. |
| **Spool** | Column label of SVR_DOCUMENTOS.ID; default sort key. |
| **Disponibilidade** | Where the PDF is: OFF = offline (on a backup medium), ANU = annulled. |
| **Backup / mídia / unidade de medida** | A backup (SVR_BACKUPS) groups the printed documents of one month onto one **mídia** (CFG_TIPOS_MiDIA, capacity in bytes expressed in a **unidade de medida** CFG_UNIDADES_MEDIDA). "Backups online" marks which media are currently mounted (MEDIA_ONLINE, DRIVE_ONLINE). |
| **Ambiente (AMBIENTE_ID)** | The target environment/schema (e.g. DEV, GADOR_TESTES, COSEC). Chosen at login, stored in GLOBAL.AMBIENTE_ID, and used to pick the DB account, the schema addressed through private synonyms, the row set of SVR_VARIAVEIS_SIID and the file-server URL. |
| **Domínio / valor de domínio** | Generic lookup tables: CFG_DOMINIOS (a code list) and CFG_VALORES_DOMINIO (DOMINIO_ID, CHAVE, DESIGNACAO, PRIORIDADE...). Every *_RF column in the application is a CHAVE of some domain. |
| **Permissão** | Right of a user to work with a model, per business unit and permission type, valid between two dates (CFG_PERMISSOES_SIID, listed through DOC_PERMISSOES_IMPRESSAO). |
| **Unidade de negócio (UNIDADE_NEGOCIO_RF, CDDEPARTA)** | Business unit / department code, a value of domain UNIDADE_NEGOCIO. |
| **Tipo de permissão (TIPO_PERMISSAO_RF)** | Value of domain TIPO_PERMISSAO (key stored, designation displayed). |
| **Utilizador** | Application user (CFG_UTILIZADORES: USERNAME, PASSWORD encrypted, AMBIENTE_ID, TIPO_UTILIZADOR_RF - ADM means administrator, UNIDADE_NEGOCIO_RF, NIVEL_ACESSO_RF, validity dates). CDEMPLEA is the employee/user code from the HR system (CO_EMPLEADOS, M_USUARIOS.CDIDUSR). |
| **Gestor** | A *database* account granted the SIID object privileges (see BR-ADM-03) - not an application role. |
| **Perfil de departamento** | Signature block for a department manager (DOC_PERFIS_DEPARTAMENTO): employee, code from TTAPVAAT, function (DOC_FUNCOES_DEPARTAMENTO: GCOM, GCON), name, signature image, phones, e-mail. |
| **Variável SIID** | Per-environment configuration value (SVR_VARIAVEIS_SIID: TIPO_VARIAVEL_RF in PASSWORD, BACKUP, ONLINE, PDF, ...). |
| **Impressora** | Printer (SVR_IMPRESSORAS: DESCRICAO, ENDERECO, GSDEVICE_RF, VALIDO). Associated to models (DOC_IMPRESSORAS_DOC) and to user+model (DOC_IMPRESSOES_MODELO_USR). |
| **Erros SIID (ERR_ERROS_SIID)** | Log table; the forms write audit rows of type ERRO_DOC for every re-queue action. |
| **_USER / P_USUARIO / P_DATAACTUAL** | The three mandatory leading report parameters: target schema, requesting user, current date. |

---

## 2. Rules per functional area

### 2.1 Authentication, session and environment (AUTH)

**BR-AUTH-01 - Username and password are mandatory at login**
- Given the login screen (LOGIN.UTILIZADOR, LOGIN.PASSWORD, LOGIN.AMBIENTE)
- When the user presses the login button with UTILIZADOR empty, or with PASSWORD empty
- Then the login is refused with alert SEM_UTILIZADOR / SEM_PASSWORD and nothing else happens.
- Source: FD_LOGIN_SIID :: WHEN-BUTTON-PRESSED.
- Messages: `O 'Utilizador' é de preenchimento obrigatório.` / `A 'Password' é de preenchimento obrigatório.`
- Confidence: clear.

**BR-AUTH-02 - Environment is chosen from domain TIPO_AMBIENTE; the user list depends on it**
- Given the login screen
- When it opens
- Then the environment list is `SELECT DESIGNACAO, CHAVE FROM CFG_VALORES_DOMINIO WHERE DOMINIO_ID='TIPO_AMBIENTE'` and the user LOV is `SELECT NOME, USERNAME FROM CFG_UTILIZADORES WHERE AMBIENTE_ID = :LOGIN.AMBIENTE ORDER BY NOME`. Keys handled by the code: DEV, GADOR_TESTES, COSEC.
- Source: FD_LOGIN_SIID :: record groups RG_TIPO_AMBIENTE / RG_UTILIZADOR; ON-LOGON.
- **Resolved from the Forms2XML dump:** the record-group population is commented out and the list is STATIC in the .fmb with a single real entry per build — T: `TESTES` = `GADOR_TESTES` (initial value GADOR_TESTES); P: `PRODUÇÃO` = `COSEC` (initial value COSEC); the other list elements are empty placeholders. So each compiled build already targets exactly one environment; the "selector" is not a real choice. This supports one container per environment (MASTER_PLAN D-02).
- Confidence: clear.

**BR-AUTH-03 - The database session is opened with a fixed technical account per environment**
- Given :LOGIN.AMBIENTE
- When the form runs `execute_trigger('on-logon')` with :GLOBAL.DO_LOGON='YES'
- Then ON-LOGON selects a hard-coded DB username, password and connect string per environment (DEV -> dedicated dev schema over a TCP descriptor; GADOR_TESTES and COSEC -> the same *test* schema through TNS alias `cosec`) and calls LOGON. The application user never connects with a personal DB account.
- Parameters: `<credential - masked, see FD_LOGIN_SIID ON-LOGON>` x3 environments. Code comment: "fica assim provisoriamente".
- Confidence: clear. SME question: which account/connect string is live for production COSEC? The code currently points the COSEC key at the test schema.

**BR-AUTH-04 - Application credentials are validated against CFG_UTILIZADORES with a one-way encryption**
- Given user U, password P, environment E
- When login is submitted
- Then if `COUNT(*) FROM CFG_UTILIZADORES WHERE USERNAME=U AND AMBIENTE_ID=E` is 0 -> alert LOGIN_INVALIDO; else if `USER_SECURITY.ENCRYPT(P) != PASSWORD` -> alert LOGIN_INVALIDO; else GLOBAL.USERNAME=U, GLOBAL.PASS=USER_SECURITY.ENCRYPT(P), GLOBAL.AMBIENTE_ID=E. Any exception shows `Erro` and re-raises.
- Source: FD_LOGIN_SIID :: WHEN-BUTTON-PRESSED.
- Message: `Utilizador e/ou password inválidos.`
- Confidence: clear for the flow and the algorithm — **RESOLVED** (DB source read, 2026-09-15): `USER_SECURITY.ENCRYPT(p_text VARCHAR2) RETURN RAW` is plain DES (`DBMS_OBFUSCATION_TOOLKIT.DESEncrypt`) with a hardcoded key (`'12345678'`), reversible via the package's own `DECRYPT` function — not a one-way hash. See `analysis/db/packages/USER_SECURITY.sql` and SEC-005. The rewrite must not import `CFG_UTILIZADORES.PASSWORD` as-is; force a reset flow instead of reusing the algorithm.

**BR-AUTH-05 - Administrator vs. regular-user container**
- Given a successfully authenticated user
- When CFG_UTILIZADORES.TIPO_UTILIZADOR_RF = 'ADM'
- Then NEW_FORM('FD_GESTAO') (admin container, menu MD_SIID); otherwise NEW_FORM('FD_GESTAO_USER') (restricted container, menu MD_SIID_USER).
- Source: FD_LOGIN_SIID :: WHEN-BUTTON-PRESSED; TIPO_UTILIZADOR values come from domain TIPO_UTILIZADOR (FD_UTILIZADORES_SIID).
- Confidence: clear. The PL/SQL of MD_SIID and MD_SIID_USER is identical; the Forms2XML dump (`analysis/forms-xml/T/MD_SIID_USER_mmb.xml`) shows the restriction as menu properties: in MD_SIID_USER the items GADOR, CONFIGURAÇÃO, ADMINISTRAÇÃO, AUDITORIA and the BACKUPS sub-menu have `Enabled="false"`, so a regular user only reaches Gestão → Documentos (FD_GESTAO_SIID_USER), Impressoras Associadas → Documento / Utilizador, and Alterar password. In MD_SIID only AUDITORIA is disabled. (OQ-2 resolved; the child forms still do not check the role themselves.)

**BR-AUTH-06 - Every functional form must be opened from the container (session guard)**
- Given any child form (FD_GESTAO_SIID*, FD_PERMISSOES_SIID, FD_CONFIGURACAO_*, FD_NOVO_BACKUP, FD_BACKUPS_ONLINE, FD_IMPRESSORAS_SIID, FD_GESTAO_IMPRESSORAS_*, FD_DOMINIOS_SIID, FD_UTILIZADORES_SIID, FD_GESTORES_SIID, FD_PERFIS_DEPARTAMENTO, FD_VARIAVEIS_SIID, FD_ALTERAR_PASSWORD, FD_TIPOS_MiDIA, FD_UNIDADES_MEDIDA)
- When it starts and :PARAMETER.P_USERNAME is null (containers: GLOBAL.USERNAME = '*')
- Then alert OUT is shown and the form exits without validation; otherwise GLOBAL.USERNAME := P_USERNAME.
- Source: WHEN-NEW-FORM-INSTANCE of every module; menu items pass P_USERNAME = :GLOBAL.USERNAME in `OPEN_FORM(..., activate, no_session, pl)` (MD_SIID / MD_SIID_USER item code).
- Message: `É obrigatório a aplicação ser 'aberta' a partir do formulário de Login.`
- Confidence: clear. Note: FD_GESTAO_SIID then overwrites GLOBAL.USERNAME with the *database* user (Get_Application_Property(USERNAME)), while all queue operations stamp CRIADO_POR with :PARAMETER.P_USERNAME.

**BR-AUTH-07 - Environment (schema) resolution and private synonyms in the containers**
- Given the container (FD_GESTAO / FD_GESTAO_USER) after login
- When it starts
- Then `v_ambiente := NVL(MAX(OWNER), USER) FROM USER_TAB_PRIVS WHERE PRIVILEGE='INSERT' AND TABLE_NAME='SVR_DOCUMENTO_COMENTARIOS' AND GRANTEE=USER` (the schema that granted the session user). If v_ambiente != USER the menu item CONFIGURAÇÃO_MENU.GESTORES is hidden and, if no private synonym for SVR_DOCUMENTO_COMENTARIOS exists, CREATE_SYNONYMS(v_ambiente) creates 25 private synonyms (svr_gestao_siid_tmp, svr_queue, seq_svr_gs_tmp, ID_DOCUMENTO_SEQ, ID_QUEUE_SEQ, id_comentario_documento_seq, svr_documentos, svr_documentos_vw, err_erros_siid, svr_anexos_documento, svr_parametros_documento, svr_impressoras, mrecibo, svr_gestao_siid_directorias, doc_permissoes_impressao, DOC_IMPRESSORAS_DOC, DOC_IMPRESSOES_MODELO_USR, doc_modelos_documento, doc_seccoes_documento, doc_condicoes_apr, svr_parametros_report, gd_espaco_bd, pkg_documentos_svr, mpersona). If v_ambiente = USER and synonyms exist, they are dropped. Window title and the AMBIENTE prompt show v_ambiente.
- Source: FD_GESTAO / FD_GESTAO_USER :: WHEN-NEW-FORM-INSTANCE, CREATE_SYNONYMS, DROP_SYNONYMS.
- Confidence: clear. Rewrite impact: multi-schema addressing must become explicit configuration (schema per environment) instead of DDL executed at login.

**BR-AUTH-08 - GLOBAL.AMBIENTE_ID fallback**
- Given a child form where GLOBAL.AMBIENTE_ID is not set ('*')
- When it starts
- Then `AMBIENTE_ID := OWNER FROM ALL_OBJECTS WHERE OBJECT_NAME='MRECIBO' AND OBJECT_TYPE='TABLE'` (all forms except FD_UTILIZADORES_SIID, which uses `SELECT ID FROM SVR_AMBIENTES_IMPRESSAO WHERE USERNAME = <DB user>`). Every form also derives the environment shown in its window title as `NVL(MAX(TABLE_OWNER),USER) FROM USER_SYNONYMS WHERE TABLE_NAME='SVR_DOCUMENTOS'`.
- Source: WHEN-NEW-FORM-INSTANCE of FD_GESTAO_SIID, FD_NOVO_BACKUP, FD_BACKUPS_ONLINE, FD_VARIAVEIS_SIID, FD_UTILIZADORES_SIID, FD_ALTERAR_PASSWORD.
- Confidence: clear. SME question: is AMBIENTE_ID (login key such as COSEC) the same value space as the schema owner name returned by these fallbacks? The code assumes so.

**BR-AUTH-09 - Changing the regeneration password**
- Given FD_ALTERAR_PASSWORD (window title "Alteração da Password de Regeração")
- When PASSWORD = CONFIRMACAO
- Then `SVR_VARIAVEIS_SIID.VALOR := crypt_pkg.encryptStringRaw(PASSWORD)` for TIPO_VARIAVEL_RF='PASSWORD' AND AMBIENTE_ID=:GLOBAL.AMBIENTE_ID (executed through FORMS_DDL, then COMMIT) and the form closes; otherwise alert PASSWORD_ERRADA and the form stays open. This is **not** the login password (BR-AUTH-04 uses USER_SECURITY.ENCRYPT on CFG_UTILIZADORES); it is the shared password that gates *Regerar* (BR-DOC-14). Commented code shows it once ran `ALTER USER ... IDENTIFIED BY`.
- Algorithm — **RESOLVED** (DB source read, 2026-09-15): `crypt_pkg.encryptStringRaw` called with no explicit key defaults to plain DES with a hardcoded key, the literal `'Onsite@Cosec'` (`CRYPT_PKG` package global `g_charkey`); reversible via `CRYPT_PKG.decryptString`/`decryptRaw` using the same default key. See `analysis/db/packages/CRYPT_PKG.sql` and SEC-005.
- Source: FD_ALTERAR_PASSWORD :: WHEN-BUTTON-PRESSED.
- Message: `As passwords não coincidem. Alteração não efectuada.`
- Confidence: clear; **unknown** for crypt_pkg.encryptStringRaw (DB package; must produce the value compared in BR-DOC-14).

**BR-AUTH-10 - Two-tier role model (summary)**
- Admin (ADM): container FD_GESTAO + FD_GESTAO_SIID (all document operations) + all configuration forms.
- Regular user: container FD_GESTAO_USER + FD_GESTAO_SIID_USER (monitor + suspend/resume/clone, see BR-DOC-35).
- There is no data-level filtering by user in either document form (no `CRIADO_POR = user` predicate anywhere): restriction is purely functional.
- Confidence: clear for the forms; OQ-2 for the menus.

### 2.2 Document lifecycle and operations (DOC)

All rules in this section are from FD_GESTAO_SIID (admin). Where FD_GESTAO_SIID_USER differs it is said explicitly; BR-DOC-35 summarises the restricted variant.

**BR-DOC-01 - Document list: data source, default sort and default filter**
- Given the document screen opens
- When WHEN-NEW-FORM-INSTANCE runs
- Then block SVR_DOCUMENTOS queries view SVR_DOCUMENTOS_VW, sorted by ID DESC (button "Spool" is highlighted), filter "Todos" (no WHERE), GLOBAL.KEEP_QUERY='0', two fresh temp-table ids are taken from SEQ_SVR_GS_TMP (GLOBAL.SELEC_TABLE_ID for check-box selection, GLOBAL.SEARCH_TABLE_ID for parameter search), window title `DOCUMENTOS - <ambiente>`.
- Source: FD_GESTAO_SIID :: WHEN-NEW-FORM-INSTANCE; ORDENAR_POR.
- Confidence: clear.

**BR-DOC-02 - Visual state of a document row**
- Given a fetched document
- When POST-QUERY runs
- Then: DISPONIBILIDADE='OFF' -> row styled OFFLINE; DISPONIBILIDADE='ANU' or ATRIBUTO9='A' -> row styled ANULADO; if `COUNT(*) FROM SVR_DOCUMENTO_COMENTARIOS WHERE DOCUMENTO_ID=id` > 0 the COMENTARIO cell shows `***` (raised).
- Source: FD_GESTAO_SIID :: POST-QUERY (SVR_DOCUMENTOS).
- Confidence: clear.

**BR-DOC-03 - Document and queue status vocabularies**
- Document ESTADO (computed by SVR_DOCUMENTOS_VW): NULL = not yet executed; A EXECUTAR = queued for generation; EXECUCAO = being generated; IMPRESSO exists only in commented code. Annulled = ATRIBUTO9='A' (also DISPONIBILIDADE='ANU'). Offline = DISPONIBILIDADE='OFF' (document belongs to a backup, BACKUP_ID set).
- Queue TIPO_QUEUE_RF: EXECUCAO, IMPRESSAO, 2.VIA, COPIA, REENVIAR, EMAIL, TOXML, ARQUIVO, BACKUP. Queue ESTADO: ESPERA (new), ENQUEUED, EM EXECUCAO, EXECUCAO, TERMINADO, ERRO, CANCELLED, SUSPENSO.
- Transitions performed by the UI: (new) -> ESPERA on every enqueue; ESPERA -> SUSPENSO (Suspender); SUSPENSO -> ESPERA (Retomar); {TERMINADO, ESPERA, ENQUEUED, EM EXECUCAO, ERRO} -> CANCELLED (Cancelar, EXECUCAO type only); {ESPERA, TERMINADO} -> CANCELLED (single request cancel). All other transitions are made by the server (unknown).
- Source: FD_GESTAO_SIID :: filter buttons, SUSPENDER/RETOMAR OK, CANCELAR, SVR_QUEUE menu; view is a DB object.
- Confidence: clear for the UI transitions; **unknown** for how the view derives ESTADO (OQ-3).

**BR-DOC-04 - Quick filters (ORDENACAO_DOCUMENTOS buttons)**
- Given the document list
- When a filter button is pressed (in ENTER-QUERY mode the same code runs on mouse click after exit_form)
- Then the current selection is cleared (`DELETE FROM SVR_GESTAO_SIID_TMP WHERE TABLE_ID=SELEC_TABLE_ID`, "Seleccionar todos" unchecked), the data source is reset to svr_documentos_vw, the pressed filter is highlighted (GLOBAL.TIPO_SELECCAO) and the block is re-queried with:
  - **Todos**: no WHERE; sort reset to ID DESC if another sort was active.
  - **Não Executados**: `estado is null`.
  - **Em Erro**: documents whose most recent queue row per request family (REENVIAR counted as EXECUCAO) has ESTADO='ERRO' and is later than the last EXECUCAO row (`NVL(DATA_EXECUCAO, DATA_FINALIZACAO)` comparison; for EXECUCAO rows the own timestamp minus one day is used as threshold). Ids are materialised into SVR_GESTAO_SIID_TMP (SEARCH_TABLE_ID) and the block joins on it.
  - **A Executar**: `estado = 'A EXECUTAR' AND id >= (SELECT MIN(documento_id) FROM SVR_QUEUE WHERE ESTADO='EXECUCAO' AND TIPO_QUEUE_RF='EXECUCAO')`.
  - **Execução**: `estado = 'EXECUCAO' AND id >= (SELECT MIN(documento_id) FROM SVR_QUEUE WHERE ESTADO IN ('ESPERA','ENQUEUED') AND TIPO_QUEUE_RF='EXECUCAO')`.
  - **Em Branco** (executed documents with neither addressee nor reference): `DATA_EXECUCAO IS NOT NULL AND DECODE(DESTINATARIO,NULL,0,1) + DECODE(N_REFERENCIA,NULL,0, DECODE(MODELO_ID,'R3.D25',0,'R3.D25R',0,'R3.D27',0,'R3.D27R',0,['R3.D28',0,'R3.D28R',0,]1)) = 0 AND MODELO_ID NOT LIKE 'M%' AND DECODE(MODELO_ID,'I1.D55','A',MODELO_ID) NOT LIKE 'I%' AND MODELO_ID NOT IN ('O1.OD58','O2.OD61','O2.OD69')` (the R3.D28/R3.D28R exclusions exist only in the mouse-click variant of the trigger).
- Source: FD_GESTAO_SIID :: WHEN-BUTTON-PRESSED / WHEN-MOUSE-CLICK on ORDENACAO_DOCUMENTOS.TODOS, NAO_EXECUTADOS, EM_ERRO, A_EXECUTAR, EXECUCAO, EM_BRANCO.
- Parameters: the hard-coded model codes (R3.D25, R3.D25R, R3.D27, R3.D27R, R3.D28, R3.D28R, I1.D55, O1.OD58, O2.OD61, O2.OD69, prefixes M% and I%) must become configuration.
- Confidence: clear (Em Erro semantics: inferred from SQL; ask SME to confirm the intended definition).

**BR-DOC-05 - Column sorting toggles direction (ORDENAR_POR convention)**
- Given a sortable column header button (DATA_PEDIDO, MODELO, CRIADO_POR, REFERENCIA, DESTINATARIO, LOTE, SPOOL, ESTADO)
- When it is pressed
- Then the previously highlighted header returns to normal, the pressed one is bold, and the block ORDER BY becomes `<col> DESC` if it was `<col> ASC`, `<col> ASC` if it was `<col> DESC`, else `<col> <default>`; then EXECUTE_QUERY. The LOTE header sorts by `LOTE_ID, LOTE_ORDEM` (first press DESC, DESC).
- Source: FD_GESTAO_SIID :: ORDENAR_POR(P_COLUNA, P_TIPO, P_ITEM); WHEN-BUTTON-PRESSED (ORDENACAO_DOCUMENTOS.LOTE). Same procedure exists in FD_PERMISSOES_SIID, FD_NOVO_BACKUP, FD_GESTAO_IMPRESSORAS_DOC/USR, FD_CONFIGURACAO_MODELOS.
- Confidence: clear.

**BR-DOC-06 - Typing "IS NULL" in a query field filters on null**
- Given ENTER-QUERY mode
- When a field contains the text IS NULL (case-insensitive) and the query is executed
- Then `<column> IS NULL` is appended (with AND) to the block DEFAULT_WHERE and the field is cleared before executing.
- Source: FD_GESTAO_SIID :: KEY-EXEQRY / PRE-QUERY (SVR_DOCUMENTOS).
- Confidence: clear.

**BR-DOC-07 - Ad-hoc query criteria persist as the block filter (KEEP_QUERY)**
- Given a query executed by the user (KEY-EXEQRY)
- When :System.Last_Query contains WHERE
- Then the text between WHERE and `order by` is copied into the block DEFAULT_WHERE so that later re-queries (after operations) keep the same criteria. KEY-ENTQRY with KEEP_QUERY=0 resets the filter to "Todos", the data source to the plain view and the sort to ID DESC; when a parameter-search data source is active it is discarded and SEARCH_TABLE_ID rows are deleted.
- Source: FD_GESTAO_SIID :: KEY-EXEQRY, KEY-ENTQRY, PRE-QUERY (SVR_DOCUMENTOS).
- Confidence: clear (GLOBAL.KEEP_QUERY is only ever set to '0'; its "1" branch is dead).

**BR-DOC-08 - Multi-selection is kept server-side in SVR_GESTAO_SIID_TMP**
- Given the SELECCIONAR check box on a row
- When it is checked / unchecked
- Then a row (TABLE_ID=GLOBAL.SELEC_TABLE_ID, TMP_ID=document id) is inserted / deleted. "Seleccionar todos" walks every fetched record and inserts all (or clears all). Selection is emptied when a filter changes, when a new query starts (KEY-ENTQRY, POST-SELECT) and when the DOCUMENTOS window closes (ROLLBACK + delete of both SELEC and SEARCH ids).
- Source: FD_GESTAO_SIID :: WHEN-CHECKBOX-CHANGED (SVR_DOCUMENTOS.SELECCIONAR, ORDENACAO_DOCUMENTOS.SELECCIONAR_TODOS), POST-SELECT, WHEN-WINDOW-CLOSED.
- Confidence: clear. Note: "select all" only covers records already fetched by Forms, not the full result set.

**BR-DOC-09 - Batch operations require a selection (partially)**
- Given a batch button
- When no row is selected
- Then Regerar, Reenviar, Reenviar Email and Re-Arquivar show NAO_TEM_REGISTOS and stop; Reimprimir / 2ª Via / Cópia / Anular / Cancelar / Suspender / Retomar do not check and simply loop over an empty set.
- Source: FD_GESTAO_SIID :: WHEN-BUTTON-PRESSED (ORDENACAO_DOCUMENTOS.REGERAR, REENVIAR, REENVIAR_EMAIL, REARQUIVAR).
- Message: alert NAO_TEM_REGISTOS has no `AlertMessage` set — it shows blank (confirmed, source: forms-xml, OQ-13); pick real text for the rewrite.
- Confidence: clear.

**BR-DOC-10 - Reimprimir (print again)**
- Given selected documents
- When "Reimprimir" is pressed and the user confirms DESEJA_IMPRIMIR
- Then the REIMPRIMIR dialog opens with VALIDACAO='F': option 1 "Imprimir documentos para a impressora associada" (printer id NULL -> the server uses the document's own IMPRESSORA_ID) or option 2 "Outra impressora:" (LOV `SELECT ID, DESCRICAO, ENDERECO FROM SVR_IMPRESSORAS WHERE VALIDO='S' ORDER BY TO_NUMBER(ID)`; entering the printer field flips the radio to option 2). On OK, for each selected id: read ATRIBUTO9; if it is 'A' **and** VALIDACAO != 'F' the document is skipped and listed; otherwise REIMPRIMIR(id, printer_or_null, 'F') inserts SVR_QUEUE (ID_QUEUE_SEQ, TIPO_QUEUE_RF='IMPRESSAO', DATA_PEDIDO=SYSDATE, ESTADO='ESPERA', IMPRESSORA_ID, CRIADO_POR=P_USERNAME). COMMIT at the end.
- Consequence: with VALIDACAO='F' annulled documents **are** printed; only 2ª Via and Cópia skip them.
- Source: FD_GESTAO_SIID :: WHEN-BUTTON-PRESSED (ORDENACAO_DOCUMENTOS.REIMPRIMIR), WHEN-BUTTON-PRESSED (REIMPRIMIR.OK), WHEN-RADIO-CHANGED, REIMPRIMIR procedure, LOV_IMPRESSORAS.
- Messages: `Deseja imprimir os documentos selecionados?`; summary `Não foram impressos os documentos com os seguintes spool_id, por se encontrarem anulados:` + list.
- Confidence: clear. SME question: is printing annulled documents on plain Reimprimir intended?

**BR-DOC-11 - 2ª Via (second copy) requires a previous print**
- Given selected documents, dialog opened from "2ª Via" (VALIDACAO='V')
- When OK is pressed
- Then annulled documents are skipped (listed); for the others REIMPRIMIR(id, printer, 'V') reads SVR_DOCUMENTOS.N_IMPRESSOES (join to the model) and, if it is 0, shows `Para imprimir 2ª Via é necessário que o documento já tenha sido impresso.` and skips; otherwise enqueues TIPO_QUEUE_RF='2.VIA' in ESPERA.
- Source: FD_GESTAO_SIID :: WHEN-BUTTON-PRESSED (ORDENACAO_DOCUMENTOS.VIA), REIMPRIMIR.
- Confidence: clear.

**BR-DOC-12 - Cópia (copy)**
- Given selected documents, dialog opened from "Cópia" (VALIDACAO='C')
- When OK is pressed
- Then annulled documents are skipped (listed); the others get TIPO_QUEUE_RF='COPIA' in ESPERA, with the chosen or associated printer. No prior-print requirement.
- Source: FD_GESTAO_SIID :: WHEN-BUTTON-PRESSED (ORDENACAO_DOCUMENTOS.COPIA), REIMPRIMIR.
- Confidence: clear.

**BR-DOC-13 - Regerar (regenerate) and when it needs the password**
- Given selected documents
- When "Regerar" is pressed and DESEJA_REGERAR is confirmed
- Then the form scans the selection: if any document has `COUNT(*) FROM SVR_QUEUE WHERE DOCUMENTO_ID=id AND TIPO_QUEUE_RF='IMPRESSAO' AND ESTADO='TERMINADO'` > 0 (already printed) **or** its model has MODO_EXPEDICAO_RF='G', the CONFIRMAR_PASSWORD dialog is shown (BR-DOC-14); otherwise regeneration runs immediately. Regeneration of one id = REGERAR(id): annulled (ATRIBUTO9='A') documents are skipped and listed; others get a SVR_QUEUE row (TIPO_QUEUE_RF='EXECUCAO', ESTADO='ESPERA', CRIADO_POR=P_USERNAME) plus an ERR_ERROS_SIID audit row (ID_ERROS_SEQ, TIPO_ERROSIID='ERRO_DOC', DATA_ERRO=SYSDATE, DESCRICAO=`DOCUMENTO REGERADO POR <user>`, DOCUMENTO_ID). COMMIT.
- Source: FD_GESTAO_SIID :: WHEN-BUTTON-PRESSED (ORDENACAO_DOCUMENTOS.REGERAR), REGERAR.
- Messages: `Deseja regerar os documentos selecionados?`; `Não foram Regerados os documentos com os seguintes spool_id, por se encontrarem anulados:`.
- Confidence: clear. SME question: meaning of MODO_EXPEDICAO_RF values G, W, I (domain MODO_EXPEDICAO).

**BR-DOC-14 - CONFIRMAR_PASSWORD dialog (regeneration password)**
- Given the CONFIRMAR_PASSWORD window ("Insira a password para regerar o(s) documento(s) seleccionado(s):")
- When "Confirmar" is pressed
- Then `crypt_pkg.encryptStringRaw(:CONFIRMAR_PASSWORD.PASSWORD)` is compared with `SVR_VARIAVEIS_SIID.VALOR WHERE AMBIENTE_ID=:GLOBAL.AMBIENTE_ID AND TIPO_VARIAVEL_RF='PASSWORD'`; equal -> the Regerar loop of BR-DOC-13 runs and focus returns to the list; different -> alert PASSWORD_ERRADA and focus stays in the dialog. "Cancelar" commits nothing new and returns to the list. Only Regerar uses this dialog (all other operations are unprotected).
- Source: FD_GESTAO_SIID :: WHEN-BUTTON-PRESSED (CONFIRMAR_PASSWORD.CONFIRMAR / CANCELAR).
- Message: `A password inserida está errada.`
- Confidence: clear; algorithm unknown (see BR-AUTH-09).

**BR-DOC-15 - Anular (annul)**
- Given selected documents
- When "Anular" is pressed and DESEJA_ANULAR is confirmed
- Then for each id `PKG_DOCUMENTOS_SVR.ANULAR(TO_CHAR(id), P_USERNAME)` is called and the current row is restyled ANULADO; COMMIT. No pre-condition is checked in the form.
- Source: FD_GESTAO_SIID :: WHEN-BUTTON-PRESSED (ORDENACAO_DOCUMENTOS.ANULAR), ANULA.
- Message: `Deseja anular os documentos selecionados?`
- Confidence: clear for the call; **unknown** for what ANULAR does (presumably sets ATRIBUTO9='A' / DISPONIBILIDADE='ANU'; OQ-4).

**BR-DOC-16 - Cancelar (cancel generation requests)**
- Given selected documents
- When "Cancelar" is pressed and DESEJA_CANCELAR is confirmed
- Then `UPDATE SVR_QUEUE SET ESTADO='CANCELLED' WHERE TIPO_QUEUE_RF='EXECUCAO' AND ESTADO IN ('TERMINADO','ESPERA','ENQUEUED','EM EXECUCAO','ERRO') AND DOCUMENTO_ID=id`; COMMIT. Exception: when :PARAMETER.P_USERNAME = 'AFREITAS' the ESTADO restriction is dropped (every EXECUCAO row of the document is cancelled).
- Source: FD_GESTAO_SIID :: WHEN-BUTTON-PRESSED (ORDENACAO_DOCUMENTOS.CANCELAR).
- Message: `Deseja cancelar os documentos selecionados?`
- Parameters: hard-coded super-user AFREITAS - must become a role/permission.
- Confidence: clear.

**BR-DOC-17 - Reenviar (re-send to EDoc)**
- Given selected documents (at least one, else NAO_TEM_REGISTOS)
- When "Reenviar" is pressed and DESEJA_REENVIAR is confirmed
- Then for each id: `v_modo := DECODE(MODELO.MODO_EXPEDICAO_RF,'W', DECODE(PKG_SIID_UTIL.CAN_BE_UPLOADED_EDOC(id),0,'I',MODELO.MODO_EXPEDICAO_RF), MODELO.MODO_EXPEDICAO_RF)`; if v_modo != 'W' the document is skipped and listed; otherwise REENVIAR(id) inserts SVR_QUEUE (TIPO_QUEUE_RF='REENVIAR', ESTADO='ESPERA', CRIADO_POR=P_USERNAME) and an ERR_ERROS_SIID audit row with DESCRICAO=`DOCUMENTO REGERADO POR <user>` (sic - same text as Regerar). COMMIT. The historical check "must have been printed" is commented out.
- Source: FD_GESTAO_SIID :: WHEN-BUTTON-PRESSED (ORDENACAO_DOCUMENTOS.REENVIAR), REENVIAR.
- Messages: `Deseja reenviar os documentos selecionados?`; `Não foram Reenviados os documentos com os seguintes spool_id, por não serem documentos para o EDoc:`.
- Confidence: clear; **unknown** for CAN_BE_UPLOADED_EDOC (OQ-5).

**BR-DOC-18 - Reenviar Email (re-send by e-mail)**
- Given selected documents (at least one)
- When "Reenviar Email" is pressed and DESEJA_REENVIAR is confirmed
- Then for each id: `v_email := MAX(ATRIBUTO01) FROM SVR_QUEUE WHERE TIPO_QUEUE_RF='EMAIL' AND DOCUMENTO_ID=id`; if null the document is skipped and listed; otherwise REENVIA_EMAIL(id, v_email) inserts SVR_QUEUE (TIPO_QUEUE_RF='EMAIL', ESTADO='ESPERA', CRIADO_POR, ATRIBUTO01=v_email) and an audit row `DOCUMENTO REENVIADO POR EMAIL POR <user>PARA <email>`. COMMIT.
- Consequence: a document can only be e-mailed again to an address it was already e-mailed to; there is no address entry.
- Source: FD_GESTAO_SIID :: WHEN-BUTTON-PRESSED (ORDENACAO_DOCUMENTOS.REENVIAR_EMAIL), REENVIA_EMAIL.
- Message: `Não foram Reenviados os documentos com os seguintes spool_id, por não serem documentos de Email:`.
- Confidence: clear.

**BR-DOC-19 - Re-Arquivar (re-archive)**
- Given selected documents (at least one)
- When "Re-Arquivar" is pressed and the confirmation alert (object DESEJA_RECRIAR, text "Deseja re-arquivar…") is accepted
- Then for each id: `DECODE(NVL(ARQ_ID,0),0,'N','S')`; 'N' -> skipped and listed; 'S' -> REARQUIVAR(id) inserts SVR_QUEUE (TIPO_QUEUE_RF='ARQUIVO', ESTADO='ESPERA') and audit row `DOCUMENTO ARQUIVADO POR <user>`. COMMIT.
- Source: FD_GESTAO_SIID :: WHEN-BUTTON-PRESSED (ORDENACAO_DOCUMENTOS.REARQUIVAR), REARQUIVAR.
- Messages: `Deseja re-arquivar os documentos selecionados?`; `Não foram Re-Arquivados os documentos com os seguintes spool_id, por não serem documentos para ARQUIVO:`.
- Confidence: clear.

**BR-DOC-20 - Recriar XML / Fatura electrónica**
- Given a document
- When RECRIAR(id) is invoked
- Then SVR_QUEUE gets TIPO_QUEUE_RF='TOXML', ESTADO='ESPERA', CRIADO_POR=P_USERNAME and an audit row `DOCUMENTO XML RECRIADO POR <user>`.
- Source: FD_GESTAO_SIID :: RECRIAR. **Resolved from the Forms2XML dump:** the ORDENACAO_DOCUMENTOS.FATURAELECTRONICA button is a SORT button — its trigger is `Ordenar_Por('FATURA_ELECTRONICA','ASC')` — not an action. RECRIAR has no caller in the current forms (dead code); the alert text `Deseja recriar os XMLs dos documentos seleccionados?` survives only in the v2 draft.
- Confidence: clear (OQ-6 resolved). Rewrite: expose "Fatura electrónica" as a sortable column, not as an operation; do not implement TOXML unless the business asks for it.

**BR-DOC-21 - Suspender (suspend waiting requests)**
- Given the SUSPENDER dialog (radio OPC_SUSPENDER: 1 = "Suspender documentos seleccionados", 2 = "Suspender todos os documentos em espera")
- When OK is pressed
- Then option 1: `UPDATE SVR_QUEUE SET ESTADO='SUSPENSO'` for every queue row with ESTADO='ESPERA' whose DOCUMENTO_ID is in the selection; option 2: every queue row with ESTADO='ESPERA' in the whole table (any document, any request type). No confirmation alert; commit happens on the next KEY-COMMIT/queue action (no explicit COMMIT in this trigger).
- Source: FD_GESTAO_SIID :: WHEN-BUTTON-PRESSED (SUSPENDER.OK). Also present in FD_GESTAO_SIID_USER.
- Confidence: clear. SME question: "suspend all" affecting print/e-mail/backup requests too - intended?

**BR-DOC-22 - Retomar (resume)**
- Given the RETOMAR dialog (same radio: selected / all)
- When OK is pressed
- Then rows in ESTADO='SUSPENSO' (selected documents, or all) go back to ESTADO='ESPERA'.
- Source: FD_GESTAO_SIID :: WHEN-BUTTON-PRESSED (RETOMAR.OK). Also in FD_GESTAO_SIID_USER.
- Messages (labels): `Retomar documentos seleccionados` / `Retomar todos os documentos suspensos`.
- Confidence: clear.

**BR-DOC-23 - Cancelling a single queue request from the queue window**
- Given the QUEUES window (block SVR_QUEUE for the current document)
- When a queue row is current, the popup item ESTADO_PEDIDO.CANCELAR is visible only if ESTADO in ('ESPERA','TERMINADO') (ESTADO_PEDIDO.RETOMAR hidden in query mode); on "Cancelar" the alert CONFIRMAR asks `Deseja cancelar este pedido?`
- Then `UPDATE SVR_QUEUE SET ESTADO='CANCELLED' WHERE ID=:SVR_QUEUE.ID AND ESTADO IN ('ESPERA','TERMINADO')`, COMMIT, re-query.
- Source: FD_GESTAO_SIID :: WHEN-NEW-RECORD-INSTANCE (SVR_QUEUE), menu ESTADO_PEDIDO.CANCELAR code. Also in FD_GESTAO_SIID_USER.
- Confidence: clear.

**BR-DOC-24 - Queue window display rules**
- Given a queue row of type IMPRESSAO, COPIA or 2.VIA
- When POST-QUERY runs
- Then IMPRESSORA shows `descricao - endereco` of SVR_IMPRESSORAS for the queue IMPRESSORA_ID if set, otherwise of the document's IMPRESSORA_ID. Clicking a non-empty RESULTADO opens the text editor (read the server result). Block content: queue rows of the current document (inferred from `documento_id = :SVR_DOCUMENTOS.ID` strings).
- Source: FD_GESTAO_SIID :: POST-QUERY (SVR_QUEUE), WHEN-NEW-ITEM-INSTANCE (SVR_QUEUE.RESULTADO).
- Confidence: clear / inferred (block WHERE).

**BR-DOC-25 - Clonar documento (create a new document from an existing one)**
- Given the CLONAR window for the current document: block CLONAR_DOCUMENTO lists the document's parameters (NOME, VALOR, editable VALOR_TEMP; names P_ID and _USER excluded - inferred from the strings `nome not in ('P_ID','_USER')`), VALOR_TEMP values are copied over VALOR on open
- When "Clonar" is pressed
- Then for every parameter with a non-null VALOR: `PKG_DOCUMENTOS_SVR.SET_PARAMETRO_STRING(NOME, VALOR)`; then SET_PARAMETRO_STRING('P_USUARIO', <user>), SET_PARAMETRO_STRING('_USER', :GLOBAL.AMBIENTE_ID); `PKG_DOCUMENTOS_SVR.EXECUTA(:SVR_DOCUMENTOS.MODELO_ID)`; `v_id := pkg_documentos_svr.get_id_execucao`; `UPDATE SVR_DOCUMENTOS SET LOTE_ID = :GLOBAL.LOTE_CLONE_ID WHERE ID = v_id` (FORMS_DDL); COMMIT; window hidden; list re-queried.
- Source: FD_GESTAO_SIID :: WHEN-BUTTON-PRESSED (CLONAR.CLONAR), WHEN-NEW-BLOCK-INSTANCE (CLONAR_DOCUMENTO). Also in FD_GESTAO_SIID_USER.
- Confidence: clear for the calls; resolved (source: forms-xml, OQ-7): GLOBAL.LOTE_CLONE_ID is set by the CLONAR opener from the source document's LOTE_ID, and v_utilizador (passed as P_USUARIO) is assigned `:PARAMETER.P_USERNAME` — the logged-in user at clone time, not the original document's creator. **unknown**: what EXECUTA does (OQ-4).

**BR-DOC-26 - Parameter value conversion helper (CONVERTE_PARAM)**
- Given a parameter named P_NMRECIBO or P_CDPERSON in the clone window or the search window
- When the user double-clicks its value
- Then the CONVERTE_PARAM dialog asks for a business key and writes back: P_NMRECIBO -> `SELECT NMRECIBO FROM MRECIBO WHERE NMRECINUE = <input>`; P_CDPERSON -> `SELECT CDPERSON FROM MPERSONA WHERE CDIDEPER = <input>` (lookup errors are silently ignored).
- Source: FD_GESTAO_SIID :: WHEN-MOUSE-DOUBLECLICK (CLONAR_DOCUMENTO.VALOR / VALOR_TEMP, PROCURAR_PARAMETROS.VALOR), WHEN-BUTTON-PRESSED (CONVERTE_PARAM.OK). Title `Conversão de Parametros`.
- Confidence: clear.

**BR-DOC-27 - Procurar por parâmetros (search documents by parameter values)**
- Given the PARAMETROS window: rows PROCURAR_PARAMETROS (NOME, VALOR) and optional PROCURAR.MODELO_PROCURAR ("Procurar apenas no modelo:")
- When "Procurar" is pressed
- Then SEARCH_TABLE_ID rows are deleted; the first row with a VALOR seeds the set: `SELECT DISTINCT DOCUMENTO_ID FROM SVR_PARAMETROS_DOC_NOME_VW WHERE NOME=:nome AND VALOR LIKE :valor [AND MODELO_ID LIKE :modelo]`; every further row with a VALOR intersects (`DELETE … WHERE TMP_ID NOT IN (matching docs)`); if the final count is 0 -> alert NAO_OBTEVE_DADOS; else the block data source becomes `svr_documentos_vw, svr_gestao_siid_tmp` joined on `id = tmp_id AND table_id = SEARCH_TABLE_ID` and is queried. Values are used verbatim as LIKE patterns (user supplies % wildcards).
- Source: FD_GESTAO_SIID :: WHEN-BUTTON-PRESSED (PROCURAR.PROCURAR). Also in FD_GESTAO_SIID_USER.
- Message: `A consulta não obteve documentos.`
- Confidence: clear.

**BR-DOC-28 - Mostrar Grupo (navigate the batch / attachments of a document)**
- Given the current document
- When "Mostrar Grupo" is pressed
- Then if MODELO_ID in (R3.D25, R3.D25R, R3.D27, R3.D27R, D1.A7, D1.A7R, D1.A5, D1.A5R): the list is filtered to the same LOTE_ID (or `LOTE_ID IS NULL`), with LOTE_ORDEM between the greatest order <= current and the smallest order > current found in the *paired* model (R3.D25<->D1.A7, R3.D25R<->D1.A7R, R3.D27<->D1.A5, R3.D27R<->D1.A5R); when LOTE_ID or LOTE_ORDEM is null the filter is instead `DESTINATARIO = <current>` (if set) plus `DESTINATARIO IS NULL AND MODELO_ID IN (<pair>)`. For any other model: the parent document (via SVR_ANEXOS_DOCUMENTO where ANEXODOC_ID = current, else the document itself) and all its attachments (`id IN (parent, anexos…)`).
- Source: FD_GESTAO_SIID :: WHEN-BUTTON-PRESSED (GENERICO.VER_IMPRESSOES / "Mostrar Grupo").
- Parameters: the eight model codes and their pairing must become configuration.
- Confidence: clear (business meaning of the pairs: SME).

**BR-DOC-29 - Mostrar Documento (open the PDF)**
- Given the current document
- When "Mostrar Documento" is pressed
- Then `WEB.SHOW_DOCUMENT(url,'_black')` with url = `http://ssiidt.cosec.pt:8090/FileServerSIID/restapi/FileServer/pdf/T?spoolid=<ID>` if :GLOBAL.AMBIENTE_ID LIKE '%TESTE%', else `http://ssiid-prod.cosec.pt:8090/FileServerSIID/restapi/FileServer/pdf/P?spoolid=<ID>`.
- Source: FD_GESTAO_SIID :: WHEN-BUTTON-PRESSED (GENERICO "Mostrar Documento"). Same in FD_GESTAO_SIID_USER.
- Parameters: two host URLs and the environment test (`%TESTE%`) are hard-coded.
- Confidence: clear.

**BR-DOC-30 - Comments on a document**
- Given the COMENTARIOS window (block SVR_DOCUMENTO_COMENTARIOS, DEFAULT_WHERE `documento_id = <current id>`)
- When a new comment is saved
- Then PRE-INSERT assigns COMENTARIO_ID from ID_COMENTARIO_DOCUMENTO_SEQ (USER_ID left to the block default; the forced 'EQUIPDOC' value is commented out); "Save" commits, hides the window and returns to the list; the list shows `***` on documents that have comments (BR-DOC-02).
- Source: FD_GESTAO_SIID :: PRE-INSERT, POST-INSERT, WHEN-MOUSE-CLICK (SVR_DOCUMENTO_COMENTARIOS.SAVE), WHEN-NEW-BLOCK-INSTANCE.
- Confidence: clear (USER form has the block but no PRE/POST-INSERT trigger text - comments there appear read-only; inferred).

**BR-DOC-31 - Detail windows: parameters, logs, details**
- PARAMETROS window: block SVR_PARAMETROS_DOCUMENTO for the current document, hiding names `_USER` (and `P_ID` in the clone/search variants) - inferred from block WHERE strings.
- LOGS window: block ERR_ERROS_SIID for the current document (WHERE not visible; inferred).
- DETALHES_DOCUMENTO window: read-only detail of the current SVR_DOCUMENTOS row.
- Source: FD_GESTAO_SIID :: WHEN-NEW-BLOCK-INSTANCE (SVR_PARAMETROS_DOCUMENTO, ERR_ERROS_SIID), "Detalhes" button.
- Confidence: inferred.

**BR-DOC-32 - Hourly tablespace gauge (WHEN-TIMER-EXPIRED)**
- Given the document screen open
- When timer REFRESH_TS expires (created on form open with a 1 ms repeat so it fires immediately; then re-created with 60*60*1000 ms = 1 hour, no repeat)
- Then for the tablespace of table SVR_DOCUMENTOS (data) and of index DOCUMENTO_PK (index), read GD_ESPACO_BD: `width = ROUND(MB_OCUPADO / DECODE(MB_QUOTA,-1, MB_OCUPADO+MB_LIVRES, MB_QUOTA) * 200)`, label `<MB ocupado> MB / <MB total> MB` (format FM999G990); if width > 180 (i.e. > 90 %) the bar uses the TS_ALARM attribute, else TS_NORMAL; TS_DATA_ACTUALIZACAO = SYSDATE.
- Source: FD_GESTAO_SIID :: WHEN-TIMER-EXPIRED, WHEN-NEW-FORM-INSTANCE (timer creation).
- Parameters: 1 hour period; 90 % alarm threshold.
- Confidence: clear.

**BR-DOC-33 - Window-close behaviour**
- Closing COMENTARIOS, PARAMETROS, QUEUES, LOGS, CONVERTE_PARAM, REIMPRIMIR, CLONAR, SUSPENDER, RETOMAR or DETALHES_DOCUMENTO returns focus to the list (PARAMETROS, CLONAR, SUSPENDER, RETOMAR are hidden). Closing DOCUMENTOS issues ROLLBACK, deletes the temp rows of both SELEC_TABLE_ID and SEARCH_TABLE_ID and COMMITs.
- Source: FD_GESTAO_SIID :: WHEN-WINDOW-CLOSED.
- Confidence: clear.

**BR-DOC-34 - Explicit commit semantics**
- KEY-COMMIT: COMMIT_FORM if the form has pending changes, otherwise FORMS_DDL('COMMIT') (to flush the FORMS_DDL/temp-table work). Every batch operation ends with FORMS_DDL('COMMIT'), so queue inserts are committed as a batch, not per document.
- Source: FD_GESTAO_SIID :: KEY-COMMIT and every batch trigger.
- Confidence: clear.

**BR-DOC-35 - Restricted variant FD_GESTAO_SIID_USER**
- Given a non-ADM user (container FD_GESTAO_USER)
- When the document screen opens
- Then the same list, filters (Todos / Não Executados / Em Erro / A Executar / Execução), sorting, selection, parameter search, comments, parameters, queue, logs, details, Mostrar Documento / Grupo, Clonar, Suspender, Retomar and single-request cancel are available; the buttons Regerar, Reimprimir, 2ª Via, Cópia, Anular, Cancelar (batch), Reenviar, Reenviar Email, Re-Arquivar and Fatura electrónica do not exist (no button labels, no trigger code). The CONFIRMAR_PASSWORD block and the REGERAR/REENVIA_EMAIL procedures are still compiled in but unreachable (dead code). No row-level restriction.
- Source: FD_GESTAO_SIID_USER :: whole module (diff against FD_GESTAO_SIID: 0 occurrences of DESEJA_REGERAR/ANULAR/CANCELAR/IMPRIMIR/REENVIAR/RECRIAR and of REARQUIVAR/RECRIAR calls).
- Confidence: clear.

**BR-DOC-36 - Every re-queue writes an audit line in ERR_ERROS_SIID**
- Given any of Regerar, Reenviar, Reenviar Email, Re-Arquivar, Recriar
- When the queue row is inserted
- Then an ERR_ERROS_SIID row (ID_ERROS_SEQ, TIPO_ERROSIID='ERRO_DOC', DATA_ERRO=SYSDATE, DOCUMENTO_ID) is inserted with DESCRICAO: `DOCUMENTO REGERADO POR <user>` (Regerar and Reenviar), `DOCUMENTO REENVIADO POR EMAIL POR <user>PARA <email>`, `DOCUMENTO ARQUIVADO POR <user>`, `DOCUMENTO XML RECRIADO POR <user>`. Reimprimir / 2ª Via / Cópia / Anular / Cancelar / Suspender / Retomar / Backup write no audit line.
- Source: FD_GESTAO_SIID :: REGERAR, REENVIAR, REENVIA_EMAIL, REARQUIVAR, RECRIAR.
- Confidence: clear.

**BR-DOC-37 - Legacy PDF location algorithm (disabled, kept for data migration)**
- The commented-out code documents how PDFs were located before the REST file server: directory = SVR_VARIAVEIS_SIID value of type PDF for the environment, split on `;` into `<gerados>;<backup>`; path `<gerados>\YYYY\MM\DD\<NOME_OUTPUT>.pdf` (DATA_PEDIDO); if DISPONIBILIDADE='OFF' the base is `SVR_BACKUPS.DRIVE_ONLINE\NOME`; fallbacks try `<backup>\YYYY\MM\DD`, `\YYYY\MM\D`, `\YYYY\MM\DD-MM-YYYY`, `\DD-MM-YYYY`, `\YYYY\DD-MM-YYYY` for DATA_EXECUCAO + 0..7 days; failure message `Ficheiro não foi encontrado.<path>`.
- Source: FD_GESTAO_SIID :: "Mostrar Documento" trigger (commented block), FILE_EXISTS.
- Confidence: clear that it is disabled; useful only if old backups must be served.

### 2.3 Permissions (PERM) - FD_PERMISSOES_SIID

**BR-PERM-01 - What a permission is**
- A row of CFG_PERMISSOES_SIID: MODELO_ID, USERNAME (= CDEMPLEA), UNIDADE_NEGOCIO_RF (= CDDEPARTA), TIPO_PERMISSAO_RF (domain key), DATA_INICIO, DATA_FIM (nullable = open-ended), CRIADO_POR, DATA_CRIACAO, ACTUALIZADO_POR, DATA_ACTUALIZACAO. Logical key (per developer comment and every UPDATE predicate): (USERNAME, MODELO_ID, UNIDADE_NEGOCIO_RF, TIPO_PERMISSAO_RF, DATA_INICIO). The grid reads view DOC_PERMISSOES_IMPRESSAO (CDEMPLEA, CDDEPARTA, MODELO_ID, TIPO_PERMISSAO designation, DATA_INICIO, DATA_FIM).
- Source: FD_PERMISSOES_SIID :: all INSERT/UPDATE statements.
- Confidence: clear (view definition unknown, OQ-8).

**BR-PERM-02 - Default listing shows only permissions valid today**
- Given the form opens
- When the grid is queried
- Then DEFAULT_WHERE = `SYSDATE BETWEEN DATA_INICIO AND NVL(data_fim, SYSDATE + 1)`; the "Todos" header button clears the filter; other headers sort (ORDENAR_POR, default TIPO_PERMISSAO ASC). The per-user and per-model panels (PERMISSOES_USER, PERMISSOES_MODELOS) use the same validity predicate.
- Source: FD_PERMISSOES_SIID :: WHEN-NEW-FORM-INSTANCE, ORDENAR_PERMISSOES.TODOS, PRE-QUERY (PERMISSOES_USER / PERMISSOES_MODELOS).
- Confidence: clear.

**BR-PERM-03 - Lookups used by the permission screens**
- Business units: `SELECT DESIGNACAO, CHAVE FROM CFG_VALORES_DOMINIO WHERE DOMINIO_ID='UNIDADE_NEGOCIO' ORDER BY PRIORIDADE, DESIGNACAO`. Permission types: same with DOMINIO_ID='TIPO_PERMISSAO' ORDER BY PRIORIDADE, CHAVE. Users of a unit: `SELECT NOME, USERNAME, AMBIENTE_ID FROM CFG_UTILIZADORES_VW WHERE UNIDADE_NEGOCIO_RF = :unit ORDER BY 1,3`; user LOV for new permission: CFG_UTILIZADORES_VW joined to the UNIDADE_NEGOCIO domain (CDEMPLEA, CDDEPARTA designation, CODIGO). Models valid today: `SELECT ID FROM DOC_MODELOS_DOCUMENTO WHERE SYSDATE BETWEEN DATA_INICIO AND NVL(DATA_FIM, SYSDATE+1) ORDER BY ID`.
- Source: FD_PERMISSOES_SIID :: record groups / LOVs.
- Confidence: clear.

**BR-PERM-04 - Nova permissão (single add)**
- Given the NOVA_PERMISSAO dialog
- When OK is pressed
- Then MODELO_ID, CDEMPLEA, CDDEPARTA, DATA_INI and TIPO_PERMISSAO are mandatory (DATA_FIM optional) else alert OBRIGATORIO; then overlap check `COUNT(*) FROM CFG_PERMISSOES_SIID WHERE USERNAME=:CDEMPLEA AND MODELO_ID=:MODELO_ID AND TIPO_PERMISSAO_RF=:TIPO AND UNIDADE_NEGOCIO_RF=:CDDEPARTA AND :DATA_INI <= NVL(DATA_FIM, DATE '9999-12-31') AND NVL(:DATA_FIM, DATE '9999-12-31') >= DATA_INICIO`; if > 0 the alert OBRIGATORIO is re-used with text `ERRO: Permissão já existe válida para o intervalo definido!!`; else INSERT with CRIADO_POR=:GLOBAL.USERNAME, DATA_CRIACAO=SYSDATE, COMMIT, re-query. Any exception -> trigger failure (silent).
- Source: FD_PERMISSOES_SIID :: WHEN-BUTTON-PRESSED (NOVA_PERMISSAO.OK).
- Message: `Todos os campos são obrigatórios, excepto a data de fim.`
- Confidence: clear.

**BR-PERM-05 - Alterar permissão (change validity dates)**
- Given ALTERAR_PERMISSAO pre-filled from the current grid row (keeps DATA_INI_ANTERIOR / DATA_FIM_ANTERIOR)
- When OK is pressed
- Then DATA_INI is mandatory (alert OBRIGATORIO_DATA_INICIO); TIPO_PERMISSAO designation is resolved to CHAVE via CFG_VALORES_DOMINIO (DOMINIO_ID='TIPO_PERMISSAO'; not found -> `ERRO: Tipo de permissão inválido!`); overlap check as in BR-PERM-04 but excluding rows whose DATA_INICIO = DATA_INI_ANTERIOR; overlap -> `ERRO: O intervalo de datas sobrepõe-se a uma permissão já existente!`; else UPDATE DATA_INICIO, DATA_FIM, ACTUALIZADO_POR, DATA_ACTUALIZACAO on the row identified by the logical key with DATA_INICIO = DATA_INI_ANTERIOR; COMMIT.
- Source: FD_PERMISSOES_SIID :: WHEN-BUTTON-PRESSED (ALTERAR_PERMISSAO.OK).
- Message: `O Campo 'Data de Início' é de preenchimento obrigatório.`
- Confidence: clear.

**BR-PERM-06 - Anular permissão (soft delete from the grid)**
- Given the current grid row
- When "Retirar Permissão" is pressed and the alert CONFIRMAR_ANULACAO (`Deseja anular a permissão do utilizador <CDEMPLEA> para o documento <MODELO_ID>?`) is accepted
- Then `UPDATE CFG_PERMISSOES_SIID SET DATA_FIM = TO_DATE('01/01/1980','DD/MM/RRRR'), ACTUALIZADO_POR, DATA_ACTUALIZACAO` on the logical key (TIPO_PERMISSAO designation resolved to CHAVE); COMMIT; re-query. Rows are never physically deleted.
- Source: FD_PERMISSOES_SIID :: WHEN-BUTTON-PRESSED (grid "Retirar Permissão").
- Confidence: clear.

**BR-PERM-07 - Bulk add from the user panel**
- Given CTR_USERS_SIID filled with UNIDADE_NEGOCIO_RF, UTILIZADOR and TIPO_PERMISSAO_RF (changing any of them re-queries "Sem Permissão" = MODELOS_SEM_PERMISSAO and "Com Permissão" = PERMISSOES_USER)
- When ADD_PERMISSAO (selected rows, toggled by clicking, ESCOLHIDO='S') or ADD_TODOS is pressed
- Then for each (selected) model without permission: INSERT CFG_PERMISSOES_SIID (model, user, unit, DATA_INICIO=SYSDATE, DATA_FIM=TO_DATE('31-12-2200','DD/MM/YYYY'), type, CRIADO_POR=:GLOBAL.USERNAME, DATA_CRIACAO=SYSDATE); COMMIT; both lists re-queried. No overlap check is done here (unlike BR-PERM-04).
- Source: FD_PERMISSOES_SIID :: WHEN-MOUSE-CLICK (CTR_USERS_SIID.ADD_PERMISSAO / ADD_TODOS), WHEN-LIST-CHANGED, KEY-NXTBLK.
- Confidence: clear.

**BR-PERM-08 - Bulk remove from the user panel**
- Given the "Com Permissão" list for the same user/unit/type
- When REMOVE_PERMISSAO (selected) or REMOVE_TODOS is pressed
- Then each affected row gets `DATA_FIM = SYSDATE - 1, ACTUALIZADO_POR, DATA_ACTUALIZACAO` (matched on model, unit, type, user and DATA_INICIO); COMMIT; lists re-queried. Note the two different "end" sentinels: 01/01/1980 (annul from grid) vs SYSDATE-1 (remove from panels).
- Source: FD_PERMISSOES_SIID :: WHEN-MOUSE-CLICK (CTR_USERS_SIID.REMOVE_PERMISSAO / REMOVE_TODOS).
- Confidence: clear.

**BR-PERM-09 - Same bulk add/remove from the model panel**
- Given CTR_MODELOS_SIID (UNIDADE_NEGOCIO_RF, MODELO, TIPO_PERMISSAO_RF) with lists UTILIZADORES_SEM_PERMISSAO / PERMISSOES_MODELOS
- When ADD/REMOVE (selected/all) is pressed
- Then identical behaviour to BR-PERM-07/08 with the roles of user and model swapped (users are taken from CFG_UTILIZADORES_VW of the chosen unit).
- Source: FD_PERMISSOES_SIID :: CTR_MODELOS_SIID triggers.
- Confidence: clear.

**BR-PERM-10 - Copiar permissões de modelo (copy all permissions from one model to another)**
- Given COPIAR_PERMISSOES (MODELO_ID = target, MODELO_ID_COPIAR = source)
- When OK is pressed
- Then `INSERT INTO CFG_PERMISSOES_SIID SELECT :target, USERNAME, UNIDADE_NEGOCIO_RF, DATA_INICIO, DATA_FIM, TIPO_PERMISSAO_RF, :GLOBAL.USERNAME, SYSDATE FROM CFG_PERMISSOES_SIID PERM WHERE MODELO_ID=:source AND SYSDATE <= NVL(DATA_FIM, SYSDATE) AND NOT EXISTS (target row with same USERNAME, UNIDADE_NEGOCIO_RF, TIPO_PERMISSAO_RF and overlapping period, open-ended handled with 9999-12-31)`; COMMIT; re-query.
- Source: FD_PERMISSOES_SIID :: WHEN-BUTTON-PRESSED (COPIAR_PERMISSOES.OK).
- Confidence: clear.

**BR-PERM-11 - Copiar permissões de utilizador (copy from one user+unit to another)**
- Given COPIAR_PERMISSOES_UTILIZADOR (CDEMPLEA/CDDEPARTA = target, CDEMPLEA_COPIAR/CDDEPARTA_COPIAR = source)
- When OK is pressed
- Then non-expired rows of the source user+unit are inserted for the target user+unit keeping model, dates and type, skipping models where the target already has an overlapping permission of the same type; COMMIT; dialog fields cleared.
- Source: FD_PERMISSOES_SIID :: WHEN-BUTTON-PRESSED (COPIAR_PERMISSOES_UTILIZADOR.OK).
- Confidence: clear.

### 2.4 Models / templates (MOD) - FD_CONFIGURACAO_MODELOS

**BR-MOD-01 - Model entity and its lookups**
- DOC_MODELOS_DOCUMENTO columns handled: ID (text code), DESCRICAO, TIPO_DOCUMENTO_RF, REPORT_ID, N_ANEXOS, MAX_IMPRESSOES, N_COPIAS ("Nº de Cópias"), FORMA_CONTROLO_RF, DATA_INICIO, DATA_FIM, MODO_EXPEDICAO_RF, MODO_CERTIFICADO_RF, MODO_PROTECAO_RF, STAMP, GENERICO_ID ("Tipo Genérico"), BARCODE_* and audit columns. Lists: MODO_EXPEDICAO, MODO_CERTIFICADO, MODO_PROTECAO from CFG_VALORES_DOMINIO (ORDER BY PRIORIDADE, CHAVE); STAMP from domain BINARIO; barcode type from domain `CODIGOS BARRAS`; GENERICO_ID from `SELECT DESCRICAO, ID FROM DOC_MODELOS_DOCUMENTO WHERE TIPO_DOCUMENTO_RF='GNR' UNION SELECT 'DOC. NÃO GENERICO', NULL`. Header buttons (CONSULTA block) sort by ID, DESCRICAO, COPIAS, REIMPRESSAO, DATA_INICIO, DATA_FIM, GENERICO_ID, MODO_EXPEDICAO_RF, MODO_CERTIFICADO_RF, STAMP, MODO_PROTECAO_RF; "Todos" clears the filter.
- Source: FD_CONFIGURACAO_MODELOS :: WHEN-NEW-FORM-INSTANCE, record groups, CONSULTA.* triggers.
- Confidence: clear.

**BR-MOD-02 - Alterar modelo**
- Given EDITAR_MODELO opened with title "Alterar Modelo" (double-click on a model - inferred)
- When "Confirmar" is pressed
- Then `UPDATE DOC_MODELOS_DOCUMENTO SET DESCRICAO, N_COPIAS, FORMA_CONTROLO_RF, DATA_INICIO, DATA_FIM, ACTUALIZADO_POR=:GLOBAL.USERNAME, DATA_ACTUALIZACAO=SYSDATE WHERE ID=:EDITAR_MODELO.ID`; COMMIT_FORM.
- Source: FD_CONFIGURACAO_MODELOS :: WHEN-BUTTON-PRESSED (EDITAR_MODELO.CONFIRMAR), WHEN-MOUSE-DOUBLECLICK (DOC_MODELOS_DOCUMENTO).
- Confidence: clear.

**BR-MOD-03 - Clonar modelo**
- Given EDITAR_MODELO opened with title "Clonar Modelo" (pre-filled from the current model; ID editable)
- When "Confirmar" is pressed
- Then if a model with the new ID exists -> alert MODELO_EXISTENTE and focus on ID; else alert CLONAR (`Esta operação é irreversível.` / `Quer criar um novo modelo à semelhança do existente?`, button 2 cancels); then INSERT the model (new ID, TIPO_DOCUMENTO_RF, REPORT_ID, N_ANEXOS, MAX_IMPRESSOES copied from the source; DESCRICAO, N_COPIAS, FORMA_CONTROLO_RF, DATA_INICIO, DATA_FIM from the dialog; CRIADO_POR, DATA_CRIACAO), copy all DOC_SECCOES_DOCUMENTO rows (TIPOCNTD_ID, IMAGEM, FORMULA_ID, TIPOSEC_ID, ALINEA, TITULO, TEXTO) and all DOC_CONDICOES_APR rows (all columns incl. CDUNIECO, CDRAMO, ATRIBUTO1..8, dates) to the new ID; COMMIT_FORM. Barcode settings, expedition/certificate/protection modes, stamp, printers, permissions and default parameters are **not** copied.
- Source: FD_CONFIGURACAO_MODELOS :: WHEN-BUTTON-PRESSED (EDITAR_MODELO.CONFIRMAR), "Clonar" button.
- Message: `Já existe um modelo com esta referência`.
- Confidence: clear.

**BR-MOD-04 - Sections: numbering, audit, sorting**
- Given a new DOC_SECCOES_DOCUMENTO row
- When PRE-INSERT runs
- Then `TIPOCNTD_ID := NVL(MAX(TIPOCNTD_ID),0)` over the same MODELO_ID + TIPOSEC_ID (as coded: the maximum, not maximum + 1), CRIADO_POR=:GLOBAL.USERNAME, DATA_CRIACAO=SYSDATE. Section headers toggle sort between `ALINEA, TIPOSEC_ID` and `TIPOSEC_ID, ALINEA` (ASC/DESC).
- Source: FD_CONFIGURACAO_MODELOS :: PRE-INSERT (DOC_SECCOES_DOCUMENTO), CONSULTA_SECCOES.ALINEA / ID_SECCAO.
- Confidence: clear (SME: is TIPOCNTD_ID = MAX intentional?).

**BR-MOD-05 - Clonar alínea**
- Given the current section
- When "Clonar" (section) is pressed and alert CLONAR (`…Quer criar uma nova alinea à semelhança da existente?`) is accepted
- Then a copy is inserted with `ALINEA = MAX(ALINEA)+1` within MODELO_ID + TIPOSEC_ID, same TIPOCNTD_ID, IMAGEM, FORMULA_ID, TITULO, TEXTO, CRIADO_POR=:GLOBAL.USERNAME, DATA_CRIACAO=SYSDATE, ACTUALIZADO_* null; COMMIT_FORM; refresh. Conditions of the section are not copied.
- Source: FD_CONFIGURACAO_MODELOS :: section "Clonar" trigger.
- Confidence: clear.

**BR-MOD-06 - Section image: upload, type detection, removal**
- Given a section
- When "Abrir Ficheiro…" is used: `client_get_file_name(directory :global.user_home, filter JPG/PNG/All)` fills FILE_NAME; "BT_CLIENT_DB" then calls `PKG_TRANSFERTS.Client_To_DB(file, 'DOC_SECCOES_DOCUMENTO', 'IMAGEM', "MODELO_ID='…' AND TIPOSEC_ID='…' AND ALINEA=…")` (WebUtil CLIENT_TO_DB): success -> COMMIT + `File stored in the database`; failure -> alert AL_ERROR titled `Client to DB` with `Error when transfering <file>`; the block is re-queried.
- When a section is displayed: the first bytes of IMAGEM are compared with signatures FFD8FFE0 -> JPEG, 89504E47 -> PNG, 47494638 -> GIF, 504E4745 -> TIFF (as coded), 49492A00 / 4D4D002A / contains 424D -> BMP, else UNKNOWN, into TIPO_IMAGEM.
- When "remove image" is pressed: `UPDATE DOC_SECCOES_DOCUMENTO SET IMAGEM = NULL` for the section, refresh.
- Source: FD_CONFIGURACAO_MODELOS :: BT_SELECT, BT_CLIENT_DB, POST-QUERY/WHEN-NEW-RECORD-INSTANCE (DOC_SECCOES_DOCUMENTO), remove trigger; PKG_TRANSFERTS (form-level package wrapping WEBUTIL_FILE_TRANSFER).
- Confidence: clear. Note: the old draft also supported DB_To_Client download and host commands (BR-MOD-15).

**BR-MOD-07 - Conditions (DOC_CONDICOES_APR)**
- Given a section (master) and its conditions (detail)
- When a condition is inserted: `CONTEXTO_ID := NVL(MAX(CONTEXTO_ID),0)` over MODELO_ID + TIPOSEC_ID (as coded). When the section is deleted while conditions exist: `Impossível apagar registo mestre se existirem registos de detalhe correspondentes.` and the delete fails. Editable fields: CONTEXTO_ID, CDUNIECO, CDRAMO, ATRIBUTO1..8, DATA_INICIO, DATA_FIM.
- Source: FD_CONFIGURACAO_MODELOS :: PRE-INSERT (DOC_CONDICOES_APR), ON-CHECK-DELETE-MASTER (DOC_SECCOES_DOCUMENTO), ON-POPULATE-DETAILS.
- Confidence: clear.

**BR-MOD-08 - Report parameters of a model and their current default**
- Given the model's REPORT_ID
- When block SVR_PARAMETROS_REPORT is queried
- Then for each parameter the currently valid default is loaded: `SELECT VALOR, DATA_INICIO, DATA_FIM, NOME_CONSULTA, CONSULTA_ONLINE FROM DOC_PARAMETROS_OMISSAO WHERE SYSDATE BETWEEN DATA_INICIO AND NVL(DATA_FIM, SYSDATE) AND N_PARAMETRO=… AND MODELO_ID=… AND ROWNUM=1 ORDER BY DATA_INICIO DESC` (no row -> empty, CONSULTA_ONLINE='N'); DETALHES shows `***` when any default (current or historical) exists.
- Source: FD_CONFIGURACAO_MODELOS :: POST-QUERY (SVR_PARAMETROS_REPORT).
- Confidence: clear (ROWNUM before ORDER BY means "any matching row", not necessarily the latest).

**BR-MOD-09 - Saving default parameter values (versioned by date)**
- Given the PARAMETROS_REPORT window is being closed
- When each parameter row is processed
- Then (a) row has no DATA_INICIO and at least one of NOME_CONSULTA, CONSULTA_ONLINE != 'N', VALOR, DATA_FIM filled = **new default**: if no open-ended default exists for (model, parameter) -> INSERT with DATA_INICIO = TRUNC(SYSDATE) (or the given date); else if the given DATA_INICIO is after the open default's start -> close the open default (`DATA_FIM = new start - 1`) and INSERT the new one; else INSERT a historical row whose DATA_FIM = (smallest later DATA_INICIO) - 1. (b) row has DATA_INICIO: if an identical row exists (same start, end, value, query, online flag) nothing happens; if a row with the same start exists -> UPDATE VALOR, DATA_FIM, NOME_CONSULTA, CONSULTA_ONLINE, ACTUALIZADO_POR, DATA_ACTUALIZACAO; otherwise the insert logic of (a) applies. Every branch ends with FORMS_DDL('COMMIT'); then OnS_Ask_Commit and a PARAMETROS_REPORT timer refresh the screen. Inserted rows carry CRIADO_POR=:GLOBAL.USERNAME, DATA_CRIACAO=SYSDATE.
- Source: FD_CONFIGURACAO_MODELOS :: WHEN-WINDOW-CLOSED (event window PARAMETROS_REPORT).
- Confidence: inferred (very long trigger, branches reconstructed from fragments; SME must confirm the intended versioning rule).

**BR-MOD-10 - Validations on default-parameter dates**
- Given DOC_PARAMETROS_OMISSAO / SVR_PARAMETROS_REPORT rows in NORMAL mode
- When DATA_INICIO or DATA_FIM changes
- Then DATA_INICIO > DATA_FIM -> `A data de inicio é superior à data de fim.`; DATA_INICIO falling inside another row's interval for the same model/parameter (`:DATA_INICIO BETWEEN DATA_INICIO AND NVL(DATA_FIM, SYSDATE)`, other ROWID) -> `A data de inicio econtra-se num intervalo já definido.`; same test on DATA_FIM -> `A data de fim econtra-se num intervalo já definido.`; each raises FORM_TRIGGER_FAILURE.
- Source: FD_CONFIGURACAO_MODELOS :: POST-CHANGE (DATA_INICIO / DATA_FIM on DOC_PARAMETROS_OMISSAO and SVR_PARAMETROS_REPORT), PRE-UPDATE.
- Confidence: clear.

**BR-MOD-11 - eDoc and archive attributes**
- DOC_ATRIBUTOS_EDOC (MODELO_ID, EDOC_ID, CDRAMO) and DOC_ATRIBUTOS_ARQUIVO (MODELO_ID, ARQ_ID, CDRAMO, "Localização do arquivo") are listed per model; only CDRAMO is updatable (PRE-UPDATE issues `UPDATE … SET CDRAMO = :CDRAMO WHERE MODELO_ID=… AND EDOC_ID/ARQ_ID=…`).
- Source: FD_CONFIGURACAO_MODELOS :: PRE-UPDATE (DOC_ATRIBUTOS_EDOC / DOC_ATRIBUTOS_ARQUIVO), POST-CHANGE (CDRAMO).
- Confidence: clear.

**BR-MOD-12 - Barcode settings**
- Given EDITAR_CODIGO_BARRAS opened for the current model (loads BARCODE_FORMAT, BARCODE_WEIGHT, BARCODE_HEIGHT, BARCODE_TYPE, BARCODE_X_POSITION, BARCODE_Y_POSITION; hint `(Origem do documento é o canto superior esquerdo e medida em cm)`)
- When "Confirmar" is pressed
- Then UPDATE those six columns + ACTUALIZADO_POR/DATA_ACTUALIZACAO on DOC_MODELOS_DOCUMENTO. BARCODE_TYPE values come from domain `CODIGOS BARRAS`.
- Source: FD_CONFIGURACAO_MODELOS :: WHEN-NEW-BLOCK-INSTANCE / CONFIRMAR (EDITAR_CODIGO_BARRAS).
- Confidence: clear.

**BR-MOD-13 - Unsaved-changes prompt (ASK_COMMIT)**
- Given a block with status CHANGED in NORMAL mode
- When the user leaves the block/record (POST-BLOCK/POST-RECORD -> OnS_Ask_Commit) unless GLOBAL.ASK_COMMIT='FALSE' (set once by KEY-EXEQRY, which resets it to TRUE after consuming)
- Then a one-tick timer ASK_COMMIT fires and the form asks `Deseja gravar as alterações efectuadas?` (alert ASK_COMMIT; inferred text); ON-ROLLBACK uses a ROLLBACK timer + OnS_Rollback (FORMS_DDL ROLLBACK, refresh, restore cursor). KEY-EXIT and KEY-DELREC (`Delete_Record; OnS_Ask_Commit`) follow the same path.
- Source: FD_CONFIGURACAO_MODELOS :: ONS_ASK_COMMIT, ONS_ROLLBACK, WHEN-TIMER-EXPIRED, ON-ROLLBACK, KEY-DELREC.
- Confidence: inferred (timer handler body not fully visible).

**BR-MOD-14 - Master-detail clear/query and filter capture**
- ON-CLEAR-DETAILS uses the standard Clear_All_Master_Details (asks to commit the first changed detail block; cancelling aborts navigation) for relations model -> sections -> conditions and model -> report parameters -> defaults; ON-POPULATE-DETAILS queries conditions of the current section. KEY-EXEQRY on models/sections captures the WHERE of :System.Last_Query into DEFAULT_WHERE (same technique as BR-DOC-07).
- Source: FD_CONFIGURACAO_MODELOS :: ON-CLEAR-DETAILS, ON-POPULATE-DETAILS, KEY-EXEQRY, CLEAR_ALL_MASTER_DETAILS, QUERY_MASTER_DETAILS.
- Confidence: clear.

**BR-MOD-15 - The _old draft**
- FD_CONFIGURACAO_MODELOS_old differs only in the file-transfer plumbing: it used PKG_FICHIERS.Selection (WebUtil file dialog), supported DB_To_Client download, host commands (`Host() command error`, `Error removing local file`, `Error on storing file`, `Error transfering local file`) and Java-bean checks. All business rules above are identical. Treat it as superseded; do not migrate its extra transfer paths.
- Confidence: clear.

### 2.5 Backups (BKP) - FD_NOVO_BACKUP, FD_BACKUPS_ONLINE, FD_TIPOS_MiDIA, FD_UNIDADES_MEDIDA

**BR-BKP-01 - Backup entity**
- SVR_BACKUPS: ID (SEQ_BACKUP_ID), NOME, MES_BACKUP (first day of the month), TIPO_MIDIA_ID, DESTINO, OBSERVACOES, MEDIA_ONLINE ('S'/'N'), DRIVE_ONLINE, TAMANHO_GBYTES, CRIADO_POR = DB USER, DATA_CRIACAO = SYSDATE (PRE-INSERT). A document belongs to at most one backup (SVR_DOCUMENTOS.BACKUP_ID).
- Source: FD_NOVO_BACKUP :: PRE-INSERT (BACKUPS).
- Confidence: clear.

**BR-BKP-02 - Which months and documents can be backed up**
- Month list: `SELECT DISTINCT TO_CHAR(TRUNC(DATA_IMPRESSAO,'MONTH'),'YYYY-MM'), TO_CHAR(TRUNC(DATA_IMPRESSAO,'MONTH'),'DD/MM/YYYY') FROM SVR_DOCUMENTOS WHERE BACKUP_ID IS NULL AND DATA_IMPRESSAO IS NOT NULL ORDER BY 1 DESC` ("Meses para Backup"). Documents offered for the chosen month (block DOCS_PORBACKUP): `BACKUP_ID IS NULL AND TRUNC(DATA_IMPRESSAO,'MONTH') = :BACKUPS.MES_BACKUP` (inferred from block strings); i.e. only *printed* documents not yet backed up. Sortable by TAMANHO_BYTES and DATA_IMPRESSAO.
- Source: FD_NOVO_BACKUP :: record group MES_BACKUP, DOCS_PORBACKUP block, ORDENAR_POR.
- Confidence: clear / inferred (block WHERE).

**BR-BKP-03 - Backup name and destination are generated**
- Given a month is chosen
- When MES_BACKUP changes
- Then `NOME := 'COSEC_' || TO_CHAR(MES_BACKUP,'YYYYMM') || '_' || TO_CHAR(COUNT(existing SVR_BACKUPS WHERE NOME LIKE 'COSEC_YYYYMM%') + 1, '00')` (e.g. COSEC_202401_01, COSEC_202401_02) and `DESTINO := <SVR_VARIAVEIS_SIID.VALOR of type BACKUP for GLOBAL.AMBIENTE_ID> || NOME`.
- Source: FD_NOVO_BACKUP :: WHEN-VALIDATE/POST-CHANGE (BACKUPS.MES_BACKUP), WHEN-NEW-FORM-INSTANCE.
- Parameters: prefix `COSEC_`, two-digit counter, variable BACKUP.
- Confidence: clear.

**BR-BKP-04 - Validation before a backup is created**
- Given the selection of documents (running total TOTAL_BACKUP)
- When "Criar" (OK) is pressed
- Then NOME must be filled (alert NOME); when the document list is queried NOME is required; CONTROL_BLOCK.MIDIA_ID must be filled (alert TIPO_MIDIA); `CFG_TIPOS_MiDIA.TAMANHO_BYTES` of the medium must be >= TOTAL_BACKUP (else alert TAMANHO_MIDIA); at least one document must be selected (`COUNT(*) FROM SVR_GESTAO_SIID_TMP WHERE TABLE_ID = SELEC_TABLE_ID > 0`); only then `EXIT_FORM(DO_COMMIT)`.
- Source: FD_NOVO_BACKUP :: WHEN-BUTTON-PRESSED (OK), NOME check.
- Messages: `O campo 'Nome' é de preenchimento obrigatório.`; `O campo 'Tipo Mídia' é de preenchimento Obrigatorio.`; `O tamanho do Mídia não suporta todos os documentos que seleccionou.`
- Confidence: clear.

**BR-BKP-05 - What committing a backup does**
- Given the backup row is committed
- When POST-INSERT/POST-COMMIT runs
- Then for each selected document: `UPDATE SVR_DOCUMENTOS SET BACKUP_ID = :BACKUPS.ID` and `INSERT INTO SVR_QUEUE (ID_QUEUE_SEQ, TIPO_QUEUE_RF='BACKUP', DOCUMENTO_ID, DATA_PEDIDO=SYSDATE, ESTADO='ESPERA', CRIADO_POR=:GLOBAL.USERNAME)`; the temp selection is deleted. The physical copy is done by the server (unknown).
- Source: FD_NOVO_BACKUP :: POST-INSERT (BACKUPS) / cursor DOCUMENTOS_BACKUP.
- Confidence: clear.

**BR-BKP-06 - Selection and running total**
- Checking a document adds NVL(TAMANHO_BYTES,0) to TOTAL_BACKUP and inserts the temp row; unchecking subtracts and deletes; "Seleccionar todos" recomputes the total over all fetched rows. Media LOV shows `TAMANHO_BYTES/1000/1000/1000` as GBYTES.
- Source: FD_NOVO_BACKUP :: WHEN-CHECKBOX-CHANGED (DOCS_PORBACKUP.SELECCIONAR, CONTROL_BLOCK.SELECCIONAR_TODOS), LOV.
- Confidence: clear.

**BR-BKP-07 - Media types**
- CFG_TIPOS_MiDIA: DESIGNACAO, TAMANHO_BYTES, GEN_MEDIDA_RF (default 'DIGITAL'), UNIDADE_MEDIDA_ID (LOV: units of the same GEN_MEDIDA_RF ordered by FACTOR), FACTOR copied from CFG_UNIDADES_MEDIDA (default 1 when not found), CRIADO_POR = DB USER, DATA_CRIACAO = SYSDATE.
- Source: FD_TIPOS_MiDIA :: PRE-INSERT, POST-CHANGE (UNIDADE_MEDIDA_ID).
- Confidence: clear (how TAMANHO_BYTES is derived from the unit x factor is not in the form - OQ-11).

**BR-BKP-08 - Units of measure**
- CFG_UNIDADES_MEDIDA: ID, NOME, FACTOR, GEN_MEDIDA_RF, UNIDADE_BASE_ID (base units have UNIDADE_BASE_ID NULL and are offered as base for the others). Pure CRUD.
- Source: FD_UNIDADES_MEDIDA.
- Confidence: clear.

**BR-BKP-09 - Backups online / offline**
- Given FD_BACKUPS_ONLINE: OFFLINE list = backups with MEDIA_ONLINE='N' (TAMANHO_BACKUP = `SUM(TAMANHO_BYTES)/1024/1024` of its documents, labelled GB although computed in MB), ONLINE list = MEDIA_ONLINE='S'
- When selected offline backups are moved online: `UPDATE SVR_BACKUPS SET MEDIA_ONLINE='S', DRIVE_ONLINE = (SELECT NVL(MAX(VALOR),'E:\') FROM SVR_VARIAVEIS_SIID WHERE AMBIENTE_ID=:GLOBAL.AMBIENTE_ID AND TIPO_VARIAVEL_RF='ONLINE')`; when selected online backups are taken offline: `MEDIA_ONLINE='N', DRIVE_ONLINE=NULL`; COMMIT; both lists re-queried. This only records where the medium is mounted; the document availability flag (DISPONIBILIDADE) is maintained by the server (unknown).
- Source: FD_BACKUPS_ONLINE :: WHEN-BUTTON-PRESSED (online / offline), POST-QUERY (OFFLINE).
- Parameters: default drive `E:\`; variable ONLINE.
- Confidence: clear.

### 2.6 Printers (PRN) - FD_IMPRESSORAS_SIID, FD_GESTAO_IMPRESSORAS_DOC, FD_GESTAO_IMPRESSORAS_USR

**BR-PRN-01 - Printer catalogue**
- SVR_IMPRESSORAS: ID (ID_IMPRESSORA_SEQ), DESCRICAO, ENDERECO, GSDEVICE_RF (domain GSDEVICES ordered by PRIORIDADE), VALIDO ('S'/'N'), CRIADO_POR=:GLOBAL.USERNAME, DATA_CRIACAO=SYSDATE. Only VALIDO='S' printers are offered when re-printing (BR-DOC-10).
- Source: FD_IMPRESSORAS_SIID :: PRE-INSERT, record group RG_GSDEVICES.
- Confidence: clear.

**BR-PRN-02 - Printer associated to a model (DOC_IMPRESSORAS_DOC)**
- Row: MODELO_ID, AMBIENTE_ID (= owner of the MRECIBO synonym), IMPRESSORA_ID, DATA_INICIO, DATA_FIM, audit.
- Create (NOVA_IMPRESSORA): allowed only if `verificar_datas_criar` returns 1, i.e. DATA_INI <= DATA_FIM and no existing row for the model has `data_inicio BETWEEN ini-1 AND fim` or `data_fim BETWEEN ini AND fim-1`; otherwise alert DATAS_INCOMPAT. Update (ALTERAR_IMPRESSORA): same check ignoring the row being edited (matched by its previous dates); updates dates + ACTUALIZADO_POR/DATA_ACTUALIZACAO. Annul: confirm `Deseja anular a impressora '<impressora>' para o documento <modelo>?` then set DATA_INICIO = DATA_FIM = 01/01/1980. Printer shown as `id - descricao - endereco`.
- Source: FD_GESTAO_IMPRESSORAS_DOC :: verificar_datas_criar, verificar_datas_actualizar, NOVA_IMPRESSORA.OK, ALTERAR_IMPRESSORA.OK, annul button.
- Messages: `As datas de início e de fim que introduziu são incompatíveis com outra configuração já introduzida.` + `Por favor, altere as configurações de modo a eliminar a incompatibilidade.`
- Confidence: clear. Note: the overlap test is per model regardless of printer, so a model can have only one printer per period.

**BR-PRN-03 - Printer associated to a user and model (DOC_IMPRESSOES_MODELO_USR)**
- Row: MODELO_ID, CDEMPLEA (LOV `SELECT CDIDUSR FROM M_USUARIOS`), IMPRESSORA_ID, DATA_INICIO, DATA_FIM, audit. Same create/update/annul rules as BR-PRN-02, with the overlap test scoped to (model, user). Copy: from model to model (`COPIAR_MODELO`: non-expired rows of the source model inserted for the target model unless the target already has the same user + DATA_INICIO) and from user to user (`COPIAR_UTILIZADOR`: non-expired rows of the source user inserted for the target user unless the same model + DATA_INICIO exists).
- Source: FD_GESTAO_IMPRESSORAS_USR :: all triggers.
- Message: `Deseja anular a impressora '<impressora>' do utilizador <cdemplea> para o documento <modelo>?`
- Confidence: clear.

**BR-PRN-04 - Which printer a print request uses**
- The form only stores the chosen printer on the queue row (BR-DOC-10) or leaves it NULL; the display rule falls back to the document's IMPRESSORA_ID (BR-DOC-24). How the server picks between DOC_IMPRESSORAS_DOC and DOC_IMPRESSOES_MODELO_USR when generating a document is not in the forms.
- Confidence: unknown (OQ-9).

### 2.7 Administration (ADM)

**BR-ADM-01 - Domains and domain values**
- CFG_DOMINIOS (master): ID, DESCRICAO, TIPO_INFORMACAO_RF (domain TIPO_INFORMACAO), TIPO_DOMINIO_RF (domain TIPO_DOMINIO), TIPO_STRING_RF (domain TIPO_STRING), FORMATACAO_STRING_RF (domain FORMATACAO_STRING), VALOR_MINIMO, VALOR_MAXIMO. TIPO_STRING/FORMATACAO fields are shown only when TIPO_INFORMACAO_RF='STRING'; VALOR_MINIMO/MAXIMO (and the LISTA tab) only when TIPO_DOMINIO_RF='I'. A domain cannot be deleted while it has values.
- CFG_VALORES_DOMINIO (detail): DOMINIO_ID, CHAVE, DESIGNACAO, DESCRICAO, DATA_INICIO (default SYSDATE), PRIORIDADE (default 0), VERSAO (default 0.0), DATA_REGISTO (SYSDATE), REGISTADO_POR (DB USER) - all NOT NULL (generated WHEN-VALIDATE-ITEM constraints SYS_C00443332..40).
- Domains referenced by the application: TIPO_AMBIENTE, TIPO_UTILIZADOR, UNIDADE_NEGOCIO, TIPO_PERMISSAO, TIPO_VARIAVEL, TIPO_PARAMETRO, GSDEVICES, MODO_EXPEDICAO, MODO_CERTIFICADO, MODO_PROTECAO, BINARIO, `CODIGOS BARRAS`, TIPO_INFORMACAO, TIPO_DOMINIO, TIPO_STRING, FORMATACAO_STRING.
- Source: FD_DOMINIOS_SIID :: ENABLE_STRINGS, ENABLE_VALORES, ON-CHECK-DELETE-MASTER, PRE-INSERT defaults.
- Message: `Impossível apagar registo mestre se existirem registos de detalhe correspondentes.`
- Confidence: clear.

**BR-ADM-02 - Users**
- CFG_UTILIZADORES: USERNAME, NOME, PASSWORD (stored as `user_security.ENCRYPT(:PASSWORD)`, never displayed), AMBIENTE_ID (list from `SELECT DESCRICAO, ID FROM SVR_AMBIENTES_IMPRESSAO`; new rows default to GLOBAL.AMBIENTE_ID), UNIDADE_NEGOCIO_RF (domain), TIPO_UTILIZADOR_RF (domain; 'ADM' = administrator), NIVEL_ACESSO_RF (default 0), DATA_INICIO, DATA_FIM. Validation: DATA_INICIO > DATA_FIM -> `A data de inicio é superior à data de fim.` (form failure). Window title `UTILIZADORES - <ambiente>`.
- Source: FD_UTILIZADORES_SIID :: WHEN-NEW-RECORD-INSTANCE, PRE-INSERT/PRE-UPDATE, POST-CHANGE.
- Confidence: clear (NIVEL_ACESSO_RF is never read by any form - OQ-10).

**BR-ADM-03 - Gestores = database accounts with SIID grants**
- Given FD_GESTORES_SIID (visible only when the session user is the schema owner, BR-AUTH-07)
- When a gestor is added / removed
- Then the form runs a fixed grant/revoke script for that DB user: SELECT/INSERT/UPDATE/DELETE on svr_gestao_siid_tmp, svr_queue, doc_permissoes_impressao, DOC_IMPRESSORAS_DOC, DOC_IMPRESSOES_MODELO_USR, doc_modelos_documento, doc_seccoes_documento, doc_condicoes_apr, svr_parametros_report, svr_documento_comentarios; SELECT on seq_svr_gs_tmp, ID_DOCUMENTO_SEQ, ID_QUEUE_SEQ, id_comentario_documento_seq, svr_documentos, svr_documentos_vw, err_erros_siid, svr_anexos_documento, svr_parametros_documento, svr_impressoras, mrecibo, svr_gestao_siid_directorias, gd_espaco_bd, mpersona; EXECUTE on pkg_documentos_svr. Candidate list: `ALL_USERS` minus accounts already granted INSERT on SVR_DOCUMENTO_COMENTARIOS by the owner minus `M_USUARIOS.CDIDUSR`. Commit + re-query after each change.
- Source: FD_GESTORES_SIID :: grant/revoke triggers, LOV.
- Confidence: clear. Rewrite impact: replace with an application role; DB grants become deployment configuration.

**BR-ADM-04 - Department profiles (signature blocks)**
- DOC_PERFIS_DEPARTAMENTO: ID = MAX(ID)+1, CDEMPLEA (LOV `SELECT CDEMPLEA, CDDEPARTA FROM CO_EMPLEADOS WHERE SWACTIVO='S'`), CODIGO (LOV `SELECT OTCLAVE1 FROM TTAPVAAT WHERE NMTABLA IN (6,7) AND OTCLAVE1 != 'NI' AND NOT EXISTS (profile with that code)`), FUNCAODEP_ID (LOV `DOC_FUNCOES_DEPARTAMENTO WHERE REGISTO_VALIDO='S'`), NOME, ASSINATURA (image chosen with the GetImageFileName Java bean and READ_IMAGE_FILE), TELEFONE, TELEMOVEL, EMAIL, DESCRICAO, DATA_INICIO, CRIADO_POR=:GLOBAL.USERNAME, DATA_CRIACAO=SYSDATE.
- Auto-fill: when CDEMPLEA is entered and CODIGO is empty, the form looks up TTAPVAAT rows (NMTABLA 6 -> function GCOM, 7 -> GCON) whose OTCLAVE1 contains `SUBSTR(CDEMPLEA, 3, LENGTH-3)` and that are not yet used, and fills CODIGO, FUNCAODEP_ID (kept if already chosen) and NOME (function name unless already set).
- Delete is allowed only for records not yet saved (DELETE_ALLOWED true only for NEW/INSERT status).
- Source: FD_PERFIS_DEPARTAMENTO :: PRE-INSERT, POST-CHANGE (CDEMPLEA), WHEN-NEW-RECORD-INSTANCE, image button.
- Confidence: clear (meaning of TTAPVAAT tables 6/7: SME).

**BR-ADM-05 - Report definitions and their parameters**
- SVR_REPORT_SIID: ID (id_template_report_seq), NOME, NOME_FICHEIRO, N_PARAMETROS, VALIDO, DIRECTORIA_BASE, DIRECTORIA_DESTINO, OBSERVACAO, CRIADO_POR = DB USER, DATA_CRIACAO. Detail SVR_PARAMETROS_REPORT: REPORT_ID, N_PARAMETRO (auto: 1 for the first, else MAX+1), NOME, TIPO_PARAMETRO_RF (domain TIPO_PARAMETRO), OBRIGATORIO, CHECK_UNIQUE, VALIDO, DESCRICAO.
- Fixed leading parameters: a new report automatically receives rows 1 `_USER` (type '2', mandatory), 2 `P_USUARIO` (type '1', mandatory), 3 `P_DATAACTUAL` (type '1', optional). Editing row 1/2/3 to another name is refused with ALERTA_1PARAM/2/3 and the name is restored; the NOME of those three is not updatable.
- On commit (KEY-COMMIT): the number of parameter rows must equal SVR_REPORT_SIID.N_PARAMETROS, otherwise alert N_PARAM_ERRADO, focus on N_PARAMETROS and the commit is aborted. A report with parameters cannot be deleted (`Impossível apagar registo mestre…`).
- Source: FD_CONFIGURACAO_REPORTS :: PRE-INSERT, WHEN-NEW-RECORD-INSTANCE, POST-CHANGE (NOME), KEY-COMMIT, ON-CHECK-DELETE-MASTER.
- Messages: `O 1º parâmetro é obrigatório ser '_USER'.`, `O 2º parâmetro é obrigatório ser 'P_USUARIO'.`, `O 3º parâmetro é obrigatório ser 'P_DATAACTUAL'.`, `O número de parâmetros inseridos tem que ser igual ao número de parâmetros na informação do relatório.`
- Confidence: clear.

**BR-ADM-06 - SIID variables**
- SVR_VARIAVEIS_SIID: AMBIENTE_ID (defaults to GLOBAL.AMBIENTE_ID), TIPO_VARIAVEL_RF (domain TIPO_VARIAVEL), VALOR. The list shows only the current environment and hides type PASSWORD (`TIPO_VARIAVEL_RF != 'PASSWORD' AND AMBIENTE_ID = …`). A type may appear only once per environment (POST-CHANGE walks the block; duplicate -> alert OK `Este tipo de variável já está associado.` and the value is cleared). Known types and consumers: PASSWORD (regeneration password, BR-AUTH-09/BR-DOC-14), BACKUP (backup base path, BR-BKP-03), ONLINE (online drive, BR-BKP-09), PDF (legacy `<gerados>;<backup>` paths, BR-DOC-37).
- Source: FD_VARIAVEIS_SIID :: WHEN-NEW-FORM-INSTANCE, WHEN-NEW-RECORD-INSTANCE, POST-CHANGE (TIPO_VARIAVEL_RF).
- Confidence: clear.

**BR-ADM-07 - Environments table**
- SVR_AMBIENTES_IMPRESSAO (ID, DESCRICAO, USERNAME) maps a DB account to an environment id; it feeds the AMBIENTE_ID list of users and the AMBIENTE_ID fallback of FD_UTILIZADORES_SIID. No maintenance form exists.
- Source: FD_UTILIZADORES_SIID :: record group RG_TIPO_AMBIENTE, WHEN-NEW-FORM-INSTANCE.
- Confidence: clear.

### 2.8 Cross-cutting conventions (XC)

**BR-XC-01 - Generic sort convention (ORDENAR_POR)** - every grid has header buttons; pressing one toggles ASC/DESC on that column (first press uses the declared default), highlights the header (GLOBAL.ORDENAR_POR / ORDENAR_SECCOES) and re-queries. Rewrite: sortable columns with tri-state toggle per grid. Confidence: clear.

**BR-XC-02 - FORMS_DDL usage inventory** (dynamic SQL that must be re-expressed): create/drop private synonyms (BR-AUTH-07); grant/revoke object privileges (BR-ADM-03); `COMMIT` / `ROLLBACK` outside the Forms transaction (all batch operations, BR-DOC-34); `UPDATE SVR_VARIAVEIS_SIID … PASSWORD` (BR-AUTH-09); `UPDATE SVR_DOCUMENTOS SET LOTE_ID …` after clone (BR-DOC-25); `INSERT INTO SVR_QUEUE / ERR_ERROS_SIID` in REGERAR (BR-DOC-13). Confidence: clear.

**BR-XC-03 - Privilege-based gating** - the only role checks are database catalogue lookups: USER_TAB_PRIVS (who granted the session user -> environment, hide GESTORES), USER_SYNONYMS (environment name for titles, synonym presence), ALL_USERS / M_USUARIOS (gestor candidates), ALL_OBJECTS / ALL_TABLES (owner of MRECIBO -> AMBIENTE_ID). Confidence: clear. Rewrite: replace with explicit tenant/environment configuration and application roles.

**BR-XC-04 - Date-range validations** - start must not exceed end: users (BR-ADM-02), default parameters (BR-MOD-10), printer associations (BR-PRN-02/03, with the neighbour-overlap variant), permissions (overlap with open-ended sentinel 9999-12-31, BR-PERM-04/05). Message texts differ slightly (`inicio` vs `início`). Confidence: clear.

**BR-XC-05 - Soft-delete and "forever" sentinels** - nothing is physically deleted in permissions or printer associations: annul = `DATA_FIM = 01/01/1980` (permissions) or `DATA_INICIO = DATA_FIM = 01/01/1980` (printers); remove = `DATA_FIM = SYSDATE-1`; open-ended = `DATA_FIM = 31-12-2200` (bulk adds) or NULL (single add, copy). The rewrite should pick one representation and migrate the data. Confidence: clear.

**BR-XC-06 - Audit columns** - CRIADO_POR/DATA_CRIACAO and ACTUALIZADO_POR/DATA_ACTUALIZACAO on every configuration table. CRIADO_POR is the *application* user (:GLOBAL.USERNAME / :PARAMETER.P_USERNAME) in permissions, printers, sections, backups' queue rows and all queue inserts, but the *database* user (USER) in SVR_BACKUPS, CFG_TIPOS_MiDIA, SVR_REPORT_SIID and CFG_VALORES_DOMINIO.REGISTADO_POR. Confidence: clear.

**BR-XC-07 - Test vs production detection** - `GLOBAL.AMBIENTE_ID LIKE '%TESTE%'` selects the test file server (BR-DOC-29). Confidence: clear.

**BR-XC-08 - Hard-coded values to externalise** - model codes and pairs (BR-DOC-04, BR-DOC-28), super-user `AFREITAS` (BR-DOC-16), backup name prefix `COSEC_` (BR-BKP-03), default drive `E:\` (BR-BKP-09), file-server URLs (BR-DOC-29), timer 1 h and 90 % alarm (BR-DOC-32), DB accounts per environment (BR-AUTH-03, masked), synonym/grant object lists (BR-AUTH-07, BR-ADM-03), report parameter names `_USER`, `P_USUARIO`, `P_DATAACTUAL`, `P_ID`, `P_NMRECIBO`, `P_CDPERSON` (BR-ADM-05, BR-DOC-25/26/31), image signatures (BR-MOD-06), sentinels (BR-XC-05). Confidence: clear.

---

## 3. Validation and message catalogue (verbatim Portuguese)

| # | Message / alert text | Alert or trigger | Raised by rule |
|---|---|---|---|
| 1 | `O 'Utilizador' é de preenchimento obrigatório.` | SEM_UTILIZADOR (FD_LOGIN_SIID) | BR-AUTH-01 |
| 2 | `A 'Password' é de preenchimento obrigatório.` | SEM_PASSWORD | BR-AUTH-01 |
| 3 | `Utilizador e/ou password inválidos.` | LOGIN_INVALIDO | BR-AUTH-04 |
| 4 | `Erro` | message on exception (login) | BR-AUTH-04 |
| 5 | `É obrigatório a aplicação ser 'aberta' a partir do formulário de Login.` | OUT (all forms) | BR-AUTH-06 |
| 6 | `As passwords não coincidem. Alteração não efectuada.` | PASSWORD_ERRADA (FD_ALTERAR_PASSWORD) | BR-AUTH-09 |
| 7 | `Deseja imprimir os documentos selecionados?` (USER form: `…seleccionados?`) | DESEJA_IMPRIMIR | BR-DOC-10/11/12 |
| 8 | `Imprimir documentos para a impressora associada` / `Outra impressora:` | REIMPRIMIR radio labels | BR-DOC-10 |
| 9 | `Não foram impressos os documentos com os seguintes spool_id, por se encontrarem anulados:` | OUT (dynamic) | BR-DOC-10/11/12 |
| 10 | `Para imprimir 2ª Via é necessário que o documento já tenha sido impresso.` | message | BR-DOC-11 |
| 11 | `Para reenviar é necessário que o documento já tenha sido impresso.` | message (commented out, never shown) | BR-DOC-17 |
| 12 | `Deseja regerar os documentos selecionados?` | DESEJA_REGERAR | BR-DOC-13 |
| 13 | `Não foram Regerados os documentos com os seguintes spool_id, por se encontrarem anulados:` | OUT (dynamic) | BR-DOC-13/14 |
| 14 | `Insira a password para regerar o(s) documento(s) seleccionado(s):` | CONFIRMAR_PASSWORD prompt | BR-DOC-14 |
| 15 | `A password inserida está errada.` | PASSWORD_ERRADA (FD_GESTAO_SIID) | BR-DOC-14 |
| 16 | `Deseja anular os documentos selecionados?` | DESEJA_ANULAR | BR-DOC-15 |
| 17 | `Deseja cancelar os documentos selecionados?` | DESEJA_CANCELAR | BR-DOC-16 |
| 18 | `Deseja reenviar os documentos selecionados?` | DESEJA_REENVIAR | BR-DOC-17/18 |
| 19 | `Não foram Reenviados os documentos com os seguintes spool_id, por não serem documentos para o EDoc:` | OUT (dynamic) | BR-DOC-17 |
| 20 | `Não foram Reenviados os documentos com os seguintes spool_id, por não serem documentos de Email:` | OUT (dynamic) | BR-DOC-18 |
| 21 | `Deseja re-arquivar os documentos selecionados?` (v2 draft: `Deseja recriar os XMLs dos documentos seleccionados?`) | DESEJA_RECRIAR | BR-DOC-19/20 |
| 22 | `Não foram Re-Arquivados os documentos com os seguintes spool_id, por não serem documentos para ARQUIVO:` | OUT (dynamic) | BR-DOC-19 |
| 23 | `Suspender documentos seleccionados` / `Suspender todos os documentos em espera` | SUSPENDER radio labels | BR-DOC-21 |
| 24 | `Retomar documentos seleccionados` / `Retomar todos os documentos suspensos` | RETOMAR radio labels | BR-DOC-22 |
| 25 | `Deseja cancelar este pedido?` | CONFIRMAR (queue) | BR-DOC-23 |
| 26 | `A consulta não obteve documentos.` | NAO_OBTEVE_DADOS | BR-DOC-27 |
| 27 | `Procurar por parâmetros` / `Procurar apenas no modelo:` | window/labels | BR-DOC-27 |
| 28 | `Conversão de Parametros` | CONVERTE_PARAM title | BR-DOC-26 |
| 29 | `Ficheiro não foi encontrado.<path>` | message (legacy, disabled) | BR-DOC-37 |
| 30 | (empty) — the XML shows alert NAO_TEM_REGISTOS has NO message text (Caution style, one button): the form pops a blank alert. Rewrite: use `Não existem documentos seleccionados.` | NAO_TEM_REGISTOS | BR-DOC-09 |
| 31 | `Todos os campos são obrigatórios, excepto a data de fim.` | OBRIGATORIO (FD_PERMISSOES_SIID) | BR-PERM-04 |
| 32 | `ERRO: Permissão já existe válida para o intervalo definido!!` | OBRIGATORIO (re-texted) | BR-PERM-04 |
| 33 | `O Campo 'Data de Início' é de preenchimento obrigatório.` | OBRIGATORIO_DATA_INICIO | BR-PERM-05 |
| 34 | `ERRO: Tipo de permissão inválido!` | OBRIGATORIO (re-texted) | BR-PERM-05 |
| 35 | `ERRO: O intervalo de datas sobrepõe-se a uma permissão já existente!` | OBRIGATORIO (re-texted) | BR-PERM-05 |
| 36 | `Deseja anular a permissão do utilizador <user> para o documento <modelo>?` | CONFIRMAR_ANULACAO | BR-PERM-06 |
| 37 | `Já existe um modelo com esta referência` | MODELO_EXISTENTE | BR-MOD-03 |
| 38 | `Esta operação é irreversível.` + `Quer criar um novo modelo à semelhança do existente?` | CLONAR | BR-MOD-03 |
| 39 | `Esta operação é irreversível.` + `Quer criar uma nova alinea à semelhança da existente?` | CLONAR | BR-MOD-05 |
| 40 | `File stored in the database` | message | BR-MOD-06 |
| 41 | `Error when transfering <file>` (title `Client to DB`) | AL_ERROR | BR-MOD-06 |
| 42 | `Impossível apagar registo mestre se existirem registos de detalhe correspondentes.` | ON-CHECK-DELETE-MASTER (MODELOS, DOMINIOS, REPORTS) | BR-MOD-07, BR-ADM-01, BR-ADM-05 |
| 43 | `A data de inicio é superior à data de fim.` | POST-CHANGE (MODELOS, UTILIZADORES) | BR-MOD-10, BR-ADM-02 |
| 44 | `A data de inicio econtra-se num intervalo já definido.` | POST-CHANGE DATA_INICIO | BR-MOD-10 |
| 45 | `A data de fim econtra-se num intervalo já definido.` | POST-CHANGE DATA_FIM | BR-MOD-10 |
| 46 | `Deseja gravar as alterações efectuadas?` | ASK_COMMIT (inferred) | BR-MOD-13 |
| 47 | `(Origem do documento é o canto superior esquerdo e medida em cm)` | barcode hint | BR-MOD-12 |
| 48 | `O campo 'Nome' é de preenchimento obrigatório.` | NOME (FD_NOVO_BACKUP) | BR-BKP-04 |
| 49 | `O campo 'Tipo Mídia' é de preenchimento Obrigatorio.` | TIPO_MIDIA | BR-BKP-04 |
| 50 | `O tamanho do Mídia não suporta todos os documentos que seleccionou.` | TAMANHO_MIDIA | BR-BKP-04 |
| 51 | `As datas de início e de fim que introduziu são incompatíveis com outra configuração já introduzida.` + `Por favor, altere as configurações de modo a eliminar a incompatibilidade.` | DATAS_INCOMPAT (IMPRESSORAS_DOC/USR) | BR-PRN-02/03 |
| 52 | `Deseja anular a impressora '<impressora>' para o documento <modelo>?` | CONFIRMAR_ANULACAO (IMPRESSORAS_DOC) | BR-PRN-02 |
| 53 | `Deseja anular a impressora '<impressora>' do utilizador <cdemplea> para o documento <modelo>?` | CONFIRMAR_ANULACAO (IMPRESSORAS_USR) | BR-PRN-03 |
| 54 | `O 1º parâmetro é obrigatório ser '_USER'.` | ALERTA_1PARAM | BR-ADM-05 |
| 55 | `O 2º parâmetro é obrigatório ser 'P_USUARIO'.` | ALERTA_2PARAM | BR-ADM-05 |
| 56 | `O 3º parâmetro é obrigatório ser 'P_DATAACTUAL'.` | ALERTA_3PARAM | BR-ADM-05 |
| 57 | `O número de parâmetros inseridos tem que ser igual ao número de parâmetros na informação do relatório.` | N_PARAM_ERRADO | BR-ADM-05 |
| 58 | `Este tipo de variável já está associado.` | OK (FD_VARIAVEIS_SIID) | BR-ADM-06 |
| 59 | `WHEN-VALIDATE-ITEM trigger failed on field - <field>` | generated NOT NULL checks (FD_DOMINIOS_SIID) | BR-ADM-01 |
| 60 | Audit texts written to ERR_ERROS_SIID: `DOCUMENTO REGERADO POR <user>`, `DOCUMENTO REENVIADO POR EMAIL POR <user>PARA <email>`, `DOCUMENTO ARQUIVADO POR <user>`, `DOCUMENTO XML RECRIADO POR <user>` | REGERAR / REENVIAR / REENVIA_EMAIL / REARQUIVAR / RECRIAR | BR-DOC-36 |

Developer-only texts not shown to end users: `UPS<n>` (FD_PERMISSOES_SIID record-group load failure), `FUCK !<n>` (FD_UNIDADES_MEDIDA record-group load failure), `RG_<name> - <n>` (FD_CONFIGURACAO_MODELOS) - replace with proper error handling.

---

## 4. Open questions for the rewrite team (confirm against the database)

1. **OQ-1 - USER_SECURITY.ENCRYPT and CRYPT_PKG.ENCRYPTSTRINGRAW** — RESOLVED (DB source read, 2026-09-15): both are reversible DES with hardcoded keys, not one-way hashes. `USER_SECURITY.ENCRYPT` → key `'12345678'`; `CRYPT_PKG.ENCRYPTSTRINGRAW` (default key) → `'Onsite@Cosec'`. No salting. See BR-AUTH-04, BR-AUTH-09, SEC-005, `analysis/db/packages/{USER_SECURITY,CRYPT_PKG}.sql`.
2. **OQ-2 - Menu role gating** — RESOLVED (Forms2XML, 2026-09-14): MD_SIID_USER disables GADOR, CONFIGURAÇÃO, ADMINISTRAÇÃO, AUDITORIA and BACKUPS (`Enabled="false"`); MD_SIID disables only AUDITORIA. See BR-AUTH-05.
3. **OQ-3 - SVR_DOCUMENTOS_VW**: how ESTADO (NULL / A EXECUTAR / EXECUCAO / IMPRESSO?), DISPONIBILIDADE and other derived columns are computed from SVR_DOCUMENTOS + SVR_QUEUE.
4. **OQ-4 - PKG_DOCUMENTOS_SVR**: ANULAR (what it sets - ATRIBUTO9='A'? DISPONIBILIDADE='ANU'? queue cancellation?), SET_PARAMETRO_STRING / EXECUTA / GET_ID_EXECUCAO (does EXECUTA insert the document and the EXECUCAO queue row? session-scoped parameter state?).
5. **OQ-5 - PKG_SIID_UTIL.CAN_BE_UPLOADED_EDOC**: criteria that make a 'W' model document eligible for EDoc resend.
6. **OQ-6 - FATURAELECTRONICA button** — RESOLVED (Forms2XML): it is a sort button, `Ordenar_Por('FATURA_ELECTRONICA','ASC')`. RECRIAR (TOXML) is dead code. See BR-DOC-20.
7. **OQ-7 - GLOBAL.LOTE_CLONE_ID** — RESOLVED (Forms2XML): the CLONAR window opener runs `Default_value(:svr_documentos.lote_id, 'GLOBAL.LOTE_CLONE_ID')`, i.e. the clone inherits the source document's LOTE_ID (only set if the global was still undefined). Also resolved: P_USUARIO in the clone is `:PARAMETER.P_USERNAME` (the user cloning, not the original creator).
8. **OQ-8 - Views DOC_PERMISSOES_IMPRESSAO and CFG_UTILIZADORES_VW**: column mapping (CDEMPLEA/CDDEPARTA/TIPO_PERMISSAO designation) and whether they filter anything (e.g. only active users).
9. **OQ-9 - Printer resolution by the server**: precedence between the printer on the queue row, DOC_IMPRESSOES_MODELO_USR (user+model), DOC_IMPRESSORAS_DOC (model) and SVR_DOCUMENTOS.IMPRESSORA_ID.
10. **OQ-10 - Unused attributes**: CFG_UTILIZADORES.NIVEL_ACESSO_RF, DOC_MODELOS_DOCUMENTO.MAX_IMPRESSOES / N_ANEXOS / FORMA_CONTROLO_RF / MODO_CERTIFICADO_RF / MODO_PROTECAO_RF / STAMP, DOC_CONDICOES_APR.ATRIBUTO1..8 - are they enforced by the server? Meaning of MODO_EXPEDICAO_RF values G, W, I.
11. **OQ-11 - CFG_TIPOS_MiDIA.TAMANHO_BYTES**: entered directly or computed from unit x FACTOR by a DB trigger?
12. **OQ-12 - Backup and archive execution**: what the server does with BACKUP, ARQUIVO, TOXML, REENVIAR and EMAIL queue rows; who sets DISPONIBILIDADE='OFF' and DATA_IMPRESSAO.
13. **OQ-13 - Alert texts** — RESOLVED (Forms2XML): NAO_TEM_REGISTOS has an empty message (blank alert; pick a text for the rewrite); FD_VARIAVEIS_SIID alert OK has title `Erro` and text `Este tipo de variável já está associado.`; ASK_COMMIT = `Deseja gravar as alterações efectuadas?` with buttons Sim / Não / Cancelar; DESEJA_RECRIAR in the T admin form = `Deseja re-arquivar os documentos selecionados?` (Sim / Não); CONFIRMAR has an empty text set at runtime. All alert texts are in `analysis/forms-xml/T/*_fmb.xml` (`<Alert ... AlertMessage="...">`).
14. **OQ-14 - Environment identity**: is AMBIENTE_ID (login key COSEC / GADOR_TESTES) equal to the schema owner name used by the fallbacks (owner of MRECIBO) and to SVR_AMBIENTES_IMPRESSAO.ID? Partly resolved by the XML: each build has one fixed environment (T = GADOR_TESTES, P = COSEC, see BR-AUTH-02), and the P build's ON-LOGON maps COSEC to the production account @ COSEC01 (the T build maps everything to the test schema). Still to confirm against the DB: the schema names.
15. **OQ-15 - Intended behaviours that look like defects**: Reimprimir prints annulled documents (BR-DOC-10); "Suspender todos" suspends every waiting request of every type (BR-DOC-21); TIPOCNTD_ID / CONTEXTO_ID assigned MAX instead of MAX+1 (BR-MOD-04/07); Reenviar audit text says "REGERADO" (BR-DOC-17); ROWNUM before ORDER BY when loading the current default (BR-MOD-08); hard-coded super-user AFREITAS (BR-DOC-16).
16. **OQ-16 - Legacy PDF storage**: are backups older than the REST file server still served from the `<gerados>;<backup>` directory layout (BR-DOC-37), and must the rewrite keep the path-probing fallback?
