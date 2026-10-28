import type { CodingTask } from '../../data/types';
import type { SandboxResult } from '../../lib/sandbox/types';
import { CheckIcon } from '../Icons';

interface Props {
  task: CodingTask;
  result: SandboxResult | null;
}

/** Task description plus a requirements checklist driven by the visible-test results. */
export function TaskPanel({ task, result }: Props) {
  const isDone = (visible: number[]): boolean =>
    visible.length > 0 &&
    visible.every((i) => result?.tests.find((t) => t.index === i)?.passed === true);

  return (
    <div className="panel grid content-start gap-5 p-5">
      <div className="grid gap-2">
        <h2>{task.title}</h2>
        <p className="muted max-w-[62ch]">{task.description}</p>
      </div>
      <div className="grid gap-3">
        <h3>Requirements</h3>
        <ul className="req-list">
          {task.requirements.map((r) => {
            const done = isDone(r.visible);
            return (
              <li key={r.text} className={done ? 'done' : 'pending'}>
                <span className="req-mark" aria-hidden="true">{done && <CheckIcon width={12} height={12} />}</span>
                <span>
                  {r.text}
                  <span className="sr-only">{done ? ' (done)' : ' (not done yet)'}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="muted text-[0.8125rem]">
          Visible tests run when you press Run. Hidden tests run only when you submit.
        </p>
      </div>
    </div>
  );
}
