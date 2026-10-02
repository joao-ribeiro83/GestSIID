# Ponytail debt ledger

Date: 2026-10-02. Scope: `app/`. Source: `ponytail:` comments in code.
Rule: a marker with no upgrade trigger is tagged `no-trigger`. Those rot first.

| File:line | What was simplified | Ceiling | Upgrade trigger |
|---|---|---|---|
| `app/local-db/clone-test-schema.mjs:14` | Big tables are sampled (newest SAMPLE documents and their children, first SAMPLE rows elsewhere). | Joins across sampled tables can return fewer rows than TEST. | `no-trigger` |
| `app/apps/api/src/features/dev/memoryStore.ts:121` | An alias sort term that is a SQL expression (Documentos REFERENCIA) is not sorted in the memory store. | Dev and unit sort differs from Oracle for that term. | `no-trigger` |
| `app/apps/api/src/features/documentos/repo.ts:113` | The form's SELECT INTO failed on several parents. The lowest parent is taken. | Picks one parent, may not match the form. | `no-trigger` |
| `app/apps/api/src/features/documentos/repo.ts:292` | JS twins of `PRESETS` for dev and unit data. | "Em erro" and "A executar / Execução" are approximate. The SQL is contract-tested. | `no-trigger` |
| `app/apps/api/src/features/backups/memoria.ts:60` | Backup name uses `padStart(2, '0')` for `TO_CHAR(n,'00')`. | Past 99 Oracle prints `###`. Memory store does not copy this. | `no-trigger` |

5 markers, 5 with no trigger.

## Notes

- All 5 are in dev/test fixtures or in a documented legacy rule. None touches a write path.
- To close a marker, add a trigger to its comment, for example "revisit when X". Or remove it when the ceiling no longer matters.

## Audit findings (ponytail-audit, 2026-10-02)

- Done: removed unused dependency `fastify-type-provider-zod` (`apps/api/package.json`, lockfile).
- Done: `DataBlock.tsx` gutter ternary split into `gutterIcon()`. `isNewRow()` replaces 5 repeats.
- Done: `reports/repo.ts` uses the existing `CrudHooks` type.
- Open: `features/dev/routes.ts` has about 600 lines of seeds. Move them to a sibling file in their own commit. Edit `app/CLAUDE.md` (step 3, Gotchas) in the same commit.
- Open: `DataBlock.tsx` is 1250 lines. Split helpers out.
- Open: one `react-hooks/incompatible-library` lint warning at `PanelForm.tsx:188`.
