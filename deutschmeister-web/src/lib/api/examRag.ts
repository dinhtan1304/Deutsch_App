'use client';

import { apiGet, apiDelete, api } from './client';

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const examRagApi = {
  upload: async (file: File, meta: { examType: string; cefrLevel: string; skill: string }): Promise<ExamDocumentDetail> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('examType', meta.examType);
    formData.append('cefrLevel', meta.cefrLevel);
    formData.append('skill', meta.skill);

    // Use raw fetch for multipart — api() sets Content-Type: application/json
    const { getAccessToken } = await import('./client');
    const token = getAccessToken();
    const res = await fetch(`${API_URL}/exam-rag/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Upload failed');
    }
    return res.json();
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
