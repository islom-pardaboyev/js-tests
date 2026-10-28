import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PICKS_PER_LEVEL, SECONDS_PER_ITEM } from '../../data/tests';
import type { BankItem, Level, TestDef } from '../../data/types';
import { formatClock } from '../../hooks/useCountdown';
import { ExamRules } from '../ExamRules';
import { CheckIcon, ClockIcon, LockIcon } from '../Icons';
import { countByLevel } from '../../lib/bank';

interface Props {
  test: TestDef;
  pool: BankItem[];
  loadError: boolean;
  error: string | null;
  starting: boolean;
  onStart: () => void;
}

const LEVEL_NAME: Record<Level, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export function TestIntro({ test, pool, loadError, error, starting, onStart }: Props) {
  const [agreed, setAgreed] = useState(false);
  const counts = countByLevel(pool);
  const draws = test.levels.map((l) => ({ level: l, n: Math.min(PICKS_PER_LEVEL[l], counts[l]) }));
  const total = draws.reduce((s, d) => s + d.n, 0);
  const seconds = draws.reduce((s, d) => s + d.n * SECONDS_PER_ITEM[d.level], 0);

  return (
    <section className="container grid max-w-[860px] gap-10 py-12">
      <div className="rise grid gap-3">
        <h1>{test.title}</h1>
        <p className="muted text-[1.0625rem]">{test.summary}</p>
      </div>

      <div className="rise panel flex flex-wrap items-center gap-x-8 gap-y-3 p-5">
        {draws.map((d) => (
          <p key={d.level}><span className={`chip ${d.level}`}>{LEVEL_NAME[d.level]}</span> <strong className="ml-2">{d.n}</strong> <span className="muted">items</span></p>
        ))}
        <p className="ml-auto flex items-center gap-2"><ClockIcon /> <strong>{formatClock(seconds)}</strong> <span className="muted">time limit</span></p>
      </div>

      {loadError && <div className="banner error" role="alert">Could not load the questions. Check your connection, Firestore and the rules, then reload.</div>}
      {!loadError && total === 0 && <div className="banner">This test has no questions yet.</div>}

      <div className="rise grid gap-4">
        <h2 className="!text-[1.5rem] flex items-center gap-3"><LockIcon /> Read before you start</h2>
        <div className="panel p-6"><ExamRules /></div>
        <p className="muted text-[0.875rem]">
          Limits: a web page cannot stop screenshots, a second device or a virtual machine. Violations it can detect are recorded for the admin.
        </p>
      </div>

      <div className="rise grid gap-5">
        <label className={`agree ${agreed ? 'on' : ''}`}>
          <input type="checkbox" className="sr-only" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span className="agree-box" aria-hidden="true">{agreed && <CheckIcon width={14} height={14} />}</span>
          <span className="agree-text">I understand the exam runs full screen and breaking the rules ends my attempt.</span>
          <code className="agree-state" aria-hidden="true">agreed = <b>{String(agreed)}</b></code>
        </label>
        {error && <p className="banner error" role="alert">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary" disabled={!agreed || total === 0 || starting} aria-busy={starting} onClick={onStart}>
            Start the exam <span aria-hidden="true">→</span>
          </button>
          <Link to="/dashboard" className="btn btn-ghost">Back to my tests</Link>
          {!agreed && total > 0 && <p className="muted text-[0.8125rem]">Tick the box to enable Start.</p>}
        </div>
      </div>
    </section>
  );
}
