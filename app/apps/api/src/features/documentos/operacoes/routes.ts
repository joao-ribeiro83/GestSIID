import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { pt, type Role } from '@gestsiid/shared';
import { AppError } from '../../../db/errors.ts';
import { audit } from '../../../http/audit.ts';
import type { SessionUser } from '../../../http/auth-guard.ts';
import { listQueryOf, sessionCtx } from '../../../lib/crud.ts';
import { hasRegeneracaoReauth } from '../../auth/routes.ts';
import { MAX_SELECCAO, type DocumentosRepo } from '../repo.ts';
import type { TipoImpressao } from './regras.ts';
import * as servico from './servico.ts';
import type { OperacoesDb, Resultado } from './servico.ts';

/**
 * Toolbar and popup actions of FD_GESTAO_SIID (Step 7.2, ARCHITECTURE §4.2, §4.3, §5, §10.1,
 * analysis/DOCUMENT_STATES.md).
 *
 *   POST /api/documentos/acoes/:acao                       ADM        { ids | consulta [| todaFila], impressoraId?, force? } → { ok, skipped, pedidos? }
 *   POST /api/documentos/:id/clonar                        ADM        { parametros } → 201 { id }  (owner, 2026-09-30)
 *   POST /api/documentos/:docId/fila/:queueId/cancelar     ADM, USER  → 204
 *   POST /api/documentos/:id/comentarios                   ADM        { comentario } → 201 { COMENTARIO_ID }  (Step 7.4, BR-DOC-30)
 *   GET  /api/documentos/fila/contagem?estado=             ADM        → { n }
 */

const ADM: readonly Role[] = ['ADM'];
const TODOS: readonly Role[] = ['ADM', 'USER'];

const id = z.coerce.number().int().positive();
const ids = z.array(z.number().int().positive()).min(1).max(1000).refine((a) => new Set(a).size === a.length, 'ids repetidos');
const seleccao = { ids: ids.optional(), consulta: z.record(z.string(), z.unknown()).optional() };
const IMPRESSAO: Record<string, TipoImpressao> = { reimprimir: 'IMPRESSAO', 'segunda-via': '2.VIA', copia: 'COPIA' };

/** One strict body schema per action: a field the action does not take is a 400. */
const BODIES = {
  regerar: z.object(seleccao).strict(),
  reimprimir: z.object({ ...seleccao, impressoraId: z.string().min(1).max(30).optional() }).strict(),
  'segunda-via': z.object({ ...seleccao, impressoraId: z.string().min(1).max(30).optional() }).strict(),
  copia: z.object({ ...seleccao, impressoraId: z.string().min(1).max(30).optional() }).strict(),
  anular: z.object(seleccao).strict(),
  cancelar: z.object({ ...seleccao, force: z.boolean().default(false) }).strict(),
  suspender: z.object({ ...seleccao, todaFila: z.boolean().default(false) }).strict(),
  retomar: z.object({ ...seleccao, todaFila: z.boolean().default(false) }).strict(),
  'reenviar-edoc': z.object(seleccao).strict(),
  'reenviar-email': z.object(seleccao).strict(),
  rearquivar: z.object(seleccao).strict(),
} as const;
type Acao = keyof typeof BODIES;

const clonarBody = z.object({
  // valor: SVR_DOCUMENTOS.PARAMETROnn is VARCHAR2(2000).
  parametros: z.array(z.object({ nome: z.string().min(1).max(30), valor: z.string().max(2000) })).max(100),
});
const comentarioBody = z.object({ comentario: z.string().trim().min(1).max(2000) }).strict();
const contagemQuery = z.object({ estado: z.enum(['ESPERA', 'SUSPENSO']) });
const filaParams = z.object({ docId: id, queueId: id });

const invalido = (msg: string) => new AppError(400, 'VALIDACAO', 'Dados inválidos.', { fields: { seleccao: msg } });
/** `session.user` is the login's SessionUser (§5); sessionCtx only types its `username` and `role`. */
const utilizador = (request: FastifyRequest, roles: readonly Role[]) => sessionCtx(request, roles).user as SessionUser;

export function registerOperacoesRoutes(app: FastifyInstance, opts: { db: OperacoesDb; repo: DocumentosRepo }): void {
  const { db, repo } = opts;

  /** §4.2: `ids` or the whole `consulta`, never both. */
  async function resolver(request: FastifyRequest, body: { ids?: number[]; consulta?: Record<string, unknown> }): Promise<number[]> {
    if (body.ids && body.consulta) throw invalido('Indique ids ou consulta, não ambos.');
    if (body.ids) return body.ids;
    if (!body.consulta) throw invalido('Indique ids ou consulta.');
    const ids = await repo.ids(listQueryOf(body.consulta), sessionCtx(request, ADM));
    if (ids.length > MAX_SELECCAO) throw new AppError(422, 'SELECCAO_EXCESSIVA', pt.documentos.seleccaoExcessiva);
    return ids;
  }

  app.post('/api/documentos/acoes/:acao', async (request) => {
    const user = utilizador(request, ADM);
    const acao = (request.params as { acao: string }).acao;
    if (!Object.hasOwn(BODIES, acao)) throw new AppError(404, 'NAO_ENCONTRADO', 'Registo não encontrado.');
    const body = BODIES[acao as Acao].parse(request.body ?? {});
    const b = body as z.infer<(typeof BODIES)[Acao]> & { impressoraId?: string; force?: boolean; todaFila?: boolean };
    const todaFila = b.todaFila === true;
    if (todaFila && (b.ids || b.consulta)) throw invalido('todaFila não admite ids nem consulta.');
    const alvo = todaFila ? 'todos' : await resolver(request, b);
    const detalhes = (r: Resultado) => ({
      ok: r.ok,
      skipped: r.skipped.map((s) => s.id),
      ...(b.force !== undefined ? { force: b.force } : {}),
      ...(todaFila ? { todaFila } : {}),
      ...(r.pedidos !== undefined ? { pedidos: r.pedidos } : {}),
    });
    // A failure is audited too. Only anular can fail after some documents changed (each ANULAR
    // commits, A-01), so only it fills `parcial`; the other actions write in one transaction.
    const parcial: Resultado = { ok: [], skipped: [] };
    let r: Resultado;
    try {
      switch (acao as Acao) {
        case 'regerar':
          r = await servico.regerar(db, user, alvo as number[], hasRegeneracaoReauth(request));
          break;
        case 'reimprimir':
        case 'segunda-via':
        case 'copia':
          r = await servico.imprimir(db, user, alvo as number[], IMPRESSAO[acao]!, b.impressoraId ?? null);
          break;
        case 'anular':
          r = await servico.anular(db, user, alvo as number[], parcial);
          break;
        case 'cancelar':
          r = await servico.cancelar(db, user, alvo as number[], b.force === true);
          break;
        case 'suspender':
          r = await servico.suspender(db, user, alvo);
          break;
        case 'retomar':
          r = await servico.retomar(db, user, alvo);
          break;
        case 'reenviar-edoc':
          r = await servico.reenviarEdoc(db, user, alvo as number[]);
          break;
        case 'reenviar-email':
          r = await servico.reenviarEmail(db, user, alvo as number[]);
          break;
        case 'rearquivar':
          r = await servico.rearquivar(db, user, alvo as number[]);
          break;
      }
    } catch (e) {
      const erro = (e as { code?: unknown }).code;
      audit(request, `documentos.${acao}`, { ...detalhes(parcial), erro: typeof erro === 'string' ? erro : 'ERRO' });
      throw e;
    }
    audit(request, `documentos.${acao}`, detalhes(r));
    return r;
  });

  app.post('/api/documentos/:id/clonar', async (request, reply) => {
    const user = utilizador(request, ADM);
    const origem = z.object({ id }).parse(request.params).id;
    const { parametros } = clonarBody.parse(request.body ?? {});
    const novo = await servico.clonar(db, user, origem, parametros);
    audit(request, 'documentos.clonar', { origem, id: novo.id });
    return reply.status(201).send(novo);
  });

  app.post('/api/documentos/:docId/fila/:queueId/cancelar', async (request, reply) => {
    const user = utilizador(request, TODOS);
    const { docId, queueId } = filaParams.parse(request.params);
    await db.cancelarPedido(user, docId, queueId);
    audit(request, 'documentos.fila.cancelar', { documentoId: docId, queueId });
    return reply.status(204).send();
  });

  // BR-DOC-30; the USER form has the block but no insert (D-08).
  app.post('/api/documentos/:id/comentarios', async (request, reply) => {
    const user = utilizador(request, ADM);
    const documentoId = z.object({ id }).parse(request.params).id;
    const { comentario } = comentarioBody.parse(request.body ?? {});
    const novo = await db.comentar(user, documentoId, comentario);
    audit(request, 'documentos.comentar', { documentoId, comentarioId: novo });
    return reply.status(201).send({ COMENTARIO_ID: novo });
  });

  app.get('/api/documentos/fila/contagem', async (request) => {
    const user = utilizador(request, ADM);
    const { estado } = contagemQuery.parse(request.query);
    return { n: await db.contagemFila(user, estado) };
  });
}
