import { Link } from 'react-router-dom';
import type { TestDef } from '../../data/types';
import type { Attempt } from '../../lib/db';
import { PlayIcon } from '../Icons';

interface Props {
  index: number;
  test: TestDef;
  last: Attempt | undefined;
  loading: boolean;
}

const LEVEL_NAME = { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as const;

export function TestRow({ index, test, last, loading }: Props) {
  return (
    <li className="test-row rise" style={{ '--i': index + 1 } as React.CSSProperties}>
      <div className="grid gap-2">
        <div className="test-title">
          <h3>{test.title}</h3>
          <span className="levels-chips">
            {test.levels.map((l) => <span key={l} className={`chip ${l}`}>{LEVEL_NAME[l]}</span>)}
          </span>
        </div>
        <p className="muted max-w-[60ch]">{test.summary}</p>
        <p className="meta-code">
          levels: [{test.levels.map((l) => `"${l}"`).join(', ')}]
          {test.topics && <>{'  '}topics: [{test.topics.map((t) => `"${t}"`).join(', ')}]</>}
        </p>
      </div>
      <div className="score-cell">
        {loading ? (
          <p className="mono-note ml-auto" role="status" aria-label="Loading">GET /attempts<span className="loader-caret" /></p>
        ) : last ? (
          <>
            <div className={`score-big ${last.passed ? 'pass' : 'fail'}`}>{last.score}%</div>
            <p className="muted text-[0.75rem]">last attempt</p>
          </>
        ) : (
          <p className="muted">Not attempted</p>
        )}
      </div>
      <div className="row-cta">
        <Link to={`/test/${test.id}`} className="btn btn-primary">
          <PlayIcon /> {last ? 'Try again' : 'Start'}
        </Link>
      </div>
    </li>
  );
}
