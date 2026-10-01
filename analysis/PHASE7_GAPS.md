# Phase 7 — Documentos: open parity gaps

Written 2026-09-30, while walking the Phase 7 checklist in `TEST_STRATEGY.md`. Each gap says what is
not proven, why, and what closes it. The hard rule applies to all of them: no Oracle writes.

## G-1 — Contract tests not re-run on 2026-09-30

- **What:** the Oracle parity tests (`app/apps/api/src/features/documentos/routes.contract.test.ts`,
  `…/operacoes/routes.contract.test.ts`) did not run. This includes the new
  `USER session → 403 on ADM-only routes (D-08, A-09)` block.
- **Why:** the TEST DB did not answer. Two tries gave `ORA-12170: TNS:Connect timeout occurred`.
- **Close it:** connect to the network that reaches the TEST DB, then run (in `app/apps/api`):

  ```
  ORACLE_CLIENT_LIB_DIR=<Instant Client 19 folder> node --env-file=../../../.env node_modules/vitest/vitest.mjs run --project api --config ../../vitest.config.ts src/features/documentos
  ```

  `.env` has `ORACLE_CLIENT_LIB_DIR` empty. Pass it in the shell.

## G-2 — BR-DOC-03 / D-16: one parity test per state label

- **What:** worked example 3 asks for one row per `SVR_DOCUMENTOS_VW.ESTADO` branch (with the
  `'ENQUEED'` typo branch and `TERMINADO`+`REENVIAR`), then checks that the API returns the view's label.
- **Why not reproducible:** making those rows needs `SVR_QUEUE` inserts. The hard rule forbids them.
  The TEST schema may not have a live row for every branch.
- **What exists:** the API does not derive `ESTADO`. It returns the view column as-is. Contract
  `BR-DOC-02 rows …` compares view rows with the API.
- **Close it:** the owner seeds the rows (we give the SQL, the owner runs it), or accepts the
  read-only check "labels present in TEST = labels the API returns".

## G-3 — No `DISPONIBILIDADE = 'OFF'` row in TEST

- **What:** BR-DOC-02 OFFLINE styling against Oracle.
- **Why not reproducible:** the TEST schema has only `null, ANU, EDC, ERR, ONL` (per the note in `routes.contract.test.ts`, 2026-09-30).
  Making an OFF row is a write.
- **What exists:** unit test `row colour: OFFLINE wins …`. The contract test runs the OFF case only
  when a row exists.

## G-4 — UI checks with no test

- **BR-DOC-33:** no test shows that closing a dialog leaves no stale state behind.
- **BR-DOC-21:** the Suspender dialog reads `fila/contagem` (`-acoes.tsx`), but no e2e test checks that it shows the count.
- **Why:** not done in this pass. Both can be done: they need an e2e test on the dev server, not Oracle.

## G-5 — A batch that fails midway writes no app audit row

- **What:** `operacoes/routes.ts` calls `audit()` only after the service returns. `anular` commits
  per document (A-01). If document N fails, documents 1..N-1 are changed, and the app audit log has
  no record of them. This came from the architecture review on 2026-09-30.
- **Not in scope here:** this is audit behaviour, not a USER restriction. `ERR_ERROS_SIID`
  lines (BR-DOC-36) are not affected.
- **Close it:** put the audit call in `try/finally` with the ids done so far and the error.

## G-6 — Step 7.5: USER reachability in running Forms

- **What:** D-08 says Step 7.5 checks clone and single queue-cancel in running Forms.
- **Why not reproducible:** no Forms Runtime and no reachable form listener on this machine.
- **What decided it:** the Forms2XML dump. The USER form's `GENERICO.CLONAR` is
  `Enabled="false" Visible="false"`, so the owner made Clonar ADM only (2026-09-30). The
  `ESTADO_PEDIDO` popup is attached, so USER keeps the single queue cancel.

## G-7 — USER gets the Anexos tab; D-08 does not name it

- **What:** D-08's USER list says "comments, parameters, queue, logs". The API gives USER all five
  tabs, `anexos` too.
- **Why it is like this:** the attachment navigation code (Mostrar Grupo) is in both forms, so USER
  could see attachments in Forms.
- **Close it:** the owner confirms. If the answer is no, limit `GET /api/documentos/:id/anexos` to ADM.
