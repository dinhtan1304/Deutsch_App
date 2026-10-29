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
import { GRADIENT } from '@/lib/tokens';
import { Loading, BetaBadge } from '@/components/ui';
import { FeedbackModal } from '@/components/layout/FeedbackModal';
import { RoomList } from '@/components/arena/RoomList';
import { TierBadge, tierFor } from '@/components/arena/ArenaTier';
import { IconBug, IconFlame } from '@/components/ui/Icons';

const MODES: {
  key: ArenaMode;
  labelKey: 'viToDe' | 'deToVi' | 'mixed';
  subKey: 'modeViToDeSub' | 'modeDeToViSub' | 'modeMixedSub';
  badge: string;
  icon: string;
}[] = [
  { key: 'vi_to_de', labelKey: 'viToDe', subKey: 'modeViToDeSub', badge: 'VI→DE', icon: '🇻🇳' },
  { key: 'de_to_vi', labelKey: 'deToVi', subKey: 'modeDeToViSub', badge: 'DE→VI', icon: '🇩🇪' },
  { key: 'mixed', labelKey: 'mixed', subKey: 'modeMixedSub', badge: 'MIX', icon: '🎲' },
];

function formatWinRate(stats: ArenaPlayerStats | null): string {
  if (!stats || stats.totalMatches === 0) return '0%';
  return `${Math.round((stats.wins / stats.totalMatches) * 100)}%`;
}

function formatClock(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function initialOf(name: string | null | undefined) {
  return (name ?? '?').charAt(0).toUpperCase();
}

// One stat cell of the player HUD.
function HudStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="arena-panel rounded-xl px-3 py-2 text-center">
      <div className="mono text-lead font-extrabold leading-tight" style={{ color }}>{value}</div>
      <div className="arena-muted text-[10px] font-semibold uppercase tracking-wider">{label}</div>
    </div>
  );
}

function PanelTitle({ children, href, hrefLabel }: { children: React.ReactNode; href?: string; hrefLabel?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-caption font-bold uppercase tracking-widest" style={{ color: 'var(--ag-text)' }}>{children}</h2>
      {href && hrefLabel && (
        <Link href={href} className="arena-muted text-caption underline-offset-2 hover:underline">{hrefLabel} →</Link>
      )}
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
  const myName = useAuthStore((s) => s.user?.name);
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
  const tier = tierFor(myRating);
  const liveOpponents = useMemo(
    () => [...topPlayers]
      .filter((p) => p.userId !== myUserId)
      .sort((a, b) => Math.abs(a.rating - myRating) - Math.abs(b.rating - myRating))
      .slice(0, 4),
    [topPlayers, myUserId, myRating],
  );
  const selected = MODES.find((m) => m.key === selectedMode)!;

  return (
    <div className="mx-auto max-w-360">
      {connectionCopy && <Alert tone="warning">{connectionCopy}</Alert>}
      {replaced && <Alert tone="warning">{t('lobby.replacedWarning')}</Alert>}
      {lastError && <Alert tone="danger">{lastError.message}</Alert>}

      <section className="arena-stage relative rounded-3xl p-4 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* ── Player card ── */}
          <div className="arena-panel flex flex-col gap-4 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              {statsLoading ? <div className="flex h-24 w-22 items-center justify-center"><Loading /></div> : <TierBadge rating={myRating} size={86} />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-lead font-bold">{myName ?? t('player')}</span>
                  <BetaBadge size="sm" />
                </div>
                <div className="text-caption font-bold uppercase tracking-widest" style={{ color: 'var(--ag-gold)' }}>{t(`tiers.${tier.key}`)}</div>
                <div className="mono mt-1 text-[34px] font-black leading-none" style={{ letterSpacing: '-.03em' }}>
                  {myRating}
                  <span className="arena-muted ml-1.5 text-caption font-semibold tracking-normal">{t('lobby.statRating')}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,.08)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${tier.progress}%`, background: tier.next ? tierFor(tier.next.min).gradient : tier.gradient }} />
              </div>
              <div className="arena-muted mt-1.5 text-caption">
                {tier.next
                  ? t('lobby.toNextTier', { points: tier.pointsToNext, tier: t(`tiers.${tier.next.key}`) })
                  : t('lobby.maxTier')}
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              <HudStat label={t('lobby.recWins')} value={stats?.wins ?? 0} color="var(--ag-win)" />
              <HudStat label={t('lobby.recLosses')} value={stats?.losses ?? 0} color="var(--ag-lose)" />
              <HudStat label={t('lobby.recDraws')} value={stats?.draws ?? 0} color="var(--ag-text)" />
              <HudStat label={t('lobby.statWinRate')} value={formatWinRate(stats)} color="var(--ag-me)" />
              <HudStat label={t('lobby.statStreak')} value={`${stats?.currentStreak ?? 0}🔥`} color="var(--ag-gold)" />
            </div>

            <div className="arena-muted mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-caption">
              <button type="button" onClick={() => setFeedbackOpen(true)} className="inline-flex items-center gap-1 underline-offset-2 hover:underline"><IconBug size={12} />{t('lobby.reportBug')}</button>
              <span aria-hidden>·</span>
              <Link href="/community/rules" className="underline-offset-2 hover:underline">📜 {t('lobby.communityRules')}</Link>
            </div>
          </div>

          {/* ── Battle setup ── (first on phones: play is one tap away) */}
          <div className="order-first flex flex-col gap-4 lg:order-none">
            <div>
              <h1 className="text-h1 font-black uppercase" style={{ letterSpacing: '.02em', textShadow: '0 4px 24px rgba(167,139,250,.55)' }}>{t('lobby.heroTitle')}</h1>
              <p className="arena-muted mt-1 text-body">{t('lobby.heroSub')}</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {MODES.map((m) => (
                <button key={m.key} type="button" aria-pressed={selectedMode === m.key}
                  onClick={() => setSelectedMode(m.key)} disabled={isQueueing}
                  className="arena-mode flex flex-col items-center gap-1.5 rounded-2xl px-2 py-4 text-center disabled:opacity-40">
                  <span className="text-[34px] leading-none">{m.icon}</span>
                  <span className="mono rounded-md px-2 py-0.5 text-[11px] font-bold"
                    style={selectedMode === m.key ? { background: 'var(--ag-gold)', color: 'var(--ag-bg1)' } : { background: 'rgba(255,255,255,.08)', color: 'var(--ag-muted)' }}>
                    {m.badge}
                  </span>
                  <span className="text-body font-bold">{t(`modes.${m.labelKey}`)}</span>
                  <span className="arena-muted hidden text-caption leading-snug sm:block">{t(`lobby.${m.subKey}`)}</span>
                </button>
              ))}
            </div>

            <button type="button" onClick={() => joinQueue(selectedMode)} disabled={isQueueing}
              className="arena-play-btn flex h-16 items-center justify-center gap-3 rounded-2xl text-xl font-black uppercase tracking-wider">
              <IconFlame size={24} /> {t('lobby.playCta')}
              <span className="mono rounded-md px-2 py-0.5 text-caption" style={{ background: 'rgba(42,19,0,.15)' }}>{selected.badge}</span>
            </button>
            <p className="arena-muted -mt-1 text-center text-caption">{t('lobby.roundsInfo')}</p>
          </div>
        </div>

        {/* ── Bottom panels ── */}
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="arena-panel rounded-2xl p-4">
            <PanelTitle href="/arena/leaderboard" hrefLabel={t('lobby.viewAll')}>{t('lobby.topTitle')}</PanelTitle>
            <Podium items={topPlayers} loading={listsLoading} myUserId={myUserId} />
          </div>

          <div className="arena-panel rounded-2xl p-4">
            <PanelTitle>
              <span className="inline-flex items-center gap-1.5">
                <span className="v2-pulse h-1.5 w-1.5 rounded-full" style={{ background: 'var(--ag-win)' }} />
                {t('lobby.nearYou')}
              </span>
            </PanelTitle>
            {listsLoading ? (
              <div className="flex justify-center py-6"><Loading /></div>
            ) : liveOpponents.length === 0 ? (
              <p className="arena-muted py-6 text-center text-caption">{t('lobby.topEmpty')}</p>
            ) : (
              <div className="space-y-2">
                {liveOpponents.map((o) => {
                  const diff = o.rating - myRating;
                  return (
                    <div key={o.userId} className="flex items-center gap-3 rounded-xl px-2.5 py-2" style={{ background: 'rgba(255,255,255,.04)' }}>
                      <TierBadge rating={o.rating} size={30} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-body font-semibold">{o.user.name ?? t('player')}</div>
                        <div className="arena-muted text-caption">
                          <span className="mono">{o.rating}</span>
                          <span className="ml-1" style={{ color: Math.abs(diff) <= 30 ? 'var(--ag-win)' : undefined }}>({diff >= 0 ? '+' : ''}{diff})</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => joinQueue(selectedMode)} disabled={isQueueing}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg disabled:opacity-40"
                        style={{ background: 'rgba(251,191,36,.16)', color: 'var(--ag-gold)' }} aria-label={t('lobby.findMatch')}>
                        <IconFlame size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="arena-panel rounded-2xl p-4">
            <PanelTitle href="/arena/history" hrefLabel={t('lobby.viewAll')}>{t('lobby.recentTitle')}</PanelTitle>
            <RecentMatches items={recentMatches} loading={listsLoading} myUserId={myUserId} />
          </div>
        </div>
      </section>

      {/* Friends / custom rooms keep the app's normal theme */}
      <RoomList />

      {isQueueing && (
        <MatchmakingOverlay
          elapsedMs={elapsed}
          copy={queueCopy}
          name={myName}
          rating={myRating}
          modeBadge={selected.badge}
          modeLabel={t(`modes.${selected.labelKey}`)}
          onCancel={leaveQueue}
        />
      )}

      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}

// ─── Full-screen radar while searching ──────────────────────────────────────
function MatchmakingOverlay({ elapsedMs, copy, name, rating, modeBadge, modeLabel, onCancel }: {
  elapsedMs: number;
  copy: string;
  name: string | null | undefined;
  rating: number;
  modeBadge: string;
  modeLabel: string;
  onCancel: () => void;
}) {
  const t = useTranslations('arena');
  return (
    <div className="arena-stage fixed inset-0 z-[9000] flex flex-col items-center justify-center gap-6 px-6 text-center" role="dialog" aria-modal="true" aria-live="polite">
      <div className="arena-radar flex h-60 w-60 items-center justify-center">
        <span className="arena-ping absolute h-20 w-20 rounded-full" style={{ border: '2px solid var(--ag-me)' }} />
        <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full text-h1 font-black text-white"
          style={{ background: GRADIENT.writing, boxShadow: '0 0 0 4px var(--ag-me), 0 0 30px rgba(34,211,238,.6)' }}>
          {initialOf(name)}
        </div>
        {/* decorative blips */}
        <span className="arena-ping absolute left-8 top-12 h-2.5 w-2.5 rounded-full" style={{ background: 'var(--ag-opp)', animationDelay: '.4s' }} />
        <span className="arena-ping absolute bottom-10 right-10 h-2 w-2 rounded-full" style={{ background: 'var(--ag-gold)', animationDelay: '1.1s' }} />
      </div>
      <div>
        <div className="text-h2 font-black uppercase tracking-wider">{t('lobby.searching')}</div>
        <div className="arena-muted mt-2 max-w-sm text-body">{copy}</div>
      </div>
      <div className="flex items-center gap-3">
        <span className="mono text-h1 font-black" style={{ color: 'var(--ag-me)' }}>{formatClock(elapsedMs)}</span>
        <span className="arena-panel rounded-lg px-2.5 py-1 text-caption font-semibold">
          <span className="mono mr-1.5" style={{ color: 'var(--ag-gold)' }}>{modeBadge}</span>{modeLabel} · <span className="mono">{rating}</span>
        </span>
      </div>
      <button type="button" onClick={onCancel}
        className="rounded-xl border px-6 py-2.5 text-body font-bold transition-colors hover:bg-white/10"
        style={{ borderColor: 'var(--ag-lose)', color: 'var(--ag-lose)' }}>
        {t('lobby.cancelSearch', { seconds: Math.floor(elapsedMs / 1000) })}
      </button>
    </div>
  );
}

// ─── Top players: podium for the first three ────────────────────────────────
function Podium({ items, loading, myUserId }: { items: ArenaLeaderboardRow[]; loading: boolean; myUserId: string | undefined }) {
  const t = useTranslations('arena');
  if (loading) return <div className="flex justify-center py-6"><Loading /></div>;
  if (items.length === 0) return <p className="arena-muted py-6 text-center text-caption">{t('lobby.topEmpty')}</p>;

  const podium = [items[1], items[0], items[2]];
  const heights = ['h-14', 'h-20', 'h-10'];
  const medals = [GRADIENT.silver, GRADIENT.xpGold, GRADIENT.bronze];
  const places = [2, 1, 3];
  return (
    <div>
      <div className="grid grid-cols-3 items-end gap-2">
        {podium.map((p, i) => p ? (
          <div key={p.userId} className="flex min-w-0 flex-col items-center gap-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-body font-black text-white"
              style={{ background: medals[i], boxShadow: p.userId === myUserId ? '0 0 0 3px var(--ag-me)' : undefined }}>
              {initialOf(p.user.name)}
            </div>
            <div className="w-full truncate text-center text-caption font-semibold">{p.user.name ?? t('player')}</div>
            <div className={`flex w-full flex-col items-center justify-start rounded-t-lg pt-1 ${heights[i]}`} style={{ background: medals[i] }}>
              <span className="text-lead font-black text-white">{places[i]}</span>
              <span className="mono text-[10px] font-bold text-white/90">{p.rating}</span>
            </div>
          </div>
        ) : <div key={i} />)}
      </div>
      {items.slice(3).map((r, i) => (
        <div key={r.userId} className="mt-2 flex items-center gap-3 rounded-lg px-2 py-1.5" style={{ background: r.userId === myUserId ? 'rgba(34,211,238,.12)' : 'rgba(255,255,255,.04)' }}>
          <span className="mono w-5 text-center text-caption font-bold arena-muted">{i + 4}</span>
          <span className="min-w-0 flex-1 truncate text-caption font-semibold">{r.user.name ?? t('player')}</span>
          <span className="mono text-caption font-bold">{r.rating}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Recent matches with W/L/D pips ─────────────────────────────────────────
function RecentMatches({ items, loading, myUserId }: { items: ArenaMatchSummary[]; loading: boolean; myUserId: string | undefined }) {
  const t = useTranslations('arena');
  if (loading) return <div className="flex justify-center py-6"><Loading /></div>;
  if (items.length === 0) return <p className="arena-muted py-6 text-center text-caption">{t('lobby.recentEmpty')}</p>;
  return (
    <div className="space-y-2">
      {items.map((m) => {
        const isP1 = m.player1Id === myUserId;
        const myScore = isP1 ? m.player1Score : m.player2Score;
        const oppScore = isP1 ? m.player2Score : m.player1Score;
        const opp = isP1 ? m.player2 : m.player1;
        const isDraw = !m.winnerId;
        const iWon = !isDraw && m.winnerId === myUserId;
        const tone = isDraw ? 'var(--ag-muted)' : iWon ? 'var(--ag-win)' : 'var(--ag-lose)';
        return (
          <Link key={m.id} href={`/arena/match/${m.id}/result`}
            className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/5" style={{ background: 'rgba(255,255,255,.04)' }}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-caption font-black"
              style={{ color: tone, border: `1.5px solid ${tone}` }}>
              {isDraw ? 'H' : iWon ? 'W' : 'L'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-body font-semibold">{t('vs')} {opp?.name ?? t('bot')}</div>
              <div className="arena-muted text-caption">{m.mode} · {m.level}{m.isBotMatch ? ` · ${t('bot')}` : ''}</div>
            </div>
            <span className="mono text-body font-black" style={{ color: tone }}>{myScore}–{oppScore}</span>
          </Link>
        );
      })}
    </div>
  );
}

function Alert({ tone, children }: { tone: 'warning' | 'danger'; children: React.ReactNode }) {
  const color = tone === 'warning' ? 'var(--warn)' : 'var(--danger)';
  return (
    <div className="mb-4 rounded-xl px-4 py-3 text-body"
      style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`, color }}>
      {children}
    </div>
  );
}
