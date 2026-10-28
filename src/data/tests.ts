import type { Level, TestDef } from './types';

/** How many random items an exam draws from each level of the bank. Hard items take up to 8 minutes each, so few are drawn. */
export const PICKS_PER_LEVEL: Record<Level, number> = { easy: 15, medium: 15, hard: 4 };

/** Time allowed per item, in seconds. The exam clock is the sum over the drawn items. */
export const SECONDS_PER_ITEM: Record<Level, number> = { easy: 40, medium: 75, hard: 480 };

export const tests: TestDef[] = [
  {
    id: 'full',
    title: 'JavaScript Assessment',
    summary: 'The full exam: easy, medium and hard items drawn at random from every topic.',
    topics: null,
    levels: ['easy', 'medium', 'hard'],
  },
  {
    id: 'basics',
    title: 'JavaScript Basics',
    summary: 'Types, variables, references and core language behavior.',
    topics: ['basics'],
    levels: ['easy', 'medium', 'hard'],
  },
  {
    id: 'coercion',
    title: 'Coercion & Equality',
    summary: '==, +, sort and the type conversion traps.',
    topics: ['coercion'],
    levels: ['easy', 'medium', 'hard'],
  },
  {
    id: 'closures',
    title: 'Closures & Scope',
    summary: 'Hoisting, closures in loops and this binding.',
    topics: ['closures'],
    levels: ['easy', 'medium', 'hard'],
  },
  {
    id: 'async',
    title: 'Async & the Event Loop',
    summary: 'Microtasks, macrotasks and promise chain ordering.',
    topics: ['async'],
    levels: ['easy', 'medium', 'hard'],
  },
  {
    id: 'arrays',
    title: 'Arrays & Objects',
    summary: 'Mutation and references, sorting, keys, and flattening nested arrays.',
    topics: ['arrays'],
    levels: ['easy', 'medium', 'hard'],
  },
  {
    id: 'functions',
    title: 'Functions & Binding',
    summary: 'Parameters and default values, currying, and what bind does to this.',
    topics: ['functions'],
    levels: ['easy', 'medium'],
  },
  {
    id: 'challenges',
    title: 'Coding Challenges',
    summary: 'Hard level only: write real functions in the live editor.',
    topics: null,
    levels: ['hard'],
  },
];

export function getTest(id: string | undefined): TestDef | undefined {
  return tests.find((t) => t.id === id);
}

export function testTitle(id: string): string {
  return getTest(id)?.title ?? id;
}
