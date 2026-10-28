/** Admin bank operations. Every call is checked against the verified admin email before it runs. */
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { ADMIN_EMAIL } from './config';
import { countLevels, deleteItem, getItem, listRows, migrateLegacy, saveItems } from './bank';
import { parseBankFile, parseBankItem } from './validate';
import { seedBank } from './seed';
import type { Level } from './types';

export function requireAdmin(req: CallableRequest<unknown>): string {
  const token = req.auth?.token;
  if (!req.auth || token?.email !== ADMIN_EMAIL || token?.email_verified !== true) {
    throw new HttpsError('permission-denied', 'Only the verified admin can manage the question bank.');
  }
  return req.auth.uid;
}

const LEVELS: Level[] = ['easy', 'medium', 'hard'];

export async function adminBank(data: Record<string, unknown>): Promise<unknown> {
  const action = String(data.action ?? '');
  switch (action) {
    case 'counts':
      return countLevels();
    case 'list': {
      const level = LEVELS.find((l) => l === data.level);
      if (!level) throw new HttpsError('invalid-argument', 'Unknown level.');
      return listRows(level, typeof data.after === 'string' ? data.after : null);
    }
    case 'get': {
      const item = await getItem(String(data.id ?? ''));
      if (!item) throw new HttpsError('not-found', 'No such question.');
      return item;
    }
    case 'save': {
      const item = parseBankItem(data.item);
      if (!item) throw new HttpsError('invalid-argument', 'The question is missing a required field.');
      await saveItems([item]);
      return { id: item.id };
    }
    case 'delete':
      await deleteItem(String(data.id ?? ''));
      return { ok: true };
    case 'upload': {
      const { items, rejected } = parseBankFile(data.items);
      await saveItems(items);
      return { saved: items.length, rejected };
    }
    case 'starter':
      await saveItems(seedBank);
      return { saved: seedBank.length, rejected: 0 };
    case 'migrate':
      return { moved: await migrateLegacy() };
    default:
      throw new HttpsError('invalid-argument', 'Unknown action.');
  }
}
