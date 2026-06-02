'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { AuthGate } from '@/components/ui';
import { GRADIENT, ACCENT, STATUS } from '@/lib/tokens';
import { useSRSDue, useSRSStats, useReviewWord, useWeakWords, useIntervalPreview, SRSRating, srsKeys, personalWordsKeys } from '@/hooks/usePersonalWords';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { usePronunciation } from '@/hooks/usePronunciation';
import { PersonalWord, getSRSStatus, getIntervalText, SRSStatusInfo, WordTypeInfo, GenderInfo } from '@/types/personalWord';
import { IconRefresh, IconChevronLeft, IconBrain, IconTarget, IconFlame, IconBookOpen, IconTrophy, IconKeyboard } from '@/components/ui/Icons';
import { getDelayText } from '@/lib/srs';

// ─── Types ───
interface ReviewSession {
  words: PersonalWord[];
  currentIndex: number;
  reviewed: number;
  correct: number;
}

// ============================================
// Stats Component
// ============================================
function SRSStatsCard() {
  const t = useTranslations('vocabulary.wordBank.review');
  const { data: stats, isLoading } = useSRSStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 rounded-2xl animate-pulse"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const items = [
    { label: t('statDue'), value: stats.due, icon: IconFlame, color: STATUS.danger },
    { label: t('statNew'), value: stats.new, icon: IconBookOpen, color: ACCENT.srs },
    { label: t('statLearning'), value: stats.learning, icon: IconBrain, color: ACCENT.xp },
    { label: t('statMature'), value: stats.mature, icon: IconTarget, color: STATUS.success },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {items.map(item => {
        const Ic = item.icon;
        return (
          <div key={item.label}
            className="p-4 rounded-[14px] border transition-transform duration-200 hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center mb-2"
              style={{ background: `color-mix(in srgb, ${item.color} 16%, transparent)`, color: item.color }}>
              <Ic size={16} />
            </div>
            <div className="mono text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Review Card Component
// ============================================
interface ReviewCardProps {
  word: PersonalWord;
  isFlipped: boolean;
  onFlip: () => void;
  onSpeak: (text: string) => void;
}

function ReviewCard({ word, isFlipped, onFlip, onSpeak }: ReviewCardProps) {
  const t = useTranslations('vocabulary.wordBank.review');
  const status = getSRSStatus(word);
  const statusInfo = SRSStatusInfo[status];
  const typeInfo = WordTypeInfo[word.wordType];
  const genderColor = word.wordType === 'nomen' && word.nomenData
    ? GenderInfo[word.nomenData.gender]?.color || ACCENT.srs
    : ACCENT.srs;

  return (
    <div className="relative w-full max-w-lg mx-auto h-80 cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={onFlip}>
      <div className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>

        {/* Front - German */}
        <div className="v2-srs-card absolute inset-0 w-full h-full rounded-[18px] p-6 flex flex-col items-center justify-center"
          style={{
            border: `1.5px solid ${genderColor}`,
            backfaceVisibility: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,.12)',
          }}>
          {/* Type badge */}
          <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md text-caption font-semibold"
            style={{ background: `color-mix(in srgb, ${typeInfo.color} 14%, transparent)`, color: typeInfo.color }}>
            {typeInfo.labelDe}
          </div>

          {/* Status badge */}
          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-md text-caption font-semibold"
            style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}>
            {statusInfo.label}
          </div>

          {/* Word */}
          <div className="text-center">
            {word.wordType === 'nomen' && word.nomenData && (
              <span className="text-2xl font-medium" style={{ color: genderColor }}>
                {word.nomenData.article}{' '}
              </span>
            )}
            <span className="text-4xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {word.word}
            </span>
          </div>

          {word.wordType === 'nomen' && word.nomenData?.plural && (
            <div className="mt-2 text-body" style={{ color: 'var(--theme-text-muted)' }}>
              Plural: <span className="font-medium">{word.nomenData.plural}</span>
            </div>
          )}

          {word.wordType === 'verb' && word.verbData && (
            <div className="mt-2 text-body" style={{ color: 'var(--theme-text-muted)' }}>
              {word.verbData.partizipII && <span>Part. II: {word.verbData.partizipII}</span>}
              {word.verbData.hilfsverb && <span className="ml-3">+ {word.verbData.hilfsverb}</span>}
            </div>
          )}

          <button
            onClick={e => {
              e.stopPropagation();
              const text = word.wordType === 'nomen' && word.nomenData
                ? `${word.nomenData.article} ${word.word}`
                : word.word;
              onSpeak(text);
            }}
            className="mt-3 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ backgroundColor: `${genderColor}1A`, color: genderColor }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          </button>

          <div className="absolute bottom-4 text-body" style={{ color: 'var(--theme-text-muted)' }}>
            {t('tapToReveal')}
          </div>
        </div>

        {/* Back - Translation (calm bg-card, gender-colored accents — no full gradient) */}
        <div className="v2-srs-card absolute inset-0 w-full h-full rounded-[18px] p-6 flex flex-col items-center justify-center"
          style={{
            border: `1.5px solid ${genderColor}`,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            boxShadow: '0 8px 24px rgba(0,0,0,.12)',
          }}>
          {/* German word reminder + replay audio */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>
              {word.wordType === 'nomen' && word.nomenData
                ? `${word.nomenData.article} ${word.word}`
                : word.word}
            </span>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                const text = word.wordType === 'nomen' && word.nomenData
                  ? `${word.nomenData.article} ${word.word}`
                  : word.word;
                onSpeak(text);
              }}
              aria-label={t('replayAudio')}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{ background: `color-mix(in srgb, ${genderColor} 16%, transparent)`, color: genderColor }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            </button>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold mb-2" style={{ color: genderColor }}>{word.translationVi}</div>
            <div className="text-lg" style={{ color: 'var(--theme-text-muted)' }}>{word.translationEn}</div>
          </div>

          {word.examples && word.examples.length > 0 && (
            <div className="mt-6 p-4 rounded-xl max-w-full"
              style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>{t('exampleLabel')}</div>
              <div className="italic text-sm" style={{ color: 'var(--theme-text-secondary)' }}>&quot;{word.examples[0]}&quot;</div>
            </div>
          )}

          <div className="absolute bottom-4 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            {t('currentLevel', { level: getIntervalText(word.interval) })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Rating Buttons Component
// ============================================
interface RatingButtonsProps {
  word: PersonalWord;
  onRate: (rating: SRSRating) => void;
  isLoading: boolean;
}

function RatingButtons({ word, onRate, isLoading }: RatingButtonsProps) {
  const t = useTranslations('vocabulary.wordBank.review');
  const { data: intervals, isLoading: intervalsLoading } = useIntervalPreview(word.id);

  const ratings: { rating: SRSRating; label: string; color: string; hotkey: string }[] = [
    { rating: 'again', label: t('rateAgain'), color: STATUS.danger,  hotkey: '1' },
    { rating: 'hard',  label: t('rateHard'),  color: ACCENT.xp,      hotkey: '2' },
    { rating: 'good',  label: t('rateGood'),  color: STATUS.success, hotkey: '3' },
    { rating: 'easy',  label: t('rateEasy'),  color: ACCENT.srs,     hotkey: '4' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5 mt-6 max-w-lg mx-auto">
      {ratings.map(({ rating, label, color, hotkey }) => (
        <button key={rating} onClick={() => onRate(rating)} disabled={isLoading}
          style={{ ['--rate' as string]: color } as React.CSSProperties}
          className="v2-rate-btn relative flex h-[72px] flex-col items-center justify-center gap-1 rounded-[14px] border-[1.5px] transition-all duration-150 hover:-translate-y-0.5 active:scale-95 disabled:opacity-55 disabled:hover:translate-y-0 disabled:cursor-not-allowed">
          <kbd className="mono absolute right-2.5 top-2 rounded-xs px-1.5 text-[10px] font-bold"
            style={{ background: 'var(--theme-bg-secondary)', color }}>{hotkey}</kbd>
          <span className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{label}</span>
          <span className="mono text-[11px] font-medium" style={{ color }}>
            ⟲ {intervals && !intervalsLoading ? getDelayText(intervals[rating].delayMinutes) : '...'}
          </span>
        </button>
      ))}
    </div>
  );
}

// ============================================
// Session Complete Component
// ============================================
function SessionComplete({ session, onRestart }: { session: ReviewSession; onRestart: () => void }) {
  const t = useTranslations('vocabulary.wordBank.review');
  const accuracy = session.reviewed > 0
    ? Math.round((session.correct / session.reviewed) * 100) : 0;

  const resultItems = [
    { label: t('statReviewed'), value: session.reviewed, color: 'var(--theme-text-primary)' },
    { label: t('statCorrect'), value: session.correct, color: STATUS.success },
    { label: t('statAccuracy'), value: `${accuracy}%`, color: ACCENT.srs },
  ];

  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 rounded-[18px] mx-auto flex items-center justify-center mb-4"
        style={{ background: `color-mix(in srgb, ${STATUS.success} 16%, transparent)`, border: `1px solid color-mix(in srgb, ${STATUS.success} 30%, transparent)` }}>
        <IconTrophy size={36} style={{ color: STATUS.success }} />
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
        {t('completeTitle')}
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--theme-text-muted)' }}>
        {t('completeSubtitle')}
      </p>

      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-8">
        {resultItems.map((item, i) => (
          <div key={i} className="p-4 rounded-[14px] border" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
            <div className="mono text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <button onClick={onRestart}
          className="flex items-center gap-2 px-6 py-3 rounded-[11px] font-semibold text-sm transition-transform hover:-translate-y-0.5 active:scale-95"
          style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 4px 14px color-mix(in srgb, var(--accent) 35%, transparent)' }}>
          <IconRefresh size={16} /> {t('reviewMore')}
        </button>
        <Link href="/word-bank"
          className="flex items-center gap-2 px-6 py-3 rounded-[11px] font-medium text-sm border transition-transform hover:-translate-y-0.5"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
          <IconChevronLeft size={16} /> {t('backToBank')}
        </Link>
      </div>
    </div>
  );
}

// ============================================
// Empty State Component
// ============================================
function EmptyState({ mode = 'srs' }: { mode?: 'srs' | 'weak' }) {
  const t = useTranslations('vocabulary.wordBank.review');
  const { data: stats } = useSRSStats();

  const title = mode === 'weak'
    ? t('emptyWeakTitle')
    : stats?.total === 0 ? t('emptyNoneTitle') : t('emptyDoneTitle');

  const description = mode === 'weak'
    ? t('emptyWeakDesc')
    : stats?.total === 0
      ? t('emptyNoneDesc')
      : t('emptyDoneDesc');

  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-[18px] mx-auto flex items-center justify-center mb-4"
        style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 28%, transparent)' }}>
        <IconBrain size={36} style={{ color: 'var(--accent)' }} />
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
        {title}
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--theme-text-muted)' }}>
        {description}
      </p>

      <div className="flex gap-3 justify-center">
        <Link href="/word-bank"
          className="flex items-center gap-2 px-6 py-3 rounded-[11px] font-semibold text-sm transition-transform hover:-translate-y-0.5 active:scale-95"
          style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 4px 14px color-mix(in srgb, var(--accent) 35%, transparent)' }}>
          {t('goToBank')}
        </Link>
        <Link href="/words"
          className="flex items-center gap-2 px-6 py-3 rounded-[11px] font-medium text-sm border transition-transform hover:-translate-y-0.5"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
          {t('exploreDict')}
        </Link>
      </div>
    </div>
  );
}

// ============================================
// Main Review Page
// ============================================
export default function WordBankReviewPage() {
  const t = useTranslations('vocabulary.wordBank.review');
  const { isAuthenticated } = useAuthStore();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') === 'weak' ? 'weak' : 'srs';

  const queryClient = useQueryClient();
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const srsQuery = useSRSDue({ limit: 20, includeNew: true, newLimit: 5 });
  const weakQuery = useWeakWords(20);

  const isLoading = mode === 'weak' ? weakQuery.isLoading : srsQuery.isLoading;
  const refetch = mode === 'weak' ? weakQuery.refetch : srsQuery.refetch;

  // Normalize both modes to a flat words array
  const sessionData = useMemo(() => {
    if (mode === 'weak') {
      const words = weakQuery.data?.words ?? [];
      return { words, total: words.length };
    }
    const due = srsQuery.data?.due ?? [];
    const newW = srsQuery.data?.new ?? [];
    return { words: [...due, ...newW], total: due.length + newW.length };
  }, [mode, weakQuery.data, srsQuery.data]);

  const reviewMutation = useReviewWord();
  const { playCorrect, playWrong } = useSoundEffects();
  const { speak } = usePronunciation();

  // Stable ref for mutation.mutateAsync: avoids adding the entire mutation object
  // to useCallback deps (mutation identity changes on every API state transition
  // idle→pending→success→idle, which would thrash the keydown listener).
  const reviewMutateRef = useRef(reviewMutation.mutateAsync);
  useEffect(() => { reviewMutateRef.current = reviewMutation.mutateAsync; }, [reviewMutation.mutateAsync]);
  const ratingInFlightRef = useRef(false);

  // Refs so keydown handler can read current values without being in its dep array.
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);
  const isFlippedRef = useRef(isFlipped);
  useEffect(() => { isFlippedRef.current = isFlipped; }, [isFlipped]);

  useEffect(() => {
    if (sessionData.words.length > 0 && !session) {
      setSession({ words: sessionData.words, currentIndex: 0, reviewed: 0, correct: 0 });
    }
  }, [sessionData, session]);

  const currentWord = session?.words[session.currentIndex];
  const isComplete = session && session.currentIndex >= session.words.length;
  const progress = session ? ((session.currentIndex / session.words.length) * 100) : 0;

  // Stable: functional updater removes the need to capture isFlipped.
  const handleFlip = useCallback(() => setIsFlipped(prev => !prev), []);

  // Stable: reads current values from refs instead of closing over
  // session/currentWord/reviewMutation — none of them appear in deps.
  const handleRate = useCallback(async (rating: SRSRating) => {
    if (ratingInFlightRef.current) return;
    const currentSession = sessionRef.current;
    if (!currentSession) return;
    const word = currentSession.words[currentSession.currentIndex];
    if (!word) return;
    ratingInFlightRef.current = true;
    try {
      await reviewMutateRef.current({ wordId: word.id, rating });
      if (rating === 'again') playWrong(); else playCorrect();
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentIndex: prev.currentIndex + 1,
          reviewed: prev.reviewed + 1,
          correct: prev.correct + (rating !== 'again' ? 1 : 0),
        };
      });
      setIsFlipped(false);
    } catch {
      setReviewError(t('rateError'));
      setTimeout(() => setReviewError(null), 3000);
    } finally {
      ratingInFlightRef.current = false;
    }
  }, [playCorrect, playWrong, t]);

  // handleRate and handleFlip are now stable so this effect runs only once,
  // eliminating the keydown listener thrash that previously fired on every flip
  // and every card advance.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sessionRef.current) return;
      if (ratingInFlightRef.current) return;
      const word = sessionRef.current.words[sessionRef.current.currentIndex];
      if (!word) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      }
      if (isFlippedRef.current) {
        const ratingMap: Record<string, SRSRating> = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' };
        const rating = ratingMap[e.key];
        if (rating) { e.preventDefault(); handleRate(rating); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRate]);

  // Flush stale-marked queries once the session ends so the completion screen
  // and word bank page show accurate post-session stats.
  useEffect(() => {
    if (isComplete) {
      queryClient.invalidateQueries({ queryKey: srsKeys.all });
      queryClient.invalidateQueries({ queryKey: personalWordsKeys.stats() });
    }
  }, [isComplete, queryClient]);

  const handleRestart = useCallback(() => { setSession(null); refetch(); }, [refetch]);

  if (!isAuthenticated) return (
    <AuthGate
      icon={<IconRefresh size={28} className="text-white" />}
      gradient={GRADIENT.vocab}
      title={t('authTitle')}
      description={t('authDesc')}
    />
  );

  const headerColor = mode === 'weak' ? STATUS.danger : 'var(--accent)';

  return (
      <div className="max-w-4xl mx-auto py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-md flex items-center justify-center"
              style={{
                background: `color-mix(in srgb, ${headerColor} 16%, transparent)`,
                border: `1px solid color-mix(in srgb, ${headerColor} 30%, transparent)`,
                color: headerColor,
              }}>
              <IconBrain size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                {mode === 'weak' ? t('headerWeak') : t('headerSrs')}
              </h1>
              <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
                {mode === 'weak' ? t('subtitleWeak') : t('subtitleSrs')}
              </p>
            </div>
          </div>
          <Link href="/word-bank"
            className="flex items-center gap-1.5 text-body font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent)' }}>
            <IconChevronLeft size={16} /> {t('wordBankLink')}
          </Link>
        </div>

        {/* Stats — only on SRS mode */}
        {mode === 'srs' && <SRSStatsCard />}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 rounded-[14px] flex items-center justify-center animate-pulse"
              style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)' }}>
              <IconBrain size={24} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && sessionData.total === 0 && <EmptyState mode={mode} />}

        {/* Review Session */}
        {session && !isComplete && currentWord && (
          <>
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-2"
                style={{ color: 'var(--theme-text-muted)' }}>
                <span className="font-semibold">{session.currentIndex + 1} / {session.words.length}</span>
                <span className="font-semibold">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                <div className="v2-match-grad h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Card */}
            <ReviewCard word={currentWord} isFlipped={isFlipped} onFlip={handleFlip} onSpeak={speak} />

            {/* Rating buttons */}
            {isFlipped && (
              <>
                <RatingButtons word={currentWord} onRate={handleRate} isLoading={reviewMutation.isPending} />
                {reviewError && (
                  <p className="text-center text-sm mt-3" style={{ color: STATUS.danger }}>
                    {reviewError}
                  </p>
                )}
              </>
            )}

            {/* Flip hint */}
            {!isFlipped && (
              <div className="text-center mt-6 text-body" style={{ color: 'var(--theme-text-muted)' }}>
                {t.rich('flipHint', {
                  kbd: (chunks) => (
                    <kbd className="px-2 py-0.5 rounded-md text-caption font-semibold"
                      style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>{chunks}</kbd>
                  ),
                })}
              </div>
            )}
          </>
        )}

        {/* Session Complete */}
        {isComplete && session && <SessionComplete session={session} onRestart={handleRestart} />}

        {/* Keyboard tips */}
        <div className="mt-8 p-4 rounded-[14px] border"
          style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2"
            style={{ color: 'var(--theme-text-primary)' }}>
            <span className="w-7 h-7 rounded-[9px] flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}>
              <IconKeyboard size={15} />
            </span>
            {t('shortcuts')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {[
              { key: 'Space', action: t('scFlip') },
              { key: '1', action: t('rateAgain') },
              { key: '2', action: t('rateHard') },
              { key: '3', action: t('rateGood') },
              { key: '4', action: t('rateEasy') },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-2">
                <kbd className="mono px-2 py-0.5 rounded-md font-semibold text-caption"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
                  {item.key}
                </kbd>
                <span style={{ color: 'var(--theme-text-muted)' }}>{item.action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
}
