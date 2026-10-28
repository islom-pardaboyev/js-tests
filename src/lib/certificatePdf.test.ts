import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SAMPLE_CERT } from './certificate';
import { certificatePdfName, renderCertificatePdf, type PdfFont } from './certificatePdf';

const FILES: [string, string, string][] = [
  ['Bricolage-400.ttf', 'Brico', 'normal'],
  ['Bricolage-700.ttf', 'Brico', 'bold'],
  ['Bricolage-800.ttf', 'BricoDisplay', 'normal'],
  ['JetBrainsMono-400.ttf', 'Mono', 'normal'],
  ['JetBrainsMono-700.ttf', 'Mono', 'bold'],
];
const fonts: PdfFont[] = FILES.map(([file, family, style]) => ({ file, family, style, base64: readFileSync(`public/fonts/${file}`).toString('base64') }));

describe('certificate PDF', () => {
  it('produces a real PDF file', async () => {
    const doc = await renderCertificatePdf(SAMPLE_CERT);
    const bytes = new Uint8Array(doc.output('arraybuffer'));
    const head = new TextDecoder().decode(bytes.slice(0, 5));
    expect(head).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(2000);
  });
  it('embeds the web fonts when they are available', async () => {
    const plain = new Uint8Array((await renderCertificatePdf(SAMPLE_CERT, [])).output('arraybuffer'));
    const embedded = new Uint8Array((await renderCertificatePdf(SAMPLE_CERT, fonts)).output('arraybuffer'));
    expect(embedded.length).toBeGreaterThan(plain.length + 20000);
  });
  it('still draws a certificate without a per-level breakdown', async () => {
    const doc = await renderCertificatePdf({ ...SAMPLE_CERT, breakdown: undefined }, fonts);
    expect(doc.getNumberOfPages()).toBe(1);
  });
  it('names the file after the certificate ID', () => {
    expect(certificatePdfName(SAMPLE_CERT)).toBe('JST-ABCD-EFGH-2345.pdf');
  });
});
