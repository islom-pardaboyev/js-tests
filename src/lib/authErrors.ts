const MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'That email address is not valid.',
  'auth/missing-password': 'Enter your password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'That password is too weak. Use at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your internet connection.',
};

export const GENERIC_AUTH_ERROR = 'Something went wrong. Please try again.';

function authErrorCode(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return '';
}

export function authErrorMessage(err: unknown): string {
  return MESSAGES[authErrorCode(err)] ?? GENERIC_AUTH_ERROR;
}

export const isPopupClosed = (err: unknown): boolean =>
  authErrorCode(err) === 'auth/popup-closed-by-user';
