import { Link } from 'react-router-dom';
import { VerifyBox } from '../components/VerifyBox';
import { usePageMeta } from '../lib/seo';

const STEPS = [
  ['Get the ID or QR code', 'Each certificate shows an ID, a link and a QR code for the same record.'],
  ['Look up the record', 'The ID is checked against the JSTests database, not read from the document.'],
  ['Compare the details', 'Name, test, score and date must match the certificate you were given.'],
];

export default function VerifyPage() {
  usePageMeta({
    title: 'Verify a certificate',
    description: 'Check a JSTests certificate. Enter its ID or scan its QR code to see the name, test, score and date.',
    path: '/verify',
  });
  return (
    <div className="container grid max-w-[820px] gap-10 py-14">
      <section className="grid gap-4">
        <h1>Verify a certificate</h1>
        <p className="muted max-w-[58ch] text-[1.0625rem]">Confirm a JSTests certificate in seconds. No account needed.</p>
        <div className="panel p-5"><VerifyBox /></div>
        <p className="muted text-[0.875rem]"><Link to="/certificate/sample">Open the sample certificate</Link> to see what one looks like.</p>
      </section>
      <section className="grid gap-5">
        <h2>How verification works</h2>
        <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-3">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="grid content-start gap-2 border-t border-[var(--line-strong)] pt-4">
              <span className="display text-[1.75rem] text-[var(--accent-text)]">{i + 1}</span>
              <h3>{title}</h3>
              <p className="muted text-[0.9375rem]">{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
