import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pagedResult, pt, type Role } from '@gestsiid/shared';
import { AppError } from '../../db/errors.ts';
import { audit } from '../../http/audit.ts';
import { listQueryOf, sessionCtx } from '../../lib/crud.ts';
import type { GetVariavel } from '../../lib/variaveis.ts';
import type { BackupsRepo } from './repo.ts';

/**
 * Gestão › Backups (Step 8.1, ARCHITECTURE §10.1 "backups"): FD_NOVO_BACKUP and FD_BACKUPS_ONLINE.
 * ADM only (MD_SIID_USER has no Backups menu, D-08).
 *
 *   GET  /api/backups/meses                   → { rows: [{ MES, DATA }] }       (BR-BKP-02)
 *   GET  /api/backups/candidatos?mes=YYYY-MM  → list envelope + totalBytes      (BR-BKP-02, -06)
 *   POST /api/backups { mes, tipoMidiaId, observacoes?, ids | todos } → 201 { ID, NOME }  (BR-BKP-03..05)
 *   GET  /api/backups                         → list envelope, f[MEDIA_ONLINE]=S|N  (BR-BKP-09)
 *   POST /api/backups/online { ids, online }  → 204                             (BR-BKP-09)
 *
 * There is no PUT/DELETE: a backup cannot be changed once created (D-25).
 */

const ADM: readonly Role[] = ['ADM'];
const mes = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Mês inválido (AAAA-MM).');
const ids = z.array(z.number().int().positive()).max(1000).refine((a) => new Set(a).size === a.length, 'ids repetidos');

const novoBody = z
  .object({
    mes,
    tipoMidiaId: z.string().max(10).optional(),
    observacoes: z.string().max(2000).nullable().optional(),
    ids: ids.optional(),
    todos: z.literal(true).optional(),
  })
  .strict();
const onlineBody = z.object({ ids: ids.min(1), online: z.boolean() }).strict();

const invalido = (field: string, msg: string) => new AppError(400, 'VALIDACAO', 'Dados inválidos.', { fields: { [field]: msg } });

/** First and last day of `YYYY-MM`, for the DATA_IMPRESSAO from / to filters. */
function diasDoMes(m: string): [string, string] {
  const [y, mm] = m.split('-').map(Number) as [number, number];
  const ultimo = new Date(Date.UTC(y, mm, 0)).getUTCDate();
  return [`${m}-01`, `${m}-${String(ultimo).padStart(2, '0')}`];
}

export function registerBackupsRoutes(app: FastifyInstance, opts: { repo: BackupsRepo; getVariavel: GetVariavel }): void {
  const { repo, getVariavel } = opts;

  app.get('/api/backups/meses', async (request) => ({ rows: await repo.meses(sessionCtx(request, ADM)) }));

  app.get('/api/backups/candidatos', async (request) => {
    const ctx = sessionCtx(request, ADM);
    const { mes: m, ...resto } = request.query as Record<string, unknown>;
    const r = mes.safeParse(m);
    if (!r.success) throw invalido('mes', 'Mês inválido (AAAA-MM).');
    const q = listQueryOf(resto);
    // Block DOCS_PORBACKUP WHERE: the month and BACKUP_ID IS NULL replace any client filter on them.
    const [de, ate] = diasDoMes(r.data);
    q.filters['DATA_IMPRESSAO'] = [{ op: 'from', value: de }, { op: 'to', value: ate }];
    q.filters['BACKUP_ID'] = [{ op: 'null' }];
    const { rows, total, totalBytes } = await repo.candidatos(q, r.data, ctx);
    return { ...pagedResult(rows, total, q.page, q.size), totalBytes };
  });

  app.get('/api/backups', async (request) => {
    const ctx = sessionCtx(request, ADM);
    const q = listQueryOf(request.query);
    const { rows, total } = await repo.lista(q, ctx);
    return pagedResult(rows, total, q.page, q.size);
  });

  // OK button of FD_NOVO_BACKUP: TIPO_MIDIA alert, then the selection, then the size (in the repo).
  app.post('/api/backups', async (request, reply) => {
    const ctx = sessionCtx(request, ADM);
    const b = novoBody.parse(request.body ?? {});
    if (!b.tipoMidiaId?.trim()) throw invalido('tipoMidiaId', pt.backups.tipoMidiaObrigatorio);
    if (b.ids && b.todos) throw invalido('seleccao', 'Indique ids ou todos, não ambos.');
    if (!b.todos && !b.ids?.length) throw invalido('seleccao', pt.naoExistemDocumentosSeleccionados);
    const novo = await repo.criar(
      {
        mes: b.mes,
        tipoMidiaId: b.tipoMidiaId,
        observacoes: b.observacoes ?? null,
        ids: b.todos ? 'todos' : b.ids!,
        destino: (await getVariavel('BACKUP')) ?? '',
      },
      ctx,
    );
    audit(request, 'backups.criar', { ...novo, mes: b.mes, documentos: b.todos ? 'todos' : b.ids });
    return reply.status(201).send(novo);
  });

  // FD_BACKUPS_ONLINE buttons: online records the drive (NVL(variable ONLINE,'E:\')), offline clears it.
  app.post('/api/backups/online', async (request, reply) => {
    const ctx = sessionCtx(request, ADM);
    const b = onlineBody.parse(request.body ?? {});
    const drive = b.online ? ((await getVariavel('ONLINE')) ?? 'E:\\') : null;
    await repo.online(b.ids, b.online, drive, ctx);
    audit(request, 'backups.online', { ids: b.ids, online: b.online, drive });
    return reply.status(204).send();
  });
}
