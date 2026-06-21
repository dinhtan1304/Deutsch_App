'use client';

import { useCallback } from 'react';
import { useMyReferralInfo } from './useReferral';
import { trackShareResult } from '@/lib/analytics';

export type ShareSkill = 'reading' | 'writing' | 'listening' | 'speaking';

export interface ShareResultArgs {
  /** Skill being shared — drives the card's colour + label. */
  skill: ShareSkill;
  /** Score as a 0–100 percentage. */
  score: number;
  /** CEFR level, e.g. 'B1' (optional). */
  level?: string;
  /** Localized share-sheet title (pages already build these via next-intl). */
  title: string;
  /** Localized share-sheet text. */
  text: string;
}

/**
 * Unified result-sharing for the viral loop. Builds a dynamic score card
 * (`/api/share-card`) embedding the user's referral code + discount, shares it
 * as an image file where supported (best on mobile → Zalo/Facebook/Messenger),
 * and falls back to URL share, then clipboard. Emits a `share_result` GA event.
 *
 * Pages keep owning their localized `title`/`text`; this hook adds the image,
 * the `?ref=` link, and tracking — so the ~8 result pages stop duplicating logic.
 */
export function useShareResult() {
  const { data: referral } = useMyReferralInfo();
  const code = referral?.code;
  const pct = referral?.refereeDiscountPct;

  return useCallback(
    async ({ skill, score, level, title, text }: ShareResultArgs) => {
      if (typeof window === 'undefined') return;
      const rounded = Math.round(score);
      const origin = window.location.origin;
      const lang = document.documentElement.lang || 'vi';
      // Point at the register form so the code prefills directly (matches the
      // /referral page's share link — no landing-page ref persistence needed).
      const shareUrl = code ? `${origin}/auth/register?ref=${code}` : origin;

      const params = new URLSearchParams({ score: String(rounded), skill, lang });
      if (level) params.set('level', level);
      if (code) params.set('code', code);
      if (pct) params.set('pct', String(pct));
      const cardUrl = `${origin}/api/share-card?${params.toString()}`;

      trackShareResult(skill, rounded, !!code);

      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };

      try {
        // Preferred: share the score card image as a file (mobile share sheet).
        if (nav.canShare) {
          const res = await fetch(cardUrl);
          if (res.ok) {
            const blob = await res.blob();
            const file = new File([blob], 'deutschmeister-result.png', { type: 'image/png' });
            if (nav.canShare({ files: [file] })) {
              await nav.share({ files: [file], title, text: `${text}\n${shareUrl}` });
              return;
            }
          }
        }
        // Fallback: share the referral URL + text.
        if (nav.share) {
          await nav.share({ title, text, url: shareUrl });
          return;
        }
        // Last resort: copy the referral link.
        await navigator.clipboard?.writeText(shareUrl);
      } catch {
        /* user dismissed the share sheet, or a transient error — ignore */
      }
    },
    [code, pct],
  );
}
