import { apiGet, apiPost } from './client';

export type AbuseContext = 'speaking_room' | 'arena_match' | 'other';
export type AbuseReason =
  | 'harassment'
  | 'cheating'
  | 'inappropriate'
  | 'spam'
  | 'other';
export type AbuseStatus = 'pending' | 'reviewing' | 'actioned' | 'dismissed';

export interface CreateAbuseReportInput {
  reportedUserId: string;
  context: AbuseContext;
  contextId?: string;
  reason: AbuseReason;
  description?: string;
}

export interface AbuseReportSummary {
  id: string;
  reportedUserId: string;
  context: AbuseContext;
  contextId: string | null;
  reason: AbuseReason;
  status: AbuseStatus;
  createdAt: string;
  reviewedAt: string | null;
}

export const abuseReportsApi = {
  create: (input: CreateAbuseReportInput) =>
    apiPost<{ id: string; deduped: boolean }>('/abuse-reports', input),

  listMine: (limit = 20) =>
    apiGet<AbuseReportSummary[]>(`/abuse-reports/mine?limit=${limit}`),
};
