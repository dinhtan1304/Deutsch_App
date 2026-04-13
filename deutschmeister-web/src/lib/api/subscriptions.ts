import { apiGet, apiPost } from './client';

export interface Plan {
  code: string;
  name: string;
  nameVi: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limits: { practicePerDay: number };
}

export interface MySubscription {
  plan: 'free' | 'premium';
  status: string;
  expiresAt: string | null;
  payments: Payment[];
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

export type PracticeFeat = 'writing' | 'reading' | 'listening' | 'speaking' | 'freeSpeaking';

export interface QuotaInfo {
  allowed: boolean;
  used: number;
  limit: number;
}

export const subscriptionsApi = {
  getPlans: () => apiGet<Plan[]>('/subscriptions/plans'),
  getMySubscription: () => apiGet<MySubscription>('/subscriptions/me'),
  requestUpgrade: (period: 'monthly' | 'yearly') =>
    apiPost<UpgradeResponse>('/subscriptions/upgrade', { period }),
  checkQuota: (feature: PracticeFeat) =>
    apiGet<QuotaInfo>(`/subscriptions/quota/${feature}`),
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
  grantPremium: (userId: string, period: 'monthly' | 'yearly' | 'lifetime', note?: string) =>
    apiPost(`/subscriptions/admin/grant/${userId}`, { period, note }),
  revokePremium: (userId: string) =>
    apiPost(`/subscriptions/admin/revoke/${userId}`, {}),
};
