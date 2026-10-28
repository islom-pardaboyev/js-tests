import { describe, expect, it } from 'vitest';
import { applyMessage, finalizeResult, parseSandboxMessage } from './parse';
import { emptyResult } from './types';

const base = { source: 'jstests' };

describe('parseSandboxMessage', () => {
  it('rejects non-objects and foreign sources', () => {
    expect(parseSandboxMessage(null)).toBeNull();
    expect(parseSandboxMessage('hi')).toBeNull();
    expect(parseSandboxMessage({ type: 'done' })).toBeNull();
    expect(parseSandboxMessage({ source: 'other', type: 'done' })).toBeNull();
  });

  it('parses ready, done and error', () => {
    expect(parseSandboxMessage({ ...base, type: 'ready' })).toEqual({ type: 'ready' });
    expect(parseSandboxMessage({ ...base, type: 'done' })).toEqual({ type: 'done' });
    expect(parseSandboxMessage({ ...base, type: 'error', message: 'boom' })).toEqual({ type: 'error', message: 'boom' });
    expect(parseSandboxMessage({ ...base, type: 'error' })).toBeNull();
  });

  it('parses logs and rejects unknown levels', () => {
    expect(parseSandboxMessage({ ...base, type: 'log', level: 'warn', text: 'x' })).toEqual({ type: 'log', level: 'warn', text: 'x' });
    expect(parseSandboxMessage({ ...base, type: 'log', level: 'debug', text: 'x' })).toBeNull();
  });

  it('parses test results and rejects malformed ones', () => {
    const ok = { ...base, type: 'test', index: 0, name: 't', passed: true, actual: '1', expected: '1' };
    expect(parseSandboxMessage(ok)).toMatchObject({ type: 'test', index: 0, passed: true });
    expect(parseSandboxMessage({ ...ok, passed: 'yes' })).toBeNull();
    expect(parseSandboxMessage({ ...ok, index: '0' })).toBeNull();
  });

  it('rejects unknown types', () => {
    expect(parseSandboxMessage({ ...base, type: 'eval' })).toBeNull();
  });
});

describe('applyMessage', () => {
  it('accumulates logs, tests and errors without mutating', () => {
    const start = emptyResult();
    const a = applyMessage(start, { type: 'log', level: 'log', text: 'hi' });
    const b = applyMessage(a, { type: 'test', index: 0, name: 't', passed: true, actual: '1', expected: '1' });
    const c = applyMessage(b, { type: 'error', message: 'bad' });
    expect(start.logs).toHaveLength(0);
    expect(c.logs).toEqual([{ level: 'log', text: 'hi' }]);
    expect(c.tests).toHaveLength(1);
    expect(c.tests[0]).not.toHaveProperty('type');
    expect(c.error).toBe('bad');
  });
});

describe('finalizeResult', () => {
  const inputs = [
    { name: 'a', call: '1', expect: '1' },
    { name: 'b', call: '2', expect: '2' },
  ];

  it('marks tests that never reported as failed', () => {
    const partial = applyMessage(emptyResult(), { type: 'test', index: 0, name: 'a', passed: true, actual: '1', expected: '1' });
    const final = finalizeResult(partial, inputs, true);
    expect(final.timedOut).toBe(true);
    expect(final.tests.map((t) => t.passed)).toEqual([true, false]);
    expect(final.tests[1].error).toContain('timed out');
  });

  it('keeps input order', () => {
    const late = applyMessage(emptyResult(), { type: 'test', index: 1, name: 'b', passed: true, actual: '2', expected: '2' });
    expect(finalizeResult(late, inputs, false).tests.map((t) => t.index)).toEqual([0, 1]);
  });
});
