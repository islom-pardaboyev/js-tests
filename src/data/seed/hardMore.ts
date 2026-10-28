import type { CodingTask } from '../types';

export type Visible = Omit<CodingTask, 'hiddenTests' | 'level'>;

/** 10 more hard tasks. Each has 3 visible tests here and 4 hidden tests in hiddenMore.ts. */
export const moreTasks: Visible[] = [
  {
    id: 'chunk', topic: 'arrays', title: 'Split into chunks', fnName: 'chunk',
    description: 'Write chunk(arr, size). It splits an array into smaller arrays of at most size items. The last chunk may be shorter. Do not change the input array.',
    requirements: [
      { text: 'Splits into chunks of the given size', visible: [0] },
      { text: 'Returns [] for an empty array', visible: [1] },
      { text: 'A short last chunk is kept', visible: [0, 2] },
      { text: 'Does not mutate the input', visible: [] },
    ],
    starter: `function chunk(arr, size) {\n  \n}\n`,
    visibleTests: [
      { name: 'five items, size 2', call: 'chunk([1, 2, 3, 4, 5], 2)', expect: '[[1, 2], [3, 4], [5]]' },
      { name: 'empty array', call: 'chunk([], 3)', expect: '[]' },
      { name: 'size larger than the array', call: 'chunk([1, 2, 3], 5)', expect: '[[1, 2, 3]]' },
    ],
  },
  {
    id: 'unique', topic: 'arrays', title: 'Remove duplicates', fnName: 'unique',
    description: 'Write unique(arr). It returns a new array without duplicates, keeping the first occurrence of each value in its original order. Values are compared like a Set compares them (so NaN counts as equal to NaN).',
    requirements: [
      { text: 'Removes repeated values', visible: [0, 2] },
      { text: 'Returns [] for an empty array', visible: [1] },
      { text: 'Keeps the order of first occurrences', visible: [0] },
      { text: 'Treats 1 and "1" as different values', visible: [] },
    ],
    starter: `function unique(arr) {\n  \n}\n`,
    visibleTests: [
      { name: 'numbers', call: 'unique([1, 2, 2, 3, 1])', expect: '[1, 2, 3]' },
      { name: 'empty array', call: 'unique([])', expect: '[]' },
      { name: 'strings', call: "unique(['a', 'a', 'b'])", expect: "['a', 'b']" },
    ],
  },
  {
    id: 'groupBy', topic: 'arrays', title: 'Group by', fnName: 'groupBy',
    description: 'Write groupBy(arr, fn). It returns an object whose keys are the results of fn(item) and whose values are arrays of the items that gave that key, in their original order.',
    requirements: [
      { text: 'Groups items by the key fn returns', visible: [0, 2] },
      { text: 'Returns {} for an empty array', visible: [1] },
      { text: 'Keeps the original order inside each group', visible: [] },
      { text: 'Works with falsy keys such as 0', visible: [] },
    ],
    starter: `function groupBy(arr, fn) {\n  \n}\n`,
    visibleTests: [
      { name: 'odd and even', call: "groupBy([1, 2, 3, 4], (n) => (n % 2 ? 'odd' : 'even'))", expect: "{ odd: [1, 3], even: [2, 4] }" },
      { name: 'empty array', call: 'groupBy([], (x) => x)', expect: '{}' },
      { name: 'by length', call: "groupBy(['one', 'two', 'three'], (s) => s.length)", expect: "{ 3: ['one', 'two'], 5: ['three'] }" },
    ],
  },
  {
    id: 'once', topic: 'functions', title: 'once', fnName: 'once',
    description: 'Write once(fn). It returns a function that calls fn the first time only. Every later call returns the result of that first call without running fn again. The first call keeps this and all arguments.',
    requirements: [
      { text: 'fn runs only once', visible: [0] },
      { text: 'Later calls return the first result', visible: [2] },
      { text: 'The first call returns fn\'s result', visible: [1] },
      { text: 'this and all arguments are passed to fn', visible: [] },
    ],
    starter: `function once(fn) {\n  \n}\n`,
    visibleTests: [
      { name: 'runs once', call: '(() => { let n = 0; const f = once(() => ++n); f(); f(); f(); return n; })()', expect: '1' },
      { name: 'returns the result', call: "once(() => 'x')()", expect: "'x'" },
      { name: 'repeats the first result', call: '(() => { const f = once((a) => a * 2); return [f(2), f(5)]; })()', expect: '[4, 4]' },
    ],
  },
  {
    id: 'memoize', topic: 'closures', title: 'memoize', fnName: 'memoize',
    description: 'Write memoize(fn). It returns a function that remembers results. Calling it again with the same arguments returns the stored result without calling fn. Arguments are the same when JSON.stringify gives the same text.',
    requirements: [
      { text: 'Repeated calls with the same arguments reuse the result', visible: [0] },
      { text: 'Returns the correct value', visible: [1] },
      { text: 'Different arguments call fn again', visible: [2] },
      { text: 'Results that are falsy or undefined are cached too', visible: [] },
    ],
    starter: `function memoize(fn) {\n  \n}\n`,
    visibleTests: [
      { name: 'same argument is cached', call: '(() => { let n = 0; const m = memoize((x) => { n++; return x * 2; }); m(2); m(2); return n; })()', expect: '1' },
      { name: 'returns the value', call: '(() => { const m = memoize((x) => x * 2); return [m(3), m(3)]; })()', expect: '[6, 6]' },
      { name: 'new argument computes again', call: '(() => { let n = 0; const m = memoize((x) => { n++; return x; }); m(1); m(2); return n; })()', expect: '2' },
    ],
  },
  {
    id: 'curry', topic: 'functions', title: 'curry', fnName: 'curry',
    description: 'Write curry(fn). It returns a function that collects arguments across calls, one or several at a time, and calls fn once it has received fn.length arguments.',
    requirements: [
      { text: 'Works one argument at a time', visible: [0] },
      { text: 'Works with several arguments per call', visible: [1] },
      { text: 'Calls fn as soon as enough arguments arrived', visible: [2] },
      { text: 'A partial result can be reused', visible: [] },
    ],
    starter: `function curry(fn) {\n  \n}\n`,
    visibleTests: [
      { name: 'one at a time', call: 'curry((a, b, c) => a + b + c)(1)(2)(3)', expect: '6' },
      { name: 'mixed', call: 'curry((a, b, c) => a + b + c)(1, 2)(3)', expect: '6' },
      { name: 'all at once', call: 'curry((a, b) => a * b)(3, 4)', expect: '12' },
    ],
  },
  {
    id: 'retry', topic: 'async', title: 'retry', fnName: 'retry',
    description: 'Write retry(fn, times). fn returns a promise (it may also throw straight away). Call it until it resolves, up to times calls in total. Resolve with the first success, or reject with the last error.',
    requirements: [
      { text: 'Resolves with the first successful result', visible: [0] },
      { text: 'Rejects with the last error when all attempts fail', visible: [1] },
      { text: 'Does not call fn again after a success', visible: [2] },
      { text: 'Stops after times calls in total', visible: [] },
    ],
    starter: `async function retry(fn, times) {\n  \n}\n`,
    visibleTests: [
      { name: 'succeeds on the third try', call: "(() => { let n = 0; return retry(async () => { n++; if (n < 3) throw new Error('no'); return 'ok'; }, 5); })()", expect: "'ok'" },
      { name: 'rejects with the last error', call: "retry(async () => { throw 'bad'; }, 2).then(() => 'resolved', (e) => e)", expect: "'bad'" },
      { name: 'one call when it succeeds', call: '(async () => { let n = 0; await retry(async () => { n++; return 1; }, 5); return n; })()', expect: '1' },
    ],
  },
  {
    id: 'deepClone', topic: 'basics', title: 'Deep clone', fnName: 'deepClone',
    description: 'Write deepClone(value). It returns a copy that shares no objects or arrays with the original. Support primitives, null, arrays, plain objects and Date. You do not need to handle functions or circular references.',
    requirements: [
      { text: 'Copies nested objects and arrays', visible: [0, 2] },
      { text: 'Returns primitives unchanged', visible: [1] },
      { text: 'Changing the copy does not change the original', visible: [0] },
      { text: 'Copies Date objects', visible: [] },
    ],
    starter: `function deepClone(value) {\n  \n}\n`,
    visibleTests: [
      { name: 'independent copy', call: '(() => { const o = { a: [1, { b: 2 }] }; const c = deepClone(o); c.a[1].b = 9; return [o.a[1].b, c !== o, c.a !== o.a]; })()', expect: '[2, true, true]' },
      { name: 'primitive', call: 'deepClone(5)', expect: '5' },
      { name: 'nested arrays', call: 'deepClone([1, [2, [3]]])', expect: '[1, [2, [3]]]' },
    ],
  },
  {
    id: 'compose', topic: 'functions', title: 'compose', fnName: 'compose',
    description: 'Write compose(...fns). It returns a function that runs the functions from right to left, passing each result to the next function. The rightmost function receives all the arguments. With no functions it returns its first argument.',
    requirements: [
      { text: 'Runs functions from right to left', visible: [0, 2] },
      { text: 'With no functions, returns the input', visible: [1] },
      { text: 'The rightmost function can take several arguments', visible: [] },
      { text: 'Calls nothing until the result is used', visible: [] },
    ],
    starter: `function compose(...fns) {\n  \n}\n`,
    visibleTests: [
      { name: 'right to left', call: 'compose((x) => x + 1, (x) => x * 2)(5)', expect: '11' },
      { name: 'no functions', call: 'compose()(7)', expect: '7' },
      { name: 'strings', call: "compose((s) => s + '!', (s) => s.toUpperCase())('hi')", expect: "'HI!'" },
    ],
  },
  {
    id: 'flattenObject', topic: 'arrays', title: 'Flatten an object', fnName: 'flattenObject',
    description: 'Write flattenObject(obj). It turns nested plain objects into one object whose keys are the paths joined with a dot, such as "a.b.c". Arrays and other values are kept as they are. Empty nested objects produce no keys.',
    requirements: [
      { text: 'Joins nested keys with a dot', visible: [0] },
      { text: 'Returns {} for an empty object', visible: [1] },
      { text: 'Keeps top-level values as they are', visible: [2] },
      { text: 'Arrays and null are values, not nested objects', visible: [] },
    ],
    starter: `function flattenObject(obj) {\n  \n}\n`,
    visibleTests: [
      { name: 'nested keys', call: 'flattenObject({ a: { b: 1, c: { d: 2 } }, e: 3 })', expect: "{ 'a.b': 1, 'a.c.d': 2, e: 3 }" },
      { name: 'empty object', call: 'flattenObject({})', expect: '{}' },
      { name: 'flat object', call: 'flattenObject({ a: 1, b: 2 })', expect: '{ a: 1, b: 2 }' },
    ],
  },
];
