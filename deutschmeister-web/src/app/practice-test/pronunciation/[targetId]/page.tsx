'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePronunciationTargets, useScorePronunciation } from '@/hooks/usePronunciationScoring';
import type { PronunciationTarget, WordScore } from '@/lib/api/pronunciation';

const MAX_RECORD_SECS = 30;

function getWordColor(score: number) {
  if (score >= 80) return '#22C55E';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
}

function getScoreColor(score: number) {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#F59E0B';
  if (score >= 40) return '#F97316';
  return '#EF4444';
}

type RecState = 'idle' | 'recording' | 'done' | 'scoring';

export default function PronunciationPracticePage() {
  const params = useParams<{ targetId: string }>();
  const router = useRouter();
  const targetId = params.targetId;

  const { data: targets } = usePronunciationTargets();
  const scoreMut = useScorePronunciation();

  const target = targets?.find((t) => t.id === targetId);
  const allTargets = targets ?? [];
  const currentIndex = allTargets.findIndex((t) => t.id === targetId);

  const [recState, setRecState] = useState<RecState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    overallScore: number;
    wordScores: WordScore[];
    suggestions: string[];
    transcribedText: string;
  } | null>(null);
  const [hoveredWord, setHoveredWord] = useState<number | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Auto-stop at max
  useEffect(() => {
    if (recState === 'recording' && elapsed >= MAX_RECORD_SECS) {
      stopRecording();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, recState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioUrlRef.current && URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    setRecState('recording');
    setElapsed(0);
    setError('');
    setResult(null);
    chunksRef.current = [];
    blobRef.current = null;
    audioUrlRef.current && URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        blobRef.current = new Blob(chunksRef.current, { type: 'audio/webm' });
        audioUrlRef.current = URL.createObjectURL(blobRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setRecState('done');
      };
      recorder.start(500);

      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } catch {
      setError('Không thể truy cập microphone. Vui lòng cấp quyền.');
      setRecState('idle');
    }
  }, []);

  const stopRecording = useCallback(() => {
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = null;
    recorderRef.current?.stop();
  }, []);

  const handleScore = async () => {
    if (!blobRef.current || !target) return;
    setRecState('scoring');
    setError('');

    try {
      const buf = await blobRef.current.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ''),
      );

      const res = await scoreMut.mutateAsync({
        targetText: target.text,
        level: target.level,
        audioBase64: base64,
        mimeType: 'audio/webm',
        targetId: target.id,
      });

      setResult(res);
      setRecState('done');
    } catch (err: any) {
      setError(err?.message || 'Chấm điểm thất bại');
      setRecState('done');
    }
  };

  const handleRetry = () => {
    setResult(null);
    setRecState('idle');
    setElapsed(0);
  };

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < allTargets.length - 1) {
      const next = allTargets[currentIndex + 1];
      router.push(`/practice-test/pronunciation/${next.id}`);
      setResult(null);
      setRecState('idle');
      setElapsed(0);
    }
  };

  if (!target) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--theme-bg-primary)' }}
      >
        <div className="text-center">
          <p style={{ color: 'var(--theme-text-primary)' }}>
            Đang tải câu luyện tập…
          </p>
          <Link
            href="/practice-test/pronunciation"
            className="text-sm underline mt-2 inline-block"
            style={{ color: '#6366F1' }}
          >
            Quay lại
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--theme-bg-primary)' }}
    >
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <Link
          href="/practice-test/pronunciation"
          className="text-xs mb-4 inline-flex items-center gap-1"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          ← Danh sách câu
        </Link>

        {/* Target card */}
        <div
          className="rounded-2xl border p-6 mb-6 text-center"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-bg-card)',
          }}
        >
          <span
            className="px-2 py-0.5 rounded-md text-caption font-bold mb-3 inline-block"
            style={{
              backgroundColor: `${getWordColor(80)}1a`,
              color: getWordColor(80),
            }}
          >
            {target.level} • {target.category}
          </span>
          <h2
            className="text-xl md:text-2xl font-bold mb-2"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            {target.text}
          </h2>
          <p
            className="text-sm"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            {target.translationVi}
          </p>
        </div>

        {/* Recorder */}
        <div
          className="rounded-2xl border p-6 mb-6"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-bg-card)',
          }}
        >
          {/* Timer */}
          {recState === 'recording' && (
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span
                  className="text-sm font-mono"
                  style={{ color: '#EF4444' }}
                >
                  {String(Math.floor(elapsed / 60)).padStart(2, '0')}:
                  {String(elapsed % 60).padStart(2, '0')}
                </span>
              </div>
              <div
                className="h-1 rounded-full mx-auto max-w-xs"
                style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
              >
                <div
                  className="h-full rounded-full bg-red-500 transition-all"
                  style={{
                    width: `${(elapsed / MAX_RECORD_SECS) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Audio playback (after recording) */}
          {recState === 'done' && audioUrlRef.current && !result && (
            <div className="mb-4">
              <audio
                src={audioUrlRef.current}
                controls
                className="w-full rounded-lg"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {recState === 'idle' && (
              <button
                type="button"
                onClick={startRecording}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #EC4899, #A855F7)',
                  boxShadow: '0 4px 12px rgba(236,72,153,.3)',
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                Bắt đầu ghi âm
              </button>
            )}

            {recState === 'recording' && (
              <button
                type="button"
                onClick={stopRecording}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: 'rgba(239,68,68,.1)',
                  color: '#EF4444',
                  border: '2px solid rgba(239,68,68,.3)',
                }}
              >
                ⏹ Dừng ghi âm
              </button>
            )}

            {recState === 'done' && !result && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm"
                  style={{
                    backgroundColor: 'var(--theme-bg-secondary)',
                    color: 'var(--theme-text-secondary)',
                  }}
                >
                  Ghi lại
                </button>
                <button
                  type="button"
                  onClick={handleScore}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white"
                  style={{
                    background: 'linear-gradient(135deg, #EC4899, #A855F7)',
                  }}
                >
                  Chấm điểm
                </button>
              </div>
            )}

            {recState === 'scoring' && (
              <div className="text-center py-4">
                <div
                  className="w-10 h-10 mx-auto border-3 border-t-purple-500 rounded-full animate-spin mb-2"
                  style={{ borderColor: 'var(--theme-border)', borderTopColor: '#A855F7' }}
                />
                <div
                  className="text-sm"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  AI đang phân tích phát âm…
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-center mt-3" style={{ color: '#EF4444' }}>
              {error}
            </p>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Overall score */}
            <div
              className="rounded-2xl border p-5 text-center"
              style={{
                borderColor: 'var(--theme-border)',
                backgroundColor: 'var(--theme-bg-card)',
              }}
            >
              <div
                className="text-5xl font-bold mb-1"
                style={{ color: getScoreColor(result.overallScore) }}
              >
                {result.overallScore}
                <span className="text-2xl opacity-60">/100</span>
              </div>
              <div
                className="text-sm"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                Điểm phát âm
              </div>
            </div>

            {/* What AI heard */}
            {result.transcribedText && (
              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: 'var(--theme-border)',
                  backgroundColor: 'var(--theme-bg-card)',
                }}
              >
                <div
                  className="text-caption font-bold mb-1"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  AI nghe được:
                </div>
                <p
                  className="text-sm italic"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  &ldquo;{result.transcribedText}&rdquo;
                </p>
              </div>
            )}

            {/* Word-by-word scores */}
            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: 'var(--theme-border)',
                backgroundColor: 'var(--theme-bg-card)',
              }}
            >
              <div
                className="text-caption font-bold mb-3"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                Điểm từng từ (chạm/hover để xem chi tiết):
              </div>
              <div className="flex flex-wrap gap-2">
                {result.wordScores.map((ws, i) => (
                  <div
                    key={i}
                    className="relative"
                    onMouseEnter={() => setHoveredWord(i)}
                    onMouseLeave={() => setHoveredWord(null)}
                    onClick={() =>
                      setHoveredWord(hoveredWord === i ? null : i)
                    }
                  >
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg cursor-pointer text-sm font-medium transition-all"
                      style={{
                        backgroundColor: `${getWordColor(ws.score)}1a`,
                        color: getWordColor(ws.score),
                        border: `1px solid ${getWordColor(ws.score)}40`,
                      }}
                    >
                      {ws.word}
                      <span className="text-caption opacity-70">{ws.score}</span>
                    </span>
                    {hoveredWord === i && ws.issue && (
                      <div
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-caption whitespace-nowrap z-10 shadow-lg"
                        style={{
                          backgroundColor: 'var(--theme-bg-primary)',
                          color: 'var(--theme-text-primary)',
                          border: '1px solid var(--theme-border)',
                        }}
                      >
                        {ws.issue}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            {result.suggestions?.length > 0 && (
              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: '#A855F740',
                  backgroundColor: 'rgba(168,85,247,0.05)',
                }}
              >
                <h4
                  className="text-sm font-bold mb-2"
                  style={{ color: '#A855F7' }}
                >
                  💡 Gợi ý cải thiện
                </h4>
                <ul className="space-y-1.5">
                  {result.suggestions.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm flex items-start gap-2"
                      style={{ color: 'var(--theme-text-secondary)' }}
                    >
                      <span style={{ color: '#A855F7' }}>•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRetry}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-center"
                style={{
                  backgroundColor: 'var(--theme-bg-card)',
                  color: 'var(--theme-text-secondary)',
                  border: '1px solid var(--theme-border)',
                }}
              >
                Thử lại
              </button>
              {currentIndex >= 0 && currentIndex < allTargets.length - 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white text-center"
                  style={{
                    background: 'linear-gradient(135deg, #EC4899, #A855F7)',
                  }}
                >
                  Câu tiếp theo →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
