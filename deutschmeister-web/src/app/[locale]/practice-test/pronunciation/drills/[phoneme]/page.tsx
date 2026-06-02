'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { usePhonemeDrill, useScorePronunciation } from '@/hooks/usePronunciationScoring';
import type { WordScore } from '@/lib/api/pronunciation';
import { STATUS } from '@/lib/tokens';
import { MinimalPairCard } from '@/components/pronunciation/MinimalPairCard';

const MAX_RECORD_SECS = 30;

function getWordColor(score: number) {
  if (score >= 80) return STATUS.success;
  if (score >= 50) return STATUS.warning;
  return STATUS.danger;
}

type RecState = 'idle' | 'recording' | 'done' | 'scoring';

export default function PhonemeDrillPage() {
  const { phoneme } = useParams<{ phoneme: string }>();
  const t = useTranslations('practice.pronunciation.drills');
  const { data: drill, isLoading } = usePhonemeDrill(phoneme);
  const scoreMut = useScorePronunciation();

  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [recState, setRecState] = useState<RecState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    overallScore: number;
    wordScores: WordScore[];
    suggestions: string[];
    transcribedText: string;
  } | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    recorderRef.current?.stop();
  }, []);

  useEffect(() => {
    if (recState === 'recording' && elapsed >= MAX_RECORD_SECS) stopRecording();
  }, [elapsed, recState, stopRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const startRecording = useCallback(async () => {
    setRecState('recording');
    setElapsed(0);
    setError('');
    setResult(null);
    chunksRef.current = [];
    blobRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        blobRef.current = new Blob(chunksRef.current, { type: 'audio/webm' });
        streamRef.current?.getTracks().forEach(track => track.stop());
        setRecState('done');
      };
      recorder.start(500);
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    } catch {
      setError(t('micError'));
      setRecState('idle');
    }
  }, [t]);

  const handleScore = async () => {
    if (!blobRef.current || !selectedText) return;
    setRecState('scoring');
    setError('');
    try {
      const buf = await blobRef.current.arrayBuffer();
      const base64 = btoa(new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ''));
      const res = await scoreMut.mutateAsync({
        targetText: selectedText,
        level: 'A1',
        audioBase64: base64,
        mimeType: 'audio/webm',
        phonemeTag: phoneme,
      });
      setResult(res);
      setRecState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('scoreError'));
      setRecState('done');
    }
  };

  const handleRetry = () => {
    setResult(null);
    setRecState('idle');
    setElapsed(0);
  };

  if (isLoading || !drill) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="h-48 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <Link href="/practice-test/pronunciation/drills"
        className="text-xs mb-4 inline-flex items-center gap-1"
        style={{ color: 'var(--theme-text-muted)' }}>
        {t('drillBack')}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="mono text-4xl font-bold" style={{ color: 'var(--accent)', letterSpacing: '-.03em' }}>{drill.label}</div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>{drill.labelVi}</h1>
          <p className="mono text-xs" style={{ color: 'var(--accent)' }}>{drill.ipa}</p>
          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{drill.description}</p>
        </div>
      </div>

      {/* Minimal pairs */}
      <section className="mb-6">
        <h2 className="text-caption font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--die)' }}>
          {t('minimalPairs')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {drill.minimalPairs.map((pair, i) => (
            <MinimalPairCard key={i} wordA={pair.wordA} wordB={pair.wordB} note={pair.noteVi} />
          ))}
        </div>
      </section>

      {/* Practice words — clickable to select */}
      <section className="mb-6">
        <h2 className="text-body font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--accent)' }}>
          {t('practiceWords')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {drill.practiceWords.map(w => (
            <button key={w} onClick={() => { setSelectedText(w); handleRetry(); }}
              className="px-3 py-1.5 rounded-lg text-body font-medium transition-all"
              style={{
                backgroundColor: selectedText === w ? 'var(--accent)' : 'var(--theme-bg-card)',
                color: selectedText === w ? 'var(--accent-on)' : 'var(--theme-text-primary)',
                border: `1px solid ${selectedText === w ? 'var(--accent)' : 'var(--theme-border)'}`,
              }}>
              {w}
            </button>
          ))}
        </div>
      </section>

      {/* Practice sentences — clickable */}
      <section className="mb-6">
        <h2 className="text-body font-bold uppercase tracking-wider mb-2" style={{ color: STATUS.success }}>
          {t('practiceSentences')}
        </h2>
        <div className="space-y-1.5">
          {drill.practiceSentences.map(s => (
            <button key={s} onClick={() => { setSelectedText(s); handleRetry(); }}
              className="w-full text-left rounded-xl border p-3 text-body font-medium transition-all"
              style={{
                backgroundColor: selectedText === s ? `color-mix(in srgb, var(--accent) 8%, transparent)` : 'var(--theme-bg-card)',
                borderColor: selectedText === s ? 'var(--accent)' : 'var(--theme-border)',
                color: 'var(--theme-text-primary)',
              }}>
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Selected text + recorder */}
      {selectedText && (
        <div className="rounded-2xl border p-6 mb-6"
          style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--theme-bg-card)' }}>
          <p className="text-center text-lg font-bold mb-4" style={{ color: 'var(--theme-text-primary)' }}>
            {selectedText}
          </p>

          {/* Timer */}
          {recState === 'recording' && (
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: STATUS.danger }} />
                <span className="text-sm font-mono" style={{ color: STATUS.danger }}>
                  {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
                </span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-center gap-3">
            {recState === 'idle' && (
              <button onClick={startRecording}
                className="px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--accent)', boxShadow: `0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent)` }}>
                {t('record')}
              </button>
            )}
            {recState === 'recording' && (
              <button onClick={stopRecording}
                className="px-6 py-3 rounded-xl text-white font-bold text-sm"
                style={{ backgroundColor: STATUS.danger }}>
                {t('stop')}
              </button>
            )}
            {recState === 'done' && !result && (
              <div className="flex gap-3">
                <button onClick={handleRetry}
                  className="px-4 py-2.5 rounded-xl border font-semibold text-body"
                  style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                  {t('retry')}
                </button>
                <button onClick={handleScore}
                  className="px-6 py-2.5 rounded-xl text-white font-bold text-sm"
                  style={{ background: 'var(--accent)' }}>
                  {t('score')}
                </button>
              </div>
            )}
            {recState === 'scoring' && (
              <div className="flex items-center gap-2 text-body" style={{ color: 'var(--theme-text-muted)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                {t('analyzing')}
              </div>
            )}
          </div>

          {error && (
            <p className="text-center text-xs mt-3" style={{ color: STATUS.danger }}>{error}</p>
          )}

          {/* Result */}
          {result && (
            <div className="mt-5 space-y-4">
              {/* Score */}
              <div className="text-center">
                <div className="mono text-4xl font-bold" style={{ color: getWordColor(result.overallScore), letterSpacing: '-.02em' }}>
                  {result.overallScore}
                </div>
                <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>/100</div>
              </div>

              {/* Word scores */}
              <div className="flex flex-wrap justify-center gap-2">
                {result.wordScores.map((ws, i) => (
                  <div key={i} className="text-center">
                    <div className="text-sm font-bold" style={{ color: getWordColor(ws.score) }}>
                      {ws.word}
                    </div>
                    <div className="text-caption" style={{ color: getWordColor(ws.score) }}>{ws.score}</div>
                    {ws.issue && (
                      <div className="text-caption max-w-24" style={{ color: STATUS.danger }}>{ws.issue}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <div className="rounded-xl p-3" style={{ backgroundColor: `color-mix(in srgb, var(--accent) 6%, transparent)` }}>
                  <p className="text-caption font-bold uppercase mb-1" style={{ color: 'var(--accent)' }}>{t('suggestionsTitle')}</p>
                  <ul className="space-y-1">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
                        <span style={{ color: 'var(--accent)' }}>•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-center">
                <button onClick={handleRetry}
                  className="px-5 py-2 rounded-xl font-semibold text-body transition-all"
                  style={{ color: 'var(--accent)', backgroundColor: `color-mix(in srgb, var(--accent) 8%, transparent)` }}>
                  {t('tryAgain')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
