# Deploying GestSIID

One image, one container per environment (ARCHITECTURE.md §2, D-02). No file-storage volume
is needed: PDFs come from FileServerSIID over HTTP and images live in Oracle BLOB columns.

## Build

```sh
docker compose build
# or directly:
docker build -t gestsiid-api:local .
```

The Instant Client 19 Basic download URL/sha256 in `Dockerfile` are placeholders — pin the
real values (`INSTANT_CLIENT_URL`, `INSTANT_CLIENT_SHA256` build args) before building for
real use; an unpinned sha256 will fail the `sha256sum -c` step on purpose.

Verify no credential got baked into a built image:

```sh
docker history --no-trunc gestsiid-api:local
```

## Configure

Copy `.env.example` (repo root) to `.env` and fill it in — see the comments in that file for
what each key means. Required: `DB_USER`, `DB_PASSWORD`, `DB_CONNECT_STRING`, `DB_SCHEMA`,
`AMBIENTE_ID`, `SESSION_SECRET` (32+ chars), `FILESERVER_BASE_URL`. `DB_SCHEMA` and
`AMBIENTE_ID` must match the target database (D-27) — the app refuses to start otherwise.

Never commit `.env`. `docker-compose.yml` reads it via `env_file: ../.env`.

## Run

```sh
docker compose up -d
```

Health check: `curl http://localhost:3000/api/health` (also wired as the container
`HEALTHCHECK`, polled every 30s).

### A second environment

Copy `.env` to `.env.training` (or similar) with a different `DB_SCHEMA` / `AMBIENTE_ID` and
a different `PORT`, then uncomment and rename the second service block in
`docker-compose.yml`. Each environment is its own container, its own `.env` file — never two
schemas sharing one running container (D-02).

## Upgrade

```sh
git pull
docker compose build
docker compose up -d
```

The container is stateless (no volume, no local session store beyond the process); starting
the new image is the whole upgrade. `stop_grace_period: 30s` gives in-flight requests time to
finish before the old container is killed.

## Roll back

```sh
git checkout <previous-tag-or-commit>
docker compose build
docker compose up -d
```

Or, if you tag images (`gestsiid-api:<git-sha>`), just retag and `docker compose up -d`
against the previous tag — no data migration to reverse since the app owns no schema DDL.

## Logs

```sh
docker compose logs -f api
```

JSON, capped at 10 MB × 20 files per container (`logging.options` in `docker-compose.yml`) —
old log files roll off automatically, nothing to prune by hand.
