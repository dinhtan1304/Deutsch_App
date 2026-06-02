'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useFormatter } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useFreeSpeakingSession } from '@/hooks/useFreeSpeaking';
import { PageHeader, FixedActionBar, ScoreRing } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { synthesizeAudio } from '@/lib/utils';
import { InsightsPanel } from '@/components/grading/InsightsPanel';
import { coalesceInsights } from '@/lib/api/utils/insights-fallback';

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconMic({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" /></svg>;
}
function IconLoader({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconPlay({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}><polygon points="5,3 19,12 5,21" /></svg>;
}
function IconPause({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>;
}
function IconCheck({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="20 6 9 17 4 12" /></svg>;
}
function IconWarn({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
}
function IconShare({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>;
}
function IconVolume({ size = 13, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>;
}

// ─── Constants ────────────────────────────────────────────────────────────────
// Criteria labels are German exam keywords (Aufgabe, Grammatik, …) — kept as-is.
const CRITERIA_CONFIG = {
  aufgabe:    { label: 'Aufgabe',    icon: '🎯', color: STATUS.success, bg: 'rgba(34,197,94,.08)'  },
  grammatik:  { label: 'Grammatik',  icon: '📐', color: ACCENT.speaking, bg: 'rgba(245,158,11,.08)' },
  aussprache: { label: 'Aussprache', icon: '🔊', color: ACCENT.cyan,    bg: 'rgba(6,182,212,.08)'  },
  wortschatz: { label: 'Wortschatz', icon: '📚', color: ACCENT.vocab,   bg: 'rgba(139,92,246,.08)' },
};

type GradeKey = 'excellent' | 'veryGood' | 'good' | 'needsWork' | 'keepPracticing';
function getGrade(score: number): { key: GradeKey; emoji: string; color: string; bg: string } {
  if (score >= 80) return { key: 'excellent',      emoji: '🏆', color: STATUS.success, bg: 'rgba(34,197,94,.15)'  };
  if (score >= 65) return { key: 'veryGood',       emoji: '🌟', color: STATUS.success, bg: 'rgba(34,197,94,.12)'  };
  if (score >= 50) return { key: 'good',           emoji: '👍', color: ACCENT.speaking, bg: 'rgba(245,158,11,.15)' };
  if (score >= 35) return { key: 'needsWork',      emoji: '📖', color: ACCENT.games,  bg: 'rgba(249,115,22,.12)' };
  return             { key: 'keepPracticing', emoji: '💪', color: STATUS.danger, bg: 'rgba(239,68,68,.12)'  };
}

function detectCorrectionType(text: string): 'grammar' | 'pronunciation' {
  const lower = text.toLowerCase();
  if (lower.includes('phát âm') || lower.includes(' âm ') || lower.includes('âm "') || lower.includes('nghe mẫu') || lower.includes('cách đọc')) return 'pronunciation';
  return 'grammar';
}

// ─── Waveform bars ────────────────────────────────────────────────────────────
function WaveformBars({ progress = 0, color }: { progress?: number; color: string }) {
  const N = 34;
  return (
    <div className="flex items-center gap-px flex-1" style={{ height: 26 }}>
      {Array.from({ length: N }, (_, i) => {
        const h = 28 + Math.abs(Math.sin(i * 0.9) * 28 + Math.sin(i * 1.7) * 14);
        const filled = i / N <= progress;
        return (
          <div key={i} className="flex-1 rounded-full"
            style={{ height: `${Math.max(15, Math.min(88, h))}%`, backgroundColor: filled ? color : 'var(--theme-border)' }} />
        );
      })}
    </div>
  );
}

// ─── Native Speaker TTS Player ────────────────────────────────────────────────
function NativeSpeakerPlayer({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wordCount = text.split(/\s+/).length;
  const duration = Math.max(20, Math.round(wordCount / 110 * 60));

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const toggle = useCallback(async () => {
    if (playing) { stop(); return; }
    setProgress(0);
    const startTimer = () => {
      let elapsed = 0;
      intervalRef.current = setInterval(() => { elapsed++; setProgress(Math.min(elapsed / duration, 0.99)); }, 1000);
    };
    try {
      const audio = await synthesizeAudio(text);
      audio.playbackRate = 0.85;
      audio.onplay = () => { setPlaying(true); startTimer(); };
      audio.onended = () => { setPlaying(false); setProgress(1); if (intervalRef.current) clearInterval(intervalRef.current); };
      audio.onerror = () => stop();
      audioRef.current = audio;
      await audio.play();
    } catch (err) {
      console.warn('[SpeakingResult] backend failed, falling back to Web Speech API:', err);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'de-DE'; u.rate = 0.85;
      u.onend = () => { setPlaying(false); setProgress(1); if (intervalRef.current) clearInterval(intervalRef.current); };
      window.speechSynthesis.speak(u);
      setPlaying(true);
      startTimer();
    }
  }, [playing, text, duration, stop]);

  useEffect(() => () => stop(), [stop]);

  const elapsed = Math.round(progress * duration);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2.5">
      <button onClick={toggle}
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95"
        style={{ background: GRADIENT.speaking, color: 'white' }}>
        {playing ? <IconPause size={13} /> : <IconPlay size={13} />}
      </button>
      <WaveformBars progress={progress} color={ACCENT.speaking} />
      <span className="text-caption font-mono shrink-0" style={{ color: 'var(--theme-text-muted)' }}>{fmt(elapsed)}</span>
    </div>
  );
}

// ─── Decorative user player (no recorded audio available — older sessions) ────
function UserAudioPlayer() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-inner"
        style={{ backgroundColor: `${ACCENT.speaking}33`, color: ACCENT.speaking }}>
        <IconPlay size={13} />
      </div>
      <WaveformBars progress={0} color={ACCENT.speaking} />
      <span className="text-caption font-mono shrink-0" style={{ color: 'var(--theme-text-muted)' }}>—:——</span>
    </div>
  );
}

// ─── Real playback of the user's recorded answer ─────────────────────────────
function RecordedAudioPlayer({ audioUrl }: { audioUrl: string }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    // webm recordings sometimes report Infinity duration until fully buffered — guard it.
    const onMeta = () => { if (Number.isFinite(audio.duration)) setDuration(audio.duration); };
    const onTime = () => setProgress(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration : 0);
    const onEnd = () => { setPlaying(false); setProgress(1); };
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('durationchange', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('durationchange', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, [audioUrl]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  }, [playing]);

  const elapsed = Math.round(progress * duration);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2.5">
      <button onClick={toggle}
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95"
        style={{ background: GRADIENT.speaking, color: 'white' }}>
        {playing ? <IconPause size={13} /> : <IconPlay size={13} />}
      </button>
      <WaveformBars progress={progress} color={ACCENT.speaking} />
      <span className="text-caption font-mono shrink-0" style={{ color: 'var(--theme-text-muted)' }}>{duration ? fmt(elapsed) : '—:——'}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FreeSpeakingResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('practice.speaking.result');
  const formatter = useFormatter();
  const [polling, setPolling] = useState(true);
  const { data: session, isLoading } = useFreeSpeakingSession(id, {
    refetchInterval: polling ? 3000 : false,
  });

  useEffect(() => {
    if (session?.status === 'GRADED' || session?.status === 'ERROR') setTimeout(() => setPolling(false), 0);
  }, [session?.status]);

  useEffect(() => {
    if (session?.status === 'DRAFT') router.replace(`/practice-test/speaking/${id}`);
  }, [session, id, router]);

  if (isLoading || !session) return (
    <div className="py-24 flex flex-col items-center gap-4">
      <IconLoader size={28} style={{ color: ACCENT.speaking }} />
      <p className="text-body font-semibold" style={{ color: 'var(--theme-text-muted)' }}>{t('loading')}</p>
    </div>
  );

  if (session.status === 'GRADING') return (
    <div className="py-24 flex flex-col items-center gap-6 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden"
           style={{ background: GRADIENT.speaking }}>
        <div className="absolute inset-0 bg-white/20 animate-pulse" />
        <IconLoader size={32} style={{ color: 'white' }} />
      </div>
      <div>
        <h2 className="text-xl font-black mb-2" style={{ color: 'var(--theme-text-primary)' }}>{t('grading')}</h2>
        <p className="text-sm opacity-60 max-w-xs" style={{ color: 'var(--theme-text-primary)' }}>{t('gradingSubtitle')}</p>
      </div>
    </div>
  );

  if (session.status === 'ERROR') return (
    <div className="py-24 text-center">
      <div className="w-16 h-16 rounded-3xl bg-rose-500/10 flex items-center justify-center mx-auto mb-6 text-rose-500">
         <IconWarn size={32} />
      </div>
      <p style={{ color: STATUS.danger }} className="font-bold mb-6">{t('errorTitle')}</p>
      <Link href="/practice-test/speaking" className="text-sm font-black uppercase tracking-widest" style={{ color: ACCENT.speaking }}>{t('backToList')}</Link>
    </div>
  );

  const grading = session.grading;
  if (!grading) return null;

  const score = Math.round(session.totalScore ?? grading.score ?? 0);
  const grade = getGrade(score);
  const wordCount = session.transcript ? session.transcript.split(/\s+/).filter(Boolean).length : 0;
  const criteriaOrder: (keyof typeof CRITERIA_CONFIG)[] = ['aufgabe', 'grammatik', 'aussprache', 'wortschatz'];
  const corrections = grading.corrections || [];
  const strengths = grading.strengths || [];

  return (
    <div className="max-w-360 mx-auto px-4 py-6 pb-28">
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

      {/* Hero card ── */}
      <div className="rounded-3xl border mb-8 overflow-hidden shadow-2xl relative"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        
        <div className="absolute top-0 inset-x-0 h-1.5" style={{ background: GRADIENT.speaking }} />

        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="md:w-[320px] flex items-center justify-center py-10 bg-white/[0.02]">
            <ScoreRing value={score} accent="speaking" variant="exam" size={160} label={`${score}%`} />
          </div>
          
          <div className="flex-1 flex flex-col justify-center p-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-2xl"
                style={{ background: grade.bg, color: grade.color }}>
                {grade.emoji}
              </div>
              <div>
                <h2 className="text-h2 font-black tracking-tight" style={{ color: grade.color }}>
                  {t(`grades.${grade.key}.badge` as 'grades.excellent.badge')}
                </h2>
                <p className="text-lg font-bold opacity-80" style={{ color: 'var(--theme-text-primary)' }}>
                  {t(`grades.${grade.key}.title` as 'grades.excellent.title')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('totalScore')}</span>
                <span className="text-2xl font-black" style={{ color: grade.color }}>{score}<span className="text-xs ml-0.5">/100</span></span>
              </div>
              {wordCount > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('wordCount')}</span>
                  <span className="text-2xl font-black" style={{ color: 'var(--theme-text-primary)' }}>{wordCount}</span>
                </div>
              )}
            </div>

            <p className="text-xs font-medium opacity-40 mt-2">
              {session.gradedAt
                ? t('completedAt', { date: formatter.dateTime(new Date(session.gradedAt), { dateStyle: 'short', timeStyle: 'short' }) })
                : t('completedJustNow')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left: Detailed Criteria & Audio */}
        <div className="lg:w-[420px] shrink-0 space-y-6">
          <div className="rounded-3xl border p-6 shadow-lg"
            style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 opacity-60">{t('criteriaTitle')}</h3>
            <div className="space-y-6">
              {criteriaOrder.map(key => {
                const cfg = CRITERIA_CONFIG[key];
                const val = grading.criteriaScores?.[key as keyof typeof grading.criteriaScores] ?? 0;
                const pct = (val / 25) * 100;
                return (
                  <div key={key}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{cfg.icon}</span>
                      <span className="text-sm font-bold flex-1" style={{ color: 'var(--theme-text-primary)' }}>{cfg.label}</span>
                      <span className="text-sm font-black" style={{ color: cfg.color }}>{val}<span className="text-[10px] opacity-40 font-normal ml-0.5">/25</span></span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-white/5 border border-white/5">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${pct}%`, background: cfg.color, boxShadow: `0 0 10px ${cfg.color}44` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-2xl border p-5 shadow-lg"
              style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
              <div className="flex items-center gap-2 mb-4">
                <IconMic size={14} style={{ color: ACCENT.speaking }} />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('yourVoice')}</span>
              </div>
              {session.audioUrl ? <RecordedAudioPlayer audioUrl={session.audioUrl} /> : <UserAudioPlayer />}
            </div>
            <div className="rounded-2xl border p-5 shadow-lg"
              style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: `${STATUS.success}33` }}>
              <div className="flex items-center gap-2 mb-4">
                <IconVolume size={14} style={{ color: STATUS.success }} />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('nativeSample')}</span>
              </div>
              <NativeSpeakerPlayer text={session.transcript || session.prompt} />
            </div>
          </div>
        </div>

        {/* Right: Transcript, Corrections, Feedback */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Transcript & Corrections */}
          {(session.transcript || corrections.length > 0) && (
            <div className="rounded-3xl border p-8 shadow-lg"
              style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
              <h3 className="text-xs font-black uppercase tracking-widest mb-6 opacity-60">{t('transcriptTitle')}</h3>
              
              {session.transcript && (
                <div className="relative mb-8 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                   <p className="text-lg font-semibold italic leading-relaxed" style={{ color: 'var(--theme-text-primary)' }}>
                    {'“'}{session.transcript}{'”'}
                  </p>
                </div>
              )}

              {corrections.length > 0 && (
                <div className="space-y-3">
                  {corrections.map((c, i) => {
                    const type = detectCorrectionType(c);
                    const isGrammar = type === 'grammar';
                    return (
                      <div key={i} className="rounded-2xl p-4 border flex gap-4"
                        style={{ 
                          background: isGrammar ? 'rgba(239,68,68,.03)' : 'rgba(245,158,11,.03)', 
                          borderColor: isGrammar ? 'rgba(239,68,68,.15)' : 'rgba(245,158,11,.15)' 
                        }}>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black text-white"
                             style={{ background: isGrammar ? STATUS.danger : ACCENT.speaking }}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: isGrammar ? STATUS.danger : ACCENT.speaking }}>
                            {isGrammar ? t('correctionTypeGrammar') : t('correctionTypePronunciation')}
                          </p>
                          <p className="text-sm font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>{c}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Feedback & Strengths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="rounded-3xl border p-6 bg-emerald-500/[0.02] border-emerald-500/10">
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 text-emerald-500">{t('strengths')}</h4>
                <ul className="space-y-3">
                  {(strengths.length > 0 ? strengths : [t('defaultStrength')]).map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 shrink-0 text-emerald-500"><IconCheck size={14} /></div>
                      <span className="text-sm font-semibold opacity-80" style={{ color: 'var(--theme-text-primary)' }}>{s}</span>
                    </li>
                  ))}
                </ul>
             </div>
             <div className="rounded-3xl border p-6 bg-rose-500/[0.02] border-rose-500/10">
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 text-rose-500">{t('needsImprovement')}</h4>
                <ul className="space-y-3">
                  {(corrections.length > 0 ? corrections.slice(0, 3) : [t('defaultImprovement')]).map((c, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 shrink-0 text-rose-500"><IconWarn size={14} /></div>
                      <span className="text-sm font-semibold opacity-80" style={{ color: 'var(--theme-text-primary)' }}>{c.split('.')[0]}.</span>
                    </li>
                  ))}
                </ul>
             </div>
          </div>

          {grading.feedbackVi && (
            <div className="rounded-3xl border p-8 shadow-xl relative overflow-hidden"
              style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500 opacity-[0.03] blur-3xl -mr-16 -mt-16" />
              <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-60">{t('feedback')}</h3>
              <p className="text-[15px] font-medium leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                {grading.feedbackVi}
              </p>
            </div>
          )}

          <InsightsPanel
            insights={coalesceInsights({
              insights: grading.insights,
              strengths: grading.strengths,
              feedbackVi: grading.feedbackVi,
            })}
          />
        </div>
      </div>

      <FixedActionBar columns={2}>
        <button
          className="flex-1 flex items-center justify-center gap-3 py-4.5 rounded-2xl font-black text-sm border-2 transition-all hover:bg-black/5"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', backgroundColor: 'var(--theme-bg-card)' }}
          onClick={() => { if (navigator.share) navigator.share({ title: t('shareTitle'), text: t('shareText', { score }), url: window.location.href }); }}>
          <IconShare size={18} /> {t('share')}
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-3 py-4.5 rounded-2xl font-black text-sm text-white transition-all hover:scale-[1.02] shadow-2xl active:scale-95"
          style={{ background: GRADIENT.speaking, boxShadow: `0 15px 35px ${ACCENT.speaking}4D` }}
          onClick={() => router.push('/practice-test/speaking/new')}>
          <span className="text-lg">✨</span> {t('newSession')}
        </button>
      </FixedActionBar>

    </div>
  );
}
