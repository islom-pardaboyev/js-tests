import { describe, expect, it } from 'vitest';
import { gradeChoice, gradeTyped, taskPoints } from './grading';

describe('grading', () => {
  it('scores choices by stored correct index', () => {
    expect(gradeChoice([{ correct: 2 }, { correct: 0 }], [2, 1])).toEqual({ correct: 1, total: 2 });
  });
  it('scores typed answers with the normalization rules', () => {
    expect(gradeTyped([{ accept: ['[1,2]'] }, { accept: ['3'] }], ['[1, 2]', ''])).toEqual({ correct: 1, total: 2 });
  });
  it('gives hard tasks their fraction of passed hidden tests', () => {
    expect(taskPoints(3, 4)).toBe(0.75);
    expect(taskPoints(0, 0)).toBe(0);
  });
});
