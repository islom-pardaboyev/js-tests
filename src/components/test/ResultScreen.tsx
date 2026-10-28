import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { TestDef } from '../../data/types';
import { verifyUrl } from '../../lib/certificate';
import type { Outcome } from '../../lib/finishTest';
import { formatDuration, formatPoints } from '../../lib/format';
import { PASS_THRESHOLD } from '../../lib/grading';
import { REASON_LABEL } from '../../lib/examGuard';
import { gsap, useGsap } from '../../lib/motion';
import { ProgressBar } from './ProgressBar';
import { ReviewList } from './ReviewList';
import { DownloadPdfButton } from '../DownloadPdfButton';
import { QrCode } from '../QrCode';

interface Props {
  test: TestDef;
  outcome: Outcome;
  onRetrySave: () => Promise<void>;
}

export function ResultScreen({ test, outcome, onRetrySave }: Props) {
  const [shown, setShown] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [copied, setCopied] = useState(false);
  const root = useRef<HTMLElement>(null);
  const { breakdown: b } = outcome;
  const url = outcome.certId ? verifyUrl(outcome.certId) : '';
  const certificate = outcome.certificate;

  useGsap(root, () => {
    const counter = { v: 0 };
    gsap.to(counter, { v: outcome.score, duration: 1.6, ease: 'power3.out', onUpdate: () => setShown(Math.round(counter.v)) });
  }, []);
  // Without motion (reduced-motion), show the final number straight away.
  const value = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? outcome.score : shown;

  const retry = async () => {
    setRetrying(true);
    await onRetrySave();
    setRetrying(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      /* clipboard unavailable */
    }
  };

  const rows = [
    { label: 'Easy', s: b.easy },
    { label: 'Medium', s: b.medium },
    { label: 'Hard (tests passed)', s: b.hard },
  ].filter((r) => r.s.total > 0);

  return (
    <section className="container grid max-w-[860px] gap-8 py-12" aria-labelledby="result-title" ref={root}>
      <div className="rise flex flex-wrap items-center justify-between gap-6">
        <div className="grid gap-3">
          <span className={`chip w-fit ${outcome.passed ? 'pass' : 'fail'}`}>{outcome.terminated ? 'Exam terminated' : outcome.passed ? 'Passed' : 'Not passed'}</span>
          <h1 id="result-title">{test.title}</h1>
          <p className="score-hero" aria-label={`Score ${outcome.score} percent`}>{value}<span className="muted">%</span></p>
          <div className="w-64 max-w-full"><ProgressBar value={value} max={100} label="Score" /></div>
          <p className="muted text-[0.875rem]">Pass mark {PASS_THRESHOLD * 100}%</p>
        </div>
      </div>

      {outcome.terminated && (
        <div className="rise banner error" role="alert">
          <div>
            <p><strong>Exam rules ended this attempt. It cannot earn a certificate.</strong></p>
            <ul className="muted m-0 mt-1 list-disc pl-5">
              {[...new Set(outcome.violations)].map((v) => <li key={v}>{REASON_LABEL[v as keyof typeof REASON_LABEL] ?? v}</li>)}
            </ul>
          </div>
        </div>
      )}
      {outcome.timedOut && <p className="rise banner">Time ran out. Items you had not answered counted as wrong.</p>}

      <div className="rise breakdown">
        {rows.map((r) => <div key={r.label} className="kv"><b>{formatPoints(r.s.correct)}/{r.s.total}</b><span className="muted">{r.label}</span></div>)}
        <div className="kv"><b>{formatDuration(outcome.durationSec)}</b><span className="muted">Time taken</span></div>
      </div>

      {!outcome.saved && (
        <div className="rise banner error" role="alert">
          <p>Your result could not be saved. Check that Firestore is set up and the rules are published.</p>
          <button type="button" className="btn btn-sm" onClick={() => void retry()} disabled={retrying} aria-busy={retrying}>Try saving again</button>
        </div>
      )}

      {outcome.certId && (
        <div className="rise panel flex flex-wrap items-center gap-5 p-5">
          <QrCode value={url} size={120} label="QR code for your certificate" />
          <div className="grid min-w-0 flex-1 gap-2">
            <h2 className="!text-[1.5rem]">Your certificate is ready</h2>
            <p className="muted">Anyone can verify it with the link or QR code.</p>
            <code className="break-all text-[0.8125rem]">{url}</code>
            <div className="flex flex-wrap gap-2">
              <Link className="btn btn-primary" to={`/certificate/${outcome.certId}`}>Open certificate</Link>
              <button type="button" className="btn" onClick={() => void copy()}>{copied ? 'Link copied' : 'Copy link'}</button>
              {certificate && <DownloadPdfButton cert={certificate} />}
            </div>
          </div>
        </div>
      )}

      {outcome.review && outcome.review.length > 0 && <div className="rise mt-4"><ReviewList items={outcome.review} /></div>}

      <div className="rise flex flex-wrap gap-2">
        <Link className="btn" to="/dashboard">My tests</Link>
        <Link className="btn btn-ghost" to={`/test/${test.id}`} reloadDocument>Take it again</Link>
      </div>
    </section>
  );
}
