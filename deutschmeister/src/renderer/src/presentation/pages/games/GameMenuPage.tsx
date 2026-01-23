/**
 * GameMenuPage
 * Main menu for selecting games in the Der/Die/Das module
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore, useGameStats, DailyChallenge } from '../../stores/gameStore';
import { DIFFICULTY_CONFIG, GameDifficulty, GameType } from '../../../domain/entities/GameSession';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface GameInfo {
  type: GameType;
  name: string;
  description: string;
  icon: string;
  route: string;
  available: boolean;
  comingSoon?: boolean;
}

const GAMES: GameInfo[] = [
  {
    type: 'quick-quiz',
    name: 'Quick Quiz',
    description: 'Rapid-fire article identification. Select der, die, or das before time runs out!',
    icon: '🎯',
    route: '/games/quick-quiz',
    available: true
  },
  {
    type: 'flashcard',
    name: 'Flashcard Review',
    description: 'Learn with spaced repetition. Flip cards and rate your knowledge.',
    icon: '📇',
    route: '/games/flashcard',
    available: true
  },
  {
    type: 'fill-blank',
    name: 'Fill in the Blank',
    description: 'Complete sentences with the correct article. Context-based learning.',
    icon: '✏️',
    route: '/games/fill-blank',
    available: true
  },
  {
    type: 'timed-challenge',
    name: 'Timed Challenge',
    description: '60-second sprint! Score as many correct answers as possible.',
    icon: '⚡',
    route: '/games/timed-challenge',
    available: true
  }
];

export function GameMenuPage() {
  const navigate = useNavigate();
  const stats = useGameStats();
  const { initDailyChallenge, getHighScores } = useGameStore();
  
  // Use state for daily challenge - initialized in useEffect to avoid render-time side effects
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  
  useEffect(() => {
    // Initialize daily challenge on mount only
    const challenge = initDailyChallenge();
    setDailyChallenge(challenge);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🎮 Article Games
            </h1>
          </div>
          
          <Button variant="outline" onClick={() => navigate('/words')}>
            📚 Dictionary
          </Button>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Games Played"
            value={stats.totalGamesPlayed.toString()}
            icon="🎮"
          />
          <StatCard
            label="Correct Answers"
            value={stats.totalCorrectAnswers.toString()}
            icon="✓"
          />
          <StatCard
            label="Overall Accuracy"
            value={`${stats.accuracy}%`}
            icon="🎯"
          />
          <StatCard
            label="Words Practiced"
            value={(stats.totalCorrectAnswers + stats.totalIncorrectAnswers).toString()}
            icon="📚"
          />
        </div>
        
        {/* Daily Challenge */}
        {dailyChallenge && (
          <Card className="mb-8 border-2 border-yellow-400 dark:border-yellow-600" padding="none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🏆</span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Daily Challenge
                    </h3>
                    {dailyChallenge.completed && (
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium">
                        Completed!
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    Score {dailyChallenge.targetScore} points in {DIFFICULTY_CONFIG[dailyChallenge.difficulty].name} mode
                  </p>
                  {dailyChallenge.bestScore > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Your best: <span className="font-bold text-blue-600 dark:text-blue-400">{dailyChallenge.bestScore}</span> points
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => navigate(`/games/quick-quiz?difficulty=${dailyChallenge.difficulty}`)}
                  className={dailyChallenge.completed ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {dailyChallenge.completed ? '🎉 Play Again' : '🚀 Accept Challenge'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Games Grid */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Choose a Game
        </h2>
        
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {GAMES.map(game => (
            <GameCard
              key={game.type}
              game={game}
              highScores={getHighScores(game.type, 'beginner')}
              onClick={() => game.available && navigate(game.route)}
            />
          ))}
        </div>
        
        {/* High Scores */}
        <Card padding="none">
          <CardHeader className="px-6 pt-6">
            <CardTitle>🏅 High Scores - Quick Quiz</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid md:grid-cols-3 gap-4">
              {(['beginner', 'intermediate', 'advanced'] as GameDifficulty[]).map(difficulty => {
                const scores = getHighScores('quick-quiz', difficulty);
                const config = DIFFICULTY_CONFIG[difficulty];
                
                return (
                  <div key={difficulty}>
                    <h4 className={`
                      text-sm font-semibold mb-2
                      ${difficulty === 'beginner' ? 'text-green-600 dark:text-green-400' : ''}
                      ${difficulty === 'intermediate' ? 'text-yellow-600 dark:text-yellow-400' : ''}
                      ${difficulty === 'advanced' ? 'text-red-600 dark:text-red-400' : ''}
                    `}>
                      {config.name}
                    </h4>
                    {scores.length > 0 ? (
                      <ol className="space-y-1">
                        {scores.slice(0, 5).map((score, index) => (
                          <li key={score.id} className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {index + 1}. {score.score.toLocaleString()} pts
                            </span>
                            <span className="text-gray-400 dark:text-gray-500">
                              {score.accuracy}%
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        No scores yet
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * StatCard Component
 */
interface StatCardProps {
  label: string;
  value: string;
  icon: string;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

/**
 * GameCard Component
 */
interface GameCardProps {
  game: GameInfo;
  highScores: { score: number }[];
  onClick: () => void;
}

function GameCard({ game, highScores, onClick }: GameCardProps) {
  const bestScore = highScores.length > 0 ? highScores[0].score : null;
  
  return (
    <button
      onClick={onClick}
      disabled={!game.available}
      className={`
        w-full text-left p-6 rounded-xl border-2 transition-all
        ${game.available 
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:shadow-lg cursor-pointer' 
          : 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'}
      `}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl">{game.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {game.name}
            </h3>
            {game.comingSoon && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                Coming Soon
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {game.description}
          </p>
          {game.available && bestScore !== null && (
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              🏆 Best: {bestScore.toLocaleString()} pts
            </div>
          )}
        </div>
        {game.available && (
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </button>
  );
}