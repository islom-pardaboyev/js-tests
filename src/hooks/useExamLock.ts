import { useCallback, useEffect, useRef, useState } from 'react';
import { classifyKey, MAX_STRIKES, windowGapSuggestsDevtools, type Reason } from '../lib/examGuard';

type LockableKeyboard = { lock?: (keys?: string[]) => Promise<void>; unlock?: () => void };
type ScreenWithExtended = Screen & { isExtended?: boolean };

const LOCKED_KEYS = ['Escape', 'F11', 'F5', 'F12', 'KeyW', 'KeyT', 'KeyN', 'KeyR'];
const INCIDENT_WINDOW_MS = 1500;

export interface ExamLock {
  strikes: number;
  blocked: Reason | null;
  isFullscreen: boolean;
  enter: () => Promise<{ ok: true } | { ok: false; error: string }>;
  resume: () => Promise<void>;
  dismiss: () => void;
  release: () => void;
}

interface Options {
  active: boolean;
  onTerminate: (reasons: Reason[]) => void;
}

const keyboard = (): LockableKeyboard | undefined =>
  (navigator as Navigator & { keyboard?: LockableKeyboard }).keyboard;

const insideEditor = (t: EventTarget | null): boolean => t instanceof Element && t.closest('.editor') !== null;

/**
 * Full-screen exam mode: requests full screen, locks Esc where the browser
 * supports the Keyboard Lock API, blocks shortcuts, and detects tab switches,
 * leaving full screen and developer tools. Three strikes end the exam.
 * It deters and detects; it cannot be a hard guarantee in a browser.
 */
export function useExamLock({ active, onTerminate }: Options): ExamLock {
  const [strikes, setStrikes] = useState(0);
  const [blocked, setBlocked] = useState<Reason | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const strikeCount = useRef(0);
  const reasons = useRef<Reason[]>([]);
  const lastStrikeAt = useRef(0);
  const blockedRef = useRef<Reason | null>(null);
  const terminate = useRef(onTerminate);
  terminate.current = onTerminate;

  const raise = useCallback((reason: Reason) => {
    const now = Date.now();
    if (blockedRef.current || now - lastStrikeAt.current < INCIDENT_WINDOW_MS) return;
    lastStrikeAt.current = now;
    blockedRef.current = reason;
    strikeCount.current += 1;
    reasons.current.push(reason);
    setBlocked(reason);
    setStrikes(strikeCount.current);
    if (strikeCount.current >= MAX_STRIKES) terminate.current([...reasons.current]);
  }, []);

  const dismiss = useCallback(() => {
    blockedRef.current = null;
    setBlocked(null);
  }, []);

  const resume = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      await keyboard()?.lock?.(LOCKED_KEYS);
    } catch {
      /* the overlay stays until full screen is back */
    }
    if (blockedRef.current === 'fullscreen-exit' || blockedRef.current === 'tab-switch') dismiss();
  }, [dismiss]);

  const enter = useCallback(async () => {
    if (!document.documentElement.requestFullscreen) {
      return { ok: false as const, error: 'This browser cannot enter full screen. Use a desktop version of Chrome, Edge or Firefox.' };
    }
    if ((window.screen as ScreenWithExtended).isExtended) {
      return { ok: false as const, error: 'More than one display is connected. Disconnect the extra screen, then start again.' };
    }
    try {
      await document.documentElement.requestFullscreen();
      await keyboard()?.lock?.(LOCKED_KEYS).catch(() => undefined);
    } catch {
      return { ok: false as const, error: 'Full screen was blocked by the browser. Click Start again and allow it.' };
    }
    strikeCount.current = 0;
    reasons.current = [];
    blockedRef.current = null;
    setStrikes(0);
    setBlocked(null);
    return { ok: true as const };
  }, []);

  const release = useCallback(() => {
    keyboard()?.unlock?.();
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!active) return;
    const listeners: Array<[EventTarget, string, EventListener, boolean?]> = [];
    const on = (t: EventTarget, type: string, fn: EventListener, capture = false) => {
      t.addEventListener(type, fn, capture);
      listeners.push([t, type, fn, capture]);
    };
    const stop = (e: Event) => e.preventDefault();

    document.body.classList.add('exam-locked');
    setIsFullscreen(Boolean(document.fullscreenElement));
    history.pushState(null, '', window.location.href);

    on(document, 'fullscreenchange', () => {
      const full = Boolean(document.fullscreenElement);
      setIsFullscreen(full);
      if (!full) raise('fullscreen-exit');
    });
    on(document, 'visibilitychange', () => document.hidden && raise('tab-switch'));
    on(window, 'blur', () => raise('tab-switch'));
    on(window, 'focus', () => {
      if (blockedRef.current === 'tab-switch') dismiss();
    });
    on(
      window,
      'keydown',
      ((e: KeyboardEvent) => {
        const verdict = classifyKey(e);
        if (!verdict) return;
        e.preventDefault();
        e.stopPropagation();
        if (verdict === 'devtools') raise('devtools-shortcut');
      }) as EventListener,
      true,
    );
    on(window, 'keyup', ((e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') void navigator.clipboard?.writeText('').catch(() => undefined);
    }) as EventListener);
    on(document, 'contextmenu', stop);
    for (const type of ['copy', 'cut', 'dragstart', 'drop']) {
      on(document, type, ((e: Event) => !insideEditor(e.target) && e.preventDefault()) as EventListener);
    }
    on(window, 'beforeunload', ((e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    }) as EventListener);
    on(window, 'popstate', () => history.pushState(null, '', window.location.href));

    const poll = window.setInterval(() => {
      const gap = windowGapSuggestsDevtools(window);
      const t0 = performance.now();
      new Function('debugger')();
      const paused = performance.now() - t0 > 150;
      if (gap || paused) raise('devtools-open');
      else if (blockedRef.current === 'devtools-open') dismiss();
    }, 1000);

    return () => {
      window.clearInterval(poll);
      listeners.forEach(([t, type, fn, capture]) => t.removeEventListener(type, fn, capture));
      document.body.classList.remove('exam-locked');
    };
  }, [active, raise, dismiss]);

  return { strikes, blocked, isFullscreen, enter, resume, dismiss, release };
}
