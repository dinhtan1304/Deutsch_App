'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFreeSpeakingSession, useSubmitFreeSpeaking } from '@/hooks/useFreeSpeaking';

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconMic({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" /></svg>;
}
function IconStop({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block', ...style }}><rect x="4" y="4" width="16" height="16" rx="2" /></svg>;
}
function IconRefresh({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>;
}
function IconSend({ size = 17, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
}
function IconChevronLeft({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconLoader({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconCheck({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="20 6 9 17 4 12" /></svg>;
}

const ACCENT = '#F59E0B';
const GRADIENT = 'linear-gradient(135deg, #F59E0B, #EF4444)';
const MAX_RECORD_SECS = 120;

// ─── Waveform animation ────────────────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  const bars = [3, 5, 8, 5, 10, 7, 4, 9, 6, 4, 8, 5, 3, 7, 5];
  return (
    <div className="flex items-center justify-center gap-0.5 h-10">
      {bars.map((h, i) => (
        <div key={i}
          style={{
            width: 3, borderRadius: 2,
            backgroundColor: ACCENT,
            height: active ? `${h * 2.5}px` : '4px',
            animation: active ? `wave ${0.5 + i * 0.07}s ease-in-out infinite alternate` : 'none',
            transition: 'height 0.3s ease',
            opacity: active ? 0.85 : 0.3,
          }} />
      ))}
      <style>{`@keyframes wave { from { transform: scaleY(0.4); } to { transform: scaleY(1); } }`}</style>
    </div>
  );
}

// ─── Countdown ring ───────────────────────────────────────────────────────────
function CountdownRing({ seconds, total, size = 80, color }: { seconds: number; total: number; size?: number; color: string }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? seconds / total : 0;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--theme-border)" strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={c} strokeDashoffset={c - (c * pct)} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{seconds}</span>
      </div>
    </div>
  );
}

type RecordState = 'idle' | 'recording' | 'done';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise(res => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(',')[1]);
    r.readAsDataURL(blob);
  });
}

export default function FreeSpeakingSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: session, isLoading, error } = useFreeSpeakingSession(id);
  const submitMut = useSubmitFreeSpeaking();

  const [recState, setRecState] = useState<RecordState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [canRetake, setCanRetake] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobEvent['data'][]>([]);
  const blobRef = useRef<Blob | null>(null);
  const recogRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) setSpeechSupported(false);
    }
  }, []);

  // Auto-stop at max duration
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
      streamRef.current?.getTracks().forEach(t => t.stop());
      recogRef.current?.stop();
    };
  }, []);

  const startRecording = useCallback(async () => {
    setRecState('recording');
    setElapsed(0);
    setLiveTranscript('');
    setFinalTranscript('');
    chunksRef.current = [];
    blobRef.current = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      recorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        blobRef.current = new Blob(chunksRef.current, { type: 'audio/webm' });
        streamRef.current?.getTracks().forEach(t => t.stop());
        setRecState('done');
      };
      recorder.start(500);
    } catch {
      setSubmitError('Không thể truy cập microphone. Vui lòng cấp quyền.');
      setRecState('idle');
      return;
    }

    // Timer
    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    // Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recogRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'de-DE';
      recognition.onresult = (e: any) => {
        let interim = '';
        let final = '';
        for (let i = 0; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
          else interim += e.results[i][0].transcript;
        }
        setLiveTranscript((final + interim).trim());
        if (final) setFinalTranscript(final.trim());
      };
      recognition.onerror = () => {};
      try { recognition.start(); } catch {}
    }
  }, []);

  const stopRecording = useCallback(() => {
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = null;
    recogRef.current?.stop();
    // Update final transcript from live before stopping
    setFinalTranscript(prev => prev || liveTranscript);
    recorderRef.current?.stop();
  }, [liveTranscript]);

  const handleRetake = useCallback(() => {
    setCanRetake(false);
    blobRef.current = null;
    setRecState('idle');
    setLiveTranscript('');
    setFinalTranscript('');
    setElapsed(0);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!blobRef.current) return;
    setSubmitError('');
    try {
      const audioBase64 = await blobToBase64(blobRef.current);
      await submitMut.mutateAsync({
        id,
        audioBase64,
        transcript: finalTranscript,
        mimeType: 'audio/webm',
      });
      router.push(`/practice-test/speaking/${id}/result`);
    } catch {
      setSubmitError('Không thể nộp bài. Vui lòng thử lại.');
    }
  }, [id, finalTranscript, submitMut, router]);

  if (isLoading) return (
    <div className="py-16 flex flex-col items-center gap-3">
      <IconLoader size={28} style={{ color: ACCENT }} />
      <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>Đang tải bài nói...</p>
    </div>
  );

  if (error || !session) return (
    <div className="py-16 text-center">
      <p style={{ color: '#EF4444' }}>Không tìm thấy bài nói.</p>
      <Link href="/practice-test/speaking" className="text-body mt-3 inline-block" style={{ color: ACCENT }}>← Danh sách</Link>
    </div>
  );

  // If already graded, redirect to result
  useEffect(() => {
    if (session?.status === 'GRADED' || session?.status === 'GRADING') {
      router.push(`/practice-test/speaking/${id}/result`);
    }
  }, [session?.status, id, router]);

  if (session?.status === 'GRADED' || session?.status === 'GRADING') return null;

  const remaining = MAX_RECORD_SECS - elapsed;

  // ─── Submitting overlay ──────────────────────────────────────────────────────
  if (submitMut.isPending) {
    return (
      <div className="py-16 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,.12)' }}>
          <IconLoader size={28} style={{ color: ACCENT }} />
        </div>
        <div className="text-center">
          <p className="font-bold text-[15px]" style={{ color: 'var(--theme-text-primary)' }}>AI đang chấm điểm...</p>
          <p className="text-body mt-1" style={{ color: 'var(--theme-text-muted)' }}>Gemini phân tích audio + transcript. Khoảng 15–30 giây.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Back */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/practice-test/speaking" className="flex items-center gap-1 text-body font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--theme-text-muted)' }}>
          <IconChevronLeft size={14} /> Danh sách
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,.12)' }}>
          <IconMic size={20} style={{ color: ACCENT }} />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Luyện Nói</h1>
            <span className="text-caption px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(245,158,11,.12)', color: ACCENT }}>
              {session.cefrLevel}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {session.topicType.replace(/_/g, ' ')}
          </p>
        </div>
      </div>

      {/* Prompt card */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <p className="text-caption font-bold uppercase tracking-wider mb-2" style={{ color: ACCENT }}>Câu hỏi / Prompt</p>
        <p className="text-[15px] font-bold leading-relaxed mb-2" style={{ color: 'var(--theme-text-primary)' }}>
          {session.prompt}
        </p>
        <p className="text-body leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
          {session.promptVi}
        </p>
      </div>

      {/* Key points */}
      {session.keyPoints?.length > 0 && (
        <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(245,158,11,.05)', border: '1px solid rgba(245,158,11,.2)' }}>
          <p className="text-caption font-bold uppercase tracking-wider mb-2.5" style={{ color: ACCENT }}>
            Gợi ý nên đề cập
          </p>
          <ul className="space-y-1.5">
            {session.keyPoints.map((pt: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-caption font-bold"
                  style={{ background: 'rgba(245,158,11,.15)', color: ACCENT }}>{i + 1}</span>
                {pt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Speech not supported warning */}
      {!speechSupported && (
        <div className="rounded-xl p-3 mb-4 text-xs" style={{ background: 'rgba(245,158,11,.06)', borderLeft: '3px solid rgba(245,158,11,.4)', color: 'var(--theme-text-muted)' }}>
          Trình duyệt không hỗ trợ nhận diện giọng nói. Transcript sẽ trống — Gemini vẫn chấm điểm từ audio.
        </div>
      )}

      {/* Recording area */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
            {recState === 'idle' ? 'Sẵn sàng ghi âm' : recState === 'recording' ? 'Đang ghi âm' : 'Đã ghi âm xong'}
          </p>
          {recState === 'recording' && (
            <CountdownRing seconds={remaining} total={MAX_RECORD_SECS} size={52} color={remaining < 20 ? '#EF4444' : ACCENT} />
          )}
        </div>

        {/* Waveform */}
        <div className="mb-4">
          <Waveform active={recState === 'recording'} />
        </div>

        {/* Live transcript */}
        {(recState === 'recording' || recState === 'done') && (
          <div className="rounded-xl p-3 mb-4 min-h-15" style={{ background: 'rgba(245,158,11,.04)', border: '1px solid rgba(245,158,11,.15)' }}>
            <p className="text-caption font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>
              {recState === 'recording' ? 'Transcript trực tiếp' : 'Transcript'}
            </p>
            <p className="text-body leading-relaxed" style={{ color: 'var(--theme-text-primary)' }}>
              {recState === 'recording' ? (liveTranscript || <span style={{ color: 'var(--theme-text-muted)', fontStyle: 'italic' }}>Đang nghe...</span>) : (finalTranscript || <span style={{ color: 'var(--theme-text-muted)', fontStyle: 'italic' }}>Không có transcript</span>)}
            </p>
          </div>
        )}

        {/* Buttons */}
        {recState === 'idle' && (
          <button onClick={startRecording}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
            style={{ background: GRADIENT, boxShadow: '0 4px 12px rgba(245,158,11,.3)' }}>
            <IconMic size={18} /> Bắt đầu ghi âm
          </button>
        )}

        {recState === 'recording' && (
          <button onClick={stopRecording}
            className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(239,68,68,.1)', color: '#EF4444', border: '2px solid rgba(239,68,68,.3)' }}>
            <IconStop size={16} /> Dừng ghi âm
          </button>
        )}

        {recState === 'done' && (
          <div className="flex gap-2">
            {canRetake && (
              <button onClick={handleRetake}
                className="flex-1 py-3 rounded-2xl font-bold text-body flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--theme-bg)', border: '2px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                <IconRefresh size={14} /> Ghi lại
              </button>
            )}
            <button onClick={handleSubmit}
              className="flex-1 py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
              style={{ background: GRADIENT, boxShadow: '0 4px 12px rgba(245,158,11,.3)' }}>
              <IconSend size={15} /> Nộp bài
            </button>
          </div>
        )}

        {recState === 'done' && (
          <div className="flex items-center gap-1.5 mt-3 justify-center">
            <IconCheck size={14} style={{ color: '#22C55E' }} />
            <p className="text-xs" style={{ color: '#22C55E' }}>
              Đã ghi âm {elapsed}s{canRetake ? ' — còn 1 lần ghi lại' : ''}
            </p>
          </div>
        )}
      </div>

      {submitError && (
        <div className="p-3 rounded-xl text-body mb-4" style={{ background: 'rgba(239,68,68,.08)', color: '#EF4444' }}>
          {submitError}
        </div>
      )}

      {/* Tips */}
      <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(245,158,11,.04)', borderLeft: '3px solid rgba(245,158,11,.3)', color: 'var(--theme-text-muted)' }}>
        Nói rõ ràng, tự nhiên bằng tiếng Đức. Không cần hoàn hảo — AI sẽ nhận xét phát âm, ngữ pháp, từ vựng và mức độ hoàn thành câu hỏi.
      </div>
    </div>
  );
}
