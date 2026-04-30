'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { usePronunciation } from '@/hooks/usePronunciation';
import { useRandomWords } from '@/hooks/useWords';
import { useDueCards, useReviewCard, useAddWordsToSRS, useProgressStats } from '@/hooks/useProgress';
import { previewIntervals, getIntervalText } from '@/lib/srs';
import { GenderInfo, ReviewRating, Progress } from '@/types';
import {
  IconBrain, IconRefresh, IconTarget, IconFlame, IconBookOpen, IconChevronLeft,
} from '@/components/ui/Icons';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
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

const QUIZ_MODES: { key: QuizMode; label: string; desc: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; color: string }[] = [
  { key: 'gender', label: 'Mạo từ', desc: 'der / die / das', icon: IconTarget,    color: ACCENT.srs },
  { key: 'de-vi',  label: 'Đức → Việt', desc: 'Nhìn từ, đoán nghĩa', icon: IconLanguages, color: ACCENT.vocab },
  { key: 'vi-de',  label: 'Việt → Đức', desc: 'Nhìn nghĩa, nhớ từ',  icon: IconBookOpen,  color: ACCENT.xp },
  { key: 'mixed',  label: 'Hỗn hợp', desc: 'Ngẫu nhiên tất cả',     icon: IconShuffle,   color: STATUS.success },
];

/* eslint-disable no-restricted-syntax */
const GENDER_HEX: Record<string, { color: string; gradient: string }> = {
  blue:  { color: ACCENT.srs,       gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
  pink:  { color: ACCENT.listening, gradient: 'linear-gradient(135deg, #EC4899, #BE185D)' },
  green: { color: STATUS.success,   gradient: 'linear-gradient(135deg, #22C55E, #15803D)' },
};

// Artikel → card gradient + chip colors (custom dark-theme palette for review cards)
const ARTIKEL_STYLE: Record<string, { gradient: string; chipBg: string; chipColor: string }> = {
  der: { gradient: 'linear-gradient(135deg, #0a1628 0%, #1e3a8a 100%)', chipBg: `${ACCENT.srs}4D`,       chipColor: '#93C5FD' },
  die: { gradient: 'linear-gradient(135deg, #2a0a1e 0%, #9d174d 100%)', chipBg: `${ACCENT.listening}4D`, chipColor: '#F9A8D4' },
  das: { gradient: 'linear-gradient(135deg, #0a2218 0%, #065f46 100%)', chipBg: `${ACCENT.teal}4D`,      chipColor: '#5EEAD4' },
};
const DEFAULT_CARD_GRADIENT = 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)';
/* eslint-enable no-restricted-syntax */

function getLastSeenText(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'hôm nay';
  if (days === 1) return '1 ngày trước';
  return `${days} ngày trước`;
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
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [showExampleTrans, setShowExampleTrans] = useState(false);
  const { speak } = usePronunciation();

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
    if (phase !== 'reviewing') { setSessionSeconds(0); return; }
    const id = setInterval(() => setSessionSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => { setShowExampleTrans(false); }, [currentIndex]);

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

  const artikelKey = currentWord?.article?.toLowerCase() ?? '';
  const artikelStyle = ARTIKEL_STYLE[artikelKey] ?? { gradient: DEFAULT_CARD_GRADIENT, chipBg: 'rgba(255,255,255,.15)', chipColor: 'rgba(255,255,255,.8)' };
  const cardGradient = currentMode !== 'vi-de' ? artikelStyle.gradient : DEFAULT_CARD_GRADIENT;
  const queueNew = reviewQueue.filter(c => (c.repetitions ?? 0) === 0).length;
  const timerText = `${String(Math.floor(sessionSeconds / 60)).padStart(2, '0')}:${String(sessionSeconds % 60).padStart(2, '0')}`;

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



  // ─── LOADING ───
  if (phase === 'loading') {
    return (
<div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse"
        style={{ background: GRADIENT.action }}>
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
          style={{ background: `linear-gradient(135deg, ${ACCENT.srs}26, ${ACCENT.writing}1A)` }}>
          <IconBrain size={36} style={{ color: ACCENT.srs }} /></div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>SRS Review</h1>
        <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: 'var(--theme-text-muted)' }}>
          Bạn chưa có từ nào trong danh sách ôn tập.<br/>Thêm từ vào để bắt đầu học với thuật toán SM-2!</p>
        <button onClick={addRandomWords}
          className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
          style={{ background: GRADIENT.action }}>
          <IconPlus size={17} /> Thêm 20 từ ngẫu nhiên</button>
        <p className="text-xs mt-3" style={{ color: 'var(--theme-text-muted)' }}>
          Hoặc thêm từ từ trang Từ vựng bằng nút ⭐</p>
        <div className="mt-8 p-4 rounded-xl text-left"
          style={{ backgroundColor: `${ACCENT.srs}0F`, border: `1px solid ${ACCENT.srs}1F` }}>
          <h3 className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: ACCENT.srs }}>
            <span className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: `${ACCENT.srs}1F` }}><IconBrain size={14} style={{ color: ACCENT.srs }} /></span>
            SM-2 là gì?</h3>
          <p className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>
            SM-2 (SuperMemo 2) là thuật toán lặp lại ngắt quãng giúp bạn nhớ từ lâu hơn. Từ bạn nhớ tốt sẽ xuất hiện ít hơn, từ khó sẽ xuất hiện thường xuyên hơn.</p>
        </div>
      </div></div>
);
  }

  // ─── SETUP ───
  if (phase === 'setup') {
    const statItems = [
      { label: 'Cần ôn', value: stats?.due ?? 0, icon: IconFlame, color: STATUS.danger,
        bg: `linear-gradient(135deg, ${STATUS.danger}1F, ${STATUS.danger}0F)` },
      { label: 'Đã thuộc', value: stats?.mastered ?? 0, icon: IconTarget, color: STATUS.success,
        bg: `linear-gradient(135deg, ${STATUS.success}1F, ${STATUS.success}0F)` },
      { label: 'Đang học', value: stats?.learning ?? 0, icon: IconBookOpen, color: ACCENT.xp,
        bg: `linear-gradient(135deg, ${ACCENT.xp}1F, ${ACCENT.xp}0F)` },
      { label: 'Tổng', value: stats?.total ?? 0, icon: IconBrain, color: ACCENT.writing,
        bg: `linear-gradient(135deg, ${ACCENT.writing}1F, ${ACCENT.writing}0F)` },
    ];
    return (
<div className="max-w-2xl mx-auto py-12">
      <div className="rounded-3xl p-8 text-center border"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6"
          style={{ background: `linear-gradient(135deg, ${ACCENT.srs}26, ${ACCENT.writing}1A)` }}>
          <IconBrain size={36} style={{ color: ACCENT.srs }} /></div>
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
              <div className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</div>
            </div>);
          })}
        </div>

        {(stats?.due ?? 0) > 0 ? (<>
          {/* Quiz mode selector */}
          <p className="text-body font-semibold mb-3" style={{ color: 'var(--theme-text-secondary)' }}>Chọn chế độ ôn tập</p>
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
                <div className="text-xs font-bold" style={{ color: active ? mode.color : 'var(--theme-text-secondary)' }}>{mode.label}</div>
                <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{mode.desc}</div>
              </button>);
            })}
          </div>
          <p className="text-sm mb-6" style={{ color: 'var(--theme-text-secondary)' }}>
            Bạn có <span className="font-bold" style={{ color: ACCENT.srs }}>{stats?.due} từ</span> cần ôn tập hôm nay</p>
          <button onClick={startReview}
            className="flex items-center gap-2 mx-auto px-8 py-3 rounded-xl font-semibold text-[15px] text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
            style={{ background: GRADIENT.action }}>
            <IconZap size={18} /> Bắt đầu ôn tập</button>
        </>) : (<>
          <p className="text-sm mb-6" style={{ color: STATUS.success }}>✅ Tuyệt vời! Bạn đã ôn hết tất cả cho hôm nay.</p>
          <button onClick={addRandomWords}
            className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-semibold text-sm border transition-all hover:-translate-y-0.5"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
            <IconPlus size={16} /> Thêm từ mới</button>
        </>)}
        <div className="mt-6"><button onClick={() => router.push('/games')}
          className="flex items-center gap-1.5 mx-auto text-body font-medium transition-all hover:opacity-70"
          style={{ color: 'var(--theme-text-muted)' }}><IconChevronLeft size={16} /> Quay lại</button></div>
      </div></div>
);
  }

  // ─── COMPLETE ───
  if (phase === 'complete') {
    const accuracy = sessionStats.correct + sessionStats.wrong > 0
      ? Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.wrong)) * 100) : 0;
    const resultItems = [
      { label: 'Đúng', value: sessionStats.correct, color: STATUS.success, bg: `linear-gradient(135deg, ${STATUS.success}1F, ${STATUS.success}0F)` },
      { label: 'Sai', value: sessionStats.wrong, color: STATUS.danger, bg: `linear-gradient(135deg, ${STATUS.danger}1F, ${STATUS.danger}0F)` },
      { label: 'Chính xác', value: `${accuracy}%`, color: ACCENT.srs, bg: `linear-gradient(135deg, ${ACCENT.srs}1F, ${ACCENT.srs}0F)` },
      { label: 'Best Streak', value: sessionStats.bestStreak, color: ACCENT.games, bg: `linear-gradient(135deg, ${ACCENT.games}1F, ${ACCENT.games}0F)` },
    ];
    return (
<div className="max-w-2xl mx-auto py-12">
      <div className="rounded-3xl p-8 text-center border"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-4"
          style={{ background: `linear-gradient(135deg, ${STATUS.success}26, ${STATUS.success}1A)` }}>
          <IconTrophy size={36} style={{ color: STATUS.success }} /></div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>Hoàn thành! 🎉</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          {resultItems.map(item => (<div key={item.label} className="p-4 rounded-2xl" style={{ background: item.bg }}>
            <div className="text-2xl font-extrabold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</div>
          </div>))}
        </div>
        <div className="space-y-3">
          {(stats?.due ?? 0) > 0 && (
            <button onClick={() => { refetchDue(); setPhase('setup'); }}
              className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: GRADIENT.action }}>
              <IconRefresh size={16} /> Ôn tiếp ({stats?.due} từ còn lại)</button>)}
          <button onClick={addRandomWords}
            className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-medium text-sm border transition-all hover:-translate-y-0.5"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
            <IconPlus size={16} /> Thêm từ mới</button>
          <button onClick={() => router.push('/games')}
            className="flex items-center gap-1.5 mx-auto text-body font-medium transition-all hover:opacity-70"
            style={{ color: 'var(--theme-text-muted)' }}><IconChevronLeft size={16} /> Quay lại</button>
        </div>
      </div></div>
);
  }

  // ─── REVIEWING ───
  const progress = (currentIndex / reviewQueue.length) * 100;

  return (
<div className="max-w-2xl mx-auto py-6">

  {/* ── Session header ── */}
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-3">
      <button
        onClick={() => { playClick(); refetchDue(); setPhase('setup'); }}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
        style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}
      >
        <IconX size={16} />
      </button>
      <div>
        <p className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>Phiên ôn tập SRS</p>
        <p className="text-[15px] font-bold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>
          {QUIZ_MODES.find(m => m.key === currentMode)?.label ?? 'Ôn tập'}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {sessionStats.streak > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-body font-bold"
          style={{ background: `${ACCENT.games}1F`, color: ACCENT.games }}>
          🔥 {sessionStats.streak}
        </div>
      )}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-body font-mono font-semibold"
        style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        {timerText}
      </div>
    </div>
  </div>

  {/* ── Stats bar ── */}
  <div className="grid grid-cols-4 gap-1 mb-5 rounded-2xl p-3.5"
    style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
    {[
      { label: 'Tổng',   value: reviewQueue.length,              color: 'var(--theme-text-primary)', dot: false },
      { label: 'Mới',    value: queueNew,                        color: ACCENT.srs, dot: true },
      { label: 'Cần ôn', value: reviewQueue.length - queueNew,   color: ACCENT.xp, dot: true },
      { label: 'Thuộc',  value: sessionStats.correct,            color: STATUS.success, dot: true },
    ].map(s => (
      <div key={s.label} className="text-center">
        <div className="text-h2 font-extrabold leading-tight" style={{ color: s.color }}>{s.value}</div>
        <div className="text-caption flex items-center justify-center gap-1 mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
          {s.dot && <span style={{ color: s.color, fontSize: 9 }}>■</span>}
          {s.label}
        </div>
      </div>
    ))}
  </div>

  {/* ── Progress bar ── */}
  <div className="flex items-center gap-3 mb-5">
    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${ACCENT.srs}, ${STATUS.success})` }} />
    </div>
    <span className="shrink-0 text-caption font-bold px-2 py-0.5 rounded-lg"
      style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
      {currentIndex + 1} / {reviewQueue.length}
    </span>
  </div>

  {/* ── Card 3D flip ── */}
  {currentWord && (
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
          onClick={flipCard}
        >
          {/* Article chip */}
          {currentWord.article && currentMode !== 'vi-de' && (
            <div className="absolute top-4 left-4">
              <span className="px-2.5 py-1 rounded-lg text-caption font-extrabold tracking-widest uppercase"
                style={{ backgroundColor: artikelStyle.chipBg, color: artikelStyle.chipColor }}>
                {currentWord.article}
              </span>
            </div>
          )}
          {/* Space hint */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 text-caption"
            style={{ color: 'rgba(255,255,255,0.38)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M8 15h8"/>
            </svg>
            Space để lật
          </div>
          {/* Word */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 gap-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white text-center leading-tight">
              {currentMode === 'de-vi'  ? currentWord.word
               : currentMode === 'vi-de' ? (currentWord.translationVi || currentWord.translationEn)
               : <><span style={{ color: 'rgba(255,255,255,0.25)' }}>_____</span>{' '}{currentWord.word}</>}
            </h2>
            {currentMode !== 'vi-de' && (
              <button
                onClick={e => { e.stopPropagation(); speak(`${currentWord.article ? currentWord.article + ' ' : ''}${currentWord.word}`); }}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              </button>
            )}
          </div>
          {/* Bottom stats */}
          <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
            <span className="text-caption" style={{ color: 'rgba(255,255,255,0.32)' }}>
              Lần thấy: {currentCard?.totalReviews ?? 0}
              {currentCard?.lastReviewAt ? ` · Cuối: ${getLastSeenText(currentCard.lastReviewAt)}` : ''}
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
            // eslint-disable-next-line no-restricted-syntax
            background: 'linear-gradient(135deg, #0f2a1a 0%, #064e3b 60%, #065f46 100%)',
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center gap-2">
            {/* VN chip */}
            <div className="px-3 py-1 rounded-full text-caption font-bold mb-1"
              // eslint-disable-next-line no-restricted-syntax
              style={{ backgroundColor: 'rgba(52,211,153,.2)', color: '#34D399' }}>
              🇻🇳 VN Nghĩa
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
                  „<HighlightExample sentence={currentWord.examples[0]} word={currentWord.word} />"
                </p>
                {showExampleTrans && currentWord.examples[1] && (
                  <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>→ {currentWord.examples[1]}</p>
                )}
                {!showExampleTrans && currentWord.examples[1] && (
                  <button onClick={() => setShowExampleTrans(true)}
                    className="text-caption mt-1.5 transition-all hover:opacity-80"
                    style={{ color: 'rgba(255,255,255,0.38)' }}>
                    → xem bản dịch
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )}

  {/* ── Rating buttons or flip CTA ── */}
  {isFlipped && intervals ? (
    <div className="grid grid-cols-4 gap-2.5">
      {/* eslint-disable no-restricted-syntax */}
      {([
        { rating: 'again' as ReviewRating, label: 'Quên', emoji: '😵', textColor: '#FCA5A5', bg: 'linear-gradient(160deg, #450a0a, #991b1b)', border: `${STATUS.danger}73`,  hotkey: '1', interval: intervals.again },
        { rating: 'hard'  as ReviewRating, label: 'Khó',  emoji: '😓', textColor: '#FCD34D', bg: 'linear-gradient(160deg, #431407, #92400e)', border: `${ACCENT.xp}73`,      hotkey: '2', interval: intervals.hard  },
        { rating: 'good'  as ReviewRating, label: 'Được', emoji: '🙂', textColor: '#86EFAC', bg: 'linear-gradient(160deg, #052e16, #166534)', border: `${STATUS.success}73`, hotkey: '3', interval: intervals.good  },
        { rating: 'easy'  as ReviewRating, label: 'Dễ',   emoji: '😎', textColor: '#93C5FD', bg: 'linear-gradient(160deg, #0c1a3f, #1e40af)', border: `${ACCENT.srs}73`,     hotkey: '4', interval: intervals.easy  },
      ]).map(btn => (
      /* eslint-enable no-restricted-syntax */
        <button
          key={btn.rating}
          onClick={() => handleReview(btn.rating)}
          title={`Bạn sẽ thấy lại từ này sau ${getIntervalText(btn.interval)}`}
          className="relative py-5 rounded-2xl transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl active:scale-95"
          style={{ background: btn.bg, border: `1.5px solid ${btn.border}` }}
        >
          <span className="absolute top-2 right-2.5 text-caption font-bold" style={{ color: btn.textColor, opacity: 0.55 }}>{btn.hotkey}</span>
          <div className="text-h1 mb-1.5 leading-none">{btn.emoji}</div>
          <div className="text-sm font-extrabold" style={{ color: btn.textColor }}>{btn.label}</div>
          <div className="text-caption mt-0.5 font-medium" style={{ color: btn.textColor, opacity: 0.65 }}>{getIntervalText(btn.interval)}</div>
        </button>
      ))}
    </div>
  ) : (
    <button
      onClick={flipCard}
      className="w-full py-4 rounded-2xl font-semibold text-sm transition-all hover:-translate-y-0.5"
      style={{ backgroundColor: 'var(--theme-bg-card)', border: '1.5px dashed var(--theme-border)', color: 'var(--theme-text-secondary)' }}
    >
      Tự nhớ trước rồi{' '}
      <span className="mx-1 px-2 py-0.5 rounded-md text-xs font-bold"
        style={{ backgroundColor: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)', fontFamily: 'monospace', color: 'var(--theme-text-muted)' }}>
        Space
      </span>
      {' '}để lật xem đáp án
    </button>
  )}

  {/* ── Footer ── */}
  <div className="flex items-center justify-between mt-5">
    <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
      Phím tắt: 1 Quên · 2 Khó · 3 Được · 4 Dễ
    </p>
    <button onClick={() => { playClick(); refetchDue(); setPhase('setup'); }}
      className="flex items-center gap-1.5 text-xs font-medium transition-all hover:opacity-70"
      style={{ color: 'var(--theme-text-muted)' }}>
      <IconX size={13} /> Dừng
    </button>
  </div>
</div>
);
}