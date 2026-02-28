'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminSubscriptionsApi, type AdminPayment, type AdminSubscription } from '@/lib/api/subscriptions';

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
const PLAN_COLORS: Record<string, string> = {
  free: '#64748B',
  premium: '#6366F1',
};

export default function AdminSubscriptionsPage() {
  const [tab, setTab] = useState<'payments' | 'subs'>('payments');
  const [paymentPage, setPaymentPage] = useState(1);
  const [subsPage, setSubsPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [actionTarget, setActionTarget] = useState<{ type: 'confirm' | 'reject'; id: string } | null>(null);
  const [grantTarget, setGrantTarget] = useState<AdminSubscription | null>(null);
  const [grantPeriod, setGrantPeriod] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
  const [grantNote, setGrantNote] = useState('');

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

  const confirmMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      adminSubscriptionsApi.confirmPayment(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      setActionTarget(null); setActionNote('');
    },
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      adminSubscriptionsApi.rejectPayment(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      setActionTarget(null); setActionNote('');
    },
  });

  const grantMut = useMutation({
    mutationFn: ({ userId, period, note }: { userId: string; period: 'monthly' | 'yearly' | 'lifetime'; note?: string }) =>
      adminSubscriptionsApi.grantPremium(userId, period, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subs'] });
      setGrantTarget(null); setGrantNote('');
    },
  });

  const revokeMut = useMutation({
    mutationFn: (userId: string) => adminSubscriptionsApi.revokePremium(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-subs'] }),
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9', marginBottom: 2 }}>Gói đăng ký</h1>
        <p style={{ fontSize: 12, color: '#64748B' }}>Quản lý thanh toán và gói Premium của người dùng</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #334155' }}>
        {([['payments', 'Thanh toán'], ['subs', 'Đăng ký']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: 'none', background: 'none',
              color: tab === key ? '#818CF8' : '#64748B',
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
                  border: statusFilter === s ? '1px solid #6366F1' : '1px solid #334155',
                  backgroundColor: statusFilter === s ? 'rgba(99,102,241,.15)' : '#1E293B',
                  color: statusFilter === s ? '#818CF8' : '#64748B',
                }}>
                {s ? PAYMENT_STATUS_LABELS[s] : 'Tất cả'}
              </button>
            ))}
          </div>

          {paymentsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', color: '#6366F1' }}><IconLoader size={24} /></div>
          ) : !payments?.items.length ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569', fontSize: 13 }}>Chưa có thanh toán nào.</div>
          ) : (
            <div style={{ backgroundColor: '#1E293B', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    {['Người dùng', 'Gói', 'Chu kỳ', 'Số tiền', 'Ngày tạo', 'Trạng thái', ''].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.items.map((p: AdminPayment) => (
                    <tr key={p.id} style={{ borderTop: '1px solid #334155' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <p style={{ fontWeight: 600, color: '#F1F5F9' }}>{p.user.name || '—'}</p>
                        <p style={{ fontSize: 11, color: '#475569' }}>{p.user.email}</p>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#818CF8', fontWeight: 600 }}>{p.plan}</td>
                      <td style={{ padding: '10px 14px', color: '#94A3B8' }}>{p.period === 'monthly' ? 'Tháng' : 'Năm'}</td>
                      <td style={{ padding: '10px 14px', color: '#F1F5F9', fontWeight: 600 }}>{p.amount.toLocaleString('vi-VN')}đ</td>
                      <td style={{ padding: '10px 14px', color: '#64748B', whiteSpace: 'nowrap' }}>{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
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
                  style={{ width: 32, height: 32, borderRadius: 8, border: paymentPage === p ? '1px solid #6366F1' : '1px solid #334155', backgroundColor: paymentPage === p ? 'rgba(99,102,241,.15)' : '#1E293B', color: paymentPage === p ? '#818CF8' : '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
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
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {['', 'free', 'premium'].map(s => (
              <button key={s} onClick={() => { setPlanFilter(s); setSubsPage(1); }}
                style={{
                  padding: '0 12px', height: 30, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: planFilter === s ? '1px solid #6366F1' : '1px solid #334155',
                  backgroundColor: planFilter === s ? 'rgba(99,102,241,.15)' : '#1E293B',
                  color: planFilter === s ? '#818CF8' : '#64748B',
                }}>
                {s || 'Tất cả'}
              </button>
            ))}
          </div>

          {subsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', color: '#6366F1' }}><IconLoader size={24} /></div>
          ) : !subs?.items.length ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569', fontSize: 13 }}>Chưa có đăng ký nào.</div>
          ) : (
            <div style={{ backgroundColor: '#1E293B', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    {['Người dùng', 'Gói', 'Trạng thái', 'Hết hạn', ''].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subs.items.map((s: AdminSubscription) => (
                    <tr key={s.id} style={{ borderTop: '1px solid #334155' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <p style={{ fontWeight: 600, color: '#F1F5F9' }}>{s.user.name || '—'}</p>
                        <p style={{ fontSize: 11, color: '#475569' }}>{s.user.email}</p>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                          backgroundColor: `${PLAN_COLORS[s.plan] || '#64748B'}20`,
                          color: PLAN_COLORS[s.plan] || '#64748B',
                        }}>
                          {s.plan === 'premium' ? '⭐ Premium' : 'Free'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748B', fontSize: 12 }}>{s.status}</td>
                      <td style={{ padding: '10px 14px', color: '#64748B', fontSize: 12 }}>
                        {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setGrantTarget(s)}
                            style={{ padding: '4px 10px', borderRadius: 6, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Cấp Premium
                          </button>
                          {s.plan === 'premium' && (
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

      {/* Confirm/Reject modal */}
      {actionTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 24, maxWidth: 400, width: '90%', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 12 }}>
              {actionTarget.type === 'confirm' ? 'Xác nhận thanh toán' : 'Từ chối thanh toán'}
            </h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Ghi chú (tuỳ chọn)</label>
              <input
                value={actionNote}
                onChange={e => setActionNote(e.target.value)}
                placeholder={actionTarget.type === 'confirm' ? 'Đã nhận tiền...' : 'Lý do từ chối...'}
                style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setActionTarget(null); setActionNote(''); }}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', backgroundColor: 'transparent', color: '#94A3B8', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
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
          <div style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 24, maxWidth: 380, width: '90%', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>Cấp Premium thủ công</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>{grantTarget.user.email}</p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6 }}>Thời hạn</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['monthly', 'yearly', 'lifetime'] as const).map(p => (
                  <button key={p} onClick={() => setGrantPeriod(p)}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: grantPeriod === p ? 'none' : '1px solid #334155', backgroundColor: grantPeriod === p ? '#6366F1' : 'transparent', color: grantPeriod === p ? '#fff' : '#64748B' }}>
                    {p === 'monthly' ? '1 tháng' : p === 'yearly' ? '1 năm' : 'Vĩnh viễn'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Ghi chú</label>
              <input value={grantNote} onChange={e => setGrantNote(e.target.value)} placeholder="Lý do cấp..."
                style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: 8, color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setGrantTarget(null); setGrantNote(''); }}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', backgroundColor: 'transparent', color: '#94A3B8', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
              <button disabled={grantMut.isPending}
                onClick={() => grantMut.mutate({ userId: grantTarget.userId, period: grantPeriod, note: grantNote })}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {grantMut.isPending && <IconLoader size={14} />} Cấp Premium
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
