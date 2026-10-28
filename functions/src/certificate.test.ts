import { describe, expect, it } from 'vitest';
import { isSignatureValid, newCertificateId, signRecord, type SignedFields } from './certificate';

const KEY = 'test-key';
const record: SignedFields = {
  id: 'JST-ABCD-EFGH-2345-KMNP',
  holder: 'Ali',
  testId: 'full',
  score: 83,
  createdAt: 1700000000000,
  breakdown: { easy: { correct: 9, total: 10 }, medium: { correct: 8, total: 10 }, hard: { correct: 3, total: 4 } },
};

describe('certificate IDs', () => {
  it('uses 16 unambiguous characters in four groups', () => {
    const id = newCertificateId();
    expect(id).toMatch(/^JST(-[A-HJ-NP-Z2-9]{4}){4}$/);
    expect(id.replace(/[^A-Z0-9]/g, '').length).toBe(19);
  });
  it('does not repeat across calls', () => {
    const ids = new Set(Array.from({ length: 200 }, () => newCertificateId()));
    expect(ids.size).toBe(200);
  });
});

describe('record signatures', () => {
  it('verifies an untouched record', () => {
    const sig = signRecord(record, KEY);
    expect(isSignatureValid(record, sig, KEY)).toBe(true);
  });
  it('detects a changed score or name', () => {
    const sig = signRecord(record, KEY);
    expect(isSignatureValid({ ...record, score: 100 }, sig, KEY)).toBe(false);
    expect(isSignatureValid({ ...record, holder: 'Someone else' }, sig, KEY)).toBe(false);
  });
  it('fails with a different key', () => {
    const sig = signRecord(record, KEY);
    expect(isSignatureValid(record, sig, 'other')).toBe(false);
  });
});
