import type { AppLocale } from './routing';

// Fallback chain when a requested locale field is missing: requested → en → vi.
// Keeps the UI from rendering an empty string when DB content lacks a translation.
const FALLBACK_ORDER: AppLocale[] = ['en', 'vi'];

function cap(locale: string): string {
  return locale.charAt(0).toUpperCase() + locale.slice(1);
}

/**
 * Pick a locale-suffixed field from an object, e.g. titleVi / titleEn / titleDe.
 *   pickField(lesson, 'title', 'de') → lesson.titleDe ?? lesson.titleEn ?? lesson.titleVi
 */
export function pickField(
  obj: object | null | undefined,
  base: string,
  locale: string,
): string {
  if (!obj) return '';
  const rec = obj as Record<string, unknown>;
  const order = [locale, ...FALLBACK_ORDER];
  for (const loc of order) {
    const v = rec[`${base}${cap(loc)}`];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return '';
}

/**
 * Pick a value from a locale-keyed object, e.g. { vi, en, de }.
 *   pickLocale(section.title, 'de') → section.title.de ?? .en ?? .vi
 * Works for any value type (string, string[], …).
 */
export function pickLocale<V>(
  obj: Partial<Record<string, V>> | null | undefined,
  locale: string,
): V | undefined {
  if (!obj) return undefined;
  const order = [locale, ...FALLBACK_ORDER];
  for (const loc of order) {
    const v = obj[loc];
    if (v !== undefined && v !== null) return v;
  }
  // last resort: first non-empty value present
  for (const v of Object.values(obj)) {
    if (v !== undefined && v !== null) return v as V;
  }
  return undefined;
}
