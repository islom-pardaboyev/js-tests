import type { ChoiceQuestion, CodingTask, Level, TypedQuestion } from '../data/types';
import { isTypedCorrect } from './exam';

/** One line of the results review. Built after the exam, never shown during it. */
export interface ReviewItem {
  id: string;
  level: Level;
  title: string;
  snippet: string;
  yourAnswer: string;
  correctAnswer: string;
  correct: boolean;
  explanation: string;
  /** Hard tasks only: each hidden test by name. */
  tests?: { name: string; passed: boolean }[];
}

const NONE = 'No answer';

export function reviewChoice(q: ChoiceQuestion, answer: number | null | undefined): ReviewItem {
  const given = typeof answer === 'number' ? q.options[answer] : undefined;
  return {
    id: q.id,
    level: 'easy',
    title: q.prompt,
    snippet: q.snippet,
    yourAnswer: given ?? NONE,
    correctAnswer: q.options[q.correct],
    correct: answer === q.correct,
    explanation: q.explanation,
  };
}

export function reviewTyped(q: TypedQuestion, input: string | undefined): ReviewItem {
  const text = (input ?? '').trim();
  return {
    id: q.id,
    level: 'medium',
    title: q.prompt,
    snippet: q.snippet,
    yourAnswer: text || NONE,
    correctAnswer: q.accept[0],
    correct: isTypedCorrect(q, text),
    explanation: q.explanation,
  };
}

export function reviewTask(t: CodingTask, results: { name: string; passed: boolean }[]): ReviewItem {
  const passed = results.filter((r) => r.passed).length;
  return {
    id: t.id,
    level: 'hard',
    title: t.title,
    snippet: '',
    yourAnswer: `${passed} of ${results.length} hidden tests passed`,
    correctAnswer: 'All hidden tests pass',
    correct: results.length > 0 && passed === results.length,
    explanation: t.description,
    tests: results,
  };
}
