import { describe, expect, it } from 'vitest';
import { applyKey, type EditState } from './editorPairing';

/** `|` marks the caret; `[` `]` mark a selection. */
function parse(src: string): EditState {
  const start = src.indexOf('|') >= 0 ? src.indexOf('|') : src.indexOf('[');
  if (src.includes('|')) return { value: src.replace('|', ''), start, end: start };
  const end = src.indexOf(']') - 1;
  return { value: src.replace('[', '').replace(']', ''), start, end };
}
function show(s: EditState | null): string | null {
  if (!s) return null;
  return s.start === s.end
    ? s.value.slice(0, s.start) + '|' + s.value.slice(s.end)
    : s.value.slice(0, s.start) + '[' + s.value.slice(s.start, s.end) + ']' + s.value.slice(s.end);
}
const press = (src: string, key: string, shift = false) => show(applyKey(parse(src), key, shift));

describe('auto-closing pairs', () => {
  it.each([
    ['(', '(|)'],
    ['[', '[|]'],
    ['{', '{|}'],
    ['"', '"|"'],
    ["'", "'|'"],
    ['`', '`|`'],
  ])('typing %s inserts a pair', (key, expected) => {
    expect(press('|', key)).toBe(expected);
  });

  it('skips over an existing closer', () => {
    expect(press('f(|)', ')')).toBe('f()|');
    expect(press('a[1|]', ']')).toBe('a[1]|');
    expect(press('"hi|"', '"')).toBe('"hi"|');
  });

  it('does not auto-close a quote right after a word character', () => {
    expect(press("don|", "'")).toBeNull();
  });

  it('wraps a selection instead of replacing it', () => {
    expect(press('x = [abc]', '(')).toBe('x = ([abc])');
    expect(press('[abc]', '"')).toBe('"[abc]"');
  });

  it('leaves ordinary characters to the browser', () => {
    expect(press('|', 'a')).toBeNull();
    expect(press('a|', ')')).toBeNull();
  });
});

describe('Backspace', () => {
  it('removes an empty pair together', () => {
    expect(press('f(|)', 'Backspace')).toBe('f|');
    expect(press('"|"', 'Backspace')).toBe('|');
  });
  it('uses the default behavior otherwise', () => {
    expect(press('f(a|)', 'Backspace')).toBeNull();
    expect(press('|', 'Backspace')).toBeNull();
  });
});

describe('Tab', () => {
  it('inserts two spaces at the caret', () => {
    expect(press('a|b', 'Tab')).toBe('a  |b');
  });
  it('indents every selected line', () => {
    expect(press('[a\nb]', 'Tab')).toBe('[  a\n  b]');
  });
  it('outdents with Shift+Tab', () => {
    expect(press('[  a\n  b]', 'Tab', true)).toBe('[a\nb]');
  });
  it('outdents a single caret line', () => {
    expect(press('  a|', 'Tab', true)).toBe('a|');
  });
});

describe('Enter', () => {
  it('keeps the current indentation', () => {
    expect(press('  a|', 'Enter')).toBe('  a\n  |');
  });
  it('indents after an opening bracket', () => {
    expect(press('if (x) {|', 'Enter')).toBe('if (x) {\n  |');
  });
  it('expands an empty pair onto three lines', () => {
    expect(press('f() {|}', 'Enter')).toBe('f() {\n  |\n}');
    expect(press('  g() {|}', 'Enter')).toBe('  g() {\n    |\n  }');
  });
});
