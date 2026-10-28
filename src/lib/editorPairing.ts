export interface EditState {
  value: string;
  start: number;
  end: number;
}

const INDENT = '  ';
const OPEN_TO_CLOSE: Record<string, string> = { '(': ')', '[': ']', '{': '}', "'": "'", '"': '"', '`': '`' };
const CLOSERS = new Set([')', ']', '}']);
const QUOTES = new Set(["'", '"', '`']);

const isWord = (c: string | undefined): boolean => c !== undefined && /[\w$]/.test(c);

const splice = (s: EditState, from: number, to: number, text: string, caret: number): EditState => ({
  value: s.value.slice(0, from) + text + s.value.slice(to),
  start: caret,
  end: caret,
});

function lineStart(value: string, index: number): number {
  return value.lastIndexOf('\n', index - 1) + 1;
}

function indentOf(value: string, index: number): string {
  const start = lineStart(value, index);
  return /^[ \t]*/.exec(value.slice(start, index))?.[0] ?? '';
}

function shiftLines(s: EditState, outdent: boolean): EditState {
  const first = lineStart(s.value, s.start);
  const block = s.value.slice(first, s.end);
  const lines = block.split('\n');
  let delta = 0;
  let firstDelta = 0;
  const next = lines.map((line, i) => {
    let changed = line;
    if (!outdent) changed = INDENT + line;
    else if (line.startsWith(INDENT)) changed = line.slice(INDENT.length);
    else if (line.startsWith(' ')) changed = line.slice(1);
    const diff = changed.length - line.length;
    if (i === 0) firstDelta = diff;
    delta += diff;
    return changed;
  });
  return {
    value: s.value.slice(0, first) + next.join('\n') + s.value.slice(s.end),
    start: s.start === first ? first : Math.max(first, s.start + firstDelta),
    end: s.end + delta,
  };
}

/**
 * Pure keyboard behavior for the code editor. Returns the new state, or null
 * when the key should keep its browser default.
 */
export function applyKey(s: EditState, key: string, shift = false): EditState | null {
  const { value, start, end } = s;
  const before = value[start - 1];
  const after = value[end];
  const hasSelection = start !== end;

  if (key === 'Tab') {
    if (shift) return shiftLines(s, true);
    if (hasSelection && value.slice(start, end).includes('\n')) return shiftLines(s, false);
    return splice(s, start, end, INDENT, start + INDENT.length);
  }

  if (key === 'Enter') {
    const indent = indentOf(value, start);
    const between = before !== undefined && OPEN_TO_CLOSE[before] === after && CLOSERS.has(after ?? '');
    if (between) {
      const text = `\n${indent}${INDENT}\n${indent}`;
      return splice(s, start, end, text, start + 1 + indent.length + INDENT.length);
    }
    const opens = before === '{' || before === '[' || before === '(';
    const extra = opens ? INDENT : '';
    return splice(s, start, end, `\n${indent}${extra}`, start + 1 + indent.length + extra.length);
  }

  if (key === 'Backspace' && !hasSelection && before !== undefined) {
    const close = OPEN_TO_CLOSE[before];
    if (close !== undefined && close === after) return splice(s, start - 1, end + 1, '', start - 1);
    return null;
  }

  if (CLOSERS.has(key) && !hasSelection && after === key) {
    return { value, start: start + 1, end: start + 1 };
  }

  const close = OPEN_TO_CLOSE[key];
  if (close === undefined) return null;

  if (hasSelection) {
    const wrapped = key + value.slice(start, end) + close;
    return { value: value.slice(0, start) + wrapped + value.slice(end), start: start + 1, end: end + 1 };
  }
  if (QUOTES.has(key)) {
    if (after === key) return { value, start: start + 1, end: start + 1 };
    if (isWord(before)) return null;
  }
  return splice(s, start, end, key + close, start + 1);
}
