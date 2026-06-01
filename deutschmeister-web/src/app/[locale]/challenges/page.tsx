'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import {
  useDailyMissions,
  useWeeklyChallenges,
  useChallengeHistory,
} from '@/hooks/useChallenges';
import type { ChallengeProgress, DailyMission } from '@/lib/api/challenges';
import { ACCENT, STATUS } from '@/lib/tokens';
import { GridSkeleton } from '@/components/ui';
import {
  IconChevronLeft, IconCheck, IconZap, IconFlame, IconTarget,
  IconUsers, IconBookOpen, IconRotateCcw, IconArrowRight,
} from '@/components/ui/Icons';

const EVENT_COLOR = {
  STREAK: ACCENT.xp,
  WORDS: ACCENT.srs,
  GAMES: ACCENT.vocab,
  COMMUNITY: ACCENT.listening,
  LEARNING: STATUS.success,
} as const;
type EventType = keyof typeof EVENT_COLOR;

const EVENT_ICONS: Record<EventType, ReactNode> = {
  STREAK: <IconFlame size={20} />,
  WORDS: <IconTarget size={20} />,
  GAMES: <IconRotateCcw size={20} />,
  COMMUNITY: <IconUsers size={20} />,
  LEARNING: <IconBookOpen size={20} />,
};

const CHALLENGE_DESC_KEYS = ['learn_words_30', 'streak_5', 'game_sessions_10', 'complete_exams_2', 'writing_sessions_3', 'grammar_lessons_3'] as const;
type ChallengeDescKey = typeof CHALLENGE_DESC_KEYS[number];

function useChallengeDesc() {
  const t = useTranslations('progress.challenges.descriptions');
  const tFallback = useTranslations('progress.challenges');
  return (key: string) => (CHALLENGE_DESC_KEYS as readonly string[]).includes(key)
    ? t(key as ChallengeDescKey)
    : tFallback('defaultChallengeDesc');
}

function getEventType(key: string): EventType {
  if (key.includes('streak')) return 'STREAK';
  if (key.includes('word') || key.includes('review') || key.includes('daily')) return 'WORDS';
  if (key.includes('game') || key.includes('quiz')) return 'GAMES';
  if (key.includes('friend') || key.includes('community')) return 'COMMUNITY';
  return 'LEARNING';
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function Countdown({ label, target }: { label: string; target: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <span className="inline-flex items-center gap-1.5 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
      {label}
      <span className="mono font-bold" style={{ color: 'var(--streak)' }}>
        {h > 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${pad(h)}:${pad(m)}:${pad(s)}`}
      </span>
    </span>
  );
}

// ─── Quest card (daily + weekly) ──────────────────────────────────────────────
function QuestCard({
  title, description, current, target, completed, xpReward, eventType, href, big,
}: {
  title: string; description: string; current: number; target: number;
  completed: boolean; xpReward: number; eventType: EventType; href?: string; big?: boolean;
}) {
  const t = useTranslations('progress.challenges');
  const color = EVENT_COLOR[eventType];
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const cardColor = completed ? 'var(--success)' : color;

  const inner = (
    <article className="word-card-v2 relative flex h-full flex-col gap-3 overflow-hidden rounded-[14px] p-4"
      style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', ['--card-accent' as string]: cardColor } as React.CSSProperties}>
      <header className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
          {EVENT_ICONS[eventType]}
        </div>
        <span className="mono rounded-md px-2 py-1 text-[11px] font-bold" style={completed
          ? { background: 'color-mix(in srgb, var(--success) 14%, transparent)', color: 'var(--success)' }
          : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
          {current}/{target}
        </span>
      </header>
      <div>
        <h3 className="font-bold leading-snug" style={{ fontSize: big ? 16 : 15, letterSpacing: '-.01em', color: 'var(--theme-text-primary)' }}>{title}</h3>
        <p className="mt-1 text-caption leading-relaxed line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>{description}</p>
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{t('progressLabel')}</span>
          <span className="mono text-[11px] font-bold" style={{ color: cardColor }}>{pct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--theme-bg-secondary)' }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: cardColor }} />
        </div>
      </div>
      <footer className="mt-auto flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5">
          <IconZap size={14} style={{ color: 'var(--warn)' }} />
          <span className="mono text-body font-bold" style={{ color: 'var(--warn)' }}>+{xpReward}</span>
          <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>XP</span>
        </span>
        {completed ? (
          <span className="inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1 text-[11.5px] font-bold" style={{ background: 'color-mix(in srgb, var(--success) 14%, transparent)', color: 'var(--success)' }}>
            <IconCheck size={12} /> {t('claimReward')}
          </span>
        ) : href ? (
          <span className="inline-flex h-8 items-center gap-1.5 rounded-[9px] px-3.5 text-[12.5px] font-semibold text-white" style={{ background: color }}>
            {t('doNow')} <IconArrowRight size={12} />
          </span>
        ) : null}
      </footer>
    </article>
  );

  if (href && !completed) return <Link href={href} className="block h-full outline-none">{inner}</Link>;
  return inner;
}

export default function ChallengesPage() {
  const t = useTranslations('progress.challenges');
  const fmt = useFormatter();
  const getChallengeDesc = useChallengeDesc();
  const { data: daily, isLoading: isDailyLoading } = useDailyMissions();
  const { data: weekly, isLoading: isWeeklyLoading } = useWeeklyChallenges();
  const { data: history, isLoading: isHistoryLoading } = useChallengeHistory();
  const isLoading = isDailyLoading || isWeeklyLoading || isHistoryLoading;

  const dailyXP = (daily ?? []).reduce((s, m) => s + m.xpReward, 0);
  const dailyEarned = (daily ?? []).filter((m) => m.completed).reduce((s, m) => s + m.xpReward, 0);
  const weeklyXP = (weekly ?? []).reduce((s, c) => s + c.xpReward, 0);
  const totalAvail = dailyXP + weeklyXP;

  const dailyReset = useMemo(() => { const d = new Date(); d.setHours(24, 0, 0, 0); return d.getTime(); }, []);
  const weeklyReset = useMemo(() => { const d = new Date(); const days = (7 - d.getDay()) % 7 || 7; d.setDate(d.getDate() + days); d.setHours(24, 0, 0, 0); return d.getTime(); }, []);

  const dailyDesc = (m: DailyMission) => m.metadata?.description ?? t('defaultMissionDesc');

  // Group history by week start.
  const historyGroups = useMemo(() => {
    const map = new Map<string, ChallengeProgress[]>();
    (history ?? []).forEach((c) => {
      const key = c.weekStart;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    });
    return Array.from(map.entries());
  }, [history]);

  return (
    <div className="mx-auto max-w-360 px-4 py-6 sm:px-6">
      <Link href="/dashboard" className="mb-3 inline-flex items-center gap-1 text-caption font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
        <IconChevronLeft size={15} /> {t('back')}
      </Link>

      {/* Header + XP pool */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="v2-icongrad-warn flex h-13 w-13 shrink-0 items-center justify-center rounded-[14px] text-white" style={{ boxShadow: '0 8px 20px color-mix(in srgb, var(--warn) 40%, transparent)' }}>
            <IconTarget size={26} />
          </div>
          <div>
            <h1 className="text-h1 font-extrabold leading-tight" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{t('pageTitle')}</h1>
            <p className="mt-0.5 text-body" style={{ color: 'var(--theme-text-muted)' }}>{t('pageSubtitle')}</p>
          </div>
        </div>
        {totalAvail > 0 && (
          <div className="v2-hero-warn rounded-md px-4 py-2.5 text-center" style={{ border: '1px solid color-mix(in srgb, var(--warn) 30%, transparent)' }}>
            <div className="text-[10.5px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{t('xpPoolLabel')}</div>
            <div className="flex items-baseline justify-center gap-1">
              <IconZap size={15} style={{ color: 'var(--warn)' }} />
              <span className="mono text-h2 font-extrabold" style={{ color: 'var(--warn)' }}>{totalAvail}</span>
            </div>
          </div>
        )}
      </header>

      {isLoading ? (
        <GridSkeleton cols={3} count={6} height="h-52" rounded="rounded-[14px]" bordered gap="gap-3" />
      ) : (
        <div className="space-y-7">
          {/* Daily */}
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--streak)' }} />
                <h2 className="text-caption font-semibold uppercase" style={{ color: 'var(--theme-text-secondary)', letterSpacing: '.06em' }}>
                  {t('todayMissions')} · <span className="mono">{dailyEarned}/{dailyXP}</span> XP
                </h2>
              </div>
              <Countdown label={t('refreshIn')} target={dailyReset} />
            </div>
            {daily && daily.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {daily.map((m) => (
                  <QuestCard key={m.id} title={m.titleVi} description={dailyDesc(m)} current={m.current} target={m.target}
                    completed={m.completed} xpReward={m.xpReward} eventType={getEventType(m.missionKey)} href={m.metadata?.href ?? '/dashboard'} />
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-caption font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{t('dailyEmpty')}</p>
            )}
          </section>

          {/* Weekly */}
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--violet)' }} />
                <h2 className="text-caption font-semibold uppercase" style={{ color: 'var(--theme-text-secondary)', letterSpacing: '.06em' }}>
                  {t('weekChallenges')} · <span className="mono">{weeklyXP}</span> XP
                </h2>
              </div>
              <Countdown label={t('expiresIn')} target={weeklyReset} />
            </div>
            {weekly && weekly.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {weekly.map((c) => (
                  <QuestCard key={c.id} title={c.titleVi} description={getChallengeDesc(c.challengeKey)} current={c.current} target={c.target}
                    completed={c.completed} xpReward={c.xpReward} eventType={getEventType(c.challengeKey)} big />
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-caption font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{t('weeklyEmpty')}</p>
            )}
          </section>

          {/* History grouped by week */}
          {historyGroups.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <IconRotateCcw size={14} style={{ color: 'var(--theme-text-muted)' }} />
                <h2 className="text-caption font-semibold uppercase" style={{ color: 'var(--theme-text-secondary)', letterSpacing: '.06em' }}>{t('historyHeader')}</h2>
              </div>
              <div className="space-y-3">
                {historyGroups.map(([week, items]) => {
                  const grpXP = items.reduce((s, it) => s + it.xpReward, 0);
                  return (
                    <div key={week} className="rounded-[13px] p-4" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                          {t('weekPrefix', { date: fmt.dateTime(new Date(week), { dateStyle: 'short' }) })}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{t('challengeCount', { count: items.length })}</span>
                          <span className="mono text-caption font-bold" style={{ color: 'var(--success)' }}>+{grpXP} XP</span>
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {items.map((it) => {
                          const color = EVENT_COLOR[getEventType(it.challengeKey)];
                          return (
                            <div key={it.id} className="flex items-center gap-2.5 rounded-[9px] px-3 py-2" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
                                {EVENT_ICONS[getEventType(it.challengeKey)]}
                              </div>
                              <span className="min-w-0 flex-1 truncate text-caption font-medium" style={{ color: 'var(--theme-text-primary)' }}>{it.titleVi}</span>
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold" style={{ color: 'var(--success)' }}>
                                <IconCheck size={11} /><span className="mono">+{it.xpReward}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
