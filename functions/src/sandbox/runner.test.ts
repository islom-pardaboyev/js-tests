import { describe, expect, it } from 'vitest';
import { runOne } from './runner';

const flatten = 'function flatten(arr) { return arr.flat(Infinity); }';

describe('hidden test runner (in-process)', () => {
  it('passes a correct function', async () => {
    const r = await runOne({ code: flatten, fnName: 'flatten', test: { name: 'deep', call: 'flatten([1, [2, [3]]])', expect: '[1, 2, 3]' } });
    expect(r.passed).toBe(true);
  });
  it('fails a wrong value', async () => {
    const r = await runOne({ code: flatten, fnName: 'flatten', test: { name: 'deep', call: 'flatten([[1]])', expect: '[2]' } });
    expect(r.passed).toBe(false);
  });
  it('reports a missing function', async () => {
    const r = await runOne({ code: 'const x = 1;', fnName: 'flatten', test: { name: 'x', call: 'flatten([])', expect: '[]' } });
    expect(r.passed).toBe(false);
    expect(r.error).toMatch(/not defined as a function/);
  });
  it('fails a call that never settles', async () => {
    const r = await runOne({ code: 'function f() { return new Promise(() => {}); }', fnName: 'f', test: { name: 'hang', call: 'f()', expect: '1' } });
    expect(r.passed).toBe(false);
  }, 5000);
});
