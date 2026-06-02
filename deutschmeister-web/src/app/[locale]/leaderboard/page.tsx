'use client';

import { useState } from 'react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ACCENT } from '@/lib/tokens';
import type { LeaderboardEntry } from '@/lib/api/leaderboard';
import { GridSkeleton } from '@/components/ui';
import { IconChevronLeft, IconBarChart, IconZap } from '@/components/ui/Icons';

type Period = 'weekly' | 'monthly' | 'all-time';
const PERIOD_KEYS: Period[] = ['weekly', 'monthly', 'all-time'];

// Per-user avatar colour, hashed from the name (theme-correct CSS vars).
const AVATAR_COLORS = ['var(--pink)', 'var(--der)', 'var(--success)', 'var(--warn)', 'var(--cyan)', 'var(--streak)', 'var(--violet)', 'var(--accent)'];
const colorForName = (s: string) => AVATAR_COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]!;
const initials = (name: string) => (name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('') || '?').toUpperCase();
const mix = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;

// Medal config for the top-3 podium (gold / silver / bronze)
const MEDAL: Record<number, { color: string; glow: string; emoji: string; avatar: number; height: number }> = {
  1: { color: ACCENT.xp, glow: 'rgba(245,194,73,.5)', emoji: '🥇', avatar: 88, height: 132 },
  2: { color: 'rgb(192,200,212)', glow: 'rgba(192,200,212,.4)', emoji: '🥈', avatar: 64, height: 96 },
  3: { color: 'rgb(224,137,77)', glow: 'rgba(224,137,77,.4)', emoji: '🥉', avatar: 64, height: 72 },
};

function ProfileLink({ userId, selfId, className, style, children }: {
  userId: string | null; selfId?: string; className?: string; style?: React.CSSProperties; children: React.ReactNode;
}) {
  if (!userId) return <div className={className} style={style}>{children}</div>;
  const href = userId === selfId ? '/profile' : `/profile/${userId}`;
  return <Link href={href} className={className} style={style}>{children}</Link>;
}

// Square / round avatar with photo or hashed-colour initials
function RankAvatar({ entry, size, radius }: { entry: LeaderboardEntry; size: number; radius: number }) {
  if (entry.avatar) {
    return (
      <div className="relative shrink-0 overflow-hidden" style={{ width: size, height: size, borderRadius: radius }}>
        <Image src={entry.avatar} alt="" fill className="object-cover" unoptimized />
      </div>
    );
  }
  return (
    <div className="v2-rank-avatar flex shrink-0 items-center justify-center font-bold text-white"
      style={{ ...({ '--rank-color': colorForName(entry.name || '?') } as React.CSSProperties), width: size, height: size, fontSize: Math.round(size * 0.34), borderRadius: radius }}>
      {initials(entry.name)}
    </div>
  );
}

// Rank change vs previous period: ▲ up (green) / ▼ down (red). Nothing for 0 or null.
function RankDelta({ delta }: { delta: number | null }) {
  if (delta === null || delta === 0) return null;
  const up = delta > 0;
  return (
    <span className="mono inline-flex items-center gap-0.5 text-[10px] font-bold leading-none"
      style={{ color: up ? 'var(--success)' : 'var(--danger)' }}>
      {up ? '▲' : '▼'}{Math.abs(delta)}
    </span>
  );
}

function Podium({ top3, selfId, anonymous }: { top3: LeaderboardEntry[]; selfId?: string; anonymous: string }) {
  // Render order: 2nd, 1st, 3rd (1st tallest in the centre)
  const order = [top3[1], top3[0], top3[2]].filter(Boolean) as LeaderboardEntry[];
  return (
    <div className="mx-auto mb-7 flex max-w-160 items-end justify-center gap-3 sm:gap-4">
      {order.map((entry) => {
        const m = MEDAL[entry.rank];
        if (!m) return null;
        return (
          <div key={entry.rank} className="flex flex-col items-center" style={{ flex: entry.rank === 1 ? 1.1 : 1 }}>
            <ProfileLink userId={entry.userId} selfId={selfId} className="flex flex-col items-center transition-transform hover:-translate-y-0.5">
              <div className="relative mb-3">
                <div className="v2-rank-avatar relative flex items-center justify-center overflow-hidden rounded-full font-bold text-white"
                  style={{
                    ...({ '--rank-color': colorForName(entry.name || '?') } as React.CSSProperties),
                    width: m.avatar, height: m.avatar, fontSize: Math.round(m.avatar * 0.32),
                    border: `3px solid ${m.color}`, boxShadow: `0 0 24px ${m.glow}`,
                  }}>
                  {entry.avatar ? <Image src={entry.avatar} alt="" fill className="object-cover" unoptimized /> : initials(entry.name)}
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[22px] leading-none">{m.emoji}</span>
              </div>
              <div className="mb-0.5 max-w-full truncate px-1 text-center font-bold" style={{ fontSize: entry.rank === 1 ? 15 : 13, color: 'var(--theme-text-primary)' }}>
                {entry.name || anonymous}
              </div>
              <div className="mono mb-2.5 flex items-center gap-1 text-caption font-bold" style={{ color: m.color }}>
                <IconZap size={12} /> {entry.xp.toLocaleString()}
              </div>
            </ProfileLink>
            <div className="v2-podium-step flex w-full items-start justify-center rounded-t-md pt-3" style={{ ...({ '--step-color': m.color } as React.CSSProperties), height: m.height }}>
              <span className="mono text-[34px] font-extrabold leading-none" style={{ color: m.color, opacity: 0.5 }}>{entry.rank}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LeaderboardPage() {
  const t = useTranslations('progress.leaderboard');
  const periodLabel = (p: Period) => p === 'weekly' ? t('periodWeekly') : p === 'monthly' ? t('periodMonthly') : t('periodAllTime');
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<Period>('weekly');
  const { data: entries, isLoading } = useLeaderboard(period);

  const top3 = entries?.slice(0, 3) || [];
  const others = entries?.slice(3) || [];
  const meIndex = entries?.findIndex((e) => e.userId === user?.id) ?? -1;
  const meRank = meIndex >= 0 ? entries![meIndex]!.rank : null;

  return (
    <div className="mx-auto max-w-360 px-4 py-6 sm:px-6">

      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="v2-accent-grad relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[13px] shadow-lg">
            <div className="absolute inset-0 animate-pulse bg-white/10" />
            <IconBarChart size={24} className="relative z-10 text-white" />
          </div>
          <div>
            <h1 className="text-[26px] font-extrabold leading-tight tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>{t('pageTitle')}</h1>
            <p className="mt-0.5 text-body" style={{ color: 'var(--theme-text-secondary)' }}>{t('pageSubtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {meRank && (
            <div className="rounded-[10px] border px-4 py-2 text-center" style={{ background: mix('var(--accent)', 14), borderColor: mix('var(--accent)', 44) }}>
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{t('yourRank')}</div>
              <div className="mono text-xl font-bold" style={{ color: 'var(--accent)' }}>#{meRank}</div>
            </div>
          )}
          <Link href="/" className="flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
            <IconChevronLeft size={14} /> {t('back')}
          </Link>
        </div>
      </div>

      {/* Period selector */}
      <div className="mb-8 flex justify-center">
        <div className="inline-flex rounded-[12px] border p-1" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
          {PERIOD_KEYS.map((key) => {
            const active = period === key;
            return (
              <button key={key} onClick={() => setPeriod(key)}
                className="rounded-[8px] px-5 py-2 text-[12px] font-bold transition-all"
                style={active
                  ? { background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: `0 4px 12px ${mix('var(--accent)', 40)}` }
                  : { color: 'var(--theme-text-muted)' }}>
                {periodLabel(key)}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <GridSkeleton cols={1} count={6} height="h-16" rounded="rounded-[11px]" bordered gap="gap-3" />
      ) : top3.length === 0 ? (
        <div className="py-20 text-center text-body italic" style={{ color: 'var(--theme-text-muted)' }}>{t('empty')}</div>
      ) : (
        <div className="animate-[slideUp_0.5s_ease-out_both]">
          {/* Podium */}
          <Podium top3={top3} selfId={user?.id} anonymous={t('anonymous')} />

          {/* Rest of the list */}
          <div className="mx-auto max-w-3xl space-y-2.5">
            {others.map((entry) => {
              const isMe = entry.userId === user?.id;
              return (
                <ProfileLink key={entry.userId ?? `anon-${entry.rank}`} userId={entry.userId} selfId={user?.id}
                  className="flex items-center gap-3.5 rounded-[11px] border px-4 py-3 transition-colors"
                  style={isMe
                    ? { background: mix('var(--accent)', 12), borderColor: mix('var(--accent)', 55) }
                    : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                  <span className="flex w-9 shrink-0 flex-col items-center gap-0.5">
                    <span className="mono text-[15px] font-bold leading-none" style={{ color: isMe ? 'var(--accent)' : 'var(--theme-text-muted)' }}>
                      {entry.rank}
                    </span>
                    <RankDelta delta={entry.rankDelta} />
                  </span>
                  <RankAvatar entry={entry} size={38} radius={10} />
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate text-[14px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{entry.name || t('anonymous')}</span>
                    {isMe && (
                      <span className="shrink-0 rounded-[3px] px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide" style={{ background: mix('var(--accent)', 22), color: 'var(--accent)' }}>
                        {t('youBadge')}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <IconZap size={13} style={{ color: 'var(--accent)' }} />
                    <span className="mono text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{entry.xp.toLocaleString()}</span>
                    <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>XP</span>
                  </div>
                </ProfileLink>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
