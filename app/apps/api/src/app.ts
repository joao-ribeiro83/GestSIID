import multipart from '@fastify/multipart';
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import {
  dominios,
  dominiosValores,
  empregadosLov,
  funcoesDepartamento,
  impressoras,
  impressorasAssociadasDoc,
  impressorasAssociadasUsr,
  modelos,
  modelosAtributosArquivo,
  modelosAtributosEdoc,
  modelosCondicoes,
  modelosLov,
  modelosParametrosOmissao,
  modelosSeccoes,
  perfisDepartamento,
  permissoes,
  tiposMidia,
  unidadesMedida,
  utilizadores,
  utilizadoresLov,
  variaveis,
} from '@gestsiid/shared';
import { oracleStore } from './lib/crud.ts';
import { oracleImageStore } from './lib/imageRoutes.ts';
import type { DbPool } from './db/oracle.ts';
import type { AuthRepo } from './features/auth/repo.ts';
import { registerAuthRoutes } from './features/auth/routes.ts';
import { oracleBackupsRepo } from './features/backups/oracle.ts';
import { registerBackupsRoutes } from './features/backups/routes.ts';
import { registerDevRoutes } from './features/dev/routes.ts';
import { oracleDocumentosRepo } from './features/documentos/repo.ts';
import { registerDocumentosRoutes, type FileServer } from './features/documentos/routes.ts';
import { oracleOperacoesDb } from './features/documentos/operacoes/oracle.ts';
import { registerOperacoesRoutes } from './features/documentos/operacoes/routes.ts';
import { registerDominiosCrudRoutes } from './features/dominios/routes.ts';
import { createDominiosCache, registerDominiosRoutes } from './features/dominios/valores.ts';
import { registerHealthRoute } from './features/health/routes.ts';
import { registerImpressorasAssociadasRoutes } from './features/impressoras-associadas/routes.ts';
import { registerImpressorasRoutes } from './features/impressoras/routes.ts';
import { oracleModelosRepo, SECCAO_IMAGEM } from './features/modelos/repo.ts';
import { registerModelosRoutes } from './features/modelos/routes.ts';
import { oraclePerfisRepo } from './features/perfis-departamento/repo.ts';
import { registerPerfisDepartamentoRoutes } from './features/perfis-departamento/routes.ts';
import { oraclePermissoesRepo } from './features/permissoes/repo.ts';
import { registerPermissoesRoutes } from './features/permissoes/routes.ts';
import { registerTiposMidiaRoutes } from './features/tipos-midia/routes.ts';
import { registerUnidadesMedidaRoutes } from './features/unidades-medida/routes.ts';
import { registerUtilizadoresRoutes } from './features/utilizadores/routes.ts';
import { registerVariaveisRoutes } from './features/variaveis/routes.ts';
import { createGetVariavel } from './lib/variaveis.ts';
import { registerAuthGuard } from './http/auth-guard.ts';
import { registerErrorHandler } from './http/errors.ts';
import { LoginThrottle } from './http/login-throttle.ts';
import { registerSecurityHeaders } from './http/security-headers.ts';
import { registerSession } from './http/session.ts';
import { registerSpa } from './http/spa.ts';

export interface AppConfig {
  COOKIE_SECURE: boolean;
  /** false, or the reverse proxy's address(es) / CIDR (config.ts). */
  TRUST_PROXY: string | false;
  BASE_PATH: string;
  SESSION_SECRET: string;
  /** Upload size limit in MiB (image routes, §6); default 10. */
  UPLOAD_MAX_MB?: number;
}

export interface AppDeps {
  config: AppConfig;
  ambiente: string;
  /** Runs `SELECT 1 FROM DUAL` and resolves with the round-trip latency in ms. */
  checkDb: () => Promise<number>;
  /** The built SPA (`apps/web/dist`); null = API only (dev server before a web build). */
  distDir: string | null;
  /** `/api/auth/*` data access; absent = no auth routes (the Oracle-less dev server). */
  authRepo?: AuthRepo;
  /** pino options; audit lines (§5) go here. Default: no logging. */
  logger?: FastifyServerOptions['logger'];
  /** `/dev/datablock` in-memory demo API (dev-server.ts only). */
  devMocks?: boolean;
  /** Oracle-backed resource routes (Impressoras, the domain lookup, …); absent = none registered. */
  db?: { pool: DbPool; callTimeoutMs: number };
  /** FileServerSIID for the Documentos PDF proxy (§6); the Documentos routes need it and `db`. */
  fileServer?: FileServer;
}

/**
 * Assembles the Fastify app (§2, §8): security headers, session, the central error handler,
 * `GET /api/health`, and the static SPA with its client-route fallback. Tests call this
 * directly with fake deps instead of booting a real DB pool.
 */
export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({ trustProxy: deps.config.TRUST_PROXY, logger: deps.logger ?? false });

  registerSecurityHeaders(app, deps.config);
  registerErrorHandler(app);
  const sessions = await registerSession(app, deps.config);
  // CSRF stays on whenever real login is possible, even in the Oracle-less dev server
  // (Step 3.2): only the auto-login dev demo (no authRepo) can skip it.
  const maxBytes = (deps.config.UPLOAD_MAX_MB ?? 10) * 1024 * 1024;
  // Global ceiling (one file, no text fields); image routes repeat it per request (lib/imageRoutes.ts).
  await app.register(multipart, { limits: { fileSize: maxBytes, files: 1, fields: 0, parts: 1 } });
  registerAuthGuard(app, { csrf: deps.authRepo ? true : !deps.devMocks });

  registerHealthRoute(app, {
    ambiente: deps.ambiente,
    checkDb: deps.checkDb,
    basePath: deps.config.BASE_PATH,
  });

  if (deps.authRepo) {
    const throttle = new LoginThrottle();
    throttle.start();
    app.addHook('onClose', async () => throttle.stop());
    registerAuthRoutes(app, {
      repo: deps.authRepo,
      throttle,
      ambiente: deps.ambiente,
      basePath: deps.config.BASE_PATH,
    });
  }

  if (deps.devMocks)
    await app.register(registerDevRoutes, {
      prefix: deps.config.BASE_PATH,
      autoLogin: !deps.authRepo,
    });

  if (deps.db) {
    const { pool, callTimeoutMs } = deps.db;
    await app.register(
      async (sub) => {
        registerImpressorasRoutes(sub, { store: oracleStore(pool, impressoras, callTimeoutMs) });
        const unidades = oracleStore(pool, unidadesMedida, callTimeoutMs);
        registerUnidadesMedidaRoutes(sub, { store: unidades });
        registerTiposMidiaRoutes(sub, { store: oracleStore(pool, tiposMidia, callTimeoutMs), unidades });
        registerUtilizadoresRoutes(sub, {
          store: oracleStore(pool, utilizadores, callTimeoutMs),
          ambiente: deps.ambiente,
          destroySessions: (username) => void sessions.destroyUserSessions(username),
        });
        registerVariaveisRoutes(sub, {
          store: oracleStore(pool, variaveis, callTimeoutMs),
          ambiente: deps.ambiente,
        });
        const dominiosCache = createDominiosCache();
        registerDominiosRoutes(sub, { pool, callTimeoutMs, cache: dominiosCache });
        registerDominiosCrudRoutes(sub, {
          store: oracleStore(pool, dominios, callTimeoutMs),
          valoresStore: oracleStore(pool, dominiosValores, callTimeoutMs),
          cache: dominiosCache,
        });
        registerImpressorasAssociadasRoutes(sub, {
          docStore: oracleStore(pool, impressorasAssociadasDoc, callTimeoutMs),
          usrStore: oracleStore(pool, impressorasAssociadasUsr, callTimeoutMs),
          modelosStore: oracleStore(pool, modelosLov, callTimeoutMs),
          utilizadoresStore: oracleStore(pool, utilizadoresLov, callTimeoutMs),
          ambiente: deps.ambiente,
        });
        registerPermissoesRoutes(sub, {
          store: oracleStore(pool, permissoes, callTimeoutMs),
          repo: oraclePermissoesRepo(pool, callTimeoutMs),
        });
        registerPerfisDepartamentoRoutes(sub, {
          store: oracleStore(pool, perfisDepartamento, callTimeoutMs),
          empregadosStore: oracleStore(pool, empregadosLov, callTimeoutMs),
          funcoesStore: oracleStore(pool, funcoesDepartamento, callTimeoutMs),
          repo: oraclePerfisRepo(pool, callTimeoutMs),
          imageStore: oracleImageStore(
            pool,
            { table: 'DOC_PERFIS_DEPARTAMENTO', column: 'ASSINATURA', keyWhere: 'ID = :id' },
            callTimeoutMs,
          ),
          maxBytes,
        });
        registerModelosRoutes(sub, {
          stores: {
            modelos: oracleStore(pool, modelos, callTimeoutMs),
            seccoes: oracleStore(pool, modelosSeccoes, callTimeoutMs),
            condicoes: oracleStore(pool, modelosCondicoes, callTimeoutMs),
            omissao: oracleStore(pool, modelosParametrosOmissao, callTimeoutMs),
            atributosEdoc: oracleStore(pool, modelosAtributosEdoc, callTimeoutMs),
            atributosArquivo: oracleStore(pool, modelosAtributosArquivo, callTimeoutMs),
          },
          repo: oracleModelosRepo(pool, callTimeoutMs),
          imageStore: oracleImageStore(pool, SECCAO_IMAGEM, callTimeoutMs),
          maxBytes,
        });
        registerBackupsRoutes(sub, {
          repo: oracleBackupsRepo(pool, callTimeoutMs),
          getVariavel: createGetVariavel({ pool, ambiente: deps.ambiente, callTimeoutMs }),
        });
        if (deps.fileServer) {
          const repo = oracleDocumentosRepo(pool, callTimeoutMs);
          registerDocumentosRoutes(sub, { repo, fileServer: deps.fileServer });
          registerOperacoesRoutes(sub, { repo, db: oracleOperacoesDb(pool, callTimeoutMs) });
        }
      },
      { prefix: deps.config.BASE_PATH },
    );
  }

  if (deps.distDir)
    await registerSpa(app, { distDir: deps.distDir, basePath: deps.config.BASE_PATH });

  return app;
}
