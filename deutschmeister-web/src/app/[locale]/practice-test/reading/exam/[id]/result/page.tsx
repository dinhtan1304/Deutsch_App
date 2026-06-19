'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useExamReadingSession } from '@/hooks/useExamReading';
import { ExamReadingTeil, TeilGradingDetail, ExamTeilQuestion } from '@/lib/api/examReading';
import { InsightsPanel } from '@/components/grading/InsightsPanel';
import { coalesceInsights } from '@/lib/api/utils/insights-fallback';
import {
  PageHeader, ScoreRing, StatGrid, FixedActionBar, type StatItem,
} from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import {
  IconCheck, IconX, IconLoader, IconShare, IconSparkles,
} from '../../../icons';

// ─── Helpers ──────────────────────────────────────────────────────────────────
type TaskTypeKey = 'richtig_falsch' | 'richtig_falsch_x' | 'multiple_choice' | 'zuordnung' | 'ja_nein' | 'sentence_insertion' | 'sprachbausteine';

function useGradeInfo() {
  const t = useTranslations('practice.examCommon.result');
  return (score: number): { emoji: string; label: string; color: string; bg: string } => {
    if (score >= 90) return { emoji: '🏆', label: t('gradeExcellent'),    color: STATUS.success, bg: `${STATUS.success}26` };
    if (score >= 75) return { emoji: '🌟', label: t('gradeVeryGood'),     color: STATUS.success, bg: `${STATUS.success}1F` };
    if (score >= 60) return { emoji: '✓',  label: t('gradeBestanden'),    color: STATUS.warning, bg: `${STATUS.warning}1F` };
    if (score >= 40) return { emoji: '📖', label: t('gradeMoreEffort'),   color: ACCENT.games,   bg: `${ACCENT.games}1F` };
    return              { emoji: '💪', label: t('gradeStudyMore'),    color: STATUS.danger,  bg: `${STATUS.danger}1F` };
  };
}

function useTaskTypeLabel() {
  const t = useTranslations('practice.examReading.result.taskTypes');
  return (type: string) => {
    const keys: TaskTypeKey[] = ['richtig_falsch', 'richtig_falsch_x', 'multiple_choice', 'zuordnung', 'ja_nein', 'sentence_insertion', 'sprachbausteine'];
    return (keys as string[]).includes(type) ? t(type as TaskTypeKey) : type;
  };
}

function useFormatAnswer() {
  const t = useTranslations('practice.examCommon.result');
  return (value: string | undefined | null): string => {
    if (value == null || value === '') return t('emDash');
    if (String(value).toUpperCase() === 'X') return t('xKeinePasst');
    return String(value);
  };
}

// ─── Question Review (per-Teil) ───────────────────────────────────────────────
function QuestionReview({ teil, details }: { teil: ExamReadingTeil; details: TeilGradingDetail[] }) {
  const t = useTranslations('practice.examReading.result');
  const tCommon = useTranslations('practice.examCommon.result');
  const formatAnswer = useFormatAnswer();
  const [showPassage, setShowPassage] = useState(false);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const detailMap = Object.fromEntries(details.map(d => [d.questionId, d]));
  const LABELS = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-3">
      {/* Collapsible passage */}
      {teil.texts.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--theme-border)' }}>
          <button
            className="w-full flex items-center justify-between p-3 hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
            onClick={() => setShowPassage(v => !v)}
          >
            <span className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
              {showPassage ? t('hidePassage') : t('showPassage')}
            </span>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className="shrink-0 transition-transform" style={{ color: 'var(--theme-text-muted)', transform: showPassage ? 'rotate(180deg)' : 'none' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showPassage && (
            <div className="p-3 space-y-3 border-t" style={{ borderColor: 'var(--theme-border)' }}>
              {teil.texts.map(text => (
                <div key={text.id}>
                  {(text.label || text.title) && (
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {text.label && (
                        <span className="shrink-0 inline-flex min-w-6 items-center justify-center rounded-md px-1.5 py-0.5 text-caption font-extrabold text-white"
                          style={{ background: GRADIENT.reading }}>{text.label}</span>
                      )}
                      {text.title && <p className="min-w-0 text-xs font-bold" style={{ color: 'var(--theme-text-primary)' }}>{text.title}</p>}
                    </div>
                  )}
                  <p className="text-xs leading-relaxed whitespace-pre-wrap"
                    style={{ color: 'var(--theme-text-primary)' }}>
                    {text.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Questions */}
      {(teil.questions as ExamTeilQuestion[]).map((q, i) => {
        const detail = detailMap[q.id];
        if (!detail) return null;
        const isCorrect = detail.isCorrect;
        const expanded = expandedQ === q.id;

        return (
          <div key={q.id} className="rounded-2xl border overflow-hidden"
            style={{ borderColor: isCorrect ? `${STATUS.success}40` : `${STATUS.danger}40` }}>
            <button
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              style={{ backgroundColor: isCorrect ? `${STATUS.success}0A` : `${STATUS.danger}0A` }}
              onClick={() => setExpandedQ(expanded ? null : q.id)}
            >
              <div className="w-6 h-6 rounded-[8px] flex items-center justify-center shrink-0 text-white text-caption"
                style={{ background: isCorrect ? STATUS.success : STATUS.danger }}>
                {isCorrect ? <IconCheck size={11} /> : <IconX size={11} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body font-semibold leading-snug" style={{ color: 'var(--theme-text-primary)' }}>
                  {tCommon('questionLabel', { n: i + 1, text: q.questionText })}
                </p>
                {!isCorrect && (
                  <p className="text-xs mt-0.5" style={{ color: STATUS.danger }}>
                    {tCommon('userVsCorrect', {
                      user: formatAnswer(detail.userAnswer),
                      correct: formatAnswer(detail.correctAnswer),
                    })}
                  </p>
                )}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className="shrink-0 transition-transform" style={{ color: 'var(--theme-text-muted)', transform: expanded ? 'rotate(180deg)' : 'none' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {expanded && (
              <div className="px-4 pb-4 border-t space-y-3"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    {q.options.map((opt, oi) => {
                      const isUser = detail.userAnswer === opt.id;
                      const isCorrectOpt = detail.correctAnswer === opt.id;
                      let border = 'var(--theme-border)';
                      let bg = 'transparent';
                      let color = 'var(--theme-text-secondary)';
                      if (isCorrectOpt)           { border = STATUS.success; bg = `${STATUS.success}14`; color = STATUS.success; }
                      if (isUser && !isCorrectOpt) { border = STATUS.danger;  bg = `${STATUS.danger}14`;  color = STATUS.danger; }
                      return (
                        <div key={opt.id} className="flex items-center gap-2 px-3 py-2.5 rounded-md border text-xs"
                          style={{ borderColor: border, backgroundColor: bg, color }}>
                          <span className="w-5 h-5 rounded-[7px] border flex items-center justify-center text-caption font-bold shrink-0"
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
                )}
                {/* Richtig/Falsch or Ja/Nein or Zuordnung answer display (no options) */}
                {(!q.options || q.options.length === 0) && (
                  <div className="flex gap-3 pt-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                      <span style={{ color: 'var(--theme-text-muted)' }}>{tCommon('youAnswered')}</span>
                      <span className="font-bold px-2 py-0.5 rounded-lg"
                        style={{ backgroundColor: isCorrect ? `${STATUS.success}1A` : `${STATUS.danger}1A`, color: isCorrect ? STATUS.success : STATUS.danger }}>
                        {detail.userAnswer ? formatAnswer(detail.userAnswer) : tCommon('skipped')}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span style={{ color: 'var(--theme-text-muted)' }}>{tCommon('correctAnswerLabel')}</span>
                        <span className="font-bold px-2 py-0.5 rounded-lg"
                          style={{ backgroundColor: `${STATUS.success}1A`, color: STATUS.success }}>
                          {formatAnswer(detail.correctAnswer)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {detail.explanationVi && (
                  <div className="rounded-xl p-3" style={{ backgroundColor: `${ACCENT.reading}12` }}>
                    <p className="text-caption font-bold mb-1" style={{ color: ACCENT.reading }}>{tCommon('explanation')}</p>
                    <p className="text-body" style={{ color: 'var(--theme-text-primary)' }}>{detail.explanationVi}</p>
                    {detail.explanationDe && (
                      <p className="text-caption mt-1 italic" style={{ color: 'var(--theme-text-muted)' }}>🇩🇪 {detail.explanationDe}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExamReadingResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('practice.examReading.result');
  const tCommon = useTranslations('practice.examCommon.result');
  const getGradeInfo = useGradeInfo();
  const taskTypeLabel = useTaskTypeLabel();
  const { data: session, isLoading } = useExamReadingSession(id);
  const [expandedTeil, setExpandedTeil] = useState<number | null>(null);

  useEffect(() => {
    if (session?.status === 'DRAFT') {
      router.replace(`/practice-test/reading/exam/${id}`);
    }
  }, [session?.status, id, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <IconLoader size={32} style={{ color: ACCENT.reading }} />
          <p style={{ color: 'var(--theme-text-muted)' }}>{tCommon('loadingResult')}</p>
        </div>
      </div>
    );
  }

  if (!session || session.status === 'DRAFT') return null;

  const score = session.score ?? 0;
  const correct = session.correctCount ?? 0;
  const total = session.totalQuestions ?? 0;
  const wrong = total - correct;
  const teile = session.teile;
  const teilScores = session.teilScores ?? [];
  const gradingDetails = session.gradingDetails ?? {};
  const teilScoreMap = Object.fromEntries(teilScores.map(ts => [ts.teil, ts]));
  const grade = getGradeInfo(score);

  const stats: StatItem[] = [
    { icon: <span style={{ fontSize: 18 }}>✓</span>, label: tCommon('correctLabel'), value: correct, accent: 'reading' },
    { icon: <span style={{ fontSize: 18 }}>✗</span>, label: tCommon('wrongLabel'),   value: wrong },
    { icon: <span style={{ fontSize: 18 }}>📋</span>, label: tCommon('totalLabel'),  value: total },
    { icon: <span style={{ fontSize: 18 }}>★</span>, label: tCommon('pointsLabel'), value: `${Math.round(score)}%`, accent: 'xp' },
  ];

  return (
    <div className="max-w-360 mx-auto px-4 py-6">
      <PageHeader
        backHref="/practice-test/reading/exam"
        title={t('pageTitle')}
        accent="reading"
        right={
          <span className="px-3 py-1 rounded-xl text-xs font-bold"
            style={{ backgroundColor: `${ACCENT.reading}1A`, color: ACCENT.reading }}>
            {session.examType} {session.cefrLevel}
          </span>
        }
      />

      {/* ── Hero card ── */}
      <div className="rounded-2xl border mb-5 overflow-hidden"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-1/2 flex flex-col items-center justify-center gap-4 py-6 px-4 border-b sm:border-b-0 sm:border-r"
            style={{ borderColor: 'var(--theme-border)' }}>
            <ScoreRing
              value={score}
              label={`${correct}/${total}`}
              sublabel={`${Math.round(score)}%`}
              accent="reading"
              variant="exam"
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

      <div className="mb-5">
        <InsightsPanel insights={coalesceInsights({ insights: session.insights })} />
      </div>

      {/* ── Per-Teil review ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-body font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
            {tCommon('reviewTeile')}
          </h3>
        </div>

        {teile.map(teil => {
          const ts = teilScoreMap[teil.number];
          const details = gradingDetails[`teil_${teil.number}`] ?? [];
          const pct = ts && ts.total > 0 ? (ts.correct / ts.total) * 100 : 0;
          const passed = pct >= 60;
          const isExpanded = expandedTeil === teil.number;

          return (
            <div key={teil.number} className="rounded-2xl border overflow-hidden"
              style={{ borderColor: passed ? `${STATUS.success}40` : `${STATUS.danger}40` }}>
              <button
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                style={{ backgroundColor: passed ? `${STATUS.success}0A` : `${STATUS.danger}0A` }}
                onClick={() => setExpandedTeil(isExpanded ? null : teil.number)}
              >
                <span className="w-8 h-8 rounded-[10px] flex items-center justify-center text-xs font-extrabold text-white shrink-0"
                  style={{ background: GRADIENT.reading }}>{teil.number}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                    {taskTypeLabel(teil.taskType)}
                  </p>
                  {ts && (
                    <p className="text-xs mt-0.5" style={{ color: passed ? STATUS.success : STATUS.danger }}>
                      {t('correctOfTotalDone', { correct: ts.correct, total: ts.total, pct: Math.round(pct) })}
                    </p>
                  )}
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className="shrink-0 transition-transform" style={{ color: 'var(--theme-text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                  {teil.instruction && (
                    <p className="text-xs italic py-3"
                      style={{ color: 'var(--theme-text-muted)' }}>
                      {teil.instruction}
                    </p>
                  )}
                  <QuestionReview teil={teil} details={details} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <FixedActionBar columns={2}>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border-2 transition-all hover:bg-black/5"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', backgroundColor: 'var(--theme-bg-card)' }}
          onClick={() => {
            navigator.share?.({ title: tCommon('shareTitle'), text: t('shareText', { score: Math.round(score), examType: session.examType, cefrLevel: session.cefrLevel }) }).catch(() => {});
          }}>
          <IconShare size={16} /> {tCommon('shareBtn')}
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 shadow-lg"
          style={{ background: GRADIENT.reading, boxShadow: `0 8px 24px ${ACCENT.reading}40` }}
          onClick={() => router.push('/practice-test/reading/exam/new')}>
          <IconSparkles size={16} /> {tCommon('newExam')}
        </button>
      </FixedActionBar>
    </div>
  );
}
