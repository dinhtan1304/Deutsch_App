'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRandomWords } from '@/hooks/useWords';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useGameSession } from '@/hooks/useGameSession';
import { GenderInfo, Word } from '@/types';
import {
  GameSetupCard, GameResultCard, GameProgressBar, StatCard,
  AddWrongWordsToBank, GameResultUpsell, GameInfoBox, KBD,
  GamePlayHeader, GameStatsBar, useGameTimer,
  IconLayers, IconCheck, IconX, IconRocket, IconKeyboard, IconVolume,
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

function speakWord(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE'; u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

export default function FlashcardsPage() {
  const router = useRouter();
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

  const cardsCount = isLoaded ? settings.questionsPerGame : 20;
  const { data: words, refetch, isLoading } = useRandomWords(cardsCount, {});
  const currentWord = words?.[index];

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const startGame = async () => {
    playClick();
    setLoadError(null);
    const result = await refetch();
    if (!result.data?.length) { setLoadError('Không có từ vựng! Vui lòng thêm từ hoặc seed database.'); return; }
    setIndex(0); setIsFlipped(false); setResults([]); setStreak(0); setBestStreak(0);
    knewRef.current = 0; bestStreakRef.current = 0; didntKnowRef.current = 0;
    setPhase('playing');
    session.start(cardsCount);
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

  const timer = useGameTimer(phase === 'playing');

  // ─── Setup ───
  if (phase === 'setup') {
    return (
      <GameSetupCard icon={({ size }) => <IconLayers size={size} style={{ color: 'white' }} />} iconColor={STATUS.success} title="Flashcards" loadError={loadError}>
        <p className="text-sm mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
          Ôn tập <span className="font-bold" style={{ color: STATUS.success }}>{cardsCount} từ</span> với thẻ ghi nhớ
        </p>
        <p className="text-xs mb-6" style={{ color: 'var(--theme-text-muted)' }}>(Thay đổi số thẻ trong Settings → Học tập)</p>
        <GameInfoBox>
          <div className="flex items-center gap-2"><IconLayers size={14} style={{ color: STATUS.success }} /><span>Click thẻ hoặc nhấn <KBD>Space</KBD> để lật</span></div>
          <div className="flex items-center gap-2"><IconKeyboard size={14} style={{ color: ACCENT.vocab }} /><span><KBD>←</KBD> Chưa nhớ · <KBD>→</KBD> Đã nhớ</span></div>
          <div className="flex items-center gap-2"><IconVolume size={14} style={{ color: ACCENT.srs }} /><span>Nút 🔊 để nghe phát âm tiếng Đức</span></div>
        </GameInfoBox>
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="game" accent="reading" onClick={startGame} isLoading={isLoading} ><IconRocket size={16} /> Bắt đầu</Button>
          <Button variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Quay lại</Button>
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
        <GameResultCard accuracy={accuracy} title="Hoàn thành!">
          <div className="grid grid-cols-3 gap-2 my-5">
            <StatCard label="Đã nhớ" value={knewCount} />
            <StatCard label="Cần ôn" value={didntKnowCount} color={STATUS.danger} />
            <StatCard label="Best Streak" value={bestStreak} color={ACCENT.xp} />
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="game" accent="reading" onClick={startGame} ><IconRefresh size={16} /> Học lại</Button>
            <Button variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Menu</Button>
          </div>
        </GameResultCard>

        {needReview.length > 0 && (
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="rounded-2xl border overflow-hidden"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
              <div className="px-5 py-4 border-b flex items-center gap-2"
                style={{ borderColor: 'var(--theme-border)' }}>
                <IconX size={15} style={{ color: STATUS.danger }} />
                <h2 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                  Từ cần ôn lại ({needReview.length})
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
        <AddWrongWordsToBank wrongWords={needReview.map(r => r.word)} />
        <GameResultUpsell />
      </>
    );
  }

  // ─── Playing ───
  const genderColor = currentWord ? (AC[currentWord.gender] || ACCENT.srs) : ACCENT.srs;
  const knewCount = results.filter(r => r.knew).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
      <GamePlayHeader title="Flashcards" streak={streak} timer={timer}
        onExit={() => { window.speechSynthesis?.cancel(); playClick(); router.push('/games'); }} />
      <GameStatsBar stats={[
        { label: 'Đã nhớ', value: knewCount,                        color: STATUS.success, dot: true },
        { label: 'Cần ôn', value: results.length - knewCount,       color: STATUS.danger, dot: true },
        { label: 'Streak', value: streak,                           color: ACCENT.xp },
        { label: 'Thẻ',    value: `${index + 1}/${words?.length || 0}`, color: 'var(--theme-text-primary)' },
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
            <div className="absolute inset-0 rounded-2xl border-2 p-6 flex flex-col items-center justify-center"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                backgroundColor: 'var(--theme-bg-card)',
                borderColor: ACCENT.srs,
              }}>
              <p className="text-[10px] mb-2 opacity-40 uppercase tracking-widest" style={{ color: 'var(--theme-text-primary)' }}>Từ tiếng Đức</p>

              <h2 className="text-3xl md:text-4xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
                {currentWord.word}
              </h2>

              {/* Plural form */}
              {currentWord.plural && (
                <p className="text-sm mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                  Pl. {currentWord.plural}
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
                onClick={(e) => { e.stopPropagation(); speakWord(currentWord.word); }}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 mb-5"
                style={{ backgroundColor: 'rgba(59,130,246,.1)', color: ACCENT.srs }}>
                <IconVolume size={20} />
              </button>

              <p className="text-body font-medium" style={{ color: ACCENT.srs }}>
                Click để lật thẻ · <KBD>Space</KBD>
              </p>
            </div>

            {/* ─── BACK (Answer) ─── */}
            <div className="absolute inset-0 rounded-2xl p-8 flex flex-col items-center justify-center"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: `linear-gradient(135deg, ${genderColor}, ${genderColor}cc)`,
                borderRadius: '1rem',
              }}>
              <p className="text-white/70 text-xs mb-2">Đáp án</p>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">
                {currentWord.article} {currentWord.word}
              </h2>
              <p className="text-white/90 text-title mb-1">{currentWord.translationEn}</p>
              {settings.showVietnamese && currentWord.translationVi && (
                <p className="text-white/70 text-sm mb-3">{currentWord.translationVi}</p>
              )}
              <div className="mb-3 px-4 py-1.5 bg-white/15 rounded-full">
                <span className="text-white text-body font-medium">
                  {currentWord.gender && GenderInfo[currentWord.gender] 
                    ? GenderInfo[currentWord.gender].label 
                    : 'Unbekannt'}
                </span>
              </div>

              {/* Example sentence */}
              {currentWord.examples && currentWord.examples.length > 0 && (
                <div className="w-full mt-1 px-4">
                  <div className="text-xs italic text-center py-2 px-3 rounded-xl bg-white/15 text-white/80">
                    &bdquo;{currentWord.examples[0]}&ldquo;
                  </div>
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
            className="py-5 rounded-2xl font-bold text-title text-white transition-all duration-200
              hover:-translate-y-1 hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
            // eslint-disable-next-line no-restricted-syntax
            style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', boxShadow: `0 4px 16px ${STATUS.danger}40` }}>
            <IconX size={18} /> Chưa nhớ
            <span className="text-caption font-medium opacity-70 ml-1">← / 1</span>
          </button>
          <button onClick={() => handleResponse(true)}
            className="py-5 rounded-2xl font-bold text-title text-white transition-all duration-200
              hover:-translate-y-1 hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
            // eslint-disable-next-line no-restricted-syntax
            style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow: `0 4px 16px ${STATUS.success}40` }}>
            <IconCheck size={18} /> Đã nhớ
            <span className="text-caption font-medium opacity-70 ml-1">→ / 2</span>
          </button>
        </div>
      ) : (
        <Button variant="game" accent="srs" onClick={flipCard} className="w-full" >
          <IconRefresh size={16} /> Lật thẻ (Space)
        </Button>
      )}

      {/* Navigation row */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button onClick={goToPrev} disabled={index === 0}
          className="p-2.5 rounded-xl border transition-all disabled:opacity-30 hover:opacity-80"
          style={{ color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
          title="Thẻ trước">
          <IconChevronLeft size={18} />
        </button>
        <button
          onClick={() => speakWord(currentWord?.word || '')}
          className="p-2.5 rounded-xl border transition-all hover:opacity-80"
          style={{ color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
          title="Phát âm">
          <IconVolume size={18} />
        </button>
        <button
          onClick={() => { setIsFlipped(false); playClick(); startGame(); }}
          className="p-2.5 rounded-xl border transition-all hover:opacity-80"
          style={{ color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
          title="Xáo trộn lại">
          <IconShuffle size={18} />
        </button>
        <button onClick={goToNext} disabled={!words || index >= words.length - 1}
          className="p-2.5 rounded-xl border transition-all disabled:opacity-30 hover:opacity-80"
          style={{ color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
          title="Thẻ tiếp">
          <IconChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
