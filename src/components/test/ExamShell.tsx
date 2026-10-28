import type { ReactNode } from 'react';
import { formatClock } from '../../hooks/useCountdown';
import type { ExamLock } from '../../hooks/useExamLock';
import { MAX_STRIKES } from '../../lib/examGuard';
import { ClockIcon } from '../Icons';
import { Logo } from '../Logo';
import { ExamOverlay } from './ExamOverlay';

interface Props {
  title: string;
  section: string;
  secondsLeft: number;
  answered: number;
  total: number;
  lock: ExamLock;
  children: ReactNode;
}

/** Full-screen exam frame: no site navigation, a clock, strikes and a progress seal. */
export function ExamShell({ title, section, secondsLeft, answered, total, lock, children }: Props) {
  const low = secondsLeft <= 60;
  const paused = lock.blocked !== null || !lock.isFullscreen;

  return (
    <div className="exam-shell" role="main" aria-label={`${title} exam`}>
      <div className="exam-bar">
        <Logo to={null} />
        <div className="grow">
          <p className="where">{title}</p>
          <p className="meta">{section}</p>
        </div>
        <div className="strikes" role="img" aria-label={`${lock.strikes} of ${MAX_STRIKES} strikes`} title="Strikes">
          {Array.from({ length: MAX_STRIKES }, (_, i) => <i key={i} className={i < lock.strikes ? 'on' : ''} />)}
        </div>
        <span className="meta" aria-label="Progress">{answered}/{total}</span>
        <p className={`clock ${low ? 'low' : ''}`} role="timer" aria-label={`Time left ${formatClock(secondsLeft)}`}>
          <ClockIcon /> {formatClock(secondsLeft)}
        </p>
      </div>
      <div className="exam-dots" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => <i key={i} className={i < answered ? 'done' : i === answered ? 'cur' : ''} />)}
      </div>
      <div className="exam-main" aria-hidden={paused}>{children}</div>
      {paused && <ExamOverlay lock={lock} />}
    </div>
  );
}
