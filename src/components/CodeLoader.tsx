import { useEffect, useState } from 'react';
import { LOADER_LINES, progressBar, splitStatus, type LoaderScope } from '../lib/loaderScripts';
import { prefersReducedMotion } from '../lib/motion';

interface Props {
  scope: LoaderScope;
  /** Smaller log for inline spots such as table rows and panels. */
  compact?: boolean;
}

/**
 * The loader for every loading state: a terminal log that prints what the app
 * is doing, one step at a time, with a progress bar. Under reduced motion it
 * shows the finished log at once.
 */
export function CodeLoader({ scope, compact = false }: Props) {
  const lines = LOADER_LINES[scope];
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setStep(lines.length);
      return;
    }
    const id = window.setInterval(() => setStep((n) => (n >= lines.length + 2 ? 0 : n + 1)), 380);
    return () => window.clearInterval(id);
  }, [lines.length]);

  const done = Math.min(step, lines.length);
  return (
    <div className={`loader ${compact ? 'compact' : ''}`} role="status" aria-label="Loading">
      <p className="ld-head" aria-hidden="true">{progressBar(done, lines.length)}</p>
      <ul className="ld-lines" aria-hidden="true">
        {lines.slice(0, done).map((line) => {
          const { head, status } = splitStatus(line);
          const waiting = status === 'pending' || status === 'waiting';
          return (
            <li key={line}>
              {head}
              {status && <span className={waiting ? 'ld-wait' : 'ld-ok'}>{status}</span>}
            </li>
          );
        })}
        {done < lines.length && (
          <li className="ld-pending">{lines[done]}<span className="loader-caret" /></li>
        )}
      </ul>
    </div>
  );
}
