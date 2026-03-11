'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useExamReadingSession } from '@/hooks/useExamReading';
import { ExamReadingTeil, TeilScore, TeilGradingDetail, ExamTeilQuestion } from '@/lib/api/examReading';

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconCheck({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="20 6 9 17 4 12" /></svg>;
}
function IconX({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function IconChevronDown({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="6 9 12 15 18 9" /></svg>;
}
function IconChevronUp({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="18 15 12 9 6 15" /></svg>;
}
function IconLoader({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconTrophy({ size = 32 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>;
}

const ACCENT = '#22C55E';
const GRADIENT = 'linear-gradient(135deg, #22C55E, #14B8A6)';

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
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
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{Math.round(pct)}%</span>
        <span style={{ fontSize: 11, color: passed ? ACCENT : '#EF4444', fontWeight: 700, marginTop: 2 }}>
          {passed ? 'Bestanden' : 'Nicht b.'}
        </span>
      </div>
    </div>
  );
}

// ─── Teil Score Bar ───────────────────────────────────────────────────────────
function TeilScoreBar({ score, maxPoints, correct, total }: { score: number; maxPoints: number; correct: number; total: number }) {
  void maxPoints; // display info only
  const pct = total > 0 ? (correct / total) * 100 : 0;
  const color = pct >= 80 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'var(--theme-border)' }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[12px] font-semibold w-14 text-right" style={{ color }}>{correct}/{total}</span>
    </div>
  );
}

// ─── Task Type label ─────────────────────────────────────────────────────────
function taskTypeLabel(type: string) {
  const map: Record<string, string> = {
    richtig_falsch: 'Richtig / Falsch',
    multiple_choice: 'Multiple Choice',
    zuordnung: 'Zuordnung',
    ja_nein: 'Ja / Nein',
    sprachbausteine: 'Sprachbausteine',
  };
  return map[type] || type;
}

// ─── Question Review ──────────────────────────────────────────────────────────
function QuestionReview({ teil, details }: { teil: ExamReadingTeil; details: TeilGradingDetail[] }) {
  const [showPassage, setShowPassage] = useState(false);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const detailMap = Object.fromEntries(details.map(d => [d.questionId, d]));

  return (
    <div className="mt-3 space-y-3">
      {/* Collapsible texts */}
      {teil.texts.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--theme-border)' }}>
          <button
            className="w-full flex items-center justify-between p-3 transition-colors hover:opacity-80"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
            onClick={() => setShowPassage(v => !v)}
          >
            <span className="text-[13px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
              {showPassage ? 'Ẩn văn bản' : 'Xem lại văn bản'}
            </span>
            {showPassage ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          </button>
          {showPassage && (
            <div className="p-3 space-y-3 border-t" style={{ borderColor: 'var(--theme-border)' }}>
              {teil.texts.map(text => (
                <div key={text.id}>
                  {(text.label || text.title) && (
                    <div className="flex items-center gap-2 mb-1">
                      {text.label && (
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-extrabold text-white"
                          style={{ background: GRADIENT }}>{text.label}</span>
                      )}
                      {text.title && <p className="text-[12px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{text.title}</p>}
                    </div>
                  )}
                  <p className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--theme-text-primary)', fontFamily: 'Georgia, serif' }}>
                    {text.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Questions */}
      {(teil.questions as ExamTeilQuestion[]).map((q, i) => {
        const detail = detailMap[q.id];
        if (!detail) return null;
        const expanded = expandedQ === q.id;
        return (
          <div key={q.id} className="rounded-xl border overflow-hidden"
            style={{ borderColor: detail.isCorrect ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)' }}>
            <button
              className="w-full flex items-start gap-3 p-3 text-left transition-colors hover:opacity-80"
              style={{ backgroundColor: detail.isCorrect ? 'rgba(34,197,94,.05)' : 'rgba(239,68,68,.05)' }}
              onClick={() => setExpandedQ(expanded ? null : q.id)}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${detail.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                {detail.isCorrect ? <IconCheck size={12} /> : <IconX size={12} />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                  {i + 1}. {q.questionText}
                </p>
                {!detail.isCorrect && (
                  <p className="text-[12px] mt-0.5" style={{ color: '#EF4444' }}>
                    Bạn: <strong>{detail.userAnswer ?? '—'}</strong> · Đáp án: <strong>{detail.correctAnswer}</strong>
                  </p>
                )}
              </div>
              <span className="flex-shrink-0 mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                {expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
              </span>
            </button>

            {expanded && (
              <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--theme-border)' }}>
                {/* Answer comparison */}
                <div className="flex gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--theme-text-secondary)' }}>
                    <span style={{ color: 'var(--theme-text-muted)' }}>Bạn trả lời:</span>
                    <span className="font-bold px-2 py-0.5 rounded-lg"
                      style={{ backgroundColor: detail.isCorrect ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', color: detail.isCorrect ? '#22C55E' : '#EF4444' }}>
                      {detail.userAnswer ?? '(bỏ qua)'}
                    </span>
                  </div>
                  {!detail.isCorrect && (
                    <div className="flex items-center gap-1.5 text-[12px]">
                      <span style={{ color: 'var(--theme-text-muted)' }}>Đúng:</span>
                      <span className="font-bold px-2 py-0.5 rounded-lg bg-green-500/10 text-green-500">{detail.correctAnswer}</span>
                    </div>
                  )}
                </div>
                {/* MCQ options */}
                {q.options && q.options.length > 0 && (
                  <div className="space-y-1">
                    {q.options.map(opt => {
                      const isUser = detail.userAnswer === opt.id;
                      const isCorrect = detail.correctAnswer === opt.id;
                      return (
                        <div key={opt.id} className="flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-[12px]"
                          style={{
                            backgroundColor: isCorrect ? 'rgba(34,197,94,.08)' : isUser && !isCorrect ? 'rgba(239,68,68,.08)' : 'transparent',
                            color: isCorrect ? '#22C55E' : isUser && !isCorrect ? '#EF4444' : 'var(--theme-text-secondary)',
                          }}>
                          <span className="font-bold w-4 flex-shrink-0">{opt.id.toUpperCase()})</span>
                          <span>{opt.text}</span>
                          {isCorrect && <IconCheck size={13} />}
                          {isUser && !isCorrect && <IconX size={13} />}
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Explanations */}
                {detail.explanationVi && (
                  <div className="rounded-xl p-2.5 text-[12px] leading-relaxed space-y-1.5" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                    <p style={{ color: 'var(--theme-text-primary)' }}>🇻🇳 {detail.explanationVi}</p>
                    {detail.explanationDe && (
                      <p style={{ color: 'var(--theme-text-secondary)', fontStyle: 'italic' }}>🇩🇪 {detail.explanationDe}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExamReadingResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isLoading } = useExamReadingSession(id);
  const [expandedTeil, setExpandedTeil] = useState<number | null>(null);

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

  // If session is still DRAFT (not submitted), redirect back
  useEffect(() => {
    if (session?.status === 'DRAFT') {
      router.replace(`/practice-test/reading/exam/${id}`);
    }
  }, [session?.status, id, router]);

  if (session.status === 'DRAFT') return null;

  const score = session.score ?? 0;
  const passed = score >= 60;
  const teile = session.teile;
  const teilScores = session.teilScores ?? [];
  const gradingDetails = session.gradingDetails ?? {};

  const teilScoreMap = Object.fromEntries(teilScores.map(ts => [ts.teil, ts]));

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/practice-test/reading/exam"
            className="flex items-center gap-1.5 text-[13px] font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'var(--theme-text-secondary)' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Danh sách
          </Link>
          <div className="w-px h-4 flex-shrink-0" style={{ backgroundColor: 'var(--theme-border)' }} />
          <p className="text-[13px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {session.examType} {session.cefrLevel} · Lesen · Ergebnis
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">
        {/* Score card */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <div className="p-5">
            <div className="flex items-center gap-5">
              <ScoreRing score={score} size={112} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: passed ? ACCENT : '#EF4444', fontSize: 20 }}>{passed ? '✓' : '✗'}</span>
                  <h2 className="text-[17px] font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
                    {passed ? 'Bestanden!' : 'Nicht bestanden'}
                  </h2>
                </div>
                <p className="text-[13px]" style={{ color: 'var(--theme-text-secondary)' }}>
                  Gesamtergebnis: <strong style={{ color: 'var(--theme-text-primary)' }}>{session.correctCount} / {session.totalQuestions}</strong> richtig
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                  {session.examType} · Deutsch {session.cefrLevel} · Lesen
                </p>
                {session.submittedAt && (
                  <p className="text-[11px] mt-1.5" style={{ color: 'var(--theme-text-muted)' }}>
                    {new Date(session.submittedAt).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Per-Teil breakdown */}
          {teilScores.length > 0 && (
            <div className="border-t px-5 py-4 space-y-3" style={{ borderColor: 'var(--theme-border)' }}>
              <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>Ergebnisse je Teil</p>
              {teilScores.map(ts => {
                const teil = teile.find(t => t.number === ts.teil);
                const pct = ts.total > 0 ? (ts.correct / ts.total) * 100 : 0;
                return (
                  <div key={ts.teil}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-extrabold text-white"
                          style={{ background: GRADIENT }}>{ts.teil}</span>
                        <span className="text-[13px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                          {teil ? taskTypeLabel(teil.taskType) : `Teil ${ts.teil}`}
                        </span>
                      </div>
                      <span className="text-[12px] font-bold" style={{ color: pct >= 60 ? ACCENT : '#EF4444' }}>
                        {Math.round(pct)}%
                      </span>
                    </div>
                    <TeilScoreBar score={pct} maxPoints={ts.maxPoints} correct={ts.correct} total={ts.total} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Trophy / encouragement */}
        <div className="rounded-2xl border p-4 flex items-center gap-4"
          style={{ borderColor: passed ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.2)', backgroundColor: passed ? 'rgba(34,197,94,.04)' : 'rgba(239,68,68,.04)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: GRADIENT }}>
            <IconTrophy size={20} />
          </div>
          <div>
            <p className="text-[14px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {passed
                ? score >= 80 ? 'Ausgezeichnet! Sehr gut gemacht!' : 'Gut gemacht! Weiter so!'
                : 'Nicht aufgeben! Übung macht den Meister!'}
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              {passed
                ? 'Bạn đã vượt ngưỡng 60% — tiếp tục luyện tập để đạt điểm cao hơn.'
                : 'Hãy xem lại các câu sai và thử lại. Bạn sẽ làm được!'}
            </p>
          </div>
        </div>

        {/* Detailed review per Teil */}
        <div>
          <h3 className="text-[15px] font-extrabold mb-3" style={{ color: 'var(--theme-text-primary)' }}>Xem lại chi tiết</h3>
          <div className="space-y-3">
            {teile.map(teil => {
              const ts = teilScoreMap[teil.number];
              const details = gradingDetails[`teil_${teil.number}`] ?? [];
              const isExpanded = expandedTeil === teil.number;
              const pct = ts ? (ts.total > 0 ? (ts.correct / ts.total) * 100 : 0) : 0;

              return (
                <div key={teil.number} className="rounded-2xl border overflow-hidden"
                  style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                  <button
                    className="w-full flex items-center justify-between p-4 transition-opacity hover:opacity-80"
                    onClick={() => setExpandedTeil(isExpanded ? null : teil.number)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-extrabold text-white"
                        style={{ background: GRADIENT }}>{teil.number}</span>
                      <div className="text-left">
                        <p className="text-[14px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                          {taskTypeLabel(teil.taskType)}
                        </p>
                        {ts && (
                          <p className="text-[12px]" style={{ color: pct >= 60 ? ACCENT : '#EF4444' }}>
                            {ts.correct}/{ts.total} richtig · {Math.round(pct)}%
                          </p>
                        )}
                      </div>
                    </div>
                    <span style={{ color: 'var(--theme-text-muted)' }}>
                      {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                      {/* Instruction */}
                      <div className="py-3">
                        <p className="text-[12px] italic" style={{ color: 'var(--theme-text-muted)', fontFamily: 'Georgia, serif' }}>
                          {teil.instruction}
                        </p>
                      </div>
                      <QuestionReview teil={teil} details={details} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-3 pt-2 pb-4">
          <Link href="/practice-test/reading/exam"
            className="flex-1 py-3 rounded-2xl text-[14px] font-bold text-center border transition-opacity hover:opacity-80"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)', backgroundColor: 'var(--theme-bg-card)' }}>
            Danh sách
          </Link>
          <Link href="/practice-test/reading/exam/new"
            className="flex-1 py-3 rounded-2xl text-[14px] font-bold text-center text-white transition-opacity hover:opacity-90"
            style={{ background: GRADIENT }}>
            Bài mới +
          </Link>
        </div>
      </div>
    </div>
  );
}
