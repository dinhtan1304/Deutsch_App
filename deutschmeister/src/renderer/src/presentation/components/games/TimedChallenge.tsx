/**
 * TimedChallenge Components
 * Components for Timed Challenge game mode
 */

import React from 'react';

/**
 * Big countdown timer display
 */
export interface CountdownTimerProps {
  timeLeft: number; // in seconds
  maxTime: number;
}

export function CountdownTimer({ timeLeft, maxTime }: CountdownTimerProps) {
  const percentage = (timeLeft / maxTime) * 100;
  const isLow = timeLeft <= 10;
  const isCritical = timeLeft <= 5;
  
  return (
    <div className="text-center">
      {/* Circular timer */}
      <div className="relative w-32 h-32 mx-auto mb-2">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="64"
            cy="64"
            r="58"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="64"
            cy="64"
            r="58"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 58}`}
            strokeDashoffset={`${2 * Math.PI * 58 * (1 - percentage / 100)}`}
            className={`
              transition-all duration-200
              ${isCritical ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-blue-500'}
            `}
          />
        </svg>
        {/* Time display */}
        <div className={`
          absolute inset-0 flex items-center justify-center
          text-4xl font-bold
          ${isCritical ? 'text-red-500 animate-pulse' : isLow ? 'text-orange-500' : 'text-gray-900 dark:text-white'}
        `}>
          {timeLeft}
        </div>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        seconds left
      </div>
    </div>
  );
}

/**
 * Combo display
 */
export interface ComboDisplayProps {
  combo: number;
  maxCombo: number;
}

export function ComboDisplay({ combo, maxCombo }: ComboDisplayProps) {
  if (combo < 2) return null;
  
  const comboLevel = Math.min(combo, maxCombo);
  
  return (
    <div className={`
      inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg
      animate-pulse
      ${comboLevel >= 4 ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : ''}
      ${comboLevel === 3 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : ''}
      ${comboLevel === 2 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' : ''}
    `}>
      <span className="text-2xl">🔥</span>
      <span>x{comboLevel} COMBO!</span>
    </div>
  );
}

/**
 * Live score display with animation
 */
export interface LiveScoreProps {
  score: number;
  lastPoints?: number;
}

export function LiveScore({ score, lastPoints }: LiveScoreProps) {
  return (
    <div className="text-center relative">
      <div className="text-5xl font-bold text-gray-900 dark:text-white">
        {score.toLocaleString()}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">points</div>
      
      {/* Floating points animation */}
      {lastPoints && lastPoints > 0 && (
        <div 
          key={score} 
          className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-green-500 font-bold text-lg animate-bounce"
        >
          +{lastPoints}
        </div>
      )}
    </div>
  );
}

/**
 * Quick stats during game
 */
export interface QuickStatsProps {
  correct: number;
  wrong: number;
  combo: number;
}

export function QuickStats({ correct, wrong, combo }: QuickStatsProps) {
  return (
    <div className="flex justify-center gap-6 text-sm">
      <div className="text-green-600 dark:text-green-400">
        ✓ {correct}
      </div>
      <div className="text-red-600 dark:text-red-400">
        ✗ {wrong}
      </div>
      <div className="text-orange-600 dark:text-orange-400">
        🔥 {combo}
      </div>
    </div>
  );
}

/**
 * Timed Challenge Result
 */
export interface TimedResultProps {
  score: number;
  correct: number;
  wrong: number;
  bestCombo: number;
  isNewBest: boolean;
  onPlayAgain: () => void;
  onChangeSettings: () => void;
  onExit: () => void;
}

export function TimedResult({
  score,
  correct,
  wrong,
  bestCombo,
  isNewBest,
  onPlayAgain,
  onChangeSettings,
  onExit
}: TimedResultProps) {
  const total = correct + wrong;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
      {/* New best badge */}
      {isNewBest && (
        <div className="mb-4">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full font-bold animate-pulse">
            🏆 NEW BEST SCORE!
          </span>
        </div>
      )}
      
      {/* Score */}
      <div className="text-6xl mb-2">⚡</div>
      <div className="text-5xl font-bold text-gray-900 dark:text-white mb-1">
        {score.toLocaleString()}
      </div>
      <div className="text-gray-500 dark:text-gray-400 mb-6">points</div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
          <div className="text-xl font-bold text-green-600 dark:text-green-400">
            {correct}
          </div>
          <div className="text-xs text-green-700 dark:text-green-400">Correct</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
          <div className="text-xl font-bold text-red-600 dark:text-red-400">
            {wrong}
          </div>
          <div className="text-xs text-red-700 dark:text-red-400">Wrong</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
          <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
            x{bestCombo}
          </div>
          <div className="text-xs text-orange-700 dark:text-orange-400">Best Combo</div>
        </div>
      </div>
      
      {/* Accuracy & answers per minute */}
      <div className="flex justify-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-6">
        <span>Accuracy: <strong>{accuracy}%</strong></span>
        <span>Speed: <strong>{total}/min</strong></span>
      </div>
      
      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onPlayAgain}
          className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
        >
          ⚡ Play Again
        </button>
        <button
          onClick={onChangeSettings}
          className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
        >
          ⚙️ Change Settings
        </button>
        <button
          onClick={onExit}
          className="w-full py-3 px-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
        >
          ← Back to Games
        </button>
      </div>
    </div>
  );
}