'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { subscriptionsApi, type BankInfo } from '@/lib/api/subscriptions';
import Link from 'next/link';

function IconLoader({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconCopy({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
}
function IconCheck({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="20 6 9 17 4 12" /></svg>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#22C55E' : '#6366F1', padding: 4, display: 'flex' }}
      title="Sao chép"
    >
      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
    </button>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#22C55E',
  rejected: '#EF4444',
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  rejected: 'Từ chối',
};

export default function BillingPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [upgraded, setUpgraded] = useState(false);

  if (!user) {
    router.replace('/auth/login');
    return null;
  }

  const { data: sub, isLoading, refetch } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: subscriptionsApi.getMySubscription,
  });

  const upgradeMut = useMutation({
    mutationFn: () => subscriptionsApi.requestUpgrade(period),
    onSuccess: (data) => {
      setBankInfo(data.bankInfo);
      setUpgraded(true);
      refetch();
    },
  });

  const isPremium =
    sub?.plan === 'premium' &&
    sub?.status === 'active' &&
    (!sub?.expiresAt || new Date(sub.expiresAt) > new Date());

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--theme-text-primary, #F1F5F9)', marginBottom: 4 }}>
          Gói đăng ký
        </h1>
        <p style={{ fontSize: 13, color: 'var(--theme-text-tertiary, #64748B)' }}>
          Quản lý gói và lịch sử thanh toán của bạn.
        </p>
      </div>

      {/* Current plan */}
      <div style={{ backgroundColor: 'var(--theme-bg-secondary, #1E293B)', borderRadius: 12, border: '1px solid var(--theme-border, #334155)', padding: 24, marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Gói hiện tại</p>
        {isLoading ? (
          <div style={{ color: '#6366F1' }}><IconLoader /></div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{
              fontSize: 20, fontWeight: 800,
              padding: '6px 18px', borderRadius: 20,
              backgroundColor: isPremium ? 'rgba(99,102,241,.15)' : 'rgba(100,116,139,.1)',
              color: isPremium ? '#818CF8' : '#94A3B8',
            }}>
              {isPremium ? '⭐ Premium' : 'Free'}
            </div>
            {isPremium && sub.expiresAt && (
              <p style={{ fontSize: 13, color: '#64748B' }}>
                Hết hạn: <strong style={{ color: '#94A3B8' }}>
                  {new Date(sub.expiresAt).toLocaleDateString('vi-VN')}
                </strong>
              </p>
            )}
            {!isPremium && (
              <p style={{ fontSize: 13, color: '#64748B' }}>3 lượt luyện tập mỗi ngày</p>
            )}
          </div>
        )}
      </div>

      {/* Upgrade section — only for free users */}
      {!isPremium && !upgraded && (
        <div style={{ backgroundColor: 'var(--theme-bg-secondary, #1E293B)', borderRadius: 12, border: '1px solid #6366F1', padding: 24, marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Nâng cấp Premium</p>

          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {(['monthly', 'yearly'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: period === p ? 'none' : '1px solid #334155',
                  backgroundColor: period === p ? '#6366F1' : 'transparent',
                  color: period === p ? '#fff' : '#64748B',
                }}>
                {p === 'monthly' ? '99.000đ / tháng' : '990.000đ / năm'}
                {p === 'yearly' && <span style={{ display: 'block', fontSize: 11, marginTop: 2, opacity: 0.8 }}>Tiết kiệm 2 tháng</span>}
              </button>
            ))}
          </div>

          {upgradeMut.isError && (
            <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>
              {(upgradeMut.error as any)?.message || 'Có lỗi xảy ra'}
            </p>
          )}

          <button onClick={() => upgradeMut.mutate()} disabled={upgradeMut.isPending}
            style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {upgradeMut.isPending && <IconLoader size={16} />}
            Tạo yêu cầu nâng cấp
          </button>
        </div>
      )}

      {/* Bank transfer info */}
      {bankInfo && (
        <div style={{ backgroundColor: 'var(--theme-bg-secondary, #1E293B)', borderRadius: 12, border: '1px solid #22C55E', padding: 24, marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Thông tin chuyển khoản
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Ngân hàng', value: bankInfo.bankName },
              { label: 'Số tài khoản', value: bankInfo.accountNumber },
              { label: 'Chủ tài khoản', value: bankInfo.accountName },
              { label: 'Số tiền', value: bankInfo.amount.toLocaleString('vi-VN') + 'đ' },
              { label: 'Nội dung CK', value: bankInfo.content, highlight: true },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#0F172A', borderRadius: 8 }}>
                <div>
                  <p style={{ fontSize: 11, color: '#475569', marginBottom: 2 }}>{row.label}</p>
                  <p style={{ fontSize: 14, fontWeight: row.highlight ? 700 : 500, color: row.highlight ? '#22C55E' : '#F1F5F9', fontFamily: row.highlight ? 'monospace' : undefined }}>
                    {row.value}
                  </p>
                </div>
                <CopyButton text={row.value} />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#475569', marginTop: 14 }}>
            Sau khi chuyển khoản, vui lòng chờ admin xác nhận (tối đa 24 giờ). Gói Premium sẽ được kích hoạt ngay sau đó.
          </p>
        </div>
      )}

      {/* Payment history */}
      {sub?.payments && sub.payments.length > 0 && (
        <div style={{ backgroundColor: 'var(--theme-bg-secondary, #1E293B)', borderRadius: 12, border: '1px solid #334155', padding: 24, marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Lịch sử thanh toán</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sub.payments.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', backgroundColor: '#0F172A', borderRadius: 8 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: '#F1F5F9', fontWeight: 600 }}>
                    Premium — {p.period === 'monthly' ? 'Tháng' : 'Năm'}
                  </p>
                  <p style={{ fontSize: 11, color: '#475569' }}>
                    {new Date(p.createdAt).toLocaleDateString('vi-VN')} · {p.amount.toLocaleString('vi-VN')}đ
                  </p>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                  backgroundColor: `${STATUS_COLORS[p.status]}20`,
                  color: STATUS_COLORS[p.status],
                }}>
                  {STATUS_LABELS[p.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
        <Link href="/pricing" style={{ fontSize: 13, color: '#6366F1', textDecoration: 'none' }}>Xem chi tiết các gói →</Link>
        <Link href="/dashboard" style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>← Về Dashboard</Link>
      </div>
    </div>
  );
}
