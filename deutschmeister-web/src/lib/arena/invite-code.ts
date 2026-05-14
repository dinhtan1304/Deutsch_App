/**
 * Accepts either a bare 6-char code or a URL ending with /arena/rooms/CODE.
 * Returns the normalized uppercase code, or null if no valid code found.
 */
export function parseArenaInviteCode(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  // Try bare code first
  if (/^[A-Z0-9]{6}$/i.test(raw)) return raw.toUpperCase();

  // Try URL — last non-empty path segment
  try {
    const url = new URL(raw);
    const segments = url.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && /^[A-Z0-9]{6}$/i.test(last)) return last.toUpperCase();
  } catch {
    /* not a URL — fall through */
  }

  // Fallback regex scan
  const match = raw.match(/[A-Z0-9]{6}/i);
  return match ? match[0].toUpperCase() : null;
}
