// Mockup helpers: dot skin and a placeholder QR, drawn from the sample ID.
const ID = 'JST-ABCD-EFGH-2345';
const COLORS = ['#17a58a', '#2d5bff', '#c27a10', '#7a5cff', '#12a0c8'];
function rng(seed) { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619); let s = h >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }
function skin(el, n = 12, dark = true) {
  const r = rng(ID); const S = 200; const step = S / n; let out = `<svg viewBox="0 0 ${S} ${S}" width="100%" height="100%">`;
  if (dark) out += `<rect width="${S}" height="${S}" rx="14" fill="#14161a"/>`;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const a = r(), b = r(); out += `<circle cx="${step / 2 + i * step}" cy="${step / 2 + j * step}" r="${1.2 + a * step * 0.38}" fill="${COLORS[Math.floor(b * 5)]}" opacity="${0.35 + a * 0.65}"/>`; }
  el.innerHTML = out + '</svg>';
}
function qr(el, dark = '#14161a') {
  const r = rng('qr' + ID); const n = 25; let out = `<svg viewBox="0 0 ${n} ${n}" width="100%" height="100%" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/>`;
  const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="${dark}"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="${dark}"/>`;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const inF = (i < 8 && j < 8) || (i > n - 9 && j < 8) || (i < 8 && j > n - 9); if (!inF && r() > 0.5) out += `<rect x="${i}" y="${j}" width="1" height="1" fill="${dark}"/>`; }
  el.innerHTML = out + finder(0, 0) + finder(n - 7, 0) + finder(0, n - 7) + '</svg>';
}
const MARK = `<svg viewBox="-50 -50 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M-9 -20Q-17 -20 -17 -12V-5Q-17 0 -23 0Q-17 0 -17 5V12Q-17 20 -9 20M9 -20Q17 -20 17 -12V-5Q17 0 23 0Q17 0 17 5V12Q17 20 9 20" stroke="currentColor" stroke-width="5"/><path d="M-7 1.5L-1.5 7.5L8 -6" stroke="#2d5bff" stroke-width="6"/></svg>`;
