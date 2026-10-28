import { useState } from 'react';
import { PICKS_PER_LEVEL } from '../../data/tests';
import { CodeSnippet } from '../test/CodeSnippet';

const TOTAL = PICKS_PER_LEVEL.easy + PICKS_PER_LEVEL.medium + PICKS_PER_LEVEL.hard;

const STAGES = [
  { name: 'Pick a test', clause: 'First, pick a track.' },
  { name: 'Predict', clause: 'Then predict the output.' },
  { name: 'Write', clause: 'Then write the function.' },
  { name: 'Certify', clause: 'Pass and keep the proof.' },
];

const CODE = `function flatten(arr) {
  return arr.flat(Infinity);
}`;

function Fragment({ stage }: { stage: number }) {
  if (stage === 0) {
    return (
      <ul className="st-list">
        {['JavaScript Assessment', 'Coercion & Equality', 'Closures & Scope', 'Async & the Event Loop'].map((t, i) => (
          <li key={t} className={i === 0 ? 'on' : ''}><span>{t}</span><small>{i === 0 ? `${TOTAL} items` : 'Track'}</small></li>
        ))}
      </ul>
    );
  }
  if (stage === 1) {
    return (
      <div className="st-card">
        <p className="st-q">What does this print?</p>
        <CodeSnippet code={'console.log(typeof null);'} />
        <div className="st-opts">
          {['"null"', '"object"', '"undefined"', '"number"'].map((o, i) => (
            <span key={o} className={i === 1 ? 'on' : ''}><b>{'ABCD'[i]}</b><code>{o}</code></span>
          ))}
        </div>
      </div>
    );
  }
  if (stage === 2) {
    return (
      <div className="st-card">
        <CodeSnippet code={CODE} />
        <ul className="st-tests">
          {['flatten([1, [2, [3]]]) is [1, 2, 3]', 'flatten([]) is []', 'flatten([[[]]]) is []'].map((t) => (
            <li key={t}><i aria-hidden="true" /><code>{t}</code></li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="st-cert">
      <p className="st-score">83<small>%</small></p>
      <p>Passed at 70%</p>
      <code>JST-ABCD-EFGH-2345</code>
      <small>Sample record</small>
    </div>
  );
}

/** One slider drives the clause and the product fragment beside it. */
export function Stages() {
  const [stage, setStage] = useState(0);
  return (
    <section className="stages" aria-labelledby="stages-title" data-ui-group>
      <h2 id="stages-title" className="sr-only">How a test goes</h2>
      <div className="stages-field stages-copy">
        <p key={stage} className="stages-clause" aria-live="polite">{STAGES[stage].clause}</p>
      </div>
      <div className="stages-field stages-demo" data-ui>
        <div key={stage} className="stages-frag"><Fragment stage={stage} /></div>
      </div>
      <div className="stages-control">
        <input
          type="range" min={0} max={3} step={1} value={stage}
          onChange={(e) => setStage(Number(e.target.value))}
          aria-label="Stage of a test" aria-valuetext={STAGES[stage].name}
          style={{ '--p': `${(stage / 3) * 100}%` } as React.CSSProperties}
        />
        <ol className="stages-names">
          {STAGES.map((s, i) => (
            <li key={s.name}><button type="button" aria-current={i === stage} onClick={() => setStage(i)}>{s.name}</button></li>
          ))}
        </ol>
      </div>
    </section>
  );
}
