'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { useRandomWords } from '@/hooks/useWords';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useGameSession } from '@/hooks/useGameSession';
import { GenderInfo, Word } from '@/types';
import {
  GameSetupCard, GameResultCard, GameButton, GameProgressBar, StatCard,
  AnswerReview, GameInfoBox, KBD,
  IconLayers, IconCheck, IconX, IconFlame, IconRocket, IconKeyboard, IconVolume,
  IconRefresh, IconChevronLeft,
} from '@/components/games/GameUI';

const AC: Record<string, string> = { masculine: '#3B82F6', feminine: '#EC4899', neuter: '#22C55E' };

type Phase = 'setup' | 'playing' | 'result';
interface CardResult { word: Word; knew: boolean; }

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
  const progress = words?.length ? (index / words.length) * 100 : 0;

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

  const flipCard = () => { playClick(); setIsFlipped(!isFlipped); };

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
        if (bestStreak >= 5 || streak >= 5) setTimeout(() => playStreak(), 300);
        setPhase('result');
      } else { setIndex(i => i + 1); setIsFlipped(false); }
    }, 300);
  }, [currentWord, index, words?.length, streak, bestStreak, playCorrect, playWrong, playCombo, playGameOver, playStreak]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!isFlipped) flipCard(); }
      else if (e.key === 'ArrowLeft' || e.key === '1') { if (isFlipped) handleResponse(false); }
      else if (e.key === 'ArrowRight' || e.key === '2') { if (isFlipped) handleResponse(true); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [phase, isFlipped, handleResponse]);

  // Save game session to backend when game ends
  useEffect(() => {
    if (phase === 'result') {
      session.end(knewRef.current * 10, bestStreakRef.current, knewRef.current, didntKnowRef.current);
    }
  }, [phase, session]);

  // ─── Setup ───
  if (phase === 'setup') {
    return (
      <MainLayout>
        <GameSetupCard icon={({ size }) => <IconLayers size={size} style={{ color: 'white' }} />} iconColor="#22C55E" title="Flashcards">
          <p className="text-[14px] mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
            Ôn tập <span className="font-bold" style={{ color: '#22C55E' }}>{cardsCount} từ</span> với thẻ ghi nhớ
          </p>
          <p className="text-[12px] mb-6" style={{ color: 'var(--theme-text-muted)' }}>(Thay đổi số thẻ trong Settings → Học tập)</p>
          <GameInfoBox>
            <div className="flex items-center gap-2"><IconLayers size={14} style={{ color: '#22C55E' }} /><span>Click thẻ hoặc nhấn <KBD>Space</KBD> để lật</span></div>
            <div className="flex items-center gap-2"><IconKeyboard size={14} style={{ color: '#8B5CF6' }} /><span><KBD>←</KBD> Chưa nhớ · <KBD>→</KBD> Đã nhớ</span></div>
            <div className="flex items-center gap-2"><IconVolume size={14} style={{ color: '#3B82F6' }} /><span>Âm thanh: {settings.soundEnabled ? 'Bật' : 'Tắt'}</span></div>
          </GameInfoBox>
          <div className="flex gap-3 justify-center mt-6">
            <GameButton onClick={startGame} loading={isLoading} color="#22C55E"><IconRocket size={16} /> Bắt đầu</GameButton>
            <GameButton variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Quay lại</GameButton>
          </div>
        </GameSetupCard>
      </MainLayout>
    );
  }

  // ─── Result ───
  if (phase === 'result') {
    const knewCount = results.filter(r => r.knew).length;
    const didntKnowCount = results.filter(r => !r.knew).length;
    const accuracy = Math.round((knewCount / results.length) * 100);
    const needReview = results.filter(r => !r.knew);

    return (
      <MainLayout>
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
      </MainLayout>
    );
  }

  // ─── Playing ───
  const genderColor = currentWord ? (AC[currentWord.gender] || '#3B82F6') : '#3B82F6';

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
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

        {/* Flashcard */}
        {currentWord && (
          <div className="relative h-80 my-7">
            {/* Front */}
            <div
              className={`absolute inset-0 rounded-2xl border-2 p-8 flex flex-col items-center justify-center
                cursor-pointer transition-all duration-300
                ${isFlipped ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 hover:-translate-y-1 hover:shadow-lg'}`}
              style={{ borderColor: '#3B82F6', backgroundColor: 'var(--theme-bg-card)' }}
              onClick={flipCard}>
              <p className="text-[12px] mb-4" style={{ color: 'var(--theme-text-muted)' }}>Từ tiếng Đức</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
                {currentWord.word}
              </h2>
              {currentWord.pronunciation && settings.showPronunciation && (
                <p className="text-[14px]" style={{ color: 'var(--theme-text-muted)' }}>[{currentWord.pronunciation}]</p>
              )}
              <p className="mt-8 text-[13px] font-medium" style={{ color: '#3B82F6' }}>
                Click để lật thẻ
              </p>
            </div>

            {/* Back */}
            <div
              className={`absolute inset-0 rounded-2xl p-8 flex flex-col items-center justify-center
                transition-all duration-300
                ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none scale-95'}`}
              style={{ background: `linear-gradient(135deg, ${genderColor}, ${genderColor}cc)` }}>
              <p className="text-white/70 text-[12px] mb-2">Đáp án</p>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">
                {currentWord.article} {currentWord.word}
              </h2>
              <p className="text-white/90 text-[18px] mb-1">{currentWord.translationEn}</p>
              {settings.showVietnamese && currentWord.translationVi && (
                <p className="text-white/60 text-[14px]">{currentWord.translationVi}</p>
              )}
              <div className="mt-4 px-4 py-1.5 bg-white/15 rounded-full">
                <span className="text-white text-[13px] font-medium">{GenderInfo[currentWord.gender].label}</span>
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

        <div className="text-center mt-5">
          <GameButton variant="ghost" onClick={() => { playClick(); router.push('/games'); }}>
            <IconX size={14} /> Thoát
          </GameButton>
        </div>
      </div>
    </MainLayout>
  );
}