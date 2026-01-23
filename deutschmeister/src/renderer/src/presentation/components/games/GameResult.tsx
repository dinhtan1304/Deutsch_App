/**
 * GameResult Component
 * Shows game results summary and allows actions after game ends
 */

import React from 'react';
import { GameResultSummary, GameDifficulty, QuestionResult } from '../../../domain/entities/GameSession';
import { GenderInfo } from '../../../domain/valueObjects/Gender';
import { Button } from '../ui/Button';
import { useFavoritesStore } from '../../stores/favoritesStore';

interface GameResultProps {
  result: GameResultSummary;
  onPlayAgain: () => void;
  onChangeDifficulty: () => void;
  onGoHome: () => void;
  className?: string;
}

export function GameResult({
  result,
  onPlayAgain,
  onChangeDifficulty,
  onGoHome,
  className = ''
}: GameResultProps) {
  const { addFavorite, isFavorite } = useFavoritesStore();

  // Calculate stats
  const totalQuestions = result.correctCount + result.incorrectCount;
  const avgTimeSeconds = result.averageResponseTime / 1000;
  const totalTimeSeconds = result.totalTime / 1000;

  // Determine grade
  const getGrade = () => {
    if (result.accuracy >= 90) return { emoji: '🏆', label: 'Excellent!', color: 'text-yellow-500' };
    if (result.accuracy >= 70) return { emoji: '🌟', label: 'Great!', color: 'text-green-500' };
    if (result.accuracy >= 50) return { emoji: '👍', label: 'Good effort!', color: 'text-blue-500' };
    return { emoji: '💪', label: 'Keep practicing!', color: 'text-orange-500' };
  };

  const grade = getGrade();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-lg mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        {result.isNewHighScore && (
          <div className="mb-4 animate-bounce">
            <span className="text-4xl">🎉</span>
            <div className="text-yellow-500 font-bold text-lg">NEW HIGH SCORE!</div>
          </div>
        )}
        
        <div className="text-6xl mb-2">{grade.emoji}</div>
        <h2 className={`text-2xl font-bold ${grade.color}`}>{grade.label}</h2>
      </div>

      {/* Score */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900 dark:text-white mb-1">
            {result.score}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Score</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatItem
          icon="✅"
          label="Correct"
          value={result.correctCount}
          subtext={`/${totalQuestions}`}
          color="text-green-500"
        />
        <StatItem
          icon="❌"
          label="Wrong"
          value={result.incorrectCount}
          subtext={`/${totalQuestions}`}
          color="text-red-500"
        />
        <StatItem
          icon="🎯"
          label="Accuracy"
          value={`${result.accuracy}%`}
          color="text-blue-500"
        />
        <StatItem
          icon="🔥"
          label="Best Streak"
          value={result.bestStreak}
          color="text-orange-500"
        />
        <StatItem
          icon="⏱️"
          label="Avg Time"
          value={`${avgTimeSeconds.toFixed(1)}s`}
          color="text-purple-500"
        />
        <StatItem
          icon="⏰"
          label="Total Time"
          value={`${totalTimeSeconds.toFixed(0)}s`}
          color="text-gray-500"
        />
      </div>

      {/* Wrong Answers Review */}
      {result.wrongAnswers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Review wrong answers ({result.wrongAnswers.length})
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {result.wrongAnswers.map((wrong, index) => (
              <WrongAnswerItem
                key={index}
                result={wrong}
                onAddToFavorites={() => addFavorite(wrong.wordId)}
                isFavorite={isFavorite(wrong.wordId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          variant="secondary"
          className="w-full"
          onClick={onPlayAgain}
        >
          🔄 Play Again
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={onChangeDifficulty}
          >
            🎮 Change Level
          </Button>
          <Button
            variant="outline"
            onClick={onGoHome}
          >
            🏠 Back to Menu
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Stat item component
 */
interface StatItemProps {
  icon: string;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}

function StatItem({ icon, label, value, subtext, color = 'text-gray-700' }: StatItemProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
      <div className="text-lg mb-1">{icon}</div>
      <div className={`text-xl font-bold ${color} dark:text-white`}>
        {value}
        {subtext && <span className="text-sm text-gray-400">{subtext}</span>}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

/**
 * Wrong answer item component
 */
interface WrongAnswerItemProps {
  result: QuestionResult;
  onAddToFavorites: () => void;
  isFavorite: boolean;
}

function WrongAnswerItem({ result, onAddToFavorites, isFavorite }: WrongAnswerItemProps) {
  const correctInfo = GenderInfo[result.correctGender];
  const selectedInfo = result.selectedGender ? GenderInfo[result.selectedGender] : null;

  return (
    <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={`font-bold ${correctInfo.colorClass}`}>
          {correctInfo.article}
        </span>
        <span className="text-gray-900 dark:text-white font-medium">
          {result.word}
        </span>
        {selectedInfo && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            (you: <span className={selectedInfo.colorClass}>{selectedInfo.article}</span>)
          </span>
        )}
        {!selectedInfo && (
          <span className="text-sm text-gray-500 dark:text-gray-400">(timeout)</span>
        )}
      </div>
      <button
        type="button"
        aria-label={isFavorite ? 'Already in favorites' : 'Add to favorites'}
        onClick={onAddToFavorites}
        className={`text-lg transition-transform hover:scale-110 ${
          isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
        }`}
      >
        {isFavorite ? '⭐' : '☆'}
      </button>
    </div>
  );
}

/**
 * Game Over Overlay - Full screen overlay for game over
 */
interface GameOverOverlayProps {
  result: GameResultSummary;
  onPlayAgain: () => void;
  onExit: () => void;
}

export function GameOverOverlay({ result, onPlayAgain, onExit }: GameOverOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="animate-scale-in">
        <GameResult
          result={result}
          onPlayAgain={onPlayAgain}
          onChangeDifficulty={onExit}
          onGoHome={onExit}
        />
      </div>
    </div>
  );
}

/**
 * Quick Stats Banner - Compact stats for header
 */
interface QuickStatsBannerProps {
  score: number;
  correct: number;
  wrong: number;
  streak: number;
  className?: string;
}

export function QuickStatsBanner({ score, correct, wrong, streak, className = '' }: QuickStatsBannerProps) {
  return (
    <div className={`flex items-center justify-center gap-6 py-2 px-4 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
      <div className="flex items-center gap-1">
        <span>⭐</span>
        <span className="font-bold text-gray-900 dark:text-white">{score}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-green-500">✓</span>
        <span className="font-medium text-green-600 dark:text-green-400">{correct}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-red-500">✗</span>
        <span className="font-medium text-red-600 dark:text-red-400">{wrong}</span>
      </div>
      {streak > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-orange-500">🔥</span>
          <span className="font-bold text-orange-600 dark:text-orange-400">{streak}</span>
        </div>
      )}
    </div>
  );
}