'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useWritingSession, useExplainError } from '@/hooks/useWriting';
import { useAuthStore } from '@/stores/authStore';
import type { WritingError, GrammarAnalysis } from '@/lib/api/writing';
import { CriterionRadar } from '@/components/writing/CriterionRadar';
import { getErrorTip } from '@/data/error-tips';
import { IconChevronDown, IconDice, IconList } from '../../icons';
import { PageHeader, FixedActionBar } from '@/components/ui';

// ─── Helpers ───
function getScoreGrade(score: number) {
  if (score >= 90) return { label: 'Ausgezeichnet!', labelVi: 'Xuất sắc!', color: '#22C55E', bg: 'rgba(34,197,94,.15)' };
  if (score >= 80) return { label: 'Sehr gut!', labelVi: 'Rất tốt!', color: '#22C55E', bg: 'rgba(34,197,94,.12)' };
  if (score >= 70) return { label: 'Gut!', labelVi: 'Tốt!', color: '#3B82F6', bg: 'rgba(59,130,246,.12)' };
  if (score >= 60) return { label: 'Befriedigend', labelVi: 'Khá', color: '#F59E0B', bg: 'rgba(245,158,11,.12)' };
  if (score >= 40) return { label: 'Ausreichend', labelVi: 'Đạt', color: '#F97316', bg: 'rgba(249,115,22,.12)' };
  return { label: 'Weiter üben!', labelVi: 'Cần cố gắng thêm!', color: '#EF4444', bg: 'rgba(239,68,68,.12)' };
}

const ERROR_TYPE_INFO: Record<string, { labelVi: string; color: string }> = {
  article:     { labelVi: 'Mạo từ',       color: '#EF4444' },
  grammar:     { labelVi: 'Ngữ pháp',     color: '#8B5CF6' },
  word_order:  { labelVi: 'Trật tự từ',   color: '#3B82F6' },
  conjugation: { labelVi: 'Chia động từ', color: '#14B8A6' },
  case:        { labelVi: 'Cách',         color: '#6366F1' },
  spelling:    { labelVi: 'Chính tả',     color: '#F97316' },
  vocabulary:  { labelVi: 'Từ vựng',      color: '#22C55E' },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  error:      { label: 'Lỗi',      color: '#EF4444' },
  warning:    { label: 'Cảnh báo', color: '#F59E0B' },
  suggestion: { label: 'Gợi ý',    color: '#3B82F6' },
};

const ACCENT = '#6366F1';
const GRADIENT = 'linear-gradient(135deg, #6366F1, #8B5CF6)';

// ─── Score Ring ───
function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;
  const grade = getScoreGrade(score);

  return (
    <div className="flex flex-col items-center gap-4 py-6 px-4">
      <div className="relative w-36 h-36">
        <svg width="144" height="144" viewBox="0 0 120 120" className="-rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" stroke="var(--theme-bg-secondary)" />
          <circle cx="60" cy="60" r="52" fill="none" stroke={grade.color} strokeWidth="10"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-h1 font-extrabold leading-none" style={{ color: grade.color }}>
            {Math.round(score)}
          </span>
          <span className="text-xs font-medium mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>/100</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-body font-bold"
          style={{ backgroundColor: grade.bg, color: grade.color }}>
          <span>{grade.label}</span>
        </div>
        <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{grade.labelVi}</p>
      </div>
    </div>
  );
}

// ─── Deep Analysis Section ───
function AnalysisPanel({ analysis }: { analysis: GrammarAnalysis }) {
  return (
    <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: 'rgba(139,92,246,0.2)' }}>
      <div>
        <span className="text-caption font-bold uppercase" style={{ color: '#8B5CF6' }}>Phân tích ngữ pháp</span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {analysis.components.map((c, i) => (
            <span key={i} className="px-2 py-1 rounded-lg text-caption" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>{c.text}</span>
              <span className="ml-1" style={{ color: 'var(--theme-text-muted)' }}>({c.roleVi})</span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex gap-4 text-xs">
        <div><span style={{ color: 'var(--theme-text-muted)' }}>Thì: </span><span className="font-medium" style={{ color: 'var(--theme-text-primary)' }}>{analysis.tenseVi}</span></div>
        <div><span style={{ color: 'var(--theme-text-muted)' }}>Loại câu: </span><span className="font-medium" style={{ color: 'var(--theme-text-primary)' }}>{analysis.sentenceTypeVi}</span></div>
      </div>
      {analysis.hasErrors && (
        <div>
          <span className="text-caption font-bold uppercase" style={{ color: 'var(--theme-text-muted)' }}>Câu đúng</span>
          <p className="text-body mt-0.5 font-medium" style={{ color: '#22C55E' }}>{analysis.correctedSentence}</p>
        </div>
      )}
      {analysis.grammarRules.length > 0 && (
        <div>
          <span className="text-caption font-bold uppercase" style={{ color: 'var(--theme-text-muted)' }}>Quy tắc ngữ pháp</span>
          <ul className="mt-1 space-y-1">
            {analysis.grammarRules.map((r, i) => (
              <li key={i} className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                <span className="font-medium">{r.rule}</span> — {r.ruleVi}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <span className="text-caption font-bold uppercase" style={{ color: 'var(--theme-text-muted)' }}>Giải thích</span>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{analysis.explanationVi}</p>
      </div>
      <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(139,92,246,0.06)' }}>
        <p className="text-xs" style={{ color: '#8B5CF6' }}>
          <span className="font-bold">Mẹo: </span>{analysis.tipVi}
        </p>
      </div>
    </div>
  );
}

// ─── Error Card ───
function ErrorCard({ error, sessionId }: { error: WritingError; sessionId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [analysis, setAnalysis] = useState<GrammarAnalysis | null>(null);
  const explainMut = useExplainError();
  const { user } = useAuthStore();
  const isPremium = user?.subscription?.plan === 'premium' && user?.subscription?.status === 'active';
  const typeInfo = ERROR_TYPE_INFO[error.errorType] || { labelVi: error.errorType, color: '#6B7280' };
  const severity = SEVERITY_CONFIG[error.severity] || SEVERITY_CONFIG.error;

  const handleExplain = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (analysis) return;
    const res = await explainMut.mutateAsync({ sessionId, errorId: error.id });
    setAnalysis(res.analysis);
  };

  return (
    <button onClick={() => setExpanded(!expanded)}
      className="w-full text-left rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <div className="flex items-start gap-3">
        <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: severity.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-md text-caption font-bold"
              style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}>
              {typeInfo.labelVi}
            </span>
            <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{severity.label}</span>
          </div>
          <div className="flex items-center gap-2 text-body flex-wrap">
            <span className="line-through font-medium" style={{ color: '#EF4444' }}>{error.originalText}</span>
            <span style={{ color: 'var(--theme-text-muted)' }}>→</span>
            <span className="font-medium" style={{ color: '#22C55E' }}>{error.correctedText}</span>
          </div>
          {expanded && (
            <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: 'var(--theme-border)' }}>
              <div>
                <span className="text-caption font-bold uppercase" style={{ color: 'var(--theme-text-muted)' }}>Deutsch</span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>{error.explanationDe}</p>
              </div>
              <div>
                <span className="text-caption font-bold uppercase" style={{ color: 'var(--theme-text-muted)' }}>Tiếng Việt</span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>{error.explanationVi}</p>
              </div>
              {(() => {
                const tip = getErrorTip(error.errorType);
                if (!tip) return null;
                return (
                  <div className="mt-1 rounded-lg p-3" style={{ backgroundColor: `${typeInfo.color}0C`, border: `1px solid ${typeInfo.color}26` }}>
                    <div className="flex items-start gap-2">
                      <span className="text-sm leading-none mt-0.5">💡</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                          <span className="font-bold" style={{ color: typeInfo.color }}>Mẹo: </span>
                          {tip.tipVi}
                        </p>
                        {tip.example && (
                          <p className="mt-1.5 text-[11.5px] italic" style={{ color: 'var(--theme-text-muted)' }}>{tip.example}</p>
                        )}
                        {tip.lessonSlug && tip.lessonTitleVi && (
                          <Link
                            href={`/grammar/${tip.lessonSlug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-caption font-semibold transition-colors"
                            style={{ color: typeInfo.color, backgroundColor: `${typeInfo.color}14` }}>
                            Học bài: {tip.lessonTitleVi} →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
              {!analysis && (
                <button
                  onClick={handleExplain}
                  disabled={explainMut.isPending}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{
                    color: isPremium ? '#8B5CF6' : 'var(--theme-text-muted)',
                    backgroundColor: isPremium ? 'rgba(139,92,246,0.08)' : 'var(--theme-bg-secondary)',
                  }}>
                  {explainMut.isPending ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                  )}
                  {isPremium ? 'Giải thích chi tiết bằng AI' : 'Giải thích chi tiết (Premium)'}
                </button>
              )}
              {analysis && <AnalysisPanel analysis={analysis} />}
            </div>
          )}
        </div>
        <span className="shrink-0 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--theme-text-muted)' }}>
          <IconChevronDown size={16} />
        </span>
      </div>
    </button>
  );
}

// ─── Main Page ───
export default function WritingResultPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session, isLoading, isError } = useWritingSession(id);
  const [showOriginal, setShowOriginal] = useState(true);
  const [filterType, setFilterType] = useState<string>('');

  if (isLoading) {
    return (
      <div className="py-6 space-y-6">
        <div className="h-8 w-48 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          <div className="md:col-span-2 h-52 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
          <div className="md:col-span-3 space-y-3">
            <div className="h-28 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
            <div className="h-28 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !session || session.status !== 'GRADED') {
    return (
      <div className="py-20 text-center">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
          style={{ background: GRADIENT }}>
          <IconList size={28} style={{ color: 'white' }} />
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>
          {session?.status === 'GRADING' ? 'Bài viết đang được chấm... Vui lòng đợi.' : 'Không tìm thấy kết quả'}
        </p>
        <Link href="/practice-test/writing" className="text-body font-medium" style={{ color: ACCENT }}>
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const errors = (session.errors || []) as WritingError[];
  const errorsByType: Record<string, number> = {};
  errors.forEach(e => { errorsByType[e.errorType] = (errorsByType[e.errorType] || 0) + 1; });
  const filteredErrors = filterType ? errors.filter(e => e.errorType === filterType) : errors;
  const overallScore = session.overallScore || 0;

  return (
    <div className="py-6">
      <PageHeader
        backHref="/practice-test/writing"
        title="Kết quả bài viết"
        accent="writing"
        right={
          <span className="px-3 py-1 rounded-xl text-xs font-bold"
            style={{ backgroundColor: 'rgba(99,102,241,.1)', color: ACCENT }}>
            {session.cefrLevel}
          </span>
        }
      />

      {/* Hero Result Card */}
      <div className="rounded-2xl border mb-5 overflow-hidden"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <div className="px-5 pt-4 pb-3 border-b text-center" style={{ borderColor: 'var(--theme-border)' }}>
          <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {session.topic}
          </p>
          <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            {session.cefrLevel} · {new Date(session.gradedAt!).toLocaleDateString('vi-VN')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-1/2 flex items-center justify-center border-b sm:border-b-0 sm:border-r"
            style={{ borderColor: 'var(--theme-border)' }}>
            <ScoreRing score={overallScore} />
          </div>
          {session.criterionScores ? (
            <div className="sm:w-1/2 flex items-center justify-center p-4">
              <CriterionRadar scores={session.criterionScores} size={220} />
            </div>
          ) : (
            <div className="sm:w-1/2 flex items-center justify-center p-6">
              <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>Kết quả chấm bài</p>
            </div>
          )}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(34,197,94,.2)', backgroundColor: 'rgba(34,197,94,.04)' }}>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#22C55E' }}>
            Stärken / Điểm mạnh
          </h3>
          <ul className="space-y-1.5">
            {(session.strengths as string[] || []).map((s, i) => (
              <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
                <span style={{ color: '#22C55E' }}>•</span>{s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(245,158,11,.2)', backgroundColor: 'rgba(245,158,11,.04)' }}>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#F59E0B' }}>
            Verbesserungen / Cần cải thiện
          </h3>
          <ul className="space-y-1.5">
            {(session.improvements as string[] || []).map((s, i) => (
              <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
                <span style={{ color: '#F59E0B' }}>•</span>{s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* General Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <h3 className="text-caption font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
            Feedback auf Deutsch
          </h3>
          <p className="text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{session.feedbackDe}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <h3 className="text-caption font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
            Nhận xét tiếng Việt
          </h3>
          <p className="text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{session.feedbackVi}</p>
        </div>
      </div>

      {/* Text Comparison + Error Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Text Comparison */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-base font-bold" style={{ color: 'var(--theme-text-primary)' }}>Bài viết</h2>
            <div className="flex rounded-lg p-0.5" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              {['Bài gốc', 'Bài đã sửa'].map((label, idx) => {
                const isActive = idx === 0 ? showOriginal : !showOriginal;
                return (
                  <button key={label} onClick={() => setShowOriginal(idx === 0)}
                    className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
                    style={isActive
                      ? { backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }
                      : { color: 'var(--theme-text-muted)' }
                    }>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-5 rounded-xl border min-h-64"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <p className="text-body leading-relaxed whitespace-pre-line" style={{ color: 'var(--theme-text-primary)' }}>
              {showOriginal ? session.userText : session.correctedText}
            </p>
          </div>
        </div>

        {/* Error Details */}
        <div>
          <h2 className="text-base font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
            Chi tiết lỗi ({errors.length})
          </h2>
          {Object.keys(errorsByType).length > 1 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button onClick={() => setFilterType('')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={!filterType
                  ? { background: GRADIENT, color: 'white' }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                }>
                Tất cả ({errors.length})
              </button>
              {Object.entries(errorsByType).sort(([, a], [, b]) => b - a).map(([type, count]) => {
                const info = ERROR_TYPE_INFO[type];
                return (
                  <button key={type} onClick={() => setFilterType(type === filterType ? '' : type)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={filterType === type
                      ? { background: `linear-gradient(135deg, ${info?.color || '#6B7280'}, ${info?.color || '#6B7280'}cc)`, color: 'white' }
                      : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                    }>
                    {info?.labelVi || type} ({count})
                  </button>
                );
              })}
            </div>
          )}
          {filteredErrors.length === 0 ? (
            <div className="text-center py-10 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--theme-border)' }}>
              <p className="text-title mb-1">🎉</p>
              <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>Không có lỗi nào!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-128 overflow-y-auto pr-1">
              {filteredErrors.map(error => <ErrorCard key={error.id} error={error} sessionId={id} />)}
            </div>
          )}
        </div>
      </div>

      <FixedActionBar columns={3}>
        <Link href="/practice-test/writing"
          className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all hover:opacity-70"
          style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
          <IconList size={16} />
          Lịch sử
        </Link>
        <Link href="/practice-test/writing/new"
          className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5"
          style={{ background: GRADIENT }}>
          <IconDice size={16} />
          Bài mới
        </Link>
        <button
          className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all hover:opacity-70"
          style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}
          onClick={() => {
            navigator.share?.({ title: 'DeutschMeister', text: `Tôi đạt ${Math.round(overallScore)}/100 bài viết tiếng Đức!` }).catch(() => {});
          }}>
          <span className="text-base">🔗</span>
          Chia sẻ
        </button>
      </FixedActionBar>
    </div>
  );
}
