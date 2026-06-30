import { apiGet } from './client';

export type ReviewBlockKind = 'srs' | 'remediation' | 'skill' | 'explore';

export interface ReviewBlock {
  id: string;
  kind: ReviewBlockKind;
  title: string;
  reason: string;
  href: string;
  count?: number;
  estMinutes: number;
  xpReward?: number;
  icon: string;
}

export interface SmartReviewPlan {
  blocks: ReviewBlock[];
  totalEstMinutes: number;
  generatedAt: string;
}

/**
 * Lấy lộ trình ôn tập thông minh, cá nhân hóa (SRS due + sửa lỗi + kỹ năng yếu).
 */
export function getSmartReviewPlan(): Promise<SmartReviewPlan> {
  return apiGet<SmartReviewPlan>('/smart-review/plan');
}
