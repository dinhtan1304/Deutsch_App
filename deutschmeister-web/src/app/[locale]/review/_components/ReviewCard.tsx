'use client';
import { useTranslations } from 'next-intl';
import { GenderInfo, Progress } from '@/types';
import type { Word } from '@/types';

type QuizMode = 'gender' | 'de-vi' | 'vi-de' | 'mixed';

const ART: Record<string, { color: string; soft: string }> = {
  der: { color: 'var(--der)', soft: 'color-mix(in srgb, var(--der) 14%, transparent)' },
  die: { color: 'var(--die)', soft: 'color-mix(in srgb, var(--die) 14%, transparent)' },
  das: { color: 'var(--das)', soft: 'color-mix(in srgb, var(--das) 14%, transparent)' },
};
const FALLBACK = { color: 'var(--accent)', soft: 'color-mix(in srgb, var(--accent) 14%, transparent)' };

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

interface ReviewCardProps {
  currentWord: Word;
  currentCard: Progress;
  currentMode: Exclude<QuizMode, 'mixed'>;
  isFlipped: boolean;
  onFlip: () => void;
  onSpeak: (text: string) => void;
  showExampleTrans: boolean;
  onShowExampleTrans: () => void;
}

function Face({ a, back, isFlipped, children }: { a: { color: string; soft: string }; back?: boolean; isFlipped: boolean; children: React.ReactNode }) {
  // Which face currently points at the viewer.
  const visible = back ? isFlipped : !isFlipped;
  return (
    // The 3D face carries backface-visibility + rotateY only. Keeping `overflow:hidden`
    // + a `filter:blur()` descendant on this same element makes iOS WebKit flatten it
    // into its own layer and ignore backface-visibility (both faces show, back mirrored).
    // So the clip + blur live on a non-3D inner wrapper instead.
    <div
      className="absolute inset-0 rounded-3xl"
      style={{
        border: `1px solid color-mix(in srgb, ${a.color} 35%, transparent)`,
        boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: back ? 'rotateY(180deg)' : 'none',
        // Belt-and-suspenders for iOS Safari, which sometimes ignores
        // backface-visibility under preserve-3d (both faces show, back mirrored).
        // Also hide the away-facing side via opacity, swapped instantly at mid-flip
        // (350ms = halfway of the 0.7s rotation, when the card is edge-on) so the
        // swap is invisible and the animation still reads as a 3D flip.
        opacity: visible ? 1 : 0,
        transition: 'opacity 0s linear 350ms',
      }}
    >
      <div className="v2-srs-card absolute inset-0 flex flex-col overflow-hidden rounded-3xl p-9">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full"
          style={{ background: a.soft, filter: 'blur(40px)', opacity: 0.8 }} />
        {children}
      </div>
    </div>
  );
}

export function ReviewCard({
  currentWord, currentCard, currentMode,
  isFlipped, onFlip, onSpeak,
  showExampleTrans, onShowExampleTrans,
}: ReviewCardProps) {
  const t = useTranslations('progress.review');
  const article = (currentWord.article || '').toLowerCase();
  const a = ART[article] ?? FALLBACK;
  const genderInfo = GenderInfo[currentWord.gender];
  const isNew = (currentCard.repetitions ?? 0) === 0;
  const speakText = `${currentWord.article ? currentWord.article + ' ' : ''}${currentWord.word}`;

  // Top row (level + folder + state) — identical on both faces.
  const topRow = (
    <div className="relative z-[1] flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="mono rounded-sm px-2.5 py-1 text-[11px] font-bold"
          style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
          {currentWord.level}
        </span>
        {currentWord.category && (
          <span className="inline-flex items-center gap-1.5 rounded-sm py-1 pl-2 pr-2.5 text-xs"
            style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
            {currentWord.category}
          </span>
        )}
      </div>
      <span className="rounded-sm px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide"
        style={isNew
          ? { background: 'color-mix(in srgb, var(--das) 16%, transparent)', color: 'var(--das)' }
          : { background: 'color-mix(in srgb, var(--warn) 16%, transparent)', color: 'var(--warn)' }}>
        {isNew ? t('stateNew') : t('stateLearning')}
      </span>
    </div>
  );

  const pluralFooter = currentWord.plural ? (
    <div className="mono text-xs" style={{ color: 'var(--theme-text-muted)' }}>
      <span className="mr-1.5">{t('pluralLabel')}</span>{currentWord.plural}
    </div>
  ) : <span />;

  const speakBtn = (
    <button onClick={e => { e.stopPropagation(); onSpeak(speakText); }}
      className="mt-1 flex h-14 w-14 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
      style={{ background: a.soft, color: a.color, border: `1px solid color-mix(in srgb, ${a.color} 35%, transparent)` }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    </button>
  );

  const exampleBox = currentWord.examples?.[0] ? (
    <div className="mt-2 w-full max-w-[440px] rounded-[10px] px-4.5 py-3 text-left"
      style={{ background: 'var(--theme-bg-secondary)', borderLeft: `3px solid ${a.color}` }}>
      <p className="text-[15px] italic leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
        „<HighlightExample sentence={currentWord.examples[0]} word={currentWord.word} />&quot;
      </p>
      {showExampleTrans && currentWord.examples[1] && (
        <p className="mt-1.5 text-xs" style={{ color: 'var(--theme-text-muted)' }}>→ {currentWord.examples[1]}</p>
      )}
      {!showExampleTrans && currentWord.examples[1] && (
        <button onClick={e => { e.stopPropagation(); onShowExampleTrans(); }}
          className="mt-1.5 text-[11px] transition-opacity hover:opacity-80" style={{ color: 'var(--theme-text-muted)' }}>
          {t('viewTranslation')}
        </button>
      )}
    </div>
  ) : null;

  return (
    <div className="w-full max-w-[680px]" style={{ perspective: 2000 }}>
      <div className="relative h-[420px] w-full cursor-pointer" onClick={onFlip}
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform .7s cubic-bezier(.4,0,.2,1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
        {/* ── FRONT ── */}
        <Face a={a} isFlipped={isFlipped}>
          {topRow}
          <div className="relative z-[1] flex flex-1 flex-col items-center justify-center gap-3.5 text-center">
            {currentMode === 'vi-de' ? (
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>
                {currentWord.translationVi || currentWord.translationEn}
              </h1>
            ) : (
              <>
                <div className="flex items-baseline justify-center gap-3">
                  {currentMode === 'gender'
                    ? <span className="text-3xl font-semibold" style={{ color: 'var(--theme-text-muted)' }}>___</span>
                    : <span className="text-3xl font-semibold" style={{ color: a.color }}>{currentWord.article}</span>}
                  <h1 className="text-5xl md:text-6xl font-bold leading-none" style={{ color: 'var(--theme-text-primary)', letterSpacing: '-1.2px' }}>
                    {currentWord.word}
                  </h1>
                </div>
                {currentWord.pronunciation && (
                  <div className="mono text-sm" style={{ color: 'var(--theme-text-muted)' }}>{currentWord.pronunciation}</div>
                )}
                {speakBtn}
              </>
            )}
          </div>
          <div className="relative z-[1] flex items-center justify-between">
            {pluralFooter}
            <div className="flex items-center gap-2 text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>
              <span>{t('showMeaningHint')}</span>
              <kbd className="mono rounded-[5px] px-1.5 py-0.5 text-[10.5px]"
                style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>Space</kbd>
            </div>
          </div>
        </Face>

        {/* ── BACK ── */}
        <Face a={a} back isFlipped={isFlipped}>
          {topRow}
          <div className="relative z-[1] flex flex-1 flex-col items-center justify-center gap-2.5 text-center">
            {currentMode === 'vi-de' ? (
              <>
                <div className="flex items-baseline justify-center gap-2.5">
                  <span className="text-base font-semibold" style={{ color: a.color }}>{currentWord.article}</span>
                  <h2 className="text-4xl md:text-5xl font-bold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>{currentWord.word}</h2>
                </div>
                {currentWord.pronunciation && (
                  <div className="mono text-sm" style={{ color: 'var(--theme-text-muted)' }}>{currentWord.pronunciation}</div>
                )}
                {exampleBox}
              </>
            ) : (
              <>
                <div>
                  <span className="text-sm font-semibold" style={{ color: a.color }}>{currentWord.article}</span>
                  <span className="ml-2 text-[22px] font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>{currentWord.word}</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>
                  {currentWord.translationVi || currentWord.translationEn}
                </h2>
                {currentWord.translationVi && currentWord.translationEn && (
                  <div className="text-sm italic" style={{ color: 'var(--theme-text-muted)' }}>{currentWord.translationEn}</div>
                )}
                {genderInfo && (
                  <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>({genderInfo.label})</div>
                )}
                {exampleBox}
              </>
            )}
          </div>
          <div className="relative z-[1] flex items-center">
            {pluralFooter}
          </div>
        </Face>
      </div>
    </div>
  );
}
