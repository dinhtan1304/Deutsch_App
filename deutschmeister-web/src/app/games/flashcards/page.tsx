'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRandomWords } from '@/hooks/useWords';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { GenderInfo, Word } from '@/types';

type Phase = 'setup' | 'playing' | 'result';

interface CardResult {
  word: Word;
  knew: boolean;
}

export default function FlashcardsPage() {
  const router = useRouter();
  const { settings, isLoaded, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playClick, playGameOver, playStreak } = useSoundEffects();

  const [phase, setPhase] = useState<Phase>('setup');
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<CardResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const cardsCount = isLoaded ? settings.questionsPerGame : 20;
  const { data: words, refetch, isLoading } = useRandomWords(cardsCount, {});
  const currentWord = words?.[index];
  const progress = words?.length ? ((index) / words.length) * 100 : 0;

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const startGame = async () => {
    playClick();
    
    const result = await refetch();
    if (!result.data?.length) {
      alert('Không có từ vựng! Vui lòng seed database.');
      return;
    }

    setIndex(0);
    setIsFlipped(false);
    setResults([]);
    setStreak(0);
    setBestStreak(0);
    setPhase('playing');
  };

  const flipCard = () => {
    playClick();
    setIsFlipped(!isFlipped);
  };

  const handleResponse = useCallback((knew: boolean) => {
    if (!currentWord) return;

    // Record result
    setResults(prev => [...prev, { word: currentWord, knew }]);

    if (knew) {
      playCorrect();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      
      // Combo sounds
      if (newStreak === 5 || newStreak === 10 || newStreak === 15) {
        setTimeout(() => playCombo(), 200);
      }
    } else {
      playWrong();
      setStreak(0);
    }

    // Next card or finish
    setTimeout(() => {
      if (index + 1 >= (words?.length || 0)) {
        playGameOver();
        if (bestStreak >= 5 || streak >= 5) {
          setTimeout(() => playStreak(), 300);
        }
        setPhase('result');
      } else {
        setIndex(i => i + 1);
        setIsFlipped(false);
      }
    }, 300);
  }, [currentWord, index, words?.length, streak, bestStreak, playCorrect, playWrong, playCombo, playGameOver, playStreak]);

  // Keyboard shortcuts
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;
      
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!isFlipped) {
          flipCard();
        }
      } else if (e.key === 'ArrowLeft' || e.key === '1') {
        if (isFlipped) handleResponse(false);
      } else if (e.key === 'ArrowRight' || e.key === '2') {
        if (isFlipped) handleResponse(true);
      }
    };
    
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [phase, isFlipped, handleResponse]);

  // Setup Screen
  if (phase === 'setup') {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="text-center">
            <div className="text-6xl mb-6">🃏</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Flashcards</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Ôn tập <span className="font-bold text-blue-500">{cardsCount} từ</span> với thẻ ghi nhớ
            </p>
            <p className="text-sm text-gray-400 mb-8">(Thay đổi số thẻ trong Settings → Học tập)</p>

            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-8">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                🃏 Click thẻ hoặc nhấn <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">Space</kbd> để lật
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ⬅️ Chưa nhớ | ➡️ Đã nhớ
              </p>
              <p className="text-sm text-gray-500 mt-2">
                🔊 Âm thanh: {settings.soundEnabled ? 'Bật' : 'Tắt'}
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={startGame} isLoading={isLoading}>
                🚀 Bắt đầu
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/games')}>
                ← Quay lại
              </Button>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Result Screen
  if (phase === 'result') {
    const knewCount = results.filter(r => r.knew).length;
    const didntKnowCount = results.filter(r => !r.knew).length;
    const accuracy = Math.round((knewCount / results.length) * 100);
    const needReview = results.filter(r => !r.knew);

    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="text-center mb-6">
            <div className="text-6xl mb-4">
              {accuracy >= 80 ? '🏆' : accuracy >= 60 ? '👍' : '📚'}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Hoàn thành!</h1>
            
            <div className="grid grid-cols-3 gap-4 my-6">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-4">
                <div className="text-3xl font-bold text-green-600">{knewCount}</div>
                <div className="text-sm text-green-600">Đã nhớ</div>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 rounded-xl p-4">
                <div className="text-3xl font-bold text-red-600">{didntKnowCount}</div>
                <div className="text-sm text-red-600">Cần ôn</div>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/30 rounded-xl p-4">
                <div className="text-3xl font-bold text-orange-600">{bestStreak}</div>
                <div className="text-sm text-orange-600">Best Streak</div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={startGame}>🔄 Học lại</Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/games')}>← Menu</Button>
            </div>
          </Card>

          {/* Words to review */}
          {needReview.length > 0 && (
            <Card>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                📝 Từ cần ôn lại ({needReview.length})
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {needReview.map((record, i) => {
                  const genderInfo = GenderInfo[record.word.gender];
                  return (
                    <div 
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                    >
                      <div>
                        <span style={{ color: genderInfo.color }} className="font-medium">
                          {record.word.article}
                        </span>
                        <span className="ml-1 font-bold">{record.word.word}</span>
                      </div>
                      <span className="text-sm text-gray-500">{record.word.translationEn}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </MainLayout>
    );
  }

  // Playing Screen
  const genderInfo = currentWord ? GenderInfo[currentWord.gender] : null;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">
            {index + 1} / {words?.length || 0}
          </div>
          {streak > 0 && (
            <div className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-bold">
              🔥 {streak} streak
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-8 overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Flashcard */}
        {currentWord && (
          <div className="relative h-80 mb-8">
            {/* Front Card */}
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
              <p className="text-sm text-gray-400 mb-4">Từ tiếng Đức</p>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {currentWord.word}
              </h2>
              {currentWord.pronunciation && settings.showPronunciation && (
                <p className="text-gray-500">[{currentWord.pronunciation}]</p>
              )}
              <p className="mt-8 text-sm text-blue-500">
                👆 Click để lật thẻ
              </p>
            </div>

            {/* Back Card */}
            <div 
              className={`absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center shadow-xl transition-all duration-300 ${
                isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none scale-95'
              }`}
              style={{ 
                backgroundColor: genderInfo?.color || '#3b82f6',
              }}
            >
              <p className="text-white/80 text-sm mb-2">Đáp án</p>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {currentWord.article} {currentWord.word}
              </h2>
              <p className="text-white/90 text-xl mb-2">{currentWord.translationEn}</p>
              {settings.showVietnamese && currentWord.translationVi && (
                <p className="text-white/70">{currentWord.translationVi}</p>
              )}
              <div className="mt-4 px-4 py-2 bg-white/20 rounded-full">
                <span className="text-white font-medium">{genderInfo?.label}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isFlipped ? (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleResponse(false)}
              className="py-6 rounded-2xl font-bold text-xl text-white bg-red-500 hover:bg-red-600 transition-all hover:scale-105 active:scale-95"
            >
              ❌ Chưa nhớ
              <div className="text-sm font-normal opacity-80 mt-1">← hoặc phím 1</div>
            </button>
            <button
              onClick={() => handleResponse(true)}
              className="py-6 rounded-2xl font-bold text-xl text-white bg-green-500 hover:bg-green-600 transition-all hover:scale-105 active:scale-95"
            >
              ✅ Đã nhớ
              <div className="text-sm font-normal opacity-80 mt-1">→ hoặc phím 2</div>
            </button>
          </div>
        ) : (
          <Button size="lg" onClick={flipCard} className="w-full">
            🔄 Lật thẻ (Space)
          </Button>
        )}

        <div className="text-center mt-6">
          <Button 
            variant="ghost" 
            onClick={() => { 
              playClick();
              router.push('/games'); 
            }}
          >
            ✕ Thoát
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}