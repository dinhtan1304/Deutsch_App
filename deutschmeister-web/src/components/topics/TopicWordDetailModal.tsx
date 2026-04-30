import { TopicWord, ArticleColor } from '@/types/topic';
/* eslint-disable no-restricted-syntax */
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { IconVolume, IconLightbulb, IconX } from '@/components/ui/Icons';
import { useEffect, useRef } from 'react';

interface TopicWordDetailModalProps {
  word: TopicWord;
  onClose: () => void;
  onSpeak: (text: string) => void;
}

export function TopicWordDetailModal({ word, onClose, onSpeak }: TopicWordDetailModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const ac = word.article ? (ArticleColor[word.article] || { color: '#6B7280', bg: 'rgba(107,114,128,.1)' }) : { color: '#6B7280', bg: 'rgba(107,114,128,.1)' };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSpeak = () => {
    onSpeak(word.article ? `${word.article} ${word.word}` : word.word);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <div ref={ref} onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết: ${word.word}`}
        className="relative w-full max-w-lg p-6 rounded-2xl shadow-xl overflow-hidden"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderTop: `6px solid ${ac.color}` }}>

        <button onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: 'var(--theme-text-muted)' }}>
          <IconX size={20} />
        </button>

        <div className="flex items-start justify-between gap-4 pr-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {word.article ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{ backgroundColor: ac.bg, color: ac.color }}>
                  Danh từ
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                  Khác
                </span>
              )}
              {word.isCore && (
                <span className="px-2 py-1 rounded text-xs font-bold"
                  style={{ backgroundColor: 'rgba(245,158,11,.1)', color: ACCENT.xp }}>
                  Core Word
                </span>
              )}
            </div>
            
            <div className="text-3xl mb-2 font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {word.article && <span style={{ color: ac.color }} className="mr-2">{word.article}</span>}
              {word.word}
            </div>
            
            {word.plural && (
              <div className="mb-4">
                <span className="text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                  Số nhiều (Plural): die {word.plural}
                </span>
              </div>
            )}
            
            <div className="flex flex-col gap-2 mt-4 text-sm">
              {word.translationVi && (
                <div className="flex items-start gap-2.5" style={{ color: 'var(--theme-text-primary)' }}>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0"
                    style={{ backgroundColor: 'rgba(239,68,68,.08)', color: STATUS.danger }}>VN</span>
                  <span className="leading-relaxed font-medium">{word.translationVi}</span>
                </div>
              )}
              {word.translationEn && (
                <div className="flex items-start gap-2.5" style={{ color: 'var(--theme-text-secondary)' }}>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0"
                    style={{ backgroundColor: 'rgba(59,130,246,.1)', color: ACCENT.srs }}>EN</span>
                  <span className="leading-relaxed">{word.translationEn}</span>
                </div>
              )}
            </div>

          </div>
        </div>

        {((word.examples?.length ?? 0) > 0 || (word.tips?.length ?? 0) > 0) && (
          <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--theme-border)' }}>
            {word.examples && word.examples.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>Ví dụ</p>
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

            {word.tips && word.tips.length > 0 && (
              <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(245,158,11,.05)', color: '#D97706' }}>
                <div className="flex flex-col gap-2">
                  {word.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                      <IconLightbulb size={16} className="shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          <button onClick={handleSpeak}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all text-sm hover:scale-[1.02]"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' }}>
            <IconVolume size={16} /> Phát âm
          </button>
        </div>

      </div>
    </div>
  );
}
