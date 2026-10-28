/**
 * Question bank in Firestore, split in two collections:
 *   questions/{id}   public part: prompt, snippet, options, visible tests, hint.
 *                    Clients cannot read it at all; the server serves exams from it.
 *   answerKeys/{id}  secret part: correct option, accepted answers, explanation,
 *                    hidden tests. Only this function reads and writes it.
 */
import { FieldPath, getFirestore, type DocumentData } from 'firebase-admin/firestore';
import { randomBytes } from 'node:crypto';
import type { BankItem, Level, Topic } from './types';

const QUESTIONS = 'questions';
const ANSWER_KEYS = 'answerKeys';
const POOL_LIMIT = 120;
const DEFAULT_BANK = 'default';

const SECRET: Record<Level, string[]> = {
  easy: ['correct', 'explanation'],
  medium: ['accept', 'explanation'],
  hard: ['hiddenTests'],
};

const PUBLIC: Record<Level, string[]> = {
  easy: ['id', 'level', 'topic', 'bankId', 'prompt', 'snippet', 'options', 'rand'],
  medium: ['id', 'level', 'topic', 'bankId', 'prompt', 'snippet', 'hint', 'rand'],
  hard: ['id', 'level', 'topic', 'bankId', 'title', 'fnName', 'description', 'requirements', 'starter', 'visibleTests', 'rand'],
};

const pick = (src: Record<string, unknown>, keys: string[]): Record<string, unknown> =>
  Object.fromEntries(keys.filter((k) => src[k] !== undefined).map((k) => [k, src[k]]));

/** A number in [0, 1) from fresh random bytes; stored on each question for the random draw. */
const randomUnit = (): number => randomBytes(4).readUInt32BE() / 2 ** 32;

function splitItem(item: BankItem): { pub: Record<string, unknown>; secret: Record<string, unknown> } {
  const all = { ...item, bankId: item.bankId ?? DEFAULT_BANK } as unknown as Record<string, unknown>;
  return { pub: { ...pick(all, PUBLIC[item.level]), rand: randomUnit() }, secret: pick(all, SECRET[item.level]) };
}

/** Rebuilds a full item (admin editing) from its two documents. */
function joinItem(pub: DocumentData, secret: DocumentData | undefined): BankItem | null {
  if (!secret) return null;
  const { rand: _rand, ...rest } = pub;
  void _rand;
  return { ...rest, ...secret } as unknown as BankItem;
}

const db = () => getFirestore();

export async function saveItems(items: BankItem[]): Promise<void> {
  for (let i = 0; i < items.length; i += 200) {
    const batch = db().batch();
    for (const item of items.slice(i, i + 200)) {
      const { pub, secret } = splitItem(item);
      batch.set(db().collection(QUESTIONS).doc(item.id), pub);
      batch.set(db().collection(ANSWER_KEYS).doc(item.id), secret);
    }
    await batch.commit();
  }
}

export async function deleteItem(id: string): Promise<void> {
  const batch = db().batch();
  batch.delete(db().collection(QUESTIONS).doc(id));
  batch.delete(db().collection(ANSWER_KEYS).doc(id));
  await batch.commit();
}

export async function getItem(id: string): Promise<BankItem | null> {
  const [pub, secret] = await Promise.all([
    db().collection(QUESTIONS).doc(id).get(),
    db().collection(ANSWER_KEYS).doc(id).get(),
  ]);
  if (!pub.exists) return null;
  return joinItem(pub.data() ?? {}, secret.data());
}

/** Admin list page: public fields only, 25 per page. */
export async function listRows(level: Level, after: string | null, size = 25): Promise<{ rows: Record<string, unknown>[]; next: string | null }> {
  let q = db().collection(QUESTIONS).where('level', '==', level).orderBy(FieldPath.documentId()).limit(size + 1);
  if (after) q = q.startAfter(after);
  const snap = await q.get();
  const docs = snap.docs.slice(0, size);
  const rows = docs.map((d) => {
    const data = d.data();
    return { id: d.id, level: data.level, topic: data.topic, title: (level === 'hard' ? data.title : data.prompt) ?? '' };
  });
  return { rows, next: snap.size > size ? docs[docs.length - 1].id : null };
}

export async function countLevels(): Promise<Record<Level, number>> {
  const levels: Level[] = ['easy', 'medium', 'hard'];
  const counts = await Promise.all(
    levels.map((l) => db().collection(QUESTIONS).where('level', '==', l).count().get().then((r) => r.data().count)),
  );
  return { easy: counts[0], medium: counts[1], hard: counts[2] };
}

/**
 * Random sample of one level from one bank: about `count` docs, read by a
 * random slice of the stored `rand` value. Needs the composite indexes in
 * firestore.indexes.json. Falls back to a plain read if an index is missing.
 */
export async function drawPublic(bankId: string, level: Level, count: number, topics: Topic[] | null): Promise<DocumentData[]> {
  const col = db().collection(QUESTIONS);
  const scope = (q: FirebaseFirestore.Query) => {
    let out = q.where('bankId', '==', bankId).where('level', '==', level);
    if (topics) out = out.where('topic', 'in', topics);
    return out;
  };
  const pivot = randomUnit();
  const slice = (op: '>=' | '<', n: number) => scope(col).where('rand', op, pivot).orderBy('rand').limit(n).get();
  try {
    const first = (await slice('>=', count)).docs;
    const rest = first.length < count ? (await slice('<', count - first.length)).docs : [];
    const picked = [...first, ...rest].map((d) => ({ ...d.data(), id: d.id }));
    if (picked.length > 0) return picked;
  } catch {
    /* index not deployed yet: fall back below */
  }
  const plain = await scope(col).limit(POOL_LIMIT).get();
  return plain.docs.map((d) => ({ ...d.data(), id: d.id }));
}

/** Joins drawn public docs with their answer keys. Items with no key document are skipped. */
export async function withKeys(pubs: DocumentData[]): Promise<BankItem[]> {
  if (pubs.length === 0) return [];
  const refs = pubs.map((p) => db().collection(ANSWER_KEYS).doc(String(p.id)));
  const keys = await db().getAll(...refs);
  return pubs
    .map((p, i) => joinItem(p, keys[i].data()))
    .filter((i): i is BankItem => i !== null);
}

/**
 * One-time migration for a bank written before the split: moves answers and
 * hidden tests out of `questions` into `answerKeys` and gives every question a bankId.
 */
export async function migrateLegacy(): Promise<number> {
  const snap = await db().collection(QUESTIONS).get();
  let moved = 0;
  for (const d of snap.docs) {
    const data = d.data();
    const level = data.level as Level;
    if (!level) continue;
    const hasSecrets = SECRET[level].some((k) => data[k] !== undefined);
    if (!hasSecrets && data.bankId) continue;
    const full = { ...data, id: d.id, bankId: data.bankId ?? 'default' } as unknown as BankItem;
    const { pub, secret } = splitItem(full);
    pub.rand = typeof data.rand === 'number' ? data.rand : pub.rand;
    const batch = db().batch();
    batch.set(db().collection(ANSWER_KEYS).doc(d.id), secret);
    batch.set(db().collection(QUESTIONS).doc(d.id), pub);
    await batch.commit();
    moved += 1;
  }
  return moved;
}
