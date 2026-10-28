import { useState, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authErrorMessage } from '../../lib/authErrors';
import { validateAuth, type AuthFieldErrors } from '../../lib/validation';
import { GoogleLogo } from '../Icons';
import { AuthField } from './AuthField';
import { PasswordRules } from './PasswordRules';

type Mode = 'login' | 'signup';

export function AuthForm() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [fields, setFields] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState<'form' | 'google' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const isSignup = mode === 'signup';
  const set = (key: keyof typeof fields) => (value: string) => {
    const next = { ...fields, [key]: value };
    setFields(next);
    if (submitted) setErrors(validateAuth(next, mode));
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    setSubmitted(false);
    setFormError(null);
  };

  const run = async (kind: 'form' | 'google', action: () => Promise<void>) => {
    setBusy(kind);
    setFormError(null);
    try {
      await action();
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validateAuth(fields, mode);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const email = fields.email.trim();
    void run('form', () => (isSignup ? signUp(fields.name.trim(), email, fields.password) : signIn(email, fields.password)));
  };

  return (
    <div className="panel auth-panel">
      <div role="tablist" aria-label="Sign in or sign up" className="auth-tabs">
        <button type="button" role="tab" aria-selected={!isSignup} onClick={() => switchMode('login')}>Sign in</button>
        <button type="button" role="tab" aria-selected={isSignup} onClick={() => switchMode('signup')}>Create account</button>
      </div>

      <div className="auth-head">
        <h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2>
        <p>{isSignup ? 'Free. Takes under a minute.' : 'Sign in to your tests.'}</p>
      </div>

      <button type="button" className="btn btn-block" disabled={busy !== null} aria-busy={busy === 'google'} onClick={() => void run('google', signInWithGoogle)}>
        <GoogleLogo /> Continue with Google
      </button>

      <div className="divider">or use email</div>

      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        {isSignup && (
          <AuthField label="Full name" value={fields.name} onChange={set('name')} error={errors.name} autoComplete="name" placeholder="Your name" />
        )}
        <AuthField label="Email" type="email" value={fields.email} onChange={set('email')} error={errors.email} autoComplete="email" placeholder="ali@example.com" />
        <AuthField
          label="Password"
          type="password"
          value={fields.password}
          onChange={set('password')}
          error={isSignup ? undefined : errors.password}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
        />
        {isSignup && <PasswordRules password={fields.password} />}
        {isSignup && errors.password && <p className="field-error" role="alert">{errors.password}</p>}
        {formError && <p className="banner error" role="alert">{formError}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={busy !== null} aria-busy={busy === 'form'}>
          {isSignup ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p className="auth-switch">
        {isSignup ? 'Already have an account? ' : 'New here? '}
        <button type="button" onClick={() => switchMode(isSignup ? 'login' : 'signup')}>{isSignup ? 'Sign in' : 'Create an account'}</button>
      </p>
    </div>
  );
}
