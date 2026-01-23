/**
 * TimedChallengePage
 * UC-2.2.04: Timed Challenge - 60 second sprint mode
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Word } from '../../../domain/entities/Word';
import { Gender, GenderInfo } from '../../../domain/valueObjects/Gender';
import { WordCategory, WORD_CATEGORIES, WordCategoryInfo } from '../../../domain/valueObjects/WordCategory';
import { WordRepository } from '../../../infrastructure/repositories/WordRepository';
import { useHistoryStore } from '../../stores/historyStore';
import { 
  CountdownTimer, 
  ComboDisplay, 
  LiveScore, 
  QuickStats,
  TimedResult 
} from '../../components/games/TimedChallenge';
import { ArticleButtonGroup } from '../../components/games/ArticleButton';
import { Button } from '../../components/ui/Button';

// Game phases
type GamePhase = 'menu' | 'countdown' | 'playing' | 'finished';

// Game duration options
const DURATION_OPTIONS = [30, 60, 90, 120];
const MAX_COMBO = 4;

export function TimedChallengePage() {
  const navigate = useNavigate();
  const { addToHistory } = useHistoryStore();
  
  // Settings
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | null>(null);
  const [duration, setDuration] = useState<number>(60);
  
  // Game state
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [score, setScore] = useState(0);
  const [lastPoints, setLastPoints] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [countdownValue, setCountdownValue] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  // Current word
  const currentWord = words[currentIndex];
  
  // Load best score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('timed-challenge-best');
    if (saved) {
      setBestScore(parseInt(saved, 10));
    }
  }, []);
  
  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);
  
  // Start countdown then game
  const startGame = async () => {
    setIsLoading(true);
    
    try {
      const repo = new WordRepository();
      // Load extra words for continuous play
      const loadedWords = await repo.getRandom(200, {
        category: selectedCategory || undefined
      });
      
      if (loadedWords.length === 0) {
        alert('No words available');
        setIsLoading(false);
        return;
      }
      
      setWords(loadedWords);
      setCurrentIndex(0);
      setTimeLeft(duration);
      setScore(0);
      setLastPoints(0);
      setCorrect(0);
      setWrong(0);
      setCombo(0);
      setBestCombo(0);
      setCountdownValue(3);
      setPhase('countdown');
      
      // Countdown 3-2-1
      countdownRef.current = setInterval(() => {
        setCountdownValue(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            setPhase('playing');
            startTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start game:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start game timer
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Handle answer
  const handleAnswer = useCallback((selectedGender: Gender) => {
    if (phase !== 'playing' || !currentWord) return;
    
    const isCorrect = selectedGender === currentWord.gender;
    
    if (isCorrect) {
      // Calculate points with combo multiplier
      const comboMultiplier = Math.min(combo + 1, MAX_COMBO);
      const points = 10 * comboMultiplier;
      
      setScore(prev => prev + points);
      setLastPoints(points);
      setCorrect(prev => prev + 1);
      setCombo(prev => {
        const newCombo = prev + 1;
        if (newCombo > bestCombo) setBestCombo(newCombo);
        return newCombo;
      });
    } else {
      setWrong(prev => prev + 1);
      setCombo(0);
      setLastPoints(0);
    }
    
    // Add to history
    addToHistory(currentWord.id);
    
    // Next word (loop if needed)
    setCurrentIndex(prev => {
      if (prev >= words.length - 1) {
        return 0; // Loop back
      }
      return prev + 1;
    });
  }, [phase, currentWord, combo, bestCombo, words.length, addToHistory]);
  
  // Save best score when game ends
  useEffect(() => {
    if (phase === 'finished' && score > bestScore) {
      setBestScore(score);
      localStorage.setItem('timed-challenge-best', score.toString());
    }
  }, [phase, score, bestScore]);
  
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
              ⚡ Timed Challenge
            </h1>
          </div>
          
          {/* Best score */}
          {bestScore > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6 text-center">
              <div className="text-sm text-yellow-600 dark:text-yellow-400">🏆 Your Best</div>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {bestScore.toLocaleString()} pts
              </div>
            </div>
          )}
          
          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Race against the clock! Answer as many questions as possible before time runs out.
            </p>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li>✓ No lives - keep going even after mistakes</li>
              <li>✓ Build combos for score multipliers (up to x4)</li>
              <li>✓ Every correct answer = 10 × combo points</li>
              <li>✓ Beat your best score!</li>
            </ul>
          </div>
          
          {/* Category selection */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select Category
          </h2>
          
          <div className="grid grid-cols-4 gap-2 mb-6">
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
          
          {/* Duration selection */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Time Limit
          </h2>
          
          <div className="flex gap-3 mb-8">
            {DURATION_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`
                  flex-1 py-3 rounded-xl border-2 font-medium transition-all
                  ${duration === d 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}
                `}
              >
                {d}s
              </button>
            ))}
          </div>
          
          {/* Start button */}
          <Button
            onClick={startGame}
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : '⚡ Start Challenge'}
          </Button>
        </div>
      </div>
    );
  }
  
  // Render countdown
  if (phase === 'countdown') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl font-bold text-blue-500 animate-pulse mb-4">
            {countdownValue}
          </div>
          <div className="text-xl text-gray-500 dark:text-gray-400">
            Get Ready!
          </div>
        </div>
      </div>
    );
  }
  
  // Render playing
  if (phase === 'playing' && currentWord) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex flex-col">
        {/* Header with timer */}
        <div className="flex items-start justify-between mb-4">
          <Button variant="ghost" onClick={() => {
            if (timerRef.current) clearInterval(timerRef.current);
            setPhase('menu');
          }}>
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Exit
          </Button>
          
          <CountdownTimer timeLeft={timeLeft} maxTime={duration} />
          
          <LiveScore score={score} lastPoints={lastPoints} />
        </div>
        
        {/* Combo display */}
        <div className="h-12 flex items-center justify-center mb-4">
          <ComboDisplay combo={combo} maxCombo={MAX_COMBO} />
        </div>
        
        {/* Quick stats */}
        <QuickStats correct={correct} wrong={wrong} combo={combo} />
        
        {/* Word display */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 dark:text-white mb-3">
              {currentWord.word}
            </div>
            <div className="text-xl text-gray-500 dark:text-gray-400">
              {currentWord.translations.en}
            </div>
          </div>
          
          {/* Article buttons */}
          <div className="w-full max-w-md">
            <ArticleButtonGroup
              onSelect={handleAnswer}
              selectedGender={null}
              correctGender={null}
              showFeedback={false}
              disabled={false}
              size="lg"
            />
          </div>
        </div>
      </div>
    );
  }
  
  // Render finished
  if (phase === 'finished') {
    const isNewBest = score >= bestScore && score > 0;
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <TimedResult
          score={score}
          correct={correct}
          wrong={wrong}
          bestCombo={bestCombo}
          isNewBest={isNewBest}
          onPlayAgain={startGame}
          onChangeSettings={() => setPhase('menu')}
          onExit={() => navigate('/games')}
        />
      </div>
    );
  }
  
  return null;
}