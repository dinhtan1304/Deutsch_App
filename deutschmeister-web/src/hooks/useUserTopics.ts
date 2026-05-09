import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addCards,
  createSet,
  createUserTopic,
  deleteCards,
  deleteSet,
  deleteUserTopic,
  getMineTopic,
  listMineTopics,
  reorderSets,
  updateCard,
  updateSet,
  updateUserTopic,
  updateVisibility,
} from '@/lib/api/user-topics';
import type {
  AddCardsDto,
  CreateSetDto,
  CreateUserTopicDto,
  QueryMineDto,
  UpdateCardDto,
  UpdateSetDto,
  UpdateUserTopicDto,
  UserTopicVisibility,
} from '@/types/user-topic';

export const userTopicsKeys = {
  all: ['user-topics'] as const,
  mine: () => [...userTopicsKeys.all, 'mine'] as const,
  mineList: (q?: QueryMineDto) => [...userTopicsKeys.mine(), 'list', q] as const,
  mineDetail: (id: string) => [...userTopicsKeys.mine(), 'detail', id] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────

export function useMyTopics(query?: QueryMineDto) {
  return useQuery({
    queryKey: userTopicsKeys.mineList(query),
    queryFn: () => listMineTopics(query),
    staleTime: 60_000,
  });
}

export function useMyTopic(id: string | undefined) {
  return useQuery({
    queryKey: id ? userTopicsKeys.mineDetail(id) : ['user-topics', 'mine', 'detail', 'undefined'],
    queryFn: () => getMineTopic(id as string),
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────

export function useCreateUserTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateUserTopicDto) => createUserTopic(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userTopicsKeys.mine() });
    },
  });
}

export function useUpdateUserTopic(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateUserTopicDto) => updateUserTopic(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userTopicsKeys.mineDetail(id) });
      qc.invalidateQueries({ queryKey: userTopicsKeys.mine() });
    },
  });
}

export function useDeleteUserTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUserTopic(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userTopicsKeys.mine() });
    },
  });
}

export function useUpdateVisibility(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (visibility: UserTopicVisibility) => updateVisibility(id, visibility),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userTopicsKeys.mineDetail(id) });
      qc.invalidateQueries({ queryKey: userTopicsKeys.mine() });
    },
  });
}

export function useCreateSet(topicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSetDto) => createSet(topicId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: userTopicsKeys.mineDetail(topicId) }),
  });
}

export function useUpdateSet(topicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ setId, dto }: { setId: string; dto: UpdateSetDto }) =>
      updateSet(topicId, setId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: userTopicsKeys.mineDetail(topicId) }),
  });
}

export function useDeleteSet(topicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (setId: string) => deleteSet(topicId, setId),
    onSuccess: () => qc.invalidateQueries({ queryKey: userTopicsKeys.mineDetail(topicId) }),
  });
}

export function useReorderSets(topicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: Array<{ id: string; order: number }>) =>
      reorderSets(topicId, items),
    onSuccess: () => qc.invalidateQueries({ queryKey: userTopicsKeys.mineDetail(topicId) }),
  });
}

export function useAddCards(topicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ setId, dto }: { setId: string; dto: AddCardsDto }) =>
      addCards(topicId, setId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: userTopicsKeys.mineDetail(topicId) }),
  });
}

export function useUpdateCard(topicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ setId, cardId, dto }: { setId: string; cardId: string; dto: UpdateCardDto }) =>
      updateCard(topicId, setId, cardId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: userTopicsKeys.mineDetail(topicId) }),
  });
}

export function useDeleteCards(topicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ setId, cardIds }: { setId: string; cardIds: string[] }) =>
      deleteCards(topicId, setId, cardIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: userTopicsKeys.mineDetail(topicId) }),
  });
}
