import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  browseCommunity,
  followTopic,
  forkTopic,
  getCommunityTopic,
  getFeatured,
  getSetCards,
  listFollowing,
  recordStudyEvent,
  unfollowTopic,
} from '@/lib/api/community-topics';
import type {
  ForkTopicDto,
  QueryCommunityDto,
  RecordStudyEventDto,
} from '@/types/user-topic';
import { userTopicsKeys } from './useUserTopics';

export const communityTopicsKeys = {
  all: ['community-topics'] as const,
  list: (q?: QueryCommunityDto) => [...communityTopicsKeys.all, 'list', q] as const,
  featured: () => [...communityTopicsKeys.all, 'featured'] as const,
  detail: (slug: string) => [...communityTopicsKeys.all, 'detail', slug] as const,
  setCards: (slug: string, setId: string) =>
    [...communityTopicsKeys.all, 'detail', slug, 'set', setId] as const,
  following: () => [...communityTopicsKeys.all, 'following'] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────

export function useCommunityTopics(query?: QueryCommunityDto) {
  return useQuery({
    queryKey: communityTopicsKeys.list(query),
    queryFn: () => browseCommunity(query),
    staleTime: 60_000,
  });
}

export function useFeaturedTopics() {
  return useQuery({
    queryKey: communityTopicsKeys.featured(),
    queryFn: () => getFeatured(),
    staleTime: 5 * 60_000,
  });
}

export function useCommunityTopic(slug: string | undefined) {
  return useQuery({
    queryKey: slug ? communityTopicsKeys.detail(slug) : ['community-topics', 'detail', 'undefined'],
    queryFn: () => getCommunityTopic(slug as string),
    enabled: !!slug,
    staleTime: 30_000,
  });
}

export function useSetCards(slug: string | undefined, setId: string | undefined) {
  return useQuery({
    queryKey:
      slug && setId
        ? communityTopicsKeys.setCards(slug, setId)
        : ['community-topics', 'set-cards', 'disabled'],
    queryFn: () => getSetCards(slug as string, setId as string),
    enabled: !!slug && !!setId,
    staleTime: 30_000,
  });
}

export function useFollowingTopics() {
  return useQuery({
    queryKey: communityTopicsKeys.following(),
    queryFn: () => listFollowing(),
    staleTime: 60_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────

export function useFollowTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (topicId: string) => followTopic(topicId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: communityTopicsKeys.all });
    },
  });
}

export function useUnfollowTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (topicId: string) => unfollowTopic(topicId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: communityTopicsKeys.all });
    },
  });
}

export function useForkTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, dto }: { topicId: string; dto: ForkTopicDto }) =>
      forkTopic(topicId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userTopicsKeys.mine() });
      qc.invalidateQueries({ queryKey: communityTopicsKeys.all });
    },
  });
}

export function useRecordStudyEvent(topicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: RecordStudyEventDto) => recordStudyEvent(topicId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: communityTopicsKeys.all });
    },
  });
}
