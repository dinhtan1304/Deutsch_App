// ============================================
/* eslint-disable no-restricted-syntax */
// Topic Types
// ============================================

import { ACCENT } from '@/lib/tokens';

export interface Topic {
  id: string;
  slug: string;
  nameDe: string;
  nameEn: string;
  nameVi: string;
  descriptionDe?: string;
  descriptionEn?: string;
  descriptionVi?: string;
  icon?: string;
  color?: string;
  imageUrl?: string;
  level: string;
  order: number;
  isActive: boolean;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TopicWord {
  id: string;
  word: string;
  article: string;
  gender: 'masculine' | 'feminine' | 'neuter';
  plural?: string;
  pronunciation?: string;
  translationEn: string;
  translationVi?: string;
  imageUrl?: string;
  examples?: string[];
  tips?: string[];
  isCore: boolean;
  order: number;
}

export interface TopicWithWords extends Topic {
  words: TopicWord[];
}

export interface TopicProgress {
  topicId: string;
  wordsLearned: number;
  wordsTotal: number;
  masteryPercent: number;
  lastStudiedAt?: string;
  completedAt?: string;
}

export interface TopicWithProgress extends Topic {
  wordsLearned: number;
  wordsTotal: number;
  masteryPercent: number;
  lastStudiedAt?: string;
  completedAt?: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface TopicsQueryParams {
  level?: string;
  isActive?: boolean;
  includeWords?: boolean;
  page?: number;
  limit?: number;
}

export interface TopicsListResponse {
  data: Topic[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TopicsStats {
  totalTopics: number;
  totalWords: number;
  byLevel: { level: string; count: number }[];
}

// ============================================
// Gender helpers (for display)
// ============================================

export const GenderInfo: Record<string, { article: string; color: string; bgColor: string }> = {
  masculine: { article: 'der', color: ACCENT.srs, bgColor: 'rgba(59, 130, 246, 0.1)' },
  feminine: { article: 'die', color: ACCENT.listening, bgColor: 'rgba(236, 72, 153, 0.1)' },
  neuter: { article: 'das', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' },
};

export const ArticleColor: Record<string, { color: string; bg: string }> = {
  der: { color: ACCENT.srs, bg: 'rgba(59,130,246,.1)' },
  die: { color: ACCENT.listening, bg: 'rgba(236,72,153,.1)' },
  das: { color: '#10B981', bg: 'rgba(16,185,129,.1)' },
};