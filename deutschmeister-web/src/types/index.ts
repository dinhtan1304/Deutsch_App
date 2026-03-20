// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  createdAt: string;
  settings?: Settings;
}

export interface Settings {
  id: string;
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  dailyGoal: number;
  preferredLevel: string;
  showVietnamese: boolean;
}

// Auth types
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

// Word types
export type Gender = 'masculine' | 'feminine' | 'neuter';
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Word {
  id: string;
  word: string;
  article: string;
  gender: Gender;
  plural: string | null;
  pronunciation: string | null;
  imageUrl: string | null;
  translationEn: string;
  translationVi: string | null;
  category: string;
  level: CEFRLevel;
  examples: string[];
  tips: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchWordsParams {
  search?: string;
  gender?: Gender;
  category?: string;
  level?: CEFRLevel;
  page?: number;
  limit?: number;
}

// Game types
export type GameType = 'quick-quiz' | 'flashcard' | 'fill-blank' | 'timed-challenge' | 'gender-quiz' | 'matching' | 'spelling' | 'listening' | 'sentence-builder';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface GameSession {
  id: string;
  gameType: GameType;
  difficulty: Difficulty;
  category: string | null;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
  bestStreak: number;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
}

export interface StartGameDto {
  gameType: GameType;
  difficulty: Difficulty;
  category?: string;
  totalQuestions?: number;
}

// Favorite & History
export interface Favorite {
  id: string;
  wordId: string;
  word: Word;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  wordId: string;
  word: Word;
  viewedAt: string;
}

// Progress (SRS)
export interface Progress {
  id: string;
  wordId: string;
  word: Word;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: string;
  lastReviewAt: string | null;
  totalReviews: number;
  correctCount: number;
}

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

// Stats
export interface UserStats {
  gamesPlayed: number;
  totalAnswers: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  favorites: number;
  wordsLearned: number;
}

// Constants
export const GenderInfo = {
  masculine: { article: 'der', color: 'blue', label: 'Maskulin' },
  feminine: { article: 'die', color: 'pink', label: 'Feminin' },
  neuter: { article: 'das', color: 'green', label: 'Neutrum' },
} as const;

export const CATEGORIES = [
  'persoenliche-angaben', 'familie-freunde', 'wohnen', 'essen-trinken',
  'einkaufen', 'koerper-gesundheit', 'arbeit-beruf', 'schule-ausbildung',
  'freizeit-hobbys', 'reisen-verkehr', 'natur-wetter', 'medien-kommunikation',
] as const;

export const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];