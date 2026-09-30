# Document states × actions (Step 7.2)

What each toolbar action of `FD_GESTAO_SIID` does to a document in each state, with the Forms
trigger or program unit each cell comes from (`analysis/forms-xml/T/FD_GESTAO_SIID_fmb.xml`,
dumped with `analysis/tools/forms2xml.ps1`). The API (`apps/api/src/features/documentos/operacoes/`)
implements exactly this table; the differences from Forms are the ones listed at the end and
nothing else.

## 1. States

A document has two independent "annulled" markers and one queue history. The API reads them in
one SELECT per batch (`oracle.ts` `lerDocumentos`).

| Marker | Source | Set by |
|---|---|---|
| `ATRIBUTO9 = 'A'` | `SVR_DOCUMENTOS` | nothing in the dumped packages or forms (legacy data) |
| `DISPONIVEL_RF = 'ANU'` | `SVR_DOCUMENTOS` (shown as `DISPONIBILIDADE` in the view) | `PKG_DOCUMENTOS_SVR.ANULAR` (D-17) |
| `DISPONIVEL_RF = 'OFF'` | same | the backup processor (D-04) |
| printed | `SVR_QUEUE` row `TIPO_QUEUE_RF = 'IMPRESSAO' AND ESTADO = 'TERMINADO'` | the processor |
| `N_IMPRESSOES` | `SVR_DOCUMENTOS` | the processor |
| `ARQ_ID` | `SVR_DOCUMENTOS` | the processor (archive) |
| model `MODO_EXPEDICAO_RF` | `DOC_MODELOS_DOCUMENTO` (`G` gestor documental, `W` EDoc, `I`, `E`, `M`) | Modelos screen |
| queue `ESTADO` | `SVR_QUEUE` per request: `ESPERA`, `ENQUEUED`, `EM EXECUCAO`, `EXECUCAO`, `TERMINADO`, `ERRO`, `CANCELLED`, `SUSPENSO` | processor; the UI only does the transitions in §3 |

"Annulled" for the skip rules below = `ATRIBUTO9 = 'A' OR DISPONIVEL_RF = 'ANU'` (A-06; Forms
read only `ATRIBUTO9`).

## 2. Batch actions (`POST /api/documentos/acoes/<acao>`, ADM)

Selection = `ids` (ticked rows) or `consulta` (the whole list query, §4.2). Each row of the
table is one selected document; "queue" means one new `SVR_QUEUE` row with
`ID_QUEUE_SEQ.NEXTVAL, DATA_PEDIDO = SYSDATE, ESTADO = 'ESPERA', CRIADO_POR = <session user>`;
"audit" means one `ERR_ERROS_SIID` row with `ID_ERROS_SEQ.NEXTVAL, 'ERRO_DOC', SYSDATE`.
Skipped documents are returned as `{ id, motivo }` with the OUT alert text as `motivo`.

| Action | Precondition (per document) | Gate for the whole batch | Effect | Skipped → `motivo` | Source |
|---|---|---|---|---|---|
| `regerar` | not annulled | password: any selected document (annulled ones included) printed or model `G` → `428 PASSWORD_REGERACAO_NECESSARIA` unless the session has a fresh reauth (`POST /api/auth/reauth-regeneracao`) | queue `EXECUCAO` + audit `DOCUMENTO REGERADO POR <user> ` | #13 `Não foram Regerados os documentos …anulados:` | `ORDENACAO_DOCUMENTOS.REGERAR` WHEN-BUTTON-PRESSED (gate loop, skip loop), `CONFIRMAR_PASSWORD.CONFIRMAR` WHEN-BUTTON-PRESSED (same loop after the password), program unit `REGERAR` |
| `reimprimir` | not annulled (D-28 fix; Forms printed them when `VALIDACAO = 'F'`) | `impressoraId` must be a valid printer (`SVR_IMPRESSORAS.VALIDO = 'S'`) or absent (= the document's own printer, `IMPRESSORA_ID NULL` on the queue row) | queue `IMPRESSAO` with `IMPRESSORA_ID` | #9 `Não foram impressos os documentos …anulados:` | `ORDENACAO_DOCUMENTOS.REIMPRIMIR` (sets `VALIDACAO = 'F'`), `REIMPRIMIR.OK` WHEN-BUTTON-PRESSED, program unit `REIMPRIMIR` |
| `segunda-via` | not annulled; `N_IMPRESSOES <> 0` | same printer rule | queue `2.VIA` | #9 (annulled); #10 `Para imprimir 2ª Via é necessário que o documento já tenha sido impresso.` | `ORDENACAO_DOCUMENTOS.VIA` (`VALIDACAO = 'V'`), `REIMPRIMIR.OK`, program unit `REIMPRIMIR` (`ELSIF P_VALIDACAO = 'V'`) |
| `copia` | not annulled | same printer rule | queue `COPIA` | #9 | `ORDENACAO_DOCUMENTOS.COPIA` (`VALIDACAO = 'C'`), `REIMPRIMIR.OK`, program unit `REIMPRIMIR` |
| `anular` | none in Forms; the API reports the outcome | — | `PKG_DOCUMENTOS_SVR.ANULAR(:id, :user)` per document, committed by the package (A-01), then `DISPONIVEL_RF` re-read | `A anulação não foi registada pelo servidor.` when it is not `ANU` afterwards; `Documento não encontrado.` | `ORDENACAO_DOCUMENTOS.ANULAR` WHEN-BUTTON-PRESSED, program unit `ANULA`, package `ANULAR` → `ALTERA_DISPONIBILIDADE(…,'A')` |
| `cancelar` | none | `force` (D-12, every ADM; Forms: `P_USERNAME = 'AFREITAS'`) | `UPDATE SVR_QUEUE SET ESTADO = 'CANCELLED' WHERE TIPO_QUEUE_RF = 'EXECUCAO' AND DOCUMENTO_ID = :id` `[AND ESTADO IN ('TERMINADO','ESPERA','ENQUEUED','EM EXECUCAO','ERRO')]` (the bracket only without `force`); one transaction; `pedidos` = rows changed | never | `ORDENACAO_DOCUMENTOS.CANCELAR` WHEN-BUTTON-PRESSED |
| `suspender` | none | `todaFila: true` instead of a selection = every `ESPERA` row of every document and request type (BR-DOC-21; the SPA confirms with `GET /api/documentos/fila/contagem?estado=ESPERA` first, D-28) | `ESPERA → SUSPENSO` for the documents' queue rows (any type); `pedidos` = rows changed | never | `SUSPENDER.OK` WHEN-BUTTON-PRESSED (cursors `selec_cur` / `todos_cur`) |
| `retomar` | none | `todaFila: true` = every `SUSPENSO` row | `SUSPENSO → ESPERA`; `pedidos` | never | `RETOMAR.OK` WHEN-BUTTON-PRESSED (its own choice; Forms read `:SUSPENDER.OPC_SUSPENDER`, STRUCTURE §3.3 bug) |
| `reenviar-edoc` | model `MODO_EXPEDICAO_RF = 'W'` and `PKG_SIID_UTIL.CAN_BE_UPLOADED_EDOC(id) <> 0` (the Forms `DECODE`, run as one SELECT per document, D-18) | — | queue `REENVIAR` + audit `DOCUMENTO REENVIADO POR <user>` (D-28 fix; Forms wrote `REGERADO`) | #19 `…por não serem documentos para o EDoc:` | `ORDENACAO_DOCUMENTOS.REENVIAR` WHEN-BUTTON-PRESSED, program unit `REENVIAR` |
| `reenviar-email` | `MAX(ATRIBUTO01)` of the document's earlier `EMAIL` queue rows is not null and matches `^[^@\s]+@[^@\s]+\.[^@\s]+$` (D-05) | — | queue `EMAIL` with `ATRIBUTO01 = <address>` + audit `DOCUMENTO REENVIADO POR EMAIL POR <user>PARA <address>` | #20 `…por não serem documentos de Email:` | `ORDENACAO_DOCUMENTOS.REENVIAR_EMAIL` WHEN-BUTTON-PRESSED, program unit `REENVIA_EMAIL` |
| `rearquivar` | `NVL(ARQ_ID, 0) <> 0` | — | queue `ARQUIVO` + audit `DOCUMENTO ARQUIVADO POR <user>` | #22 `…por não serem documentos para ARQUIVO:` | `ORDENACAO_DOCUMENTOS.REARQUIVAR` WHEN-BUTTON-PRESSED (alert `DESEJA_RECRIAR`, text "Deseja re-arquivar…"), program unit `REARQUIVAR` |

Not ported: `RECRIAR` (`TOXML`, no caller, D-19) and the `FATURAELECTRONICA` button (a sort, A-05).

Every selected id that is not in `SVR_DOCUMENTOS` is skipped with `Documento não encontrado.`
(Forms raised `NO_DATA_FOUND` and aborted the whole batch). A `consulta` that matches nothing is
`422 SEM_SELECCAO` `Não existem documentos seleccionados.` for every action (Forms: alert
`NAO_TEM_REGISTOS`, blank, only for Regerar / Reenviar / Reenviar Email / Re-Arquivar; the other
buttons looped over nothing); an empty `ids` array is a malformed body (`400 VALIDACAO`), and a
`consulta` above 10 000 documents is `422 SELECCAO_EXCESSIVA` (the list's count cap; Forms
"Seleccionar todos" only covered the rows it had fetched).

Transactions (A-01): the queue + audit rows of one batch are one `withTransaction` (Forms: one
`FORMS_DDL('COMMIT')` at the end of the loop). `anular` is one package call per document, each
committed by the package, never inside an app transaction.

## 3. Queue-state matrix (UI transitions only)

`SVR_QUEUE.ESTADO` before → after, per action. Rows in any other state are left alone.

| Action | `ESPERA` | `ENQUEUED` | `EM EXECUCAO` | `EXECUCAO` | `TERMINADO` | `ERRO` | `SUSPENSO` | `CANCELLED` | Type filter | Source |
|---|---|---|---|---|---|---|---|---|---|---|
| any enqueue (§2) | new row | | | | | | | | the action's type | program units |
| `cancelar` | `CANCELLED` | `CANCELLED` | `CANCELLED` | — | `CANCELLED` | `CANCELLED` | — | — | `EXECUCAO` only | `ORDENACAO_DOCUMENTOS.CANCELAR` |
| `cancelar` + `force` | `CANCELLED` | `CANCELLED` | `CANCELLED` | `CANCELLED` | `CANCELLED` | `CANCELLED` | `CANCELLED` | (already) | `EXECUCAO` only | same trigger, `AFREITAS` branch (D-12) |
| `suspender` | `SUSPENSO` | — | — | — | — | — | — | — | any | `SUSPENDER.OK` |
| `retomar` | — | — | — | — | — | — | `ESPERA` | — | any | `RETOMAR.OK` |
| single request cancel (`POST /:docId/fila/:queueId/cancelar`) | `CANCELLED` | — | — | — | `CANCELLED` | — | — | — | any | popup `ESTADO_PEDIDO.CANCELAR` (`UPDATE … WHERE ID = :SVR_QUEUE.ID AND ESTADO IN ('ESPERA','TERMINADO')`); item shown only in those two states (`SVR_QUEUE` WHEN-NEW-RECORD-INSTANCE, BR-DOC-23) |
| `anular` (package) | | | | | new row `ANULADO` / `TERMINADO` | | | | `ANULADO` | `PKG_DOCUMENTOS_SVR.ALTERA_DISPONIBILIDADE` |

The single request cancel locks the row first (`lockRow`, `FOR UPDATE NOWAIT`) and answers
`409 PEDIDO_NAO_CANCELAVEL` `O pedido já não está em espera nem terminado.` when the state has
moved on (Forms updated 0 rows silently and re-queried).

## 4. Per-document actions

| Route | Roles | Effect | Source |
|---|---|---|---|
| `POST /api/documentos/:id/clonar { parametros: [{ nome, valor }] }` | ADM (owner, 2026-09-30; see note) | one PL/SQL block on one connection: `SET_PARAMETRO_STRING(nome, valor)` for each parameter with a non-empty value, then `('P_USUARIO', <session user>)`, `('_USER', <ambiente>)`, `EXECUTA(<MODELO_ID>)`, `:id := GET_ID_EXECUCAO` (the package commits, D-17/A-01); on any error the connection is dropped (`close({ drop: true })`); then, when the source has a `LOTE_ID`, `UPDATE SVR_DOCUMENTOS SET LOTE_ID = :lote WHERE ID = :id` in its own transaction (D-20). Names are upper-cased and must match `^[A-Z0-9_]{1,30}$` (`PKG_DOCUMENTOS_SVR.EXECUTA_DOCUMENTO` concatenates the names, unescaped, into an `EXECUTE IMMEDIATE` list; Forms took them from the document's rows); `P_ID`, `_USER`, `P_USUARIO` are refused (`400`); at most 100 parameters, values up to 2000 characters (`PARAMETROnn`). Reply `201 { id }`; `GET_ID_EXECUCAO = -1` (the package swallowed an error into the source document's log) is `422 CLONAR_FALHOU`. If the `LOTE_ID` update fails after `EXECUTA` committed, the reply is that error and the new document exists without its lote (Forms: the `FORMS_DDL` error was silent). | `CLONAR.CLONAR` WHEN-BUTTON-PRESSED, `CLONAR_DOCUMENTO` POST-SELECT (`GLOBAL.LOTE_CLONE_ID := :svr_documentos.lote_id`), block WHERE `nome not in ('P_ID','_USER')` |
| `POST /api/documentos/:docId/fila/:queueId/cancelar` | ADM, USER | §3 | popup `ESTADO_PEDIDO.CANCELAR` |
| `GET /api/documentos/fila/contagem?estado=ESPERA\|SUSPENSO` | ADM | `SELECT COUNT(*) FROM SVR_QUEUE WHERE ESTADO = :estado` → `{ n }` | D-28 (BR-DOC-21 confirmation) |

Note: in `FD_GESTAO_SIID_USER_fmb.xml` the `GENERICO` popup item `CLONAR` is
`Enabled="false" Visible="false"`, so a Forms USER cannot reach Clonar. ARCHITECTURE §5 / A-08
had given it to USER; the owner decided on 2026-09-30 that Clonar is ADM only (it runs
`PKG_DOCUMENTOS_SVR.EXECUTA` with caller-chosen parameters). Single request cancel stays ADM + USER.

## 5. Intended differences from Forms (all decided; nothing else differs)

| Difference | Decision |
|---|---|
| Reimprimir skips annulled documents; annulled = `ATRIBUTO9 = 'A' OR DISPONIVEL_RF = 'ANU'` for Regerar, Reimprimir, 2ª via, Cópia | D-28, A-06 |
| Reenviar (EDoc) audit text `DOCUMENTO REENVIADO POR <user>` | D-28 |
| Reenviar e-mail skips an address that fails the format check | D-05 |
| Cancelar `force` for every ADM instead of `AFREITAS` | D-12 |
| Retomar uses its own selected / all choice | STRUCTURE §3.3 |
| Suspender todos / Retomar todos: the SPA shows the row count first | D-28 |
| `CRIADO_POR`, `P_USUARIO`, `ANULAR`'s `P_USER` = session user, never a request field | D-08 |
| Regeneration password: `428` + reauth route instead of the modal; only Regerar asks (as in Forms) | D-07d, A-04 |
| Per-document outcome after `ANULAR` (re-read `DISPONIVEL_RF`) | D-17 |
| Empty selection → `422` for every action; unknown id → skipped, not an aborted batch | Step 7.2 |
| Single request cancel: `409` when the row is no longer `ESPERA` / `TERMINADO` | Step 7.2 |
| USER has no batch actions, no `fila/contagem` and no Clonar | D-08, A-08, owner 2026-09-30 |

Kept exactly as Forms wrote them, on purpose: the audit texts `DOCUMENTO REGERADO POR <user> `
(trailing space from the `FORMS_DDL` string of program unit `REGERAR`) and
`DOCUMENTO REENVIADO POR EMAIL POR <user>PARA <address>` (no space before `PARA`), so the D-10
parity run compares equal rows.
