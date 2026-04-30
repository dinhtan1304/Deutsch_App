'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useExamListeningSession } from '@/hooks/useExamListening';
import { ExamListeningTeil, TeilGradingDetail, ExamListeningQuestion } from '@/lib/api/examListening';
import { PageHeader, FixedActionBar } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

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
function IconLoader({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconVolume2({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>;
}
function IconShare({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>;
}
function IconSparkles({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M3 5h4" /><path d="M21 17v4" /><path d="M19 19h4" /></svg>;
}

function speakText(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE'; u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

function taskTypeLabel(type: string) {
  const map: Record<string, string> = {
    richtig_falsch: 'Richtig / Falsch',
    multiple_choice: 'Multiple Choice',
    zuordnung: 'Zuordnung',
  };
  return map[type] || type;
}

function scoreColor(pct: number) {
  return pct >= 80 ? STATUS.success : pct >= 60 ? STATUS.warning : STATUS.danger;
}

// ─── Score Ring ───
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const color = scoreColor(pct);
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
        <span style={{ fontSize: 11, color: passed ? STATUS.success : STATUS.danger, fontWeight: 700, marginTop: 2 }}>
          {passed ? 'Bestanden' : 'Nicht b.'}
        </span>
      </div>
    </div>
  );
}

// ─── Teil Score Bar ───
function TeilScoreBar({ correct, total }: { correct: number; total: number }) {
  const pct = total > 0 ? (correct / total) * 100 : 0;
  const color = scoreColor(pct);
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'var(--theme-border)' }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold w-14 text-right" style={{ color }}>{correct}/{total}</span>
    </div>
  );
}

// ─── Transcript Section ───
function TranscriptSection({ texts }: { texts: ExamListeningTeil['texts'] }) {
  const [show, setShow] = useState(false);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--theme-border)' }}>
      <button
        className="w-full flex items-center justify-between p-3 transition-colors hover:opacity-80"
        style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
        onClick={() => setShow(v => !v)}>
        <div className="flex items-center gap-2">
          <IconVolume2 size={14} style={{ color: ACCENT.listening }} />
          <span className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
            {show ? 'Ẩn transcript' : 'Xem transcript (audio text)'}
          </span>
        </div>
        {show ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
      </button>
      {show && (
        <div className="p-3 space-y-3 border-t" style={{ borderColor: 'var(--theme-border)' }}>
          {texts.map(text => (
            <div key={text.id}>
              {(text.label || text.title) && (
                <div className="flex items-center gap-2 mb-1">
                  {text.label && (
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-caption font-extrabold text-white"
                      style={{ background: GRADIENT.listening }}>{text.label}</span>
                  )}
                  {text.title && <p className="text-xs font-bold" style={{ color: 'var(--theme-text-primary)' }}>{text.title}</p>}
                </div>
              )}
              <p className="text-xs leading-relaxed whitespace-pre-wrap"
                style={{ color: 'var(--theme-text-primary)', fontFamily: 'Georgia, serif' }}>
                {text.content}
              </p>
              <button onClick={() => speakText(text.content)}
                className="flex items-center gap-1 mt-1.5 text-caption font-semibold"
                style={{ color: ACCENT.listening }}>
                <IconVolume2 size={11} style={{ color: ACCENT.listening }} /> Nghe lại
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Question Review ───
function QuestionReview({ teil, details }: { teil: ExamListeningTeil; details: TeilGradingDetail[] }) {
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const detailMap = Object.fromEntries(details.map(d => [d.questionId, d]));

  return (
    <div className="mt-3 space-y-2">
      {(teil.questions as ExamListeningQuestion[]).map((q, i) => {
        const detail = detailMap[q.id];
        if (!detail) return null;
        const expanded = expandedQ === q.id;
        return (
          <div key={q.id} className="rounded-xl border overflow-hidden"
            style={{ borderColor: detail.isCorrect ? `${STATUS.success}4D` : `${STATUS.danger}4D` }}>
            <button
              className="w-full flex items-start gap-3 p-3 text-left transition-colors hover:opacity-80"
              style={{ backgroundColor: detail.isCorrect ? `${STATUS.success}0D` : `${STATUS.danger}0D` }}
              onClick={() => setExpandedQ(expanded ? null : q.id)}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white"
                style={{ backgroundColor: detail.isCorrect ? STATUS.success : STATUS.danger }}>
                {detail.isCorrect ? <IconCheck size={12} /> : <IconX size={12} />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                  {i + 1}. {q.questionText}
                </p>
                {!detail.isCorrect && (
                  <p className="text-xs mt-0.5" style={{ color: STATUS.danger }}>
                    Bạn: <strong>{detail.userAnswer ?? '—'}</strong> · Đáp án: <strong>{detail.correctAnswer}</strong>
                  </p>
                )}
              </div>
              <span className="shrink-0 mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                {expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
              </span>
            </button>

            {expanded && (
              <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--theme-border)' }}>
                <div className="flex gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span style={{ color: 'var(--theme-text-muted)' }}>Bạn trả lời:</span>
                    <span className="font-bold px-2 py-0.5 rounded-lg"
                      style={{ backgroundColor: detail.isCorrect ? `${STATUS.success}1A` : `${STATUS.danger}1A`, color: detail.isCorrect ? STATUS.success : STATUS.danger }}>
                      {detail.userAnswer ?? '(bỏ qua)'}
                    </span>
                  </div>
                  {!detail.isCorrect && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span style={{ color: 'var(--theme-text-muted)' }}>Đúng:</span>
                      <span className="font-bold px-2 py-0.5 rounded-lg" style={{ backgroundColor: `${STATUS.success}1A`, color: STATUS.success }}>{detail.correctAnswer}</span>
                    </div>
                  )}
                </div>
                {q.options && q.options.length > 0 && (
                  <div className="space-y-1">
                    {q.options.map(opt => {
                      const isUser = detail.userAnswer === opt.id;
                      const isCorrect = detail.correctAnswer === opt.id;
                      return (
                        <div key={opt.id} className="flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-xs"
                          style={{
                            backgroundColor: isCorrect ? `${STATUS.success}14` : isUser && !isCorrect ? `${STATUS.danger}14` : 'transparent',
                            color: isCorrect ? STATUS.success : isUser && !isCorrect ? STATUS.danger : 'var(--theme-text-secondary)',
                          }}>
                          <span className="font-bold w-4 shrink-0">{opt.id.toUpperCase()})</span>
                          <span>{opt.text}</span>
                          {isCorrect && <IconCheck size={13} />}
                          {isUser && !isCorrect && <IconX size={13} />}
                        </div>
                      );
                    })}
                  </div>
                )}
                {detail.explanationVi && (
                  <div className="rounded-xl p-2.5 text-xs leading-relaxed space-y-1.5"
                    style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
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

// ─── Main Page ───
export default function ExamListeningResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isLoading } = useExamListeningSession(id);
  const [expandedTeil, setExpandedTeil] = useState<number | null>(null);

  useEffect(() => {
    if (session?.status === 'DRAFT') {
      router.replace(`/practice-test/listening/exam/${id}`);
    }
  }, [session?.status, id, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <IconLoader size={28} style={{ color: ACCENT.listening }} />
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (!session || session.status === 'DRAFT') return null;

  const score = session.score ?? 0;
  const passed = score >= 60;
  const teile = session.teile as ExamListeningTeil[];
  const teilScores = session.teilScores ?? [];
  const gradingDetails = session.gradingDetails ?? {};
  const teilScoreMap = Object.fromEntries(teilScores.map(ts => [ts.teil, ts]));

  return (
    <div className="py-6">
      <PageHeader
        backHref="/practice-test/listening/exam"
        title="Kết quả bài nghe theo đề"
        accent="listening"
        right={
          <span className="px-3 py-1 rounded-xl text-xs font-bold"
            style={{ backgroundColor: `${ACCENT.listening}1A`, color: ACCENT.listening }}>
            {session.examType} {session.cefrLevel}
          </span>
        }
      />

      <div className="rounded-2xl border mb-5 overflow-hidden"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <div className="px-5 pt-4 pb-3 border-b text-center" style={{ borderColor: 'var(--theme-border)' }}>
          <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {session.examType} · Deutsch {session.cefrLevel} · Hören
          </p>
          {session.submittedAt && (
            <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
              {new Date(session.submittedAt).toLocaleString('vi-VN')}
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
              <h2 className="text-title font-extrabold" style={{ color: passed ? STATUS.success : STATUS.danger }}>
                {passed ? 'Bestanden!' : 'Nicht bestanden'}
              </h2>
            </div>
            <p className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>
              Gesamtergebnis: <strong style={{ color: 'var(--theme-text-primary)' }}>
                {session.correctCount} / {session.totalQuestions}
              </strong> richtig
            </p>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { label: 'Đúng', value: session.correctCount,                                          color: STATUS.success, bg: `${STATUS.success}1A` },
                { label: 'Sai',  value: (session.totalQuestions ?? 0) - (session.correctCount ?? 0),  color: STATUS.danger,  bg: `${STATUS.danger}1A` },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center gap-1 rounded-xl py-3"
                  style={{ backgroundColor: s.bg }}>
                  <span className="text-title font-extrabold leading-none" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {teilScores.length > 0 && (
          <div className="border-t px-5 py-4 space-y-3" style={{ borderColor: 'var(--theme-border)' }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>
              Ergebnisse je Teil
            </p>
            {teilScores.map(ts => {
              const teil = teile.find(t => t.number === ts.teil);
              const pct = ts.total > 0 ? (ts.correct / ts.total) * 100 : 0;
              return (
                <div key={ts.teil}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-caption font-extrabold text-white"
                        style={{ background: GRADIENT.listening }}>{ts.teil}</span>
                      <span className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                        {teil ? taskTypeLabel(teil.taskType) : `Teil ${ts.teil}`}
                      </span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: scoreColor(pct) }}>
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <TeilScoreBar correct={ts.correct} total={ts.total} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-body font-bold uppercase tracking-wider mb-3"
          style={{ color: 'var(--theme-text-muted)' }}>
          Xem lại chi tiết
        </h3>
        <div className="space-y-3">
          {teile.map(teil => {
            const ts = teilScoreMap[teil.number];
            const details = (gradingDetails as Record<string, TeilGradingDetail[]>)[`teil_${teil.number}`] ?? [];
            const isExpanded = expandedTeil === teil.number;
            const pct = ts ? (ts.total > 0 ? (ts.correct / ts.total) * 100 : 0) : 0;

            return (
              <div key={teil.number} className="rounded-2xl border overflow-hidden"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                <button
                  className="w-full flex items-center justify-between p-4 transition-opacity hover:opacity-80"
                  onClick={() => setExpandedTeil(isExpanded ? null : teil.number)}>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold text-white"
                      style={{ background: GRADIENT.listening }}>{teil.number}</span>
                    <div className="text-left">
                      <p className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                        {taskTypeLabel(teil.taskType)}
                      </p>
                      {ts && (
                        <p className="text-xs" style={{ color: scoreColor(pct) }}>
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
                    <div className="py-3">
                      <p className="text-xs italic" style={{ color: 'var(--theme-text-muted)', fontFamily: 'Georgia, serif' }}>
                        {teil.instruction}
                      </p>
                    </div>
                    <TranscriptSection texts={teil.texts} />
                    <QuestionReview teil={teil} details={details} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <FixedActionBar columns={2}>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border-2 transition-all hover:bg-black/5"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', backgroundColor: 'var(--theme-bg-card)' }}
          onClick={() => {
            navigator.share?.({ title: 'DeutschMeister', text: `Tôi đạt ${Math.round(score)}% bài nghe ${session.examType} ${session.cefrLevel}!` }).catch(() => {});
          }}>
          <IconShare size={16} /> Chia sẻ
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 shadow-lg"
          style={{ background: GRADIENT.listening, boxShadow: `0 8px 24px ${ACCENT.listening}40` }}
          onClick={() => router.push('/practice-test/listening/exam/new')}>
          <IconSparkles size={16} /> Bài mới
        </button>
      </FixedActionBar>
    </div>
  );
}
