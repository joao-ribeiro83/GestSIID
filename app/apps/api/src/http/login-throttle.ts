/**
 * In-memory login throttle (ARCHITECTURE.md §5, SECURITY_FINDINGS §3 item 3, D-07b). Keys are
 * the client IP and the uppercased username. A restart clears every counter (accepted: one
 * process per environment, D-02).
 *   - 5 login attempts per minute per IP;
 *   - 10 login failures per hour per username → username locked 15 min;
 *   - 5 wrong regeneration passwords in 15 min per username → locked 15 min.
 */

const MIN = 60_000;
const IP_WINDOW = MIN;
const IP_MAX = 5;
const USER_WINDOW = 60 * MIN;
const USER_MAX = 10;
const REGEN_WINDOW = 15 * MIN;
const REGEN_MAX = 5;
const LOCK_MS = 15 * MIN;
const SWEEP_MS = MIN;

export class LoginThrottle {
  private readonly ipHits = new Map<string, number[]>();
  private readonly userFails = new Map<string, number[]>();
  private readonly regenFails = new Map<string, number[]>();
  private readonly userLocks = new Map<string, number>();
  private readonly regenLocks = new Map<string, number>();
  private timer?: NodeJS.Timeout;
  private readonly now: () => number;

  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  /** Starts the 60 s sweep (the app does this; unit tests drive `sweep()` directly). */
  start(): void {
    this.timer = setInterval(() => this.sweep(), SWEEP_MS);
    this.timer.unref?.();
  }

  stop(): void {
    clearInterval(this.timer);
  }

  /** Counts one attempt for `ip`; false when the IP is over its limit or `username` is locked. */
  checkLogin(ip: string, username: string): boolean {
    const ipCount = this.hit(this.ipHits, ip, IP_WINDOW);
    return ipCount <= IP_MAX && !this.locked(this.userLocks, username);
  }

  loginFailed(username: string): void {
    if (this.hit(this.userFails, username, USER_WINDOW) >= USER_MAX) {
      this.userLocks.set(username, this.now() + LOCK_MS);
      this.userFails.delete(username);
    }
  }

  /** Clears the failures and a lock that this (correct) attempt's own pre-count may have set. */
  loginSucceeded(username: string): void {
    this.userFails.delete(username);
    this.userLocks.delete(username);
  }

  regenBlocked(username: string): boolean {
    return this.locked(this.regenLocks, username);
  }

  regenFailed(username: string): void {
    if (this.hit(this.regenFails, username, REGEN_WINDOW) >= REGEN_MAX) {
      this.regenLocks.set(username, this.now() + LOCK_MS);
      this.regenFails.delete(username);
    }
  }

  regenSucceeded(username: string): void {
    this.regenFails.delete(username);
  }

  sweep(): void {
    const now = this.now();
    for (const [map, window] of [
      [this.ipHits, IP_WINDOW],
      [this.userFails, USER_WINDOW],
      [this.regenFails, REGEN_WINDOW],
    ] as const) {
      for (const [key, hits] of map) if (hits.every((t) => now - t > window)) map.delete(key);
    }
    for (const locks of [this.userLocks, this.regenLocks]) {
      for (const [key, until] of locks) if (now >= until) locks.delete(key);
    }
  }

  /** Live entry count across every map (tests). */
  size(): number {
    return [this.ipHits, this.userFails, this.regenFails, this.userLocks, this.regenLocks].reduce(
      (n, m) => n + m.size,
      0,
    );
  }

  private hit(map: Map<string, number[]>, key: string, window: number): number {
    const now = this.now();
    const hits = (map.get(key) ?? []).filter((t) => now - t <= window);
    hits.push(now);
    map.set(key, hits);
    return hits.length;
  }

  private locked(locks: Map<string, number>, key: string): boolean {
    const until = locks.get(key);
    if (until === undefined) return false;
    if (this.now() < until) return true;
    locks.delete(key);
    return false;
  }
}
