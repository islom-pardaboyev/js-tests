/**
 * GRADING RUNS CLIENT-SIDE IN THIS DEMO.
 * Anyone with devtools can tamper with scores or forge a certificate request.
 * A production version would move question serving, grading and certificate
 * issuance into a Cloud Function that re-runs the hidden tests server-side
 * and signs the result.
 */
import type { ChoiceQuestion, TypedQuestion } from '../data/types';
import { isTypedCorrect } from './exam';

export const PASS_THRESHOLD = 0.7;

export interface LevelScore {
  correct: number;
  total: number;
}

/** One point per question or task. A task earns the fraction of its hidden tests that pass. */
export interface Breakdown {
  easy: LevelScore;
  medium: LevelScore;
  hard: LevelScore;
}

export const emptyBreakdown = (): Breakdown => ({
  easy: { correct: 0, total: 0 },
  medium: { correct: 0, total: 0 },
  hard: { correct: 0, total: 0 },
});

export function gradeChoice(questions: ChoiceQuestion[], answers: (number | null)[]): LevelScore {
  const correct = questions.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0);
  return { correct, total: questions.length };
}

export function gradeTyped(questions: TypedQuestion[], inputs: string[]): LevelScore {
  const correct = questions.reduce((n, q, i) => n + (isTypedCorrect(q, inputs[i] ?? '') ? 1 : 0), 0);
  return { correct, total: questions.length };
}

export function countPassed(results: { passed: boolean }[]): number {
  return results.filter((r) => r.passed).length;
}

/** Fraction of hidden tests passed for one task (0 when it has no tests). */
export function taskPoints(passed: number, total: number): number {
  return total === 0 ? 0 : passed / total;
}

function combinedRatio(b: Breakdown): number {
  const total = b.easy.total + b.medium.total + b.hard.total;
  const correct = b.easy.correct + b.medium.correct + b.hard.correct;
  return total === 0 ? 0 : correct / total;
}

export function combinedPercent(b: Breakdown): number {
  return Math.round(combinedRatio(b) * 100);
}

export function isPassed(b: Breakdown): boolean {
  return combinedRatio(b) >= PASS_THRESHOLD;
}
