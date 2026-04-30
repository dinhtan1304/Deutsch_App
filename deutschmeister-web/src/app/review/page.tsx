'use client';
/* eslint-disable no-restricted-syntax */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { usePronunciation } from '@/hooks/usePronunciation';
import { useRandomWords } from '@/hooks/useWords';
import { useDueCards, useReviewCard, useAddWordsToSRS, useProgressStats } from '@/hooks/useProgress';
import { previewIntervals } from '@/lib/srs';
import { ReviewRating, Progress } from '@/types';
import { IconBrain, IconX } from '@/components/ui/Icons';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { SRSSetupScreen } from './_components/SRSSetupScreen';
import { SRSCompleteScreen } from './_components/SRSCompleteScreen';
import { ReviewCard } from './_components/ReviewCard';
import { RatingButtons } from './_components/RatingButtons';

type QuizMode = 'gender' | 'de-vi' | 'vi-de' | 'mixed';
type Phase = 'loading' | 'empty' | 'setup' | 'reviewing' | 'complete';

const GENDER_HEX: Record<string, { color: string; gradient: string }> = {
  blue:  { color: ACCENT.srs,       gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
  pink:  { color: ACCENT.listening, gradient: 'linear-gradient(135deg, #EC4899, #BE185D)' },
  green: { color: STATUS.success,   gradient: 'linear-gradient(135deg, #22C55E, #15803D)' },
};

const ARTIKEL_STYLE: Record<string, { gradient: string; chipBg: string; chipColor: string }> = {
  der: { gradient: 'linear-gradient(135deg, #0a1628 0%, #1e3a8a 100%)', chipBg: `${ACCENT.srs}4D`,       chipColor: '#93C5FD' },
  die: { gradient: 'linear-gradient(135deg, #2a0a1e 0%, #9d174d 100%)', chipBg: `${ACCENT.listening}4D`, chipColor: '#F9A8D4' },
  das: { gradient: 'linear-gradient(135deg, #0a2218 0%, #065f46 100%)', chipBg: `${ACCENT.teal}4D`,      chipColor: '#5EEAD4' },
};
const DEFAULT_CARD_GRADIENT = 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)';

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

  const reviewMutateRef = useRef(reviewMutation.mutate);
  useEffect(() => { reviewMutateRef.current = reviewMutation.mutate; }, [reviewMutation.mutate]);

  const nextCardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streakRef = useRef(0);

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
    setSessionStats({ correct: 0, wrong: 0, streak: 0, bestStreak: 0 });
    streakRef.current = 0;
    const modes: Record<number, Exclude<QuizMode, 'mixed'>> = {};
    queue.forEach((card, i) => { modes[i] = getCardQuizMode(card); });
    setCardModes(modes);
    setPhase('reviewing');
    playClick();
  }, [dueCards, settings.questionsPerGame, playClick, getCardQuizMode]);

  const handleReview = useCallback((rating: ReviewRating) => {
    if (!currentCard) return;
    reviewMutateRef.current({ wordId: currentCard.wordId, rating });
    const isCorrect = rating !== 'again';
    if (isCorrect) {
      playCorrect();
      const newStreak = streakRef.current + 1;
      streakRef.current = newStreak;
      if (newStreak === 5 || newStreak === 10) setTimeout(() => playCombo(), 200);
      setSessionStats(prev => ({
        ...prev, correct: prev.correct + 1, streak: newStreak, bestStreak: Math.max(prev.bestStreak, newStreak),
      }));
    } else {
      playWrong();
      streakRef.current = 0;
      setSessionStats(prev => ({ ...prev, wrong: prev.wrong + 1, streak: 0 }));
    }
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

  const currentCard = reviewQueue[currentIndex] ?? null;
  const currentWord = currentCard?.word ?? null;
  const currentMode = cardModes[currentIndex] ?? 'de-vi';
  const intervals = currentCard ? previewIntervals(currentCard) : null;
  const artikelKey = currentWord?.article?.toLowerCase() ?? '';
  const artikelStyle = ARTIKEL_STYLE[artikelKey] ?? { gradient: DEFAULT_CARD_GRADIENT, chipBg: 'rgba(255,255,255,.15)', chipColor: 'rgba(255,255,255,.8)' };
  const cardGradient = currentMode !== 'vi-de' ? artikelStyle.gradient : DEFAULT_CARD_GRADIENT;

  const queueNew = reviewQueue.filter(c => (c.repetitions ?? 0) === 0).length;
  const timerText = `${String(Math.floor(sessionSeconds / 60)).padStart(2, '0')}:${String(sessionSeconds % 60).padStart(2, '0')}`;
  const flipCard = () => { if (!isFlipped) { playClick(); setIsFlipped(true); } };

  // ─── LOADING ───
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse"
          style={{ background: GRADIENT.action }}>
          <IconBrain size={28} className="text-white" />
        </div>
      </div>
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
            <IconBrain size={36} style={{ color: ACCENT.srs }} />
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>SRS Review</h1>
          <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: 'var(--theme-text-muted)' }}>
            Bạn chưa có từ nào trong danh sách ôn tập.<br />Thêm từ vào để bắt đầu học với thuật toán SM-2!
          </p>
          <button onClick={addRandomWords}
            className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
            style={{ background: GRADIENT.action }}>
            + Thêm 20 từ ngẫu nhiên
          </button>
          <p className="text-xs mt-3" style={{ color: 'var(--theme-text-muted)' }}>
            Hoặc thêm từ từ trang Từ vựng bằng nút ⭐
          </p>
          <div className="mt-8 p-4 rounded-xl text-left"
            style={{ backgroundColor: `${ACCENT.srs}0F`, border: `1px solid ${ACCENT.srs}1F` }}>
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: ACCENT.srs }}>
              <span className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${ACCENT.srs}1F` }}>
                <IconBrain size={14} style={{ color: ACCENT.srs }} />
              </span>
              SM-2 là gì?
            </h3>
            <p className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>
              SM-2 (SuperMemo 2) là thuật toán lặp lại ngắt quãng giúp bạn nhớ từ lâu hơn. Từ bạn nhớ tốt sẽ xuất hiện ít hơn, từ khó sẽ xuất hiện thường xuyên hơn.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── SETUP ───
  if (phase === 'setup') {
    return (
      <SRSSetupScreen
        stats={stats}
        quizMode={quizMode}
        onSetMode={setQuizMode}
        onStart={startReview}
        onBack={() => router.push('/games')}
        onAddWords={addRandomWords}
      />
    );
  }

  // ─── COMPLETE ───
  if (phase === 'complete') {
    return (
      <SRSCompleteScreen
        sessionStats={sessionStats}
        stats={stats}
        onContinue={() => { refetchDue(); setPhase('setup'); }}
        onAddWords={addRandomWords}
        onBack={() => router.push('/games')}
      />
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
              {currentMode === 'gender' ? 'Mạo từ' : currentMode === 'de-vi' ? 'Đức → Việt' : currentMode === 'vi-de' ? 'Việt → Đức' : 'Ôn tập'}
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
          { label: 'Tổng',   value: reviewQueue.length,            color: 'var(--theme-text-primary)', dot: false },
          { label: 'Mới',    value: queueNew,                      color: ACCENT.srs, dot: true },
          { label: 'Cần ôn', value: reviewQueue.length - queueNew, color: ACCENT.xp, dot: true },
          { label: 'Thuộc',  value: sessionStats.correct,          color: STATUS.success, dot: true },
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

      {/* ── Review card ── */}
      {currentWord && currentCard && (
        <ReviewCard
          currentWord={currentWord}
          currentCard={currentCard}
          currentMode={currentMode}
          artikelStyle={artikelStyle}
          cardGradient={cardGradient}
          isFlipped={isFlipped}
          onFlip={flipCard}
          onSpeak={speak}
          showExampleTrans={showExampleTrans}
          onShowExampleTrans={() => setShowExampleTrans(true)}
        />
      )}

      {/* ── Rating or flip CTA ── */}
      {isFlipped && intervals ? (
        <RatingButtons intervals={intervals} onReview={handleReview} />
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
