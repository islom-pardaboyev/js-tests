import type { TestCase } from '../types';

/** Hidden tests for the tasks in hardMore.ts. */
export const hiddenMore: Record<string, TestCase[]> = {
  chunk: [
    { name: 'exact fit', call: 'chunk([1, 2, 3, 4], 2)', expect: '[[1, 2], [3, 4]]' },
    { name: 'size 1', call: "chunk(['a', 'b', 'c'], 1)", expect: "[['a'], ['b'], ['c']]" },
    { name: 'one big chunk', call: "chunk(['a', 'b', 'c'], 3)", expect: "[['a', 'b', 'c']]" },
    { name: 'does not mutate', call: '(() => { const a = [1, 2, 3]; chunk(a, 2); return a; })()', expect: '[1, 2, 3]' },
  ],
  unique: [
    { name: 'NaN counts once', call: 'unique([NaN, NaN, 1])', expect: '[NaN, 1]' },
    { name: 'number and string differ', call: "unique([1, '1', 1])", expect: "[1, '1']" },
    { name: 'keeps first occurrence order', call: "unique(['b', 'a', 'b', 'c', 'a'])", expect: "['b', 'a', 'c']" },
    { name: 'does not mutate', call: '(() => { const a = [1, 1, 2]; unique(a); return a; })()', expect: '[1, 1, 2]' },
  ],
  groupBy: [
    { name: 'one group', call: "groupBy(['a', 'b'], () => 'k')", expect: "{ k: ['a', 'b'] }" },
    { name: 'order inside groups', call: "groupBy([5, 1, 4, 2], (n) => (n > 3 ? 'big' : 'small'))", expect: "{ big: [5, 4], small: [1, 2] }" },
    { name: 'falsy keys', call: 'groupBy([0, 1, 2], (n) => n % 2)', expect: '{ 0: [0, 2], 1: [1] }' },
    { name: 'does not mutate', call: '(() => { const a = [1, 2, 3]; groupBy(a, (n) => n); return a; })()', expect: '[1, 2, 3]' },
  ],
  once: [
    { name: 'keeps this', call: '(() => { let ctx; const obj = { f: once(function () { ctx = this; }) }; obj.f(); return ctx === obj; })()', expect: 'true' },
    { name: 'passes all arguments', call: '(() => { const f = once((...a) => a); return f(1, 2, 3); })()', expect: '[1, 2, 3]' },
    { name: 'independent instances', call: '(() => { const a = once(() => 1); const b = once(() => 2); return [a(), b(), a(), b()]; })()', expect: '[1, 2, 1, 2]' },
    { name: 'later arguments are ignored', call: '(() => { const f = once((x) => x); f(1); return f(2); })()', expect: '1' },
  ],
  memoize: [
    { name: 'several arguments', call: '(() => { let n = 0; const m = memoize((a, b) => { n++; return a + b; }); m(1, 2); m(1, 2); return n; })()', expect: '1' },
    { name: 'argument order matters', call: '(() => { let n = 0; const m = memoize((a, b) => { n++; return a - b; }); m(1, 2); m(2, 1); return n; })()', expect: '2' },
    { name: 'caches falsy results', call: '(() => { let n = 0; const m = memoize(() => { n++; return 0; }); m(); m(); m(); return n; })()', expect: '1' },
    { name: 'caches undefined', call: '(() => { let n = 0; const m = memoize((x) => { n++; }); m(1); m(1); return n; })()', expect: '1' },
  ],
  curry: [
    { name: 'one then two', call: 'curry((a, b, c) => a + b + c)(1)(2, 3)', expect: '6' },
    { name: 'no parameters', call: "curry(() => 'x')()", expect: "'x'" },
    { name: 'reusable partial', call: '(() => { const add5 = curry((a, b) => a + b)(5); return [add5(1), add5(2)]; })()', expect: '[6, 7]' },
    { name: 'four arguments', call: "curry((a, b, c, d) => [a, b, c, d].join('-'))(1)(2)(3)(4)", expect: "'1-2-3-4'" },
  ],
  retry: [
    { name: 'stops after times calls', call: '(async () => { let n = 0; await retry(async () => { n++; throw new Error("x"); }, 3).catch(() => {}); return n; })()', expect: '3' },
    { name: 'times is 1', call: "retry(async () => { throw 'once'; }, 1).then(() => 'r', (e) => e)", expect: "'once'" },
    { name: 'a throw before the promise', call: "retry(() => { throw 'sync'; }, 2).then(() => 'r', (e) => e)", expect: "'sync'" },
    { name: 'last error wins', call: "(() => { let n = 0; return retry(async () => { n++; throw 'e' + n; }, 3).then(() => 'r', (e) => e); })()", expect: "'e3'" },
  ],
  deepClone: [
    { name: 'null', call: 'deepClone(null)', expect: 'null' },
    { name: 'array inside object', call: '(() => { const o = { list: [1, 2] }; const c = deepClone(o); c.list.push(3); return o.list; })()', expect: '[1, 2]' },
    { name: 'objects inside an array', call: '(() => { const a = [{ x: 1 }]; const c = deepClone(a); c[0].x = 5; return a[0].x; })()', expect: '1' },
    { name: 'Date', call: '(() => { const d = new Date(0); const c = deepClone(d); return [c instanceof Date, c !== d, c.getTime()]; })()', expect: '[true, true, 0]' },
  ],
  compose: [
    { name: 'one function', call: 'compose((x) => x + 1)(1)', expect: '2' },
    { name: 'several arguments to the last', call: 'compose((x) => x + 1, (a, b) => a + b)(1, 2)', expect: '4' },
    { name: 'three functions', call: "compose((s) => s + 'c', (s) => s + 'b', (s) => s + 'a')('')", expect: "'abc'" },
    { name: 'nothing runs early', call: '(() => { let n = 0; compose(() => n++, () => n++); return n; })()', expect: '0' },
  ],
  flattenObject: [
    { name: 'arrays are values', call: 'flattenObject({ a: [1, 2] })', expect: '{ a: [1, 2] }' },
    { name: 'null is a value', call: 'flattenObject({ a: null })', expect: '{ a: null }' },
    { name: 'four levels', call: 'flattenObject({ a: { b: { c: { d: 1 } } } })', expect: "{ 'a.b.c.d': 1 }" },
    { name: 'empty nested object', call: 'flattenObject({ a: {} })', expect: '{}' },
  ],
};
