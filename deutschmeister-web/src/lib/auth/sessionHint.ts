'use client';

const SESSION_HINT_KEY = 'dm_session_hint';
const SESSION_HINT_COOKIE = 'dm_session_hint';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function isSecureContextForCookie() {
  return typeof window !== 'undefined' && window.location.protocol === 'https:';
}

export function hasSessionHint(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if (window.localStorage.getItem(SESSION_HINT_KEY) === '1') return true;
  } catch {
    // localStorage can be unavailable in private mode.
  }

  return document.cookie
    .split(';')
    .some((cookie) => cookie.trim().startsWith(`${SESSION_HINT_COOKIE}=1`));
}

export function setSessionHint() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(SESSION_HINT_KEY, '1');
  } catch {
    // Non-sensitive optimization only; cookie hint below is enough.
  }

  document.cookie = [
    `${SESSION_HINT_COOKIE}=1`,
    'Path=/',
    `Max-Age=${ONE_YEAR_SECONDS}`,
    'SameSite=Lax',
    isSecureContextForCookie() ? 'Secure' : '',
  ].filter(Boolean).join('; ');
}

export function clearSessionHint() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    // Ignore storage availability errors.
  }

  document.cookie = `${SESSION_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
