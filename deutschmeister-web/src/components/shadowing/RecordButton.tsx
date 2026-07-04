'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ACCENT, STATUS } from '@/lib/tokens';
import { blobToWavBase64 } from '@/lib/audio';

type RecState = 'idle' | 'countdown' | 'recording' | 'processing';

interface Props {
  maxDurationMs: number;
  disabled?: boolean;
  onRecorded: (audioBase64: string, mimeType: string) => Promise<void> | void;
  onError?: (message: string) => void;
  size?: number; // pixel size of the round button (default 64)
  accentColor?: string;
  recordingColor?: string;
  /** Optional "get ready" 3·2·1 countdown before capture starts (ms). 0 = off. */
  countdownMs?: number;
}

export function RecordButton({
  maxDurationMs,
  disabled,
  onRecorded,
  onError,
  size = 64,
  accentColor = ACCENT.dictation,
  recordingColor = STATUS.danger,
  countdownMs = 0,
}: Props) {
  const t = useTranslations('practice.dictation.shadow.components');
  const [state, setState] = useState<RecState>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [countdownSec, setCountdownSec] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTsRef = useRef<number>(0);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear timers/intervals only — the mic stream is kept warm between takes.
  const clearTimers = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }, []);

  // Release the mic only when the component unmounts.
  useEffect(() => () => { clearTimers(); stopStream(); }, [clearTimers, stopStream]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  }, []);

  // Reuse the existing live mic stream; only prompt/acquire once.
  const getStream = useCallback(async (): Promise<MediaStream | null> => {
    const existing = streamRef.current;
    if (existing && existing.getAudioTracks().some((tr) => tr.readyState === 'live')) {
      return existing;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      return stream;
    } catch {
      onError?.(t('recMicError'));
      return null;
    }
  }, [onError, t]);

  const beginRecording = useCallback((stream: MediaStream) => {
    const mimeCandidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
    ];
    const mimeType = mimeCandidates.find((m) =>
      typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(m),
    ) ?? 'audio/webm';

    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      clearTimers();
      const blob = new Blob(chunksRef.current, { type: mimeType });
      if (blob.size < 1000) {
        setState('idle');
        onError?.(t('recTooShort'));
        return;
      }
      setState('processing');
      try {
        // Gemini's audio input rejects webm — send WAV (16 kHz mono), which is
        // universally supported. Fall back to the raw recording only if the
        // browser can't decode the blob.
        const wav = await blobToWavBase64(blob);
        if (wav) {
          await onRecorded(wav, 'audio/wav');
        } else {
          const buf = await blob.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ''),
          );
          await onRecorded(base64, mimeType);
        }
      } catch (err) {
        onError?.(err instanceof Error ? err.message : t('recProcessError'));
      } finally {
        setState('idle');
        setElapsedMs(0);
      }
    };

    recorder.start(250);
    startTsRef.current = Date.now();
    setState('recording');

    tickRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTsRef.current);
    }, 100);

    stopTimerRef.current = setTimeout(() => {
      stopRecording();
    }, maxDurationMs);
  }, [maxDurationMs, clearTimers, onRecorded, onError, stopRecording, t]);

  const beginCountdown = useCallback((stream: MediaStream) => {
    let remaining = Math.max(1, Math.ceil(countdownMs / 1000));
    setCountdownSec(remaining);
    setState('countdown');
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = null;
        setCountdownSec(0);
        beginRecording(stream);
      } else {
        setCountdownSec(remaining);
      }
    }, 1000);
  }, [countdownMs, beginRecording]);

  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
    setCountdownSec(0);
    setState('idle');
  }, []);

  const start = useCallback(async () => {
    if (disabled || state !== 'idle') return;
    setElapsedMs(0);
    chunksRef.current = [];

    const stream = await getStream();
    if (!stream) return;

    if (countdownMs > 0) beginCountdown(stream);
    else beginRecording(stream);
  }, [disabled, state, countdownMs, getStream, beginCountdown, beginRecording]);

  const handleClick = () => {
    if (state === 'idle') start();
    else if (state === 'countdown') cancelCountdown();
    else if (state === 'recording') stopRecording();
  };

  const isCountdown = state === 'countdown';
  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        aria-label={isCountdown ? t('recCancel') : isRecording ? t('recStop') : t('recStart')}
        className="relative rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        style={{
          width: size,
          height: size,
          background: isRecording
            ? recordingColor
            : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          color: 'white',
        }}
      >
        {isRecording && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-50"
            style={{ background: recordingColor }}
          />
        )}
        {isProcessing ? (
          <span
            className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
          />
        ) : isCountdown ? (
          <span className="text-2xl font-black tabular-nums">{countdownSec}</span>
        ) : isRecording ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        )}
      </button>

      {isCountdown && (
        <span className="text-xs font-bold" style={{ color: accentColor }}>
          {t('recGetReady')}
        </span>
      )}

      {isRecording && (
        <div className="flex items-center gap-2">
          <div
            className="text-xs font-black tabular-nums"
            style={{ color: recordingColor }}
          >
            {(elapsedMs / 1000).toFixed(1)}s
          </div>
          <span className="text-xs font-bold" style={{ color: 'var(--theme-text-muted)' }}>
            {t('recStopHint')}
          </span>
        </div>
      )}

      {isProcessing && (
        <span
          className="text-xs font-bold opacity-70"
          style={{ color: 'var(--theme-text-secondary)' }}
        >
          {t('recGrading')}
        </span>
      )}
    </div>
  );
}
