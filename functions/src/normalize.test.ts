import { describe, expect, it } from 'vitest';
import { isTypedCorrect, normalizeAnswer } from './normalize';

describe('normalizeAnswer', () => {
  it('ignores whitespace, line endings and quotes', () => {
    expect(normalizeAnswer(' [1, 2] ')).toBe(normalizeAnswer('[1,2]'));
    expect(normalizeAnswer('a\r\nb')).toBe(normalizeAnswer('a\nb'));
    expect(normalizeAnswer("'hi'")).toBe('hi');
  });
  it('folds case', () => {
    expect(normalizeAnswer('TRUE')).toBe('true');
  });
  it('keeps key order significant in printed objects', () => {
    expect(normalizeAnswer('{a: 1, b: 2}')).not.toBe(normalizeAnswer('{b: 2, a: 1}'));
  });
});

describe('isTypedCorrect', () => {
  it('accepts any listed answer and rejects blanks', () => {
    expect(isTypedCorrect(['[1,2]', '[2,1]'], '[2, 1]')).toBe(true);
    expect(isTypedCorrect(['[1,2]'], '   ')).toBe(false);
    expect(isTypedCorrect(['3'], '4')).toBe(false);
  });
});
