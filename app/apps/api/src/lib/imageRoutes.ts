import oracledb from 'oracledb';
import type { FastifyInstance } from 'fastify';
import type { Role } from '@gestsiid/shared';
import { AppError, mapOracleError } from '../db/errors.ts';
import { lockRow, withConnection, withTransaction, type DbPool } from '../db/oracle.ts';
import { sessionCtx, type CrudCtx } from './crud.ts';

/**
 * One image column, three routes (ARCHITECTURE.md §6 "Images"): `PUT` (multipart field `ficheiro`),
 * `GET`, `DELETE`. The bytes are stored as they arrive (the report engine reads them), so the
 * defences are: first-bytes allow-list (JPEG, PNG, GIF, BMP → else 415), size limit (413), a
 * `Content-Type` taken from the bytes and never from the client, `nosniff`, `attachment` for bytes
 * of no known type. `@fastify/multipart` is registered once in `app.ts`, not here.
 */

export type ImageKey = Record<string, unknown>;

export interface ImageStore {
  /** null = no row, or no image in it. */
  get(key: ImageKey, ctx: CrudCtx): Promise<Buffer | null>;
  /** false = no row with that key. */
  set(key: ImageKey, data: Buffer, ctx: CrudCtx): Promise<boolean>;
  clear(key: ImageKey, ctx: CrudCtx): Promise<boolean>;
}

const SIGNATURES: [mime: string, magic: number[]][] = [
  ['image/jpeg', [0xff, 0xd8, 0xff]],
  ['image/png', [0x89, 0x50, 0x4e, 0x47]],
  ['image/gif', [0x47, 0x49, 0x46, 0x38]],
  ['image/bmp', [0x42, 0x4d]],
];

/** The image type named by the first bytes, or null (BR-MOD-06). */
export function sniffImage(data: Buffer): string | null {
  return SIGNATURES.find(([, magic]) => magic.every((b, i) => data[i] === b))?.[0] ?? null;
}

const BAD_TYPE = 'Tipo de ficheiro não suportado. Use JPEG, PNG, GIF ou BMP.';
const NO_IMAGE = 'Imagem não encontrada.';

export interface ImageRoutesOptions {
  /** `/api/<resource>/:id/<image>`; every `:param` goes to `key`. */
  path: string;
  store: ImageStore;
  /** Route params → the store's key (zod-parse here: a throw is a 400). */
  key: (params: Record<string, string>) => ImageKey;
  roles: readonly Role[];
  maxBytes: number;
}

export function imageRoutes(app: FastifyInstance, opts: ImageRoutesOptions): void {
  const { path, store, roles, maxBytes } = opts;
  const keyOf = (params: unknown) => opts.key(params as Record<string, string>);

  app.get(path, async (request, reply) => {
    const ctx = sessionCtx(request, roles);
    const data = await store.get(keyOf(request.params), ctx);
    if (!data) throw new AppError(404, 'NAO_ENCONTRADO', NO_IMAGE);
    const mime = sniffImage(data);
    reply.header('Cache-Control', 'private, no-store').header('X-Content-Type-Options', 'nosniff');
    if (!mime) reply.header('Content-Disposition', 'attachment');
    return reply.type(mime ?? 'application/octet-stream').send(data);
  });

  app.put(path, async (request, reply) => {
    const ctx = sessionCtx(request, roles);
    const key = keyOf(request.params);
    if (!request.isMultipart()) throw new AppError(415, 'TIPO_FICHEIRO_INVALIDO', BAD_TYPE);
    let data: Buffer;
    try {
      const part = await request.file({ limits: { fileSize: maxBytes, files: 1, fields: 0 } });
      if (!part || part.fieldname !== 'ficheiro') throw noFile();
      data = await part.toBuffer();
    } catch (e) {
      request.log.warn({ err: e }, 'upload rejected');
      throw mapMultipartError(e, app, maxBytes);
    }
    if (!sniffImage(data)) throw new AppError(415, 'TIPO_FICHEIRO_INVALIDO', BAD_TYPE);
    if (!(await store.set(key, data, ctx))) throw new AppError(404, 'NAO_ENCONTRADO', NO_IMAGE);
    reply.status(204);
  });

  app.delete(path, async (request, reply) => {
    const ctx = sessionCtx(request, roles);
    if (!(await store.clear(keyOf(request.params), ctx)))
      throw new AppError(404, 'NAO_ENCONTRADO', NO_IMAGE);
    reply.status(204);
  });
}

const noFile = () =>
  new AppError(400, 'VALIDACAO', 'Dados inválidos.', {
    fields: { ficheiro: 'Ficheiro em falta.' },
  });

function mapMultipartError(e: unknown, app: FastifyInstance, maxBytes: number): unknown {
  if (e instanceof AppError) return e;
  if (e instanceof app.multipartErrors.RequestFileTooLargeError)
    return new AppError(
      413,
      'FICHEIRO_GRANDE',
      `O ficheiro excede o tamanho máximo (${Math.floor(maxBytes / 1024 / 1024) || '<1'} MB).`,
    );
  // Anything else while parsing the upload (extra field, broken framing) is the client's mistake.
  return noFile();
}

// ── Oracle ───────────────────────────────────────────────────────────────────────────────────

const IDENTIFIER_RE = /^[A-Z][A-Z0-9_$#]{0,29}$/;

export interface OracleImageConfig {
  table: string;
  column: string;
  /** WHERE fragment over the key's bind names, e.g. `ID = :id`. Server code, never client text. */
  keyWhere: string;
  /** Audit columns set on every write (D-08); `null` for a table without them. */
  audit?: { by: string; at: string } | null;
}

/** BLOB access by key: bind-only SQL, `lockRow` + one transaction per write (§3). */
export function oracleImageStore(
  pool: DbPool,
  config: OracleImageConfig,
  callTimeoutMs: number,
): ImageStore {
  const { table, column, keyWhere } = config;
  const audit = config.audit === undefined ? { by: 'ACTUALIZADO_POR', at: 'DATA_ACTUALIZACAO' } : config.audit;
  for (const id of [table, column, audit?.by, audit?.at])
    if (id !== undefined && !IDENTIFIER_RE.test(id)) throw new Error(`Identificador inválido: ${id}`);

  const write = async (key: ImageKey, value: string, extra: Record<string, unknown>, ctx: CrudCtx) => {
    try {
      return await withTransaction(pool, ctx.user, `${table}.imagem`, callTimeoutMs, async (conn) => {
        try {
          await lockRow(conn, table, keyWhere, key, {});
        } catch (e) {
          if (e instanceof AppError && e.code === 'REGISTO_ALTERADO') return false; // no such row
          throw e;
        }
        const sets = [
          `${column} = ${value}`,
          ...(audit ? [`${audit.by} = :__user`, `${audit.at} = SYSDATE`] : []),
        ];
        await conn.execute(`UPDATE ${table} SET ${sets.join(', ')} WHERE ${keyWhere}`, {
          ...key,
          ...extra,
          ...(audit ? { __user: ctx.user.username } : {}),
        } as oracledb.BindParameters);
        return true;
      });
    } catch (e) {
      throw e instanceof AppError ? e : mapOracleError(e);
    }
  };

  return {
    get: (key, ctx) =>
      withConnection(pool, ctx.user, `${table}.imagem.get`, callTimeoutMs, async (conn) => {
        const row = (
          await conn.execute<{ IMG: Buffer | null }>(
            `SELECT ${column} AS IMG FROM ${table} WHERE ${keyWhere}`,
            key as oracledb.BindParameters,
            { fetchInfo: { IMG: { type: oracledb.BUFFER } } },
          )
        ).rows?.[0];
        return row?.IMG ?? null;
      }),
    set: (key, data, ctx) =>
      write(key, ':__img', { __img: { val: data, type: oracledb.DB_TYPE_BLOB } }, ctx),
    clear: (key, ctx) => write(key, 'NULL', {}, ctx),
  };
}
