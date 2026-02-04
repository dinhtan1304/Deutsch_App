'use client';

import { useState } from 'react';
import type { TopicWord } from '@/types/topic';
import { ArticleColor } from '@/types/topic';

interface TopicWordCardProps {
  word: TopicWord;
  index: number;
  isLearned?: boolean;
  onMarkLearned?: (wordId: string) => void;
  onPlayAudio?: (text: string) => void;
}

export function TopicWordCard({
  word,
  index,
  isLearned = false,
  onMarkLearned,
  onPlayAudio,
}: TopicWordCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const articleColor = ArticleColor[word.article] || '#6B7280';

  const handlePlayAudio = () => {
    if (onPlayAudio) {
      const fullWord = word.article ? `${word.article} ${word.word}` : word.word;
      onPlayAudio(fullWord);
    } else {
      // Fallback: Use browser TTS
      const utterance = new SpeechSynthesisUtterance(
        word.article ? `${word.article} ${word.word}` : word.word
      );
      utterance.lang = 'de-DE';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border transition-all duration-300
        ${isLearned ? 'opacity-60' : ''}
        ${showDetails ? 'ring-2' : ''}`}
      style={{
        borderColor: showDetails ? articleColor : 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
        '--ring-color': articleColor,
      } as React.CSSProperties}
    >
      {/* Core badge */}
      {word.isCore && (
        <div
          className="absolute top-0 right-0 px-2 py-0.5 text-xs font-medium text-white rounded-bl-lg"
          style={{ backgroundColor: articleColor }}
        >
          ⭐ Core
        </div>
      )}

      {/* Main content */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: Word info */}
          <div className="flex-1 min-w-0">
            {/* Index + Article + Word */}
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-400 font-mono">{index}.</span>
              {word.article && (
                <span
                  className="text-sm font-medium"
                  style={{ color: articleColor }}
                >
                  {word.article}
                </span>
              )}
              <span
                className="text-lg font-bold"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                {word.word}
              </span>
            </div>

            {/* Plural */}
            {word.plural && (
              <p className="text-xs text-gray-400 mt-0.5">
                Pl. {word.plural}
              </p>
            )}

            {/* Translations */}
            <div className="mt-2 space-y-0.5">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                🇬🇧 {word.translationEn}
              </p>
              {word.translationVi && (
                <p className="text-sm text-gray-500">
                  🇻🇳 {word.translationVi}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col items-center gap-2">
            {/* Audio button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayAudio();
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center
                hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Nghe phát âm"
            >
              🔊
            </button>

            {/* Learned checkbox */}
            {onMarkLearned && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkLearned(word.id);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                  ${isLearned
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-400'
                  }`}
                title={isLearned ? 'Đã học' : 'Đánh dấu đã học'}
              >
                {isLearned ? '✓' : ''}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {showDetails && (
        <div
          className="px-4 pb-4 pt-2 border-t space-y-3"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          {/* Examples */}
          {word.examples && word.examples.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">📝 Ví dụ:</p>
              <ul className="space-y-1">
                {word.examples.map((ex, i) => (
                  <li
                    key={i}
                    className="text-sm italic pl-3 border-l-2"
                    style={{
                      borderColor: articleColor,
                      color: 'var(--theme-text-secondary)',
                    }}
                  >
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          {word.tips && word.tips.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">💡 Mẹo nhớ:</p>
              <ul className="space-y-1">
                {word.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Image */}
          {word.imageUrl && (
            <div className="mt-2">
              <img
                src={word.imageUrl}
                alt={word.word}
                className="w-full max-w-50 h-auto rounded-lg"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}