import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  impressorasAssociadasDoc,
  impressorasAssociadasUsr,
  modelosLov,
  origSchema,
  utilizadoresLov,
  type ListQueryFilter,
  type Resource,
} from '@gestsiid/shared';
import { AppError } from '../../db/errors.ts';
import {
  auditHooks,
  crudRoutes,
  sessionCtx,
  type CrudCtx,
  type CrudHooks,
  type CrudStore,
  type Row,
  type Values,
} from '../../lib/crud.ts';

/**
 * `FD_GESTAO_IMPRESSORAS_DOC` / `FD_GESTAO_IMPRESSORAS_USR` (STRUCTURE.md §3.7/§3.8,
 * BR-PRN-02/03): two flat screens over `DOC_IMPRESSORAS_DOC` / `DOC_IMPRESSOES_MODELO_USR`,
 * sharing the `verificar_datas_criar`/`verificar_datas_actualizar` overlap rule and the two
 * read-only LOVs (`LOV_MODELOS`, `LOV_UTILIZADORES`). One folder because the overlap decorator
 * and the copy routes are the same shape for both screens.
 *
 * Every write goes through this feature's routes, never inline/panel `DataBlock` edit (the SPA
 * sets `edit: 'none'`): "Nova impressora" is a plain POST, "Alterar Validade" a plain PUT (both
 * through the overlap-checked store below), "Anular" a custom `POST .../:rid/anular` against the
 * *undecorated* inner store (the legacy annul button never calls `verificar_datas_*`), and the
 * USR screen's two "Copiar…" dialogs are custom routes over the undecorated inner store too
 * (bulk copies, not single-row inserts — no `verificar_datas_*` call in their PL/SQL either).
 */

const DATAS_INCOMPAT =
  'As datas de início e de fim que introduziu são incompatíveis com outra configuração já introduzida.  Por favor, altere as configurações de modo a eliminar a incompatibilidade.';

function datasIncompatError(): AppError {
  return new AppError(400, 'VALIDACAO', DATAS_INCOMPAT, { fields: { 'values.DATA_FIM': DATAS_INCOMPAT } });
}

/** `AMBIENTE_ID` on insert (DOC only): stands in for the legacy `user_synonyms WHERE
 * table_name='MRECIBO'` lookup (BR-PRN-02) — the boot-resolved `AMBIENTE_ID`, like
 * `registerUtilizadoresRoutes`/`registerVariaveisRoutes`. */
export function impressorasAssociadasDocHooks(ambiente: string): CrudHooks {
  return {
    beforeInsert: (v, ctx) => ({ ...auditHooks.beforeInsert!(v, ctx), AMBIENTE_ID: ambiente }),
    beforeUpdate: auditHooks.beforeUpdate,
  };
}

export const impressorasAssociadasUsrHooks: CrudHooks = auditHooks;

// ── verificar_datas_criar / verificar_datas_actualizar ──────────────────────────────────────

const dateOnly = (v: unknown): string => String(v).slice(0, 10);
const dateOnlyOrNull = (v: unknown): string | null => (v == null ? null : dateOnly(v));

function shiftDay(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

const between = (x: string, lo: string, hi: string): boolean => x >= lo && x <= hi;

/**
 * `verificar_datas_criar`/`verificar_datas_actualizar`'s inner loop, translated 1:1 (each `OR`
 * term keeps its own null-guard, since Oracle's `pin_data_fim - 1`/`BETWEEN` with a NULL operand
 * is NULL, not TRUE — never a match): if `pinFim` is null every term is skipped, so an
 * open-ended new range never conflicts (a literal legacy quirk, not "fixed" here). An empty
 * `existing` array (the cursor with nothing to iterate) trivially returns `true`, which also
 * means an invalid `pinIni > pinFim` on the row being saved is never even checked when the scope
 * has zero existing rows — preserve that too.
 */
function overlapOk(pinIni: string, pinFim: string | null, existing: readonly Row[]): boolean {
  for (const rw of existing) {
    const rowIni = dateOnly(rw['DATA_INICIO']);
    const rowFim = dateOnlyOrNull(rw['DATA_FIM']);
    const cond1 = pinFim != null && pinIni > pinFim;
    const cond2 = pinFim != null && between(rowIni, shiftDay(pinIni, -1), pinFim);
    const cond3 = pinFim != null && rowFim != null && between(rowFim, pinIni, shiftDay(pinFim, -1));
    if (cond1 || cond2 || cond3) return false;
  }
  return true;
}

async function listInScope(store: CrudStore, scope: Record<string, unknown>, ctx: CrudCtx): Promise<Row[]> {
  const filters: Record<string, ListQueryFilter[]> = {};
  for (const [column, value] of Object.entries(scope)) filters[column] = [{ op: 'eq', value: String(value) }];
  const { rows } = await store.list({ filters, sort: [], page: 1, size: 100_000 }, {}, ctx);
  return rows;
}

/**
 * Wraps `insert`/`update` with the overlap check, scoped by `scopeKeys` (`['MODELO_ID']` for
 * DOC, `['MODELO_ID', 'CDEMPLEA']` for USR). `update`'s cursor excludes rows matching *either*
 * of the row's previous boundary dates (`data_inicio != pin_data_ini_anterior AND data_fim !=
 * pin_data_fim_anterior`, via De Morgan): if the row being edited currently has an open-ended
 * `DATA_FIM` (null), `data_fim != NULL` is NULL (Oracle: never TRUE) for *every* candidate row,
 * so the cursor excludes all of them and the check trivially passes — preserved here too.
 */
function withOverlapCheck(store: CrudStore, scopeKeys: readonly string[]): CrudStore {
  return {
    ...store,
    async insert(values: Values, parent, ctx) {
      const pinIni = dateOnly(values['DATA_INICIO']);
      const pinFim = dateOnlyOrNull(values['DATA_FIM']);
      const scope = Object.fromEntries(scopeKeys.map((k) => [k, values[k]]));
      const existing = await listInScope(store, scope, ctx);
      if (!overlapOk(pinIni, pinFim, existing)) throw datasIncompatError();
      return store.insert(values, parent, ctx);
    },
    async update(rid, orig, values: Values, ctx) {
      const pinIni = dateOnly(values['DATA_INICIO'] ?? orig['DATA_INICIO']);
      const pinFim = dateOnlyOrNull('DATA_FIM' in values ? values['DATA_FIM'] : orig['DATA_FIM']);
      const anteriorIni = dateOnly(orig['DATA_INICIO']);
      const anteriorFim = dateOnlyOrNull(orig['DATA_FIM']);
      const scope = Object.fromEntries(scopeKeys.map((k) => [k, orig[k]]));
      const cursorRows = (await listInScope(store, scope, ctx)).filter((rw) => {
        const rowIni = dateOnly(rw['DATA_INICIO']);
        const rowFim = dateOnlyOrNull(rw['DATA_FIM']);
        const keepIni = rowIni !== anteriorIni;
        const keepFim = anteriorFim != null && rowFim != null && rowFim !== anteriorFim;
        return keepIni && keepFim;
      });
      if (!overlapOk(pinIni, pinFim, cursorRows)) throw datasIncompatError();
      return store.update(rid, orig, values, ctx);
    },
  };
}

// ── Anular: plain update on the undecorated inner store, never runs the overlap check ──────

function registerAnular(app: FastifyInstance, resource: Resource, innerStore: CrudStore): void {
  const ridParam = z.object({ rid: z.string().min(1) });
  const body = z.object({ orig: origSchema(resource) });
  app.post(`/api/${resource.name}/:rid/anular`, async (request) => {
    const ctx = sessionCtx(request, resource.roles.write);
    const { rid } = ridParam.parse(request.params);
    const { orig } = body.parse(request.body);
    const values = auditHooks.beforeUpdate!(
      { DATA_INICIO: '1980-01-01T00:00:00', DATA_FIM: '1980-01-01T00:00:00' },
      ctx,
    );
    return innerStore.update(rid, orig, values, ctx);
  });
}

// ── Copiar do modelo / Copiar do utilizador (USR only): bulk copy, undecorated inner store ──

function isNotExpired(row: Row, today: string): boolean {
  const fim = dateOnlyOrNull(row['DATA_FIM']);
  return fim == null || fim >= today;
}

async function bulkCopy(
  store: CrudStore,
  ctx: CrudCtx,
  sourceScope: Record<string, unknown>,
  existingKeys: Set<string>,
  values: (src: Row) => Values,
  targetKeyOf: (row: Row) => string,
): Promise<Row[]> {
  const today = new Date().toISOString().slice(0, 10);
  const sourceRows = (await listInScope(store, sourceScope, ctx)).filter((r) => isNotExpired(r, today));
  const inserted: Row[] = [];
  for (const src of sourceRows) {
    const key = targetKeyOf(src);
    if (existingKeys.has(key)) continue;
    inserted.push(await store.insert(auditHooks.beforeInsert!(values(src), ctx), {}, ctx));
    existingKeys.add(key);
  }
  return inserted;
}

function registerCopyRoutes(app: FastifyInstance, innerStore: CrudStore): void {
  const modeloBody = z.object({ MODELO_ID: z.string().min(1), MODELO_ID_COPIAR: z.string().min(1) });
  app.post('/api/impressoras-associadas-usr/copiar-modelo', async (request) => {
    const ctx = sessionCtx(request, impressorasAssociadasUsr.roles.write);
    const { MODELO_ID, MODELO_ID_COPIAR } = modeloBody.parse(request.body);
    // Target scope: existing rows already under MODELO_ID, keyed by (CDEMPLEA, DATA_INICIO) —
    // COPIAR_MODELO.OK's `not exists (... modelo_id = :MODELO_ID and cdemplea = modelo.cdemplea
    // and data_inicio = modelo.data_inicio)`.
    const targetRows = await listInScope(innerStore, { MODELO_ID }, ctx);
    const existingKeys = new Set(targetRows.map((r) => `${r['CDEMPLEA']}|${dateOnly(r['DATA_INICIO'])}`));
    const inserted = await bulkCopy(
      innerStore,
      ctx,
      { MODELO_ID: MODELO_ID_COPIAR },
      existingKeys,
      (src) => ({
        MODELO_ID,
        CDEMPLEA: src['CDEMPLEA'],
        IMPRESSORA_ID: src['IMPRESSORA_ID'],
        DATA_INICIO: src['DATA_INICIO'],
        DATA_FIM: src['DATA_FIM'] ?? null,
      }),
      (src) => `${src['CDEMPLEA']}|${dateOnly(src['DATA_INICIO'])}`,
    );
    return { rows: inserted };
  });

  const utilizadorBody = z.object({ CDEMPLEA: z.string().min(1), CDEMPLEA_COPIAR: z.string().min(1) });
  app.post('/api/impressoras-associadas-usr/copiar-utilizador', async (request) => {
    const ctx = sessionCtx(request, impressorasAssociadasUsr.roles.write);
    const { CDEMPLEA, CDEMPLEA_COPIAR } = utilizadorBody.parse(request.body);
    // Target scope: existing rows already under CDEMPLEA, keyed by (MODELO_ID, DATA_INICIO) —
    // COPIAR_UTILIZADOR.OK's `not exists (... modelo_id = modelo.MODELO_ID and cdemplea =
    // :CDEMPLEA and data_inicio = modelo.data_inicio)`. NOT symmetric with copiar-modelo.
    const targetRows = await listInScope(innerStore, { CDEMPLEA }, ctx);
    const existingKeys = new Set(targetRows.map((r) => `${r['MODELO_ID']}|${dateOnly(r['DATA_INICIO'])}`));
    const inserted = await bulkCopy(
      innerStore,
      ctx,
      { CDEMPLEA: CDEMPLEA_COPIAR },
      existingKeys,
      (src) => ({
        MODELO_ID: src['MODELO_ID'],
        CDEMPLEA,
        IMPRESSORA_ID: src['IMPRESSORA_ID'],
        DATA_INICIO: src['DATA_INICIO'],
        DATA_FIM: src['DATA_FIM'] ?? null,
      }),
      (src) => `${src['MODELO_ID']}|${dateOnly(src['DATA_INICIO'])}`,
    );
    return { rows: inserted };
  });
}

export function registerImpressorasAssociadasRoutes(
  app: FastifyInstance,
  deps: {
    docStore: CrudStore;
    usrStore: CrudStore;
    modelosStore: CrudStore;
    utilizadoresStore: CrudStore;
    ambiente: string;
  },
): void {
  crudRoutes(app, modelosLov, { store: deps.modelosStore });
  crudRoutes(app, utilizadoresLov, { store: deps.utilizadoresStore });

  crudRoutes(app, impressorasAssociadasDoc, {
    store: withOverlapCheck(deps.docStore, ['MODELO_ID']),
    hooks: impressorasAssociadasDocHooks(deps.ambiente),
  });
  registerAnular(app, impressorasAssociadasDoc, deps.docStore);

  crudRoutes(app, impressorasAssociadasUsr, {
    store: withOverlapCheck(deps.usrStore, ['MODELO_ID', 'CDEMPLEA']),
    hooks: impressorasAssociadasUsrHooks,
  });
  registerAnular(app, impressorasAssociadasUsr, deps.usrStore);
  registerCopyRoutes(app, deps.usrStore);
}
