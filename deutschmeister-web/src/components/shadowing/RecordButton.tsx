'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ACCENT, STATUS } from '@/lib/tokens';

type RecState = 'idle' | 'recording' | 'processing';

interface Props {
  maxDurationMs: number;
  disabled?: boolean;
  onRecorded: (audioBase64: string, mimeType: string) => Promise<void> | void;
  onError?: (message: string) => void;
  size?: number; // pixel size of the round button (default 64)
  accentColor?: string;
  recordingColor?: string;
}

export function RecordButton({
  maxDurationMs,
  disabled,
  onRecorded,
  onError,
  size = 64,
  accentColor = ACCENT.dictation,
  recordingColor = STATUS.danger,
}: Props) {
  const t = useTranslations('practice.dictation.shadow.components');
  const [state, setState] = useState<RecState>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTsRef = useRef<number>(0);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  }, []);

  const start = useCallback(async () => {
    if (disabled || state !== 'idle') return;
    setElapsedMs(0);
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onError?.(t('recMicError'));
      return;
    }
    streamRef.current = stream;

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
      cleanup();
      const blob = new Blob(chunksRef.current, { type: mimeType });
      if (blob.size < 1000) {
        setState('idle');
        onError?.(t('recTooShort'));
        return;
      }
      setState('processing');
      try {
        const buf = await blob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ''),
        );
        await onRecorded(base64, mimeType);
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
  }, [disabled, state, maxDurationMs, cleanup, onRecorded, onError, stopRecording]);

  const handleClick = () => {
    if (state === 'idle') start();
    else if (state === 'recording') stopRecording();
  };

  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';
  const remainPct = isRecording
    ? Math.max(0, 100 - (elapsedMs / maxDurationMs) * 100)
    : 0;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        aria-label={isRecording ? t('recStop') : t('recStart')}
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

      {isRecording && (
        <div className="flex items-center gap-2">
          <div
            className="text-xs font-black tabular-nums"
            style={{ color: recordingColor }}
          >
            {(elapsedMs / 1000).toFixed(1)}s
          </div>
          <div
            className="h-1.5 w-20 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
          >
            <div
              className="h-full transition-all"
              style={{
                width: `${remainPct}%`,
                background: recordingColor,
              }}
            />
          </div>
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
