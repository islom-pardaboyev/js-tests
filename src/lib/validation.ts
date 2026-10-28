const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

/** Shown live while typing on sign-up. Every rule must pass. */
export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: '8+ characters', test: (p) => p.length >= 8 },
  { id: 'lower', label: 'Lowercase', test: (p) => /[a-z]/.test(p) },
  { id: 'upper', label: 'Uppercase', test: (p) => /[A-Z]/.test(p) },
  { id: 'number', label: 'Number', test: (p) => /\d/.test(p) },
  { id: 'symbol', label: 'Symbol', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const passedRules = (password: string): string[] =>
  PASSWORD_RULES.filter((r) => r.test(password)).map((r) => r.id);

export const passwordIsStrong = (password: string): boolean => passedRules(password).length === PASSWORD_RULES.length;

/** 0..4 for the strength meter. */
export function passwordLevel(password: string): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0;
  const n = passedRules(password).length;
  if (n <= 2) return 1;
  if (n === 3) return 2;
  if (n === 4) return 3;
  return 4;
}

export interface AuthFields {
  name: string;
  email: string;
  password: string;
}
export type AuthFieldErrors = Partial<Record<keyof AuthFields, string>>;

export function validateAuth(fields: AuthFields, mode: 'login' | 'signup'): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  if (mode === 'signup' && fields.name.trim().length < 2) errors.name = 'Enter your name (at least 2 characters).';
  if (!EMAIL.test(fields.email.trim())) errors.email = 'Enter a valid email address, like ali@example.com.';
  if (mode === 'login' && fields.password.length === 0) errors.password = 'Enter your password.';
  if (mode === 'signup' && !passwordIsStrong(fields.password)) errors.password = 'Your password does not meet all the requirements yet.';
  return errors;
}
