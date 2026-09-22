/**
 * `Map<sid, { data, expiresAt, createdAt }>` session store for @fastify/session (§5). One
 * process per environment (D-02), so an in-memory store is enough — a restart logs everyone
 * out (accepted). Idle expiry 30 min, absolute expiry 8 h; a 60 s timer sweeps both plus stale
 * login-throttle entries (login-throttle.ts owns its own sweep).
 */

const IDLE_MS = 30 * 60 * 1000;
const ABSOLUTE_MS = 8 * 60 * 60 * 1000;
const SWEEP_MS = 60 * 1000;

interface Entry {
  data: Record<string, unknown>;
  createdAt: number;
  expiresAt: number;
}

type Callback<T = void> = (error: Error | null, result?: T) => void;

export class SessionStore {
  private readonly sessions = new Map<string, Entry>();
  private readonly timer: NodeJS.Timeout;

  constructor() {
    this.timer = setInterval(() => this.sweep(), SWEEP_MS);
    this.timer.unref?.();
  }

  private sweep(): void {
    const now = Date.now();
    for (const [sid, entry] of this.sessions) {
      if (now > entry.expiresAt || now > entry.createdAt + ABSOLUTE_MS) {
        this.sessions.delete(sid);
      }
    }
  }

  get(sid: string, callback: Callback<Record<string, unknown>>): void {
    const entry = this.sessions.get(sid);
    if (!entry) {
      callback(null, undefined);
      return;
    }
    const now = Date.now();
    if (now > entry.expiresAt || now > entry.createdAt + ABSOLUTE_MS) {
      this.sessions.delete(sid);
      callback(null, undefined);
      return;
    }
    callback(null, entry.data);
  }

  set(sid: string, session: Record<string, unknown>, callback: Callback): void {
    const existing = this.sessions.get(sid);
    const now = Date.now();
    this.sessions.set(sid, {
      data: session,
      createdAt: existing?.createdAt ?? now,
      expiresAt: now + IDLE_MS,
    });
    callback(null);
  }

  destroy(sid: string, callback: Callback): void {
    this.sessions.delete(sid);
    callback(null);
  }

  /** For destroyUserSessions (§5): every live session id belonging to `username`. */
  findSessionIdsByUsername(username: string): string[] {
    const ids: string[] = [];
    for (const [sid, entry] of this.sessions) {
      const user = entry.data['user'] as { username?: string } | undefined;
      if (user?.username === username) ids.push(sid);
    }
    return ids;
  }

  stop(): void {
    clearInterval(this.timer);
  }
}
