'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useReadingSession, useSubmitReading } from '@/hooks/useReading';
import { ReadingQuestion, VocabHighlight } from '@/lib/api/reading';
import { HighlightedText } from '@/components/word-highlight/HighlightedText';
import {
  IconVolume2, IconLoader, IconSend, IconCheck,
} from '../icons';
import { PageHeader } from '@/components/ui';

const ACCENT = '#22C55E';
const GRADIENT = 'linear-gradient(135deg, #22C55E, #14B8A6)';

const ARTICLE_STYLE: Record<string, { backgroundColor: string; color: string }> = {
  'der': { backgroundColor: 'rgba(59,130,246,.25)', color: '#93C5FD' },
  'die': { backgroundColor: 'rgba(236,72,153,.25)', color: '#F9A8D4' },
  'das': { backgroundColor: 'rgba(20,184,166,.25)', color: '#5EEAD4' },
};

function IconPlay({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}><polygon points="5,3 19,12 5,21" /></svg>;
}
function IconPause({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>;
}
function IconClock({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}

// ─── Waveform bars (static visual pattern) ───
function WaveformDisplay({ progress }: { progress: number }) {
  const bars = 42;
  return (
    <div className="flex items-center gap-px" style={{ height: 32 }}>
      {Array.from({ length: bars }, (_, i) => {
        const h = 25 + Math.abs(Math.sin(i * 0.9) * 26 + Math.sin(i * 1.7) * 16);
        const active = i / bars <= progress;
        return (
          <div key={i} className="flex-1 rounded-full"
            style={{ height: `${Math.max(16, Math.min(92, h))}%`, backgroundColor: active ? '#22C55E' : 'rgba(255,255,255,0.11)' }} />
        );
      })}
    </div>
  );
}

// ─── TTS Audio Player ───
function AudioPlayer({ passage }: { passage: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const wordCount = passage.split(/\s+/).length;
  const duration = Math.max(30, Math.round(wordCount / 110 * 60));
  const progress = Math.min(elapsed / duration, 1);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const toggle = useCallback(() => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      window.speechSynthesis.cancel();
      setElapsed(0);
      const u = new SpeechSynthesisUtterance(passage);
      u.lang = 'de-DE';
      u.rate = 0.85 * speed;
      u.onend = () => {
        setIsPlaying(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
      window.speechSynthesis.speak(u);
      setIsPlaying(true);
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
  }, [isPlaying, passage, speed]);

  useEffect(() => () => {
    window.speechSynthesis.cancel();
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="rounded-2xl p-4 mb-5"
      style={{ background: 'linear-gradient(135deg, #0d1117 0%, #1a2332 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-3">
        <button onClick={toggle}
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95"
          style={{ background: GRADIENT, color: 'white' }}>
          {isPlaying ? <IconPause size={16} /> : <IconPlay size={16} />}
        </button>
        <div className="flex-1 min-w-0">
          <WaveformDisplay progress={progress} />
          <div className="flex justify-between mt-1.5">
            <span className="text-caption font-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>{fmt(elapsed)}</span>
            <span className="text-caption font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{fmt(duration)}</span>
          </div>
        </div>
        <select value={speed}
          onChange={e => { setSpeed(Number(e.target.value)); if (isPlaying) { window.speechSynthesis.cancel(); setIsPlaying(false); if (intervalRef.current) clearInterval(intervalRef.current); } }}
          className="rounded-lg text-xs font-bold outline-none cursor-pointer"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)', padding: '6px 10px' }}>
          <option value={0.75}>0.75x</option>
          <option value={1.0}>1.0x</option>
          <option value={1.25}>1.25x</option>
        </select>
      </div>
    </div>
  );
}

// ─── Vocab Panel (right sidebar) ───
function VocabPanel({ vocabHighlights }: { vocabHighlights: VocabHighlight[] }) {
  if (!vocabHighlights.length) return null;
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <h3 className="text-body font-bold mb-3 flex items-center gap-1.5" style={{ color: 'var(--theme-text-primary)' }}>
        🧩 Từ vựng quan trọng
        <span className="font-normal" style={{ color: 'var(--theme-text-muted)' }}>({vocabHighlights.length})</span>
      </h3>
      <div className="space-y-2.5">
        {vocabHighlights.map((v, i) => {
          const art = v.article?.toLowerCase();
          const artStyle = art ? (ARTICLE_STYLE[art] || {}) : {};
          return (
            <div key={i} className="flex items-center gap-2">
              {art && ['der', 'die', 'das'].includes(art) && (
                <span className="px-1.5 py-0.5 rounded text-caption font-black uppercase shrink-0"
                  style={artStyle}>
                  {art.toUpperCase()}
                </span>
              )}
              <span className="text-body font-semibold flex-1 min-w-0" style={{ color: 'var(--theme-text-primary)' }}>{v.word}</span>
              <span className="text-xs shrink-0" style={{ color: 'var(--theme-text-muted)' }}>{v.translation}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Question Item (2×2 grid options) ───
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

function QuestionItem({ question, index, selectedAnswer, onSelect }: {
  question: ReadingQuestion;
  index: number;
  selectedAnswer: string | undefined;
  onSelect: (questionId: string, optionId: string) => void;
}) {
  const isAnswered = !!selectedAnswer;
  return (
    <div className="rounded-2xl border p-5 transition-colors duration-200"
      style={{ borderColor: isAnswered ? 'rgba(34,197,94,.35)' : 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-body font-bold shrink-0 text-white"
          style={{ background: isAnswered ? GRADIENT : 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
          {isAnswered ? <IconCheck size={13} /> : index + 1}
        </div>
        <p className="text-[15px] font-bold leading-snug pt-0.5" style={{ color: 'var(--theme-text-primary)' }}>
          <HighlightedText text={question.questionText} />
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {question.options.map((opt, oi) => {
          const isSelected = selectedAnswer === opt.id;
          return (
            <button key={opt.id}
              onClick={() => onSelect(question.id, opt.id)}
              className="flex items-center gap-2.5 px-3 py-3 rounded-xl border-2 text-left transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
              style={{
                borderColor: isSelected ? ACCENT : 'var(--theme-border)',
                backgroundColor: isSelected ? 'rgba(34,197,94,.08)' : 'transparent',
                color: isSelected ? ACCENT : 'var(--theme-text-primary)',
              }}>
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-caption font-bold"
                style={{
                  borderColor: isSelected ? ACCENT : 'var(--theme-border)',
                  backgroundColor: isSelected ? ACCENT : 'transparent',
                  color: isSelected ? 'white' : 'var(--theme-text-muted)',
                  minWidth: 24,
                }}>
                {OPTION_LABELS[oi]}
              </div>
              <span className="text-body font-medium leading-snug">
                <HighlightedText text={opt.text} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function ReadingSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isLoading, error } = useReadingSession(id);
  const submitMutation = useSubmitReading();
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (session?.status === 'GRADED') {
      router.replace(`/practice-test/reading/${id}/result`);
    }
  }, [session?.status, id, router]);

  const handleSelect = (questionId: string, optionId: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!session) return;
    const questions = session.questions as ReadingQuestion[];
    if (Object.keys(userAnswers).length < questions.length) return;
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (typeof window !== 'undefined') localStorage.setItem(`reading_time_${id}`, String(elapsed));
    try {
      await submitMutation.mutateAsync({ id, userAnswers });
      router.push(`/practice-test/reading/${id}/result`);
    } catch { /* handled */ }
  };

  if (isLoading) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <IconLoader size={32} style={{ color: ACCENT }} />
          <p style={{ color: 'var(--theme-text-muted)' }}>Đang tải bài đọc...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="py-6 text-center">
        <p className="mb-4" style={{ color: 'var(--theme-text-muted)' }}>Không tìm thấy bài đọc.</p>
        <Link href="/practice-test/reading" className="text-sm font-semibold" style={{ color: ACCENT }}>
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const questions = session.questions as ReadingQuestion[];
  const vocabHighlights = (session.vocabHighlights || []) as VocabHighlight[];
  const answered = Object.keys(userAnswers).length;
  const wordCount = session.passage.split(/\s+/).length;
  const readingMin = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="py-6 pb-28">
      <PageHeader
        backHref="/practice-test/reading"
        title="Luyện Đọc"
        accent="reading"
        right={
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white"
            style={{ backgroundColor: ACCENT }}>{session.cefrLevel}</span>
        }
      />

      {/* Meta badges */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          <IconClock size={12} /> ~{readingMin} phút đọc
        </span>
        <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>· {wordCount} từ</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-extrabold mb-5" style={{ color: 'var(--theme-text-primary)' }}>
        {session.title}
      </h1>

      {/* Two-column: LEFT = passage + audio + vocab | RIGHT = questions */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* ── LEFT: Passage panel (sticky on desktop) ── */}
        <div className="lg:w-1/2 shrink-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1 space-y-4">
          <AudioPlayer passage={session.passage} />
          <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <div className="text-[15px] leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--theme-text-primary)', fontFamily: 'Georgia, serif' }}>
              <HighlightedText text={session.passage} />
            </div>
          </div>
          {vocabHighlights.length > 0 && (
            <VocabPanel vocabHighlights={vocabHighlights} />
          )}
        </div>

        {/* ── RIGHT: Questions panel ── */}
        <div className="lg:w-1/2 min-w-0 space-y-4">
          <h2 className="text-title font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            Câu hỏi ({questions.length})
          </h2>
          {questions.map((q, i) => (
            <QuestionItem key={q.id} question={q} index={i} selectedAnswer={userAnswers[q.id]} onSelect={handleSelect} />
          ))}
        </div>

      </div>

      {/* Fixed submit bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 pointer-events-none">
        <div className="w-full max-w-2xl rounded-2xl border pointer-events-auto px-4 py-3 flex items-center gap-4"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: answered === questions.length ? ACCENT : 'var(--theme-border)',
            boxShadow: '0 -4px 24px rgba(0,0,0,.14)',
          }}>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="flex gap-1">
              {questions.map(q => (
                <div key={q.id} className="w-2 h-2 rounded-full transition-colors duration-200"
                  style={{ backgroundColor: userAnswers[q.id] ? ACCENT : 'var(--theme-bg-secondary)' }} />
              ))}
            </div>
            <span className="text-body font-medium" style={{ color: 'var(--theme-text-muted)' }}>
              Đã trả lời {answered}/{questions.length}
            </span>
          </div>
          <button onClick={handleSubmit}
            disabled={answered !== questions.length || submitMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            style={{ background: GRADIENT, boxShadow: answered === questions.length ? '0 4px 12px rgba(34,197,94,.4)' : 'none' }}>
            {submitMutation.isPending
              ? <><IconLoader size={16} /> Đang chấm...</>
              : <><IconSend size={16} /> Nộp bài</>}
          </button>
        </div>
      </div>
    </div>
  );
}
