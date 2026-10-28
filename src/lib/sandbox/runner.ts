import type { SandboxTestInput } from './types';

export interface RunPayload {
  type: 'run';
  code: string;
  fnName: string;
  tests: SandboxTestInput[];
}

type Post = (message: Record<string, unknown>) => void;

/**
 * Runs INSIDE the sandbox (a worker created by the iframe). It is serialized
 * with Function.prototype.toString, so it must stay self-contained: no imports
 * and no references to anything outside its own body.
 */
export function createRunner(post: Post): (payload: RunPayload) => Promise<void> {
  const SRC = 'jstests';
  const out = (m: Record<string, unknown>) => post({ source: SRC, ...m });

  const show = (v: unknown, depth = 0): string => {
    if (typeof v === 'string') return JSON.stringify(v);
    if (typeof v === 'function') return 'ƒ ' + (v.name || 'anonymous') + '()';
    if (typeof v === 'bigint') return String(v) + 'n';
    if (typeof v !== 'object' || v === null) return String(v);
    if (depth > 3) return Array.isArray(v) ? '[…]' : '{…}';
    if (Array.isArray(v)) return '[' + Array.from(v, (x) => show(x, depth + 1)).join(', ') + ']';
    const rec = v as Record<string, unknown>;
    const parts = Object.keys(rec).map((k) => k + ': ' + show(rec[k], depth + 1));
    return '{' + parts.join(', ') + '}';
  };

  const equal = (a: unknown, b: unknown): boolean => {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const ra = a as Record<string, unknown>;
    const rb = b as Record<string, unknown>;
    const ka = Object.keys(ra);
    if (ka.length !== Object.keys(rb).length) return false;
    return ka.every((k) => Object.prototype.hasOwnProperty.call(rb, k) && equal(ra[k], rb[k]));
  };

  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
  const message = (e: unknown) => (e instanceof Error ? e.name + ': ' + e.message : String(e));

  (['log', 'info', 'warn', 'error'] as const).forEach((level) => {
    (console as unknown as Record<string, unknown>)[level] = (...args: unknown[]) =>
      out({ type: 'log', level, text: args.map((a) => (typeof a === 'string' ? a : show(a))).join(' ') });
  });

  return async (payload) => {
    const { code, fnName, tests } = payload;
    let fn: unknown;
    try {
      const body = code + '\n;return typeof ' + fnName + " === 'function' ? " + fnName + ' : undefined;';
      fn = new Function(body)();
    } catch (e) {
      out({ type: 'error', message: message(e) });
      out({ type: 'done' });
      return;
    }
    if (tests.length > 0 && typeof fn !== 'function') {
      out({ type: 'error', message: fnName + ' is not defined as a function' });
      out({ type: 'done' });
      return;
    }
    for (let index = 0; index < tests.length; index++) {
      const t = tests[index];
      let expected: unknown;
      try {
        expected = new Function('return (' + t.expect + ');')();
        const call = new Function(fnName, 'sleep', 'return (' + t.call + ');');
        const limit = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('No result within 1.5 seconds')), 1500),
        );
        const actual = await Promise.race([Promise.resolve(call(fn, sleep)), limit]);
        out({ type: 'test', index, name: t.name, passed: equal(actual, expected), actual: show(actual), expected: show(expected) });
      } catch (e) {
        out({ type: 'test', index, name: t.name, passed: false, actual: '', expected: show(expected), error: message(e) });
      }
    }
    out({ type: 'done' });
  };
}
