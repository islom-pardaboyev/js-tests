/**
 * Runs ONE hidden test of a user's function. Used inside the isolated worker
 * process (sandbox/worker.ts) and directly by the seed tests. It only depends on
 * the payload, so the worker can load it with no secrets and no network.
 */
export interface HiddenTest {
  name: string;
  /** JS expression evaluated with the user's function bound to `fnName` and a `sleep(ms)` helper. */
  call: string;
  /** JS expression for the expected value. */
  expect: string;
}

export interface RunPayload {
  code: string;
  fnName: string;
  test: HiddenTest;
}

export interface RunResult {
  passed: boolean;
  error?: string;
}

/** A call that does not settle within this many ms fails the test. Hard cap per test is enforced by the host too. */
const SETTLE_MS = 1500;

const message = (e: unknown): string => (e instanceof Error ? `${e.name}: ${e.message}` : String(e));

/** Deep equality for the values tests compare: primitives, arrays and plain objects. */
function equal(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ra = a as Record<string, unknown>;
  const rb = b as Record<string, unknown>;
  const ka = Object.keys(ra);
  if (ka.length !== Object.keys(rb).length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(rb, k) && equal(ra[k], rb[k]));
}

export async function runOne({ code, fnName, test }: RunPayload): Promise<RunResult> {
  let fn: unknown;
  try {
    fn = new Function(`${code}\n;return typeof ${fnName} === 'function' ? ${fnName} : undefined;`)();
  } catch (e) {
    return { passed: false, error: message(e) };
  }
  if (typeof fn !== 'function') return { passed: false, error: `${fnName} is not defined as a function` };

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const expected = new Function(`return (${test.expect});`)();
    const call = new Function(fnName, 'sleep', `return (${test.call});`);
    const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
    const limit = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`No result within ${SETTLE_MS / 1000} seconds`)), SETTLE_MS);
    });
    const actual = await Promise.race([Promise.resolve(call(fn, sleep)), limit]);
    return { passed: equal(actual, expected) };
  } catch (e) {
    return { passed: false, error: message(e) };
  } finally {
    clearTimeout(timer);
  }
}
