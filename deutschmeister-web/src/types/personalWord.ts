/**
 * Personal Word Bank Types
 */

export type WordType =
  | 'nomen' | 'verb' | 'adjektiv' | 'adverb'
  | 'praposition' | 'konjunktion' | 'pronomen' | 'partikel' | 'andere';

export type Gender = 'masculine' | 'feminine' | 'neuter';
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export const WordTypeInfo: Record<WordType, { label: string; labelDe: string; icon: string; color: string }> = {
  nomen:       { label: 'Danh từ',    labelDe: 'Nomen',        icon: '📦', color: '#3b82f6' },
  verb:        { label: 'Động từ',    labelDe: 'Verb',         icon: '⚡', color: '#ef4444' },
  adjektiv:    { label: 'Tính từ',    labelDe: 'Adjektiv',     icon: '🎨', color: '#f59e0b' },
  adverb:      { label: 'Trạng từ',   labelDe: 'Adverb',       icon: '💨', color: '#8b5cf6' },
  praposition: { label: 'Giới từ',    labelDe: 'Präposition',  icon: '📍', color: '#ec4899' },
  konjunktion: { label: 'Liên từ',    labelDe: 'Konjunktion',  icon: '🔗', color: '#14b8a6' },
  pronomen:    { label: 'Đại từ',     labelDe: 'Pronomen',     icon: '👤', color: '#6366f1' },
  partikel:    { label: 'Tiểu từ',    labelDe: 'Partikel',     icon: '✨', color: '#78716c' },
  andere:      { label: 'Khác',       labelDe: 'Andere',       icon: '📝', color: '#64748b' },
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
  id: string; word: string; wordType: WordType;
  nomenData?: NomenData; verbData?: VerbData; adjektivData?: AdjektivData; prapositionData?: PrapositionData;
  translationEn: string; translationVi: string;
  examples: string[]; level: Level; category?: string; tags?: string[]; notes?: string; pronunciation?: string;
  createdAt: string; updatedAt: string; isFavorite: boolean; reviewCount: number; lastReviewedAt?: string;
}

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