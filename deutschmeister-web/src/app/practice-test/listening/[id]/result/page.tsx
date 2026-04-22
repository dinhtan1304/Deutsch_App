'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useListeningSession } from '@/hooks/useListening';
import { ListeningQuestion } from '@/lib/api/listening';
import { PageHeader, FixedActionBar } from '@/components/ui';

function IconChevronLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconVolume2({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>;
}
function IconCheck({ size = 11 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="20 6 9 17 4 12" /></svg>;
}
function IconXMark({ size = 11 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function IconLoader({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}

const ACCENT = '#EC4899';
const GRADIENT = 'linear-gradient(135deg, #EC4899, #8B5CF6)';

function getGradeInfo(score: number): { emoji: string; label: string; color: string; bg: string } {
  if (score >= 90) return { emoji: '🏆', label: 'Xuất sắc!', color: '#22C55E', bg: 'rgba(34,197,94,.15)' };
  if (score >= 75) return { emoji: '🌟', label: 'Rất tốt! 👏', color: '#22C55E', bg: 'rgba(34,197,94,.12)' };
  if (score >= 60) return { emoji: '👍', label: 'Khá tốt!', color: '#F59E0B', bg: 'rgba(245,158,11,.12)' };
  if (score >= 40) return { emoji: '📖', label: 'Cần cố gắng thêm', color: '#F97316', bg: 'rgba(249,115,22,.12)' };
  return { emoji: '💪', label: 'Hãy ôn luyện thêm', color: '#EF4444', bg: 'rgba(239,68,68,.12)' };
}

function speakText(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE'; u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

// ─── Score Ring ───
function ScoreRing({ correct, total }: { correct: number; total: number }) {
  const score = total > 0 ? (correct / total) * 100 : 0;
  const grade = getGradeInfo(score);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-4 py-6 px-4">
      <div className="relative w-36 h-36">
        <svg width="144" height="144" viewBox="0 0 120 120" className="-rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--theme-bg-secondary)" strokeWidth="10" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={grade.color} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-h1 font-extrabold leading-none" style={{ color: grade.color }}>
            {correct}/{total}
          </span>
          <span className="text-sm font-bold mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {Math.round(score)}%
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-body font-bold"
        style={{ backgroundColor: grade.bg, color: grade.color }}>
        <span>{grade.emoji}</span>
        <span>{grade.label}</span>
      </div>
    </div>
  );
}

// ─── Stat Grid ───
function StatGrid({ correct, total }: { correct: number; total: number }) {
  const wrong = total - correct;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const stats = [
    { icon: '✓', label: 'Đúng', value: correct, color: '#22C55E', bg: 'rgba(34,197,94,.1)' },
    { icon: '✗', label: 'Sai', value: wrong, color: '#EF4444', bg: 'rgba(239,68,68,.1)' },
    { icon: '★', label: 'Điểm', value: `${score}%`, color: '#F59E0B', bg: 'rgba(245,158,11,.1)' },
    { icon: '🎧', label: 'Câu hỏi', value: total, color: ACCENT, bg: 'rgba(236,72,153,.1)' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5 w-full">
      {stats.map((s, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 rounded-xl py-4"
          style={{ backgroundColor: s.bg }}>
          <span className="text-[15px]" style={{ color: s.color }}>{s.icon}</span>
          <span className="text-h2 font-extrabold leading-none" style={{ color: s.color }}>{s.value}</span>
          <span className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Question Item ───
function QuestionItem({ question, userAnswer, index }: {
  question: ListeningQuestion; userAnswer: string | undefined; index: number;
}) {
  const [open, setOpen] = useState(false);
  const isCorrect = userAnswer?.toLowerCase() === question.correctAnswer.toLowerCase();

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ borderColor: isCorrect ? 'rgba(34,197,94,.25)' : 'rgba(239,68,68,.25)' }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        style={{ backgroundColor: isCorrect ? 'rgba(34,197,94,.04)' : 'rgba(239,68,68,.04)' }}>
        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white"
          style={{ background: isCorrect ? '#22C55E' : '#EF4444' }}>
          {isCorrect ? <IconCheck size={11} /> : <IconXMark size={11} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body font-semibold leading-snug" style={{ color: 'var(--theme-text-primary)' }}>
            Câu {index + 1}: {question.questionText}
          </p>
          {!isCorrect && (
            <p className="text-xs mt-0.5" style={{ color: '#EF4444' }}>
              Đáp án đúng: {question.correctAnswer}
            </p>
          )}
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className="shrink-0 transition-transform"
          style={{ color: 'var(--theme-text-muted)', transform: open ? 'rotate(180deg)' : 'none' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t space-y-3"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
          <div className="flex gap-4 pt-3 text-xs flex-wrap">
            <div>
              <span style={{ color: 'var(--theme-text-muted)' }}>Bạn trả lời: </span>
              <span className="font-bold" style={{ color: isCorrect ? '#22C55E' : '#EF4444' }}>
                {userAnswer ?? '—'}
              </span>
            </div>
            {!isCorrect && (
              <div>
                <span style={{ color: 'var(--theme-text-muted)' }}>Đáp án đúng: </span>
                <span className="font-bold" style={{ color: '#22C55E' }}>{question.correctAnswer}</span>
              </div>
            )}
          </div>
          {question.explanationVi && (
            <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(236,72,153,.07)' }}>
              <p className="text-caption font-bold mb-1" style={{ color: ACCENT }}>Giải thích:</p>
              <p className="text-body" style={{ color: 'var(--theme-text-primary)' }}>{question.explanationVi}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───
export default function ListeningResultPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading } = useListeningSession(id);
  const [showTranscript, setShowTranscript] = useState(false);
  const [filter, setFilter] = useState<'all' | 'wrong' | 'correct'>('all');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <IconLoader size={32} style={{ color: ACCENT }} />
          <p style={{ color: 'var(--theme-text-muted)' }}>Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-10 text-center">
        <p className="mb-4" style={{ color: 'var(--theme-text-muted)' }}>Không tìm thấy kết quả.</p>
        <Link href="/practice-test/listening" className="text-sm font-semibold" style={{ color: ACCENT }}>
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const questions = session.questions as ListeningQuestion[];
  const userAnswers = (session.userAnswers || {}) as Record<string, string>;
  const correct = session.correctCount ?? 0;
  const total = session.totalQ ?? questions.length;
  const wrongCount = total - correct;

  const filteredQuestions = questions.filter(q => {
    const isCorrect = userAnswers[q.id]?.toLowerCase() === q.correctAnswer.toLowerCase();
    if (filter === 'correct') return isCorrect;
    if (filter === 'wrong') return !isCorrect;
    return true;
  });

  const TABS: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'wrong', label: 'Sai' },
    { key: 'correct', label: 'Đúng' },
  ];

  return (
    <div className="py-6">
      <PageHeader
        backHref="/practice-test/listening"
        title="Kết quả bài nghe"
        accent="listening"
        right={
          <span className="px-3 py-1 rounded-xl text-xs font-bold"
            style={{ backgroundColor: 'rgba(236,72,153,.1)', color: ACCENT }}>
            {session.cefrLevel}
          </span>
        }
      />

      {/* Hero Result Card */}
      <div className="rounded-2xl border mb-5 overflow-hidden"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <div className="px-5 pt-4 pb-3 border-b text-center" style={{ borderColor: 'var(--theme-border)' }}>
          <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            Bài nghe: {session.title}
          </p>
          <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            {session.cefrLevel}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-1/2 flex items-center justify-center border-b sm:border-b-0 sm:border-r"
            style={{ borderColor: 'var(--theme-border)' }}>
            <ScoreRing correct={correct} total={total} />
          </div>
          <div className="sm:w-1/2 flex items-center p-4">
            <StatGrid correct={correct} total={total} />
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="rounded-2xl border mb-5 overflow-hidden"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <button onClick={() => setShowTranscript(v => !v)}
          className="w-full flex items-center justify-between p-4 text-left"
          style={{ color: 'var(--theme-text-primary)' }}>
          <div className="flex items-center gap-2">
            <IconVolume2 size={16} style={{ color: ACCENT }} />
            <span className="text-sm font-bold">Transcript (Văn bản audio)</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className="shrink-0 transition-transform"
            style={{ color: 'var(--theme-text-muted)', transform: showTranscript ? 'rotate(180deg)' : 'none' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {showTranscript && (
          <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
            <button onClick={() => speakText(session.transcript)}
              className="flex items-center gap-1.5 text-xs font-semibold mt-3 mb-2"
              style={{ color: ACCENT }}>
              <IconVolume2 size={13} style={{ color: ACCENT }} /> Nghe lại
            </button>
            <p className="text-body leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--theme-text-primary)', fontFamily: 'Georgia, serif' }}>
              {session.transcript}
            </p>
          </div>
        )}
      </div>

      {/* Question Review */}
      <div className="space-y-3">
        <h3 className="text-body font-bold uppercase tracking-wider mb-1"
          style={{ color: 'var(--theme-text-muted)' }}>
          Xem lại từng câu
        </h3>

        {/* Filter Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={filter === tab.key
                ? { background: GRADIENT, color: 'white', boxShadow: '0 2px 8px rgba(236,72,153,.25)' }
                : { color: 'var(--theme-text-muted)' }
              }>
              {tab.label}
              {tab.key !== 'all' && (
                <span className="ml-1 opacity-75">
                  ({tab.key === 'wrong' ? wrongCount : correct})
                </span>
              )}
            </button>
          ))}
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--theme-text-muted)' }}>
            <p className="text-sm">Không có câu nào</p>
          </div>
        ) : (
          filteredQuestions.map(q => {
            const originalIndex = questions.findIndex(orig => orig.id === q.id);
            return (
              <QuestionItem
                key={q.id}
                question={q}
                userAnswer={userAnswers[q.id]}
                index={originalIndex}
              />
            );
          })
        )}
      </div>

      <FixedActionBar columns={3}>
        <Link href={`/practice-test/listening/${id}`}
          className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all hover:opacity-70"
          style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
          <span className="text-base">🔄</span>
          Nghe lại
        </Link>
        <Link href="/practice-test/listening/new"
          className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5"
          style={{ background: GRADIENT }}>
          <span className="text-base">🎧</span>
          Bài mới
        </Link>
        <button
          className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all hover:opacity-70"
          style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}
          onClick={() => {
            const score = total > 0 ? Math.round((correct / total) * 100) : 0;
            navigator.share?.({ title: 'DeutschMeister', text: `Tôi đạt ${score}% bài nghe tiếng Đức!` }).catch(() => {});
          }}>
          <span className="text-base">🔗</span>
          Chia sẻ
        </button>
      </FixedActionBar>
    </div>
  );
}
