import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authErrorMessage } from '../../lib/authErrors';

export function VerifyBanner() {
  const { user, resendVerification } = useAuth();
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  if (!user || user.emailVerified) return null;

  const resend = async () => {
    setState('sending');
    setError(null);
    try {
      await resendVerification();
      setState('sent');
    } catch (err) {
      setError(authErrorMessage(err));
      setState('idle');
    }
  };

  return (
    <div className="banner" role="status">
      <p>
        <strong>Your email is not verified.</strong>{' '}
        <span className="muted">
          {state === 'sent' ? `New link sent to ${user.email}.` : `Open the link we sent to ${user.email}.`}
        </span>
        {error && <span className="field-error"> {error}</span>}
      </p>
      <button type="button" className="btn btn-sm" onClick={() => void resend()} disabled={state === 'sending'} aria-busy={state === 'sending'}>
        {state === 'sent' ? 'Send again' : 'Resend verification email'}
      </button>
    </div>
  );
}
