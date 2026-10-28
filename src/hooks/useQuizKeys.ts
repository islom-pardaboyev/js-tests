import { useEffect } from 'react';

const KEYS: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };

interface Options {
  hasAnswer: boolean;
  onPick: (index: number) => void;
  onNext: () => void;
}

/** A–D or 1–4 choose (and can be changed); Enter or → moves on once something is chosen. */
export function useQuizKeys({ hasAnswer, onPick, onNext }: Options) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === 'Enter' || e.key === 'ArrowRight') {
        if (hasAnswer) {
          e.preventDefault();
          onNext();
        }
        return;
      }
      const index = KEYS[e.key.toLowerCase()];
      if (index !== undefined) onPick(index);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasAnswer, onPick, onNext]);
}
