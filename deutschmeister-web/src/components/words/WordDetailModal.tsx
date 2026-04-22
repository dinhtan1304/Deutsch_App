'use client';

import { useEffect, useCallback, useState } from 'react';
import { Word, GenderInfo } from '@/types';
import { useSettingsStore } from '@/stores/settingsStore';
import { GenderTip } from './GenderTip';
import { IconStar, IconX, IconVolume, IconCheck, IconPlus, IconLoader, IconBookOpen, IconLightbulb } from '@/components/ui/Icons';
import { useQuickAddWithCollection } from '@/hooks/useQuickAddWithCollection';
import { AddToCollectionPicker } from '@/components/word-bank/AddToCollectionPicker';

interface WordDetailModalProps {
  word: Word | null;
  isOpen: boolean;
  onClose: () => void;
  onFavoriteToggle?: (wordId: string) => void;
  isFavorite?: boolean;
}

const GENDER_STYLES = {
  masculine: {
    gradient: 'linear-gradient(135deg,#3B82F6,#1D4ED8)',
    bg: 'rgba(59,130,246,.1)',
    text: '#3B82F6',
    light: 'rgba(59,130,246,.06)',
  },
  feminine: {
    gradient: 'linear-gradient(135deg,#EC4899,#BE185D)',
    bg: 'rgba(236,72,153,.1)',
    text: '#EC4899',
    light: 'rgba(236,72,153,.06)',
  },
  neuter: {
    gradient: 'linear-gradient(135deg,#22C55E,#15803D)',
    bg: 'rgba(34,197,94,.1)',
    text: '#22C55E',
    light: 'rgba(34,197,94,.06)',
  },
};

export function WordDetailModal({
  word,
  isOpen,
  onClose,
  onFavoriteToggle,
  isFavorite = false,
}: WordDetailModalProps) {
  const { settings } = useSettingsStore();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isAdding, isAdded, pendingWordId, quickAdd, closePicker, reset } = useQuickAddWithCollection();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => { setImageError(false); reset(); }, [word?.id, reset]);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = settings.speechRate;
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [settings.speechRate]);

  useEffect(() => {
    if (isOpen && word && settings.autoPlaySound && settings.soundEnabled) {
      const t = setTimeout(() => speak(`${word.article} ${word.word}`), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, word, settings.autoPlaySound, settings.soundEnabled, speak]);

  const handleAddToWordBank = useCallback(async () => {
    if (!word) return;
    await quickAdd({
      word: word.word,
      translationVi: word.translationVi,
      translationEn: word.translationEn,
      wordType: 'Nomen',
      gender: word.gender,
      plural: word.plural,
      example: word.examples?.[0],
      level: word.level,
    });
  }, [word, quickAdd]);

  if (!isOpen || !word) return null;

  const genderInfo = GenderInfo[word.gender];
  const gs = GENDER_STYLES[word.gender];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ animation: 'fadeIn 0.2s ease-out' }} />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
        style={{ backgroundColor: 'var(--theme-bg-card)', animation: 'modalIn 0.3s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        <div className="relative p-6 pb-8 text-white overflow-hidden" style={{ background: gs.gradient }}>
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/5" />

          {/* Top actions */}
          <div className="relative flex items-center justify-between mb-6">
            {onFavoriteToggle ? (
              <button
                onClick={() => onFavoriteToggle(word.id)}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/15 hover:bg-white/25 transition-all"
                title={isFavorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}>
                <IconStar size={20} style={isFavorite ? { fill: '#FBBF24', color: '#FBBF24' } : { color: 'white' }} />
              </button>
            ) : <div />}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/15 hover:bg-white/25 transition-all">
              <IconX size={18} />
            </button>
          </div>

          {/* Word display */}
          <div className="relative text-center">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="text-3xl md:text-4xl font-bold opacity-80">{word.article}</span>
              <span className="text-3xl md:text-4xl font-bold">{word.word}</span>
              <button
                onClick={() => speak(`${word.article} ${word.word}`)}
                className={`w-11 h-11 rounded-xl flex items-center justify-center bg-white/15 hover:bg-white/25 transition-all ${isSpeaking ? 'animate-pulse' : ''}`}
                disabled={isSpeaking}>
                <IconVolume size={20} />
              </button>
            </div>

            {word.plural && (
              <p className="mt-2 text-white/70 text-sm">
                Plural: <span className="font-medium text-white/90">die {word.plural}</span>
              </p>
            )}

            {settings.showPronunciation && word.pronunciation && (
              <p className="mt-1 text-white/60 text-[15px]">[{word.pronunciation}]</p>
            )}

            {/* Badges */}
            <div className="flex justify-center gap-2 mt-4 flex-wrap">
              {[genderInfo.label, word.level, word.category].map((badge, i) => (
                <span key={i} className="px-3 py-1 rounded-lg text-xs font-medium bg-white/15 backdrop-blur-sm">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="p-6 space-y-5">
          {/* Gender Tip */}
          <GenderTip word={word.word} gender={word.gender} showDetailed />

          {/* Image */}
          {word.imageUrl && !imageError && (
            <div className="rounded-xl overflow-hidden shadow-md">
              <img src={word.imageUrl} alt={word.word}
                className="w-full h-48 object-cover"
                onError={() => setImageError(true)} />
            </div>
          )}

          {/* Translations */}
          <div>
            <h3 className="text-caption font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
              style={{ color: gs.text }}>
              <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: gs.bg }}>
                <IconBookOpen size={13} style={{ color: gs.text }} />
              </span>
              Nghĩa
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                <span className="text-caption font-bold px-2 py-0.5 rounded-md shrink-0"
                  style={{ backgroundColor: gs.bg, color: gs.text }}>EN</span>
                <span className="text-[15px]" style={{ color: 'var(--theme-text-primary)' }}>
                  {word.translationEn}
                </span>
              </div>
              {settings.showVietnamese && word.translationVi && (
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                  <span className="text-caption font-bold px-2 py-0.5 rounded-md shrink-0"
                    style={{ backgroundColor: 'rgba(239,68,68,.08)', color: '#EF4444' }}>VN</span>
                  <span className="text-[15px]" style={{ color: 'var(--theme-text-primary)' }}>
                    {word.translationVi}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Examples */}
          {settings.showExamples && word.examples && word.examples.length > 0 && (
            <div>
              <h3 className="text-caption font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
                style={{ color: gs.text }}>
                <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: gs.bg }}>
                  <IconVolume size={13} style={{ color: gs.text }} />
                </span>
                Ví dụ ({word.examples.length})
              </h3>
              <div className="space-y-2">
                {word.examples.map((example, i) => (
                  <div key={i} className="p-3 rounded-xl"
                    style={{ backgroundColor: gs.light, borderLeft: `3px solid ${gs.text}` }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="italic flex-1 text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                        {'„'}{example}{'"'}
                      </p>
                      <button onClick={() => speak(example)}
                        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                        style={{ backgroundColor: gs.bg, color: gs.text }}>
                        <IconVolume size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {word.tips && word.tips.length > 0 && (
            <div>
              <h3 className="text-caption font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
                style={{ color: '#EAB308' }}>
                <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgba(234,179,8,.1)' }}>
                  <IconLightbulb size={13} style={{ color: '#EAB308' }} />
                </span>
                Ghi chú ({word.tips.length})
              </h3>
              <div className="space-y-2">
                {word.tips.map((tip, i) => (
                  <div key={i} className="p-3 rounded-xl"
                    style={{ backgroundColor: 'rgba(234,179,8,.06)', borderLeft: '3px solid #EAB308' }}>
                    <p className="text-sm" style={{ color: 'var(--theme-text-primary)' }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="p-5 pt-0 flex flex-col gap-2">
          <button
            onClick={(isAdded && !pendingWordId) ? undefined : handleAddToWordBank}
            disabled={(isAdded && !pendingWordId) || isAdding}
            className="w-full py-2.5 rounded-xl font-semibold text-sm border-2 transition-all duration-200 flex items-center justify-center gap-2"
            style={(isAdded && !pendingWordId)
              ? { borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)', cursor: 'default', backgroundColor: 'var(--theme-bg-secondary)' }
              : { borderColor: gs.text, color: gs.text, backgroundColor: 'transparent' }
            }
          >
            {isAdding
              ? <><IconLoader size={15} /> Đang thêm...</>
              : (isAdded && !pendingWordId)
              ? <><IconCheck size={15} /> Đã có trong Word Bank</>
              : <><IconPlus size={15} /> Thêm vào Word Bank</>
            }
          </button>
          {pendingWordId && (
            <AddToCollectionPicker personalWordId={pendingWordId} onClose={closePicker} />
          )}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: gs.gradient }}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
