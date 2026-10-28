import { useMemo, useState, type KeyboardEvent } from 'react';

interface Command { name: string; key: string; text: string }

const COMMANDS: Command[] = [
  { name: 'Predict the output', key: 'P', text: 'Easy items: choose what a short snippet prints, A to D.' },
  { name: 'Type the exact output', key: 'T', text: 'Medium items: type what the console prints. Coercion, closures, the event loop.' },
  { name: 'Write the function', key: 'W', text: 'Hard items: a live editor, visible tests to guide you, hidden tests to grade you.' },
  { name: 'Run it in a sandbox', key: 'R', text: 'Your code runs in an isolated frame with a 3 second limit.' },
  { name: 'Take it as an exam', key: 'E', text: 'Full screen, timed, strikes for leaving. The page says what a browser cannot enforce.' },
  { name: 'Pick a track', key: 'K', text: 'Basics, coercion, closures, async, arrays, functions or coding challenges.' },
  { name: 'Get a certificate', key: 'C', text: 'Pass at 70% for a certificate with a link and a QR code.' },
  { name: 'Verify by ID', key: 'V', text: 'Anyone can check a certificate, signed in or not.' },
];

/** The product's own command menu, scaled up until it is the section. */
export function CommandList() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rows = useMemo(() => COMMANDS.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())), [query]);
  const sel = Math.min(active, Math.max(rows.length - 1, 0));

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((sel + 1) % Math.max(rows.length, 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((sel - 1 + rows.length) % Math.max(rows.length, 1)); }
  };

  return (
    <section className="container cmd-section" aria-labelledby="cmd-title" data-ui>
      <label className="cmd-search">
        <span id="cmd-title" className="sr-only">What you can do</span>
        <input
          type="search"
          value={query}
          autoComplete="off"
          spellCheck={false}
          placeholder="Find what JSTests does"
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
          onKeyDown={onKey}
          aria-controls="cmd-rows"
        />
      </label>
      <ul id="cmd-rows" className="cmd-rows" onKeyDown={onKey}>
        {rows.map((c, i) => (
          <li key={c.name}>
            <button type="button" className="cmd-row" aria-current={i === sel} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)}>
              <span className="cmd-name">{c.name}</span>
              <kbd className="cmd-key" aria-hidden="true">{c.key}</kbd>
              {i === sel && <span className="cmd-text">{c.text}</span>}
            </button>
          </li>
        ))}
        {rows.length === 0 && <li className="cmd-empty">Nothing matches &ldquo;{query}&rdquo;.</li>}
      </ul>
    </section>
  );
}
