import type { User } from 'firebase/auth';

/**
 * The single admin. This is a UI convenience only: the real gate is the
 * Firestore rule in firestore.rules, which checks the same verified email.
 */
const ADMIN_EMAIL = 'ipardaboyev574@gmail.com';

export function isAdminUser(user: User | null): boolean {
  return Boolean(user && user.emailVerified && user.email?.toLowerCase() === ADMIN_EMAIL);
}
