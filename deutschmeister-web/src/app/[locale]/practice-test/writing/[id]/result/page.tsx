'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useWritingSession, useExplainError } from '@/hooks/useWriting';
import { useAuthStore } from '@/stores/authStore';
import type { WritingError, GrammarAnalysis } from '@/lib/api/writing';
import { CriterionRadar } from '@/components/writing/CriterionRadar';
import { InsightsPanel } from '@/components/grading/InsightsPanel';
import { coalesceInsights } from '@/lib/api/utils/insights-fallback';
import { getErrorTip } from '@/data/error-tips';
import { IconChevronDown, IconPenLine, IconShare, IconSparkles } from '../../icons';
import { PageHeader, FixedActionBar } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

const WRITING_TYPE_LABELS: Record<string, string> = {
  email: 'E-Mail', brief: 'Formeller Brief', beschreibung: 'Beschreibung',
  tagebuch: 'Tagebuch', dialog: 'Dialog', aufsatz: 'Aufsatz',
  einladung: 'Einladung', beschwerde: 'Beschwerde', bewerbung: 'Bewerbung', formular: 'Formular',
};

// ─── Helpers ───
type GradeKey = 'excellent' | 'veryGood' | 'good' | 'satisfactory' | 'sufficient' | 'keepPracticing';
// Visual config — labels resolved via i18n at render. German `label` is kept
// inline because it is study content (the score adjective the learner sees).
function getScoreGrade(score: number): { label: string; key: GradeKey; color: string; bg: string } {
  if (score >= 90) return { label: 'Ausgezeichnet!', key: 'excellent',      color: STATUS.success, bg: 'rgba(34,197,94,.15)' };
  if (score >= 80) return { label: 'Sehr gut!',      key: 'veryGood',       color: STATUS.success, bg: 'rgba(34,197,94,.12)' };
  if (score >= 70) return { label: 'Gut!',           key: 'good',           color: STATUS.info,    bg: 'rgba(59,130,246,.12)' };
  if (score >= 60) return { label: 'Befriedigend',   key: 'satisfactory',   color: STATUS.warning, bg: 'rgba(245,158,11,.12)' };
  if (score >= 40) return { label: 'Ausreichend',    key: 'sufficient',     color: ACCENT.games,   bg: 'rgba(249,115,22,.12)' };
  return { label: 'Weiter üben!', key: 'keepPracticing', color: STATUS.danger, bg: 'rgba(239,68,68,.12)' };
}

const ERROR_TYPE_COLOR: Record<string, string> = {
  article:     STATUS.danger,
  grammar:     ACCENT.vocab,
  word_order:  STATUS.info,
  conjugation: ACCENT.teal,
  case:        ACCENT.writing,
  spelling:    ACCENT.games,
  vocabulary:  STATUS.success,
};
const KNOWN_ERROR_TYPES = Object.keys(ERROR_TYPE_COLOR);

const SEVERITY_COLOR: Record<string, string> = {
  error:      STATUS.danger,
  warning:    STATUS.warning,
  suggestion: STATUS.info,
};

// ─── Score Ring ───
function ScoreRing({ score }: { score: number }) {
  const t = useTranslations('practice.writing.result');
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
          <span className="text-xs font-medium mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{t('scoreOf')}</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-body font-bold"
          style={{ backgroundColor: grade.bg, color: grade.color }}>
          <span>{grade.label}</span>
        </div>
        <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t(`grades.${grade.key}` as 'grades.excellent')}</p>
      </div>
    </div>
  );
}

// ─── Deep Analysis Section ───
function AnalysisPanel({ analysis }: { analysis: GrammarAnalysis }) {
  const t = useTranslations('practice.writing.result.analysis');
  return (
    <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: 'rgba(139,92,246,0.2)' }}>
      <div>
        <span className="text-caption font-bold uppercase" style={{ color: ACCENT.vocab }}>{t('title')}</span>
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
        <div><span style={{ color: 'var(--theme-text-muted)' }}>{t('tense')} </span><span className="font-medium" style={{ color: 'var(--theme-text-primary)' }}>{analysis.tenseVi}</span></div>
        <div><span style={{ color: 'var(--theme-text-muted)' }}>{t('sentenceType')} </span><span className="font-medium" style={{ color: 'var(--theme-text-primary)' }}>{analysis.sentenceTypeVi}</span></div>
      </div>
      {analysis.hasErrors && (
        <div>
          <span className="text-caption font-bold uppercase" style={{ color: 'var(--theme-text-muted)' }}>{t('correctedSentence')}</span>
          <p className="text-body mt-0.5 font-medium" style={{ color: STATUS.success }}>{analysis.correctedSentence}</p>
        </div>
      )}
      {analysis.grammarRules.length > 0 && (
        <div>
          <span className="text-caption font-bold uppercase" style={{ color: 'var(--theme-text-muted)' }}>{t('grammarRules')}</span>
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
        <span className="text-caption font-bold uppercase" style={{ color: 'var(--theme-text-muted)' }}>{t('explanation')}</span>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{analysis.explanationVi}</p>
      </div>
      <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(139,92,246,0.06)' }}>
        <p className="text-xs" style={{ color: ACCENT.vocab }}>
          <span className="font-bold">{t('tip')} </span>{analysis.tipVi}
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
  const t = useTranslations('practice.writing.result');
  const isPremium = (user?.subscription?.plan === 'premium' || user?.subscription?.plan === 'lifetime') && user?.subscription?.status === 'active';
  const typeColor = ERROR_TYPE_COLOR[error.errorType] ?? 'var(--theme-text-muted)';
  const typeLabel = KNOWN_ERROR_TYPES.includes(error.errorType)
    ? t(`errorTypes.${error.errorType}` as 'errorTypes.article')
    : error.errorType;
  const severityColor = SEVERITY_COLOR[error.severity] ?? STATUS.danger;
  const knownSeverities = ['error', 'warning', 'suggestion'];
  const severityLabel = knownSeverities.includes(error.severity)
    ? t(`severity.${error.severity}` as 'severity.error')
    : error.severity;

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
        <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: severityColor }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-md text-caption font-bold"
              style={{ backgroundColor: `${typeColor}15`, color: typeColor }}>
              {typeLabel}
            </span>
            <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{severityLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-body flex-wrap">
            <span className="line-through font-medium" style={{ color: STATUS.danger }}>{error.originalText}</span>
            <span style={{ color: 'var(--theme-text-muted)' }}>→</span>
            <span className="font-medium" style={{ color: STATUS.success }}>{error.correctedText}</span>
          </div>
          {expanded && (
            <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: 'var(--theme-border)' }}>
              <div>
                <span className="text-caption font-bold uppercase" style={{ color: 'var(--theme-text-muted)' }}>{t('error.deutsch')}</span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>{error.explanationDe}</p>
              </div>
              <div>
                <span className="text-caption font-bold uppercase" style={{ color: 'var(--theme-text-muted)' }}>{t('error.vietnamese')}</span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>{error.explanationVi}</p>
              </div>
              {(() => {
                const tip = getErrorTip(error.errorType);
                if (!tip) return null;
                return (
                  <div className="mt-1 rounded-lg p-3" style={{ backgroundColor: `${typeColor}0C`, border: `1px solid ${typeColor}26` }}>
                    <div className="flex items-start gap-2">
                      <span className="text-sm leading-none mt-0.5">💡</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                          <span className="font-bold" style={{ color: typeColor }}>{t('error.tip')} </span>
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
                            style={{ color: typeColor, backgroundColor: `${typeColor}14` }}>
                            {t('error.learnLesson', { title: tip.lessonTitleVi })}
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
                    color: isPremium ? ACCENT.vocab : 'var(--theme-text-muted)',
                    backgroundColor: isPremium ? 'rgba(139,92,246,0.08)' : 'var(--theme-bg-secondary)',
                  }}>
                  {explainMut.isPending ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                  )}
                  {isPremium ? t('error.explainAi') : t('error.explainPremium')}
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
  const t = useTranslations('practice.writing.result');
  const tCommon = useTranslations('practice.common');
  const { data: session, isLoading, isError } = useWritingSession(id);
  const [showOriginal, setShowOriginal] = useState(true);
  const [filterType, setFilterType] = useState<string>('');

  const labelForErrorType = (type: string): string => {
    if (KNOWN_ERROR_TYPES.includes(type)) {
      return t(`errorTypes.${type}` as 'errorTypes.article');
    }
    return type;
  };

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
          style={{ background: GRADIENT.writing }}>
          <IconPenLine size={28} style={{ color: 'white' }} />
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>
          {session?.status === 'GRADING' ? t('stillGrading') : t('notFound')}
        </p>
        <Link href="/practice-test/writing" className="text-body font-medium" style={{ color: ACCENT.writing }}>
          {t('backToList')}
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
    <div className="max-w-360 mx-auto px-4 py-6">
      <PageHeader
        backHref="/practice-test/writing"
        title={t('title')}
        accent="writing"
        right={
          <span className="px-3 py-1 rounded-xl text-xs font-bold"
            style={{ backgroundColor: `${ACCENT.writing}1A`, color: ACCENT.writing }}>
            {session.cefrLevel}
          </span>
        }
      />

      {/* Hero Result Card */}
      <div className="rounded-3xl border mb-6 overflow-hidden shadow-xl"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', backdropFilter: 'blur(10px)' }}>
        <div className="px-6 pt-5 pb-4 border-b text-center" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
          <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            {WRITING_TYPE_LABELS[session.writingType] || session.writingType}
          </p>
          <h2 className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {session.topic}
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="sm:w-1/2 flex items-center justify-center py-4">
            <ScoreRing score={overallScore} />
          </div>
          {session.criterionScores ? (
            <div className="sm:w-1/2 flex items-center justify-center p-6">
              <CriterionRadar scores={session.criterionScores} size={220} />
            </div>
          ) : (
            <div className="sm:w-1/2 flex items-center justify-center p-8">
              <p className="text-body italic" style={{ color: 'var(--theme-text-muted)' }}>{t('noCriteria')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed AI insights — supersedes the simple strengths/improvements
          blocks below for sessions graded after Phase A. The fallback helper
          builds a degraded view from legacy strengths/improvements when
          insights is null so older rows still render. */}
      <div className="mb-5">
        <InsightsPanel
          insights={coalesceInsights({
            insights: session.insights,
            strengths: session.strengths as string[] | null,
            improvements: session.improvements as string[] | null,
            feedbackVi: session.feedbackVi,
          })}
        />
      </div>

      {/* General Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <h3 className="text-caption font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
            {t('feedbackDe')}
          </h3>
          <p className="text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{session.feedbackDe}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <h3 className="text-caption font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
            {t('feedbackVi')}
          </h3>
          <p className="text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{session.feedbackVi}</p>
        </div>
      </div>

      {/* Text Comparison + Error Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Text Comparison */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-base font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('essayTitle')}</h2>
            <div className="flex rounded-lg p-0.5" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              {[t('tabOriginal'), t('tabCorrected')].map((label, idx) => {
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
            {t('errorsTitle', { count: errors.length })}
          </h2>
          {Object.keys(errorsByType).length > 1 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button onClick={() => setFilterType('')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={!filterType
                  ? { background: GRADIENT.writing, color: 'white' }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                }>
                {t('filterAll', { count: errors.length })}
              </button>
              {Object.entries(errorsByType).sort(([, a], [, b]) => b - a).map(([type, count]) => {
                const color = ERROR_TYPE_COLOR[type] || 'var(--theme-text-muted)';
                const label = labelForErrorType(type);
                return (
                  <button key={type} onClick={() => setFilterType(type === filterType ? '' : type)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={filterType === type
                      ? { background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white' }
                      : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                    }>
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          )}
          {filteredErrors.length === 0 ? (
            <div className="text-center py-10 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--theme-border)' }}>
              <p className="text-title mb-1">🎉</p>
              <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>{t('noErrors')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-128 overflow-y-auto pr-1">
              {filteredErrors.map(error => <ErrorCard key={error.id} error={error} sessionId={id} />)}
            </div>
          )}
        </div>
      </div>

      <FixedActionBar columns={2}>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border-2 transition-all hover:bg-black/5"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', backgroundColor: 'var(--theme-bg-card)' }}
          onClick={() => {
            navigator.share?.({ title: tCommon('shareTitle'), text: t('shareText', { score: Math.round(overallScore) }) }).catch(() => {});
          }}>
          <IconShare size={16} /> {tCommon('share')}
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 shadow-lg"
          style={{ background: GRADIENT.writing, boxShadow: `0 8px 24px ${ACCENT.writing}40` }}
          onClick={() => window.location.href = '/practice-test/writing/new'}>
          <IconSparkles size={16} /> {tCommon('newSession')}
        </button>
      </FixedActionBar>
    </div>
  );
}
