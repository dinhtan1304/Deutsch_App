'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useReadingSession, useSubmitReading } from '@/hooks/useReading';
import { ReadingQuestion, VocabHighlight } from '@/lib/api/reading';
import {
  IconChevronLeft, IconVolume2, IconList, IconLoader, IconSend, IconCheck,
} from '../icons';

const ACCENT = '#22C55E';
const GRADIENT = 'linear-gradient(135deg, #22C55E, #14B8A6)';

function IconChevronDown({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="6 9 12 15 18 9" /></svg>;
}
function IconChevronUp({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="18 15 12 9 6 15" /></svg>;
}
function IconPin({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z"/></svg>;
}

function speakText(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

// ─── Passage Display ───
function PassageCard({ title, passage }: { title: string; passage: string }) {
  return (
    <div className="rounded-2xl border p-5 mb-6"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="text-[16px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{title}</h2>
        <button
          onClick={() => speakText(passage)}
          className="p-2 rounded-xl flex-shrink-0 transition-all hover:scale-110"
          style={{ backgroundColor: 'rgba(34,197,94,.1)', color: ACCENT }}
          title="Nghe phát âm (TTS)">
          <IconVolume2 size={18} />
        </button>
      </div>
      <div className="text-[15px] leading-relaxed whitespace-pre-wrap"
        style={{ color: 'var(--theme-text-primary)', fontFamily: 'Georgia, serif' }}>
        {passage}
      </div>
    </div>
  );
}

// ─── Vocab Panel ───
function VocabPanel({ vocabHighlights, isOpen, onToggle }: {
  vocabHighlights: VocabHighlight[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  if (!vocabHighlights.length) return null;
  return (
    <div className="mb-6">
      <button onClick={onToggle}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:-translate-y-0.5"
        style={isOpen
          ? { background: GRADIENT, color: 'white', boxShadow: '0 4px 12px rgba(34,197,94,.3)' }
          : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }
        }>
        <IconList size={14} />
        Từ vựng quan trọng ({vocabHighlights.length})
      </button>
      {isOpen && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
          {vocabHighlights.map((v, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-xl border"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
              <button
                onClick={() => speakText(v.word)}
                className="p-1 rounded-lg transition-all hover:scale-110 flex-shrink-0"
                style={{ color: ACCENT }}>
                <IconVolume2 size={14} />
              </button>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--theme-text-primary)' }}>{v.word}</div>
                <div className="text-[11px] truncate" style={{ color: 'var(--theme-text-muted)' }}>{v.translation}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single Question ───
function QuestionItem({
  question,
  index,
  selectedAnswer,
  onSelect,
}: {
  question: ReadingQuestion;
  index: number;
  selectedAnswer: string | undefined;
  onSelect: (questionId: string, optionId: string) => void;
}) {
  return (
    <div className="rounded-2xl border p-5"
      style={{ borderColor: selectedAnswer ? `${ACCENT}40` : 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 text-white"
          style={{ background: selectedAnswer ? GRADIENT : 'var(--theme-bg-secondary)', color: selectedAnswer ? 'white' : 'var(--theme-text-muted)' }}>
          {selectedAnswer ? <IconCheck size={13} /> : index + 1}
        </div>
        <p className="text-[14px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
          {question.questionText}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {question.options.map(opt => {
          const isSelected = selectedAnswer === opt.id;
          return (
            <button key={opt.id}
              onClick={() => onSelect(question.id, opt.id)}
              className="w-full text-left px-4 py-3 rounded-xl border-2 text-[13px] font-medium transition-all duration-150 hover:-translate-y-0.5"
              style={{
                borderColor: isSelected ? ACCENT : 'var(--theme-border)',
                backgroundColor: isSelected ? `${ACCENT}10` : 'transparent',
                color: isSelected ? ACCENT : 'var(--theme-text-primary)',
                fontWeight: isSelected ? 700 : 500,
              }}>
              <span className="mr-2 opacity-60">{opt.id.toUpperCase()}.</span>
              {opt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Submit Bar ───
function SubmitBar({
  total,
  answered,
  onSubmit,
  isLoading,
}: {
  total: number;
  answered: number;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  const allAnswered = answered === total;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 pointer-events-none">
      <div className="w-full max-w-2xl rounded-2xl border p-4 flex items-center gap-4 pointer-events-auto"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: allAnswered ? ACCENT : 'var(--theme-border)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        }}>
        {/* Progress */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>
              Đã trả lời
            </span>
            <span className="text-[13px] font-bold" style={{ color: allAnswered ? ACCENT : 'var(--theme-text-primary)' }}>
              {answered}/{total}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${total > 0 ? (answered / total) * 100 : 0}%`, background: GRADIENT }} />
          </div>
        </div>

        {/* Submit Button */}
        <button onClick={onSubmit} disabled={!allAnswered || isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[14px] text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          style={{ background: GRADIENT, boxShadow: allAnswered ? '0 4px 12px rgba(34,197,94,.4)' : 'none' }}>
          {isLoading
            ? <><IconLoader size={16} /> Đang chấm...</>
            : <><IconSend size={16} /> Nộp bài</>
          }
        </button>
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
  const [isVocabOpen, setIsVocabOpen] = useState(false);
  const [stickyPromptOpen, setStickyPromptOpen] = useState(false);
  const [showStickyPrompt, setShowStickyPrompt] = useState(false);
  const passageRef = useRef<HTMLDivElement>(null);

  // If already graded, redirect to result page
  useEffect(() => {
    if (session?.status === 'GRADED') {
      router.replace(`/practice-test/reading/${id}/result`);
    }
  }, [session?.status, id, router]);

  // Show sticky prompt bar when passage scrolls out of view
  useEffect(() => {
    const el = passageRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyPrompt(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [session]);

  const handleSelect = (questionId: string, optionId: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!session) return;
    const questions = session.questions as ReadingQuestion[];
    if (Object.keys(userAnswers).length < questions.length) return;
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
        <Link href="/practice-test/reading" className="text-[14px] font-semibold" style={{ color: ACCENT }}>
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const questions = session.questions as ReadingQuestion[];
  const vocabHighlights = (session.vocabHighlights || []) as VocabHighlight[];
  const answered = Object.keys(userAnswers).length;

  return (
    <div className="py-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/practice-test/reading"
          className="flex items-center gap-1 text-[13px] font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--theme-text-muted)' }}>
          <IconChevronLeft size={14} /> Quay lại
        </Link>
        <div className="flex-1" />
        <span className="px-3 py-1 rounded-xl text-[12px] font-bold"
          style={{ backgroundColor: 'rgba(34,197,94,.1)', color: ACCENT }}>
          {session.cefrLevel}
        </span>
        <span className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
          {session.topic}
        </span>
      </div>

      {/* Passage */}
      <div ref={passageRef}>
        <PassageCard title={session.title} passage={session.passage} />
      </div>

      {/* ── Sticky prompt bar (appears when passage scrolls away) ── */}
      {showStickyPrompt && (
        <div className="sticky z-20 -mx-6 lg:-mx-8 xl:-mx-10 px-6 lg:px-8 xl:px-10 pb-3" style={{ top: '64px', paddingTop: '8px' }}>
          <div className="rounded-2xl border overflow-hidden transition-all"
            style={{
              borderColor: 'rgba(34,197,94,.35)',
              backgroundColor: 'var(--theme-bg-card)',
              boxShadow: '0 4px 20px rgba(0,0,0,.1)',
            }}>
            <button
              onClick={() => setStickyPromptOpen(o => !o)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all"
            >
              <IconPin size={12} />
              <span className="text-[12px] font-bold truncate flex-1" style={{ color: 'var(--theme-text-primary)' }}>
                {session.title}
                <span className="font-normal ml-1.5" style={{ color: 'var(--theme-text-muted)' }}>— Bài đọc</span>
              </span>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0"
                style={{ backgroundColor: 'rgba(34,197,94,.1)', color: ACCENT }}>
                {session.cefrLevel}
              </span>
              {stickyPromptOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
            </button>
            {stickyPromptOpen && (
              <div className="border-t px-3 pb-3 pt-2" style={{ borderColor: 'var(--theme-border)', maxHeight: '45vh', overflowY: 'auto' }}>
                <p className="text-[12px] leading-relaxed whitespace-pre-wrap"
                  style={{ color: 'var(--theme-text-primary)', fontFamily: 'Georgia, serif' }}>
                  {session.passage}
                </p>
                <button onClick={() => speakText(session.passage)}
                  className="mt-2 p-1.5 rounded-lg transition-all hover:scale-110 flex items-center gap-1 text-[11px]"
                  style={{ color: ACCENT }}>
                  <IconVolume2 size={13} /> Nghe
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vocab Panel */}
      <VocabPanel
        vocabHighlights={vocabHighlights}
        isOpen={isVocabOpen}
        onToggle={() => setIsVocabOpen(v => !v)}
      />

      {/* Questions */}
      <div className="space-y-4">
        <h3 className="text-[13px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
          Câu hỏi ({questions.length})
        </h3>
        {questions.map((q, i) => (
          <QuestionItem
            key={q.id}
            question={q}
            index={i}
            selectedAnswer={userAnswers[q.id]}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Submit Bar */}
      <SubmitBar
        total={questions.length}
        answered={answered}
        onSubmit={handleSubmit}
        isLoading={submitMutation.isPending}
      />
    </div>
  );
}
