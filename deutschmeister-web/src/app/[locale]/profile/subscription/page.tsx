'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ACCENT, STATUS } from '@/lib/tokens';
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

function formatDate(s: string, locale: string) {
  if (!s) return '—';
  const date = new Date(s);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Per-status accent color — bg/border are derived via color-mix so they stay
// theme-aware and calm (no raw rgba).
const STATUS_COLORS: Record<'pending' | 'confirmed' | 'rejected', string> = {
  pending: ACCENT.xp,
  confirmed: STATUS.success,
  rejected: STATUS.danger,
};

const BENEFIT_KEYS = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'] as const;

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const t = useTranslations('subscription.page');
  const tb = useTranslations('subscription.benefits');
  const ts = useTranslations('subscription.status');
  const locale = useLocale();
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading } = useMySubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-32 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
          <IconShieldCheck size={30} style={{ color: 'var(--theme-text-muted)' }} />
        </div>
        <h2 className="text-h2 font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>{t('authExpiredTitle')}</h2>
        <p className="text-body mb-8" style={{ color: 'var(--theme-text-muted)' }}>{t('authExpiredBody')}</p>
        <Link href="/auth/login"
          className="inline-block px-8 py-3 rounded-xl text-body font-semibold transition-transform hover:-translate-y-0.5 active:scale-95"
          style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>{t('loginNow')}</Link>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="max-w-360 mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 rounded-lg" style={{ background: 'var(--theme-bg-secondary)' }} />
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 h-80 rounded-2xl" style={{ background: 'var(--theme-bg-secondary)' }} />
            <div className="lg:col-span-4 h-80 rounded-2xl" style={{ background: 'var(--theme-bg-secondary)' }} />
          </div>
        </div>
      </div>
    );
  }

  const isLifetime = data.plan === 'lifetime' && data.status === 'active';
  const isPremium = (data.plan === 'premium' || data.plan === 'lifetime') && data.status === 'active';
  const isExpired = data.status === 'expired';

  return (
    <div className="max-w-360 mx-auto pb-16">
      <PageHeader
        backHref="/profile"
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
        accent="vocab"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column: Plan Details (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Hero Active Plan Card */}
          <div className="rounded-2xl border p-6"
            style={{
              borderColor: isPremium ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-card)',
            }}>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={isPremium
                    ? { background: 'var(--accent)', color: 'var(--accent-on)' }
                    : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
                  {isPremium ? <IconCrown size={28} /> : <IconShieldCheck size={28} />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="text-h2 font-bold leading-none" style={{ color: 'var(--theme-text-primary)' }}>
                      {isLifetime ? 'Lifetime Access' : isPremium ? 'Premium Plan' : 'Free Member'}
                    </h2>
                    {isLifetime && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-caption font-semibold uppercase tracking-wide"
                        style={{ background: `color-mix(in srgb, ${ACCENT.xp} 16%, transparent)`, color: ACCENT.xp }}>
                        Early Backer
                      </span>
                    )}
                  </div>
                  <p className="text-caption font-medium uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>
                    {isLifetime ? t('planSubLifetime') : isPremium ? t('planSubPremium') : t('planSubFree')}
                  </p>
                </div>
              </div>

              {isPremium ? (
                <div className="flex flex-col items-start md:items-end gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-caption font-semibold uppercase tracking-wide"
                    style={{ background: `color-mix(in srgb, ${STATUS.success} 14%, transparent)`, color: STATUS.success, border: `1px solid color-mix(in srgb, ${STATUS.success} 30%, transparent)` }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS.success }} /> {t('active')}
                  </span>
                  {!isLifetime && data.expiresAt && (
                    <span className="text-caption font-semibold" style={{ color: ACCENT.xp }}>
                      {t('daysLeft', { n: daysUntil(data.expiresAt) })}
                    </span>
                  )}
                </div>
              ) : (
                <span className="px-2.5 py-1 rounded-md text-caption font-semibold uppercase tracking-wide"
                  style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
                  {t('inactive')}
                </span>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
                <p className="text-caption font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--theme-text-muted)' }}>{t('accountStatus')}</p>
                <div className="flex items-center gap-2">
                  <span className="text-lead font-semibold" style={{ color: isPremium ? STATUS.success : 'var(--theme-text-primary)' }}>
                    {isPremium ? t('verified') : t('freeVersion')}
                  </span>
                  {isPremium && <IconCircleCheck size={16} style={{ color: STATUS.success }} />}
                </div>
              </div>

              <div className="p-4 rounded-xl" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
                <p className="text-caption font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                  {isLifetime ? t('activationDate') : t('expiryDate')}
                </p>
                <p className="text-lead font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                  {isLifetime ? (data.updatedAt ? formatDate(data.updatedAt, locale) : '—') : data.expiresAt ? formatDate(data.expiresAt, locale) : t('unlimited')}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {!isPremium && (
                <button onClick={() => setUpgradeOpen(true)}
                  className="flex-1 py-3 rounded-xl text-body font-semibold transition-transform hover:-translate-y-0.5 active:scale-95"
                  style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
                  {isExpired ? t('renewNow') : t('upgradeToPremium')}
                </button>
              )}
              {isPremium && !isLifetime && data.expiresAt && daysUntil(data.expiresAt) <= 30 && (
                <button onClick={() => setUpgradeOpen(true)}
                  className="flex-1 py-3 rounded-xl text-body font-semibold transition-colors"
                  style={{ color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}>
                  {t('renewPlan')}
                </button>
              )}
              <Link href="/pricing"
                className="flex-1 py-3 rounded-xl text-body font-semibold text-center transition-colors"
                style={{ color: 'var(--theme-text-primary)', background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
                {t('comparePlans')}
              </Link>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lead font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{t('benefitsTitle')}</h3>
                <p className="text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{t('benefitsSubtitle')}</p>
              </div>
              <span className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                style={{ background: `color-mix(in srgb, ${STATUS.success} 14%, transparent)`, color: STATUS.success }}>
                <IconShieldCheck size={18} />
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {BENEFIT_KEYS.map((k) => (
                <div key={k} className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
                  <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: `color-mix(in srgb, ${STATUS.success} 16%, transparent)`, color: STATUS.success }}>
                    <IconCircleCheck size={14} />
                  </span>
                  <span className="text-body font-medium leading-tight" style={{ color: 'var(--theme-text-primary)' }}>{tb(k)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Transaction History (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-caption font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>
              {t('txHistory')}
            </h3>
            <IconCreditCard size={14} style={{ color: 'var(--theme-text-muted)' }} />
          </div>

          <div className="space-y-3">
            {!data.payments || data.payments.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                <div className="w-10 h-10 rounded-md flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--theme-bg-secondary)' }}>
                  <IconCreditCard size={20} style={{ color: 'var(--theme-text-muted)' }} />
                </div>
                <p className="text-caption font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>{t('noTx')}</p>
              </div>
            ) : (
              data.payments.map((p) => {
                const sColor = STATUS_COLORS[p.status] ?? STATUS_COLORS.pending;
                return (
                  <div key={p.id} className="rounded-2xl border p-4 transition-transform hover:-translate-y-0.5"
                    style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                          style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                          <IconCreditCard size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-body font-semibold truncate" style={{ color: 'var(--theme-text-primary)' }}>
                            Premium {p.period === 'yearly' ? 'Yearly' : p.period === 'lifetime' ? 'Lifetime' : 'Monthly'}
                          </p>
                          <p className="text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{formatDate(p.createdAt, locale)}</p>
                        </div>
                      </div>
                      <p className="text-body font-bold mono shrink-0" style={{ color: 'var(--theme-text-primary)' }}>{formatVND(p.amount)}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--theme-border)' }}>
                      <span className="text-caption font-medium mono" style={{ color: 'var(--theme-text-muted)' }}>#{p.id.slice(-6)}</span>
                      <span className="text-caption font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md"
                        style={{ color: sColor, background: `color-mix(in srgb, ${sColor} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${sColor} 28%, transparent)` }}>{ts(p.status)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="rounded-2xl border p-4"
            style={{ borderColor: `color-mix(in srgb, ${ACCENT.xp} 25%, transparent)`, background: `color-mix(in srgb, ${ACCENT.xp} 6%, transparent)` }}>
            <div className="flex items-center gap-2 mb-2">
              <IconShieldCheck size={16} style={{ color: ACCENT.xp }} />
              <h4 className="text-caption font-semibold uppercase tracking-wide" style={{ color: ACCENT.xp }}>{t('support')}</h4>
            </div>
            <p className="text-caption leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
              {t.rich('supportBody', { mail: () => <strong>support@deutschmeister.de</strong> })}
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
