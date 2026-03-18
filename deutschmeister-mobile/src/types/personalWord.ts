/**
 * Personal Word Bank Types
 */

export type WordType =
  | 'nomen' | 'verb' | 'adjektiv' | 'adverb'
  | 'praposition' | 'konjunktion' | 'pronomen' | 'partikel' | 'andere';

export type Gender = 'masculine' | 'feminine' | 'neuter';
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export const WordTypeInfo: Record<WordType, { label: string; labelDe: string; icon: string; color: string }> = {
  nomen:       { label: 'Danh tu',    labelDe: 'Nomen',        icon: '\u{1F4E6}', color: '#3b82f6' },
  verb:        { label: 'Dong tu',    labelDe: 'Verb',         icon: '\u26A1',     color: '#ef4444' },
  adjektiv:    { label: 'Tinh tu',    labelDe: 'Adjektiv',     icon: '\u{1F3A8}', color: '#f59e0b' },
  adverb:      { label: 'Trang tu',   labelDe: 'Adverb',       icon: '\u{1F4A8}', color: '#8b5cf6' },
  praposition: { label: 'Gioi tu',    labelDe: 'Praposition',  icon: '\u{1F4CD}', color: '#ec4899' },
  konjunktion: { label: 'Lien tu',    labelDe: 'Konjunktion',  icon: '\u{1F517}', color: '#14b8a6' },
  pronomen:    { label: 'Dai tu',     labelDe: 'Pronomen',     icon: '\u{1F464}', color: '#6366f1' },
  partikel:    { label: 'Tieu tu',    labelDe: 'Partikel',     icon: '\u2728',     color: '#78716c' },
  andere:      { label: 'Khac',       labelDe: 'Andere',       icon: '\u{1F4DD}', color: '#64748b' },
};

export const GenderInfo: Record<Gender, { article: string; label: string; color: string }> = {
  masculine: { article: 'der', label: 'Maskulin',  color: '#3b82f6' },
  feminine:  { article: 'die', label: 'Feminin',   color: '#ec4899' },
  neuter:    { article: 'das', label: 'Neutrum',   color: '#22c55e' },
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
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: string;
  lastReviewAt?: string;
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
  if (interval === 0) return 'Hom nay';
  if (interval === 1) return '1 ngay';
  if (interval < 7) return `${interval} ngay`;
  if (interval < 30) return `${Math.round(interval / 7)} tuan`;
  if (interval < 365) return `${Math.round(interval / 30)} thang`;
  return `${Math.round(interval / 365)} nam`;
}

export const SRSStatusInfo: Record<SRSStatus, { label: string; color: string; bgColor: string }> = {
  new:      { label: 'Moi',        color: '#3b82f6', bgColor: '#dbeafe' },
  learning: { label: 'Dang hoc',   color: '#f59e0b', bgColor: '#fef3c7' },
  review:   { label: 'On tap',     color: '#8b5cf6', bgColor: '#ede9fe' },
  mature:   { label: 'Thuoc long', color: '#22c55e', bgColor: '#dcfce7' },
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
