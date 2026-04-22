'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useReadingSession } from '@/hooks/useReading';
import { ReadingQuestion, GradingDetail } from '@/lib/api/reading';
import { IconCheck, IconX, IconLoader } from '../../icons';
import {
  PageHeader,
  ScoreRing,
  StatGrid,
  FixedActionBar,
  Button,
  type StatItem,
} from '@/components/ui';
import { ACCENT } from '@/lib/tokens';

function getGradeInfo(score: number): { emoji: string; label: string; color: string; bg: string } {
  if (score >= 90) return { emoji: '🏆', label: 'Xuất sắc!', color: '#22C55E', bg: 'rgba(34,197,94,.15)' };
  if (score >= 75) return { emoji: '🌟', label: 'Rất tốt! 👏', color: '#22C55E', bg: 'rgba(34,197,94,.12)' };
  if (score >= 60) return { emoji: '👍', label: 'Khá tốt!', color: '#F59E0B', bg: 'rgba(245,158,11,.12)' };
  if (score >= 40) return { emoji: '📖', label: 'Cần cố gắng thêm', color: '#F97316', bg: 'rgba(249,115,22,.12)' };
  return { emoji: '💪', label: 'Hãy ôn luyện thêm', color: '#EF4444', bg: 'rgba(239,68,68,.12)' };
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  return `${m}p${s.toString().padStart(2, '0')}s`;
}

function QuestionItem({
  question, detail, index,
}: { question: ReadingQuestion; detail: GradingDetail | undefined; index: number }) {
  const [open, setOpen] = useState(false);
  const isCorrect = detail?.isCorrect ?? false;
  const correctOpt = question.options.find(o => o.id === question.correctAnswer);
  const LABELS = ['A', 'B', 'C', 'D'];

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ borderColor: isCorrect ? 'rgba(34,197,94,.25)' : 'rgba(239,68,68,.25)' }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        style={{ backgroundColor: isCorrect ? 'rgba(34,197,94,.04)' : 'rgba(239,68,68,.04)' }}>
        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-caption"
          style={{ background: isCorrect ? '#22C55E' : '#EF4444' }}>
          {isCorrect ? <IconCheck size={11} /> : <IconX size={11} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body font-semibold leading-snug" style={{ color: 'var(--theme-text-primary)' }}>
            Câu {index + 1}: {question.questionText}
          </p>
          {!isCorrect && (
            <p className="text-xs mt-0.5" style={{ color: '#EF4444' }}>
              Đáp án đúng: {correctOpt?.text || question.correctAnswer}
            </p>
          )}
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className="shrink-0 transition-transform" style={{ color: 'var(--theme-text-muted)', transform: open ? 'rotate(180deg)' : 'none' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t space-y-3"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
          <div className="grid grid-cols-2 gap-2 pt-3">
            {question.options.map((opt, oi) => {
              const isUser = opt.id === detail?.userAnswer;
              const isCorrectOpt = opt.id === question.correctAnswer;
              let border = 'var(--theme-border)';
              let bg = 'transparent';
              let color = 'var(--theme-text-secondary)';
              if (isCorrectOpt) { border = '#22C55E'; bg = 'rgba(34,197,94,.08)'; color = '#22C55E'; }
              if (isUser && !isCorrectOpt) { border = '#EF4444'; bg = 'rgba(239,68,68,.08)'; color = '#EF4444'; }

              return (
                <div key={opt.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs"
                  style={{ borderColor: border, backgroundColor: bg, color }}>
                  <span className="w-5 h-5 rounded-full border flex items-center justify-center text-caption font-bold shrink-0"
                    style={{ borderColor: border, color }}>
                    {LABELS[oi] ?? opt.id.toUpperCase()}
                  </span>
                  <span className="flex-1 leading-snug">{opt.text}</span>
                  {isCorrectOpt && <span className="text-caption font-bold shrink-0">✓</span>}
                  {isUser && !isCorrectOpt && <span className="text-caption font-bold shrink-0">✗</span>}
                </div>
              );
            })}
          </div>

          {detail?.explanationVi && (
            <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(34,197,94,.07)' }}>
              <p className="text-caption font-bold mb-1" style={{ color: ACCENT.reading }}>Giải thích:</p>
              <p className="text-body" style={{ color: 'var(--theme-text-primary)' }}>{detail.explanationVi}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReadingResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isLoading, error } = useReadingSession(id);
  const [filter, setFilter] = useState<'all' | 'wrong' | 'correct'>('all');
  const [timeMs, setTimeMs] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`reading_time_${id}`);
    if (stored) setTimeMs(parseInt(stored, 10));
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <IconLoader size={32} style={{ color: ACCENT.reading }} />
          <p style={{ color: 'var(--theme-text-muted)' }}>Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="py-10 text-center">
        <p className="mb-4" style={{ color: 'var(--theme-text-muted)' }}>Không tìm thấy kết quả.</p>
        <Link href="/practice-test/reading" className="text-sm font-semibold" style={{ color: ACCENT.reading }}>
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const questions = session.questions as ReadingQuestion[];
  const gradingDetails = (session.gradingDetails || []) as GradingDetail[];
  const correct = session.correctCount;
  const total = session.totalQuestions;
  const wrong = total - correct;
  const scorePct = total > 0 ? (correct / total) * 100 : 0;
  const grade = getGradeInfo(scorePct);

  const filteredQuestions = questions.filter(q => {
    const detail = gradingDetails.find(d => d.questionId === q.id);
    if (filter === 'correct') return detail?.isCorrect === true;
    if (filter === 'wrong') return detail?.isCorrect === false;
    return true;
  });

  const TABS: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'wrong', label: 'Sai' },
    { key: 'correct', label: 'Đúng' },
  ];

  const stats: StatItem[] = [
    { icon: <span style={{ fontSize: 18 }}>✓</span>, label: 'Đúng', value: correct, accent: 'reading' },
    { icon: <span style={{ fontSize: 18 }}>✗</span>, label: 'Sai', value: wrong },
    { icon: <span style={{ fontSize: 18 }}>⏱</span>, label: 'Thời gian', value: timeMs !== null ? formatTime(timeMs) : '—', accent: 'srs' },
    { icon: <span style={{ fontSize: 18 }}>★</span>, label: 'Điểm', value: `${Math.round(scorePct)}%`, accent: 'xp' },
  ];

  return (
    <div className="py-6">
      <PageHeader
        backHref="/practice-test/reading"
        title="Kết quả bài đọc"
        subtitle={`${session.title} · ${session.topic} · ${session.textType}`}
        accent="reading"
        right={
          <span className="px-3 py-1 rounded-xl text-xs font-bold"
            style={{ backgroundColor: 'rgba(34,197,94,.1)', color: ACCENT.reading }}>
            {session.cefrLevel}
          </span>
        }
      />

      {/* Hero Result Card */}
      <div className="rounded-2xl border mb-5 overflow-hidden"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-1/2 flex flex-col items-center justify-center gap-4 py-6 px-4 border-b sm:border-b-0 sm:border-r"
            style={{ borderColor: 'var(--theme-border)' }}>
            <ScoreRing
              value={scorePct}
              label={`${correct}/${total}`}
              sublabel={`${Math.round(scorePct)}%`}
              accent="reading"
              variant="free"
              size={144}
            />
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-body font-bold"
              style={{ backgroundColor: grade.bg, color: grade.color }}>
              <span>{grade.emoji}</span>
              <span>{grade.label}</span>
            </div>
          </div>
          <div className="sm:w-1/2 flex items-center p-4">
            <StatGrid items={stats} columns={2} className="w-full" />
          </div>
        </div>
      </div>

      {/* Question Review */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-body font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
            Xem lại từng câu
          </h3>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-3"
          style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={filter === tab.key
                ? { background: 'linear-gradient(135deg, #22C55E, #14B8A6)', color: 'white', boxShadow: '0 2px 8px rgba(34,197,94,.25)' }
                : { color: 'var(--theme-text-muted)' }
              }>
              {tab.label}
              {tab.key !== 'all' && (
                <span className="ml-1 opacity-75">
                  ({tab.key === 'wrong' ? wrong : correct})
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
            const detail = gradingDetails.find(d => d.questionId === q.id);
            const originalIndex = questions.findIndex(orig => orig.id === q.id);
            return (
              <QuestionItem key={q.id} question={q} detail={detail} index={originalIndex} />
            );
          })
        )}
      </div>

      <FixedActionBar columns={2}>
        <Button variant="outline" fullWidth onClick={() => router.push('/practice-test/reading')}>
          Danh sách
        </Button>
        <Button variant="game" accent="reading" fullWidth onClick={() => router.push('/practice-test/reading/new')}>
          Bài mới
        </Button>
      </FixedActionBar>
    </div>
  );
}
