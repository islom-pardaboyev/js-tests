import { useState } from 'react';
import type { SandboxResult } from '../../lib/sandbox/types';
import { CheckIcon } from '../Icons';

type Tab = 'console' | 'tests';

interface Props {
  result: SandboxResult | null;
  running: boolean;
}

export function OutputPanel({ result, running }: Props) {
  const [tab, setTab] = useState<Tab>('console');
  const passed = result?.tests.filter((t) => t.passed).length ?? 0;
  const total = result?.tests.length ?? 0;

  return (
    <div className="out">
      <div className="out-tabs" role="tablist" aria-label="Output panel">
        <button type="button" role="tab" aria-selected={tab === 'console'} onClick={() => setTab('console')}>Console</button>
        <button type="button" role="tab" aria-selected={tab === 'tests'} onClick={() => setTab('tests')}>
          Tests{result && total > 0 ? ` ${passed}/${total}` : ''}
        </button>
      </div>
      <div className="out-body" role="tabpanel" aria-live="polite">
        {running && <p className="muted">Running…</p>}
        {!running && !result && <p className="muted">Press Run. Console output and test results appear here.</p>}
        {!running && result && (tab === 'console' ? <ConsoleView result={result} /> : <TestsView result={result} />)}
      </div>
    </div>
  );
}

function ConsoleView({ result }: { result: SandboxResult }) {
  return (
    <>
      {result.logs.map((l, i) => (
        <div key={i} className={`log-line ${l.level}`}>{l.text}</div>
      ))}
      {result.error && <div className="log-line error">{result.error}</div>}
      {result.logs.length === 0 && !result.error && <p className="muted">Nothing was printed to the console.</p>}
    </>
  );
}

function TestsView({ result }: { result: SandboxResult }) {
  if (result.tests.length === 0) return <p className="muted">No tests.</p>;
  return (
    <>
      {result.error && <div className="log-line error pb-2">{result.error}</div>}
      {result.tests.map((t) => (
        <div key={t.index} className={`test-line ${t.passed ? 'pass' : 'fail'}`}>
          <span className="mark" aria-hidden="true">{t.passed ? <CheckIcon width={14} height={14} /> : '✕'}</span>
          <div>
            <div>{t.name}</div>
            {!t.passed && (
              <div className="detail">
                {t.error ? t.error : `expected ${t.expected}, got ${t.actual}`}
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
