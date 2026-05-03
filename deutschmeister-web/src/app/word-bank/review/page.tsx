'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
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
    { label: 'Cần ôn', value: stats.due, icon: IconFlame, color: STATUS.danger,
      gradient: `linear-gradient(135deg, ${STATUS.danger}1F, ${STATUS.danger}0F)` },
    { label: 'Mới', value: stats.new, icon: IconBookOpen, color: ACCENT.srs,
      gradient: `linear-gradient(135deg, ${ACCENT.srs}1F, ${ACCENT.srs}0F)` },
    { label: 'Đang học', value: stats.learning, icon: IconBrain, color: ACCENT.xp,
      gradient: `linear-gradient(135deg, ${ACCENT.xp}1F, ${ACCENT.xp}0F)` },
    { label: 'Thuộc lòng', value: stats.mature, icon: IconTarget, color: STATUS.success,
      gradient: `linear-gradient(135deg, ${STATUS.success}1F, ${STATUS.success}0F)` },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {items.map(item => {
        const Ic = item.icon;
        return (
          <div key={item.label}
            className="relative overflow-hidden p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: item.gradient }}>
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full"
              style={{ backgroundColor: item.color, opacity: 0.06 }} />
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
              style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)` }}>
              <Ic size={16} className="text-white" />
            </div>
            <div className="text-2xl font-extrabold" style={{ color: item.color }}>{item.value}</div>
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
        <div className="absolute inset-0 w-full h-full rounded-3xl p-6 flex flex-col items-center justify-center border-2"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
            backfaceVisibility: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,.08)',
          }}>
          {/* Type badge */}
          <div className="absolute top-4 left-4 px-3 py-1 rounded-lg text-caption font-semibold"
            style={{ background: `linear-gradient(135deg, ${typeInfo.color}, ${typeInfo.color}cc)`, color: 'white' }}>
            {typeInfo.labelDe}
          </div>

          {/* Status badge */}
          <div className="absolute top-4 right-4 px-3 py-1 rounded-lg text-caption font-semibold"
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
            Nhấn để xem nghĩa
          </div>
        </div>

        {/* Back - Translation */}
        <div className="absolute inset-0 w-full h-full rounded-3xl p-6 flex flex-col items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${genderColor}, ${genderColor}cc)`,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            boxShadow: '0 8px 32px rgba(0,0,0,.12)',
          }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

          <div className="relative text-center">
            <div className="text-3xl font-bold text-white mb-2">{word.translationVi}</div>
            <div className="text-lg text-white/70">{word.translationEn}</div>
          </div>

          {word.examples && word.examples.length > 0 && (
            <div className="relative mt-6 p-4 bg-white/10 rounded-xl max-w-full backdrop-blur-sm">
              <div className="text-xs text-white/60 mb-1">Ví dụ:</div>
              <div className="text-white/90 italic text-sm">&quot;{word.examples[0]}&quot;</div>
            </div>
          )}

          <div className="absolute bottom-4 text-xs text-white/50">
            Lần ôn tiếp: {getIntervalText(word.interval)}
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
  const { data: intervals, isLoading: intervalsLoading } = useIntervalPreview(word.id);

  /* eslint-disable no-restricted-syntax */
  const ratings: { rating: SRSRating; label: string; color: string; gradient: string; hotkey: string }[] = [
    { rating: 'again', label: 'Quên', color: STATUS.danger, gradient: 'linear-gradient(135deg, #EF4444, #DC2626)', hotkey: '1' },
    { rating: 'hard', label: 'Khó', color: ACCENT.xp,      gradient: 'linear-gradient(135deg, #F59E0B, #D97706)', hotkey: '2' },
    { rating: 'good', label: 'Tốt', color: STATUS.success, gradient: 'linear-gradient(135deg, #22C55E, #16A34A)', hotkey: '3' },
    { rating: 'easy', label: 'Dễ',  color: ACCENT.srs,     gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)', hotkey: '4' },
  ];
  /* eslint-enable no-restricted-syntax */

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-6 max-w-lg mx-auto">
      {ratings.map(({ rating, label, color, hotkey }) => (
        <button key={rating} onClick={() => onRate(rating)} disabled={isLoading}
          className="flex flex-col items-center p-3 sm:p-4 rounded-2xl transition-all duration-200
            hover:-translate-y-1 hover:shadow-lg active:translate-y-0 disabled:opacity-40"
          style={{ background: `${color}12`, border: `2px solid ${color}30` }}>
          <span className="font-bold text-sm" style={{ color }}>{label}</span>
          <span className="text-caption mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            {intervals && !intervalsLoading ? getDelayText(intervals[rating].delayMinutes) : '...'}
          </span>
          <kbd className="mt-1.5 px-2 py-0.5 rounded-md text-caption font-semibold"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
            {hotkey}
          </kbd>
        </button>
      ))}
    </div>
  );
}

// ============================================
// Session Complete Component
// ============================================
function SessionComplete({ session, onRestart }: { session: ReviewSession; onRestart: () => void }) {
  const accuracy = session.reviewed > 0
    ? Math.round((session.correct / session.reviewed) * 100) : 0;

  const resultItems = [
    { label: 'Đã ôn', value: session.reviewed, color: 'var(--theme-text-primary)',
      // eslint-disable-next-line no-restricted-syntax
      gradient: 'linear-gradient(135deg, var(--theme-bg-secondary), var(--theme-bg-tertiary))' },
    { label: 'Đúng', value: session.correct, color: STATUS.success,
      gradient: `linear-gradient(135deg, ${STATUS.success}1F, ${STATUS.success}0F)` },
    { label: 'Chính xác', value: `${accuracy}%`, color: ACCENT.srs,
      gradient: `linear-gradient(135deg, ${ACCENT.srs}1F, ${ACCENT.srs}0F)` },
  ];

  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-4"
        style={{ background: `linear-gradient(135deg, ${STATUS.success}26, ${STATUS.success}1A)` }}>
        <IconTrophy size={36} style={{ color: STATUS.success }} />
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
        Hoàn thành!
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--theme-text-muted)' }}>
        Tuyệt vời, bạn đã hoàn thành phiên ôn tập
      </p>

      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-8">
        {resultItems.map((item, i) => (
          <div key={i} className="p-4 rounded-2xl" style={{ background: item.gradient }}>
            <div className="text-2xl font-extrabold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <button onClick={onRestart}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white
            transition-all hover:shadow-md hover:-translate-y-0.5"
          style={{ background: GRADIENT.action }}>
          <IconRefresh size={16} /> Ôn tiếp
        </button>
        <Link href="/word-bank"
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm border
            transition-all hover:-translate-y-0.5"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
          <IconChevronLeft size={16} /> Về Word Bank
        </Link>
      </div>
    </div>
  );
}

// ============================================
// Empty State Component
// ============================================
function EmptyState({ mode = 'srs' }: { mode?: 'srs' | 'weak' }) {
  const { data: stats } = useSRSStats();

  const title = mode === 'weak'
    ? 'Chưa có từ yếu nào'
    : stats?.total === 0 ? 'Chưa có từ nào' : 'Không có từ cần ôn!';

  const description = mode === 'weak'
    ? 'Cần ít nhất 3 lần ôn cho mỗi từ trước khi xuất hiện ở đây. Hãy ôn tập SRS thêm để có dữ liệu.'
    : stats?.total === 0
      ? 'Thêm từ vào Word Bank để bắt đầu học.'
      : 'Tuyệt vời! Bạn đã ôn hết tất cả các từ cho hôm nay.';

  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-4"
        style={{ background: `linear-gradient(135deg, ${ACCENT.vocab}26, ${ACCENT.examWriting}1A)` }}>
        <IconBrain size={36} style={{ color: ACCENT.vocab }} />
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
        {title}
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--theme-text-muted)' }}>
        {description}
      </p>

      <div className="flex gap-3 justify-center">
        <Link href="/word-bank"
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white
            transition-all hover:shadow-md hover:-translate-y-0.5"
          style={{ background: GRADIENT.action }}>
          Đi đến Word Bank
        </Link>
        <Link href="/words"
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm border
            transition-all hover:-translate-y-0.5"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
          Khám phá từ điển
        </Link>
      </div>
    </div>
  );
}

// ============================================
// Main Review Page
// ============================================
export default function WordBankReviewPage() {
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
      setReviewError('Quá nhiều yêu cầu, vui lòng thử lại sau vài giây.');
      setTimeout(() => setReviewError(null), 3000);
    } finally {
      ratingInFlightRef.current = false;
    }
  }, [playCorrect, playWrong]);

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
      title="Đăng nhập để ôn tập SRS"
      description="Ôn tập từ vựng theo thuật toán ghi nhớ thông minh."
    />
  );

  return (
      <div className="max-w-4xl mx-auto py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: mode === 'weak'
                ? `linear-gradient(135deg, ${STATUS.danger}, ${ACCENT.xp})`
                : GRADIENT.history }}>
              <IconBrain size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                {mode === 'weak' ? 'Ôn từ yếu' : 'Ôn tập Word Bank'}
              </h1>
              <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
                {mode === 'weak'
                  ? 'Tập trung vào những từ bạn hay sai nhất'
                  : 'Spaced Repetition System (SM-2)'}
              </p>
            </div>
          </div>
          <Link href="/word-bank"
            className="flex items-center gap-1.5 text-body font-medium transition-all hover:opacity-70"
            style={{ color: ACCENT.srs }}>
            <IconChevronLeft size={16} /> Word Bank
          </Link>
        </div>

        {/* Stats — only on SRS mode */}
        {mode === 'srs' && <SRSStatsCard />}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
              style={{ background: GRADIENT.history }}>
              <IconBrain size={24} className="text-white" />
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
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${ACCENT.srs}, ${STATUS.success})`,
                  }} />
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
                Nhấn{' '}
                <kbd className="px-2 py-0.5 rounded-md text-caption font-semibold"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>Space</kbd>
                {' '}hoặc click để lật thẻ
              </div>
            )}
          </>
        )}

        {/* Session Complete */}
        {isComplete && session && <SessionComplete session={session} onRestart={handleRestart} />}

        {/* Keyboard tips */}
        <div className="mt-8 p-4 rounded-2xl border"
          style={{
            backgroundColor: `${ACCENT.vocab}0A`,
            borderColor: `${ACCENT.vocab}26`,
          }}>
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2"
            style={{ color: ACCENT.vocab }}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${ACCENT.vocab}26, ${ACCENT.vocab}14)` }}>
              <IconKeyboard size={15} style={{ color: ACCENT.vocab }} />
            </span>
            Phím tắt
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {[
              { key: 'Space', action: 'Lật thẻ' },
              { key: '1', action: 'Quên' },
              { key: '2', action: 'Khó' },
              { key: '3', action: 'Tốt' },
              { key: '4', action: 'Dễ' },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-2">
                <kbd className="px-2 py-0.5 rounded-md font-semibold text-caption"
                  style={{ backgroundColor: `${ACCENT.vocab}1A`, color: ACCENT.vocab }}>
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
