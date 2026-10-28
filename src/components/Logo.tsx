import { Link } from 'react-router-dom';

const CHEVRON = 'M-24 -20L-3 0L-24 20';

/** The JSTests mark: a terminal prompt with a cursor, and dots that rise beside it. Also exported as public/logo.svg. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="-50 -50 100 100" fill="none" aria-hidden="true">
      <rect x="-47" y="-47" width="94" height="94" rx="26" className="lm-tile" />
      <path d={CHEVRON} className="lm-brace" />
      <rect x="6" y="12" width="26" height="9" rx="4.5" className="lm-d2" />
      <circle cx="14" cy="-14" r="3" className="lm-d3" />
      <circle cx="26" cy="-14" r="4.5" className="lm-d1" />
    </svg>
  );
}

export function Logo({ to = '/' }: { to?: string | null }) {
  const body = (
    <>
      <LogoMark />
      <span className="logo-word">JS<span>Tests</span></span>
    </>
  );
  return to ? (
    <Link to={to} className="logo" aria-label="JSTests home">{body}</Link>
  ) : (
    <span className="logo">{body}</span>
  );
}
