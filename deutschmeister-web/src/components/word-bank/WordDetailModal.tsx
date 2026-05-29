'use client';

import { PersonalWord, WordTypeInfo, GenderInfo, Gender } from '@/types/personalWord';
import { ACCENT, STATUS } from '@/lib/tokens';
import { IconVolume, IconStar, IconLightbulb, IconX } from '@/components/ui/Icons';
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface WordDetailModalProps {
  word: PersonalWord;
  onClose: () => void;
  onSpeak: (text: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function WordDetailModal({ word, onClose, onSpeak, onToggleFavorite }: WordDetailModalProps) {
  const t = useTranslations('vocabulary.wordBank.wordDetail');
  const typeInfo = WordTypeInfo[word.wordType] ?? WordTypeInfo['andere'];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const displayWord = () => {
    if (word.wordType === 'nomen' && word.nomenData) {
      const gc = GenderInfo[word.nomenData.gender as Gender] ?? GenderInfo['neuter'];
      return (
        <span>
          <span style={{ color: gc.color }} className="font-bold">{word.nomenData.article}</span>{' '}
          <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>{word.word}</span>
        </span>
      );
    }
    return <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>{word.word}</span>;
  };

  const renderDetails = () => {
    const chipStyle = (bg: string, fg: string): React.CSSProperties => ({ backgroundColor: bg, color: fg });
    switch (word.wordType) {
      case 'nomen':
        return word.nomenData?.plural
          ? <span className="text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>Pl: die {word.nomenData.plural}</span>
          : null;
      case 'verb':
        return (
          <div className="flex flex-wrap gap-2">
            {word.verbData?.partizipII && <span className="px-2 py-1 rounded text-sm font-medium" style={chipStyle('rgba(239,68,68,.1)', STATUS.danger)}>{word.verbData.partizipII}</span>}
            {word.verbData?.hilfsverb && <span className="px-2 py-1 rounded text-sm font-medium" style={chipStyle('var(--theme-bg-secondary)', 'var(--theme-text-muted)')}>+{word.verbData.hilfsverb}</span>}
            {word.verbData?.trennbar && <span className="px-2 py-1 rounded text-sm font-medium" style={chipStyle('rgba(139,92,246,.1)', ACCENT.vocab)}>trennbar</span>}
          </div>
        );
      case 'adjektiv':
        return (word.adjektivData?.komparativ || word.adjektivData?.superlativ) ? (
          <div className="flex flex-wrap gap-2">
            {word.adjektivData.komparativ && <span className="px-2 py-1 rounded text-sm font-medium" style={chipStyle(`${ACCENT.xp}1a`, ACCENT.xpDark)}>{word.adjektivData.komparativ}</span>}
            {word.adjektivData.superlativ && <span className="px-2 py-1 rounded text-sm font-medium" style={chipStyle(`${ACCENT.xp}1a`, ACCENT.xpDark)}>{word.adjektivData.superlativ}</span>}
          </div>
        ) : null;
      case 'praposition':
        return word.prapositionData?.kasus ? (
          <div className="flex flex-wrap gap-2">
            {word.prapositionData.kasus.map(k => <span key={k} className="px-2 py-1 rounded text-sm font-medium" style={chipStyle('rgba(236,72,153,.1)', ACCENT.listening)}>+{k}</span>)}
          </div>
        ) : null;
      default:
        return null;
    }
  };

  const handleSpeak = () => {
    onSpeak(word.wordType === 'nomen' && word.nomenData ? `${word.nomenData.article} ${word.word}` : word.word);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <div ref={ref} onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('detailAria', { word: word.word })}
        className="relative w-full max-w-lg p-6 rounded-2xl shadow-xl overflow-hidden"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderTop: `6px solid ${typeInfo.color}` }}>

        <button onClick={onClose}
          aria-label={t('close')}
          className="absolute top-4 right-4 p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: 'var(--theme-text-muted)' }}>
          <IconX size={20} />
        </button>

        <div className="flex items-start justify-between gap-4 pr-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: typeInfo.color }}>
                {typeInfo.icon} {typeInfo.labelDe}
              </span>
              <span className="px-2 py-1 rounded text-xs font-bold"
                style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                {word.level}
              </span>
              {word.category && (
                <span className="px-2 py-1 rounded text-xs font-bold"
                  style={{ backgroundColor: 'rgba(59,130,246,.08)', color: ACCENT.srs }}>
                  {word.category}
                </span>
              )}
            </div>
            
            <div className="text-3xl mb-2">{displayWord()}</div>
            {word.pronunciation && (
              <p className="text-base mb-2 font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                [{word.pronunciation}]
              </p>
            )}
            <div className="mb-4">{renderDetails()}</div>
            
            <div className="flex flex-col gap-2 mt-4 text-sm">
              {word.translationVi && (
                <div className="flex items-start gap-2.5" style={{ color: 'var(--theme-text-primary)' }}>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded mt-0.5"
                    style={{ backgroundColor: 'rgba(239,68,68,.08)', color: STATUS.danger }}>VN</span>
                  <span className="leading-relaxed font-medium">{word.translationVi}</span>
                </div>
              )}
              {word.translationEn && (
                <div className="flex items-start gap-2.5" style={{ color: 'var(--theme-text-secondary)' }}>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded mt-0.5"
                    style={{ backgroundColor: 'rgba(59,130,246,.1)', color: ACCENT.srs }}>EN</span>
                  <span className="leading-relaxed">{word.translationEn}</span>
                </div>
              )}
            </div>

          </div>
        </div>

        {(word.examples?.length > 0 || word.notes || (word.tags && word.tags.length > 0)) && (
          <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--theme-border)' }}>
            {word.examples?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>{t('examplesHeader')}</p>
                <div className="flex flex-col gap-2">
                  {word.examples.map((ex, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm italic leading-relaxed" style={{ color: 'var(--theme-text-primary)' }}>
                      <IconVolume size={14} className="mt-1 shrink-0 opacity-50 cursor-pointer hover:opacity-100 transition-opacity" onClick={() => onSpeak(ex)} />
                      <span>{ex}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {word.notes && (
              <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: `${ACCENT.xp}0d`, color: ACCENT.xpDark }}>
                <div className="flex items-start gap-2 text-sm leading-relaxed">
                  <IconLightbulb size={16} className="shrink-0 mt-0.5" />
                  <span>{word.notes}</span>
                </div>
              </div>
            )}

            {word.tags && word.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {word.tags.map((t, i) => (
                  <span key={i} className="px-2 py-1 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          <button onClick={handleSpeak}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all text-sm"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' }}>
            <IconVolume size={16} /> {t('speak')}
          </button>
          <button onClick={() => onToggleFavorite(word.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all text-sm"
            style={{ backgroundColor: word.isFavorite ? 'rgba(245,158,11,.1)' : 'var(--theme-bg-secondary)', color: word.isFavorite ? ACCENT.xp : 'var(--theme-text-primary)' }}>
            <IconStar size={16} style={word.isFavorite ? { fill: ACCENT.xp } : {}} /> {word.isFavorite ? t('favorited') : t('favorite')}
          </button>
        </div>

      </div>
    </div>
  );
}
