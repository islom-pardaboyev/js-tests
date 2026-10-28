import { describe, expect, it } from 'vitest';
import { combinedPercent, emptyBreakdown, gradeChoice, isPassed, taskPoints } from './grading';

describe('grading', () => {
  it('passes at 70% overall', () => {
    const b = { ...emptyBreakdown(), easy: { correct: 7, total: 10 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
    expect(combinedPercent(b)).toBe(70);
    expect(isPassed(b)).toBe(true);
  });
  it('scores choices against the stored correct index', () => {
    expect(gradeChoice([{ id: 'a', level: 'easy', topic: 'basics', prompt: '', snippet: '', options: ['a', 'b', 'c', 'd'], correct: 2, explanation: '' }], [2])).toEqual({ correct: 1, total: 1 });
  });
  it('gives hard tasks their fraction of passed hidden tests', () => {
    expect(taskPoints(3, 4)).toBe(0.75);
    expect(taskPoints(0, 0)).toBe(0);
  });
});
