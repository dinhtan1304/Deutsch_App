'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useGameSession } from '@/hooks/useGameSession';
import { wordsApi } from '@/lib/api/words';
import { Gender, Word } from '@/types';
import {
  GameSetupCard, GameResultCard, GameButton, ComboBadge, StatCard,
  GenderButtons, GameInfoBox, KBD,
  IconClock, IconTarget, IconCheck, IconX, IconRocket, IconKeyboard, IconVolume,
  IconRefresh, IconChevronLeft, IconZap,
} from '@/components/games/GameUI';

// Batch size per API call. Small enough to keep initial load fast (<100ms),
// large enough that a typical 60-second session never exhausts the buffer.
// At ~1 word/sec average, 50 words = 50 seconds before needing next batch.
const BATCH_SIZE = 50;
// Start prefetching next batch when this many words remain in the buffer.
const PREFETCH_THRESHOLD = 15;

type Phase = 'setup' | 'countdown' | 'playing' | 'result';

export default function TimedChallengePage() {
  const router = useRouter();
  const { settings, isLoaded, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playGameOver, playTick, playClick } = useSoundEffects();
  const session = useGameSession('timed-challenge');

  const [phase, setPhase] = useState<Phase>('setup');
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [starting, setStarting] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<'correct' | 'wrong' | null>(null);

  // Word buffer: grows via batch fetching instead of one 200-word upfront load.
  // ORDER BY RANDOM() LIMIT 200 forces PostgreSQL to score every row — at 3000+
  // words this becomes slow. Fetching BATCH_SIZE=50 at a time cuts that cost by 4×.
  const [words, setWords] = useState<Word[]>([]);
  const isFetchingRef = useRef(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnswerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scoreRef = useRef(0);
  const bestComboRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);

  const currentWord = words[index];
  const duration = isLoaded ? settings.timedChallengeSeconds : 60;

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (lastAnswerTimerRef.current) clearTimeout(lastAnswerTimerRef.current);
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // Fetch one batch and append to the word buffer.
  // isFetchingRef prevents concurrent fetches when multiple answers fire quickly.
  const fetchBatch = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const batch = await wordsApi.getRandom(BATCH_SIZE, {});
      setWords(prev => [...prev, ...batch]);
    } catch {
      // Silently ignore prefetch failures — user still has remaining words to answer
      /* prefetch failure is non-critical — user still has remaining words */
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Trigger prefetch when approaching end of current buffer
  useEffect(() => {
    if (phase !== 'playing') return;
    const remaining = words.length - index;
    if (remaining <= PREFETCH_THRESHOLD) {
      fetchBatch();
    }
  }, [index, words.length, phase, fetchBatch]);

  const startGame = async () => {
    playClick(); setStarting(true); clearTimers();
    try {
      // Reset state
      setIndex(0); setTimeLeft(duration); setScore(0); setCombo(0); setBestCombo(0);
      setCorrect(0); setWrong(0); setCountdown(3); setLastAnswer(null);
      scoreRef.current = 0; bestComboRef.current = 0;
      correctRef.current = 0; wrongRef.current = 0;

      // Fetch initial batch — much faster than ORDER BY RANDOM() LIMIT 200
      isFetchingRef.current = true;
      const firstBatch = await wordsApi.getRandom(BATCH_SIZE, {});
      isFetchingRef.current = false;

      if (!firstBatch.length) { alert('Không có từ vựng!'); setStarting(false); return; }
      setWords(firstBatch);
      setPhase('countdown');
      session.start(BATCH_SIZE);

      let c = 3;
      countdownRef.current = setInterval(() => {
        c--; setCountdown(c); playTick();
        if (c <= 0) {
          clearInterval(countdownRef.current!); setPhase('playing');
          timerRef.current = setInterval(() => {
            setTimeLeft(t => {
              if (t <= 10 && t > 0) playTick();
              if (t <= 1) { clearInterval(timerRef.current!); playGameOver(); setPhase('result'); return 0; }
              return t - 1;
            });
          }, 1000);
        }
      }, 1000);
    } catch { alert('Lỗi tải từ vựng!'); isFetchingRef.current = false; }
    finally { setStarting(false); }
  };

  const answer = useCallback((gender: Gender) => {
    if (phase !== 'playing' || !currentWord) return;
    const isCorrect = gender === currentWord.gender;

    if (isCorrect) {
      playCorrect();
      correctRef.current++;
      const newCombo = combo + 1; const mult = Math.min(newCombo, 4);
      setScore(s => s + 10 * mult); scoreRef.current += 10 * mult;
      setCorrect(c => c + 1); setCombo(newCombo); setLastAnswer('correct');
      if (newCombo > bestCombo) { setBestCombo(newCombo); bestComboRef.current = newCombo; }
      if (newCombo === 5 || newCombo === 10 || newCombo === 15 || newCombo === 20) setTimeout(() => playCombo(), 150);
    } else { playWrong(); wrongRef.current++; setWrong(w => w + 1); setCombo(0); setLastAnswer('wrong'); }

    if (lastAnswerTimerRef.current) clearTimeout(lastAnswerTimerRef.current);
    lastAnswerTimerRef.current = setTimeout(() => setLastAnswer(null), 300);
    // Always increment — no wrap-around. The buffer grows via prefetch so we
    // never reach the end of `words` under normal play conditions.
    setIndex(i => i + 1);
  }, [phase, currentWord, combo, bestCombo, playCorrect, playWrong, playCombo]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;
      if (e.key === '1') answer('masculine');
      if (e.key === '2') answer('feminine');
      if (e.key === '3') answer('neuter');
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [phase, answer]);

  useEffect(() => {
    if (phase === 'result') {
      session.end(scoreRef.current, bestComboRef.current, correctRef.current, wrongRef.current);
    }
  }, [phase, session]);

  // ─── Setup ───
  if (phase === 'setup') {
    return (
        <GameSetupCard icon={({ size }) => <IconClock size={size} style={{ color: 'white' }} />} iconColor="#EF4444" title="Timed Challenge">
          <p className="text-[14px] mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
            Trả lời nhanh trong <span className="font-bold" style={{ color: '#EF4444' }}>{duration} giây</span>!
          </p>
          <p className="text-[12px] mb-6" style={{ color: 'var(--theme-text-muted)' }}>(Thay đổi trong Settings → Học tập)</p>
          <GameInfoBox>
            <div className="flex items-center gap-2"><IconTarget size={14} style={{ color: '#EF4444' }} /><span>10 điểm/câu đúng · Combo tối đa x4 · Sai = mất combo</span></div>
            <div className="flex items-center gap-2"><IconKeyboard size={14} style={{ color: '#8B5CF6' }} /><span>Phím: <KBD>1</KBD> der, <KBD>2</KBD> die, <KBD>3</KBD> das</span></div>
            <div className="flex items-center gap-2"><IconVolume size={14} style={{ color: '#22C55E' }} /><span>Âm thanh: {settings.soundEnabled ? 'Bật' : 'Tắt'}</span></div>
          </GameInfoBox>
          <div className="flex gap-3 justify-center mt-6">
            <GameButton onClick={startGame} loading={starting} color="#EF4444"><IconRocket size={16} /> Bắt đầu</GameButton>
            <GameButton variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Quay lại</GameButton>
          </div>
        </GameSetupCard>
    );
  }

  // ─── Countdown ───
  if (phase === 'countdown') {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-32 h-32 rounded-full mx-auto flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, rgba(239,68,68,.12), rgba(239,68,68,.04))' }}>
              <span className="text-7xl font-extrabold" style={{ color: '#EF4444' }}>{countdown}</span>
            </div>
            <p className="text-xl font-semibold" style={{ color: 'var(--theme-text-muted)' }}>Chuẩn bị!</p>
          </div>
        </div>
    );
  }

  // ─── Result ───
  if (phase === 'result') {
    const total = correct + wrong;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    const wpm = Math.round((correct / duration) * 60);

    return (
        <GameResultCard accuracy={acc} title="Hết giờ!">
          <div className="my-5">
            <div className="text-5xl font-extrabold" style={{ color: '#3B82F6' }}>{score}</div>
            <p className="text-[13px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>điểm</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <StatCard label="Đúng" value={correct} color="#22C55E" />
            <StatCard label="Sai" value={wrong} color="#EF4444" />
            <StatCard label="Chính xác" value={`${acc}%`} color="#3B82F6" />
            <StatCard label="Best Combo" value={`x${bestCombo}`} color="#F59E0B" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-6 text-[14px] font-semibold"
            style={{ color: 'var(--theme-text-secondary)' }}>
            <IconZap size={16} style={{ color: '#F59E0B' }} /> Tốc độ: {wpm} từ/phút
          </div>
          <div className="flex gap-3 justify-center">
            <GameButton onClick={startGame} color="#EF4444"><IconRefresh size={16} /> Chơi lại</GameButton>
            <GameButton variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Quay lại</GameButton>
          </div>
        </GameResultCard>
    );
  }

  // ─── Playing ───
  const timerPct = (timeLeft / duration) * 100;
  const timerColor = timeLeft <= 10 ? '#EF4444' : '#3B82F6';

  return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
        {/* Timer + Score header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: timeLeft <= 10 ? 'linear-gradient(135deg, rgba(239,68,68,.15), rgba(239,68,68,.06))' : 'linear-gradient(135deg, rgba(59,130,246,.15), rgba(59,130,246,.06))' }}>
              <IconClock size={18} style={{ color: timerColor }} />
            </div>
            <span className="text-3xl font-extrabold transition-colors duration-300" style={{ color: timerColor }}>
              {timeLeft}<span className="text-[14px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>s</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold" style={{ color: '#3B82F6' }}>{score}</div>
        </div>

        {/* Timer bar */}
        <div className="h-2.5 rounded-full overflow-hidden mb-3" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${timerPct}%`, background: `linear-gradient(90deg, ${timerColor}, ${timerColor}cc)` }} />
        </div>

        {/* Combo + Score counters */}
        <div className="flex justify-between items-center mb-4">
          <ComboBadge combo={combo} />
          <div className="flex gap-4">
            <span className="flex items-center gap-1 text-[14px] font-bold" style={{ color: '#22C55E' }}>
              <IconCheck size={14} /> {correct}
            </span>
            <span className="flex items-center gap-1 text-[14px] font-bold" style={{ color: '#EF4444' }}>
              <IconX size={14} /> {wrong}
            </span>
          </div>
        </div>

        {/* Word Card */}
        {currentWord && (
          <div className="rounded-2xl border p-8 md:p-10 text-center mb-5 transition-all duration-200"
            style={{
              borderColor: 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-card)',
              boxShadow: lastAnswer === 'correct'
                ? '0 0 30px rgba(34,197,94,.15)'
                : lastAnswer === 'wrong'
                ? '0 0 30px rgba(239,68,68,.15)' : 'none',
            }}>
            <h2 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
              {currentWord.word}
            </h2>
            <p className="text-[16px]" style={{ color: 'var(--theme-text-secondary)' }}>
              {currentWord.translationVi || currentWord.translationEn}
            </p>
          </div>
        )}

        {/* Answer Buttons */}
        <GenderButtons onAnswer={answer} answered={false} selectedAnswer={null} />

        <div className="text-center mt-5">
          <GameButton variant="ghost" onClick={() => { clearTimers(); playClick(); router.push('/games'); }}>
            <IconX size={14} /> Thoát
          </GameButton>
        </div>
      </div>
  );
}