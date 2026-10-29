'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useArenaSocket } from '@/hooks/useArenaSocket';
import { useArenaStore, type ArenaConnectionStatus } from '@/stores/arenaStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettingsStore } from '@/stores/settingsStore';
import { ArenaScoreboard, type OpponentStatus } from '@/components/arena/ArenaScoreboard';
import { MaskedWordCard } from '@/components/arena/MaskedWordCard';
import { RoundTimerRing } from '@/components/arena/RoundTimerRing';
import { RoundEndOverlay } from '@/components/arena/RoundEndOverlay';
import { ConfettiBurst } from '@/components/arena/ConfettiBurst';
import { FIT_VIEWPORT_HEIGHT, fitToViewport } from '@/lib/fitToViewport';
import { GRADIENT } from '@/lib/tokens';
import { IconLogOut, IconXCircle } from '@/components/ui/Icons';
import type { ArenaPlayerLite } from '@/types/arena-events.types';
import { ARENA_COUNTDOWN_MS } from '@/types/arena-events.types';

interface MatchScreenProps {
  matchId: string;
}

// Hold on the match-end overlay long enough for SFX/animation to play
// before navigating to the result page.
const MATCH_END_REDIRECT_MS = 2_000;

const STAGE_CLASS = `arena-stage relative mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-3xl p-3 sm:p-5 min-h-115 ${FIT_VIEWPORT_HEIGHT}`;

export default function MatchScreen({ matchId }: MatchScreenProps) {
  const t = useTranslations('arena');
  const router = useRouter();
  const { submitAnswer, rejoin, forfeitMatch } = useArenaSocket();
  const [confirmForfeit, setConfirmForfeit] = useState(false);
  const [forfeitting, setForfeitting] = useState(false);
  const { playCorrect, playWrong, playLevelUp, playGameOver } = useSoundEffects();
  const { settings } = useSettingsStore();

  const phase = useArenaStore((s) => s.phase);
  const match = useArenaStore((s) => s.match);
  const currentClue = useArenaStore((s) => s.currentClue);
  const scores = useArenaStore((s) => s.scores);
  const myUserId = useArenaStore((s) => s.myUserId);
  const myLastAnswer = useArenaStore((s) => s.myLastAnswer);
  const opponentLastResult = useArenaStore((s) => s.opponentLastResult);
  const opponentTyping = useArenaStore((s) => s.opponentTyping);
  const opponentConnected = useArenaStore((s) => s.opponentConnected);
  const graceRemainingMs = useArenaStore((s) => s.graceRemainingMs);
  const roundReveal = useArenaStore((s) => s.roundReveal);
  const roundWinners = useArenaStore((s) => s.roundWinners);
  const matchResult = useArenaStore((s) => s.matchResult);
  const announcement = useArenaStore((s) => s.announcement);
  const serverClockSkewMs = useArenaStore((s) => s.serverClockSkewMs);
  const connectionStatus = useArenaStore((s) => s.connectionStatus);
  const lastError = useArenaStore((s) => s.lastError);
  const lastRejection = useArenaStore((s) => s.lastRejection);
  const answeredCorrectThisRound = useArenaStore((s) => s.answeredCorrectThisRound);

  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [showCorrectConfetti, setShowCorrectConfetti] = useState(false);
  const [countdownLeft, setCountdownLeft] = useState(
    Math.ceil(ARENA_COUNTDOWN_MS / 1000),
  );
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!match || match.matchId !== matchId) {
      rejoin(matchId);
    }
  }, [matchId, match, rejoin]);

  const sfxFiredForMatchRef = useRef<string | null>(null);

  useEffect(() => {
    if (phase !== 'match-result' || !matchResult) return;
    // Server may re-emit MATCH_END on rejoin — only play SFX once per matchId.
    if (sfxFiredForMatchRef.current !== matchResult.matchId) {
      sfxFiredForMatchRef.current = matchResult.matchId;
      const myWin = matchResult.winnerUserId === myUserId;
      if (matchResult.isDraw) playGameOver();
      else if (myWin) playLevelUp();
      else playGameOver();
    }
    const redirect = setTimeout(() => {
      router.push(`/arena/match/${matchId}/result`);
    }, MATCH_END_REDIRECT_MS);
    return () => clearTimeout(redirect);
  }, [phase, matchResult, myUserId, matchId, router, playLevelUp, playGameOver]);

  // Forfeit safety net: if server never acks the FORFEIT (offline, drop, etc.),
  // unstick the modal/button after 5s and surface an error.
  useEffect(() => {
    if (!forfeitting) return;
    const timeout = setTimeout(() => {
      setForfeitting(false);
      useArenaStore.getState().applyError({
        code: 'INTERNAL',
        message: t('match.forfeitTimeout'),
      });
    }, 5_000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forfeitting]);

  // Defensive: clear forfeitting state when the match is no longer live.
  useEffect(() => {
    if (forfeitting && phase !== 'playing' && phase !== 'round-reveal') {
      setForfeitting(false);
    }
  }, [forfeitting, phase]);

  useEffect(() => {
    if (phase === 'playing') {
      const t = setTimeout(() => {
        setInput('');
        setShake(false);
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [phase, currentClue?.roundNumber]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    const total = Math.max(0, Math.ceil((match?.countdownMs ?? ARENA_COUNTDOWN_MS) / 1000));
    const reset = setTimeout(() => setCountdownLeft(total), 0);
    const id = setInterval(() => {
      setCountdownLeft((n) => Math.max(0, n - 1));
    }, 1000);
    return () => {
      clearTimeout(reset);
      clearInterval(id);
    };
  }, [phase, match?.countdownMs]);

  useEffect(() => {
    if (!myLastAnswer) return;
    const hapticOn = settings.soundEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (myLastAnswer.isCorrect) {
      playCorrect();
      if (hapticOn) navigator.vibrate(50);
      setFlash('ok');
      setShowCorrectConfetti(true);
      timers.push(setTimeout(() => setFlash(null), 900));
      timers.push(setTimeout(() => setShowCorrectConfetti(false), 1500));
    } else {
      playWrong();
      setFlash('bad');
      timers.push(setTimeout(() => setShake(true), 0));
      timers.push(setTimeout(() => setShake(false), 400));
      timers.push(setTimeout(() => setFlash(null), 900));
      if (hapticOn) navigator.vibrate([100, 50, 100]);
    }
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [myLastAnswer, playCorrect, playWrong, settings.soundEnabled]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || phase !== 'playing' || answeredCorrectThisRound) return;
      submitAnswer(trimmed);
      setInput('');
    },
    [answeredCorrectThisRound, input, phase, submitAnswer],
  );

  const insertGermanChar = useCallback((ch: string) => {
    const el = inputRef.current;
    if (!el) {
      setInput((prev) => `${prev}${ch}`);
      return;
    }
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    const next = `${input.slice(0, start)}${ch}${input.slice(end)}`;
    setInput(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + ch.length, start + ch.length);
    });
  }, [input]);

  if (!match) {
    return (
      <div ref={fitToViewport} className={`${STAGE_CLASS} items-center justify-center text-center`}>
        <div className="text-h3 font-bold">{lastError ? t('match.loadFailed') : t('match.connecting')}</div>
        <div className="arena-muted text-body">{lastError?.message ?? t('match.loadHint')}</div>
        <div className="mt-2 flex gap-3">
          <button type="button" onClick={() => router.push('/arena')} className="arena-panel rounded-xl px-5 py-2 text-body font-bold">{t('match.toLobby')}</button>
          <button type="button" onClick={() => router.push('/arena/history')} className="arena-panel rounded-xl px-5 py-2 text-body font-bold">{t('match.toHistory')}</button>
        </div>
      </div>
    );
  }

  if (phase === 'countdown' || !currentClue) {
    return (
      <div ref={fitToViewport} className={`${STAGE_CLASS} items-center justify-center`}>
        <ConnectionBanner status={connectionStatus} />
        <div className="arena-muted text-caption font-bold uppercase tracking-[0.3em]">{t('match.starting')}</div>
        <div className="grid w-full max-w-2xl grid-cols-[1fr_auto_1fr] items-center gap-4">
          <VsPlayer player={match.me} label={t('match.labelYou')} side="me" />
          <div className="text-[56px] font-black italic sm:text-[72px]"
            style={{ color: 'var(--ag-gold)', textShadow: '0 0 30px rgba(251,191,36,.7)', animation: 'arenaVsIn .55s cubic-bezier(0.34,1.56,0.64,1)' }}>
            {t('match.vs')}
          </div>
          <VsPlayer player={match.opponent} label={match.opponent.isBot ? t('match.labelBot') : t('match.labelOpponent')} side="opp" />
        </div>
        <div key={countdownLeft} className="mono text-[64px] font-black tabular-nums"
          style={{
            color: countdownLeft === 0 ? 'var(--ag-win)' : 'var(--ag-text)',
            textShadow: '0 0 30px rgba(167,139,250,.7)',
            animation: 'arenaCountdownPulse 0.55s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
          {countdownLeft > 0 ? countdownLeft : t('match.go')}
        </div>
      </div>
    );
  }

  const roundNumber = currentClue.roundNumber;
  const answerDisabled = phase !== 'playing' || answeredCorrectThisRound;
  const opponentStatus: OpponentStatus = phase !== 'playing'
    ? null
    : opponentLastResult ? (opponentLastResult.isCorrect ? 'correct' : 'wrong')
    : opponentTyping ? 'typing'
    : null;

  return (
    <div ref={fitToViewport} className={STAGE_CLASS}>
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>

      {/* Top strip: surrender + connection */}
      <div className="flex shrink-0 items-center justify-between gap-2">
        <button type="button" onClick={() => setConfirmForfeit(true)}
          disabled={forfeitting || phase === 'match-result'}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-caption font-bold transition-colors hover:bg-white/10 disabled:opacity-50"
          style={{ color: 'var(--ag-lose)', border: '1px solid rgba(248,113,113,.4)' }}>
          🏳 {t('match.surrender')}
        </button>
        <ConnectionBanner status={connectionStatus} compact />
      </div>

      <div className="shrink-0">
        <ArenaScoreboard
          me={match.me}
          opponent={match.opponent}
          myScore={scores.me}
          opponentScore={scores.opponent}
          roundNumber={roundNumber}
          totalRounds={match.totalRounds}
          roundWinners={roundWinners}
          opponentConnected={opponentConnected}
          graceRemainingMs={graceRemainingMs}
          opponentStatus={opponentStatus}
        />
      </div>

      {(lastError || lastRejection) && (
        <div className="shrink-0 rounded-xl px-4 py-2 text-center text-caption font-semibold"
          style={{ background: 'rgba(248,113,113,.12)', color: 'var(--ag-lose)', border: '1px solid rgba(248,113,113,.35)' }}>
          {(lastRejection ?? lastError)?.message}
        </div>
      )}

      {/* Arena floor: timer + clue */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto py-1">
        <RoundTimerRing
          roundStartedAt={currentClue.roundStartedAt}
          durationMs={currentClue.durationMs}
          serverClockSkewMs={serverClockSkewMs}
        />
        <div className="w-full max-w-xl" style={{ animation: shake ? 'arenaShake 0.4s ease-in-out' : 'none' }}>
          <MaskedWordCard key={currentClue.roundNumber} clue={currentClue} serverClockSkewMs={serverClockSkewMs} />
        </div>
      </div>

      {/* Answer */}
      {/* pr-14 on phones keeps the send button clear of the global feedback FAB */}
      <form onSubmit={handleSubmit} className="relative mx-auto w-full max-w-xl shrink-0 pr-14 sm:pr-0">
        {flash && (
          <span key={`${flash}-${myLastAnswer?.attempts}`} aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 z-10 rounded-full px-3 py-1 text-body font-black"
            style={{
              background: flash === 'ok' ? 'var(--ag-win)' : 'var(--ag-lose)',
              color: 'var(--ag-bg1)',
              animation: 'arenaFloatUp .9s ease-out forwards',
            }}>
            {flash === 'ok' ? '+1 ✓' : '✗'}
          </span>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={answeredCorrectThisRound ? t('match.answerCorrect') : currentClue.mode === 'vi_to_de' ? t('match.inputDe') : t('match.inputVi')}
            disabled={answerDisabled}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={100}
            className="arena-input h-14 min-w-0 flex-1 rounded-2xl px-4 text-lead font-semibold"
            style={{
              borderColor: myLastAnswer?.isCorrect === false ? 'var(--ag-lose)' : myLastAnswer?.isCorrect === true ? 'var(--ag-win)' : undefined,
              animation: flash === 'ok' ? 'arenaFlashOk 0.5s ease-out' : flash === 'bad' ? 'arenaFlashBad 0.5s ease-out' : 'none',
            }}
          />
          <button type="submit" disabled={answerDisabled || !input.trim()}
            className="arena-play-btn flex h-14 shrink-0 items-center justify-center rounded-2xl px-5 text-body font-black uppercase">
            {t('match.send')}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {currentClue.mode === 'vi_to_de' && ['ä', 'ö', 'ü', 'ß'].map((ch) => (
            <button key={ch} type="button" onClick={() => insertGermanChar(ch)} disabled={answerDisabled}
              onPointerDown={(e) => e.preventDefault()}
              className="arena-panel h-8 w-9 rounded-lg text-body font-bold disabled:opacity-50">
              {ch}
            </button>
          ))}
          <span className="arena-muted min-w-0 flex-1 text-caption">
            {myLastAnswer && phase === 'playing'
              ? <span style={{ color: myLastAnswer.isCorrect ? 'var(--ag-win)' : 'var(--ag-lose)' }}>
                  {myLastAnswer.isCorrect ? t('match.answerCorrect') : t('match.answerWrong', { attempts: myLastAnswer.attempts })}
                </span>
              : currentClue.mode === 'vi_to_de' ? t('match.hintDe') : t('match.hintVi')}
          </span>
        </div>
      </form>

      {showCorrectConfetti && <ConfettiBurst count={20} durationMs={1500} />}

      {phase === 'round-reveal' && roundReveal && (
        <RoundEndOverlay reveal={roundReveal} myUserId={myUserId} />
      )}

      {phase === 'match-result' && matchResult && (
        <MatchEndOverlay
          matchResult={matchResult}
          myUserId={myUserId}
          mySlot={useArenaStore.getState().mySlot}
          scores={scores}
        />
      )}

      {confirmForfeit && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center px-4"
          style={{ background: 'rgba(5,6,20,.72)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget && !forfeitting) setConfirmForfeit(false); }}>
          <div role="dialog" aria-modal="true" className="arena-stage relative w-full max-w-sm rounded-3xl p-6 text-center">
            <div className="mb-2 flex justify-center" style={{ color: 'var(--ag-lose)' }} aria-hidden="true"><IconXCircle size={40} /></div>
            <h3 className="mb-2 text-lead font-black">{t('match.leaveTitle')}</h3>
            <p className="arena-muted mb-5 text-body">
              {t.rich('match.leaveBody', { b: (chunks) => <strong style={{ color: 'var(--ag-lose)' }}>{chunks}</strong> })}
              {match.opponent.isBot ? '' : t('match.leaveBodyRanked')}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmForfeit(false)} disabled={forfeitting}
                className="arena-play-btn flex-1 rounded-xl py-2.5 text-body font-black">
                {t('match.keepPlaying')}
              </button>
              <button type="button" disabled={forfeitting}
                onClick={() => {
                  setForfeitting(true);
                  forfeitMatch(matchId);
                  // The match:end event will trigger the redirect to /result —
                  // close the dialog so user sees the final state animation.
                  setConfirmForfeit(false);
                }}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-body font-bold disabled:opacity-50"
                style={{ borderColor: 'var(--ag-lose)', color: 'var(--ag-lose)' }}>
                <IconLogOut size={16} />{t('match.leave')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VsPlayer({ player, label, side }: { player: ArenaPlayerLite; label: string; side: 'me' | 'opp' }) {
  const ring = side === 'me' ? 'var(--ag-me)' : 'var(--ag-opp)';
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center"
      style={{ animation: `${side === 'me' ? 'arenaSlideL' : 'arenaSlideR'} .5s cubic-bezier(0.34,1.56,0.64,1)` }}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full text-h1 font-black text-white sm:h-24 sm:w-24"
        style={{
          background: player.isBot ? GRADIENT.examWriting : side === 'me' ? GRADIENT.dictation : GRADIENT.listening,
          boxShadow: `0 0 0 4px ${ring}, 0 0 36px color-mix(in srgb, ${ring} 60%, transparent)`,
        }}>
        {(player.displayName || '?').charAt(0).toUpperCase()}
      </div>
      <div className="arena-muted text-[11px] font-bold uppercase tracking-widest">{label}</div>
      <div className="w-full truncate text-lead font-black">{player.displayName}</div>
      <div className="mono text-caption font-bold" style={{ color: ring }}>{player.level}</div>
    </div>
  );
}

function MatchEndOverlay({
  matchResult,
  myUserId,
  mySlot,
  scores,
}: {
  matchResult: NonNullable<ReturnType<typeof useArenaStore.getState>['matchResult']>;
  myUserId: string | null;
  mySlot: ReturnType<typeof useArenaStore.getState>['mySlot'];
  scores: { me: number; opponent: number };
}) {
  const t = useTranslations('arena');
  const iWon = !matchResult.isDraw && matchResult.winnerUserId === myUserId;
  const ratingTarget = mySlot ? matchResult.ratingDelta[mySlot] ?? 0 : 0;
  const xpTarget = mySlot ? matchResult.xpAwarded[mySlot] ?? 0 : 0;

  const [ratingShown, setRatingShown] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 800;
    let raf = 0;
    const step = (t: number) => {
      const progress = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setRatingShown(Math.round(eased * ratingTarget));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [ratingTarget]);

  const ratingSign = ratingTarget > 0 ? '+' : ratingTarget < 0 ? '' : '±';
  const tone = matchResult.isDraw ? 'var(--ag-text)' : iWon ? 'var(--ag-gold)' : 'var(--ag-lose)';

  return (
    <div className="arena-stage fixed inset-0 z-[9000] flex flex-col items-center justify-center gap-4 px-4 text-center">
      {iWon && <ConfettiBurst count={40} durationMs={2200} />}
      <div className="text-[64px] leading-none" aria-hidden>{matchResult.isDraw ? '🤝' : iWon ? '🏆' : '💀'}</div>
      <div className="text-[44px] font-black uppercase sm:text-[60px]"
        style={{ color: tone, textShadow: `0 0 36px ${tone}`, animation: 'arenaBannerIn .6s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {matchResult.isDraw ? t('match.drawBanner') : iWon ? t('match.victory') : t('match.defeat')}
      </div>
      <div className="mono text-[40px] font-black">
        <span style={{ color: 'var(--ag-me)' }}>{scores.me}</span>
        <span className="arena-muted mx-3">:</span>
        <span style={{ color: 'var(--ag-opp)' }}>{scores.opponent}</span>
      </div>
      <div className="flex items-center justify-center gap-3">
        {ratingTarget !== 0 && (
          <span className="mono rounded-full px-4 py-1.5 text-body font-black"
            style={{ color: ratingTarget > 0 ? 'var(--ag-win)' : 'var(--ag-lose)', border: `1.5px solid ${ratingTarget > 0 ? 'var(--ag-win)' : 'var(--ag-lose)'}` }}>
            {t('match.ratingBadge', { sign: ratingSign, value: Math.abs(ratingShown) })}
          </span>
        )}
        {xpTarget > 0 && (
          <span className="mono rounded-full px-4 py-1.5 text-body font-black" style={{ color: 'var(--ag-gold)', border: '1.5px solid var(--ag-gold)' }}>
            {t('match.xpBadge', { xp: xpTarget })}
          </span>
        )}
      </div>
      <div className="arena-muted text-caption">{t('match.redirecting')}</div>
    </div>
  );
}

function ConnectionBanner({ status, compact }: { status: ArenaConnectionStatus; compact?: boolean }) {
  const t = useTranslations('arena');
  if (status === 'connected' || status === 'idle') return compact ? <span /> : null;
  const text =
    status === 'connecting'
      ? t('match.connConnecting')
      : status === 'reconnecting'
        ? t('match.connReconnecting')
        : t('match.connLost');
  return (
    <div className={`rounded-lg text-caption font-semibold ${compact ? 'px-2.5 py-1' : 'mb-2 px-4 py-2'}`}
      style={{ background: 'rgba(251,191,36,.12)', color: 'var(--ag-gold)', border: '1px solid rgba(251,191,36,.4)' }}>
      {text}
    </div>
  );
}
