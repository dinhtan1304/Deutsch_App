'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRandomWords } from '@/hooks/useWords';
import { Word, Gender, GenderInfo } from '@/types';
import { cn, speakGerman } from '@/lib/utils';

type GamePhase = 'setup' | 'playing' | 'result';

const TOTAL_QUESTIONS = 20;

export default function QuickQuizPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<Gender | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const { data: words, refetch, isLoading } = useRandomWords(TOTAL_QUESTIONS, {});

  const currentWord = words?.[currentIndex];

  const handleStartGame = () => {
    refetch();
    setPhase('playing');
    setCurrentIndex(0);
    setScore(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const handleAnswer = useCallback((gender: Gender) => {
    if (showFeedback || !currentWord) return;

    setSelectedAnswer(gender);
    setShowFeedback(true);

    const isCorrect = gender === currentWord.gender;
    if (isCorrect) {
      setScore(s => s + 1);
    }
    setAnswers(a => [...a, isCorrect]);

    // Auto advance after feedback
    setTimeout(() => {
      if (currentIndex < TOTAL_QUESTIONS - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        setPhase('result');
      }
    }, 1500);
  }, [showFeedback, currentWord, currentIndex]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'playing' || showFeedback) return;

      switch (e.key) {
        case '1':
          handleAnswer('masculine');
          break;
        case '2':
          handleAnswer('feminine');
          break;
        case '3':
          handleAnswer('neuter');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, showFeedback, handleAnswer]);

  // Setup phase
  if (phase === 'setup') {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="text-center">
            <div className="text-6xl mb-6">⚡</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Quick Quiz
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Choose the correct article (der, die, das) for {TOTAL_QUESTIONS} German words.
              Test your knowledge and improve your skills!
            </p>

            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-8">
              <h3 className="font-semibold mb-2">How to play:</h3>
              <ul className="text-left text-gray-600 dark:text-gray-400 space-y-2">
                <li>• Click on the correct article button</li>
                <li>• Use keyboard: 1 = der, 2 = die, 3 = das</li>
                <li>• Get instant feedback after each answer</li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={handleStartGame} isLoading={isLoading}>
                Start Quiz
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/games')}>
                Back
              </Button>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Result phase
  if (phase === 'result') {
    const percentage = Math.round((score / TOTAL_QUESTIONS) * 100);
    const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';

    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="text-center">
            <div className="text-6xl mb-4">
              {percentage >= 80 ? '🏆' : percentage >= 60 ? '👍' : '💪'}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Quiz Complete!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              You scored {score} out of {TOTAL_QUESTIONS}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-4">
                <div className="text-2xl font-bold text-green-600">{score}</div>
                <div className="text-sm text-green-600">Correct</div>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 rounded-xl p-4">
                <div className="text-2xl font-bold text-red-600">{TOTAL_QUESTIONS - score}</div>
                <div className="text-sm text-red-600">Wrong</div>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-600">{percentage}%</div>
                <div className="text-sm text-blue-600">Accuracy</div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={handleStartGame}>
                Play Again
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/games')}>
                Back to Games
              </Button>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Playing phase
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Question {currentIndex + 1} of {TOTAL_QUESTIONS}</span>
            <span>Score: {score}</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${((currentIndex + 1) / TOTAL_QUESTIONS) * 100}%` }}
            />
          </div>
        </div>

        {/* Word Card */}
        {currentWord && (
          <Card className="text-center mb-6">
            <button
              onClick={() => speakGerman(currentWord.word)}
              className="text-4xl mb-2 hover:scale-110 transition-transform"
            >
              🔊
            </button>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {currentWord.word}
            </h2>
            <p className="text-xl text-gray-500 dark:text-gray-400">
              {currentWord.translationEn}
            </p>

            {showFeedback && (
              <div className={cn(
                'mt-4 py-2 px-4 rounded-xl inline-block',
                selectedAnswer === currentWord.gender
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              )}>
                {selectedAnswer === currentWord.gender
                  ? '✓ Correct!'
                  : `✗ Wrong! It's "${GenderInfo[currentWord.gender].article}"`}
              </div>
            )}
          </Card>
        )}

        {/* Article Buttons */}
        <div className="grid grid-cols-3 gap-4">
          {(['masculine', 'feminine', 'neuter'] as Gender[]).map((gender, index) => {
            const info = GenderInfo[gender];
            const isSelected = selectedAnswer === gender;
            const isCorrect = currentWord?.gender === gender;

            let buttonStyle = 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600';
            
            if (showFeedback) {
              if (isCorrect) {
                buttonStyle = 'bg-green-500 text-white';
              } else if (isSelected && !isCorrect) {
                buttonStyle = 'bg-red-500 text-white';
              }
            }

            return (
              <button
                key={gender}
                onClick={() => handleAnswer(gender)}
                disabled={showFeedback}
                className={cn(
                  'py-6 rounded-2xl font-bold text-2xl transition-all',
                  buttonStyle,
                  !showFeedback && 'hover:scale-105'
                )}
              >
                <div>{info.article}</div>
                <div className="text-sm font-normal opacity-75">
                  ({index + 1}) {info.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Exit button */}
        <div className="text-center mt-8">
          <Button variant="ghost" onClick={() => router.push('/games')}>
            Exit Game
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
