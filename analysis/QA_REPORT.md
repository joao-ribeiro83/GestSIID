# QA report — GestSIID Node.js app (2026-10-01)

Branch `qa/full-menu-2026-10-01`. Scope: every menu leaf as ADM and as USER (gstack `/qa`), then a
visual review (gstack `/design-review`) against `analysis/UI_SPEC.md`. Fixes are one commit each, with a
regression test where behaviour changed.

**Result:** 8 functional issues and 5 design findings, all 13 fixed and verified in the running Docker
app. Health score **69 → 98**. Design score **B → A-**. AI-slop score **A** (no slop patterns).

## 1. How it was tested

| | |
|---|---|
| App | `docker compose` image built from this branch, `http://localhost:3100` |
| Database | **A local copy of the test schema**, not the test DB itself (see below) |
| Users | `ZZTEST_ADM` (ADM, permissions of AFREITAS) and `ZZTEST_USER` (USER, permissions of GMATOS), created **in the local copy only** |
| Browser | Playwright scripts (full sweep, flows, write paths) + gstack browse for spot checks |
| Viewports | 1440, 1024, 768, 375; light and dark theme |

**Why a local copy.** The hard rule forbids every write to the Oracle test DB, and `.env` has no test
login. So `app/local-db/clone-test-schema.mjs` reads the test schema (SELECT only) and rebuilds what the
app uses in a local `gvenzl/oracle-free` container: 102 tables (37 SIID_TESTES, 65 GADOR_TESTES, which the
app reaches through synonyms, views and packages), views, packages, sequences and triggers. Tables over
150 000 rows are sampled: the newest 3 000 documents and their child rows, and the first 3 000 rows
elsewhere. Oracle 23 has no `DBMS_OBFUSCATION_TOOLKIT`, so the copy gets a `DBMS_CRYPTO` stand-in. Its
hashes match TEST exactly (`USER_SECURITY.ENCRYPT` and `CRYPT_PKG.ENCRYPTSTRINGRAW` were both checked).
The test DB received only plain SELECTs.

**What was covered**

- All 16 leaves as ADM: load, sort, filter (with no match), clear filters, row select, Novo → Guardar
  empty, detail tabs, dialogs.
- All 16 leaves as USER: the menu shows Documentos only, an ADM URL shows a no-permission message, and
  the API answers 403 (except `/api/impressoras`, which Documentos needs).
- Create → edit → stale edit → duplicate → delete through the API on 10 resources, against real Oracle.
- Documentos: status presets, the 6 detail tabs, parameter search, Regerar (queue row written), PDF
  button.
- Backups: the full wizard (backup row created, 39 documents linked), Backups Online.
- Alterar password: empty, mismatch, wrong current, and success (stored hash changed).
- Permissões: selection, the Utilizador/Modelos tabs, the Adicionar dialog.
- Modelos: sections, the image panel, Alterar Modelo / Código Barras / Clonar dialogs.
- Equipa de Gestão: the signature upload.

Final state: 32 screen visits with **0 console errors**. Unit tests 1 208 pass (123 contract tests skip,
because they need the test DB). E2E 80/80 pass.

## 2. Functional issues (all fixed)

| ID | Severity | What was wrong | Fix | Commits |
|---|---|---|---|---|
| ISSUE-005 | **Critical** | **Every edit, delete and image upload failed with 500 on Oracle** (ORA-01036). `lockRow` bound `:__orig_N` and the image store bound `:__user` / `:__img`, but Oracle bind names must start with a letter. Unit tests only compared SQL text, and contract tests cannot lock rows, so nothing caught it. | Renamed to `orig<N>`, `img_user`, `img_data` (`db/oracle.ts`, `lib/imageRoutes.ts`) | `5c6aa23`, test `8b3c749` |
| ISSUE-002 | High | **Reports did not load** ("Registo não encontrado."): its routes were registered in the dev server only, not in `app.ts`. | Registered in `app.ts`. The new test fails if any dev-server route is missing from the Oracle app. | `7b9b329`, test `e90accb` |
| ISSUE-001 | High | `docker compose up` (the README command) mapped host port 3000, while the app listens on `PORT=3100`. Compose reads `${PORT}` from `--env-file`, not from `env_file`. | README and compose now say `docker compose --env-file ../.env up`. `ENV_FILE` picks another environment. | `d4e4ca3` |
| ISSUE-004 | Medium | Impressoras: Novo + Guardar with nothing typed saved a printer with no Endereço. The form has ENDERECO, VALIDO and GSDEVICE_RF Required. | `required` on the 3 columns. The screen pre-fills `PXLCOLOR` like the form. | `47b68c4`, test `d45d3ff` |
| ISSUE-003 | Medium | USER typing an ADM URL got the full screen (grid, filters, toolbar), which then fired requests that all failed with 403. | The `_app` layout checks the menu leaf's roles and shows "Não tem permissão para esta operação." The API still decides. | `1d329a4`, test `847ee15` |
| ISSUE-006 | Medium | Alterar password with empty fields showed zod's English text ("Too small: expected string to have >=1 characters"). | One global zod `customError` in `@gestsiid/shared`. A schema with its own message keeps it. | `eb8d957`, test `0dc5399` |
| ISSUE-008 | Low | Selecting a Modelos section or a perfil with no image logged a 404 console error. The preview is a plain `<img>`, and the browser logs every 404. | A no-image GET answers `204`, so the `<img>` fails quietly and "Sem imagem" still shows. ARCHITECTURE §6 updated. | `59b9c4c` |
| ISSUE-007 | Low | Every first form save logged a CSP violation: zod probes eval with `Function('')`, and the CSP correctly blocks it. | `z.config({ jitless: true })` | `9c2f87b`, test `9f04895` |

Some existing tests were changed, because they pinned the old behaviour: the bind names in 4 unit test
files (ISSUE-005), a printer insert without Endereço in 2 unit test files and 1 e2e spec (ISSUE-004), and
the no-image `404` in 4 unit/contract test files and 1 e2e spec (ISSUE-008).

## 3. Design findings (all fixed)

Calibrated against `analysis/UI_SPEC.md`. The system holds up well: one typeface (IBM Plex Sans), a
12/13/14/18 px type scale, 28 px rows, the accent used only in its allowed roles, the status palette as
specified, dark theme correct, and no horizontal scroll at any width.

| ID | Impact | What was wrong | Fix | Commit |
|---|---|---|---|---|
| FINDING-001 | High | 15 screens rendered their own `<main id="conteudo" class="h-dvh p-4">` and `<h1>` inside the shell's `<main>`. This caused 4 problems: the title showed twice (some with other text than the menu, e.g. "Definição de variáveis do SIID"), the body sat 16 px right of the header, two `main` landmarks shared one id, and the full-height block started below the header, so its counter and pager were off screen behind a second scroll. | Screens are now a flex column in the shell's `<main>`, which fills the remaining height (UI_SPEC §2.1). | `3b06401` |
| FINDING-005 | Medium | Documentos: "Procurar por parâmetros" and "Actualizar" had their own row under the ADM actions, and USER got an empty action row. UI_SPEC §2.1/§4.2 puts them in the page header. | The shell has a slot right of the h1 (`PageActions`); the buttons are 32 px page-level buttons. | `c755dc5` |
| FINDING-004 | Medium | On a phone, the DataBlock toolbar overlapped: "Escolher impressora" sat under "?" and "Limpar filtros". | The toolbar row wraps. The desktop height stays 40 px. | `c0f7c84` |
| FINDING-003 | Polish | On a phone, the user name in the top bar wrapped onto the breadcrumb. | One line with an ellipsis below `sm` | `08be9d5` |
| FINDING-002 | Polish | The home tab title read "GestSIID · GestSIID · GADOR_TESTES". | `pageTitle()` drops the repeat | `e646317`, test `e60e20f` |

Evidence (gitignored): `.gstack/qa-reports/screenshots/` (QA) and `.gstack/design-reports/` (before)
and `.gstack/design-reports/after/`.

## 4. Deferred, and questions for the owner

| Item | Why it is not fixed |
|---|---|
| **Question:** Modelos and Documentos use a fixed-height list and a page that scrolls. UI_SPEC §3.11 asks for a draggable 55/45 splitter. | The code does this on purpose ("three stacked grids and an image pane do not fit one laptop screen"). A splitter would squeeze 2 nested grids into 45 %. Choose: keep the scroll (and update the spec), or build the splitter. |
| **Question:** Domínios `TAMANHO_MAXIMO` is Required in FD_DOMINIOS_SIID, but optional in the new app. | Is this on purpose? The two string fields beside it are conditional on purpose. |
| **Question:** Reports: a new report cannot be edited until its parameter count matches N.º Parâmetros, and it cannot be deleted while its 3 fixed parameters exist (409). | Both copy form rules. Confirm that this is intended. |
| Backup names such as `COSEC_202609_ 01` contain a space. | On purpose: the SQL copies the form's `TO_CHAR(n,'00')` (comment in `features/backups/oracle.ts`). |
| "Mostrar Documento" opens a window, but the PDF itself was not checked. | The PDF comes from the external FileServerSIID, so it is outside the local copy. |
| Contract tests still skip. | `.env` has no `GESTSIID_TEST_USER`. The owner must give an account; never create one. |

## 5. Re-running

```
docker run -d --name gestsiid-oracle -p 1521:1521 -e ORACLE_PASSWORD=localqa \
  -e APP_USER=SIID_TESTES -e APP_USER_PASSWORD=localqa gvenzl/oracle-free:23-slim-faststart
ORACLE_CLIENT_LIB_DIR=<Instant Client 19> node app/local-db/clone-test-schema.mjs      # ~8 min
# test users: INSERT into CFG_UTILIZADORES / CFG_PERMISSOES_SIID with app/local-db/sql.mjs (local only)
cd app && ENV_FILE=../.env.localdb docker compose --env-file ../.env.localdb up -d
```

`.env.localdb` is `.env` with `DB_USER=SIID_TESTES`, `DB_PASSWORD=localqa` and
`DB_CONNECT_STRING=host.docker.internal:1521/FREEPDB1` (gitignored). On this PC, `docker build` needs the
Avast CA as a BuildKit secret on every `RUN` that downloads, `pnpm deploy` included.
