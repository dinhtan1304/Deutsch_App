/**
 * Personal Word Bank Types
 */

import { ACCENT, STATUS } from '@/lib/tokens';

export type WordType =
  | 'nomen' | 'verb' | 'adjektiv' | 'adverb'
  | 'praposition' | 'konjunktion' | 'pronomen' | 'partikel' | 'andere';

export type Gender = 'masculine' | 'feminine' | 'neuter';
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export const WordTypeInfo: Record<WordType, { label: string; labelDe: string; icon: string; color: string }> = {
  nomen:       { label: 'Danh từ',    labelDe: 'Nomen',        icon: 'N',   color: ACCENT.srs },
  verb:        { label: 'Động từ',    labelDe: 'Verb',         icon: 'V',   color: STATUS.danger },
  adjektiv:    { label: 'Tính từ',    labelDe: 'Adjektiv',     icon: 'Adj', color: ACCENT.xp },
  adverb:      { label: 'Trạng từ',   labelDe: 'Adverb',       icon: 'Adv', color: ACCENT.vocab },
  praposition: { label: 'Giới từ',    labelDe: 'Präposition',  icon: 'Pr',  color: ACCENT.listening },
  konjunktion: { label: 'Liên từ',    labelDe: 'Konjunktion',  icon: 'Kj',  color: ACCENT.teal },
  pronomen:    { label: 'Đại từ',     labelDe: 'Pronomen',     icon: 'Pn',  color: ACCENT.writing },
  partikel:    { label: 'Tiểu từ',    labelDe: 'Partikel',     icon: 'Pt',  color: 'var(--theme-text-muted)' },
  andere:      { label: 'Khác',       labelDe: 'Andere',       icon: 'An',  color: 'var(--theme-text-muted)' },
};

export const GenderInfo: Record<Gender, { article: string; label: string; color: string }> = {
  masculine: { article: 'der', label: 'Maskulin',  color: ACCENT.srs },
  feminine:  { article: 'die', label: 'Feminin',   color: ACCENT.listening },
  neuter:    { article: 'das', label: 'Neutrum',   color: STATUS.success },
};

export interface NomenData { article: 'der' | 'die' | 'das'; gender: Gender; plural?: string; }
export interface VerbData {
  partizipII?: string; hilfsverb?: 'haben' | 'sein'; trennbar?: boolean; prateritum?: string;
  konjugation?: { ich?: string; du?: string; erSieEs?: string; wir?: string; ihr?: string; sieSie?: string; };
}
export interface AdjektivData { komparativ?: string; superlativ?: string; }
export interface PrapositionData { kasus?: ('akkusativ' | 'dativ' | 'genitiv' | 'wechsel')[]; }

export interface PersonalWord {
  id: string;
  word: string;
  wordType: WordType;
  nomenData?: NomenData;
  verbData?: VerbData;
  adjektivData?: AdjektivData;
  prapositionData?: PrapositionData;
  translationEn: string;
  translationVi: string;
  examples: string[];
  level: Level;
  category?: string;
  tags?: string[];
  notes?: string;
  pronunciation?: string;
  isFavorite: boolean;
  
  // SRS Fields
  easeFactor: number;      // SM-2 ease factor (default 2.5, min 1.3)
  interval: number;        // Days until next review
  repetitions: number;     // Consecutive correct reviews
  nextReviewAt: string;    // ISO datetime
  lastReviewAt?: string;   // ISO datetime
  totalReviews: number;
  correctCount: number;
  
  createdAt: string;
  updatedAt: string;
}

// SRS Status helpers
export type SRSStatus = 'new' | 'learning' | 'review' | 'mature';

export function getSRSStatus(word: PersonalWord): SRSStatus {
  if (word.repetitions === 0 && word.totalReviews === 0) return 'new';
  if (word.interval < 7) return 'learning';
  if (word.interval < 21) return 'review';
  return 'mature';
}

export function isDueForReview(word: PersonalWord): boolean {
  return new Date(word.nextReviewAt) <= new Date();
}

export function getIntervalText(interval: number): string {
  if (interval === 0) return 'Hôm nay';
  if (interval === 1) return '1 ngày';
  if (interval < 7) return `${interval} ngày`;
  if (interval < 30) return `${Math.round(interval / 7)} tuần`;
  if (interval < 365) return `${Math.round(interval / 30)} tháng`;
  return `${Math.round(interval / 365)} năm`;
}

export const SRSStatusInfo: Record<SRSStatus, { label: string; color: string; bgColor: string }> = {
  new:      { label: 'Mới',        color: ACCENT.srs,     bgColor: `${ACCENT.srs}26` },
  learning: { label: 'Đang học',   color: ACCENT.xp,      bgColor: `${ACCENT.xp}26` },
  review:   { label: 'Ôn tập',     color: ACCENT.vocab,   bgColor: `${ACCENT.vocab}26` },
  mature:   { label: 'Thuộc lòng', color: STATUS.success, bgColor: `${STATUS.success}26` },
};

export interface ImportRow {
  word: string; wordType: WordType; article?: string; plural?: string;
  partizipII?: string; hilfsverb?: string; komparativ?: string; superlativ?: string; kasus?: string;
  translationEn: string; translationVi: string;
  examples?: string; level?: string; category?: string; tags?: string; notes?: string;
}

export interface ImportResult {
  added: number; skipped: number; failed: number;
  errors: ImportValidationError[]; skippedWords: string[];
}

export interface ImportValidationError { row: number; field: string; message: string; }

export interface WordBankFilters {
  search: string; wordType: WordType | 'all'; level: Level | 'all'; gender: Gender | 'all';
  category: string; favoritesOnly: boolean;
  sortBy: 'word' | 'createdAt' | 'updatedAt' | 'level' | 'wordType'; sortOrder: 'asc' | 'desc';
}

export interface WordCollection {
  id: string;
  name: string;
  color: string;
  icon: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WordCollectionRef {
  id: string;
  name: string;
  color: string;
  icon: string;
}