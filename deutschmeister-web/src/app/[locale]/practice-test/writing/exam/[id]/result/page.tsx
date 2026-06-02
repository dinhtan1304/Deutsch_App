'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import { useExamWritingSession } from '@/hooks/useExamWriting';
import { ExamWritingTeil, TeilGrading } from '@/lib/api/examWriting';
import { CriterionRadar } from '@/components/writing/CriterionRadar';
import { InsightsPanel } from '@/components/grading/InsightsPanel';
import { coalesceInsights } from '@/lib/api/utils/insights-fallback';
import { PageHeader, FixedActionBar } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

function IconLoader({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconChevronDown({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="6 9 12 15 18 9" /></svg>;
}
function IconChevronUp({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="18 15 12 9 6 15" /></svg>;
}
function IconStar({ size = 16, filled = false, color }: { size?: number; filled?: boolean; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', color }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
}
function IconShare({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>;
}
function IconSparkles({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M3 5h4" /><path d="M21 17v4" /><path d="M19 19h4" /></svg>;
}

type TaskTypeKey = 'form_fill' | 'informal_email' | 'formal_email' | 'sms' | 'forum_comment';

function useTaskTypeLabel() {
  const t = useTranslations('practice.examWriting.result.taskTypes');
  return (type: string) => {
    const keys: TaskTypeKey[] = ['form_fill', 'informal_email', 'formal_email', 'sms', 'forum_comment'];
    return (keys as string[]).includes(type) ? t(type as TaskTypeKey) : type;
  };
}

function getScoreColor(s: number) {
  if (s >= 80) return STATUS.success;
  if (s >= 60) return STATUS.warning;
  if (s >= 40) return ACCENT.games;
  return STATUS.danger;
}

// ─── Score Ring ───
function ScoreRing({ score, size = 128 }: { score: number; size?: number }) {
  const tCommon = useTranslations('practice.examCommon.result');
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const passed = pct >= 60;
  const color = pct >= 80 ? STATUS.success : pct >= 60 ? STATUS.warning : STATUS.danger;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--theme-border)" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{Math.round(pct)}%</span>
        <span style={{ fontSize: 11, color: passed ? STATUS.success : STATUS.danger, fontWeight: 700, marginTop: 2 }}>
          {passed ? tCommon('bestandenShort') : tCommon('nichtBestandenShort')}
        </span>
      </div>
    </div>
  );
}

// ─── Teil Grading Card ───
function TeilGradingCard({
  teil, grading, userText, expanded, onToggle,
}: {
  teil: ExamWritingTeil; grading: TeilGrading; userText: string; expanded: boolean; onToggle: () => void;
}) {
  const t = useTranslations('practice.examWriting.result');
  const taskTypeLabel = useTaskTypeLabel();
  const pct = grading.maxPoints > 0 ? (grading.score / grading.maxPoints) * 100 : 0;
  const [showText, setShowText] = useState(false);

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <button className="w-full flex items-center gap-3 p-4 transition-opacity hover:opacity-80" onClick={onToggle}>
        <span className="w-8 h-8 rounded-[10px] flex items-center justify-center text-xs font-extrabold text-white shrink-0"
          style={{ background: GRADIENT.examWriting }}>{teil.number}</span>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {taskTypeLabel(teil.taskType)}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 h-1.5 rounded-full max-w-24" style={{ backgroundColor: 'var(--theme-border)' }}>
              <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: getScoreColor(pct) }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: getScoreColor(pct) }}>
              {grading.score}/{grading.maxPoints} {t('punkteSuffix')} · {Math.round(pct)}%
            </span>
          </div>
        </div>
        <span style={{ color: 'var(--theme-text-muted)', flexShrink: 0 }}>
          {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
        </span>
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4 space-y-4" style={{ borderColor: 'var(--theme-border)' }}>
          {grading.criterionScores && (
            <div className="pt-3 flex justify-center">
              <CriterionRadar scores={grading.criterionScores} size={240} />
            </div>
          )}
          {grading.feedback && (
            <div className="pt-3">
              <p className="text-caption font-bold uppercase tracking-wide mb-1.5" style={{ color: ACCENT.examWriting }}>{t('bewertung')}</p>
              <p className="text-body leading-relaxed" style={{ color: 'var(--theme-text-primary)' }}>
                {grading.feedback}
              </p>
            </div>
          )}
          <InsightsPanel
            insights={coalesceInsights({
              insights: grading.insights,
              strengths: grading.strengths,
              improvements: grading.improvements,
              feedbackVi: grading.feedback,
            })}
          />
          {grading.strengths?.length > 0 && (
            <div>
              <p className="text-caption font-bold uppercase tracking-wide mb-1.5" style={{ color: STATUS.success }}>{t('staerken')}</p>
              <ul className="space-y-1">
                {grading.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                    <IconStar size={13} filled color={STATUS.success} />{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {grading.improvements?.length > 0 && (
            <div>
              <p className="text-caption font-bold uppercase tracking-wide mb-1.5" style={{ color: STATUS.warning }}>{t('verbesserungen')}</p>
              <ul className="space-y-1">
                {grading.improvements.map((imp, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                    <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS.warning }} />{imp}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {grading.corrections?.length > 0 && (
            <div>
              <p className="text-caption font-bold uppercase tracking-wide mb-2" style={{ color: STATUS.danger }}>{t('korrekturen')}</p>
              <div className="space-y-2">
                {grading.corrections.map((corr, i) => (
                  <div key={i} className="rounded-xl border p-3 space-y-1.5"
                    style={{ borderColor: `${STATUS.danger}33`, backgroundColor: `${STATUS.danger}0A` }}>
                    <div className="flex items-start gap-2 text-xs">
                      <span className="line-through shrink-0 font-medium" style={{ color: STATUS.danger }}>{corr.original}</span>
                      <span style={{ color: 'var(--theme-text-muted)' }}>→</span>
                      <span className="font-semibold shrink-0" style={{ color: STATUS.success }}>{corr.corrected}</span>
                    </div>
                    {corr.explanationVi && (
                      <p className="text-caption leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                        🇻🇳 {corr.explanationVi}
                      </p>
                    )}
                    {corr.explanationDe && (
                      <p className="text-caption leading-relaxed italic" style={{ color: 'var(--theme-text-muted)' }}>
                        🇩🇪 {corr.explanationDe}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {userText && (
            <div>
              <button
                className="flex items-center gap-1.5 text-xs font-semibold mb-2"
                style={{ color: 'var(--theme-text-muted)' }}
                onClick={() => setShowText(v => !v)}>
                {showText ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
                {showText ? t('hideText') : t('showText')}
              </button>
              {showText && (
                <div className="rounded-xl p-3 border"
                  style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap"
                    style={{ color: 'var(--theme-text-primary)' }}>
                    {userText}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Grading in Progress ───
function GradingInProgress() {
  const t = useTranslations('practice.examWriting.result');
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4 px-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: GRADIENT.examWriting }}>
          <IconLoader size={28} />
        </div>
        <h2 className="text-title font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          {t('aiGrading')}
        </h2>
        <p className="text-body leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
          {t('aiGradingBody')}
        </p>
        <div className="flex justify-center gap-1.5 mt-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: ACCENT.examWriting, animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function ExamWritingResultPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('practice.examWriting.result');
  const tCommon = useTranslations('practice.examCommon.result');
  const taskTypeLabel = useTaskTypeLabel();
  const fmt = useFormatter();
  const { data: session, isLoading } = useExamWritingSession(id);
  const [expandedTeil, setExpandedTeil] = useState<number | null>(0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <IconLoader size={28} style={{ color: ACCENT.examWriting }} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p style={{ color: 'var(--theme-text-muted)' }}>{t('examNotFound')}</p>
      </div>
    );
  }

  if (session.status === 'GRADING') return <GradingInProgress />;

  if (session.status === 'ERROR') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3 px-8">
          <p className="text-title font-bold" style={{ color: STATUS.danger }}>{t('gradingError')}</p>
          <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
            {t('gradingErrorBody')}
          </p>
          <Link href={`/practice-test/writing/exam/${id}`}
            className="inline-block mt-3 px-4 py-2 rounded-xl text-body font-bold text-white"
            style={{ background: GRADIENT.examWriting }}>
            {t('backToWriting')}
          </Link>
        </div>
      </div>
    );
  }

  const score = session.totalScore ?? 0;
  const passed = score >= 60;
  const grading = session.grading ?? {};
  const userTexts = session.userTexts ?? {};

  return (
    <div className="max-w-360 mx-auto px-4 py-6">
      <PageHeader
        backHref="/practice-test/writing/exam"
        title={t('pageTitle')}
        accent="writing"
        right={
          <span className="px-3 py-1 rounded-xl text-xs font-bold"
            style={{ backgroundColor: `${ACCENT.examWriting}1A`, color: ACCENT.examWriting }}>
            {session.examType} {session.cefrLevel}
          </span>
        }
      />

      {/* Hero Score Card */}
      <div className="rounded-3xl border mb-6 overflow-hidden shadow-xl"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', backdropFilter: 'blur(10px)' }}>
        <div className="px-6 pt-5 pb-4 border-b text-center" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
          <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            {t('subtitle', { examType: session.examType, cefrLevel: session.cefrLevel })}
          </p>
          <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            {session.gradedAt ? fmt.dateTime(new Date(session.gradedAt), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : t('gradedRecently')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="sm:w-1/2 flex items-center justify-center py-6">
            <ScoreRing score={score} size={144} />
          </div>
          <div className="sm:w-1/2 flex flex-col justify-center p-6 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md flex items-center justify-center shadow-inner"
                style={{ backgroundColor: passed ? `${STATUS.success}26` : `${STATUS.danger}26`, color: passed ? STATUS.success : STATUS.danger }}>
                <span className="text-xl font-bold">{passed ? '✓' : '✗'}</span>
              </div>
              <h2 className="text-h2 font-black tracking-tight" style={{ color: passed ? STATUS.success : STATUS.danger }}>
                {passed ? tCommon('bestanden') : tCommon('nichtBestanden')}
              </h2>
            </div>
            <p className="text-body font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
              {tCommon('gesamtergebnis')}: <strong className="text-h3" style={{ color: 'var(--theme-text-primary)' }}>{Math.round(score)}%</strong>
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
              {passed ? t('congratsPassed') : t('congratsFailed')}
            </p>
          </div>
        </div>

        {/* Per-Teil summary */}
        {Object.keys(grading).length > 0 && (
          <div className="border-t px-5 py-4 space-y-3" style={{ borderColor: 'var(--theme-border)' }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>
              {tCommon('punkteJeTeil')}
            </p>
            {session.teile.map(teil => {
              const g = grading[`teil_${teil.number}`];
              if (!g) return null;
              const pct = g.maxPoints > 0 ? (g.score / g.maxPoints) * 100 : 0;
              return (
                <div key={teil.number}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-caption font-extrabold text-white"
                        style={{ background: GRADIENT.examWriting }}>{teil.number}</span>
                      <span className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                        {taskTypeLabel(teil.taskType)}
                      </span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: getScoreColor(pct) }}>
                      {g.score}/{g.maxPoints} · {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="flex-1 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: 'var(--theme-border)' }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: getScoreColor(pct) }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed grading per Teil */}
      <div>
        <h3 className="text-body font-bold uppercase tracking-wider mb-3"
          style={{ color: 'var(--theme-text-muted)' }}>
          {t('detailsByTeil')}
        </h3>
        <div className="space-y-3">
          {session.teile.map((teil, i) => {
            const g = grading[`teil_${teil.number}`];
            if (!g) return null;
            return (
              <TeilGradingCard
                key={teil.number}
                teil={teil}
                grading={g}
                userText={userTexts[`teil_${teil.number}`] ?? ''}
                expanded={expandedTeil === i}
                onToggle={() => setExpandedTeil(expandedTeil === i ? null : i)}
              />
            );
          })}
        </div>
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
          style={{ background: GRADIENT.examWriting, boxShadow: `0 8px 24px ${ACCENT.examWriting}40` }}
          onClick={() => window.location.href = '/practice-test/writing/exam/new'}>
          <IconSparkles size={16} /> {tCommon('newExam')}
        </button>
      </FixedActionBar>
    </div>
  );
}
