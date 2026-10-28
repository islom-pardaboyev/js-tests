import { useCallback, useLayoutEffect, useRef, type KeyboardEvent, type UIEvent } from 'react';
import { applyKey } from '../lib/editorPairing';

interface Options {
  value: string;
  onChange: (next: string) => void;
}

/** Keyboard behavior (Tab, auto-pair, auto-indent) and scroll sync for the editor. */
export function useCodeEditor({ value, onChange }: Options) {
  const area = useRef<HTMLTextAreaElement>(null);
  const layers = useRef<HTMLElement[]>([]);
  const pendingCaret = useRef<{ start: number; end: number } | null>(null);

  // Restore the caret right after React commits the new value, before paint.
  useLayoutEffect(() => {
    const caret = pendingCaret.current;
    if (caret && area.current) {
      area.current.setSelectionRange(caret.start, caret.end);
      pendingCaret.current = null;
    }
  }, [value]);

  const registerLayer = useCallback((el: HTMLElement | null) => {
    if (el && !layers.current.includes(el)) layers.current.push(el);
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      const el = area.current;
      if (!el || e.ctrlKey || e.metaKey || e.altKey || e.nativeEvent.isComposing) return;
      const next = applyKey({ value, start: el.selectionStart, end: el.selectionEnd }, e.key, e.shiftKey);
      if (!next) return;
      e.preventDefault();
      pendingCaret.current = { start: next.start, end: next.end };
      if (next.value === value) el.setSelectionRange(next.start, next.end);
      else onChange(next.value);
    },
    [value, onChange],
  );

  const onScroll = useCallback((e: UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    layers.current.forEach((el) => {
      el.scrollTop = scrollTop;
      el.scrollLeft = scrollLeft;
    });
  }, []);

  return { area, registerLayer, onKeyDown, onScroll };
}
