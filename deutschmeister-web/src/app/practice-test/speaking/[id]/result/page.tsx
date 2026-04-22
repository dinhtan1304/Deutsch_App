'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFreeSpeakingSession } from '@/hooks/useFreeSpeaking';
import { PageHeader, FixedActionBar } from '@/components/ui';

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconMic({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" /></svg>;
}
function IconLoader({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconChevronRight({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="9 18 15 12 9 6" /></svg>;
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
const GRADIENT = 'linear-gradient(135deg, #F59E0B, #EF4444)';

const CRITERIA_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  aufgabe:    { label: 'Aufgabe',    icon: '🎯', color: '#22C55E', bg: 'rgba(34,197,94,.08)'  },
  grammatik:  { label: 'Grammatik',  icon: '📐', color: '#F59E0B', bg: 'rgba(245,158,11,.08)' },
  aussprache: { label: 'Aussprache', icon: '🔊', color: '#06B6D4', bg: 'rgba(6,182,212,.08)'  },
  wortschatz: { label: 'Wortschatz', icon: '📚', color: '#8B5CF6', bg: 'rgba(139,92,246,.08)' },
};

function getGrade(score: number) {
  if (score >= 80) return { badge: 'Xuất sắc', emoji: '🏆', title: 'Hoàn hảo! 🎉',         color: '#22C55E', bg: 'rgba(34,197,94,.15)'  };
  if (score >= 65) return { badge: 'Tốt lắm',  emoji: '🌟', title: 'Bạn nói rất tốt! 👏',   color: '#22C55E', bg: 'rgba(34,197,94,.12)'  };
  if (score >= 50) return { badge: 'Khá tốt',  emoji: '👍', title: 'Tiến bộ rồi đấy! 💪',   color: '#F59E0B', bg: 'rgba(245,158,11,.15)' };
  if (score >= 35) return { badge: 'Cố lên',   emoji: '📖', title: 'Tiếp tục luyện tập! 🤗', color: '#F97316', bg: 'rgba(249,115,22,.12)' };
  return             { badge: 'Cần luyện', emoji: '💪', title: 'Đừng bỏ cuộc nhé! 📚',  color: '#EF4444', bg: 'rgba(239,68,68,.12)'  };
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

  const toggle = useCallback(() => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      window.speechSynthesis.cancel();
      setProgress(0);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'de-DE'; u.rate = 0.85;
      u.onend = () => { setPlaying(false); setProgress(1); if (intervalRef.current) clearInterval(intervalRef.current); };
      window.speechSynthesis.speak(u);
      setPlaying(true);
      let elapsed = 0;
      intervalRef.current = setInterval(() => { elapsed++; setProgress(Math.min(elapsed / duration, 0.99)); }, 1000);
    }
  }, [playing, text, duration]);

  useEffect(() => () => { window.speechSynthesis.cancel(); if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const elapsed = Math.round(progress * duration);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2.5">
      <button onClick={toggle}
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg,#22C55E,#14B8A6)', color: 'white' }}>
        {playing ? <IconPause size={13} /> : <IconPlay size={13} />}
      </button>
      <WaveformBars progress={progress} color="#22C55E" />
      <span className="text-caption font-mono shrink-0" style={{ color: 'var(--theme-text-muted)' }}>{fmt(elapsed)}</span>
    </div>
  );
}

// ─── Decorative user player (no audio URL available) ─────────────────────────
function UserAudioPlayer() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'rgba(245,158,11,.25)', color: '#F59E0B' }}>
        <IconPlay size={13} />
      </div>
      <WaveformBars progress={0.72} color="#F59E0B" />
      <span className="text-caption font-mono shrink-0" style={{ color: 'var(--theme-text-muted)' }}>—:——</span>
    </div>
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const size = 128;
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = score >= 65 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444';
  const offset = c - c * (score / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--theme-border)" strokeWidth={10} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={score >= 65 ? color : 'url(#scoreGrad)'} strokeWidth={10}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, color: score >= 65 ? color : '#F59E0B' }}>{score}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--theme-text-muted)' }}>/100</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FreeSpeakingResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [polling, setPolling] = useState(true);
  const { data: session, isLoading } = useFreeSpeakingSession(id, {
    refetchInterval: polling ? 3000 : false,
  });

  useEffect(() => {
    if (session?.status === 'GRADED' || session?.status === 'ERROR') setPolling(false);
  }, [session?.status]);

  useEffect(() => {
    if (session?.status === 'DRAFT') router.replace(`/practice-test/speaking/${id}`);
  }, [session, id, router]);

  if (isLoading || !session) return (
    <div className="py-16 flex flex-col items-center gap-3">
      <IconLoader size={28} style={{ color: '#F59E0B' }} />
      <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>Đang tải kết quả...</p>
    </div>
  );

  if (session.status === 'GRADING') return (
    <div className="py-16 flex flex-col items-center gap-5">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,.12)' }}>
        <IconLoader size={28} style={{ color: '#F59E0B' }} />
      </div>
      <div className="text-center">
        <p className="font-bold text-[15px]" style={{ color: 'var(--theme-text-primary)' }}>AI đang chấm điểm...</p>
        <p className="text-body mt-1" style={{ color: 'var(--theme-text-muted)' }}>Gemini phân tích audio và transcript. Vui lòng chờ.</p>
      </div>
    </div>
  );

  if (session.status === 'ERROR') return (
    <div className="py-16 text-center">
      <p style={{ color: '#EF4444' }} className="mb-3">Chấm điểm thất bại.</p>
      <Link href="/practice-test/speaking" className="text-body" style={{ color: '#F59E0B' }}>← Danh sách</Link>
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
    <div className="py-6">

      <PageHeader
        backHref="/practice-test/speaking"
        title="Kết quả luyện nói"
        accent="xp"
        right={
          <span className="text-caption px-2.5 py-1 rounded-full font-bold"
            style={{ background: 'rgba(245,158,11,.12)', color: '#F59E0B' }}>
            {session.cefrLevel}
          </span>
        }
      />

      {/* ── Page title ── */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(245,158,11,.12)' }}>
          <IconMic size={16} style={{ color: '#F59E0B' }} />
        </div>
        <div>
          <p className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>Kết quả luyện nói</p>
          <h1 className="text-base font-bold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>
            {session.topicType.replace(/_/g, ' ')}
          </h1>
        </div>
      </div>

      {/* ── Hero card: ring LEFT + grade RIGHT ── */}
      <div className="rounded-2xl p-5 mb-4 flex items-center gap-5"
        style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        {/* Score ring */}
        <div className="shrink-0">
          <ScoreRing score={score} />
        </div>
        {/* Grade info */}
        <div className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2"
            style={{ backgroundColor: grade.bg, color: grade.color }}>
            {grade.emoji} {grade.badge}
          </span>
          <p className="text-h2 font-extrabold leading-tight mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            {grade.title}
          </p>
          {/* Mini stats */}
          <div className="flex items-center gap-3 flex-wrap mt-2">
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {session.topicType.replace(/_/g, ' ')}
            </span>
            {wordCount > 0 && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {wordCount} từ
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Criteria detail ── */}
      <div className="rounded-2xl p-4 mb-4"
        style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <p className="text-body font-bold mb-4" style={{ color: 'var(--theme-text-primary)' }}>
          Chi tiết theo tiêu chí
        </p>
        <div className="space-y-4">
          {criteriaOrder.map(key => {
            const cfg = CRITERIA_CONFIG[key];
            const val = grading.criteriaScores?.[key as keyof typeof grading.criteriaScores] ?? 0;
            const pct = (val / 25) * 100;
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[15px]">{cfg.icon}</span>
                  <span className="text-body font-bold flex-1" style={{ color: 'var(--theme-text-primary)' }}>{cfg.label}</span>
                  <span className="text-body font-bold" style={{ color: cfg.color }}>
                    {val}
                    <span className="text-caption font-normal" style={{ color: 'var(--theme-text-muted)' }}> / 25</span>
                  </span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--theme-bg-secondary)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: cfg.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Audio players ── */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* User recording */}
        <div className="rounded-2xl p-3.5"
          style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <div className="flex items-center gap-1.5 mb-3">
            <IconMic size={12} style={{ color: '#F59E0B' }} />
            <span className="text-caption font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Bạn đã nói</span>
          </div>
          <UserAudioPlayer />
        </div>
        {/* Native speaker TTS */}
        <div className="rounded-2xl p-3.5"
          style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid rgba(34,197,94,.2)' }}>
          <div className="flex items-center gap-1.5 mb-3">
            <IconVolume size={12} style={{ color: '#22C55E' }} />
            <span className="text-caption font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Native speaker</span>
          </div>
          <NativeSpeakerPlayer text={session.transcript || session.prompt} />
        </div>
      </div>

      {/* ── Transcript & errors ── */}
      {(session.transcript || corrections.length > 0) && (
        <div className="rounded-2xl p-4 mb-4"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">📄</span>
            <p className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Transcript & lỗi phát hiện
            </p>
          </div>
          {session.transcript && (
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--theme-text-secondary)', fontFamily: 'Georgia, serif' }}>
              {session.transcript}
            </p>
          )}
          {corrections.length > 0 && (
            <div className="space-y-2">
              {corrections.map((c, i) => {
                const type = detectCorrectionType(c);
                const isGrammar = type === 'grammar';
                return (
                  <div key={i} className="rounded-xl p-3"
                    style={{ background: isGrammar ? 'rgba(239,68,68,.07)' : 'rgba(245,158,11,.07)', border: `1px solid ${isGrammar ? 'rgba(239,68,68,.2)' : 'rgba(245,158,11,.2)'}` }}>
                    <p className="text-caption font-bold mb-1" style={{ color: isGrammar ? '#EF4444' : '#F59E0B' }}>
                      {i + 1} · {isGrammar ? 'Lỗi ngữ pháp' : 'Lỗi phát âm'}
                    </p>
                    <p className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>{c}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Strengths & Improvements ── */}
      {(strengths.length > 0 || corrections.length > 0) && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Điểm mạnh */}
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(34,197,94,.05)', border: '1px solid rgba(34,197,94,.2)' }}>
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-body">🌿</span>
              <p className="text-xs font-bold" style={{ color: '#22C55E' }}>Điểm mạnh</p>
            </div>
            <ul className="space-y-2">
              {(strengths.length > 0 ? strengths : ['Đã hoàn thành bài nói']).map((s, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0" style={{ color: '#22C55E' }}><IconCheck size={11} /></span>
                  <span className="text-xs leading-snug" style={{ color: 'var(--theme-text-secondary)' }}>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Cần cải thiện */}
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(245,158,11,.05)', border: '1px solid rgba(245,158,11,.2)' }}>
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-body">⚠️</span>
              <p className="text-xs font-bold" style={{ color: '#F59E0B' }}>Cần cải thiện</p>
            </div>
            <ul className="space-y-2">
              {(corrections.length > 0 ? corrections : ['Hãy luyện tập thêm!']).map((c, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0" style={{ color: '#F59E0B' }}><IconWarn size={11} /></span>
                  <span className="text-xs leading-snug" style={{ color: 'var(--theme-text-secondary)' }}>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── General feedback ── */}
      {grading.feedbackVi && (
        <div className="rounded-2xl p-4 mb-4"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <p className="text-caption font-bold uppercase tracking-wider mb-2" style={{ color: '#F59E0B' }}>Nhận xét chung</p>
          <p className="text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
            {grading.feedbackVi}
          </p>
        </div>
      )}

      <FixedActionBar columns={3}>
        <Link href={`/practice-test/speaking/${id}`}
          className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-body text-white transition-all hover:-translate-y-0.5"
          style={{ background: GRADIENT, boxShadow: '0 3px 10px rgba(245,158,11,.35)' }}>
          <IconMic size={14} /> Luyện lại
        </Link>
        <Link href="/practice-test/speaking/new"
          className="flex items-center justify-center gap-1 py-3 rounded-xl font-semibold text-body border transition-all hover:-translate-y-0.5"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', backgroundColor: 'var(--theme-bg-secondary)' }}>
          Bài tiếp <IconChevronRight size={12} />
        </Link>
        <button
          className="flex items-center justify-center gap-1 py-3 rounded-xl font-semibold text-body border transition-all hover:-translate-y-0.5"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', backgroundColor: 'var(--theme-bg-secondary)' }}
          onClick={() => { if (navigator.share) navigator.share({ title: 'Kết quả luyện nói', text: `Tôi đạt ${score}/100 điểm!`, url: window.location.href }); }}>
          <IconShare size={13} /> Chia sẻ
        </button>
      </FixedActionBar>

    </div>
  );
}
