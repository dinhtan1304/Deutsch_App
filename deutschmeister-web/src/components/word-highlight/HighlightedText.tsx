'use client';

import { useMemo } from 'react';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { useWordHighlightStore } from '@/stores/wordHighlightStore';

interface HighlightedTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Cấu hình màu cho từng level CEFR.
 * underline = màu gạch chân
 * bg = màu nền nhẹ khi hover
 * dot = màu chấm indicator
 */
// Module-level constant — không re-create trong mỗi lần render
const SKIP_WORDS = new Set(['der','die','das','ein','eine','einer','einem','einen','eines',
  'ist','sind','war','waren','hat','haben','ich','du','er','sie','es','wir','ihr',
  'und','oder','aber','denn','weil','dass','mit','von','zu','in','an','auf','für',
  'im','am','um','bei','nach','vor','über','unter','durch','ohne','gegen','nicht',
  'auch','noch','nur','schon','sehr','wie','was','wer','wo','wenn','dann','als']);

const LEVEL_COLORS: Record<string, { underline: string; bg: string; dot: string }> = {
  A1: { underline: STATUS.success, bg: 'rgba(34, 197, 94, 0.12)', dot: STATUS.success },
  A2: { underline: ACCENT.srs, bg: 'rgba(59, 130, 246, 0.12)', dot: ACCENT.srs },
  B1: { underline: ACCENT.vocab, bg: 'rgba(139, 92, 246, 0.12)', dot: ACCENT.vocab },
  B2: { underline: ACCENT.xp, bg: 'rgba(245, 158, 11, 0.12)', dot: ACCENT.xp },
  C1: { underline: STATUS.danger, bg: 'rgba(239, 68, 68, 0.12)', dot: STATUS.danger },
};

/**
 * Tách text thành tokens (giữ nguyên khoảng trắng + dấu câu).
 * "Der Apfel ist rot." → ["Der", " ", "Apfel", " ", "ist", " ", "rot", "."]
 */
function tokenize(text: string): string[] {
  return text.match(/[a-zA-ZäöüÄÖÜß]+|[^a-zA-ZäöüÄÖÜß]+/g) || [text];
}

/**
 * Component hiển thị text tiếng Đức với từ vựng được tô màu theo level CEFR.
 *
 * - A1: 🟢 xanh lá (beginner)
 * - A2: 🔵 xanh dương (elementary)
 * - B1: 🟣 tím (intermediate)
 * - B2: 🟡 vàng cam (upper-intermediate)
 * - C1: 🔴 đỏ (advanced)
 *
 * Từ không có trong DB → không highlight.
 */
export function HighlightedText({ text, className, style }: HighlightedTextProps) {
  const { enabled, levelIndex } = useWordHighlightStore();

  const elements = useMemo(() => {
    // Nếu tắt hoặc chưa có data → trả về text thường
    if (!enabled || !levelIndex) return null;

    const tokens = tokenize(text);

    return tokens.map((token, i) => {
      // Chỉ check từ (bỏ qua khoảng trắng, dấu câu)
      const isWord = /^[a-zA-ZäöüÄÖÜß]+$/.test(token);
      if (!isWord) return <span key={i}>{token}</span>;

      const lower = token.toLowerCase();
      if (SKIP_WORDS.has(lower)) return <span key={i}>{token}</span>;

      const level = levelIndex[lower];

      if (!level || !LEVEL_COLORS[level]) {
        return <span key={i}>{token}</span>;
      }

      const colors = LEVEL_COLORS[level];

      return (
        <span
          key={i}
          className="wh-word"
          data-level={level}
          title={`${level} — Click để tra cứu`}
          style={{
            borderBottom: `2px solid ${colors.underline}`,
            borderRadius: '1px',
            paddingBottom: '1px',
            cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = colors.bg;
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'transparent';
          }}
        >
          {token}
        </span>
      );
    });
  }, [text, enabled, levelIndex]);

  // Nếu tắt hoặc chưa load → render text thường
  if (!elements) {
    return <span className={className} style={style}>{text}</span>;
  }

  return (
    <span className={className} style={style}>
      {elements}
    </span>
  );
}

/**
 * Legend component — hiển thị chú thích màu sắc.
 * Đặt ở header Grammar lesson hoặc bất kỳ đâu.
 */
export function HighlightLegend() {
  const { enabled, toggle } = useWordHighlightStore();

  return (
    <div className="wh-legend">
      <button onClick={toggle} className="wh-toggle" title={enabled ? 'Tắt tô màu' : 'Bật tô màu'}>
        <span style={{ fontSize: '14px' }}>{enabled ? '🎨' : '⬜'}</span>
        <span>{enabled ? 'Tô màu: BẬT' : 'Tô màu: TẮT'}</span>
      </button>

      {enabled && (
        <div className="wh-legend-items">
          {Object.entries(LEVEL_COLORS).map(([level, colors]) => (
            <span key={level} className="wh-legend-item">
              <span className="wh-legend-dot" style={{ backgroundColor: colors.dot }} />
              {level}
            </span>
          ))}
        </div>
      )}

      <style jsx>{`
        .wh-legend {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .wh-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 8px;
          border: 1px solid var(--theme-border, #334155);
          background: var(--theme-bg-card, #1E293B);
          color: var(--theme-text-secondary, #94A3B8);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .wh-toggle:hover {
          border-color: var(--theme-primary, #6366F1);
          color: var(--theme-text-primary, #F1F5F9);
        }
        .wh-legend-items {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .wh-legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--theme-text-secondary, #94A3B8);
        }
        .wh-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}