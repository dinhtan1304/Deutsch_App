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
import { Card, Button, Loading, BetaBadge } from '@/components/ui';
import { FeedbackModal } from '@/components/layout/FeedbackModal';
import { RoomList } from '@/components/arena/RoomList';
import { IconBug, IconFlame } from '@/components/ui/Icons';

const MODES: {
  key: ArenaMode;
  labelKey: 'viToDe' | 'deToVi' | 'mixed';
  subKey: 'modeViToDeSub' | 'modeDeToViSub' | 'modeMixedSub';
  badge: string;
  gradient: string;
}[] = [
  { key: 'vi_to_de', labelKey: 'viToDe', subKey: 'modeViToDeSub', badge: 'VI→DE', gradient: GRADIENT.history },
  { key: 'de_to_vi', labelKey: 'deToVi', subKey: 'modeDeToViSub', badge: 'DE→VI', gradient: GRADIENT.examWriting },
  { key: 'mixed', labelKey: 'mixed', subKey: 'modeMixedSub', badge: 'MIX', gradient: GRADIENT.vocab },
];

function formatWinRate(stats: ArenaPlayerStats | null): string {
  if (!stats || stats.totalMatches === 0) return '0%';
  return `${Math.round((stats.wins / stats.totalMatches) * 100)}%`;
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <div
        className="rounded-2xl p-6 sm:p-8 mb-6 text-white shadow-lifted"
        style={{
          background: GRADIENT.vocab,
          backgroundSize: '200% 200%',
          animation: 'arenaHeroShift 7s ease-in-out infinite',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                {t('lobby.heroTitle')}
              </h1>
              <BetaBadge size="md" />
            </div>
            <p className="text-body mt-1 opacity-90">
              {t('lobby.heroSub')}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setFeedbackOpen(true)}
                className="text-caption inline-flex items-center gap-1 underline-offset-2 hover:underline opacity-85 hover:opacity-100 transition-opacity"
                style={{ color: '#fff' }}
              >
                <IconBug size={12} />
                <span>{t('lobby.reportBug')}</span>
              </button>
              <span className="opacity-50" style={{ color: '#fff' }}>·</span>
              <Link
                href="/community/rules"
                className="text-caption inline-flex items-center gap-1 underline-offset-2 hover:underline opacity-85 hover:opacity-100 transition-opacity"
                style={{ color: '#fff' }}
              >
                <span>📜</span>
                <span>{t('lobby.communityRules')}</span>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 min-w-0 sm:min-w-[360px]">
            {statsLoading ? (
              <div className="col-span-4 flex justify-center py-3"><Loading /></div>
            ) : (
              <>
                <Stat label={t('lobby.statRating')} value={stats?.rating ?? 1000} />
                <Stat label={t('lobby.statWinRate')} value={formatWinRate(stats)} />
                <Stat label={t('lobby.statWld')} value={`${stats?.wins ?? 0}-${stats?.losses ?? 0}-${stats?.draws ?? 0}`} />
                <Stat label={t('lobby.statStreak')} value={stats?.currentStreak ?? 0} />
              </>
            )}
          </div>
        </div>
      </div>

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

      <h2 className="text-lead font-semibold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
        {t('lobby.chooseMode')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {MODES.map((m) => {
          const isSelected = selectedMode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setSelectedMode(m.key)}
              disabled={isQueueing}
              className="arena-mode-card text-left rounded-2xl p-4"
              style={{
                background: isSelected ? m.gradient : 'var(--theme-bg-card)',
                color: isSelected ? '#fff' : 'var(--theme-text-primary)',
                border: `1px solid ${isSelected ? 'transparent' : 'var(--theme-border)'}`,
                boxShadow: isSelected
                  ? '0 0 0 2px rgba(168,85,247,.35), 0 12px 28px rgba(139,92,246,.35)'
                  : 'var(--shadow-soft)',
                opacity: isQueueing && !isSelected ? 0.4 : 1,
                cursor: isQueueing ? 'not-allowed' : 'pointer',
              }}
            >
              <div className="text-caption font-bold mb-2 opacity-85">{m.badge}</div>
              <div className="font-semibold">{t(`modes.${m.labelKey}` as 'modes.mixed')}</div>
              <div
                className="text-caption mt-1"
                style={{ color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--theme-text-muted)' }}
              >
                {t(`lobby.${m.subKey}` as 'lobby.modeMixedSub')}
              </div>
            </button>
          );
        })}
      </div>

      {!isQueueing ? (
        <div
          style={{
            borderRadius: 16,
            animation: 'marketingPulse 2.6s ease-in-out infinite',
          }}
        >
          <Button
            onClick={() => joinQueue(selectedMode)}
            variant="primary"
            size="lg"
            fullWidth
            style={{ background: GRADIENT.vocab }}
          >
            <span className="inline-flex items-center gap-2">
              <IconFlame size={18} />
              <span>{t('lobby.findMatch')}</span>
            </span>
          </Button>
        </div>
      ) : (
        <Button onClick={leaveQueue} variant="outline" size="lg" fullWidth>
          {t('lobby.cancelSearch', { seconds: Math.floor(elapsed / 1000) })}
        </Button>
      )}

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

      <RoomList />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentMatchesCard items={recentMatches} loading={listsLoading} myUserId={myUserId} />
        <TopPlayersCard items={topPlayers} loading={listsLoading} myUserId={myUserId} />
      </div>

      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  const shown = useCountUp(value, 700);
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.14)' }}>
      <div className="text-caption opacity-80">{label}</div>
      <div className="text-body font-bold tabular-nums">{shown}</div>
    </div>
  );
}

/**
 * Count-up from 0 to `target` over `durationMs`. Handles `"42%"` strings by
 * preserving the suffix while animating the leading number.
 */
function useCountUp(target: string | number, durationMs: number): string | number {
  const numeric = typeof target === 'number' ? target : Number.parseFloat(String(target));
  const suffix = typeof target === 'string' ? String(target).replace(/^[-\d.]+/, '') : '';
  const isAnimatable = Number.isFinite(numeric);
  const [shown, setShown] = useState<number>(isAnimatable ? 0 : 0);

  useEffect(() => {
    if (!isAnimatable) return;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const progress = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(eased * numeric));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [numeric, durationMs, isAnimatable]);

  if (!isAnimatable) return target;
  return `${shown}${suffix}`;
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
                  style={{ background: medalBg, color: i < 3 ? '#fff' : 'var(--theme-text-secondary)' }}
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
