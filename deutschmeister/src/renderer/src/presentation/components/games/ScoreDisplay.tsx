/**
 * ScoreDisplay Component
 * Display score, lives, and progress in games
 */

import React from 'react';

interface ScoreDisplayProps {
  score: number;
  className?: string;
}

export function ScoreDisplay({ score, className = '' }: ScoreDisplayProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-2xl">🏆</span>
      <span className="text-2xl font-bold text-gray-900 dark:text-white">
        {score.toLocaleString()}
      </span>
    </div>
  );
}

/**
 * LivesDisplay - Show remaining lives
 */
interface LivesDisplayProps {
  lives: number;
  maxLives: number;
  className?: string;
}

export function LivesDisplay({ lives, maxLives, className = '' }: LivesDisplayProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: maxLives }).map((_, i) => (
        <span
          key={i}
          className={`text-xl transition-all duration-300 ${
            i < lives 
              ? 'opacity-100 scale-100' 
              : 'opacity-30 scale-75 grayscale'
          }`}
        >
          ❤️
        </span>
      ))}
    </div>
  );
}

/**
 * ProgressDisplay - Show question progress
 */
interface ProgressDisplayProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressDisplay({ current, total, className = '' }: ProgressDisplayProps) {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className={`${className}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {current} / {total}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * GameHeader - Combined header with all game info
 */
interface GameHeaderProps {
  score: number;
  lives: number;
  maxLives: number;
  currentQuestion: number;
  totalQuestions: number;
  streak?: number;
  difficulty?: string;
  onPause?: () => void;
  onExit?: () => void;
  className?: string;
}

export function GameHeader({
  score,
  lives,
  maxLives,
  currentQuestion,
  totalQuestions,
  streak = 0,
  difficulty,
  onPause,
  onExit,
  className = ''
}: GameHeaderProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 ${className}`}>
      {/* Top row: Score, Lives, Controls */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-6">
          <ScoreDisplay score={score} />
          <LivesDisplay lives={lives} maxLives={maxLives} />
          {streak > 1 && (
            <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
              <span className="text-lg">🔥</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">{streak}x</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {difficulty && (
            <span className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
              ${difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
              ${difficulty === 'advanced' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
            `}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          )}
          
          {onPause && (
            <button
              onClick={onPause}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Pause"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          
          {onExit && (
            <button
              onClick={onExit}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Exit"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Bottom row: Progress */}
      <ProgressDisplay current={currentQuestion} total={totalQuestions} />
    </div>
  );
}

/**
 * ScorePopup - Animated score popup when earning points
 */
interface ScorePopupProps {
  score: number;
  isVisible: boolean;
  isCorrect: boolean;
  speedBonus?: boolean;
  streakBonus?: number;
}

export function ScorePopup({ 
  score, 
  isVisible, 
  isCorrect, 
  speedBonus = false,
  streakBonus = 0 
}: ScorePopupProps) {
  if (!isVisible) return null;
  
  return (
    <div className={`
      fixed inset-0 pointer-events-none flex items-center justify-center z-50
      animate-fade-in
    `}>
      <div className={`
        text-4xl font-bold
        ${isCorrect ? 'text-green-500' : 'text-red-500'}
        animate-bounce
      `}>
        {isCorrect ? (
          <div className="flex flex-col items-center gap-1">
            <span>+{score}</span>
            {speedBonus && (
              <span className="text-xl text-yellow-500">⚡ Speed bonus!</span>
            )}
            {streakBonus > 0 && (
              <span className="text-xl text-orange-500">🔥 Streak +{streakBonus}!</span>
            )}
          </div>
        ) : (
          <span>✗</span>
        )}
      </div>
    </div>
  );
}
