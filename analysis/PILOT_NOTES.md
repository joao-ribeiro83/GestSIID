# Pilot notes — Step 4.1 (Impressoras)

What the next CRUD screens (Step 4.2+) should copy, and what the Phase 2 helpers were missing.
Written after building `packages/shared/src/resources/impressoras.ts`,
`apps/api/src/features/impressoras/`, `apps/api/src/features/dominios/valores.ts`,
`apps/web/src/routes/_app/configuracao/impressoras.tsx` and `components/ImpressoraPicker.tsx`.

## The mechanical part worked as designed

A new CRUD resource is, in the happy path, almost entirely declarative:

1. `defineResource({...})` in `packages/shared/src/resources/<name>.ts`, re-exported from
   `packages/shared/src/index.ts`.
2. `apps/api/src/features/<name>/routes.ts`: `crudRoutes(app, resource, { store, hooks })`.
3. `app.ts`: register it inside the `deps.db` block next to Impressoras.
4. A `ColumnView[]` + `<DataBlock>` in the route file.

No changes were needed to `crud.ts`, `listQuery.ts` or `DataBlock.tsx` themselves. That's the
main validation of the Phase 2 design — copy `apps/api/src/features/impressoras/routes.ts` and
`apps/web/src/routes/_app/configuracao/impressoras.tsx` almost verbatim for the next screen.

## What was missing / had to be worked around

- **Server-generated primary keys.** `ID_IMPRESSORA_SEQ.NEXTVAL` isn't client-writable, so it
  can't be `edit`/`insertOnly` on the resource. The fix is a small per-feature `beforeInsert`
  hook that layers a `SqlExpr` on top of `auditHooks` (see `impressorasHooks` in
  `features/impressoras/routes.ts`). This is a pattern, not a gap — `crud.ts` already supported
  it (`SqlExpr`, `CrudHooks`) — but it's worth documenting since every legacy form with a
  `*_SEQ.NEXTVAL` PRE-INSERT (most of them) will need the same one-line hook.
- **`memoryStore`'s `autoId` only produces numbers.** It's fine for `demoImpressoras` (a
  fictional table with a numeric id), but `SVR_IMPRESSORAS.ID` is `VARCHAR2` — declaring the
  resource column as `type: 'code'` (correct for Oracle) then seeding the dev/e2e fixture with
  `memoryStore(..., { autoId: 'ID' })` produces a **real bug**: the DataBlock sends the whole row
  back as `orig` on every PUT/DELETE (`origOf()` in `dirty.ts`), `origSchema` requires `ID` to be
  a string for a `code` column, and a numeric id fails that check with 400 VALIDACAO — silently,
  because the client only shows the field-level cause, not "this fixture's id type is wrong".
  Found via the picker e2e test's delete step, not by reading the code. Fixed by seeding string
  ids and writing a small `devImpressorasHooks()` (a plain incrementing counter) instead of
  `autoId`. **Next screen: if the real column is text, seed the dev fixture with text ids and use
  a counter hook, not `autoId`.**
- **`GET /api/dominios/:id/valores` didn't exist for real Oracle.** Only the `/dev/datablock`
  in-memory stub did. Built as its own tiny feature (`features/dominios/valores.ts`) rather than a
  `crudRoutes` resource — it's read-only reference data, not a CRUD screen, and the 60s cache
  (a plain `Map`, no library) only makes sense there. This is shared infrastructure now: every
  future domain-backed select goes through it, `DataBlock`/`CellEditor` already know how to
  consume it (`ColumnView.options = { source: 'dominio', dominioId }`, `useDominio`).
- **No searchable list-of-values / combobox component existed.** `CellEditor`'s domain select is
  a plain `<select>`, fine for a short list (a few dozen rows) but not for "pick a printer from
  the whole valid set". `components/ImpressoraPicker.tsx` is new: a `Dialog` + text filter over
  the resource's own list endpoint (`f[VALIDO]=S`, `size=500`), sorted by numeric id client-side
  (the id is text, so a plain `ORDER BY ID` would sort "10" before "2" — no legacy
  `LOV_IMPRESSORAS` record group was found in the forms to confirm the original SQL, so this is a
  judgement call, not a migrated behavior). It's intentionally generic (`open`/`onOpenChange`/
  `onSelect`) so Reimprimir and Novo Backup (later phases) can reuse it as-is.
- **Playwright `fill()` respects the input's `maxlength` attribute.** A first cut of the
  "validation error" e2e test tried to type past a column's `maxLength` with `.fill()` and
  silently got truncated to the limit — the save then succeeded instead of failing. The value has
  to be set past the DOM's native constraint via `evaluate()` (through React's tracked-value
  setter, or React's `onChange` never fires) to actually exercise the zod check. Worth knowing
  before writing the next screen's validation test.
- **`packages/shared`'s `dist/` is not rebuilt automatically.** `pnpm --filter @gestsiid/api
  typecheck` failed with "no exported member" after adding the new resource, purely because
  `packages/shared/dist/` was stale. `pnpm --filter @gestsiid/shared build` first, or a
  `pnpm -r build` step in CI before typecheck, avoids this for future contributors.

## What took the longest

Not the CRUD wiring — the id-type bug above (found only by testing the delete flow end-to-end)
and re-deriving the exact field layout from the legacy form. `STRUCTURE.md`'s own §3.15 summary
under-describes the form (it folds `ENDERECO` and `SERVIDOR` into one bullet, "ENDERECO
('Servidor')"); the real field labels only turned up in `analysis/forms-extracted/T/
FD_IMPRESSORAS_SIID.fmb.txt` (four distinct labels: Descrição, Endereço, Servidor, Válida, i.e.
four separate columns). Read the extracted labels file directly for field-level facts next time,
not just `STRUCTURE.md`'s prose summary of it.

## Left out on purpose

- `GSPAPERSIZE_RF` (DB default `'A4'`) has no field or label anywhere in the form — not in the
  resource. It keeps its Oracle default on insert; add it if a later screen turns out to need it.
- `VALIDO` is domain-backed (`BINARIO`: S → Sim, N → Não) rather than a real checkbox — there is
  no checkbox-style cell editor in `CellEditor.tsx` yet, and the existing select-editor pattern
  already fits an S/N domain exactly. Build a checkbox editor only when a screen needs a boolean
  that isn't backed by a domain.

## Pilot notes — Step 4.6 (Domínios): the first master-detail screen

Written after building `packages/shared/src/resources/dominios.ts`,
`apps/api/src/features/dominios/routes.ts` and
`apps/web/src/routes/_app/administracao/dominios.tsx` — master `CFG_DOMINIOS` + detail
`CFG_VALORES_DOMINIO`.

### The mechanical part worked as designed, again

`useDetailBlock` + `DataBlock`'s `master` prop (built in Step 2, demoed at `/dev/datablock` with
Impressoras → Tabuleiros) needed **zero changes** to carry a second, real master-detail screen.
The whole wiring is the two lines from its own doc comment: `useDetailBlock(current, {
DOMINIO_ID: 'ID' })` on the master's `onCurrentRowChange`, `{...detail.detailProps}` plus an
explicit `endpoint` on the detail `DataBlock`. This is the strongest validation yet that Step 2's
design was right the first time.

### What was missing / had to be worked around

- **Panel-mode conditional field visibility didn't exist.** `ENABLE_STRINGS`/`ENABLE_VALORES`
  (show `TIPO_STRING_RF`/`FORMATACAO_STRING_RF` only for a STRING domain, `VALOR_MINIMO`/
  `VALOR_MAXIMO` only for an interval domain) has no Forms equivalent in `PanelForm.tsx`. Added
  one field to `ColumnView`: `visibleWhen?: (values) => boolean`, read against `form.watch()` (all
  current, possibly-unsaved text values) so toggling the trigger field shows/hides the dependent
  ones live, before saving — proven by an e2e test that flips `Tipo` on a brand new row and checks
  `Tipo String` appears/disappears with no round trip. react-hook-form's default
  `shouldUnregister: false` means a hidden field's value is not lost when it's conditionally
  unmounted, so no extra plumbing was needed to preserve it. **Next screen: reach for
  `visibleWhen` for any other Oracle Forms `ENABLE_*`/`SET_ITEM_PROPERTY(...,VISIBLE,...)` pattern
  before inventing something new.**
- **Two masters can't share one route path.** The detail table (`CFG_VALORES_DOMINIO`) already had
  a *read-only* lookup feed at `/api/dominios/:dominioId/valores` (Step 4.1, used by every other
  screen's domain-backed select). The new CRUD screen needed full GET/POST/PUT/DELETE over the
  same table without colliding with that route or its 60s cache. Mounted the CRUD detail at a
  sibling path, `/api/dominios/:DOMINIO_ID/lista` (the form's own tab name), and had the CRUD
  store's `insert`/`update`/`remove` invalidate the lookup's cache entry for the written
  `DOMINIO_ID` (`withCacheInvalidation` in `features/dominios/routes.ts`) so a value added in the
  admin screen shows up immediately in every other screen's select, not after 60s. **Next screen:
  if a table already has a read-only lookup route, give its CRUD screen a distinct sibling path,
  never the same one.**
- **The delete-guard (`ON-CHECK-DELETE-MASTER`) doesn't need a manual FK model.** `CFG_VALORES_DOMINIO`
  has a real FK to `CFG_DOMINIOS`, so Oracle's own `ORA-02292` (already mapped to the exact legacy
  message in `db/errors.ts`) would eventually catch an unguarded delete — but relying on that alone
  means `memoryStore` (dev/e2e/unit tests) silently allows the delete instead, since it enforces no
  FK. Wrote a small `withDeleteGuard(store, valoresStore)` store decorator (same shape as
  `tipos-midia`'s `withBytes` and `utilizadores`'s `withDateOrder`) that pre-checks the detail
  store and throws the same `ORA_02292` `AppError` either store gets. **Next screen: a legacy
  ON-CHECK-DELETE-MASTER is a decorator over `remove`, not a schema feature — `Resource` was not
  changed.**
- **Domains-of-domains are still just domains.** `TIPO_INFORMACAO`, `TIPO_DOMINIO`, `TIPO_STRING`,
  `FORMATACAO_STRING` (the four selects the Domínios screen itself uses) are ordinary rows in
  `CFG_VALORES_DOMINIO`, fed through the same `GET /api/dominios/:id/valores` every other screen
  uses — no special case needed anywhere. The dev server's static lookup stub
  (`features/dev/routes.ts`'s `DOMINIOS` map) is a *separate* hand-seeded fixture from the new
  in-memory `dominios`/`dominios-valores` CRUD stores, though, so a first e2e run failed with
  "option not found" on the `Tipo` select until these four ids were added to that static map too.
  **Next screen: a select's dev-server data and a screen's own CRUD seed data are two different
  fixtures that must be kept in sync by hand — there's no single source of truth for dev/e2e.**
- **Column-count reality vs. the prose docs, again.** `STRUCTURE.md`/`BUSINESS_RULES.md` describe
  9 fields; the form XML (`analysis/forms-xml/summary/FD_DOMINIOS_SIID.md`) shows 19, all visible:
  `TAMANHO_MAXIMO`, `PRECISAO`, `VALOR_COMUM`, `OBSERVACAO`, `DOMINIO_SISTEMA_BN`,
  `ESTADO_REGISTO_RF`, `DATA_ESTADO` are on the form but not in the prose. Confirms the Step 4.1
  lesson: read the XML/extracted-labels file for the field list, never the prose summary alone.

## Left out on purpose (Step 4.6)

- **`TAMANHO_MAXIMO`/`PRECISAO` form `Required=true` not enforced.** Both are DB-nullable with no
  default, and BR-ADM-01 never lists them as mandatory — the `Required=true` on the form looks like
  boilerplate never actually exercised (no seed row in `CFG_DOMINIOS.md` populates them). Modelled
  as optional; make them `required: true` only if a real Oracle row turns up needing it.
- **Conditional requiredness is not modelled.** `TIPO_STRING_RF`/`FORMATACAO_STRING_RF` are
  `Required=true` on the form only while visible (`ENABLE_STRINGS` toggles `ENABLED` too, so Forms
  never validates a disabled item); `resource.ts`'s `required` flag has no per-field "required only
  when X" mode. Left both optional at the API layer — `visibleWhen` covers the UI, nothing enforces
  the value server-side. Add a cross-field required check only if a real gap shows up.
- **`DOMINIO_SISTEMA_BN` ("Sistema?") carries no special behavior.** The legacy column flags
  built-in domains, but no trigger in the extracted PL/SQL does anything with it beyond storing the
  value — modelled as a plain `BINARIO`-backed select (`VALIDO`'s precedent), editable like any
  other field. Add protection (e.g. blocking delete of a system domain) only if a real workflow
  needs it.
- **`VERSAO`** (both tables, DB default `0.0`) is not modelled, matching every prior resource in
  this app — optimistic locking already goes through the `orig` check in `crud.ts`, not this
  column.
