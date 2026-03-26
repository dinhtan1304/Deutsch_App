'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useRandomWords } from '@/hooks/useWords';
import { useDueCards, useReviewCard, useAddWordsToSRS, useProgressStats } from '@/hooks/useProgress';
import { previewIntervals, getIntervalText } from '@/lib/srs';
import { GenderInfo, ReviewRating, Progress } from '@/types';
import {
  IconBrain, IconRefresh, IconTarget, IconFlame, IconBookOpen, IconChevronLeft,
} from '@/components/ui/Icons';
import type { SVGProps } from 'react';

type IconProps = { size?: number } & SVGProps<SVGSVGElement>;

function IconTrophy({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-1-3.25-2.03-3.79A1.07 1.07 0 0 1 14 17v-2.34" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
function IconPlus({ size = 16 }: { size?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>);
}
function IconX({ size = 16 }: { size?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>);
}
function IconZap({ size = 16 }: { size?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>);
}
function IconLanguages({ size = 16 }: { size?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" />
    <path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>);
}
function IconShuffle({ size = 16 }: { size?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
    <path d="m18 2 4 4-4 4" /><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
    <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" /><path d="m18 14 4 4-4 4" /></svg>);
}

type QuizMode = 'gender' | 'de-vi' | 'vi-de' | 'mixed';

const QUIZ_MODES: { key: QuizMode; label: string; desc: string; icon: any; color: string }[] = [
  { key: 'gender', label: 'Mạo từ', desc: 'der / die / das', icon: IconTarget, color: '#3B82F6' },
  { key: 'de-vi', label: 'Đức → Việt', desc: 'Nhìn từ, đoán nghĩa', icon: IconLanguages, color: '#8B5CF6' },
  { key: 'vi-de', label: 'Việt → Đức', desc: 'Nhìn nghĩa, nhớ từ', icon: IconBookOpen, color: '#F59E0B' },
  { key: 'mixed', label: 'Hỗn hợp', desc: 'Ngẫu nhiên tất cả', icon: IconShuffle, color: '#22C55E' },
];

const GENDER_HEX: Record<string, { color: string; gradient: string }> = {
  blue: { color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
  pink: { color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899, #BE185D)' },
  green: { color: '#22C55E', gradient: 'linear-gradient(135deg, #22C55E, #15803D)' },
};

type Phase = 'loading' | 'empty' | 'setup' | 'reviewing' | 'complete';

export default function SRSReviewPage() {
  const router = useRouter();
  const { settings, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playClick, playLevelUp, playStreak } = useSoundEffects();

  const { data: dueCards = [], isLoading: dueLoading, refetch: refetchDue } = useDueCards(100);
  const { data: stats } = useProgressStats();
  const reviewMutation = useReviewCard();
  const addWordsMutation = useAddWordsToSRS();
  const { data: randomWords, refetch: refetchRandom } = useRandomWords(20, {});

  const [phase, setPhase] = useState<Phase>('loading');
  const [quizMode, setQuizMode] = useState<QuizMode>('mixed');
  const [reviewQueue, setReviewQueue] = useState<Progress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0, streak: 0, bestStreak: 0 });
  const [cardModes, setCardModes] = useState<Record<number, Exclude<QuizMode, 'mixed'>>>({});

  // Stable ref for reviewMutation.mutate — avoids recreating handleReview on every
  // mutation state change (idle→pending→success→idle), which would thrash the keydown listener.
  const reviewMutateRef = useRef(reviewMutation.mutate);
  useEffect(() => { reviewMutateRef.current = reviewMutation.mutate; }, [reviewMutation.mutate]);

  // Tracked so we can cancel it on unmount and on rapid successive answers.
  const nextCardTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Mirrors sessionStats.streak so handleReview can read it without adding sessionStats
  // to its deps (which would recreate the callback and thrash the keydown listener).
  const streakRef = useRef(0);

  // Cancel pending card-advance timer on unmount to prevent state updates on unmounted component.
  useEffect(() => () => {
    if (nextCardTimerRef.current) clearTimeout(nextCardTimerRef.current);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  useEffect(() => {
    if (dueLoading) { setPhase('loading'); return; }
    if (!stats) return;
    if (stats.total === 0) setPhase('empty');
    else if (stats.due === 0 && phase !== 'reviewing' && phase !== 'complete') setPhase('complete');
    else if (phase === 'loading') setPhase('setup');
  }, [dueLoading, stats, phase]);

  const getCardQuizMode = useCallback((card: Progress): Exclude<QuizMode, 'mixed'> => {
    if (quizMode !== 'mixed') return quizMode;
    const modes: Exclude<QuizMode, 'mixed'>[] = ['de-vi'];
    if (card.word?.gender) modes.push('gender');
    if (card.word?.translationVi || card.word?.translationEn) modes.push('vi-de');
    return modes[Math.floor(Math.random() * modes.length)];
  }, [quizMode]);

  const startReview = useCallback(() => {
    if (dueCards.length === 0) { setPhase('complete'); return; }
    const shuffled = [...dueCards].sort(() => Math.random() - 0.5);
    const queue = shuffled.slice(0, settings.questionsPerGame);
    setReviewQueue(queue);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({ correct: 0, wrong: 0, streak: 0, bestStreak: 0 }); streakRef.current = 0;
    const modes: Record<number, Exclude<QuizMode, 'mixed'>> = {};
    queue.forEach((card, i) => { modes[i] = getCardQuizMode(card); });
    setCardModes(modes);
    setPhase('reviewing');
    playClick();
  }, [dueCards, settings.questionsPerGame, playClick, getCardQuizMode]);

  const currentCard = reviewQueue[currentIndex] || null;
  const currentWord = currentCard?.word || null;
  const currentMode = cardModes[currentIndex] || 'de-vi';
  const intervals = currentCard ? previewIntervals(currentCard) : null;
  const genderInfo = currentWord ? GenderInfo[currentWord.gender] : null;
  const genderHex = genderInfo ? GENDER_HEX[genderInfo.color] || GENDER_HEX.blue : GENDER_HEX.blue;

  const flipCard = () => { if (!isFlipped) { playClick(); setIsFlipped(true); } };

  const handleReview = useCallback((rating: ReviewRating) => {
    if (!currentCard) return;
    // Use ref so this callback doesn't need reviewMutation in its deps — the mutation
    // object changes identity on every API state transition (idle→pending→success→idle),
    // which would force handleReview to recreate and thrash the keydown event listener.
    reviewMutateRef.current({ wordId: currentCard.wordId, rating });
    const isCorrect = rating !== 'again';
    if (isCorrect) {
      playCorrect();
      // Compute new streak from ref so we don't need sessionStats in deps (which would
      // recreate handleReview on every review and thrash the keydown listener).
      const newStreak = streakRef.current + 1;
      streakRef.current = newStreak;
      // Trigger combo sound BEFORE state update — keeps side effect out of the updater
      // function, preventing double-fire in React 18 StrictMode.
      if (newStreak === 5 || newStreak === 10) setTimeout(() => playCombo(), 200);
      setSessionStats(prev => ({
        ...prev, correct: prev.correct + 1, streak: newStreak, bestStreak: Math.max(prev.bestStreak, newStreak),
      }));
    } else {
      playWrong();
      streakRef.current = 0;
      setSessionStats(prev => ({ ...prev, wrong: prev.wrong + 1, streak: 0 }));
    }
    // Cancel any previous pending card-advance to prevent stacking timers on fast clicks.
    if (nextCardTimerRef.current) clearTimeout(nextCardTimerRef.current);
    nextCardTimerRef.current = setTimeout(() => {
      nextCardTimerRef.current = null;
      if (currentIndex + 1 >= reviewQueue.length) { playLevelUp(); setPhase('complete'); refetchDue(); }
      else { setCurrentIndex(i => i + 1); setIsFlipped(false); }
    }, 300);
  }, [currentCard, currentIndex, reviewQueue.length, playCorrect, playWrong, playCombo, playLevelUp, refetchDue]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (phase !== 'reviewing') return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!isFlipped) flipCard(); }
      else if (isFlipped) {
        if (e.key === '1') handleReview('again');
        else if (e.key === '2') handleReview('hard');
        else if (e.key === '3') handleReview('good');
        else if (e.key === '4') handleReview('easy');
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [phase, isFlipped, handleReview]);

  const addRandomWords = async () => {
    try {
      const result = await refetchRandom();
      if (result.data) {
        await addWordsMutation.mutateAsync(result.data.map(w => w.id));
        playStreak();
        refetchDue();
        setPhase('setup');
      }
    } catch { /* silently ignore – non-critical */ }
  };

  // Mode accent colors
  const modeAccent = currentMode === 'gender' ? genderHex.color
    : currentMode === 'de-vi' ? '#8B5CF6' : '#F59E0B';
  const modeGradient = currentMode === 'gender' ? genderHex.gradient
    : currentMode === 'de-vi' ? 'linear-gradient(135deg, #8B5CF6, #6366F1)'
    : 'linear-gradient(135deg, #F59E0B, #D97706)';

  // ─── LOADING ───
  if (phase === 'loading') {
    return (
<div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse"
        style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
        <IconBrain size={28} className="text-white" /></div></div>
);
  }

  // ─── EMPTY ───
  if (phase === 'empty') {
    return (
<div className="max-w-2xl mx-auto py-12">
      <div className="rounded-3xl p-8 text-center border"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,.15), rgba(99,102,241,.1))' }}>
          <IconBrain size={36} style={{ color: '#3B82F6' }} /></div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>SRS Review</h1>
        <p className="text-[14px] mb-8 max-w-sm mx-auto" style={{ color: 'var(--theme-text-muted)' }}>
          Bạn chưa có từ nào trong danh sách ôn tập.<br/>Thêm từ vào để bắt đầu học với thuật toán SM-2!</p>
        <button onClick={addRandomWords}
          className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-semibold text-[14px] text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
          <IconPlus size={17} /> Thêm 20 từ ngẫu nhiên</button>
        <p className="text-[12px] mt-3" style={{ color: 'var(--theme-text-muted)' }}>
          Hoặc thêm từ từ trang Từ vựng bằng nút ⭐</p>
        <div className="mt-8 p-4 rounded-xl text-left"
          style={{ backgroundColor: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.12)' }}>
          <h3 className="font-bold text-[14px] mb-2 flex items-center gap-2" style={{ color: '#3B82F6' }}>
            <span className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,.12)' }}><IconBrain size={14} style={{ color: '#3B82F6' }} /></span>
            SM-2 là gì?</h3>
          <p className="text-[13px]" style={{ color: 'var(--theme-text-secondary)' }}>
            SM-2 (SuperMemo 2) là thuật toán lặp lại ngắt quãng giúp bạn nhớ từ lâu hơn. Từ bạn nhớ tốt sẽ xuất hiện ít hơn, từ khó sẽ xuất hiện thường xuyên hơn.</p>
        </div>
      </div></div>
);
  }

  // ─── SETUP ───
  if (phase === 'setup') {
    const statItems = [
      { label: 'Cần ôn', value: stats?.due ?? 0, icon: IconFlame, color: '#EF4444',
        bg: 'linear-gradient(135deg, rgba(239,68,68,.12), rgba(239,68,68,.06))' },
      { label: 'Đã thuộc', value: stats?.mastered ?? 0, icon: IconTarget, color: '#22C55E',
        bg: 'linear-gradient(135deg, rgba(34,197,94,.12), rgba(34,197,94,.06))' },
      { label: 'Đang học', value: stats?.learning ?? 0, icon: IconBookOpen, color: '#F59E0B',
        bg: 'linear-gradient(135deg, rgba(245,158,11,.12), rgba(245,158,11,.06))' },
      { label: 'Tổng', value: stats?.total ?? 0, icon: IconBrain, color: '#6366F1',
        bg: 'linear-gradient(135deg, rgba(99,102,241,.12), rgba(99,102,241,.06))' },
    ];
    return (
<div className="max-w-2xl mx-auto py-12">
      <div className="rounded-3xl p-8 text-center border"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,.15), rgba(99,102,241,.1))' }}>
          <IconBrain size={36} style={{ color: '#3B82F6' }} /></div>
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--theme-text-primary)' }}>SRS Review</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {statItems.map(item => {
            const Ic = item.icon;
            return (<div key={item.label} className="relative overflow-hidden p-4 rounded-2xl" style={{ background: item.bg }}>
              <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full" style={{ backgroundColor: item.color, opacity: 0.06 }} />
              <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2 mx-auto"
                style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)` }}>
                <Ic size={14} className="text-white" /></div>
              <div className="text-2xl font-extrabold" style={{ color: item.color }}>{item.value}</div>
              <div className="text-[11px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</div>
            </div>);
          })}
        </div>

        {(stats?.due ?? 0) > 0 ? (<>
          {/* Quiz mode selector */}
          <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--theme-text-secondary)' }}>Chọn chế độ ôn tập</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 max-w-md mx-auto">
            {QUIZ_MODES.map(mode => {
              const active = quizMode === mode.key;
              const Ic = mode.icon;
              return (<button key={mode.key} onClick={() => setQuizMode(mode.key)}
                className="p-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 border-2"
                style={{ borderColor: active ? mode.color : 'var(--theme-border)',
                  backgroundColor: active ? `${mode.color}10` : 'transparent' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5"
                  style={{ background: active ? `linear-gradient(135deg, ${mode.color}, ${mode.color}cc)` : 'var(--theme-bg-secondary)' }}>
                  <Ic size={16} style={{ color: active ? 'white' : 'var(--theme-text-muted)' }} /></div>
                <div className="text-[12px] font-bold" style={{ color: active ? mode.color : 'var(--theme-text-secondary)' }}>{mode.label}</div>
                <div className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>{mode.desc}</div>
              </button>);
            })}
          </div>
          <p className="text-[14px] mb-6" style={{ color: 'var(--theme-text-secondary)' }}>
            Bạn có <span className="font-bold" style={{ color: '#3B82F6' }}>{stats?.due} từ</span> cần ôn tập hôm nay</p>
          <button onClick={startReview}
            className="flex items-center gap-2 mx-auto px-8 py-3 rounded-xl font-semibold text-[15px] text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
            <IconZap size={18} /> Bắt đầu ôn tập</button>
        </>) : (<>
          <p className="text-[14px] mb-6" style={{ color: '#22C55E' }}>✅ Tuyệt vời! Bạn đã ôn hết tất cả cho hôm nay.</p>
          <button onClick={addRandomWords}
            className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-semibold text-[14px] border transition-all hover:-translate-y-0.5"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
            <IconPlus size={16} /> Thêm từ mới</button>
        </>)}
        <div className="mt-6"><button onClick={() => router.push('/games')}
          className="flex items-center gap-1.5 mx-auto text-[13px] font-medium transition-all hover:opacity-70"
          style={{ color: 'var(--theme-text-muted)' }}><IconChevronLeft size={16} /> Quay lại</button></div>
      </div></div>
);
  }

  // ─── COMPLETE ───
  if (phase === 'complete') {
    const accuracy = sessionStats.correct + sessionStats.wrong > 0
      ? Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.wrong)) * 100) : 0;
    const resultItems = [
      { label: 'Đúng', value: sessionStats.correct, color: '#22C55E', bg: 'linear-gradient(135deg, rgba(34,197,94,.12), rgba(34,197,94,.06))' },
      { label: 'Sai', value: sessionStats.wrong, color: '#EF4444', bg: 'linear-gradient(135deg, rgba(239,68,68,.12), rgba(239,68,68,.06))' },
      { label: 'Chính xác', value: `${accuracy}%`, color: '#3B82F6', bg: 'linear-gradient(135deg, rgba(59,130,246,.12), rgba(59,130,246,.06))' },
      { label: 'Best Streak', value: sessionStats.bestStreak, color: '#F97316', bg: 'linear-gradient(135deg, rgba(249,115,22,.12), rgba(249,115,22,.06))' },
    ];
    return (
<div className="max-w-2xl mx-auto py-12">
      <div className="rounded-3xl p-8 text-center border"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, rgba(34,197,94,.15), rgba(52,211,153,.1))' }}>
          <IconTrophy size={36} style={{ color: '#22C55E' }} /></div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>Hoàn thành! 🎉</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          {resultItems.map(item => (<div key={item.label} className="p-4 rounded-2xl" style={{ background: item.bg }}>
            <div className="text-2xl font-extrabold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-[11px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</div>
          </div>))}
        </div>
        <div className="space-y-3">
          {(stats?.due ?? 0) > 0 && (
            <button onClick={() => { refetchDue(); setPhase('setup'); }}
              className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-semibold text-[14px] text-white transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
              <IconRefresh size={16} /> Ôn tiếp ({stats?.due} từ còn lại)</button>)}
          <button onClick={addRandomWords}
            className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-medium text-[14px] border transition-all hover:-translate-y-0.5"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
            <IconPlus size={16} /> Thêm từ mới</button>
          <button onClick={() => router.push('/games')}
            className="flex items-center gap-1.5 mx-auto text-[13px] font-medium transition-all hover:opacity-70"
            style={{ color: 'var(--theme-text-muted)' }}><IconChevronLeft size={16} /> Quay lại</button>
        </div>
      </div></div>
);
  }

  // ─── REVIEWING ───
  const progress = (currentIndex / reviewQueue.length) * 100;

  const renderFront = () => {
    if (!currentWord) return null;
    switch (currentMode) {
      case 'gender': return (<>
        <p className="text-[13px] mb-3" style={{ color: 'var(--theme-text-muted)' }}>Mạo từ nào?</p>
        <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--theme-text-primary)' }}>
          <span style={{ color: 'var(--theme-text-muted)', letterSpacing: '2px' }}>_____</span>{' '}{currentWord.word}</h2>
        <p className="text-[14px]" style={{ color: 'var(--theme-text-secondary)' }}>{currentWord.translationEn}</p>
        {settings.showVietnamese && currentWord.translationVi && (
          <p className="text-[13px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>{currentWord.translationVi}</p>)}
      </>);
      case 'de-vi': return (<>
        <div className="px-3 py-1 rounded-lg mb-4 inline-block" style={{ background: 'rgba(139,92,246,.1)' }}>
          <span className="text-[11px] font-semibold" style={{ color: '#8B5CF6' }}>Đức → Việt</span></div>
        <h2 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
          {currentWord.article && <span style={{ color: genderHex.color }}>{currentWord.article} </span>}{currentWord.word}</h2>
        {currentWord.pronunciation && <p className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>[{currentWord.pronunciation}]</p>}
        <p className="text-[14px] mt-3" style={{ color: 'var(--theme-text-muted)' }}>Nghĩa của từ này là gì?</p>
      </>);
      case 'vi-de': return (<>
        <div className="px-3 py-1 rounded-lg mb-4 inline-block" style={{ background: 'rgba(245,158,11,.1)' }}>
          <span className="text-[11px] font-semibold" style={{ color: '#F59E0B' }}>Việt → Đức</span></div>
        <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
          {currentWord.translationVi || currentWord.translationEn}</h2>
        {currentWord.translationVi && currentWord.translationEn && (
          <p className="text-[14px]" style={{ color: 'var(--theme-text-muted)' }}>({currentWord.translationEn})</p>)}
        <p className="text-[14px] mt-3" style={{ color: 'var(--theme-text-muted)' }}>Từ tiếng Đức là gì?</p>
      </>);
    }
  };

  const renderBack = () => {
    if (!currentWord) return null;
    switch (currentMode) {
      case 'gender': return (<>
        <p className="relative text-white/70 text-[13px] mb-2">Đáp án</p>
        <h2 className="relative text-4xl md:text-5xl font-bold text-white mb-4">{currentWord.article} {currentWord.word}</h2>
        <p className="relative text-white/90 text-[16px] mb-1">{currentWord.translationEn}</p>
        {settings.showVietnamese && currentWord.translationVi && <p className="relative text-white/60 text-[14px]">{currentWord.translationVi}</p>}
        <div className="relative mt-4 px-4 py-1.5 bg-white/15 rounded-lg backdrop-blur-sm">
          <span className="text-white font-semibold text-[13px]">{genderInfo?.label}</span></div>
      </>);
      case 'de-vi': return (<>
        <p className="relative text-white/70 text-[13px] mb-2">Nghĩa</p>
        <h2 className="relative text-3xl md:text-4xl font-bold text-white mb-2">{currentWord.translationVi || currentWord.translationEn}</h2>
        {currentWord.translationVi && currentWord.translationEn && <p className="relative text-white/70 text-[15px] mb-3">({currentWord.translationEn})</p>}
        {currentWord.article && <div className="relative mt-2 px-4 py-1.5 bg-white/15 rounded-lg backdrop-blur-sm">
          <span className="text-white font-semibold text-[13px]">{currentWord.article} {currentWord.word} • {genderInfo?.label}</span></div>}
        {currentWord.examples?.[0] && <div className="relative mt-3 p-3 bg-white/10 rounded-xl max-w-sm">
          <p className="text-[12px] text-white/50 mb-0.5">Ví dụ:</p>
          <p className="text-white/90 italic text-[13px]">„{currentWord.examples[0]}</p></div>}
      </>);
      case 'vi-de': return (<>
        <p className="relative text-white/70 text-[13px] mb-2">Từ tiếng Đức</p>
        <h2 className="relative text-4xl md:text-5xl font-bold text-white mb-3">
          {currentWord.article && <span className="text-white/70">{currentWord.article}</span>}{currentWord.word}</h2>
        {currentWord.pronunciation && <p className="relative text-white/60 text-[14px]">[{currentWord.pronunciation}]</p>}
        {genderInfo && <div className="relative mt-3 px-4 py-1.5 bg-white/15 rounded-lg backdrop-blur-sm">
          <span className="text-white font-semibold text-[13px]">{genderInfo.label}</span></div>}
        {currentWord.examples?.[0] && <div className="relative mt-3 p-3 bg-white/10 rounded-xl max-w-sm">
          <p className="text-[12px] text-white/50 mb-0.5">Ví dụ:</p>
          <p className="text-white/90 italic text-[13px]">„{currentWord.examples[0]}</p></div>}
      </>);
    }
  };

  return (
<div className="max-w-2xl mx-auto py-6">
    {/* Header */}
    <div className="flex justify-between items-center mb-4">
      <div className="text-[13px] font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
        {currentIndex + 1} / {reviewQueue.length}</div>
      <div className="flex items-center gap-2">
        <div className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
          style={{ backgroundColor: `${modeAccent}15`, color: modeAccent }}>
          {QUIZ_MODES.find(m => m.key === currentMode)?.label}</div>
        {sessionStats.streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[13px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #F97316, #EF4444)' }}>
            <IconFlame size={14} /> {sessionStats.streak}</div>)}
      </div>
    </div>

    {/* Progress */}
    <div className="h-2 rounded-full mb-6 overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #3B82F6, #22C55E)' }} /></div>

    {/* Card */}
    {currentWord && (<div className="relative h-72 mb-6">
      <div className={`absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer
        transition-all duration-300 border-2 ${isFlipped ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100'}`}
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: modeAccent, boxShadow: `0 8px 32px ${modeAccent}18` }}
        onClick={flipCard}>
        {renderFront()}
        <p className="absolute bottom-4 text-[13px]" style={{ color: modeAccent }}>Click để xem đáp án</p>
      </div>
      <div className={`absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center overflow-hidden
        transition-all duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none scale-95'}`}
        style={{ background: modeGradient, boxShadow: `0 8px 32px ${modeAccent}30` }}>
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/5" />
        {renderBack()}
      </div>
    </div>)}

    {/* Rating */}
    {isFlipped && intervals ? (<>
      <div className="grid grid-cols-4 gap-2">
        {([
          { rating: 'again' as ReviewRating, label: 'Quên', color: '#EF4444', interval: intervals.again, hotkey: '1' },
          { rating: 'hard' as ReviewRating, label: 'Khó', color: '#F59E0B', interval: intervals.hard, hotkey: '2' },
          { rating: 'good' as ReviewRating, label: 'Được', color: '#22C55E', interval: intervals.good, hotkey: '3' },
          { rating: 'easy' as ReviewRating, label: 'Dễ', color: '#3B82F6', interval: intervals.easy, hotkey: '4' },
        ]).map(btn => (
          <button key={btn.rating} onClick={() => handleReview(btn.rating)}
            className="py-4 rounded-2xl font-medium transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:translate-y-0"
            style={{ background: `${btn.color}12`, border: `2px solid ${btn.color}30` }}>
            <div className="text-[14px] font-bold" style={{ color: btn.color }}>{btn.label}</div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{getIntervalText(btn.interval)}</div>
            <kbd className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>{btn.hotkey}</kbd>
          </button>))}
      </div>
      <p className="text-center text-[11px] mt-4" style={{ color: 'var(--theme-text-muted)' }}>
        Phím {['1 Quên','2 Khó','3 Được','4 Dễ'].map((t,i) => (
          <span key={i}><kbd className="px-1.5 py-0.5 rounded text-[10px]"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>{t.split(' ')[0]}</kbd>{' '}{t.split(' ')[1]}{i < 3 ? '  ' : ''}</span>))}</p>
    </>) : (
      <button onClick={flipCard}
        className="w-full py-3.5 rounded-xl font-semibold text-[14px] text-white transition-all hover:shadow-md hover:-translate-y-0.5"
        style={{ background: modeGradient }}>
        <IconRefresh size={16} className="inline mr-2" style={{ verticalAlign: '-2px' }} />Xem đáp án (Space)</button>)}

    <div className="text-center mt-6">
      <button onClick={() => { playClick(); refetchDue(); setPhase('setup'); }}
        className="flex items-center gap-1.5 mx-auto text-[13px] font-medium transition-all hover:opacity-70"
        style={{ color: 'var(--theme-text-muted)' }}><IconX size={14} /> Dừng ôn tập</button>
    </div>
  </div>
);
}