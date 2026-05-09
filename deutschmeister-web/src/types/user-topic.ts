// User-generated topic types — mirrors deutschmeister-api/prisma/schema.prisma
// for the UserTopic / UserTopicSet / UserTopicCard hierarchy.

export type UserTopicVisibility = 'PRIVATE' | 'UNLISTED' | 'PUBLIC';

export interface UserTopicOwner {
  id: string;
  name: string | null;
  avatar: string | null;
}

export interface UserTopic {
  id: string;
  ownerUserId: string;
  slug: string;
  title: string;
  description: string | null;
  level: string;
  coverEmoji: string | null;
  coverColor: string | null;
  coverImageUrl: string | null;
  visibility: UserTopicVisibility;
  isHiddenByAdmin: boolean;
  hiddenReason: string | null;
  isFeatured: boolean;
  forkedFromId: string | null;
  setCount: number;
  wordCount: number;
  followerCount: number;
  studyCount: number;
  forkCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserTopicWithOwner extends UserTopic {
  owner: UserTopicOwner;
}

export interface UserTopicSet {
  id: string;
  topicId: string;
  title: string;
  description: string | null;
  order: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserTopicCard {
  id: string;
  setId: string;
  word: string;
  article: string | null;
  plural: string | null;
  pronunciation: string | null;
  translationEn: string | null;
  translationVi: string | null;
  examples: string[];
  notes: string | null;
  imageUrl: string | null;
  level: string;
  source: 'system_word' | 'personal_word' | 'manual' | 'fork';
  sourceWordId: string | null;
  sourcePersonalWordId: string | null;
  order: number;
  createdAt: string;
}

export interface UserTopicSetWithCards extends UserTopicSet {
  cards: UserTopicCard[];
}

export interface UserTopicDetail extends UserTopic {
  sets: UserTopicSetWithCards[];
}

export interface CommunityTopicDetail extends UserTopicWithOwner {
  sets: UserTopicSetWithCards[];
  isFollowing: boolean;
}

// ─── DTOs ────────────────────────────────────────────────────────────────

export interface CreateUserTopicDto {
  title: string;
  description?: string;
  level?: string;
  coverEmoji?: string;
  coverColor?: string;
  coverImageUrl?: string;
}

export type UpdateUserTopicDto = Partial<CreateUserTopicDto>;

export interface CreateSetDto {
  title: string;
  description?: string;
  order?: number;
}

export type UpdateSetDto = Partial<CreateSetDto>;

export interface ManualCardDto {
  word: string;
  article?: string;
  plural?: string;
  pronunciation?: string;
  translationEn?: string;
  translationVi?: string;
  examples?: string[];
  notes?: string;
  imageUrl?: string;
  level?: string;
}

export interface AddCardsDto {
  source: 'system_word' | 'personal_word' | 'manual';
  wordIds?: string[];
  personalWordIds?: string[];
  cards?: ManualCardDto[];
}

export interface UpdateCardDto extends Partial<ManualCardDto> {
  order?: number;
}

export interface QueryMineDto {
  q?: string;
  visibility?: UserTopicVisibility | 'all';
  sort?: 'newest' | 'updated' | 'most_studied';
  page?: number;
  limit?: number;
}

export interface QueryCommunityDto {
  q?: string;
  level?: string;
  sort?: 'newest' | 'popular' | 'trending' | 'most_studied';
  page?: number;
  limit?: number;
}

export interface ForkTopicDto {
  title?: string;
  visibility?: UserTopicVisibility;
  followSource?: boolean;
}

export interface RecordStudyEventDto {
  setId?: string;
  cardsStudied?: number;
  mode?: 'flashcard' | 'quiz' | 'matching';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
