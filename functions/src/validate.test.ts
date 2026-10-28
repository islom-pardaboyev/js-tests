import { describe, expect, it } from 'vitest';
import { parseBankFile, parseBankItem } from './validate';

describe('parseBankItem', () => {
  it('rejects malformed items', () => {
    expect(parseBankItem(null)).toBeNull();
    expect(parseBankItem({ id: 'x', level: 'easy', topic: 'basics', prompt: 'q', snippet: '', options: ['a', 'b'], correct: 0, explanation: '' })).toBeNull();
    expect(parseBankItem({ id: 'x', level: 'medium', topic: 'basics', prompt: 'q', snippet: '', accept: [], hint: '', explanation: '' })).toBeNull();
    expect(parseBankItem({ id: 'x', level: 'weird', topic: 'basics' })).toBeNull();
  });
  it('keeps valid items; a missing bank id is filled in when saved', () => {
    const item = parseBankItem({ id: 'x', level: 'easy', topic: 'basics', prompt: 'q', snippet: '', options: ['a', 'b', 'c', 'd'], correct: 0, explanation: '' });
    expect(item?.bankId).toBeUndefined();
  });
  it('parseBankFile counts rejected rows', () => {
    const good = { id: 'x', level: 'easy', topic: 'basics', prompt: 'q', snippet: '', options: ['a', 'b', 'c', 'd'], correct: 0, explanation: '' };
    expect(parseBankFile([good, { id: 'bad' }])).toEqual({ items: [expect.objectContaining({ id: 'x' })], rejected: 1 });
  });
});
