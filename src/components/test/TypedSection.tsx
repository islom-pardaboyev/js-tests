import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { TypedQuestion } from '../../data/types';
import { CodeSnippet } from './CodeSnippet';
import { ProgressBar } from './ProgressBar';

interface Props {
  questions: TypedQuestion[];
  onType: (index: number, text: string) => void;
  onComplete: () => void;
}

/**
 * Medium level: type the exact console output. Nothing is checked or revealed
 * here; the results screen shows the right answers after the exam.
 */
export function TypedSection({ questions, onType, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const q = questions[index];
  const last = index === questions.length - 1;

  useEffect(() => {
    input.current?.focus();
  }, [index]);

  const change = (value: string) => {
    setText(value);
    onType(index, value);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (last) return onComplete();
    setText('');
    setIndex((i) => i + 1);
  };

  const label = text.trim() === '' ? (last ? 'Skip and finish' : 'Skip') : last ? 'Finish medium section' : 'Next question';

  return (
    <section className="exam-narrow grid gap-6" aria-labelledby="q-title">
      <div className="flex items-center justify-between gap-4">
        <p className="meta">Question {String(index + 1).padStart(2, '0')} / {questions.length}</p>
        <span className="chip medium">Medium</span>
      </div>
      <ProgressBar value={index} max={questions.length} label="Medium section progress" />

      <form onSubmit={submit} className="grid gap-6" noValidate>
        <div className="q-body grid gap-5" key={index}>
          <h2 id="q-title" className="rise !text-[1.5rem]">{q.prompt}</h2>
          <div className="rise" style={{ '--i': 1 } as React.CSSProperties}><CodeSnippet code={q.snippet} /></div>
          <div className="field rise" style={{ '--i': 2 } as React.CSSProperties}>
            <label htmlFor="typed-answer">Your answer. {q.hint}</label>
            <input
              id="typed-answer"
              ref={input}
              className="input input-mono"
              value={text}
              onChange={(e) => change(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="Type what the console prints"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="muted flex flex-wrap items-center gap-2 text-[0.8125rem]">Spaces and quotes do not matter. <span className="kbd">Enter</span> for next</p>
          <button type="submit" className="btn btn-primary">{label}</button>
        </div>
      </form>
    </section>
  );
}
