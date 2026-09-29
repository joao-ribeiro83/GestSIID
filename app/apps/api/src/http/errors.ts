import type { FastifyError, FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../db/errors.ts';

/** Every non-2xx response body (ARCHITECTURE.md §8). */
export interface ErrorBody {
  code: string;
  message: string;
  requestId: string;
  fields?: Record<string, string>;
}

function zodFields(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '(root)';
    fields[key] = issue.message;
  }
  return fields;
}

function fastifyValidationFields(validation: Array<{ instancePath?: string; message?: string }>): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of validation) {
    const key = issue.instancePath?.replace(/^\//, '') || '(root)';
    fields[key] = issue.message ?? 'Dados inválidos.';
  }
  return fields;
}

/**
 * Central error handler (ARCHITECTURE.md §8): AppError → its own status/code/message/fields;
 * a Zod or Fastify schema validation failure → 400 VALIDACAO with per-field messages; anything
 * else → 500 ERRO, the real message logged but never returned to the client.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler<FastifyError | AppError | ZodError>((error, request, reply) => {
    if (error instanceof AppError) {
      if (error.statusCode >= 500) {
        request.log.error({ err: error, oraCode: error.oraCode }, error.message);
      }
      const body: ErrorBody = {
        code: error.code,
        message: error.message,
        requestId: request.id,
        ...(error.fields ? { fields: error.fields } : {}),
      };
      reply.status(error.statusCode).send(body);
      return;
    }

    if (error instanceof ZodError) {
      const body: ErrorBody = {
        code: 'VALIDACAO',
        message: 'Dados inválidos.',
        requestId: request.id,
        fields: zodFields(error),
      };
      reply.status(400).send(body);
      return;
    }

    if (error.validation) {
      const body: ErrorBody = {
        code: 'VALIDACAO',
        message: 'Dados inválidos.',
        requestId: request.id,
        fields: fastifyValidationFields(error.validation as Array<{ instancePath?: string; message?: string }>),
      };
      reply.status(400).send(body);
      return;
    }

    // A client mistake Fastify already classified (malformed JSON, unsupported type, body too large).
    const status = (error as FastifyError).statusCode;
    if (status !== undefined && status >= 400 && status < 500) {
      const body: ErrorBody = { code: 'PEDIDO_INVALIDO', message: 'Pedido inválido.', requestId: request.id };
      reply.status(status).send(body);
      return;
    }

    request.log.error({ err: error }, 'unhandled error');
    const body: ErrorBody = { code: 'ERRO', message: 'Erro', requestId: request.id };
    reply.status(500).send(body);
  });
}
