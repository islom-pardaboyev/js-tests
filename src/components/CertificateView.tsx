import { testTitle } from '../data/tests';
import { verifyUrl } from '../lib/certificate';
import type { Certificate } from '../lib/db';
import { formatDate, formatPoints } from '../lib/format';
import { PASS_THRESHOLD } from '../lib/grading';
import { CheckIcon } from './Icons';
import { Logo, LogoMark } from './Logo';
import { QrCode } from './QrCode';

const LEVELS = [
  { key: 'easy', name: 'Easy', about: 'choose the answer', glyph: 'A' },
  { key: 'medium', name: 'Medium', about: 'type the output', glyph: '".."' },
  { key: 'hard', name: 'Hard', about: 'write the function', glyph: 'fn' },
] as const;

const DOT_COLORS = ['#17a58a', '#2d5bff', '#c27a10', '#7a5cff', '#12a0c8'];

/** The band of dots grown from the certificate ID. The same ID always grows the same band. */
function DotBand({ seed }: { seed: string }) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let s = h >>> 0;
  const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const dots = [];
  for (let i = 0; i < 52; i++) {
    for (let j = 0; j < 4; j++) {
      const a = rnd();
      const b = rnd();
      dots.push(<circle key={`${i}-${j}`} cx={10 + i * 20} cy={14 + j * 18} r={1.5 + a * 6} fill={DOT_COLORS[Math.floor(b * 5)]} opacity={0.4 + a * 0.6} />);
    }
  }
  return (
    <svg className="cert-band" viewBox="0 0 1040 82" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Pattern grown from this certificate's ID">
      {dots}
    </svg>
  );
}

/**
 * The certificate as a path: three levels from easy to hard, filled as far as
 * the score reaches, ending in the certified mark. Below it the stored record
 * as JSON and a verification run that checks it. Everything shown is read from
 * the stored record; the QR code opens that same record.
 */
export function CertificateView({ cert, sample = false }: { cert: Certificate; sample?: boolean }) {
  const url = verifyUrl(cert.id);
  const pct = Math.max(0, Math.min(100, cert.score));
  const nodes = cert.breakdown ? LEVELS.filter((l) => cert.breakdown![l.key].total > 0) : [];
  return (
    <article className="cert" aria-labelledby="cert-name">
      <DotBand seed={cert.id} />

      <header className="cert-head">
        <Logo to={null} />
        <p className={sample ? 'chip' : 'verified'}>{sample ? 'Sample, not a real record' : (<><CheckIcon /> Verified credential</>)}</p>
      </header>

      <div className="cert-hero">
        <div>
          <h1 id="cert-name" className="cert-name">{cert.displayName}</h1>
          <p className="muted">Passed <span className="text-[var(--text)]">{testTitle(cert.testId)}</span> above the {PASS_THRESHOLD * 100}% pass mark. Issued {formatDate(cert.createdAt)}.</p>
        </div>
        <p className="cert-score" aria-label={`Score ${cert.score} percent, pass mark ${PASS_THRESHOLD * 100} percent`}>
          {pct}%<small>pass mark {PASS_THRESHOLD * 100}%</small>
        </p>
      </div>

      {nodes.length > 0 && (
        <ol className="cert-path" aria-label="Score by level" style={{ '--n': nodes.length + 1, '--p': `${pct}%` } as React.CSSProperties}>
          {nodes.map((l) => {
            const { correct, total } = cert.breakdown![l.key];
            return (
              <li key={l.key} className={`node ${l.key}`}>
                <span className="dot" aria-hidden="true">{l.glyph}</span>
                <b>{l.name}</b>
                <code>{l.about}</code>
                <span className="sc">{formatPoints(correct)} / {total}</span>
              </li>
            );
          })}
          <li className="node final">
            <span className="dot" aria-hidden="true"><LogoMark size={44} /></span>
            <b>Certified</b>
            <code>{cert.id}</code>
          </li>
        </ol>
      )}

      <footer className="cert-verify">
        <QrCode value={url} size={88} label={`QR code linking to ${url}`} />
        <div className="grid min-w-0 gap-1">
          <p className="font-semibold">Verify this certificate</p>
          <p className="muted text-[0.8125rem]">Scan the code or open the link. The details above must match the stored record.</p>
          <p className="cert-url">{url}</p>
        </div>
      </footer>
    </article>
  );
}
