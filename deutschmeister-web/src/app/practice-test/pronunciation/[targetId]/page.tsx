'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePronunciationTargets, useScorePronunciation } from '@/hooks/usePronunciationScoring';
import type { WordScore } from '@/lib/api/pronunciation';
import { PageHeader, FixedActionBar } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

const MAX_RECORD_SECS = 30;

function getWordColor(score: number) {
  if (score >= 80) return STATUS.success;
  if (score >= 50) return STATUS.warning;
  return STATUS.danger;
}

function getScoreColor(score: number) {
  if (score >= 80) return STATUS.success;
  if (score >= 60) return STATUS.warning;
  if (score >= 40) return ACCENT.games;
  return STATUS.danger;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconMic({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" /></svg>;
}
function IconStop({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}><rect x="4" y="4" width="16" height="16" rx="2" /></svg>;
}
function IconChevronRight({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="9 18 15 12 9 6" /></svg>;
}
function IconLoader({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
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

  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Declare stopRecording before effects that reference it
  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    recorderRef.current?.stop();
  }, []);

  useEffect(() => {
    if (recState === 'recording' && elapsed >= MAX_RECORD_SECS) {
      stopRecording();
    }
  }, [elapsed, recState, stopRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    setRecState('recording');
    setElapsed(0);
    setError('');
    setResult(null);
    chunksRef.current = [];
    blobRef.current = null;
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setAudioUrl(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        blobRef.current = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blobRef.current);
        audioUrlRef.current = url;
        setAudioUrl(url);
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

  const handleScore = async () => {
    if (!blobRef.current || !target) return;
    setRecState('scoring');
    setError('');
    try {
      const buf = await blobRef.current.arrayBuffer();
      const base64 = btoa(new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ''));
      const res = await scoreMut.mutateAsync({
        targetId: target.id,
        targetText: target.text,
        level: target.level,
        audioBase64: base64,
        mimeType: 'audio/webm',
      });
      setResult(res);
      setRecState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chấm điểm thất bại');
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
      const next = allTargets[currentIndex + 1]!;
      router.push(`/practice-test/pronunciation/${next.id}`);
      setResult(null);
      setRecState('idle');
      setElapsed(0);
    }
  };

  if (!target) return null;

  return (
    <div className="py-6 pb-28">
      <PageHeader
        backHref="/practice-test/pronunciation"
        title="Luyện Phát Âm"
        accent="xp"
        right={
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white"
            style={{ backgroundColor: ACCENT.listening }}>{target.level}</span>
        }
      />

      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-h2 font-black tracking-tight mb-1" style={{ color: 'var(--theme-text-primary)' }}>
             {target.category}
          </h1>
          <p className="text-xs font-bold" style={{ color: 'var(--theme-text-muted)' }}>Aussprache · AI Analysis</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Left Side: Target Text (Sticky) */}
        <div className="lg:w-1/2 shrink-0 lg:sticky lg:top-20 lg:self-start space-y-6">
           <div className="rounded-3xl border p-8 text-center" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
              <p className="text-caption font-black uppercase tracking-widest mb-4 opacity-40">Nói câu này:</p>
              <h2 className="text-2xl md:text-3xl font-black mb-4 leading-tight" style={{ color: 'var(--theme-text-primary)' }}>
                {target.text}
              </h2>
              <div className="p-4 rounded-2xl italic text-[15px]"
                style={{ backgroundColor: `${ACCENT.listening}0D`, border: `1px solid ${ACCENT.listening}1A`, color: 'var(--theme-text-secondary)' }}>
                {target.translationVi}
              </div>
           </div>

           {/* Results Area */}
           {result && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="rounded-3xl border p-6 flex items-center justify-between" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                   <div>
                      <p className="text-caption font-black uppercase tracking-widest mb-1 opacity-40">Điểm tổng quát</p>
                      <p className="text-4xl font-black" style={{ color: getScoreColor(result.overallScore) }}>
                        {result.overallScore}<span className="text-lg opacity-40">/100</span>
                      </p>
                   </div>
                   <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${getScoreColor(result.overallScore)}1A`, color: getScoreColor(result.overallScore) }}>
                      <span className="text-2xl">{result.overallScore >= 80 ? '🌟' : result.overallScore >= 50 ? '👍' : '💪'}</span>
                   </div>
                </div>

                <div className="rounded-3xl border p-6" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                  <p className="text-caption font-black uppercase tracking-widest mb-4 opacity-40">Phân tích từng từ</p>
                  <div className="flex flex-wrap gap-2.5">
                    {result.wordScores.map((ws, i) => (
                      <div key={i} className="relative group">
                         <div className="px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all cursor-help"
                           style={{
                             borderColor: `${getWordColor(ws.score)}30`,
                             backgroundColor: `${getWordColor(ws.score)}0D`,
                             color: getWordColor(ws.score)
                           }}>
                           {ws.word}
                           <span className="ml-1.5 opacity-50 text-[10px]">{ws.score}</span>
                         </div>
                         {ws.issue && (
                           <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 rounded-2xl text-[11px] font-medium leading-relaxed shadow-xl border opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>
                             {ws.issue}
                           </div>
                         )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
           )}
        </div>

        {/* Right Side: Recording Area */}
        <div className="lg:w-1/2 min-w-0 space-y-6">
           <div className="rounded-3xl border p-8 text-center relative overflow-hidden"
            style={{
              borderColor: recState === 'recording' ? ACCENT.listening : 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-card)',
              boxShadow: recState === 'recording' ? `0 20px 40px ${ACCENT.listening}1A` : 'none'
            }}>

              <div className="mb-8">
                 <p className="text-xs font-black uppercase tracking-widest mb-8 opacity-40">
                   {recState === 'idle' ? 'Sẵn sàng ghi âm' : recState === 'recording' ? 'Đang lắng nghe...' : 'Đã ghi âm'}
                 </p>

                 <div className="flex justify-center mb-8">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${recState === 'recording' ? 'scale-110' : ''}`}
                      style={{ background: recState === 'recording' ? GRADIENT.pronunciation : 'var(--theme-bg-secondary)', color: recState === 'recording' ? 'white' : 'var(--theme-text-muted)' }}>
                       <IconMic size={32} />
                    </div>
                 </div>

                 {recState === 'recording' && (
                    <div className="text-2xl font-black mb-6" style={{ color: ACCENT.listening }}>
                       {elapsed}s
                    </div>
                 )}

                 {recState === 'done' && audioUrl && (
                    <div className="px-6">
                       <audio src={audioUrl} controls className="w-full h-10 rounded-full" />
                    </div>
                 )}
              </div>

              {result?.suggestions && result.suggestions.length > 0 && (
                <div className="text-left pt-6 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                   <p className="text-caption font-black uppercase tracking-widest mb-4 opacity-40">Gợi ý cải thiện</p>
                   <ul className="space-y-3">
                     {result.suggestions.map((s, i) => (
                       <li key={i} className="flex gap-3 text-[13px] font-medium leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                          <span className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 text-[10px]"
                            style={{ backgroundColor: `${ACCENT.listening}1A`, color: ACCENT.listening }}>💡</span>
                          {s}
                       </li>
                     ))}
                   </ul>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Fixed Action Bar */}
      <FixedActionBar columns={recState === 'done' ? (result ? 2 : 2) : 1}>
        {recState === 'idle' && (
          <button onClick={startRecording}
            className="w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-2xl"
            style={{ background: GRADIENT.pronunciation, boxShadow: `0 12px 32px ${ACCENT.listening}4D` }}>
            <IconMic size={18} /> BẮT ĐẦU GHI ÂM
          </button>
        )}

        {recState === 'recording' && (
          <button onClick={stopRecording}
            className="w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-3"
            style={{ backgroundColor: STATUS.danger }}>
            <IconStop size={18} /> DỪNG GHI ÂM
          </button>
        )}

        {recState === 'done' && !result && (
          <>
            <button onClick={handleRetry}
              className="py-4 px-8 rounded-2xl font-black text-sm border-2 transition-all hover:bg-black/5"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
              GHI LẠI
            </button>
            <button onClick={handleScore}
              className="flex-1 py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2"
              style={{ background: GRADIENT.pronunciation }}>
              CHẤM ĐIỂM
            </button>
          </>
        )}

        {result && (
          <>
            <button onClick={handleRetry}
              className="py-4 px-8 rounded-2xl font-black text-sm border-2 transition-all hover:bg-black/5"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
              THỬ LẠI
            </button>
            {currentIndex < allTargets.length - 1 && (
              <button onClick={handleNext}
                className="flex-1 py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2"
                style={{ background: GRADIENT.pronunciation }}>
                CÂU TIẾP THEO <IconChevronRight size={18} />
              </button>
            )}
          </>
        )}

        {recState === 'scoring' && (
          <div className="w-full py-4 flex items-center justify-center gap-3 font-black text-sm" style={{ color: ACCENT.listening }}>
            <IconLoader size={18} /> ĐANG PHÂN TÍCH...
          </div>
        )}
      </FixedActionBar>

      {error && (
        <p className="fixed bottom-24 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-2 rounded-full border z-50"
          style={{ color: STATUS.danger, backgroundColor: `${STATUS.danger}0D`, borderColor: `${STATUS.danger}33` }}>
          {error}
        </p>
      )}
    </div>
  );
}
