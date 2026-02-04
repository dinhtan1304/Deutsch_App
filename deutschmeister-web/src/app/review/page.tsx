'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSRSStore } from '@/stores/srsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useWords, useRandomWords } from '@/hooks/useWords';
import { ReviewQuality, previewIntervals, getIntervalText, getCardStatus } from '@/lib/srs';
import { GenderInfo, Word } from '@/types';

type Phase = 'loading' | 'empty' | 'setup' | 'reviewing' | 'complete';

export default function SRSReviewPage() {
  const router = useRouter();
  const { settings, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playClick, playLevelUp, playStreak } = useSoundEffects();
  
  const {
    cards,
    isLoaded,
    loadCards,
    getDueCards,
    reviewCard,
    addWord,
    getStats,
  } = useSRSStore();

  const [phase, setPhase] = useState<Phase>('loading');
  const [reviewQueue, setReviewQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0, streak: 0, bestStreak: 0 });
  const [wordMap, setWordMap] = useState<Record<string, Word>>({});

  // Load words data
  const dueCards = useMemo(() => getDueCards(), [cards]);
  const dueWordIds = useMemo(() => dueCards.map(c => c.wordId), [dueCards]);

  // Fetch all words to build wordMap
  const { data: allWordsData } = useWords({ limit: 500 });
  
  // For adding new words
  const { data: randomWords, refetch: refetchRandom } = useRandomWords(20, {});

  useEffect(() => {
    loadSettings();
    loadCards();
  }, [loadSettings, loadCards]);

  // Build word map from fetched words
  useEffect(() => {
    if (allWordsData?.data) {
      const map: Record<string, Word> = {};
      allWordsData.data.forEach(w => {
        map[w.id] = w;
      });
      setWordMap(map);
    }
  }, [allWordsData]);

  // Determine phase
  useEffect(() => {
    if (!isLoaded) {
      setPhase('loading');
      return;
    }

    const stats = getStats();
    if (stats.total === 0) {
      setPhase('empty');
    } else if (stats.due === 0 && phase !== 'complete') {
      setPhase('complete');
    } else if (phase === 'loading') {
      setPhase('setup');
    }
  }, [isLoaded, cards, getStats, phase]);

  const startReview = useCallback(() => {
    const due = getDueCards();
    if (due.length === 0) {
      setPhase('complete');
      return;
    }

    // Shuffle and limit
    const shuffled = [...due].sort(() => Math.random() - 0.5);
    const queue = shuffled.slice(0, settings.questionsPerGame).map(c => c.wordId);
    
    setReviewQueue(queue);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({ correct: 0, wrong: 0, streak: 0, bestStreak: 0 });
    setPhase('reviewing');
    playClick();
  }, [getDueCards, settings.questionsPerGame, playClick]);

  const currentWordId = reviewQueue[currentIndex];
  const currentWord = currentWordId ? wordMap[currentWordId] : null;
  const currentCard = currentWordId ? useSRSStore.getState().getCard(currentWordId) : null;
  const intervals = currentCard ? previewIntervals(currentCard) : null;

  const flipCard = () => {
    if (!isFlipped) {
      playClick();
      setIsFlipped(true);
    }
  };

  const handleReview = useCallback((quality: ReviewQuality) => {
    if (!currentWordId) return;

    reviewCard(currentWordId, quality);

    const isCorrect = quality >= 3;
    
    if (isCorrect) {
      playCorrect();
      setSessionStats(prev => {
        const newStreak = prev.streak + 1;
        if (newStreak === 5 || newStreak === 10) {
          setTimeout(() => playCombo(), 200);
        }
        return {
          ...prev,
          correct: prev.correct + 1,
          streak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
        };
      });
    } else {
      playWrong();
      setSessionStats(prev => ({
        ...prev,
        wrong: prev.wrong + 1,
        streak: 0,
      }));
    }

    // Next card or complete
    setTimeout(() => {
      if (currentIndex + 1 >= reviewQueue.length) {
        playLevelUp();
        setPhase('complete');
      } else {
        setCurrentIndex(i => i + 1);
        setIsFlipped(false);
      }
    }, 300);
  }, [currentWordId, currentIndex, reviewQueue.length, reviewCard, playCorrect, playWrong, playCombo, playLevelUp]);

  // Keyboard shortcuts
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (phase !== 'reviewing') return;
      
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!isFlipped) flipCard();
      } else if (isFlipped) {
        if (e.key === '1') handleReview(1);
        else if (e.key === '2') handleReview(3);
        else if (e.key === '3') handleReview(4);
        else if (e.key === '4') handleReview(5);
      }
    };
    
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [phase, isFlipped, handleReview]);

  // Add random words to SRS
  const addRandomWords = async () => {
    const result = await refetchRandom();
    if (result.data) {
      result.data.forEach(word => {
        addWord(word.id);
        // Also add to wordMap
        setWordMap(prev => ({ ...prev, [word.id]: word }));
      });
      playStreak();
      setPhase('setup');
    }
  };

  const stats = getStats();
  const genderInfo = currentWord ? GenderInfo[currentWord.gender] : null;

  // Loading
  if (phase === 'loading') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <p className="text-gray-500">Đang tải...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Empty - no words added yet
  if (phase === 'empty') {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="text-center">
            <div className="text-6xl mb-6">📚</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">SRS Review</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Bạn chưa có từ nào trong danh sách ôn tập.<br />
              Thêm từ vào để bắt đầu học với thuật toán SM-2!
            </p>

            <div className="space-y-4">
              <Button size="lg" onClick={addRandomWords}>
                ➕ Thêm 20 từ ngẫu nhiên
              </Button>
              <p className="text-sm text-gray-500">
                Hoặc thêm từ từ trang Từ vựng bằng nút ⭐
              </p>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <h3 className="font-bold text-blue-700 dark:text-blue-300 mb-2">💡 SM-2 là gì?</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                SM-2 (SuperMemo 2) là thuật toán lặp lại ngắt quãng giúp bạn nhớ từ lâu hơn.
                Từ bạn nhớ tốt sẽ xuất hiện ít hơn, từ khó sẽ xuất hiện thường xuyên hơn.
              </p>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Setup
  if (phase === 'setup') {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="text-center">
            <div className="text-6xl mb-6">📚</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">SRS Review</h1>
            
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <div className="text-2xl font-bold text-blue-600">{stats.due}</div>
                <div className="text-xs text-blue-600">Cần ôn</div>
              </div>
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                <div className="text-2xl font-bold text-green-600">{stats.mature}</div>
                <div className="text-xs text-green-600">Đã thuộc</div>
              </div>
              <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                <div className="text-2xl font-bold text-yellow-600">{stats.learning}</div>
                <div className="text-xs text-yellow-600">Đang học</div>
              </div>
              <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">{stats.total}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Tổng</div>
              </div>
            </div>

            {stats.due > 0 ? (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Bạn có <span className="font-bold text-blue-500">{stats.due} từ</span> cần ôn tập hôm nay
                </p>
                <Button size="lg" onClick={startReview}>
                  🚀 Bắt đầu ôn tập
                </Button>
              </>
            ) : (
              <>
                <p className="text-green-600 dark:text-green-400 mb-6">
                  ✅ Tuyệt vời! Bạn đã ôn hết {stats.reviewedToday} từ hôm nay.
                </p>
                <Button size="lg" variant="outline" onClick={addRandomWords}>
                  ➕ Thêm từ mới
                </Button>
              </>
            )}

            <div className="mt-6">
              <Button variant="ghost" onClick={() => router.push('/games')}>
                ← Quay lại
              </Button>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Complete
  if (phase === 'complete') {
    const accuracy = sessionStats.correct + sessionStats.wrong > 0
      ? Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.wrong)) * 100)
      : 0;

    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Hoàn thành!</h1>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                <div className="text-2xl font-bold text-green-600">{sessionStats.correct}</div>
                <div className="text-xs text-green-600">Đúng</div>
              </div>
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                <div className="text-2xl font-bold text-red-600">{sessionStats.wrong}</div>
                <div className="text-xs text-red-600">Sai</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <div className="text-2xl font-bold text-blue-600">{accuracy}%</div>
                <div className="text-xs text-blue-600">Chính xác</div>
              </div>
              <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                <div className="text-2xl font-bold text-orange-600">{sessionStats.bestStreak}</div>
                <div className="text-xs text-orange-600">Best Streak</div>
              </div>
            </div>

            <div className="space-y-3">
              {stats.due > 0 && (
                <Button size="lg" onClick={startReview}>
                  🔄 Ôn tiếp ({stats.due} từ còn lại)
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={addRandomWords}>
                ➕ Thêm từ mới
              </Button>
              <Button variant="ghost" onClick={() => router.push('/games')}>
                ← Quay lại
              </Button>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Reviewing
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">
            {currentIndex + 1} / {reviewQueue.length}
          </div>
          {sessionStats.streak > 0 && (
            <div className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-bold">
              🔥 {sessionStats.streak} streak
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentIndex) / reviewQueue.length) * 100}%` }}
          />
        </div>

        {/* Card */}
        {currentWord && (
          <div className="relative h-72 mb-6">
            {/* Front */}
            <div 
              className={`absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center shadow-xl cursor-pointer transition-all duration-300 ${
                isFlipped ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100'
              }`}
              style={{ 
                backgroundColor: 'var(--theme-bg-card, #ffffff)',
                border: '3px solid #3b82f6',
              }}
              onClick={flipCard}
            >
              <p className="text-sm text-gray-400 mb-2">Mạo từ nào?</p>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                _______ {currentWord.word}
              </h2>
              <p className="text-gray-500 mb-4">{currentWord.translationEn}</p>
              {settings.showVietnamese && currentWord.translationVi && (
                <p className="text-gray-400 text-sm">{currentWord.translationVi}</p>
              )}
              <p className="mt-6 text-sm text-blue-500">👆 Click để xem đáp án</p>
            </div>

            {/* Back */}
            <div 
              className={`absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center shadow-xl transition-all duration-300 ${
                isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none scale-95'
              }`}
              style={{ backgroundColor: genderInfo?.color || '#3b82f6' }}
            >
              <p className="text-white/80 text-sm mb-2">Đáp án</p>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {currentWord.article} {currentWord.word}
              </h2>
              <p className="text-white/90 text-xl mb-1">{currentWord.translationEn}</p>
              {settings.showVietnamese && currentWord.translationVi && (
                <p className="text-white/70">{currentWord.translationVi}</p>
              )}
              <div className="mt-4 px-4 py-2 bg-white/20 rounded-full">
                <span className="text-white font-medium">{genderInfo?.label}</span>
              </div>
            </div>
          </div>
        )}

        {/* Review Buttons */}
        {isFlipped && intervals ? (
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleReview(1)}
              className="py-4 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 transition-all hover:scale-105 active:scale-95"
            >
              <div className="text-lg">🔄</div>
              <div className="text-xs">Quên</div>
              <div className="text-xs opacity-70">{getIntervalText(intervals.again)}</div>
            </button>
            <button
              onClick={() => handleReview(3)}
              className="py-4 rounded-xl font-medium text-white bg-orange-500 hover:bg-orange-600 transition-all hover:scale-105 active:scale-95"
            >
              <div className="text-lg">😕</div>
              <div className="text-xs">Khó</div>
              <div className="text-xs opacity-70">{getIntervalText(intervals.hard)}</div>
            </button>
            <button
              onClick={() => handleReview(4)}
              className="py-4 rounded-xl font-medium text-white bg-green-500 hover:bg-green-600 transition-all hover:scale-105 active:scale-95"
            >
              <div className="text-lg">👍</div>
              <div className="text-xs">Được</div>
              <div className="text-xs opacity-70">{getIntervalText(intervals.good)}</div>
            </button>
            <button
              onClick={() => handleReview(5)}
              className="py-4 rounded-xl font-medium text-white bg-blue-500 hover:bg-blue-600 transition-all hover:scale-105 active:scale-95"
            >
              <div className="text-lg">😎</div>
              <div className="text-xs">Dễ</div>
              <div className="text-xs opacity-70">{getIntervalText(intervals.easy)}</div>
            </button>
          </div>
        ) : (
          <Button size="lg" onClick={flipCard} className="w-full">
            🔄 Xem đáp án (Space)
          </Button>
        )}

        {/* Keyboard hint */}
        {isFlipped && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Phím: <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">1</kbd> Quên{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">2</kbd> Khó{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">3</kbd> Được{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">4</kbd> Dễ
          </p>
        )}

        <div className="text-center mt-6">
          <Button 
            variant="ghost" 
            onClick={() => { 
              playClick();
              setPhase('setup'); 
            }}
          >
            ✕ Dừng ôn tập
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}