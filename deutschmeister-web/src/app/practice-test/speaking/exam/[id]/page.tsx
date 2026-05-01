'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useExamSpeakingSession, useSubmitExamSpeaking } from '@/hooks/useExamSpeaking';
import { ExamSpeakingTeil } from '@/lib/api/examSpeaking';
import { PageHeader, FixedActionBar } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconMic({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" /></svg>;
}
function IconStop({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block', ...style }}><rect x="4" y="4" width="16" height="16" rx="2" /></svg>;
}
function IconChevronRight({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="9 18 15 12 9 6" /></svg>;
}
function IconLoader({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconCheck({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="20 6 9 17 4 12" /></svg>;
}
function IconSend({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;
}

type TeilState = 'idle' | 'prep' | 'recording' | 'done';

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

// ─── Waveform animation ────────────────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  const bars = [3, 5, 8, 5, 10, 7, 4, 9, 6, 4, 8, 5, 3, 7, 5];
  return (
    <div className="flex items-center justify-center gap-0.5 h-10">
      {bars.map((h, i) => (
        <div key={i}
          style={{
            width: 3, borderRadius: 2,
            backgroundColor: ACCENT.xp,
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

// ─── Blob to base64 ────────────────────────────────────────────────────────────
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]!);
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

  const [blobMap, setBlobMap] = useState<Record<number, Blob>>({});
  const [transcriptMap, setTranscriptMap] = useState<Record<number, string>>({});
  const [liveTranscript, setLiveTranscript] = useState('');
  const liveTranscriptRef = useRef('');
  const [retakeUsed, setRetakeUsed] = useState<Record<number, boolean>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobEvent['data'][]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <IconLoader size={32} style={{ color: ACCENT.xp }} />
          <p style={{ color: 'var(--theme-text-muted)' }}>Đang tải bài thi...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-6 text-center">
        <p className="mb-4" style={{ color: 'var(--theme-text-muted)' }}>Không tìm thấy bài thi.</p>
        <Link href="/practice-test/speaking/exam" className="text-sm font-semibold" style={{ color: ACCENT.xp }}>Quay lại</Link>
      </div>
    );
  }

  if (session.status === 'GRADED' || session.status === 'GRADING') {
    router.replace(`/practice-test/speaking/exam/${id}/result`);
    return null;
  }

  const teile = session.teile as ExamSpeakingTeil[];
  const currentTeil = teile[currentTeilIdx]!;
  const isLastTeil = currentTeilIdx === teile.length - 1;
  const allDone = teile.every((_, i) => blobMap[teile[i]!.number] !== undefined);

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
        setTranscriptMap(prev => ({ ...prev, [currentTeil.number]: liveTranscriptRef.current }));
      };
      recorder.start(500);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'de-DE';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  if (submitMut.isPending) {
    return (
      <div className="py-16 flex flex-col items-center gap-4 text-center">
        <IconLoader size={36} style={{ color: ACCENT.xp }} />
        <p className="font-bold text-lg" style={{ color: 'var(--theme-text-primary)' }}>AI đang chấm điểm...</p>
        <p className="text-body max-w-sm" style={{ color: 'var(--theme-text-muted)' }}>
          Gemini đang phân tích audio và transcript của bạn. Có thể mất 20–40 giây.
        </p>
      </div>
    );
  }

  return (
    <div className="py-6 pb-28">
      <PageHeader
        backHref="/practice-test/speaking/exam"
        title="Luyện Nói Theo Đề"
        accent="speaking"
        right={
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white"
            style={{ backgroundColor: ACCENT.xp }}>{session.cefrLevel}</span>
        }
      />

      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-h2 font-black tracking-tight mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            {session.examType} {session.cefrLevel} · Speaking
          </h1>
          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--theme-text-muted)' }}>
             <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 uppercase tracking-widest text-[10px]">{session.examType}</span>
             <span className="opacity-40">·</span>
             <span>Sprechen · Exam Practice</span>
          </div>
        </div>
      </div>

      {/* Teil Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1 no-scrollbar">
        {teile.map((t, i) => {
          const isDone = blobMap[t.number] !== undefined;
          const isCurrent = i === currentTeilIdx;
          return (
            <button key={t.number} onClick={() => setCurrentTeilIdx(i)}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all border uppercase tracking-widest"
              style={isCurrent
                ? { background: GRADIENT.speaking, color: 'white', borderColor: 'transparent', boxShadow: `0 8px 16px ${ACCENT.xp}40` }
                : isDone
                  ? { backgroundColor: `${STATUS.success}14`, color: STATUS.success, borderColor: `${STATUS.success}33` }
                  : { backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)' }}>
              <span>Teil {t.number}</span>
              {isDone && <IconCheck size={10} />}
            </button>
          );
        })}
      </div>

      {/* Split Layout */}
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Left Side: Instruction & Prompt (Sticky) */}
        <div className="lg:w-1/2 shrink-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-1 space-y-6">
          <div className="rounded-3xl border p-6" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <div className="flex items-center gap-2 mb-4">
               <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white" style={{ background: GRADIENT.speaking }}>{currentTeil.number}</span>
               <h3 className="text-body font-black uppercase tracking-widest" style={{ color: 'var(--theme-text-primary)' }}>Anweisung / Hướng dẫn</h3>
            </div>
            <p className="text-[15px] font-bold leading-relaxed mb-2" style={{ color: 'var(--theme-text-primary)' }}>
              {currentTeil.instruction}
            </p>
            {currentTeil.instructionVi && (
              <p className="text-xs italic leading-relaxed opacity-60" style={{ color: 'var(--theme-text-primary)' }}>
                {currentTeil.instructionVi}
              </p>
            )}
          </div>

          {currentTeil.wordCards && currentTeil.wordCards.length > 0 && (
            <div className="rounded-3xl border p-6" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
              <p className="text-caption font-bold uppercase tracking-wider mb-4 opacity-40">Thẻ từ gợi ý</p>
              <div className="flex flex-wrap gap-2">
                {currentTeil.wordCards.map((card, i) => (
                  <span key={i} className="px-4 py-2 rounded-xl text-body font-bold border-2"
                    style={{ borderColor: `${ACCENT.xp}4D`, backgroundColor: `${ACCENT.xp}0D`, color: ACCENT.xp }}>
                    {card}
                  </span>
                ))}
              </div>
            </div>
          )}

          {currentTeil.partnerLines && currentTeil.partnerLines.length > 0 && (
            <div className="rounded-3xl border p-6" style={{ borderColor: 'var(--theme-border)', backgroundColor: `${ACCENT.vocab}08` }}>
              <p className="text-caption font-bold uppercase tracking-wider mb-4 opacity-40">Partner / Prüfer</p>
              <div className="space-y-4">
                {currentTeil.partnerLines.map((line, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-lg bg-purple-500 flex items-center justify-center shrink-0 text-[10px] font-black text-white">P</div>
                    <p className="text-[15px] italic leading-relaxed" style={{ color: 'var(--theme-text-primary)', fontFamily: 'Georgia, serif' }}>{line}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Recording Workspace */}
        <div className="lg:w-1/2 min-w-0 space-y-6">
          <div className="rounded-3xl border p-8 text-center relative overflow-hidden"
            style={{
              borderColor: teilState === 'recording' ? ACCENT.xp : 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-card)',
              boxShadow: teilState === 'recording' ? `0 20px 40px ${ACCENT.xp}26` : 'none'
            }}>

            {teilState === 'recording' && (
              <div className="absolute top-4 right-4">
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 font-black text-[10px] uppercase tracking-widest animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-red-500" /> REC
                 </div>
              </div>
            )}

            <div className="mb-8">
              <p className="text-xs font-black uppercase tracking-widest mb-6" style={{ color: 'var(--theme-text-muted)' }}>
                {teilState === 'idle' ? 'Sẵn sàng' : teilState === 'prep' ? 'Đang chuẩn bị...' : teilState === 'recording' ? 'Đang ghi âm...' : 'Đã xong'}
              </p>

              <div className="flex justify-center mb-8 scale-150 transform">
                {teilState === 'prep' ? (
                  <CountdownRing seconds={prepCountdown} total={currentTeil.prepTimeSeconds} size={64} color={ACCENT.writing} />
                ) : teilState === 'recording' ? (
                  <CountdownRing seconds={recCountdown} total={currentTeil.speakTimeSeconds} size={64} color={ACCENT.xp} />
                ) : (
                  <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center" style={{ borderColor: 'var(--theme-border)' }}>
                     <IconMic size={24} style={{ color: 'var(--theme-text-muted)' }} />
                  </div>
                )}
              </div>

              <div className="h-12 flex items-center justify-center">
                 <Waveform active={teilState === 'recording'} />
              </div>
            </div>

            {(teilState === 'recording' || teilState === 'done') && (
              <div className="text-left mt-8 pt-8 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-40">Transcript</p>
                <div className="p-5 rounded-2xl min-h-30 transition-all"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
                  <p className="text-[15px] font-medium leading-relaxed italic" style={{ color: 'var(--theme-text-primary)' }}>
                    {teilState === 'recording' ? (liveTranscript || <span className="opacity-30">Đang nghe...</span>) : (transcriptMap[currentTeil.number] || <span className="opacity-30">Không có dữ liệu</span>)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Bottom Bar */}
      <FixedActionBar columns={teilState === 'done' ? (isLastTeil && allDone ? 2 : 1) : 1}>
        {teilState === 'idle' && (
          <button onClick={startPrep}
            className="w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-2xl"
            style={{ background: GRADIENT.speaking }}>
            {currentTeil.prepTimeSeconds > 0 ? 'BẮT ĐẦU CHUẨN BỊ' : 'BẮT ĐẦU GHI ÂM'}
          </button>
        )}

        {teilState === 'prep' && (
          <button onClick={() => { clearInterval(prepTimerRef.current!); startRecording(); }}
            className="w-full py-4 rounded-2xl font-black text-sm bg-black/5 border-2 border-black/10 transition-all hover:bg-black/10">
            BỎ QUA CHUẨN BỊ →
          </button>
        )}

        {teilState === 'recording' && (
          <button onClick={stopRecording}
            className="w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-3 shadow-xl"
            style={{ backgroundColor: STATUS.danger }}>
            <IconStop size={18} /> DỪNG GHI ÂM
          </button>
        )}

        {teilState === 'done' && (
          <div className="flex gap-4 w-full">
            {!retakeUsed[currentTeil.number] && (
              <button onClick={retake}
                className="px-8 py-4 rounded-2xl font-black text-sm border-2 transition-all hover:bg-orange-500/5"
                style={{ borderColor: `${ACCENT.xp}4D`, color: ACCENT.xp }}>
                GHI LẠI
            </button>
            )}
            {!isLastTeil ? (
              <button onClick={nextTeil}
                className="flex-1 py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2"
                style={{ background: GRADIENT.speaking }}>
                TIẾP THEO: TEIL {currentTeil.number + 1} <IconChevronRight size={18} />
              </button>
            ) : allDone && (
              <button onClick={handleSubmit}
                className="flex-1 py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-2xl"
                style={{ background: GRADIENT.speaking, boxShadow: `0 12px 32px ${ACCENT.xp}66` }}>
                <IconSend size={18} /> NỘP BÀI THI
              </button>
            )}
          </div>
        )}
      </FixedActionBar>
    </div>
  );
}
