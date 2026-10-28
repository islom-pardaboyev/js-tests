export interface SandboxTestResult {
  index: number;
  name: string;
  passed: boolean;
  actual: string;
  expected: string;
  error?: string;
}

export interface SandboxLog {
  level: 'log' | 'info' | 'warn' | 'error';
  text: string;
}

export type SandboxMessage =
  | { type: 'ready' }
  | { type: 'log'; level: SandboxLog['level']; text: string }
  | ({ type: 'test' } & SandboxTestResult)
  | { type: 'error'; message: string }
  | { type: 'done' };

export interface SandboxResult {
  logs: SandboxLog[];
  tests: SandboxTestResult[];
  error: string | null;
  timedOut: boolean;
}

export interface SandboxTestInput {
  name: string;
  call: string;
  expect: string;
}

export const emptyResult = (): SandboxResult => ({ logs: [], tests: [], error: null, timedOut: false });
