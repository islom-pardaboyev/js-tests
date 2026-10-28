import type { TestCase } from '../types';
import { hiddenMore } from './hiddenMore';

/**
 * Hidden tests for the bundled hard tasks, kept in their own module. In the
 * live bank they sit on the Firestore document instead of the JS bundle.
 */
export const hiddenSeed: Record<string, TestCase[]> = {
  ...hiddenMore,
  flatten: [
    { name: 'empty nested arrays', call: 'flatten([[], [[]], [[], [1]]])', expect: '[1]' },
    { name: 'deeply nested', call: 'flatten([1, [2, [3, [4, [5]]]]])', expect: '[1, 2, 3, 4, 5]' },
    {
      name: 'keeps null and undefined',
      call: "flatten(['a', [null, [undefined, 'b']]])",
      expect: "['a', null, undefined, 'b']",
    },
    {
      name: 'does not flatten objects or mutate input',
      call: "(() => { const input = ['1', ['x', [true, { a: 1 }]]]; const out = flatten(input); return [out, JSON.stringify(input)]; })()",
      expect: `[['1', 'x', true, { a: 1 }], '["1",["x",[true,{"a":1}]]]']`,
    },
  ],
  debounce: [
    {
      name: 'separate bursts',
      call: '(async () => { let n = 0; const d = debounce(() => n++, 40); d(); await sleep(90); d(); await sleep(90); return n; })()',
      expect: '2',
    },
    {
      name: 'every call resets the timer',
      call: '(async () => { let n = 0; const d = debounce(() => n++, 60); d(); await sleep(40); d(); await sleep(40); d(); await sleep(40); const mid = n; await sleep(100); return [mid, n]; })()',
      expect: '[0, 1]',
    },
    {
      name: 'keeps this',
      call: '(async () => { let ctx; const obj = { d: debounce(function () { ctx = this; }, 30) }; obj.d(); await sleep(80); return ctx === obj; })()',
      expect: 'true',
    },
    {
      name: 'passes several arguments',
      call: "(async () => { let got; const d = debounce((...a) => { got = a; }, 30); d('a', 2, null); await sleep(80); return got; })()",
      expect: "['a', 2, null]",
    },
  ],
  promiseAll: [
    { name: 'plain values', call: "promiseAll([1, 'a', null])", expect: "[1, 'a', null]" },
    {
      name: 'slow first item stays first',
      call: "promiseAll([new Promise((r) => setTimeout(() => r('slow'), 40)), 'fast'])",
      expect: "['slow', 'fast']",
    },
    {
      name: 'rejects with the first rejection',
      call: "promiseAll([new Promise((_, j) => setTimeout(() => j('late'), 40)), Promise.reject('early')]).then(() => 'ok', (e) => e)",
      expect: "'early'",
    },
    { name: 'returns a Promise', call: 'promiseAll([]) instanceof Promise', expect: 'true' },
  ],
  fixBug: [
    { name: 'only odd numbers', call: 'sumEvenSquares([1, 3, 5])', expect: '0' },
    { name: 'skips strings', call: "sumEvenSquares([2, '4', 6])", expect: '40' },
    { name: 'negative and zero', call: 'sumEvenSquares([-2, 0, 3])', expect: '4' },
    { name: 'NaN, null, undefined', call: 'sumEvenSquares([2, NaN, null, undefined, 4])', expect: '20' },
  ],
};
