# GestSIID runbook

For the person on call. Setup and config are in [../app/DEPLOY.md](../app/DEPLOY.md). Commands run on
the Docker host, in `app/`. The service is `api`.

> ⛔ Do not change the Oracle database to fix an incident. Read with SELECT only. If a fix needs
> SQL that writes, give the SQL to the owner or the DBA.

## 1. Is it up?

```sh
docker compose ps                                   # State: running, Health: healthy
curl -s http://localhost:3000/api/health            # add your BASE_PATH before /api if you set one
```

| Health answer | Meaning |
|---|---|
| `200 {"ok":true,"ambiente":"…","db":{"ok":true,"latencyMs":N}}` | App and database are fine. `latencyMs` is one `SELECT 1 FROM DUAL`. |
| `503 {"ok":false,…,"db":{"ok":false}}` | App is up. The database does not answer. Go to section 3. |
| No answer / connection refused | App is not running. Go to section 2. |

The health check needs no login. It makes no session and writes no access log line at info level.

## 2. App does not start (container restarts, `unhealthy`, exit code 1)

```sh
docker compose logs --tail 50 api
```

| What the log says | Cause | Fix |
|---|---|---|
| `Invalid environment configuration:` then lines `  - NAME: …` | A variable is missing or wrong. All problems are listed. | Fix `.env`. See the table in DEPLOY.md. Then `docker compose --env-file ../.env up -d`. |
| `UV_THREADPOOL_SIZE must be >= DB_POOL_SIZE` | Pool larger than the worker threads. | Raise `UV_THREADPOOL_SIZE` or lower `DB_POOL_SIZE`. |
| `AMBIENTE_ID mismatch (D-27): configured "X", database returned "Y"` | `.env` points at a schema of another environment. The app refuses on purpose. | Fix `DB_SCHEMA`, `DB_CONNECT_STRING` or `AMBIENTE_ID`. Never edit the database to make it match. |
| `ORA-01017` (invalid username/password) | Wrong `DB_USER` / `DB_PASSWORD`, or the account is locked. | Check `.env`. Ask the DBA about the lock. Do not retry in a loop: you will lock it. |
| `ORA-12154`, `ORA-12541`, `ORA-12514`, `ORA-12545`, `ORA-12170` | Wrong connect string, listener down, or host not reachable. | Check `DB_CONNECT_STRING`. From the host: `tnsping` or a TCP test to host:port. |
| `NJS-116` | Thin mode was used with an old password verifier. | Should not happen: the app always uses Thick mode. If you see it, the Oracle client did not load. |
| `DPI-1047` / `DPI-1050` | Oracle client library missing or too old. | In the image it is Instant Client 19: rebuild the image. On a dev PC set `ORACLE_CLIENT_LIB_DIR` to Instant Client 19 (not the 12.1 one). |
| Container flaps with `OOM` or `Killed` | Out of memory on the host. | Check `docker stats`. Free memory or move the container. |

## 3. Database unreachable (health is 503)

What users see: screens fail with **"Base de dados indisponível. Tente mais tarde."** (HTTP 503, code
`BD_INDISPONIVEL`). Already logged-in sessions stay valid. The app does **not** need a restart.

1. Confirm: `curl -i http://localhost:3000/api/health` → 503.
2. Look at the cause in the log: `docker compose logs --since 10m api | grep -E "ORA-|NJS-|DPI-"`.
   - `ORA-03113`, `ORA-03114`, `ORA-03135`: connection lost. The DB or the network dropped.
   - `ORA-12xxx`: cannot reach the listener.
3. Check from the host that the DB host and port answer. Ask the DBA whether the instance is up.
4. When the database is back, the pool reconnects by itself. Measured on the local copy
   (analysis/PERF.md): 503 after about 5 s of outage, healthy again about 36 s after the DB started,
   and the **first request after recovery can take about 24 s** while connections are rebuilt. Wait
   a minute before you restart anything.
5. Still 503 after 2 minutes with the DB up: `docker compose restart api`. Everyone is logged out.

A call that runs longer than `DB_CALL_TIMEOUT_MS` (60 s) is cancelled: the user sees **"A operação excedeu
o tempo limite."** (504, `TEMPO_ESGOTADO`). One slow screen is not an outage. Note which screen and
tell the DBA. The Documentos list over `SVR_DOCUMENTOS_VW` is the known slow one.

## 4. Pool exhausted (many 503, but health may be 200)

The pool has `DB_POOL_SIZE` connections (default 4). When all are busy, a request waits at most 3 s.
More than `4 × DB_POOL_SIZE` waiting requests are refused at once. Both cases answer 503
`BD_INDISPONIVEL` — the same text as a dead database.

How to tell it from section 3:

| | Pool exhausted | Database down |
|---|---|---|
| `/api/health` | usually 200 (but can 503 during a burst) | 503 |
| Log | `NJS-040` (queue timeout) or `NJS-076` (queue full) | `ORA-03113`, `ORA-12xxx`, `DPI-` |
| Recovery | seconds, when the load drops | 30 s or more after the DB is back |

```sh
docker compose logs --since 10m api | grep -c "NJS-0"
docker compose logs --since 10m api | grep -E "NJS-040|NJS-076" | tail
```

Find the cause before you raise anything: one slow query holding connections, or real load.

- **Real load** (many users at once): raise `DB_POOL_SIZE` in `.env` and raise `UV_THREADPOOL_SIZE`
  to at least the same value. Restart. Ask the DBA first: each unit is one more Oracle session.
  Measured (analysis/PERF.md, pool of 8): `/api/permissoes` serves about 50 requests/s at best, and
  more than 40 simultaneous requests get 503 by design. Ten users clicking at once is fine.
- **One slow query**: ask the DBA for the sessions with `module = 'gestsiid'` in `V$SESSION`
  (`action` is the operation, `client_id` is the user). A stuck session may hold a pool slot until
  `DB_CALL_TIMEOUT_MS` (60 s) cancels it.

## 5. Common errors users report

Every error response has `code`, `message` and `requestId`. Ask the user for the time and the
screen, or the `requestId` (shown in the browser network tab). Then:

```sh
docker compose logs api | grep <requestId>
```

| User sees | HTTP / code | Meaning and action |
|---|---|---|
| Utilizador e/ou password inválidos. | 401 `LOGIN_INVALIDO` | Wrong user or password, **or** user outside DATA_INICIO/DATA_FIM, **or** login throttled. All look the same on purpose. Check audit events `login.fail` for the user in the log. Throttle: 5 tries/min per IP; 10 failures/hour for one IP + user lock that pair 15 min. A restart clears the counters. |
| Every login fails behind a proxy | 401, or no cookie | `TRUST_PROXY` / `COOKIE_SECURE` mismatch. See DEPLOY.md, "TLS and reverse proxy". Boot log warns about it. |
| A sessão expirou. Entre novamente. | 401 `SESSAO_EXPIRADA` | 30 min idle, 8 h total, or the app restarted (sessions are in memory). Log in again. Not a fault. |
| Não tem permissão para esta operação. | 403 `SEM_PERMISSAO` | The user's role (ADM / USER) may not use it. Menu items hide by role, but the API decides. |
| Pedido inválido. Recarregue a página. | 403 `CSRF` | The page is old or the cookie was lost. Reload. Persistent: check the proxy forwards cookies and `COOKIE_SECURE` fits the URL scheme. |
| Dados inválidos. (with field messages) | 400 `VALIDACAO` | The user's input broke a rule. The field messages say which. Not a fault. |
| Campo obrigatório não preenchido. | 400 `ORA_01400` | Required field empty. |
| Valor demasiado grande para o campo. | 400 `ORA_12899` | Text longer than the column. |
| Já existe um registo com estes valores. | 409 `ORA_00001` | Duplicate key. |
| Impossível apagar registo mestre se existirem registos de detalhe correspondentes. | 409 `ORA_02292` | Record still in use by a detail table. Delete the details first. |
| O registo está bloqueado por outro utilizador. Tente novamente. | 409 `REGISTO_BLOQUEADO` | Another session holds the row (`ORA-00054`). Retry. If it persists, ask the DBA who holds the lock (a forgotten Forms session is typical). |
| Valor não existe na tabela de referência. | 422 `ORA_02291` | A chosen value has no parent row. |
| Valor não permitido. | 422 `ORA_02290` | A check constraint refused the value. |
| (a package message) | 422 `ORA_20XXX` | `RAISE_APPLICATION_ERROR` of a SIID package. The text is the package's own. Not a fault of the app. |
| Base de dados indisponível. Tente mais tarde. | 503 `BD_INDISPONIVEL` | Section 3 or 4. |
| A operação excedeu o tempo limite. | 504 `TEMPO_ESGOTADO` | Section 3, last paragraph. |
| Erro | 500 `ERRO` | Unmapped error. The real message is in the log under the `requestId`. Report it with that id. |

The PDF viewer in Documentos calls FileServerSIID from the server. If PDFs do not open and the rest
works, test `FILESERVER_BASE_URL` from the host (`curl -I "<url>?spoolid=<id>"`). The timeout is
`FILESERVER_TIMEOUT_MS` (15 s). FileServerSIID is a separate service: the fix is on its side.

## 6. Audit trail

```sh
docker compose logs --since 24h api | grep '"audit":true' | grep '"user":"NAME"'
```

Events: `login.ok`, `login.fail`, `logout`, `regeneracao.alterada`, `regeneracao.alterar.fail`,
`regeneracao.reauth.ok`, `regeneracao.reauth.fail`, `documentos.clonar`, `documentos.comentar`,
`documentos.fila.cancelar`, `backups.criar`, `backups.online`. Fields: `user`, `role`, `ip`, `route`,
`reqId`. The log is kept by Docker only: 10 MB × 20 files, then it rolls off.

## 7. Safe restart, stop, roll back

```sh
docker compose --env-file ../.env restart api     # logs everyone out; waits up to 30 s for requests to finish
docker compose stop api                            # same drain, exit code 0
```

Rollback: DEPLOY.md, "Roll back". No data needs undoing.

## 8. Escalate

Send the DBA or the owner: the time, the `requestId`, the log lines (`NJS-`, `ORA-`, `DPI-`), the
output of `curl /api/health`, and what you already tried. Do not send `.env` or passwords.
