/**
 * Grading and persistence for a finished exam. See the note in
 * grading.ts: a production version would do all of this in a Cloud Function.
 */
import type { User } from 'firebase/auth';
import type { Exam, TestDef } from '../data/types';
import { createCertificate, saveAttempt, type Certificate } from './db';
import {
  combinedPercent,
  countPassed,
  emptyBreakdown,
  gradeChoice,
  gradeTyped,
  isPassed,
  taskPoints,
  type Breakdown,
} from './grading';
import { reviewChoice, reviewTask, reviewTyped, type ReviewItem } from './review';
import { executeInSandbox } from './sandbox/execute';

export interface Outcome {
  breakdown: Breakdown;
  score: number;
  passed: boolean;
  durationSec: number;
  certId: string | null;
  /** The full certificate, kept so it can be downloaded as a PDF. Set only when one was issued. */
  certificate?: Certificate;
  saved: boolean;
  terminated: boolean;
  violations: string[];
  /** The exam clock ran out; unanswered items count as wrong. */
  timedOut?: boolean;
  /** Answers and explanations, shown only here after the exam. Absent when the attempt was terminated. */
  review?: ReviewItem[];
}

export interface Answers {
  easy: (number | null)[];
  medium: string[];
  codes: Record<string, string>;
}

/** Runs every hard task's hidden tests (one sandbox per task), grades the exam and builds the review. */
export async function gradeExam(
  exam: Exam,
  answers: Answers,
  runCode: boolean,
): Promise<{ breakdown: Breakdown; review: ReviewItem[] }> {
  const easy = gradeChoice(exam.easy, answers.easy);
  const medium = gradeTyped(exam.medium, answers.medium);
  const review: ReviewItem[] = [
    ...exam.easy.map((q, i) => reviewChoice(q, answers.easy[i])),
    ...exam.medium.map((q, i) => reviewTyped(q, answers.medium[i])),
  ];
  let points = 0;
  if (runCode) {
    for (const task of exam.hard) {
      const result = await executeInSandbox(answers.codes[task.id] ?? task.starter, task.fnName, task.hiddenTests);
      points += taskPoints(countPassed(result.tests), task.hiddenTests.length);
      review.push(reviewTask(task, result.tests.map((t) => ({ name: t.name, passed: t.passed }))));
    }
  }
  const breakdown: Breakdown = { ...emptyBreakdown(), easy, medium, hard: { correct: Math.round(points * 100) / 100, total: exam.hard.length } };
  return { breakdown, review };
}

interface PersistOptions {
  terminated: boolean;
  violations: string[];
}

/** Writes the attempt and, on a clean pass, the certificate. Never throws: reports `saved`. */
export async function persistOutcome(
  user: User,
  test: TestDef,
  breakdown: Breakdown,
  durationSec: number,
  { terminated, violations }: PersistOptions,
): Promise<Outcome> {
  const score = combinedPercent(breakdown);
  const passed = !terminated && isPassed(breakdown);
  const base = { breakdown, score, passed, durationSec, terminated, violations };
  const displayName = user.displayName ?? user.email ?? 'User';
  const createdAt = Date.now();
  try {
    const certId = passed
      ? await createCertificate({ uid: user.uid, displayName, testId: test.id, score, createdAt, breakdown })
      : null;
    const certificate: Certificate | undefined = certId
      ? { id: certId, uid: user.uid, displayName, testId: test.id, score, createdAt, breakdown }
      : undefined;
    await saveAttempt({
      uid: user.uid,
      displayName,
      email: user.email ?? '',
      testId: test.id,
      score,
      passed,
      breakdown,
      durationSec,
      createdAt,
      certId,
      terminated,
      violations,
    });
    return { ...base, certId, certificate, saved: true };
  } catch {
    return { ...base, certId: null, saved: false };
  }
}

/** Records an exam that was abandoned (page closed or reloaded mid-exam) as a failed, terminated attempt. */
export async function recordAbandoned(user: User, testId: string, startedAt: number): Promise<void> {
  await saveAttempt({
    uid: user.uid,
    displayName: user.displayName ?? user.email ?? 'User',
    email: user.email ?? '',
    testId,
    score: 0,
    passed: false,
    breakdown: emptyBreakdown(),
    durationSec: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
    createdAt: Date.now(),
    certId: null,
    terminated: true,
    violations: ['left-exam'],
  });
}
