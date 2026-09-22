import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionStore } from './session-store.ts';

function set(store: SessionStore, sid: string, data: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    store.set(sid, data, (err) => (err ? reject(err) : resolve()));
  });
}

function get(store: SessionStore, sid: string): Promise<Record<string, unknown> | null | undefined> {
  return new Promise((resolve, reject) => {
    store.get(sid, (err, session) => (err ? reject(err) : resolve(session)));
  });
}

function destroy(store: SessionStore, sid: string): Promise<void> {
  return new Promise((resolve, reject) => {
    store.destroy(sid, (err) => (err ? reject(err) : resolve()));
  });
}

describe('SessionStore', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and returns a session by id', async () => {
    const store = new SessionStore();
    await set(store, 'sid-1', { user: { username: 'JRIBEIRO' } });

    const session = await get(store, 'sid-1');

    expect(session).toEqual({ user: { username: 'JRIBEIRO' } });
    store.stop();
  });

  it('returns nothing for an unknown session id', async () => {
    const store = new SessionStore();
    expect(await get(store, 'missing')).toBeUndefined();
    store.stop();
  });

  it('destroy removes the session', async () => {
    const store = new SessionStore();
    await set(store, 'sid-1', { a: 1 });
    await destroy(store, 'sid-1');
    expect(await get(store, 'sid-1')).toBeUndefined();
    store.stop();
  });

  it('expires a session after 30 minutes of idle time', async () => {
    vi.useFakeTimers();
    const store = new SessionStore();
    await set(store, 'sid-1', { a: 1 });

    vi.advanceTimersByTime(30 * 60 * 1000 + 1);

    expect(await get(store, 'sid-1')).toBeUndefined();
    store.stop();
  });

  it('expires a session after 8 hours even if it keeps getting refreshed (absolute lifetime)', async () => {
    vi.useFakeTimers();
    const store = new SessionStore();
    await set(store, 'sid-1', { a: 1 });

    // Real traffic reads the session before it writes it back on every request (rolling:true),
    // so a "refresh" here is get-then-set, every 20 minutes — well under the 30-minute idle
    // window, but eventually past the 8-hour absolute lifetime.
    let lastSeen: unknown = { a: 1 };
    for (let i = 0; i < 25; i++) {
      vi.advanceTimersByTime(20 * 60 * 1000);
      lastSeen = await get(store, 'sid-1');
      if (lastSeen === undefined) break;
      await set(store, 'sid-1', { a: 1 });
    }

    expect(lastSeen).toBeUndefined();
    store.stop();
  });

  it('finds every session id belonging to a username, for destroyUserSessions', async () => {
    const store = new SessionStore();
    await set(store, 'sid-1', { user: { username: 'JRIBEIRO' } });
    await set(store, 'sid-2', { user: { username: 'JRIBEIRO' } });
    await set(store, 'sid-3', { user: { username: 'AADMIN' } });

    expect(new Set(store.findSessionIdsByUsername('JRIBEIRO'))).toEqual(new Set(['sid-1', 'sid-2']));
    store.stop();
  });
});
