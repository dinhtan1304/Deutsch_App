'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useReadingSession } from '@/hooks/useReading';
import { ReadingQuestion, GradingDetail, VocabHighlight } from '@/lib/api/reading';
import {
  IconBookOpen, IconChevronLeft, IconCheck, IconX, IconVolume2, IconList, IconLoader,
} from '../../icons';

const ACCENT = '#22C55E';
const GRADIENT = 'linear-gradient(135deg, #22C55E, #14B8A6)';

function speakText(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

function getScoreColor(score: number) {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#F59E0B';
  if (score >= 40) return '#F97316';
  return '#EF4444';
}

function getScoreLabel(score: number) {
  if (score >= 80) return 'Xuất sắc!';
  if (score >= 60) return 'Khá tốt!';
  if (score >= 40) return 'Cần cố gắng thêm';
  return 'Hãy ôn luyện thêm';
}

// ─── Score Ring ───
function ScoreRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="relative w-32 h-32">
        <svg width="128" height="128" viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--theme-bg-secondary)" strokeWidth="10" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[32px] font-extrabold leading-none" style={{ color }}>{Math.round(score)}%</span>
        </div>
      </div>
      <p className="text-[16px] font-bold mt-3" style={{ color }}>{getScoreLabel(score)}</p>
    </div>
  );
}

// ─── Stats Cards ───
function StatsRow({ correct, total }: { correct: number; total: number }) {
  const wrong = total - correct;
  const score = total > 0 ? (correct / total) * 100 : 0;

  const cards = [
    { label: 'Đúng', value: correct, color: '#22C55E', bg: 'rgba(34,197,94,.1)' },
    { label: 'Sai', value: wrong, color: '#EF4444', bg: 'rgba(239,68,68,.1)' },
    { label: 'Điểm', value: `${Math.round(score)}%`, color: getScoreColor(score), bg: `rgba(34,197,94,.05)` },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {cards.map((c, i) => (
        <div key={i} className="rounded-xl p-4 text-center"
          style={{ backgroundColor: c.bg }}>
          <div className="text-[24px] font-extrabold" style={{ color: c.color }}>{c.value}</div>
          <div className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Question Review ───
function QuestionReview({
  question,
  detail,
  index,
}: {
  question: ReadingQuestion;
  detail: GradingDetail | undefined;
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isCorrect = detail?.isCorrect ?? false;
  const userOpt = question.options.find(o => o.id === detail?.userAnswer);
  const correctOpt = question.options.find(o => o.id === question.correctAnswer);

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ borderColor: isCorrect ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)' }}>
      {/* Header */}
      <button onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-start gap-3 p-4 text-left"
        style={{ backgroundColor: isCorrect ? 'rgba(34,197,94,.04)' : 'rgba(239,68,68,.04)' }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white"
          style={{ background: isCorrect ? '#22C55E' : '#EF4444' }}>
          {isCorrect ? <IconCheck size={13} /> : <IconX size={13} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
            Câu {index + 1}: {question.questionText}
          </p>
          <p className="text-[12px] mt-1" style={{ color: isCorrect ? '#22C55E' : '#EF4444' }}>
            {isCorrect ? '✓ Đúng' : `✗ Sai — Đáp án: ${correctOpt?.text || question.correctAnswer}`}
          </p>
        </div>
      </button>

      {/* Detail */}
      {isOpen && (
        <div className="px-4 pb-4 border-t"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
          <div className="pt-4 space-y-3">
            {/* Options */}
            <div className="space-y-2">
              {question.options.map(opt => {
                const isUserAnswer = opt.id === detail?.userAnswer;
                const isCorrectAnswer = opt.id === question.correctAnswer;
                let borderColor = 'var(--theme-border)';
                let bgColor = 'transparent';
                let textColor = 'var(--theme-text-secondary)';
                if (isCorrectAnswer) { borderColor = '#22C55E'; bgColor = 'rgba(34,197,94,.08)'; textColor = '#22C55E'; }
                if (isUserAnswer && !isCorrectAnswer) { borderColor = '#EF4444'; bgColor = 'rgba(239,68,68,.08)'; textColor = '#EF4444'; }

                return (
                  <div key={opt.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px]"
                    style={{ borderColor, backgroundColor: bgColor, color: textColor }}>
                    <span className="font-bold">{opt.id.toUpperCase()}.</span>
                    <span>{opt.text}</span>
                    {isCorrectAnswer && <span className="ml-auto text-[10px] font-bold">✓ Đúng</span>}
                    {isUserAnswer && !isCorrectAnswer && <span className="ml-auto text-[10px] font-bold">✗ Bạn chọn</span>}
                  </div>
                );
              })}
            </div>

            {/* Explanations */}
            {detail?.explanationVi && (
              <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(34,197,94,.06)' }}>
                <p className="text-[12px] font-bold mb-1" style={{ color: ACCENT }}>Giải thích (VN):</p>
                <p className="text-[13px]" style={{ color: 'var(--theme-text-primary)' }}>{detail.explanationVi}</p>
              </div>
            )}
            {detail?.explanationDe && (
              <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(59,130,246,.06)' }}>
                <p className="text-[12px] font-bold mb-1" style={{ color: '#3B82F6' }}>Erklärung (DE):</p>
                <p className="text-[13px]" style={{ color: 'var(--theme-text-primary)' }}>{detail.explanationDe}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───
export default function ReadingResultPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading, error } = useReadingSession(id);
  const [showPassage, setShowPassage] = useState(false);
  const [showVocab, setShowVocab] = useState(false);

  if (isLoading) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <IconLoader size={32} style={{ color: ACCENT }} />
          <p style={{ color: 'var(--theme-text-muted)' }}>Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="py-6 text-center">
        <p className="mb-4" style={{ color: 'var(--theme-text-muted)' }}>Không tìm thấy kết quả.</p>
        <Link href="/practice-test/reading" className="text-[14px] font-semibold" style={{ color: ACCENT }}>
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const questions = session.questions as ReadingQuestion[];
  const gradingDetails = (session.gradingDetails || []) as GradingDetail[];
  const vocabHighlights = (session.vocabHighlights || []) as VocabHighlight[];
  const score = session.score ?? 0;

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/practice-test/reading"
          className="flex items-center gap-1 text-[13px] font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--theme-text-muted)' }}>
          <IconChevronLeft size={14} /> Danh sách
        </Link>
        <div className="flex-1" />
        <span className="px-3 py-1 rounded-xl text-[12px] font-bold"
          style={{ backgroundColor: 'rgba(34,197,94,.1)', color: ACCENT }}>
          {session.cefrLevel}
        </span>
      </div>

      {/* Score Ring */}
      <div className="rounded-2xl border mb-6"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <div className="p-4 text-center border-b" style={{ borderColor: 'var(--theme-border)' }}>
          <h1 className="text-[16px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {session.title}
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {session.topic} · {session.textType}
          </p>
        </div>
        <ScoreRing score={score} />
        <div className="px-4 pb-4">
          <StatsRow correct={session.correctCount} total={session.totalQuestions} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => setShowPassage(v => !v)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:-translate-y-0.5"
          style={showPassage
            ? { background: GRADIENT, color: 'white', boxShadow: '0 4px 12px rgba(34,197,94,.3)' }
            : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }
          }>
          <IconBookOpen size={14} />
          {showPassage ? 'Ẩn bài đọc' : 'Xem lại bài đọc'}
        </button>
        {vocabHighlights.length > 0 && (
          <button onClick={() => setShowVocab(v => !v)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:-translate-y-0.5"
            style={showVocab
              ? { background: GRADIENT, color: 'white', boxShadow: '0 4px 12px rgba(34,197,94,.3)' }
              : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }
            }>
            <IconList size={14} />
            Từ vựng ({vocabHighlights.length})
          </button>
        )}
      </div>

      {/* Passage (collapsible) */}
      {showPassage && (
        <div className="rounded-2xl border p-5 mb-6"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{session.title}</h2>
            <button onClick={() => speakText(session.passage)}
              className="p-2 rounded-xl flex-shrink-0 transition-all hover:scale-110"
              style={{ backgroundColor: 'rgba(34,197,94,.1)', color: ACCENT }}>
              <IconVolume2 size={16} />
            </button>
          </div>
          <div className="text-[14px] leading-relaxed whitespace-pre-wrap"
            style={{ color: 'var(--theme-text-primary)', fontFamily: 'Georgia, serif' }}>
            {session.passage}
          </div>
        </div>
      )}

      {/* Vocab (collapsible) */}
      {showVocab && vocabHighlights.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
          {vocabHighlights.map((v, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-xl border"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
              <button onClick={() => speakText(v.word)}
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

      {/* Questions Review */}
      <div className="space-y-3">
        <h3 className="text-[13px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
          Xem lại từng câu
        </h3>
        {questions.map((q, i) => {
          const detail = gradingDetails.find(d => d.questionId === q.id);
          return (
            <QuestionReview key={q.id} question={q} detail={detail} index={i} />
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="flex gap-3 mt-8">
        <Link href="/practice-test/reading/new"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[14px] text-white transition-all hover:-translate-y-0.5"
          style={{ background: GRADIENT, boxShadow: '0 4px 12px rgba(34,197,94,.3)' }}>
          Bài mới
        </Link>
        <Link href="/practice-test/reading"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[14px] transition-all hover:-translate-y-0.5 border-2"
          style={{ borderColor: ACCENT, color: ACCENT }}>
          Danh sách
        </Link>
      </div>
    </div>
  );
}
