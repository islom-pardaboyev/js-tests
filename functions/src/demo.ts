/**
 * Five easy questions for the landing page demo. They are written here, not
 * taken from the bank, so the demo can reveal answers without exposing any
 * question a candidate can be given in a real exam.
 */
interface DemoItem { id: string; prompt: string; snippet: string; options: [string, string, string, string]; correct: number; explanation: string }

const DEMO: DemoItem[] = [
  { id: 'demo-slice', prompt: 'What does this print?', snippet: 'console.log([1, 2, 3].slice(-2));', options: ['[3]', '[1, 2]', '[2, 3]', '[1]'], correct: 2, explanation: 'slice(-2) starts two items from the end, so it keeps the last two.' },
  { id: 'demo-includes', prompt: 'What does this print?', snippet: 'console.log([1, 2, 3].includes("2"));', options: ['true', 'false', 'undefined', 'TypeError'], correct: 1, explanation: 'includes compares with strict equality, so the string "2" is not the number 2.' },
  { id: 'demo-null', prompt: 'What does this print?', snippet: 'console.log(typeof null);', options: ['"null"', '"object"', '"undefined"', '"number"'], correct: 1, explanation: 'typeof null is "object". It is a long-standing bug in the language.' },
  { id: 'demo-coerce', prompt: 'What does this print?', snippet: 'console.log(1 + "2" - 1);', options: ['2', '12', '11', 'NaN'], correct: 2, explanation: '1 + "2" is the string "12". "12" - 1 converts it to the number 11.' },
  { id: 'demo-async', prompt: 'What does this print first?', snippet: 'setTimeout(() => console.log("a"), 0);\nPromise.resolve().then(() => console.log("b"));', options: ['a', 'b', 'a and b together', 'nothing'], correct: 1, explanation: 'Promise callbacks (microtasks) run before timer callbacks (macrotasks), so b prints first.' },
];

export function demoPublic(index: number) {
  const { correct: _c, explanation: _e, ...rest } = DEMO[index % DEMO.length];
  void _c;
  void _e;
  return { ...rest, count: DEMO.length };
}

export function demoCheck(id: string): { correct: number; explanation: string } | null {
  const item = DEMO.find((d) => d.id === id);
  return item ? { correct: item.correct, explanation: item.explanation } : null;
}
