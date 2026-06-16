'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Format a number of seconds as MM:SS. */
export function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Exam countdown shared by all four skill exams (listening / reading / writing /
 * speaking). The timer is opt-in: `timeRemaining` stays `null` ("not started")
 * until `start()` is called on the learner's first action — pressing Play,
 * answering a question, typing, or beginning to speak. This guarantees an exam
 * can never auto-submit before the learner has actually begun (the original
 * listening bug, where a `0`-initialised timer was read as "time's up").
 *
 * When the countdown reaches 0, `onExpire` fires exactly once; pages wire this
 * to auto-submit so the exam ends at the certificate's time limit like the real
 * thing. `start()` is idempotent, so it is safe to call from a per-Teil handler.
 *
 * @param totalSeconds Full duration from the certificate config (timeMin * 60).
 *                     `0`/`undefined` keeps the timer disabled.
 * @param onExpire     Called once when the timer hits 0.
 */
export function useExamCountdown(totalSeconds: number | undefined, onExpire: () => void) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);
  const firedRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  const stop = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const start = useCallback(() => {
    if (startedRef.current || !totalSeconds || totalSeconds <= 0) return;
    startedRef.current = true;
    setTimeRemaining(totalSeconds);
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null) return prev;
        if (prev <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, [totalSeconds]);

  // Clear the interval on unmount.
  useEffect(() => stop, [stop]);

  // Fire the expiry callback exactly once when the countdown reaches 0.
  useEffect(() => {
    if (timeRemaining === 0 && !firedRef.current) {
      firedRef.current = true;
      onExpireRef.current();
    }
  }, [timeRemaining]);

  return { timeRemaining, start, stop };
}
