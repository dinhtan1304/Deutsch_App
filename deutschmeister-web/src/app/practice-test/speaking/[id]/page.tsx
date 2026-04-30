'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFreeSpeakingSession, useSubmitFreeSpeaking } from '@/hooks/useFreeSpeaking';
import { PageHeader, FixedActionBar } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconMic({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" /></svg>;
}
function IconRefresh({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>;
}
function IconSend({ size = 17, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
}
function IconLoader({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconCheck({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="20 6 9 17 4 12" /></svg>;
}

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) setTimeout(() => setSpeechSupported(false), 0);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    recogRef.current?.stop();
    setFinalTranscript(prev => prev || liveTranscript);
    recorderRef.current?.stop();
  }, [liveTranscript]);

  // Auto-stop at max duration
  useEffect(() => {
    if (recState === 'recording' && elapsed >= MAX_RECORD_SECS) {
      setTimeout(() => stopRecording(), 0);
    }
  }, [elapsed, recState, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      recogRef.current?.stop();
    };
  }, []);

  // Redirect if already graded
  useEffect(() => {
    if (session?.status === 'GRADED' || session?.status === 'GRADING') {
      router.push(`/practice-test/speaking/${id}/result`);
    }
  }, [session?.status, id, router]);

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

    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const recognition = new SR();
      recogRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'de-DE';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      try { recognition.start(); } catch { /* ignore */ }
    }
  }, []);

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
      <IconLoader size={28} style={{ color: ACCENT.xp }} />
      <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>Đang tải bài nói...</p>
    </div>
  );

  if (error || !session) return (
    <div className="py-16 text-center">
      <p style={{ color: STATUS.danger }}>Không tìm thấy bài nói.</p>
      <Link href="/practice-test/speaking" className="text-body mt-3 inline-block" style={{ color: ACCENT.xp }}>← Danh sách</Link>
    </div>
  );

  if (session?.status === 'GRADED' || session?.status === 'GRADING') return null;

  const remaining = MAX_RECORD_SECS - elapsed;

  if (submitMut.isPending) {
    return (
      <div className="py-16 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${ACCENT.xp}1F` }}>
          <IconLoader size={28} style={{ color: ACCENT.xp }} />
        </div>
        <div className="text-center">
          <p className="font-bold text-[15px]" style={{ color: 'var(--theme-text-primary)' }}>AI đang chấm điểm...</p>
          <p className="text-body mt-1" style={{ color: 'var(--theme-text-muted)' }}>Gemini phân tích audio + transcript. Khoảng 15–30 giây.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 pb-28">
      <PageHeader
        backHref="/practice-test/speaking"
        title="Luyện Nói Tự Do"
        accent="speaking"
        right={
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white"
            style={{ backgroundColor: ACCENT.xp }}>{session.cefrLevel}</span>
        }
      />

      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-h2 font-black tracking-tight mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            {session.topicType.replace(/_/g, ' ')}
          </h1>
          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--theme-text-muted)' }}>
             <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 uppercase tracking-widest text-[10px]">{session.topicType}</span>
             <span className="opacity-40">·</span>
             <span>Sprechen · AI-Assisted Practice</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        <div className="lg:w-1/2 shrink-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-1 space-y-6">
          <div className="rounded-3xl border p-6" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <div className="flex items-center gap-2 mb-4">
               <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white" style={{ background: GRADIENT.speaking }}>?</span>
               <h3 className="text-body font-black uppercase tracking-widest" style={{ color: 'var(--theme-text-primary)' }}>Câu hỏi / Prompt</h3>
            </div>
            <p className="text-lg font-bold leading-relaxed mb-4" style={{ color: 'var(--theme-text-primary)' }}>
              {session.prompt}
            </p>
            <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 italic text-[15px]" style={{ color: 'var(--theme-text-secondary)' }}>
              {session.promptVi}
            </div>
          </div>

          {session.keyPoints?.length > 0 && (
            <div className="rounded-3xl border p-6" style={{ borderColor: `${ACCENT.xp}33`, backgroundColor: `${ACCENT.xp}0D` }}>
              <div className="flex items-center gap-2 mb-4">
                 <h3 className="text-body font-black uppercase tracking-widest" style={{ color: ACCENT.xp }}>Gợi ý nên đề cập</h3>
              </div>
              <ul className="space-y-3">
                {session.keyPoints.map((pt: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-[14px] font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
                    <span className="mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black"
                      style={{ backgroundColor: `${ACCENT.xp}33`, color: ACCENT.xp }}>{i + 1}</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-3xl border p-5 flex gap-3" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
             <div className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center shrink-0">💡</div>
             <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
               Nói rõ ràng, tự nhiên bằng tiếng Đức. AI sẽ nhận xét phát âm, ngữ pháp, từ vựng và mức độ hoàn thành câu hỏi.
             </p>
          </div>
        </div>

        <div className="lg:w-1/2 min-w-0 space-y-6">
          <div className="rounded-3xl border p-8 text-center relative overflow-hidden"
            style={{
              borderColor: recState === 'recording' ? ACCENT.xp : 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-card)',
              boxShadow: recState === 'recording' ? `0 20px 40px ${ACCENT.xp}26` : 'none'
            }}>

            {recState === 'recording' && (
              <div className="absolute top-4 right-4">
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 font-black text-[10px] uppercase tracking-widest animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-red-500" /> REC
                 </div>
              </div>
            )}

            <div className="mb-8">
              <p className="text-xs font-black uppercase tracking-widest mb-6" style={{ color: 'var(--theme-text-muted)' }}>
                {recState === 'idle' ? 'Sẵn sàng ghi âm' : recState === 'recording' ? 'Đang ghi âm...' : 'Đã ghi âm xong'}
              </p>

              <div className="flex justify-center mb-8 scale-150 transform">
                {recState === 'recording' ? (
                  <CountdownRing seconds={remaining} total={MAX_RECORD_SECS} size={64} color={remaining < 20 ? STATUS.danger : ACCENT.xp} />
                ) : (
                  <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center" style={{ borderColor: 'var(--theme-border)' }}>
                     <IconMic size={24} style={{ color: 'var(--theme-text-muted)' }} />
                  </div>
                )}
              </div>

              <div className="h-12 flex items-center justify-center">
                 <Waveform active={recState === 'recording'} />
              </div>
            </div>

            {(recState === 'recording' || recState === 'done') && (
              <div className="text-left mt-8 pt-8 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-40">
                  {recState === 'recording' ? 'Transcript trực tiếp' : 'Transcript nội dung'}
                </p>
                <div className="p-5 rounded-2xl min-h-[120px] transition-all"
                  style={{
                    backgroundColor: 'var(--theme-bg-secondary)',
                    border: '1px solid var(--theme-border)',
                    boxShadow: recState === 'recording' ? 'inset 0 2px 8px rgba(0,0,0,0.02)' : 'none'
                  }}>
                  <p className="text-[15px] font-medium leading-relaxed italic" style={{ color: 'var(--theme-text-primary)' }}>
                    {recState === 'recording' ? (liveTranscript || <span className="opacity-30">Đang nghe giọng nói của bạn...</span>) : (finalTranscript || <span className="opacity-30">Không có dữ liệu văn bản</span>)}
                  </p>
                </div>
              </div>
            )}

            {recState === 'done' && (
              <div className="flex items-center gap-2 mt-6 justify-center">
                <div className="px-4 py-2 rounded-2xl bg-green-500/10 text-green-600 text-xs font-black flex items-center gap-2 border border-green-500/20">
                   <IconCheck size={14} /> Đã ghi âm {elapsed} giây
                </div>
              </div>
            )}
          </div>

          {!speechSupported && (
            <div className="rounded-2xl p-4 bg-orange-500/5 border border-orange-500/10 flex gap-3 items-center">
               <span className="text-lg">⚠️</span>
               <p className="text-[11px] font-medium leading-snug" style={{ color: 'var(--theme-text-secondary)' }}>
                 Trình duyệt không hỗ trợ nhận diện giọng nói. Transcript sẽ trống, nhưng AI vẫn sẽ chấm điểm trực tiếp từ audio của bạn.
               </p>
            </div>
          )}
        </div>
      </div>

      <FixedActionBar columns={recState === 'done' ? 2 : 1}>
        {recState === 'idle' && (
          <button onClick={startRecording}
            className="w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-2xl"
            style={{ background: GRADIENT.speaking, boxShadow: `0 12px 32px ${ACCENT.xp}4D` }}>
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
               <IconMic size={14} />
            </div>
            BẮT ĐẦU GHI ÂM
          </button>
        )}

        {recState === 'recording' && (
          <button onClick={stopRecording}
            className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.02] bg-red-500/10 border-2 border-red-500/30"
            style={{ color: STATUS.danger }}>
            <div className="w-3 h-3 rounded-sm bg-red-500 animate-pulse" />
            DỪNG GHI ÂM ({elapsed}s)
          </button>
        )}

        {recState === 'done' && (
          <>
            {canRetake ? (
              <button onClick={handleRetake}
                className="py-4 px-8 rounded-2xl font-black text-sm border-2 transition-all hover:bg-black/5 flex items-center justify-center gap-2"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                <IconRefresh size={16} /> Ghi lại
              </button>
            ) : <div />}
            <button onClick={handleSubmit}
              className="flex-1 py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-2xl"
              style={{ background: GRADIENT.speaking, boxShadow: `0 12px 32px ${ACCENT.xp}4D` }}>
              <IconSend size={18} /> NỘP BÀI & CHẤM ĐIỂM
            </button>
          </>
        )}
      </FixedActionBar>

      {submitError && (
        <p className="fixed bottom-24 left-1/2 -translate-x-1/2 text-xs font-bold text-red-500 bg-red-50 px-4 py-2 rounded-full border border-red-100 shadow-sm z-50">
          {submitError}
        </p>
      )}
    </div>
  );
}
