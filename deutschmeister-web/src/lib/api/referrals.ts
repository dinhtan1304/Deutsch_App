import { apiGet, apiPatch, apiPost } from './client';
import type { BillingPeriod } from './subscriptions';

export type ReferralCommissionStatus = 'credited' | 'cancelled';
export type ReferralWithdrawalStatus = 'requested' | 'paid' | 'rejected';
export type ReferralWithdrawalMethod = 'cash' | 'credit_redeem';

export interface ReferralCommission {
  id: string;
  amount: number;
  percent: number;
  status: ReferralCommissionStatus;
  createdAt: string;
  refereeEmailMasked: string;
  refereeName: string | null;
}

export interface ReferralWithdrawal {
  id: string;
  userId: string;
  amount: number;
  method: ReferralWithdrawalMethod;
  status: ReferralWithdrawalStatus;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  adminNote: string | null;
  requestedAt: string;
  processedAt: string | null;
}

export interface ReferralInfo {
  code: string;
  balance: number;
  minWithdrawal: number;
  refereeDiscountPct: number;
  commissionRates: {
    quarterly: number;
    yearly: number;
    lifetime: number;
  };
  totals: { creditedAmount: number; creditedCount: number };
  commissions: ReferralCommission[];
  withdrawals: ReferralWithdrawal[];
}

export interface ValidateReferralCodeResult {
  valid: boolean;
  discountPct: number;
}

export interface AdminReferralWithdrawal extends ReferralWithdrawal {
  user: { id: string; email: string; name: string | null };
}

export interface AdminReferralCommission {
  id: string;
  amount: number;
  percent: number;
  status: ReferralCommissionStatus;
  createdAt: string;
  referrer: { id: string; email: string; name: string | null };
  referee: { id: string; email: string; name: string | null };
  payment: { id: string; plan: string; period: string; amount: number; status: string };
}

export interface RequestWithdrawalPayload {
  amount: number;
  method: ReferralWithdrawalMethod;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

export const referralsApi = {
  getMine: () => apiGet<ReferralInfo>('/referrals/me'),
  validate: (code: string) =>
    apiGet<ValidateReferralCodeResult>(`/referrals/validate/${encodeURIComponent(code)}`),
  requestWithdrawal: (payload: RequestWithdrawalPayload) =>
    apiPost<ReferralWithdrawal>('/referrals/withdrawals', payload),
  listMyWithdrawals: () => apiGet<ReferralWithdrawal[]>('/referrals/withdrawals/me'),
};

export const adminReferralsApi = {
  listWithdrawals: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiGet<AdminReferralWithdrawal[]>(`/referrals/admin/withdrawals${qs}`);
  },
  approveWithdrawal: (id: string, note?: string) =>
    apiPatch<AdminReferralWithdrawal>(`/referrals/admin/withdrawals/${id}/approve`, { note }),
  rejectWithdrawal: (id: string, note?: string) =>
    apiPatch<AdminReferralWithdrawal>(`/referrals/admin/withdrawals/${id}/reject`, { note }),
  listCommissions: (params?: { referrerId?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.referrerId) qs.set('referrerId', params.referrerId);
    if (params?.status) qs.set('status', params.status);
    const q = qs.toString();
    return apiGet<AdminReferralCommission[]>(`/referrals/admin/commissions${q ? `?${q}` : ''}`);
  },
};

export type { BillingPeriod };
