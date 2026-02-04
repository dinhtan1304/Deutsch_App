'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRandomWords } from '@/hooks/useWords';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { Gender, GenderInfo, Word } from '@/types';

type Phase = 'setup' | 'playing' | 'result';

interface AnswerRecord {
  word: Word;
  selectedAnswer: Gender;
  isCorrect: boolean;
}

export default function GenderQuizPage() {
  const router = useRouter();
  const { settings, isLoaded, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playLevelUp, playGameOver, playClick } = useSoundEffects();

  const [phase, setPhase] = useState<Phase>('setup');
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<Gender | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  const questionsCount = isLoaded ? settings.questionsPerGame : 20;
  const { data: words, refetch, isLoading } = useRandomWords(questionsCount, {});
  const currentWord = words?.[index];

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
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setAnswered(false);
    setSelectedAnswer(null);
    setAnswers([]);
    setPhase('playing');
  };

  const handleAnswer = useCallback((gender: Gender) => {
    if (answered || !currentWord) return;

    setSelectedAnswer(gender);
    setAnswered(true);

    const isCorrect = gender === currentWord.gender;

    // Record answer
    setAnswers(prev => [...prev, {
      word: currentWord,
      selectedAnswer: gender,
      isCorrect,
    }]);

    if (isCorrect) {
      playCorrect();
      
      const newCombo = combo + 1;
      const multiplier = Math.min(newCombo, 4);
      setScore(s => s + 10 * multiplier);
      setCombo(newCombo);
      
      if (newCombo > bestCombo) setBestCombo(newCombo);

      // Combo sound at milestones
      if (newCombo === 3 || newCombo === 5 || newCombo === 10) {
        setTimeout(() => playCombo(), 200);
      }

      // Level up sound at score milestones
      if ((score + 10 * multiplier) % 100 === 0) {
        setTimeout(() => playLevelUp(), 300);
      }
    } else {
      playWrong();
      setCombo(0);
    }

    // Next question or end game
    setTimeout(() => {
      if (index + 1 >= questionsCount) {
        playGameOver();
        setPhase('result');
      } else {
        setIndex(i => i + 1);
        setAnswered(false);
        setSelectedAnswer(null);
      }
    }, 1200);
  }, [answered, currentWord, combo, bestCombo, index, questionsCount, score, playCorrect, playWrong, playCombo, playLevelUp, playGameOver]);

  // Keyboard shortcuts
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (phase !== 'playing' || answered) return;
      if (e.key === '1') handleAnswer('masculine');
      if (e.key === '2') handleAnswer('feminine');
      if (e.key === '3') handleAnswer('neuter');
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [phase, answered, handleAnswer]);

  // Setup Screen
  if (phase === 'setup') {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="text-center">
            <div className="text-6xl mb-6">🎯</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Gender Quiz</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Chọn mạo từ đúng cho <span className="font-bold text-blue-500">{questionsCount} từ</span>
            </p>
            <p className="text-sm text-gray-400 mb-8">(Thay đổi số câu trong Settings → Học tập)</p>

            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-8">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                🎯 10 điểm/câu đúng • Combo tối đa x4
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Phím: <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">1</kbd> der,{' '}
                <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">2</kbd> die,{' '}
                <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">3</kbd> das
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
    const correctCount = answers.filter(a => a.isCorrect).length;
    const wrongCount = answers.filter(a => !a.isCorrect).length;
    const accuracy = Math.round((correctCount / questionsCount) * 100);

    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="text-center mb-6">
            <div className="text-6xl mb-4">
              {accuracy >= 80 ? '🏆' : accuracy >= 60 ? '👍' : '📚'}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Kết quả</h1>
            
            <div className="my-6">
              <div className="text-6xl font-bold text-blue-500">{score}</div>
              <p className="text-gray-500">điểm</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-3">
                <div className="text-xl font-bold text-green-600">{correctCount}</div>
                <div className="text-xs text-green-600">Đúng</div>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 rounded-xl p-3">
                <div className="text-xl font-bold text-red-600">{wrongCount}</div>
                <div className="text-xs text-red-600">Sai</div>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-3">
                <div className="text-xl font-bold text-blue-600">{accuracy}%</div>
                <div className="text-xs text-blue-600">Chính xác</div>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/30 rounded-xl p-3">
                <div className="text-xl font-bold text-orange-600">x{bestCombo}</div>
                <div className="text-xs text-orange-600">Best Combo</div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={startGame}>🔄 Chơi lại</Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/games')}>← Menu</Button>
            </div>
          </Card>

          {/* Answer Review */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📝 Chi tiết câu trả lời</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {answers.map((record, i) => {
                const correctInfo = GenderInfo[record.word.gender];
                const selectedInfo = GenderInfo[record.selectedAnswer];
                
                return (
                  <div 
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{
                      backgroundColor: record.isCorrect 
                        ? 'rgba(34, 197, 94, 0.1)' 
                        : 'rgba(239, 68, 68, 0.1)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className={record.isCorrect ? 'text-green-500' : 'text-red-500'}>
                        {record.isCorrect ? '✓' : '✗'}
                      </span>
                      <div>
                        <span 
                          className="font-medium"
                          style={{ color: correctInfo.color }}
                        >
                          {correctInfo.article}
                        </span>
                        <span className="ml-1 font-bold">{record.word.word}</span>
                      </div>
                    </div>
                    
                    {!record.isCorrect && (
                      <div className="text-sm text-gray-500">
                        Bạn chọn: <span style={{ color: selectedInfo.color }}>{selectedInfo.article}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Playing Screen
  const genderButtons = [
    { gender: 'masculine' as Gender, info: GenderInfo.masculine },
    { gender: 'feminine' as Gender, info: GenderInfo.feminine },
    { gender: 'neuter' as Gender, info: GenderInfo.neuter },
  ];

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-2xl font-bold text-blue-500">{score} điểm</div>
          <div className="text-sm text-gray-500">
            {index + 1} / {questionsCount}
          </div>
        </div>

        {/* Progress */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((index + 1) / questionsCount) * 100}%` }}
          />
        </div>

        {/* Combo */}
        <div className="h-10 flex justify-center items-center mb-4">
          {combo > 0 && (
            <div className="px-4 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold text-sm">
              🔥 Combo x{Math.min(combo, 4)}!
            </div>
          )}
        </div>

        {/* Word Card */}
        {currentWord && (
          <Card 
            className="text-center mb-6 py-12 transition-all duration-300"
            style={{
              transform: answered ? 'scale(0.98)' : 'scale(1)',
              borderColor: answered 
                ? (selectedAnswer === currentWord.gender ? '#22c55e' : '#ef4444')
                : 'transparent',
              borderWidth: answered ? '3px' : '1px',
            }}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              {currentWord.word}
            </h2>
            <p className="text-xl text-gray-500 mb-2">{currentWord.translationEn}</p>
            {settings.showVietnamese && currentWord.translationVi && (
              <p className="text-gray-400">{currentWord.translationVi}</p>
            )}

            {/* Show correct answer after answering */}
            {answered && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-lg">
                  Đáp án: 
                  <span 
                    className="font-bold ml-2"
                    style={{ color: GenderInfo[currentWord.gender].color }}
                  >
                    {GenderInfo[currentWord.gender].article} {currentWord.word}
                  </span>
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Answer Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {genderButtons.map(({ gender, info }, i) => {
            const isSelected = selectedAnswer === gender;
            const isCorrect = currentWord?.gender === gender;
            
            let bgColor: string = info.color;
            let opacity = 1;
            
            if (answered) {
              if (isCorrect) {
                bgColor = '#22c55e';
              } else if (isSelected) {
                bgColor = '#ef4444';
              } else {
                opacity = 0.4;
              }
            }

            return (
              <button
                key={gender}
                onClick={() => handleAnswer(gender)}
                disabled={answered}
                className="py-8 md:py-10 rounded-2xl font-bold text-3xl md:text-4xl text-white transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: bgColor,
                  opacity,
                }}
              >
                {info.article}
                <div className="text-sm font-normal mt-2 opacity-80">
                  {answered && isCorrect && '✓'}
                  {answered && isSelected && !isCorrect && '✗'}
                  {!answered && `(${i + 1})`}
                </div>
              </button>
            );
          })}
        </div>

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