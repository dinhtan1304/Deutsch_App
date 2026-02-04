'use client';

import { useEffect, useCallback, useState } from 'react';
import { Word, GenderInfo } from '@/types';
import { useSettingsStore } from '@/stores/settingsStore';
import { GenderTip } from './GenderTip';

interface WordDetailModalProps {
  word: Word | null;
  isOpen: boolean;
  onClose: () => void;
  onFavoriteToggle?: (wordId: string) => void;
  isFavorite?: boolean;
}

export function WordDetailModal({ 
  word, 
  isOpen, 
  onClose, 
  onFavoriteToggle,
  isFavorite = false 
}: WordDetailModalProps) {
  const { settings } = useSettingsStore();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset image error when word changes
  useEffect(() => {
    setImageError(false);
  }, [word?.id]);

  // Text-to-speech
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = settings.speechRate;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, [settings.speechRate]);

  // Auto-play sound when modal opens
  useEffect(() => {
    if (isOpen && word && settings.autoPlaySound && settings.soundEnabled) {
      const timer = setTimeout(() => {
        speak(`${word.article} ${word.word}`);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, word, settings.autoPlaySound, settings.soundEnabled, speak]);

  if (!isOpen || !word) return null;

  const genderInfo = GenderInfo[word.gender];
  const genderStyles = {
    masculine: {
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      bg: 'rgba(59, 130, 246, 0.1)',
      text: '#3b82f6',
    },
    feminine: {
      gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      bg: 'rgba(236, 72, 153, 0.1)',
      text: '#ec4899',
    },
    neuter: {
      gradient: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
      bg: 'rgba(34, 197, 94, 0.1)',
      text: '#22c55e',
    },
  };
  const styles = genderStyles[word.gender];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
        style={{ 
          backgroundColor: 'var(--theme-bg-card, #ffffff)',
          animation: 'modalIn 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div 
          className="relative p-6 text-white"
          style={{ background: styles.gradient }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all text-xl"
          >
            ✕
          </button>

          {/* Favorite button */}
          {onFavoriteToggle && (
            <button
              onClick={() => onFavoriteToggle(word.id)}
              className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all text-xl"
            >
              {isFavorite ? '⭐' : '☆'}
            </button>
          )}

          {/* Word with article */}
          <div className="text-center pt-6 pb-2">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="text-3xl md:text-4xl font-bold opacity-90">
                {word.article}
              </span>
              <span className="text-3xl md:text-4xl font-bold">
                {word.word}
              </span>
              
              {/* Speaker button */}
              <button
                onClick={() => speak(`${word.article} ${word.word}`)}
                className={`w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all text-xl ${isSpeaking ? 'animate-pulse' : ''}`}
                disabled={isSpeaking}
              >
                🔊
              </button>
            </div>

            {/* Plural */}
            {word.plural && (
              <p className="mt-2 text-white/80">
                Plural: <span className="font-medium">die {word.plural}</span>
              </p>
            )}

            {/* Pronunciation */}
            {settings.showPronunciation && word.pronunciation && (
              <p className="mt-1 text-white/70 text-lg">
                [{word.pronunciation}]
              </p>
            )}

            {/* Badges */}
            <div className="flex justify-center gap-2 mt-4 flex-wrap">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20">
                {genderInfo.label}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20">
                {word.level}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20">
                {word.category}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Gender Tip - NEW! */}
          <GenderTip word={word.word} gender={word.gender} showDetailed />

          {/* Image */}
          {word.imageUrl && !imageError && (
            <div className="rounded-xl overflow-hidden shadow-md">
              <img 
                src={word.imageUrl} 
                alt={word.word}
                className="w-full h-48 object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          )}

          {/* Translations */}
          <div>
            <h3 
              className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2"
              style={{ color: styles.text }}
            >
              <span>📖</span> Nghĩa
            </h3>
            <div className="space-y-2">
              <div 
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: 'var(--theme-bg-secondary, #f3f4f6)' }}
              >
                <span className="text-xl">🇬🇧</span>
                <span 
                  className="text-lg"
                  style={{ color: 'var(--theme-text-primary, #111827)' }}
                >
                  {word.translationEn}
                </span>
              </div>
              {settings.showVietnamese && word.translationVi && (
                <div 
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--theme-bg-secondary, #f3f4f6)' }}
                >
                  <span className="text-xl">🇻🇳</span>
                  <span 
                    className="text-lg"
                    style={{ color: 'var(--theme-text-primary, #111827)' }}
                  >
                    {word.translationVi}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Examples */}
          {settings.showExamples && word.examples && word.examples.length > 0 && (
            <div>
              <h3 
                className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2"
                style={{ color: styles.text }}
              >
                <span>💬</span> Ví dụ ({word.examples.length})
              </h3>
              <div className="space-y-2">
                {word.examples.map((example, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-xl border-l-4"
                    style={{ 
                      backgroundColor: styles.bg,
                      borderColor: styles.text
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p 
                        className="italic flex-1"
                        style={{ color: 'var(--theme-text-primary, #111827)' }}
                      >
                        "{example}"
                      </p>
                      <button
                        onClick={() => speak(example)}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/50 transition-colors"
                      >
                        🔊
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips from database */}
          {word.tips && word.tips.length > 0 && (
            <div>
              <h3 
                className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2"
                style={{ color: '#eab308' }}
              >
                <span>🎯</span> Ghi chú ({word.tips.length})
              </h3>
              <div className="space-y-2">
                {word.tips.map((tip, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-xl border-l-4"
                    style={{ 
                      backgroundColor: 'rgba(234, 179, 8, 0.1)',
                      borderColor: '#eab308'
                    }}
                  >
                    <p style={{ color: 'var(--theme-text-primary, #111827)' }}>
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="p-4 border-t"
          style={{ borderColor: 'var(--theme-border, #e5e7eb)' }}
        >
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl font-medium text-white transition-all hover:opacity-90"
            style={{ background: styles.gradient }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}