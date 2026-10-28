import type { TestCase } from '../../../data/types';
import { PlusIcon } from '../../Icons';

interface Props {
  title: string;
  help: string;
  tests: TestCase[];
  onChange: (next: TestCase[]) => void;
}

/** Editable list of sandbox tests: a name, a JS expression to call, and the expected value expression. */
export function TestCasesEditor({ title, help, tests, onChange }: Props) {
  const set = (i: number, key: keyof TestCase, value: string) =>
    onChange(tests.map((t, idx) => (idx === i ? { ...t, [key]: value } : t)));
  return (
    <fieldset className="grid gap-3 border-0 p-0">
      <legend className="font-semibold">{title}</legend>
      <p className="muted text-[0.8125rem]">{help}</p>
      {tests.map((t, i) => (
        <div key={i} className="panel grid gap-2 p-3">
          <input className="input" value={t.name} onChange={(e) => set(i, 'name', e.target.value)} placeholder="Test name" aria-label={`${title} ${i + 1} name`} />
          <input className="input input-mono" value={t.call} onChange={(e) => set(i, 'call', e.target.value)} placeholder="Call, e.g. flatten([1, [2]])" aria-label={`${title} ${i + 1} call`} />
          <div className="flex gap-2">
            <input className="input input-mono" value={t.expect} onChange={(e) => set(i, 'expect', e.target.value)} placeholder="Expected, e.g. [1, 2]" aria-label={`${title} ${i + 1} expected`} />
            <button type="button" className="btn btn-danger btn-sm" onClick={() => onChange(tests.filter((_, idx) => idx !== i))}>Remove</button>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-sm w-fit" onClick={() => onChange([...tests, { name: '', call: '', expect: '' }])}><PlusIcon /> Add test</button>
    </fieldset>
  );
}
