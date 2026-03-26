'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useExamReadingSession, useSubmitExamReading } from '@/hooks/useExamReading';
import { ExamReadingTeil, ExamTeilQuestion } from '@/lib/api/examReading';

// ─── Inline icons ─────────────────────────────────────────────────────────────
function IconChevronLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronRight({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="9 18 15 12 9 6" /></svg>;
}
function IconLoader({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconVolume2({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>;
}
function IconCheck({ size = 10 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="20 6 9 17 4 12" /></svg>;
}

const ACCENT = '#22C55E';
const GRADIENT = 'linear-gradient(135deg, #22C55E, #14B8A6)';

function speakText(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE'; u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

// ─── TextCard ─────────────────────────────────────────────────────────────────
// label can be a short badge (≤3 chars: "A","1") OR a long text description
function TextCard({ text }: { text: ExamReadingTeil['texts'][0] }) {
  const shortLabel = text.label && text.label.length <= 3;
  const longLabel = text.label && text.label.length > 3;

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
      {/* Header: badge (short) or tag (long) + title */}
      {(text.label || text.title) && (
        <div className="mb-2">
          {shortLabel && (
            <div className="flex items-center gap-2 mb-1">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-extrabold text-white shrink-0"
                style={{ background: GRADIENT }}>{text.label}</span>
              {text.title && <p className="text-[13px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{text.title}</p>}
            </div>
          )}
          {longLabel && (
            <div className="mb-1.5">
              <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg text-white"
                style={{ background: GRADIENT }}>{text.label}</span>
              {text.title && <p className="text-[13px] font-bold mt-1" style={{ color: 'var(--theme-text-primary)' }}>{text.title}</p>}
            </div>
          )}
          {!text.label && text.title && (
            <p className="text-[13px] font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>{text.title}</p>
          )}
        </div>
      )}
      {text.author && <p className="text-[11px] mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>von {text.author}</p>}
      <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--theme-text-primary)', fontFamily: 'Georgia, serif' }}>
        {text.content}
      </p>
      <button onClick={() => speakText(text.content)}
        className="mt-2 p-1.5 rounded-lg transition-all hover:scale-110 flex items-center gap-1 text-[11px]"
        style={{ color: ACCENT }}>
        <IconVolume2 size={13} /> Nghe
      </button>
    </div>
  );
}

// ─── Teil Renderers ───────────────────────────────────────────────────────────

function RichtigFalschTeil({ teil, answers, onAnswer }: { teil: ExamReadingTeil; answers: Record<string, string>; onAnswer: (qid: string, val: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {teil.texts.map(t => <TextCard key={t.id} text={t} />)}
      </div>
      <div className="space-y-3">
        {(teil.questions as ExamTeilQuestion[]).map((q, i) => (
          <div key={q.id} className="rounded-xl border p-3" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <p className="text-[13px] font-semibold mb-2.5" style={{ color: 'var(--theme-text-primary)' }}>
              {i + 1}. {q.questionText}
            </p>
            <div className="flex gap-2">
              {[{ id: 'richtig', label: 'Richtig ✓' }, { id: 'falsch', label: 'Falsch ✗' }].map(opt => {
                const sel = answers[q.id] === opt.id;
                return (
                  <button key={opt.id} onClick={() => onAnswer(q.id, opt.id)}
                    className="flex-1 py-2 rounded-xl text-[13px] font-semibold border-2 transition-all"
                    style={sel
                      ? { borderColor: opt.id === 'richtig' ? '#22C55E' : '#EF4444', backgroundColor: opt.id === 'richtig' ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', color: opt.id === 'richtig' ? '#22C55E' : '#EF4444' }
                      : { borderColor: 'var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)' }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JaNeinTeil({ teil, answers, onAnswer }: { teil: ExamReadingTeil; answers: Record<string, string>; onAnswer: (qid: string, val: string) => void }) {
  const thema = teil.texts.find(t => t.id === 'thema' || t.type === 'thema');
  const opinions = teil.texts.filter(t => t.id !== 'thema' && t.type !== 'thema');

  return (
    <div className="space-y-4">
      {thema && (
        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'rgba(34,197,94,.06)' }}>
          <p className="text-[12px] font-bold mb-1" style={{ color: 'var(--theme-text-muted)' }}>THEMA</p>
          <p className="text-[14px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{thema.content}</p>
        </div>
      )}
      <div className="space-y-3">
        {(teil.questions as ExamTeilQuestion[]).map((q, i) => {
          const person = opinions[i] || opinions.find(o => o.label?.includes(`${i + 1}`) || o.id === `p${i + 1}`);
          return (
            <div key={q.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--theme-border)' }}>
              {person && (
                <div className="p-3 border-b" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                  {person.label && <p className="text-[11px] font-bold mb-1" style={{ color: ACCENT }}>{person.label}</p>}
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-primary)', fontFamily: 'Georgia, serif' }}>{person.content}</p>
                </div>
              )}
              <div className="p-3" style={{ backgroundColor: 'var(--theme-bg-card)' }}>
                <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>{q.questionText}</p>
                <div className="flex gap-2">
                  {[{ id: 'ja', label: 'Ja — Dafür ✓' }, { id: 'nein', label: 'Nein — Dagegen ✗' }].map(opt => {
                    const sel = answers[q.id] === opt.id;
                    return (
                      <button key={opt.id} onClick={() => onAnswer(q.id, opt.id)}
                        className="flex-1 py-2 rounded-xl text-[12px] font-semibold border-2 transition-all"
                        style={sel
                          ? { borderColor: opt.id === 'ja' ? '#22C55E' : '#EF4444', backgroundColor: opt.id === 'ja' ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', color: opt.id === 'ja' ? '#22C55E' : '#EF4444' }
                          : { borderColor: 'var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)' }}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MCQTeil({ teil, answers, onAnswer }: { teil: ExamReadingTeil; answers: Record<string, string>; onAnswer: (qid: string, val: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {teil.texts.map(t => <TextCard key={t.id} text={t} />)}
      </div>
      <div className="space-y-5">
        {(teil.questions as ExamTeilQuestion[]).map((q, i) => (
          <div key={q.id}>
            <p className="text-[13px] font-semibold mb-2.5" style={{ color: 'var(--theme-text-primary)' }}>
              {i + 1}. {q.questionText}
            </p>
            <div className="space-y-2">
              {(q.options || []).map(opt => {
                const sel = answers[q.id] === opt.id;
                return (
                  <button key={opt.id} onClick={() => onAnswer(q.id, opt.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-[13px] text-left transition-all"
                    style={sel
                      ? { borderColor: ACCENT, backgroundColor: 'rgba(34,197,94,.08)', color: ACCENT }
                      : { borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-secondary)' }}>
                    <span className="font-bold shrink-0 w-5 text-center">{opt.id.toUpperCase()}.</span>
                    <span className="flex-1">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ZuordnungTeil({ teil, answers, onAnswer }: { teil: ExamReadingTeil; answers: Record<string, string>; onAnswer: (qid: string, val: string) => void }) {
  const labels = teil.texts.map(t => t.label || t.id).filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Texts grid */}
      <div className="grid sm:grid-cols-2 gap-3">
        {teil.texts.map(t => <TextCard key={t.id} text={t} />)}
      </div>
      {/* Questions with dropdown */}
      <div className="space-y-2.5">
        {(teil.questions as ExamTeilQuestion[]).map((q, i) => (
          <div key={q.id} className="rounded-xl border p-3"
            style={{ borderColor: answers[q.id] ? 'rgba(34,197,94,.3)' : 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <p className="text-[13px] font-semibold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
              {i + 1}. {q.questionText}
            </p>
            <select
              value={answers[q.id] || ''}
              onChange={e => onAnswer(q.id, e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-[13px] font-semibold outline-none"
              style={{
                borderColor: answers[q.id] ? ACCENT : 'var(--theme-border)',
                backgroundColor: 'var(--theme-bg-secondary)',
                color: answers[q.id] ? ACCENT : 'var(--theme-text-secondary)',
              }}>
              <option value="">— Bitte wählen —</option>
              {labels.map(lbl => (
                <option key={lbl} value={lbl}>{lbl}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function SprachbausteineTeil({ teil, answers, onAnswer }: { teil: ExamReadingTeil; answers: Record<string, string>; onAnswer: (qid: string, val: string) => void }) {
  const text = teil.texts[0]?.content || '';
  const questions = teil.questions as ExamTeilQuestion[];
  const wordBank = teil.wordBank || [];
  const parts = text.split(/\[GAP_(\d+)\]/g);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4 leading-loose text-[14px]"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)', fontFamily: 'Georgia, serif', color: 'var(--theme-text-primary)' }}>
        {parts.map((part, idx) => {
          if (idx % 2 === 0) return <span key={idx}>{part}</span>;
          const gapNum = parseInt(part);
          const q = questions.find(qq => qq.id === `q${gapNum}`);
          if (!q) return <span key={idx}>[{gapNum}]</span>;
          const val = answers[q.id];
          const opts = q.options && q.options.length > 0 ? q.options : null;
          return (
            <span key={idx} className="inline-block mx-0.5 align-middle">
              <select value={val || ''} onChange={e => onAnswer(q.id, e.target.value)}
                className="px-2 py-0.5 rounded-lg border text-[12px] font-semibold outline-none"
                style={{ borderColor: val ? ACCENT : 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', color: val ? ACCENT : 'var(--theme-text-muted)', minWidth: '80px' }}>
                <option value="">___</option>
                {opts
                  ? opts.map(o => <option key={o.id} value={o.id}>{o.text || o.id}</option>)
                  : wordBank.map(w => <option key={w} value={w}>{w}</option>)
                }
              </select>
            </span>
          );
        })}
      </div>
      {wordBank.length > 0 && (
        <div className="rounded-xl border p-3" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <p className="text-[11px] font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>Wortliste</p>
          <div className="flex flex-wrap gap-2">
            {wordBank.map(w => (
              <span key={w} className="px-2.5 py-1 rounded-lg text-[12px] font-medium border"
                style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', borderColor: 'var(--theme-border)' }}>
                {w}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TeilRenderer({ teil, answers, onAnswer }: { teil: ExamReadingTeil; answers: Record<string, string>; onAnswer: (qid: string, val: string) => void }) {
  switch (teil.taskType) {
    case 'richtig_falsch':  return <RichtigFalschTeil  teil={teil} answers={answers} onAnswer={onAnswer} />;
    case 'ja_nein':         return <JaNeinTeil          teil={teil} answers={answers} onAnswer={onAnswer} />;
    case 'multiple_choice': return <MCQTeil             teil={teil} answers={answers} onAnswer={onAnswer} />;
    case 'zuordnung':       return <ZuordnungTeil       teil={teil} answers={answers} onAnswer={onAnswer} />;
    case 'sprachbausteine': return <SprachbausteineTeil teil={teil} answers={answers} onAnswer={onAnswer} />;
    default: return <p style={{ color: 'var(--theme-text-muted)' }}>Loại câu hỏi không được hỗ trợ.</p>;
  }
}

const TASK_TYPE_LABELS: Record<string, string> = {
  richtig_falsch: 'Richtig / Falsch',
  multiple_choice: 'Multiple Choice',
  zuordnung: 'Zuordnung',
  ja_nein: 'Ja / Nein',
  sprachbausteine: 'Sprachbausteine',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExamReadingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isLoading } = useExamReadingSession(id);
  const submitMut = useSubmitExamReading();

  const [userAnswers, setUserAnswers] = useState<Record<string, Record<string, string>>>({});
  const [currentTeil, setCurrentTeil] = useState(0);
  const [error, setError] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const handleAnswer = useCallback((teilNumber: number, qid: string, val: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [`teil_${teilNumber}`]: { ...(prev[`teil_${teilNumber}`] || {}), [qid]: val },
    }));
  }, []);

  useEffect(() => {
    if (session?.status === 'GRADED') {
      router.replace(`/practice-test/reading/exam/${id}/result`);
    }
  }, [session?.status, id, router]);

  if (isLoading) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <IconLoader size={32} style={{ color: ACCENT }} />
          <p style={{ color: 'var(--theme-text-muted)' }}>Đang tải bài thi...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-6 text-center">
        <p className="mb-4" style={{ color: 'var(--theme-text-muted)' }}>Không tìm thấy bài thi.</p>
        <Link href="/practice-test/reading/exam" className="text-[14px] font-semibold" style={{ color: ACCENT }}>Quay lại</Link>
      </div>
    );
  }

  if (session.status === 'GRADED') return null;

  const teile = session.teile as ExamReadingTeil[];
  const teil = teile[currentTeil];
  const teilKey = `teil_${teil.number}`;
  const teilAnswers = userAnswers[teilKey] || {};
  const teilAnsweredCount = Object.keys(teilAnswers).length;
  const teilTotalQ = teil.questions.length;
  const teilDone = teilAnsweredCount >= teilTotalQ;

  const totalAnswered = teile.reduce((sum, t) =>
    sum + Object.keys(userAnswers[`teil_${t.number}`] || {}).length, 0);
  const totalQ = session.totalQuestions;
  const allAnswered = totalAnswered >= totalQ;

  const examColor = session.examType === 'GOETHE' ? '#3B82F6' : '#8B5CF6';

  const handleSubmit = async () => {
    setConfirmSubmit(false);
    setError('');
    try {
      await submitMut.mutateAsync({ id, userAnswers });
      router.push(`/practice-test/reading/exam/${id}/result`);
    } catch {
      setError('Không thể nộp bài. Vui lòng thử lại.');
    }
  };

  const isLastTeil = currentTeil === teile.length - 1;

  return (
    <div className="py-6">

      {/* ── Top bar: back + exam badge + total progress ── */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/practice-test/reading/exam"
          className="flex items-center gap-1 text-[13px] font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--theme-text-muted)' }}>
          <IconChevronLeft size={14} /> Thoát
        </Link>
        <div className="flex-1" />
        <span className="text-[12px] font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
          {totalAnswered}/{totalQ} câu
        </span>
        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold"
          style={{ backgroundColor: `${examColor}18`, color: examColor }}>
          {session.examType} · {session.cefrLevel}
        </span>
      </div>

      {/* ── Overall progress bar (thin, always visible) ── */}
      <div className="h-1 rounded-full mb-4 overflow-hidden" style={{ backgroundColor: 'var(--theme-border)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${totalQ > 0 ? (totalAnswered / totalQ) * 100 : 0}%`, background: GRADIENT }} />
      </div>

      {/* ── Teil navigation tabs ── */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
        {teile.map((t, i) => {
          const tAnswered = Object.keys(userAnswers[`teil_${t.number}`] || {}).length;
          const tTotal = t.questions.length;
          const isCurrent = i === currentTeil;
          const isDone = tAnswered >= tTotal;
          return (
            <button key={t.number} onClick={() => setCurrentTeil(i)}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all border"
              style={isCurrent
                ? { background: GRADIENT, color: 'white', borderColor: 'transparent' }
                : isDone
                  ? { backgroundColor: 'rgba(34,197,94,.08)', color: '#22C55E', borderColor: 'rgba(34,197,94,.3)' }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)' }}>
              T{t.number}
              {isDone && !isCurrent && (
                <span className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center">
                  <IconCheck size={8} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Teil header box ── */}
      <div className="rounded-2xl border mb-5"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', overflow: 'hidden' }}>
        {/* Title row */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b" style={{ borderColor: 'var(--theme-border)' }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-extrabold text-white shrink-0"
            style={{ background: GRADIENT }}>{teil.number}</span>
          <span className="text-[13px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {TASK_TYPE_LABELS[teil.taskType] || teil.taskType}
          </span>
          {/* Per-teil progress */}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex gap-0.5">
              {(teil.questions as ExamTeilQuestion[]).map((q) => (
                <div key={q.id} className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ backgroundColor: teilAnswers[q.id] ? '#22C55E' : 'var(--theme-border)' }} />
              ))}
            </div>
            <span className="text-[11px]" style={{ color: teilDone ? '#22C55E' : 'var(--theme-text-muted)' }}>
              {teilAnsweredCount}/{teilTotalQ}
            </span>
          </div>
        </div>
        {/* Instruction */}
        <div className="px-4 py-2.5">
          <p className="text-[13px] italic leading-relaxed" style={{ color: 'var(--theme-text-secondary)', fontFamily: 'Georgia, serif' }}>
            {teil.instruction}
          </p>
        </div>
      </div>

      {/* ── Teil content ── */}
      <TeilRenderer
        teil={teil}
        answers={teilAnswers}
        onAnswer={(qid, val) => handleAnswer(teil.number, qid, val)}
      />

      {/* ── Navigation buttons ── */}
      <div className="flex gap-3 mt-6">
        {currentTeil > 0 && (
          <button onClick={() => setCurrentTeil(i => i - 1)}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-all hover:-translate-y-0.5"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-secondary)' }}>
            <IconChevronLeft size={14} /> Teil {teile[currentTeil - 1].number}
          </button>
        )}
        <div className="flex-1" />
        {!isLastTeil && (
          <button onClick={() => setCurrentTeil(i => i + 1)}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{ background: GRADIENT }}>
            Teil {teile[currentTeil + 1].number} <IconChevronRight size={14} />
          </button>
        )}
      </div>

      {/* ── Submit section (only on last Teil, inline — không fixed) ── */}
      {isLastTeil && (
        <div className="mt-6 rounded-2xl border p-4"
          style={{ borderColor: allAnswered ? 'rgba(34,197,94,.3)' : 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          {/* Summary */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
              Kết quả trả lời
            </p>
            <span className="text-[13px] font-bold" style={{ color: allAnswered ? '#22C55E' : 'var(--theme-text-muted)' }}>
              {totalAnswered}/{totalQ} câu
            </span>
          </div>
          {/* Per-teil status */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {teile.map(t => {
              const tAns = Object.keys(userAnswers[`teil_${t.number}`] || {}).length;
              const tTot = t.questions.length;
              const done = tAns >= tTot;
              return (
                <button key={t.number} onClick={() => setCurrentTeil(teile.indexOf(t))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all"
                  style={done
                    ? { backgroundColor: 'rgba(34,197,94,.08)', color: '#22C55E', borderColor: 'rgba(34,197,94,.3)' }
                    : { backgroundColor: 'rgba(239,68,68,.06)', color: '#EF4444', borderColor: 'rgba(239,68,68,.2)' }}>
                  T{t.number}: {tAns}/{tTot}
                  {done && <IconCheck size={9} />}
                </button>
              );
            })}
          </div>

          {error && <p className="text-[12px] text-center mb-3" style={{ color: '#EF4444' }}>{error}</p>}

          {/* Submit button */}
          {confirmSubmit ? (
            <div className="flex gap-2">
              <button onClick={() => setConfirmSubmit(false)}
                className="flex-1 py-3 rounded-xl text-[13px] font-semibold border transition-all"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', backgroundColor: 'transparent' }}>
                Hủy
              </button>
              <button onClick={handleSubmit} disabled={submitMut.isPending}
                className="flex-1 py-3 rounded-xl text-[14px] font-bold text-white flex items-center justify-center gap-2 transition-all"
                style={{ background: GRADIENT }}>
                {submitMut.isPending ? <><IconLoader size={15} style={{ color: 'white' }} /> Đang nộp...</> : 'Xác nhận nộp bài'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => allAnswered && setConfirmSubmit(true)}
              disabled={!allAnswered || submitMut.isPending}
              className="w-full py-3.5 rounded-xl font-bold text-[14px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              style={{ background: GRADIENT, boxShadow: allAnswered ? '0 4px 12px rgba(34,197,94,.3)' : 'none' }}>
              {allAnswered ? 'Nộp bài' : `Còn ${totalQ - totalAnswered} câu chưa trả lời`}
            </button>
          )}
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
}
