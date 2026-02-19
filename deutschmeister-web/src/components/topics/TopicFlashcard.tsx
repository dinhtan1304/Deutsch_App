'use client';

import { useState, useCallback, useEffect } from 'react';
import type { TopicWord } from '@/types/topic';

// ─── Icons ───
function IconVolume({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}
function IconRotateCcw({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
    </svg>
  );
}
function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconX({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconChevronLeft({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
function IconChevronRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
function IconShuffle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
      <path d="m18 2 4 4-4 4" /><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
      <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" /><path d="m18 14 4 4-4 4" />
    </svg>
  );
}

const ArticleColor: Record<string, string> = {
  der: '#3B82F6', die: '#EC4899', das: '#22C55E',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  words: TopicWord[];
  topicColor: string;
  onMarkLearned?: (wordId: string) => void;
}

export function TopicFlashcard({ words, topicColor, onMarkLearned }: Props) {
  const [deck, setDeck] = useState<TopicWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [unknown, setUnknown] = useState<Set<string>>(new Set());
  const [isFinished, setIsFinished] = useState(false);

  // Init deck
  useEffect(() => {
    if (words.length > 0) {
      setDeck(shuffle(words));
      setCurrentIndex(0);
      setIsFlipped(false);
      setKnown(new Set());
      setUnknown(new Set());
      setIsFinished(false);
    }
  }, [words]);

  const currentWord = deck[currentIndex];
  const total = deck.length;

  const playAudio = useCallback((text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE'; u.rate = 0.85;
    speechSynthesis.speak(u);
  }, []);

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex(i => i + 1);
      setIsFlipped(false);
    } else {
      setIsFinished(true);
    }
  }, [currentIndex, total]);

  const handleKnown = useCallback(() => {
    if (!currentWord) return;
    setKnown(s => new Set(s).add(currentWord.id));
    onMarkLearned?.(currentWord.id);
    goNext();
  }, [currentWord, goNext, onMarkLearned]);

  const handleUnknown = useCallback(() => {
    if (!currentWord) return;
    setUnknown(s => new Set(s).add(currentWord.id));
    goNext();
  }, [currentWord, goNext]);

  const restart = useCallback((onlyUnknown = false) => {
    const newDeck = onlyUnknown
      ? shuffle(deck.filter(w => unknown.has(w.id)))
      : shuffle(words);
    setDeck(newDeck);
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnown(new Set());
    setUnknown(new Set());
    setIsFinished(false);
  }, [words, deck, unknown]);

  // Keyboard
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setIsFlipped(f => !f); }
      if (e.key === 'ArrowRight' || e.key === '1') handleKnown();
      if (e.key === 'ArrowLeft' || e.key === '2') handleUnknown();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [handleKnown, handleUnknown]);

  if (!currentWord && !isFinished) return null;

  // ─── Finished screen ───
  if (isFinished) {
    const pct = total > 0 ? Math.round((known.size / total) * 100) : 0;
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-4">{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📚'}</div>
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
          Hoàn thành!
        </h3>
        <div className="flex justify-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#22C55E' }}>{known.size}</div>
            <div className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>Đã biết</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#EF4444' }}>{unknown.size}</div>
            <div className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>Cần ôn</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: topicColor }}>{pct}%</div>
            <div className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>Chính xác</div>
          </div>
        </div>
        <div className="flex justify-center gap-3">
          {unknown.size > 0 && (
            <button onClick={() => restart(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(239,68,68,.1)', color: '#EF4444' }}>
              <IconRotateCcw size={15} /> Ôn {unknown.size} từ chưa biết
            </button>
          )}
          <button onClick={() => restart(false)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: `${topicColor}15`, color: topicColor }}>
            <IconShuffle size={15} /> Học lại tất cả
          </button>
        </div>
      </div>
    );
  }

  const ac = ArticleColor[currentWord.article] || '#6B7280';

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>
          {currentIndex + 1} / {total}
        </span>
        <div className="flex items-center gap-3 text-[12px]">
          <span style={{ color: '#22C55E' }}>✓ {known.size}</span>
          <span style={{ color: '#EF4444' }}>✗ {unknown.size}</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-6"
        style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${((currentIndex) / total) * 100}%`, backgroundColor: topicColor }} />
      </div>

      {/* Card */}
      <div className="flex justify-center mb-6">
        <div
          onClick={() => setIsFlipped(f => !f)}
          className="relative w-full max-w-md cursor-pointer select-none"
          style={{ perspective: '1000px' }}
        >
          <div
            className="relative transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
              minHeight: '260px',
            }}
          >
            {/* Front */}
            <div className="absolute inset-0 rounded-2xl border-2 p-8 flex flex-col items-center justify-center"
              style={{
                backfaceVisibility: 'hidden',
                backgroundColor: 'var(--theme-bg-card)',
                borderColor: ac,
              }}>
              <div className="text-[13px] font-bold mb-3 px-3 py-1 rounded-lg"
                style={{ backgroundColor: `${ac}15`, color: ac }}>
                {currentWord.article}
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                {currentWord.word}
              </div>
              {currentWord.plural && (
                <div className="text-[13px] mb-3" style={{ color: 'var(--theme-text-muted)' }}>
                  Pl. {currentWord.plural}
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); playAudio(`${currentWord.article} ${currentWord.word}`); }}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                style={{ backgroundColor: `${ac}15`, color: ac }}>
                <IconVolume size={20} />
              </button>
              <div className="absolute bottom-4 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                Nhấn để lật · Space
              </div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 rounded-2xl border-2 p-8 flex flex-col items-center justify-center"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                backgroundColor: 'var(--theme-bg-card)',
                borderColor: topicColor,
              }}>
              <div className="text-[11px] font-bold uppercase mb-4 px-3 py-1 rounded-lg tracking-wide"
                style={{ backgroundColor: `${topicColor}15`, color: topicColor }}>
                Nghĩa
              </div>
              {currentWord.translationVi && (
                <div className="text-2xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
                  {currentWord.translationVi}
                </div>
              )}
              <div className="text-[15px] mb-4" style={{ color: 'var(--theme-text-secondary)' }}>
                {currentWord.translationEn}
              </div>
              {currentWord.examples && currentWord.examples.length > 0 && (
                <div className="w-full mt-2 px-4">
                  <div className="text-[12px] italic text-center py-2 rounded-lg"
                    style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
                    „{currentWord.examples[0]}"
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                Nhấn để lật · Space
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <button onClick={handleUnknown}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{ background: 'rgba(239,68,68,.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,.2)' }}>
          <IconX size={18} /> Chưa biết · ←
        </button>
        <button onClick={handleKnown}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{ background: 'rgba(34,197,94,.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,.2)' }}>
          <IconCheck size={18} /> Đã biết · →
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-center gap-2 mt-4">
        <button onClick={() => { if (currentIndex > 0) { setCurrentIndex(i => i - 1); setIsFlipped(false); } }}
          disabled={currentIndex === 0}
          className="p-2 rounded-lg transition-all disabled:opacity-30"
          style={{ color: 'var(--theme-text-muted)' }}>
          <IconChevronLeft size={20} />
        </button>
        <button onClick={() => restart(false)}
          className="p-2 rounded-lg transition-all hover:opacity-70"
          style={{ color: 'var(--theme-text-muted)' }} title="Xáo trộn lại">
          <IconShuffle size={18} />
        </button>
        <button onClick={() => { if (currentIndex < total - 1) { setCurrentIndex(i => i + 1); setIsFlipped(false); } }}
          disabled={currentIndex >= total - 1}
          className="p-2 rounded-lg transition-all disabled:opacity-30"
          style={{ color: 'var(--theme-text-muted)' }}>
          <IconChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
