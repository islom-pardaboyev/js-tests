import { describe, expect, it } from 'vitest';

/** Each added hard task must pass all 7 tests with a known-good solution, and fail with its starter code. */
import { seedBank } from './index';
import { createRunner } from '../../lib/sandbox/runner';
import type { SandboxMessage } from '../../lib/sandbox/types';

const REF: Record<string, string> = {
  chunk: `function chunk(arr, size) { const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out; }`,
  unique: `function unique(arr) { return [...new Set(arr)]; }`,
  groupBy: `function groupBy(arr, fn) { const o = {}; for (const x of arr) { const k = fn(x); (o[k] ||= []).push(x); } return o; }`,
  once: `function once(fn) { let done = false, r; return function (...a) { if (!done) { done = true; r = fn.apply(this, a); } return r; }; }`,
  memoize: `function memoize(fn) { const c = new Map(); return function (...a) { const k = JSON.stringify(a); if (!c.has(k)) c.set(k, fn.apply(this, a)); return c.get(k); }; }`,
  curry: `function curry(fn) { return function c(...a) { return a.length >= fn.length ? fn(...a) : (...b) => c(...a, ...b); }; }`,
  retry: `async function retry(fn, times) { let err; for (let i = 0; i < times; i++) { try { return await fn(); } catch (e) { err = e; } } throw err; }`,
  deepClone: `function deepClone(v) { if (v === null || typeof v !== 'object') return v; if (v instanceof Date) return new Date(v.getTime()); if (Array.isArray(v)) return v.map(deepClone); const o = {}; for (const k of Object.keys(v)) o[k] = deepClone(v[k]); return o; }`,
  compose: `function compose(...fns) { return (...args) => { if (fns.length === 0) return args[0]; let r = fns[fns.length - 1](...args); for (let i = fns.length - 2; i >= 0; i--) r = fns[i](r); return r; }; }`,
  flattenObject: `function flattenObject(obj, prefix = '') { const out = {}; for (const [k, v] of Object.entries(obj)) { const key = prefix ? prefix + '.' + k : k; if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) Object.assign(out, flattenObject(v, key)); else out[key] = v; } return out; }`,
};

async function run(code: string, fnName: string, tests: { name: string; call: string; expect: string }[]) {
  const msgs: Record<string, unknown>[] = [];
  const log = console.log; const info = console.info; const warn = console.warn; const err = console.error;
  const runner = createRunner((m) => msgs.push(m));
  await runner({ type: 'run', code, fnName, tests });
  Object.assign(console, { log, info, warn, error: err });
  return msgs.filter((m) => m.type === 'test') as unknown as Extract<SandboxMessage, { type: 'test' }>[];
}

describe('added hard tasks', () => {
  for (const t of seedBank) {
    if (t.level !== 'hard' || !REF[t.id]) continue;
    it(t.id, async () => {
      const res = await run(REF[t.id], t.fnName, [...t.visibleTests, ...t.hiddenTests]);
      const failed = res.filter((r) => !r.passed).map((r) => `${r.name}: ${r.error ?? 'wrong value'}`);
      expect(failed).toEqual([]);
      expect(res).toHaveLength(7);
    });
    it(`${t.id} starter does not already pass`, async () => {
      const res = await run(t.starter, t.fnName, [...t.visibleTests, ...t.hiddenTests]);
      expect(res.every((r) => r.passed)).toBe(false);
    });
  }
});
