'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useListeningSession, useSubmitListening } from '@/hooks/useListening';
import { ListeningQuestion } from '@/lib/api/listening';

function IconHeadphones({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>;
}
function IconPlay({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'block', ...style }}><polygon points="5 3 19 12 5 21 5 3" /></svg>;
}
function IconSquare({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'block', ...style }}><rect width="15" height="15" x="4.5" y="4.5" rx="2" /></svg>;
}
function IconLoader({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconChevronLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="15 18 9 12 15 6" /></svg>;
}

const ACCENT = '#EC4899';
const GRADIENT = 'linear-gradient(135deg, #EC4899, #8B5CF6)';

// ─── TTS Player ───────────────────────────────────────────────────────────────
function TTSPlayer({ text, speed = 1.0 }: { text: string; speed?: number }) {
  const [playing, setPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel();
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    stop();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = speed;
    u.onstart = () => setPlaying(true);
    u.onend = () => { setPlaying(false); setPlayCount(c => c + 1); };
    u.onerror = () => setPlaying(false);
    utterRef.current = u;
    window.speechSynthesis.speak(u);
    setPlayCount(c => c + 1);
  }, [text, speed, stop]);

  useEffect(() => () => { if (typeof window !== 'undefined') window.speechSynthesis.cancel(); }, []);

  return (
    <div className="rounded-2xl border p-5 mb-5" style={{ borderColor: `rgba(236,72,153,.3)`, backgroundColor: 'rgba(236,72,153,.04)' }}>
      <div className="flex items-center gap-2 mb-3">
        <IconHeadphones size={16} style={{ color: ACCENT }} />
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: ACCENT }}>Audio · de-DE</p>
        {playCount > 0 && (
          <span className="ml-auto text-caption font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(236,72,153,.1)', color: ACCENT }}>
            Đã nghe {playCount} lần
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={playing ? stop : play}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110 shrink-0"
          style={{ background: GRADIENT }}>
          {playing ? <IconSquare size={16} style={{ color: 'white' }} /> : <IconPlay size={16} style={{ color: 'white' }} />}
        </button>
        <div className="flex-1">
          <p className="text-body font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            {playing ? '🎵 Đang phát...' : playCount > 0 ? 'Nhấn để nghe lại' : 'Nhấn để nghe'}
          </p>
          <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            Tốc độ: {speed}x · Tiếng Đức (de-DE)
          </p>
        </div>
        {/* Speed hint */}
        <div className="flex gap-1">
          {[0.75, 1.0].map(s => (
            <span key={s} className="text-caption font-bold px-2 py-1 rounded-lg border"
              style={s === speed
                ? { borderColor: ACCENT, backgroundColor: 'rgba(236,72,153,.1)', color: ACCENT }
                : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
              {s}x
            </span>
          ))}
        </div>
      </div>

      <p className="text-caption mt-3 italic" style={{ color: 'var(--theme-text-muted)' }}>
        * Transcript sẽ được hiển thị sau khi nộp bài
      </p>
    </div>
  );
}

// ─── Question renderer ────────────────────────────────────────────────────────
function QuestionItem({ q, idx, answer, onAnswer }: {
  q: ListeningQuestion; idx: number; answer: string; onAnswer: (val: string) => void;
}) {
  if (q.type === 'richtig_falsch') {
    return (
      <div className="rounded-xl border p-3" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <p className="text-body font-semibold mb-2.5" style={{ color: 'var(--theme-text-primary)' }}>
          {idx + 1}. {q.questionText}
        </p>
        <div className="flex gap-2">
          {[{ id: 'richtig', label: 'Richtig ✓' }, { id: 'falsch', label: 'Falsch ✗' }].map(opt => {
            const sel = answer === opt.id;
            return (
              <button key={opt.id} onClick={() => onAnswer(opt.id)}
                className="flex-1 py-2 rounded-xl text-body font-semibold border-2 transition-all"
                style={sel
                  ? { borderColor: opt.id === 'richtig' ? '#22C55E' : '#EF4444', backgroundColor: opt.id === 'richtig' ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', color: opt.id === 'richtig' ? '#22C55E' : '#EF4444' }
                  : { borderColor: 'var(--theme-border)', backgroundColor: 'transparent', color: 'var(--theme-text-secondary)' }}>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-body font-semibold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
        {idx + 1}. {q.questionText}
      </p>
      <div className="space-y-1.5">
        {(q.options || []).map(opt => {
          const sel = answer === opt.id;
          return (
            <button key={opt.id} onClick={() => onAnswer(opt.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-body text-left transition-all"
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
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ListeningSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isLoading } = useListeningSession(id);
  const submitMut = useSubmitListening();

  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [speed, setSpeed] = useState(1.0);
  const [error, setError] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const handleAnswer = useCallback((qid: string, val: string) => {
    setUserAnswers(prev => ({ ...prev, [qid]: val }));
  }, []);

  useEffect(() => {
    if (session?.status === 'GRADED') {
      router.replace(`/practice-test/listening/${id}/result`);
    }
  }, [session?.status, id, router]);

  if (isLoading) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <IconLoader size={32} style={{ color: ACCENT }} />
          <p style={{ color: 'var(--theme-text-muted)' }}>Đang tải bài nghe...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-6 text-center">
        <p className="mb-4" style={{ color: 'var(--theme-text-muted)' }}>Không tìm thấy bài nghe.</p>
        <Link href="/practice-test/listening" className="text-sm font-semibold" style={{ color: ACCENT }}>Quay lại</Link>
      </div>
    );
  }

  const questions = session.questions as ListeningQuestion[];
  const answered = Object.keys(userAnswers).length;
  const total = questions.length;
  const allAnswered = answered >= total;

  const handleSubmit = async () => {
    setConfirmSubmit(false);
    setError('');
    try {
      await submitMut.mutateAsync({ id, userAnswers });
      router.push(`/practice-test/listening/${id}/result`);
    } catch {
      setError('Không thể nộp bài. Vui lòng thử lại.');
    }
  };

  return (
    <div className="py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/practice-test/listening" className="p-2 rounded-xl transition-all hover:scale-110"
          style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
          <IconChevronLeft size={18} />
        </Link>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: GRADIENT }}>
          <IconHeadphones size={18} style={{ color: 'white' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>
            {session.title}
          </h1>
          <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            {session.cefrLevel} · {answered}/{total} câu đã trả lời
          </p>
        </div>
        {/* Speed toggle */}
        <div className="flex gap-1 shrink-0">
          {[0.75, 1.0].map(s => (
            <button key={s} onClick={() => setSpeed(s)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold border-2 transition-all"
              style={s === speed
                ? { borderColor: ACCENT, backgroundColor: 'rgba(236,72,153,.1)', color: ACCENT }
                : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full mb-5 overflow-hidden" style={{ backgroundColor: 'var(--theme-border)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(answered / total) * 100}%`, background: GRADIENT }} />
      </div>

      {/* TTS Player */}
      <TTSPlayer text={session.transcript} speed={speed} />

      {/* Questions */}
      <div className="space-y-4 mb-6">
        {questions.map((q, i) => (
          <QuestionItem key={q.id} q={q} idx={i} answer={userAnswers[q.id] || ''} onAnswer={val => handleAnswer(q.id, val)} />
        ))}
      </div>

      {/* Submit */}
      {error && <p className="text-body mb-3 text-center" style={{ color: '#EF4444' }}>{error}</p>}

      {!confirmSubmit ? (
        <button onClick={() => setConfirmSubmit(true)} disabled={!allAnswered || submitMut.isPending}
          className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:scale-100"
          style={{ background: GRADIENT }}>
          {allAnswered ? 'Nộp Bài & Xem Kết Quả' : `Trả lời thêm ${total - answered} câu nữa`}
        </button>
      ) : (
        <div className="rounded-2xl border p-4 text-center" style={{ borderColor: 'rgba(236,72,153,.3)', backgroundColor: 'rgba(236,72,153,.04)' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
            Xác nhận nộp bài?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmSubmit(false)}
              className="flex-1 py-2.5 rounded-xl border text-body font-semibold"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
              Kiểm tra lại
            </button>
            <button onClick={handleSubmit} disabled={submitMut.isPending}
              className="flex-1 py-2.5 rounded-xl text-body font-bold text-white flex items-center justify-center gap-2"
              style={{ background: GRADIENT }}>
              {submitMut.isPending ? <><IconLoader size={16} style={{ color: 'white' }} /> Đang xử lý...</> : 'Nộp Bài'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
