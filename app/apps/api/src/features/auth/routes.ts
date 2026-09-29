import { createHash } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { pt } from '@gestsiid/shared';
import { AppError } from '../../db/errors.ts';
import { audit } from '../../http/audit.ts';
import { requireRole, type SessionUser } from '../../http/auth-guard.ts';
import { generateCsrfToken } from '../../http/csrf.ts';
import type { LoginThrottle } from '../../http/login-throttle.ts';
import type { AuthRepo } from './repo.ts';

export interface AuthDeps {
  repo: AuthRepo;
  throttle: LoginThrottle;
  ambiente: string;
  basePath: string;
}

/** How long a correct regeneration password (reauth) stays valid in the session. */
const REAUTH_MS = 5 * 60_000;

/** For Regerar (Step 7.2): true while the session's regeneration reauth is fresh. */
export function hasRegeneracaoReauth(request: FastifyRequest): boolean {
  const until = request.session?.get('regeneracaoAte');
  return typeof until === 'number' && Date.now() < until;
}

const loginInvalido = () => new AppError(401, 'LOGIN_INVALIDO', pt.loginInvalido);
const passwordErrada = () => new AppError(403, 'PASSWORD_ERRADA', pt.passwordErrada);

// Lengths = CFG_UTILIZADORES.USERNAME (30) / PASSWORD (100); they also cap the DES input.
const str = (max: number) => z.string().max(max).optional().catch(undefined);
const loginBody = z.object({ utilizador: str(30), password: str(100) }).catch({});
const regenBody = z.object({
  actual: z.string().min(1).max(100),
  nova: z.string().min(1).max(100),
  confirmacao: z.string().max(100),
});
const reauthBody = z.object({ password: z.string().min(1).max(100) });

/**
 * Login, me, logout and the shared regeneration password (ARCHITECTURE.md §5, D-07, BR-AUTH-01..09,
 * BR-DOC-14). Every login refusal — unknown user, wrong password, outside DATA_INICIO/DATA_FIM,
 * throttled — is the same 401 so none of them tells an attacker which case it hit.
 */
export function registerAuthRoutes(app: FastifyInstance, deps: AuthDeps): void {
  const { repo, throttle, ambiente } = deps;
  const url = (path: string) => `${deps.basePath}/api/auth/${path}`;
  const anyRole = requireRole('ADM', 'USER');
  const admOnly = requireRole('ADM');

  app.post(url('login'), { config: { public: true } }, async (request) => {
    const body = loginBody.parse(request.body ?? {});
    const utilizador = body.utilizador?.trim() ?? '';
    const password = body.password ?? '';
    const fields: Record<string, string> = {};
    if (!utilizador) fields['utilizador'] = pt.utilizadorObrigatorio;
    if (!password) fields['password'] = pt.passwordObrigatoria;
    const first = Object.values(fields)[0];
    if (first) throw new AppError(400, 'VALIDACAO', first, { fields });

    const username = utilizador.toUpperCase(); // LOGIN.UTILIZADOR has CaseRestriction="Upper"
    const refuse = (motivo: string) => {
      // A short hash, not the text: the box may hold a password pasted by mistake. Still lets an
      // operator see that the same account is being hit.
      const utilizadorHash = createHash('sha256').update(username).digest('hex').slice(0, 8);
      audit(request, 'login.fail', { utilizadorHash, motivo });
      return loginInvalido();
    };

    if (!throttle.checkLogin(request.ip, username)) throw refuse('bloqueado');
    // Count the failure before the DB call, so parallel guesses cannot all slip past the lock;
    // loginSucceeded clears it again.
    throttle.loginFailed(request.ip, username);
    const row = await repo.findLogin(username, password, ambiente);
    if (!row || row.OK !== 1 || row.ATIVO !== 1)
      throw refuse(!row ? 'utilizador' : row.OK !== 1 ? 'password' : 'inativo');
    throttle.loginSucceeded(request.ip, username);

    const user: SessionUser = {
      username: row.USERNAME,
      nome: row.NOME ?? row.USERNAME,
      role: row.TIPO_UTILIZADOR_RF === 'ADM' ? 'ADM' : 'USER',
      ambiente,
    };
    await request.session.regenerate(); // new id: no session fixation
    const csrf = generateCsrfToken();
    request.session.set('user', user);
    request.session.set('csrf', csrf);
    audit(request, 'login.ok');
    return { user, csrf };
  });

  app.get(url('me'), { preHandler: anyRole }, async (request) => ({
    user: request.currentUser,
    csrf: request.session.get('csrf'),
  }));

  app.post(url('logout'), { preHandler: anyRole }, async (request, reply) => {
    audit(request, 'logout');
    await request.session.destroy();
    reply.status(204);
  });

  // FD_ALTERAR_PASSWORD sets the shared regeneration password, not the login password (BR-AUTH-09).
  // D-07d: ADM only, current value required, binds instead of FORMS_DDL, audited.
  app.post(url('regeneracao-password'), { preHandler: admOnly }, async (request, reply) => {
    const { actual, nova, confirmacao } = regenBody.parse(request.body);
    const { username } = request.currentUser!;
    if (throttle.regenBlocked(username)) throw passwordErrada();
    if (nova !== confirmacao)
      throw new AppError(422, 'PASSWORDS_DIFERENTES', pt.passwordsNaoCoincidem, {
        fields: { confirmacao: pt.passwordsNaoCoincidem },
      });

    if (!(await repo.setRegeneracao(actual, nova, ambiente, username))) {
      throttle.regenFailed(username);
      audit(request, 'regeneracao.alterar.fail');
      throw passwordErrada();
    }
    throttle.regenSucceeded(username);
    audit(request, 'regeneracao.alterada');
    reply.status(204);
  });

  // CONFIRMAR_PASSWORD (BR-DOC-14): a correct value marks the session for REAUTH_MS.
  app.post(url('reauth-regeneracao'), { preHandler: admOnly }, async (request, reply) => {
    const { password } = reauthBody.parse(request.body);
    const { username } = request.currentUser!;
    if (throttle.regenBlocked(username)) throw passwordErrada();

    if (!(await repo.checkRegeneracao(password, ambiente, username))) {
      throttle.regenFailed(username);
      audit(request, 'regeneracao.reauth.fail');
      throw passwordErrada();
    }
    throttle.regenSucceeded(username);
    request.session.set('regeneracaoAte', Date.now() + REAUTH_MS);
    audit(request, 'regeneracao.reauth.ok');
    reply.status(204);
  });
}
