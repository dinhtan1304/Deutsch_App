'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useListeningSession } from '@/hooks/useListening';
import { ListeningQuestion } from '@/lib/api/listening';

function IconHeadphones({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>;
}
function IconChevronLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconVolume2({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>;
}

const ACCENT = '#EC4899';
const GRADIENT = 'linear-gradient(135deg, #EC4899, #8B5CF6)';

function ScoreRing({ score }: { score: number }) {
  const r = 52, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444';
  const pass = score >= 60;

  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative w-32 h-32">
        <svg width={128} height={128} className="-rotate-90">
          <circle cx={64} cy={64} r={r} fill="none" stroke="var(--theme-border)" strokeWidth={10} />
          <circle cx={64} cy={64} r={r} fill="none" stroke={color} strokeWidth={10}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] font-extrabold" style={{ color }}>{Math.round(score)}%</span>
        </div>
      </div>
      <span className="mt-2 px-4 py-1 rounded-full text-[13px] font-bold text-white" style={{ background: pass ? '#22C55E' : '#EF4444' }}>
        {pass ? 'Xuất sắc ✓' : 'Cần luyện thêm'}
      </span>
    </div>
  );
}

function speakText(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE'; u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

export default function ListeningResultPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading } = useListeningSession(id);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showReview, setShowReview] = useState(false);

  if (isLoading) return <div className="py-16 text-center" style={{ color: 'var(--theme-text-muted)' }}>Đang tải...</div>;
  if (!session) return <div className="py-16 text-center" style={{ color: 'var(--theme-text-muted)' }}>Không tìm thấy bài nghe.</div>;

  const questions = session.questions as ListeningQuestion[];
  const userAnswers = (session.userAnswers || {}) as Record<string, string>;
  const score = session.score ?? 0;

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
        <div>
          <h1 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>Kết Quả</h1>
          <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{session.cefrLevel} · {session.title}</p>
        </div>
      </div>

      {/* Score ring */}
      <div className="rounded-2xl border mb-4" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <ScoreRing score={score} />
        <div className="flex divide-x border-t" style={{ borderColor: 'var(--theme-border)' }}>
          {[
            { label: 'Đúng', value: session.correctCount },
            { label: 'Sai', value: session.totalQ - session.correctCount },
            { label: 'Tổng', value: session.totalQ },
          ].map(s => (
            <div key={s.label} className="flex-1 py-3 text-center">
              <p className="text-[18px] font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{s.value}</p>
              <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transcript (revealed after grading) */}
      <div className="rounded-2xl border mb-4 overflow-hidden" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <button onClick={() => setShowTranscript(v => !v)}
          className="w-full flex items-center justify-between p-4 text-left"
          style={{ color: 'var(--theme-text-primary)' }}>
          <div className="flex items-center gap-2">
            <IconVolume2 size={16} style={{ color: ACCENT }} />
            <span className="text-[14px] font-bold">Transcript (Văn bản audio)</span>
          </div>
          <span className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>{showTranscript ? '▲' : '▼'}</span>
        </button>
        {showTranscript && (
          <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
            <button onClick={() => speakText(session.transcript)}
              className="flex items-center gap-1.5 text-[12px] font-semibold mt-3 mb-2"
              style={{ color: ACCENT }}>
              <IconVolume2 size={13} style={{ color: ACCENT }} /> Nghe lại
            </button>
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--theme-text-primary)', fontFamily: 'Georgia, serif' }}>
              {session.transcript}
            </p>
          </div>
        )}
      </div>

      {/* Question review */}
      <div className="rounded-2xl border mb-5 overflow-hidden" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <button onClick={() => setShowReview(v => !v)}
          className="w-full flex items-center justify-between p-4 text-left"
          style={{ color: 'var(--theme-text-primary)' }}>
          <span className="text-[14px] font-bold">Xem lại câu hỏi</span>
          <span className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>{showReview ? '▲' : '▼'}</span>
        </button>
        {showReview && (
          <div className="border-t divide-y" style={{ borderColor: 'var(--theme-border)' }}>
            {questions.map((q, i) => {
              const userAns = userAnswers[q.id];
              const correct = userAns?.toLowerCase() === q.correctAnswer.toLowerCase();
              return (
                <div key={q.id} className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-[14px] shrink-0">{correct ? '✅' : '❌'}</span>
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                      {i + 1}. {q.questionText}
                    </p>
                  </div>
                  <div className="ml-6 space-y-1">
                    <p className="text-[12px]" style={{ color: correct ? '#22C55E' : '#EF4444' }}>
                      Bạn trả lời: <strong>{userAns ?? '—'}</strong>
                    </p>
                    {!correct && (
                      <p className="text-[12px]" style={{ color: '#22C55E' }}>
                        Đáp án đúng: <strong>{q.correctAnswer}</strong>
                      </p>
                    )}
                    <p className="text-[12px] mt-1.5 p-2.5 rounded-xl"
                      style={{ color: 'var(--theme-text-secondary)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                      {q.explanationVi}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/practice-test/listening"
          className="flex-1 py-3 rounded-2xl border text-center text-[14px] font-semibold"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
          Danh sách
        </Link>
        <Link href="/practice-test/listening/new"
          className="flex-1 py-3 rounded-2xl text-center text-[14px] font-bold text-white"
          style={{ background: GRADIENT }}>
          Bài mới +
        </Link>
      </div>
    </div>
  );
}
