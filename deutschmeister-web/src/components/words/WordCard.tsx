'use client';

import { useState } from 'react';
import { Word, GenderInfo } from '@/types';
import { WordDetailModal } from './WordDetailModal';
import { useSettingsStore } from '@/stores/settingsStore';
import { IconStar } from '@/components/ui/Icons';

interface WordCardProps {
  word: Word;
  onFavoriteToggle?: (wordId: string) => void;
  isFavorite?: boolean;
  showFavoriteButton?: boolean;
  compact?: boolean;
}

const GENDER_STYLES = {
  masculine: {
    border: '#3B82F6',
    bg: 'rgba(59,130,246,.08)',
    text: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    glow: 'rgba(59,130,246,.15)',
  },
  feminine: {
    border: '#EC4899',
    bg: 'rgba(236,72,153,.08)',
    text: '#EC4899',
    gradient: 'linear-gradient(135deg, #EC4899, #BE185D)',
    glow: 'rgba(236,72,153,.15)',
  },
  neuter: {
    border: '#22C55E',
    bg: 'rgba(34,197,94,.08)',
    text: '#22C55E',
    gradient: 'linear-gradient(135deg, #22C55E, #15803D)',
    glow: 'rgba(34,197,94,.15)',
  },
};

// ─── Speaker SVG Icon ───
function IconVolume({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={{ display: 'block', flexShrink: 0 }}>
      <path d="M11 5 6 9H2v6h4l5 4zM15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

export function WordCard({
  word,
  onFavoriteToggle,
  isFavorite = false,
  showFavoriteButton = true,
  compact = false,
}: WordCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { settings } = useSettingsStore();

  const genderInfo = GenderInfo[word.gender];
  const gs = GENDER_STYLES[word.gender];

  const handleCardClick = () => setIsModalOpen(true);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(word.id);
  };

  const speakWord = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && settings.soundEnabled) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(`${word.article} ${word.word}`);
      u.lang = 'de-DE';
      u.rate = settings.speechRate;
      window.speechSynthesis.speak(u);
    }
  };

  const hasImage = word.imageUrl && !imageError;

  // ─── Compact variant ───
  if (compact) {
    return (
      <>
        <div
          onClick={handleCardClick}
          className="group relative rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border"
          style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: gs.border }}
        >
          <div className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-white"
                  style={{ background: gs.gradient }}>
                  {word.article}
                </span>
                <span className="font-bold text-[14px] truncate"
                  style={{ color: 'var(--theme-text-primary)' }}>
                  {word.word}
                </span>
              </div>
              <p className="text-[12px] mt-0.5 truncate"
                style={{ color: 'var(--theme-text-muted)' }}>
                {word.translationVi || word.translationEn}
              </p>
            </div>
            <button onClick={speakWord}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ backgroundColor: gs.bg, color: gs.text }}>
              <IconVolume size={14} />
            </button>
            {showFavoriteButton && onFavoriteToggle && (
              <button onClick={handleFavoriteClick}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{
                  backgroundColor: isFavorite ? 'rgba(234,179,8,.15)' : 'var(--theme-bg-secondary)',
                  color: isFavorite ? '#EAB308' : 'var(--theme-text-muted)',
                }}>
                <IconStar size={14} style={isFavorite ? { fill: '#EAB308' } : {}} />
              </button>
            )}
          </div>
        </div>
        <WordDetailModal word={word} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
          onFavoriteToggle={onFavoriteToggle} isFavorite={isFavorite} />
      </>
    );
  }

  // ─── Full card ───
  return (
    <>
      <div
        onClick={handleCardClick}
        className="group relative rounded-2xl cursor-pointer transition-all duration-300
          hover:shadow-lg hover:-translate-y-1 border"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
          borderLeftWidth: '3px',
          borderLeftColor: gs.border,
        }}
      >
        <div className="p-4">
          {/* Top row: article + word + actions */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-[12px] font-bold px-2.5 py-1 rounded-lg text-white shadow-sm"
                style={{ background: gs.gradient }}>
                {word.article}
              </span>
              <span className="text-[17px] font-bold truncate"
                style={{ color: 'var(--theme-text-primary)' }}>
                {word.word}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={speakWord}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                  hover:scale-110"
                style={{ backgroundColor: gs.bg, color: gs.text }}
              >
                <IconVolume size={16} />
              </button>
              {showFavoriteButton && onFavoriteToggle && (
                <button
                  onClick={handleFavoriteClick}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                    hover:scale-110"
                  style={{
                    backgroundColor: isFavorite ? 'rgba(234,179,8,.12)' : 'var(--theme-bg-secondary)',
                    color: isFavorite ? '#EAB308' : 'var(--theme-text-muted)',
                  }}
                >
                  <IconStar size={16} style={isFavorite ? { fill: '#EAB308' } : {}} />
                </button>
              )}
            </div>
          </div>

          {/* Pronunciation */}
          {settings.showPronunciation && word.pronunciation && (
            <p className="text-[12px] mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>
              [{word.pronunciation}]
            </p>
          )}

          {/* Translations */}
          <div className="space-y-0.5 mb-3">
            <p className="text-[13px]" style={{ color: 'var(--theme-text-primary)' }}>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded mr-1.5"
                style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                EN
              </span>
              {word.translationEn}
            </p>
            {settings.showVietnamese && word.translationVi && (
              <p className="text-[13px]" style={{ color: 'var(--theme-text-secondary)' }}>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded mr-1.5"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                  VN
                </span>
                {word.translationVi}
              </p>
            )}
          </div>

          {/* Tags row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
              style={{ backgroundColor: gs.bg, color: gs.text }}>
              {genderInfo.label}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              {word.level}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              {word.category}
            </span>

            {/* Image thumbnail */}
            {hasImage && (
              <div className="ml-auto w-10 h-10 rounded-lg overflow-hidden shadow-sm shrink-0 border"
                style={{ borderColor: gs.glow }}>
                <img src={word.imageUrl!} alt={word.word}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={() => setImageError(true)} />
              </div>
            )}
          </div>

          {/* Example preview */}
          {settings.showExamples && word.examples && word.examples.length > 0 && (
            <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid var(--theme-border)' }}>
              <p className="text-[12px] italic line-clamp-1" style={{ color: 'var(--theme-text-muted)' }}>
                💬 „{word.examples[0]}"
              </p>
            </div>
          )}

          {/* Hover hint */}
          <p className="text-center text-[11px] mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ color: gs.text }}>
            Nhấn để xem chi tiết →
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