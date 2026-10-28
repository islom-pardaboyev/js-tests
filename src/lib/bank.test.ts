import { describe, expect, it } from 'vitest';
import { seedBank } from '../data/seed';
import { hiddenSeed } from '../data/seed/hidden';
import { countByLevel, parseBankFile, parseBankItem } from './bank';
import { draftFromItem, draftToItem, emptyDraft, parseRequirements } from './questionDraft';

describe('seed bank', () => {
  it('has the starter counts and valid shapes', () => {
    expect(countByLevel(seedBank)).toEqual({ easy: 58, medium: 52, hard: 14 });
    expect(seedBank.every((i) => parseBankItem(i) !== null)).toBe(true);
    expect(new Set(seedBank.map((i) => i.id)).size).toBe(seedBank.length);
  });
  it('gives each task 3 visible and 4 hidden tests', () => {
    for (const t of seedBank.filter((i) => i.level === 'hard')) {
      if (t.level !== 'hard') continue;
      expect(t.visibleTests).toHaveLength(3);
      expect(t.hiddenTests).toHaveLength(4);
      expect(hiddenSeed[t.id]).toBe(t.hiddenTests);
    }
  });
});

describe('parseBankItem', () => {
  it('rejects malformed items', () => {
    expect(parseBankItem(null)).toBeNull();
    expect(parseBankItem({ id: 'x', level: 'easy', topic: 'basics', prompt: 'q', snippet: '', options: ['a', 'b'], correct: 0, explanation: '' })).toBeNull();
    expect(parseBankItem({ id: 'x', level: 'medium', topic: 'basics', prompt: 'q', snippet: '', accept: [], hint: '', explanation: '' })).toBeNull();
    expect(parseBankItem({ id: 'x', level: 'weird', topic: 'basics' })).toBeNull();
  });
  it('parseBankFile counts rejected rows', () => {
    const { items, rejected } = parseBankFile([seedBank[0], { nope: true }, seedBank[12]]);
    expect(items).toHaveLength(2);
    expect(rejected).toBe(1);
    expect(parseBankFile({ not: 'an array' })).toEqual({ items: [], rejected: 0 });
  });
});

describe('question drafts', () => {
  it('round-trips every seed item through the form model', () => {
    for (const item of seedBank) {
      const result = draftToItem(draftFromItem(item));
      expect(result.error).toBeNull();
      expect(result.item).toEqual(item);
    }
  });
  it('explains what is missing', () => {
    const easy = emptyDraft('easy');
    expect(draftToItem(easy).error).toBe('Add the question text.');
    expect(draftToItem({ ...easy, prompt: 'Q' }).error).toBe('Fill in all four options.');
    expect(draftToItem({ ...emptyDraft('medium'), prompt: 'Q' }).error).toBe('Add at least one accepted answer.');
    expect(draftToItem(emptyDraft('hard')).error).toContain('required');
  });
  it('builds a new item with a fresh id', () => {
    const d = { ...emptyDraft('easy'), prompt: 'Q', options: ['a', 'b', 'c', 'd'] as [string, string, string, string] };
    const r = draftToItem(d);
    expect(r.item?.id).toMatch(/^e-/);
  });
  it('parses requirement lines', () => {
    expect(parseRequirements('Works | 0,1\nPlain\n')).toEqual([{ text: 'Works', visible: [0, 1] }, { text: 'Plain', visible: [] }]);
  });
});
