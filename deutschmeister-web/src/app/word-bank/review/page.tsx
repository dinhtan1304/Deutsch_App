'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { useSRSDue, useSRSStats, useReviewWord, SRSRating } from '@/hooks/usePersonalWords';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { PersonalWord, getSRSStatus, getIntervalText, SRSStatusInfo, WordTypeInfo } from '@/types/personalWord';

// ============================================
// Types
// ============================================
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    { label: 'Cần ôn', value: stats.due, color: '#ef4444', icon: '🔥' },
    { label: 'Mới', value: stats.new, color: '#3b82f6', icon: '✨' },
    { label: 'Đang học', value: stats.learning, color: '#f59e0b', icon: '📖' },
    { label: 'Thuộc lòng', value: stats.mature, color: '#22c55e', icon: '🎯' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="p-4 rounded-xl text-center transition-transform hover:scale-105"
          style={{ backgroundColor: `${item.color}15`, borderLeft: `4px solid ${item.color}` }}
        >
          <div className="text-2xl mb-1">{item.icon}</div>
          <div className="text-2xl font-bold" style={{ color: item.color }}>
            {item.value}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{item.label}</div>
        </div>
      ))}
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

  return (
    <div
      className="relative w-full max-w-lg mx-auto h-80 cursor-pointer perspective-1000"
      onClick={onFlip}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front - German */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center backface-hidden"
          style={{
            backgroundColor: 'var(--theme-bg-card, #ffffff)',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Type badge */}
          <div
            className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${typeInfo.color}20`, color: typeInfo.color }}
          >
            {typeInfo.icon} {typeInfo.labelDe}
          </div>

          {/* Status badge */}
          <div
            className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
          >
            {statusInfo.label}
          </div>

          {/* Word */}
          <div className="text-center">
            {word.wordType === 'nomen' && word.nomenData && (
              <span
                className="text-2xl font-medium"
                style={{
                  color:
                    word.nomenData.gender === 'masculine'
                      ? '#3b82f6'
                      : word.nomenData.gender === 'feminine'
                      ? '#ec4899'
                      : '#22c55e',
                }}
              >
                {word.nomenData.article}{' '}
              </span>
            )}
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {word.word}
            </span>
          </div>

          {/* Plural (for nouns) */}
          {word.wordType === 'nomen' && word.nomenData?.plural && (
            <div className="mt-2 text-gray-500 dark:text-gray-400">
              Plural: <span className="font-medium">{word.nomenData.plural}</span>
            </div>
          )}

          {/* Verb data */}
          {word.wordType === 'verb' && word.verbData && (
            <div className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
              {word.verbData.partizipII && (
                <span>Part. II: {word.verbData.partizipII}</span>
              )}
              {word.verbData.hilfsverb && (
                <span className="ml-3">+ {word.verbData.hilfsverb}</span>
              )}
            </div>
          )}

          {/* Hint to flip */}
          <div className="absolute bottom-4 text-sm text-gray-400">
            Nhấn để xem nghĩa
          </div>
        </div>

        {/* Back - Vietnamese/English */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center backface-hidden"
          style={{
            backgroundColor: 'var(--theme-bg-card, #ffffff)',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Translation */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {word.translationVi}
            </div>
            <div className="text-lg text-gray-500 dark:text-gray-400">
              {word.translationEn}
            </div>
          </div>

          {/* Example */}
          {word.examples && word.examples.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl max-w-full">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Ví dụ:
              </div>
              <div className="text-gray-900 dark:text-white italic">
                {word.examples[0]}
              </div>
            </div>
          )}

          {/* Interval info */}
          <div className="absolute bottom-4 text-sm text-gray-400">
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
  // Calculate preview intervals
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

  const ratings: { rating: SRSRating; label: string; color: string; hotkey: string }[] = [
    { rating: 'again', label: 'Quên', color: '#ef4444', hotkey: '1' },
    { rating: 'hard', label: 'Khó', color: '#f59e0b', hotkey: '2' },
    { rating: 'good', label: 'Tốt', color: '#22c55e', hotkey: '3' },
    { rating: 'easy', label: 'Dễ', color: '#3b82f6', hotkey: '4' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-6 max-w-lg mx-auto">
      {ratings.map(({ rating, label, color, hotkey }) => (
        <button
          key={rating}
          onClick={() => onRate(rating)}
          disabled={isLoading}
          className="flex flex-col items-center p-3 sm:p-4 rounded-xl transition-all hover:scale-105 disabled:opacity-50"
          style={{ backgroundColor: `${color}15`, border: `2px solid ${color}30` }}
        >
          <span className="font-bold text-sm sm:text-base" style={{ color }}>
            {label}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            {getIntervalText(calculatePreviewInterval(rating))}
          </span>
          <kbd className="mt-1 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
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
interface SessionCompleteProps {
  session: ReviewSession;
  onRestart: () => void;
}

function SessionComplete({ session, onRestart }: SessionCompleteProps) {
  const accuracy = session.reviewed > 0 
    ? Math.round((session.correct / session.reviewed) * 100) 
    : 0;

  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Hoàn thành!
      </h2>
      
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {session.reviewed}
          </div>
          <div className="text-sm text-gray-500">Đã ôn</div>
        </div>
        <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {session.correct}
          </div>
          <div className="text-sm text-gray-500">Đúng</div>
        </div>
        <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {accuracy}%
          </div>
          <div className="text-sm text-gray-500">Độ chính xác</div>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
        >
          Ôn tiếp
        </button>
        <Link
          href="/word-bank"
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Về Word Bank
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
    <div className="text-center py-12">
      <div className="text-6xl mb-4">✨</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Không có từ cần ôn tập!
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        {stats?.total === 0 ? (
          'Thêm từ vào Word Bank để bắt đầu học.'
        ) : (
          'Tuyệt vời! Bạn đã ôn hết tất cả các từ cho hôm nay.'
        )}
      </p>

      <div className="flex gap-4 justify-center">
        <Link
          href="/word-bank"
          className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
        >
          Đi đến Word Bank
        </Link>
        <Link
          href="/words"
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
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

  // Initialize session when data loads
  useEffect(() => {
    if (dueData && !session) {
      const allWords = [...dueData.due, ...dueData.new];
      if (allWords.length > 0) {
        setSession({
          words: allWords,
          currentIndex: 0,
          reviewed: 0,
          correct: 0,
        });
      }
    }
  }, [dueData, session]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!session || !currentWord) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped(!isFlipped);
      }

      if (isFlipped) {
        const ratingMap: Record<string, SRSRating> = {
          '1': 'again',
          '2': 'hard',
          '3': 'good',
          '4': 'easy',
        };
        if (ratingMap[e.key]) {
          e.preventDefault();
          handleRate(ratingMap[e.key]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session, isFlipped]);

  const currentWord = session?.words[session.currentIndex];
  const isComplete = session && session.currentIndex >= session.words.length;
  const progress = session ? ((session.currentIndex / session.words.length) * 100) : 0;

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  const handleRate = useCallback(async (rating: SRSRating) => {
    if (!currentWord || !session) return;

    try {
      await reviewMutation.mutateAsync({ wordId: currentWord.id, rating });

      // Play sound
      if (rating === 'again') {
        playWrong();
      } else {
        playCorrect();
      }

      // Update session
      setSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentIndex: prev.currentIndex + 1,
          reviewed: prev.reviewed + 1,
          correct: prev.correct + (rating !== 'again' ? 1 : 0),
        };
      });

      setIsFlipped(false);

      // Check if complete
      if (session.currentIndex + 1 >= session.words.length) {
         playCorrect(); // Optional: play completion sound if needed
      }
    } catch (error) {
      console.error('Review failed:', error);
    }
  }, [currentWord, session, reviewMutation, playCorrect, playWrong, playCorrect]);

  const handleRestart = useCallback(() => {
    setSession(null);
    refetch();
  }, [refetch]);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              📚 Ôn tập Word Bank
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Spaced Repetition System (SM-2)
            </p>
          </div>
          <Link
            href="/word-bank"
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            ← Về Word Bank
          </Link>
        </div>

        {/* Stats */}
        <SRSStatsCard />

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!dueData || dueData.total === 0) && <EmptyState />}

        {/* Review Session */}
        {session && !isComplete && currentWord && (
          <>
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>
                  {session.currentIndex + 1} / {session.words.length}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-blue-500 to-green-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Card */}
            <ReviewCard word={currentWord} isFlipped={isFlipped} onFlip={handleFlip} />

            {/* Rating buttons (only show when flipped) */}
            {isFlipped && (
              <RatingButtons
                word={currentWord}
                onRate={handleRate}
                isLoading={reviewMutation.isPending}
              />
            )}

            {/* Flip hint */}
            {!isFlipped && (
              <div className="text-center mt-6 text-gray-400">
                Nhấn <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Space</kbd> hoặc click để lật thẻ
              </div>
            )}
          </>
        )}

        {/* Session Complete */}
        {isComplete && session && (
          <SessionComplete session={session} onRestart={handleRestart} />
        )}

        {/* Tips */}
        <div
          className="mt-8 p-4 rounded-xl"
          style={{
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <h3 className="font-bold text-purple-600 dark:text-purple-400 mb-2">
            💡 Phím tắt
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-purple-700 dark:text-purple-300">
            <div>
              <kbd className="px-1.5 py-0.5 bg-purple-200 dark:bg-purple-800 rounded">Space</kbd> Lật thẻ
            </div>
            <div>
              <kbd className="px-1.5 py-0.5 bg-purple-200 dark:bg-purple-800 rounded">1</kbd> Quên
            </div>
            <div>
              <kbd className="px-1.5 py-0.5 bg-purple-200 dark:bg-purple-800 rounded">2</kbd> Khó
            </div>
            <div>
              <kbd className="px-1.5 py-0.5 bg-purple-200 dark:bg-purple-800 rounded">3</kbd> Tốt
            </div>
            <div>
              <kbd className="px-1.5 py-0.5 bg-purple-200 dark:bg-purple-800 rounded">4</kbd> Dễ
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}