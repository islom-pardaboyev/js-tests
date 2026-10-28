/**
 * Shape checks for bank items coming from the admin form or a JSON import.
 * Pure, so the browser can run the same check before it sends anything.
 */
import type { BankItem, ChoiceQuestion, CodingTask, Level, Topic, TypedQuestion } from './types';

const LEVELS: Level[] = ['easy', 'medium', 'hard'];
const TOPICS: Topic[] = ['basics', 'arrays', 'functions', 'coercion', 'closures', 'async'];

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isTests = (v: unknown): boolean =>
  Array.isArray(v) && v.every((t) => isRecord(t) && isStr(t.name) && isStr(t.call) && isStr(t.expect));

/** Returns the item if it has the right shape for its level, otherwise null. */
export function parseBankItem(raw: unknown): BankItem | null {
  if (!isRecord(raw) || !isStr(raw.id)) return null;
  const level = LEVELS.find((l) => l === raw.level);
  const topic = TOPICS.find((t) => t === raw.topic);
  if (!level || !topic) return null;
  const base = { ...raw, id: raw.id, level, topic };

  if (level === 'easy') {
    const ok =
      isStr(raw.prompt) &&
      typeof raw.snippet === 'string' &&
      Array.isArray(raw.options) &&
      raw.options.length === 4 &&
      raw.options.every(isStr) &&
      typeof raw.correct === 'number' &&
      [0, 1, 2, 3].includes(raw.correct) &&
      typeof raw.explanation === 'string';
    return ok ? (base as unknown as ChoiceQuestion) : null;
  }
  if (level === 'medium') {
    const ok =
      isStr(raw.prompt) &&
      typeof raw.snippet === 'string' &&
      Array.isArray(raw.accept) &&
      raw.accept.length > 0 &&
      raw.accept.every(isStr) &&
      typeof raw.hint === 'string' &&
      typeof raw.explanation === 'string';
    return ok ? (base as unknown as TypedQuestion) : null;
  }
  const ok =
    isStr(raw.title) &&
    isStr(raw.fnName) &&
    isStr(raw.description) &&
    typeof raw.starter === 'string' &&
    Array.isArray(raw.requirements) &&
    isTests(raw.visibleTests) &&
    isTests(raw.hiddenTests);
  return ok ? (base as unknown as CodingTask) : null;
}

/** Splits parsed JSON into valid items and the count of rejected rows. */
export function parseBankFile(json: unknown): { items: BankItem[]; rejected: number } {
  const rows = Array.isArray(json) ? json : [];
  const items = rows.map(parseBankItem).filter((i): i is BankItem => i !== null);
  return { items, rejected: rows.length - items.length };
}
