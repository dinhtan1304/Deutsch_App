'use client';

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { ACCENT, STATUS } from '@/lib/tokens';
import type { TopicWord } from '@/types/topic';

function IconRotateCcw({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
    </svg>
  );
}
function IconClock({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

const ArticleColor: Record<string, string> = {
  der: ACCENT.srs, die: ACCENT.listening, das: STATUS.success,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = a[i]!;
    a[i] = a[j]!;
    a[j] = temp;
  }
  return a;
}

interface MatchItem {
  id: string;
  wordId: string;
  text: string;
  side: 'left' | 'right';
  color?: string;
}

const ROUND_SIZE = 6;

// ─── State management ───

type MatchState = {
  leftItems: MatchItem[];
  rightItems: MatchItem[];
  selectedLeft: string | null;
  selectedRight: string | null;
  matched: Set<string>;
  wrongPair: { left: string; right: string } | null;
  attempts: number;
  isFinished: boolean;
  startTime: number;
  elapsed: number;
  roundWords: TopicWord[];
};

type MatchAction =
  | { type: 'start'; roundWords: TopicWord[]; left: MatchItem[]; right: MatchItem[]; startTime: number }
  | { type: 'select_left'; id: string | null }
  | { type: 'select_right'; id: string | null }
  | { type: 'correct'; wordId: string }
  | { type: 'wrong'; left: string; right: string }
  | { type: 'clear_wrong' }
  | { type: 'finish' }
  | { type: 'tick'; elapsed: number };

function matchReducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case 'start':
      return {
        leftItems: action.left,
        rightItems: action.right,
        selectedLeft: null,
        selectedRight: null,
        matched: new Set(),
        wrongPair: null,
        attempts: 0,
        isFinished: false,
        startTime: action.startTime,
        elapsed: 0,
        roundWords: action.roundWords,
      };
    case 'select_left':
      return { ...state, selectedLeft: action.id };
    case 'select_right':
      return { ...state, selectedRight: action.id };
    case 'correct': {
      const matched = new Set(state.matched);
      matched.add(action.wordId);
      return { ...state, matched, selectedLeft: null, selectedRight: null, attempts: state.attempts + 1 };
    }
    case 'wrong':
      return { ...state, wrongPair: { left: action.left, right: action.right }, attempts: state.attempts + 1 };
    case 'clear_wrong':
      return { ...state, selectedLeft: null, selectedRight: null, wrongPair: null };
    case 'finish':
      return { ...state, isFinished: true };
    case 'tick':
      return { ...state, elapsed: action.elapsed };
    default:
      return state;
  }
}

const EMPTY_STATE: MatchState = {
  leftItems: [], rightItems: [],
  selectedLeft: null, selectedRight: null,
  matched: new Set(), wrongPair: null,
  attempts: 0, isFinished: false,
  startTime: 0, elapsed: 0, roundWords: [],
};

function buildRound(pool: TopicWord[]): { roundWords: TopicWord[]; left: MatchItem[]; right: MatchItem[] } {
  const roundWords = shuffle(pool).slice(0, Math.min(ROUND_SIZE, pool.length));
  const left: MatchItem[] = shuffle(roundWords.map(w => ({
    id: `l-${w.id}`,
    wordId: w.id,
    text: w.article ? `${w.article} ${w.word}` : w.word,
    side: 'left' as const,
    color: ArticleColor[w.article] || undefined,
  })));
  const right: MatchItem[] = shuffle(roundWords.map(w => ({
    id: `r-${w.id}`,
    wordId: w.id,
    text: w.translationVi || w.translationEn,
    side: 'right' as const,
  })));
  return { roundWords, left, right };
}

// ─── Component ───

interface Props {
  words: TopicWord[];
  topicColor: string;
  onMarkLearned?: (wordId: string) => void;
}

export function TopicMatching({ words, topicColor, onMarkLearned }: Props) {
  const [state, dispatch] = useReducer(matchReducer, EMPTY_STATE);
  const { leftItems, rightItems, selectedLeft, selectedRight, matched, wrongPair, attempts, isFinished, startTime, elapsed, roundWords } = state;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Init / re-init when words change
  useEffect(() => {
    if (words.length >= 3) {
      const round = buildRound(words);
      dispatch({ type: 'start', ...round, startTime: Date.now() });
    }
  }, [words]);

  // Timer
  useEffect(() => {
    if (startTime && !isFinished) {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'tick', elapsed: Math.floor((Date.now() - startTime) / 1000) });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTime, isFinished]);

  const startRound = useCallback((pool?: TopicWord[]) => {
    const round = buildRound(pool ?? words);
    dispatch({ type: 'start', ...round, startTime: Date.now() });
  }, [words]);

  // Match logic runs in click handlers — no effect needed
  const runMatch = useCallback((leftId: string, rightId: string, leftWordId: string, rightWordId: string) => {
    if (leftWordId === rightWordId) {
      dispatch({ type: 'correct', wordId: leftWordId });
      onMarkLearned?.(leftWordId);
      if (matched.size + 1 === roundWords.length) {
        setTimeout(() => dispatch({ type: 'finish' }), 400);
      }
    } else {
      dispatch({ type: 'wrong', left: leftId, right: rightId });
      setTimeout(() => dispatch({ type: 'clear_wrong' }), 600);
    }
  }, [matched, roundWords, onMarkLearned]);

  const handleLeftClick = useCallback((itemId: string) => {
    const item = leftItems.find(i => i.id === itemId);
    if (!item || matched.has(item.wordId)) return;

    if (selectedRight) {
      const rightItem = rightItems.find(i => i.id === selectedRight);
      if (rightItem) runMatch(itemId, selectedRight, item.wordId, rightItem.wordId);
    } else {
      dispatch({ type: 'select_left', id: itemId === selectedLeft ? null : itemId });
    }
  }, [leftItems, rightItems, selectedLeft, selectedRight, matched, runMatch]);

  const handleRightClick = useCallback((itemId: string) => {
    const item = rightItems.find(i => i.id === itemId);
    if (!item || matched.has(item.wordId)) return;

    if (selectedLeft) {
      const leftItem = leftItems.find(i => i.id === selectedLeft);
      if (leftItem) runMatch(selectedLeft, itemId, leftItem.wordId, item.wordId);
    } else {
      dispatch({ type: 'select_right', id: itemId === selectedRight ? null : itemId });
    }
  }, [leftItems, rightItems, selectedLeft, selectedRight, matched, runMatch]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (words.length < 3) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">🔗</div>
        <p style={{ color: 'var(--theme-text-muted)' }}>
          Cần ít nhất 3 từ để chơi nối từ. Chủ đề này có {words.length} từ.
        </p>
      </div>
    );
  }

  // ─── Finished ───
  if (isFinished) {
    const accuracy = attempts > 0 ? Math.round((roundWords.length / attempts) * 100) : 100;
    const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-3">{'⭐'.repeat(stars)}</div>
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          Hoàn thành!
        </h3>
        <div className="flex justify-center gap-6 mb-6 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: topicColor }}>{roundWords.length}</div>
            <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Cặp từ</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>{attempts}</div>
            <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Lần thử</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: STATUS.success }}>{formatTime(elapsed)}</div>
            <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Thời gian</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: accuracy >= 70 ? STATUS.success : ACCENT.xp }}>
              {accuracy}%
            </div>
            <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Chính xác</div>
          </div>
        </div>
        <div className="flex justify-center gap-3">
          <button onClick={() => startRound()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-body font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: `${topicColor}15`, color: topicColor }}>
            <IconRotateCcw size={15} /> Chơi lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-body font-medium" style={{ color: 'var(--theme-text-muted)' }}>
            Nối: {matched.size}/{roundWords.length}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
            Thử: {attempts}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-body" style={{ color: 'var(--theme-text-muted)' }}>
          <IconClock size={14} />
          {formatTime(elapsed)}
        </div>
      </div>

      {/* Progress */}
      <div className="h-1.5 rounded-full overflow-hidden mb-6"
        style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(matched.size / roundWords.length) * 100}%`, backgroundColor: topicColor }} />
      </div>

      {/* Matching grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left column - German */}
        <div className="space-y-2.5">
          <div className="text-caption font-bold uppercase tracking-wide mb-2"
            style={{ color: 'var(--theme-text-muted)' }}>
            🇩🇪 Tiếng Đức
          </div>
          {leftItems.map(item => {
            const isMatched = matched.has(item.wordId);
            const isSelected = selectedLeft === item.id;
            const isWrong = wrongPair?.left === item.id;

            let style: React.CSSProperties = {
              backgroundColor: 'var(--theme-bg-card)',
              borderColor: 'var(--theme-border)',
              color: item.color || 'var(--theme-text-primary)',
            };

            if (isMatched) {
              style = {
                backgroundColor: 'rgba(34,197,94,.08)',
                borderColor: STATUS.success,
                color: STATUS.success,
                opacity: 0.5,
              };
            } else if (isWrong) {
              style = {
                backgroundColor: 'rgba(239,68,68,.08)',
                borderColor: STATUS.danger,
                color: STATUS.danger,
              };
            } else if (isSelected) {
              style = {
                backgroundColor: `${topicColor}10`,
                borderColor: topicColor,
                color: item.color || 'var(--theme-text-primary)',
                boxShadow: `0 0 0 2px ${topicColor}30`,
              };
            }

            return (
              <button key={item.id}
                onClick={() => handleLeftClick(item.id)}
                disabled={isMatched}
                className={`w-full p-3.5 rounded-xl border-2 text-sm font-semibold text-center transition-all
                  ${!isMatched ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
                style={style}>
                {isMatched ? '✓ ' : ''}{item.text}
              </button>
            );
          })}
        </div>

        {/* Right column - Vietnamese */}
        <div className="space-y-2.5">
          <div className="text-caption font-bold uppercase tracking-wide mb-2"
            style={{ color: 'var(--theme-text-muted)' }}>
            🇻🇳 Tiếng Việt
          </div>
          {rightItems.map(item => {
            const isMatched = matched.has(item.wordId);
            const isSelected = selectedRight === item.id;
            const isWrong = wrongPair?.right === item.id;

            let style: React.CSSProperties = {
              backgroundColor: 'var(--theme-bg-card)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
            };

            if (isMatched) {
              style = {
                backgroundColor: 'rgba(34,197,94,.08)',
                borderColor: STATUS.success,
                color: STATUS.success,
                opacity: 0.5,
              };
            } else if (isWrong) {
              style = {
                backgroundColor: 'rgba(239,68,68,.08)',
                borderColor: STATUS.danger,
                color: STATUS.danger,
              };
            } else if (isSelected) {
              style = {
                backgroundColor: `${topicColor}10`,
                borderColor: topicColor,
                color: 'var(--theme-text-primary)',
                boxShadow: `0 0 0 2px ${topicColor}30`,
              };
            }

            return (
              <button key={item.id}
                onClick={() => handleRightClick(item.id)}
                disabled={isMatched}
                className={`w-full p-3.5 rounded-xl border-2 text-sm font-medium text-center transition-all
                  ${!isMatched ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
                style={style}>
                {isMatched ? '✓ ' : ''}{item.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hint */}
      <div className="text-center mt-5 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
        Chọn 1 từ bên trái → chọn nghĩa bên phải để nối
      </div>
    </div>
  );
}
