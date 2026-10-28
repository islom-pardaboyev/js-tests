import { useEffect, useRef, useState } from 'react';

/** "MM:SS" or "H:MM:SS". */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${String(m).padStart(2, '0')}:${sec}`;
}

/**
 * Seconds left until `endAt` (epoch ms). Computed from the wall clock on every
 * tick, so a throttled background tab cannot slow it down. `onExpire` fires once.
 */
export function useCountdown(endAt: number | null, onExpire: () => void): number {
  const [left, setLeft] = useState(() => (endAt ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000)) : 0));
  const expire = useRef(onExpire);
  expire.current = onExpire;

  useEffect(() => {
    if (!endAt) return;
    let fired = false;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0 && !fired) {
        fired = true;
        expire.current();
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [endAt]);

  return left;
}
