/**
 * SRS display utilities. Scheduling and preview calculations are owned by the
 * backend.
 */

import { Progress, ReviewRating } from '@/types';

export interface SRSPreviewItem {
  interval: number;
  nextReviewAt: string;
  delayMinutes: number;
}

export type SRSPreviewResponse = Record<ReviewRating, SRSPreviewItem>;

export function getIntervalText(interval: number): string {
  if (interval <= 0) return '10 phut';
  if (interval === 1) return '1 ngay';
  if (interval < 7) return `${interval} ngay`;
  if (interval < 30) return `${Math.round(interval / 7)} tuan`;
  if (interval < 365) return `${Math.round(interval / 30)} thang`;
  return `${Math.round(interval / 365)} nam`;
}

export function getDelayText(delayMinutes: number): string {
  if (delayMinutes < 60) return `${delayMinutes} phut`;
  const hours = Math.round(delayMinutes / 60);
  if (hours < 24) return `${hours} gio`;
  const days = Math.round(delayMinutes / 1440);
  return getIntervalText(days);
}

export function getCardStatus(card: Progress): 'new' | 'learning' | 'review' | 'mature' {
  if (card.repetitions === 0 && card.totalReviews === 0) return 'new';
  if (card.interval < 7) return 'learning';
  if (card.interval < 21) return 'review';
  return 'mature';
}
