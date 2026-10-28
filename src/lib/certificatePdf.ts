import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { testTitle } from '../data/tests';
import { verifyUrl } from './certificate';
import type { Certificate } from './db';
import { formatDate, formatPoints } from './format';
import { PASS_THRESHOLD } from './grading';

/*
 * Builds the certificate as an A4 landscape PDF that is a scaled copy of the web
 * certificate: the same card, fonts, colours and positions. Positions below are
 * the web card's pixel measurements (card width 820); S turns them into mm.
 *
 * The web fonts (Bricolage Grotesque, JetBrains Mono) are embedded from
 * /fonts, loaded only when a PDF is made. If they cannot load, the built-in
 * Helvetica and Courier are used with the same layout.
 */

type Doc = InstanceType<typeof jsPDF>;
type RGB = [number, number, number];

const S = 0.31; // mm per card pixel
const PT = 72 / 25.4;
const CARD_W = 820;
const PAGE_W = 297;
const PAGE_H = 210;

const PAGE: RGB = [250, 249, 245];
const SURFACE: RGB = [255, 255, 255];
const SURFACE_2: RGB = [244, 242, 236];
const SURFACE_3: RGB = [236, 233, 224];
const LINE: RGB = [229, 227, 220];
const LINE_STRONG: RGB = [210, 207, 196];
const INK: RGB = [20, 22, 26];
const MUTED: RGB = [91, 96, 105];
const FAINT: RGB = [134, 139, 148];
const GOOD: RGB = [15, 143, 119];
const AMBER: RGB = [168, 103, 8];
const ACCENT: RGB = [45, 91, 255];
const WHITE: RGB = [255, 255, 255];

const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as RGB;

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------
const FONT_FILES = [
  { file: 'Bricolage-400.ttf', family: 'Brico', style: 'normal' },
  { file: 'Bricolage-700.ttf', family: 'Brico', style: 'bold' },
  { file: 'Bricolage-800.ttf', family: 'BricoDisplay', style: 'normal' },
  { file: 'JetBrainsMono-400.ttf', family: 'Mono', style: 'normal' },
  { file: 'JetBrainsMono-700.ttf', family: 'Mono', style: 'bold' },
] as const;

export interface PdfFont {
  file: string;
  family: string;
  style: string;
  base64: string;
}

const toBase64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};

let fontCache: Promise<PdfFont[]> | null = null;

/** Fetches the embedded fonts once. Resolves to [] when they are not available. */
function loadPdfFonts(): Promise<PdfFont[]> {
  fontCache ??= Promise.all(
    FONT_FILES.map(async (f) => {
      const res = await fetch(`/fonts/${f.file}`);
      if (!res.ok) throw new Error(f.file);
      return { ...f, base64: toBase64(await res.arrayBuffer()) };
    }),
  ).catch(() => {
    fontCache = null;
    return [];
  });
  return fontCache;
}

interface Faces {
  body: string;
  display: string;
  mono: string;
  custom: boolean;
}

function registerFonts(doc: Doc, fonts: PdfFont[]): Faces {
  if (fonts.length < FONT_FILES.length) return { body: 'helvetica', display: 'helvetica', mono: 'courier', custom: false };
  for (const f of fonts) {
    doc.addFileToVFS(f.file, f.base64);
    doc.addFont(f.file, f.family, f.style);
  }
  return { body: 'Brico', display: 'BricoDisplay', mono: 'Mono', custom: true };
}

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------
const fillColor = (doc: Doc, c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
const drawColor = (doc: Doc, c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
const textColor = (doc: Doc, c: RGB) => doc.setTextColor(c[0], c[1], c[2]);

interface TextOpts {
  family: string;
  style?: 'normal' | 'bold';
  px: number;
  color: RGB;
  align?: 'left' | 'center' | 'right';
  /** Letter spacing in card px. */
  ls?: number;
}

/** Writes one line at (x, baseline), both in mm. Returns the width in mm. */
function write(doc: Doc, str: string, x: number, baseline: number, o: TextOpts): number {
  doc.setFont(o.family, o.style ?? 'normal');
  doc.setFontSize(o.px * S * PT);
  textColor(doc, o.color);
  const ls = (o.ls ?? 0) * S;
  const width = doc.getTextWidth(str) + ls * str.length;
  const left = o.align === 'right' ? x - width : o.align === 'center' ? x - width / 2 : x;
  doc.text(str, left, baseline, ls ? { charSpace: ls } : undefined);
  return width;
}

/** Baseline inside a CSS line box of height `lineH` that starts at `top` (card px). */
const base = (top: number, lineH: number, size: number, asc: number, desc: number): number => top + (lineH - (asc + desc) * size) / 2 + asc * size;
const BRICO = { asc: 0.93, desc: 0.27 };
const MONO = { asc: 1.02, desc: 0.3 };

/** The mark: a prompt with a cursor and two dots. `u` is mm per logo unit; the origin is the centre. */
function drawMark(doc: Doc, cx: number, cy: number, u: number, ink: RGB): void {
  drawColor(doc, ink);
  doc.setLineWidth(9 * u);
  doc.setLineCap('round');
  doc.setLineJoin('round');
  doc.line(cx - 24 * u, cy - 20 * u, cx - 3 * u, cy);
  doc.line(cx - 3 * u, cy, cx - 24 * u, cy + 20 * u);
  fillColor(doc, [240, 180, 90]);
  doc.roundedRect(cx + 6 * u, cy + 12 * u, 26 * u, 9 * u, 4.5 * u, 4.5 * u, 'F');
  fillColor(doc, [91, 125, 255]);
  doc.circle(cx + 14 * u, cy - 14 * u, 3 * u, 'F');
  fillColor(doc, [23, 165, 138]);
  doc.circle(cx + 26 * u, cy - 14 * u, 4.5 * u, 'F');
}

function drawCheck(doc: Doc, x: number, y: number, size: number, c: RGB): void {
  drawColor(doc, c);
  doc.setLineWidth(size * 0.13);
  doc.setLineCap('round');
  doc.setLineJoin('round');
  const p = (px: number, py: number): [number, number] => [x + ((px + 8) / 16) * size, y + ((py + 8) / 16) * size];
  const [a, b, d] = [p(-7, 1.5), p(-1.5, 7.5), p(8, -6)];
  doc.line(a[0], a[1], b[0], b[1]);
  doc.line(b[0], b[1], d[0], d[1]);
}

const DOT_COLORS: RGB[] = [[23, 165, 138], [45, 91, 255], [194, 122, 16], [122, 92, 255], [18, 160, 200]];

/** The band of dots grown from the certificate's ID, laid out like the web SVG (1040x82, sliced to the band). */
function drawBand(doc: Doc, id: string, ox: number, oy: number): void {
  const bandW = CARD_W - 2;
  const bandH = 74;
  const scale = Math.max(bandW / 1040, bandH / 82);
  const shiftX = (1040 * scale - bandW) / 2;
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  let st = h >>> 0;
  const rnd = () => (st = (Math.imul(st, 1664525) + 1013904223) >>> 0) / 4294967296;

  doc.saveGraphicsState();
  doc.rect(ox + 1 * S, oy + 1 * S, bandW * S, bandH * S, null);
  doc.clip();
  doc.discardPath();
  for (let i = 0; i < 52; i++) {
    for (let j = 0; j < 4; j++) {
      const a = rnd();
      const b = rnd();
      const k = 0.4 + a * 0.6;
      fillColor(doc, mix(INK, DOT_COLORS[Math.floor(b * 5)], k));
      doc.circle(ox + (1 + (10 + i * 20) * scale - shiftX) * S, oy + (1 + (14 + j * 18) * scale) * S, (1.5 + a * 6) * scale * S, 'F');
    }
  }
  doc.restoreGraphicsState();
}

const LEVELS = [
  { key: 'easy', name: 'Easy', about: 'choose the answer', glyph: 'A', rgb: GOOD },
  { key: 'medium', name: 'Medium', about: 'type the output', glyph: '".."', rgb: AMBER },
  { key: 'hard', name: 'Hard', about: 'write the function', glyph: 'fn', rgb: ACCENT },
] as const;

/** Renders the certificate into a jsPDF document. `fonts` defaults to the files in /fonts. */
export async function renderCertificatePdf(cert: Certificate, fonts?: PdfFont[]): Promise<Doc> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const face = registerFonts(doc, fonts ?? (await loadPdfFonts()));
  const url = verifyUrl(cert.id);
  const pct = Math.max(0, Math.min(100, cert.score));
  const nodes = cert.breakdown ? LEVELS.filter((l) => cert.breakdown![l.key].total > 0) : [];

  // Card geometry (card px). Without a path the footer follows the intro directly.
  const PATH_TOP = 298.6;
  const footerTop = nodes.length > 0 ? 512.1 : 262.6 + 36;
  const cardH = footerTop + 133 + 1;
  const ox = (PAGE_W - CARD_W * S) / 2;
  const oy = (PAGE_H - cardH * S) / 2;
  const X = (px: number) => ox + px * S;
  const Y = (py: number) => oy + py * S;
  const R = 20 * S;

  // Page and card
  fillColor(doc, PAGE);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  fillColor(doc, SURFACE);
  doc.roundedRect(X(0), Y(0), CARD_W * S, cardH * S, R, R, 'F');

  // Dot band, rounded at the top
  fillColor(doc, INK);
  doc.roundedRect(X(1), Y(1), (CARD_W - 2) * S, 74 * S + R, R - 1 * S, R - 1 * S, 'F');
  fillColor(doc, SURFACE);
  doc.rect(X(1), Y(75), (CARD_W - 2) * S, R + 1, 'F');
  drawBand(doc, cert.id, ox, oy);

  // Header: mark and name on the left, verified pill on the right
  fillColor(doc, INK);
  doc.roundedRect(X(41), Y(95), 32 * S, 32 * S, 8.3 * S, 8.3 * S, 'F');
  drawMark(doc, X(41 + 16), Y(95 + 16), (32 / 100) * S, [244, 242, 236]);
  const wordBase = Y(base(100.3, 21.5, 18, BRICO.asc, BRICO.desc));
  const jsW = write(doc, 'JS', X(83), wordBase, { family: face.display, px: 18, color: INK, ls: -0.63 });
  write(doc, 'Tests', X(83) + jsW, wordBase, { family: face.body, style: 'bold', px: 18, color: MUTED, ls: -0.63 });

  doc.setFont(face.body, 'bold');
  doc.setFontSize(13 * S * PT);
  const label = 'Verified credential';
  const labelW = doc.getTextWidth(label) / S;
  const pillW = 12 + 14 + 6 + labelW + 12;
  fillColor(doc, mix(SURFACE, GOOD, 0.1));
  drawColor(doc, mix(SURFACE, GOOD, 0.35));
  doc.setLineWidth(1 * S);
  doc.roundedRect(X(779 - pillW), Y(97), pillW * S, 28 * S, 14 * S, 14 * S, 'FD');
  drawCheck(doc, X(779 - pillW + 12), Y(111 - 7), 14 * S, GOOD);
  write(doc, label, X(779 - pillW + 12 + 14 + 6), Y(111 + 4.6), { family: face.body, style: 'bold', px: 13, color: GOOD });

  // Name, score and intro
  const scoreText = `${pct}%`;
  const scoreW = 118.8;
  const maxName = 738 - scoreW - 32;
  let namePx = 72;
  doc.setFont(face.display, 'normal');
  while (namePx > 36) {
    doc.setFontSize(namePx * S * PT);
    if (doc.getTextWidth(cert.displayName) / S + cert.displayName.length * -0.04 * namePx <= maxName) break;
    namePx -= 2;
  }
  write(doc, cert.displayName, X(41), Y(base(155, namePx, namePx, BRICO.asc, BRICO.desc)), { family: face.display, px: namePx, color: INK, ls: -0.04 * namePx });

  const descBase = Y(base(237, 25.6, 16, BRICO.asc, BRICO.desc));
  let dx = X(41);
  dx += write(doc, 'Passed ', dx, descBase, { family: face.body, px: 16, color: MUTED });
  dx += write(doc, testTitle(cert.testId), dx, descBase, { family: face.body, px: 16, color: INK });
  write(doc, ` above the ${PASS_THRESHOLD * 100}% pass mark. Issued ${formatDate(cert.createdAt)}.`, dx, descBase, { family: face.body, px: 16, color: MUTED });

  write(doc, scoreText, X(779), Y(base(167.1, 72, 72, MONO.asc, MONO.desc)), { family: face.mono, style: 'bold', px: 72, color: INK, align: 'right', ls: -3.6 });
  write(doc, `pass mark ${PASS_THRESHOLD * 100}%`, X(779), Y(base(247.1, 15.5, 12, MONO.asc, MONO.desc)), { family: face.mono, px: 12, color: FAINT, align: 'right' });

  // Path through the levels
  if (nodes.length > 0) {
    const cols = nodes.length + 1;
    const colW = 738 / cols;
    const cxs = Array.from({ length: cols }, (_, i) => 41 + colW * (i + 0.5));
    const cy = PATH_TOP + 48;
    const x0 = cxs[0];
    const span = cxs[cols - 1] - x0;

    fillColor(doc, SURFACE_3);
    doc.roundedRect(X(x0), Y(cy - 2), span * S, 4 * S, 2 * S, 2 * S, 'F');
    const fillW = (span * pct) / 100;
    const slices = 90;
    for (let i = 0; i < slices; i++) {
      const t = (i + 0.5) / slices;
      const from = (fillW * i) / slices;
      const to = (fillW * (i + 1)) / slices;
      fillColor(doc, t < 0.5 ? mix(GOOD, AMBER, t * 2) : mix(AMBER, ACCENT, (t - 0.5) * 2));
      doc.rect(X(x0 + from), Y(cy - 2), (to - from) * S + 0.3, 4 * S, 'F');
    }

    nodes.forEach((l, i) => {
      const { correct, total } = cert.breakdown![l.key];
      fillColor(doc, SURFACE);
      doc.circle(X(cxs[i]), Y(cy), 56 * S, 'F');
      drawColor(doc, l.rgb);
      doc.setLineWidth(4 * S);
      doc.circle(X(cxs[i]), Y(cy), 46 * S, 'S');
      write(doc, l.glyph, X(cxs[i]), Y(cy + 9.4), { family: face.mono, style: 'bold', px: 26, color: l.rgb, align: 'center' });
      write(doc, l.name, X(cxs[i]), Y(base(406.6, 24, 20, BRICO.asc, BRICO.desc)), { family: face.body, style: 'bold', px: 20, color: INK, align: 'center' });
      write(doc, l.about, X(cxs[i]), Y(base(436.6, 17.5, 13, MONO.asc, MONO.desc)), { family: face.mono, px: 13, color: MUTED, align: 'center' });
      write(doc, `${formatPoints(correct)} / ${total}`, X(cxs[i]), Y(base(460.1, 20, 15, MONO.asc, MONO.desc)), { family: face.mono, style: 'bold', px: 15, color: INK, align: 'center' });
    });

    const fx = cxs[cols - 1];
    fillColor(doc, SURFACE);
    doc.circle(X(fx), Y(cy), 56 * S, 'F');
    fillColor(doc, INK);
    doc.circle(X(fx), Y(cy), 48 * S, 'F');
    drawMark(doc, X(fx), Y(cy), (44 / 100) * S, WHITE);
    write(doc, 'Certified', X(fx), Y(base(406.6, 24, 20, BRICO.asc, BRICO.desc)), { family: face.body, style: 'bold', px: 20, color: INK, align: 'center' });
    write(doc, cert.id, X(fx), Y(base(436.6, 17.5, 13, MONO.asc, MONO.desc)), { family: face.mono, px: 13, color: MUTED, align: 'center' });
  }

  // Footer strip: rounded at the bottom
  fillColor(doc, SURFACE_2);
  doc.roundedRect(X(1), Y(footerTop - 30), (CARD_W - 2) * S, (cardH - footerTop + 30 - 1) * S, R - 1 * S, R - 1 * S, 'F');
  fillColor(doc, SURFACE);
  doc.rect(X(1), Y(footerTop - 30), (CARD_W - 2) * S, 30 * S, 'F');
  drawColor(doc, LINE);
  doc.setLineWidth(1 * S);
  doc.line(X(1), Y(footerTop), X(CARD_W - 1), Y(footerTop));

  const qrTop = footerTop + 23;
  fillColor(doc, [247, 248, 251]);
  drawColor(doc, LINE_STRONG);
  doc.roundedRect(X(41), Y(qrTop), 88 * S, 88 * S, 10 * S, 10 * S, 'FD');
  const qr = await QRCode.toDataURL(url, { margin: 0, errorCorrectionLevel: 'M', width: 320, color: { dark: '#0f2a22', light: '#f7f8fb' } });
  doc.addImage(qr, 'PNG', X(49), Y(qrTop + 8), 72 * S, 72 * S);

  write(doc, 'Verify this certificate', X(151), Y(base(footerTop + 31, 25.6, 16, BRICO.asc, BRICO.desc)), { family: face.body, style: 'bold', px: 16, color: INK });
  write(doc, 'Scan the code or open the link. The details above must match the stored record.', X(151), Y(base(footerTop + 60.6, 20.8, 13, BRICO.asc, BRICO.desc)), { family: face.body, px: 13, color: MUTED });
  write(doc, url, X(151), Y(base(footerTop + 85.4, 17.5, 13, MONO.asc, MONO.desc)), { family: face.mono, px: 13, color: MUTED });

  // Card outline on top, so the rounded corners are clean
  drawColor(doc, LINE_STRONG);
  doc.setLineWidth(1 * S);
  doc.roundedRect(X(0.5), Y(0.5), (CARD_W - 1) * S, (cardH - 1) * S, R, R, 'S');

  return doc;
}

/** The file name a downloaded certificate gets, for example JST-ABCD-EFGH-2345.pdf. */
export const certificatePdfName = (cert: Certificate): string => `${cert.id}.pdf`;

/** Renders and downloads the certificate as a PDF. */
export async function downloadCertificatePdf(cert: Certificate): Promise<void> {
  const doc = await renderCertificatePdf(cert);
  doc.save(certificatePdfName(cert));
}
