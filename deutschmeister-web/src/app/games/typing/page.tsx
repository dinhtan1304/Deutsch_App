'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GameSetupCard,
  GamePlayHeader,
  GameStatsBar,
  GameResultCard,
  GameInfoBox,
  StatCard,
  KBD,
  IconKeyboard,
  IconClock,
  IconTarget,
  IconCheck,
  IconX,
  IconRocket,
  IconRefresh,
} from '@/components/games/GameUI';
import { Button } from '@/components/ui';
import { ACCENT, STATUS } from '@/lib/tokens';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { TypingDisplay } from '@/components/games/TypingDisplay';
import {
  TYPING_CATEGORIES,
  TYPING_CATEGORY_LABELS,
  typingPracticeApi,
  type TypingCategory,
  type TypingLevel,
  type TypingSentence,
} from '@/lib/api/typingPractice';
import {
  useSubmitTypingSession,
  useTypingStats,
} from '@/hooks/useTypingPractice';
import { UMLAUT_TRIGGER_HINT } from '@/hooks/useUmlautTrigger';

const UMLAUT_MAP: Record<string, string> = {
  a: 'ä', A: 'Ä', o: 'ö', O: 'Ö', u: 'ü', U: 'Ü', s: 'ß',
};

type Phase = 'setup' | 'countdown' | 'playing' | 'result';

const DURATION_SEC = 60;
const LEVELS: TypingLevel[] = ['A1', 'A2', 'B1'];

export default function TypingPracticePage() {
  const router = useRouter();
  const { playClick, playCorrect, playWrong, playGameOver, playTick } = useSoundEffects();
  const submitSession = useSubmitTypingSession();
  const { data: stats } = useTypingStats();

  const [phase, setPhase] = useState<Phase>('setup');
  const [level, setLevel] = useState<TypingLevel>('A1');
  const [category, setCategory] = useState<TypingCategory>('BILDUNG');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(DURATION_SEC);

  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [typed, setTyped] = useState('');

  const [correctChars, setCorrectChars] = useState(0);
  const [incorrectChars, setIncorrectChars] = useState(0);
  const [sentencesCompleted, setSentencesCompleted] = useState(0);

  // Refs for use inside the keydown listener (avoids stale closure)
  const correctRef = useRef(0);
  const incorrectRef = useRef(0);
  const wordsRef = useRef(0);
  const sentencesRef = useRef(0);
  const submittedRef = useRef(false);

  // Hidden input ref — focused during 'playing' so mobile soft keyboards open.
  const inputRef = useRef<HTMLInputElement>(null);

  // Imperative fetch — sentences load when the user hits "Start", not on mount.
  const [sentences, setSentences] = useState<TypingSentence[]>([]);
  const [loadingSentences, setLoadingSentences] = useState(false);

  const currentSentence = sentences[sentenceIdx];
  const words = useMemo(
    () => (currentSentence ? currentSentence.textDe.split(' ') : []),
    [currentSentence],
  );
  const targetWord = words[wordIdx] ?? '';

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const resetGameState = () => {
    setSentenceIdx(0);
    setWordIdx(0);
    setTyped('');
    setCorrectChars(0);
    setIncorrectChars(0);
    setSentencesCompleted(0);
    setTimeLeft(DURATION_SEC);
    correctRef.current = 0;
    incorrectRef.current = 0;
    wordsRef.current = 0;
    sentencesRef.current = 0;
    submittedRef.current = false;
  };

  const startGame = async () => {
    playClick();
    setLoadError(null);
    clearTimers();
    resetGameState();
    setLoadingSentences(true);

    try {
      const list = await typingPracticeApi.getSentences(level, category, 40);
      if (list.length === 0) {
        setLoadError('Không có câu nào cho cấu hình này. Vui lòng thử category khác.');
        return;
      }
      setSentences(list);

      setPhase('countdown');

      let c = 3;
      setCountdown(c);
      countdownRef.current = setInterval(() => {
        c--;
        setCountdown(c);
        playTick();
        if (c <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          setPhase('playing');
          timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
              if (t <= 10 && t > 0) playTick();
              if (t <= 1) {
                if (timerRef.current) clearInterval(timerRef.current);
                playGameOver();
                setPhase('result');
                return 0;
              }
              return t - 1;
            });
          }, 1000);
        }
      }, 1000);
    } catch {
      setLoadError('Không thể tải câu. Kiểm tra mạng và thử lại.');
    } finally {
      setLoadingSentences(false);
    }
  };

  const advanceWord = useCallback(
    (skipped: boolean, missingChars: number) => {
      wordsRef.current += 1;

      if (skipped && missingChars > 0) {
        incorrectRef.current += missingChars;
        setIncorrectChars((n) => n + missingChars);
      } else if (!skipped) {
        // Successfully completed — count the trailing space as correct.
        correctRef.current += 1;
        setCorrectChars((n) => n + 1);
      }

      const nextWordIdx = wordIdx + 1;
      if (nextWordIdx >= words.length) {
        sentencesRef.current += 1;
        setSentencesCompleted((s) => s + 1);
        const nextSentenceIdx = sentenceIdx + 1;
        if (nextSentenceIdx >= sentences.length) {
          // Out of corpus — end game early.
          if (timerRef.current) clearInterval(timerRef.current);
          playGameOver();
          setPhase('result');
          return;
        }
        setSentenceIdx(nextSentenceIdx);
        setWordIdx(0);
      } else {
        setWordIdx(nextWordIdx);
      }
      setTyped('');
    },
    [wordIdx, words.length, sentenceIdx, sentences.length, playGameOver],
  );

  // Auto-focus hidden input during 'playing' so mobile soft keyboards open.
  // Re-focus when word/sentence advances (input keeps focus naturally; this
  // is a safety net in case React re-renders blur it).
  useEffect(() => {
    if (phase !== 'playing') return;
    inputRef.current?.focus();
  }, [phase, wordIdx, sentenceIdx]);

  // Process a single character. Used by both onBeforeInput (mobile + desktop
  // standard typing) and the umlaut/space paths. Returns the latest typed
  // string so callers can chain decisions on multi-char input.
  const processChar = useCallback(
    (ch: string, currentTyped: string): string => {
      if (ch === ' ') {
        if (!targetWord) return currentTyped;
        if (currentTyped === targetWord) {
          playCorrect();
          advanceWord(false, 0);
        } else {
          const missing = Math.max(0, targetWord.length - currentTyped.length);
          playWrong();
          advanceWord(true, missing);
        }
        return '';
      }

      if (!targetWord) return currentTyped;

      // `:` after a/o/u/s → swap previous char into umlaut. Re-evaluates the
      // previous char's correct/incorrect counter against the target.
      if (ch === ':') {
        if (currentTyped.length === 0) return currentTyped;
        const prevChar = currentTyped[currentTyped.length - 1];
        if (!prevChar) return currentTyped;
        const replacement = UMLAUT_MAP[prevChar];
        if (!replacement) return currentTyped;

        const prevIdx = currentTyped.length - 1;
        const wasCorrect = prevIdx < targetWord.length && prevChar === targetWord[prevIdx];
        const willBeCorrect = prevIdx < targetWord.length && replacement === targetWord[prevIdx];

        if (wasCorrect !== willBeCorrect) {
          if (wasCorrect) {
            correctRef.current -= 1;
            incorrectRef.current += 1;
            setCorrectChars((n) => n - 1);
            setIncorrectChars((n) => n + 1);
          } else {
            correctRef.current += 1;
            incorrectRef.current -= 1;
            setCorrectChars((n) => n + 1);
            setIncorrectChars((n) => n - 1);
          }
        }

        const newTyped = currentTyped.slice(0, -1) + replacement;
        if (newTyped === targetWord) {
          playCorrect();
          advanceWord(false, 0);
          return '';
        }
        return newTyped;
      }

      const newTyped = currentTyped + ch;
      const idx = newTyped.length - 1;

      if (idx < targetWord.length && newTyped[idx] === targetWord[idx]) {
        correctRef.current += 1;
        setCorrectChars((n) => n + 1);
      } else {
        incorrectRef.current += 1;
        setIncorrectChars((n) => n + 1);
      }

      // Auto-advance when the word is fully typed correctly.
      if (newTyped === targetWord) {
        playCorrect();
        advanceWord(false, 0);
        return '';
      }
      return newTyped;
    },
    [targetWord, advanceWord, playCorrect, playWrong],
  );

  // onBeforeInput handler — fires for every char inserted into the hidden
  // input, including from mobile soft keyboards and IME composition end.
  // We preventDefault to keep the input value empty (controlled, no diffing).
  const handleBeforeInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const native = e.nativeEvent as InputEvent;
      const data = native.data;
      if (!data) return;
      e.preventDefault();

      // Walk the inserted string char-by-char. Single-char is the common
      // path; multi-char happens with autocorrect/IME composition.
      let next = typed;
      for (const ch of data) {
        next = processChar(ch, next);
      }
      setTyped(next);
    },
    [typed, processChar],
  );

  // onKeyDown handler — only Backspace (not delivered via beforeinput on all
  // platforms). Other keys flow through onBeforeInput.
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      setTyped((t) => t.slice(0, -1));
    }
  }, []);

  // Submit session once when entering result phase.
  useEffect(() => {
    if (phase !== 'result') return;
    if (submittedRef.current) return;
    submittedRef.current = true;

    const totalChars = correctRef.current + incorrectRef.current;
    const accuracy = totalChars === 0 ? 0 : correctRef.current / totalChars;
    const wpm = correctRef.current / 5 / (DURATION_SEC / 60);

    submitSession.mutate({
      cefrLevel: level,
      category,
      durationSec: DURATION_SEC,
      sentencesCompleted: sentencesRef.current,
      wordsTyped: wordsRef.current,
      correctChars: correctRef.current,
      incorrectChars: incorrectRef.current,
      wpm,
      accuracy,
    });
  }, [phase, level, category, submitSession]);

  // ── Setup ───────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <GameSetupCard
        icon={({ size }) => <IconKeyboard size={size} style={{ color: 'white' }} />}
        iconColor={ACCENT.games}
        title="Luyện gõ phím"
        loadError={loadError}
      >
        <p className="text-sm mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
          Tăng tốc độ gõ tiếng Đức trong{' '}
          <span className="font-bold" style={{ color: ACCENT.games }}>
            {DURATION_SEC} giây
          </span>
        </p>
        <p className="text-xs mb-5" style={{ color: 'var(--theme-text-muted)' }}>
          Đo bằng WPM (từ/phút) và Accuracy
        </p>

        <div className="mb-5">
          <p
            className="text-[11px] font-black uppercase tracking-widest text-left mb-2"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            Trình độ
          </p>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((lv) => {
              const active = level === lv;
              return (
                <button
                  key={lv}
                  onClick={() => {
                    setLevel(lv);
                    playClick();
                  }}
                  className="py-3 rounded-xl font-bold transition-all"
                  style={{
                    backgroundColor: active ? ACCENT.games : 'var(--theme-bg-secondary)',
                    color: active ? 'white' : 'var(--theme-text-secondary)',
                    border: '1.5px solid',
                    borderColor: active ? ACCENT.games : 'var(--theme-border)',
                    boxShadow: active ? `0 4px 12px ${ACCENT.games}40` : 'none',
                  }}
                >
                  {lv}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5">
          <p
            className="text-[11px] font-black uppercase tracking-widest text-left mb-2"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            Chủ đề
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TYPING_CATEGORIES.map((cat) => {
              const meta = TYPING_CATEGORY_LABELS[cat];
              const active = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    playClick();
                  }}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 text-left"
                  style={{
                    backgroundColor: active ? `${ACCENT.games}1A` : 'var(--theme-bg-secondary)',
                    color: active ? ACCENT.games : 'var(--theme-text-secondary)',
                    border: '1.5px solid',
                    borderColor: active ? ACCENT.games : 'var(--theme-border)',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{meta.icon}</span>
                  <span className="flex-1 truncate">{meta.vi}</span>
                </button>
              );
            })}
          </div>
        </div>

        <GameInfoBox>
          <div className="flex items-center gap-2">
            <IconClock size={14} style={{ color: ACCENT.games }} />
            <span>Thời gian: {DURATION_SEC} giây · Tối đa 40 câu</span>
          </div>
          <div className="flex items-center gap-2">
            <IconKeyboard size={14} style={{ color: ACCENT.games }} />
            <span>
              Gõ trực tiếp · <KBD>Space</KBD> để qua từ · gõ đúng cả dấu câu
            </span>
          </div>
          <div className="flex items-center gap-2">
            <IconTarget size={14} style={{ color: ACCENT.games }} />
            <span>
              Mẹo umlaut: <span className="font-mono">{UMLAUT_TRIGGER_HINT}</span>
            </span>
          </div>
        </GameInfoBox>

        <Button
          onClick={startGame}
          variant="primary"
          fullWidth
          size="lg"
          disabled={loadingSentences}
          className="mt-5"
        >
          {loadingSentences ? 'Đang tải câu...' : 'Bắt đầu →'}
        </Button>
      </GameSetupCard>
    );
  }

  // ── Countdown ───────────────────────────────────────────────────────────
  if (phase === 'countdown') {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ minHeight: 'calc(100vh - 80px)' }}
      >
        <div
          className="text-9xl font-black"
          style={{
            color: ACCENT.games,
            textShadow: `0 0 40px ${ACCENT.games}66`,
            animation: 'bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
          key={countdown}
        >
          {countdown > 0 ? countdown : 'GO!'}
        </div>
        <p
          className="text-sm mt-4 font-semibold"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          Sẵn sàng gõ {sentences.length} câu...
        </p>
      </div>
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const totalChars = correctChars + incorrectChars;
    const accuracy = totalChars === 0 ? 0 : (correctChars / totalChars) * 100;
    const wpm = correctChars / 5 / (DURATION_SEC / 60);
    const bestForCategory = stats?.bestPerCategory.find(
      (b) => b.category === category && b.cefrLevel === level,
    );
    const isNewBest = bestForCategory ? wpm > bestForCategory.bestWpm : true;

    return (
      <>
        <GameResultCard accuracy={accuracy} title="Hoàn thành!">
          <p className="text-sm mb-5" style={{ color: 'var(--theme-text-muted)' }}>
            {level} · {TYPING_CATEGORY_LABELS[category].vi}
            {isNewBest && correctChars > 0 && (
              <span className="ml-2 font-bold" style={{ color: ACCENT.xp }}>
                ★ Best mới
              </span>
            )}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <StatCard
              label="WPM"
              value={Math.round(wpm)}
              color={ACCENT.games}
              icon={IconRocket}
            />
            <StatCard
              label="Accuracy"
              value={`${Math.round(accuracy)}%`}
              color={accuracy >= 90 ? STATUS.success : accuracy >= 70 ? ACCENT.xp : STATUS.danger}
              icon={IconTarget}
            />
            <StatCard
              label="Câu hoàn thành"
              value={sentencesCompleted}
              color={ACCENT.srs}
              icon={IconCheck}
            />
            <StatCard
              label="Lỗi"
              value={incorrectChars}
              color={STATUS.danger}
              icon={IconX}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                playClick();
                resetGameState();
                setPhase('setup');
              }}
              variant="secondary"
              fullWidth
            >
              Đổi cấu hình
            </Button>
            <Button
              onClick={() => {
                playClick();
                startGame();
              }}
              variant="primary"
              fullWidth
              leftIcon={<IconRefresh size={16} />}
            >
              Chơi lại
            </Button>
          </div>
        </GameResultCard>

        {stats && stats.bestPerCategory.length > 0 && (
          <div className="max-w-xl mx-auto px-4">
            <div
              className="rounded-2xl border p-4"
              style={{
                backgroundColor: 'var(--theme-bg-card)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <p
                className="text-[11px] font-black uppercase tracking-widest mb-2"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                Best WPM theo chủ đề
              </p>
              <div className="space-y-1.5">
                {stats.bestPerCategory.slice(0, 5).map((b) => (
                  <div
                    key={`${b.cefrLevel}-${b.category}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <span style={{ color: 'var(--theme-text-secondary)' }}>
                      {TYPING_CATEGORY_LABELS[b.category as TypingCategory]?.icon}{' '}
                      {TYPING_CATEGORY_LABELS[b.category as TypingCategory]?.vi}{' '}
                      <span className="opacity-60">· {b.cefrLevel}</span>
                    </span>
                    <span
                      className="font-bold"
                      style={{ color: ACCENT.games }}
                    >
                      {Math.round(b.bestWpm)} WPM
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── Playing ────────────────────────────────────────────────────────────
  const liveTotalChars = correctChars + incorrectChars;
  const liveAccuracy =
    liveTotalChars === 0 ? 100 : Math.round((correctChars / liveTotalChars) * 100);
  const elapsedSec = DURATION_SEC - timeLeft;
  const liveWpm =
    elapsedSec === 0 ? 0 : Math.round(correctChars / 5 / (elapsedSec / 60));

  const timerStr = `00:${String(timeLeft).padStart(2, '0')}`;

  return (
    <div
      className="max-w-3xl mx-auto px-4 py-6"
      onClick={() => inputRef.current?.focus()}
    >
      <GamePlayHeader
        title="Luyện gõ phím"
        subtitle={`SATZ · ${sentenceIdx + 1} / ${sentences.length} · ${TYPING_CATEGORY_LABELS[category].de.toUpperCase()}`}
        timer={timerStr}
        onExit={() => {
          clearTimers();
          router.push('/games');
        }}
      />

      <GameStatsBar
        stats={[
          { label: 'WPM', value: liveWpm, color: ACCENT.games, dot: true },
          { label: 'Accuracy', value: `${liveAccuracy}%`, color: STATUS.success, dot: true },
          { label: 'Câu', value: sentencesCompleted, color: ACCENT.srs, dot: true },
          { label: 'Lỗi', value: incorrectChars, color: STATUS.danger, dot: true },
        ]}
      />

      {currentSentence && (
        <TypingDisplay
          sentence={currentSentence.textDe}
          translation={currentSentence.translationVi}
          currentWordIdx={wordIdx}
          typed={typed}
        />
      )}

      {/* Hidden input — captures soft keyboard / IME / hardware input.
          Visually offscreen but still focusable so mobile keyboards open. */}
      <input
        ref={inputRef}
        type="text"
        value=""
        onChange={() => {}}
        onBeforeInput={handleBeforeInput}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Re-focus on next tick so the soft keyboard stays open.
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        inputMode="text"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Vùng gõ phím luyện typing"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 1,
          height: 1,
          opacity: 0,
          padding: 0,
          border: 0,
          outline: 'none',
          zIndex: -1,
        }}
      />

      <p
        className="text-center text-xs mt-8 px-4"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        <span className="md:hidden">Chạm vào màn hình để mở bàn phím · </span>
        Gõ trực tiếp · Space để qua từ · {DURATION_SEC}s · gõ đúng cả dấu câu ·{' '}
        <span className="font-mono">{UMLAUT_TRIGGER_HINT}</span>
      </p>
    </div>
  );
}
