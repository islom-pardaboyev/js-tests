import type { BankItem, Level, Requirement, TestCase, Topic } from '../data/types';
import { parseBankItem } from './bank';

/** Everything the admin form edits, as plain strings so inputs stay simple. */
export interface Draft {
  id: string | null;
  level: Level;
  topic: Topic;
  prompt: string;
  snippet: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation: string;
  /** One accepted answer per line. */
  accept: string;
  hint: string;
  title: string;
  fnName: string;
  description: string;
  /** One per line: `Requirement text | 0,1` (numbers are the visible tests that prove it). */
  requirements: string;
  starter: string;
  visible: TestCase[];
  hidden: TestCase[];
}

export const TOPICS: Topic[] = ['basics', 'arrays', 'functions', 'coercion', 'closures', 'async'];

const blankTest = (): TestCase => ({ name: '', call: '', expect: '' });

export function emptyDraft(level: Level): Draft {
  return {
    id: null, level, topic: 'basics', prompt: '', snippet: '', options: ['', '', '', ''], correct: 0, explanation: '',
    accept: '', hint: '', title: '', fnName: '', description: '', requirements: '', starter: '',
    visible: [blankTest(), blankTest(), blankTest()], hidden: [blankTest(), blankTest(), blankTest(), blankTest()],
  };
}

const reqToLine = (r: Requirement): string => (r.visible.length ? `${r.text} | ${r.visible.join(',')}` : r.text);

export function parseRequirements(text: string): Requirement[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, nums = ''] = line.split('|').map((p) => p.trim());
      const visible = nums.split(',').map((n) => Number.parseInt(n, 10)).filter((n) => Number.isInteger(n) && n >= 0);
      return { text: label, visible };
    });
}

export function draftFromItem(item: BankItem): Draft {
  const base = emptyDraft(item.level);
  const common = { ...base, id: item.id, topic: item.topic };
  if (item.level === 'easy') {
    return { ...common, prompt: item.prompt, snippet: item.snippet, options: [...item.options], correct: item.correct, explanation: item.explanation };
  }
  if (item.level === 'medium') {
    return { ...common, prompt: item.prompt, snippet: item.snippet, accept: item.accept.join('\n'), hint: item.hint, explanation: item.explanation };
  }
  return {
    ...common, title: item.title, fnName: item.fnName, description: item.description, starter: item.starter,
    requirements: item.requirements.map(reqToLine).join('\n'), visible: item.visibleTests, hidden: item.hiddenTests,
  };
}

const newId = (level: Level): string => `${level[0]}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;

const keepTests = (tests: TestCase[]): TestCase[] =>
  tests.filter((t) => t.name.trim() || t.call.trim() || t.expect.trim()).map((t) => ({ name: t.name.trim(), call: t.call.trim(), expect: t.expect.trim() }));

/** Turns the form into a validated bank item, or a human-readable problem. */
export function draftToItem(d: Draft): { item: BankItem; error: null } | { item: null; error: string } {
  const id = d.id ?? newId(d.level);
  const base = { id, level: d.level, topic: d.topic };
  let raw: Record<string, unknown>;
  if (d.level === 'easy') {
    raw = { ...base, prompt: d.prompt.trim(), snippet: d.snippet, options: d.options.map((o) => o.trim()), correct: d.correct, explanation: d.explanation.trim() };
  } else if (d.level === 'medium') {
    raw = { ...base, prompt: d.prompt.trim(), snippet: d.snippet, accept: d.accept.split('\n').map((a) => a.trim()).filter(Boolean), hint: d.hint.trim(), explanation: d.explanation.trim() };
  } else {
    raw = {
      ...base, title: d.title.trim(), fnName: d.fnName.trim(), description: d.description.trim(), starter: d.starter,
      requirements: parseRequirements(d.requirements), visibleTests: keepTests(d.visible), hiddenTests: keepTests(d.hidden),
    };
  }
  const item = parseBankItem(raw);
  if (!item) return { item: null, error: problemWith(d) };
  return { item, error: null };
}

/** Names what is missing, so the admin knows which field to fix. */
function problemWith(d: Draft): string {
  if (d.level === 'easy') {
    if (!d.prompt.trim()) return 'Add the question text.';
    if (d.options.some((o) => !o.trim())) return 'Fill in all four options.';
    return 'Check the question fields.';
  }
  if (d.level === 'medium') {
    if (!d.prompt.trim()) return 'Add the question text.';
    if (!d.accept.split('\n').some((a) => a.trim())) return 'Add at least one accepted answer.';
    return 'Check the question fields.';
  }
  if (!d.title.trim() || !d.fnName.trim() || !d.description.trim()) return 'Title, function name and description are required.';
  if (keepTests(d.visible).length === 0 || keepTests(d.hidden).length === 0) return 'Add at least one visible and one hidden test.';
  if ([...keepTests(d.visible), ...keepTests(d.hidden)].some((t) => !t.name || !t.call || !t.expect)) return 'Every test needs a name, a call and an expected value.';
  return 'Check the task fields.';
}
