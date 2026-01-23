/**
 * FlashcardPage
 * UC-2.2.02: Flashcard Review Mode with Spaced Repetition
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Word } from '../../../domain/entities/Word';
import { WordCategory, WORD_CATEGORIES, WordCategoryInfo } from '../../../domain/valueObjects/WordCategory';
import { WordRepository } from '../../../infrastructure/repositories/WordRepository';
import { useHistoryStore } from '../../stores/historyStore';
import { 
  FlashCard, 
  SRSRatingButtons, 
  SRSRating, 
  FlashcardProgress,
  FlashcardResult 
} from '../../components/games/FlashCard';
import { Button } from '../../components/ui/Button';

// Session phases
type FlashcardPhase = 'menu' | 'studying' | 'finished';

// Card with rating tracking
interface StudyCard {
  word: Word;
  rating?: SRSRating;
  reviewed: boolean;
}

export function FlashcardPage() {
  const navigate = useNavigate();
  const { addToHistory } = useHistoryStore();
  
  // State
  const [phase, setPhase] = useState<FlashcardPhase>('menu');
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | null>(null);
  const [cardCount, setCardCount] = useState<number>(10);
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ratings, setRatings] = useState<Record<SRSRating, number>>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0
  });
  
  // Current card
  const currentCard = cards[currentIndex];
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (phase !== 'studying') return;
      
      // Space to flip
      if (e.code === 'Space' && !isFlipped) {
        e.preventDefault();
        setIsFlipped(true);
        return;
      }
      
      // Number keys for rating (only when flipped)
      if (isFlipped && currentCard) {
        switch (e.key) {
          case '1':
            handleRate('again');
            break;
          case '2':
            handleRate('hard');
            break;
          case '3':
            handleRate('good');
            break;
          case '4':
            handleRate('easy');
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [phase, isFlipped, currentCard]);
  
  // Start study session
  const startSession = async (reviewMistakesOnly: boolean = false) => {
    setIsLoading(true);
    
    try {
      let studyCards: StudyCard[];
      
      if (reviewMistakesOnly && cards.length > 0) {
        // Filter cards that need review (again + hard)
        studyCards = cards
          .filter(c => c.rating === 'again' || c.rating === 'hard')
          .map(c => ({ ...c, rating: undefined, reviewed: false }));
      } else {
        // Get new words
        const repo = new WordRepository();
        const words = await repo.getRandom(cardCount * 2, {
          category: selectedCategory || undefined
        });
        
        // Shuffle and take requested count
        const selectedWords = words.slice(0, cardCount);
        studyCards = selectedWords.map(word => ({
          word,
          reviewed: false
        }));
      }
      
      if (studyCards.length === 0) {
        alert('No cards available for this selection');
        setIsLoading(false);
        return;
      }
      
      setCards(studyCards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setRatings({ again: 0, hard: 0, good: 0, easy: 0 });
      setPhase('studying');
    } catch (error) {
      console.error('Failed to start session:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle card flip
  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true);
    }
  };
  
  // Handle rating
  const handleRate = useCallback((rating: SRSRating) => {
    if (!currentCard || !isFlipped) return;
    
    // Update card rating
    const updatedCards = [...cards];
    updatedCards[currentIndex] = {
      ...currentCard,
      rating,
      reviewed: true
    };
    setCards(updatedCards);
    
    // Update rating counts
    setRatings(prev => ({
      ...prev,
      [rating]: prev[rating] + 1
    }));
    
    // Add to history
    addToHistory(currentCard.word.id);
    
    // Move to next card or finish
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setPhase('finished');
    }
  }, [currentCard, currentIndex, cards, isFlipped, addToHistory]);
  
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
              📇 Flashcard Review
            </h1>
          </div>
          
          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Review vocabulary with spaced repetition! Flip cards to reveal the article, then rate how well you remembered.
            </p>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li>✓ Tap card or press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Space</kbd> to flip</li>
              <li>✓ Rate your recall: Again (1), Hard (2), Good (3), Easy (4)</li>
              <li>✓ Focus on cards you find difficult</li>
              <li>✓ Track your mastery progress</li>
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
          
          {/* Card count selection */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Number of Cards
          </h2>
          
          <div className="flex gap-3 mb-8">
            {[5, 10, 15, 20, 30].map(count => (
              <button
                key={count}
                onClick={() => setCardCount(count)}
                className={`
                  flex-1 py-3 rounded-xl border-2 font-medium transition-all
                  ${cardCount === count 
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
            onClick={() => startSession(false)}
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : '📚 Start Studying'}
          </Button>
        </div>
      </div>
    );
  }
  
  // Render studying phase
  if (phase === 'studying' && currentCard) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setPhase('menu')}>
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            End Session
          </Button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            📇 Flashcard Review
          </h1>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
        
        {/* Progress */}
        <div className="mb-8">
          <FlashcardProgress
            current={currentIndex + 1}
            total={cards.length}
            ratings={ratings}
          />
        </div>
        
        {/* Card */}
        <div className="flex-1 flex items-center justify-center mb-8">
            <FlashCard
            word={currentCard.word.word}
            translation={currentCard.word.translations.en}
            gender={currentCard.word.gender}
            plural={currentCard.word.plural}
            pronunciation={currentCard.word.pronunciation}
            audioUrl={currentCard.word.audioUrl}
            example={currentCard.word.examples[0]}
            isFlipped={isFlipped}
            onFlip={handleFlip}
            />
        </div>
        
        {/* Rating buttons (show only when flipped) */}
        <div className={`transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-3">
            How well did you remember?
          </div>
          <SRSRatingButtons
            onRate={handleRate}
            disabled={!isFlipped}
          />
        </div>
        
        {/* Flip hint (show only when not flipped) */}
        {!isFlipped && (
          <div className="text-center text-gray-400 dark:text-gray-500 text-sm">
            Tap the card or press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Space</kbd> to reveal
          </div>
        )}
      </div>
    );
  }
  
  // Render finished phase
  if (phase === 'finished') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <FlashcardResult
          total={cards.length}
          ratings={ratings}
          onReviewAgain={() => startSession(false)}
          onReviewMistakes={() => startSession(true)}
          onExit={() => navigate('/games')}
        />
      </div>
    );
  }
  
  // Fallback
  return null;
}