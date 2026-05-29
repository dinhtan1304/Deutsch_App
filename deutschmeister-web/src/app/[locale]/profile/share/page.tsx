'use client';
/* eslint-disable no-restricted-syntax */

import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { pickField } from '@/i18n/pickLocale';
import { STATUS } from '@/lib/tokens';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useXp } from '@/hooks/useXp';
import { useDashboardStats } from '@/hooks/useDashboard';

/**
 * Shareable profile card page. Renders a fixed-size (1080×1350) card that can
 * be downloaded as PNG for Instagram Story / Facebook post. Non-premium users
 * get a small DeutschMeister watermark in the corner.
 */
export default function ProfileSharePage() {
  const t = useTranslations('progress.profile.share');
  const locale = useLocale();
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const { data: xpInfo } = useXp();
  const { data: stats } = useDashboardStats();
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) router.replace('/');
  }, [_hasHydrated, isAuthenticated, router]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    setError(null);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0F172A',
      });
      const link = document.createElement('a');
      link.download = `deutschmeister-${user?.name || 'profile'}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Share card export failed', err);
      setError(t('exportFailed'));
    } finally {
      setDownloading(false);
    }
  };

  if (!_hasHydrated || !isAuthenticated) return null;

  const name = user?.name || t('defaultName');
  const level = xpInfo?.level ?? 1;
  const levelName = (xpInfo ? pickField(xpInfo, 'name', locale) : '') || t('defaultLevelName');
  const xp = xpInfo?.xp ?? 0;
  const streak = stats?.streak ?? 0;
  const wordsLearned = stats?.totalWordsLearned ?? 0;
  const accuracy = stats?.accuracy ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--theme-text-primary)' }}
        >
          {t('title')}
        </h1>
        <p
          className="text-body mt-1"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {t('subtitle')}
        </p>
      </div>

      {/* Preview: scales the 1080×1350 card down for screen preview */}
      <div className="flex flex-col items-center gap-5">
        <div
          className="overflow-hidden rounded-2xl shadow-2xl"
          style={{
            width: '360px',
            height: '450px',
            position: 'relative',
          }}
        >
          <div
            style={{
              transform: 'scale(0.333)',
              transformOrigin: 'top left',
              width: '1080px',
              height: '1350px',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <ShareCard
              ref={cardRef}
              name={name}
              level={level}
              levelName={levelName}
              xp={xp}
              streak={streak}
              wordsLearned={wordsLearned}
              accuracy={accuracy}
              avatar={user?.avatar ?? null}
            />
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            boxShadow: '0 8px 24px -6px rgba(99,102,241,0.5)',
          }}
        >
          {downloading ? t('generating') : t('download')}
        </button>

        {error && (
          <div
            className="text-body font-medium px-4 py-2 rounded-lg"
            style={{
              background: 'rgba(239,68,68,0.12)',
              color: STATUS.danger,
              border: '1px solid rgba(239,68,68,0.25)',
            }}
          >
            {error}
          </div>
        )}

        <p
          className="text-xs text-center max-w-md"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {t('sizeHint')}
        </p>
      </div>
    </div>
  );
}

// ─── Share Card ─────────────────────────────────────────────────────────

interface CardProps {
  name: string;
  level: number;
  levelName: string;
  xp: number;
  streak: number;
  wordsLearned: number;
  accuracy: number;
  avatar: string | null;
}

const ShareCard = forwardRef<HTMLDivElement, CardProps>(function ShareCard(
  {
    name,
    level,
    levelName,
    xp,
    streak,
    wordsLearned,
    accuracy,
    avatar,
  },
  ref,
) {
  const t = useTranslations('progress.profile.share');
  const locale = useLocale();
  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        height: 1350,
        position: 'relative',
        background:
          'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: '#fff',
        overflow: 'hidden',
      }}
    >
      {/* Decorative gradient orbs */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          right: -200,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(139,92,246,0.35), transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -250,
          left: -150,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(59,130,246,0.28), transparent 70%)',
        }}
      />

      {/* Top brand bar */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 900,
          }}
        >
          D
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}
        >
          Deutschmeister
        </div>
      </div>

      {/* Avatar + name block */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: '50%',
            margin: '0 auto 32px',
            background:
              'linear-gradient(135deg, #F59E0B, #EF4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 80,
            fontWeight: 900,
            boxShadow: '0 20px 40px -8px rgba(245,158,11,0.5)',
            border: '6px solid rgba(255,255,255,0.1)',
            backgroundImage: avatar ? `url(${avatar})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!avatar && (name[0] || 'D').toUpperCase()}
        </div>

        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            marginBottom: 12,
          }}
        >
          {name}
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 24px',
            borderRadius: 999,
            background: 'rgba(245,158,11,0.15)',
            border: '2px solid rgba(245,158,11,0.35)',
            fontSize: 22,
            fontWeight: 700,
            color: '#FBBF24',
          }}
        >
          <span>⭐</span>
          <span>{t('levelBadge', { level, name: levelName })}</span>
        </div>
      </div>

      {/* Stats grid — 2×2 */}
      <div
        style={{
          position: 'absolute',
          bottom: 200,
          left: 80,
          right: 80,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
        }}
      >
        <StatBlock
          icon="🔥"
          label={t('streakLabel')}
          value={`${streak}`}
          sub={t('streakSub')}
          accent="#F97316"
        />
        <StatBlock
          icon="📚"
          label={t('vocabLabel')}
          value={`${wordsLearned}`}
          sub={t('vocabSub')}
          accent="#3B82F6"
        />
        <StatBlock
          icon="🎯"
          label={t('accuracyLabel')}
          value={`${accuracy}%`}
          sub={t('accuracySub')}
          accent="#22C55E"
        />
        <StatBlock
          icon="✨"
          label={t('xpLabel')}
          value={`${xp.toLocaleString(locale)}`}
          sub={t('xpSub')}
          accent="#8B5CF6"
        />
      </div>

      {/* Footer CTA */}
      <div
        style={{
          position: 'absolute',
          bottom: 70,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 24,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        {t('footer')} <span style={{ color: '#A78BFA', fontWeight: 800 }}>deutschmeister.app</span>
      </div>
    </div>
  );
});

function StatBlock({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: `2px solid ${accent}40`,
        borderRadius: 24,
        padding: 32,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <div
        style={{
          fontSize: 18,
          color: 'rgba(255,255,255,0.6)',
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 64,
          fontWeight: 900,
          color: accent,
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 16,
          color: 'rgba(255,255,255,0.5)',
          fontWeight: 500,
        }}
      >
        {sub}
      </div>
    </div>
  );
}
