/**
 * FillBlankPage
 * UC-2.2.03: Fill-in-the-Blank - Context-based article learning
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Word } from '../../../domain/entities/Word';
import { Gender } from '../../../domain/valueObjects/Gender';
import { WordCategory, WORD_CATEGORIES, WordCategoryInfo } from '../../../domain/valueObjects/WordCategory';
import { WordRepository } from '../../../infrastructure/repositories/WordRepository';
import { useHistoryStore } from '../../stores/historyStore';
import { 
  SentenceDisplay, 
  ArticleChoice, 
  CorrectionDisplay,
  FillBlankHeader 
} from '../../components/games/FillBlank';
import { Button } from '../../components/ui/Button';

// Game phases
type GamePhase = 'menu' | 'playing' | 'feedback' | 'finished';

// Question with word
interface Question {
  word: Word;
  answered: boolean;
  correct: boolean;
  selectedArticle: Gender | null;
}

// Result summary
interface GameResult {
  total: number;
  correct: number;
  incorrect: number;
  score: number;
  bestStreak: number;
  wrongAnswers: Question[];
}

export function FillBlankPage() {
  const navigate = useNavigate();
  const { addToHistory } = useHistoryStore();
  
  // Settings
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(10);
  
  // Game state
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<Gender | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  
  // Current question
  const currentQuestion = questions[currentIndex];
  
  // Start game
  const startGame = async () => {
    setIsLoading(true);
    
    try {
      const repo = new WordRepository();
      const words = await repo.getRandom(questionCount * 2, {
        category: selectedCategory || undefined
      });
      
      // Filter words that have examples (sentences)
      const wordsWithExamples = words.filter(w => w.examples.length > 0);
      const selectedWords = wordsWithExamples.length >= questionCount 
        ? wordsWithExamples.slice(0, questionCount)
        : words.slice(0, questionCount);
      
      if (selectedWords.length === 0) {
        alert('No words available');
        setIsLoading(false);
        return;
      }
      
      const newQuestions: Question[] = selectedWords.map(word => ({
        word,
        answered: false,
        correct: false,
        selectedArticle: null
      }));
      
      setQuestions(newQuestions);
      setCurrentIndex(0);
      setSelectedArticle(null);
      setScore(0);
      setStreak(0);
      setBestStreak(0);
      setResult(null);
      setPhase('playing');
    } catch (error) {
      console.error('Failed to start game:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle article selection
  const handleSelect = useCallback((gender: Gender) => {
    if (phase !== 'playing' || !currentQuestion) return;
    
    setSelectedArticle(gender);
    
    const isCorrect = gender === currentQuestion.word.gender;
    
    // Update question
    const updatedQuestions = [...questions];
    updatedQuestions[currentIndex] = {
      ...currentQuestion,
      answered: true,
      correct: isCorrect,
      selectedArticle: gender
    };
    setQuestions(updatedQuestions);
    
    // Update score and streak
    if (isCorrect) {
      const basePoints = 10;
      const streakBonus = Math.min(streak, 5) * 2;
      setScore(prev => prev + basePoints + streakBonus);
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak > bestStreak) setBestStreak(newStreak);
        return newStreak;
      });
    } else {
      setStreak(0);
    }
    
    // Add to history
    addToHistory(currentQuestion.word.id);
    
    // Show feedback
    setPhase('feedback');
    
    // Auto advance after delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedArticle(null);
        setPhase('playing');
      } else {
        // Game finished
        const wrongAnswers = updatedQuestions.filter(q => !q.correct);
        setResult({
          total: updatedQuestions.length,
          correct: updatedQuestions.filter(q => q.correct).length,
          incorrect: wrongAnswers.length,
          score: score + (isCorrect ? 10 + Math.min(streak, 5) * 2 : 0),
          bestStreak: Math.max(bestStreak, isCorrect ? streak + 1 : bestStreak),
          wrongAnswers
        });
        setPhase('finished');
      }
    }, isCorrect ? 800 : 1500);
  }, [phase, currentQuestion, currentIndex, questions, score, streak, bestStreak, addToHistory]);
  
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
              ✏️ Fill in the Blank
            </h1>
          </div>
          
          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Complete sentences by choosing the correct article! Learn German articles in context.
            </p>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li>✓ See words in real sentences</li>
              <li>✓ Choose der, die, or das</li>
              <li>✓ Build streaks for bonus points</li>
              <li>✓ Learn through context</li>
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
          
          {/* Question count */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Number of Questions
          </h2>
          
          <div className="flex gap-3 mb-8">
            {[5, 10, 15, 20].map(count => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                className={`
                  flex-1 py-3 rounded-xl border-2 font-medium transition-all
                  ${questionCount === count 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}
                `}
              >
                {count}
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
            {isLoading ? 'Loading...' : '✏️ Start Game'}
          </Button>
        </div>
      </div>
    );
  }
  
  // Render playing/feedback phase
  if ((phase === 'playing' || phase === 'feedback') && currentQuestion) {
    const showResult = phase === 'feedback';
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setPhase('menu')}>
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Exit
          </Button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            ✏️ Fill in the Blank
          </h1>
          <div className="w-16" />
        </div>
        
        {/* Progress */}
        <FillBlankHeader
          current={currentIndex + 1}
          total={questions.length}
          score={score}
          streak={streak}
        />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 py-8">
          {/* Word info */}
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">
              {currentQuestion.word.translations.en}
            </div>
          </div>
          
          {/* Sentence */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg max-w-2xl w-full">
            <SentenceDisplay
              sentence={currentQuestion.word.examples[0] || ''}
              word={currentQuestion.word.word}
              selectedArticle={selectedArticle}
              correctArticle={currentQuestion.word.gender}
              showResult={showResult}
            />
          </div>
          
          {/* Feedback for wrong answer */}
          {showResult && !currentQuestion.correct && (
            <CorrectionDisplay
              word={currentQuestion.word.word}
              translation={currentQuestion.word.translations.en}
              correctArticle={currentQuestion.word.gender}
              selectedArticle={selectedArticle}
            />
          )}
          
          {/* Success feedback */}
          {showResult && currentQuestion.correct && (
            <div className="text-4xl animate-bounce">✅</div>
          )}
          
          {/* Article choices */}
          <ArticleChoice
            onSelect={handleSelect}
            selectedArticle={selectedArticle}
            correctArticle={currentQuestion.word.gender}
            showResult={showResult}
            disabled={showResult}
          />
        </div>
      </div>
    );
  }
  
  // Render finished
  if (phase === 'finished' && result) {
    const accuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
    
    const getGrade = () => {
      if (accuracy >= 90) return { emoji: '🏆', text: 'Excellent!', color: 'text-yellow-500' };
      if (accuracy >= 70) return { emoji: '🌟', text: 'Great job!', color: 'text-green-500' };
      if (accuracy >= 50) return { emoji: '👍', text: 'Good effort!', color: 'text-blue-500' };
      return { emoji: '💪', text: 'Keep practicing!', color: 'text-orange-500' };
    };
    
    const grade = getGrade();
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
          {/* Grade */}
          <div className="text-6xl mb-4">{grade.emoji}</div>
          <h2 className={`text-2xl font-bold mb-2 ${grade.color}`}>{grade.text}</h2>
          
          {/* Score */}
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
            {result.score}
          </div>
          <div className="text-gray-500 dark:text-gray-400 mb-6">points</div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {result.correct}
              </div>
              <div className="text-xs text-green-700 dark:text-green-400">Correct</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
              <div className="text-xl font-bold text-red-600 dark:text-red-400">
                {result.incorrect}
              </div>
              <div className="text-xs text-red-700 dark:text-red-400">Wrong</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
              <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {result.bestStreak}
              </div>
              <div className="text-xs text-orange-700 dark:text-orange-400">Best Streak</div>
            </div>
          </div>
          
          {/* Accuracy */}
          <div className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Accuracy: <span className="font-bold text-gray-900 dark:text-white">{accuracy}%</span>
          </div>
          
          {/* Actions */}
          <div className="space-y-3">
            <Button onClick={startGame} className="w-full">
              🔄 Play Again
            </Button>
            <Button variant="outline" onClick={() => setPhase('menu')} className="w-full">
              ⚙️ Change Settings
            </Button>
            <Button variant="ghost" onClick={() => navigate('/games')} className="w-full">
              ← Back to Games
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}