import { Writable } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';
import { pt } from '@gestsiid/shared';
import { buildApp } from '../../app.ts';
import { requireRole } from '../../http/auth-guard.ts';
import type { AuthRepo, LoginRow } from './repo.ts';
import { hasRegeneracaoReauth } from './routes.ts';

/** Fake DB: one user table and one regeneration password, compared in plain text. */
function fakeRepo(users: Record<string, LoginRow & { password: string }> = {}, regen = 'regen') {
  const calls: unknown[][] = [];
  const state = { regen };
  const repo: AuthRepo = {
    async findLogin(username, password, ambiente) {
      calls.push(['findLogin', username, password, ambiente]);
      await new Promise((r) => setTimeout(r, 2)); // DB latency, so concurrent requests overlap
      const u = users[username];
      if (!u || ambiente !== 'GADOR_TESTES') return undefined;
      const { password: stored, ...row } = u;
      return { ...row, OK: stored === password ? 1 : 0 };
    },
    async checkRegeneracao(password, ambiente, username) {
      calls.push(['checkRegeneracao', password, ambiente, username]);
      return password === state.regen;
    },
    async setRegeneracao(actual, nova, ambiente, username) {
      calls.push(['setRegeneracao', actual, nova, ambiente, username]);
      if (actual !== state.regen) return false;
      state.regen = nova;
      return true;
    },
  };
  return { repo, calls, state };
}

const ADMIN = { USERNAME: 'ADMIN', NOME: 'Admin', TIPO_UTILIZADOR_RF: 'ADM', OK: 1, ATIVO: 1, password: 'pw' } as const;
const JOAO = { USERNAME: 'JOAO', NOME: 'João', TIPO_UTILIZADOR_RF: 'USR', OK: 1, ATIVO: 1, password: 'pw' } as const;
const OLD = { USERNAME: 'OLD', NOME: 'Old', TIPO_UTILIZADOR_RF: 'ADM', OK: 1, ATIVO: 0, password: 'pw' } as const;

async function setup(opts: { users?: Parameters<typeof fakeRepo>[0] } = {}) {
  const fake = fakeRepo(opts.users ?? { ADMIN, JOAO, OLD });
  const logs: Record<string, unknown>[] = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      for (const line of String(chunk).split('\n').filter(Boolean)) logs.push(JSON.parse(line));
      cb();
    },
  });
  const app = await buildApp({
    config: { COOKIE_SECURE: false, TRUST_PROXY: false, BASE_PATH: '', SESSION_SECRET: 'x'.repeat(32) },
    ambiente: 'GADOR_TESTES',
    checkDb: async () => 1,
    distDir: null,
    authRepo: fake.repo,
    logger: { level: 'info', stream },
  });
  app.get('/api/test/whoami', { preHandler: requireRole('ADM', 'USER') }, async (req) => ({
    user: req.currentUser,
    reauth: hasRegeneracaoReauth(req),
  }));
  app.post('/api/test/write', { preHandler: requireRole('ADM', 'USER') }, async () => ({ ok: true }));
  const audits = (event: string) => logs.filter((l) => l['audit'] === true && l['event'] === event);
  return { app, ...fake, audits };
}

function cookieOf(res: { headers: Record<string, unknown> }): string {
  const raw = res.headers['set-cookie'];
  const first = Array.isArray(raw) ? raw[0] : String(raw);
  return first.split(';')[0]!;
}

async function login(app: Awaited<ReturnType<typeof setup>>['app'], utilizador: string, password = 'pw', ip = '10.0.0.1') {
  const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { utilizador, password }, remoteAddress: ip });
  return { res, cookie: res.statusCode === 200 ? cookieOf(res) : '', csrf: res.statusCode === 200 ? (res.json().csrf as string) : '' };
}

describe('POST /api/auth/login — validation', () => {
  it('missing utilizador → 400 VALIDACAO with the SEM_UTILIZADOR text', async () => {
    const { app, calls } = await setup();
    const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { utilizador: '  ', password: 'pw' } });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: 'VALIDACAO', message: pt.utilizadorObrigatorio, fields: { utilizador: pt.utilizadorObrigatorio } });
    expect(calls).toEqual([]);
    await app.close();
  });

  it('missing password → 400 VALIDACAO with the SEM_PASSWORD text', async () => {
    const { app } = await setup();
    const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { utilizador: 'ADMIN' } });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ message: pt.passwordObrigatoria, fields: { password: pt.passwordObrigatoria } });
    await app.close();
  });
});

describe('POST /api/auth/login — refusals', () => {
  it.each([
    ['unknown user', 'NOBODY', 'pw', 'utilizador'],
    ['wrong password', 'ADMIN', 'nope', 'password'],
    ['outside DATA_INICIO/DATA_FIM (SEC-006)', 'OLD', 'pw', 'inativo'],
  ])('%s → 401 LOGIN_INVALIDO and a login.fail audit line', async (_label, u, p, motivo) => {
    const { app, audits } = await setup();
    const { res } = await login(app, u, p);
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ code: 'LOGIN_INVALIDO', message: pt.loginInvalido });
    expect(res.headers['set-cookie']).toBeUndefined();
    expect(audits('login.fail')).toEqual([
      expect.objectContaining({ details: { utilizadorHash: expect.stringMatching(/^[0-9a-f]{8}$/), motivo } }),
    ]);
    // What was typed in the username box may be a pasted password: never in the log.
    expect(JSON.stringify(audits('login.fail'))).not.toContain(u);
    await app.close();
  });

  it('never logs the password', async () => {
    const { app, audits } = await setup();
    await login(app, 'ADMIN', 'secret-typed');
    expect(JSON.stringify(audits('login.fail'))).not.toContain('secret-typed');
    await app.close();
  });

  it('6th attempt in a minute from one IP → 401 without touching the DB', async () => {
    const { app, calls } = await setup();
    for (let i = 0; i < 5; i++) await login(app, 'ADMIN', 'wrong');
    const before = calls.length;
    const { res } = await login(app, 'ADMIN', 'pw');
    expect(res.statusCode).toBe(401);
    expect(calls.length).toBe(before);
    await app.close();
  });

  it('concurrent guesses from one IP cannot pass the per-minute limit', async () => {
    const { app, calls } = await setup();
    await Promise.all(Array.from({ length: 30 }, () => login(app, 'ADMIN', 'wrong', '10.0.3.1')));
    expect(calls.filter((c) => c[0] === 'findLogin').length).toBeLessThanOrEqual(5);
    await app.close();
  });

  it('10 failures from one IP lock that IP + username only: the real user still gets in from elsewhere', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      const { app } = await setup();
      for (let i = 0; i < 10; i++) {
        vi.setSystemTime(Date.now() + 5 * 60_000); // spread so the per-IP limit never trips
        await login(app, 'ADMIN', 'wrong', '6.6.6.6');
      }
      vi.setSystemTime(Date.now() + 1000);
      expect((await login(app, 'ADMIN', 'pw', '6.6.6.6')).res.statusCode).toBe(401); // the attacker: locked
      expect((await login(app, 'ADMIN', 'pw', '10.0.2.1')).res.statusCode).toBe(200); // the user: fine
      await app.close();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('POST /api/auth/login — success', () => {
  it('ADM → session { username, nome, role: ADM, ambiente } + csrf, uppercased username', async () => {
    const { app, calls, audits } = await setup();
    const { res, cookie } = await login(app, ' admin ');
    expect(res.statusCode).toBe(200);
    expect(res.json().user).toEqual({ username: 'ADMIN', nome: 'Admin', role: 'ADM', ambiente: 'GADOR_TESTES' });
    expect(res.json().csrf).toMatch(/^[0-9a-f]{64}$/);
    expect(cookie).toMatch(/^gestsiid\.sid=/);
    expect(calls[0]).toEqual(['findLogin', 'ADMIN', 'pw', 'GADOR_TESTES']);
    expect(audits('login.ok')).toEqual([expect.objectContaining({ user: 'ADMIN', role: 'ADM' })]);
    await app.close();
  });

  it('any TIPO_UTILIZADOR_RF other than ADM → role USER', async () => {
    const { app } = await setup();
    const { res } = await login(app, 'joao');
    expect(res.json().user.role).toBe('USER');
    await app.close();
  });

  it('rotates the session id on login', async () => {
    const { app } = await setup();
    const first = await login(app, 'ADMIN');
    const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { utilizador: 'JOAO', password: 'pw' }, headers: { cookie: first.cookie }, remoteAddress: '10.0.0.9' });
    expect(cookieOf(res)).not.toBe(first.cookie);
    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie: first.cookie } });
    expect(me.statusCode).toBe(401);
    await app.close();
  });
});

describe('GET /api/auth/me, POST /api/auth/logout', () => {
  it('me without a session → 401 SESSAO_EXPIRADA', async () => {
    const { app } = await setup();
    const res = await app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('SESSAO_EXPIRADA');
    await app.close();
  });

  it('me with a session → { user, csrf }', async () => {
    const { app } = await setup();
    const { cookie, csrf } = await login(app, 'JOAO');
    const res = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } });
    expect(res.json()).toEqual({ user: { username: 'JOAO', nome: 'João', role: 'USER', ambiente: 'GADOR_TESTES' }, csrf });
    await app.close();
  });

  it('logout without the CSRF token → 403 CSRF', async () => {
    const { app } = await setup();
    const { cookie } = await login(app, 'JOAO');
    const res = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie } });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('CSRF');
    await app.close();
  });

  it('logout destroys the session and writes an audit line', async () => {
    const { app, audits } = await setup();
    const { cookie, csrf } = await login(app, 'JOAO');
    const res = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie, 'x-csrf-token': csrf } });
    expect(res.statusCode).toBe(204);
    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } });
    expect(me.statusCode).toBe(401);
    expect(audits('logout')).toEqual([expect.objectContaining({ user: 'JOAO' })]);
    await app.close();
  });
});

describe('guard: requireRole, currentUser, CSRF', () => {
  it('currentUser is the session user', async () => {
    const { app } = await setup();
    const { cookie } = await login(app, 'JOAO');
    const res = await app.inject({ method: 'GET', url: '/api/test/whoami', headers: { cookie } });
    expect(res.json().user).toMatchObject({ username: 'JOAO', role: 'USER' });
    await app.close();
  });

  it('every non-GET route with a session needs the CSRF token', async () => {
    const { app } = await setup();
    const { cookie, csrf } = await login(app, 'JOAO');
    expect((await app.inject({ method: 'POST', url: '/api/test/write', headers: { cookie, 'x-csrf-token': 'f'.repeat(64) } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'POST', url: '/api/test/write', headers: { cookie, 'x-csrf-token': csrf } })).statusCode).toBe(200);
    await app.close();
  });

  it('USER on an ADM route → 403 SEM_PERMISSAO', async () => {
    const { app } = await setup();
    const { cookie, csrf } = await login(app, 'JOAO');
    const res = await app.inject({ method: 'POST', url: '/api/auth/regeneracao-password', headers: { cookie, 'x-csrf-token': csrf }, payload: { actual: 'regen', nova: 'a', confirmacao: 'a' } });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('SEM_PERMISSAO');
    await app.close();
  });
});

describe('POST /api/auth/regeneracao-password (ADM)', () => {
  async function adm() {
    const s = await setup();
    const { cookie, csrf } = await login(s.app, 'ADMIN');
    const post = (payload: object) =>
      s.app.inject({ method: 'POST', url: '/api/auth/regeneracao-password', headers: { cookie, 'x-csrf-token': csrf }, payload });
    return { ...s, post };
  }

  it('nova ≠ confirmacao → 422 with the "não coincidem" text, no DB write', async () => {
    const { app, post, calls } = await adm();
    const res = await post({ actual: 'regen', nova: 'a', confirmacao: 'b' });
    expect(res.statusCode).toBe(422);
    expect(res.json()).toMatchObject({ message: pt.passwordsNaoCoincidem, fields: { confirmacao: pt.passwordsNaoCoincidem } });
    expect(calls.some((c) => c[0] === 'setRegeneracao')).toBe(false);
    await app.close();
  });

  it('wrong actual → 403 PASSWORD_ERRADA', async () => {
    const { app, post, state } = await adm();
    const res = await post({ actual: 'nope', nova: 'a', confirmacao: 'a' });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ code: 'PASSWORD_ERRADA', message: pt.passwordErrada });
    expect(state.regen).toBe('regen');
    await app.close();
  });

  it('success → 204, writes with the session user and ambiente, audits', async () => {
    const { app, post, calls, state, audits } = await adm();
    const res = await post({ actual: 'regen', nova: 'novo', confirmacao: 'novo' });
    expect(res.statusCode).toBe(204);
    expect(state.regen).toBe('novo');
    expect(calls.at(-1)).toEqual(['setRegeneracao', 'regen', 'novo', 'GADOR_TESTES', 'ADMIN']);
    expect(audits('regeneracao.alterada')).toEqual([expect.objectContaining({ user: 'ADMIN' })]);
    expect(JSON.stringify(audits('regeneracao.alterada'))).not.toContain('novo"');
    await app.close();
  });

  it('5 wrong actual values lock the change for this user', async () => {
    const { app, post, calls } = await adm();
    for (let i = 0; i < 5; i++) await post({ actual: 'nope', nova: 'a', confirmacao: 'a' });
    const before = calls.length;
    const res = await post({ actual: 'regen', nova: 'a', confirmacao: 'a' });
    expect(res.statusCode).toBe(403);
    expect(calls.length).toBe(before);
    await app.close();
  });

  it('empty nova → 400 VALIDACAO', async () => {
    const { app, post } = await adm();
    expect((await post({ actual: 'regen', nova: '', confirmacao: '' })).statusCode).toBe(400);
    await app.close();
  });
});

describe('POST /api/auth/reauth-regeneracao (ADM)', () => {
  it('wrong password → 403 PASSWORD_ERRADA, no flag', async () => {
    const { app } = await setup();
    const { cookie, csrf } = await login(app, 'ADMIN');
    const res = await app.inject({ method: 'POST', url: '/api/auth/reauth-regeneracao', headers: { cookie, 'x-csrf-token': csrf }, payload: { password: 'x' } });
    expect(res.statusCode).toBe(403);
    const who = await app.inject({ method: 'GET', url: '/api/test/whoami', headers: { cookie } });
    expect(who.json().reauth).toBe(false);
    await app.close();
  });

  it('right password → 204 and a short-lived flag in the session', async () => {
    const { app, calls } = await setup();
    const { cookie, csrf } = await login(app, 'ADMIN');
    const res = await app.inject({ method: 'POST', url: '/api/auth/reauth-regeneracao', headers: { cookie, 'x-csrf-token': csrf }, payload: { password: 'regen' } });
    expect(res.statusCode).toBe(204);
    expect(calls.at(-1)).toEqual(['checkRegeneracao', 'regen', 'GADOR_TESTES', 'ADMIN']);
    const who = await app.inject({ method: 'GET', url: '/api/test/whoami', headers: { cookie } });
    expect(who.json().reauth).toBe(true);
    await app.close();
  });
});
