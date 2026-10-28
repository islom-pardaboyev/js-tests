import { useState } from 'react';
import type { CodingTask } from '../../data/types';
import { useSandbox } from '../../hooks/useSandbox';
import type { SandboxResult } from '../../lib/sandbox/types';
import { PlayIcon } from '../Icons';
import { CodeEditor } from './CodeEditor';
import { OutputPanel } from './OutputPanel';
import { TaskPanel } from './TaskPanel';

interface Props {
  tasks: CodingTask[];
  codes: Record<string, string>;
  onCode: (taskId: string, code: string) => void;
  onFinish: () => void;
}

/** Hard level: write each function in the live editor; visible tests on Run, hidden tests on Submit. */
export function CodingSection({ tasks, codes, onCode, onFinish }: Props) {
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<Record<string, SandboxResult>>({});
  const sandbox = useSandbox();
  const task = tasks[active];

  const run = async () => {
    const res = await sandbox.run(codes[task.id], task.fnName, task.visibleTests);
    setResults((prev) => ({ ...prev, [task.id]: res }));
  };

  const reset = () => {
    onCode(task.id, task.starter);
    setResults(({ [task.id]: _drop, ...rest }) => rest);
    sandbox.reset();
  };

  const select = (i: number) => {
    setActive(i);
    sandbox.reset();
  };

  const shown = sandbox.running || sandbox.result ? sandbox.result : (results[task.id] ?? null);

  return (
    <section className="grid gap-4" aria-label="Coding tasks">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="!text-[1.5rem]">Hard: write the function</h2>
        <span className="chip hard">Task {active + 1} of {tasks.length}</span>
      </div>
      {tasks.length > 1 && (
        <div className="task-tabs" role="tablist" aria-label="Tasks">
          {tasks.map((t, i) => (
            <button key={t.id} type="button" role="tab" aria-selected={i === active} className={`btn btn-sm ${i === active ? 'btn-primary' : ''}`} onClick={() => select(i)}>
              {i + 1}. {t.title}
            </button>
          ))}
        </div>
      )}

      <div className="split">
        <TaskPanel task={task} result={shown} />
        <div className="grid content-start gap-3">
          <CodeEditor value={codes[task.id]} onChange={(next) => onCode(task.id, next)} blockPaste />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn" onClick={() => void run()} disabled={sandbox.running} aria-busy={sandbox.running}>
              <PlayIcon /> Run
            </button>
            <button type="button" className="btn btn-ghost" onClick={reset} disabled={sandbox.running}>Reset code</button>
            <button type="button" className="btn btn-primary ml-auto" onClick={onFinish} disabled={sandbox.running}>Submit exam</button>
          </div>
          <OutputPanel result={shown} running={sandbox.running} />
        </div>
      </div>
    </section>
  );
}
