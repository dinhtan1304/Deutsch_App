import { apiGet, apiPost } from './client';
import type { TrainerExercise, TrainerMode } from './grammarTrainer';

export type SrsRating = 'again' | 'hard' | 'good' | 'easy';

export interface SrsPreviewItem {
  interval: number;
  nextReviewAt: string;
  delayMinutes: number;
}
export type SrsPreview = Record<SrsRating, SrsPreviewItem>;

export interface GrammarSrsModeStat {
  due: boolean;
  interval: number;
  nextReviewAt: string;
  level: string;
  nearGraduation: boolean;
}

export interface GrammarSrsStats {
  total: number;
  due: number;
  mastered: number;
  learning: number;
  new: number;
  byMode: Record<string, GrammarSrsModeStat>;
}

export interface GrammarSrsSession {
  mode: TrainerMode;
  level: string;
  exercises: TrainerExercise[];
  preview: SrsPreview;
}

export interface GrammarSrsReviewPayload {
  mode: TrainerMode;
  level?: string;
  totalItems: number;
  correctItems: number;
  durationMs?: number;
  breakdown?: Record<string, unknown>;
}

export interface GrammarSrsReviewResult {
  mode: TrainerMode;
  rating: SrsRating;
  interval: number;
  nextReviewAt: string;
  xpEarned: number;
  leveledUp: boolean;
  newLevel?: number;
  /** CEFR difficulty adapted after this session (adaptive difficulty). */
  levelChanged?: { from: string; to: string; direction: 'up' | 'down' };
}

export const getGrammarSrsStats = () => apiGet<GrammarSrsStats>('/grammar-srs/stats');

export const getGrammarSrsSession = (mode: TrainerMode) =>
  apiGet<GrammarSrsSession>(`/grammar-srs/session?mode=${encodeURIComponent(mode)}`);

export const reviewGrammarSrs = (payload: GrammarSrsReviewPayload) =>
  apiPost<GrammarSrsReviewResult>('/grammar-srs/review', payload);
