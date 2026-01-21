/**
 * Word Search Page
 * Main page for searching and browsing German vocabulary
 * Implements UC-2.1.01: Search Word
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Word } from '../../../domain/entities/Word';
import { WordRepository } from '../../../infrastructure/repositories/WordRepository';
import { GenderInfo } from '../../../domain/valueObjects/Gender';
import { WordCategoryInfo, WordCategory, WORD_CATEGORIES } from '../../../domain/valueObjects/WordCategory';
import { cn } from '../../../shared/utils/cn';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useHistoryStore } from '../../stores/historyStore';

type ViewMode = 'grid' | 'mindmap';

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

export function WordSearchPage() {
  const navigate = useNavigate();
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['food', 'animals', 'family'])
  );
  const { addToHistory } = useHistoryStore();

  // Handle selecting a word (adds to history)
  const handleSelectWord = (word: Word) => {
    addToHistory(word.id);
    setSelectedWord(word);
  };

  // Load voices on mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Load words on mount
  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async (query?: string) => {
    try {
      setIsLoading(true);
      const repo = new WordRepository();
      const results = await repo.search({ query, limit: 100 });
      setWords(results);
      setError(null);
    } catch (err) {
      console.error('Failed to load words:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadWords(searchQuery || undefined);
  };

  // Group words by category for mind map
  const wordsByCategory = useMemo(() => {
    const grouped: Record<WordCategory, Word[]> = {} as Record<WordCategory, Word[]>;
    WORD_CATEGORIES.forEach(cat => { grouped[cat] = []; });
    words.forEach(word => {
      if (grouped[word.category]) {
        grouped[word.category].push(word);
      }
    });
    return grouped;
  }, [words]);

  const activeCategories = useMemo(() => {
    return WORD_CATEGORIES.filter(cat => wordsByCategory[cat].length > 0);
  }, [wordsByCategory]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => loadWords()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              ← Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Der/Die/Das</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* History Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/words/history')}
              className="flex items-center gap-2"
            >
              <span>🕐</span>
              <span>History</span>
              <HistoryCount />
            </Button>
            
            {/* Favorites Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/words/favorites')}
              className="flex items-center gap-2"
            >
              <span>⭐</span>
              <span>Favorites</span>
              <FavoritesCount />
            </Button>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                )}
              >
                📊 Grid
              </button>
              <button
                onClick={() => setViewMode('mindmap')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'mindmap' 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                )}
              >
                🗺️ Mind Map
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Search Bar */}
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search: Apfel, apple, táo..."
            className="flex-1 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
          />
          <Button onClick={handleSearch} isLoading={isLoading}>
            Search
          </Button>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {words.map(word => (
              <WordCard 
                key={word.id} 
                word={word} 
                onClick={() => handleSelectWord(word)} 
              />
            ))}
          </div>
        ) : (
          /* Mind Map View */
          <div className="space-y-4">
            {activeCategories.map(category => {
              const info = WordCategoryInfo[category];
              const catWords = wordsByCategory[category];
              const isExpanded = expandedCategories.has(category);
              
              return (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all"
                  >
                    <span className="text-2xl">{info.icon}</span>
                    <div className="flex-1 text-left">
                      <h3 className="font-bold">{info.name}</h3>
                      <p className="text-sm opacity-80">{info.nameDE} • {catWords.length} words</p>
                    </div>
                    <span className={cn('text-xl transition-transform', isExpanded && 'rotate-90')}>
                      →
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-3 ml-6 pl-4 border-l-2 border-purple-300 dark:border-purple-600">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {catWords.map(word => (
                          <WordCard 
                            key={word.id} 
                            word={word} 
                            onClick={() => handleSelectWord(word)}
                            compact
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {words.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No words found</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedWord && (
        <WordDetailModal 
          word={selectedWord} 
          onClose={() => setSelectedWord(null)} 
        />
      )}
    </div>
  );
}

/**
 * Favorites Count Badge
 */
function FavoritesCount() {
  const count = useFavoritesStore(state => state.favoriteIds.length);
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-yellow-500 rounded-full">
      {count > 99 ? '99+' : count}
    </span>
  );
}

/**
 * History Count Badge
 */
function HistoryCount() {
  const count = useHistoryStore(state => state.history.length);
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-gray-500 rounded-full">
      {count > 99 ? '99+' : count}
    </span>
  );
}

/**
 * Favorite Button Component
 */
function FavoriteButton({ wordId, size = 'md' }: { wordId: string; size?: 'sm' | 'md' }) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const isActive = isFavorite(wordId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(wordId);
  };

  const sizeClasses = size === 'sm' ? 'p-1.5 text-base' : 'p-2 text-lg';

  return (
    <button
      onClick={handleClick}
      className={cn(
        'rounded-full transition-all flex-shrink-0',
        sizeClasses,
        isActive 
          ? 'text-yellow-500 hover:text-yellow-600' 
          : 'text-gray-300 hover:text-yellow-400 dark:text-gray-600 dark:hover:text-yellow-400'
      )}
      title={isActive ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isActive ? '⭐' : '☆'}
    </button>
  );
}

/**
 * Word Card Component
 */
function WordCard({ 
  word, 
  onClick, 
  compact = false 
}: { 
  word: Word; 
  onClick: () => void;
  compact?: boolean;
}) {
  const genderInfo = GenderInfo[word.gender];
  const categoryInfo = WordCategoryInfo[word.category];
  
  if (!genderInfo || !categoryInfo) return null;

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    speakGerman(`${word.article} ${word.word}`);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl border-2 bg-white dark:bg-gray-800 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] overflow-hidden',
        genderInfo.borderClass,
        compact ? 'p-3' : 'p-4'
      )}
    >
      {/* Background Image */}
      {!compact && word.imageUrl && (
        <div className="absolute top-0 right-0 w-20 h-20 opacity-20">
          <img 
            src={word.imageUrl} 
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-baseline gap-2 min-w-0 flex-1">
          <span className={cn('font-bold', genderInfo.colorClass, compact ? 'text-lg' : 'text-xl')}>
            {word.article}
          </span>
          <span className={cn('font-semibold text-gray-900 dark:text-white truncate', compact ? 'text-lg' : 'text-xl')}>
            {word.word}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <FavoriteButton wordId={word.id} size={compact ? 'sm' : 'md'} />
          <button
            onClick={handleSpeak}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500 transition-colors flex-shrink-0"
            title="Listen"
          >
            🔊
          </button>
        </div>
      </div>

      {/* IPA */}
      {word.pronunciation && !compact && (
        <p className="text-sm text-gray-400 font-mono mt-1">/{word.pronunciation}/</p>
      )}
      
      {/* Translations */}
      <div className={cn('text-gray-600 dark:text-gray-300', compact ? 'mt-1 text-sm' : 'mt-2')}>
        <span>{word.translations.en}</span>
        {word.translations.vi && (
          <span className="ml-2 text-blue-500">• {word.translations.vi}</span>
        )}
      </div>
      
      {/* Badges */}
      {!compact && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            genderInfo.bgClass,
            genderInfo.colorClass
          )}>
            {genderInfo.article}
          </span>
          <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300">
            {categoryInfo.icon} {categoryInfo.name}
          </span>
          <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300">
            {word.level}
          </span>
        </div>
      )}
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