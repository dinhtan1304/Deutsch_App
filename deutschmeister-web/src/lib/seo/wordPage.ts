import type { AppLocale } from '@/i18n/routing';
import { GA_ID } from '@/lib/analytics';
import { ACCENT } from '@/lib/tokens';
import type { Word } from '@/types';

const BASE_URL = 'https://www.deutschmeister.vn';

/**
 * The public page for one vocabulary entry, as a plain HTML string.
 *
 * There are 41,262 of these, nothing in the app links to them, and almost every
 * hit is a crawler reading a page once. Rendered through the app layout each one
 * weighed ~340 KB (the whole translation bundle travels with it) and that alone
 * exceeded the hosting quota. As a string it is a few KB and needs no client JS,
 * which suits a page whose only job is to be read.
 *
 * globals.css is not loaded here, so the neutrals below mirror `--theme-*`.
 */
const CSS = `
:root{--bg:#F7F8FB;--card:#fff;--soft:#F1F3F8;--text:#11151D;--text2:#566072;--muted:#6B7385;--line:#E3E7EF}
@media(prefers-color-scheme:dark){:root{--bg:#0A0C11;--card:#161A23;--soft:#11141B;--text:#F2F4F8;--text2:#9099AB;--muted:#9099AB;--line:#232938}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:inherit}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;background:var(--card);border-bottom:1px solid var(--line)}
.brand{font-weight:700;text-decoration:none}
.btn{display:inline-block;padding:10px 16px;border-radius:8px;background:${ACCENT.brand};color:#F4F6FF;font-size:14px;font-weight:600;text-decoration:none}
.top .btn{padding:6px 12px}
main{max-width:42rem;margin:0 auto;padding:24px 16px 48px}
.crumb{margin-bottom:16px;font-size:12px;color:var(--muted)}
.crumb a{text-decoration:none}
.crumb i{margin:0 6px;font-style:normal}
.card{padding:24px;background:var(--card);border:1px solid var(--line);border-radius:16px}
.head{display:flex;flex-wrap:wrap;align-items:baseline;gap:10px}
.art{font-size:22px;font-weight:700}
h1{margin:0;font-size:32px;line-height:1.2;overflow-wrap:anywhere}
.lvl{padding:2px 8px;border-radius:999px;background:color-mix(in srgb,${ACCENT.brand} 12%,transparent);color:${ACCENT.brand};font-size:11px;font-weight:700}
@media(prefers-color-scheme:dark){.lvl{color:${ACCENT.v2Hi}}}
.ipa{margin:8px 0 0;font-size:15px;color:var(--muted)}
.mean{margin:14px 0 0;font-size:20px}
.alt{margin:4px 0 0;font-size:14px;color:var(--muted)}
dl{display:flex;flex-wrap:wrap;gap:20px;margin:18px 0 0}
dt{font-size:11px;color:var(--muted)}
dd{margin:0;font-size:15px}
h2{margin:24px 0 10px;font-size:16px}
.ex{margin:0;padding:0;list-style:none}
.ex li{margin-bottom:8px;padding:12px 14px;background:var(--soft);border-left:3px solid var(--tone);border-radius:8px;font-size:15px}
.tips{margin:0;padding-left:20px;font-size:14px;color:var(--text2)}
.tips li{margin-bottom:6px}
.more{margin-top:28px}
`;

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function localised(locale: AppLocale, path: string): string {
  return locale === 'vi' ? path : `/${locale}${path}`;
}

/** Colour per grammatical gender — the same three the rest of the app uses. */
function articleTone(article: string | null | undefined): string {
  const tones: Record<string, string> = { der: ACCENT.der, die: ACCENT.die, das: ACCENT.das };
  return tones[(article ?? '').toLowerCase()] ?? ACCENT.brand;
}

function shell(locale: AppLocale, head: string, body: string): string {
  const vi = locale === 'vi';
  return `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
${head}
<link rel="icon" href="/logo-64.png"><style>${CSS}</style>
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');</script>
</head><body>
<header class="top"><a class="brand" href="${localised(locale, '/')}">DeutschMeister</a><a class="btn" href="${localised(locale, '/auth/register')}">${vi ? 'Học miễn phí' : 'Start for free'}</a></header>
<main>${body}</main>
</body></html>`;
}

export function renderWordPage(word: Word, locale: AppLocale, level: string, slug: string): string {
  const vi = locale === 'vi';
  const form = word.article ? `${word.article} ${word.word}` : word.word;
  const meaning = word.translationVi || word.translationEn;
  const url = `${BASE_URL}${localised(locale, `/words/${level}/${esc(slug)}`)}`;

  // Lead with the search phrasing rather than the brand: these pages are found
  // by people typing the question, not the product name.
  const title =
    locale === 'en'
      ? `${form} — meaning, article and examples`
      : locale === 'de'
        ? `${form} — Bedeutung, Artikel und Beispiele`
        : `${form} nghĩa là gì? Giống từ, ví dụ (${word.level})`;

  const description =
    locale === 'en'
      ? `${form} means "${word.translationEn}". Article, plural, pronunciation and example sentences at ${word.level}.`
      : locale === 'de'
        ? `${form}: Bedeutung, Artikel, Plural, Aussprache und Beispielsätze (${word.level}).`
        : `${form} nghĩa là "${meaning}". Giống từ, số nhiều, phát âm và câu ví dụ trình độ ${word.level}.`;

  const head = `<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
${vi ? '' : '<meta name="robots" content="noindex,follow">'}
<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${BASE_URL}/opengraph-image">`;

  const facts = [
    word.plural ? `<div><dt>${vi ? 'Số nhiều' : 'Plural'}</dt><dd>${esc(word.plural)}</dd></div>` : '',
    word.category ? `<div><dt>${vi ? 'Chủ đề' : 'Category'}</dt><dd>${esc(word.category)}</dd></div>` : '',
  ].join('');

  const examples = word.examples?.length
    ? `<section><h2>${vi ? 'Câu ví dụ' : 'Example sentences'}</h2><ul class="ex">${word.examples
        .map((example) => `<li>${esc(example)}</li>`)
        .join('')}</ul></section>`
    : '';

  const tips = word.tips?.length
    ? `<section><h2>${vi ? 'Mẹo ghi nhớ' : 'Tips'}</h2><ul class="tips">${word.tips
        .map((tip) => `<li>${esc(tip)}</li>`)
        .join('')}</ul></section>`
    : '';

  // The API already stores most transcriptions wrapped in slashes.
  const ipa = word.pronunciation?.replace(/^\/+|\/+$/g, '');

  const body = `<nav class="crumb" aria-label="breadcrumb"><a href="${localised(locale, '/words')}">${vi ? 'Từ vựng' : 'Vocabulary'}</a><i>/</i>${esc(word.level)}</nav>
<article style="--tone:${articleTone(word.article)}">
<header class="card"><div class="head">${word.article ? `<span class="art" style="color:var(--tone)">${esc(word.article)}</span>` : ''}<h1 lang="de">${esc(word.word)}</h1><span class="lvl">${esc(word.level)}</span></div>
${ipa ? `<p class="ipa">/${esc(ipa)}/</p>` : ''}
<p class="mean">${esc(meaning)}</p>
${word.translationVi && word.translationEn ? `<p class="alt">${esc(word.translationEn)}</p>` : ''}
${facts ? `<dl>${facts}</dl>` : ''}</header>
${examples}${tips}
<div class="more"><a class="btn" href="${localised(locale, '/words')}">${vi ? `Học thêm từ vựng ${esc(word.level)}` : `More ${esc(word.level)} vocabulary`}</a></div>
</article>`;

  return shell(locale, head, body);
}

export function renderWordNotFound(locale: AppLocale): string {
  const vi = locale === 'vi';
  const heading = vi ? 'Không tìm thấy từ này' : 'Word not found';
  return shell(
    locale,
    `<title>${heading}</title><meta name="robots" content="noindex">`,
    `<h1>${heading}</h1><div class="more"><a class="btn" href="${localised(locale, '/words')}">${vi ? 'Xem danh sách từ vựng' : 'Browse vocabulary'}</a></div>`,
  );
}
