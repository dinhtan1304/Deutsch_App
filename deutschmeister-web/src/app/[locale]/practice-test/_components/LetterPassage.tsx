'use client';

import { HighlightedText } from '@/components/word-highlight/HighlightedText';
import { ACCENT } from '@/lib/tokens';

interface ParsedLetter {
  greeting?: string;
  body: string;
  signature?: string;
}

const GREETING_RE = /^(Liebe[rs]?\b|Hallo\b|Sehr geehrte|Guten Tag\b|Hi\b|Hey\b)/;
const CLOSING_RE = /^((Viele|Liebe|Herzliche|Beste)\s+Grüße|Mit freundlichen Grüßen|Mit besten Grüßen|(LG|VG)\b|Bis (bald|dann|später)\b|Dein[e]?\b|Ihr[e]?\b|Alles (Liebe|Gute)\b)/;

/**
 * Tách thư/email thành chào (Anrede) / thân / chữ ký (Grußformel + tên) bằng
 * heuristic theo dòng. Từng phần đều optional — không nhận diện được thì phần
 * đó nằm luôn trong body, khung thư vẫn render bình thường.
 */
function parseLetter(raw: string): ParsedLetter {
  const lines = raw.split('\n');
  let start = 0;
  while (start < lines.length && !(lines[start] ?? '').trim()) start++;

  let greeting: string | undefined;
  const firstLine = (lines[start] ?? '').trim();
  if (firstLine && GREETING_RE.test(firstLine)) {
    greeting = firstLine;
    start++;
  }

  // Quét ngược tối đa 4 dòng cuối tìm dòng Grußformel → từ đó tới hết là chữ ký.
  // Dòng Grußformel phải ngắn và không kết thúc bằng dấu câu, để câu thân bài
  // kiểu "Ihre Bestellung ist angekommen." không bị nhận nhầm là chữ ký.
  let end = lines.length;
  while (end > start && !(lines[end - 1] ?? '').trim()) end--;
  let sigStart = -1;
  for (let i = end - 1; i >= Math.max(start, end - 4); i--) {
    const line = (lines[i] ?? '').trim();
    if (CLOSING_RE.test(line) && line.length <= 40 && !/[.?]$/.test(line)) sigStart = i;
  }

  let signature = sigStart >= 0
    ? lines.slice(sigStart, end).map(l => l.trim()).filter(Boolean).join('\n')
    : undefined;
  let body = lines.slice(start, sigStart >= 0 ? sigStart : end).join('\n').trim();
  if (!body && signature) {
    body = signature;
    signature = undefined;
  }

  return { greeting, body, signature };
}

const SIZE = {
  md: { text: 'text-[15px]', header: 'text-body', label: 'text-xs', pad: 'p-4', headerPad: 'px-4 py-2.5', gap: 'space-y-3' },
  sm: { text: 'text-xs', header: 'text-xs', label: 'text-caption', pad: 'p-3', headerPad: 'px-3 py-2', gap: 'space-y-2' },
} as const;

/**
 * Render passage dạng thư/email như một email card (header Von/Betreff + chào
 * + thân + chữ ký) hoặc dạng SMS như bubble tin nhắn đơn (variant 'sms').
 * Nhãn "Von/Betreff" là tiếng Đức thuộc ngữ liệu học, không cần i18n.
 */
export function LetterPassage({
  content, variant = 'letter', title, author, highlight = false, size = 'md',
}: {
  content: string;
  variant?: 'letter' | 'sms';
  title?: string;
  author?: string;
  highlight?: boolean;
  size?: 'sm' | 'md';
}) {
  const sz = SIZE[size];
  const wrap = (text: string) => (highlight ? <HighlightedText text={text} /> : text);

  if (variant === 'sms') {
    return (
      <div className="flex items-end gap-2">
        <span className={size === 'sm' ? 'text-sm' : 'text-lg'} aria-hidden>💬</span>
        <div className={`max-w-[85%] rounded-[18px] rounded-bl-md border ${sz.pad}`}
          style={{ backgroundColor: `${ACCENT.reading}0D`, borderColor: `${ACCENT.reading}33` }}>
          <p className={`${sz.text} leading-relaxed whitespace-pre-wrap`} style={{ color: 'var(--theme-text-primary)' }}>
            {wrap(content)}
          </p>
        </div>
      </div>
    );
  }

  const { greeting, body, signature } = parseLetter(content);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--theme-border)' }}>
      {(title || author) && (
        <div className={`${sz.headerPad} border-b flex flex-col gap-0.5`}
          style={{ backgroundColor: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)' }}>
          {author && (
            <p className={`${sz.header} min-w-0`} style={{ color: 'var(--theme-text-primary)' }}>
              <span aria-hidden>✉️ </span>
              <span className={`${sz.label} font-semibold`} style={{ color: 'var(--theme-text-muted)' }}>Von: </span>
              <span className="font-semibold">{author}</span>
            </p>
          )}
          {title && (
            <p className={`${sz.header} min-w-0`} style={{ color: 'var(--theme-text-primary)' }}>
              {!author && <span aria-hidden>✉️ </span>}
              <span className={`${sz.label} font-semibold`} style={{ color: 'var(--theme-text-muted)' }}>Betreff: </span>
              <span className="font-semibold">{title}</span>
            </p>
          )}
        </div>
      )}
      <div className={`${sz.pad} ${sz.gap}`} style={{ backgroundColor: 'var(--theme-bg-card)' }}>
        {greeting && (
          <p className={`${sz.text} font-semibold leading-relaxed`} style={{ color: 'var(--theme-text-primary)' }}>
            {wrap(greeting)}
          </p>
        )}
        <p className={`${sz.text} leading-relaxed whitespace-pre-wrap`} style={{ color: 'var(--theme-text-primary)' }}>
          {wrap(body)}
        </p>
        {signature && (
          <p className={`${sz.text} italic leading-relaxed whitespace-pre-wrap`} style={{ color: 'var(--theme-text-secondary)' }}>
            {wrap(signature)}
          </p>
        )}
      </div>
    </div>
  );
}
