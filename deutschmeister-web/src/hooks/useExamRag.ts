'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  examRagApi,
  ExamDocumentListResponse,
  ExamDocumentDetail,
} from '@/lib/api/examRag';

export const examRagKeys = {
  all: ['exam-rag'] as const,
  list: (params?: Record<string, any>) => [...examRagKeys.all, 'list', params] as const,
  detail: (id: string) => [...examRagKeys.all, id] as const,
};

export function useExamRagDocuments(params?: { examType?: string; cefrLevel?: string; skill?: string }) {
  return useQuery<ExamDocumentListResponse>({
    queryKey: examRagKeys.list(params),
    queryFn: () => examRagApi.list(params),
  });
}

export function useExamRagDocument(id: string) {
  return useQuery<ExamDocumentDetail>({
    queryKey: examRagKeys.detail(id),
    queryFn: () => examRagApi.getOne(id),
    enabled: !!id,
  });
}

export function useUploadExamDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, meta }: { file: File; meta: { examType: string; cefrLevel: string; skill: string } }) =>
      examRagApi.upload(file, meta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examRagKeys.all });
    },
  });
}

export function useDeleteExamDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examRagApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examRagKeys.all });
    },
  });
}

export function useRechunkExamDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examRagApi.rechunk(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: examRagKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: examRagKeys.list() });
    },
  });
}
