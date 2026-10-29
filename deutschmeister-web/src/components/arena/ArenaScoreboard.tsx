'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ArenaPlayerLite } from '@/types/arena-events.types';
import { GRADIENT } from '@/lib/tokens';

export type OpponentStatus = 'typing' | 'correct' | 'wrong' | null;

interface ArenaScoreboardProps {
  me: ArenaPlayerLite;
  opponent: ArenaPlayerLite;
  myScore: number;
  opponentScore: number;
  roundNumber: number;
  totalRounds: number;
  roundWinners: Record<number, 'me' | 'opp' | 'none'>;
  opponentConnected: boolean;
  graceRemainingMs: number;
  /** Live status bubble over the opponent's avatar for the current round. */
  opponentStatus: OpponentStatus;
}

type Side = 'me' | 'opp';

function Avatar({ player, side, leading }: { player: ArenaPlayerLite; side: Side; leading: boolean }) {
  const ring = side === 'me' ? 'var(--ag-me)' : 'var(--ag-opp)';
  const style = {
    boxShadow: leading
      ? `0 0 0 3px var(--ag-gold), 0 0 22px rgba(251,191,36,.55)`
      : `0 0 0 3px ${ring}, 0 0 16px color-mix(in srgb, ${ring} 45%, transparent)`,
  };
  return (
    <div className="relative">
      {player.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={player.avatar} alt={player.displayName} className="h-12 w-12 rounded-full object-cover sm:h-14 sm:w-14" style={style} />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full text-lead font-black text-white sm:h-14 sm:w-14"
          style={{ background: player.isBot ? GRADIENT.examWriting : side === 'me' ? GRADIENT.dictation : GRADIENT.listening, ...style }}>
          {(player.displayName || '?').charAt(0).toUpperCase()}
        </div>
      )}
      {leading && (
        <span aria-hidden className="absolute -top-3 left-1/2 -translate-x-1/2 text-[18px] leading-none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))' }}>👑</span>
      )}
    </div>
  );
}

function StatusBubble({ status, name }: { status: OpponentStatus; name: string }) {
  const t = useTranslations('arena.components');
  if (!status) return null;
  const tone = status === 'correct' ? 'var(--ag-win)' : status === 'wrong' ? 'var(--ag-lose)' : 'var(--ag-text)';
  return (
    <span key={status} role="status"
      className="absolute -top-7 right-0 z-10 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{ background: 'rgba(8,10,30,.9)', border: `1px solid ${tone}`, color: tone, animation: 'arenaBubble .25s ease-out' }}
      aria-label={status === 'typing' ? t('statusTypingAria', { name }) : undefined}>
      {status === 'typing' ? (
        <span className="inline-flex gap-0.5" aria-hidden>
          {[0, 1, 2].map((i) => <span key={i} style={{ animation: `arenaDots 1.2s ${i * 0.2}s infinite` }}>●</span>)}
        </span>
      ) : status === 'correct' ? t('statusCorrect') : t('statusWrong')}
    </span>
  );
}

export function ArenaScoreboard({
  me, opponent, myScore, opponentScore, roundNumber, totalRounds, roundWinners,
  opponentConnected, graceRemainingMs, opponentStatus,
}: ArenaScoreboardProps) {
  const t = useTranslations('arena.components');
  const prevMine = useRef(myScore);
  const prevOpp = useRef(opponentScore);
  const [bounce, setBounce] = useState<Side | null>(null);

  // Transient highlight on score increment — the bounce is keyed off a
  // store-driven prop change (external system), and we reset via setTimeout.
  useEffect(() => {
    let side: Side | null = null;
    if (myScore > prevMine.current) side = 'me';
    else if (opponentScore > prevOpp.current) side = 'opp';
    prevMine.current = myScore;
    prevOpp.current = opponentScore;
    if (!side) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBounce(side);
    const timer = setTimeout(() => setBounce(null), 520);
    return () => clearTimeout(timer);
  }, [myScore, opponentScore]);

  const leader: Side | null = myScore > opponentScore ? 'me' : opponentScore > myScore ? 'opp' : null;
  const bounceAnim = 'arenaScoreBounce 0.5s cubic-bezier(0.34,1.56,0.64,1)';

  return (
    <div className="arena-panel rounded-2xl px-3 py-3 sm:px-5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        {/* Me */}
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <Avatar player={me} side="me" leading={leader === 'me'} />
          <div className="hidden min-w-0 sm:block">
            <div className="truncate text-body font-bold">{me.displayName}</div>
            <div className="mono text-caption font-semibold" style={{ color: 'var(--ag-me)' }}>{me.level}</div>
          </div>
        </div>

        {/* Score + round pips */}
        <div className="flex flex-col items-center">
          <div className="mono flex items-center gap-2 text-[34px] font-black leading-none sm:text-[42px]">
            <span style={{ color: 'var(--ag-me)', display: 'inline-block', animation: bounce === 'me' ? bounceAnim : 'none', textShadow: '0 0 18px rgba(34,211,238,.5)' }}>{myScore}</span>
            <span className="arena-muted text-h3">:</span>
            <span style={{ color: 'var(--ag-opp)', display: 'inline-block', animation: bounce === 'opp' ? bounceAnim : 'none', textShadow: '0 0 18px rgba(244,114,182,.5)' }}>{opponentScore}</span>
          </div>
          <div className="mt-1.5 flex gap-1" aria-label={t('roundProgress', { round: roundNumber, total: totalRounds })}>
            {Array.from({ length: totalRounds }, (_, i) => {
              const n = i + 1;
              const w = roundWinners[n];
              const bg = w === 'me' ? 'var(--ag-me)' : w === 'opp' ? 'var(--ag-opp)' : w === 'none' ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.1)';
              const current = n === roundNumber && !w;
              return (
                <span key={n} className={`h-2 rounded-full transition-all ${current ? 'w-4' : 'w-2'}`}
                  style={{ background: current ? 'var(--ag-gold)' : bg, boxShadow: current ? '0 0 8px var(--ag-gold)' : undefined }} />
              );
            })}
          </div>
          <div className="arena-muted mt-1 text-[10px] font-bold uppercase tracking-widest">{t('roundProgress', { round: roundNumber, total: totalRounds })}</div>
        </div>

        {/* Opponent */}
        <div className="flex min-w-0 items-center justify-end gap-2.5 sm:gap-3">
          <div className="hidden min-w-0 text-right sm:block">
            <div className="truncate text-body font-bold">
              {opponent.displayName}
              {opponent.isBot && <span className="arena-muted ml-1 text-caption font-normal">{t('botSuffix')}</span>}
            </div>
            <div className="mono text-caption font-semibold" style={{ color: 'var(--ag-opp)' }}>{opponent.level}</div>
          </div>
          <div className="relative">
            <StatusBubble status={opponentStatus} name={opponent.displayName} />
            <Avatar player={opponent} side="opp" leading={leader === 'opp'} />
            {!opponentConnected && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full"
                style={{ background: 'var(--ag-lose)', boxShadow: '0 0 0 2px var(--ag-bg1)' }} title={t('disconnected')} />
            )}
          </div>
        </div>
      </div>

      {!opponentConnected && graceRemainingMs > 0 && (
        <div className="mt-3 rounded-lg px-3 py-2 text-center text-caption font-semibold"
          style={{ background: 'rgba(248,113,113,.12)', color: 'var(--ag-lose)', border: '1px solid rgba(248,113,113,.35)' }}>
          {t('opponentDisconnected', { sec: Math.ceil(graceRemainingMs / 1000) })}
        </div>
      )}
    </div>
  );
}
