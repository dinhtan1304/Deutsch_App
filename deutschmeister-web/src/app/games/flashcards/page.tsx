'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRandomWords } from '@/hooks/useWords';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useGameSession } from '@/hooks/useGameSession';
import { GenderInfo, Word } from '@/types';
import {
  GameSetupCard, GameResultCard, GameButton, GameProgressBar, StatCard,
  GameInfoBox, KBD,
  IconLayers, IconCheck, IconX, IconFlame, IconRocket, IconKeyboard, IconVolume,
  IconRefresh, IconChevronLeft, IconChevronRight,
} from '@/components/games/GameUI';

const AC: Record<string, string> = { masculine: '#3B82F6', feminine: '#EC4899', neuter: '#22C55E' };

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
    const result = await refetch();
    if (!result.data?.length) { alert('Không có từ vựng!'); return; }
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

  // ─── Setup ───
  if (phase === 'setup') {
    return (
      <GameSetupCard icon={({ size }) => <IconLayers size={size} style={{ color: 'white' }} />} iconColor="#22C55E" title="Flashcards">
        <p className="text-[14px] mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
          Ôn tập <span className="font-bold" style={{ color: '#22C55E' }}>{cardsCount} từ</span> với thẻ ghi nhớ
        </p>
        <p className="text-[12px] mb-6" style={{ color: 'var(--theme-text-muted)' }}>(Thay đổi số thẻ trong Settings → Học tập)</p>
        <GameInfoBox>
          <div className="flex items-center gap-2"><IconLayers size={14} style={{ color: '#22C55E' }} /><span>Click thẻ hoặc nhấn <KBD>Space</KBD> để lật</span></div>
          <div className="flex items-center gap-2"><IconKeyboard size={14} style={{ color: '#8B5CF6' }} /><span><KBD>←</KBD> Chưa nhớ · <KBD>→</KBD> Đã nhớ</span></div>
          <div className="flex items-center gap-2"><IconVolume size={14} style={{ color: '#3B82F6' }} /><span>Nút 🔊 để nghe phát âm tiếng Đức</span></div>
        </GameInfoBox>
        <div className="flex gap-3 justify-center mt-6">
          <GameButton onClick={startGame} loading={isLoading} color="#22C55E"><IconRocket size={16} /> Bắt đầu</GameButton>
          <GameButton variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Quay lại</GameButton>
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
            <StatCard label="Đã nhớ" value={knewCount} color="#22C55E" />
            <StatCard label="Cần ôn" value={didntKnowCount} color="#EF4444" />
            <StatCard label="Best Streak" value={bestStreak} color="#F59E0B" />
          </div>
          <div className="flex gap-3 justify-center">
            <GameButton onClick={startGame} color="#22C55E"><IconRefresh size={16} /> Học lại</GameButton>
            <GameButton variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Menu</GameButton>
          </div>
        </GameResultCard>

        {needReview.length > 0 && (
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="rounded-2xl border overflow-hidden"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
              <div className="px-5 py-4 border-b flex items-center gap-2"
                style={{ borderColor: 'var(--theme-border)' }}>
                <IconX size={15} style={{ color: '#EF4444' }} />
                <h2 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                  Từ cần ôn lại ({needReview.length})
                </h2>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                {needReview.map((record, i) => {
                  const gc = AC[record.word.gender] || '#3B82F6';
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3"
                      style={{ background: 'rgba(239,68,68,.03)' }}>
                      <div>
                        <span className="text-[13px] font-semibold" style={{ color: gc }}>{record.word.article}</span>
                        <span className="text-[14px] font-bold ml-1.5" style={{ color: 'var(--theme-text-primary)' }}>{record.word.word}</span>
                      </div>
                      <span className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>{record.word.translationEn}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ─── Playing ───
  const genderColor = currentWord ? (AC[currentWord.gender] || '#3B82F6') : '#3B82F6';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 text-[13px]">
          <span style={{ color: '#22C55E' }}>✓ {results.filter(r => r.knew).length}</span>
          <span style={{ color: '#EF4444' }}>✗ {results.filter(r => !r.knew).length}</span>
        </div>
        <div className="text-[13px] font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
          {index + 1} / {words?.length || 0}
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-[12px] font-bold"
            style={{ background: 'linear-gradient(135deg, #F97316, #EF4444)' }}>
            <IconFlame size={13} /> {streak} streak
          </div>
        )}
      </div>

      <GameProgressBar current={index} total={words?.length || 1} color="#22C55E" />

      {/* 3D Flashcard */}
      {currentWord && (
        <div className="my-7" style={{ perspective: '1200px' }}>
          <div
            onClick={flipCard}
            className="relative cursor-pointer select-none transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              minHeight: '300px',
            }}
          >
            {/* ─── FRONT (Word — article hidden intentionally) ─── */}
            <div className="absolute inset-0 rounded-2xl border-2 p-8 flex flex-col items-center justify-center"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                backgroundColor: 'var(--theme-bg-card)',
                borderColor: '#3B82F6',
              }}>
              <p className="text-[12px] mb-4" style={{ color: 'var(--theme-text-muted)' }}>Từ tiếng Đức</p>

              <h2 className="text-4xl md:text-5xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                {currentWord.word}
              </h2>

              {/* Plural form */}
              {currentWord.plural && (
                <p className="text-[14px] mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                  Pl. {currentWord.plural}
                </p>
              )}

              {/* Pronunciation (IPA) */}
              {currentWord.pronunciation && (
                <p className="text-[13px] mb-4" style={{ color: 'var(--theme-text-muted)' }}>
                  [{currentWord.pronunciation}]
                </p>
              )}

              {/* Audio button */}
              <button
                onClick={(e) => { e.stopPropagation(); speakWord(currentWord.word); }}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 mb-5"
                style={{ backgroundColor: 'rgba(59,130,246,.1)', color: '#3B82F6' }}>
                <IconVolume size={20} />
              </button>

              <p className="text-[13px] font-medium" style={{ color: '#3B82F6' }}>
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
              <p className="text-white/70 text-[12px] mb-2">Đáp án</p>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">
                {currentWord.article} {currentWord.word}
              </h2>
              <p className="text-white/90 text-[18px] mb-1">{currentWord.translationEn}</p>
              {settings.showVietnamese && currentWord.translationVi && (
                <p className="text-white/70 text-[14px] mb-3">{currentWord.translationVi}</p>
              )}
              <div className="mb-3 px-4 py-1.5 bg-white/15 rounded-full">
                <span className="text-white text-[13px] font-medium">{GenderInfo[currentWord.gender].label}</span>
              </div>

              {/* Example sentence */}
              {currentWord.examples && currentWord.examples.length > 0 && (
                <div className="w-full mt-1 px-4">
                  <div className="text-[12px] italic text-center py-2 px-3 rounded-xl bg-white/15 text-white/80">
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
            className="py-5 rounded-2xl font-bold text-[18px] text-white transition-all duration-200
              hover:-translate-y-1 hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', boxShadow: '0 4px 16px rgba(239,68,68,.25)' }}>
            <IconX size={18} /> Chưa nhớ
            <span className="text-[11px] font-medium opacity-70 ml-1">← / 1</span>
          </button>
          <button onClick={() => handleResponse(true)}
            className="py-5 rounded-2xl font-bold text-[18px] text-white transition-all duration-200
              hover:-translate-y-1 hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow: '0 4px 16px rgba(34,197,94,.25)' }}>
            <IconCheck size={18} /> Đã nhớ
            <span className="text-[11px] font-medium opacity-70 ml-1">→ / 2</span>
          </button>
        </div>
      ) : (
        <GameButton onClick={flipCard} className="w-full" color="#3B82F6">
          <IconRefresh size={16} /> Lật thẻ (Space)
        </GameButton>
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
          onClick={() => { window.speechSynthesis?.cancel(); playClick(); router.push('/games'); }}
          className="px-3 py-2.5 rounded-xl border text-[12px] font-medium transition-all hover:opacity-80 flex items-center gap-1.5"
          style={{ color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <IconX size={13} /> Thoát
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
