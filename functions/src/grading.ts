import { isTypedCorrect } from './normalize';
import type { LevelScore } from './types';

/** One point per easy question whose chosen option index is the stored correct index. */
export function gradeChoice(items: { correct: number }[], answers: (number | null | undefined)[]): LevelScore {
  const correct = items.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0);
  return { correct, total: items.length };
}

/** One point per medium item whose typed text matches an accepted answer (see normalize.ts). */
export function gradeTyped(items: { accept: string[] }[], inputs: string[]): LevelScore {
  const correct = items.reduce((n, q, i) => n + (isTypedCorrect(q.accept, inputs[i] ?? '') ? 1 : 0), 0);
  return { correct, total: items.length };
}

/** A hard task earns the fraction of its hidden tests that pass. */
export const taskPoints = (passed: number, total: number): number => (total === 0 ? 0 : passed / total);
