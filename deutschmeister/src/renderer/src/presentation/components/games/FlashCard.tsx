/**
 * FlashCard Component
 * Flippable card for flashcard review mode
 */

import React, { useRef, useEffect } from 'react';
import { Gender, GenderInfo } from '../../../domain/valueObjects/Gender';

export interface FlashCardProps {
  word: string;
  translation: string;
  gender: Gender;
  plural?: string | null;
  pronunciation?: string;
  audioUrl?: string;
  example?: string;
  isFlipped: boolean;
  onFlip: () => void;
}

// Speak German word using Web Speech API
const speakGerman = (text: string) => {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9; // Slightly slower for learning
    
    // Try to find German voice
    const voices = window.speechSynthesis.getVoices();
    const germanVoice = voices.find(v => v.lang.startsWith('de'));
    if (germanVoice) {
      utterance.voice = germanVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }
};

export function FlashCard({
  word,
  translation,
  gender,
  plural,
  pronunciation,
  audioUrl,
  example,
  isFlipped,
  onFlip
}: FlashCardProps) {
  const genderInfo = GenderInfo[gender];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasSpokenRef = useRef(false);
  
  // Load voices (needed for some browsers)
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Voices may load async
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);
  
  // Reset spoken flag when card changes
  useEffect(() => {
    hasSpokenRef.current = false;
  }, [word]);
  
  // Auto-play audio when flipped
  useEffect(() => {
    if (isFlipped && !hasSpokenRef.current) {
      hasSpokenRef.current = true;
      
      // Small delay for flip animation
      const timer = setTimeout(() => {
        if (audioUrl && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(err => {
            console.log('Audio play failed, using TTS:', err);
            speakGerman(`${genderInfo.article} ${word}`);
          });
        } else {
          // Use TTS
          speakGerman(`${genderInfo.article} ${word}`);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isFlipped, audioUrl, word, genderInfo.article]);
  
  // Manual play audio
  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioUrl && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        speakGerman(`${genderInfo.article} ${word}`);
      });
    } else {
      speakGerman(`${genderInfo.article} ${word}`);
    }
  };
  
  return (
    <div 
      className="perspective-1000 w-full max-w-md mx-auto cursor-pointer"
      onClick={onFlip}
    >
      {/* Hidden audio element (if audioUrl exists) */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} preload="auto" />
      )}
      
      <div 
        className={`
          relative w-full h-80 transition-transform duration-500 transform-style-3d
          ${isFlipped ? 'rotate-y-180' : ''}
        `}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front - Word only */}
        <div 
          className="absolute inset-0 backface-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="text-gray-400 dark:text-gray-500 text-sm mb-4">
            What is the article?
          </div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {word}
          </div>
          {pronunciation && (
            <div className="text-gray-400 dark:text-gray-500 text-sm mb-2">
              [{pronunciation}]
            </div>
          )}
          <div className="text-gray-500 dark:text-gray-400 text-lg">
            {translation}
          </div>
          <div className="absolute bottom-4 text-gray-400 dark:text-gray-500 text-sm">
            Tap to reveal
          </div>
        </div>
        
        {/* Back - Answer */}
        <div 
          className="absolute inset-0 backface-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          {/* Article */}
          <div className={`text-5xl font-bold mb-1 ${genderInfo.colorClass}`}>
            {genderInfo.article}
          </div>
          
          {/* Word with audio button */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {word}
            </span>
            <button
              onClick={handlePlayAudio}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xl"
              title="Play pronunciation"
            >
              🔊
            </button>
          </div>
          
          {/* IPA */}
          {pronunciation && (
            <div className="text-gray-400 dark:text-gray-500 text-sm mb-2">
              [{pronunciation}]
            </div>
          )}
          
          {/* Plural */}
          {plural && (
            <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">
              <span className="text-gray-400 dark:text-gray-500">Plural:</span>{' '}
              <span className="font-medium">die {plural}</span>
            </div>
          )}
          
          {/* Translation */}
          <div className="text-gray-500 dark:text-gray-400 text-base mb-3">
            {translation}
          </div>
          
          {/* Example */}
          {example && (
            <div className="text-sm text-gray-400 dark:text-gray-500 italic text-center max-w-xs mb-3">
              "{example}"
            </div>
          )}
          
          {/* Gender badge */}
          <div className={`
            px-4 py-1.5 rounded-full text-sm font-medium
            ${gender === 'masculine' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : ''}
            ${gender === 'feminine' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400' : ''}
            ${gender === 'neuter' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : ''}
          `}>
            {genderInfo.name}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * SRS Rating type
 */
export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface SRSRatingInfo {
  label: string;
  shortcut: string;
  color: string;
  bgColor: string;
  description: string;
  multiplier: number; // Affects next review interval
}

export const SRS_RATINGS: Record<SRSRating, SRSRatingInfo> = {
  again: {
    label: 'Again',
    shortcut: '1',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50',
    description: 'Review again soon',
    multiplier: 0
  },
  hard: {
    label: 'Hard',
    shortcut: '2',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50',
    description: 'Took effort to remember',
    multiplier: 0.5
  },
  good: {
    label: 'Good',
    shortcut: '3',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50',
    description: 'Correct with some thought',
    multiplier: 1
  },
  easy: {
    label: 'Easy',
    shortcut: '4',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50',
    description: 'Instantly recalled',
    multiplier: 2
  }
};

/**
 * SRS Rating Buttons
 */
export interface SRSRatingButtonsProps {
  onRate: (rating: SRSRating) => void;
  disabled?: boolean;
}

export function SRSRatingButtons({ onRate, disabled }: SRSRatingButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-2 w-full max-w-md mx-auto">
      {(Object.entries(SRS_RATINGS) as [SRSRating, SRSRatingInfo][]).map(([rating, info]) => (
        <button
          key={rating}
          onClick={() => onRate(rating)}
          disabled={disabled}
          className={`
            ${info.bgColor} ${info.color}
            p-3 rounded-xl font-medium transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            flex flex-col items-center gap-1
          `}
        >
          <span className="text-sm font-bold">{info.label}</span>
          <span className="text-xs opacity-70">{info.shortcut}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Flashcard Progress Bar
 */
export interface FlashcardProgressProps {
  current: number;
  total: number;
  ratings: Record<SRSRating, number>;
}

export function FlashcardProgress({ current, total, ratings }: FlashcardProgressProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Stats */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          {current} / {total}
        </span>
        <div className="flex gap-3">
          {ratings.again > 0 && (
            <span className="text-red-500">{ratings.again} Again</span>
          )}
          {ratings.hard > 0 && (
            <span className="text-orange-500">{ratings.hard} Hard</span>
          )}
          {ratings.good > 0 && (
            <span className="text-green-500">{ratings.good} Good</span>
          )}
          {ratings.easy > 0 && (
            <span className="text-blue-500">{ratings.easy} Easy</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Flashcard Result Summary
 */
export interface FlashcardResultProps {
  total: number;
  ratings: Record<SRSRating, number>;
  onReviewAgain: () => void;
  onReviewMistakes: () => void;
  onExit: () => void;
}

export function FlashcardResult({
  total,
  ratings,
  onReviewAgain,
  onReviewMistakes,
  onExit
}: FlashcardResultProps) {
  const masteredCount = ratings.good + ratings.easy;
  const needsWorkCount = ratings.again + ratings.hard;
  const masteryRate = total > 0 ? Math.round((masteredCount / total) * 100) : 0;
  
  // Grade based on mastery
  const getGrade = () => {
    if (masteryRate >= 90) return { emoji: '🏆', text: 'Excellent!', color: 'text-yellow-500' };
    if (masteryRate >= 70) return { emoji: '🌟', text: 'Great job!', color: 'text-green-500' };
    if (masteryRate >= 50) return { emoji: '👍', text: 'Good progress!', color: 'text-blue-500' };
    return { emoji: '💪', text: 'Keep practicing!', color: 'text-orange-500' };
  };
  
  const grade = getGrade();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl max-w-md mx-auto text-center">
      {/* Grade */}
      <div className="text-6xl mb-4">{grade.emoji}</div>
      <h2 className={`text-2xl font-bold mb-2 ${grade.color}`}>{grade.text}</h2>
      
      {/* Mastery rate */}
      <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
        {masteryRate}%
      </div>
      <div className="text-gray-500 dark:text-gray-400 mb-6">
        Mastery Rate
      </div>
      
      {/* Stats breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {masteredCount}
          </div>
          <div className="text-sm text-green-700 dark:text-green-400">Mastered</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {needsWorkCount}
          </div>
          <div className="text-sm text-orange-700 dark:text-orange-400">Needs Work</div>
        </div>
      </div>
      
      {/* Detailed breakdown */}
      <div className="flex justify-center gap-4 mb-8 text-sm">
        <span className="text-red-500">🔴 {ratings.again}</span>
        <span className="text-orange-500">🟠 {ratings.hard}</span>
        <span className="text-green-500">🟢 {ratings.good}</span>
        <span className="text-blue-500">🔵 {ratings.easy}</span>
      </div>
      
      {/* Actions */}
      <div className="space-y-3">
        {needsWorkCount > 0 && (
          <button
            onClick={onReviewMistakes}
            className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors"
          >
            🔄 Review {needsWorkCount} Difficult Cards
          </button>
        )}
        <button
          onClick={onReviewAgain}
          className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
        >
          📚 Start New Session
        </button>
        <button
          onClick={onExit}
          className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
        >
          ← Back to Games
        </button>
      </div>
    </div>
  );
}