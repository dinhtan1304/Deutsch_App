import { apiGet, apiPost, apiPatch, apiDelete, apiUpload } from './client';

export type TrainerMode = 'conjugation' | 'cases';

// Conjugation skill tags — gồm cả câu phụ, khuyết thiếu, phản thân, tách, mệnh lệnh, Konjunktiv II
export const TENSES = [
  'praesens',
  'praeteritum',
  'perfekt',
  'futur1',
  'nebensatz',
  'modalverben',
  'reflexiv',
  'trennbar',
  'imperativ',
  'konjunktiv2',
] as const;
export const CASES = ['nominativ', 'akkusativ', 'dativ', 'genitiv'] as const;
export const TRAINER_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

export interface TrainerExercise {
  id: string;
  mode: TrainerMode;
  level: string;
  skillTag: string;
  prompt: string;
  answer: string;
  alternatives: string[];
  distractors: string[];
  explanationVi: string | null;
  meta: Record<string, unknown> | null;
}

export interface TrainerModeStats {
  sessions: number;
  totalItems: number;
  correctItems: number;
  accuracy: number;
}

export interface TrainerStats {
  totalSessions: number;
  totalItems: number;
  correctItems: number;
  accuracy: number;
  conjugation: TrainerModeStats;
  cases: TrainerModeStats;
}

export interface TrainerSessionRow {
  id: string;
  mode: TrainerMode;
  level: string;
  totalItems: number;
  correctItems: number;
  durationMs: number | null;
  breakdown: unknown;
  createdAt: string;
}

export interface TrainerHistoryResponse {
  items: TrainerSessionRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RecordSessionDto {
  mode: TrainerMode;
  level: string;
  totalItems: number;
  correctItems: number;
  durationMs?: number;
  breakdown?: Record<string, unknown>;
}

export interface RecordSessionResult {
  id: string;
  xpEarned: number;
  leveledUp: boolean;
  newLevel?: number;
}

export interface GenerateDto {
  mode: TrainerMode;
  level: string;
  skillTags?: string[];
  count?: number;
}

export interface GenerateResult {
  generated: number;
  active: number;
  flagged: number;
}

export interface ImportTrainerResult {
  total: number;
  created: number;
  updated: number;
  files: number;
}

export interface AdminExercise extends TrainerExercise {
  source: string;
  status: string;
  reportCount: number;
  createdAt: string;
}

// ── Báo lỗi bài tập ──
export const REPORT_REASONS = ['wrong_answer', 'typo', 'bad_explanation', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  wrong_answer: 'Đáp án sai',
  typo: 'Lỗi chính tả / câu chữ',
  bad_explanation: 'Giải thích sai / khó hiểu',
  other: 'Khác',
};

export interface TrainerExerciseReport {
  id: string;
  exerciseId: string;
  reporterId: string | null;
  reason: string;
  note: string | null;
  createdAt: string;
}

export interface AdminExerciseDetail extends AdminExercise {
  reports: TrainerExerciseReport[];
}

export interface UpdateExercisePatch {
  level?: string;
  skillTag?: string;
  prompt?: string;
  answer?: string;
  alternatives?: string[];
  distractors?: string[];
  explanationVi?: string;
  meta?: Record<string, unknown> | null;
  status?: string;
}

export interface AdminExercisesResponse {
  items: AdminExercise[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const grammarTrainerApi = {
  getExercises: (params: { mode: TrainerMode; level: string; skillTags?: string[]; count?: number }) =>
    apiGet<TrainerExercise[]>(
      `/grammar-trainer/exercises${qs({
        mode: params.mode,
        level: params.level,
        skillTags: params.skillTags?.join(','),
        count: params.count,
      })}`,
    ),

  recordSession: (dto: RecordSessionDto) =>
    apiPost<RecordSessionResult>('/grammar-trainer/session', dto),

  getStats: () => apiGet<TrainerStats>('/grammar-trainer/stats'),

  reportExercise: (id: string, body: { reason: ReportReason; note?: string }) =>
    apiPost<{ reported: boolean; deduped: boolean }>(`/grammar-trainer/exercises/${id}/report`, body),

  getHistory: (params?: { mode?: TrainerMode; page?: number; limit?: number }) =>
    apiGet<TrainerHistoryResponse>(`/grammar-trainer/history${qs({ ...params })}`),

  // ── Admin ──
  generate: (dto: GenerateDto) =>
    apiPost<GenerateResult>('/grammar-trainer/admin/generate', dto),

  importFromJson: (files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f, f.name));
    return apiUpload<ImportTrainerResult>('/grammar-trainer/admin/exercises/import', fd);
  },

  getAdminExercises: (params?: {
    mode?: string;
    level?: string;
    skillTag?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) =>
    apiGet<AdminExercisesResponse>(`/grammar-trainer/admin/exercises${qs({ ...params })}`),

  getAdminExercise: (id: string) =>
    apiGet<AdminExerciseDetail>(`/grammar-trainer/admin/exercises/${id}`),

  updateExercise: (id: string, patch: UpdateExercisePatch) =>
    apiPatch<AdminExercise>(`/grammar-trainer/admin/exercises/${id}/content`, patch),

  updateStatus: (id: string, status: string) =>
    apiPatch<AdminExercise>(`/grammar-trainer/admin/exercises/${id}`, { status }),

  remove: (id: string) =>
    apiDelete<{ success: boolean }>(`/grammar-trainer/admin/exercises/${id}`),
};
