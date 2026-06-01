'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useArenaSocket } from '@/hooks/useArenaSocket';
import { useArenaStore } from '@/stores/arenaStore';
import {
  ARENA_BOT_FALLBACK_MS,
  ARENA_EXPANSION_1_MS,
  ARENA_EXPANSION_2_MS,
  type ArenaMode,
} from '@/types/arena-events.types';
import { arenaApi, type ArenaPlayerStats, type ArenaMatchSummary, type ArenaLeaderboardRow } from '@/lib/api/arena';
import { useAuthStore } from '@/stores/authStore';
import { GRADIENT, ACCENT, STATUS } from '@/lib/tokens';
import { Card, Loading, BetaBadge } from '@/components/ui';
import { FeedbackModal } from '@/components/layout/FeedbackModal';
import { RoomList } from '@/components/arena/RoomList';
import { IconBug, IconFlame } from '@/components/ui/Icons';

const MODES: {
  key: ArenaMode;
  labelKey: 'viToDe' | 'deToVi' | 'mixed';
  subKey: 'modeViToDeSub' | 'modeDeToViSub' | 'modeMixedSub';
  badge: string;
  gradient: string;
  icon: string;
  color: string;
}[] = [
  { key: 'vi_to_de', labelKey: 'viToDe', subKey: 'modeViToDeSub', badge: 'VI→DE', gradient: GRADIENT.history, icon: '🇻🇳', color: 'var(--der)' },
  { key: 'de_to_vi', labelKey: 'deToVi', subKey: 'modeDeToViSub', badge: 'DE→VI', gradient: GRADIENT.examWriting, icon: '🇩🇪', color: 'var(--success)' },
  { key: 'mixed', labelKey: 'mixed', subKey: 'modeMixedSub', badge: 'MIX', gradient: GRADIENT.vocab, icon: '🎲', color: 'var(--violet)' },
];

function formatWinRate(stats: ArenaPlayerStats | null): string {
  if (!stats || stats.totalMatches === 0) return '0%';
  return `${Math.round((stats.wins / stats.totalMatches) * 100)}%`;
}

// Rating ring — fills toward the next 100-point milestone.
function RatingRing({ rating, size = 124 }: { rating: number; size?: number }) {
  const t = useTranslations('arena');
  const milestone = Math.ceil((rating + 1) / 100) * 100;
  const base = milestone - 100;
  const pct = Math.max(0, Math.min(100, ((rating - base) / 100) * 100));
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--theme-border)" strokeWidth="6" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--accent)" strokeWidth="6" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)', filter: 'drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 55%, transparent))' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="mono text-[32px] font-extrabold leading-none" style={{ letterSpacing: '-.03em', color: 'var(--theme-text-primary)' }}>{rating}</span>
        <span className="mt-1 text-[10px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.08em' }}>{t('lobby.statRating')}</span>
      </div>
    </div>
  );
}

function Record({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="min-w-[72px] rounded-[10px] px-3.5 py-2" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
      <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{label}</div>
      <div className="mono text-[18px] font-extrabold" style={{ letterSpacing: '-.02em', color }}>{value}</div>
    </div>
  );
}

export default function ArenaLobby() {
  const t = useTranslations('arena');
  const router = useRouter();
  const params = useSearchParams();
  const [selectedMode, setSelectedMode] = useState<ArenaMode>('mixed');
  const [stats, setStats] = useState<ArenaPlayerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [recentMatches, setRecentMatches] = useState<ArenaMatchSummary[]>([]);
  const [topPlayers, setTopPlayers] = useState<ArenaLeaderboardRow[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
  const myUserId = useAuthStore((s) => s.user?.id);
  const phase = useArenaStore((s) => s.phase);
  const queueStartedAt = useArenaStore((s) => s.queueStartedAt);
  const queueEstimatedWaitMs = useArenaStore((s) => s.queueEstimatedWaitMs);
  const match = useArenaStore((s) => s.match);
  const lastError = useArenaStore((s) => s.lastError);
  const connectionStatus = useArenaStore((s) => s.connectionStatus);
  const resetStore = useArenaStore((s) => s.reset);
  const replaced = params.get('replaced') === '1';
  const { joinQueue, leaveQueue } = useArenaSocket();

  useEffect(() => {
    let cancelled = false;
    arenaApi
      .getMyStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      arenaApi.getHistory(1, 5).catch(() => ({ data: [] as ArenaMatchSummary[] })),
      arenaApi.getLeaderboard(5).catch(() => [] as ArenaLeaderboardRow[]),
    ])
      .then(([history, leaderboard]) => {
        if (cancelled) return;
        setRecentMatches((history as { data: ArenaMatchSummary[] }).data ?? []);
        setTopPlayers(leaderboard as ArenaLeaderboardRow[]);
      })
      .finally(() => {
        if (!cancelled) setListsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Only redirect when there's a LIVE match in progress.
  // 'match-result' and 'round-reveal' are completed/transient end-states —
  // leaving them in the store would bounce the user back from the lobby
  // (and the result page navigates here via the "Đấu trận khác" button).
  useEffect(() => {
    const isLive = phase === 'countdown' || phase === 'playing';
    if (match?.matchId && isLive) {
      router.replace(`/arena/match/${match.matchId}`);
    }
  }, [match, phase, router]);

  // Clear leftover match-result state when arriving fresh at the lobby
  // (e.g., after finishing a previous match and clicking "Đấu trận khác").
  useEffect(() => {
    if (phase === 'match-result' || phase === 'round-reveal') {
      resetStore();
    }
    // Only run once on mount — subsequent phase changes are driven by the socket.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (phase !== 'matchmaking' || !queueStartedAt) {
      return;
    }
    const tick = () => setElapsed(Date.now() - queueStartedAt);
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [phase, queueStartedAt]);

  const isQueueing = phase === 'matchmaking';
  const queueCopy = useMemo(() => {
    const fallbackMs = queueEstimatedWaitMs ?? ARENA_BOT_FALLBACK_MS;
    if (elapsed >= fallbackMs) return t('lobby.queuePreparingBot');
    if (elapsed >= ARENA_EXPANSION_2_MS) return t('lobby.queueExpandWide');
    if (elapsed >= ARENA_EXPANSION_1_MS) return t('lobby.queueExpandNear');
    return t('lobby.queueSearching');
  }, [elapsed, queueEstimatedWaitMs, t]);

  const connectionCopy =
    connectionStatus === 'connected'
      ? null
      : connectionStatus === 'connecting'
        ? t('lobby.connConnecting')
        : connectionStatus === 'reconnecting'
          ? t('lobby.connReconnecting')
          : t('lobby.connDisconnected');

  // Opponents near your rating (real leaderboard rows, excluding you).
  const myRating = stats?.rating ?? 1000;
  const liveOpponents = useMemo(
    () => [...topPlayers]
      .filter((p) => p.userId !== myUserId)
      .sort((a, b) => Math.abs(a.rating - myRating) - Math.abs(b.rating - myRating))
      .slice(0, 4),
    [topPlayers, myUserId, myRating],
  );

  return (
    <div className="mx-auto max-w-360 px-4 py-2 sm:px-6">
      {/* Hero: rating ring + record + CTA */}
      <section className="relative mb-5 flex flex-col gap-6 overflow-hidden rounded-2xl p-5 sm:p-6 lg:flex-row lg:items-center"
        style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <div aria-hidden className="pointer-events-none absolute -left-16 -top-24 h-72 w-72 rounded-full blur-3xl" style={{ background: 'color-mix(in srgb, var(--accent) 9%, transparent)' }} />
        {statsLoading ? <div className="flex h-31 w-31 items-center justify-center"><Loading /></div> : <RatingRing rating={stats?.rating ?? 1000} />}
        <div className="relative z-10 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-h2 font-extrabold" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{t('lobby.heroTitle')}</h1>
            <BetaBadge size="md" />
          </div>
          <p className="mt-1 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            {(() => { const r = stats?.rating ?? 1000; const next = Math.ceil((r + 1) / 100) * 100; return t('lobby.toNextMilestone', { points: next - r, target: next }); })()} · {t('lobby.roundsInfo')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Record label={t('lobby.recWins')} value={stats?.wins ?? 0} color="var(--success)" />
            <Record label={t('lobby.recLosses')} value={stats?.losses ?? 0} color="var(--danger)" />
            <Record label={t('lobby.recDraws')} value={stats?.draws ?? 0} color="var(--warn)" />
            <Record label={t('lobby.statWinRate')} value={formatWinRate(stats)} color="var(--accent)" />
            <Record label={t('lobby.statStreak')} value={`${stats?.currentStreak ?? 0} 🔥`} color="var(--streak)" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            <button type="button" onClick={() => setFeedbackOpen(true)} className="inline-flex items-center gap-1 underline-offset-2 hover:underline"><IconBug size={12} /><span>{t('lobby.reportBug')}</span></button>
            <span style={{ opacity: 0.5 }}>·</span>
            <Link href="/community/rules" className="inline-flex items-center gap-1 underline-offset-2 hover:underline"><span>📜</span><span>{t('lobby.communityRules')}</span></Link>
          </div>
        </div>
        <div className="relative z-10 flex shrink-0 flex-col gap-2 lg:w-56">
          {!isQueueing ? (
            <button onClick={() => joinQueue(selectedMode)} className="v2-match-grad flex h-12 items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5" style={{ boxShadow: '0 8px 24px color-mix(in srgb, var(--accent) 40%, transparent)' }}>
              <IconFlame size={18} /> {t('lobby.rankedCta')}
            </button>
          ) : (
            <button onClick={leaveQueue} className="flex h-12 items-center justify-center rounded-xl text-[15px] font-bold" style={{ border: '1px solid var(--danger)', color: 'var(--danger)' }}>
              {t('lobby.cancelSearch', { seconds: Math.floor(elapsed / 1000) })}
            </button>
          )}
        </div>
      </section>

      {connectionCopy && (
        <Alert tone="warning" className="mb-4">
          {connectionCopy}
        </Alert>
      )}

      {replaced && (
        <Alert tone="warning" className="mb-4">
          {t('lobby.replacedWarning')}
        </Alert>
      )}

      {lastError && (
        <Alert tone="danger" className="mb-4">
          {lastError.message}
        </Alert>
      )}

      <h2 className="mb-3 text-caption font-semibold uppercase tracking-widest" style={{ color: 'var(--theme-text-secondary)' }}>
        {t('lobby.chooseMode')}
      </h2>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {MODES.map((m) => {
          const isSelected = selectedMode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setSelectedMode(m.key)}
              disabled={isQueueing}
              className="word-card-v2 relative rounded-[13px] p-4 text-left"
              style={{
                background: 'var(--theme-bg-card)',
                border: `1.5px solid ${isSelected ? m.color : 'var(--theme-border)'}`,
                ['--card-accent']: m.color,
                boxShadow: isSelected ? `0 6px 18px color-mix(in srgb, ${m.color} 22%, transparent)` : 'none',
                opacity: isQueueing && !isSelected ? 0.4 : 1,
                cursor: isQueueing ? 'not-allowed' : 'pointer',
              } as React.CSSProperties}
            >
              <div className="mb-2 flex items-center gap-2.5">
                <span className="text-h2">{m.icon}</span>
                <span className="mono rounded-[5px] px-2 py-0.5 text-[11px] font-bold" style={isSelected ? { background: m.color, color: 'white' } : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>{m.badge}</span>
                {isSelected && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ background: m.color }}>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                )}
              </div>
              <div className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t(`modes.${m.labelKey}` as 'modes.mixed')}</div>
              <div className="mt-1 text-caption leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{t(`lobby.${m.subKey}` as 'lobby.modeMixedSub')}</div>
            </button>
          );
        })}
      </div>

      {isQueueing && (
        <div className="arena-queue-ring mt-4 rounded-2xl">
          <Card>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full shrink-0"
                style={{
                  background: GRADIENT.vocab,
                  animation: 'marketingPulse 1.4s ease-in-out infinite',
                }}
              />
              <div className="min-w-0">
                <div className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                  {t('lobby.searching')}
                </div>
                <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                  {queueCopy}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Opponents near your rating */}
      {liveOpponents.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="v2-pulse h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success)' }} />
            <h2 className="text-caption font-semibold uppercase tracking-widest" style={{ color: 'var(--theme-text-secondary)' }}>{t('lobby.liveOpponents')}</h2>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {liveOpponents.map((o) => {
              const diff = o.rating - myRating;
              return (
                <div key={o.userId} className="word-card-v2 flex items-center gap-2.5 rounded-[11px] p-3"
                  style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', ['--card-accent']: 'var(--accent)' } as React.CSSProperties}>
                  <div className="relative shrink-0">
                    <div className="v2-avatar-grad flex h-9 w-9 items-center justify-center rounded-[9px] text-caption font-bold text-white">{(o.user.name ?? '?').charAt(0).toUpperCase()}</div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full" style={{ background: 'var(--success)', border: '2px solid var(--theme-bg-card)' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-caption font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{o.user.name ?? t('player')}</div>
                    <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                      <span className="mono">{o.rating}</span>
                      <span className="ml-1" style={{ color: Math.abs(diff) <= 30 ? 'var(--success)' : 'var(--theme-text-muted)' }}>({diff >= 0 ? '+' : ''}{diff})</span>
                    </div>
                  </div>
                  <button onClick={() => joinQueue(selectedMode)} disabled={isQueueing}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] disabled:opacity-40"
                    style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)' }} aria-label="match">
                    <IconFlame size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <RoomList />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentMatchesCard items={recentMatches} loading={listsLoading} myUserId={myUserId} />
        <TopPlayersCard items={topPlayers} loading={listsLoading} myUserId={myUserId} />
      </div>

      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}

function Alert({
  tone,
  className,
  children,
}: {
  tone: 'warning' | 'danger';
  className?: string;
  children: React.ReactNode;
}) {
  const color = tone === 'warning' ? ACCENT.xp : STATUS.danger;
  return (
    <div
      className={`px-4 py-3 rounded-xl text-body ${className ?? ''}`}
      style={{
        background: tone === 'warning' ? 'rgba(245,158,11,.12)' : 'rgba(239,68,68,.10)',
        border: `1px solid ${tone === 'warning' ? 'rgba(245,158,11,.4)' : 'rgba(239,68,68,.35)'}`,
        color,
      }}
    >
      {children}
    </div>
  );
}

function SectionCard({
  title,
  href,
  hrefLabel,
  children,
}: {
  title: string;
  href: string;
  hrefLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'var(--theme-bg-card)',
        border: '1px solid var(--theme-border)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lead font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
          {title}
        </h3>
        <Link
          href={href}
          className="text-caption underline-offset-2 hover:underline"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {hrefLabel} →
        </Link>
      </div>
      {children}
    </div>
  );
}

function RecentMatchesCard({
  items,
  loading,
  myUserId,
}: {
  items: ArenaMatchSummary[];
  loading: boolean;
  myUserId: string | undefined;
}) {
  const t = useTranslations('arena');
  return (
    <SectionCard title={t('lobby.recentTitle')} href="/arena/history" hrefLabel={t('lobby.viewAll')}>
      {loading ? (
        <div className="flex justify-center py-6"><Loading /></div>
      ) : items.length === 0 ? (
        <div className="text-caption text-center py-6" style={{ color: 'var(--theme-text-muted)' }}>
          {t('lobby.recentEmpty')}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((m, i) => {
            const isP1 = m.player1Id === myUserId;
            const myScore = isP1 ? m.player1Score : m.player2Score;
            const oppScore = isP1 ? m.player2Score : m.player1Score;
            const opp = isP1 ? m.player2 : m.player1;
            const isDraw = !m.winnerId;
            const iWon = !isDraw && m.winnerId === myUserId;
            const tone = isDraw
              ? 'var(--theme-text-secondary)'
              : iWon
                ? STATUS.success
                : STATUS.danger;
            const letter = isDraw ? 'H' : iWon ? 'W' : 'L';
            return (
              <Link key={m.id} href={`/arena/match/${m.id}/result`} className="block">
                <div
                  className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:opacity-90"
                  style={{
                    background: 'var(--theme-bg-secondary)',
                    border: '1px solid var(--theme-border)',
                    animation: 'slideUp 0.35s ease backwards',
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-caption shrink-0"
                    style={{
                      background: isDraw
                        ? 'var(--theme-bg-card)'
                        : iWon
                          ? 'rgba(34,197,94,.16)'
                          : 'rgba(239,68,68,.16)',
                      color: tone,
                    }}
                  >
                    {letter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-body font-semibold truncate"
                      style={{ color: 'var(--theme-text-primary)' }}
                    >
                      {t('vs')} {opp?.name ?? t('bot')}
                      {m.isBotMatch && (
                        <span className="ml-1 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                          · {t('bot')}
                        </span>
                      )}
                    </div>
                    <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                      {m.mode} · {m.level}
                    </div>
                  </div>
                  <div className="text-body font-bold tabular-nums shrink-0" style={{ color: tone }}>
                    {myScore} - {oppScore}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function TopPlayersCard({
  items,
  loading,
  myUserId,
}: {
  items: ArenaLeaderboardRow[];
  loading: boolean;
  myUserId: string | undefined;
}) {
  const t = useTranslations('arena');
  return (
    <SectionCard title={t('lobby.topTitle')} href="/arena/leaderboard" hrefLabel={t('lobby.viewAll')}>
      {loading ? (
        <div className="flex justify-center py-6"><Loading /></div>
      ) : items.length === 0 ? (
        <div className="text-caption text-center py-6" style={{ color: 'var(--theme-text-muted)' }}>
          {t('lobby.topEmpty')}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r, i) => {
            const isMe = r.userId === myUserId;
            const medalBg =
              i === 0
                ? GRADIENT.xpGold
                : i === 1
                  ? GRADIENT.silver
                  : i === 2
                    ? GRADIENT.bronze
                    : 'var(--theme-bg-card)';
            return (
              <div
                key={r.userId}
                className="flex items-center gap-3 px-3 py-2 rounded-xl"
                style={{
                  background: isMe ? 'rgba(139,92,246,.12)' : 'var(--theme-bg-secondary)',
                  border: `1px solid ${isMe ? 'rgba(139,92,246,.4)' : 'var(--theme-border)'}`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-caption shrink-0"
                  style={{ background: medalBg, color: i < 3 ? 'white' : 'var(--theme-text-secondary)' }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-body font-semibold truncate"
                    style={{ color: 'var(--theme-text-primary)' }}
                  >
                    {r.user.name ?? t('player')}
                    {isMe && (
                      <span className="ml-1 text-caption" style={{ color: ACCENT.vocab }}>
                        · {t('you')}
                      </span>
                    )}
                  </div>
                  <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                    {t('lobby.topStatLine', { wins: r.wins, losses: r.losses, streak: r.currentStreak })}
                  </div>
                </div>
                <div
                  className="text-body font-bold tabular-nums shrink-0"
                  style={{ color: 'var(--theme-text-primary)' }}
                >
                  {r.rating}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
