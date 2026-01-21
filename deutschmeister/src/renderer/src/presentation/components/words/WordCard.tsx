/**
 * Word Card Component
 * Displays a German word with its article and details
 */

import React from 'react';
import { Word } from '../../../domain/entities/Word';
import { GenderInfo } from '../../../domain/valueObjects/Gender';
import { WordCategoryInfo } from '../../../domain/valueObjects/WordCategory';
import { CEFRLevelInfo } from '../../../domain/valueObjects/CEFRLevel';
import { cn } from '../../../shared/utils/cn';

export interface WordCardProps {
  word: Word;
  onClick?: (word: Word) => void;
  showDetails?: boolean;
  compact?: boolean;
  highlighted?: boolean;
}

export function WordCard({
  word,
  onClick,
  showDetails = false,
  compact = false,
  highlighted = false
}: WordCardProps) {
  const genderInfo = GenderInfo[word.gender];
  const categoryInfo = WordCategoryInfo[word.category];
  const levelInfo = CEFRLevelInfo[word.level];

  // Safety check
  if (!genderInfo || !categoryInfo) {
    console.error('Missing info for word:', word.word, word.gender, word.category);
    return null;
  }

  if (compact) {
    return (
      <button
        onClick={() => onClick?.(word)}
        className={cn(
          'flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all',
          'hover:shadow-md',
          genderInfo.borderClass,
          highlighted ? 'ring-2 ring-blue-500' : ''
        )}
      >
        {/* Article */}
        <span className={cn('text-lg font-bold', genderInfo.colorClass)}>
          {word.article}
        </span>
        
        {/* Word */}
        <span className="font-medium text-gray-900">{word.word}</span>
        
        {/* Translation */}
        <span className="text-sm text-gray-500">({word.translations.en})</span>
      </button>
    );
  }

  return (
    <div
      onClick={() => onClick?.(word)}
      className={cn(
        'group relative overflow-hidden rounded-xl border-2 bg-white p-4 transition-all',
        'hover:shadow-lg cursor-pointer',
        genderInfo.borderClass,
        highlighted ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      )}
    >
      {/* Gender Color Bar */}
      <div
        className={cn('absolute left-0 top-0 h-full w-1', genderInfo.bgClass)}
        style={{ backgroundColor: genderInfo.color }}
      />

      {/* Content */}
      <div className="pl-3">
        {/* Header: Article + Word */}
        <div className="flex items-baseline gap-2">
          <span className={cn('text-xl font-bold', genderInfo.colorClass)}>
            {word.article}
          </span>
          <span className="text-xl font-semibold text-gray-900">
            {word.word}
          </span>
          {word.plural && (
            <span className="text-sm text-gray-400">
              (Pl: {word.plural})
            </span>
          )}
        </div>

        {/* Translation */}
        <div className="mt-1 text-gray-600">
          <span className="font-medium">{word.translations.en}</span>
          {word.translations.vi && (
            <span className="ml-2 text-gray-400">• {word.translations.vi}</span>
          )}
        </div>

        {/* Meta info */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Gender Badge */}
          <span className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            genderInfo.bgClass,
            genderInfo.colorClass
          )}>
            {genderInfo.symbol} {genderInfo.name}
          </span>

          {/* Level Badge */}
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {word.level}
          </span>

          {/* Category Badge */}
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {categoryInfo.icon} {categoryInfo.name}
          </span>

          {/* Frequency indicator */}
          <span className="inline-flex items-center text-xs text-gray-400">
            {'★'.repeat(Math.max(0, 6 - (word.frequency || 3)))}{'☆'.repeat(Math.max(0, (word.frequency || 3) - 1))}
          </span>
        </div>

        {/* Examples (if showDetails) */}
        {showDetails && word.examples.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-3">
            <p className="text-xs font-medium uppercase text-gray-400">Examples</p>
            <ul className="mt-1 space-y-1">
              {word.examples.slice(0, 2).map((example, idx) => (
                <li key={idx} className="text-sm text-gray-600 italic">
                  "{example}"
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tips (if showDetails) */}
        {showDetails && word.tips && word.tips.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium uppercase text-gray-400">💡 Tip</p>
            <p className="mt-1 text-sm text-blue-600">
              {word.tips[0]}
            </p>
          </div>
        )}
      </div>

      {/* Hover indicator */}
      <div className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Word Card Skeleton for loading state
 */
export function WordCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border-2 border-gray-200 bg-white p-4">
      <div className="pl-3">
        <div className="flex items-baseline gap-2">
          <div className="h-6 w-10 rounded bg-gray-200" />
          <div className="h-6 w-32 rounded bg-gray-200" />
        </div>
        <div className="mt-2 h-4 w-48 rounded bg-gray-200" />
        <div className="mt-3 flex gap-2">
          <div className="h-5 w-20 rounded-full bg-gray-200" />
          <div className="h-5 w-12 rounded-full bg-gray-200" />
          <div className="h-5 w-16 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}