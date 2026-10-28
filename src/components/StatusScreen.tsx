import type { ReactNode } from 'react';

/** Bitmaps for the dot art: `#` is a dot, `!` is a dot in the error colour. */
const ART = {
  '404': [
    '...#...###.....#.',
    '..##..#...#...##.',
    '.#.#..#..##..#.#.',
    '#..#..#.#.#.#..#.',
    '#####.##..#.#####',
    '...#..#...#....#.',
    '...#...###.....#.',
  ],
  offline: [
    '...#######...',
    '.##.......##.',
    '#...#####...#',
    '...#.....#...',
    '.....###.....',
    '....#...#....',
    '......!......',
  ],
} as const;

const COLORS = ['var(--dot-1)', 'var(--dot-2)', 'var(--dot-3)', 'var(--dot-4)', 'var(--dot-5)'];
const GAP = 22;

function DotArt({ rows }: { rows: readonly string[] }) {
  const w = rows[0].length;
  return (
    <svg
      className="status-art"
      viewBox={`0 0 ${w * GAP} ${rows.length * GAP}`}
      aria-hidden="true"
      focusable="false"
    >
      {rows.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === '.' ? null : (
            <circle
              key={`${x}-${y}`}
              cx={x * GAP + GAP / 2}
              cy={y * GAP + GAP / 2}
              r={8}
              fill={c === '!' ? 'var(--bad)' : COLORS[(x + y) % COLORS.length]}
            />
          ),
        ),
      )}
    </svg>
  );
}

interface Props {
  art: keyof typeof ART;
  title: string;
  children: ReactNode;
  code?: string;
  actions: ReactNode;
  role?: 'alert' | 'status';
}

export function StatusScreen({ art, title, children, code, actions, role }: Props) {
  return (
    <section className="status-screen container" role={role}>
      <DotArt rows={ART[art]} />
      <h1>{title}</h1>
      <p className="muted status-copy">{children}</p>
      {code && <p className="status-code mono-note">{code}</p>}
      <div className="status-actions">{actions}</div>
    </section>
  );
}
