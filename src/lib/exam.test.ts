import { describe, expect, it } from 'vitest';
import { seedBank } from '../data/seed';
import { PICKS_PER_LEVEL } from '../data/tests';
import type { ChoiceQuestion, TestDef } from '../data/types';
import { buildExam, examSeconds, examSize, shuffle, shuffleOptions } from './exam';

/** Small deterministic generator so the tests are repeatable. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const full: TestDef = { id: 'full', title: 'Full', summary: '', topics: null, levels: ['easy', 'medium', 'hard'] };

describe('shuffle', () => {
  it('keeps every item and does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, seeded(1));
    expect([...out].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('shuffleOptions', () => {
  it('keeps the correct option at the remapped index', () => {
    const q: ChoiceQuestion = { id: 'x', level: 'easy', topic: 'basics', prompt: '', snippet: '', options: ['a', 'b', 'c', 'd'], correct: 2, explanation: '' };
    const out = shuffleOptions(q, seeded(7));
    expect(out.options[out.correct]).toBe('c');
  });
});

describe('buildExam', () => {
  it('draws the picks per level and reports size and time', () => {
    const exam = buildExam(full, seedBank, PICKS_PER_LEVEL, seeded(3));
    expect(exam.easy.length).toBeLessThanOrEqual(PICKS_PER_LEVEL.easy);
    expect(examSize(exam)).toBe(exam.easy.length + exam.medium.length + exam.hard.length);
    expect(examSeconds(exam)).toBeGreaterThan(0);
  });
});
