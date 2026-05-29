'use client';
/* eslint-disable no-restricted-syntax -- custom UI gradients */

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  useRequestUpgrade,
  useValidatePromo,
  useLifetimeRemaining,
  usePlans,
} from '@/hooks/useSubscription';
import { useAuthStore } from '@/stores/authStore';
import { useModalA11y } from '@/hooks/useModalA11y';
import { trackEvent } from '@/lib/analytics';
import type { UpgradeResponse, BillingPeriod, Plan } from '@/lib/api/subscriptions';
import { ACCENT, STATUS } from '@/lib/tokens';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultPeriod?: BillingPeriod;
  featureContext?: string;
}

function formatVND(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="ml-2 px-1.5 py-0.5 rounded text-caption font-medium transition-colors"
      style={{
        color: copied ? STATUS.success : 'var(--theme-text-muted)',
        backgroundColor: copied ? 'rgba(34,197,94,0.1)' : 'var(--theme-bg-secondary)',
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function VietQRImage({ bankBin, account, amount, note, accountName }: {
  bankBin: string;
  account: string;
  amount: number;
  note: string;
  accountName: string;
}) {
  const url = `https://img.vietqr.io/image/${bankBin}-${account}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(note)}&accountName=${encodeURIComponent(accountName)}`;
  return (
    <div className="flex justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="VietQR"
        className="rounded-xl border"
        style={{ borderColor: 'var(--theme-border)', width: 320, height: 'auto' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    </div>
  );
}

const BANK_BIN_MAP: Record<string, string> = {
  'MB Bank': '970422',
  'MBBank': '970422',
  'Vietcombank': '970436',
  'VCB': '970436',
  'Techcombank': '970407',
  'TCB': '970407',
  'ACB': '970416',
  'BIDV': '970418',
  'Agribank': '970405',
  'VPBank': '970432',
  'TPBank': '970423',
  'Sacombank': '970403',
  'VietinBank': '970415',
  'HDBank': '970437',
  'OCB': '970448',
  'MSB': '970426',
  'SHB': '970443',
};

function getBankBin(bankName: string): string {
  for (const [key, bin] of Object.entries(BANK_BIN_MAP)) {
    if (bankName.toLowerCase().includes(key.toLowerCase())) return bin;
  }
  return bankName;
}

function priceForPeriod(p: BillingPeriod, plans?: Plan[]): number {
  const lite = plans?.find((plan) => plan.code === 'premium_lite');
  const premium = plans?.find((plan) => plan.code === 'premium');
  const examBundle = plans?.find((plan) => plan.code === 'exam_bundle');
  const lifetime = plans?.find((plan) => plan.code === 'lifetime');

  switch (p) {
    case 'lite_monthly':   return lite?.monthlyPrice ?? 0;
    case 'lite_quarterly': return lite?.quarterlyPrice ?? 0;
    case 'exam_bundle':    return examBundle?.price ?? 0;
    case 'lifetime':       return lifetime?.price ?? 0;
    case 'yearly':         return premium?.yearlyPrice ?? 0;
    case 'quarterly':      return premium?.quarterlyPrice ?? 0;
    case 'monthly':
    default:               return premium?.monthlyPrice ?? 0;
  }
}

export function UpgradeModal({ open, onClose, defaultPeriod = 'yearly', featureContext }: Props) {
  const t = useTranslations('subscription.upgradeModal');
  const { isAuthenticated } = useAuthStore();
  const dialogRef = useModalA11y(open, onClose);
  const [period, setPeriod] = useState<BillingPeriod>(defaultPeriod);
  const [step, setStep] = useState<'select' | 'payment'>('select');
  const [upgradeData, setUpgradeData] = useState<UpgradeResponse | null>(null);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ discount: number; label: string } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const upgradeMut = useRequestUpgrade();
  const validatePromoMut = useValidatePromo();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: lifetimeInfo } = useLifetimeRemaining();


  const handleClose = useCallback(() => {
    setStep('select');
    setUpgradeData(null);
    setPromoCode('');
    setPromoApplied(null);
    setPromoError(null);
    onClose();
  }, [onClose]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoError(null);
    try {
      const res = await validatePromoMut.mutateAsync({
        code: promoCode.trim(),
        period,
      });
      setPromoApplied({ discount: res.discount, label: res.discountLabel });
    } catch (e) {
      setPromoApplied(null);
      setPromoError((e as { response?: { data?: { message?: string } } } | undefined)?.response?.data?.message || (e as Error | undefined)?.message || t('promoInvalid'));
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoApplied(null);
    setPromoError(null);
  };

  const handleUpgrade = async () => {
    if (!isAuthenticated) return;
    trackEvent('begin_checkout', { period, feature_context: featureContext ?? 'direct' });
    const res = await upgradeMut.mutateAsync({
      period,
      promoCode: promoApplied ? promoCode.trim() : undefined,
    });
    trackEvent('purchase', { period, value: Math.max(0, priceForPeriod(period, plans) - (promoApplied?.discount ?? 0)), currency: 'VND' });
    setUpgradeData(res);
    setStep('payment');
  };

  if (!open) return null;

  const basePrice = priceForPeriod(period, plans);
  const finalPrice = Math.max(0, basePrice - (promoApplied?.discount ?? 0));
  const lifetimeSoldOut = lifetimeInfo ? lifetimeInfo.remaining <= 0 : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        className="relative w-full rounded-2xl border p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ maxWidth: step === 'payment' ? 680 : 448, borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label={t('close')}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>

        {step === 'select' ? (
          <>
            <h2 id="upgrade-modal-title" className="text-lg font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
              {t('title')}
            </h2>
            {featureContext ? (
              <div className="rounded-xl px-3 py-2.5 mb-4 text-body leading-relaxed"
                style={{ backgroundColor: 'rgba(99,102,241,.08)', borderLeft: '3px solid #6366F1', color: 'var(--theme-text-secondary)' }}>
                {featureContext}
              </div>
            ) : (
              <p className="text-body mb-5" style={{ color: 'var(--theme-text-muted)' }}>
                {t('tagline')}
              </p>
            )}

            {/* Period selector — grouped by tier */}
            <div className="mb-5">
              {/* Premium Lite row */}
              <div className="text-[10px] font-black uppercase tracking-widest mb-2 text-emerald-500">
                {t('liteRow')}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(['lite_monthly', 'lite_quarterly'] as const).map((p) => {
                  const isActive = period === p;
                  return (
                    <button
                      key={p}
                      onClick={() => { setPeriod(p); setPromoApplied(null); setPromoError(null); }}
                      className="relative py-2.5 px-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        color: isActive ? '#fff' : 'var(--theme-text-primary)',
                        background: isActive ? 'linear-gradient(135deg, #10B981, #14B8A6)' : 'var(--theme-bg-secondary)',
                        border: isActive ? 'none' : '1px solid var(--theme-border)',
                      }}
                    >
                      <div className="text-caption opacity-90">
                        {p === 'lite_monthly' ? t('liteMonthly') : t('liteQuarterly')}
                      </div>
                      <div className="text-body font-bold mt-0.5">
                        {plansLoading ? '...' : formatVND(priceForPeriod(p, plans))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Premium Full row */}
              <div className="text-[10px] font-black uppercase tracking-widest mb-2 text-indigo-500">
                {t('fullRow')}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {(['monthly', 'quarterly', 'yearly'] as const).map((p) => {
                  const isActive = period === p;
                  return (
                    <button
                      key={p}
                      onClick={() => { setPeriod(p); setPromoApplied(null); setPromoError(null); }}
                      className="relative py-2.5 px-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        color: isActive ? '#fff' : 'var(--theme-text-primary)',
                        background: isActive ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'var(--theme-bg-secondary)',
                        border: isActive ? 'none' : '1px solid var(--theme-border)',
                      }}
                    >
                      <div className="text-caption opacity-90">
                        {p === 'monthly' ? t('monthly') : p === 'quarterly' ? t('quarterly') : t('yearly')}
                      </div>
                      <div className="text-body font-bold mt-0.5">
                        {plansLoading ? '...' : formatVND(priceForPeriod(p, plans))}
                      </div>
                      {p === 'quarterly' && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap" style={{ backgroundColor: ACCENT.writing, color: '#fff' }}>
                          -16%
                        </div>
                      )}
                      {p === 'yearly' && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap" style={{ backgroundColor: ACCENT.xp, color: '#fff' }}>
                          -17%
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Exam Bundle + Lifetime row */}
              <div className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                {t('oneTimeRow')}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['exam_bundle', 'lifetime'] as const).map((p) => {
                  const disabled = p === 'lifetime' && lifetimeSoldOut;
                  const isActive = period === p;
                  const accent = p === 'exam_bundle' ? '#A855F7' : '#EC4899';
                  return (
                    <button
                      key={p}
                      onClick={() => { if (!disabled) { setPeriod(p); setPromoApplied(null); setPromoError(null); } }}
                      disabled={disabled}
                      className="relative py-2.5 px-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        color: isActive ? '#fff' : 'var(--theme-text-primary)',
                        background: isActive ? `linear-gradient(135deg, ${accent}, ${accent}cc)` : 'var(--theme-bg-secondary)',
                        border: isActive ? 'none' : '1px solid var(--theme-border)',
                      }}
                    >
                      <div className="text-caption opacity-90">
                        {p === 'exam_bundle' ? t('examBundle') : t('lifetime')}
                      </div>
                      <div className="text-body font-bold mt-0.5">
                        {plansLoading ? '...' : formatVND(priceForPeriod(p, plans))}
                      </div>
                      {p === 'lifetime' && lifetimeInfo && lifetimeInfo.remaining > 0 && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap" style={{ backgroundColor: ACCENT.listening, color: '#fff' }}>
                          HOT
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lifetime remaining */}
            {period === 'lifetime' && lifetimeInfo && (
              <div
                className="rounded-lg px-3 py-2 mb-4 text-xs"
                style={{
                  backgroundColor: 'rgba(236,72,153,0.08)',
                  color: ACCENT.listening,
                  border: '1px solid rgba(236,72,153,0.2)',
                }}
              >
                {t.rich('lifetimeRemaining', {
                  remaining: lifetimeInfo.remaining,
                  max: lifetimeInfo.max,
                  b: (chunks) => <b>{chunks}</b>,
                })}
              </div>
            )}

            {/* Promo code */}
            <div className="mb-4">
              <label
                className="text-caption uppercase tracking-wide block mb-1.5"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                {t('promoLabel')}
              </label>
              {promoApplied ? (
                <div
                  className="flex items-center justify-between rounded-lg px-3 py-2"
                  style={{
                    backgroundColor: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.3)',
                  }}
                >
                  <div className="text-body">
                    <span className="font-mono font-bold" style={{ color: STATUS.success }}>
                      {promoCode.toUpperCase()}
                    </span>
                    <span className="ml-2 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                      ({promoApplied.label})
                    </span>
                  </div>
                  <button
                    onClick={handleRemovePromo}
                    className="text-caption px-2 py-0.5 rounded font-medium"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    {t('promoRemove')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder={t('promoPlaceholder')}
                    className="flex-1 px-3 py-2 rounded-lg text-body font-mono uppercase outline-none"
                    style={{
                      backgroundColor: 'var(--theme-bg-secondary)',
                      border: '1px solid var(--theme-border)',
                      color: 'var(--theme-text-primary)',
                    }}
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={!promoCode.trim() || validatePromoMut.isPending}
                    className="px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--theme-bg-secondary)',
                      color: 'var(--theme-text-primary)',
                      border: '1px solid var(--theme-border)',
                    }}
                  >
                    {validatePromoMut.isPending ? '...' : t('promoApply')}
                  </button>
                </div>
              )}
              {promoError && (
                <div className="text-caption mt-1" style={{ color: STATUS.danger }}>
                  {promoError}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>
                  {period === 'lifetime' ? t('planLifetime') : t('planPremium')}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{
                    color: 'var(--theme-text-primary)',
                    textDecoration: promoApplied ? 'line-through' : 'none',
                    opacity: promoApplied ? 0.5 : 1,
                  }}
                >
                  {plansLoading ? '...' : formatVND(basePrice)}
                </span>
              </div>
              {promoApplied && (
                <>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs" style={{ color: STATUS.success }}>
                      {t('discount', { label: promoApplied.label })}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: STATUS.success }}>
                      -{formatVND(promoApplied.discount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                    <span className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                      {t('total')}
                    </span>
                    <span className="text-base font-bold" style={{ color: ACCENT.vocab }}>
                      {formatVND(finalPrice)}
                    </span>
                  </div>
                </>
              )}
              <div className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                {period === 'yearly' ? t('durationYearly') :
                 period === 'quarterly' ? t('durationQuarterly') :
                 period === 'lifetime' ? t('durationLifetime') :
                 t('durationMonthly')}
              </div>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={upgradeMut.isPending || plansLoading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-transform hover:scale-[1.01] disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              {upgradeMut.isPending ? t('creating') : plansLoading ? t('loading') : t('continuePayment')}
            </button>
          </>
        ) : upgradeData ? (
          <>
            <h2 id="upgrade-modal-title" className="text-lg font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
              {t('paymentTitle')}
            </h2>
            <p className="text-body mb-4" style={{ color: 'var(--theme-text-muted)' }}>
              {t('paymentSubtitle')}
            </p>

            {/* QR + Bank details side by side */}
            <div className="flex gap-4 mb-4">
              {/* Left: QR code */}
              <div className="shrink-0">
                <VietQRImage
                  bankBin={getBankBin(upgradeData.bankInfo.bankName)}
                  account={upgradeData.bankInfo.accountNumber}
                  amount={upgradeData.bankInfo.amount}
                  note={upgradeData.bankInfo.content}
                  accountName={upgradeData.bankInfo.accountName}
                />
              </div>

              {/* Right: Bank details */}
              <div className="flex-1 rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                <div>
                  <div className="text-caption uppercase tracking-wide mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>{t('bank')}</div>
                  <div className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                    {upgradeData.bankInfo.bankName}
                  </div>
                </div>
                <div>
                  <div className="text-caption uppercase tracking-wide mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>{t('accountNumber')}</div>
                  <div className="flex items-center gap-1">
                    <span className="text-body font-mono font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                      {upgradeData.bankInfo.accountNumber}
                    </span>
                    <CopyButton text={upgradeData.bankInfo.accountNumber} />
                  </div>
                </div>
                <div>
                  <div className="text-caption uppercase tracking-wide mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>{t('accountName')}</div>
                  <div className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                    {upgradeData.bankInfo.accountName}
                  </div>
                </div>
                <div>
                  <div className="text-caption uppercase tracking-wide mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>{t('amount')}</div>
                  <div className="flex items-center gap-1">
                    <span className="text-[15px] font-bold" style={{ color: ACCENT.vocab }}>
                      {formatVND(upgradeData.bankInfo.amount)}
                    </span>
                    <CopyButton text={String(upgradeData.bankInfo.amount)} />
                  </div>
                </div>
                <div>
                  <div className="text-caption uppercase tracking-wide mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                    {t('transferContent')}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-body font-mono font-bold" style={{ color: ACCENT.xp }}>
                      {upgradeData.bankInfo.content}
                    </span>
                    <CopyButton text={upgradeData.bankInfo.content} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg p-3 mb-4 text-xs leading-relaxed" style={{ backgroundColor: 'rgba(59,130,246,0.08)', color: 'var(--theme-text-secondary)' }}>
              {t('confirmNote')}
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl text-sm font-bold transition-colors"
              style={{ color: 'var(--theme-text-primary)', backgroundColor: 'var(--theme-bg-secondary)' }}
            >
              {t('transferred')}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
