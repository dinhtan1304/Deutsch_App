'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminSubscriptionsApi, type AdminPayment, type AdminSubscription, type BillingPeriod, type CreateUserWithPlanResponse } from '@/lib/api/subscriptions';

function IconLoader({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#22C55E',
  rejected: '#EF4444',
};
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  rejected: 'Từ chối',
};

const PLAN_META: Record<string, { color: string; label: string }> = {
  free:         { color: 'var(--theme-text-muted)', label: 'Free' },
  premium_lite: { color: '#10B981',                 label: '🌱 Lite' },
  premium:      { color: '#6366F1',                 label: '⭐ Premium' },
  exam_bundle:  { color: '#A855F7',                 label: '🎯 Exam Bundle' },
  lifetime:     { color: '#F59E0B',                 label: '👑 Lifetime' },
};

const PERIOD_LABELS: Record<string, string> = {
  monthly:        '1 tháng',
  quarterly:      '3 tháng',
  yearly:         '1 năm',
  lite_monthly:   'Lite · 1 tháng',
  lite_quarterly: 'Lite · 3 tháng',
  exam_bundle:    '90 ngày',
  lifetime:       'Trọn đời',
};

const GRANT_PERIODS: BillingPeriod[] = [
  'lite_monthly', 'lite_quarterly',
  'monthly', 'quarterly', 'yearly',
  'exam_bundle', 'lifetime',
];

const PAID_PLANS = new Set(['premium_lite', 'premium', 'exam_bundle', 'lifetime']);

const INPUT_STYLE = { width: '100%', padding: '8px 10px', backgroundColor: 'var(--theme-bg-body)', border: '1px solid var(--theme-border)', borderRadius: 8, color: 'var(--theme-text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' } as const;
const LABEL_STYLE = { fontSize: 11, color: 'var(--theme-text-muted)', display: 'block', marginBottom: 4 } as const;

/** Plan + duration picker, shared by the grant / create-account / pre-grant modals. */
function PeriodGrid({ value, onChange }: { value: BillingPeriod; onChange: (p: BillingPeriod) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
      {GRANT_PERIODS.map(p => {
        const active = value === p;
        const isLite = p.startsWith('lite_');
        const isOneTime = p === 'exam_bundle' || p === 'lifetime';
        const accent = isLite ? '#10B981' : isOneTime && p === 'exam_bundle' ? '#A855F7' : isOneTime ? '#F59E0B' : '#6366F1';
        return (
          <button key={p} type="button" onClick={() => onChange(p)}
            style={{ padding: '7px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: active ? 'none' : '1px solid var(--theme-border)', backgroundColor: active ? accent : 'transparent', color: active ? '#fff' : 'var(--theme-text-muted)' }}>
            {PERIOD_LABELS[p] ?? p}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminSubscriptionsPage() {
  const [tab, setTab] = useState<'payments' | 'subs' | 'grant'>('payments');
  const [paymentPage, setPaymentPage] = useState(1);
  const [subsPage, setSubsPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [actionTarget, setActionTarget] = useState<{ type: 'confirm' | 'reject'; id: string } | null>(null);
  const [grantTarget, setGrantTarget] = useState<AdminSubscription | null>(null);
  const [grantPeriod, setGrantPeriod] = useState<BillingPeriod>('lite_monthly');
  const [grantNote, setGrantNote] = useState('');

  // Create-participant-account modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createName, setCreateName] = useState('');
  const [createPeriod, setCreatePeriod] = useState<BillingPeriod>('yearly');
  const [createNote, setCreateNote] = useState('');
  const [createResult, setCreateResult] = useState<CreateUserWithPlanResponse | null>(null);

  // Pre-grant-by-email modal
  const [preOpen, setPreOpen] = useState(false);
  const [preEmail, setPreEmail] = useState('');
  const [prePeriod, setPrePeriod] = useState<BillingPeriod>('yearly');
  const [preNote, setPreNote] = useState('');

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin-payments', statusFilter, paymentPage],
    queryFn: () => adminSubscriptionsApi.getAllPayments({ status: statusFilter || undefined, page: paymentPage }),
    enabled: tab === 'payments',
  });

  const { data: subs, isLoading: subsLoading } = useQuery({
    queryKey: ['admin-subs', planFilter, subsPage],
    queryFn: () => adminSubscriptionsApi.getAllSubscriptions({ plan: planFilter || undefined, page: subsPage }),
    enabled: tab === 'subs',
  });

  const { data: pendingGrants, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin-pending-grants'],
    queryFn: () => adminSubscriptionsApi.listPendingGrants(),
    enabled: tab === 'grant',
  });

  const showError = (err: any, fallback: string) => {
    const msg = err?.response?.data?.message ?? err?.message ?? fallback;
    alert(Array.isArray(msg) ? msg.join('\n') : msg);
  };

  const confirmMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      adminSubscriptionsApi.confirmPayment(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      setActionTarget(null); setActionNote('');
    },
    onError: (err) => showError(err, 'Không xác nhận được thanh toán'),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      adminSubscriptionsApi.rejectPayment(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      setActionTarget(null); setActionNote('');
    },
    onError: (err) => showError(err, 'Không từ chối được thanh toán'),
  });

  const grantMut = useMutation({
    mutationFn: ({ userId, period, note }: { userId: string; period: BillingPeriod; note?: string }) =>
      adminSubscriptionsApi.grantPremium(userId, period, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subs'] });
      setGrantTarget(null); setGrantNote('');
    },
    onError: (err) => showError(err, 'Không cấp gói được'),
  });

  const revokeMut = useMutation({
    mutationFn: (userId: string) => adminSubscriptionsApi.revokePremium(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-subs'] }),
    onError: (err) => showError(err, 'Không thu hồi được gói'),
  });

  const createUserMut = useMutation({
    mutationFn: (dto: { email: string; name?: string; period: BillingPeriod; note?: string }) =>
      adminSubscriptionsApi.createUserWithPlan(dto),
    onSuccess: (res) => {
      setCreateResult(res);
      setCreateOpen(false);
      setCreateEmail(''); setCreateName(''); setCreateNote('');
      queryClient.invalidateQueries({ queryKey: ['admin-subs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-grants'] });
    },
    onError: (err) => showError(err, 'Không tạo được tài khoản'),
  });

  const preGrantMut = useMutation({
    mutationFn: (dto: { email: string; period: BillingPeriod; note?: string }) =>
      adminSubscriptionsApi.createPendingGrant(dto),
    onSuccess: (res) => {
      setPreOpen(false);
      setPreEmail(''); setPreNote('');
      queryClient.invalidateQueries({ queryKey: ['admin-pending-grants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-subs'] });
      if (res.mode === 'granted-existing') {
        const label = res.plan ? (PLAN_META[res.plan]?.label ?? res.plan) : 'gói';
        alert(`Email này đã có tài khoản — đã cấp ${label} ngay cho người dùng đó.`);
      } else {
        alert('Đã lưu — gói sẽ tự áp dụng khi học viên đăng ký bằng email này.');
      }
    },
    onError: (err) => showError(err, 'Không cấp gói được'),
  });

  const deletePendingMut = useMutation({
    mutationFn: (id: string) => adminSubscriptionsApi.deletePendingGrant(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-pending-grants'] }),
    onError: (err) => showError(err, 'Không xoá được pre-grant'),
  });

  const copyField = (field: string, text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => { setCopiedField(field); setTimeout(() => setCopiedField(null), 1500); },
      () => {},
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme-text-primary)', marginBottom: 2 }}>Gói đăng ký</h1>
        <p style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>Quản lý thanh toán và gói Premium của người dùng</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--theme-border)' }}>
        {([['payments', 'Thanh toán'], ['subs', 'Đăng ký'], ['grant', 'Học viên']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: 'none', background: 'none',
              color: tab === key ? '#818CF8' : 'var(--theme-text-muted)',
              borderBottom: tab === key ? '2px solid #6366F1' : '2px solid transparent',
              marginBottom: -1,
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* PAYMENTS TAB */}
      {tab === 'payments' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {['', 'pending', 'confirmed', 'rejected'].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPaymentPage(1); }}
                style={{
                  padding: '0 12px', height: 30, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: statusFilter === s ? '1px solid #6366F1' : '1px solid var(--theme-border)',
                  backgroundColor: statusFilter === s ? 'rgba(99,102,241,.15)' : 'var(--theme-bg-card)',
                  color: statusFilter === s ? '#818CF8' : 'var(--theme-text-muted)',
                }}>
                {s ? PAYMENT_STATUS_LABELS[s] : 'Tất cả'}
              </button>
            ))}
          </div>

          {paymentsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', color: '#6366F1' }}><IconLoader size={24} /></div>
          ) : !payments?.items.length ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--theme-text-muted)', fontSize: 13 }}>Chưa có thanh toán nào.</div>
          ) : (
            <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, border: '1px solid var(--theme-border)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    {['Người dùng', 'Gói', 'Chu kỳ', 'Số tiền', 'Ngày tạo', 'Trạng thái', ''].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.items.map((p: AdminPayment) => (
                    <tr key={p.id} style={{ borderTop: '1px solid var(--theme-border)' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <p style={{ fontWeight: 600, color: 'var(--theme-text-primary)' }}>{p.user.name || '—'}</p>
                        <p style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>{p.user.email}</p>
                      </td>
                      <td style={{ padding: '10px 14px', color: PLAN_META[p.plan]?.color ?? '#818CF8', fontWeight: 600 }}>{PLAN_META[p.plan]?.label ?? p.plan}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--theme-text-secondary)' }}>{PERIOD_LABELS[p.period] ?? p.period}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--theme-text-primary)', fontWeight: 600 }}>{p.amount.toLocaleString('vi-VN')}đ</td>
                      <td style={{ padding: '10px 14px', color: 'var(--theme-text-muted)', whiteSpace: 'nowrap' }}>{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                          backgroundColor: `${PAYMENT_STATUS_COLORS[p.status]}20`,
                          color: PAYMENT_STATUS_COLORS[p.status],
                        }}>
                          {PAYMENT_STATUS_LABELS[p.status]}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {p.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => setActionTarget({ type: 'confirm', id: p.id })}
                              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', backgroundColor: '#22C55E', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                              Xác nhận
                            </button>
                            <button onClick={() => setActionTarget({ type: 'reject', id: p.id })}
                              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #EF4444', backgroundColor: 'transparent', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                              Từ chối
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {payments && payments.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
              {Array.from({ length: payments.totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPaymentPage(p)}
                  style={{ width: 32, height: 32, borderRadius: 8, border: paymentPage === p ? '1px solid #6366F1' : '1px solid var(--theme-border)', backgroundColor: paymentPage === p ? 'rgba(99,102,241,.15)' : 'var(--theme-bg-card)', color: paymentPage === p ? '#818CF8' : 'var(--theme-text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBSCRIPTIONS TAB */}
      {tab === 'subs' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {['', 'free', 'premium_lite', 'premium', 'exam_bundle', 'lifetime'].map(s => (
              <button key={s} onClick={() => { setPlanFilter(s); setSubsPage(1); }}
                style={{
                  padding: '0 12px', height: 30, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: planFilter === s ? '1px solid #6366F1' : '1px solid var(--theme-border)',
                  backgroundColor: planFilter === s ? 'rgba(99,102,241,.15)' : 'var(--theme-bg-card)',
                  color: planFilter === s ? '#818CF8' : 'var(--theme-text-muted)',
                }}>
                {s ? (PLAN_META[s]?.label ?? s) : 'Tất cả'}
              </button>
            ))}
          </div>

          {subsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', color: '#6366F1' }}><IconLoader size={24} /></div>
          ) : !subs?.items.length ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--theme-text-muted)', fontSize: 13 }}>Chưa có đăng ký nào.</div>
          ) : (
            <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, border: '1px solid var(--theme-border)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    {['Người dùng', 'Gói', 'Trạng thái', 'Hết hạn', ''].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subs.items.map((s: AdminSubscription) => (
                    <tr key={s.id} style={{ borderTop: '1px solid var(--theme-border)' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <p style={{ fontWeight: 600, color: 'var(--theme-text-primary)' }}>{s.user.name || '—'}</p>
                        <p style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>{s.user.email}</p>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {(() => {
                          const meta = PLAN_META[s.plan] ?? PLAN_META.free!;
                          return (
                            <span style={{
                              fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                              backgroundColor: `${meta.color}20`, color: meta.color,
                            }}>
                              {meta.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--theme-text-muted)', fontSize: 12 }}>{s.status}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--theme-text-muted)', fontSize: 12 }}>
                        {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setGrantTarget(s)}
                            style={{ padding: '4px 10px', borderRadius: 6, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Cấp gói
                          </button>
                          {PAID_PLANS.has(s.plan) && (
                            <button onClick={() => revokeMut.mutate(s.userId)} disabled={revokeMut.isPending}
                              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #EF4444', backgroundColor: 'transparent', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                              Thu hồi
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* GRANT (PROGRAM ACCESS) TAB */}
      {tab === 'grant' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <button onClick={() => { setCreatePeriod('yearly'); setCreateOpen(true); }}
              style={{ padding: '0 14px', height: 34, borderRadius: 8, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              + Tạo tài khoản &amp; cấp gói
            </button>
            <button onClick={() => { setPrePeriod('yearly'); setPreOpen(true); }}
              style={{ padding: '0 14px', height: 34, borderRadius: 8, border: '1px solid #6366F1', backgroundColor: 'transparent', color: '#818CF8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Cấp gói theo email
            </button>
          </div>

          <p style={{ fontSize: 12, color: 'var(--theme-text-muted)', marginBottom: 18, lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--theme-text-secondary)' }}>Tạo tài khoản &amp; cấp gói</strong> — tạo sẵn tài khoản cho học viên chưa có tài khoản (kèm mật khẩu tạm hiển thị một lần) và cấp gói ngay.<br />
            <strong style={{ color: 'var(--theme-text-secondary)' }}>Cấp gói theo email</strong> — nhập email là đủ: <strong style={{ color: 'var(--theme-text-secondary)' }}>đã đăng ký</strong> thì cấp ngay, <strong style={{ color: 'var(--theme-text-secondary)' }}>chưa đăng ký</strong> thì gói tự áp dụng khi họ đăng ký bằng email đó.
          </p>

          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--theme-text-primary)', margin: '4px 0 10px' }}>Pre-grant đã tạo</h3>
          {pendingLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0', color: '#6366F1' }}><IconLoader size={22} /></div>
          ) : !pendingGrants?.length ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--theme-text-muted)', fontSize: 13 }}>Chưa có pre-grant nào.</div>
          ) : (
            <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, border: '1px solid var(--theme-border)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    {['Email', 'Gói', 'Trạng thái', 'Ngày tạo', ''].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingGrants.map(g => (
                    <tr key={g.id} style={{ borderTop: '1px solid var(--theme-border)' }}>
                      <td style={{ padding: '10px 14px', color: 'var(--theme-text-primary)', fontWeight: 600 }}>{g.email}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--theme-text-secondary)' }}>{PERIOD_LABELS[g.period] ?? g.period}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                          backgroundColor: g.status === 'applied' ? 'rgba(34,197,94,.15)' : 'rgba(245,158,11,.15)',
                          color: g.status === 'applied' ? '#22C55E' : '#F59E0B',
                        }}>
                          {g.status === 'applied' ? 'Đã áp dụng' : 'Đang chờ'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--theme-text-muted)' }}>{new Date(g.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <button onClick={() => deletePendingMut.mutate(g.id)} disabled={deletePendingMut.isPending}
                          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #EF4444', backgroundColor: 'transparent', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          Xoá
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirm/Reject modal */}
      {actionTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, padding: 24, maxWidth: 400, width: '90%', border: '1px solid var(--theme-border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--theme-text-primary)', marginBottom: 12 }}>
              {actionTarget.type === 'confirm' ? 'Xác nhận thanh toán' : 'Từ chối thanh toán'}
            </h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: 'var(--theme-text-muted)', display: 'block', marginBottom: 4 }}>Ghi chú (tuỳ chọn)</label>
              <input
                value={actionNote}
                onChange={e => setActionNote(e.target.value)}
                placeholder={actionTarget.type === 'confirm' ? 'Đã nhận tiền...' : 'Lý do từ chối...'}
                style={{ width: '100%', padding: '8px 10px', backgroundColor: 'var(--theme-bg-body)', border: '1px solid var(--theme-border)', borderRadius: 8, color: 'var(--theme-text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setActionTarget(null); setActionNote(''); }}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
              <button
                disabled={confirmMut.isPending || rejectMut.isPending}
                onClick={() => {
                  if (actionTarget.type === 'confirm') confirmMut.mutate({ id: actionTarget.id, note: actionNote });
                  else rejectMut.mutate({ id: actionTarget.id, note: actionNote });
                }}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: actionTarget.type === 'confirm' ? '#22C55E' : '#EF4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {(confirmMut.isPending || rejectMut.isPending) && <IconLoader size={14} />}
                {actionTarget.type === 'confirm' ? 'Xác nhận' : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant premium modal */}
      {grantTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, padding: 24, maxWidth: 380, width: '90%', border: '1px solid var(--theme-border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--theme-text-primary)', marginBottom: 4 }}>Cấp gói thủ công</h3>
            <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', marginBottom: 16 }}>{grantTarget.user.email}</p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: 'var(--theme-text-muted)', display: 'block', marginBottom: 6 }}>Gói &amp; thời hạn</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {GRANT_PERIODS.map(p => {
                  const active = grantPeriod === p;
                  const isLite = p.startsWith('lite_');
                  const isOneTime = p === 'exam_bundle' || p === 'lifetime';
                  const accent = isLite ? '#10B981' : isOneTime && p === 'exam_bundle' ? '#A855F7' : isOneTime ? '#F59E0B' : '#6366F1';
                  return (
                    <button key={p} onClick={() => setGrantPeriod(p)}
                      style={{ padding: '7px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: active ? 'none' : '1px solid var(--theme-border)', backgroundColor: active ? accent : 'transparent', color: active ? '#fff' : 'var(--theme-text-muted)' }}>
                      {PERIOD_LABELS[p] ?? p}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: 'var(--theme-text-muted)', display: 'block', marginBottom: 4 }}>Ghi chú</label>
              <input value={grantNote} onChange={e => setGrantNote(e.target.value)} placeholder="Lý do cấp..."
                style={{ width: '100%', padding: '8px 10px', backgroundColor: 'var(--theme-bg-body)', border: '1px solid var(--theme-border)', borderRadius: 8, color: 'var(--theme-text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setGrantTarget(null); setGrantNote(''); }}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
              <button disabled={grantMut.isPending}
                onClick={() => grantMut.mutate({ userId: grantTarget.userId, period: grantPeriod, note: grantNote })}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {grantMut.isPending && <IconLoader size={14} />} Cấp gói
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create participant account + grant modal */}
      {createOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, padding: 24, maxWidth: 420, width: '100%', border: '1px solid var(--theme-border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--theme-text-primary)', marginBottom: 4 }}>Tạo tài khoản &amp; cấp gói</h3>
            <p style={{ fontSize: 12, color: 'var(--theme-text-muted)', marginBottom: 16 }}>Tạo sẵn tài khoản cho học viên (kèm mật khẩu tạm) và cấp gói ngay.</p>
            <div style={{ marginBottom: 12 }}>
              <label style={LABEL_STYLE}>Email <span style={{ color: '#EF4444' }}>*</span></label>
              <input type="email" value={createEmail} onChange={e => setCreateEmail(e.target.value)} placeholder="hocvien@gmail.com" style={INPUT_STYLE} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={LABEL_STYLE}>Tên (tuỳ chọn)</label>
              <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Nguyễn Văn A" style={INPUT_STYLE} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ ...LABEL_STYLE, marginBottom: 6 }}>Gói &amp; thời hạn</label>
              <PeriodGrid value={createPeriod} onChange={setCreatePeriod} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={LABEL_STYLE}>Ghi chú</label>
              <input value={createNote} onChange={e => setCreateNote(e.target.value)} placeholder="VD: học viên chương trình tháng 6" style={INPUT_STYLE} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setCreateOpen(false)}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
              <button disabled={createUserMut.isPending || !createEmail.trim()}
                onClick={() => createUserMut.mutate({ email: createEmail.trim(), name: createName.trim() || undefined, period: createPeriod, note: createNote.trim() || undefined })}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: createEmail.trim() ? 'pointer' : 'not-allowed', opacity: createEmail.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                {createUserMut.isPending && <IconLoader size={14} />} Tạo &amp; cấp gói
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-grant by email modal */}
      {preOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, padding: 24, maxWidth: 420, width: '100%', border: '1px solid var(--theme-border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--theme-text-primary)', marginBottom: 4 }}>Cấp gói theo email</h3>
            <p style={{ fontSize: 12, color: 'var(--theme-text-muted)', marginBottom: 16 }}>Email đã có tài khoản → cấp gói ngay. Chưa có tài khoản → gói tự áp dụng khi họ đăng ký bằng email này.</p>
            <div style={{ marginBottom: 12 }}>
              <label style={LABEL_STYLE}>Email <span style={{ color: '#EF4444' }}>*</span></label>
              <input type="email" value={preEmail} onChange={e => setPreEmail(e.target.value)} placeholder="hocvien@gmail.com" style={INPUT_STYLE} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ ...LABEL_STYLE, marginBottom: 6 }}>Gói &amp; thời hạn</label>
              <PeriodGrid value={prePeriod} onChange={setPrePeriod} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={LABEL_STYLE}>Ghi chú</label>
              <input value={preNote} onChange={e => setPreNote(e.target.value)} placeholder="VD: học viên chương trình tháng 6" style={INPUT_STYLE} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setPreOpen(false)}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
              <button disabled={preGrantMut.isPending || !preEmail.trim()}
                onClick={() => preGrantMut.mutate({ email: preEmail.trim(), period: prePeriod, note: preNote.trim() || undefined })}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: preEmail.trim() ? 'pointer' : 'not-allowed', opacity: preEmail.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                {preGrantMut.isPending && <IconLoader size={14} />} Cấp gói
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create result modal — shows the one-time temp password */}
      {createResult && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }}>
          <div style={{ backgroundColor: 'var(--theme-bg-card)', borderRadius: 12, padding: 24, maxWidth: 440, width: '100%', border: '1px solid var(--theme-border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--theme-text-primary)', marginBottom: 8 }}>
              {createResult.created ? '✅ Đã tạo tài khoản & cấp gói' : 'ℹ️ Email đã tồn tại — đã cấp gói'}
            </h3>
            {createResult.created && createResult.tempPassword ? (
              <>
                <div style={{ fontSize: 12, color: '#F59E0B', backgroundColor: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 14, lineHeight: 1.5 }}>
                  ⚠️ Mật khẩu chỉ hiển thị một lần. Hãy lưu lại và gửi cho học viên.
                </div>
                {([['Email', 'email', createResult.user.email], ['Mật khẩu tạm', 'pwd', createResult.tempPassword]] as const).map(([label, field, val]) => (
                  <div key={field} style={{ marginBottom: 12 }}>
                    <label style={LABEL_STYLE}>{label}</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <code style={{ flex: 1, padding: '8px 10px', backgroundColor: 'var(--theme-bg-body)', border: '1px solid var(--theme-border)', borderRadius: 8, color: 'var(--theme-text-primary)', fontSize: 13, fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'nowrap' }}>{val}</code>
                      <button onClick={() => copyField(field, val)}
                        style={{ padding: '0 12px', borderRadius: 8, border: '1px solid var(--theme-border)', backgroundColor: 'transparent', color: copiedField === field ? '#22C55E' : 'var(--theme-text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {copiedField === field ? 'Đã copy' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={() => copyField('both', `Email: ${createResult.user.email}\nMật khẩu: ${createResult.tempPassword}`)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px dashed var(--theme-border)', backgroundColor: 'transparent', color: copiedField === 'both' ? '#22C55E' : 'var(--theme-text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}>
                  {copiedField === 'both' ? 'Đã copy email + mật khẩu' : 'Copy cả email + mật khẩu'}
                </button>
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--theme-text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                Tài khoản với email <strong>{createResult.user.email}</strong> đã tồn tại nên không tạo mật khẩu mới. Gói đã được cấp cho người dùng đó.
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setCreateResult(null)}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
