/**
 * QuickQuizPage
 * UC-2.2.01: Quick Quiz Mode - Rapid-fire article identification game
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGameStore, useCurrentSession, useCurrentWord, useTimeRemaining, useIsTimerRunning } from '../../stores/gameStore';
import { GameDifficulty, GameResultSummary, DIFFICULTY_CONFIG, QuestionResult } from '../../../domain/entities/GameSession';
import { Gender, GenderInfo } from '../../../domain/valueObjects/Gender';
import { WordCategory, WORD_CATEGORIES, WordCategoryInfo } from '../../../domain/valueObjects/WordCategory';
import { ArticleButtonGroup } from '../../components/games/ArticleButton';
import { TimerBar, CircularTimer } from '../../components/games/TimerBar';
import { GameHeader, ScorePopup } from '../../components/games/ScoreDisplay';
import { GameResultModal } from '../../components/games/GameResultModal';
import { Button } from '../../components/ui/Button';

// Game states
type GamePhase = 'menu' | 'playing' | 'feedback' | 'paused' | 'finished';

export function QuickQuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDifficulty = searchParams.get('difficulty') as GameDifficulty | null;
  
  // Game store
  const {
    startGame,
    submitAnswer,
    handleTimeout,
    nextQuestion,
    pauseGame,
    resumeGame,
    endGame,
    resetSession,
    setTimeRemaining,
    decrementTimer
  } = useGameStore();
  
  const session = useCurrentSession();
  const currentWord = useCurrentWord();
  const timeRemaining = useTimeRemaining();
  const isTimerRunning = useIsTimerRunning();
  
  // Local state
  const [phase, setPhase] = useState<GamePhase>(initialDifficulty ? 'playing' : 'menu');
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>(initialDifficulty || 'beginner');
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | null>(null); // null = Random/All
  const [selectedAnswer, setSelectedAnswer] = useState<Gender | null>(null);
  const [lastResult, setLastResult] = useState<QuestionResult | null>(null);
  const [gameResult, setGameResult] = useState<GameResultSummary | null>(null);
  const [showScorePopup, setShowScorePopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Timer ref for cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Start game on mount if difficulty provided
  useEffect(() => {
    if (initialDifficulty && phase === 'playing') {
      handleStartGame(initialDifficulty);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      resetSession();
    };
  }, []);
  
  // Timer effect
  useEffect(() => {
    if (phase === 'playing' && isTimerRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        decrementTimer();
      }, 100);
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [phase, isTimerRunning, decrementTimer]);
  
  // Handle timeout
  useEffect(() => {
    if (phase === 'playing' && timeRemaining <= 0 && isTimerRunning) {
      handleTimeOut();
    }
  }, [timeRemaining, phase, isTimerRunning]);
  
  // Start game handler
  const handleStartGame = async (difficulty: GameDifficulty, category: WordCategory | null = selectedCategory) => {
    setIsLoading(true);
    setSelectedDifficulty(difficulty);
    
    try {
      await startGame('quick-quiz', difficulty, 20, category);
      setPhase('playing');
      setSelectedAnswer(null);
      setLastResult(null);
    } catch (error) {
      console.error('Failed to start game:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Answer handler
  const handleAnswer = useCallback((gender: Gender) => {
    if (phase !== 'playing' || !currentWord) return;
    
    setSelectedAnswer(gender);
    const result = submitAnswer(gender);
    
    if (result) {
      setLastResult(result);
      setShowScorePopup(true);
      setPhase('feedback');
      
      // Hide popup after delay
      setTimeout(() => {
        setShowScorePopup(false);
      }, 800);
      
      // Move to next question or end game
      setTimeout(() => {
        if (session?.isGameOver) {
          handleEndGame();
        } else {
          handleNextQuestion();
        }
      }, 1200);
    }
  }, [phase, currentWord, submitAnswer, session]);
  
  // Timeout handler
  const handleTimeOut = useCallback(() => {
    if (phase !== 'playing' || !currentWord) return;
    
    setSelectedAnswer(null);
    const result = handleTimeout();
    
    if (result) {
      setLastResult(result);
      setPhase('feedback');
      
      setTimeout(() => {
        if (session?.isGameOver) {
          handleEndGame();
        } else {
          handleNextQuestion();
        }
      }, 1500);
    }
  }, [phase, currentWord, handleTimeout, session]);
  
  // Next question handler
  const handleNextQuestion = useCallback(() => {
    const next = nextQuestion();
    if (next) {
      setPhase('playing');
      setSelectedAnswer(null);
      setLastResult(null);
    } else {
      handleEndGame();
    }
  }, [nextQuestion]);
  
  // End game handler
  const handleEndGame = useCallback(() => {
    const result = endGame();
    if (result) {
      setGameResult(result);
      setPhase('finished');
    }
  }, [endGame]);
  
  // Pause handler
  const handlePause = () => {
    pauseGame();
    setPhase('paused');
  };
  
  // Resume handler
  const handleResume = () => {
    resumeGame();
    setPhase('playing');
  };
  
  // Exit handler
  const handleExit = () => {
    resetSession();
    navigate('/games');
  };
  
  // Play again handler
  const handlePlayAgain = () => {
    setGameResult(null);
    handleStartGame(selectedDifficulty);
  };
  
  // Change difficulty handler
  const handleChangeDifficulty = () => {
    setGameResult(null);
    resetSession();
    setPhase('menu');
  };
  
  // Render menu
  if (phase === 'menu') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => navigate('/games')}>
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🎯 Quick Quiz
            </h1>
          </div>
          
          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Test your knowledge of German articles! You'll see a German noun and need to quickly select the correct article (der, die, or das).
            </p>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li>✓ Earn points for correct answers</li>
              <li>✓ Get speed bonuses for fast responses</li>
              <li>✓ Build streaks for extra points</li>
              <li>✓ Don't run out of lives!</li>
            </ul>
          </div>
          
          {/* Category selection */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select Category
          </h2>
          
          <div className="grid grid-cols-4 gap-2 mb-6">
            {/* Random/All option */}
            <button
              onClick={() => setSelectedCategory(null)}
              className={`
                p-3 rounded-xl border-2 text-center transition-all
                ${selectedCategory === null 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'}
              `}
            >
              <div className="text-2xl mb-1">🎲</div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Random</div>
            </button>
            
            {/* Category options */}
            {WORD_CATEGORIES.slice(0, 11).map(category => {
              const info = WordCategoryInfo[category];
              const isSelected = selectedCategory === category;
              
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    p-3 rounded-xl border-2 text-center transition-all
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'}
                  `}
                >
                  <div className="text-2xl mb-1">{info.icon}</div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                    {info.name}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Difficulty selection */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select Difficulty
          </h2>
          
          <div className="space-y-4">
            {(['beginner', 'intermediate', 'advanced'] as GameDifficulty[]).map(difficulty => {
              const config = DIFFICULTY_CONFIG[difficulty];
              const isSelected = selectedDifficulty === difficulty;
              
              return (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  className={`
                    w-full p-4 rounded-xl border-2 text-left transition-all
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`
                          text-lg font-bold
                          ${difficulty === 'beginner' ? 'text-green-600 dark:text-green-400' : ''}
                          ${difficulty === 'intermediate' ? 'text-yellow-600 dark:text-yellow-400' : ''}
                          ${difficulty === 'advanced' ? 'text-red-600 dark:text-red-400' : ''}
                        `}>
                          {config.name}
                        </span>
                        {isSelected && <span className="text-blue-500">✓</span>}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {config.description}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-gray-600 dark:text-gray-400">
                        {config.lives} ❤️
                      </div>
                      <div className="text-gray-500 dark:text-gray-500">
                        {config.scoreMultiplier}x score
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Start button */}
          <Button
            onClick={() => handleStartGame(selectedDifficulty)}
            className="w-full mt-6"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : '🚀 Start Game'}
          </Button>
        </div>
      </div>
    );
  }
  
  // Render paused overlay
  if (phase === 'paused') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center max-w-sm">
          <div className="text-6xl mb-4">⏸️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Game Paused
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Take your time!
          </p>
          <div className="space-y-3">
            <Button onClick={handleResume} className="w-full">
              ▶️ Resume
            </Button>
            <Button variant="outline" onClick={handleExit} className="w-full">
              🚪 Exit Game
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Render game
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Game Header */}
        {session && (
          <GameHeader
            score={session.score}
            lives={session.livesRemaining}
            maxLives={session.maxLives}
            currentQuestion={session.currentQuestionIndex + 1}
            totalQuestions={session.totalQuestions}
            streak={session.currentStreak}
            difficulty={session.difficulty}
            onPause={handlePause}
            onExit={handleExit}
            className="mb-6"
          />
        )}
        
        {/* Timer */}
        {session && (
          <div className="mb-6">
            <TimerBar
              timeRemaining={timeRemaining}
              maxTime={session.config.timePerQuestion}
              isRunning={isTimerRunning}
              onTimeout={handleTimeOut}
              size="lg"
            />
          </div>
        )}
        
        {/* Word Card */}
        {currentWord && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
            {/* Word display */}
            <div className="text-center mb-8">
              <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                {currentWord.word}
              </div>
              <div className="text-lg text-gray-500 dark:text-gray-400">
                {currentWord.translations.en}
              </div>
              {currentWord.translations.vi && (
                <div className="text-sm text-gray-400 dark:text-gray-500">
                  {currentWord.translations.vi}
                </div>
              )}
            </div>
            
            {/* Feedback display */}
            {phase === 'feedback' && lastResult && (
              <div className={`
                text-center py-4 rounded-xl mb-6 animate-fade-in
                ${lastResult.isCorrect 
                  ? 'bg-green-100 dark:bg-green-900/30' 
                  : 'bg-red-100 dark:bg-red-900/30'}
              `}>
                <div className={`text-3xl font-bold ${
                  lastResult.isCorrect 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {lastResult.isCorrect ? '✓ Correct!' : '✗ Wrong!'}
                </div>
                {!lastResult.isCorrect && (
                  <div className="mt-2 text-gray-600 dark:text-gray-400">
                    The correct answer is{' '}
                    <span className={`font-bold ${GenderInfo[lastResult.correctGender].colorClass}`}>
                      {GenderInfo[lastResult.correctGender].article}
                    </span>
                  </div>
                )}
                {lastResult.isCorrect && lastResult.scoreEarned > 0 && (
                  <div className="mt-1 text-green-600 dark:text-green-400 font-medium">
                    +{lastResult.scoreEarned} points
                  </div>
                )}
              </div>
            )}
            
            {/* Article buttons */}
            <ArticleButtonGroup
              onSelect={handleAnswer}
              disabled={phase !== 'playing'}
              selectedGender={selectedAnswer}
              correctGender={phase === 'feedback' ? currentWord.gender : null}
              showFeedback={phase === 'feedback'}
              size="lg"
            />
          </div>
        )}
        
        {/* Loading state */}
        {!currentWord && phase !== 'finished' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="text-xl text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          </div>
        )}
        
        {/* Score popup */}
        <ScorePopup
          score={lastResult?.scoreEarned || 0}
          isVisible={showScorePopup}
          isCorrect={lastResult?.isCorrect || false}
          speedBonus={(lastResult?.responseTime || 0) < (session?.config.speedBonusThreshold || 2) * 1000}
          streakBonus={session && session.currentStreak > 1 ? (session.currentStreak - 1) * 2 : 0}
        />
        
        {/* Result modal */}
        <GameResultModal
          isOpen={phase === 'finished'}
          result={gameResult}
          onPlayAgain={handlePlayAgain}
          onChangeDifficulty={handleChangeDifficulty}
          onExit={handleExit}
        />
      </div>
    </div>
  );
}