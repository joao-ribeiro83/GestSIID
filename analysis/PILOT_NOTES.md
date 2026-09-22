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
