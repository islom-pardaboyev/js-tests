import { useCallback, useState } from 'react';
import type { ChoiceQuestion } from '../../data/types';
import { useQuizKeys } from '../../hooks/useQuizKeys';
import { CodeSnippet } from './CodeSnippet';
import { ProgressBar } from './ProgressBar';

const LABELS = ['A', 'B', 'C', 'D'];

interface Props {
  questions: ChoiceQuestion[];
  onAnswer: (index: number, choice: number) => void;
  onComplete: () => void;
}

/**
 * Easy level: pick A, B, C or D. The exam never says whether a choice is
 * right; answers and explanations appear on the results screen afterwards.
 */
export function QuizSection({ questions, onAnswer, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const q = questions[index];
  const last = index === questions.length - 1;

  const pick = useCallback(
    (i: number) => {
      setPicked(i);
      onAnswer(index, i);
    },
    [index, onAnswer],
  );

  const next = useCallback(() => {
    if (last) return onComplete();
    setPicked(null);
    setIndex((i) => i + 1);
  }, [last, onComplete]);

  useQuizKeys({ hasAnswer: picked !== null, onPick: pick, onNext: next });

  return (
    <section className="exam-narrow grid gap-6" aria-labelledby="q-title">
      <div className="flex items-center justify-between gap-4">
        <p className="meta">Question {String(index + 1).padStart(2, '0')} / {questions.length}</p>
        <span className="chip easy">Easy</span>
      </div>
      <ProgressBar value={index} max={questions.length} label="Easy section progress" />

      <div className="q-body grid gap-5" key={index}>
        <h2 id="q-title" className="rise !text-[1.5rem]">{q.prompt}</h2>
        <div className="rise" style={{ '--i': 1 } as React.CSSProperties}><CodeSnippet code={q.snippet} /></div>
        <div className="options" role="radiogroup" aria-label="Answer options">
          {q.options.map((opt, i) => (
            <button
              key={opt + i}
              type="button"
              role="radio"
              aria-checked={picked === i}
              className={`option rise ${picked === i ? 'selected' : ''}`}
              style={{ '--i': i + 2 } as React.CSSProperties}
              onClick={() => pick(i)}
            >
              <span>{opt}</span>
              <span className="kbd" aria-hidden="true">{LABELS[i]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="muted flex flex-wrap items-center gap-2 text-[0.8125rem]">
          <span className="kbd">A</span><span className="kbd">B</span><span className="kbd">C</span><span className="kbd">D</span> to choose <span className="kbd">Enter</span> for next
        </p>
        <button type="button" className="btn btn-primary" disabled={picked === null} onClick={next}>
          {last ? 'Finish easy section' : 'Next question'}
        </button>
      </div>
    </section>
  );
}
