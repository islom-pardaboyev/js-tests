import type { ChoiceQuestion } from './types';

/**
 * Public preview questions for the landing page. They are written for the
 * preview, not taken from the question bank, and they show their answers on
 * purpose. Bank questions, answer keys and hidden tests never ship in the bundle.
 */
export const heroQuestions: ChoiceQuestion[] = [
  {
    id: 'hero-typeof',
    level: 'easy',
    topic: 'basics',
    prompt: 'What does this print?',
    snippet: 'console.log(typeof [])',
    options: ['"array"', '"object"', '"list"', '"undefined"'],
    correct: 1,
    explanation: 'Arrays are objects. typeof has no separate "array" result.',
  },
  {
    id: 'hero-float',
    level: 'easy',
    topic: 'basics',
    prompt: 'What does this print?',
    snippet: 'console.log(0.1 + 0.2 === 0.3)',
    options: ['true', 'false', 'undefined', 'TypeError'],
    correct: 1,
    explanation: '0.1 + 0.2 is 0.30000000000000004 in floating point, so it is not equal to 0.3.',
  },
  {
    id: 'hero-empty',
    level: 'easy',
    topic: 'coercion',
    prompt: 'What does this print?',
    snippet: 'console.log([] + [])',
    options: ['"[]"', '0', '""', 'NaN'],
    correct: 2,
    explanation: 'Both arrays convert to empty strings, and joining two empty strings gives an empty string.',
  },
  {
    id: 'hero-boolean',
    level: 'easy',
    topic: 'coercion',
    prompt: 'What does this print?',
    snippet: 'console.log(Boolean("false"))',
    options: ['true', 'false', 'undefined', '"false"'],
    correct: 0,
    explanation: 'Any non-empty string is truthy, even the text "false".',
  },
];
