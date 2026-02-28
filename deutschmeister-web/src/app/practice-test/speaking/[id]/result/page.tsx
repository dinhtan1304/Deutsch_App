'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFreeSpeakingSession } from '@/hooks/useFreeSpeaking';

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconMic({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" /></svg>;
}
function IconLoader({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconChevronLeft({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronDown({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="6 9 12 15 18 9" /></svg>;
}
function IconStar({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block', ...style }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
}
function IconAlertCircle({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
}
function IconPlus({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}

const ACCENT = '#F59E0B';
const GRADIENT = 'linear-gradient(135deg, #F59E0B, #EF4444)';

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score >= 75 ? '#22C55E' : score >= 50 ? ACCENT : '#EF4444';
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--theme-border)" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={c} strokeDashoffset={c - c * pct} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 11, color: 'var(--theme-text-muted)', fontWeight: 600 }}>/100</span>
      </div>
    </div>
  );
}

// ─── Criteria bar ─────────────────────────────────────────────────────────────
const CRITERIA_LABELS: Record<string, { label: string; labelVi: string; color: string }> = {
  aufgabe:    { label: 'Aufgabe',    labelVi: 'Hoàn thành đề bài', color: '#6366F1' },
  aussprache: { label: 'Aussprache', labelVi: 'Phát âm',           color: '#F59E0B' },
  grammatik:  { label: 'Grammatik',  labelVi: 'Ngữ pháp',          color: '#22C55E' },
  wortschatz: { label: 'Wortschatz', labelVi: 'Từ vựng',           color: '#EC4899' },
};

function CriteriaBar({ key_, score }: { key_: string; score: number }) {
  const info = CRITERIA_LABELS[key_] ?? { label: key_, labelVi: '', color: ACCENT };
  const pct = (score / 25) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-[12px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{info.label}</span>
          {info.labelVi && <span className="text-[11px] ml-1.5" style={{ color: 'var(--theme-text-muted)' }}>{info.labelVi}</span>}
        </div>
        <span className="text-[12px] font-bold" style={{ color: info.color }}>{score}<span className="font-normal text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>/25</span></span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--theme-border)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: info.color }} />
      </div>
    </div>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────────
function Collapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--theme-border)' }}>
      <button className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ background: 'var(--theme-bg-card)' }}
        onClick={() => setOpen(v => !v)}>
        <span className="text-[13px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{title}</span>
        <IconChevronDown size={14} style={{ color: 'var(--theme-text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2" style={{ background: 'var(--theme-bg-card)', borderTop: '1px solid var(--theme-border)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function FreeSpeakingResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [polling, setPolling] = useState(true);
  const { data: session, isLoading } = useFreeSpeakingSession(id, {
    refetchInterval: polling ? 3000 : false,
  });

  // Stop polling once grading is done
  useEffect(() => {
    if (session?.status === 'GRADED' || session?.status === 'ERROR') {
      setPolling(false);
    }
  }, [session?.status]);

  useEffect(() => {
    if (session?.status === 'DRAFT') {
      router.replace(`/practice-test/speaking/${id}`);
    }
  }, [session, id, router]);

  if (isLoading || !session) return (
    <div className="py-16 flex flex-col items-center gap-3">
      <IconLoader size={28} style={{ color: ACCENT }} />
      <p className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>Đang tải kết quả...</p>
    </div>
  );

  if (session.status === 'GRADING') return (
    <div className="py-16 flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,.12)' }}>
        <IconLoader size={28} style={{ color: ACCENT }} />
      </div>
      <div className="text-center">
        <p className="font-bold text-[15px]" style={{ color: 'var(--theme-text-primary)' }}>AI đang chấm điểm...</p>
        <p className="text-[13px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>Gemini phân tích audio và transcript. Vui lòng chờ.</p>
      </div>
    </div>
  );

  if (session.status === 'ERROR') return (
    <div className="py-16 text-center">
      <p style={{ color: '#EF4444' }} className="mb-3">Chấm điểm thất bại.</p>
      <Link href="/practice-test/speaking" className="text-[13px]" style={{ color: ACCENT }}>← Danh sách</Link>
    </div>
  );

  const grading = session.grading;
  if (!grading) return null;

  const score = session.totalScore ?? grading.score ?? 0;

  return (
    <div className="py-6">
      {/* Back */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/practice-test/speaking" className="flex items-center gap-1 text-[13px] font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--theme-text-muted)' }}>
          <IconChevronLeft size={14} /> Danh sách
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,.12)' }}>
          <IconMic size={18} style={{ color: ACCENT }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Kết quả Luyện Nói</h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(245,158,11,.12)', color: ACCENT }}>
              {session.cefrLevel}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
              {session.topicType.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Score card */}
      <div className="rounded-2xl p-5 mb-5 flex flex-col items-center gap-4"
        style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <ScoreRing score={Math.round(score)} />
        <div className="text-center">
          <p className="font-bold text-[15px]" style={{ color: 'var(--theme-text-primary)' }}>
            {score >= 75 ? 'Rất tốt!' : score >= 50 ? 'Khá tốt' : 'Cần cải thiện'}
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {score >= 75 ? 'Bạn đã nói tự nhiên và đúng ngữ pháp' : score >= 50 ? 'Bạn đã hoàn thành đề bài khá tốt' : 'Hãy luyện tập thêm và thử lại'}
          </p>
        </div>
        {/* Criteria bars */}
        {grading.criteriaScores && (
          <div className="w-full space-y-3 pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
            {Object.entries(grading.criteriaScores).map(([k, v]) => (
              <CriteriaBar key={k} key_={k} score={v as number} />
            ))}
          </div>
        )}
      </div>

      {/* Feedback */}
      <div className="space-y-3 mb-5">
        {/* Vietnamese feedback */}
        <div className="rounded-xl p-4" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: ACCENT }}>Nhận xét (Tiếng Việt)</p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
            {grading.feedbackVi}
          </p>
        </div>

        {/* German feedback */}
        {grading.feedbackDe && (
          <div className="rounded-xl p-4" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>Feedback (Deutsch)</p>
            <p className="text-[13px] leading-relaxed italic" style={{ color: 'var(--theme-text-secondary)' }}>
              {grading.feedbackDe}
            </p>
          </div>
        )}

        {/* Strengths */}
        {grading.strengths?.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(34,197,94,.05)', border: '1px solid rgba(34,197,94,.2)' }}>
            <div className="flex items-center gap-1.5 mb-2.5">
              <IconStar size={13} style={{ color: '#22C55E' }} />
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#22C55E' }}>Điểm mạnh</p>
            </div>
            <ul className="space-y-1.5">
              {grading.strengths.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--theme-text-secondary)' }}>
                  <IconPlus size={12} style={{ color: '#22C55E', marginTop: 2, transform: 'rotate(45deg)' }} />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Corrections */}
        {grading.corrections?.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,.05)', border: '1px solid rgba(239,68,68,.2)' }}>
            <div className="flex items-center gap-1.5 mb-2.5">
              <IconAlertCircle size={13} style={{ color: '#EF4444' }} />
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#EF4444' }}>Cần sửa</p>
            </div>
            <ul className="space-y-1.5">
              {grading.corrections.map((c: string, i: number) => (
                <li key={i} className="text-[12px] p-2 rounded-lg" style={{ background: 'rgba(239,68,68,.06)', color: 'var(--theme-text-secondary)' }}>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Transcript */}
        {session.transcript && (
          <Collapsible title="Transcript của bạn">
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
              {session.transcript}
            </p>
          </Collapsible>
        )}
      </div>

      {/* Prompt reminder */}
      <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(245,158,11,.04)', border: '1px solid rgba(245,158,11,.15)' }}>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: ACCENT }}>Câu hỏi đã trả lời</p>
        <p className="text-[13px]" style={{ color: 'var(--theme-text-secondary)' }}>{session.prompt}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/practice-test/speaking"
          className="flex-1 py-3 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5"
          style={{ border: '2px solid var(--theme-border)', color: 'var(--theme-text-secondary)', background: 'var(--theme-bg-card)' }}>
          Danh sách
        </Link>
        <Link href="/practice-test/speaking/new"
          className="flex-1 py-3 rounded-2xl font-bold text-[14px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
          style={{ background: GRADIENT, boxShadow: '0 4px 12px rgba(245,158,11,.3)' }}>
          Bài mới
        </Link>
      </div>
    </div>
  );
}
