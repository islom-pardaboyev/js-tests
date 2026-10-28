import { describe, expect, it } from 'vitest';
import { classifyKey, MAX_STRIKES, strikesLeft, windowGapSuggestsDevtools, type KeyLike } from './examGuard';

const key = (over: Partial<KeyLike> & { key: string }): KeyLike => ({ ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...over });

describe('classifyKey', () => {
  it('flags every developer tools shortcut', () => {
    expect(classifyKey(key({ key: 'F12' }))).toBe('devtools');
    expect(classifyKey(key({ key: 'I', code: 'KeyI', ctrlKey: true, shiftKey: true }))).toBe('devtools');
    expect(classifyKey(key({ key: 'j', code: 'KeyJ', ctrlKey: true, shiftKey: true }))).toBe('devtools');
    expect(classifyKey(key({ key: 'c', code: 'KeyC', metaKey: true, shiftKey: true }))).toBe('devtools');
    expect(classifyKey(key({ key: 'ˆ', code: 'KeyI', metaKey: true, altKey: true }))).toBe('devtools');
    expect(classifyKey(key({ key: 'u', code: 'KeyU', ctrlKey: true }))).toBe('devtools');
  });
  it('silently blocks leave-the-page keys', () => {
    for (const k of ['Escape', 'F5', 'F11', 'PrintScreen']) expect(classifyKey(key({ key: k }))).toBe('blocked');
    expect(classifyKey(key({ key: 'r', code: 'KeyR', ctrlKey: true }))).toBe('blocked');
    expect(classifyKey(key({ key: 's', code: 'KeyS', metaKey: true }))).toBe('blocked');
    expect(classifyKey(key({ key: 'ArrowLeft', altKey: true }))).toBe('blocked');
  });
  it('lets normal typing through, including editor shortcuts', () => {
    expect(classifyKey(key({ key: 'a' }))).toBeNull();
    expect(classifyKey(key({ key: 'Tab' }))).toBeNull();
    expect(classifyKey(key({ key: 'c', code: 'KeyC', ctrlKey: true }))).toBeNull();
    expect(classifyKey(key({ key: 'Enter' }))).toBeNull();
  });
});

describe('windowGapSuggestsDevtools', () => {
  const base = { outerWidth: 1440, innerWidth: 1440, outerHeight: 900, innerHeight: 900 };
  it('is quiet for a normal window', () => {
    expect(windowGapSuggestsDevtools(base)).toBe(false);
    expect(windowGapSuggestsDevtools({ ...base, outerHeight: 980, innerHeight: 900 })).toBe(false);
  });
  it('notices a docked panel on either side', () => {
    expect(windowGapSuggestsDevtools({ ...base, innerWidth: 1000 })).toBe(true);
    expect(windowGapSuggestsDevtools({ ...base, innerHeight: 600 })).toBe(true);
  });
});

describe('strikes', () => {
  it('counts down to zero and never below', () => {
    expect(MAX_STRIKES).toBe(3);
    expect(strikesLeft(1)).toBe(2);
    expect(strikesLeft(9)).toBe(0);
  });
});
