import { fork } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { HiddenTest, RunResult } from './runner';

/** Hard limit per hidden test, from the spec: 3 seconds, then the process is killed. */
const TEST_TIME_LIMIT_MS = 3000;
/** Heap cap for each test process. */
const HEAP_MB = 64;

/**
 * Runs user code for one hidden test in a separate Node process. The process
 * gets no secrets (env is empty), a temp working directory, a heap cap, and a
 * hard kill after TEST_TIME_LIMIT_MS. Any crash, timeout or missing reply
 * counts as a failed test.
 *
 * Honest limit: a child process is not a security boundary. Code in it can
 * still reach the filesystem and network that the Cloud Function can. Before
 * this runs untrusted code for real users, move `runIsolatedTest` into a
 * container with no network and no credentials (for example Cloud Run with
 * gVisor), keeping this same payload protocol.
 */
function runIsolatedTest(code: string, fnName: string, test: HiddenTest): Promise<RunResult> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (r: RunResult) => {
      if (!settled) {
        settled = true;
        resolve(r);
      }
    };
    const child = fork(join(__dirname, 'worker.js'), [], {
      env: {},
      cwd: tmpdir(),
      silent: true,
      timeout: TEST_TIME_LIMIT_MS,
      execArgv: [`--max-old-space-size=${HEAP_MB}`],
    });
    child.on('message', (m) => done(m as RunResult));
    child.on('error', (e) => done({ passed: false, error: e.message }));
    child.on('exit', (code, signal) => {
      done({ passed: false, error: signal === 'SIGTERM' ? 'Time limit of 3 seconds exceeded' : `Process exited (${code ?? signal})` });
    });
    child.send({ code, fnName, test });
  });
}

/** Runs every hidden test for one task, one process per test. */
export async function runHiddenTests(code: string, fnName: string, tests: HiddenTest[]): Promise<{ name: string; passed: boolean }[]> {
  const out: { name: string; passed: boolean }[] = [];
  for (const test of tests) {
    const r = await runIsolatedTest(code, fnName, test);
    out.push({ name: test.name, passed: r.passed });
  }
  return out;
}
