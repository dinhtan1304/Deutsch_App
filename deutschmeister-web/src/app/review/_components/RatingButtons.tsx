'use client';
/* eslint-disable no-restricted-syntax */

import { ACCENT, STATUS } from '@/lib/tokens';
import type { ReviewRating } from '@/types';
import { getIntervalText } from '@/lib/srs';

interface Intervals {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

interface RatingButtonsProps {
  intervals: Intervals;
  onReview: (rating: ReviewRating) => void;
}

const BUTTONS = [
  { rating: 'again' as ReviewRating, label: 'Quên', emoji: '😵', textColor: '#FCA5A5', bg: 'linear-gradient(160deg, #450a0a, #991b1b)', borderKey: 'danger',   hotkey: '1' },
  { rating: 'hard'  as ReviewRating, label: 'Khó',  emoji: '😓', textColor: '#FCD34D', bg: 'linear-gradient(160deg, #431407, #92400e)', borderKey: 'xp',       hotkey: '2' },
  { rating: 'good'  as ReviewRating, label: 'Được', emoji: '🙂', textColor: '#86EFAC', bg: 'linear-gradient(160deg, #052e16, #166534)', borderKey: 'success',   hotkey: '3' },
  { rating: 'easy'  as ReviewRating, label: 'Dễ',   emoji: '😎', textColor: '#93C5FD', bg: 'linear-gradient(160deg, #0c1a3f, #1e40af)', borderKey: 'srs',      hotkey: '4' },
] as const;

const BORDER_COLORS: Record<string, string> = {
  danger: `${STATUS.danger}73`,
  xp: `${ACCENT.xp}73`,
  success: `${STATUS.success}73`,
  srs: `${ACCENT.srs}73`,
};

export function RatingButtons({ intervals, onReview }: RatingButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {BUTTONS.map(btn => (
        <button
          key={btn.rating}
          onClick={() => onReview(btn.rating)}
          title={`Bạn sẽ thấy lại từ này sau ${getIntervalText(intervals[btn.rating])}`}
          className="relative py-5 rounded-2xl transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl active:scale-95"
          style={{ background: btn.bg, border: `1.5px solid ${BORDER_COLORS[btn.borderKey]}` }}
        >
          <span className="absolute top-2 right-2.5 text-caption font-bold" style={{ color: btn.textColor, opacity: 0.55 }}>{btn.hotkey}</span>
          <div className="text-h1 mb-1.5 leading-none">{btn.emoji}</div>
          <div className="text-sm font-extrabold" style={{ color: btn.textColor }}>{btn.label}</div>
          <div className="text-caption mt-0.5 font-medium" style={{ color: btn.textColor, opacity: 0.65 }}>
            {getIntervalText(intervals[btn.rating])}
          </div>
        </button>
      ))}
    </div>
  );
}
