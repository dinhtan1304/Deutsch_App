'use client';

import { useState, useCallback } from 'react';
import { useRequestUpgrade } from '@/hooks/useSubscription';
import { useAuthStore } from '@/stores/authStore';
import type { UpgradeResponse } from '@/lib/api/subscriptions';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultPeriod?: 'monthly' | 'yearly';
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
      className="ml-2 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors"
      style={{
        color: copied ? '#22C55E' : 'var(--theme-text-muted)',
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
    <div className="flex justify-center my-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="VietQR"
        className="rounded-xl border"
        style={{ borderColor: 'var(--theme-border)', maxWidth: 240 }}
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

export function UpgradeModal({ open, onClose, defaultPeriod = 'yearly' }: Props) {
  const { isAuthenticated } = useAuthStore();
  const [period, setPeriod] = useState<'monthly' | 'yearly'>(defaultPeriod);
  const [step, setStep] = useState<'select' | 'payment'>('select');
  const [upgradeData, setUpgradeData] = useState<UpgradeResponse | null>(null);

  const upgradeMut = useRequestUpgrade();

  const handleClose = useCallback(() => {
    setStep('select');
    setUpgradeData(null);
    onClose();
  }, [onClose]);

  const handleUpgrade = async () => {
    if (!isAuthenticated) return;
    const res = await upgradeMut.mutateAsync(period);
    setUpgradeData(res);
    setStep('payment');
  };

  if (!open) return null;

  const monthlyPrice = 99000;
  const yearlyPrice = 990000;
  const selectedPrice = period === 'yearly' ? yearlyPrice : monthlyPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl border p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>

        {step === 'select' ? (
          <>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
              Nâng cấp Premium
            </h2>
            <p className="text-[13px] mb-5" style={{ color: 'var(--theme-text-muted)' }}>
              Luyện tập không giới hạn, đề thi chuẩn Goethe/TELC, AI chấm bài
            </p>

            {/* Period toggle */}
            <div className="flex rounded-xl p-1 mb-5" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              {(['monthly', 'yearly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all"
                  style={{
                    color: period === p ? '#fff' : 'var(--theme-text-muted)',
                    backgroundColor: period === p ? '#8B5CF6' : 'transparent',
                  }}
                >
                  {p === 'monthly' ? 'Tháng' : 'Năm'} — {formatVND(p === 'monthly' ? monthlyPrice : yearlyPrice)}
                  {p === 'yearly' && <span className="ml-1 text-[11px] opacity-80">(-17%)</span>}
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[13px]" style={{ color: 'var(--theme-text-secondary)' }}>Gói Premium</span>
                <span className="text-[14px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{formatVND(selectedPrice)}</span>
              </div>
              <div className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                {period === 'yearly' ? '12 tháng sử dụng' : '1 tháng sử dụng'}
              </div>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={upgradeMut.isPending}
              className="w-full py-3 rounded-xl text-[14px] font-bold text-white transition-transform hover:scale-[1.01] disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              {upgradeMut.isPending ? 'Đang tạo...' : 'Tiếp tục thanh toán'}
            </button>
          </>
        ) : upgradeData ? (
          <>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
              Thông tin chuyển khoản
            </h2>
            <p className="text-[13px] mb-4" style={{ color: 'var(--theme-text-muted)' }}>
              Chuyển khoản theo thông tin bên dưới hoặc quét mã QR
            </p>

            {/* VietQR */}
            <VietQRImage
              bankBin={getBankBin(upgradeData.bankInfo.bankName)}
              account={upgradeData.bankInfo.accountNumber}
              amount={upgradeData.bankInfo.amount}
              note={upgradeData.bankInfo.content}
              accountName={upgradeData.bankInfo.accountName}
            />

            {/* Bank details */}
            <div className="rounded-xl border p-4 space-y-3 mb-4" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
              <div>
                <div className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>Ngân hàng</div>
                <div className="text-[14px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                  {upgradeData.bankInfo.bankName}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>Số tài khoản</div>
                <div className="flex items-center">
                  <span className="text-[14px] font-mono font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                    {upgradeData.bankInfo.accountNumber}
                  </span>
                  <CopyButton text={upgradeData.bankInfo.accountNumber} />
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>Chủ tài khoản</div>
                <div className="text-[14px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                  {upgradeData.bankInfo.accountName}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>Số tiền</div>
                <div className="flex items-center">
                  <span className="text-[16px] font-bold" style={{ color: '#8B5CF6' }}>
                    {formatVND(upgradeData.bankInfo.amount)}
                  </span>
                  <CopyButton text={String(upgradeData.bankInfo.amount)} />
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                  Nội dung chuyển khoản
                </div>
                <div className="flex items-center">
                  <span className="text-[14px] font-mono font-bold" style={{ color: '#F59E0B' }}>
                    {upgradeData.bankInfo.content}
                  </span>
                  <CopyButton text={upgradeData.bankInfo.content} />
                </div>
              </div>
            </div>

            <div className="rounded-lg p-3 mb-4 text-[12px] leading-relaxed" style={{ backgroundColor: 'rgba(59,130,246,0.08)', color: 'var(--theme-text-secondary)' }}>
              Sau khi chuyển khoản, admin sẽ xác nhận trong vòng 24 giờ.
              Premium sẽ được kích hoạt tự động sau khi xác nhận.
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl text-[14px] font-bold transition-colors"
              style={{ color: 'var(--theme-text-primary)', backgroundColor: 'var(--theme-bg-secondary)' }}
            >
              Tôi đã chuyển khoản
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
