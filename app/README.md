# GestSIID — Node.js rewrite

pnpm workspace: `apps/api` (Fastify 5), `apps/web` (React 19 SPA), `packages/shared` (zod
schemas and the list-query contract shared by both). See `../analysis/ARCHITECTURE.md` for
the full design and `../.env.example` for configuration.

> ⛔ **HARD RULE: no changes to the Oracle database.** Tests, scripts and Claude may only read
> (plain SELECT). Contract tests use `apps/api/src/test/read-only-db.ts`; write paths use fakes.
> See `../analysis/TEST_STRATEGY.md` (top).

## Run

```
pnpm i
pnpm -r test        # passes with no DB: contract tests skip without DB_CONNECT_STRING,
                     # unit tests use a fake connection
pnpm dev             # apps/api on `node --watch` + apps/web on the Vite dev server
pnpm build           # tsc -b (shared, api) + vite build (web)
```

## DataBlock demo (no Oracle)

```
pnpm --filter @gestsiid/api dev:mock   # in-memory demo API on :3200 (apps/api/src/dev-server.ts)
pnpm --filter @gestsiid/web dev        # then open http://localhost:5173/dev/datablock
pnpm exec playwright test              # starts both itself; e2e/datablock.spec.ts
```

## Database

The running app and the contract tests need a real Oracle connection: copy `../.env.example`
to `../.env` and fill in `DB_USER`, `DB_PASSWORD`, `DB_CONNECT_STRING`, `DB_SCHEMA`,
`AMBIENTE_ID` (ARCHITECTURE.md §2). Without `DB_CONNECT_STRING` set, `pnpm -r test` still
passes in full — it just skips the contract-test suites.

## Docker

```
docker compose build
docker compose --env-file ../.env up
```

`docker-compose.yml` reads `../.env`. Pass it with `--env-file` too: the host port mapping uses
`${PORT}`, and Compose takes that from `--env-file`, not from `env_file`. The Dockerfile's Oracle Instant Client URL/sha256 are
placeholders (see the `ponytail:` comment in `Dockerfile`) and must be pinned to a real
Instant Client 19 Basic build before the image can actually build.
