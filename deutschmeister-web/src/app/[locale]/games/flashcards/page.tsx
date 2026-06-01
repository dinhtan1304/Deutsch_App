'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRandomWords } from '@/hooks/useWords';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useGameSession } from '@/hooks/useGameSession';
import { useWordBankGameWords } from '@/hooks/usePersonalWords';
import { personalWordsToGameWords, getEligibleWordsForGame } from '@/lib/personalWordAdapter';
import { GenderInfo, Word } from '@/types';
import {
  GameSetupCard, GameResultCard, GameProgressBar,
  AddWrongWordsToBank, GameResultUpsell, GameInfoBox, KBD,
  GamePlayHeader, GameStatsBar, useGameTimer,
  IconLayers, IconCheck, IconX, IconRocket, IconKeyboard, IconVolume, IconTarget, IconFlame,
  IconRefresh, IconChevronLeft, IconChevronRight,
} from '@/components/games/GameUI';
import { Button } from '@/components/ui';
import { ACCENT, STATUS } from '@/lib/tokens';

const AC: Record<string, string> = { masculine: ACCENT.srs, feminine: ACCENT.listening, neuter: STATUS.success };

type Phase = 'setup' | 'playing' | 'result';
interface CardResult { word: Word; knew: boolean; }

function IconShuffle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
      <path d="m18 2 4 4-4 4" />
      <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
      <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
      <path d="m18 14 4 4-4 4" />
    </svg>
  );
}

import { speakGerman as speakWord, prefetchAudio } from '@/lib/utils';

export default function FlashcardsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWordBankMode = searchParams.get('source') === 'wordbank';
  const collectionId = searchParams.get('collectionId') ?? undefined;
  const t = useTranslations('games');

  const { settings, isLoaded, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playClick, playGameOver, playStreak } = useSoundEffects();
  const session = useGameSession('flashcard');

  const [phase, setPhase] = useState<Phase>('setup');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<CardResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const knewRef = useRef(0);
  const bestStreakRef = useRef(0);
  const didntKnowRef = useRef(0);
  const [wbGameWords, setWbGameWords] = useState<Word[]>([]);

  const cardsCount = isLoaded ? settings.questionsPerGame : 20;
  const { data: globalWords, refetch, isLoading: globalLoading } = useRandomWords(cardsCount, {});
  const wbData = useWordBankGameWords({ collectionId, enabled: isWordBankMode });
  const words = isWordBankMode ? wbGameWords : (globalWords ?? []);
  const isLoading = isWordBankMode ? wbData.isLoading : globalLoading;
  const currentWord = words?.[index];

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const startGame = async () => {
    playClick();
    setLoadError(null);
    if (isWordBankMode) {
      const eligible = getEligibleWordsForGame('flashcards', wbData.data ?? []);
      if (eligible.length < 2) { setLoadError(t('flashcards.errors.minWords2')); return; }
      const shuffled = [...eligible].sort(() => Math.random() - 0.5).slice(0, cardsCount);
      setWbGameWords(personalWordsToGameWords(shuffled));
      setIndex(0); setIsFlipped(false); setResults([]); setStreak(0); setBestStreak(0);
      knewRef.current = 0; bestStreakRef.current = 0; didntKnowRef.current = 0;
      setPhase('playing');
      session.start(shuffled.length);
    } else {
      const result = await refetch();
      if (!result.data?.length) { setLoadError(t('common.errors.noVocab')); return; }
      setIndex(0); setIsFlipped(false); setResults([]); setStreak(0); setBestStreak(0);
      knewRef.current = 0; bestStreakRef.current = 0; didntKnowRef.current = 0;
      setPhase('playing');
      session.start(cardsCount);
    }
  };

  const flipCard = useCallback(() => { playClick(); setIsFlipped(f => !f); }, [playClick]);

  const handleResponse = useCallback((knew: boolean) => {
    if (!currentWord) return;
    setResults(prev => [...prev, { word: currentWord, knew }]);

    if (knew) {
      playCorrect();
      knewRef.current++;
      const newStreak = streak + 1; setStreak(newStreak);
      if (newStreak > bestStreak) { setBestStreak(newStreak); bestStreakRef.current = newStreak; }
      if (newStreak === 5 || newStreak === 10 || newStreak === 15) setTimeout(() => playCombo(), 200);
    } else { playWrong(); didntKnowRef.current++; setStreak(0); }

    setTimeout(() => {
      if (index + 1 >= (words?.length || 0)) {
        playGameOver();
        if (bestStreakRef.current >= 5) setTimeout(() => playStreak(), 300);
        setPhase('result');
      } else { setIndex(i => i + 1); setIsFlipped(false); }
    }, 300);
  }, [currentWord, index, words?.length, streak, bestStreak, playCorrect, playWrong, playCombo, playGameOver, playStreak]);

  const goToPrev = useCallback(() => {
    if (index > 0) { setIndex(i => i - 1); setIsFlipped(false); }
  }, [index]);

  const goToNext = useCallback(() => {
    if (words && index < words.length - 1) { setIndex(i => i + 1); setIsFlipped(false); }
  }, [index, words]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!isFlipped) flipCard(); }
      else if (e.key === 'ArrowLeft' || e.key === '1') { if (isFlipped) handleResponse(false); }
      else if (e.key === 'ArrowRight' || e.key === '2') { if (isFlipped) handleResponse(true); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [phase, isFlipped, flipCard, handleResponse]);

  // Save game session to backend when game ends
  useEffect(() => {
    if (phase === 'result') {
      session.end(knewRef.current * 10, bestStreakRef.current, knewRef.current, didntKnowRef.current);
    }
  }, [phase, session]);

  // Auto-play pronunciation when a new card appears
  useEffect(() => {
    if (phase !== 'playing') return;
    if (!settings.autoPlaySound) return;
    if (!currentWord?.word) return;
    speakWord(currentWord.word, settings.speechRate < 0.7);
  }, [phase, index, currentWord, settings.autoPlaySound, settings.speechRate]);

  // Warm the cache for the next 2 cards so their first play is instant.
  // Fire-and-forget — the prefetch dedupes against the in-flight map, so a
  // hot back-to-back card flip won't double-fetch.
  useEffect(() => {
    if (phase !== 'playing' || !words) return;
    for (let i = 1; i <= 2; i++) {
      const next = words[index + i];
      if (next?.word) prefetchAudio(next.word);
    }
  }, [phase, index, words]);

  const timer = useGameTimer(phase === 'playing');

  // ─── Setup ───
  if (phase === 'setup') {
    return (
      <GameSetupCard icon={({ size }) => <IconLayers size={size} style={{ color: 'white' }} />} iconColor={STATUS.success} title={t('flashcards.title')} loadError={loadError}>
        <p className="text-sm mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
          {t.rich('flashcards.description', {
            count: cardsCount,
            emphasis: (chunks) => <span className="font-bold" style={{ color: STATUS.success }}>{chunks}</span>,
          })}
        </p>
        <p className="text-xs mb-6" style={{ color: 'var(--theme-text-muted)' }}>{t('flashcards.cardsHint')}</p>
        <GameInfoBox>
          <div className="flex items-center gap-2"><IconLayers size={14} style={{ color: STATUS.success }} /><span>{t.rich('flashcards.info.flip', { kbd: (chunks) => <KBD>{chunks}</KBD> })}</span></div>
          <div className="flex items-center gap-2"><IconKeyboard size={14} style={{ color: ACCENT.vocab }} /><span>{t.rich('flashcards.info.keys', { kbd: (chunks) => <KBD>{chunks}</KBD> })}</span></div>
          <div className="flex items-center gap-2"><IconVolume size={14} style={{ color: ACCENT.srs }} /><span>{t('flashcards.info.audio')}</span></div>
        </GameInfoBox>
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="game" accent="reading" onClick={startGame} isLoading={isLoading} ><IconRocket size={16} /> {t('common.start')}</Button>
          <Button variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> {t('common.back')}</Button>
        </div>
      </GameSetupCard>
    );
  }

  // ─── Result ───
  if (phase === 'result') {
    const knewCount = results.filter(r => r.knew).length;
    const didntKnowCount = results.filter(r => !r.knew).length;
    const accuracy = Math.round((knewCount / results.length) * 100);
    const needReview = results.filter(r => !r.knew);

    return (
      <>
        <GameResultCard
          accuracy={accuracy}
          correct={knewCount}
          total={results.length}
          stats={[
            { label: t('flashcards.stats.known'), value: knewCount, color: STATUS.success, icon: IconCheck },
            { label: t('flashcards.stats.needReview'), value: didntKnowCount, color: STATUS.danger, icon: IconX },
            { label: t('flashcards.stats.bestStreak'), value: bestStreak, color: ACCENT.xp, icon: IconFlame },
            { label: t('common.accuracy'), value: `${accuracy}%`, color: ACCENT.srs, icon: IconTarget },
          ]}
          onRestart={startGame}
          onExit={() => router.push('/games')}
        />

        {needReview.length > 0 && (
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="rounded-2xl border overflow-hidden"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
              <div className="px-5 py-4 border-b flex items-center gap-2"
                style={{ borderColor: 'var(--theme-border)' }}>
                <IconX size={15} style={{ color: STATUS.danger }} />
                <h2 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                  {t('flashcards.reviewListTitle', { count: needReview.length })}
                </h2>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                {needReview.map((record, i) => {
                  const gc = AC[record.word.gender] || ACCENT.srs;
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3"
                      style={{ background: `${STATUS.danger}08` }}>
                      <div>
                        <span className="text-body font-semibold" style={{ color: gc }}>{record.word.article}</span>
                        <span className="text-sm font-bold ml-1.5" style={{ color: 'var(--theme-text-primary)' }}>{record.word.word}</span>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{record.word.translationEn}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {!isWordBankMode && <AddWrongWordsToBank wrongWords={needReview.map(r => r.word)} />}
        <GameResultUpsell />
      </>
    );
  }

  // ─── Playing ───
  const genderColor = currentWord ? (AC[currentWord.gender] || ACCENT.srs) : ACCENT.srs;
  const knewCount = results.filter(r => r.knew).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
      <GamePlayHeader title={t('flashcards.title')} streak={streak} timer={timer}
        onExit={() => { window.speechSynthesis?.cancel(); playClick(); router.push('/games'); }} />
      <GameStatsBar stats={[
        { label: t('flashcards.stats.known'), value: knewCount,                        color: STATUS.success, dot: true },
        { label: t('flashcards.stats.needReview'), value: results.length - knewCount,       color: STATUS.danger, dot: true },
        { label: t('common.streak'), value: streak,                           color: ACCENT.xp },
        { label: t('flashcards.stats.card'),    value: `${index + 1}/${words?.length || 0}`, color: 'var(--theme-text-primary)' },
      ]} />
      <GameProgressBar current={index} total={words?.length || 1} />

      {/* 3D Flashcard */}
      {currentWord && (
        <div className="my-5" style={{ perspective: '1200px' }}>
          <div
            onClick={flipCard}
            className="relative cursor-pointer select-none transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              minHeight: '260px',
            }}
          >
            {/* ─── FRONT (Word — article hidden intentionally) ─── */}
            <div className="absolute inset-0 rounded-2xl border p-6 flex flex-col items-center justify-center"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                backgroundColor: 'var(--theme-bg-card)',
                borderColor: 'var(--theme-border)',
              }}>
              <p className="text-[10.5px] mb-2 font-bold uppercase tracking-widest" style={{ color: 'var(--theme-text-muted)' }}>{t('flashcards.front.label')}</p>

              <h2 className="text-4xl md:text-5xl font-extrabold mb-2 tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
                {currentWord.word}
              </h2>

              {/* Plural form */}
              {currentWord.plural && (
                <p className="text-sm mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                  {t('flashcards.front.pluralPrefix', { plural: currentWord.plural })}
                </p>
              )}

              {/* Pronunciation (IPA) */}
              {currentWord.pronunciation && (
                <p className="text-body mb-4" style={{ color: 'var(--theme-text-muted)' }}>
                  [{currentWord.pronunciation}]
                </p>
              )}

              {/* Audio button */}
              <button
                onClick={(e) => { e.stopPropagation(); speakWord(currentWord.word, settings.speechRate < 0.7); }}
                className="w-11 h-11 rounded-full border flex items-center justify-center transition-all hover:scale-110 mb-5"
                style={{ backgroundColor: 'rgba(59,130,246,.12)', borderColor: 'rgba(59,130,246,.35)', color: ACCENT.srs }}>
                <IconVolume size={18} />
              </button>

              <p className="text-body font-medium" style={{ color: ACCENT.srs }}>
                {t.rich('flashcards.front.flipHint', { kbd: (chunks) => <KBD>{chunks}</KBD> })}
              </p>
            </div>

            {/* ─── BACK (Answer) — calm card with article-colour accent ─── */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl border p-6"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                backgroundColor: 'var(--theme-bg-card)',
                borderColor: `color-mix(in srgb, ${genderColor} 45%, transparent)`,
                borderTopWidth: 3,
                borderTopColor: genderColor,
              }}>
              <p className="text-[10.5px] font-bold uppercase tracking-widest" style={{ color: genderColor }}>{t('flashcards.back.answerLabel')}</p>
              <h2 className="text-center text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
                <span style={{ color: genderColor }}>{currentWord.article}</span> {currentWord.word}
              </h2>
              {currentWord.pronunciation && (
                <p className="mono text-caption" style={{ color: 'var(--theme-text-muted)' }}>[{currentWord.pronunciation}]</p>
              )}
              <p className="text-body font-medium" style={{ color: 'var(--theme-text-primary)' }}>{currentWord.translationEn}</p>
              {settings.showVietnamese && currentWord.translationVi && (
                <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{currentWord.translationVi}</p>
              )}
              <span className="rounded-sm px-2.5 py-0.5 text-[11px] font-bold" style={{ background: `color-mix(in srgb, ${genderColor} 18%, transparent)`, color: genderColor }}>
                {currentWord.gender && GenderInfo[currentWord.gender]
                  ? GenderInfo[currentWord.gender].label
                  : t('flashcards.back.unknownGender')}
              </span>

              {/* Example sentence */}
              {currentWord.examples && currentWord.examples.length > 0 && (
                <div className="mt-1 max-w-full rounded-[9px] px-3.5 py-2 text-center text-caption italic"
                  style={{ background: 'var(--theme-bg-secondary)', borderLeft: `2px solid ${genderColor}`, color: 'var(--theme-text-muted)' }}>
                  &bdquo;{currentWord.examples[0]}&ldquo;
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {isFlipped ? (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleResponse(false)}
            className="flex h-14 items-center justify-center gap-2 rounded-[14px] border text-[15px] font-bold transition-transform active:scale-95"
            style={{ background: `color-mix(in srgb, ${STATUS.danger} 12%, transparent)`, borderColor: `color-mix(in srgb, ${STATUS.danger} 40%, transparent)`, color: STATUS.danger }}>
            <IconX size={17} /> {t('flashcards.buttons.dontKnow')}
            <span className="mono text-[10px] font-medium opacity-70 ml-1">←</span>
          </button>
          <button onClick={() => handleResponse(true)}
            className="flex h-14 items-center justify-center gap-2 rounded-[14px] text-[15px] font-bold text-white transition-transform active:scale-95"
            style={{ background: STATUS.success, boxShadow: `0 6px 18px ${STATUS.success}59` }}>
            <IconCheck size={17} /> {t('flashcards.buttons.know')}
            <span className="mono text-[10px] font-medium opacity-80 ml-1">→</span>
          </button>
        </div>
      ) : (
        <button onClick={flipCard}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] text-[15px] font-bold text-white transition-transform active:scale-[.98]"
          style={{ background: ACCENT.srs, boxShadow: `0 6px 18px ${ACCENT.srs}66` }}>
          <IconRefresh size={16} /> {t('flashcards.buttons.flip')}
        </button>
      )}

      {/* Navigation row */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button onClick={goToPrev} disabled={index === 0}
          className="flex h-10 w-10 items-center justify-center rounded-full border transition-all disabled:opacity-30 hover:opacity-80"
          style={{ color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
          title={t('flashcards.nav.prev')}>
          <IconChevronLeft size={18} />
        </button>
        <button
          onClick={() => speakWord(currentWord?.word || '', settings.speechRate < 0.7)}
          className="flex h-10 w-10 items-center justify-center rounded-full border transition-all hover:opacity-80"
          style={{ color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
          title={t('flashcards.nav.speak')}>
          <IconVolume size={18} />
        </button>
        <button
          onClick={() => { setIsFlipped(false); playClick(); startGame(); }}
          className="flex h-10 w-10 items-center justify-center rounded-full border transition-all hover:opacity-80"
          style={{ color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
          title={t('flashcards.nav.shuffle')}>
          <IconShuffle size={18} />
        </button>
        <button onClick={goToNext} disabled={!words || index >= words.length - 1}
          className="flex h-10 w-10 items-center justify-center rounded-full border transition-all disabled:opacity-30 hover:opacity-80"
          style={{ color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
          title={t('flashcards.nav.next')}>
          <IconChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
