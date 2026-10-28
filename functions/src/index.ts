/**
 * Cloud Functions entry point. Every write that matters (attempts, certificates,
 * answer keys, the question bank) happens here, through the Admin SDK, which
 * bypasses the client rules. The client only calls these functions.
 */
import { initializeApp } from 'firebase-admin/app';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { adminBank, requireAdmin } from './admin';
import { verifyCertificate } from './certificates';
import { demoCheck, demoPublic } from './demo';
import { finishExam as finishExamImpl, startExam as startExamImpl } from './exam';

initializeApp();

/** Set once with: firebase functions:secrets:set CERT_SIGNING_KEY */
const SIGNING_KEY = defineSecret('CERT_SIGNING_KEY');

function requireUser(req: { auth?: { uid: string } | null }): string {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  return req.auth.uid;
}

/** Draws a fresh exam for the signed-in user. Answer keys never leave the server. */
export const startExam = onCall(async (req) => startExamImpl(requireUser(req), String(req.data?.testId ?? '')));

/** Grades the submitted answers against the stored key, writes the attempt and any certificate. */
export const finishExam = onCall({ secrets: [SIGNING_KEY] }, async (req) =>
  finishExamImpl(requireUser(req), (req.data ?? {}) as Record<string, unknown>, SIGNING_KEY.value()),
);

/** Public: looks a certificate up by ID and reports whether its signature still holds. */
export const checkCertificate = onCall({ secrets: [SIGNING_KEY] }, async (req) =>
  verifyCertificate(String(req.data?.id ?? ''), SIGNING_KEY.value()),
);

/** Admin only: list, get, save, delete, upload, starter set, counts, legacy migration. */
export const adminBankCall = onCall(async (req) => {
  requireAdmin(req);
  return adminBank((req.data ?? {}) as Record<string, unknown>);
});

/** Landing page demo: one of five fixed easy questions (no answer key sent). */
export const demoQuestion = onCall(() => demoPublic(Math.floor(Math.random() * 5)));

/** Landing page demo: the correct option for one of those fixed questions. */
export const demoAnswer = onCall((req) => {
  const result = demoCheck(String(req.data?.id ?? ''));
  if (!result) throw new HttpsError('not-found', 'Unknown demo question.');
  return result;
});
