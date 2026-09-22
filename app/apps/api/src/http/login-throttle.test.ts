import { describe, expect, it } from 'vitest';
import { LoginThrottle } from './login-throttle.ts';

function clock(start = 1_000_000) {
  const c = { t: start, now: () => c.t };
  return c;
}

describe('LoginThrottle — per IP', () => {
  it('allows 5 attempts per minute from one IP and blocks the 6th', () => {
    const c = clock();
    const t = new LoginThrottle(c.now);
    for (let i = 0; i < 5; i++) expect(t.checkLogin('1.1.1.1', `U${i}`)).toBe(true);
    expect(t.checkLogin('1.1.1.1', 'OTHER')).toBe(false);
    expect(t.checkLogin('2.2.2.2', 'OTHER')).toBe(true);
  });

  it('allows the IP again after the minute passes', () => {
    const c = clock();
    const t = new LoginThrottle(c.now);
    for (let i = 0; i < 6; i++) t.checkLogin('1.1.1.1', 'U');
    c.t += 60_001;
    expect(t.checkLogin('1.1.1.1', 'U')).toBe(true);
  });
});

describe('LoginThrottle — per username', () => {
  it('locks a username for 15 min after 10 failures in an hour, from any IP', () => {
    const c = clock();
    const t = new LoginThrottle(c.now);
    for (let i = 0; i < 10; i++) {
      c.t += 5 * 60_000; // spread so the per-IP limit never trips
      t.loginFailed('JOAO');
    }
    c.t += 1000;
    expect(t.checkLogin('9.9.9.9', 'JOAO')).toBe(false);
    expect(t.checkLogin('9.9.9.9', 'MARIA')).toBe(true);
    c.t += 15 * 60_000;
    expect(t.checkLogin('8.8.8.8', 'JOAO')).toBe(true);
  });

  it('forgets failures older than an hour', () => {
    const c = clock();
    const t = new LoginThrottle(c.now);
    for (let i = 0; i < 9; i++) t.loginFailed('JOAO');
    c.t += 60 * 60_000 + 1;
    t.loginFailed('JOAO');
    expect(t.checkLogin('1.1.1.1', 'JOAO')).toBe(true);
  });

  it('clears the failure count on a successful login', () => {
    const c = clock();
    const t = new LoginThrottle(c.now);
    for (let i = 0; i < 9; i++) t.loginFailed('JOAO');
    t.loginSucceeded('JOAO');
    t.loginFailed('JOAO');
    expect(t.checkLogin('1.1.1.1', 'JOAO')).toBe(true);
  });
});

describe('LoginThrottle — regeneration password', () => {
  it('locks for 15 min after 5 wrong passwords in 15 min', () => {
    const c = clock();
    const t = new LoginThrottle(c.now);
    for (let i = 0; i < 4; i++) t.regenFailed('JOAO');
    expect(t.regenBlocked('JOAO')).toBe(false);
    t.regenFailed('JOAO');
    expect(t.regenBlocked('JOAO')).toBe(true);
    expect(t.regenBlocked('MARIA')).toBe(false);
    c.t += 15 * 60_000 + 1;
    expect(t.regenBlocked('JOAO')).toBe(false);
  });
});

describe('LoginThrottle.sweep', () => {
  it('drops expired entries so memory does not grow', () => {
    const c = clock();
    const t = new LoginThrottle(c.now);
    t.checkLogin('1.1.1.1', 'U');
    t.loginFailed('U');
    t.regenFailed('U');
    c.t += 2 * 60 * 60_000;
    t.sweep();
    expect(t.size()).toBe(0);
  });
});
