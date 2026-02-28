'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useExamSpeakingSession, useSubmitExamSpeaking } from '@/hooks/useExamSpeaking';
import { ExamSpeakingTeil } from '@/lib/api/examSpeaking';

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
function IconChevronRight({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="9 18 15 12 9 6" /></svg>;
}
function IconLoader({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconChevronLeft({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="15 18 9 12 15 6" /></svg>;
}

const ACCENT = '#F59E0B';
const GRADIENT = 'linear-gradient(135deg, #F59E0B, #EF4444)';

type TeilState = 'idle' | 'prep' | 'recording' | 'done';

// ─── Countdown circle ─────────────────────────────────────────────────────────
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

// ─── Waveform animation ────────────────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  const bars = [3, 5, 8, 5, 10, 7, 4, 9, 6, 4, 8, 5, 3, 7, 5];
  return (
    <div className="flex items-center justify-center gap-0.5 h-10">
      {bars.map((h, i) => (
        <div key={i}
          className={active ? 'animate-bounce' : ''}
          style={{
            width: 3,
            height: active ? h * 2 + 4 : 4,
            borderRadius: 2,
            backgroundColor: active ? ACCENT : 'var(--theme-border)',
            animationDelay: `${i * 60}ms`,
            transition: 'height 0.3s',
          }} />
      ))}
    </div>
  );
}

// ─── Blob to base64 ────────────────────────────────────────────────────────────
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(blob);
  });
}

// ─── Main recording page ──────────────────────────────────────────────────────
export default function ExamSpeakingSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isLoading } = useExamSpeakingSession(id);
  const submitMut = useSubmitExamSpeaking();

  const [currentTeilIdx, setCurrentTeilIdx] = useState(0);
  const [teilState, setTeilState] = useState<TeilState>('idle');
  const [prepCountdown, setPrepCountdown] = useState(0);
  const [recCountdown, setRecCountdown] = useState(0);

  // Per-Teil data (blob + transcript)
  const [blobMap, setBlobMap] = useState<Record<number, Blob>>({});
  const [transcriptMap, setTranscriptMap] = useState<Record<number, string>>({});
  const [liveTranscript, setLiveTranscript] = useState('');
  // Ref so timer/recorder callbacks (stale closures) always read the latest transcript
  const liveTranscriptRef = useRef('');
  const [retakeUsed, setRetakeUsed] = useState<Record<number, boolean>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobEvent['data'][]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { /* ignore */ } }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-3">
        <IconLoader size={28} style={{ color: ACCENT }} />
        <p className="text-[14px]" style={{ color: 'var(--theme-text-muted)' }}>Đang tải đề...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-3">
        <p style={{ color: 'var(--theme-text-muted)' }}>Không tìm thấy bài thi.</p>
        <Link href="/practice-test/speaking/exam" style={{ color: ACCENT }}>← Quay lại danh sách</Link>
      </div>
    );
  }

  if (session.status === 'GRADED' || session.status === 'GRADING') {
    router.replace(`/practice-test/speaking/exam/${id}/result`);
    return null;
  }

  const teile = session.teile as ExamSpeakingTeil[];
  const currentTeil = teile[currentTeilIdx];
  const isLastTeil = currentTeilIdx === teile.length - 1;
  const allDone = teile.every((_, i) => blobMap[teile[i].number] !== undefined);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const startPrep = () => {
    if (currentTeil.prepTimeSeconds <= 0) {
      startRecording();
      return;
    }
    setTeilState('prep');
    setPrepCountdown(currentTeil.prepTimeSeconds);
    prepTimerRef.current = setInterval(() => {
      setPrepCountdown(prev => {
        if (prev <= 1) {
          clearInterval(prepTimerRef.current!);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    setTeilState('recording');
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    setRecCountdown(currentTeil.speakTimeSeconds);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setBlobMap(prev => ({ ...prev, [currentTeil.number]: blob }));
        // Use ref — liveTranscript state is stale in this async callback
        setTranscriptMap(prev => ({ ...prev, [currentTeil.number]: liveTranscriptRef.current }));
      };
      recorder.start(500);

      // Web Speech API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'de-DE';
        recognition.onresult = (event: any) => {
          let final = '';
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) final += event.results[i][0].transcript + ' ';
          }
          liveTranscriptRef.current = final;
          setLiveTranscript(final);
        };
        try { recognition.start(); } catch { /* ignore */ }
        recognitionRef.current = recognition;
      }

      // Auto-stop countdown
      recTimerRef.current = setInterval(() => {
        setRecCountdown(prev => {
          if (prev <= 1) {
            clearInterval(recTimerRef.current!);
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setTeilState('idle');
      alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const stopRecording = () => {
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      // Use ref — liveTranscript may be stale when called from timer callback
      setTranscriptMap(prev => ({ ...prev, [currentTeil.number]: liveTranscriptRef.current }));
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setTeilState('done');
  };

  const retake = () => {
    setRetakeUsed(prev => ({ ...prev, [currentTeil.number]: true }));
    setBlobMap(prev => { const next = { ...prev }; delete next[currentTeil.number]; return next; });
    setTranscriptMap(prev => { const next = { ...prev }; delete next[currentTeil.number]; return next; });
    setLiveTranscript('');
    setTeilState('idle');
  };

  const nextTeil = () => {
    setTeilState('idle');
    setLiveTranscript('');
    setCurrentTeilIdx(i => i + 1);
  };

  const handleSubmit = async () => {
    try {
      const teileData: Record<string, { audioBase64: string; transcript: string; mimeType: string }> = {};
      for (const teil of teile) {
        const blob = blobMap[teil.number];
        if (!blob) continue;
        const audioBase64 = await blobToBase64(blob);
        const mimeType = blob.type || 'audio/webm';
        teileData[String(teil.number)] = {
          audioBase64,
          transcript: transcriptMap[teil.number] ?? '',
          mimeType,
        };
      }
      await submitMut.mutateAsync({ id, teileData });
      router.push(`/practice-test/speaking/exam/${id}/result`);
    } catch {
      alert('Nộp bài thất bại. Vui lòng thử lại.');
    }
  };

  // ─── Submitting screen ─────────────────────────────────────────────────────
  if (submitMut.isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 py-12">
        <IconLoader size={36} style={{ color: ACCENT }} />
        <p className="text-[16px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>AI đang chấm điểm...</p>
        <p className="text-[13px] text-center" style={{ color: 'var(--theme-text-muted)' }}>
          Gemini đang phân tích audio và transcript của bạn. Có thể mất 20–40 giây.
        </p>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/practice-test/speaking/exam"
          className="flex items-center gap-1 text-[13px] font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--theme-text-muted)' }}>
          <IconChevronLeft size={14} style={{}} /> Danh sách
        </Link>
        <div className="flex-1" />
        <span className="text-[12px] font-semibold px-2 py-1 rounded-lg"
          style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
          {session.examType} · {session.cefrLevel} · Sprechen
        </span>
      </div>

      {/* Teil progress */}
      <div className="flex gap-1.5 mb-5">
        {teile.map((t, i) => (
          <div key={t.number} className="flex-1 h-1.5 rounded-full"
            style={{
              backgroundColor: blobMap[t.number]
                ? ACCENT
                : i === currentTeilIdx
                  ? 'rgba(245,158,11,.3)'
                  : 'var(--theme-border)',
            }} />
        ))}
      </div>

      {/* Teil header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-[15px] font-extrabold shrink-0"
          style={{ background: GRADIENT }}>
          {currentTeil.number}
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
            Teil {currentTeil.number} / {teile.length}
          </p>
          <p className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {currentTeil.instruction}
          </p>
        </div>
      </div>

      {/* Vietnamese instruction */}
      {currentTeil.instructionVi && (
        <p className="text-[13px] mb-4 px-3 py-2 rounded-xl"
          style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
          {currentTeil.instructionVi}
        </p>
      )}

      {/* Word cards */}
      {currentTeil.wordCards && currentTeil.wordCards.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
            Thẻ từ
          </p>
          <div className="flex flex-wrap gap-2">
            {currentTeil.wordCards.map((card, i) => (
              <span key={i} className="px-3 py-1.5 rounded-xl text-[13px] font-semibold border"
                style={{ borderColor: 'rgba(245,158,11,.4)', backgroundColor: 'rgba(245,158,11,.06)', color: 'var(--theme-text-primary)' }}>
                {card}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Partner lines */}
      {currentTeil.partnerLines && currentTeil.partnerLines.length > 0 && (
        <div className="mb-4 rounded-xl border p-3 space-y-2"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
            Partner / Prüfer
          </p>
          {currentTeil.partnerLines.map((line, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                style={{ backgroundColor: '#8B5CF6' }}>P</span>
              <p className="text-[13px] italic" style={{ color: 'var(--theme-text-primary)', fontFamily: 'Georgia, serif' }}>
                {line}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Key points */}
      {currentTeil.keyPoints && currentTeil.keyPoints.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
            Gợi ý nội dung
          </p>
          <div className="space-y-1">
            {currentTeil.keyPoints.map((kp, i) => (
              <div key={i} className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--theme-text-secondary)' }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ACCENT }} />
                {kp}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recording area */}
      <div className="rounded-2xl border p-5 mb-5 text-center"
        style={{ borderColor: teilState === 'recording' ? 'rgba(245,158,11,.5)' : 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

        {/* IDLE */}
        {teilState === 'idle' && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              <IconMic size={28} style={{ color: 'var(--theme-text-muted)' }} />
            </div>
            <p className="text-[13px] mb-4" style={{ color: 'var(--theme-text-muted)' }}>
              {currentTeil.prepTimeSeconds > 0
                ? `Sẽ có ${currentTeil.prepTimeSeconds}s chuẩn bị trước khi ghi âm`
                : 'Nhấn để bắt đầu ghi âm ngay'}
            </p>
            <button onClick={startPrep}
              className="px-6 py-3 rounded-2xl font-bold text-[14px] text-white transition-all hover:-translate-y-0.5"
              style={{ background: GRADIENT, boxShadow: '0 4px 12px rgba(245,158,11,.3)' }}>
              {currentTeil.prepTimeSeconds > 0 ? 'Bắt đầu chuẩn bị' : 'Bắt đầu ghi âm'}
            </button>
          </>
        )}

        {/* PREP */}
        {teilState === 'prep' && (
          <>
            <p className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
              Thời gian chuẩn bị
            </p>
            <div className="flex justify-center mb-3">
              <CountdownRing seconds={prepCountdown} total={currentTeil.prepTimeSeconds} size={80} color="#6366F1" />
            </div>
            <p className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>Chuẩn bị nội dung nói...</p>
            <button onClick={() => {
              clearInterval(prepTimerRef.current!);
              startRecording();
            }} className="mt-3 px-4 py-2 rounded-xl text-[12px] font-semibold"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              Bỏ qua →
            </button>
          </>
        )}

        {/* RECORDING */}
        {teilState === 'recording' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse bg-red-500" />
                <span className="text-[12px] font-bold text-red-500">REC</span>
              </div>
              <CountdownRing seconds={recCountdown} total={currentTeil.speakTimeSeconds} size={52} color={ACCENT} />
            </div>
            <Waveform active={true} />
            {liveTranscript && (
              <div className="mt-3 p-2.5 rounded-xl text-left text-[12px] leading-relaxed"
                style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', fontFamily: 'Georgia, serif', minHeight: 40 }}>
                {liveTranscript}
                <span className="inline-block w-0.5 h-3 ml-0.5 animate-pulse" style={{ backgroundColor: ACCENT }} />
              </div>
            )}
            {!liveTranscript && (
              <p className="text-[11px] mt-2" style={{ color: 'var(--theme-text-muted)' }}>
                Bắt đầu nói...
              </p>
            )}
            <button onClick={stopRecording}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-[13px] text-white mx-auto transition-all hover:opacity-90"
              style={{ backgroundColor: '#EF4444' }}>
              <IconStop size={14} style={{}} /> Dừng lại
            </button>
          </>
        )}

        {/* DONE */}
        {teilState === 'done' && (
          <>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: 'rgba(34,197,94,.12)' }}>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <p className="text-[14px] font-bold mb-1" style={{ color: '#22C55E' }}>Đã ghi xong!</p>
            {transcriptMap[currentTeil.number] && (
              <div className="mt-2 p-2.5 rounded-xl text-left text-[12px] leading-relaxed"
                style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', fontFamily: 'Georgia, serif' }}>
                {transcriptMap[currentTeil.number]}
              </div>
            )}
            {!transcriptMap[currentTeil.number] && (
              <p className="text-[12px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                (Transcript trống — Gemini vẫn chấm từ audio)
              </p>
            )}
            <div className="flex gap-2 mt-4 justify-center">
              {!retakeUsed[currentTeil.number] && (
                <button onClick={retake}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all hover:opacity-80"
                  style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                  <IconRefresh size={13} style={{}} /> Ghi lại
                </button>
              )}
              {!isLastTeil ? (
                <button onClick={nextTeil}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: GRADIENT }}>
                  Teil {currentTeil.number + 1} <IconChevronRight size={14} style={{}} />
                </button>
              ) : allDone ? null : null}
            </div>
          </>
        )}
      </div>

      {/* Submit all */}
      {allDone && (
        <div className="rounded-2xl border p-4 mb-4"
          style={{ borderColor: 'rgba(34,197,94,.3)', backgroundColor: 'rgba(34,197,94,.04)' }}>
          <p className="text-[14px] font-bold mb-1" style={{ color: '#22C55E' }}>
            Đã ghi xong tất cả {teile.length} Teil!
          </p>
          <p className="text-[12px] mb-3" style={{ color: 'var(--theme-text-muted)' }}>
            Nhấn nộp bài để AI chấm điểm. Quá trình mất khoảng 20–40 giây.
          </p>
          <button onClick={handleSubmit}
            className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
            style={{ background: GRADIENT, boxShadow: '0 4px 12px rgba(245,158,11,.3)' }}>
            Nộp bài & Chấm điểm
          </button>
        </div>
      )}
    </div>
  );
}
