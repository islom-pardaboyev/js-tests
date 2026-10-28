import { describe, expect, it } from 'vitest';
import { authErrorMessage, GENERIC_AUTH_ERROR } from './authErrors';
import { extractCertId } from './certificate';
import { highlight } from './highlight';
import { passedRules, passwordIsStrong, passwordLevel, validateAuth } from './validation';

describe('password rules', () => {
  it('reports each rule as it is met', () => {
    expect(passedRules('')).toEqual([]);
    expect(passedRules('abc')).toEqual(['lower']);
    expect(passedRules('Abcdefg1!')).toEqual(['length', 'lower', 'upper', 'number', 'symbol']);
  });
  it('is strong only when every rule passes', () => {
    expect(passwordIsStrong('Abcdefg1!')).toBe(true);
    expect(passwordIsStrong('abcdefg1!')).toBe(false);
    expect(passwordIsStrong('Abc1!')).toBe(false);
  });
  it('maps to a 0..4 meter', () => {
    expect(passwordLevel('')).toBe(0);
    expect(passwordLevel('abc')).toBe(1);
    expect(passwordLevel('Abcdefg1!')).toBe(4);
  });
});

describe('validateAuth', () => {
  it('requires a strong password and name on sign-up only', () => {
    const e = validateAuth({ name: '', email: 'bad', password: 'weak' }, 'signup');
    expect(Object.keys(e).sort()).toEqual(['email', 'name', 'password']);
    expect(validateAuth({ name: 'Al', email: 'a@b.co', password: 'Abcdefg1!' }, 'signup')).toEqual({});
  });
  it('only checks email and a non-empty password on sign-in', () => {
    expect(validateAuth({ name: '', email: 'a@b.co', password: 'x' }, 'login')).toEqual({});
    expect(validateAuth({ name: '', email: 'a@b.co', password: '' }, 'login').password).toBeDefined();
  });
});

describe('authErrorMessage', () => {
  it.each(['auth/invalid-email', 'auth/missing-password', 'auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/email-already-in-use', 'auth/weak-password', 'auth/too-many-requests', 'auth/network-request-failed'])('maps %s', (code) => {
    expect(authErrorMessage({ code })).not.toBe(GENERIC_AUTH_ERROR);
  });
  it('falls back for anything else', () => {
    expect(authErrorMessage({ code: 'auth/whatever' })).toBe(GENERIC_AUTH_ERROR);
    expect(authErrorMessage(new Error('x'))).toBe(GENERIC_AUTH_ERROR);
  });
});

describe('extractCertId', () => {
  it('accepts an ID, any case, with spaces', () => {
    expect(extractCertId('  jst-abcd-efgh-2345 ')).toBe('JST-ABCD-EFGH-2345');
  });
  it('pulls the ID out of a pasted verification URL', () => {
    expect(extractCertId('https://jstests.example/certificate/JST-ABCD-EFGH-2345?x=1')).toBe('JST-ABCD-EFGH-2345');
  });
  it('rejects look-alikes', () => {
    expect(extractCertId('JST-ABCD-EFGH')).toBeNull();
    expect(extractCertId('JST-ABCD-EFGH-I0O1')).toBeNull();
    expect(extractCertId('')).toBeNull();
  });
});

describe('highlight', () => {
  it('escapes HTML and wraps tokens', () => {
    const html = highlight('const a = "<b>"; // hi');
    expect(html).toContain('<span class="tok-kw">const</span>');
    expect(html).toContain('&lt;b&gt;');
    expect(html).not.toContain('<b>');
  });
});

describe('certificate record', () => {
  it('prints the stored record, including the breakdown', async () => {
    const { recordText, SAMPLE_CERT } = await import('./certificate');
    const text = recordText(SAMPLE_CERT);
    expect(JSON.parse(text)).toMatchObject({ id: 'JST-ABCD-EFGH-2345', passed: true, levels: { easy: '9/10', medium: '8/10', hard: '3/4' } });
  });
  it('omits levels for certificates issued without a breakdown', async () => {
    const { recordText, SAMPLE_CERT } = await import('./certificate');
    const { breakdown: _drop, ...old } = SAMPLE_CERT;
    expect(recordText(old)).not.toContain('"levels"');
  });
});

describe('verification run', () => {
  it('prints the checks a verifier would make', async () => {
    const { verifyLines, SAMPLE_CERT } = await import('./certificate');
    const lines = verifyLines(SAMPLE_CERT);
    expect(lines[0].text).toContain('JST-ABCD-EFGH-2345');
    expect(lines[1]).toMatchObject({ ok: true });
    expect(lines.at(-1)).toEqual({ ok: true, text: 'verified' });
  });
  it('marks a below-threshold certificate as not verified', async () => {
    const { verifyLines, SAMPLE_CERT } = await import('./certificate');
    const lines = verifyLines({ ...SAMPLE_CERT, score: 58 });
    expect(lines[1].ok).toBe(false);
    expect(lines.at(-1)).toEqual({ ok: false, text: 'not verified' });
  });
});

describe('review', () => {
  it('reviews a choice and a typed answer', async () => {
    const { reviewChoice, reviewTyped } = await import('./review');
    const { easySeed } = await import('../data/seed/easy');
    const { mediumSeed } = await import('../data/seed/medium');
    const q = easySeed[0];
    expect(reviewChoice(q, q.correct).correct).toBe(true);
    expect(reviewChoice(q, null).yourAnswer).toBe('No answer');
    const m = mediumSeed[0];
    expect(reviewTyped(m, m.accept[0]).correct).toBe(true);
    expect(reviewTyped(m, '').yourAnswer).toBe('No answer');
  });
});
