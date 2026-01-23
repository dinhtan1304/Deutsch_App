/**
 * GameResultModal Component
 * Show game results at the end of a session
 */

import React, { useState } from 'react';
import { GameResultSummary, QuestionResult, DIFFICULTY_CONFIG } from '../../../domain/entities/GameSession';
import { GenderInfo } from '../../../domain/valueObjects/Gender';
import { Button } from '../ui/Button';
import { useFavoritesStore } from '../../stores/favoritesStore';

interface GameResultModalProps {
  isOpen: boolean;
  result: GameResultSummary | null;
  onPlayAgain: () => void;
  onChangeDifficulty: () => void;
  onExit: () => void;
}

export function GameResultModal({
  isOpen,
  result,
  onPlayAgain,
  onChangeDifficulty,
  onExit
}: GameResultModalProps) {
  const [showWrongAnswers, setShowWrongAnswers] = useState(false);
  const { addFavorite, isFavorite } = useFavoritesStore();
  
  if (!isOpen || !result) return null;
  
  const config = DIFFICULTY_CONFIG[result.difficulty];
  
  // Calculate grade
  const getGrade = () => {
    if (result.accuracy >= 95) return { grade: 'S', color: 'text-yellow-500', emoji: '🏆' };
    if (result.accuracy >= 85) return { grade: 'A', color: 'text-green-500', emoji: '🌟' };
    if (result.accuracy >= 70) return { grade: 'B', color: 'text-blue-500', emoji: '👍' };
    if (result.accuracy >= 50) return { grade: 'C', color: 'text-orange-500', emoji: '📚' };
    return { grade: 'D', color: 'text-red-500', emoji: '💪' };
  };
  
  const gradeInfo = getGrade();
  
  // Format time
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 
      ? `${minutes}m ${remainingSeconds}s` 
      : `${(ms / 1000).toFixed(1)}s`;
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white text-center">
          <div className="text-6xl mb-2">{gradeInfo.emoji}</div>
          <h2 className="text-2xl font-bold mb-1">
            {result.isNewHighScore ? '🎉 New High Score!' : 'Game Complete!'}
          </h2>
          <div className={`text-5xl font-bold ${gradeInfo.color} bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto`}>
            {gradeInfo.grade}
          </div>
        </div>
        
        {/* Stats */}
        <div className="p-6">
          {/* Score */}
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              {result.score.toLocaleString()}
            </div>
            <div className="text-gray-500 dark:text-gray-400">points</div>
          </div>
          
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatBox 
              label="Correct" 
              value={result.correctCount.toString()} 
              icon="✓"
              color="green"
            />
            <StatBox 
              label="Wrong" 
              value={result.incorrectCount.toString()} 
              icon="✗"
              color="red"
            />
            <StatBox 
              label="Accuracy" 
              value={`${result.accuracy}%`} 
              icon="🎯"
              color="blue"
            />
            <StatBox 
              label="Best Streak" 
              value={result.bestStreak.toString()} 
              icon="🔥"
              color="orange"
            />
            <StatBox 
              label="Avg Time" 
              value={formatTime(result.averageResponseTime)} 
              icon="⏱️"
              color="purple"
            />
            <StatBox 
              label="Total Time" 
              value={formatTime(result.totalTime)} 
              icon="⏰"
              color="gray"
            />
          </div>
          
          {/* Difficulty badge */}
          <div className="text-center mb-4">
            <span className={`
              px-4 py-1 rounded-full text-sm font-medium
              ${result.difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
              ${result.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
              ${result.difficulty === 'advanced' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
            `}>
              {config.name} Mode
            </span>
          </div>
          
          {/* Wrong answers section */}
          {result.wrongAnswers.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowWrongAnswers(!showWrongAnswers)}
                className="w-full flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <span className="font-medium text-red-700 dark:text-red-400">
                  Review Wrong Answers ({result.wrongAnswers.length})
                </span>
                <svg 
                  className={`w-5 h-5 text-red-600 transform transition-transform ${showWrongAnswers ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showWrongAnswers && (
                <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                  {result.wrongAnswers.map((answer, index) => (
                    <WrongAnswerItem 
                      key={index} 
                      answer={answer}
                      onAddToFavorites={() => addFavorite(answer.wordId)}
                      isFavorite={isFavorite(answer.wordId)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button onClick={onPlayAgain} className="w-full">
              🔄 Play Again
            </Button>
            <Button variant="outline" onClick={onChangeDifficulty} className="w-full">
              ⚙️ Change Difficulty
            </Button>
            <Button variant="ghost" onClick={onExit} className="w-full">
              ← Back to Menu
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * StatBox - Individual stat display
 */
interface StatBoxProps {
  label: string;
  value: string;
  icon: string;
  color: 'green' | 'red' | 'blue' | 'orange' | 'purple' | 'gray';
}

function StatBox({ label, value, icon, color }: StatBoxProps) {
  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    gray: 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'
  };
  
  return (
    <div className={`${colorClasses[color]} rounded-lg p-3 text-center`}>
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs opacity-75">{label}</div>
    </div>
  );
}

/**
 * WrongAnswerItem - Display a wrong answer for review
 */
interface WrongAnswerItemProps {
  answer: QuestionResult;
  onAddToFavorites: () => void;
  isFavorite: boolean;
}

function WrongAnswerItem({ answer, onAddToFavorites, isFavorite }: WrongAnswerItemProps) {
  const correctInfo = GenderInfo[answer.correctGender];
  const selectedInfo = answer.selectedGender ? GenderInfo[answer.selectedGender] : null;
  
  return (
    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-bold ${correctInfo.colorClass}`}>
            {correctInfo.article}
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {answer.word}
          </span>
        </div>
        {selectedInfo && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            You answered: <span className={`font-medium ${selectedInfo.colorClass}`}>{selectedInfo.article}</span>
          </div>
        )}
        {!selectedInfo && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            ⏰ Time out
          </div>
        )}
      </div>
      
      <button
        onClick={onAddToFavorites}
        className={`p-2 rounded-lg transition-colors ${
          isFavorite 
            ? 'text-yellow-500' 
            : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
        }`}
        title={isFavorite ? 'In favorites' : 'Add to favorites'}
      >
        {isFavorite ? '⭐' : '☆'}
      </button>
    </div>
  );
}
