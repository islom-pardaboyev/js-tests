import { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/motion';
import { PASSWORD_RULES, passedRules, passwordLevel } from '../../lib/validation';
import { CheckIcon } from '../Icons';

const LEVEL_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];

/** Live checklist and strength meter shown while typing a new password. */
export function PasswordRules({ password }: { password: string }) {
  const done = passedRules(password);
  const level = passwordLevel(password);
  const previous = useRef<string[]>([]);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const fresh = done.filter((id) => !previous.current.includes(id));
    previous.current = done;
    if (prefersReducedMotion() || !list.current) return;
    fresh.forEach((id) => {
      const tick = list.current?.querySelector(`[data-rule="${id}"] .tick`);
      if (tick) gsap.fromTo(tick, { scale: 0.4 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' });
    });
  }, [done.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid gap-3" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="meter flex-1" data-level={level} aria-hidden="true"><i /><i /><i /><i /></div>
        <span className="muted w-12 text-right text-[0.75rem]">{LEVEL_LABEL[level]}</span>
      </div>
      <ul className="rules" ref={list} aria-label="Password requirements">
        {PASSWORD_RULES.map((r) => {
          const ok = done.includes(r.id);
          return (
            <li key={r.id} data-rule={r.id} className={ok ? 'ok' : ''}>
              <span className="tick" aria-hidden="true">{ok && <CheckIcon width={10} height={10} />}</span>
              <span>{r.label}<span className="sr-only">{ok ? ' (met)' : ' (not met)'}</span></span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
