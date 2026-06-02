'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ArenaPlayerLite } from '@/types/arena-events.types';
import { GRADIENT } from '@/lib/tokens';
import { IconAward, IconStar, IconInfo } from '@/components/ui/Icons';

interface ArenaScoreboardProps {
  me: ArenaPlayerLite;
  opponent: ArenaPlayerLite;
  myScore: number;
  opponentScore: number;
  roundNumber: number;
  totalRounds: number;
  opponentConnected: boolean;
  graceRemainingMs: number;
}

type Bounce = 'me' | 'opp' | null;

function Avatar({ player, ring }: { player: ArenaPlayerLite; ring: boolean }) {
  const ringStyle = ring
    ? { boxShadow: '0 0 0 3px rgba(245,158,11,.9), 0 0 14px 2px rgba(245,158,11,.4)' }
    : undefined;
  if (player.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={player.avatar}
        alt={player.displayName}
        className="w-10 h-10 rounded-lg object-cover"
        style={ringStyle}
      />
    );
  }
  const initial = (player.displayName || '?').charAt(0).toUpperCase();
  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-body text-white"
      style={{
        background: player.isBot ? GRADIENT.examWriting : GRADIENT.writing,
        ...ringStyle,
      }}
    >
      {initial}
    </div>
  );
}

function CrownBadge() {
  const t = useTranslations('arena.components');
  return (
    <span
      aria-hidden="true"
      title={t('leading')}
      style={{
        position: 'absolute',
        top: -8,
        right: -6,
        width: 20,
        height: 20,
        borderRadius: 999,
        background: 'rgba(245,158,11,.95)',
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,.35)',
      }}
    >
      <IconAward size={12} />
    </span>
  );
}

export function ArenaScoreboard({
  me,
  opponent,
  myScore,
  opponentScore,
  roundNumber,
  totalRounds,
  opponentConnected,
  graceRemainingMs,
}: ArenaScoreboardProps) {
  const t = useTranslations('arena.components');
  const prevMine = useRef(myScore);
  const prevOpp = useRef(opponentScore);
  const [bounce, setBounce] = useState<Bounce>(null);

  // Transient highlight on score increment — the bounce is keyed off a
  // store-driven prop change (external system), and we reset via setTimeout.
  // The lint rule allows setState in subscription/callback contexts.
  useEffect(() => {
    let side: Bounce = null;
    if (myScore > prevMine.current) side = 'me';
    else if (opponentScore > prevOpp.current) side = 'opp';
    prevMine.current = myScore;
    prevOpp.current = opponentScore;
    if (!side) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBounce(side);
    const t = setTimeout(() => setBounce(null), 520);
    return () => clearTimeout(t);
  }, [myScore, opponentScore]);

  const leader: Bounce =
    myScore > opponentScore ? 'me' : opponentScore > myScore ? 'opp' : null;

  const mineAnim = bounce === 'me'
    ? 'arenaScoreBounce 0.5s cubic-bezier(0.34,1.56,0.64,1)'
    : 'none';
  const oppAnim = bounce === 'opp'
    ? 'arenaScoreBounce 0.5s cubic-bezier(0.34,1.56,0.64,1)'
    : 'none';

  return (
    <div
      className="rounded-2xl p-4 mb-4"
      style={{
        background: 'var(--theme-bg-card)',
        border: '1px solid var(--theme-border)',
        boxShadow: '0 0 0 1px rgba(168,85,247,0.18)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Me */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div style={{ position: 'relative' }}>
            <Avatar player={me} ring={leader === 'me'} />
            {leader === 'me' && <CrownBadge />}
          </div>
          <div className="min-w-0">
            <div
              className="font-semibold text-body truncate"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              {me.displayName}
            </div>
            <div
              className="text-caption flex items-center gap-1"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              <IconStar size={12} />
              <span>{me.level}</span>
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="text-center shrink-0">
          <div
            className="text-2xl font-bold tabular-nums"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            <span style={{ color: '#A855F7', display: 'inline-block', animation: mineAnim }}>
              {myScore}
            </span>
            <span className="mx-2" style={{ color: 'var(--theme-text-muted)' }}>-</span>
            <span style={{ color: '#EC4899', display: 'inline-block', animation: oppAnim }}>
              {opponentScore}
            </span>
          </div>
          <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            {t('roundProgress', { round: roundNumber, total: totalRounds })}
          </div>
        </div>

        {/* Opponent */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <div className="min-w-0 text-right">
            <div
              className="font-semibold text-body truncate"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              {opponent.displayName}
              {opponent.isBot && (
                <span
                  className="ml-1 text-caption font-normal"
                  style={{ color: '#A855F7' }}
                >
                  {t('botSuffix')}
                </span>
              )}
            </div>
            <div
              className="text-caption flex items-center gap-1 justify-end"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              <IconStar size={12} />
              <span>{opponent.level}</span>
            </div>
          </div>
          <div className="relative" style={{ position: 'relative' }}>
            <Avatar player={opponent} ring={leader === 'opp'} />
            {leader === 'opp' && <CrownBadge />}
            {!opponentConnected && (
              <span
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                style={{ background: '#EF4444', boxShadow: '0 0 0 2px var(--theme-bg-card)' }}
                title={t('disconnected')}
              />
            )}
          </div>
        </div>
      </div>

      {!opponentConnected && graceRemainingMs > 0 && (
        <div
          className="mt-3 text-caption px-3 py-2 rounded-lg flex items-center gap-2"
          style={{
            background: 'rgba(239,68,68,.1)',
            color: '#EF4444',
            border: '1px solid rgba(239,68,68,.3)',
          }}
        >
          <IconInfo size={14} />
          <span>{t('opponentDisconnected', { sec: Math.ceil(graceRemainingMs / 1000) })}</span>
        </div>
      )}
    </div>
  );
}
