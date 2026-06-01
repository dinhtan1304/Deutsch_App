'use client';

import { useState } from 'react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { GRADIENT, ACCENT } from '@/lib/tokens';
import { GridSkeleton } from '@/components/ui';
import {
  IconTrophy, IconChevronLeft, IconUser, IconStar,
  IconBarChart, IconZap,
} from '@/components/ui/Icons';

type Period = 'weekly' | 'monthly' | 'all-time';
const PERIOD_KEYS: Period[] = ['weekly', 'monthly', 'all-time'];

const RANK_GRADIENTS = {
  gold:   GRADIENT.xp,
  silver: `linear-gradient(135deg, #9CA3AF, #6B7280)`,
  bronze: `linear-gradient(135deg, #CD7C2F, #A16207)`,
} as const;

const PODIUM_BG = {
  gold:   `linear-gradient(to top, ${ACCENT.xp}33, transparent)`,
  silver: `linear-gradient(to top, rgba(156,163,175,0.2), transparent)`,
  bronze: `linear-gradient(to top, rgba(180,107,40,0.2), transparent)`,
} as const;

// Medal tier colours for pedestal rank watermarks (gold/silver/bronze)
const PODIUM_RANK_COLOR = { 1: ACCENT.xp, 2: 'rgb(192,200,212)', 3: 'rgb(224,137,77)' } as const;

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center relative shadow-lg"
      style={{ background: RANK_GRADIENTS.gold }}>
      <IconTrophy size={20} className="text-white" />
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
        <span className="text-[10px] font-black" style={{ color: ACCENT.xp }}>1</span>
      </div>
    </div>
  );
  if (rank === 2) return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center relative shadow-md"
      style={{ background: RANK_GRADIENTS.silver }}>
      <IconStar size={18} className="text-white" />
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
        <span className="text-[10px] font-black" style={{ color: 'var(--theme-text-muted)' }}>2</span>
      </div>
    </div>
  );
  if (rank === 3) return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center relative shadow-md"
      style={{ background: RANK_GRADIENTS.bronze }}>
      <IconStar size={18} className="text-white" />
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
        <span className="text-[10px] font-black" style={{ color: ACCENT.xp }}>3</span>
      </div>
    </div>
  );
  return (
    <div className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black opacity-40"
      style={{ borderColor: 'var(--theme-border)' }}>
      {rank}
    </div>
  );
}

function ProfileLink({
  userId,
  selfId,
  className,
  style,
  children,
}: {
  userId: string | null;
  selfId?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  if (!userId) return <div className={className} style={style}>{children}</div>;
  const href = userId === selfId ? '/profile' : `/profile/${userId}`;
  return <Link href={href} className={className} style={style}>{children}</Link>;
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
  const meRank = meIndex >= 0 ? meIndex + 1 : null;

  return (
    <div className="mx-auto max-w-360 px-4 py-6 sm:px-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="v2-accent-grad w-12 h-12 rounded-[13px] flex items-center justify-center shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
              <IconBarChart size={24} className="text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-[26px] font-extrabold leading-tight tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>{t('pageTitle')}</h1>
              <p className="mt-0.5 text-body" style={{ color: 'var(--theme-text-secondary)' }}>{t('pageSubtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {meRank && (
              <div className="rounded-[10px] border px-4 py-2 text-center" style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 44%, transparent)' }}>
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{t('yourRank')}</div>
                <div className="mono text-xl font-bold" style={{ color: 'var(--accent)' }}>#{meRank}</div>
              </div>
            )}
            <Link href="/"
              className="flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors hover:opacity-80"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
              <IconChevronLeft size={14} /> {t('back')}
            </Link>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-full backdrop-blur-xl border"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)' }}>
            {PERIOD_KEYS.map(key => (
              <button key={key} onClick={() => setPeriod(key)}
                className={`px-8 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${period === key ? 'scale-105' : 'opacity-60 hover:opacity-90'}`}
                style={period === key ? {
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-on)',
                  boxShadow: '0 4px 14px color-mix(in srgb, var(--accent) 35%, transparent)',
                } : { color: 'var(--theme-text-muted)' }}>
                {periodLabel(key)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <GridSkeleton cols={1} count={5} height="h-16" rounded="rounded-2xl" bordered gap="gap-4" />
        ) : (
          <div className="space-y-12 animate-[slideUp_0.6s_ease-out_both]">

            {/* Podium */}
            <div className="grid grid-cols-3 items-end gap-2 md:gap-6 mb-8 px-2">

              {/* Rank 2 */}
              <div className="flex flex-col items-center">
                {top3[1] && (
                  <ProfileLink userId={top3[1].userId} selfId={user?.id} className="flex flex-col items-center max-w-full transition-transform hover:-translate-y-0.5">
                    <div className="relative mb-4">
                      <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full border-4 overflow-hidden"
                        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                        {top3[1].avatar
                          ? <Image src={top3[1].avatar} alt="" fill className="object-cover" unoptimized />
                          : <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--theme-text-muted)' }}><IconUser size={32} /></div>}
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                        <RankBadge rank={2} />
                      </div>
                    </div>
                    <div className="text-[11px] md:text-xs font-black truncate max-w-full mb-1">{top3[1].name || t('anonymous')}</div>
                    <div className="text-[10px] font-bold" style={{ color: 'var(--theme-text-muted)' }}>{top3[1].xp.toLocaleString()} XP</div>
                  </ProfileLink>
                )}
                <div className="w-full h-24 rounded-t-md mt-4 flex items-start justify-center pt-3" style={{ background: PODIUM_BG.silver }}>
                  <span className="mono text-3xl font-extrabold opacity-50" style={{ color: PODIUM_RANK_COLOR[2] }}>2</span>
                </div>
              </div>

              {/* Rank 1 */}
              <div className="flex flex-col items-center">
                {top3[0] && (
                  <ProfileLink userId={top3[0].userId} selfId={user?.id} className="flex flex-col items-center max-w-full transition-transform hover:-translate-y-0.5">
                    <div className="relative mb-4 scale-110">
                      <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full border-4 overflow-hidden shadow-2xl"
                        style={{ borderColor: ACCENT.xp, backgroundColor: 'var(--theme-bg-secondary)' }}>
                        {top3[0].avatar
                          ? <Image src={top3[0].avatar} alt="" fill className="object-cover" unoptimized />
                          : <div className="w-full h-full flex items-center justify-center" style={{ color: ACCENT.xp }}><IconUser size={48} /></div>}
                      </div>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                        <RankBadge rank={1} />
                      </div>
                    </div>
                    <div className="text-sm md:text-base font-black truncate max-w-full mb-1">{top3[0].name || t('anonymous')}</div>
                    <div className="text-[10px] md:text-xs font-black flex items-center gap-1" style={{ color: ACCENT.xp }}>
                      <IconZap size={12} /> {top3[0].xp.toLocaleString()} XP
                    </div>
                  </ProfileLink>
                )}
                <div className="w-full h-36 rounded-t-md mt-4 flex items-start justify-center pt-3" style={{ background: PODIUM_BG.gold }}>
                  <span className="mono text-4xl font-extrabold opacity-50" style={{ color: PODIUM_RANK_COLOR[1] }}>1</span>
                </div>
              </div>

              {/* Rank 3 */}
              <div className="flex flex-col items-center">
                {top3[2] && (
                  <ProfileLink userId={top3[2].userId} selfId={user?.id} className="flex flex-col items-center max-w-full transition-transform hover:-translate-y-0.5">
                    <div className="relative mb-4">
                      <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full border-4 overflow-hidden"
                        style={{ borderColor: `${ACCENT.xp}4D`, backgroundColor: 'var(--theme-bg-secondary)' }}>
                        {top3[2].avatar
                          ? <Image src={top3[2].avatar} alt="" fill className="object-cover" unoptimized />
                          : <div className="w-full h-full flex items-center justify-center" style={{ color: ACCENT.xp }}><IconUser size={32} /></div>}
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                        <RankBadge rank={3} />
                      </div>
                    </div>
                    <div className="text-[11px] md:text-xs font-black truncate max-w-full mb-1">{top3[2].name || t('anonymous')}</div>
                    <div className="text-[10px] font-bold" style={{ color: ACCENT.xp }}>{top3[2].xp.toLocaleString()} XP</div>
                  </ProfileLink>
                )}
                <div className="w-full h-20 rounded-t-md mt-4 flex items-start justify-center pt-2.5" style={{ background: PODIUM_BG.bronze }}>
                  <span className="mono text-3xl font-extrabold opacity-50" style={{ color: PODIUM_RANK_COLOR[3] }}>3</span>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3">
              {others.length > 0 ? others.map((entry, index) => {
                const rank = index + 4;
                const isMe = user?.id === entry.userId;
                return (
                  <ProfileLink
                    key={entry.userId ?? `anon-${rank}`}
                    userId={entry.userId}
                    selfId={user?.id}
                    style={{
                      borderColor: isMe ? 'var(--accent)' : 'var(--theme-border)',
                      backgroundColor: isMe ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--theme-bg-card)',
                      boxShadow: 'none',
                    }}
                    className="flex items-center gap-4 px-5 py-3.5 rounded-xl border transition-all hover:scale-[1.01]"
                  >
                    <div className="w-8 shrink-0 flex justify-center">
                      <RankBadge rank={rank} />
                    </div>

                    <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border"
                      style={{ backgroundColor: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)' }}>
                      {entry.avatar
                        ? <Image src={entry.avatar} alt="" fill className="object-cover" unoptimized />
                        : <div className="w-full h-full flex items-center justify-center opacity-30"><IconUser size={20} /></div>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black truncate flex items-center gap-2">
                        {entry.name || t('anonymous')}
                        {isMe && (
                          <span className="px-2 py-0.5 rounded-full text-[8px] uppercase tracking-tighter"
                            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-on)' }}>
                            {t('youBadge')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-0.5 text-sm font-black" style={{ color: ACCENT.xp }}>
                        <IconZap size={11} /> {entry.xp.toLocaleString()}
                      </div>
                      <div className="text-[8px] font-bold uppercase tracking-widest opacity-30">XP</div>
                    </div>
                  </ProfileLink>
                );
              }) : !isLoading && top3.length === 0 && (
                <div className="py-20 text-center opacity-30 italic text-sm">{t('empty')}</div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
