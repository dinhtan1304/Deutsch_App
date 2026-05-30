'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { STATUS, GRADIENT, ACCENT } from '@/lib/tokens';
import { Word, GenderInfo } from '@/types';
import type { Level } from '@/types/personalWord';
import { WordDetailModal } from './WordDetailModal';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAddToHistory } from '@/hooks/useHistory';
import { IconVolume, IconStar, IconPlus, IconCheck } from '@/components/ui/Icons';
import { useCreatePersonalWord } from '@/hooks/usePersonalWords';
import { speakGerman, prefetchAudio } from '@/lib/utils';
import Image from 'next/image'

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
  const t = useTranslations('vocabulary.wordCard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [addedToBank, setAddedToBank] = useState(false);
  const { settings } = useSettingsStore();
  const addToHistory = useAddToHistory();
  const createPersonalWord = useCreatePersonalWord();

  const genderInfo = GenderInfo[word.gender] ?? { label: word.gender || 'n', article: 'das', color: ACCENT.reading };

  const genderStyles = {
    masculine: {
      border: ACCENT.srs,
      bg: `${ACCENT.srs}1a`,
      text: ACCENT.srs,
      gradient: GRADIENT.der,
    },
    feminine: {
      border: ACCENT.listening,
      bg: `${ACCENT.listening}1a`,
      text: ACCENT.listening,
      gradient: GRADIENT.die,
    },
    neuter: {
      border: ACCENT.reading,
      bg: `${ACCENT.reading}1a`,
      text: ACCENT.reading,
      gradient: GRADIENT.das,
    },
  };
  const styles = genderStyles[word.gender] ?? genderStyles.neuter;

  const handleCardClick = () => {
    setIsModalOpen(true);
    try { addToHistory.mutate(word.id); } catch { /* ignore */ }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(word.id);
  };

  const handleAddToBank = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (addedToBank || createPersonalWord.isPending) return;
    try {
      await createPersonalWord.mutateAsync({
        word: word.word,
        wordType: 'nomen',
        translationEn: word.translationEn,
        translationVi: word.translationVi || '',
        nomenData: { article: word.article, gender: word.gender, plural: word.plural || '' },
        level: word.level as Level,
        category: word.category,
        examples: word.examples,
      });
      setAddedToBank(true);
    } catch { /* duplicate or error */ }
  };

  const speakWord = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (settings.soundEnabled) {
      speakGerman(`${word.article} ${word.word}`);
    }
  };

  // Warm the cache on hover so the actual click feels instant (~200ms head
  // start in the common case where the user pauses before clicking).
  const prewarmAudio = () => {
    if (settings.soundEnabled) prefetchAudio(`${word.article} ${word.word}`);
  };

  const hasImage = word.imageUrl && !imageError;

  // Compact version
  if (compact) {
    return (
      <>
        <div
          onClick={handleCardClick}
          className="group relative rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
          style={{ backgroundColor: 'var(--theme-bg-card)', border: `2px solid ${styles.border}` }}
        >
          <div className="p-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded text-white"
                  style={{ background: styles.gradient }}>
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
            <button onClick={speakWord} onMouseEnter={prewarmAudio} onFocus={prewarmAudio}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{ backgroundColor: styles.bg, color: styles.text }}>
              <IconVolume size={15} />
            </button>
            {showFavoriteButton && onFavoriteToggle && (
              <button onClick={handleFavoriteClick}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                style={{ backgroundColor: isFavorite ? `${ACCENT.xp}26` : 'var(--theme-bg-secondary)', color: isFavorite ? ACCENT.xp : 'var(--theme-text-muted)' }}>
                <IconStar size={15} style={isFavorite ? { fill: ACCENT.xp } : {}} />
              </button>
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
        className="group relative rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 overflow-hidden"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderLeft: `4px solid ${styles.border}`,
          boxShadow: '0 2px 8px rgba(0,0,0,.06)',
        }}
      >
        {/* Decorative orb */}
        <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-[0.05] transition-transform duration-500 group-hover:scale-150"
          style={{ backgroundColor: styles.border }} />

        <div className="relative p-4">
          {/* Main content row */}
          <div className="flex gap-3">
            {/* Left: Word info */}
            <div className="flex-1 min-w-0">
              {/* Article + Word + Speaker */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md text-white"
                  style={{ background: styles.gradient }}>
                  {word.article}
                </span>
                <span className="text-title font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                  {word.word}
                </span>
                <button onClick={speakWord} onMouseEnter={prewarmAudio} onFocus={prewarmAudio}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:scale-110"
                  style={{ backgroundColor: styles.bg, color: styles.text }}
                  title={t('listen')}>
                  <IconVolume size={14} />
                </button>
              </div>

              {/* IPA */}
              {settings.showPronunciation && word.pronunciation && (
                <p className="text-xs mb-1.5 font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                  [{word.pronunciation}]
                </p>
              )}

              {/* Translations */}
              <div className="space-y-0.5 mb-2.5">
                <p className="text-body flex items-center gap-1.5" style={{ color: 'var(--theme-text-primary)' }}>
                  <span className="text-caption font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: styles.bg, color: styles.text }}>EN</span>
                  {word.translationEn}
                </p>
                {settings.showVietnamese && word.translationVi && (
                  <p className="text-body flex items-center gap-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
                    <span className="text-caption font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: 'rgba(239,68,68,.08)', color: STATUS.danger }}>VN</span>
                    {word.translationVi}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-0.5 rounded-md text-caption font-medium"
                  style={{ backgroundColor: styles.bg, color: styles.text }}>
                  {genderInfo.label}
                </span>
                <span className="px-2 py-0.5 rounded-md text-caption"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                  {word.level}
                </span>
                <span className="px-2 py-0.5 rounded-md text-caption"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                  {word.category}
                </span>
              </div>
            </div>

            {/* Right: Favorite + Image */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                {showFavoriteButton && onFavoriteToggle && (
                  <button onClick={handleFavoriteClick}
                    className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110"
                    style={{ backgroundColor: isFavorite ? `${ACCENT.xp}26` : 'var(--theme-bg-secondary)', color: isFavorite ? ACCENT.xp : 'var(--theme-text-muted)' }}
                    title={isFavorite ? t('removeFavorite') : t('addFavorite')}>
                    <IconStar size={16} style={isFavorite ? { fill: ACCENT.xp } : {}} />
                  </button>
                )}
                <button onClick={handleAddToBank}
                  className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110"
                  style={{
                    backgroundColor: addedToBank ? 'rgba(34,197,94,.15)' : 'var(--theme-bg-secondary)',
                    color: addedToBank ? STATUS.success : 'var(--theme-text-muted)',
                  }}
                  title={addedToBank ? t('addedToBank') : t('addToBank')}>
                  {addedToBank ? <IconCheck size={14} /> : <IconPlus size={14} />}
                </button>
              </div>

              {hasImage && (
                <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm"
                  style={{ border: `2px solid ${styles.border}22` }}>
                  <Image src={word.imageUrl!} alt={word.word}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={() => setImageError(true)} />
                </div>
              )}
            </div>
          </div>

          {/* Example preview */}
          {settings.showExamples && word.examples && word.examples.length > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--theme-border)' }}>
              <p className="text-xs italic line-clamp-1" style={{ color: 'var(--theme-text-muted)' }}>
                „{word.examples[0]}&quot;
              </p>
            </div>
          )}

          {/* Hover CTA */}
          <p className="text-center text-caption mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium"
            style={{ color: styles.text }}>
            {t('viewDetail')}
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
