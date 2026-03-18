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

export const GenderInfo: Record<string, { article: string; color: string; bgColor: string }> = {
  masculine: { article: 'der', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)' },
  feminine: { article: 'die', color: '#EC4899', bgColor: 'rgba(236, 72, 153, 0.1)' },
  neuter: { article: 'das', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' },
};

export const ArticleColor: Record<string, string> = {
  der: '#3B82F6',
  die: '#EC4899',
  das: '#10B981',
};
