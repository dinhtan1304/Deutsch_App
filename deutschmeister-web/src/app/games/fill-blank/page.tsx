'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  userInput: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export default function FillBlankPage() {
  const router = useRouter();
  const { settings, isLoaded, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playLevelUp, playGameOver, playClick } = useSoundEffects();
  const inputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>('setup');
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [showHint, setShowHint] = useState(false);

  const questionsCount = isLoaded ? settings.questionsPerGame : 20;
  const { data: words, refetch, isLoading } = useRandomWords(questionsCount, {});
  const currentWord = words?.[index];

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Focus input when playing
  useEffect(() => {
    if (phase === 'playing' && !answered && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase, answered, index]);

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
    setUserInput('');
    setAnswered(false);
    setIsCorrect(false);
    setAnswers([]);
    setShowHint(false);
    setPhase('playing');
  };

  const checkAnswer = useCallback(() => {
    if (answered || !currentWord) return;

    const correctAnswer = currentWord.article.toLowerCase();
    const userAnswer = userInput.trim().toLowerCase();
    const correct = userAnswer === correctAnswer;

    setAnswered(true);
    setIsCorrect(correct);

    // Record answer
    setAnswers(prev => [...prev, {
      word: currentWord,
      userInput: userInput.trim(),
      correctAnswer: currentWord.article,
      isCorrect: correct,
    }]);

    if (correct) {
      playCorrect();
      
      const newCombo = combo + 1;
      const multiplier = Math.min(newCombo, 4);
      setScore(s => s + 10 * multiplier);
      setCombo(newCombo);
      
      if (newCombo > bestCombo) setBestCombo(newCombo);

      // Combo sound
      if (newCombo === 3 || newCombo === 5 || newCombo === 10) {
        setTimeout(() => playCombo(), 200);
      }

      // Level up sound
      if ((score + 10 * multiplier) % 100 === 0) {
        setTimeout(() => playLevelUp(), 300);
      }
    } else {
      playWrong();
      setCombo(0);
    }
  }, [answered, currentWord, userInput, combo, bestCombo, score, playCorrect, playWrong, playCombo, playLevelUp]);

  const nextQuestion = useCallback(() => {
    if (index + 1 >= questionsCount) {
      playGameOver();
      setPhase('result');
    } else {
      setIndex(i => i + 1);
      setUserInput('');
      setAnswered(false);
      setIsCorrect(false);
      setShowHint(false);
    }
  }, [index, questionsCount, playGameOver]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!answered) {
        checkAnswer();
      } else {
        nextQuestion();
      }
    }
  };

  // Quick answer buttons
  const handleQuickAnswer = (article: string) => {
    if (answered) return;
    setUserInput(article);
    
    // Auto submit after short delay
    setTimeout(() => {
      const correctAnswer = currentWord?.article.toLowerCase();
      const correct = article.toLowerCase() === correctAnswer;
      
      setAnswered(true);
      setIsCorrect(correct);

      setAnswers(prev => [...prev, {
        word: currentWord!,
        userInput: article,
        correctAnswer: currentWord!.article,
        isCorrect: correct,
      }]);

      if (correct) {
        playCorrect();
        const newCombo = combo + 1;
        setScore(s => s + 10 * Math.min(newCombo, 4));
        setCombo(newCombo);
        if (newCombo > bestCombo) setBestCombo(newCombo);
        if (newCombo === 3 || newCombo === 5 || newCombo === 10) {
          setTimeout(() => playCombo(), 200);
        }
      } else {
        playWrong();
        setCombo(0);
      }
    }, 100);
  };

  // Setup Screen
  if (phase === 'setup') {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="text-center">
            <div className="text-6xl mb-6">✍️</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Fill in the Blank</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Điền mạo từ đúng (der/die/das) cho <span className="font-bold text-blue-500">{questionsCount} từ</span>
            </p>
            <p className="text-sm text-gray-400 mb-8">(Thay đổi số câu trong Settings → Học tập)</p>

            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-8">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                🎯 Gõ hoặc click nút để điền mạo từ
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ⌨️ Nhấn <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">Enter</kbd> để xác nhận
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
                const genderInfo = GenderInfo[record.word.gender];
                
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
                          style={{ color: genderInfo.color }}
                        >
                          {record.correctAnswer}
                        </span>
                        <span className="ml-1 font-bold">{record.word.word}</span>
                        <span className="ml-2 text-sm text-gray-500">({record.word.translationEn})</span>
                      </div>
                    </div>
                    
                    {!record.isCorrect && (
                      <div className="text-sm text-gray-500">
                        Bạn gõ: <span className="text-red-500 font-medium">{record.userInput || '(trống)'}</span>
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
  const genderInfo = currentWord ? GenderInfo[currentWord.gender] : null;

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
            className="text-center mb-6 py-8 transition-all duration-300"
            style={{
              borderColor: answered 
                ? (isCorrect ? '#22c55e' : '#ef4444')
                : 'transparent',
              borderWidth: answered ? '3px' : '1px',
            }}
          >
            {/* Fill in the blank sentence */}
            <div className="text-3xl md:text-4xl font-bold mb-6">
              <span 
                className="inline-block min-w-[80px] border-b-4 mx-2 pb-1"
                style={{ 
                  borderColor: answered 
                    ? (isCorrect ? '#22c55e' : '#ef4444')
                    : '#3b82f6',
                  color: answered ? genderInfo?.color : 'inherit'
                }}
              >
                {answered ? currentWord.article : '______'}
              </span>
              <span className="text-gray-900 dark:text-white">{currentWord.word}</span>
            </div>

            {/* Translation */}
            <p className="text-xl text-gray-500 mb-4">{currentWord.translationEn}</p>
            {settings.showVietnamese && currentWord.translationVi && (
              <p className="text-gray-400">{currentWord.translationVi}</p>
            )}

            {/* Hint */}
            {!answered && (
              <button
                onClick={() => setShowHint(true)}
                className="mt-4 text-sm text-blue-500 hover:underline"
              >
                {showHint ? `💡 ${genderInfo?.label}` : '💡 Xem gợi ý'}
              </button>
            )}

            {/* Result feedback */}
            {answered && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className={`text-lg font-medium ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                  {isCorrect ? '✓ Chính xác!' : `✗ Sai rồi! Đáp án là "${currentWord.article}"`}
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Input Area */}
        {!answered ? (
          <div className="space-y-4">
            {/* Text Input */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Gõ der, die hoặc das..."
                className="flex-1 px-4 py-3 rounded-xl border-2 text-center text-xl font-medium focus:border-blue-500 focus:outline-none"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #ffffff)',
                  borderColor: 'var(--theme-border, #e5e7eb)',
                  color: 'var(--theme-text-primary, #111827)',
                }}
                autoComplete="off"
                autoCapitalize="off"
              />
              <Button onClick={checkAnswer} disabled={!userInput.trim()}>
                Kiểm tra
              </Button>
            </div>

            {/* Quick Answer Buttons */}
            <div className="grid grid-cols-3 gap-3">
              {(['der', 'die', 'das'] as const).map((article) => {
                const gender = article === 'der' ? 'masculine' : article === 'die' ? 'feminine' : 'neuter';
                const info = GenderInfo[gender];
                
                return (
                  <button
                    key={article}
                    onClick={() => handleQuickAnswer(article)}
                    className="py-4 rounded-xl font-bold text-xl text-white transition-all hover:scale-105 active:scale-95"
                    style={{ backgroundColor: info.color }}
                  >
                    {article}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <Button size="lg" onClick={nextQuestion} className="w-full">
            {index + 1 >= questionsCount ? '🏆 Xem kết quả' : 'Câu tiếp theo →'}
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