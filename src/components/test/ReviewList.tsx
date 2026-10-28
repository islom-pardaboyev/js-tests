import { useState } from 'react';
import type { Level } from '../../data/types';
import type { ReviewItem } from '../../lib/review';
import { CheckIcon } from '../Icons';
import { CodeSnippet } from './CodeSnippet';

const SECTIONS: { level: Level; title: string }[] = [
  { level: 'easy', title: 'Easy' },
  { level: 'medium', title: 'Medium' },
  { level: 'hard', title: 'Hard' },
];

function Item({ item, number }: { item: ReviewItem; number: number }) {
  return (
    <li className="review-item grid gap-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="max-w-[60ch]"><span className="meta mr-2">{String(number).padStart(2, '0')}</span>{item.title}</h3>
        <span className={`chip ${item.correct ? 'pass' : 'fail'}`}>{item.correct ? 'Correct' : 'Incorrect'}</span>
      </div>
      {item.snippet && <CodeSnippet code={item.snippet} />}
      <dl className="m-0 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="muted text-[0.8125rem]">Your answer</dt>
          <dd className={`m-0 font-mono text-[0.9375rem] ${item.correct ? '' : 'text-[var(--bad)]'}`}>{item.yourAnswer}</dd>
        </div>
        <div>
          <dt className="muted text-[0.8125rem]">Correct answer</dt>
          <dd className="m-0 font-mono text-[0.9375rem] text-[var(--good)]">{item.correctAnswer}</dd>
        </div>
      </dl>
      {item.tests && (
        <ul className="m-0 grid list-none gap-1 p-0 font-mono text-[0.8125rem]">
          {item.tests.map((t) => (
            <li key={t.name} className="flex items-center gap-2" style={{ color: t.passed ? 'var(--good)' : 'var(--bad)' }}>
              {t.passed ? <CheckIcon width={14} height={14} /> : <span aria-hidden="true">✕</span>} {t.name}
            </li>
          ))}
        </ul>
      )}
      <p className="explain">{item.explanation}</p>
    </li>
  );
}

/** Answers and explanations for every item, shown only after the exam is over. */
export function ReviewList({ items }: { items: ReviewItem[] }) {
  const [onlyMissed, setOnlyMissed] = useState(false);
  const missed = items.filter((i) => !i.correct).length;

  return (
    <section className="grid gap-8" aria-labelledby="review-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h2 id="review-title">Review your answers</h2>
          <p className="muted">{missed === 0 ? 'You got every item right.' : `${missed} of ${items.length} items need another look.`}</p>
        </div>
        {missed > 0 && (
          <button type="button" className="btn btn-sm" aria-pressed={onlyMissed} onClick={() => setOnlyMissed((v) => !v)}>
            {onlyMissed ? 'Show all items' : 'Show only incorrect'}
          </button>
        )}
      </div>
      {SECTIONS.map(({ level, title }) => {
        const rows = items.filter((i) => i.level === level && (!onlyMissed || !i.correct));
        if (rows.length === 0) return null;
        return (
          <div key={level} className="grid gap-4">
            <span className={`chip w-fit ${level}`}>{title}</span>
            <ol className="m-0 grid list-none gap-4 p-0">
              {rows.map((item, i) => <Item key={item.id} item={item} number={i + 1} />)}
            </ol>
          </div>
        );
      })}
    </section>
  );
}
