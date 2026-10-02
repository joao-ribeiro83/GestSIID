# Deploying GestSIID

One image, one container per environment (ARCHITECTURE.md §2, D-02). The container is stateless:
no volume, no local files. PDFs come from FileServerSIID over HTTP and images live in Oracle BLOB
columns. **The Oracle database is the only state**, so there is nothing to back up on the app host.
Back up the database with your normal Oracle process. The app owns no schema and runs no DDL.

Run every command in `app/` unless it says otherwise.

## Build

```sh
docker compose build
# or directly:
docker build -t gestsiid-api:local .
```

The `Dockerfile` pins Oracle Instant Client 19.32 Basic by URL and sha256 (`INSTANT_CLIENT_URL`,
`INSTANT_CLIENT_SHA256` build args). To use another build, change both args together: a wrong
sha256 fails the build on purpose.

**TLS error while building** (antivirus or proxy that re-signs HTTPS, for example Avast): the build
cannot trust the re-signed certificate. Give the build the root CA as a BuildKit secret. Do not
disable certificate checks.

Check that no credential was baked into the image:

```sh
docker history --no-trunc gestsiid-api:local
```

## Configure

Copy `../.env.example` to `../.env` and fill it in. Never commit `.env`. `docker-compose.yml` reads it
through `env_file: ${ENV_FILE:-../.env}`. The app checks every value at start and prints all
problems at once, then exits with code 1.

| Variable | Required | Default | Meaning |
|---|---|---|---|
| `NODE_ENV` | no | `production` | `development`, `production` or `test`. |
| `PORT` | no | `3000` | Port the app listens on (inside the container too). |
| `LOG_LEVEL` | no | `info` | `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`. |
| `BASE_PATH` | no | empty | Empty (served at `/`) or `/segment` (served at `/segment/`). Must start with `/`. |
| `DB_USER` | **yes** | | Oracle account. |
| `DB_PASSWORD` | **yes** | | Password of that account. |
| `DB_CONNECT_STRING` | **yes** | | `host:port/service_name`. |
| `DB_SCHEMA` | **yes** | | Schema that owns the SIID objects. Set as `CURRENT_SCHEMA` on every connection. Plain Oracle identifier, upper case. |
| `AMBIENTE_ID` | **yes** | | Must equal `GET_AMBIENTE_ID()` in that schema, or the app refuses to start (D-27). |
| `DB_POOL_SIZE` | no | `4` | Fixed pool size (min = max). A full pool waits 3 s, then answers 503. At most `4 × DB_POOL_SIZE` requests may wait. |
| `DB_CALL_TIMEOUT_MS` | no | `60000` | Time limit for one database call. |
| `UV_THREADPOOL_SIZE` | no | `8` | Node worker threads. Must be **≥ `DB_POOL_SIZE`**. The image sets 8. |
| `ORACLE_CLIENT_LIB_DIR` | no | empty | Instant Client folder. Leave empty in the container. Set it on a Windows dev PC. |
| `SESSION_SECRET` | **yes** | | Random string, **32 characters or more**. |
| `COOKIE_SECURE` | no | `false` | `true` once TLS is in front. Also turns on the `Strict-Transport-Security` header. |
| `TRUST_PROXY` | no | `false` | IP or CIDR list of the reverse proxy, comma separated (for example `172.18.0.0/16`). `true` is refused. |
| `FILESERVER_BASE_URL` | **yes** | | Full FileServerSIID PDF URL of this environment. The API adds `?spoolid=<id>`. |
| `FILESERVER_TIMEOUT_MS` | no | `15000` | Time limit for the FileServerSIID call. |
| `UPLOAD_MAX_MB` | no | `10` | Largest image upload (section images, signatures). |

Fixed in code, not variables: session lifetime 8 h absolute and 30 min idle; login limits (5 tries
per minute per IP; 10 failures per hour per IP and user lock that pair for 15 min); list page size
50 (max 500).

TEST and PRODUCTION differ at least in `DB_SCHEMA`, `AMBIENTE_ID` and `FILESERVER_BASE_URL`. The
`.env.example` values are the TEST ones. Change all three for production.

## Run

```sh
docker compose --env-file ../.env up -d
```

Use `--env-file`: Compose takes `${PORT}` for the port mapping from there, not from `env_file`.

Check it:

```sh
curl http://localhost:3000/api/health
# {"ok":true,"ambiente":"...","db":{"ok":true,"latencyMs":3}}
```

With `BASE_PATH=/gestsiid` the URL is `/gestsiid/api/health`. The container `HEALTHCHECK` calls the same
URL every 30 s (20 s start period, 3 retries). `docker compose ps` shows `healthy` or `unhealthy`.

The container runs as the `node` user with a read-only root file system, `/tmp` as tmpfs, all Linux
capabilities dropped and `no-new-privileges`.

### A second environment

Copy `.env` to `.env.training` (or similar). Change `DB_SCHEMA`, `AMBIENTE_ID` and `PORT`. Then
uncomment and rename the second service block in `docker-compose.yml`. One container per
environment, one `.env` per environment. Never two schemas in one running container (D-02).

## TLS and reverse proxy

The app speaks plain HTTP. For HTTPS, put a proxy (nginx) in front that ends TLS (D-09). Do all
three of these together. If you do one without the others, logins fail or the login limit breaks:

1. **Proxy** sends `X-Forwarded-For` and `X-Forwarded-Proto` and forwards to the container port.
2. **`TRUST_PROXY`** = the proxy's IP or CIDR (never `true`). Without it, every user shares the proxy IP:
   a few wrong passwords lock out everyone, and the session cookie is never set.
3. **`COOKIE_SECURE=true`**. Without it the cookie and CSRF token travel in clear text. The app logs
   a warning at start (`COOKIE_SECURE=false`). The reverse warning (`COOKIE_SECURE=true` with
   `TRUST_PROXY=false`) is logged too.

Minimal nginx location:

```nginx
location / {
    proxy_pass         http://127.0.0.1:3000;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    client_max_body_size 12m;              # UPLOAD_MAX_MB plus form overhead
}
```

To serve under a sub-path, set `BASE_PATH=/gestsiid` and proxy `/gestsiid/` without stripping it. The
cookie path follows `BASE_PATH`.

Fastify's keep-alive timeout is 72 s. If your proxy keeps idle upstream connections longer than that,
lower the proxy value, or you will see sporadic 502 errors.

## Upgrade

```sh
git pull
docker compose build
docker compose --env-file ../.env up -d
curl http://localhost:3000/api/health
```

Starting the new image is the whole upgrade. `stop_grace_period: 30s` lets in-flight requests
finish: on SIGTERM the app stops accepting, drains requests, closes the pool (10 s) and exits 0
(force exit after 25 s). **Everyone is logged out**: sessions live in the process memory.

Before you upgrade, tag the running image so you can go back:

```sh
docker tag gestsiid-api:local gestsiid-api:previous
```

## Roll back

```sh
docker tag gestsiid-api:previous gestsiid-api:local
docker compose --env-file ../.env up -d --no-build
```

No data migration to reverse: the app owns no schema and runs no DDL. If you did not tag the old image,
check out the previous commit or tag, then `docker compose build` and `up -d` as in Upgrade.

## Logs

The app writes JSON (pino) to stdout. Docker keeps it. There is no log file inside the container.

```sh
docker compose logs -f api
docker compose logs --since 1h api | grep '"audit":true'     # audit trail
docker compose logs api | grep -E '"level":(50|60)'           # errors and fatals
```

On the host the files are under Docker's data root, for example
`/var/lib/docker/containers/<container-id>/<container-id>-json.log` (Linux). The `json-file` driver caps
them at 10 MB × 20 files per container, so old logs roll off. Nothing to prune by hand. If you need to
keep logs longer than that (the audit trail lives here), ship them elsewhere.

Each error response carries a `requestId`. Search the logs for that id to find the failing request.
Every audit line has `audit:true`, `event`, `user`, `role`, `ip`, `method`, `route`, `reqId`. No
passwords or hashes are logged.

Database sessions carry `module=gestsiid`, `action=<operation>` and `client_id=<user>`. A DBA can
see who runs what in `V$SESSION`.

When something is wrong, see [../docs/RUNBOOK.md](../docs/RUNBOOK.md).
