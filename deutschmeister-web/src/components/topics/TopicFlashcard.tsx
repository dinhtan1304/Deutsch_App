'use client';

import { useReducer, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ACCENT, STATUS } from '@/lib/tokens';
import type { TopicWord } from '@/types/topic';
import { speakGerman } from '@/lib/utils';

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
  der: ACCENT.srs, die: ACCENT.listening, das: STATUS.success,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = a[i]!;
    a[i] = a[j]!;
    a[j] = temp;
  }
  return a;
}

// ─── State management ───

type FlashState = {
  deck: TopicWord[];
  currentIndex: number;
  isFlipped: boolean;
  known: Set<string>;
  unknown: Set<string>;
  isFinished: boolean;
};

type FlashAction =
  | { type: 'init'; words: TopicWord[] }
  | { type: 'flip' }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'known'; id: string }
  | { type: 'unknown'; id: string }
  | { type: 'restart'; deck: TopicWord[] };

function flashReducer(state: FlashState, action: FlashAction): FlashState {
  switch (action.type) {
    case 'init':
      return { deck: shuffle(action.words), currentIndex: 0, isFlipped: false, known: new Set(), unknown: new Set(), isFinished: false };
    case 'flip':
      return { ...state, isFlipped: !state.isFlipped };
    case 'next':
      if (state.currentIndex < state.deck.length - 1) {
        return { ...state, currentIndex: state.currentIndex + 1, isFlipped: false };
      }
      return { ...state, isFinished: true };
    case 'prev':
      if (state.currentIndex > 0) {
        return { ...state, currentIndex: state.currentIndex - 1, isFlipped: false };
      }
      return state;
    case 'known': {
      const known = new Set(state.known);
      known.add(action.id);
      if (state.currentIndex < state.deck.length - 1) {
        return { ...state, known, currentIndex: state.currentIndex + 1, isFlipped: false };
      }
      return { ...state, known, isFinished: true };
    }
    case 'unknown': {
      const unknown = new Set(state.unknown);
      unknown.add(action.id);
      if (state.currentIndex < state.deck.length - 1) {
        return { ...state, unknown, currentIndex: state.currentIndex + 1, isFlipped: false };
      }
      return { ...state, unknown, isFinished: true };
    }
    case 'restart':
      return { deck: action.deck, currentIndex: 0, isFlipped: false, known: new Set(), unknown: new Set(), isFinished: false };
    default:
      return state;
  }
}

function initFlash(words: TopicWord[]): FlashState {
  return { deck: shuffle(words), currentIndex: 0, isFlipped: false, known: new Set(), unknown: new Set(), isFinished: false };
}

// ─── Component ───

interface Props {
  words: TopicWord[];
  topicColor: string;
  onMarkLearned?: (wordId: string) => void;
  hideIcons?: boolean;
}

export function TopicFlashcard({ words, topicColor, onMarkLearned, hideIcons = false }: Props) {
  const t = useTranslations('vocabulary.topicStudy');
  const [state, dispatch] = useReducer(flashReducer, words, initFlash);
  const { deck, currentIndex, isFlipped, known, unknown, isFinished } = state;

  // Re-init when the word list changes
  useEffect(() => {
    if (words.length > 0) dispatch({ type: 'init', words });
  }, [words]);

  const currentWord = deck[currentIndex];
  const total = deck.length;

  const playAudio = useCallback((text: string) => {
    speakGerman(text);
  }, []);

  const handleKnown = useCallback(() => {
    if (!currentWord) return;
    onMarkLearned?.(currentWord.id);
    dispatch({ type: 'known', id: currentWord.id });
  }, [currentWord, onMarkLearned]);

  const handleUnknown = useCallback(() => {
    if (!currentWord) return;
    dispatch({ type: 'unknown', id: currentWord.id });
  }, [currentWord]);

  const restart = useCallback((onlyUnknown = false) => {
    const newDeck = onlyUnknown
      ? shuffle(deck.filter(w => unknown.has(w.id)))
      : shuffle(words);
    dispatch({ type: 'restart', deck: newDeck });
  }, [words, deck, unknown]);

  // Keyboard
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); dispatch({ type: 'flip' }); }
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
        {!hideIcons && <div className="text-5xl mb-4">{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📚'}</div>}
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
          {t('finished')}
        </h3>
        <div className="flex justify-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: STATUS.success }}>{known.size}</div>
            <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{t('known')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: STATUS.danger }}>{unknown.size}</div>
            <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{t('needReview')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: topicColor }}>{pct}%</div>
            <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{t('accuracy')}</div>
          </div>
        </div>
        <div className="flex justify-center gap-3">
          {unknown.size > 0 && (
            <button onClick={() => restart(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-body font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(239,68,68,.1)', color: STATUS.danger }}>
              {!hideIcons && <IconRotateCcw size={15} />} {t('reviewUnknown', { count: unknown.size })}
            </button>
          )}
          <button onClick={() => restart(false)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-body font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: `${topicColor}15`, color: topicColor }}>
            {!hideIcons && <IconShuffle size={15} />} {t('restartAll')}
          </button>
        </div>
      </div>
    );
  }

  if (!currentWord) return null;
  const ac = ArticleColor[currentWord.article] || ACCENT.gray;

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-body font-medium" style={{ color: 'var(--theme-text-muted)' }}>
          {currentIndex + 1} / {total}
        </span>
        <div className="flex items-center gap-3 text-xs">
          <span style={{ color: STATUS.success }}>{hideIcons ? t('knownShort', { count: known.size }) : `✓ ${known.size}`}</span>
          <span style={{ color: STATUS.danger }}>{hideIcons ? t('needReviewShort', { count: unknown.size }) : `✕ ${unknown.size}`}</span>
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
          onClick={() => dispatch({ type: 'flip' })}
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
              <div className="text-body font-bold mb-3 px-3 py-1 rounded-lg"
                style={{ backgroundColor: `${ac}15`, color: ac }}>
                {currentWord.article}
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                {currentWord.word}
              </div>
              {currentWord.plural && (
                <div className="text-body mb-3" style={{ color: 'var(--theme-text-muted)' }}>
                  Pl. {currentWord.plural}
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); playAudio(`${currentWord.article} ${currentWord.word}`); }}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                style={{ backgroundColor: `${ac}15`, color: ac }}>
                {hideIcons ? t('listen') : <IconVolume size={20} />}
              </button>
              <div className="absolute bottom-4 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                {t('flipHint')}
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
              <div className="text-caption font-bold uppercase mb-4 px-3 py-1 rounded-lg tracking-wide"
                style={{ backgroundColor: `${topicColor}15`, color: topicColor }}>
                {t('meaning')}
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
                  <div className="text-xs italic text-center py-2 rounded-lg"
                    style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
                    „{currentWord.examples[0]}&quot;
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                {t('flipHint')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <button onClick={handleUnknown}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{ background: 'rgba(239,68,68,.1)', color: STATUS.danger, border: '1px solid rgba(239,68,68,.2)' }}>
          {!hideIcons && <IconX size={18} />} {t('dontKnow')}
        </button>
        <button onClick={handleKnown}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{ background: 'rgba(34,197,94,.1)', color: STATUS.success, border: '1px solid rgba(34,197,94,.2)' }}>
          {!hideIcons && <IconCheck size={18} />} {t('know')}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-center gap-2 mt-4">
        <button onClick={() => dispatch({ type: 'prev' })}
          disabled={currentIndex === 0}
          className="p-2 rounded-lg transition-all disabled:opacity-30"
          style={{ color: 'var(--theme-text-muted)' }}>
          {hideIcons ? t('prev') : <IconChevronLeft size={20} />}
        </button>
        <button onClick={() => restart(false)}
          className="p-2 rounded-lg transition-all hover:opacity-70"
          style={{ color: 'var(--theme-text-muted)' }} title={t('shuffleTitle')}>
          {hideIcons ? t('shuffle') : <IconShuffle size={18} />}
        </button>
        <button onClick={() => dispatch({ type: 'next' })}
          disabled={currentIndex >= total - 1}
          className="p-2 rounded-lg transition-all disabled:opacity-30"
          style={{ color: 'var(--theme-text-muted)' }}>
          {hideIcons ? t('next') : <IconChevronRight size={20} />}
        </button>
      </div>
    </div>
  );
}
