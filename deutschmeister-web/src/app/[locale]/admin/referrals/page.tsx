'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminReferralsApi,
  type AdminReferralWithdrawal,
  type AdminReferralCommission,
} from '@/lib/api/referrals';
import { STATUS } from '@/lib/tokens';

function formatVnd(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const WITHDRAWAL_STATUS_LABEL: Record<string, string> = {
  requested: 'Chờ duyệt',
  paid: 'Đã chuyển',
  rejected: 'Từ chối',
};
const WITHDRAWAL_STATUS_COLOR: Record<string, string> = {
  requested: STATUS.warning,
  paid: STATUS.success,
  rejected: STATUS.danger,
};

export default function AdminReferralsPage() {
  const [tab, setTab] = useState<'withdrawals' | 'commissions'>('withdrawals');
  const [statusFilter, setStatusFilter] = useState<string>('requested');
  const [actionTarget, setActionTarget] = useState<{ type: 'approve' | 'reject'; id: string } | null>(null);
  const [actionNote, setActionNote] = useState('');

  const queryClient = useQueryClient();

  const withdrawalsQuery = useQuery({
    queryKey: ['admin', 'referrals', 'withdrawals', statusFilter],
    queryFn: () => adminReferralsApi.listWithdrawals(statusFilter || undefined),
    enabled: tab === 'withdrawals',
  });

  const commissionsQuery = useQuery({
    queryKey: ['admin', 'referrals', 'commissions'],
    queryFn: () => adminReferralsApi.listCommissions(),
    enabled: tab === 'commissions',
  });

  const approveMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      adminReferralsApi.approveWithdrawal(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'referrals', 'withdrawals'] });
      setActionTarget(null);
      setActionNote('');
    },
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      adminReferralsApi.rejectWithdrawal(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'referrals', 'withdrawals'] });
      setActionTarget(null);
      setActionNote('');
    },
  });

  const handleAction = () => {
    if (!actionTarget) return;
    if (actionTarget.type === 'approve') {
      approveMut.mutate({ id: actionTarget.id, note: actionNote });
    } else {
      rejectMut.mutate({ id: actionTarget.id, note: actionNote });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          Quản lý hoa hồng giới thiệu
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Duyệt yêu cầu rút tiền và theo dõi lịch sử hoa hồng.
        </p>
      </header>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('withdrawals')}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition"
          style={{
            background: tab === 'withdrawals' ? 'var(--theme-bg-secondary)' : 'transparent',
            color: tab === 'withdrawals' ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)',
            border: '1px solid var(--theme-border)',
          }}
        >
          Yêu cầu rút tiền
        </button>
        <button
          onClick={() => setTab('commissions')}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition"
          style={{
            background: tab === 'commissions' ? 'var(--theme-bg-secondary)' : 'transparent',
            color: tab === 'commissions' ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)',
            border: '1px solid var(--theme-border)',
          }}
        >
          Lịch sử commission
        </button>
      </div>

      {tab === 'withdrawals' && (
        <>
          <div className="flex gap-2 items-center text-sm">
            <span style={{ color: 'var(--theme-text-muted)' }}>Lọc:</span>
            {['requested', 'paid', 'rejected', ''].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: statusFilter === s ? 'var(--theme-bg-secondary)' : 'transparent',
                  color: statusFilter === s ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)',
                  border: '1px solid var(--theme-border)',
                }}
              >
                {s === '' ? 'Tất cả' : WITHDRAWAL_STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          <WithdrawalTable
            data={withdrawalsQuery.data ?? []}
            loading={withdrawalsQuery.isLoading}
            onAction={(type, id) => {
              setActionTarget({ type, id });
              setActionNote('');
            }}
          />
        </>
      )}

      {tab === 'commissions' && (
        <CommissionsTable
          data={commissionsQuery.data ?? []}
          loading={commissionsQuery.isLoading}
        />
      )}

      {actionTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.6)' }}
          onClick={() => setActionTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-3">
              {actionTarget.type === 'approve' ? 'Xác nhận đã chuyển khoản' : 'Từ chối yêu cầu rút'}
            </h3>
            <p className="text-sm mb-3" style={{ color: 'var(--theme-text-muted)' }}>
              {actionTarget.type === 'approve'
                ? 'Đánh dấu yêu cầu này là đã chuyển khoản. Số dư đã được trừ khi user gửi yêu cầu.'
                : 'Từ chối yêu cầu này. Số tiền sẽ được hoàn lại vào số dư của user.'}
            </p>
            <textarea
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder="Ghi chú (tùy chọn)"
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setActionTarget(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--theme-bg-secondary)' }}
              >
                Huỷ
              </button>
              <button
                onClick={handleAction}
                disabled={approveMut.isPending || rejectMut.isPending}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{
                  background: actionTarget.type === 'approve' ? STATUS.success : STATUS.danger,
                }}
              >
                {approveMut.isPending || rejectMut.isPending ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WithdrawalTable({
  data,
  loading,
  onAction,
}: {
  data: AdminReferralWithdrawal[];
  loading: boolean;
  onAction: (type: 'approve' | 'reject', id: string) => void;
}) {
  if (loading) {
    return (
      <div className="p-6 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
        Đang tải...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-6 text-sm text-center rounded-xl" style={{ background: 'var(--theme-bg-card)', color: 'var(--theme-text-muted)' }}>
        Không có yêu cầu nào.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--theme-border)' }}>
      <table className="min-w-full text-sm" style={{ background: 'var(--theme-bg-card)' }}>
        <thead>
          <tr style={{ background: 'var(--theme-bg-secondary)' }}>
            <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>User</th>
            <th className="text-right px-3 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Số tiền</th>
            <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Ngân hàng</th>
            <th className="text-center px-3 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Trạng thái</th>
            <th className="text-right px-3 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Yêu cầu</th>
            <th className="text-center px-3 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {data.map((w) => (
            <tr key={w.id} style={{ borderTop: '1px solid var(--theme-border)' }}>
              <td className="px-3 py-2">
                <div className="font-medium" style={{ color: 'var(--theme-text-primary)' }}>{w.user.name || '—'}</div>
                <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{w.user.email}</div>
              </td>
              <td className="px-3 py-2 text-right font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                {formatVnd(w.amount)}
              </td>
              <td className="px-3 py-2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                {w.bankName ? (
                  <>
                    <div>{w.bankName}</div>
                    <div>{w.bankAccountNumber} · {w.bankAccountName}</div>
                  </>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-3 py-2 text-center text-xs">
                <span style={{ color: WITHDRAWAL_STATUS_COLOR[w.status] }}>
                  {WITHDRAWAL_STATUS_LABEL[w.status]}
                </span>
              </td>
              <td className="px-3 py-2 text-right text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                {formatDate(w.requestedAt)}
              </td>
              <td className="px-3 py-2 text-center">
                {w.status === 'requested' ? (
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={() => onAction('approve', w.id)}
                      className="px-3 py-1 rounded text-xs font-semibold text-white"
                      style={{ background: STATUS.success }}
                    >
                      Duyệt
                    </button>
                    <button
                      onClick={() => onAction('reject', w.id)}
                      className="px-3 py-1 rounded text-xs font-semibold text-white"
                      style={{ background: STATUS.danger }}
                    >
                      Từ chối
                    </button>
                  </div>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CommissionsTable({ data, loading }: { data: AdminReferralCommission[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="p-6 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
        Đang tải...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-6 text-sm text-center rounded-xl" style={{ background: 'var(--theme-bg-card)', color: 'var(--theme-text-muted)' }}>
        Chưa có khoản hoa hồng nào.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--theme-border)' }}>
      <table className="min-w-full text-sm" style={{ background: 'var(--theme-bg-card)' }}>
        <thead>
          <tr style={{ background: 'var(--theme-bg-secondary)' }}>
            <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Người giới thiệu</th>
            <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Người được giới thiệu</th>
            <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Gói / kỳ hạn</th>
            <th className="text-right px-3 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Hoa hồng</th>
            <th className="text-center px-3 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Trạng thái</th>
            <th className="text-right px-3 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.id} style={{ borderTop: '1px solid var(--theme-border)' }}>
              <td className="px-3 py-2">
                <div className="font-medium" style={{ color: 'var(--theme-text-primary)' }}>{c.referrer.name || '—'}</div>
                <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{c.referrer.email}</div>
              </td>
              <td className="px-3 py-2">
                <div className="font-medium" style={{ color: 'var(--theme-text-primary)' }}>{c.referee.name || '—'}</div>
                <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{c.referee.email}</div>
              </td>
              <td className="px-3 py-2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                {c.payment.plan} · {c.payment.period}
              </td>
              <td className="px-3 py-2 text-right font-semibold" style={{ color: c.status === 'credited' ? STATUS.success : 'var(--theme-text-muted)' }}>
                +{formatVnd(c.amount)} ({c.percent}%)
              </td>
              <td className="px-3 py-2 text-center text-xs">
                <span style={{ color: c.status === 'credited' ? STATUS.success : STATUS.danger }}>
                  {c.status === 'credited' ? 'Đã cộng' : 'Đã huỷ'}
                </span>
              </td>
              <td className="px-3 py-2 text-right text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                {formatDate(c.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
