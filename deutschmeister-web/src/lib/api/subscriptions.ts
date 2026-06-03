import { apiGet, apiPost, apiDelete } from './client';

export type PlanCode = 'free' | 'premium_lite' | 'premium' | 'lifetime' | 'exam_bundle';

export interface Plan {
  code: PlanCode;
  name: string;
  nameVi: string;
  monthlyPrice?: number;
  quarterlyPrice?: number;
  yearlyPrice?: number;
  price?: number;          // for lifetime / exam_bundle (one-time)
  features: string[];
  limits: { practicePerWeek: number };
}

export type BillingPeriod =
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'lifetime'
  | 'lite_monthly'
  | 'lite_quarterly'
  | 'exam_bundle';

export interface MySubscription {
  plan: PlanCode;
  status: string;
  expiresAt: string | null;
  updatedAt?: string | null;
  payments: Payment[];
}

export interface PromoValidation {
  valid: boolean;
  discount: number;
  discountLabel: string;
}

export interface LifetimeRemaining {
  sold: number;
  max: number;
  remaining: number;
}

export interface PromoCode {
  id: string;
  code: string;
  discountPct: number | null;
  discountVnd: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string | null;
  appliesTo: string;
  active: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  plan: string;
  period: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected';
  transferNote: string | null;
  adminNote: string | null;
  createdAt: string;
  confirmedAt: string | null;
}

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  content: string;
  amount: number;
}

export interface UpgradeResponse {
  payment: Payment;
  bankInfo: BankInfo;
  promo?: {
    code: string;
    discount: number;
    originalAmount: number;
  };
}

export interface AdminPayment extends Payment {
  user: { id: string; email: string; name: string | null };
}

export interface AdminSubscription {
  id: string;
  userId: string;
  plan: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; email: string; name: string | null };
}

/** Result of admin creating a participant account + granting a plan. */
export interface CreateUserWithPlanResponse {
  /** false = email already existed; plan granted to existing user, no password returned. */
  created: boolean;
  user: { id: string; email: string; name: string | null };
  /** One-time temp password — only present when a new account was created. */
  tempPassword: string | null;
  plan: string;
  expiresAt: string | null;
}

export interface PendingGrant {
  id: string;
  email: string;
  period: string;
  note: string | null;
  grantedBy: string | null;
  status: 'pending' | 'applied';
  appliedAt: string | null;
  appliedUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Result of admin pre-granting a plan to an email. */
export interface CreatePendingGrantResponse {
  /** 'granted-existing' = a user with that email already existed, plan applied now. */
  mode: 'granted-existing' | 'pending';
  plan?: string;
  expiresAt?: string | null;
  grant?: PendingGrant;
}

export type PracticeFeat =
  | 'writing'
  | 'reading'
  | 'listening'
  | 'speaking'
  | 'freeSpeaking'
  | 'roleplay'
  | 'pronunciation'
  | 'shadowing'
  | 'examReading'
  | 'examWriting'
  | 'examListening'
  | 'examSpeaking';

export interface QuotaInfo {
  allowed: boolean;
  used: number;
  limit: number;
  /** 'daily' or 'weekly' depending on feature. */
  window: 'daily' | 'weekly';
  /** ISO timestamp of when the quota window resets. */
  resetsAt: string;
}

export interface BetaStatus {
  betaOpen: boolean;
}

export const subscriptionsApi = {
  getPlans: () => apiGet<Plan[]>('/subscriptions/plans'),
  getMySubscription: () => apiGet<MySubscription>('/subscriptions/me'),
  requestUpgrade: (period: BillingPeriod, promoCode?: string) =>
    apiPost<UpgradeResponse>('/subscriptions/upgrade', { period, promoCode }),
  checkQuota: (feature: PracticeFeat) =>
    apiGet<QuotaInfo>(`/subscriptions/quota/${feature}`),
  validatePromo: (code: string, period: BillingPeriod) =>
    apiPost<PromoValidation>('/subscriptions/validate-promo', { code, period }),
  getLifetimeRemaining: () =>
    apiGet<LifetimeRemaining>('/subscriptions/lifetime-remaining'),
  getBetaStatus: () =>
    apiGet<BetaStatus>('/subscriptions/beta-status'),
};

export const adminSubscriptionsApi = {
  getPendingPayments: () => apiGet<AdminPayment[]>('/subscriptions/admin/payments?status=pending'),
  getAllPayments: (params?: { status?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.page) qs.set('page', String(params.page));
    return apiGet<{ items: AdminPayment[]; total: number; totalPages: number }>(`/subscriptions/admin/payments?${qs}`);
  },
  confirmPayment: (id: string, note?: string) =>
    apiPost(`/subscriptions/admin/payments/${id}/confirm`, { note }),
  rejectPayment: (id: string, note?: string) =>
    apiPost(`/subscriptions/admin/payments/${id}/reject`, { note }),
  getAllSubscriptions: (params?: { plan?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.plan) qs.set('plan', params.plan);
    if (params?.page) qs.set('page', String(params.page));
    return apiGet<{ items: AdminSubscription[]; total: number; totalPages: number }>(`/subscriptions/admin/list?${qs}`);
  },
  grantPremium: (userId: string, period: BillingPeriod, note?: string) =>
    apiPost(`/subscriptions/admin/grant/${userId}`, { period, note }),
  revokePremium: (userId: string) =>
    apiPost(`/subscriptions/admin/revoke/${userId}`, {}),

  // Program access (grant without signup)
  createUserWithPlan: (dto: { email: string; name?: string; period: BillingPeriod; note?: string }) =>
    apiPost<CreateUserWithPlanResponse>('/subscriptions/admin/create-user', dto),
  createPendingGrant: (dto: { email: string; period: BillingPeriod; note?: string }) =>
    apiPost<CreatePendingGrantResponse>('/subscriptions/admin/pending-grants', dto),
  listPendingGrants: () =>
    apiGet<PendingGrant[]>('/subscriptions/admin/pending-grants'),
  deletePendingGrant: (id: string) =>
    apiDelete(`/subscriptions/admin/pending-grants/${id}`),

  // Promo code admin
  createPromoCode: (dto: {
    code: string;
    discountPct?: number;
    discountVnd?: number;
    maxUses?: number;
    appliesTo?: string;
    validUntil?: string;
  }) => apiPost<PromoCode>('/subscriptions/admin/promo-codes', dto),
  listPromoCodes: () => apiGet<PromoCode[]>('/subscriptions/admin/promo-codes'),
  disablePromoCode: (id: string) =>
    apiPost<PromoCode>(`/subscriptions/admin/promo-codes/${id}/disable`, {}),
};
