'use client';
/* eslint-disable no-restricted-syntax -- game pages use custom dark-theme gradients that don't map to design tokens */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useGameSession } from '@/hooks/useGameSession';
import { useWordBankGameWords } from '@/hooks/usePersonalWords';
import { personalWordsToGameWords, getEligibleWordsForGame } from '@/lib/personalWordAdapter';
import { wordsApi } from '@/lib/api/words';
import { Gender, Word } from '@/types';
import {
  GameSetupCard, GameResultCard, StatCard,
  GenderButtons, GameInfoBox, KBD,
  IconClock, IconTarget, IconCheck, IconX, IconRocket, IconKeyboard, IconVolume,
  IconRefresh, IconChevronLeft, IconZap,
} from '@/components/games/GameUI';
import { Button } from '@/components/ui';
import { ACCENT, STATUS } from '@/lib/tokens';

// Batch size per API call. Small enough to keep initial load fast (<100ms),
// large enough that a typical 60-second session never exhausts the buffer.
// At ~1 word/sec average, 50 words = 50 seconds before needing next batch.
const BATCH_SIZE = 50;
// Start prefetching next batch when this many words remain in the buffer.
const PREFETCH_THRESHOLD = 15;

type Phase = 'setup' | 'countdown' | 'playing' | 'result';

export default function TimedChallengePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWordBankMode = searchParams.get('source') === 'wordbank';
  const collectionId = searchParams.get('collectionId') ?? undefined;

  const { settings, isLoaded, loadSettings } = useSettingsStore();
  const { playCorrect, playWrong, playCombo, playGameOver, playTick, playClick } = useSoundEffects();
  const session = useGameSession('timed-challenge');

  const [phase, setPhase] = useState<Phase>('setup');
  const [loadError, setLoadError] = useState<string | null>(null);
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
  const wbData = useWordBankGameWords({ collectionId, enabled: isWordBankMode });

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
      const batch = await wordsApi.getGameWords(BATCH_SIZE, { nounsOnly: true });
      setWords(prev => [...prev, ...batch]);
    } catch {
      // Silently ignore prefetch failures — user still has remaining words to answer
      /* prefetch failure is non-critical — user still has remaining words */
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Trigger prefetch when approaching end of current buffer (global mode only)
  useEffect(() => {
    if (phase !== 'playing' || isWordBankMode) return;
    const remaining = words.length - index;
    if (remaining <= PREFETCH_THRESHOLD) {
      fetchBatch();
    }
  }, [index, words.length, phase, fetchBatch, isWordBankMode]);

  const startGame = async () => {
    playClick(); setStarting(true); setLoadError(null); clearTimers();
    try {
      // Reset state
      setIndex(0); setTimeLeft(duration); setScore(0); setCombo(0); setBestCombo(0);
      setCorrect(0); setWrong(0); setCountdown(3); setLastAnswer(null);
      scoreRef.current = 0; bestComboRef.current = 0;
      correctRef.current = 0; wrongRef.current = 0;

      if (isWordBankMode) {
        const eligible = getEligibleWordsForGame('time-challenge', wbData.data ?? []);
        if (eligible.length < 10) { setLoadError('Cần ít nhất 10 danh từ có mạo từ trong bộ sưu tập này'); setStarting(false); return; }
        const wbWords = [...personalWordsToGameWords(eligible)].sort(() => Math.random() - 0.5);
        setWords(wbWords);
        setPhase('countdown');
        session.start(wbWords.length);
      } else {
      // Fetch initial batch — much faster than ORDER BY RANDOM() LIMIT 200
      isFetchingRef.current = true;
      const firstBatch = await wordsApi.getGameWords(BATCH_SIZE, { nounsOnly: true });
      isFetchingRef.current = false;

      if (!firstBatch.length) { setLoadError('Không có từ vựng! Vui lòng thêm từ hoặc seed database.'); setStarting(false); return; }
      setWords(firstBatch);
      setPhase('countdown');
      session.start(BATCH_SIZE);
      }

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
    } catch { setLoadError('Lỗi tải từ vựng! Vui lòng thử lại.'); isFetchingRef.current = false; }
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
        <GameSetupCard icon={({ size }) => <IconClock size={size} style={{ color: 'white' }} />} iconColor={STATUS.danger} title="Timed Challenge" loadError={loadError}>
          <p className="text-sm mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
            Trả lời nhanh trong <span className="font-bold" style={{ color: STATUS.danger }}>{duration} giây</span>!
          </p>
          <p className="text-xs mb-6" style={{ color: 'var(--theme-text-muted)' }}>(Thay đổi trong Settings → Học tập)</p>
          <GameInfoBox>
            <div className="flex items-center gap-2"><IconTarget size={14} style={{ color: STATUS.danger }} /><span>10 điểm/câu đúng · Combo tối đa x4 · Sai = mất combo</span></div>
            <div className="flex items-center gap-2"><IconKeyboard size={14} style={{ color: ACCENT.vocab }} /><span>Phím: <KBD>1</KBD> der, <KBD>2</KBD> die, <KBD>3</KBD> das</span></div>
            <div className="flex items-center gap-2"><IconVolume size={14} style={{ color: STATUS.success }} /><span>Âm thanh: {settings.soundEnabled ? 'Bật' : 'Tắt'}</span></div>
          </GameInfoBox>
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="game" accent="games" onClick={startGame} isLoading={starting}><IconRocket size={16} /> Bắt đầu</Button>
            <Button variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Quay lại</Button>
          </div>
        </GameSetupCard>
    );
  }

  // ─── Countdown ───
  if (phase === 'countdown') {
    return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, rgba(239,68,68,.12), rgba(239,68,68,.04))' }}>
              <span className="text-6xl font-extrabold" style={{ color: STATUS.danger }}>{countdown}</span>
            </div>
            <p className="text-lg font-semibold" style={{ color: 'var(--theme-text-muted)' }}>Chuẩn bị!</p>
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
            <div className="text-5xl font-extrabold" style={{ color: ACCENT.srs }}>{score}</div>
            <p className="text-body mt-1" style={{ color: 'var(--theme-text-muted)' }}>điểm</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <StatCard label="Đúng" value={correct} color={STATUS.success} />
            <StatCard label="Sai" value={wrong} />
            <StatCard label="Chính xác" value={`${acc}%`} color={ACCENT.srs} />
            <StatCard label="Best Combo" value={`x${bestCombo}`} color={ACCENT.xp} />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-6 text-sm font-semibold"
            style={{ color: 'var(--theme-text-secondary)' }}>
            <IconZap size={16} style={{ color: ACCENT.xp }} /> Tốc độ: {wpm} từ/phút
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="game" accent="games" onClick={startGame}><IconRefresh size={16} /> Chơi lại</Button>
            <Button variant="outline" onClick={() => router.push('/games')}><IconChevronLeft size={16} /> Quay lại</Button>
          </div>
        </GameResultCard>
    );
  }

  // ─── Playing ───
  const timerPct = (timeLeft / duration) * 100;
  const timerColor = timeLeft <= 10 ? STATUS.danger : ACCENT.srs;

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
              {timeLeft}<span className="text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>s</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold" style={{ color: ACCENT.srs }}>{score}</div>
        </div>

        {/* Timer bar */}
        <div className="h-2.5 rounded-full overflow-hidden mb-3" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${timerPct}%`, background: `linear-gradient(90deg, ${timerColor}, ${timerColor}cc)` }} />
        </div>

        {/* Combo + Score counters */}
        <div className="flex justify-between items-center mb-4">
          {combo >= 2 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}>
              🔥 Combo x{Math.min(combo, 4)}
            </span>
          ) : <span />}
          <div className="flex gap-4">
            <span className="flex items-center gap-1 text-sm font-bold" style={{ color: STATUS.success }}>
              <IconCheck size={14} /> {correct}
            </span>
            <span className="flex items-center gap-1 text-sm font-bold" style={{ color: STATUS.danger }}>
              <IconX size={14} /> {wrong}
            </span>
          </div>
        </div>

        {/* Word Card */}
        {currentWord && (
          <div className="rounded-3xl overflow-hidden mb-5 transition-all duration-200"
            style={{
              background: lastAnswer === 'correct'
                ? 'linear-gradient(135deg, #052e16 0%, #166534 100%)'
                : lastAnswer === 'wrong'
                ? 'linear-gradient(135deg, #450a0a 0%, #991b1b 100%)'
                : 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            }}>
            <div className="px-6 py-8 text-center" style={{ minHeight: 140 }}>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-white">
                {currentWord.word}
              </h2>
              <p className="text-sm opacity-60 text-white">
                {currentWord.translationVi || currentWord.translationEn}
              </p>
            </div>
          </div>
        )}

        {/* Answer Buttons */}
        <GenderButtons onAnswer={answer} answered={false} selectedAnswer={null} />

        <div className="text-center mt-5">
          <Button variant="ghost" onClick={() => { clearTimers(); playClick(); router.push('/games'); }}>
            <IconX size={14} /> Thoát
          </Button>
        </div>
      </div>
  );
}