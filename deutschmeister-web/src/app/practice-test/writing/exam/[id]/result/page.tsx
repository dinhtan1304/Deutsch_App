'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useExamWritingSession } from '@/hooks/useExamWriting';
import { ExamWritingTeil, TeilGrading } from '@/lib/api/examWriting';
import { CriterionRadar } from '@/components/writing/CriterionRadar';
import { PageHeader, FixedActionBar } from '@/components/ui';

function IconLoader({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconChevronDown({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="6 9 12 15 18 9" /></svg>;
}
function IconChevronUp({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="18 15 12 9 6 15" /></svg>;
}
function IconStar({ size = 16, filled = false, color }: { size?: number; filled?: boolean; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', color }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
}

const ACCENT = '#A855F7';
const GRADIENT = 'linear-gradient(135deg, #A855F7, #6366F1)';

function taskTypeLabel(type: string) {
  const map: Record<string, string> = {
    form_fill: 'Formular', informal_email: 'E-Mail (informell)',
    formal_email: 'E-Mail (formell)', sms: 'SMS / Kurznachricht', forum_comment: 'Forumsbeitrag',
  };
  return map[type] || type;
}

function getScoreColor(s: number) {
  if (s >= 80) return '#22C55E';
  if (s >= 60) return '#F59E0B';
  if (s >= 40) return '#F97316';
  return '#EF4444';
}

// ─── Score Ring ───
function ScoreRing({ score, size = 128 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const passed = pct >= 60;
  const color = pct >= 80 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--theme-border)" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{Math.round(pct)}%</span>
        <span style={{ fontSize: 11, color: passed ? '#22C55E' : '#EF4444', fontWeight: 700, marginTop: 2 }}>
          {passed ? 'Bestanden' : 'Nicht b.'}
        </span>
      </div>
    </div>
  );
}

// ─── Teil Grading Card ───
function TeilGradingCard({
  teil, grading, userText, expanded, onToggle,
}: {
  teil: ExamWritingTeil; grading: TeilGrading; userText: string; expanded: boolean; onToggle: () => void;
}) {
  const pct = grading.maxPoints > 0 ? (grading.score / grading.maxPoints) * 100 : 0;
  const [showText, setShowText] = useState(false);

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <button className="w-full flex items-center gap-3 p-4 transition-opacity hover:opacity-80" onClick={onToggle}>
        <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold text-white shrink-0"
          style={{ background: GRADIENT }}>{teil.number}</span>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {taskTypeLabel(teil.taskType)}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 h-1.5 rounded-full max-w-24" style={{ backgroundColor: 'var(--theme-border)' }}>
              <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: getScoreColor(pct) }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: getScoreColor(pct) }}>
              {grading.score}/{grading.maxPoints} Punkte · {Math.round(pct)}%
            </span>
          </div>
        </div>
        <span style={{ color: 'var(--theme-text-muted)', flexShrink: 0 }}>
          {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
        </span>
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4 space-y-4" style={{ borderColor: 'var(--theme-border)' }}>
          {grading.criterionScores && (
            <div className="pt-3 flex justify-center">
              <CriterionRadar scores={grading.criterionScores} size={240} />
            </div>
          )}
          {grading.feedback && (
            <div className="pt-3">
              <p className="text-caption font-bold uppercase tracking-wide mb-1.5" style={{ color: ACCENT }}>Bewertung</p>
              <p className="text-body leading-relaxed" style={{ color: 'var(--theme-text-primary)' }}>
                {grading.feedback}
              </p>
            </div>
          )}
          {grading.strengths?.length > 0 && (
            <div>
              <p className="text-caption font-bold uppercase tracking-wide mb-1.5" style={{ color: '#22C55E' }}>Stärken</p>
              <ul className="space-y-1">
                {grading.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                    <IconStar size={13} filled color="#22C55E" />{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {grading.improvements?.length > 0 && (
            <div>
              <p className="text-caption font-bold uppercase tracking-wide mb-1.5" style={{ color: '#F59E0B' }}>Verbesserungen</p>
              <ul className="space-y-1">
                {grading.improvements.map((imp, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                    <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F59E0B' }} />{imp}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {grading.corrections?.length > 0 && (
            <div>
              <p className="text-caption font-bold uppercase tracking-wide mb-2" style={{ color: '#EF4444' }}>Korrekturen</p>
              <div className="space-y-2">
                {grading.corrections.map((corr, i) => (
                  <div key={i} className="rounded-xl border p-3 space-y-1.5"
                    style={{ borderColor: 'rgba(239,68,68,.2)', backgroundColor: 'rgba(239,68,68,.04)' }}>
                    <div className="flex items-start gap-2 text-xs">
                      <span className="line-through shrink-0 font-medium" style={{ color: '#EF4444' }}>{corr.original}</span>
                      <span style={{ color: 'var(--theme-text-muted)' }}>→</span>
                      <span className="font-semibold shrink-0" style={{ color: '#22C55E' }}>{corr.corrected}</span>
                    </div>
                    {corr.explanationVi && (
                      <p className="text-caption leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                        🇻🇳 {corr.explanationVi}
                      </p>
                    )}
                    {corr.explanationDe && (
                      <p className="text-caption leading-relaxed italic" style={{ color: 'var(--theme-text-muted)' }}>
                        🇩🇪 {corr.explanationDe}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {userText && (
            <div>
              <button
                className="flex items-center gap-1.5 text-xs font-semibold mb-2"
                style={{ color: 'var(--theme-text-muted)' }}
                onClick={() => setShowText(v => !v)}>
                {showText ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
                {showText ? 'Ẩn bài viết' : 'Xem lại bài viết của bạn'}
              </button>
              {showText && (
                <div className="rounded-xl p-3 border"
                  style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap"
                    style={{ color: 'var(--theme-text-primary)', fontFamily: 'Georgia, serif' }}>
                    {userText}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Grading in Progress ───
function GradingInProgress() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4 px-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: GRADIENT }}>
          <IconLoader size={28} />
        </div>
        <h2 className="text-title font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          AI đang chấm bài...
        </h2>
        <p className="text-body leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
          Hệ thống đang đánh giá bài viết theo tiêu chí Goethe/TELC. Thường mất 10–30 giây.
        </p>
        <div className="flex justify-center gap-1.5 mt-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: ACCENT, animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function ExamWritingResultPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading } = useExamWritingSession(id);
  const [expandedTeil, setExpandedTeil] = useState<number | null>(0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <IconLoader size={28} style={{ color: ACCENT }} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p style={{ color: 'var(--theme-text-muted)' }}>Không tìm thấy bài thi.</p>
      </div>
    );
  }

  if (session.status === 'GRADING') return <GradingInProgress />;

  if (session.status === 'ERROR') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3 px-8">
          <p className="text-title font-bold" style={{ color: '#EF4444' }}>Lỗi chấm bài</p>
          <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
            AI gặp sự cố khi chấm bài. Vui lòng thử lại.
          </p>
          <Link href={`/practice-test/writing/exam/${id}`}
            className="inline-block mt-3 px-4 py-2 rounded-xl text-body font-bold text-white"
            style={{ background: GRADIENT }}>
            Quay lại bài viết
          </Link>
        </div>
      </div>
    );
  }

  const score = session.totalScore ?? 0;
  const passed = score >= 60;
  const grading = session.grading ?? {};
  const userTexts = session.userTexts ?? {};

  return (
    <div className="py-6">
      <PageHeader
        backHref="/practice-test/writing/exam"
        title="Kết quả bài viết theo đề"
        accent="writingExam"
        right={
          <span className="px-3 py-1 rounded-xl text-xs font-bold"
            style={{ backgroundColor: 'rgba(168,85,247,.1)', color: ACCENT }}>
            {session.examType} {session.cefrLevel}
          </span>
        }
      />

      {/* Hero Score Card */}
      <div className="rounded-2xl border mb-5 overflow-hidden"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <div className="px-5 pt-4 pb-3 border-b text-center" style={{ borderColor: 'var(--theme-border)' }}>
          <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {session.examType} · Deutsch {session.cefrLevel} · Schreiben
          </p>
          {session.gradedAt && (
            <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
              AI chấm: {new Date(session.gradedAt).toLocaleString('vi-VN')}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-1/2 flex items-center justify-center border-b sm:border-b-0 sm:border-r py-6"
            style={{ borderColor: 'var(--theme-border)' }}>
            <ScoreRing score={score} size={128} />
          </div>
          <div className="sm:w-1/2 flex flex-col justify-center p-5 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-h2">{passed ? '✓' : '✗'}</span>
              <h2 className="text-title font-extrabold" style={{ color: passed ? '#22C55E' : '#EF4444' }}>
                {passed ? 'Bestanden!' : 'Nicht bestanden'}
              </h2>
            </div>
            <p className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>
              Gesamtergebnis: <strong style={{ color: 'var(--theme-text-primary)' }}>{Math.round(score)}%</strong>
            </p>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              {passed
                ? 'Xem lại nhận xét từ AI để cải thiện thêm.'
                : 'Đọc kỹ phần Korrekturen và Verbesserungen để cải thiện.'}
            </p>
          </div>
        </div>

        {/* Per-Teil summary */}
        {Object.keys(grading).length > 0 && (
          <div className="border-t px-5 py-4 space-y-3" style={{ borderColor: 'var(--theme-border)' }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>
              Punkte je Teil
            </p>
            {session.teile.map(teil => {
              const g = grading[`teil_${teil.number}`];
              if (!g) return null;
              const pct = g.maxPoints > 0 ? (g.score / g.maxPoints) * 100 : 0;
              return (
                <div key={teil.number}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-caption font-extrabold text-white"
                        style={{ background: GRADIENT }}>{teil.number}</span>
                      <span className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                        {taskTypeLabel(teil.taskType)}
                      </span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: getScoreColor(pct) }}>
                      {g.score}/{g.maxPoints} · {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="flex-1 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: 'var(--theme-border)' }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: getScoreColor(pct) }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed grading per Teil */}
      <div>
        <h3 className="text-body font-bold uppercase tracking-wider mb-3"
          style={{ color: 'var(--theme-text-muted)' }}>
          Chi tiết từng Teil
        </h3>
        <div className="space-y-3">
          {session.teile.map((teil, i) => {
            const g = grading[`teil_${teil.number}`];
            if (!g) return null;
            return (
              <TeilGradingCard
                key={teil.number}
                teil={teil}
                grading={g}
                userText={userTexts[`teil_${teil.number}`] ?? ''}
                expanded={expandedTeil === i}
                onToggle={() => setExpandedTeil(expandedTeil === i ? null : i)}
              />
            );
          })}
        </div>
      </div>

      <FixedActionBar columns={3}>
        <Link href="/practice-test/writing/exam"
          className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all hover:opacity-70"
          style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
          <span className="text-base">📋</span>
          Danh sách
        </Link>
        <Link href="/practice-test/writing/exam/new"
          className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5"
          style={{ background: GRADIENT }}>
          <span className="text-base">✍️</span>
          Bài mới
        </Link>
        <button
          className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all hover:opacity-70"
          style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}
          onClick={() => {
            navigator.share?.({ title: 'DeutschMeister', text: `Tôi đạt ${Math.round(score)}% bài viết ${session.examType} ${session.cefrLevel}!` }).catch(() => {});
          }}>
          <span className="text-base">🔗</span>
          Chia sẻ
        </button>
      </FixedActionBar>
    </div>
  );
}
