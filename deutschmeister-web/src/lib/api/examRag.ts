'use client';

import { apiGet, apiDelete, api, apiUpload } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExamDocumentItem {
  id: string;
  filename: string;
  examType: string;
  cefrLevel: string;
  skill: string;
  chunkCount: number;
  uploadedBy: string;
  createdAt: string;
}

export interface ExamDocumentListResponse {
  items: ExamDocumentItem[];
  total: number;
}

export interface ExamChunkItem {
  id: string;
  documentId: string;
  skill: string;
  teilNumber: number;
  teilType: string;
  content: string;
  metadata: any;
  createdAt: string;
}

export interface ExamDocumentDetail {
  id: string;
  filename: string;
  examType: string;
  cefrLevel: string;
  skill: string;
  rawText: string;
  uploadedBy: string;
  createdAt: string;
  chunks: ExamChunkItem[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function toQS(params?: Record<string, any>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const examRagApi = {
  upload: async (file: File, meta: { examType: string; cefrLevel: string; skill: string }): Promise<ExamDocumentDetail> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('examType', meta.examType);
    formData.append('cefrLevel', meta.cefrLevel);
    formData.append('skill', meta.skill);

    return apiUpload<ExamDocumentDetail>('/exam-rag/upload', formData);
  },

  list: (params?: { examType?: string; cefrLevel?: string; skill?: string }) =>
    apiGet<ExamDocumentListResponse>(`/exam-rag/documents${toQS(params)}`),

  getOne: (id: string) =>
    apiGet<ExamDocumentDetail>(`/exam-rag/documents/${id}`),

  delete: (id: string) =>
    apiDelete<{ success: boolean }>(`/exam-rag/documents/${id}`),

  rechunk: (id: string) =>
    api<ExamDocumentDetail>(`/exam-rag/documents/${id}/rechunk`, { method: 'POST' }),
};
