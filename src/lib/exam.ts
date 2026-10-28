import { PICKS_PER_LEVEL, SECONDS_PER_ITEM } from '../data/tests';
import type {
  BankItem,
  ChoiceQuestion,
  CodingTask,
  Exam,
  Level,
  TestDef,
  TypedQuestion,
} from '../data/types';

type Rng = () => number;

/** Fisher-Yates on a copy. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Shuffles the four options and remaps the correct index. */
export function shuffleOptions(q: ChoiceQuestion, rng: Rng = Math.random): ChoiceQuestion {
  const order = shuffle([0, 1, 2, 3] as const, rng);
  const options = order.map((i) => q.options[i]) as ChoiceQuestion['options'];
  const correct = order.indexOf(q.correct) as ChoiceQuestion['correct'];
  return { ...q, options, correct };
}

const inLevel = <T extends BankItem>(pool: BankItem[], level: Level): T[] =>
  pool.filter((i) => i.level === level) as T[];

/**
 * Draws a fresh random exam: up to `picks[level]` items from each level the
 * test uses, optionally limited to the test's topics. A level with fewer items
 * than requested contributes all it has; an empty level is skipped.
 */
export function buildExam(
  test: TestDef,
  bank: BankItem[],
  picks: Record<Level, number> = PICKS_PER_LEVEL,
  rng: Rng = Math.random,
): Exam {
  const pool = test.topics ? bank.filter((i) => test.topics?.includes(i.topic)) : bank;
  const draw = <T extends BankItem>(level: Level): T[] =>
    test.levels.includes(level) ? shuffle(inLevel<T>(pool, level), rng).slice(0, picks[level]) : [];
  return {
    easy: draw<ChoiceQuestion>('easy').map((q) => shuffleOptions(q, rng)),
    medium: draw<TypedQuestion>('medium'),
    hard: draw<CodingTask>('hard'),
  };
}

export const examSize = (e: Exam): number => e.easy.length + e.medium.length + e.hard.length;

/** Whitespace and quote characters never matter when comparing a typed output. */
function normalizeAnswer(raw: string): string {
  return raw.replace(/[\s'"`]+/g, '').toLowerCase();
}

export function isTypedCorrect(q: TypedQuestion, input: string): boolean {
  const given = normalizeAnswer(input);
  return given.length > 0 && q.accept.some((a) => normalizeAnswer(a) === given);
}

/** Total exam time in seconds for a drawn exam. */
export const examSeconds = (e: Exam): number =>
  e.easy.length * SECONDS_PER_ITEM.easy + e.medium.length * SECONDS_PER_ITEM.medium + e.hard.length * SECONDS_PER_ITEM.hard;
