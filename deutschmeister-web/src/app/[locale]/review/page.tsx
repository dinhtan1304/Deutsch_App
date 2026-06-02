'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { usePronunciation } from '@/hooks/usePronunciation';
import { useRandomWords } from '@/hooks/useWords';
import { useDueCards, useReviewCard, useAddWordsToSRS, useProgressStats, useProgressIntervalPreview } from '@/hooks/useProgress';
import { useXp } from '@/hooks/useXp';
import { useDashboardStats } from '@/hooks/useDashboard';
import { ReviewRating, Progress } from '@/types';
import { ACCENT, STATUS } from '@/lib/tokens';
import { getDelayText } from '@/lib/srs';
import { IconBrain } from '@/components/ui/Icons';
import { SRSSetupScreen } from './_components/SRSSetupScreen';
import { SRSCompleteScreen } from './_components/SRSCompleteScreen';
import { ReviewCard } from './_components/ReviewCard';
import { RatingButtons } from './_components/RatingButtons';

type QuizMode = 'gender' | 'de-vi' | 'vi-de' | 'mixed';
type Phase = 'loading' | 'empty' | 'setup' | 'reviewing' | 'complete';
type SessionStats = { correct: number; wrong: number; streak: number; bestStreak: number; xp: number };

// Mirror RatingButtons: per-rating accent + label key (used by the rating toast).
const RATE_COLOR: Record<ReviewRating, string> = {
  again: STATUS.danger, hard: ACCENT.xp, good: ACCENT.srs, easy: STATUS.success,
};
const RATE_LABEL_KEY: Record<ReviewRating, 'ratingAgain' | 'ratingHard' | 'ratingGood' | 'ratingEasy'> = {
  again: 'ratingAgain', hard: 'ratingHard', good: 'ratingGood', easy: 'ratingEasy',
};

export default function SRSReviewPage() {
  const router = useRouter();
  const t = useTranslations('progress.review');
  const { settings, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playClick, playLevelUp, playStreak } = useSoundEffects();

  const { data: dueCards = [], isLoading: dueLoading, refetch: refetchDue } = useDueCards(100);
  const { data: stats } = useProgressStats();
  const { data: dashStats } = useDashboardStats();
  const reviewMutation = useReviewCard();
  const addWordsMutation = useAddWordsToSRS();
  const { refetch: refetchRandom } = useRandomWords(20, {});

  const [manualPhase, setManualPhase] = useState<'reviewing' | 'complete' | 'setup' | null>(null);
  const phase = useMemo<Phase>(() => {
    if (manualPhase !== null) return manualPhase;
    if (dueLoading) return 'loading';
    if (!stats) return 'loading';
    if (stats.total === 0) return 'empty';
    if (stats.due === 0) return 'complete';
    return 'setup';
  }, [manualPhase, dueLoading, stats]);
  const [quizMode, setQuizMode] = useState<QuizMode>('mixed');
  const [reviewQueue, setReviewQueue] = useState<Progress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ correct: 0, wrong: 0, streak: 0, bestStreak: 0, xp: 0 });
  const [cardModes, setCardModes] = useState<Record<number, Exclude<QuizMode, 'mixed'>>>({});
  const [showExampleTrans, setShowExampleTrans] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [ratingToast, setRatingToast] = useState<{ label: string; delay: string; color: string } | null>(null);
  const { speak } = usePronunciation();

  const { data: xpData, refetch: refetchXp } = useXp();
  const levelBeforeSessionRef = useRef<number | null>(null);

  const reviewMutateRef = useRef(reviewMutation.mutateAsync);
  useEffect(() => { reviewMutateRef.current = reviewMutation.mutateAsync; }, [reviewMutation.mutateAsync]);

  const nextCardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streakRef = useRef(0);
  const reviewSubmittingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const reviewQueueLengthRef = useRef(0);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Snapshot of session stats + streak taken before each card advances, so Undo
  // can restore them. One entry per advance (rate or skip) → aligned with currentIndex.
  const undoStackRef = useRef<Array<{ stats: SessionStats; streak: number }>>([]);
  const sessionStatsRef = useRef(sessionStats);
  useEffect(() => { sessionStatsRef.current = sessionStats; }, [sessionStats]);

  useEffect(() => () => {
    if (nextCardTimerRef.current) clearTimeout(nextCardTimerRef.current);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const flipCard = useCallback(() => {
    if (!isFlipped) {
      playClick();
      setIsFlipped(true);
    }
  }, [isFlipped, playClick]);


  const getCardQuizMode = useCallback((card: Progress): Exclude<QuizMode, 'mixed'> => {
    if (quizMode !== 'mixed') return quizMode;
    const modes: Exclude<QuizMode, 'mixed'>[] = ['de-vi'];
    if (card.word?.gender) modes.push('gender');
    if (card.word?.translationVi || card.word?.translationEn) modes.push('vi-de');
    return modes[Math.floor(Math.random() * modes.length)]!;
  }, [quizMode]);

  const startReview = useCallback(() => {
    if (dueCards.length === 0) { setManualPhase('complete'); return; }
    levelBeforeSessionRef.current = xpData?.level ?? null;
    const shuffled = [...dueCards].sort(() => Math.random() - 0.5);
    const queue = shuffled.slice(0, settings.questionsPerGame);
    setReviewQueue(queue);
    setCurrentIndex(0);
    setShowExampleTrans(false);
    currentIndexRef.current = 0;
    reviewQueueLengthRef.current = queue.length;
    setIsFlipped(false);
    reviewSubmittingRef.current = false;
    setIsSubmittingReview(false);
    setSessionStats({ correct: 0, wrong: 0, streak: 0, bestStreak: 0, xp: 0 });
    streakRef.current = 0;
    undoStackRef.current = [];
    setRatingToast(null);
    const modes: Record<number, Exclude<QuizMode, 'mixed'>> = {};
    queue.forEach((card, i) => { modes[i] = getCardQuizMode(card); });
    setCardModes(modes);
    setManualPhase('reviewing');
    playClick();
  }, [dueCards, settings.questionsPerGame, playClick, getCardQuizMode, xpData?.level]);

  const currentCard = reviewQueue[currentIndex] ?? null;
  const currentWord = currentCard?.word ?? null;
  const { data: intervals, isLoading: intervalsLoading } = useProgressIntervalPreview(currentCard?.wordId);

  // Keep refs in sync so the setTimeout callback always reads the latest values
  // without needing currentIndex/reviewQueue.length in the dependency array.
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  const handleReview = useCallback(async (rating: ReviewRating) => {
    if (!currentCard || reviewSubmittingRef.current) return;
    reviewSubmittingRef.current = true;
    setIsSubmittingReview(true);
    // Snapshot stats BEFORE applying this rating so Undo can restore them.
    undoStackRef.current.push({ stats: sessionStatsRef.current, streak: streakRef.current });
    try {
      await reviewMutateRef.current({ wordId: currentCard.wordId, rating });
      const isCorrect = rating !== 'again';
      const xpDelta = rating === 'again' ? 1 : rating === 'hard' ? 3 : rating === 'good' ? 5 : 8;
      // Centered feedback pill: "{label} · ⟲ {next interval}", auto-dismiss.
      const delay = intervals ? getDelayText(intervals[rating].delayMinutes) : '';
      setRatingToast({ label: t(RATE_LABEL_KEY[rating]), delay, color: RATE_COLOR[rating] });
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => { setRatingToast(null); toastTimerRef.current = null; }, 1100);
      if (isCorrect) {
        playCorrect();
        const newStreak = streakRef.current + 1;
        streakRef.current = newStreak;
        if (newStreak === 5 || newStreak === 10) setTimeout(() => playCombo(), 200);
        setSessionStats(prev => ({
          ...prev, correct: prev.correct + 1, streak: newStreak, bestStreak: Math.max(prev.bestStreak, newStreak), xp: prev.xp + xpDelta,
        }));
      } else {
        playWrong();
        streakRef.current = 0;
        setSessionStats(prev => ({ ...prev, wrong: prev.wrong + 1, streak: 0, xp: prev.xp + xpDelta }));
      }
      if (nextCardTimerRef.current) clearTimeout(nextCardTimerRef.current);
      nextCardTimerRef.current = setTimeout(() => {
        nextCardTimerRef.current = null;
        if (currentIndexRef.current + 1 >= reviewQueueLengthRef.current) {
          setManualPhase('complete'); refetchDue();
          // Wait for the async XP update to land, then check if level crossed a threshold
          setTimeout(() => {
            refetchXp().then(result => {
              if (result.data && levelBeforeSessionRef.current !== null &&
                  result.data.level > levelBeforeSessionRef.current) {
                playLevelUp();
              }
              levelBeforeSessionRef.current = null;
            }).catch(() => { levelBeforeSessionRef.current = null; });
          }, 800);
        } else {
          setCurrentIndex(i => i + 1); setIsFlipped(false); setShowExampleTrans(false);
        }
        reviewSubmittingRef.current = false;
        setIsSubmittingReview(false);
      }, 300);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Review failed:', error);
      undoStackRef.current.pop(); // rating never landed — drop its snapshot
      reviewSubmittingRef.current = false;
      setIsSubmittingReview(false);
    }
  }, [currentCard, intervals, t, playCorrect, playWrong, playCombo, playLevelUp, refetchDue, refetchXp]);

  const exitSession = useCallback(() => { playClick(); refetchDue(); setManualPhase('setup'); }, [playClick, refetchDue]);

  const handleSkip = useCallback(() => {
    if (reviewSubmittingRef.current) return;
    // Keep the undo stack aligned with currentIndex (one entry per advance).
    undoStackRef.current.push({ stats: sessionStatsRef.current, streak: streakRef.current });
    if (currentIndexRef.current + 1 >= reviewQueueLengthRef.current) {
      setManualPhase('complete'); refetchDue();
    } else {
      setCurrentIndex(i => i + 1); setIsFlipped(false); setShowExampleTrans(false);
    }
  }, [refetchDue]);

  // UI-only undo: step back to the previous card (re-flipped) and restore the
  // pre-rating session stats. The earlier rating already updated the SM-2 schedule
  // server-side; re-rating the card overwrites it, so no backend revert is needed.
  const handleUndo = useCallback(() => {
    if (reviewSubmittingRef.current || currentIndexRef.current === 0) return;
    if (nextCardTimerRef.current) { clearTimeout(nextCardTimerRef.current); nextCardTimerRef.current = null; }
    if (toastTimerRef.current) { clearTimeout(toastTimerRef.current); toastTimerRef.current = null; }
    setRatingToast(null);
    const snap = undoStackRef.current.pop();
    if (snap) { setSessionStats(snap.stats); streakRef.current = snap.streak; }
    setCurrentIndex(i => Math.max(0, i - 1));
    setIsFlipped(true);
    setShowExampleTrans(false);
    reviewSubmittingRef.current = false;
    setIsSubmittingReview(false);
    playClick();
  }, [playClick]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (phase !== 'reviewing') return;
      if (e.key === 'Escape') { exitSession(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); handleUndo(); return; }
      if (reviewSubmittingRef.current) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!isFlipped) flipCard(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); handleSkip(); }
      else if (isFlipped) {
        if (e.key === '1') handleReview('again');
        else if (e.key === '2') handleReview('hard');
        else if (e.key === '3') handleReview('good');
        else if (e.key === '4') handleReview('easy');
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [phase, isFlipped, handleReview, flipCard, handleSkip, handleUndo, exitSession]);

  const addRandomWords = async () => {
    try {
      const result = await refetchRandom();
      if (result.data) {
        await addWordsMutation.mutateAsync(result.data.map(w => w.id));
        playStreak();
        refetchDue();
        setManualPhase('setup');
      }
    } catch { /* silently ignore – non-critical */ }
  };

  const currentMode = cardModes[currentIndex] ?? 'de-vi';

  // ─── LOADING ───
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse"
          style={{ background: 'var(--accent)' }}>
          <IconBrain size={28} style={{ color: 'var(--accent-on)' }} />
        </div>
      </div>
    );
  }

  // ─── EMPTY ───
  if (phase === 'empty') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="rounded-3xl p-8 text-center border"
          style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6"
            style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
            <IconBrain size={30} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>{t('emptyTitle')}</h1>
          <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: 'var(--theme-text-muted)' }}>
            {t.rich('emptyBody', { br: () => <br /> })}
          </p>
          <button onClick={addRandomWords}
            className="flex items-center gap-2 mx-auto px-6 h-11 rounded-md font-bold text-sm transition-transform hover:-translate-y-0.5 active:scale-95"
            style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 8px 24px color-mix(in srgb, var(--accent) 40%, transparent)' }}>
            {t('addRandom')}
          </button>
          <p className="text-xs mt-3" style={{ color: 'var(--theme-text-muted)' }}>
            {t('addFromDictHint')}
          </p>
          <div className="mt-8 p-4 rounded-xl text-left"
            style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)' }}>
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
              <span className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
                <IconBrain size={14} style={{ color: 'var(--accent)' }} />
              </span>
              {t('sm2What')}
            </h3>
            <p className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>
              {t('sm2Desc')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── SETUP ───
  if (phase === 'setup') {
    return (
      <SRSSetupScreen
        stats={stats}
        quizMode={quizMode}
        onSetMode={setQuizMode}
        onStart={startReview}
        onBack={() => router.push('/games')}
        onAddWords={addRandomWords}
      />
    );
  }

  // ─── COMPLETE ───
  if (phase === 'complete') {
    return (
      <SRSCompleteScreen
        sessionStats={sessionStats}
        stats={stats}
        onContinue={() => { refetchDue(); setManualPhase('setup'); }}
        onAddWords={addRandomWords}
        onBack={() => router.push('/games')}
      />
    );
  }

  // ─── REVIEWING (immersive full-screen) ───
  const sessionTotal = reviewQueue.length;
  const pct = sessionTotal ? Math.round((currentIndex / sessionTotal) * 100) : 0;
  const streak = dashStats?.streak ?? sessionStats.bestStreak;
  const canUndo = currentIndex > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--theme-bg-body)' }}>
      {/* ── Top strip ── */}
      <header className="absolute inset-x-0 top-0 z-10 flex h-16 items-center gap-5 px-6"
        style={{ borderBottom: '1px solid var(--theme-border)', background: 'color-mix(in srgb, var(--theme-bg-body) 88%, transparent)', backdropFilter: 'blur(12px)' }}>
        <button onClick={exitSession}
          className="flex h-9 items-center gap-1.5 rounded-[9px] pl-2.5 pr-3.5 text-[13px] font-medium transition-opacity hover:opacity-80 shrink-0"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          {t('exit')}
        </button>
        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>{t('sessionProgress')}</span>
              <span className="mono text-[13px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{currentIndex} / {sessionTotal}</span>
            </div>
            <span className="mono text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{pct}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full" style={{ background: 'var(--theme-bg-secondary)' }}>
            <div className="v2-match-grad h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <span className="flex h-9 items-center gap-1.5 rounded-[9px] px-3" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6 7 18.2l1.9-5.8L4 8.8h6.1z"/></svg>
            <span className="mono text-[13px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>+{sessionStats.xp}</span>
            <span className="text-[10.5px] uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>XP</span>
          </span>
          <span className="flex h-9 items-center gap-1.5 rounded-[9px] px-3" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--streak)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
            <span className="mono text-[13px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{streak}</span>
            <span className="text-[10.5px] uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>{t('streakLabel')}</span>
          </span>
        </div>
      </header>

      {/* ── Rating feedback pill (centered, auto-dismiss) ── */}
      {ratingToast && (
        <div className="pointer-events-none absolute left-1/2 top-24 z-20 -translate-x-1/2">
          <div className="flex items-center gap-2.5 rounded-full px-4 py-2 text-[13px] font-semibold shadow-lg"
            style={{
              background: 'var(--theme-bg-card)',
              border: `1.5px solid color-mix(in srgb, ${ratingToast.color} 55%, transparent)`,
              color: 'var(--theme-text-primary)',
              animation: 'bounceIn .18s ease-out',
            }}>
            <span className="h-2 w-2 rounded-full" style={{ background: ratingToast.color }} />
            <span>{ratingToast.label}</span>
            {ratingToast.delay && (
              <span className="mono text-[12px] font-medium" style={{ color: ratingToast.color }}>⟲ {ratingToast.delay}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Center: card + answer bar ── */}
      <div className="flex flex-1 flex-col items-center justify-center gap-7 px-6 pt-20 pb-24">
        {currentWord && currentCard && (
          <ReviewCard
            currentWord={currentWord}
            currentCard={currentCard}
            currentMode={currentMode}
            isFlipped={isFlipped}
            onFlip={flipCard}
            onSpeak={speak}
            showExampleTrans={showExampleTrans}
            onShowExampleTrans={() => setShowExampleTrans(true)}
          />
        )}

        <div className="w-full max-w-[680px]">
          {!isFlipped ? (
            <div className="flex justify-center">
              <button onClick={flipCard} disabled={isSubmittingReview}
                className="flex h-14 items-center gap-2.5 rounded-[14px] px-7 text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
                style={{ background: 'var(--accent)', boxShadow: '0 8px 24px color-mix(in srgb, var(--accent) 40%, transparent)' }}>
                {t('showMeaning')}
                <kbd className="mono rounded-[5px] px-2 py-0.5 text-[11px]" style={{ background: 'rgba(255,255,255,.2)', color: 'white' }}>Space</kbd>
              </button>
            </div>
          ) : intervals ? (
            <RatingButtons intervals={intervals} onReview={handleReview} disabled={isSubmittingReview || intervalsLoading} />
          ) : (
            <div className="rounded-2xl py-4 text-center text-sm font-semibold"
              style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}>
              {t('calculatingSchedule')}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom strip ── */}
      <footer className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-4 px-6 py-3.5">
        <div className="flex gap-1.5">
          <button onClick={handleUndo} disabled={!canUndo}
            className="flex h-8 items-center gap-1.5 rounded-[7px] pl-2 pr-2.5 text-xs font-medium transition-opacity enabled:hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: canUndo ? 'var(--theme-text-secondary)' : 'var(--theme-text-muted)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            {t('undo')}
            <kbd className="mono rounded-xs px-1 text-[10px]" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>←</kbd>
          </button>
          <button disabled title={t('edit')}
            className="flex h-8 items-center gap-1.5 rounded-[7px] pl-2.5 pr-2 text-xs font-medium opacity-40 cursor-not-allowed"
            style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
            {t('edit')}
          </button>
          <button onClick={handleSkip}
            className="flex h-8 items-center gap-1.5 rounded-[7px] pl-2.5 pr-2 text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
            {t('skip')}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div className="hidden items-center gap-4.5 text-[11px] sm:flex" style={{ color: 'var(--theme-text-muted)' }}>
          <span className="inline-flex items-center gap-1.5"><kbd className="mono rounded-xs px-1.5 py-0.5 text-[10px]" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}>Space</kbd> {t('hintFlip')}</span>
          <span className="inline-flex items-center gap-1.5"><kbd className="mono rounded-xs px-1.5 py-0.5 text-[10px]" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}>1–4</kbd> {t('hintRate')}</span>
          <span className="inline-flex items-center gap-1.5"><kbd className="mono rounded-xs px-1.5 py-0.5 text-[10px]" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}>Esc</kbd> {t('hintExit')}</span>
        </div>
      </footer>
    </div>
  );
}
