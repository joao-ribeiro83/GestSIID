# GestSIID — Node.js rewrite

Rewrite of the GestSIID Oracle Forms 12c application (printer fleet and document management).
pnpm workspace:

| Package | What |
|---|---|
| `apps/api` | Fastify 5 API. Serves the built SPA too. Oracle through node-oracledb (Thick mode). |
| `apps/web` | React 19 SPA (Vite, TanStack Router). |
| `packages/shared` | zod schemas, `defineResource` screen definitions, list-query contract. Used by both. |

Other docs: [DEPLOY.md](DEPLOY.md) (run it on a server), [../docs/RUNBOOK.md](../docs/RUNBOOK.md)
(when it breaks), [../docs/MANUAL_UTILIZADOR.md](../docs/MANUAL_UTILIZADOR.md) (end-user manual, Portuguese),
[CLAUDE.md](CLAUDE.md) (how to add a screen, patterns, gotchas), `../analysis/ARCHITECTURE.md` (design).

> ⛔ **HARD RULE: no changes to the Oracle database.** Tests, scripts and Claude may only read
> (plain SELECT). Contract tests use `apps/api/src/test/read-only-db.ts`; write paths use fakes.
> See `../analysis/TEST_STRATEGY.md` (top).

## Prerequisites

- Node.js **22.18 or newer**.
- pnpm **12.4.2**: `corepack enable && corepack prepare pnpm@12.4.2 --activate`.
- For the real API only: **Oracle Instant Client 19** (Basic). Thick mode is required (D-31). The
  12.1 client under `I:\Middleware\Oracle_Home` fails with `DPI-1050`. Unzip Instant Client 19 and set
  `ORACLE_CLIENT_LIB_DIR` to its folder.
- Docker, only if you build the image.

## Setup

Run all commands in `app/`.

```sh
pnpm i
pnpm --filter @gestsiid/shared build   # once, and after any change in packages/shared
```

## Run without Oracle (demo data in memory)

```sh
pnpm --filter @gestsiid/api dev:mock   # API on http://127.0.0.1:3200
pnpm --filter @gestsiid/web dev        # SPA on http://localhost:5173, proxies /api to :3200
```

Open `http://localhost:5173`. Every screen runs on in-memory stores (`apps/api/src/features/dev/`).
Data resets when the API restarts. A demo grid is at `/dev/datablock`.

## Run against a real database

```sh
cp ../.env.example ../.env     # then fill in the values, see DEPLOY.md for each key
pnpm dev                       # API (node --watch, reads ../.env) + Vite
```

Minimum keys: `DB_USER`, `DB_PASSWORD`, `DB_CONNECT_STRING`, `DB_SCHEMA`, `AMBIENTE_ID`,
`SESSION_SECRET` (32+ characters), `FILESERVER_BASE_URL`, and `ORACLE_CLIENT_LIB_DIR` on a dev PC.
Vite proxies `/api` to port `DEV_API_PORT` (default 3200), but the real API listens on `PORT`
(default 3000). Set `PORT=3200` in `../.env` for dev, or start Vite with `DEV_API_PORT=3000`.
The API exits at start if `AMBIENTE_ID` differs from `GET_AMBIENTE_ID()` in the database (D-27).

Do not point a dev server at PRODUCTION. Use the TEST schema or the local copy below.

## Local Oracle copy (for QA that writes)

`local-db/clone-test-schema.mjs` copies what the app uses from the TEST schema (SELECT only) into a
local `gvenzl/oracle-free` container. Big tables are sampled. The header comment of the script has the
commands. Run the app on it:

```sh
ENV_FILE=../.env.localdb docker compose --env-file ../.env.localdb up
```

Use `local-db/sql.mjs` for SQL that only touches the local copy (test users, resets).

## Test and check

```sh
pnpm -r typecheck
pnpm -r lint
pnpm -r test                    # unit + contract. Contract suites skip without DB_CONNECT_STRING.
pnpm exec playwright test       # e2e. Starts the dev API (:3200) and Vite (:5174) itself.
pnpm exec playwright test e2e/dominios.spec.ts   # one spec
pnpm build                      # tsc -b (shared, api) + vite build (web)
```

`pnpm -r test` passes with no database. Contract tests need `../.env` with `DB_*`, `AMBIENTE_ID`,
`ORACLE_CLIENT_LIB_DIR`, and for logged-in cases `GESTSIID_TEST_USER` / `GESTSIID_TEST_PASSWORD`
(an account the owner gives you. Never create one).

If `typecheck` says "no exported member" from `@gestsiid/shared`, `dist/` is stale: run
`pnpm --filter @gestsiid/shared build`.

## Docker

```sh
docker compose build
docker compose --env-file ../.env up -d
```

Pass `--env-file` as well as relying on `env_file`: Compose reads `${PORT}` for the port mapping from
`--env-file` only. Full server steps: [DEPLOY.md](DEPLOY.md). If the build fails on TLS behind a
scanning antivirus or proxy, the root CA must be given to the build (see DEPLOY.md, "Build").

## Where things live

See the layout table in [CLAUDE.md](CLAUDE.md). Short version: one screen = one resource in
`packages/shared/src/resources/`, one feature in `apps/api/src/features/<name>/`, one route in
`apps/web/src/routes/_app/<menu>/`, one spec in `e2e/`.
