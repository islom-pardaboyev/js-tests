/**
 * Certificate issuing and verification. Only this module (via the Cloud
 * Function) writes certificates. The verify callable returns the minimum a
 * verifier needs: holder name, test, score, level scores and issue date. Never
 * uid, email or the signature itself.
 */
import { getFirestore } from 'firebase-admin/firestore';
import { isSignatureValid, newCertificateId, signRecord, type SignedFields } from './certificate';
import { PASS_RULE } from './config';
import type { Breakdown } from './types';

const CERTIFICATES = 'certificates';

interface NewCertificate {
  uid: string;
  displayName: string;
  testId: string;
  score: number;
  createdAt: number;
  breakdown: Breakdown;
}

export async function issueCertificate(c: NewCertificate, key: string): Promise<{ id: string; displayName: string; testId: string; score: number; createdAt: number }> {
  const id = newCertificateId();
  const fields: SignedFields = { id, holder: c.displayName, testId: c.testId, score: c.score, createdAt: c.createdAt, breakdown: c.breakdown };
  await getFirestore().collection(CERTIFICATES).doc(id).set({
    uid: c.uid,
    displayName: c.displayName,
    testId: c.testId,
    score: c.score,
    createdAt: c.createdAt,
    breakdown: c.breakdown,
    signature: signRecord(fields, key),
  });
  return { id, displayName: c.displayName, testId: c.testId, score: c.score, createdAt: c.createdAt };
}

interface PublicRecord {
  id: string;
  holder: string;
  testId: string;
  score: number;
  createdAt: number;
  breakdown: Breakdown;
  passed: boolean;
}

/** Looks a certificate up by ID and checks its signature. Records issued before signing report signed: false. */
export async function verifyCertificate(rawId: string, key: string): Promise<{ found: boolean; signed?: boolean; valid?: boolean; record?: PublicRecord }> {
  const id = rawId.trim().toUpperCase();
  if (!/^JST(-[A-Z2-9]{4}){3,4}$/.test(id)) return { found: false };
  const snap = await getFirestore().collection(CERTIFICATES).doc(id).get();
  if (!snap.exists) return { found: false };
  const d = snap.data() as { displayName: string; testId: string; score: number; createdAt: number; breakdown: Breakdown; signature?: string };
  const fields: SignedFields = { id, holder: d.displayName, testId: d.testId, score: d.score, createdAt: d.createdAt, breakdown: d.breakdown };
  const signed = typeof d.signature === 'string';
  const valid = signed && isSignatureValid(fields, d.signature as string, key);
  return {
    found: true,
    signed,
    valid,
    record: {
      id,
      holder: d.displayName,
      testId: d.testId,
      score: d.score,
      createdAt: d.createdAt,
      breakdown: d.breakdown,
      passed: d.score >= PASS_RULE.overall * 100,
    },
  };
}
