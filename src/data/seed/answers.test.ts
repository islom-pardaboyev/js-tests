import { format } from 'node:util';
import { describe, expect, it } from 'vitest';
import { isTypedCorrect } from '../../lib/exam';
import { seedBank } from './index';

/** Runs a snippet and returns what its console.log calls print, one per line. */
function printed(code: string): string {
  const lines: string[] = [];
  const fake = { log: (...args: unknown[]) => lines.push(format(...args)) };
  new Function('console', code)(fake);
  return lines.join('\n');
}

const norm = (s: string): string => s.replace(/[\s'"`]+/g, '').toLowerCase();

/** Every seed answer must match what its code prints. Async and hard items are checked elsewhere. */
describe('seed answers match what the code prints', () => {
  for (const q of seedBank) {
    if (q.level === 'hard' || q.topic === 'async' || q.snippet.includes('setTimeout')) continue;
    it(`${q.id}`, () => {
      const out = printed(q.snippet);
      if (q.level === 'easy') expect(norm(q.options[q.correct])).toBe(norm(out));
      else if (q.level === 'medium') expect(isTypedCorrect(q, out)).toBe(true);
    });
  }
});
