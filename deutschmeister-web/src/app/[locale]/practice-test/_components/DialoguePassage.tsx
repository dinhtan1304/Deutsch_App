'use client';

import { HighlightedText } from '@/components/word-highlight/HighlightedText';
import { ACCENT } from '@/lib/tokens';

export interface DialogueTurn {
  speaker: string;
  text: string;
}

/**
 * Nhận diện passage dạng hội thoại: mỗi lượt nói là một dòng "Name: câu nói".
 * Dòng không có "Name:" ngay sau một lượt được nối vào lượt trước (câu nói
 * xuống dòng). Trả về `null` nếu không đủ tin cậy (dưới 2 người nói hoặc dưới
 * 70% số dòng bắt đầu bằng speaker) — caller fallback về render văn xuôi.
 */
export function parseDialogue(raw: string): DialogueTurn[] | null {
  if (!raw) return null;
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const SPEAKER_RE = /^([A-ZÄÖÜ][^:\n]{0,30}):\s*(.+)$/;
  const turns: DialogueTurn[] = [];
  let speakerLines = 0;

  for (const line of lines) {
    const m = line.match(SPEAKER_RE);
    const prev = turns[turns.length - 1];
    if (m) {
      turns.push({ speaker: (m[1] ?? '').trim(), text: (m[2] ?? '').trim() });
      speakerLines++;
    } else if (prev) {
      prev.text += `\n${line}`;
    } else {
      return null; // văn bản mở đầu không phải lượt nói → không phải dialogue
    }
  }

  const speakers = new Set(turns.map(t => t.speaker));
  if (speakers.size < 2) return null;
  if (speakerLines / lines.length < 0.7) return null;
  return turns;
}

const SIZE = {
  md: { text: 'text-[15px]', name: 'text-xs', bubble: 'px-3.5 py-2.5', avatar: 'w-8 h-8 text-body', gap: 'space-y-3' },
  sm: { text: 'text-xs', name: 'text-caption', bubble: 'px-3 py-2', avatar: 'w-6 h-6 text-caption', gap: 'space-y-2' },
} as const;

/**
 * Render hội thoại như một đoạn chat thật: người nói thứ nhất bên trái, người
 * nói thứ hai bên phải (người thứ 3+ nếu có → bên trái), avatar chữ cái đầu +
 * tên phía trên bubble. Style mượn từ roleplay ChatBubble.
 */
export function DialoguePassage({
  turns, highlight = false, size = 'md',
}: { turns: DialogueTurn[]; highlight?: boolean; size?: 'sm' | 'md' }) {
  const sz = SIZE[size];
  const speakerOrder: string[] = [];
  for (const t of turns) {
    if (!speakerOrder.includes(t.speaker)) speakerOrder.push(t.speaker);
  }

  return (
    <div className={sz.gap}>
      {turns.map((turn, i) => {
        const isRight = speakerOrder.indexOf(turn.speaker) === 1;
        const showName = i === 0 || turns[i - 1]?.speaker !== turn.speaker;

        return (
          <div key={i} className={`flex items-end gap-2 ${isRight ? 'flex-row-reverse' : ''}`}>
            <div
              className={`${sz.avatar} rounded-full flex items-center justify-center font-bold shrink-0 ${isRight ? 'text-white' : 'border'}`}
              style={isRight
                ? { backgroundColor: ACCENT.reading }
                : { backgroundColor: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
              aria-hidden
            >
              {turn.speaker.charAt(0)}
            </div>
            <div className={`max-w-[80%] flex flex-col ${isRight ? 'items-end' : 'items-start'}`}>
              {showName && (
                <span className={`${sz.name} font-semibold mb-0.5 px-1`}
                  style={{ color: isRight ? ACCENT.reading : 'var(--theme-text-muted)' }}>
                  {turn.speaker}
                </span>
              )}
              <div
                className={`${sz.bubble} rounded-[13px] ${isRight ? 'rounded-br-md' : 'rounded-bl-md border'}`}
                style={isRight
                  ? { backgroundColor: `${ACCENT.reading}14` }
                  : { backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
              >
                <p className={`${sz.text} leading-relaxed whitespace-pre-wrap`} style={{ color: 'var(--theme-text-primary)' }}>
                  {highlight ? <HighlightedText text={turn.text} /> : turn.text}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
