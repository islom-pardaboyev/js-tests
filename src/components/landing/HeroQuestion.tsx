import { useState } from 'react';
import { heroQuestions } from '../../data/heroQuestions';
import { CodeSnippet } from '../test/CodeSnippet';

const LABELS = ['A', 'B', 'C', 'D'];
const pool = heroQuestions;

/** A shuffled order, so every visit opens on a different question. */
const shuffled = (): number[] => {
  const order = pool.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
};

/**
 * The product's defining control, working: a real easy question from the bank.
 * The exam itself never shows correctness; this preview does, so a visitor can
 * feel the format before signing in.
 */
export function HeroQuestion() {
  const [order] = useState(shuffled);
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const [seen, setSeen] = useState(0);

  const q = pool[order[at % order.length]];
  const answered = picked !== null;

  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
    setSeen((n) => n + 1);
    if (i === q.correct) setRight((n) => n + 1);
  };
  const next = () => { setPicked(null); setAt((n) => n + 1); };

  return (
    <div className="hq" data-ui>
      <div className="hq-bar">
        <span className="chip easy">Easy</span>
        <span className="hq-count" aria-live="polite">{seen === 0 ? 'Try one' : `${right} of ${seen} right`}</span>
      </div>
      <p className="hq-prompt">{q.prompt}</p>
      <CodeSnippet code={q.snippet} />
      <div className="hq-options" role="group" aria-label="Answers">
        {q.options.map((o, i) => {
          const state = !answered ? '' : i === q.correct ? 'right' : i === picked ? 'wrong' : 'rest';
          return (
            <button key={o} type="button" className={`hq-option ${state}`} onClick={() => choose(i)} disabled={answered && state === 'rest'}>
              <span className="hq-key" aria-hidden="true">{LABELS[i]}</span>
              <code>{o}</code>
            </button>
          );
        })}
      </div>
      <div className="hq-foot" aria-live="polite">
        {answered ? (
          <>
            <p><strong>{picked === q.correct ? 'Correct.' : 'Not quite.'}</strong> {q.explanation}</p>
            <button type="button" className="btn btn-sm" onClick={next}>Next question</button>
          </>
        ) : (
          <p className="muted">Pick what this prints.</p>
        )}
      </div>
    </div>
  );
}
