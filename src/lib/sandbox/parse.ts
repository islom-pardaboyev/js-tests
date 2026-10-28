import type {
  SandboxLog,
  SandboxMessage,
  SandboxResult,
  SandboxTestInput,
  SandboxTestResult,
} from './types';

const LEVELS: SandboxLog['level'][] = ['log', 'info', 'warn', 'error'];

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Validates a postMessage payload coming from the sandbox iframe. */
export function parseSandboxMessage(data: unknown): SandboxMessage | null {
  if (!isRecord(data) || data.source !== 'jstests') return null;
  switch (data.type) {
    case 'ready':
      return { type: 'ready' };
    case 'done':
      return { type: 'done' };
    case 'error':
      return typeof data.message === 'string' ? { type: 'error', message: data.message } : null;
    case 'log': {
      const level = LEVELS.find((l) => l === data.level);
      return level && typeof data.text === 'string' ? { type: 'log', level, text: data.text } : null;
    }
    case 'test': {
      if (
        typeof data.index !== 'number' ||
        typeof data.name !== 'string' ||
        typeof data.passed !== 'boolean' ||
        typeof data.actual !== 'string' ||
        typeof data.expected !== 'string'
      ) {
        return null;
      }
      return {
        type: 'test',
        index: data.index,
        name: data.name,
        passed: data.passed,
        actual: data.actual,
        expected: data.expected,
        error: typeof data.error === 'string' ? data.error : undefined,
      };
    }
    default:
      return null;
  }
}

/** Folds one message into the running result without mutating it. */
export function applyMessage(result: SandboxResult, msg: SandboxMessage): SandboxResult {
  switch (msg.type) {
    case 'log':
      return { ...result, logs: [...result.logs, { level: msg.level, text: msg.text }] };
    case 'test': {
      const { type: _type, ...test } = msg;
      return { ...result, tests: [...result.tests, test] };
    }
    case 'error':
      return { ...result, error: msg.message };
    default:
      return result;
  }
}

/** Tests that never reported (crash, timeout) count as failed. */
export function finalizeResult(
  result: SandboxResult,
  inputs: SandboxTestInput[],
  timedOut: boolean,
): SandboxResult {
  const tests: SandboxTestResult[] = inputs.map(
    (input, index) =>
      result.tests.find((t) => t.index === index) ?? {
        index,
        name: input.name,
        passed: false,
        actual: '',
        expected: '',
        error: timedOut ? 'Did not run (timed out)' : 'Did not run',
      },
  );
  return { ...result, tests, timedOut };
}
