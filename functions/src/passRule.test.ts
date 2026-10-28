import { describe, expect, it } from 'vitest';
import { PASS_RULE } from './config';
import { emptyBreakdown, evaluatePass } from './passRule';

const b = (easy: [number, number], medium: [number, number], hard: [number, number]) => ({
  easy: { correct: easy[0], total: easy[1] },
  medium: { correct: medium[0], total: medium[1] },
  hard: { correct: hard[0], total: hard[1] },
});

describe('pass rule (config: pass-rule.json)', () => {
  it('reads the numbers from config, not from code', () => {
    expect(PASS_RULE).toEqual({ overall: 0.7, perLevel: 0.5 });
  });
  it('passes at 70% overall with every level at 50% or more', () => {
    expect(evaluatePass(b([10, 10], [7, 10], [1, 2])).passed).toBe(true);
  });
  it('fails a strong overall score when one level is under 50%', () => {
    // 30 of 34 overall is about 88%, but hard is 0 of 4.
    expect(evaluatePass(b([15, 15], [15, 15], [0, 4])).passed).toBe(false);
  });
  it('fails just under the overall mark', () => {
    expect(evaluatePass(b([10, 10], [6, 10], [1, 4])).passed).toBe(false);
  });
  it('skips levels a test does not use', () => {
    const r = evaluatePass({ ...emptyBreakdown(), easy: { correct: 8, total: 10 }, medium: { correct: 8, total: 10 } });
    expect(r.levels.hard).toBeNull();
    expect(r.passed).toBe(true);
  });
  it('never passes an empty exam', () => {
    expect(evaluatePass(emptyBreakdown()).passed).toBe(false);
  });
});
