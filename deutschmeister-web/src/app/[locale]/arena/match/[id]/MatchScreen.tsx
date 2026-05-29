'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useArenaSocket } from '@/hooks/useArenaSocket';
import { useArenaStore, type ArenaConnectionStatus } from '@/stores/arenaStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettingsStore } from '@/stores/settingsStore';
import { ArenaScoreboard } from '@/components/arena/ArenaScoreboard';
import { MaskedWordCard } from '@/components/arena/MaskedWordCard';
import { RoundTimer } from '@/components/arena/RoundTimer';
import { RoundEndOverlay } from '@/components/arena/RoundEndOverlay';
import { ConfettiBurst } from '@/components/arena/ConfettiBurst';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { Button, Card } from '@/components/ui';
import { IconTrophy, IconMedal, IconUsers, IconXCircle, IconLogOut } from '@/components/ui/Icons';
import { ARENA_COUNTDOWN_MS } from '@/types/arena-events.types';

interface MatchScreenProps {
  matchId: string;
}

// Hold on the match-end overlay long enough for SFX/animation to play
// before navigating to the result page.
const MATCH_END_REDIRECT_MS = 2_000;

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
      timers.push(setTimeout(() => setFlash(null), 500));
      timers.push(setTimeout(() => setShowCorrectConfetti(false), 1500));
    } else {
      playWrong();
      setFlash('bad');
      timers.push(setTimeout(() => setShake(true), 0));
      timers.push(setTimeout(() => setShake(false), 400));
      timers.push(setTimeout(() => setFlash(null), 500));
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Card className="text-center py-12">
          <div className="text-lead mb-2" style={{ color: 'var(--theme-text-primary)' }}>
            {lastError ? t('match.loadFailed') : t('match.connecting')}
          </div>
          <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            {lastError?.message ?? t('match.loadHint')}
          </div>
          <div className="mt-4 flex justify-center gap-3">
            <Button variant="outline" onClick={() => router.push('/arena')}>
              {t('match.toLobby')}
            </Button>
            <Button variant="outline" onClick={() => router.push('/arena/history')}>
              {t('match.toHistory')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'countdown' || !currentClue) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <ConnectionBanner status={connectionStatus} />
        <Card className="text-center py-10">
          <div className="text-caption mb-4" style={{ color: 'var(--theme-text-muted)' }}>
            {t('match.starting')}
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <PlayerIntro name={match.me.displayName} level={match.me.level} label={t('match.labelYou')} />
            <div className="text-2xl font-bold" style={{ color: 'var(--theme-text-muted)' }}>VS</div>
            <PlayerIntro
              name={match.opponent.displayName}
              level={match.opponent.level}
              label={match.opponent.isBot ? t('match.labelBot') : t('match.labelOpponent')}
            />
          </div>
          <div
            key={countdownLeft}
            className="mt-8 text-5xl font-bold tabular-nums"
            style={{
              color: countdownLeft === 0 ? STATUS.success : ACCENT.vocab,
              display: 'inline-block',
              animation: 'arenaCountdownPulse 0.55s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            {countdownLeft > 0 ? countdownLeft : t('match.go')}
          </div>
        </Card>
      </div>
    );
  }

  const roundNumber = currentClue.roundNumber;
  const answerDisabled = phase !== 'playing' || answeredCorrectThisRound;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <ConnectionBanner status={connectionStatus} />
      {(lastError || lastRejection) && (
        <div
          className="mb-3 px-4 py-3 rounded-xl text-body"
          style={{
            background: 'rgba(239,68,68,.10)',
            color: STATUS.danger,
            border: '1px solid rgba(239,68,68,.35)',
          }}
        >
          {(lastRejection ?? lastError)?.message}
        </div>
      )}

      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={() => setConfirmForfeit(true)}
          disabled={forfeitting || phase === 'match-result'}
          className="px-3 py-1.5 rounded-lg text-caption font-semibold border transition-colors disabled:opacity-50"
          style={{
            borderColor: 'rgba(239,68,68,.4)',
            color: STATUS.danger,
            background: 'transparent',
          }}
        >
          {t('match.leaveBtn')}
        </button>
      </div>

      <ArenaScoreboard
        me={match.me}
        opponent={match.opponent}
        myScore={scores.me}
        opponentScore={scores.opponent}
        roundNumber={roundNumber}
        totalRounds={match.totalRounds}
        opponentConnected={opponentConnected}
        graceRemainingMs={graceRemainingMs}
      />

      {confirmForfeit && (
        <div
          className="fixed inset-0 flex items-center justify-center px-4"
          style={{
            background: 'rgba(0,0,0,.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 9000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !forfeitting) setConfirmForfeit(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="rounded-2xl max-w-sm w-full p-5"
            style={{
              background: 'var(--theme-bg-card)',
              boxShadow: 'var(--shadow-lifted)',
              border: '1px solid var(--theme-border)',
            }}
          >
            <div
              className="flex justify-center mb-2"
              style={{ color: STATUS.danger }}
              aria-hidden="true"
            >
              <IconXCircle size={36} />
            </div>
            <h3
              className="text-lead font-bold text-center mb-2"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              {t('match.leaveTitle')}
            </h3>
            <p
              className="text-body text-center mb-4"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              {t.rich('match.leaveBody', { b: (chunks) => <strong style={{ color: STATUS.danger }}>{chunks}</strong> })}
              {match.opponent.isBot ? '' : t('match.leaveBodyRanked')}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setConfirmForfeit(false)}
                disabled={forfeitting}
              >
                {t('match.keepPlaying')}
              </Button>
              <Button
                variant="primary"
                fullWidth
                isLoading={forfeitting}
                onClick={() => {
                  setForfeitting(true);
                  forfeitMatch(matchId);
                  // The match:end event will trigger the redirect to /result —
                  // close the dialog so user sees the final state animation.
                  setConfirmForfeit(false);
                }}
                style={{ background: STATUS.danger }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <IconLogOut size={16} />
                  <span>{t('match.leave')}</span>
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-3">
        <RoundTimer
          roundStartedAt={currentClue.roundStartedAt}
          durationMs={currentClue.durationMs}
          serverClockSkewMs={serverClockSkewMs}
        />
      </div>

      <div
        className="arena-shake-container"
        style={{ animation: shake ? 'arenaShake 0.4s ease-in-out' : 'none' }}
      >
        <MaskedWordCard
          key={currentClue.roundNumber}
          clue={currentClue}
          serverClockSkewMs={serverClockSkewMs}
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentClue.mode === 'vi_to_de' ? t('match.inputDe') : t('match.inputVi')}
            disabled={answerDisabled}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={100}
            className="flex-1 px-4 py-3 rounded-xl text-lead"
            style={{
              background: 'var(--theme-bg-card)',
              color: 'var(--theme-text-primary)',
              border: `1px solid ${
                myLastAnswer?.isCorrect === false
                  ? STATUS.danger
                  : myLastAnswer?.isCorrect === true
                    ? STATUS.success
                    : 'var(--theme-border)'
              }`,
              outline: 'none',
              animation:
                flash === 'ok'
                  ? 'arenaFlashOk 0.5s ease-out'
                  : flash === 'bad'
                    ? 'arenaFlashBad 0.5s ease-out'
                    : 'none',
            }}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={answerDisabled || !input.trim()}
            style={{ background: GRADIENT.vocab }}
          >
            {t('match.send')}
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {currentClue.mode === 'vi_to_de' && ['ä', 'ö', 'ü', 'ß'].map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => insertGermanChar(ch)}
              disabled={answerDisabled}
              className="w-9 h-8 rounded-lg font-semibold"
              style={{
                background: 'var(--theme-bg-card)',
                color: 'var(--theme-text-primary)',
                border: '1px solid var(--theme-border)',
                opacity: answerDisabled ? 0.5 : 1,
              }}
            >
              {ch}
            </button>
          ))}
          <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            {currentClue.mode === 'vi_to_de' ? t('match.hintDe') : t('match.hintVi')}
          </span>
        </div>
      </form>

      <div className="mt-3 min-h-6 space-y-1">
        {myLastAnswer && phase === 'playing' && (
          <div
            className="text-caption"
            style={{ color: myLastAnswer.isCorrect ? STATUS.success : STATUS.danger }}
          >
            {myLastAnswer.isCorrect
              ? t('match.answerCorrect')
              : t('match.answerWrong', { attempts: myLastAnswer.attempts })}
          </div>
        )}
        {opponentLastResult && phase === 'playing' && (
          <div
            className="text-caption"
            style={{ color: opponentLastResult.isCorrect ? STATUS.success : STATUS.danger }}
          >
            {opponentLastResult.isCorrect
              ? t('match.oppCorrect', { seconds: Math.round((opponentLastResult.responseTimeMs ?? 0) / 1000) })
              : t('match.oppWrong', { attempts: opponentLastResult.attempts })}
          </div>
        )}
        {opponentTyping && phase === 'playing' && (
          <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            {t('match.oppTyping', { name: match.opponent.displayName })}
          </div>
        )}
      </div>

      {showCorrectConfetti && (
        <ConfettiBurst count={20} durationMs={1500} />
      )}

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

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{
        background: 'rgba(0,0,0,.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 9000,
      }}
    >
      {iWon && <ConfettiBurst count={40} durationMs={2200} />}
      <div
        className="rounded-2xl p-8 max-w-md w-full text-center"
        style={{
          background: 'var(--theme-bg-card)',
          boxShadow: 'var(--shadow-lifted)',
          animation: 'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div
          aria-hidden="true"
          className="flex items-center justify-center mb-2"
          style={{
            color: matchResult.isDraw
              ? 'var(--theme-text-secondary)'
              : iWon
                ? ACCENT.xp
                : 'var(--theme-text-muted)',
          }}
        >
          {matchResult.isDraw ? (
            <IconUsers size={56} />
          ) : iWon ? (
            <IconTrophy size={56} />
          ) : (
            <IconMedal size={56} />
          )}
        </div>
        <div
          className="text-xl font-bold mb-2"
          style={{
            color: matchResult.isDraw
              ? 'var(--theme-text-primary)'
              : iWon
                ? STATUS.success
                : STATUS.danger,
          }}
        >
          {matchResult.isDraw
            ? t('match.endDraw')
            : iWon
              ? t('match.endWon')
              : t('match.endLost')}
        </div>
        <div
          className="text-3xl font-bold mt-1 tabular-nums"
          style={{ color: 'var(--theme-text-primary)' }}
        >
          {scores.me} - {scores.opponent}
        </div>
        <div className="flex items-center justify-center gap-3 mt-4">
          {ratingTarget !== 0 && (
            <div
              className="px-3 py-1.5 rounded-full text-caption font-bold tabular-nums"
              style={{
                background: ratingTarget > 0
                  ? 'rgba(34,197,94,.14)'
                  : 'rgba(239,68,68,.14)',
                color: ratingTarget > 0 ? STATUS.success : STATUS.danger,
                border: `1px solid ${ratingTarget > 0 ? 'rgba(34,197,94,.4)' : 'rgba(239,68,68,.4)'}`,
              }}
            >
              {t('match.ratingBadge', { sign: ratingSign, value: Math.abs(ratingShown) })}
            </div>
          )}
          {xpTarget > 0 && (
            <div
              className="px-3 py-1.5 rounded-full text-caption font-bold tabular-nums"
              style={{
                background: 'rgba(245,158,11,.14)',
                color: ACCENT.xp,
                border: '1px solid rgba(245,158,11,.4)',
              }}
            >
              {t('match.xpBadge', { xp: xpTarget })}
            </div>
          )}
        </div>
        <div className="text-caption mt-4" style={{ color: 'var(--theme-text-muted)' }}>
          {t('match.redirecting')}
        </div>
      </div>
    </div>
  );
}

function ConnectionBanner({ status }: { status: ArenaConnectionStatus }) {
  const t = useTranslations('arena');
  if (status === 'connected' || status === 'idle') return null;
  const text =
    status === 'connecting'
      ? t('match.connConnecting')
      : status === 'reconnecting'
        ? t('match.connReconnecting')
        : t('match.connLost');
  return (
    <div
      className="mb-3 px-4 py-3 rounded-xl text-body"
      style={{
        background: 'rgba(245,158,11,.12)',
        color: ACCENT.xp,
        border: '1px solid rgba(245,158,11,.4)',
      }}
    >
      {text}
    </div>
  );
}

function PlayerIntro({ name, level, label }: { name: string; level: string; label: string }) {
  return (
    <div className="min-w-0">
      <div className="text-caption mb-1" style={{ color: 'var(--theme-text-muted)' }}>{label}</div>
      <div className="font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>{name}</div>
      <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{level}</div>
    </div>
  );
}
