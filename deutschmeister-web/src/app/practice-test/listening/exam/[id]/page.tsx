'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useExamListeningSession, useSubmitExamListening } from '@/hooks/useExamListening';
import { ExamListeningTeil, ExamListeningQuestion } from '@/lib/api/examListening';

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconChevronLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronRight({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="9 18 15 12 9 6" /></svg>;
}
function IconLoader({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconPlay({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'block' }}><polygon points="5 3 19 12 5 21 5 3" /></svg>;
}
function IconSquare({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'block' }}><rect x="3" y="3" width="18" height="18" rx="2" /></svg>;
}
function IconCheck({ size = 10 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="20 6 9 17 4 12" /></svg>;
}

const ACCENT = '#EC4899';
const GRADIENT = 'linear-gradient(135deg, #EC4899, #8B5CF6)';

const TASK_TYPE_LABELS: Record<string, string> = {
  richtig_falsch: 'Richtig / Falsch',
  multiple_choice: 'Multiple Choice',
  zuordnung: 'Zuordnung',
};

// ─── TTS Player ───────────────────────────────────────────────────────────────
function TTSPlayer({ texts, speed, onSpeedChange, playCount, onPlay }: {
  texts: ExamListeningTeil['texts'];
  speed: number;
  onSpeedChange: (s: number) => void;
  playCount: number;   // how many times already played
  onPlay: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const maxPlays = texts[0] ? undefined : 0; // no hard limit in practice mode

  const fullScript = texts.map(t => t.content).join('\n\n');

  const handlePlay = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(fullScript);
    u.lang = 'de-DE';
    u.rate = speed;
    u.onstart = () => setPlaying(true);
    u.onend = () => { setPlaying(false); onPlay(); };
    u.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="rounded-2xl border p-4 mb-5"
      style={{ borderColor: `rgba(236,72,153,.3)`, backgroundColor: 'rgba(236,72,153,.04)' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: GRADIENT }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            Audio — Text ẩn trong khi làm bài
          </p>
          <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
            Đã nghe: {playCount} lần
          </p>
        </div>
        {/* Speed selector */}
        <div className="flex gap-1">
          {[0.75, 1.0].map(s => (
            <button key={s} onClick={() => onSpeedChange(s)}
              className="px-2 py-1 rounded-lg text-[11px] font-bold border transition-all"
              style={speed === s
                ? { background: GRADIENT, color: 'white', borderColor: 'transparent' }
                : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)', backgroundColor: 'transparent' }}>
              {s === 0.75 ? '0.75×' : '1.0×'}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handlePlay}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[14px] text-white transition-all hover:-translate-y-0.5 active:scale-95"
        style={{ background: playing ? 'linear-gradient(135deg, #F97316, #EF4444)' : GRADIENT, boxShadow: '0 4px 12px rgba(236,72,153,.3)' }}>
        {playing ? <><IconSquare size={14} /> Stop</> : <><IconPlay size={14} /> {playCount === 0 ? 'Nghe audio' : 'Nghe lại'}</>}
      </button>
    </div>
  );
}

// ─── Question Renderers ───────────────────────────────────────────────────────

function RichtigFalschTeil({ teil, answers, onAnswer }: { teil: ExamListeningTeil; answers: Record<string, string>; onAnswer: (qid: string, val: string) => void }) {
  return (
    <div className="space-y-3">
      {(teil.questions as ExamListeningQuestion[]).map((q, i) => (
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
  );
}

function MCQTeil({ teil, answers, onAnswer }: { teil: ExamListeningTeil; answers: Record<string, string>; onAnswer: (qid: string, val: string) => void }) {
  return (
    <div className="space-y-5">
      {(teil.questions as ExamListeningQuestion[]).map((q, i) => (
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
                    ? { borderColor: ACCENT, backgroundColor: 'rgba(236,72,153,.08)', color: ACCENT }
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
  );
}

function ZuordnungTeil({ teil, answers, onAnswer }: { teil: ExamListeningTeil; answers: Record<string, string>; onAnswer: (qid: string, val: string) => void }) {
  const labels = teil.texts.map(t => t.label || t.id).filter(Boolean);

  return (
    <div className="space-y-3">
      {(teil.questions as ExamListeningQuestion[]).map((q, i) => (
        <div key={q.id} className="rounded-xl border p-3"
          style={{ borderColor: answers[q.id] ? 'rgba(236,72,153,.3)' : 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
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
  );
}

function TeilRenderer({ teil, answers, onAnswer }: { teil: ExamListeningTeil; answers: Record<string, string>; onAnswer: (qid: string, val: string) => void }) {
  switch (teil.taskType) {
    case 'richtig_falsch':  return <RichtigFalschTeil  teil={teil} answers={answers} onAnswer={onAnswer} />;
    case 'multiple_choice': return <MCQTeil             teil={teil} answers={answers} onAnswer={onAnswer} />;
    case 'zuordnung':       return <ZuordnungTeil       teil={teil} answers={answers} onAnswer={onAnswer} />;
    default: return <p style={{ color: 'var(--theme-text-muted)' }}>Loại câu hỏi không được hỗ trợ.</p>;
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExamListeningPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isLoading } = useExamListeningSession(id);
  const submitMut = useSubmitExamListening();

  const [userAnswers, setUserAnswers] = useState<Record<string, Record<string, string>>>({});
  const [currentTeil, setCurrentTeil] = useState(0);
  const [error, setError] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  // Track play count per Teil
  const [playCounts, setPlayCounts] = useState<Record<number, number>>({});

  const handleAnswer = useCallback((teilNumber: number, qid: string, val: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [`teil_${teilNumber}`]: { ...(prev[`teil_${teilNumber}`] || {}), [qid]: val },
    }));
  }, []);

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
        <Link href="/practice-test/listening/exam" className="text-[14px] font-semibold" style={{ color: ACCENT }}>Quay lại</Link>
      </div>
    );
  }

  useEffect(() => {
    if (session?.status === 'GRADED') {
      router.replace(`/practice-test/listening/exam/${id}/result`);
    }
  }, [session?.status, id, router]);

  if (session.status === 'GRADED') return null;

  const teile = session.teile as ExamListeningTeil[];
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
      router.push(`/practice-test/listening/exam/${id}/result`);
    } catch {
      setError('Không thể nộp bài. Vui lòng thử lại.');
    }
  };

  const isLastTeil = currentTeil === teile.length - 1;

  return (
    <div className="py-6">
      {/* Top bar */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/practice-test/listening/exam"
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

      {/* Overall progress bar */}
      <div className="h-1 rounded-full mb-4 overflow-hidden" style={{ backgroundColor: 'var(--theme-border)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${totalQ > 0 ? (totalAnswered / totalQ) * 100 : 0}%`, background: GRADIENT }} />
      </div>

      {/* Teil navigation tabs */}
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
                  ? { backgroundColor: 'rgba(236,72,153,.08)', color: ACCENT, borderColor: 'rgba(236,72,153,.3)' }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)' }}>
              T{t.number}
              {isDone && !isCurrent && (
                <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
                  <IconCheck size={8} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Teil header */}
      <div className="rounded-2xl border mb-5" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', overflow: 'hidden' }}>
        <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b" style={{ borderColor: 'var(--theme-border)' }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-extrabold text-white shrink-0"
            style={{ background: GRADIENT }}>{teil.number}</span>
          <span className="text-[13px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {TASK_TYPE_LABELS[teil.taskType] || teil.taskType}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex gap-0.5">
              {(teil.questions as ExamListeningQuestion[]).map((q) => (
                <div key={q.id} className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ backgroundColor: teilAnswers[q.id] ? ACCENT : 'var(--theme-border)' }} />
              ))}
            </div>
            <span className="text-[11px]" style={{ color: teilDone ? ACCENT : 'var(--theme-text-muted)' }}>
              {teilAnsweredCount}/{teilTotalQ}
            </span>
          </div>
        </div>
        <div className="px-4 py-2.5">
          <p className="text-[13px] italic leading-relaxed" style={{ color: 'var(--theme-text-secondary)', fontFamily: 'Georgia, serif' }}>
            {teil.instruction}
          </p>
        </div>
      </div>

      {/* TTS Player */}
      <TTSPlayer
        texts={teil.texts}
        speed={ttsSpeed}
        onSpeedChange={setTtsSpeed}
        playCount={playCounts[teil.number] || 0}
        onPlay={() => setPlayCounts(prev => ({ ...prev, [teil.number]: (prev[teil.number] || 0) + 1 }))}
      />

      {/* Questions */}
      <TeilRenderer
        teil={teil}
        answers={teilAnswers}
        onAnswer={(qid, val) => handleAnswer(teil.number, qid, val)}
      />

      {/* Navigation */}
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

      {/* Submit section */}
      {isLastTeil && (
        <div className="mt-6 rounded-2xl border p-4"
          style={{ borderColor: allAnswered ? 'rgba(236,72,153,.3)' : 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Kết quả trả lời</p>
            <span className="text-[13px] font-bold" style={{ color: allAnswered ? ACCENT : 'var(--theme-text-muted)' }}>
              {totalAnswered}/{totalQ} câu
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {teile.map(t => {
              const tAns = Object.keys(userAnswers[`teil_${t.number}`] || {}).length;
              const tTot = t.questions.length;
              const done = tAns >= tTot;
              return (
                <button key={t.number} onClick={() => setCurrentTeil(teile.indexOf(t))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all"
                  style={done
                    ? { backgroundColor: 'rgba(236,72,153,.08)', color: ACCENT, borderColor: 'rgba(236,72,153,.3)' }
                    : { backgroundColor: 'rgba(239,68,68,.06)', color: '#EF4444', borderColor: 'rgba(239,68,68,.2)' }}>
                  T{t.number}: {tAns}/{tTot}
                  {done && <IconCheck size={9} />}
                </button>
              );
            })}
          </div>

          {error && <p className="text-[12px] text-center mb-3" style={{ color: '#EF4444' }}>{error}</p>}

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
              style={{ background: GRADIENT, boxShadow: allAnswered ? '0 4px 12px rgba(236,72,153,.3)' : 'none' }}>
              {allAnswered ? 'Nộp bài' : `Còn ${totalQ - totalAnswered} câu chưa trả lời`}
            </button>
          )}
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
