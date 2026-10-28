export type Level = 'easy' | 'medium' | 'hard';
export type Topic = 'basics' | 'arrays' | 'functions' | 'coercion' | 'closures' | 'async';

interface BankBase {
  id: string;
  level: Level;
  topic: Topic;
  /** Which bank the item belongs to. Missing means 'default'. A learning center gets its own id. */
  bankId?: string;
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

/** What the browser receives during an exam: the question with no answer key. */
export type PublicChoice = Omit<ChoiceQuestion, 'correct' | 'explanation'>;
export type PublicTyped = Omit<TypedQuestion, 'accept' | 'explanation'>;
/** Hidden tests and the reference are never sent before submission. */
export type PublicTask = Omit<CodingTask, 'hiddenTests'>;

export interface LevelScore {
  correct: number;
  total: number;
}

/** Points per level. A hard task earns the fraction of its hidden tests that pass. */
export interface Breakdown {
  easy: LevelScore;
  medium: LevelScore;
  hard: LevelScore;
}

/** One line of the results review, built on the server after submission. */
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
