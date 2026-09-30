# app/CLAUDE.md — the Node.js rewrite

Read the root `../CLAUDE.md` first (legacy Forms layout). This file covers `app/` only. It was
written after the Phase 4 pilot (Steps 4.1–4.6); `../analysis/PILOT_NOTES.md` has the long
version of each lesson.

## ⛔ HARD RULE — no changes to the Oracle database

Tests, scripts and Claude may only run plain `SELECT`. No INSERT/UPDATE/DELETE/MERGE, DDL,
PL/SQL block, `FOR UPDATE`, or COMMIT — not on `ZZTEST_` rows, not rolled back. Contract tests
reach Oracle only through `apps/api/src/test/read-only-db.ts` (`readOnlyPool`). Every write path
is tested with `memoryStore` or a fake connection. If a task seems to need a DB write: stop, give
the owner the SQL, do not run it. Full rule: `../analysis/TEST_STRATEGY.md` (top).

## Layout

| Path | What |
|---|---|
| `packages/shared/src/resources/<name>.ts` | `defineResource({...})`: table, columns, labels, filter/sort/edit flags, roles. Shared by API and SPA. Re-export from `packages/shared/src/index.ts`. |
| `packages/shared/src/resource.ts` | `Resource`/`ColumnDef`, `valuesSchema`, `origSchema`, `RowOf`. |
| `packages/shared/src/listQuery.ts` | QBE query-string parser, `pagedResult` envelope `{ rows, total, totalCapped, page, size }`. |
| `apps/api/src/lib/crud.ts` | `crudRoutes`, `oracleStore`, `CrudStore`, `CrudHooks`, `auditHooks`, `SqlExpr`/`SYSDATE`, `SqlCall`, `sessionCtx`. |
| `apps/api/src/lib/listQuery.ts` | `buildListQuery` (allow-listed WHERE/ORDER BY, binds only), `selectList`, `dateSelect`, rid encode/decode. |
| `apps/api/src/lib/variaveis.ts` | `createGetVariavel` — reads `SVR_VARIAVEIS_SIID` (`PASSWORD`, `BACKUP`, `ONLINE`), 60 s cache. Not wired in `app.ts` yet. |
| `apps/api/src/db/oracle.ts` | `withConnection`, `query`, `queryOne`, `execute`, `withTransaction`, `callPlsql`, `lockRow`, `buildPoolAttrs`. |
| `apps/api/src/db/errors.ts` | `AppError`, `mapOracleError` (ORA-00001/01400/02292/… → Portuguese message + HTTP code). |
| `apps/api/src/http/` | session, CSRF, auth guard (`requireRole`), login throttle, security headers, SPA fallback. |
| `apps/api/src/features/<name>/routes.ts` | One feature per screen: hooks, store decorators, `register<Name>Routes`. Empty folders are placeholders for later phases. |
| `apps/api/src/features/dev/` | Oracle-less dev server: `memoryStore`, seeds, static domain stub (`routes.ts`). |
| `apps/api/src/app.ts` | `buildApp(deps)`: registers every feature inside the `deps.db` block. |
| `apps/web/src/components/datablock/` | `DataBlock`, `ColumnView`, `PanelForm`, `CellEditor`, `useDetailBlock`. |
| `apps/web/src/routes/_app/<menu>/<screen>.tsx` | One route per menu leaf. Unbuilt ones render `PlaceholderScreen`. |
| `apps/web/src/menu.ts` | Menu tree with `roles` (hides only; the API decides). |
| `e2e/<screen>.spec.ts` | Playwright against the dev server (in-memory stores). |

## Commands (run in `app/`)

```
pnpm i
pnpm --filter @gestsiid/shared build   # after any change in packages/shared (see gotchas)
pnpm -r typecheck
pnpm -r test                           # unit + contract; contract suites skip without DB_CONNECT_STRING
pnpm -r lint
pnpm exec playwright test              # e2e; starts the dev API (:3200) and Vite (:5174) itself
pnpm exec playwright test e2e/dominios.spec.ts
pnpm --filter @gestsiid/api dev:mock   # dev API on in-memory stores, no Oracle
pnpm dev                               # real API (reads ../.env) + Vite
```

Contract tests need `../.env` with `DB_*`, `AMBIENTE_ID`, `ORACLE_CLIENT_LIB_DIR` (Instant
Client 19 folder), and for logged-in cases `GESTSIID_TEST_USER` / `GESTSIID_TEST_PASSWORD`
(owner-given account; never create one).

## How to add a screen

Before code: read `../analysis/forms-xml/summary/<FORM>.md` (the XML digest) for the field list,
labels, order, required flags, LOVs and alert texts. `STRUCTURE.md` / `BUSINESS_RULES.md` prose
under-describes forms (Impressoras had 4 label fields, not 3; Domínios has 19 fields, not 9).
Read the trigger text in `../analysis/forms-xml/T/<FORM>_fmb.xml` for PRE-INSERT / WHEN-VALIDATE
rules and exact messages. Real columns: `../analysis/db/tables/<TABLE>.md`.

1. **Resource** — `packages/shared/src/resources/<name>.ts` with `defineResource`. Types:
   `text` (eq, like), `code` (text key: eq, in — use it for VARCHAR2 ids even when they hold
   digits), `number`, `date`. Server-set columns (audit, sequence ids, `AMBIENTE_ID`) get no
   `edit`/`insertOnly`, so the request schema rejects them. Export it from `index.ts`, then
   `pnpm --filter @gestsiid/shared build`.
2. **Routes** — `apps/api/src/features/<name>/routes.ts` exporting
   `register<Name>Routes(app, { store, ... })` that calls `crudRoutes(app, resource, { store, hooks })`.
   Copy `features/impressoras/routes.ts`. Register it in `app.ts` inside the `deps.db` block with
   `oracleStore(pool, resource, callTimeoutMs)`.
3. **Dev fixture** — in `features/dev/routes.ts`, call the same `register<Name>Routes` with
   `memoryStore(resource, seed)`. Add every domain id the screen's selects use to the static
   `DOMINIOS` map there (it is a separate fixture from the CRUD stores).
4. **Screen** — replace the placeholder in `apps/web/src/routes/_app/<menu>/<screen>.tsx` with a
   `ColumnView[]` in the form's field order and a `<DataBlock>`. Copy
   `administracao/tipos-midia.tsx` (inline edit) or `administracao/dominios.tsx` (panel edit,
   master-detail). The menu entry already exists in `menu.ts`.
5. **Tests** — `routes.test.ts` (unit: `buildApp` with the feature on `memoryStore`, every rule
   and message, every write path), `routes.contract.test.ts` (read-only GETs against the test
   schema; copy `features/dominios/routes.contract.test.ts`), `e2e/<screen>.spec.ts` (filter,
   sort, create, edit, delete, validation, screen-specific rules; copy `e2e/unidades-medida.spec.ts`).

## Patterns that emerged (reuse before inventing)

| Legacy thing | How it is done here | Example |
|---|---|---|
| PRE-INSERT audit columns | `auditHooks` (`CRIADO_POR`, `DATA_CRIACAO` / `ACTUALIZADO_POR`, `DATA_ACTUALIZACAO`) from the session. Tables with other names write their own hook. | `features/dominios/routes.ts` (`REGISTADO_POR`) |
| `*_SEQ.NEXTVAL` id | `beforeInsert` adds `ID: new SqlExpr('X_SEQ.NEXTVAL')`. | `impressorasHooks` |
| Upper-case item, fixed default, `AMBIENTE_ID` | `beforeInsert` sets it; the column is not editable. | `unidadesMedidaHooks`, `variaveisHooks` |
| Value hashed by a DB function | `SqlCall('RAWTOHEX(USER_SECURITY.ENCRYPT(?))', value)` — the secret stays a bind. Column `writeOnly: true` → never selected, never in `orig`. | `features/utilizadores/routes.ts` |
| WHEN-VALIDATE / POST-CHANGE rule, computed column, scoping | A **store decorator**: `{ ...store, insert: …, update: … }` that checks or fills, then calls the inner store. Throw `AppError(400, 'VALIDACAO', 'Dados inválidos.', { fields: { 'values.COL': msg } })` for field errors. | `withDateOrder`, `withBytes`, `scoped` |
| DEFAULT_WHERE `col != 'X'` | `exclude: { column, values }` on the resource (`NOT IN`). | `resources/variaveis.ts` |
| DEFAULT_WHERE `AMBIENTE_ID = …` | Store decorator forcing the filter on `list` and 404 on `get`/`update`/`remove` of other rows. | `scoped` in `features/variaveis/routes.ts` |
| ON-CHECK-DELETE-MASTER | Store decorator over `remove` that lists the detail store and throws `AppError(409, 'ORA_02292', …)` (memoryStore enforces no FK). | `withDeleteGuard` |
| Master-detail | Detail resource with `parentKeys`; `crudRoutes(..., { path: '/api/<master>/:KEY/<detail>' })` — **the path param name must equal the column name** (`:DOMINIO_ID`). SPA: `useDetailBlock(current, { DOMINIO_ID: 'ID' })` + `{...detail.detailProps}` + explicit `endpoint`. | Domínios |
| Record-group select (short list) | `ColumnView.options = { source: 'dominio', dominioId }` reads `GET /api/dominios/:id/valores` → `{ rows: [{ CHAVE, DESIGNACAO }] }`. A list that is not a real domain gets a **pseudo-domain feed**: the owning feature registers `GET /api/dominios/<NAME>/valores` (a static path wins over `:dominioId`). | `UNIDADES_DOMINIOS` in `features/unidades-medida/routes.ts` |
| LOV over a long list | Dialog + text filter over a resource list endpoint. Only `components/ImpressoraPicker.tsx` exists; generalise it when a second picker is needed (MASTER_PLAN Step 5.0). | `ImpressoraPicker` |
| A write must refresh a cached lookup | Store decorator calling `cache.invalidate(id)` after insert/update/remove. | `withCacheInvalidation` |
| `ENABLE_*` / `SET_ITEM_PROPERTY(VISIBLE)` | `ColumnView.visibleWhen: (values) => boolean` (panel edit only). Not enforced server-side. | `administracao/dominios.tsx` |
| Item initial value | `<DataBlock defaults={() => ({ COL: 'X' })}>`. | `tipos-midia.tsx` |
| S/N flag | `code` column + `BINARIO` domain select. There is no checkbox editor. | `VALIDO` in Impressoras |
| Computed read-only column (POST-QUERY decode) | `ColumnDef.expr`: selected as `(expr) AS COL`, never in `orig`, no edit/filter/sort. | `TIPO_IMAGEM` in `resources/modelos.ts` |
| Form alert texts | Exact Portuguese text in the feature (`const JA_ASSOCIADO = '…'`) or `db/errors.ts` for ORA mappings. | `features/variaveis/routes.ts` |
| Sort button on two columns / an expression; role-limited sort | `sortAliases: { LOTE: ['LOTE_ID', 'LOTE_ORDEM'] }`, `sortRoles: { USER: ['ID'] }` on the resource. | `resources/documentos.ts` |
| Search that is not a column filter (PROCURAR, Mostrar grupo) | Parsed as `params` / `paramModelo` / `grupo`; the feature passes `buildListQuery(…, { extra })`, else 400. | `features/documentos/repo.ts` |

No engine file needs a change for a plain screen. Each Phase 4 screen still needed one small
engine extension (`SqlCall` + `writeOnly`, `exclude`, `visibleWhen`, `defaults`): add it to
`crud.ts` / `resource.ts` / `DataBlock` with a unit test when a real form needs it, not before.

## Gotchas

**node-oracledb / Oracle**
- Thick mode only (D-31): the account's password verifier is rejected by Thin (NJS-116). Needs
  Oracle Client 18.1+; the 12.1 client under `I:\Middleware` fails with DPI-1050. Point
  `ORACLE_CLIENT_LIB_DIR` at an Instant Client 19 folder.
- `server.ts` sets `outFormat = OUT_FORMAT_OBJECT` and `fetchAsString = [CLOB]`. Each contract
  test's `beforeAll` repeats `initOracleClient` + `outFormat` (not `fetchAsString`: add it before
  the first CLOB column is read in a test).
- Never pass an explicit `undefined` argument to `conn.execute` / `close` (NJS-005); forward rest args.
- Dates travel as `YYYY-MM-DDTHH:MM:SS` strings (`dateSelect` / `TO_DATE`), never JS `Date`.
- `lockRow` (before every UPDATE/DELETE) uses `FOR UPDATE NOWAIT`, which `readOnlyPool` refuses —
  so write routes can never be contract-tested. That is intended.
- A package call (`PKG_DOCUMENTOS_SVR.*`) commits on its own (DECISIONS A-01): never mix it with
  app DML in one transaction.
- Table and column names are pasted into SQL; `defineResource` allows only plain Oracle
  identifiers. Values are always binds.
- `DOC_MODELOS_DOCUMENTO`, `DOC_CONDICOES_APR`, `DOC_PARAMETROS_OMISSAO` are index-organized: their
  ROWID is logical (`*BAn…`). The engine selects `CAST(ROWID AS VARCHAR2(4000))` and binds
  `ROWID = :rid`; `ROWIDTOCHAR`/`CHARTOROWID` fail there with ORA-01410.
- Text ids sort as text (`'10' < '2'`); sort numerically in SQL (`TO_NUMBER(ID)`) or client-side.
- `SVR_DOCUMENTOS_VW` is slow per row: sorting, counting or `ID IN (subquery)` over it takes
  40 s to minutes. Documentos lists in two phases (page ids + count from `SVR_DOCUMENTOS`, then
  the view rows by id) unless ESTADO / DISPONIBILIDADE is used (`features/documentos/repo.ts`).
  Time new list SQL read-only on TEST first.

**Test schema and fixtures**
- Contract tests only read. Use owner-given accounts; do not seed `ZZTEST_` rows.
- `memoryStore(..., { autoId })` makes **numeric** ids. For a VARCHAR2 id, seed string ids and use
  a counter `beforeInsert` hook (`devImpressorasHooks`), or every PUT/DELETE fails `origSchema`
  with a silent 400 VALIDACAO.
- `memoryStore` enforces no FK and no DB default; guard deletes and defaults in store decorators /
  hooks so dev, unit and Oracle behave the same.
- The dev `DOMINIOS` map and the CRUD seeds are two fixtures; a missing domain id shows as
  "option not found" in e2e.

**Build and tests**
- `packages/shared` exports `src/` under the `development` condition and `dist/` otherwise. A stale
  `dist/` makes `typecheck` fail with "no exported member": run `pnpm --filter @gestsiid/shared build`.
- Playwright `fill()` respects `maxlength`; to test a too-long value, set it through React's value
  setter in `page.evaluate()` (see `e2e/impressoras.spec.ts`).
- Login throttle allows 5 attempts/minute per IP: specs reuse `e2e/.auth/adm.json` from
  `e2e/global-setup.ts` (`test.use({ storageState: ... })`) instead of logging in each time.
- Playwright runs with `workers: 1`: the dev server's stores are shared and specs that write must
  not race. Make each spec independent of the others' writes (unique ids per test).
- The CSRF header (`x-csrf-token`) is required on every non-GET call, also in the dev server.
