/**
 * Single Firestore access point. Swap this module to change the backend.
 * Timestamps are plain epoch milliseconds so the rest of the app never
 * touches Firestore types.
 */
import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  where,
  writeBatch,
  type QueryConstraint,
} from 'firebase/firestore';
import type { BankItem, Level, Topic } from '../data/types';
import type { Breakdown } from './grading';
import { firestore } from './firebase';

export interface Attempt {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  testId: string;
  score: number;
  passed: boolean;
  breakdown: Breakdown;
  durationSec: number;
  createdAt: number;
  certId: string | null;
  /** True when the exam was ended for rule violations or abandoned. Never certified. */
  terminated: boolean;
  violations: string[];
}

export interface Certificate {
  id: string;
  uid: string;
  displayName: string;
  testId: string;
  score: number;
  createdAt: number;
  /** Points per level. Absent on certificates issued before it was added. */
  breakdown?: Breakdown;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  createdAt: number;
  lastLoginAt: number;
}

type NewAttempt = Omit<Attempt, 'id'>;
type NewCertificate = Omit<Certificate, 'id'>;

const byNewest = <T extends { createdAt: number }>(rows: T[]): T[] =>
  [...rows].sort((a, b) => b.createdAt - a.createdAt);

/** 16 random chars from an unambiguous alphabet, grouped as JST-XXXX-XXXX-XXXX. */
function newId(prefix = ''): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]);
  const groups = [0, 4, 8].map((i) => chars.slice(i, i + 4).join(''));
  return `${prefix}${groups.join('-')}`;
}

export async function upsertUserProfile(user: User): Promise<void> {
  const created = user.metadata.creationTime ? Date.parse(user.metadata.creationTime) : Date.now();
  const profile: UserProfile = {
    uid: user.uid,
    displayName: user.displayName ?? '',
    email: user.email ?? '',
    createdAt: created,
    lastLoginAt: Date.now(),
  };
  await setDoc(doc(firestore, 'users', user.uid), profile, { merge: true });
}

export async function saveAttempt(attempt: NewAttempt): Promise<string> {
  const id = newId();
  await setDoc(doc(firestore, 'attempts', id), attempt);
  return id;
}

export async function listAttempts(uid: string): Promise<Attempt[]> {
  const snap = await getDocs(query(collection(firestore, 'attempts'), where('uid', '==', uid), limit(100)));
  return byNewest(snap.docs.map((d) => ({ ...(d.data() as NewAttempt), id: d.id })));
}

export async function createCertificate(cert: NewCertificate): Promise<string> {
  const id = newId('JST-');
  await setDoc(doc(firestore, 'certificates', id), cert);
  return id;
}

export async function getCertificate(id: string): Promise<Certificate | null> {
  const snap = await getDoc(doc(firestore, 'certificates', id));
  return snap.exists() ? { ...(snap.data() as NewCertificate), id: snap.id } : null;
}

/** Admin only (enforced by Firestore rules). */
export async function listAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(query(collection(firestore, 'users'), limit(500)));
  return snap.docs.map((d) => d.data() as UserProfile);
}

/** Admin only (enforced by Firestore rules). */
export async function listAllAttempts(): Promise<Attempt[]> {
  const snap = await getDocs(query(collection(firestore, 'attempts'), limit(500)));
  return byNewest(snap.docs.map((d) => ({ ...(d.data() as NewAttempt), id: d.id })));
}

// ---------------------------------------------------------------------------
// Question bank (collection `questions`). Any signed-in user can read; only
// the admin can write (firestore.rules). Every doc carries a random `rand`
// number so an exam can sample a handful of docs instead of reading them all.
// ---------------------------------------------------------------------------
const BANK = 'questions';
const POOL_LIMIT = 120;

type Row = Record<string, unknown>;
const rows = (snap: { docs: { id: string; data: () => unknown }[] }): Row[] =>
  snap.docs.map((d) => ({ ...(d.data() as Row), id: d.id }));

const withRand = (item: BankItem): BankItem & { rand: number } => ({ ...item, rand: Math.random() });

/**
 * Random sample of one level, optionally limited to some topics. It reads
 * about `count` docs whatever the size of the bank: a random slice by `rand`
 * (composite indexes in firestore.indexes.json). If an index is not deployed
 * yet it falls back to reading up to POOL_LIMIT docs of that level and topics.
 */
export async function drawFromBank(level: Level, count: number, topics: Topic[] | null): Promise<Row[]> {
  const col = collection(firestore, BANK);
  const scope = topics ? [where('level', '==', level), where('topic', 'in', topics)] : [where('level', '==', level)];
  const pivot = Math.random();
  const slice = (op: '>=' | '<', n: number) => getDocs(query(col, ...scope, where('rand', op, pivot), orderBy('rand'), limit(n)));
  try {
    const first = rows(await slice('>=', count));
    const rest = first.length < count ? rows(await slice('<', count - first.length)) : [];
    const picked = [...first, ...rest];
    if (picked.length > 0) return picked;
  } catch {
    /* index not deployed yet: fall back to a plain read below */
  }
  return rows(await getDocs(query(col, ...scope, limit(POOL_LIMIT))));
}

interface BankPage {
  rows: Row[];
  /** Pass back as `after` to load the next page; null when there is no more. */
  next: string | null;
}

/** Admin list of one level, 25 at a time, ordered by document id. */
export async function listBankPage(level: Level, after: string | null, size = 25): Promise<BankPage> {
  const constraints: QueryConstraint[] = [where('level', '==', level), orderBy(documentId())];
  if (after) constraints.push(startAfter(after));
  const page = rows(await getDocs(query(collection(firestore, BANK), ...constraints, limit(size + 1))));
  const more = page.length > size;
  const visible = more ? page.slice(0, size) : page;
  return { rows: visible, next: more ? String(visible[visible.length - 1].id) : null };
}

export async function countBank(): Promise<Record<Level, number>> {
  const col = collection(firestore, BANK);
  const levels: Level[] = ['easy', 'medium', 'hard'];
  const counts = await Promise.all(
    levels.map((l) => getCountFromServer(query(col, where('level', '==', l))).then((r) => r.data().count)),
  );
  return { easy: counts[0], medium: counts[1], hard: counts[2] };
}

/** Admin only. Creates or replaces one question. */
export async function saveQuestion(item: BankItem): Promise<void> {
  await setDoc(doc(firestore, BANK, item.id), withRand(item));
}

/** Admin only. */
export async function deleteQuestion(id: string): Promise<void> {
  await deleteDoc(doc(firestore, BANK, id));
}

/** Admin only. Batches of 400 (Firestore allows 500 writes per batch). */
export async function upsertBank(items: BankItem[]): Promise<void> {
  for (let i = 0; i < items.length; i += 400) {
    const batch = writeBatch(firestore);
    items.slice(i, i + 400).forEach((item) => batch.set(doc(firestore, BANK, item.id), withRand(item)));
    await batch.commit();
  }
}
