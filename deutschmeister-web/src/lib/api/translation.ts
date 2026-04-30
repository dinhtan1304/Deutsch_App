export type TranslateLang = 'vi' | 'de';

// Unofficial Google Translate API — no key needed, CORS allowed, reliable
const GOOGLE_TRANSLATE = 'https://translate.googleapis.com/translate_a/single';

export async function translateText(text: string, from: TranslateLang, to: TranslateLang): Promise<string> {
  const url = `${GOOGLE_TRANSLATE}?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // Response: [[["translated","original",...], ...], null, "detected_lang", ...]
  const data = await res.json();
  const parts: string[] = (data[0] as Array<string[]>)
    .filter(Boolean)
    .map(chunk => chunk[0] ?? '')
    .filter(Boolean);
  const result = parts.join('').trim();
  if (!result) throw new Error('Empty translation');
  return result;
}

export function detectLang(text: string): TranslateLang {
  return /[àáâãèéêìíòóôõùúýăắặầấậệổợờớơưđ]/i.test(text) ? 'vi' : 'de';
}
