'use client';
import { useTranslations } from 'next-intl';
import { ACCENT, GRADIENT } from '@/lib/tokens';
import { GenderInfo, Progress } from '@/types';
import type { Word } from '@/types';

type QuizMode = 'gender' | 'de-vi' | 'vi-de' | 'mixed';

interface ArtikelStyle {
  gradient: string;
  chipBg: string;
  chipColor: string;
}

function HighlightExample({ sentence, word }: { sentence: string; word: string }) {
  if (!word || !sentence) return <>{sentence}</>;
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = sentence.split(new RegExp(`(${escaped})`, 'i'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === word.toLowerCase()
          ? <strong key={i} style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>{part}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

function getLastSeenText(dateStr: string | null | undefined, t: (key: 'today' | 'oneDayAgo' | 'daysAgo', values?: Record<string, number>) => string): string {
  if (!dateStr) return '';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return t('today');
  if (days === 1) return t('oneDayAgo');
  return t('daysAgo', { days });
}

interface ReviewCardProps {
  currentWord: Word;
  currentCard: Progress;
  currentMode: Exclude<QuizMode, 'mixed'>;
  artikelStyle: ArtikelStyle;
  cardGradient: string;
  isFlipped: boolean;
  onFlip: () => void;
  onSpeak: (text: string) => void;
  showExampleTrans: boolean;
  onShowExampleTrans: () => void;
}

export function ReviewCard({
  currentWord, currentCard, currentMode,
  artikelStyle, cardGradient,
  isFlipped, onFlip, onSpeak,
  showExampleTrans, onShowExampleTrans,
}: ReviewCardProps) {
  const t = useTranslations('progress.review');
  const genderInfo = GenderInfo[currentWord.gender];

  return (
    <div className="mb-5" style={{ perspective: '1200px' }}>
      <div style={{
        transformStyle: 'preserve-3d',
        transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        position: 'relative',
        height: 320,
      }}>
        {/* ─ Front ─ */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden cursor-pointer"
          style={{ backfaceVisibility: 'hidden', background: cardGradient, WebkitBackfaceVisibility: 'hidden' }}
          onClick={onFlip}
        >
          {currentWord.article && currentMode !== 'vi-de' && (
            <div className="absolute top-4 left-4">
              <span className="px-2.5 py-1 rounded-lg text-caption font-extrabold tracking-widest uppercase"
                style={{ backgroundColor: artikelStyle.chipBg, color: artikelStyle.chipColor }}>
                {currentWord.article}
              </span>
            </div>
          )}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 text-caption"
            style={{ color: 'rgba(255,255,255,0.38)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M8 15h8"/>
            </svg>
            {t('spaceToFlip')}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 gap-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white text-center leading-tight">
              {currentMode === 'de-vi'  ? currentWord.word
               : currentMode === 'vi-de' ? (currentWord.translationVi || currentWord.translationEn)
               : <><span style={{ color: 'rgba(255,255,255,0.25)' }}>_____</span>{' '}{currentWord.word}</>}
            </h2>
            {currentMode !== 'vi-de' && (
              <button
                onClick={e => { e.stopPropagation(); onSpeak(`${currentWord.article ? currentWord.article + ' ' : ''}${currentWord.word}`); }}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              </button>
            )}
          </div>
          <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
            <span className="text-caption" style={{ color: 'rgba(255,255,255,0.32)' }}>
              {t('seenCount', { count: currentCard.totalReviews ?? 0 })}
              {currentCard.lastReviewAt ? t('lastSeenSuffix', { time: getLastSeenText(currentCard.lastReviewAt, t) }) : ''}
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: 'rgba(255,255,255,0.28)' }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
        </div>

        {/* ─ Back ─ */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: GRADIENT.cardBack,
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center gap-2">
            <div className="px-3 py-1 rounded-full text-caption font-bold mb-1"
              style={{ backgroundColor: 'rgba(52,211,153,.2)', color: ACCENT.emeraldLight }}>
              {t('vnMeaning')}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              {currentMode === 'vi-de'
                ? `${currentWord.article ? currentWord.article + ' ' : ''}${currentWord.word}`
                : (currentWord.translationVi || currentWord.translationEn)}
            </h2>
            {currentMode !== 'vi-de' && currentWord.translationVi && currentWord.translationEn && (
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>({currentWord.translationEn})</p>
            )}
            {genderInfo && currentMode !== 'vi-de' && (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>({genderInfo.label})</p>
            )}
            {currentWord.examples?.[0] && (
              <div className="mt-1 max-w-sm w-full px-4 py-3 rounded-2xl text-left"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <p className="text-[13.5px] italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  „<HighlightExample sentence={currentWord.examples[0]} word={currentWord.word} />&quot;
                </p>
                {showExampleTrans && currentWord.examples[1] && (
                  <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>→ {currentWord.examples[1]}</p>
                )}
                {!showExampleTrans && currentWord.examples[1] && (
                  <button onClick={onShowExampleTrans}
                    className="text-caption mt-1.5 transition-all hover:opacity-80"
                    style={{ color: 'rgba(255,255,255,0.38)' }}>
                    {t('viewTranslation')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
