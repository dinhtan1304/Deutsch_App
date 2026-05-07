'use client';
/* eslint-disable no-restricted-syntax */

import { ACCENT, STATUS } from '@/lib/tokens';
import type { ReviewRating } from '@/types';
import { getDelayText, SRSPreviewResponse } from '@/lib/srs';

interface RatingButtonsProps {
  intervals: SRSPreviewResponse;
  onReview: (rating: ReviewRating) => void;
  disabled?: boolean;
}

const BUTTONS = [
  { rating: 'again' as ReviewRating, label: 'Quên', marker: '1', textColor: '#FCA5A5', bg: 'linear-gradient(160deg, #450a0a, #991b1b)', borderKey: 'danger' },
  { rating: 'hard' as ReviewRating, label: 'Khó', marker: '2', textColor: '#FCD34D', bg: 'linear-gradient(160deg, #431407, #92400e)', borderKey: 'xp' },
  { rating: 'good' as ReviewRating, label: 'Được', marker: '3', textColor: '#86EFAC', bg: 'linear-gradient(160deg, #052e16, #166534)', borderKey: 'success' },
  { rating: 'easy' as ReviewRating, label: 'Dễ', marker: '4', textColor: '#93C5FD', bg: 'linear-gradient(160deg, #0c1a3f, #1e40af)', borderKey: 'srs' },
] as const;

const BORDER_COLORS: Record<string, string> = {
  danger: `${STATUS.danger}73`,
  xp: `${ACCENT.xp}73`,
  success: `${STATUS.success}73`,
  srs: `${ACCENT.srs}73`,
};

export function RatingButtons({ intervals, onReview, disabled = false }: RatingButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {BUTTONS.map(btn => {
        const delayText = getDelayText(intervals[btn.rating].delayMinutes);
        return (
          <button
            key={btn.rating}
            onClick={() => onReview(btn.rating)}
            disabled={disabled}
            title={`Bạn sẽ thấy lại từ này sau ${delayText}`}
            aria-label={`${btn.label} — ôn lại sau ${delayText}`}
            className="relative py-5 rounded-2xl transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl active:scale-95 disabled:opacity-55 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
            style={{ background: btn.bg, border: `1.5px solid ${BORDER_COLORS[btn.borderKey]}` }}
          >
            <span className="absolute top-2 right-2.5 text-caption font-bold" style={{ color: btn.textColor, opacity: 0.55 }}>{btn.marker}</span>
            <div className="text-h2 mb-1.5 leading-none font-black" style={{ color: btn.textColor }}>{btn.marker}</div>
            <div className="text-sm font-extrabold" style={{ color: btn.textColor }}>{btn.label}</div>
            <div className="text-caption mt-0.5 font-medium" style={{ color: btn.textColor, opacity: 0.65 }}>
              {delayText}
            </div>
          </button>
        );
      })}
    </div>
  );
}
