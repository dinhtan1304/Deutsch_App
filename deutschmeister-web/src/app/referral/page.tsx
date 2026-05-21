'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GRADIENT, ACCENT, STATUS } from '@/lib/tokens';
import { useAuthStore } from '@/stores/authStore';
import {
  useMyReferralInfo,
  useRequestWithdrawal,
} from '@/hooks/useReferral';

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
  requested: 'Đang chờ duyệt',
  paid: 'Đã chuyển khoản',
  rejected: 'Từ chối',
};

const WITHDRAWAL_STATUS_COLOR: Record<string, string> = {
  requested: STATUS.warning,
  paid: STATUS.success,
  rejected: STATUS.danger,
};

export default function ReferralPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) router.replace('/auth/login?next=/referral');
  }, [_hasHydrated, isAuthenticated, router]);

  const { data, isLoading, error } = useMyReferralInfo(_hasHydrated && isAuthenticated);

  const shareLink = useMemo(() => {
    if (!data?.code) return '';
    if (typeof window === 'undefined') return `/auth/register?ref=${data.code}`;
    return `${window.location.origin}/auth/register?ref=${data.code}`;
  }, [data?.code]);

  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore — most browsers allow this on user click
    }
  };

  const handleShare = async () => {
    if (!shareLink) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Học tiếng Đức cùng mình trên DeutschMeister',
          text: `Đăng ký bằng mã của mình để được giảm ${data?.refereeDiscountPct ?? 10}% khi mua gói Premium!`,
          url: shareLink,
        });
      } catch {
        // user cancelled — no-op
      }
    } else {
      handleCopyLink();
    }
  };

  if (!_hasHydrated || !isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          Giới thiệu bạn — nhận hoa hồng
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
          Chia sẻ mã của bạn cho bạn bè. Khi họ đăng ký bằng mã và mua gói Premium, bạn được hoa hồng theo gói. Bạn bè cũng được giảm {data?.refereeDiscountPct ?? 10}% lần đầu khi nhập mã.
        </p>
      </header>

      {isLoading && (
        <div className="p-6 rounded-2xl" style={{ background: 'var(--theme-bg-card)', color: 'var(--theme-text-muted)' }}>
          Đang tải thông tin...
        </div>
      )}

      {error && (
        <div
          className="p-4 rounded-xl"
          style={{
            background: 'rgba(239,68,68,0.1)',
            color: STATUS.danger,
            border: '1px solid rgba(239,68,68,0.25)',
          }}
        >
          Không tải được thông tin giới thiệu. Vui lòng thử lại sau.
        </div>
      )}

      {data && (
        <>
          {/* Header card — code + share */}
          <section
            className="p-6 rounded-2xl text-white"
            style={{
              background: GRADIENT.brand,
              boxShadow: '0 20px 40px -16px rgba(99,102,241,0.5)',
            }}
          >
            <div className="text-sm opacity-90 mb-2">Mã giới thiệu của bạn</div>
            <div
              className="font-mono font-bold tracking-widest"
              style={{ fontSize: 36 }}
            >
              {data.code}
            </div>
            <div className="text-xs opacity-80 mt-3 break-all">{shareLink}</div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-lg font-medium text-sm bg-white/15 hover:bg-white/25 transition"
              >
                {copiedLink ? '✓ Đã copy' : '📋 Copy link'}
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 rounded-lg font-medium text-sm bg-white text-indigo-700 hover:bg-white/90 transition"
              >
                📤 Chia sẻ
              </button>
            </div>
          </section>

          {/* Commission rate explainer */}
          <section
            className="p-5 rounded-2xl"
            style={{
              background: 'var(--theme-bg-card)',
              border: '1px solid var(--theme-border)',
            }}
          >
            <div className="text-sm font-semibold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
              Mức hoa hồng theo gói
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <RateCard label="Premium 3 tháng" pct={data.commissionRates.quarterly} note="119.000đ" />
              <RateCard label="Premium 1 năm" pct={data.commissionRates.yearly} note="369.000đ" />
              <RateCard label="Premium trọn đời" pct={data.commissionRates.lifetime} note="1.499.000đ" />
            </div>
            <div className="mt-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              Gói Premium tháng, Premium Lite, và gói luyện thi 90 ngày không tính hoa hồng.
            </div>
          </section>

          {/* Balance + actions */}
          <section
            className="p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ background: GRADIENT.premiumAuraBg, border: '1px solid var(--theme-border)' }}
          >
            <div>
              <div className="text-xs uppercase font-semibold opacity-80" style={{ color: 'var(--theme-text-muted)' }}>
                Số dư hoa hồng
              </div>
              <div className="font-bold mt-1" style={{ fontSize: 32, color: ACCENT.brand }}>
                {formatVnd(data.balance)}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                Tổng đã nhận: {formatVnd(data.totals.creditedAmount)} ({data.totals.creditedCount} lần)
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowWithdrawalModal(true)}
                disabled={data.balance < data.minWithdrawal}
                className="px-5 py-3 rounded-xl font-semibold text-white text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: GRADIENT.action }}
              >
                💸 Rút tiền
              </button>
            </div>
          </section>

          {data.balance < data.minWithdrawal && (
            <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              Số tiền rút tối thiểu là {formatVnd(data.minWithdrawal)}.
            </div>
          )}

          {/* Commission history */}
          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
              Lịch sử hoa hồng
            </h2>
            {data.commissions.length === 0 ? (
              <div
                className="p-6 text-sm text-center rounded-xl"
                style={{ background: 'var(--theme-bg-card)', color: 'var(--theme-text-muted)' }}
              >
                Chưa có khoản hoa hồng nào. Hãy chia sẻ mã cho bạn bè!
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--theme-border)' }}>
                <table className="min-w-full text-sm" style={{ background: 'var(--theme-bg-card)' }}>
                  <thead>
                    <tr style={{ background: 'var(--theme-bg-secondary)' }}>
                      <th className="text-left px-4 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Người được giới thiệu</th>
                      <th className="text-right px-4 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Hoa hồng</th>
                      <th className="text-center px-4 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Trạng thái</th>
                      <th className="text-right px-4 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.commissions.map((c) => (
                      <tr key={c.id} style={{ borderTop: '1px solid var(--theme-border)' }}>
                        <td className="px-4 py-2" style={{ color: 'var(--theme-text-primary)' }}>
                          {c.refereeName || c.refereeEmailMasked}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold" style={{ color: c.status === 'credited' ? STATUS.success : 'var(--theme-text-muted)' }}>
                          +{formatVnd(c.amount)} <span className="text-xs opacity-70">({c.percent}%)</span>
                        </td>
                        <td className="px-4 py-2 text-center text-xs">
                          {c.status === 'credited' ? (
                            <span style={{ color: STATUS.success }}>Đã cộng</span>
                          ) : (
                            <span style={{ color: STATUS.danger }}>Đã huỷ</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                          {formatDate(c.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Withdrawal history */}
          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
              Lịch sử rút tiền
            </h2>
            {data.withdrawals.length === 0 ? (
              <div
                className="p-6 text-sm text-center rounded-xl"
                style={{ background: 'var(--theme-bg-card)', color: 'var(--theme-text-muted)' }}
              >
                Bạn chưa có yêu cầu rút tiền nào.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--theme-border)' }}>
                <table className="min-w-full text-sm" style={{ background: 'var(--theme-bg-card)' }}>
                  <thead>
                    <tr style={{ background: 'var(--theme-bg-secondary)' }}>
                      <th className="text-left px-4 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Số tiền</th>
                      <th className="text-left px-4 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Ngân hàng</th>
                      <th className="text-center px-4 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Trạng thái</th>
                      <th className="text-right px-4 py-2 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Yêu cầu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.withdrawals.map((w) => (
                      <tr key={w.id} style={{ borderTop: '1px solid var(--theme-border)' }}>
                        <td className="px-4 py-2 font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                          {formatVnd(w.amount)}
                        </td>
                        <td className="px-4 py-2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                          {w.bankName ? `${w.bankName} · ${w.bankAccountNumber}` : '—'}
                        </td>
                        <td className="px-4 py-2 text-center text-xs">
                          <span style={{ color: WITHDRAWAL_STATUS_COLOR[w.status] }}>
                            {WITHDRAWAL_STATUS_LABEL[w.status] ?? w.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                          {formatDate(w.requestedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {showWithdrawalModal && data && (
        <WithdrawalModal
          maxAmount={data.balance}
          minAmount={data.minWithdrawal}
          onClose={() => setShowWithdrawalModal(false)}
        />
      )}
    </div>
  );
}

function RateCard({ label, pct, note }: { label: string; pct: number; note: string }) {
  return (
    <div
      className="p-4 rounded-xl text-center"
      style={{
        background: 'var(--theme-bg-secondary)',
        border: '1px solid var(--theme-border)',
      }}
    >
      <div className="text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>{label}</div>
      <div className="font-bold mt-1" style={{ fontSize: 24, color: ACCENT.brand }}>
        {pct}%
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>{note}</div>
    </div>
  );
}

function WithdrawalModal({
  maxAmount,
  minAmount,
  onClose,
}: {
  maxAmount: number;
  minAmount: number;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState<string>(String(minAmount));
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mutate = useRequestWithdrawal();

  const handleSubmit = async () => {
    setSubmitError(null);
    const amt = parseInt(amount.replace(/[^\d]/g, ''), 10);
    if (!Number.isFinite(amt) || amt < minAmount) {
      setSubmitError(`Số tiền tối thiểu là ${formatVnd(minAmount)}`);
      return;
    }
    if (amt > maxAmount) {
      setSubmitError(`Số tiền tối đa là ${formatVnd(maxAmount)} (số dư hiện có)`);
      return;
    }
    if (!bankName.trim() || !bankAccountNumber.trim() || !bankAccountName.trim()) {
      setSubmitError('Vui lòng nhập đầy đủ thông tin ngân hàng');
      return;
    }

    try {
      await mutate.mutateAsync({
        amount: amt,
        method: 'cash',
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountName: bankAccountName.trim(),
      });
      onClose();
    } catch (err) {
      setSubmitError((err as Error).message || 'Không gửi được yêu cầu rút');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4">Yêu cầu rút tiền</h3>
        <div className="space-y-3 text-sm">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>
              Số tiền (VND)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg"
              style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}
              min={minAmount}
              max={maxAmount}
            />
            <div className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              Tối thiểu {formatVnd(minAmount)} · Tối đa {formatVnd(maxAmount)}
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>
              Tên ngân hàng
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="VD: MB Bank, Vietcombank, Techcombank…"
              className="w-full px-3 py-2 rounded-lg"
              style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>
              Số tài khoản
            </label>
            <input
              type="text"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-lg"
              style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>
              Tên chủ tài khoản
            </label>
            <input
              type="text"
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg"
              style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}
            />
          </div>
        </div>

        {submitError && (
          <div
            className="mt-3 px-3 py-2 rounded text-xs"
            style={{ background: 'rgba(239,68,68,0.1)', color: STATUS.danger }}
          >
            {submitError}
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg font-medium text-sm"
            style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' }}
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutate.isPending}
            className="flex-1 px-4 py-2 rounded-lg font-semibold text-white text-sm disabled:opacity-60"
            style={{ background: GRADIENT.action }}
          >
            {mutate.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </div>
      </div>
    </div>
  );
}
