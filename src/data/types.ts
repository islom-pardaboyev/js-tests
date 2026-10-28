export type Level = 'easy' | 'medium' | 'hard';
export type Topic = 'basics' | 'arrays' | 'functions' | 'coercion' | 'closures' | 'async';

interface BankBase {
  id: string;
  level: Level;
  topic: Topic;
}

/** Easy: pick one of four options. */
export interface ChoiceQuestion extends BankBase {
  level: 'easy';
  prompt: string;
  snippet: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation: string;
}

/** Medium: type the exact console output. Compared after normalizing. */
export interface TypedQuestion extends BankBase {
  level: 'medium';
  prompt: string;
  snippet: string;
  /** Accepted answers (each is normalized before comparing). */
  accept: string[];
  hint: string;
  explanation: string;
}

/**
 * A serializable test case. `call` and `expect` are JS expressions evaluated
 * inside the sandbox. `call` may return a promise and can use `sleep(ms)`.
 */
export interface TestCase {
  name: string;
  call: string;
  expect: string;
}

export interface Requirement {
  text: string;
  /** Indexes of visible tests that prove this requirement. */
  visible: number[];
}

/** Hard: write a function in the live editor. */
export interface CodingTask extends BankBase {
  level: 'hard';
  title: string;
  fnName: string;
  description: string;
  requirements: Requirement[];
  starter: string;
  visibleTests: TestCase[];
  hiddenTests: TestCase[];
}

export type BankItem = ChoiceQuestion | TypedQuestion | CodingTask;

export interface TestDef {
  id: string;
  title: string;
  summary: string;
  /** null = every topic. */
  topics: Topic[] | null;
  levels: Level[];
}

export interface Exam {
  easy: ChoiceQuestion[];
  medium: TypedQuestion[];
  hard: CodingTask[];
}
