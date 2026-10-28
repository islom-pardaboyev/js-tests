/**
 * Exam sessions. startExam draws the questions and stores the full answer key
 * in examSessions (server only). finishExam grades the submitted answers
 * against that stored key, so nothing the browser sends can change the key.
 */
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { randomInt } from 'node:crypto';
import { BANK_ID, PICKS_PER_LEVEL, SECONDS_PER_ITEM, SUBMIT_GRACE_MS, findTest } from './config';
import { issueCertificate } from './certificates';
import { drawPublic, withKeys } from './bank';
import { gradeChoice, gradeTyped, taskPoints } from './grading';
import { runHiddenTests } from './sandbox/host';
import { emptyBreakdown, evaluatePass, percent } from './passRule';
import { randomHex } from './certificate';
import type { BankItem, Breakdown, ChoiceQuestion, CodingTask, Level, PublicChoice, PublicTask, PublicTyped, ReviewItem, TestDef, TypedQuestion } from './types';

const SESSIONS = 'examSessions';
const ATTEMPTS = 'attempts';

const db = () => getFirestore();

interface StoredChoice extends Omit<ChoiceQuestion, 'correct' | 'options'> { options: [string, string, string, string]; correct: number }
interface StoredSession {
  uid: string;
  testId: string;
  bankId: string;
  startedAt: number;
  deadline: number;
  status: 'open' | 'finishing' | 'finished';
  easy: StoredChoice[];
  medium: TypedQuestion[];
  hard: CodingTask[];
  outcome?: Outcome;
}

interface Answers {
  easy: (number | null)[];
  medium: string[];
  codes: Record<string, string>;
}

interface Outcome {
  breakdown: Breakdown;
  score: number;
  passed: boolean;
  durationSec: number;
  certId: string | null;
  certificate?: { id: string; uid: string; displayName: string; testId: string; score: number; createdAt: number; breakdown: Breakdown };
  terminated: boolean;
  violations: string[];
  timedOut: boolean;
  review?: ReviewItem[];
}

const publicChoice = ({ correct: _c, explanation: _e, ...rest }: StoredChoice): PublicChoice => {
  void _c;
  void _e;
  return rest;
};
const publicTyped = ({ accept: _a, explanation: _e, ...rest }: TypedQuestion): PublicTyped => {
  void _a;
  void _e;
  return rest;
};
const publicTask = ({ hiddenTests: _h, ...rest }: CodingTask): PublicTask => {
  void _h;
  return rest;
};

/** Shuffles the four options and remaps the correct index. Random source is the OS CSPRNG. */
function shuffleChoice(q: ChoiceQuestion): StoredChoice {
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    id: q.id,
    level: 'easy',
    topic: q.topic,
    bankId: q.bankId,
    prompt: q.prompt,
    snippet: q.snippet,
    options: order.map((i) => q.options[i]) as [string, string, string, string],
    correct: order.indexOf(q.correct),
    explanation: q.explanation,
  };
}

async function drawExam(test: TestDef): Promise<{ easy: StoredChoice[]; medium: TypedQuestion[]; hard: CodingTask[] }> {
  const pick = async (level: Level): Promise<BankItem[]> => {
    if (!test.levels.includes(level)) return [];
    return withKeys(await drawPublic(BANK_ID, level, PICKS_PER_LEVEL[level], test.topics));
  };
  const [easy, medium, hard] = await Promise.all([pick('easy'), pick('medium'), pick('hard')]);
  return {
    easy: (easy as ChoiceQuestion[]).map(shuffleChoice),
    medium: medium as TypedQuestion[],
    hard: hard as CodingTask[],
  };
}

async function displayNameFor(uid: string): Promise<{ name: string; email: string }> {
  try {
    const user = await getAuth().getUser(uid);
    return { name: user.displayName ?? user.email ?? 'User', email: user.email ?? '' };
  } catch {
    return { name: 'User', email: '' };
  }
}

/** Closes any unfinished session of this user as a terminated attempt, so a refresh cannot re-roll the exam. */
async function abandonOpenSessions(uid: string): Promise<void> {
  const open = await db().collection(SESSIONS).where('uid', '==', uid).where('status', '==', 'open').get();
  for (const d of open.docs) {
    const s = d.data() as StoredSession;
    const { name, email } = await displayNameFor(uid);
    await db().collection(ATTEMPTS).add({
      uid, displayName: name, email, testId: s.testId, score: 0, passed: false,
      breakdown: emptyBreakdown(), durationSec: Math.max(0, Math.round((Date.now() - s.startedAt) / 1000)),
      createdAt: Date.now(), certId: null, terminated: true, violations: ['left-exam'], timedOut: false,
    });
    await d.ref.update({ status: 'finished', outcome: { abandoned: true } });
  }
}

export async function startExam(uid: string, testId: string) {
  const test = findTest(testId);
  if (!test) throw new HttpsError('not-found', 'Unknown test.');
  await abandonOpenSessions(uid);

  const drawn = await drawExam(test);
  const total = drawn.easy.length + drawn.medium.length + drawn.hard.length;
  if (total === 0) throw new HttpsError('failed-precondition', 'This test has no questions yet. Ask the admin to add some.');

  const seconds = drawn.easy.length * SECONDS_PER_ITEM.easy + drawn.medium.length * SECONDS_PER_ITEM.medium + drawn.hard.length * SECONDS_PER_ITEM.hard;
  const startedAt = Date.now();
  const deadline = startedAt + seconds * 1000;
  const examId = randomHex(16);
  const session: StoredSession = {
    uid, testId, bankId: BANK_ID, startedAt, deadline, status: 'open',
    easy: drawn.easy, medium: drawn.medium, hard: drawn.hard,
  };
  await db().collection(SESSIONS).doc(examId).set(session);

  return {
    examId,
    bankId: BANK_ID,
    startedAt,
    totalSeconds: seconds,
    easy: drawn.easy.map(publicChoice),
    medium: drawn.medium.map(publicTyped),
    hard: drawn.hard.map(publicTask),
  } as const;
}

const MAX_VIOLATIONS = 20;

/** Reviews are built from the stored key and the submitted answers. */
function buildReview(s: StoredSession, answers: Answers, hardResults: Map<string, { name: string; passed: boolean }[]>): ReviewItem[] {
  const easy: ReviewItem[] = s.easy.map((q, i) => {
    const a = answers.easy[i];
    const given = typeof a === 'number' ? q.options[a] : undefined;
    return {
      id: q.id, level: 'easy', title: q.prompt, snippet: q.snippet,
      yourAnswer: given ?? 'No answer', correctAnswer: q.options[q.correct],
      correct: a === q.correct, explanation: q.explanation,
    };
  });
  const medium: ReviewItem[] = s.medium.map((q, i) => {
    const text = (answers.medium[i] ?? '').trim();
    return {
      id: q.id, level: 'medium', title: q.prompt, snippet: q.snippet,
      yourAnswer: text || 'No answer', correctAnswer: q.accept[0],
      correct: gradeTyped([q], [text]).correct === 1, explanation: q.explanation,
    };
  });
  const hard: ReviewItem[] = s.hard.map((t) => {
    const results = hardResults.get(t.id) ?? [];
    const passed = results.filter((r) => r.passed).length;
    return {
      id: t.id, level: 'hard', title: t.title, snippet: '',
      yourAnswer: `${passed} of ${results.length} hidden tests passed`,
      correctAnswer: 'All hidden tests pass',
      correct: results.length > 0 && passed === results.length,
      explanation: t.description, tests: results,
    };
  });
  return [...easy, ...medium, ...hard];
}

export async function finishExam(uid: string, data: Record<string, unknown>, signingKey: string): Promise<Outcome> {
  const examId = typeof data.examId === 'string' ? data.examId : '';
  if (!examId) throw new HttpsError('invalid-argument', 'Missing exam id.');
  const ref = db().collection(SESSIONS).doc(examId);

  // Claim the session once. A repeated submit returns the stored outcome instead of grading twice.
  const claimed = await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Unknown exam.');
    const s = snap.data() as StoredSession;
    if (s.uid !== uid) throw new HttpsError('permission-denied', 'This is not your exam.');
    if (s.status === 'open') {
      tx.update(ref, { status: 'finishing' });
      return { s, first: true };
    }
    return { s, first: false };
  });
  if (!claimed.first) {
    if (claimed.s.outcome) return claimed.s.outcome as Outcome;
    throw new HttpsError('failed-precondition', 'This exam is already being graded. Reload to see the result.');
  }
  const s = claimed.s;
  const { name, email } = await displayNameFor(uid);
  const durationSec = Math.max(0, Math.round((Date.now() - s.startedAt) / 1000));
  const violations = Array.isArray(data.violations) ? data.violations.filter((v): v is string => typeof v === 'string').slice(0, MAX_VIOLATIONS) : [];
  const timedOut = data.timedOut === true || Date.now() > s.deadline + SUBMIT_GRACE_MS;
  const terminated = data.terminated === true;

  if (data.abandoned === true) {
    const breakdown = emptyBreakdown();
    const outcome: Outcome = { breakdown, score: 0, passed: false, durationSec, certId: null, terminated: true, violations: ['left-exam'], timedOut: false };
    await db().collection(ATTEMPTS).add({ uid, displayName: name, email, testId: s.testId, score: 0, passed: false, breakdown, durationSec, createdAt: Date.now(), certId: null, terminated: true, violations: ['left-exam'], timedOut: false });
    await ref.update({ status: 'finished', outcome });
    return outcome;
  }

  const answers: Answers = {
    easy: Array.isArray(data.easy) ? (data.easy as (number | null)[]) : [],
    medium: Array.isArray(data.medium) ? (data.medium as string[]) : [],
    codes: typeof data.codes === 'object' && data.codes !== null ? (data.codes as Record<string, string>) : {},
  };

  const breakdown = emptyBreakdown();
  breakdown.easy = gradeChoice(s.easy, answers.easy);
  breakdown.medium = gradeTyped(s.medium, answers.medium);
  const hardResults = new Map<string, { name: string; passed: boolean }[]>();
  let points = 0;
  if (!terminated) {
    for (const task of s.hard) {
      const code = answers.codes[task.id] ?? task.starter;
      const results = await runHiddenTests(code, task.fnName, task.hiddenTests);
      hardResults.set(task.id, results);
      points += taskPoints(results.filter((r) => r.passed).length, results.length);
    }
  }
  breakdown.hard = { correct: Math.round(points * 100) / 100, total: s.hard.length };

  const verdict = evaluatePass(breakdown);
  const passed = !terminated && verdict.passed;
  const score = percent(verdict.overall);
  const createdAt = Date.now();

  let certId: string | null = null;
  let certificate: Outcome['certificate'];
  if (passed) {
    const issued = await issueCertificate({ uid, displayName: name, testId: s.testId, score, createdAt, breakdown }, signingKey);
    certId = issued.id;
    certificate = { ...issued, uid, breakdown };
  }

  await db().collection(ATTEMPTS).add({
    uid, displayName: name, email, testId: s.testId, score, passed, breakdown, durationSec,
    createdAt, certId, terminated, violations, timedOut,
  });

  const outcome: Outcome = {
    breakdown, score, passed, durationSec, certId, certificate, terminated, violations, timedOut,
    review: terminated ? undefined : buildReview(s, answers, hardResults),
  };
  await ref.update({ status: 'finished', outcome: JSON.parse(JSON.stringify(outcome)) });
  return outcome;
}

