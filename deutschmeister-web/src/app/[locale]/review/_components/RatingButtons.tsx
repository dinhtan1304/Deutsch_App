'use client';

import { useTranslations } from 'next-intl';
import { ACCENT, STATUS } from '@/lib/tokens';
import type { ReviewRating } from '@/types';
import { getDelayText, SRSPreviewResponse } from '@/lib/srs';

interface RatingButtonsProps {
  intervals: SRSPreviewResponse;
  onReview: (rating: ReviewRating) => void;
  disabled?: boolean;
}

// Calm design: bg-card + colored border/label/interval per rating, key badge top-right.
const BUTTONS = [
  { rating: 'again' as ReviewRating, labelKey: 'ratingAgain' as const, marker: '1', color: STATUS.danger },
  { rating: 'hard' as ReviewRating, labelKey: 'ratingHard' as const, marker: '2', color: ACCENT.xp },
  { rating: 'good' as ReviewRating, labelKey: 'ratingGood' as const, marker: '3', color: ACCENT.srs },
  { rating: 'easy' as ReviewRating, labelKey: 'ratingEasy' as const, marker: '4', color: STATUS.success },
] as const;

export function RatingButtons({ intervals, onReview, disabled = false }: RatingButtonsProps) {
  const t = useTranslations('progress.review');
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {BUTTONS.map(btn => {
        const delayText = getDelayText(intervals[btn.rating].delayMinutes);
        const label = t(btn.labelKey);
        return (
          <button
            key={btn.rating}
            onClick={() => onReview(btn.rating)}
            disabled={disabled}
            title={t('seeAgainAfter', { delay: delayText })}
            aria-label={t('ratingAria', { label, delay: delayText })}
            style={{ ['--rate' as string]: btn.color } as React.CSSProperties}
            className="v2-rate-btn relative flex h-[72px] flex-col items-center justify-center gap-1 rounded-[14px] border-[1.5px] transition-all duration-150 hover:-translate-y-0.5 active:scale-95 disabled:opacity-55 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
          >
            <kbd className="mono absolute right-2.5 top-2 rounded-xs px-1.5 text-[10px] font-bold"
              style={{ background: 'var(--theme-bg-secondary)', color: btn.color }}>{btn.marker}</kbd>
            <span className="text-[17px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{label}</span>
            <span className="mono text-[11px] font-medium" style={{ color: btn.color }}>⟲ {delayText}</span>
          </button>
        );
      })}
    </div>
  );
}
