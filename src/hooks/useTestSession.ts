import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import type { BankItem, Exam, Level, TestDef } from '../data/types';
import { loadPool } from '../lib/bank';
import { buildExam, examSeconds } from '../lib/exam';
import type { Reason } from '../lib/examGuard';
import { clearMarker, setMarker } from '../lib/examMarker';
import { gradeExam, persistOutcome, type Answers, type Outcome } from '../lib/finishTest';
import type { ReviewItem } from '../lib/review';
import type { Breakdown } from '../lib/grading';
import { useCountdown } from './useCountdown';
import { useExamLock, type ExamLock } from './useExamLock';

type Phase = 'loading' | 'intro' | Level | 'finishing' | 'result';

interface TestSession {
  phase: Phase;
  pool: BankItem[];
  loadError: boolean;
  exam: Exam | null;
  codes: Record<string, string>;
  outcome: Outcome | null;
  lock: ExamLock;
  error: string | null;
  starting: boolean;
  secondsLeft: number;
  totalSeconds: number;
  /** Items the user has answered or edited so far. */
  answered: number;
  start: () => Promise<void>;
  recordEasy: (index: number, choice: number) => void;
  recordMedium: (index: number, text: string) => void;
  completeEasy: () => void;
  completeMedium: () => void;
  setCode: (taskId: string, code: string) => void;
  finish: () => Promise<void>;
  retrySave: () => Promise<void>;
}

const ORDER: Level[] = ['easy', 'medium', 'hard'];

/** Phase after `from`, skipping levels the drawn exam has no items for. */
function nextPhase(exam: Exam, from: Level | null): Phase {
  const start = from ? ORDER.indexOf(from) + 1 : 0;
  return ORDER.slice(start).find((l) => exam[l].length > 0) ?? 'finishing';
}

/** State machine for one exam: intro, easy, medium, hard, finishing, result. */
export function useTestSession(test: TestDef, user: User): TestSession {
  const [phase, setPhase] = useState<Phase>('loading');
  const [pool, setPool] = useState<BankItem[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [answered, setAnswered] = useState(0);
  const touched = useRef(new Set<string>());
  const answers = useRef<Answers>({ easy: [], medium: [], codes: {} });
  const startedAt = useRef(0);
  const last = useRef<{ breakdown: Breakdown; terminated: boolean; violations: string[] } | null>(null);
  const finished = useRef(false);
  const lockRef = useRef<ExamLock | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadPool(test)
      .then((items) => !cancelled && setPool(items))
      .catch(() => !cancelled && setLoadError(true))
      .finally(() => !cancelled && setPhase('intro'));
    return () => {
      cancelled = true;
    };
  }, [test]);

  const conclude = useCallback(
    async (breakdown: Breakdown, terminated: boolean, violations: string[], timedOut = false, review?: ReviewItem[]) => {
      if (finished.current) return;
      finished.current = true;
      setPhase('finishing');
      setEndAt(null);
      clearMarker();
      lockRef.current?.release();
      last.current = { breakdown, terminated, violations };
      const seconds = Math.round((Date.now() - startedAt.current) / 1000);
      const saved = await persistOutcome(user, test, breakdown, seconds, { terminated, violations });
      setOutcome({ ...saved, timedOut, review: terminated ? undefined : review });
      setPhase('result');
    },
    [user, test],
  );

  const onTerminate = useCallback(
    (reasons: Reason[]) => {
      if (!exam) return;
      void gradeExam(exam, answers.current, false).then((g) => conclude(g.breakdown, true, [...reasons, 'rule-limit']));
    },
    [exam, conclude],
  );

  const running = phase === 'easy' || phase === 'medium' || phase === 'hard';
  const lock = useExamLock({ active: running, onTerminate });
  lockRef.current = lock;

  const onExpire = useCallback(() => {
    if (!exam || finished.current) return;
    setPhase('finishing');
    void gradeExam(exam, answers.current, true).then((g) => conclude(g.breakdown, false, [], true, g.review));
  }, [exam, conclude]);
  const secondsLeft = useCountdown(endAt, onExpire);

  const start = useCallback(async () => {
    setStarting(true);
    setError(null);
    const entered = await lock.enter();
    if (!entered.ok) {
      setError(entered.error);
      setStarting(false);
      return;
    }
    const drawn = buildExam(test, pool);
    if (drawn.easy.length + drawn.medium.length + drawn.hard.length === 0) {
      lock.release();
      setError('This test has no questions yet. Ask the admin to add some.');
      setStarting(false);
      return;
    }
    const seconds = examSeconds(drawn);
    startedAt.current = Date.now();
    finished.current = false;
    answers.current = { easy: [], medium: [], codes: {} };
    touched.current.clear();
    setAnswered(0);
    setCodes(Object.fromEntries(drawn.hard.map((t) => [t.id, t.starter])));
    setExam(drawn);
    setTotalSeconds(seconds);
    setEndAt(startedAt.current + seconds * 1000);
    setMarker({ uid: user.uid, testId: test.id, startedAt: startedAt.current });
    setStarting(false);
    setPhase(nextPhase(drawn, null));
  }, [lock, test, pool, user.uid]);

  const advance = useCallback(
    (from: Level) => {
      if (!exam) return;
      const next = nextPhase(exam, from);
      if (next === 'finishing') {
        setPhase('finishing');
        void gradeExam(exam, answers.current, true).then((g) => conclude(g.breakdown, false, [], false, g.review));
      } else setPhase(next);
    },
    [exam, conclude],
  );

  const touch = useCallback((key: string) => {
    if (touched.current.has(key)) return;
    touched.current.add(key);
    setAnswered(touched.current.size);
  }, []);

  const recordEasy = useCallback((i: number, choice: number) => {
    answers.current.easy[i] = choice;
    touch(`e${i}`);
  }, [touch]);
  const recordMedium = useCallback((i: number, text: string) => {
    answers.current.medium[i] = text;
    if (text.trim()) touch(`m${i}`);
  }, [touch]);
  const completeEasy = useCallback(() => advance('easy'), [advance]);
  const completeMedium = useCallback(() => advance('medium'), [advance]);

  const setCode = useCallback((taskId: string, code: string) => {
    answers.current.codes[taskId] = code;
    setCodes((prev) => ({ ...prev, [taskId]: code }));
    touch(`h${taskId}`);
  }, [touch]);

  const finish = useCallback(async () => {
    if (!exam) return;
    setPhase('finishing');
    const graded = await gradeExam(exam, answers.current, true);
    await conclude(graded.breakdown, false, [], false, graded.review);
  }, [exam, conclude]);

  const retrySave = useCallback(async () => {
    const saved = last.current;
    if (!saved) return;
    const seconds = Math.round((Date.now() - startedAt.current) / 1000);
    setOutcome(await persistOutcome(user, test, saved.breakdown, seconds, saved));
  }, [user, test]);

  return {
    phase, pool, loadError, exam, codes, outcome, lock, error, starting, secondsLeft, totalSeconds, answered,
    start, recordEasy, recordMedium, completeEasy, completeMedium, setCode, finish, retrySave,
  };
}
