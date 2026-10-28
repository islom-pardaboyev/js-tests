import type { ExamLock } from '../../hooks/useExamLock';
import { MAX_STRIKES, REASON_LABEL, strikesLeft, type Reason } from '../../lib/examGuard';
import { AlertIcon } from '../Icons';

const MESSAGE: Record<Reason, string> = {
  'fullscreen-exit': 'You left full screen. The exam is paused until you return.',
  'tab-switch': 'You left the exam window. Stay on this page for the whole exam.',
  'devtools-open': 'Developer tools were detected. Close them to continue.',
  'devtools-shortcut': 'Developer tools shortcuts are blocked during the exam.',
};

/** Covers the exam while a rule is broken or full screen is lost. */
export function ExamOverlay({ lock }: { lock: ExamLock }) {
  const reason = lock.blocked;
  const left = strikesLeft(lock.strikes);
  return (
    <div className="lock-overlay" role="alertdialog" aria-modal="true" aria-labelledby="lock-title">
      <div className="lock-panel">
        <div className="flex items-center gap-3 text-[var(--bad)]">
          <AlertIcon />
          <h2 id="lock-title" className="!text-[1.5rem]">{reason ? REASON_LABEL[reason] : 'Exam paused'}</h2>
        </div>
        <p>{reason ? MESSAGE[reason] : 'Full screen is required while the exam is running.'}</p>
        {lock.strikes > 0 && (
          <p className="muted">
            Strike {lock.strikes} of {MAX_STRIKES}. {left === 1 ? 'One more ends the exam.' : `${left} more end the exam.`}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {reason !== 'devtools-open' && (
            <button type="button" className="btn btn-primary" onClick={() => void lock.resume().then(lock.dismiss)}>
              {lock.isFullscreen ? 'Continue the exam' : 'Return to full screen'}
            </button>
          )}
        </div>
        <p className="muted text-[0.8125rem]">The clock keeps running while the exam is paused.</p>
      </div>
    </div>
  );
}
