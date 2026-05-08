'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useExamSpeakingSession } from '@/hooks/useExamSpeaking';
import { ExamSpeakingTeil, TeilGrading } from '@/lib/api/examSpeaking';
import { PageHeader, FixedActionBar } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { synthesizeAudio } from '@/lib/utils';

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconLoader({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconMic({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" /></svg>;
}
function IconChevronDown({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="6 9 12 15 18 9" /></svg>;
}
function IconPlay({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}><polygon points="5,3 19,12 5,21" /></svg>;
}
function IconPause({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>;
}
function IconCheck({ size = 11 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="20 6 9 17 4 12" /></svg>;
}
function IconWarn({ size = 11 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
}
function IconVolume({ size = 13, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>;
}
function IconShare({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>;
}
function IconSparkles({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M3 5h4" /><path d="M21 17v4" /><path d="M19 19h4" /></svg>;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CRITERIA_CONFIG = {
  aufgabe:    { label: 'Aufgabe',    icon: '🎯', color: STATUS.success },
  grammatik:  { label: 'Grammatik',  icon: '📐', color: ACCENT.xp      },
  aussprache: { label: 'Aussprache', icon: '🔊', color: ACCENT.cyan    },
  wortschatz: { label: 'Wortschatz', icon: '📚', color: ACCENT.vocab   },
};

const CRITERIA_ORDER = ['aufgabe', 'grammatik', 'aussprache', 'wortschatz'] as const;

function getGrade(score: number) {
  if (score >= 80) return { badge: 'Xuất sắc', emoji: '🏆', title: 'Ausgezeichnet! 🎉',   color: STATUS.success, bg: 'rgba(34,197,94,.15)'  };
  if (score >= 65) return { badge: 'Tốt lắm',  emoji: '🌟', title: 'Sehr gut! 👏',         color: STATUS.success, bg: 'rgba(34,197,94,.12)'  };
  if (score >= 60) return { badge: 'Đạt',       emoji: '✓',  title: 'Bestanden! 💪',         color: ACCENT.xp,     bg: 'rgba(245,158,11,.15)' };
  if (score >= 40) return { badge: 'Cố gắng',   emoji: '📖', title: 'Weiter üben! 🤗',       color: ACCENT.games,  bg: 'rgba(249,115,22,.12)' };
  return             { badge: 'Chưa đạt',  emoji: '💪', title: 'Nicht aufgeben! 📚', color: STATUS.danger, bg: 'rgba(239,68,68,.12)'  };
}

function detectCorrectionType(text: string): 'grammar' | 'pronunciation' {
  const lower = text.toLowerCase();
  if (lower.includes('phát âm') || lower.includes(' âm ') || lower.includes('âm "') || lower.includes('cách đọc')) return 'pronunciation';
  return 'grammar';
}

// ─── Waveform bars ────────────────────────────────────────────────────────────
function WaveformBars({ progress = 0, color }: { progress?: number; color: string }) {
  const N = 30;
  return (
    <div className="flex items-center gap-px flex-1" style={{ height: 24 }}>
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

// ─── TTS Player ──────────────────────────────────────────────────────────────
function NativeSpeakerPlayer({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wordCount = text.split(/\s+/).length;
  const duration = Math.max(15, Math.round(wordCount / 110 * 60));

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
      console.warn('[ExamSpeakingResult] backend failed, falling back to Web Speech API:', err);
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
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-105"
        style={{ background: GRADIENT.reading, color: 'white' }}>
        {playing ? <IconPause size={12} /> : <IconPlay size={12} />}
      </button>
      <WaveformBars progress={progress} color={STATUS.success} />
      <span className="text-caption font-mono shrink-0" style={{ color: 'var(--theme-text-muted)' }}>{fmt(elapsed)}</span>
    </div>
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const size = 128;
  const r = 52;
  const c = 2 * Math.PI * r;
  const passed = score >= 60;
  const color = score >= 80 ? STATUS.success : score >= 60 ? ACCENT.xp : STATUS.danger;
  const offset = c - c * (score / 100);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <defs>
          <linearGradient id="examRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ACCENT.xp} />
            <stop offset="100%" stopColor={STATUS.danger} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--theme-border)" strokeWidth={10} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={score >= 60 ? color : 'url(#examRingGrad)'} strokeWidth={10}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color }}>{Math.round(score)}%</span>
        <span style={{ fontSize: 11, fontWeight: 700, marginTop: 2, color: passed ? STATUS.success : STATUS.danger }}>
          {passed ? 'Bestanden' : 'Nicht best.'}
        </span>
      </div>
    </div>
  );
}

// ─── Per-Teil detail card ─────────────────────────────────────────────────────
function TeilDetailCard({ teil, grading, transcript }: {
  teil: ExamSpeakingTeil;
  grading: TeilGrading | null;
  transcript: string;
}) {
  const [open, setOpen] = useState(false);
  const score = grading?.score ?? 0;
  const color = score >= 80 ? STATUS.success : score >= 60 ? ACCENT.xp : STATUS.danger;
  const corrections = grading?.corrections || [];
  const strengths = grading?.strengths || [];

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      {/* Header */}
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-opacity hover:opacity-80">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold text-white shrink-0"
          style={{ background: GRADIENT.speaking }}>{teil.number}</span>
        <div className="flex-1 min-w-0">
          <p className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            Teil {teil.number}
          </p>
          <p className="text-caption truncate" style={{ color: 'var(--theme-text-muted)' }}>
            {teil.instructionVi || teil.instruction}
          </p>
        </div>
        <span className="text-[15px] font-extrabold shrink-0" style={{ color }}>{Math.round(score)}%</span>
        <span style={{ color: 'var(--theme-text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', display: 'block' }}>
          <IconChevronDown size={15} />
        </span>
      </button>

      {open && (
        <div className="border-t" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="p-4 space-y-4">

            {/* Instruction */}
            <p className="text-xs italic leading-relaxed" style={{ color: 'var(--theme-text-muted)', fontFamily: 'Georgia, serif' }}>
              {teil.instruction}
            </p>

            {grading ? (
              <>
                {/* Criteria bars */}
                <div className="rounded-xl p-4"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
                  <p className="text-xs font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
                    Chi tiết theo tiêu chí
                  </p>
                  <div className="space-y-3">
                    {CRITERIA_ORDER.map(key => {
                      const cfg = CRITERIA_CONFIG[key];
                      const val = grading.criteriaScores?.[key] ?? 0;
                      return (
                        <div key={key}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-body">{cfg.icon}</span>
                            <span className="text-xs font-bold flex-1" style={{ color: 'var(--theme-text-primary)' }}>{cfg.label}</span>
                            <span className="text-xs font-bold" style={{ color: cfg.color }}>
                              {val}<span className="font-normal text-caption" style={{ color: 'var(--theme-text-muted)' }}>/25</span>
                            </span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--theme-border)' }}>
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${(val / 25) * 100}%`, background: cfg.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Audio players */}
                {transcript && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <IconMic size={11} style={{ color: ACCENT.xp }} />
                        <span className="text-caption font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Bạn đã nói</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-60">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${ACCENT.xp}40`, color: ACCENT.xp }}>
                          <IconPlay size={11} />
                        </div>
                        <WaveformBars progress={0.68} color={ACCENT.xp} />
                      </div>
                    </div>
                    <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--theme-bg-secondary)', border: `1px solid ${STATUS.success}33` }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <IconVolume size={11} style={{ color: STATUS.success }} />
                        <span className="text-caption font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Native speaker</span>
                      </div>
                      <NativeSpeakerPlayer text={transcript} />
                    </div>
                  </div>
                )}

                {/* Transcript */}
                {transcript && (
                  <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
                    <p className="text-caption font-bold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--theme-text-muted)' }}>
                      📄 Transcript
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-secondary)', fontFamily: 'Georgia, serif' }}>
                      {transcript}
                    </p>
                  </div>
                )}

                {/* Corrections */}
                {corrections.length > 0 && (
                  <div className="space-y-2">
                    {corrections.map((c, i) => {
                      const isPron = detectCorrectionType(c) === 'pronunciation';
                      return (
                        <div key={i} className="rounded-xl p-3"
                          style={{ background: isPron ? 'rgba(245,158,11,.07)' : 'rgba(239,68,68,.07)', border: `1px solid ${isPron ? 'rgba(245,158,11,.2)' : 'rgba(239,68,68,.2)'}` }}>
                          <p className="text-caption font-bold mb-1" style={{ color: isPron ? ACCENT.xp : STATUS.danger }}>
                            {i + 1} · {isPron ? 'Lỗi phát âm' : 'Lỗi ngữ pháp'}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>{c}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Strengths & Improvements */}
                {(strengths.length > 0 || corrections.length > 0) && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-3" style={{ background: 'rgba(34,197,94,.05)', border: `1px solid ${STATUS.success}33` }}>
                      <p className="text-caption font-bold mb-2 flex items-center gap-1" style={{ color: STATUS.success }}>🌿 Điểm mạnh</p>
                      <ul className="space-y-1.5">
                        {(strengths.length > 0 ? strengths : ['Đã hoàn thành Teil']).map((s, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="mt-0.5 shrink-0" style={{ color: STATUS.success }}><IconCheck size={10} /></span>
                            <span className="text-caption leading-snug" style={{ color: 'var(--theme-text-secondary)' }}>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,.05)', border: `1px solid ${ACCENT.xp}33` }}>
                      <p className="text-caption font-bold mb-2 flex items-center gap-1" style={{ color: ACCENT.xp }}>⚠️ Cần cải thiện</p>
                      <ul className="space-y-1.5">
                        {(corrections.length > 0 ? corrections.slice(0, 3) : ['Hãy luyện tập thêm!']).map((c, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="mt-0.5 shrink-0" style={{ color: ACCENT.xp }}><IconWarn size={10} /></span>
                            <span className="text-caption leading-snug" style={{ color: 'var(--theme-text-secondary)' }}>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {grading.feedbackVi && (
                  <div className="rounded-xl p-3" style={{ backgroundColor: `${ACCENT.xp}0F`, borderLeft: `3px solid ${ACCENT.xp}80` }}>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                      {grading.feedbackVi}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>Không có kết quả chấm điểm.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExamSpeakingResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isLoading } = useExamSpeakingSession(id);

  if (isLoading) return (
    <div className="py-16 flex flex-col items-center gap-3">
      <IconLoader size={28} style={{ color: ACCENT.xp }} />
      <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>Đang tải kết quả...</p>
    </div>
  );

  if (!session) return (
    <div className="py-10 text-center">
      <p className="mb-3" style={{ color: 'var(--theme-text-muted)' }}>Không tìm thấy bài thi.</p>
      <Link href="/practice-test/speaking/exam" className="text-body" style={{ color: ACCENT.xp }}>← Danh sách</Link>
    </div>
  );

  if (session.status === 'DRAFT') { router.replace(`/practice-test/speaking/exam/${id}`); return null; }

  if (session.status === 'GRADING') return (
    <div className="py-16 flex flex-col items-center gap-5">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${ACCENT.xp}1F` }}>
        <IconLoader size={28} style={{ color: ACCENT.xp }} />
      </div>
      <div className="text-center">
        <p className="font-bold text-[15px]" style={{ color: 'var(--theme-text-primary)' }}>AI đang chấm điểm...</p>
        <p className="text-body mt-1" style={{ color: 'var(--theme-text-muted)' }}>Có thể mất 20–40 giây. Vui lòng chờ.</p>
      </div>
    </div>
  );

  const teile = session.teile as ExamSpeakingTeil[];
  const grading = (session.grading ?? {}) as Record<string, TeilGrading>;
  const transcripts = (session.userTranscripts ?? {}) as Record<string, string>;
  const totalScore = session.totalScore ?? 0;
  const grade = getGrade(totalScore);

  return (
    <div className="py-6">

      <PageHeader
        backHref="/practice-test/speaking/exam"
        title="Kết quả luyện nói theo đề"
        accent="xp"
        right={
          <span className="text-caption px-2.5 py-1 rounded-full font-bold"
            style={{ backgroundColor: `${ACCENT.xp}1F`, color: ACCENT.xp }}>
            {session.examType} · {session.cefrLevel}
          </span>
        }
      />

      {/* ── Page title ── */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${ACCENT.xp}1F` }}>
          <IconMic size={16} style={{ color: ACCENT.xp }} />
        </div>
        <div>
          <p className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>Kết quả luyện nói theo đề</p>
          <h1 className="text-base font-bold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>
            {session.examType} Deutsch · {session.cefrLevel} · Sprechen
          </h1>
        </div>
      </div>

      {/* ── Hero card ── */}
      <div className="rounded-2xl p-5 mb-4 flex items-center gap-5"
        style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <div className="shrink-0">
          <ScoreRing score={totalScore} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2"
            style={{ backgroundColor: grade.bg, color: grade.color }}>
            {grade.emoji} {grade.badge}
          </span>
          <p className="text-h2 font-extrabold leading-tight mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            {grade.title}
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              {teile.length} Teile · {session.cefrLevel}
            </span>
            {session.gradedAt && (
              <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                · {new Date(session.gradedAt).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Per-Teil mini bars ── */}
      {teile.length > 0 && (
        <div className="rounded-2xl p-4 mb-4"
          style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <p className="text-xs font-bold mb-3" style={{ color: 'var(--theme-text-muted)' }}>
            Kết quả từng Teil
          </p>
          <div className="space-y-3">
            {teile.map(teil => {
              const tg = grading[String(teil.number)];
              const s = tg?.score ?? 0;
              const c = s >= 80 ? STATUS.success : s >= 60 ? ACCENT.xp : STATUS.danger;
              return (
                <div key={teil.number}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md flex items-center justify-center text-caption font-extrabold text-white shrink-0"
                        style={{ background: GRADIENT.speaking }}>{teil.number}</span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                        Teil {teil.number}
                      </span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: c }}>{Math.round(s)}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--theme-bg-secondary)' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s}%`, background: c }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Detailed per-Teil ── */}
      <div className="space-y-3 mb-4">
        <h3 className="text-body font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
          Xem lại chi tiết
        </h3>
        {teile.map(teil => (
          <TeilDetailCard
            key={teil.number}
            teil={teil}
            grading={grading[String(teil.number)] ?? null}
            transcript={transcripts[String(teil.number)] ?? ''}
          />
        ))}
      </div>

      <FixedActionBar columns={2}>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border-2 transition-all hover:bg-black/5"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', backgroundColor: 'var(--theme-bg-card)' }}
          onClick={() => { if (navigator.share) navigator.share({ title: 'Kết quả luyện nói', text: `Tôi đạt ${Math.round(totalScore)}% trong bài thi ${session.examType} ${session.cefrLevel}!`, url: window.location.href }); }}>
          <IconShare size={16} /> Chia sẻ
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 shadow-lg"
          style={{ background: GRADIENT.speaking, boxShadow: `0 8px 24px ${ACCENT.xp}40` }}
          onClick={() => router.push('/practice-test/speaking/exam/new')}>
          <IconSparkles size={16} /> Bài mới
        </button>
      </FixedActionBar>

    </div>
  );
}
