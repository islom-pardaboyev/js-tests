/**
 * Single source for the numbers the server and the browser both use. The JSON
 * files live in src/config/ so TypeScript can import them under rootDir.
 */
import passRule from './config/pass-rule.json';
import examConfig from './config/tests.json';
import type { Level, TestDef } from './types';

/** Pass rule: overall minimum, and the minimum for each level the test uses. See pass-rule.json. */
export const PASS_RULE: { overall: number; perLevel: number } = {
  overall: passRule.overall,
  perLevel: passRule.perLevel,
};

export const BANK_ID: string = examConfig.bankId;
export const PICKS_PER_LEVEL: Record<Level, number> = examConfig.picksPerLevel;
export const SECONDS_PER_ITEM: Record<Level, number> = examConfig.secondsPerItem;
const TESTS: TestDef[] = examConfig.tests as unknown as TestDef[];

/** The one admin. Rules and callables both check a verified email against this. */
export const ADMIN_EMAIL = 'ipardaboyev574@gmail.com';

/** Allowed lateness after the exam clock, in ms. Covers network delay on the last submit. */
export const SUBMIT_GRACE_MS = 15_000;

export const findTest = (id: string): TestDef | undefined => TESTS.find((t) => t.id === id);
