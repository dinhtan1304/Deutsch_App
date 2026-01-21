/**
 * History Page
 * Displays recently viewed words
 * Implements UC-2.1.10: View Recent History
 * Implements UC-2.1.11: Clear History
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Word } from '../../../domain/entities/Word';
import { WordRepository } from '../../../infrastructure/repositories/WordRepository';
import { GenderInfo } from '../../../domain/valueObjects/Gender';
import { WordCategoryInfo } from '../../../domain/valueObjects/WordCategory';
import { cn } from '../../../shared/utils/cn';
import { useHistoryStore, useFormattedHistory } from '../../stores/historyStore';
import { useFavoritesStore } from '../../stores/favoritesStore';

/**
 * Speak German text using Web Speech API
 */
function speakGerman(text: string, slow = false) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = slow ? 0.5 : 0.8;
    utterance.pitch = 1;
    
    const voices = window.speechSynthesis.getVoices();
    const germanVoice = voices.find(v => v.lang.startsWith('de'));
    if (germanVoice) {
      utterance.voice = germanVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }
}

export function HistoryPage() {
  const navigate = useNavigate();
  const { clearHistory, removeFromHistory } = useHistoryStore();
  const formattedHistory = useFormattedHistory();
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load history words
  useEffect(() => {
    const loadHistory = async () => {
      if (formattedHistory.length === 0) {
        setWords([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const repo = new WordRepository();
        const allWords = await repo.search({ limit: 200 });
        
        // Create a map for quick lookup
        const wordMap = new Map(allWords.map(w => [w.id, w]));
        
        // Get words in history order
        const historyWords = formattedHistory
          .map(h => wordMap.get(h.wordId))
          .filter((w): w is Word => w !== undefined);
        
        setWords(historyWords);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, [formattedHistory]);

  // Load voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const handleClearAll = () => {
    clearHistory();
    setShowClearConfirm(false);
  };

  // Get time ago for a word
  const getTimeAgo = (wordId: string) => {
    const entry = formattedHistory.find(h => h.wordId === wordId);
    return entry?.viewedAtFormatted || '';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/words')}>
              ← Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🕐</span> Recently Viewed
              <span className="text-sm font-normal text-gray-500">
                ({formattedHistory.length} words)
              </span>
            </h1>
          </div>
          
          {formattedHistory.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Clear History
            </Button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading history...</p>
          </div>
        ) : words.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🕐</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No history yet
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Words you view will appear here. Start exploring the vocabulary!
            </p>
            <Button onClick={() => navigate('/words')}>
              Browse Words
            </Button>
          </div>
        ) : (
          /* History List */
          <div className="space-y-3">
            {words.map(word => (
              <HistoryWordCard
                key={word.id}
                word={word}
                timeAgo={getTimeAgo(word.id)}
                onClick={() => setSelectedWord(word)}
                onRemove={() => removeFromHistory(word.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Word Detail Modal */}
      {selectedWord && (
        <WordDetailModal
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
        />
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowClearConfirm(false)}
        >
          <Card className="w-full max-w-sm">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">🗑️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Clear all history?
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                This will remove all {formattedHistory.length} words from your history.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  onClick={handleClearAll}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Clear History
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * History Word Card Component (horizontal layout)
 */
function HistoryWordCard({
  word,
  timeAgo,
  onClick,
  onRemove
}: {
  word: Word;
  timeAgo: string;
  onClick: () => void;
  onRemove: () => void;
}) {
  const genderInfo = GenderInfo[word.gender];
  const categoryInfo = WordCategoryInfo[word.category];
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  if (!genderInfo || !categoryInfo) return null;

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    speakGerman(`${word.article} ${word.word}`);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(word.id);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 rounded-xl border-2 bg-white dark:bg-gray-800 cursor-pointer transition-all hover:shadow-lg p-4',
        genderInfo.borderClass
      )}
    >
      {/* Image */}
      {word.imageUrl ? (
        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={word.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      ) : (
        <div className={cn(
          'w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-bold flex-shrink-0',
          genderInfo.bgClass
        )}>
          <span style={{ color: genderInfo.color }}>{word.article.charAt(0).toUpperCase()}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={cn('font-bold text-lg', genderInfo.colorClass)}>
            {word.article}
          </span>
          <span className="font-semibold text-lg text-gray-900 dark:text-white truncate">
            {word.word}
          </span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
          {word.translations.en}
          {word.translations.vi && (
            <span className="ml-2 text-blue-500">• {word.translations.vi}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">{timeAgo}</span>
          <span className="text-xs text-gray-300">•</span>
          <span className="text-xs text-gray-400">{categoryInfo.icon} {categoryInfo.name}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handleToggleFavorite}
          className={cn(
            'p-2 rounded-full transition-colors',
            isFavorite(word.id)
              ? 'text-yellow-500 hover:text-yellow-600'
              : 'text-gray-300 hover:text-yellow-400 dark:text-gray-600'
          )}
          title={isFavorite(word.id) ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite(word.id) ? '⭐' : '☆'}
        </button>
        <button
          onClick={handleSpeak}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500 transition-colors"
          title="Listen"
        >
          🔊
        </button>
        <button
          onClick={handleRemove}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"
          title="Remove from history"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * Word Detail Modal
 */
function WordDetailModal({ word, onClose }: { word: Word; onClose: () => void }) {
  const genderInfo = GenderInfo[word.gender];
  const categoryInfo = WordCategoryInfo[word.category];
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const isActive = isFavorite(word.id);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 shadow-2xl">
        {/* Top Buttons */}
        <div className="absolute right-4 top-4 flex items-center gap-2 z-10">
          <button
            onClick={() => toggleFavorite(word.id)}
            className={cn(
              'rounded-lg p-2 text-xl transition-all',
              isActive
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-400 hover:text-yellow-400'
            )}
            title={isActive ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isActive ? '⭐' : '☆'}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Header */}
        <div
          className="px-6 py-8 text-center relative"
          style={{ backgroundColor: `${genderInfo.color}20` }}
        >
          {/* Image */}
          {word.imageUrl && (
            <div className="mb-4">
              <img
                src={word.imageUrl}
                alt={word.word}
                className="w-24 h-24 mx-auto rounded-xl object-cover shadow-md"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}

          {/* Article + Word */}
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl font-bold" style={{ color: genderInfo.color }}>
              {word.article}
            </span>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              {word.word}
            </h2>
          </div>

          {/* IPA */}
          {word.pronunciation && (
            <p className="mt-2 text-gray-500 font-mono text-lg">/{word.pronunciation}/</p>
          )}

          {/* Plural */}
          {word.plural && (
            <p className="mt-2 text-gray-500">Plural: <span className="font-medium">{word.plural}</span></p>
          )}

          {/* Audio Buttons */}
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => speakGerman(`${word.article} ${word.word}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              🔊 Play
            </button>
            <button
              onClick={() => speakGerman(`${word.article} ${word.word}`, true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              🐢 Slow
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-5">
          {/* Translation */}
          <div>
            <h3 className="text-sm font-medium uppercase text-gray-400">Translation</h3>
            <p className="mt-1 text-2xl text-gray-900 dark:text-white">{word.translations.en}</p>
            {word.translations.vi && (
              <p className="mt-1 text-xl text-blue-500">{word.translations.vi}</p>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium',
              genderInfo.bgClass,
              genderInfo.colorClass
            )}>
              {genderInfo.symbol} {genderInfo.name} ({genderInfo.nameDE})
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300">
              {word.level}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {categoryInfo.icon} {categoryInfo.name}
            </span>
          </div>

          {/* Examples */}
          {word.examples.length > 0 && (
            <div>
              <h3 className="text-sm font-medium uppercase text-gray-400">Examples</h3>
              <ul className="mt-2 space-y-2">
                {word.examples.map((example, idx) => (
                  <li
                    key={idx}
                    className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3 flex items-start gap-2"
                  >
                    <button
                      onClick={() => speakGerman(example)}
                      className="mt-0.5 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-blue-500"
                    >
                      🔊
                    </button>
                    <span className="text-gray-700 dark:text-gray-300 italic">"{example}"</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          {word.tips && word.tips.length > 0 && (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/30 p-4 border border-yellow-200 dark:border-yellow-700">
              <h3 className="flex items-center gap-2 text-sm font-medium text-yellow-800 dark:text-yellow-300">
                💡 Learning Tips
              </h3>
              <ul className="mt-2 space-y-1">
                {word.tips.map((tip, idx) => (
                  <li key={idx} className="text-yellow-700 dark:text-yellow-400">{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-4">
          <Button onClick={onClose} fullWidth variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}