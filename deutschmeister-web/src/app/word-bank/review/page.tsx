'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSRSDue, useSRSStats, useReviewWord, SRSRating } from '@/hooks/usePersonalWords';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { PersonalWord, getSRSStatus, getIntervalText, SRSStatusInfo, WordTypeInfo, GenderInfo } from '@/types/personalWord';
import { IconRefresh, IconChevronLeft, IconBrain, IconTarget, IconFlame, IconBookOpen, IconTrophy, IconKeyboard } from '@/components/ui/Icons';

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
    { label: 'Cần ôn', value: stats.due, icon: IconFlame, color: '#EF4444',
      gradient: 'linear-gradient(135deg, rgba(239,68,68,.12), rgba(239,68,68,.06))' },
    { label: 'Mới', value: stats.new, icon: IconBookOpen, color: '#3B82F6',
      gradient: 'linear-gradient(135deg, rgba(59,130,246,.12), rgba(59,130,246,.06))' },
    { label: 'Đang học', value: stats.learning, icon: IconBrain, color: '#F59E0B',
      gradient: 'linear-gradient(135deg, rgba(245,158,11,.12), rgba(245,158,11,.06))' },
    { label: 'Thuộc lòng', value: stats.mature, icon: IconTarget, color: '#22C55E',
      gradient: 'linear-gradient(135deg, rgba(34,197,94,.12), rgba(34,197,94,.06))' },
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
            <div className="text-[12px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</div>
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
}

function ReviewCard({ word, isFlipped, onFlip }: ReviewCardProps) {
  const status = getSRSStatus(word);
  const statusInfo = SRSStatusInfo[status];
  const typeInfo = WordTypeInfo[word.wordType];
  const genderColor = word.wordType === 'nomen' && word.nomenData
    ? GenderInfo[word.nomenData.gender]?.color || '#3B82F6'
    : '#3B82F6';

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
          <div className="absolute top-4 left-4 px-3 py-1 rounded-lg text-[11px] font-semibold"
            style={{ background: `linear-gradient(135deg, ${typeInfo.color}, ${typeInfo.color}cc)`, color: 'white' }}>
            {typeInfo.labelDe}
          </div>

          {/* Status badge */}
          <div className="absolute top-4 right-4 px-3 py-1 rounded-lg text-[11px] font-semibold"
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
            <div className="mt-2 text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
              Plural: <span className="font-medium">{word.nomenData.plural}</span>
            </div>
          )}

          {word.wordType === 'verb' && word.verbData && (
            <div className="mt-2 text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
              {word.verbData.partizipII && <span>Part. II: {word.verbData.partizipII}</span>}
              {word.verbData.hilfsverb && <span className="ml-3">+ {word.verbData.hilfsverb}</span>}
            </div>
          )}

          <div className="absolute bottom-4 text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
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
              <div className="text-[12px] text-white/60 mb-1">Ví dụ:</div>
              <div className="text-white/90 italic text-[14px]">„{word.examples[0]}"</div>
            </div>
          )}

          <div className="absolute bottom-4 text-[12px] text-white/50">
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
  const calculatePreviewInterval = (rating: SRSRating): number => {
    if (rating === 'again') return 1;
    const quality = { again: 0, hard: 3, good: 4, easy: 5 }[rating];
    let { easeFactor, interval, repetitions } = word;
    if (quality < 3) return 1;
    let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEF = Math.max(1.3, newEF);
    if (repetitions === 0) return 1;
    if (repetitions === 1) return 6;
    return Math.round(interval * newEF);
  };

  const ratings: { rating: SRSRating; label: string; color: string; gradient: string; hotkey: string }[] = [
    { rating: 'again', label: 'Quên', color: '#EF4444', gradient: 'linear-gradient(135deg, #EF4444, #DC2626)', hotkey: '1' },
    { rating: 'hard', label: 'Khó', color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)', hotkey: '2' },
    { rating: 'good', label: 'Tốt', color: '#22C55E', gradient: 'linear-gradient(135deg, #22C55E, #16A34A)', hotkey: '3' },
    { rating: 'easy', label: 'Dễ', color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)', hotkey: '4' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-6 max-w-lg mx-auto">
      {ratings.map(({ rating, label, color, hotkey }) => (
        <button key={rating} onClick={() => onRate(rating)} disabled={isLoading}
          className="flex flex-col items-center p-3 sm:p-4 rounded-2xl transition-all duration-200
            hover:-translate-y-1 hover:shadow-lg active:translate-y-0 disabled:opacity-40"
          style={{ background: `${color}12`, border: `2px solid ${color}30` }}>
          <span className="font-bold text-[14px]" style={{ color }}>{label}</span>
          <span className="text-[11px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            {getIntervalText(calculatePreviewInterval(rating))}
          </span>
          <kbd className="mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold"
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
      gradient: 'linear-gradient(135deg, rgba(107,114,128,.1), rgba(107,114,128,.05))' },
    { label: 'Đúng', value: session.correct, color: '#22C55E',
      gradient: 'linear-gradient(135deg, rgba(34,197,94,.12), rgba(34,197,94,.06))' },
    { label: 'Chính xác', value: `${accuracy}%`, color: '#3B82F6',
      gradient: 'linear-gradient(135deg, rgba(59,130,246,.12), rgba(59,130,246,.06))' },
  ];

  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-4"
        style={{ background: 'linear-gradient(135deg, rgba(34,197,94,.15), rgba(52,211,153,.1))' }}>
        <IconTrophy size={36} style={{ color: '#22C55E' }} />
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
        Hoàn thành! 🎉
      </h2>
      <p className="text-[14px] mb-6" style={{ color: 'var(--theme-text-muted)' }}>
        Tuyệt vời, bạn đã hoàn thành phiên ôn tập
      </p>

      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-8">
        {resultItems.map((item, i) => (
          <div key={i} className="p-4 rounded-2xl" style={{ background: item.gradient }}>
            <div className="text-2xl font-extrabold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-[11px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <button onClick={onRestart}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[14px] text-white
            transition-all hover:shadow-md hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
          <IconRefresh size={16} /> Ôn tiếp
        </button>
        <Link href="/word-bank"
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-[14px] border
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
function EmptyState() {
  const { data: stats } = useSRSStats();

  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-4"
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,.15), rgba(168,85,247,.1))' }}>
        <IconBrain size={36} style={{ color: '#8B5CF6' }} />
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
        {stats?.total === 0 ? 'Chưa có từ nào' : 'Không có từ cần ôn!'}
      </h2>
      <p className="text-[14px] mb-6" style={{ color: 'var(--theme-text-muted)' }}>
        {stats?.total === 0
          ? 'Thêm từ vào Word Bank để bắt đầu học.'
          : 'Tuyệt vời! Bạn đã ôn hết tất cả các từ cho hôm nay. ✨'}
      </p>

      <div className="flex gap-3 justify-center">
        <Link href="/word-bank"
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[14px] text-white
            transition-all hover:shadow-md hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
          Đi đến Word Bank
        </Link>
        <Link href="/words"
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-[14px] border
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
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const { data: dueData, isLoading, refetch } = useSRSDue({ limit: 20, includeNew: true, newLimit: 5 });
  const reviewMutation = useReviewWord();
  const { playCorrect, playWrong } = useSoundEffects();

  // Stable ref for mutation.mutateAsync: avoids adding the entire mutation object
  // to useCallback deps (mutation identity changes on every API state transition
  // idle→pending→success→idle, which would thrash the keydown listener).
  const reviewMutateRef = useRef(reviewMutation.mutateAsync);
  useEffect(() => { reviewMutateRef.current = reviewMutation.mutateAsync; }, [reviewMutation.mutateAsync]);

  // Refs so keydown handler can read current values without being in its dep array.
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);
  const isFlippedRef = useRef(isFlipped);
  useEffect(() => { isFlippedRef.current = isFlipped; }, [isFlipped]);

  useEffect(() => {
    if (dueData && !session) {
      const allWords = [...dueData.due, ...dueData.new];
      if (allWords.length > 0) {
        setSession({ words: allWords, currentIndex: 0, reviewed: 0, correct: 0 });
      }
    }
  }, [dueData, session]);

  const currentWord = session?.words[session.currentIndex];
  const isComplete = session && session.currentIndex >= session.words.length;
  const progress = session ? ((session.currentIndex / session.words.length) * 100) : 0;

  // Stable: functional updater removes the need to capture isFlipped.
  const handleFlip = useCallback(() => setIsFlipped(prev => !prev), []);

  // Stable: reads current values from refs instead of closing over
  // session/currentWord/reviewMutation — none of them appear in deps.
  const handleRate = useCallback(async (rating: SRSRating) => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;
    const word = currentSession.words[currentSession.currentIndex];
    if (!word) return;
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
    } catch (error) {
      console.error('Review failed:', error);
    }
  }, [playCorrect, playWrong]);

  // handleRate and handleFlip are now stable so this effect runs only once,
  // eliminating the keydown listener thrash that previously fired on every flip
  // and every card advance.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sessionRef.current) return;
      const word = sessionRef.current.words[sessionRef.current.currentIndex];
      if (!word) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      }
      if (isFlippedRef.current) {
        const ratingMap: Record<string, SRSRating> = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' };
        if (ratingMap[e.key]) { e.preventDefault(); handleRate(ratingMap[e.key]); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRate]);

  const handleRestart = useCallback(() => { setSession(null); refetch(); }, [refetch]);

  return (
      <div className="max-w-4xl mx-auto py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
              <IconBrain size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Ôn tập Word Bank
              </h1>
              <p className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
                Spaced Repetition System (SM-2)
              </p>
            </div>
          </div>
          <Link href="/word-bank"
            className="flex items-center gap-1.5 text-[13px] font-medium transition-all hover:opacity-70"
            style={{ color: '#3B82F6' }}>
            <IconChevronLeft size={16} /> Word Bank
          </Link>
        </div>

        {/* Stats */}
        <SRSStatsCard />

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
              <IconBrain size={24} className="text-white" />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!dueData || dueData.total === 0) && <EmptyState />}

        {/* Review Session */}
        {session && !isComplete && currentWord && (
          <>
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-[12px] mb-2"
                style={{ color: 'var(--theme-text-muted)' }}>
                <span className="font-semibold">{session.currentIndex + 1} / {session.words.length}</span>
                <span className="font-semibold">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #3B82F6, #22C55E)',
                  }} />
              </div>
            </div>

            {/* Card */}
            <ReviewCard word={currentWord} isFlipped={isFlipped} onFlip={handleFlip} />

            {/* Rating buttons */}
            {isFlipped && (
              <RatingButtons word={currentWord} onRate={handleRate} isLoading={reviewMutation.isPending} />
            )}

            {/* Flip hint */}
            {!isFlipped && (
              <div className="text-center mt-6 text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
                Nhấn{' '}
                <kbd className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
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
            backgroundColor: 'rgba(139,92,246,.04)',
            borderColor: 'rgba(139,92,246,.15)',
          }}>
          <h3 className="font-bold text-[14px] mb-3 flex items-center gap-2"
            style={{ color: '#8B5CF6' }}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,.15), rgba(139,92,246,.08))' }}>
              <IconKeyboard size={15} style={{ color: '#8B5CF6' }} />
            </span>
            Phím tắt
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[12px]">
            {[
              { key: 'Space', action: 'Lật thẻ' },
              { key: '1', action: 'Quên' },
              { key: '2', action: 'Khó' },
              { key: '3', action: 'Tốt' },
              { key: '4', action: 'Dễ' },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-2">
                <kbd className="px-2 py-0.5 rounded-md font-semibold text-[11px]"
                  style={{ backgroundColor: 'rgba(139,92,246,.1)', color: '#8B5CF6' }}>
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