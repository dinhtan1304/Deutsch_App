'use client';

import { HighlightedText } from '@/components/word-highlight/HighlightedText';
import { ACCENT, GRADIENT } from '@/lib/tokens';

interface StructuredPassageProps {
  content: string;
  /** Wrap text in HighlightedText for vocab coloring (answering view). */
  highlight?: boolean;
  /** 'md' = answering view, 'sm' = compact result view. */
  size?: 'sm' | 'md';
}

interface DirSection {
  header: string;
  entries: string[];
}

interface ParsedDirectory {
  intro?: string;
  sections: DirSection[];
}

/**
 * Wegweiser/Verzeichnis (danh bạ) do AI sinh ra là một chuỗi liền nhau với dấu
 * phân cách nằm cùng dòng: ` --- ` giữa các tầng, ` - ` giữa các mục. Hàm này
 * tách chuỗi đó thành cấu trúc tầng → mục để render dễ đọc.
 *
 * Trả về `null` nếu nội dung KHÔNG phải dạng danh bạ (văn xuôi thường) — khi đó
 * caller render fallback đoạn văn như cũ.
 */
function parseDirectory(raw: string): ParsedDirectory | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // Chỉ coi là danh bạ khi có dấu phân cách tầng ` --- ` (hoặc bắt đầu bằng ---)
  if (!trimmed.includes(' --- ') && !/^-{3,}/.test(trimmed)) return null;

  const content = trimmed.replace(/^-{3,}\s*/, '');
  const blocks = content
    .split(/\s*-{3,}\s*/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (blocks.length === 0) return null;

  // Khối đầu là intro/tiêu đề nếu không chứa mục con (` - ` hoặc xuống dòng).
  let intro: string | undefined;
  let floorBlocks = blocks;
  const first = blocks[0] ?? '';
  const firstHasEntries = / - /.test(first) || /\n/.test(first);
  if (!firstHasEntries && blocks.length > 1) {
    intro = first;
    floorBlocks = blocks.slice(1);
  }

  const sections = floorBlocks
    .map((block) => {
      const parts = block
        .replace(/^-\s*/, '')
        .split(/\s+-\s+|\n+/)
        .map((p) => p.trim())
        .filter(Boolean);
      const header = (parts[0] ?? '').replace(/\s*:\s*$/, '');
      return { header, entries: parts.slice(1) };
    })
    .filter((s) => s.header || s.entries.length > 0);

  if (sections.length === 0) return null;
  return { intro, sections };
}

const SIZE = {
  md: { gap: 'space-y-3', intro: 'text-[15px]', card: 'p-3', badge: 'text-xs px-2.5 py-1', entry: 'text-[15px]', entryGap: 'space-y-1.5' },
  sm: { gap: 'space-y-2', intro: 'text-xs', card: 'p-2.5', badge: 'text-[10px] px-2 py-0.5', entry: 'text-xs', entryGap: 'space-y-1' },
} as const;

/**
 * Render một passage phần đọc. Nếu nội dung là Wegweiser/danh bạ → chia thành
 * các section card (mỗi tầng một card, mục giãn cách). Ngược lại → đoạn văn
 * thường (giữ nguyên hành vi cũ).
 */
export function StructuredPassage({ content, highlight = false, size = 'md' }: StructuredPassageProps) {
  const sz = SIZE[size];
  const parsed = parseDirectory(content);

  if (!parsed) {
    return (
      <p className={`${sz.entry} leading-relaxed whitespace-pre-wrap`} style={{ color: 'var(--theme-text-primary)' }}>
        {highlight ? <HighlightedText text={content} /> : content}
      </p>
    );
  }

  return (
    <div className={sz.gap}>
      {parsed.intro && (
        <p className={`${sz.intro} font-bold leading-snug`} style={{ color: 'var(--theme-text-primary)' }}>
          {highlight ? <HighlightedText text={parsed.intro} /> : parsed.intro}
        </p>
      )}

      {parsed.sections.map((section, si) => (
        <div
          key={si}
          className={`rounded-xl border ${sz.card}`}
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
        >
          {section.header && (
            <div className="mb-2">
              <span
                className={`inline-block rounded-lg font-extrabold text-white ${sz.badge}`}
                style={{ background: GRADIENT.reading }}
              >
                {section.header}
              </span>
            </div>
          )}

          {section.entries.length > 0 && (
            <ul className={sz.entryGap}>
              {section.entries.map((entry, ei) => (
                <li key={ei} className={`flex gap-2 ${sz.entry} leading-relaxed`} style={{ color: 'var(--theme-text-primary)' }}>
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: ACCENT.reading }}
                  />
                  <span className="min-w-0">
                    {highlight ? <HighlightedText text={entry} /> : entry}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
