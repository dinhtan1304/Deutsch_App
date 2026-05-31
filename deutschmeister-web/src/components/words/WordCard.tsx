'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { STATUS, ACCENT } from '@/lib/tokens';
import { Word } from '@/types';
import type { Level } from '@/types/personalWord';
import { WordDetailModal } from './WordDetailModal';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAddToHistory } from '@/hooks/useHistory';
import { IconVolume, IconStar, IconPlus, IconCheck, IconFlame } from '@/components/ui/Icons';
import { ArticleChip, type Article } from '@/components/ui/ArticleChip';
import { useCreatePersonalWord } from '@/hooks/usePersonalWords';
import { speakGerman, prefetchAudio } from '@/lib/utils';

// Map grammatical gender → German article (v2 color-code lives in ArticleChip).
const GENDER_ARTICLE: Record<string, Article> = {
  masculine: 'der',
  feminine: 'die',
  neuter: 'das',
};

interface WordCardProps {
  word: Word;
  onFavoriteToggle?: (wordId: string) => void;
  isFavorite?: boolean;
  showFavoriteButton?: boolean;
  compact?: boolean;
  /** SRS mastery 0–1 (drives the bottom progress bar). Undefined = not studied (new). */
  mastery?: number;
  /** Word is due for review (shows the "due" badge). */
  due?: boolean;
}

// SRS mastery → color (matches design: learned green / learning amber / new mute).
function masteryColor(m: number): string {
  if (m >= 0.85) return 'var(--m-learned)';
  if (m >= 0.3) return 'var(--m-learning)';
  return 'var(--m-new)';
}

export function WordCard({
  word,
  onFavoriteToggle,
  isFavorite = false,
  showFavoriteButton = true,
  compact = false,
  mastery,
  due = false,
}: WordCardProps) {
  const t = useTranslations('vocabulary.wordCard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addedToBank, setAddedToBank] = useState(false);
  const { settings } = useSettingsStore();
  const addToHistory = useAddToHistory();
  const createPersonalWord = useCreatePersonalWord();

  const art: Article = GENDER_ARTICLE[word.gender] ?? 'das';

  // v2 article color-code via CSS vars (--der/--die/--das). soft = 14% tint.
  const genderStyles = {
    masculine: { color: 'var(--der)', bg: 'color-mix(in srgb, var(--der) 14%, transparent)' },
    feminine: { color: 'var(--die)', bg: 'color-mix(in srgb, var(--die) 14%, transparent)' },
    neuter: { color: 'var(--das)', bg: 'color-mix(in srgb, var(--das) 14%, transparent)' },
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

  // Compact version
  if (compact) {
    return (
      <>
        <div
          onClick={handleCardClick}
          className="word-card-v2 group relative rounded-xl cursor-pointer overflow-hidden"
          style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', ['--card-accent' as string]: styles.color } as React.CSSProperties}
        >
          <div className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <ArticleChip article={art} size="sm" />
                <span className="font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>
                  {word.word}
                </span>
              </div>
              <p className="text-sm mt-1 truncate" style={{ color: 'var(--theme-text-secondary)' }}>
                {word.translationEn}
              </p>
            </div>
            <button onClick={speakWord} onMouseEnter={prewarmAudio} onFocus={prewarmAudio}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 shrink-0"
              style={{ backgroundColor: styles.bg, color: styles.color }}>
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

  // Full card — v2: word as hero, article color-code, IPA, example, footer chips.
  const primaryMeaning = (settings.showVietnamese && word.translationVi) ? word.translationVi : word.translationEn;
  const secondaryMeaning = (settings.showVietnamese && word.translationVi) ? word.translationEn : null;

  return (
    <>
      <div
        onClick={handleCardClick}
        className="word-card-v2 group relative rounded-[14px] cursor-pointer overflow-hidden flex flex-col gap-3 p-4.5"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          border: '1px solid var(--theme-border)',
          ['--card-accent' as string]: styles.color,
        } as React.CSSProperties}
      >
        {/* Header: article chip + due badge + speaker */}
        <div className="flex items-center justify-between">
          <ArticleChip article={art} filled />
          <div className="flex items-center gap-1.5">
            {due && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                style={{ background: 'var(--streak-soft)', color: 'var(--streak)', letterSpacing: '.04em' }}>
                <IconFlame size={9} /> {t('due')}
              </span>
            )}
            <button onClick={speakWord} onMouseEnter={prewarmAudio} onFocus={prewarmAudio}
              className="w-7.5 h-7.5 flex items-center justify-center rounded-lg transition-all hover:scale-110"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: styles.color }}
              title={t('listen')}>
              <IconVolume size={14} />
            </button>
          </div>
        </div>

        {/* Hero: word + IPA */}
        <div>
          <h3 className="font-bold" style={{ fontSize: 28, letterSpacing: '-.02em', lineHeight: 1.1, color: 'var(--theme-text-primary)' }}>
            {word.word}
          </h3>
          {settings.showPronunciation && word.pronunciation && (
            <span className="mono inline-block mt-1 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
              [{word.pronunciation}]
            </span>
          )}
        </div>

        {/* Meaning */}
        <div>
          <div className="font-medium" style={{ fontSize: 15, lineHeight: 1.3, color: 'var(--theme-text-primary)' }}>{primaryMeaning}</div>
          {secondaryMeaning && (
            <div className="text-caption italic mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{secondaryMeaning}</div>
          )}
        </div>

        {/* Example */}
        {settings.showExamples && word.examples && word.examples.length > 0 && (
          <div
            className="text-caption rounded-[9px] px-3 py-2.5 line-clamp-2"
            style={{
              background: 'var(--theme-bg-secondary)',
              borderLeft: `2px solid ${styles.color}`,
              color: 'var(--theme-text-secondary)',
              lineHeight: 1.5,
            }}
          >
            „{word.examples[0]}&quot;
          </div>
        )}

        {/* Footer: level + category + actions */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="mono text-caption font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
              {word.level}
            </span>
            <span className="inline-flex items-center gap-1.5 text-caption px-2 py-0.5 rounded min-w-0"
              style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: styles.color }} />
              <span className="truncate">{word.category}</span>
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {showFavoriteButton && onFavoriteToggle && (
              <button onClick={handleFavoriteClick}
                className="w-7 h-7 flex items-center justify-center rounded-md transition-all hover:scale-110"
                style={{ color: isFavorite ? ACCENT.xp : 'var(--theme-text-muted)' }}
                title={isFavorite ? t('removeFavorite') : t('addFavorite')}>
                <IconStar size={14} style={isFavorite ? { fill: ACCENT.xp } : {}} />
              </button>
            )}
            <button onClick={handleAddToBank}
              className="w-7 h-7 flex items-center justify-center rounded-md transition-all hover:scale-110"
              style={{ color: addedToBank ? STATUS.success : 'var(--theme-text-muted)' }}
              title={addedToBank ? t('addedToBank') : t('addToBank')}>
              {addedToBank ? <IconCheck size={14} /> : <IconPlus size={14} />}
            </button>
          </div>
        </div>

        {/* Mastery bar (v2) — empty track for unstudied dictionary words */}
        <div className="absolute left-0 right-0 bottom-0 h-0.75" style={{ background: 'var(--theme-bg-secondary)' }}>
          <div className="h-full transition-[width] duration-300" style={{ width: `${Math.round((mastery ?? 0) * 100)}%`, background: masteryColor(mastery ?? 0) }} />
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
