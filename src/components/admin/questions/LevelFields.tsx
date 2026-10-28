import type { Draft } from '../../../lib/questionDraft';
import { TestCasesEditor } from './TestCasesEditor';

interface Props {
  draft: Draft;
  set: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
}

function Text({ label, value, onChange, mono = false, rows = 0, hint }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean; rows?: number; hint?: string }) {
  const cls = `input ${mono ? 'input-mono' : ''}`;
  return (
    <label className="field">
      <span className="text-[0.8125rem] font-semibold text-[var(--muted)]">{label}</span>
      {rows ? <textarea className={`${cls} py-2`} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} /> : <input className={cls} value={value} onChange={(e) => onChange(e.target.value)} />}
      {hint && <span className="muted text-[0.75rem]">{hint}</span>}
    </label>
  );
}

export function LevelFields({ draft: d, set }: Props) {
  if (d.level === 'hard') {
    return (
      <>
        <Text label="Title" value={d.title} onChange={(v) => set('title', v)} />
        <Text label="Function name" value={d.fnName} onChange={(v) => set('fnName', v)} mono hint="The tests call this name, e.g. debounce." />
        <Text label="Description" value={d.description} onChange={(v) => set('description', v)} rows={3} />
        <Text label="Requirements" value={d.requirements} onChange={(v) => set('requirements', v)} rows={4} hint="One per line. Optionally add | 0,1 to tick it when those visible tests pass." />
        <Text label="Starter code" value={d.starter} onChange={(v) => set('starter', v)} mono rows={6} />
        <TestCasesEditor title="Visible tests" help="Shown to the user and run on Run. Call and expected are JavaScript expressions; sleep(ms) is available for async checks." tests={d.visible} onChange={(v) => set('visible', v)} />
        <TestCasesEditor title="Hidden tests" help="Run only on submit and used for grading." tests={d.hidden} onChange={(v) => set('hidden', v)} />
      </>
    );
  }
  return (
    <>
      <Text label="Question" value={d.prompt} onChange={(v) => set('prompt', v)} />
      <Text label="Code snippet" value={d.snippet} onChange={(v) => set('snippet', v)} mono rows={5} />
      {d.level === 'easy' ? (
        <fieldset className="grid gap-2 border-0 p-0">
          <legend className="font-semibold">Options (select the correct one)</legend>
          {d.options.map((o, i) => (
            <div key={i} className="flex items-center gap-3">
              <input type="radio" name="correct" className="h-4 w-4 accent-[var(--accent)]" checked={d.correct === i} onChange={() => set('correct', i as 0 | 1 | 2 | 3)} aria-label={`Option ${'ABCD'[i]} is correct`} />
              <input className="input input-mono" value={o} onChange={(e) => set('options', d.options.map((x, idx) => (idx === i ? e.target.value : x)) as Draft['options'])} placeholder={`Option ${'ABCD'[i]}`} aria-label={`Option ${'ABCD'[i]}`} />
            </div>
          ))}
        </fieldset>
      ) : (
        <>
          <Text label="Accepted answers" value={d.accept} onChange={(v) => set('accept', v)} mono rows={3} hint="One per line. Spaces and quotes are ignored when checking." />
          <Text label="Hint shown to the user" value={d.hint} onChange={(v) => set('hint', v)} />
        </>
      )}
      <Text label="Explanation" value={d.explanation} onChange={(v) => set('explanation', v)} rows={3} />
    </>
  );
}
