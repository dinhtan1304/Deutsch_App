'use client';

import { useState } from 'react';
import { Word, GenderInfo } from '@/types';
import { WordDetailModal } from './WordDetailModal';
import { useSettingsStore } from '@/stores/settingsStore';

interface WordCardProps {
  word: Word;
  onFavoriteToggle?: (wordId: string) => void;
  isFavorite?: boolean;
  showFavoriteButton?: boolean;
  compact?: boolean;
}

export function WordCard({ 
  word, 
  onFavoriteToggle, 
  isFavorite = false,
  showFavoriteButton = true,
  compact = false
}: WordCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { settings } = useSettingsStore();

  const genderInfo = GenderInfo[word.gender];
  
  const genderStyles = {
    masculine: {
      border: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)',
      text: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    },
    feminine: {
      border: '#ec4899',
      bg: 'rgba(236, 72, 153, 0.1)',
      text: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    },
    neuter: {
      border: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.1)',
      text: '#22c55e',
      gradient: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
    },
  };
  const styles = genderStyles[word.gender];

  const handleCardClick = () => setIsModalOpen(true);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(word.id);
  };

  const speakWord = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && settings.soundEnabled) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${word.article} ${word.word}`);
      utterance.lang = 'de-DE';
      utterance.rate = settings.speechRate;
      window.speechSynthesis.speak(utterance);
    }
  };

  const hasImage = word.imageUrl && !imageError;

  // Compact version
  if (compact) {
    return (
      <>
        <div
          onClick={handleCardClick}
          className="group relative rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
          style={{
            backgroundColor: 'var(--theme-bg-card, #ffffff)',
            border: `2px solid ${styles.border}`,
          }}
        >
          <div className="p-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span 
                  className="text-xs font-bold px-2 py-0.5 rounded text-white"
                  style={{ background: styles.gradient }}
                >
                  {word.article}
                </span>
                <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                  {word.word}
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
                {word.translationEn}
              </p>
            </div>
            <button onClick={speakWord} className="p-1.5 rounded-full hover:bg-black/10">🔊</button>
            {showFavoriteButton && onFavoriteToggle && (
              <button onClick={handleFavoriteClick} className="text-lg">{isFavorite ? '⭐' : '☆'}</button>
            )}
          </div>
        </div>
        <WordDetailModal word={word} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onFavoriteToggle={onFavoriteToggle} isFavorite={isFavorite} />
      </>
    );
  }

  // Full card
  return (
    <>
      <div
        onClick={handleCardClick}
        className="group relative rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.01]"
        style={{
          backgroundColor: 'var(--theme-bg-card, #ffffff)',
          borderLeft: `4px solid ${styles.border}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <div className="p-4">
          {/* Main content row */}
          <div className="flex gap-3">
            {/* Left: Word info */}
            <div className="flex-1 min-w-0">
              {/* Article + Word + Speaker */}
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span 
                  className="text-sm font-bold px-2 py-0.5 rounded text-white"
                  style={{ background: styles.gradient }}
                >
                  {word.article}
                </span>
                <span 
                  className="text-lg font-bold"
                  style={{ color: 'var(--theme-text-primary, #111827)' }}
                >
                  {word.word}
                </span>
                <button
                  onClick={speakWord}
                  className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:scale-110 text-sm"
                  style={{ backgroundColor: 'var(--theme-bg-secondary, #f3f4f6)' }}
                >
                  🔊
                </button>
              </div>
              
              {/* IPA */}
              {settings.showPronunciation && word.pronunciation && (
                <p className="text-sm mb-1" style={{ color: 'var(--theme-text-secondary, #6b7280)' }}>
                  [{word.pronunciation}]
                </p>
              )}

              {/* Translations */}
              <div className="space-y-0.5 mb-2">
                <p className="text-sm" style={{ color: 'var(--theme-text-primary, #111827)' }}>
                  <span className="opacity-70 mr-1">EN</span> {word.translationEn}
                </p>
                {settings.showVietnamese && word.translationVi && (
                  <p className="text-sm" style={{ color: 'var(--theme-text-secondary, #6b7280)' }}>
                    <span className="opacity-70 mr-1">VN</span> {word.translationVi}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                <span 
                  className="px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: styles.bg, color: styles.text }}
                >
                  {genderInfo.label}
                </span>
                <span 
                  className="px-1.5 py-0.5 rounded text-xs"
                  style={{ backgroundColor: 'var(--theme-bg-secondary, #f3f4f6)', color: 'var(--theme-text-secondary, #6b7280)' }}
                >
                  {word.level}
                </span>
                <span 
                  className="px-1.5 py-0.5 rounded text-xs"
                  style={{ backgroundColor: 'var(--theme-bg-secondary, #f3f4f6)', color: 'var(--theme-text-secondary, #6b7280)' }}
                >
                  {word.category}
                </span>
              </div>
            </div>

            {/* Right: Favorite + Image */}
            <div className="flex flex-col items-end gap-2">
              {showFavoriteButton && onFavoriteToggle && (
                <button
                  onClick={handleFavoriteClick}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-all text-lg hover:scale-110"
                  style={{ backgroundColor: isFavorite ? 'rgba(234, 179, 8, 0.2)' : 'var(--theme-bg-secondary, #f3f4f6)' }}
                >
                  {isFavorite ? '⭐' : '☆'}
                </button>
              )}
              
              {hasImage && (
                <div 
                  className="w-16 h-16 rounded-xl overflow-hidden shadow-sm flex-shrink-0"
                  style={{ border: `2px solid ${styles.border}` }}
                >
                  <img 
                    src={word.imageUrl!} 
                    alt={word.word}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    onError={() => setImageError(true)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Example preview */}
          {settings.showExamples && word.examples && word.examples.length > 0 && (
            <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--theme-border, #e5e7eb)' }}>
              <p className="text-xs italic line-clamp-1" style={{ color: 'var(--theme-text-secondary, #6b7280)' }}>
                💬 "{word.examples[0]}"
              </p>
            </div>
          )}

          {/* Hover hint */}
          <p 
            className="text-center text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: styles.text }}
          >
            Click để xem chi tiết →
          </p>
        </div>
      </div>

      <WordDetailModal
        word={word}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFavoriteToggle={onFavoriteToggle}
        isFavorite={isFavorite}
      />
    </>
  );
}