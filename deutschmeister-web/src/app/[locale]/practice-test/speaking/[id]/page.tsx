'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useFreeSpeakingSession, useSubmitFreeSpeaking } from '@/hooks/useFreeSpeaking';
import { PageHeader, FixedActionBar } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { RedemittelPanel } from '../../_components/TeilStrategyPanel';

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
            backgroundColor: ACCENT.speaking,
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
    r.onload = () => res((r.result as string).split(',')[1]!);
    r.readAsDataURL(blob);
  });
}

export default function FreeSpeakingSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('practice.speaking.answering');

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

  useEffect(() => {
    if (recState === 'recording' && elapsed >= MAX_RECORD_SECS) {
      setTimeout(() => stopRecording(), 0);
    }
  }, [elapsed, recState, stopRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      recogRef.current?.stop();
    };
  }, []);

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
      setSubmitError(t('micError'));
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
  }, [t]);

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
      setSubmitError(t('submitError'));
    }
  }, [id, finalTranscript, submitMut, router, t]);

  if (isLoading) return (
    <div className="py-16 flex flex-col items-center gap-3">
      <IconLoader size={28} style={{ color: ACCENT.speaking }} />
      <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>{t('loading')}</p>
    </div>
  );

  if (error || !session) return (
    <div className="py-16 text-center">
      <p style={{ color: STATUS.danger }}>{t('notFound')}</p>
      <Link href="/practice-test/speaking" className="text-body mt-3 inline-block" style={{ color: ACCENT.speaking }}>{t('backToList')}</Link>
    </div>
  );

  if (session?.status === 'GRADED' || session?.status === 'GRADING') return null;

  const remaining = MAX_RECORD_SECS - elapsed;

  if (submitMut.isPending) {
    return (
      <div className="py-24 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden"
             style={{ background: GRADIENT.speaking }}>
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
          <IconLoader size={32} style={{ color: 'white' }} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black mb-2" style={{ color: 'var(--theme-text-primary)' }}>{t('grading')}</h2>
          <p className="text-sm opacity-60 max-w-xs mx-auto" style={{ color: 'var(--theme-text-primary)' }}>{t('gradingSubtitle')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-360 mx-auto px-4 py-6 pb-32">
      <PageHeader
        backHref="/practice-test/speaking"
        title={t('title')}
        subtitle={session.topicType.replace(/_/g, ' ')}
        accent="speaking"
        right={
          <span className="px-3 py-1 rounded-xl text-xs font-black text-white shadow-lg"
            style={{ backgroundColor: ACCENT.speaking }}>{session.cefrLevel}</span>
        }
      />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Side: Prompt & Suggestions */}
        <div className="lg:w-1/2 shrink-0 lg:sticky lg:top-20 lg:self-start space-y-6">
          <div className="rounded-3xl border p-8 shadow-xl relative overflow-hidden"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 opacity-[0.03] blur-3xl -mr-16 -mt-16" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ background: GRADIENT.speaking }}>
                   <span className="text-lg font-black">?</span>
                 </div>
                 <h3 className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--theme-text-primary)' }}>{t('promptHeader')}</h3>
              </div>
              <p className="text-xl font-black leading-relaxed mb-6" style={{ color: 'var(--theme-text-primary)' }}>
                {session.prompt}
              </p>
              <div className="p-5 rounded-2xl border bg-rose-500/5 italic text-[15px] leading-relaxed" 
                   style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                {session.promptVi}
              </div>
            </div>
          </div>

          {session.keyPoints?.length > 0 && (
            <div className="rounded-3xl border p-8 shadow-lg relative overflow-hidden" 
                 style={{ borderColor: `${ACCENT.speaking}22`, backgroundColor: `${ACCENT.speaking}08` }}>
              <h3 className="text-xs font-black uppercase tracking-widest mb-6" style={{ color: ACCENT.speaking }}>{t('suggestionsHeader')}</h3>
              <ul className="space-y-4">
                {session.keyPoints.map((pt: string, i: number) => (
                  <li key={i} className="flex items-start gap-4 text-[15px] font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>
                    <span className="mt-0.5 w-6 h-6 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-black shadow-sm"
                      style={{ backgroundColor: `${ACCENT.speaking}1A`, color: ACCENT.speaking, border: `1px solid ${ACCENT.speaking}33` }}>{i + 1}</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Redemittel lookup — curated for B1 exam speaking */}
          {session.cefrLevel === 'B1' && <RedemittelPanel skill="speaking" />}
        </div>

        {/* Right Side: Recorder */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          <div className="rounded-3xl border p-8 text-center relative overflow-hidden transition-all duration-500"
            style={{
              borderColor: recState === 'recording' ? ACCENT.speaking : 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-card)',
              boxShadow: recState === 'recording' ? `0 20px 50px ${ACCENT.speaking}26` : '0 10px 30px rgba(0,0,0,0.05)'
            }}>

            {recState === 'recording' && (
              <div className="absolute top-6 right-6">
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 font-black text-[10px] uppercase tracking-widest animate-pulse border border-red-500/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> {t('rec')}
                 </div>
              </div>
            )}

            <div className="mb-10">
              <p className="text-xs font-black uppercase tracking-widest mb-8 opacity-40" style={{ color: 'var(--theme-text-primary)' }}>
                {recState === 'idle' ? t('recordReady') : recState === 'recording' ? t('recordListening') : t('recordDone')}
              </p>

              <div className="flex justify-center mb-10 scale-125">
                {recState === 'recording' ? (
                  <CountdownRing seconds={remaining} total={MAX_RECORD_SECS} size={72} color={remaining < 20 ? STATUS.danger : ACCENT.speaking} />
                ) : (
                  <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center shadow-inner" style={{ borderColor: 'var(--theme-border)' }}>
                     <IconMic size={32} style={{ color: 'var(--theme-text-muted)' }} />
                  </div>
                )}
              </div>

              <div className="h-12 flex items-center justify-center">
                 <Waveform active={recState === 'recording'} />
              </div>
            </div>

            {(recState === 'recording' || recState === 'done') && (
              <div className="text-left mt-10 pt-10 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
                    {recState === 'recording' ? t('transcriptLive') : t('transcriptDone')}
                  </p>
                  {recState === 'done' && (
                    <span className="text-[10px] font-black text-emerald-500 uppercase">{t('transcriptCompleted')}</span>
                  )}
                </div>
                <div className="p-6 rounded-2xl min-h-[140px] transition-all relative overflow-hidden"
                  style={{
                    backgroundColor: 'var(--theme-bg-secondary)',
                    border: '1px solid var(--theme-border)',
                  }}>
                  <p className="text-lg font-semibold leading-relaxed italic" style={{ color: 'var(--theme-text-primary)' }}>
                    {recState === 'recording' ? (liveTranscript || <span className="opacity-20">{t('transcriptPromptSay')}</span>) : (finalTranscript || <span className="opacity-20 text-sm font-normal">{t('transcriptEmpty')}</span>)}
                  </p>
                </div>
              </div>
            )}

            {recState === 'done' && (
              <div className="flex items-center gap-3 mt-8 justify-center">
                <div className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-black flex items-center gap-2 border border-emerald-500/20 shadow-sm">
                   <IconCheck size={16} /> {t('recordedOk', { seconds: elapsed })}
                </div>
              </div>
            )}
          </div>

          {!speechSupported && (
            <div className="rounded-2xl p-5 bg-orange-500/5 border border-orange-500/20 flex gap-4 items-center shadow-sm">
               <span className="text-2xl">⚠️</span>
               <p className="text-[12px] font-semibold leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                 {t('noSpeechWarn')}
               </p>
            </div>
          )}
        </div>
      </div>

      <FixedActionBar columns={recState === 'done' ? 2 : 1}>
        {recState === 'idle' && (
          <button onClick={startRecording}
            className="w-full py-4.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl"
            style={{ background: GRADIENT.speaking, boxShadow: `0 15px 35px ${ACCENT.speaking}4D` }}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
               <IconMic size={18} />
            </div>
            {t('startRecord')}
          </button>
        )}

        {recState === 'recording' && (
          <button onClick={stopRecording}
            className="w-full py-4.5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 bg-rose-500/10 border-2 border-rose-500/30 group"
            style={{ color: STATUS.danger }}>
            <div className="w-3.5 h-3.5 rounded-sm bg-rose-500 animate-pulse group-hover:scale-110" />
            {t('stopRecord', { seconds: elapsed })}
          </button>
        )}

        {recState === 'done' && (
          <>
            {canRetake ? (
              <button onClick={handleRetake}
                className="py-4.5 px-10 rounded-2xl font-black text-sm border-2 transition-all hover:bg-black/5 flex items-center justify-center gap-3"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', backgroundColor: 'var(--theme-bg-card)' }}>
                <IconRefresh size={18} /> {t('retake')}
              </button>
            ) : <div />}
            <button onClick={handleSubmit}
              className="flex-1 py-4.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl"
              style={{ background: GRADIENT.speaking, boxShadow: `0 15px 35px ${ACCENT.speaking}4D` }}>
              <IconSend size={18} /> {t('submit')}
            </button>
          </>
        )}
      </FixedActionBar>

      {submitError && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
          <p className="text-xs font-black text-white bg-rose-500 px-6 py-2.5 rounded-full shadow-2xl border border-white/20">
            {submitError}
          </p>
        </div>
      )}
    </div>
  );
}
