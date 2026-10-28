/**
 * Medium answers are compared as text. These rules are applied to both the
 * expected and the typed answer, in this order:
 *
 *  1. Line endings: "\r\n" and "\r" become "\n" (Windows and old Mac pastes).
 *  2. Whitespace: every space, tab and newline is removed, so "[1, 2]" equals
 *     "[1,2]" and a multi-line console output compares as one string.
 *  3. Quotes: ' " and ` are removed, so a printed string "a" matches a.
 *  4. Case: folded to lower case.
 *
 * Arrays and objects are compared as the text they print, so key order matters:
 * {a:1,b:2} and {b:2,a:1} differ. The question author lists every accepted
 * ordering in `accept`. A blank answer is never correct.
 */
export function normalizeAnswer(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/[\s'"`]+/g, '')
    .toLowerCase();
}

export function isTypedCorrect(accept: string[], input: string): boolean {
  const given = normalizeAnswer(input);
  return given.length > 0 && accept.some((a) => normalizeAnswer(a) === given);
}
