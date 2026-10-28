import { MAX_STRIKES } from '../lib/examGuard';

const EXAM_RULES: { title: string; text: string }[] = [
  { title: 'Full screen', text: 'The exam runs full screen. Esc is locked where the browser allows it.' },
  { title: 'Stay in the window', text: 'Switching tabs or apps, or leaving full screen, pauses the exam and counts as a strike.' },
  { title: 'No developer tools', text: 'F12 and Ctrl+Shift+I are blocked. Opening DevTools another way is detected and counts as a strike.' },
  { title: `${MAX_STRIKES} strikes end the exam`, text: 'The attempt fails with no certificate. Reloading or closing the page also fails it.' },
  { title: 'No copy, paste or second screen', text: 'Copy and paste are disabled. A second display blocks the start.' },
  { title: 'No answers until you finish', text: 'The exam never shows whether an answer is right. Correct answers appear on your results page.' },
  { title: 'Timed', text: 'The timer starts when you press Start. At zero, your answers so far are submitted.' },
];

export function ExamRules() {
  return (
    <ol className="rule-list">
      {EXAM_RULES.map((r, i) => (
        <li key={r.title}>
          <span className="n" aria-hidden="true">{i + 1}</span>
          <p><strong>{r.title}.</strong> <span className="muted">{r.text}</span></p>
        </li>
      ))}
    </ol>
  );
}
