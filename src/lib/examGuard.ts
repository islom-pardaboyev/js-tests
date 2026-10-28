/**
 * Pure rules for the proctored exam mode. A web page cannot truly stop a
 * determined user (see README, "Exam mode"): these rules block the easy routes
 * and detect the rest.
 */
export const MAX_STRIKES = 3;

export type Reason = 'fullscreen-exit' | 'tab-switch' | 'devtools-open' | 'devtools-shortcut';

export const REASON_LABEL: Record<Reason | 'left-exam' | 'rule-limit', string> = {
  'fullscreen-exit': 'Left full screen',
  'tab-switch': 'Left the exam window or tab',
  'devtools-open': 'Developer tools detected',
  'devtools-shortcut': 'Tried a developer tools shortcut',
  'left-exam': 'Left or reloaded the exam page',
  'rule-limit': 'Reached the violation limit',
};

export interface KeyLike {
  key: string;
  code?: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

type KeyVerdict = 'devtools' | 'blocked' | null;

const DEVTOOLS_LETTERS = ['KeyI', 'KeyJ', 'KeyC', 'KeyK'];
const PLAIN_BLOCKED = ['F5', 'F11', 'Escape', 'PrintScreen', 'ContextMenu'];
const MOD_BLOCKED = ['KeyR', 'KeyS', 'KeyP', 'KeyO', 'KeyG'];

const codeOf = (e: KeyLike): string => {
  if (e.code) return e.code;
  return e.key.length === 1 ? `Key${e.key.toUpperCase()}` : e.key;
};

/** Classifies a keydown: a developer-tools shortcut (a strike), a silently blocked key, or allowed. */
export function classifyKey(e: KeyLike): KeyVerdict {
  const code = codeOf(e);
  const mod = e.ctrlKey || e.metaKey;
  if (code === 'F12') return 'devtools';
  if (mod && e.shiftKey && DEVTOOLS_LETTERS.includes(code)) return 'devtools';
  if (e.metaKey && e.altKey && [...DEVTOOLS_LETTERS, 'KeyU'].includes(code)) return 'devtools';
  if (e.ctrlKey && code === 'KeyU') return 'devtools';
  if (PLAIN_BLOCKED.includes(code)) return 'blocked';
  if (mod && MOD_BLOCKED.includes(code)) return 'blocked';
  if (e.altKey && (code === 'ArrowLeft' || code === 'ArrowRight')) return 'blocked';
  return null;
}

interface WindowSize {
  outerWidth: number;
  innerWidth: number;
  outerHeight: number;
  innerHeight: number;
}

/** A docked DevTools panel makes the window noticeably larger than its viewport. */
export function windowGapSuggestsDevtools(w: WindowSize, threshold = 160): boolean {
  return w.outerWidth - w.innerWidth > threshold || w.outerHeight - w.innerHeight > threshold;
}

/** Strikes left before auto-termination. */
export const strikesLeft = (strikes: number): number => Math.max(0, MAX_STRIKES - strikes);
