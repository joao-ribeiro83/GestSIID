import { Readable } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { documentos, pagedResult } from '@gestsiid/shared';
import { AppError } from '../../db/errors.ts';
import { listQueryOf, sessionCtx } from '../../lib/crud.ts';
import { TABS, type DocumentosRepo } from './repo.ts';

/**
 * Gestão › Documentos read side (FD_GESTAO_SIID / _USER, Step 7.1; ARCHITECTURE §4.1, §5, §6,
 * §10.1). Every route is ADM + USER; USER differences live in the resource (sort = ID only) and
 * in the detail column list.
 *
 *   GET /api/documentos                      list: presets, QBE, sorts, param[NOME]/paramModelo, grupo
 *   GET /api/documentos/:id                  DETALHES_DOCUMENTO (reduced for USER, D-08)
 *   GET /api/documentos/:id/<tab>            parametros | comentarios | anexos | fila | erros → { rows }
 *   GET /api/documentos/:id/pdf              FileServerSIID proxy (D-03, D-29)
 *   GET /api/documentos/conversoes/recibo?nmrecinue= | pessoa?cdideper=   CONVERTE_PARAM → { valor }
 */

export interface FileServer {
  /** FILESERVER_BASE_URL: `…/FileServerSIID/restapi/FileServer/pdf/{T|P}`. */
  baseUrl: string;
  timeoutMs: number;
}

const ROLES = documentos.roles.read;
const idParam = z.object({ id: z.coerce.number().int().positive() });
const reciboQuery = z.object({ nmrecinue: z.string().regex(/^\d{1,20}$/) });
const pessoaQuery = z.object({ cdideper: z.string().min(1).max(20) });

const NAO_DISPONIVEL = 'Documento não disponível';
const MOTIVO: Record<string, string> = { OFF: 'backup offline', ANU: 'documento anulado' };
const naoDisponivel = (status: 404 | 502, disponibilidade?: string) => {
  const motivo = disponibilidade && MOTIVO[disponibilidade];
  return new AppError(status, 'DOCUMENTO_NAO_DISPONIVEL', motivo ? `${NAO_DISPONIVEL}: ${motivo}.` : `${NAO_DISPONIVEL}.`);
};

export function registerDocumentosRoutes(
  app: FastifyInstance,
  opts: { repo: DocumentosRepo; fileServer: FileServer },
): void {
  const { repo, fileServer } = opts;

  app.get('/api/documentos', async (request) => {
    const ctx = sessionCtx(request, ROLES);
    const q = listQueryOf(request.query);
    const { rows, total } = await repo.list(q, ctx);
    return pagedResult(rows, total, q.page, q.size);
  });

  app.get('/api/documentos/conversoes/recibo', async (request) => {
    const { user } = sessionCtx(request, ROLES);
    return { valor: await repo.conversao('recibo', reciboQuery.parse(request.query).nmrecinue, user) };
  });

  app.get('/api/documentos/conversoes/pessoa', async (request) => {
    const { user } = sessionCtx(request, ROLES);
    return { valor: await repo.conversao('pessoa', pessoaQuery.parse(request.query).cdideper, user) };
  });

  app.get('/api/documentos/:id', async (request) => {
    const { user } = sessionCtx(request, ROLES);
    const row = await repo.detalhe(idParam.parse(request.params).id, user.role, user);
    if (!row) throw new AppError(404, 'NAO_ENCONTRADO', 'Registo não encontrado.');
    return row;
  });

  for (const tab of TABS) {
    app.get(`/api/documentos/:id/${tab}`, async (request) => {
      const { user } = sessionCtx(request, ROLES);
      return { rows: await repo.tab(tab, idParam.parse(request.params).id, user) };
    });
  }

  app.get('/api/documentos/:id/pdf', async (request, reply) => {
    const { user } = sessionCtx(request, ROLES);
    const { id } = idParam.parse(request.params);
    const disponibilidade = await repo.disponibilidade(id, user);
    if (disponibilidade === undefined) throw new AppError(404, 'NAO_ENCONTRADO', 'Registo não encontrado.');

    const url = new URL(fileServer.baseUrl);
    url.searchParams.set('spoolid', String(id));
    // The timeout covers the answer (status + headers) only: AbortSignal.timeout would also cut a
    // large PDF that is still streaming.
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), fileServer.timeoutMs);
    let res: Response;
    try {
      res = await fetch(url, { signal: abort.signal });
    } catch {
      throw naoDisponivel(502, disponibilidade);
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok || !res.body || !res.headers.get('content-type')?.startsWith('application/pdf')) {
      await res.body?.cancel();
      throw naoDisponivel(404, disponibilidade);
    }
    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `inline; filename="${id}.pdf"`)
      .header('Cache-Control', 'private, no-store')
      .send(Readable.fromWeb(res.body as WebReadableStream<Uint8Array>));
  });
}
