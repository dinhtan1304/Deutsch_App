'use client';

import { useState } from 'react';
import { useIsExamUnlocked } from '@/hooks/useSubscription';
import { UpgradeModal } from './UpgradeModal';

interface Props {
  title?: string;
  description?: string;
  children: React.ReactNode;
  featureContext?: string;
}

/**
 * Hard-gate paywall for Premium-only features (e.g. "đề chuẩn" exam sections).
 * Renders children when the user has access (Premium OR BETA_OPEN=true on backend);
 * otherwise shows an upgrade card with an UpgradeModal trigger.
 */
export function PremiumPaywall({
  title = 'Tính năng Premium',
  description = 'Nâng cấp để truy cập đề thi chuẩn Goethe & TELC',
  children,
  featureContext,
}: Props) {
  const unlocked = useIsExamUnlocked();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
      <div className="max-w-md mx-auto px-4 py-16">
        <div
          className="rounded-2xl border p-8 text-center"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-bg-card)',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(99,102,241,0.12))',
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <div
            className="inline-block px-2.5 py-1 rounded-full text-caption font-extrabold text-white mb-3"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}
          >
            PREMIUM
          </div>

          <h3
            className="text-[17px] font-bold mb-2"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            {title}
          </h3>
          <p
            className="text-body mb-6 leading-relaxed"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            {description}
          </p>

          <button
            type="button"
            onClick={() => setUpgradeOpen(true)}
            className="w-full py-3 rounded-xl text-sm font-bold text-white mb-3 transition-transform hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            Nâng cấp Premium
          </button>

          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            Mở khoá đề Goethe/TELC A1–B1, AI chấm điểm, giải thích lỗi
          </p>
        </div>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        defaultPeriod="yearly"
        featureContext={featureContext}
      />
    </div>
  );
}
