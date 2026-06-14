import type { PlanCode } from '@/lib/api/subscriptions';

export const PAID_PLAN_CODES: PlanCode[] = ['premium_lite', 'premium', 'lifetime', 'exam_bundle'];

/** Gói trả phí đang hoạt động = mã khác free + status 'active'. */
export function isPaidPlan(plan?: PlanCode | string | null, status?: string | null): boolean {
  return !!plan && PAID_PLAN_CODES.includes(plan as PlanCode) && status === 'active';
}

/** Nhãn ngắn cho sidebar (theo đúng cách gọi ở trang pricing). */
export const PLAN_SHORT_LABEL: Record<PlanCode, string> = {
  free: '',
  premium_lite: 'Premium Lite',
  premium: 'Premium',
  lifetime: 'Lifetime',
  exam_bundle: 'Exam Bundle',
};
