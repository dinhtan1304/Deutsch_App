/**
 * FillBlank Components
 * Components for Fill-in-the-Blank game mode
 */

import React from 'react';
import { Gender, GenderInfo } from '../../../domain/valueObjects/Gender';

/**
 * Sentence display with blank
 */
export interface SentenceDisplayProps {
  sentence: string;
  word: string;
  selectedArticle: Gender | null;
  correctArticle?: Gender;
  showResult?: boolean;
}

export function SentenceDisplay({
  sentence,
  word,
  selectedArticle,
  correctArticle,
  showResult = false
}: SentenceDisplayProps) {
  // Replace the word with blank + word format
  const displaySentence = sentence || `___ ${word} ist sehr wichtig.`;
  
  // Determine blank display
  const getBlankDisplay = () => {
    if (!selectedArticle) {
      return (
        <span className="inline-flex items-center justify-center min-w-[80px] h-10 px-3 mx-1 border-b-4 border-dashed border-blue-400 dark:border-blue-500 text-blue-500 dark:text-blue-400 font-bold text-xl">
          ___
        </span>
      );
    }
    
    const info = GenderInfo[selectedArticle];
    const isCorrect = selectedArticle === correctArticle;
    
    if (showResult) {
      return (
        <span className={`
          inline-flex items-center justify-center min-w-[80px] h-10 px-3 mx-1 rounded-lg font-bold text-xl
          ${isCorrect 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-2 border-green-500' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-2 border-red-500 line-through'}
        `}>
          {info.article}
        </span>
      );
    }
    
    return (
      <span className={`
        inline-flex items-center justify-center min-w-[80px] h-10 px-3 mx-1 rounded-lg font-bold text-xl
        bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-2 border-blue-500
      `}>
        {info.article}
      </span>
    );
  };
  
  // Parse sentence and insert blank
  const renderSentence = () => {
    // Try to find article + word pattern and replace
    const articlePattern = new RegExp(`(der|die|das)\\s+${word}`, 'i');
    const match = displaySentence.match(articlePattern);
    
    if (match) {
      const parts = displaySentence.split(articlePattern);
      return (
        <>
          {parts[0]}
          {getBlankDisplay()}
          <span className="font-bold text-gray-900 dark:text-white">{word}</span>
          {parts[2] || ''}
        </>
      );
    }
    
    // Fallback: just show blank before word
    return (
      <>
        {getBlankDisplay()}
        <span className="font-bold text-gray-900 dark:text-white">{word}</span>
        {displaySentence.includes(word) ? displaySentence.split(word)[1] : ' ist wichtig.'}
      </>
    );
  };
  
  return (
    <div className="text-2xl text-gray-700 dark:text-gray-300 leading-relaxed text-center">
      {renderSentence()}
    </div>
  );
}

/**
 * Article selection buttons for fill-blank
 */
export interface ArticleChoiceProps {
  onSelect: (gender: Gender) => void;
  selectedArticle: Gender | null;
  correctArticle?: Gender;
  showResult?: boolean;
  disabled?: boolean;
}

export function ArticleChoice({
  onSelect,
  selectedArticle,
  correctArticle,
  showResult = false,
  disabled = false
}: ArticleChoiceProps) {
  const articles: { gender: Gender; article: string }[] = [
    { gender: 'masculine', article: 'der' },
    { gender: 'feminine', article: 'die' },
    { gender: 'neuter', article: 'das' }
  ];
  
  return (
    <div className="flex justify-center gap-4">
      {articles.map(({ gender, article }) => {
        const isSelected = selectedArticle === gender;
        const isCorrect = gender === correctArticle;
        
        let buttonClass = `
          py-4 px-8 rounded-xl text-2xl font-bold transition-all
          disabled:cursor-not-allowed
        `;
        
        if (showResult && correctArticle) {
          if (isCorrect) {
            buttonClass += ' bg-green-500 text-white border-4 border-green-600';
          } else if (isSelected && !isCorrect) {
            buttonClass += ' bg-red-500 text-white border-4 border-red-600 opacity-60';
          } else {
            buttonClass += ' bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500';
          }
        } else if (isSelected) {
          buttonClass += ' bg-blue-500 text-white border-4 border-blue-600 scale-105';
        } else {
          buttonClass += ' bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:scale-105';
        }
        
        return (
          <button
            key={gender}
            onClick={() => onSelect(gender)}
            disabled={disabled || showResult}
            className={buttonClass}
          >
            {article}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Correction display after wrong answer
 */
export interface CorrectionDisplayProps {
  word: string;
  translation: string;
  correctArticle: Gender;
  selectedArticle: Gender | null;
}

export function CorrectionDisplay({
  word,
  translation,
  correctArticle,
  selectedArticle
}: CorrectionDisplayProps) {
  const correctInfo = GenderInfo[correctArticle];
  const isTimeout = selectedArticle === null;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg max-w-md mx-auto text-center">
      <div className="text-4xl mb-3">
        {isTimeout ? '⏰' : '❌'}
      </div>
      <div className="text-lg text-gray-500 dark:text-gray-400 mb-2">
        {isTimeout ? 'Time\'s up!' : 'Incorrect'}
      </div>
      <div className="text-3xl font-bold mb-2">
        <span className={correctInfo.colorClass}>{correctInfo.article}</span>
        {' '}
        <span className="text-gray-900 dark:text-white">{word}</span>
      </div>
      <div className="text-gray-500 dark:text-gray-400">
        {translation}
      </div>
    </div>
  );
}

/**
 * Fill-blank progress header
 */
export interface FillBlankHeaderProps {
  current: number;
  total: number;
  score: number;
  streak: number;
}

export function FillBlankHeader({ current, total, score, streak }: FillBlankHeaderProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Stats */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          Question {current} / {total}
        </span>
        <div className="flex gap-4">
          {streak > 0 && (
            <span className="text-orange-500 font-medium">
              🔥 {streak} streak
            </span>
          )}
          <span className="text-blue-600 dark:text-blue-400 font-bold">
            {score} pts
          </span>
        </div>
      </div>
    </div>
  );
}