import type { CodingTask } from '../types';
import { hiddenSeed } from './hidden';
import { moreTasks, type Visible } from './hardMore';

const tasks: Visible[] = [
  {
    id: 'flatten', topic: 'arrays', title: 'Flatten an array', fnName: 'flatten',
    description:
      'Write flatten(arr), which turns a nested array into a single flat array. Do not use Array.prototype.flat(). Only arrays are flattened, not objects.',
    requirements: [
      { text: 'Flattens arrays of any depth', visible: [0, 1] },
      { text: 'Returns [] for an empty array', visible: [2] },
      { text: 'Does not mutate the input', visible: [] },
      { text: 'Keeps non-numeric values', visible: [] },
    ],
    starter: `function flatten(arr) {\n  // Do not use Array.prototype.flat()\n  \n}\n`,
    visibleTests: [
      { name: 'nested array', call: 'flatten([1, [2, [3, 4]], 5])', expect: '[1, 2, 3, 4, 5]' },
      { name: 'two levels', call: 'flatten([[1, 2], [3]])', expect: '[1, 2, 3]' },
      { name: 'empty array', call: 'flatten([])', expect: '[]' },
    ],
  },
  {
    id: 'debounce', topic: 'closures', title: 'debounce', fnName: 'debounce',
    description:
      'Write debounce(fn, wait). It calls fn once, wait milliseconds after the last call. The arguments and this of the last call must be preserved.',
    requirements: [
      { text: 'A burst of calls triggers fn once', visible: [0] },
      { text: 'The last arguments are used', visible: [1] },
      { text: 'fn is not called before wait has passed', visible: [2] },
      { text: 'this and all arguments are preserved', visible: [] },
    ],
    starter: `function debounce(fn, wait) {\n  \n}\n`,
    visibleTests: [
      {
        name: 'rapid calls run once',
        call: '(async () => { let n = 0; const d = debounce(() => n++, 40); d(); d(); d(); await sleep(100); return n; })()',
        expect: '1',
      },
      {
        name: 'last argument wins',
        call: '(async () => { let got; const d = debounce((x) => { got = x; }, 40); d(1); d(2); d(3); await sleep(100); return got; })()',
        expect: '3',
      },
      {
        name: 'waits before calling',
        call: '(async () => { let n = 0; const d = debounce(() => n++, 60); d(); await sleep(20); return n; })()',
        expect: '0',
      },
    ],
  },
  {
    id: 'promiseAll', topic: 'async', title: 'Promise.all clone', fnName: 'promiseAll',
    description:
      'Write your own promiseAll(items). Results come back in input order, plain (non-promise) values are accepted, and the first rejection rejects the whole result. Do not use Promise.all.',
    requirements: [
      { text: 'Keeps the order of results', visible: [0] },
      { text: 'Resolves with [] for an empty array', visible: [1] },
      { text: 'Rejects with the first error', visible: [2] },
      { text: 'Returns a Promise', visible: [] },
    ],
    starter: `function promiseAll(items) {\n  // Do not use Promise.all\n  \n}\n`,
    visibleTests: [
      {
        name: 'keeps order',
        call: 'promiseAll([Promise.resolve(1), new Promise((r) => setTimeout(() => r(2), 20)), 3])',
        expect: '[1, 2, 3]',
      },
      { name: 'empty array', call: 'promiseAll([])', expect: '[]' },
      {
        name: 'rejects',
        call: "promiseAll([Promise.resolve(1), Promise.reject('boom')]).then(() => 'resolved', (e) => e)",
        expect: "'boom'",
      },
    ],
  },
  {
    id: 'fixBug', topic: 'coercion', title: 'Find the bug', fnName: 'sumEvenSquares',
    description:
      'sumEvenSquares(numbers) should return the sum of the squares of the even numbers. Only values of type number count (strings, null and NaN are skipped). The code below has several bugs. Fix them.',
    requirements: [
      { text: 'Sums the squares of even numbers correctly', visible: [0, 2] },
      { text: 'Returns 0 for an empty array', visible: [1] },
      { text: 'Skips values that are not numbers', visible: [] },
    ],
    starter: `function sumEvenSquares(numbers) {\n  let total = 0;\n  for (var i = 0; i <= numbers.length; i++) {\n    if (numbers[i] % 2 === 0) {\n      total += numbers[i] ^ 2;\n    }\n  }\n  return total;\n}\n`,
    visibleTests: [
      { name: '[1, 2, 3, 4]', call: 'sumEvenSquares([1, 2, 3, 4])', expect: '20' },
      { name: 'empty array', call: 'sumEvenSquares([])', expect: '0' },
      { name: 'one even number', call: 'sumEvenSquares([2])', expect: '4' },
    ],
  },
];

/** Bundled seed: 14 hard tasks (write a function), each with 3 visible and 4 hidden tests. */
export const hardSeed: CodingTask[] = [...tasks, ...moreTasks].map((t) => ({
  ...t,
  level: 'hard' as const,
  hiddenTests: hiddenSeed[t.id] ?? [],
}));
