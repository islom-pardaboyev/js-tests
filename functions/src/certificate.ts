/**
 * Certificate IDs and signatures. Only the Cloud Function calls this. The
 * signature is an HMAC over the record fields with a key only the function
 * holds, so editing a stored record (name, score, breakdown) breaks verification.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/** 32 unambiguous characters, so a random byte mod 32 is unbiased. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** JST-XXXX-XXXX-XXXX-XXXX: 16 random characters (about 80 bits). */
export function newCertificateId(): string {
  const chars = Array.from(randomBytes(16), (b) => ALPHABET[b % ALPHABET.length]);
  const groups = [0, 4, 8, 12].map((i) => chars.slice(i, i + 4).join(''));
  return `JST-${groups.join('-')}`;
}

export interface SignedFields {
  id: string;
  holder: string;
  testId: string;
  score: number;
  createdAt: number;
  breakdown: { easy: LevelPts; medium: LevelPts; hard: LevelPts };
}

interface LevelPts {
  correct: number;
  total: number;
}

/** Fixed key order, so the same record always produces the same text. */
function canonicalRecord(f: SignedFields): string {
  const lv = (s: LevelPts) => [s.correct, s.total];
  return JSON.stringify({
    id: f.id,
    holder: f.holder,
    testId: f.testId,
    score: f.score,
    createdAt: f.createdAt,
    levels: { easy: lv(f.breakdown.easy), medium: lv(f.breakdown.medium), hard: lv(f.breakdown.hard) },
  });
}

export function signRecord(f: SignedFields, key: string): string {
  return createHmac('sha256', key).update(canonicalRecord(f)).digest('hex');
}

export function isSignatureValid(f: SignedFields, signature: string, key: string): boolean {
  const expected = Buffer.from(signRecord(f, key), 'hex');
  const given = Buffer.from(signature, 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export const randomHex = (bytes: number): string => randomBytes(bytes).toString('hex');
