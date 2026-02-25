'use client';

import { useState, useCallback } from 'react';
import type { TopicWord } from '@/types/topic';
import { ArticleColor } from '@/types/topic';
import { dictionaryLookupApi } from '@/lib/api/dictionary-lookup';

// ─── Inline SVG icons ───
function IconVolume({ size = 16, ...props }: { size?: number, [key: string]: any }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} {...props}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}
function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconPlus({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M5 12h14" /><path d="M12 5v14" />
    </svg>
  );
}
function IconStar({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconLightbulb({ size = 16, ...props }: { size?: number, [key: string]: any }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} {...props}>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" /><path d="M10 22h4" />
    </svg>
  );
}

// ─── Color helpers ───
const AC_STYLES: Record<string, { color: string; bg: string; gradient: string }> = {
  der: { color: '#3B82F6', bg: 'rgba(59,130,246,.08)', gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
  die: { color: '#EC4899', bg: 'rgba(236,72,153,.08)', gradient: 'linear-gradient(135deg, #EC4899, #BE185D)' },
  das: { color: '#22C55E', bg: 'rgba(34,197,94,.08)', gradient: 'linear-gradient(135deg, #22C55E, #15803D)' },
};
const DEFAULT_AC = { color: '#6B7280', bg: 'rgba(107,114,128,.08)', gradient: 'linear-gradient(135deg, #6B7280, #4B5563)' };

interface TopicWordCardProps {
  word: TopicWord;
  index: number;
  isLearned?: boolean;
  onMarkLearned?: (wordId: string) => void;
  onPlayAudio?: (text: string) => void;
}

export function TopicWordCard({
  word, index, isLearned = false, onMarkLearned, onPlayAudio,
}: TopicWordCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [addedToBank, setAddedToBank] = useState(false);
  const [addingToBank, setAddingToBank] = useState(false);
  const ac = AC_STYLES[word.article] || DEFAULT_AC;

  const handleAddToWordBank = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (addingToBank || addedToBank) return;
    setAddingToBank(true);
    try {
      await dictionaryLookupApi.quickAdd({
        word: word.word,
        translationVi: word.translationVi,
        translationEn: word.translationEn,
        wordType: 'Nomen',
        gender: word.gender,
        plural: word.plural,
        example: word.examples?.[0],
        // level: word.level,
      });
      setAddedToBank(true);
    } catch {
      setAddedToBank(true);
    } finally {
      setAddingToBank(false);
    }
  }, [word, addingToBank, addedToBank]);

  const handlePlayAudio = () => {
    const fullWord = word.article ? `${word.article} ${word.word}` : word.word;
    if (onPlayAudio) { onPlayAudio(fullWord); return; }
    const utterance = new SpeechSynthesisUtterance(fullWord);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  return (
      <div
        className="relative overflow-hidden rounded-2xl transition-all duration-300"
        style={{
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: showDetails ? ac.color : 'var(--theme-border)',
          borderLeftWidth: '3px',
          borderLeftColor: ac.color,
        }}
      >
      {/* Main content */}
      <div className="p-4 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                {index}.
              </span>
              {word.article && (
                <span className="text-[14px] font-semibold" style={{ color: ac.color }}>
                  {word.article}
                </span>
              )}
              <span className="text-[17px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                {word.word}
              </span>
              {word.isCore && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                  style={{ background: ac.gradient, color: 'white' }}>
                  <IconStar size={9} /> Core
                </span>
              )}
            </div>

            {word.plural && (
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                Pl. {word.plural}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span className="text-[13px] flex items-center gap-1"
                style={{ color: 'var(--theme-text-secondary)' }}>
                <span className="text-[10px] px-1 py-0.5 rounded font-bold"
                  style={{ background: 'rgba(59,130,246,.08)', color: '#3B82F6' }}>EN</span>
                {word.translationEn}
              </span>
              {word.translationVi && (
                <span className="text-[13px] flex items-center gap-1"
                  style={{ color: 'var(--theme-text-muted)' }}>
                  <span className="text-[10px] px-1 py-0.5 rounded font-bold"
                    style={{ background: 'rgba(239,68,68,.08)', color: '#EF4444' }}>VN</span>
                  {word.translationVi}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 shrink-0">
            <button
              onClick={e => { e.stopPropagation(); handlePlayAudio(); }}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
                opacity-50 hover:opacity-100 hover:scale-110"
              style={{ backgroundColor: ac.bg, color: ac.color }}
              title="Nghe phát âm">
              <IconVolume size={16} />
            </button>

            {/* Nút Add to Word Bank */}
            <button
              onClick={handleAddToWordBank}
              disabled={addingToBank}
              className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 hover:scale-110"
              style={addedToBank
                ? { backgroundColor: 'rgba(34,197,94,.1)', borderColor: '#22C55E', color: '#22C55E' }
                : { backgroundColor: 'transparent', borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }
              }
              title={addedToBank ? 'Đã thêm vào Word Bank' : 'Thêm vào Word Bank'}>
              {addedToBank
                ? <IconCheck size={13} />
                : <IconPlus size={13} />
              }
            </button>

            {onMarkLearned && (
              <button
                onClick={e => { e.stopPropagation(); onMarkLearned(word.id); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all duration-200"
                style={isLearned
                  ? { background: 'linear-gradient(135deg, #22C55E, #16A34A)', borderColor: 'transparent', color: 'white' }
                  : { borderColor: 'var(--theme-border)', color: 'transparent' }
                }
                title={isLearned ? 'Đã học' : 'Đánh dấu đã học'}>
                <IconCheck size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {showDetails && (
        <div className="px-4 pb-4 pt-2 space-y-3" style={{ borderTop: '1px solid var(--theme-border)' }}>
          {word.examples && word.examples.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold mb-1.5 flex items-center gap-1.5"
                style={{ color: 'var(--theme-text-muted)' }}>
                <span className="w-5 h-5 rounded-md flex items-center justify-center"
                  style={{ background: ac.bg }}>
                  <IconVolume size={11} style={{ color: ac.color }} />
                </span>
                Ví dụ
              </p>
              <ul className="space-y-1.5">
                {word.examples.map((ex, i) => (
                  <li key={i} className="text-[13px] italic pl-3 border-l-2"
                    style={{ borderColor: ac.color, color: 'var(--theme-text-secondary)' }}>
                    „{ex}"
                  </li>
                ))}
              </ul>
            </div>
          )}

          {word.tips && word.tips.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold mb-1.5 flex items-center gap-1.5"
                style={{ color: 'var(--theme-text-muted)' }}>
                <span className="w-5 h-5 rounded-md flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,.1)' }}>
                  <IconLightbulb size={11} style={{ color: '#F59E0B' }} />
                </span>
                Mẹo nhớ
              </p>
              <ul className="space-y-1">
                {word.tips.map((tip, i) => (
                  <li key={i} className="text-[13px] pl-3"
                    style={{ color: 'var(--theme-text-secondary)' }}>
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {word.imageUrl && (
            <div className="mt-2">
              <img src={word.imageUrl} alt={word.word}
                className="w-full max-w-50 h-auto rounded-xl border"
                style={{ borderColor: 'var(--theme-border)' }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}