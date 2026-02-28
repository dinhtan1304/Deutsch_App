'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useExamSpeakingSession } from '@/hooks/useExamSpeaking';
import { ExamSpeakingTeil, TeilGrading } from '@/lib/api/examSpeaking';

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconLoader({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconChevronDown({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="6 9 12 15 18 9" /></svg>;
}
function IconChevronUp({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="18 15 12 9 6 15" /></svg>;
}
function IconTrophy({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>;
}

const ACCENT = '#F59E0B';
const GRADIENT = 'linear-gradient(135deg, #F59E0B, #EF4444)';

function getScoreColor(s: number) {
  if (s >= 80) return '#22C55E';
  if (s >= 60) return '#F59E0B';
  if (s >= 40) return '#F97316';
  return '#EF4444';
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const color = getScoreColor(pct);
  const passed = pct >= 60;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--theme-border)" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} strokeLinecap="round" />
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

// ─── Criteria bar ─────────────────────────────────────────────────────────────
function CriteriaBar({ label, score, max = 25 }: { label: string; score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = getScoreColor(pct);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>{label}</span>
        <span className="text-[12px] font-bold" style={{ color }}>{score}/{max}</span>
      </div>
      <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--theme-border)' }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

const CRITERIA_LABELS: Record<string, string> = {
  aufgabe: 'Aufgabe (Nội dung)',
  aussprache: 'Aussprache (Phát âm)',
  grammatik: 'Grammatik (Ngữ pháp)',
  wortschatz: 'Wortschatz (Từ vựng)',
};

// ─── Teil result card ──────────────────────────────────────────────────────────
function TeilResultCard({
  teil,
  grading,
  transcript,
  expanded,
  onToggle,
}: {
  teil: ExamSpeakingTeil;
  grading: TeilGrading | null;
  transcript: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [showTranscript, setShowTranscript] = useState(false);
  const score = grading?.score ?? 0;
  const color = getScoreColor(score);

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <button
        className="w-full flex items-center justify-between p-4 transition-opacity hover:opacity-80"
        onClick={onToggle}>
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-extrabold text-white shrink-0"
            style={{ background: GRADIENT }}>{teil.number}</span>
          <div className="text-left">
            <p className="text-[14px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Teil {teil.number}
            </p>
            <p className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
              {grading ? `${Math.round(score)}%` : 'Không có dữ liệu'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {grading && (
            <span className="text-[18px] font-extrabold" style={{ color }}>{Math.round(score)}%</span>
          )}
          <span style={{ color: 'var(--theme-text-muted)' }}>
            {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t space-y-4" style={{ borderColor: 'var(--theme-border)' }}>
          {/* Instruction */}
          <div className="pt-3">
            <p className="text-[12px] italic" style={{ color: 'var(--theme-text-muted)', fontFamily: 'Georgia, serif' }}>
              {teil.instruction}
            </p>
            {teil.instructionVi && (
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                {teil.instructionVi}
              </p>
            )}
          </div>

          {grading ? (
            <>
              {/* Criteria bars */}
              <div className="space-y-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
                  Tiêu chí chấm điểm
                </p>
                {(Object.entries(grading.criteriaScores) as [string, number][]).map(([key, val]) => (
                  <CriteriaBar key={key} label={CRITERIA_LABELS[key] ?? key} score={val} max={25} />
                ))}
              </div>

              {/* Feedback */}
              {grading.feedbackVi && (
                <div className="p-3 rounded-xl text-[12px] leading-relaxed"
                  style={{ backgroundColor: 'rgba(245,158,11,.06)', borderLeft: '3px solid rgba(245,158,11,.5)' }}>
                  <p style={{ color: 'var(--theme-text-primary)' }}>{grading.feedbackVi}</p>
                  {grading.feedbackDe && (
                    <p className="mt-1.5 italic" style={{ color: 'var(--theme-text-muted)', fontFamily: 'Georgia, serif' }}>
                      {grading.feedbackDe}
                    </p>
                  )}
                </div>
              )}

              {/* Strengths */}
              {grading.strengths && grading.strengths.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#22C55E' }}>
                    Điểm mạnh
                  </p>
                  <ul className="space-y-1">
                    {grading.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--theme-text-secondary)' }}>
                        <span className="text-green-500 mt-0.5">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Corrections */}
              {grading.corrections && grading.corrections.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#EF4444' }}>
                    Sửa lỗi
                  </p>
                  <ul className="space-y-1">
                    {grading.corrections.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--theme-text-secondary)' }}>
                        <span className="text-red-500 mt-0.5">✗</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
              Không có kết quả chấm điểm cho Teil này.
            </p>
          )}

          {/* Transcript collapsible */}
          {transcript && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--theme-border)' }}>
              <button
                className="w-full flex items-center justify-between p-3 text-left"
                style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
                onClick={() => setShowTranscript(v => !v)}>
                <span className="text-[12px] font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>
                  Transcript của bạn
                </span>
                {showTranscript ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
              </button>
              {showTranscript && (
                <div className="p-3 border-t text-[12px] leading-relaxed"
                  style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', fontFamily: 'Georgia, serif' }}>
                  {transcript}
                </div>
              )}
            </div>
          )}
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
  const [expandedTeil, setExpandedTeil] = useState<number | null>(1);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
        <div className="flex flex-col items-center gap-3">
          <IconLoader size={28} />
          <p className="text-[14px]" style={{ color: 'var(--theme-text-muted)' }}>Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
        <p style={{ color: 'var(--theme-text-muted)' }}>Không tìm thấy bài thi.</p>
      </div>
    );
  }

  if (session.status === 'DRAFT') {
    router.replace(`/practice-test/speaking/exam/${id}`);
    return null;
  }

  if (session.status === 'GRADING') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
        <div className="flex flex-col items-center gap-3">
          <IconLoader size={28} />
          <p className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>AI đang chấm điểm...</p>
          <p className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>Có thể mất 20–40 giây.</p>
        </div>
      </div>
    );
  }

  const teile = session.teile as ExamSpeakingTeil[];
  const grading = (session.grading ?? {}) as Record<string, TeilGrading>;
  const transcripts = (session.userTranscripts ?? {}) as Record<string, string>;
  const totalScore = session.totalScore ?? 0;
  const passed = totalScore >= 60;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/practice-test/speaking/exam"
            className="flex items-center gap-1.5 text-[13px] font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'var(--theme-text-secondary)' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Danh sách
          </Link>
          <div className="w-px h-4 shrink-0" style={{ backgroundColor: 'var(--theme-border)' }} />
          <p className="text-[13px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {session.examType} {session.cefrLevel} · Sprechen · Ergebnis
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">
        {/* Overall score card */}
        <div className="rounded-2xl border overflow-hidden"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <div className="p-5">
            <div className="flex items-center gap-5">
              <ScoreRing score={totalScore} size={112} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: passed ? '#22C55E' : '#EF4444', fontSize: 20 }}>{passed ? '✓' : '✗'}</span>
                  <h2 className="text-[17px] font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
                    {passed ? 'Bestanden!' : 'Nicht bestanden'}
                  </h2>
                </div>
                <p className="text-[13px]" style={{ color: 'var(--theme-text-secondary)' }}>
                  Gesamtergebnis: <strong style={{ color: 'var(--theme-text-primary)' }}>{Math.round(totalScore)}%</strong>
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                  {session.examType} · Deutsch {session.cefrLevel} · Sprechen
                </p>
                {session.gradedAt && (
                  <p className="text-[11px] mt-1.5" style={{ color: 'var(--theme-text-muted)' }}>
                    {new Date(session.gradedAt).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Per-Teil summary bar */}
          {teile.length > 0 && (
            <div className="border-t px-5 py-4 space-y-3" style={{ borderColor: 'var(--theme-border)' }}>
              <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>
                Ergebnisse je Teil
              </p>
              {teile.map(teil => {
                const tg = grading[String(teil.number)];
                const score = tg?.score ?? 0;
                const color = getScoreColor(score);
                return (
                  <div key={teil.number}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-extrabold text-white"
                          style={{ background: GRADIENT }}>{teil.number}</span>
                        <span className="text-[13px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                          Teil {teil.number}
                        </span>
                      </div>
                      <span className="text-[12px] font-bold" style={{ color }}>{Math.round(score)}%</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--theme-border)' }}>
                      <div className="h-2 rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Motivation card */}
        <div className="rounded-2xl border p-4 flex items-center gap-4"
          style={{
            borderColor: passed ? 'rgba(245,158,11,.3)' : 'rgba(239,68,68,.2)',
            backgroundColor: passed ? 'rgba(245,158,11,.04)' : 'rgba(239,68,68,.04)',
          }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ background: GRADIENT }}>
            <IconTrophy size={20} />
          </div>
          <div>
            <p className="text-[14px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {passed
                ? totalScore >= 80 ? 'Ausgezeichnet! Sehr gut gesprochen!' : 'Gut gesprochen! Weiter üben!'
                : 'Nicht aufgeben! Sprechen braucht Übung!'}
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              {passed
                ? 'Bạn đã vượt ngưỡng 60% — hãy tiếp tục luyện tập để đạt điểm cao hơn.'
                : 'Xem lại feedback từng Teil và thử lại. Luyện nói cần thời gian!'}
            </p>
          </div>
        </div>

        {/* Detailed per-Teil */}
        <div>
          <h3 className="text-[15px] font-extrabold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
            Xem lại chi tiết
          </h3>
          <div className="space-y-3">
            {teile.map(teil => (
              <TeilResultCard
                key={teil.number}
                teil={teil}
                grading={grading[String(teil.number)] ?? null}
                transcript={transcripts[String(teil.number)] ?? ''}
                expanded={expandedTeil === teil.number}
                onToggle={() => setExpandedTeil(expandedTeil === teil.number ? null : teil.number)}
              />
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-3 pt-2 pb-4">
          <Link href="/practice-test/speaking/exam"
            className="flex-1 py-3 rounded-2xl text-[14px] font-bold text-center border transition-opacity hover:opacity-80"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)', backgroundColor: 'var(--theme-bg-card)' }}>
            Danh sách
          </Link>
          <Link href="/practice-test/speaking/exam/new"
            className="flex-1 py-3 rounded-2xl text-[14px] font-bold text-center text-white transition-opacity hover:opacity-90"
            style={{ background: GRADIENT }}>
            Bài mới +
          </Link>
        </div>
      </div>
    </div>
  );
}
