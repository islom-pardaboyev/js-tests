import { PASS_RULE } from './config';
import type { Breakdown, Level, LevelScore } from './types';

export const emptyBreakdown = (): Breakdown => ({
  easy: { correct: 0, total: 0 },
  medium: { correct: 0, total: 0 },
  hard: { correct: 0, total: 0 },
});

const ratio = (s: LevelScore): number => (s.total === 0 ? 0 : s.correct / s.total);

interface PassResult {
  passed: boolean;
  overall: number;
  /** Per level: the ratio and whether it met the per-level minimum. Levels with no items are null. */
  levels: Record<Level, { ratio: number; ok: boolean } | null>;
}

/**
 * Overall = all points over all items. A pass needs overall >= PASS_RULE.overall
 * and every level the test uses at >= PASS_RULE.perLevel. The rule lives in
 * src/config/pass-rule.json, not here.
 */
export function evaluatePass(b: Breakdown): PassResult {
  const total = b.easy.total + b.medium.total + b.hard.total;
  const correct = b.easy.correct + b.medium.correct + b.hard.correct;
  const overall = total === 0 ? 0 : correct / total;
  const levels = {} as PassResult['levels'];
  let levelsOk = true;
  for (const level of ['easy', 'medium', 'hard'] as Level[]) {
    const s = b[level];
    if (s.total === 0) {
      levels[level] = null;
      continue;
    }
    const r = ratio(s);
    const ok = r >= PASS_RULE.perLevel;
    levels[level] = { ratio: r, ok };
    levelsOk = levelsOk && ok;
  }
  return { passed: total > 0 && overall >= PASS_RULE.overall && levelsOk, overall, levels };
}

export const percent = (ratio: number): number => Math.round(ratio * 100);
