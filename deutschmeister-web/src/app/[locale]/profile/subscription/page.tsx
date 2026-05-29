'use client';

import { useState } from 'react';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import Link from 'next/link';
import { useMySubscription } from '@/hooks/useSubscription';
import { useAuthStore } from '@/stores/authStore';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { PageHeader } from '@/components/ui';

// ─── Local Icons ─────────────────────────────────────────────────────────────
function IconShieldCheck({ size = 20, style, className }: { size?: number; style?: React.CSSProperties; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'block', ...style }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>;
}
function IconCreditCard({ size = 20, style, className }: { size?: number; style?: React.CSSProperties; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'block', ...style }}><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>;
}
function IconCircleCheck({ size = 16, style, className }: { size?: number; style?: React.CSSProperties; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'block', ...style }}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
}
function IconCrown({ size = 24, style, className }: { size?: number; style?: React.CSSProperties; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'block', ...style }}><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" /></svg>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatVND(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

function formatDate(s: string) {
  if (!s) return '—';
  const date = new Date(s);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const STATUS_LABELS = {
  pending: { text: 'Chờ xác nhận', color: ACCENT.xp, bg: 'rgba(245,158,11,0.1)' },
  confirmed: { text: 'Đã xác nhận', color: STATUS.success, bg: 'rgba(34,197,94,0.1)' },
  rejected: { text: 'Từ chối', color: STATUS.danger, bg: 'rgba(239,68,68,0.1)' },
};

const PREMIUM_BENEFITS = [
  'Luyện tập không giới hạn mỗi ngày',
  'AI phản hồi chi tiết bài viết & phát âm',
  'Mở khóa toàn bộ ngân hàng đề thi chuẩn',
  'Không quảng cáo & ưu tiên tính năng mới',
  'Quyền truy cập kho tài liệu bản xứ nâng cao',
  'Hỗ trợ kỹ thuật ưu tiên 24/7',
];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading } = useMySubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-32 text-center">
        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-2xl">
          <IconShieldCheck size={40} style={{ color: 'var(--theme-text-muted)' }} />
        </div>
        <h2 className="text-2xl font-black mb-3" style={{ color: 'var(--theme-text-primary)' }}>Phiên làm việc hết hạn</h2>
        <p className="text-base mb-10 opacity-50 font-medium" style={{ color: 'var(--theme-text-primary)' }}>Vui lòng đăng nhập để quản lý các gói đăng ký và quyền lợi của bạn.</p>
        <Link href="/auth/login"
          className="inline-block px-10 py-4 rounded-2xl text-sm font-black text-white transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/20"
          style={{ background: GRADIENT.writing }}>Đăng nhập ngay</Link>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-12 w-64 rounded-xl bg-white/5" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 h-80 rounded-[2.5rem] bg-white/5" />
            <div className="h-80 rounded-[2.5rem] bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  const isLifetime = data.plan === 'lifetime' && data.status === 'active';
  const isPremium = (data.plan === 'premium' || data.plan === 'lifetime') && data.status === 'active';
  const isExpired = data.status === 'expired';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
      <PageHeader
        backHref="/profile"
        title="Gói đăng ký"
        subtitle="Thông tin chi tiết về gói đăng ký và quyền lợi của bạn"
        accent="vocab"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column: Plan Details (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Hero Active Plan Card */}
          <div className="relative rounded-4xl border p-6 md:p-8 overflow-hidden shadow-xl transition-all duration-700 hover:shadow-indigo-500/10"
            style={{
              borderColor: isPremium ? 'rgba(139,92,246,0.3)' : 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-card)',
            }}>

            {/* Premium Animated Background */}
            {isPremium && (
              <>
                <div className="absolute top-0 right-0 w-75 h-75 bg-indigo-600 opacity-[0.05] blur-[80px] -mr-32 -mt-32 animate-pulse" />
                <div className="absolute top-0 inset-x-0 h-1" style={{ background: GRADIENT.subscription }} />
              </>
            )}

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl transition-transform duration-700 hover:rotate-6 ${isPremium ? 'text-white' : 'bg-white/5 text-muted'}`}
                    style={{ background: isPremium ? GRADIENT.writing : undefined, border: isPremium ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--theme-border)' }}>
                    {isPremium ? <IconCrown size={30} /> : <IconShieldCheck size={30} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-2xl font-black tracking-tight leading-none" style={{ color: 'var(--theme-text-primary)' }}>
                        {isLifetime ? 'Lifetime Access' : isPremium ? 'Premium Plan' : 'Free Member'}
                      </h2>
                      {isLifetime && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-white text-[9px] font-black uppercase tracking-tight leading-none"
                          style={{ backgroundColor: ACCENT.xp }}>
                          Early Backer
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 leading-none" style={{ color: isPremium ? ACCENT.vocab : 'var(--theme-text-muted)' }}>
                      {isLifetime ? 'Hội viên trọn đời' : isPremium ? 'Hội viên cao cấp' : 'Hội viên miễn phí'}
                    </p>
                  </div>
                </div>

                {isPremium ? (
                  <div className="flex flex-col items-start md:items-end gap-1.5">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-sm flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đang kích hoạt
                    </span>
                    {!isLifetime && data.expiresAt && (
                      <span className="text-[10px] font-black" style={{ color: ACCENT.xp }}>
                        Còn {daysUntil(data.expiresAt)} ngày
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-white/5 text-theme-muted text-[9px] font-black uppercase tracking-widest border border-white/10">
                    Chưa kích hoạt
                  </span>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-black/3 dark:bg-white/3 border border-black/5 dark:border-white/5 backdrop-blur-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2" style={{ color: 'var(--theme-text-primary)' }}>Trạng thái tài khoản</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black" style={{ color: isPremium ? STATUS.success : 'var(--theme-text-primary)' }}>
                      {isPremium ? 'Đã xác thực' : 'Bản miễn phí'}
                    </span>
                    {isPremium && <IconCircleCheck size={16} className="text-emerald-500" />}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/3 dark:bg-white/3 border border-black/5 dark:border-white/5 backdrop-blur-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                    {isLifetime ? 'Ngày kích hoạt' : 'Hạn dùng'}
                  </p>
                  <p className="text-lg font-black" style={{ color: 'var(--theme-text-primary)' }}>
                    {isLifetime ? (data.updatedAt ? formatDate(data.updatedAt) : '—') : data.expiresAt ? formatDate(data.expiresAt) : 'Vô thời hạn'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {!isPremium && (
                  <button onClick={() => setUpgradeOpen(true)}
                    className="flex-1 py-4 rounded-xl text-xs font-black text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/20"
                    style={{ background: GRADIENT.writing }}>
                    {isExpired ? 'Gia hạn Premium ngay' : 'Nâng cấp lên Premium'}
                  </button>
                )}
                {isPremium && !isLifetime && data.expiresAt && daysUntil(data.expiresAt) <= 30 && (
                  <button onClick={() => setUpgradeOpen(true)}
                    className="flex-1 py-4 rounded-xl text-xs font-black transition-all hover:bg-indigo-500 hover:text-white border border-indigo-500/30"
                    style={{ color: ACCENT.vocab, backgroundColor: 'rgba(139,92,246,0.05)' }}>
                    Gia hạn gói đăng ký
                  </button>
                )}
                <Link href="/pricing"
                  className="flex-1 py-4 rounded-xl text-xs font-black text-center transition-all hover:bg-white/5 border border-white/10"
                  style={{ color: 'var(--theme-text-primary)' }}>
                  Xem so sánh các gói
                </Link>
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="rounded-4xl border p-8 shadow-lg" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>Quyền lợi của bạn</h3>
                <p className="text-xs opacity-50 font-medium">Bạn đã mở khóa toàn bộ sức mạnh của Deutschmeister</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <IconShieldCheck size={20} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {PREMIUM_BENEFITS.map((b, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 transition-all hover:bg-black/8 dark:hover:bg-white/8">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0"
                    style={{ backgroundColor: ACCENT.emerald }}>
                    <IconCircleCheck size={12} />
                  </div>
                  <span className="text-xs font-bold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Transaction History (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60" style={{ color: 'var(--theme-text-primary)' }}>
              Lịch sử giao dịch
            </h3>
            <IconCreditCard size={14} className="opacity-40" />
          </div>

          <div className="space-y-3">
            {!data.payments || data.payments.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                <div className="w-10 h-10 rounded-xl bg-black/6 dark:bg-white/8 flex items-center justify-center mx-auto mb-3">
                  <IconCreditCard size={20} style={{ color: 'var(--theme-text-primary)', opacity: 0.5 }} />
                </div>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest" style={{ color: 'var(--theme-text-primary)' }}>Chưa có giao dịch</p>
              </div>
            ) : (
              data.payments.map((p) => {
                const s = STATUS_LABELS[p.status] ?? STATUS_LABELS.pending;
                return (
                  <div key={p.id} className="group rounded-2xl border p-4 transition-all hover:bg-white/4 hover:-translate-y-0.5"
                    style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-all">
                          <IconCreditCard size={16} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
                            Premium {p.period === 'yearly' ? 'Yearly' : p.period === 'lifetime' ? 'Lifetime' : 'Monthly'}
                          </p>
                          <p className="text-[9px] font-bold opacity-40 mt-0.5 uppercase" style={{ color: 'var(--theme-text-primary)' }}>{formatDate(p.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black" style={{ color: 'var(--theme-text-primary)' }}>{formatVND(p.amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-30">#{p.id.slice(-6)}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
                        style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.color}22` }}>{s.text}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="rounded-2xl border p-5 bg-amber-500/2 border-amber-500/10">
            <div className="flex items-center gap-2 mb-3">
              <IconShieldCheck size={16} className="text-amber-500" />
              <h4 className="text-[9px] font-black uppercase tracking-widest text-amber-500">Hỗ trợ</h4>
            </div>
            <p className="text-[11px] leading-relaxed opacity-60 font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
              Nếu gặp vấn đề thanh toán, vui lòng liên hệ <strong>support@deutschmeister.de</strong>
            </p>
          </div>
        </div>

      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        defaultPeriod="yearly"
      />
    </div>
  );
}
