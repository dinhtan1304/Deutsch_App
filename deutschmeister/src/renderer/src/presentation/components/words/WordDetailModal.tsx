/**
 * Word Detail Modal Component
 * Shows detailed information about a word
 */

import React, { useEffect, useState } from 'react';
import { Word } from '../../../domain/entities/Word';
import { GenderInfo } from '../../../domain/valueObjects/Gender';
import { WordCategoryInfo } from '../../../domain/valueObjects/WordCategory';
import { CEFRLevelInfo } from '../../../domain/valueObjects/CEFRLevel';
import { Button } from '../ui/Button';
import { cn } from '../../../shared/utils/cn';
import { useWordStore } from '../../stores/wordStore';

export interface WordDetailModalProps {
  word: Word | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WordDetailModal({ word, isOpen, onClose }: WordDetailModalProps) {
  const [relatedWords, setRelatedWords] = useState<Word[]>([]);
  const { getRelatedWords, selectWord } = useWordStore();

  // Load related words when word changes
  useEffect(() => {
    if (word && isOpen) {
      getRelatedWords(word.id).then(setRelatedWords);
    }
  }, [word, isOpen, getRelatedWords]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !word) return null;

  const genderInfo = GenderInfo[word.gender];
  const categoryInfo = WordCategoryInfo[word.category];
  const levelInfo = CEFRLevelInfo[word.level];

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleRelatedWordClick = (relatedWord: Word) => {
    selectWord(relatedWord);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl animate-scale-in">
        {/* Close Button */}
        <button
          type="button"
          aria-label="Close modal"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 z-10"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header with color */}
        <div
          className={cn('px-6 py-8 text-center')}
          style={{ backgroundColor: `${genderInfo.color}15` }}
        >
          {/* Article */}
          <span
            className="text-4xl font-bold"
            style={{ color: genderInfo.color }}
          >
            {word.article}
          </span>

          {/* Word */}
          <h2 className="mt-2 text-4xl font-bold text-gray-900">
            {word.word}
          </h2>

          {/* Plural */}
          {word.plural && (
            <p className="mt-1 text-lg text-gray-500">
              Plural: <span className="font-medium">{word.plural}</span>
            </p>
          )}

          {/* Pronunciation */}
          {word.pronunciation && (
            <p className="mt-2 text-gray-400 font-mono">
              [{word.pronunciation}]
            </p>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Translation */}
          <div>
            <h3 className="text-sm font-medium uppercase text-gray-400">Translation</h3>
            <p className="mt-1 text-xl text-gray-900">{word.translations.en}</p>
            {word.translations.vi && (
              <p className="mt-1 text-lg text-gray-600">{word.translations.vi}</p>
            )}
          </div>

          {/* Meta Badges */}
          <div className="flex flex-wrap gap-2">
            {/* Gender */}
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium',
                genderInfo.bgClass,
                genderInfo.colorClass
              )}
            >
              {genderInfo.symbol} {genderInfo.name} ({genderInfo.nameDE})
            </span>

            {/* Level */}
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              {word.level} - {levelInfo.name}
            </span>

            {/* Category */}
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {categoryInfo.icon} {categoryInfo.name}
            </span>

            {/* Frequency */}
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700">
              {'★'.repeat(6 - word.frequency)}{'☆'.repeat(word.frequency - 1)} Frequency
            </span>
          </div>

          {/* Examples */}
          {word.examples.length > 0 && (
            <div>
              <h3 className="text-sm font-medium uppercase text-gray-400">Example Sentences</h3>
              <ul className="mt-2 space-y-2">
                {word.examples.map((example, idx) => (
                  <li
                    key={idx}
                    className="rounded-lg bg-gray-50 p-3 text-gray-700 italic"
                  >
                    "{example}"
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          {word.tips && word.tips.length > 0 && (
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-blue-800">
                <span>💡</span> Learning Tips
              </h3>
              <ul className="mt-2 space-y-1">
                {word.tips.map((tip, idx) => (
                  <li key={idx} className="text-blue-700">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Words */}
          {relatedWords.length > 0 && (
            <div>
              <h3 className="text-sm font-medium uppercase text-gray-400">Related Words</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {relatedWords.map(related => (
                  <button
                    key={related.id}
                    onClick={() => handleRelatedWordClick(related)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg border-2 px-3 py-1.5 text-sm transition-colors',
                      'hover:bg-gray-50',
                      GenderInfo[related.gender].borderClass
                    )}
                  >
                    <span className={GenderInfo[related.gender].colorClass}>
                      {related.article}
                    </span>
                    <span className="font-medium">{related.word}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {word.tags && word.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium uppercase text-gray-400">Tags</h3>
              <div className="mt-2 flex flex-wrap gap-1">
                {word.tags.map(tag => (
                  <span
                    key={tag}
                    className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4">
          <Button onClick={onClose} fullWidth variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}