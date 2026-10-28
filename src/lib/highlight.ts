const KEYWORDS =
  'async|await|break|case|catch|class|const|continue|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|of|return|static|super|switch|this|throw|try|typeof|var|void|while|yield';
const LITERALS = 'true|false|null|undefined|NaN|Infinity';

const TOKEN = new RegExp(
  [
    '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)', // 1 comment
    '("(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'|`(?:\\\\.|[^`\\\\])*`)', // 2 string
    '(\\b\\d+(?:\\.\\d+)?\\b)', // 3 number
    `(\\b(?:${LITERALS})\\b)`, // 4 literal
    `(\\b(?:${KEYWORDS})\\b)`, // 5 keyword
    '(\\b[A-Za-z_$][\\w$]*(?=\\())', // 6 call
  ].join('|'),
  'g',
);

const CLASSES = ['', 'tok-com', 'tok-str', 'tok-num', 'tok-lit', 'tok-kw', 'tok-fn'];

const escape = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Returns HTML-escaped code wrapped in token spans. Safe for innerHTML. */
export function highlight(code: string): string {
  let html = '';
  let last = 0;
  for (const m of code.matchAll(TOKEN)) {
    const index = m.index ?? 0;
    html += escape(code.slice(last, index));
    const group = m.findIndex((g, i) => i > 0 && g !== undefined);
    html += `<span class="${CLASSES[group]}">${escape(m[0])}</span>`;
    last = index + m[0].length;
  }
  return html + escape(code.slice(last));
}
