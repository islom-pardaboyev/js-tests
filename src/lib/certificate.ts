import type { Certificate } from './db';
import { PASS_THRESHOLD } from './grading';
import { SITE_URL } from './seo';

const ID_PATTERN = /JST-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}/;

/** Accepts a bare ID or a pasted verification URL and returns the normalized ID, or null. */
export function extractCertId(input: string): string | null {
  return ID_PATTERN.exec(input.trim().toUpperCase())?.[0] ?? null;
}

/** The public URL encoded in the QR code and shown on the certificate. */
export const verifyUrl = (id: string): string => `${SITE_URL}/certificate/${id}`;

/** Shown at /certificate/sample so the design can be previewed. Not a real record. */
export const SAMPLE_CERT: Certificate = {
  id: 'JST-ABCD-EFGH-2345',
  uid: 'sample',
  displayName: '[Your Name]',
  testId: 'full',
  score: 83,
  createdAt: Date.now(),
  breakdown: { easy: { correct: 9, total: 10 }, medium: { correct: 8, total: 10 }, hard: { correct: 3, total: 4 } },
};

/** The stored record as JSON: exactly the fields a verifier checks. */
export function recordText(c: Certificate): string {
  const b = c.breakdown;
  const record: Record<string, unknown> = {
    id: c.id,
    holder: c.displayName,
    test: c.testId,
    score: c.score,
    passed: c.score >= PASS_THRESHOLD * 100,
    issued: new Date(c.createdAt).toISOString().slice(0, 10),
  };
  if (b) {
    record.levels = {
      easy: `${b.easy.correct}/${b.easy.total}`,
      medium: `${b.medium.correct}/${b.medium.total}`,
      hard: `${b.hard.correct}/${b.hard.total}`,
    };
  }
  return JSON.stringify(record, null, 2);
}

interface VerifyLine {
  ok: boolean;
  text: string;
}

/**
 * The checks a verifier would run against a stored record, one line each, built
 * from the same data the record holds. Shown on the certificate as a run log.
 */
export function verifyLines(c: Certificate): VerifyLine[] {
  const mark = PASS_THRESHOLD * 100;
  const passed = c.score >= mark;
  const lines: VerifyLine[] = [
    { ok: true, text: `record found  ${c.id}` },
    { ok: passed, text: `score        ${c.score}% ${passed ? '>=' : '<'} ${mark}% pass mark` },
  ];
  const b = c.breakdown;
  if (b) {
    lines.push({
      ok: true,
      text: `levels       easy ${b.easy.correct}/${b.easy.total}  medium ${b.medium.correct}/${b.medium.total}  hard ${b.hard.correct}/${b.hard.total}`,
    });
  }
  lines.push({ ok: true, text: `issued       ${new Date(c.createdAt).toISOString().slice(0, 10)}` });
  lines.push({ ok: passed, text: passed ? 'verified' : 'not verified' });
  return lines;
}
