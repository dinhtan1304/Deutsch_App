'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useListeningSession } from '@/hooks/useListening';
import { ListeningQuestion } from '@/lib/api/listening';
import { InsightsPanel } from '@/components/grading/InsightsPanel';
import { coalesceInsights } from '@/lib/api/utils/insights-fallback';
import { PageHeader, FixedActionBar } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { speakGerman as speakText } from '@/lib/utils';

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
function IconShare({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>;
}
function IconSparkles({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M3 5h4" /><path d="M21 17v4" /><path d="M19 19h4" /></svg>;
}

type GradeKey = 'excellent' | 'veryGood' | 'good' | 'needsWork' | 'keepPracticing';
function getGradeInfo(score: number): { emoji: string; key: GradeKey; color: string; bg: string } {
  if (score >= 90) return { emoji: '🏆', key: 'excellent',       color: STATUS.success, bg: `${STATUS.success}26` };
  if (score >= 75) return { emoji: '🌟', key: 'veryGood',        color: STATUS.success, bg: `${STATUS.success}1F` };
  if (score >= 60) return { emoji: '👍', key: 'good',            color: STATUS.warning, bg: `${STATUS.warning}1F` };
  if (score >= 40) return { emoji: '📖', key: 'needsWork',       color: ACCENT.games,   bg: `${ACCENT.games}1F` };
  return              { emoji: '💪', key: 'keepPracticing', color: STATUS.danger,  bg: `${STATUS.danger}1F` };
}

// ─── Score Ring ───
function ScoreRing({ correct, total }: { correct: number; total: number }) {
  const t = useTranslations('practice.listening.result.grades');
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
        <span>{t(grade.key)}</span>
      </div>
    </div>
  );
}

// ─── Stat Grid ───
function StatGrid({ correct, total }: { correct: number; total: number }) {
  const t = useTranslations('practice.listening.result.stats');
  const wrong = total - correct;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const stats = [
    { icon: '✓', label: t('correct'),    value: correct,    color: STATUS.success,    bg: `${STATUS.success}1A` },
    { icon: '✗', label: t('wrong'),      value: wrong,      color: STATUS.danger,     bg: `${STATUS.danger}1A` },
    { icon: '★', label: t('score'),      value: `${score}%`, color: STATUS.warning,   bg: `${STATUS.warning}1A` },
    { icon: '🎧', label: t('questions'), value: total,      color: ACCENT.listening,  bg: `${ACCENT.listening}1A` },
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
  const t = useTranslations('practice.listening.result');
  const [open, setOpen] = useState(false);
  const isCorrect = userAnswer?.toLowerCase() === question.correctAnswer.toLowerCase();

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ borderColor: isCorrect ? `${STATUS.success}40` : `${STATUS.danger}40` }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        style={{ backgroundColor: isCorrect ? `${STATUS.success}0A` : `${STATUS.danger}0A` }}>
        <div className="w-6 h-6 rounded-[8px] flex items-center justify-center shrink-0 text-white"
          style={{ backgroundColor: isCorrect ? STATUS.success : STATUS.danger }}>
          {isCorrect ? <IconCheck size={11} /> : <IconXMark size={11} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body font-semibold leading-snug" style={{ color: 'var(--theme-text-primary)' }}>
            {t('questionLabel', { index: index + 1, question: question.questionText })}
          </p>
          {!isCorrect && (
            <p className="text-xs mt-0.5" style={{ color: STATUS.danger }}>
              {t('correctAnswer', { answer: question.correctAnswer })}
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
              <span style={{ color: 'var(--theme-text-muted)' }}>{t('yourAnswer')}</span>
              <span className="font-bold" style={{ color: isCorrect ? STATUS.success : STATUS.danger }}>
                {userAnswer ?? '—'}
              </span>
            </div>
            {!isCorrect && (
              <div>
                <span className="font-bold" style={{ color: STATUS.success }}>
                  {t('correctAnswer', { answer: question.correctAnswer })}
                </span>
              </div>
            )}
          </div>
          {question.explanationVi && (
            <div className="rounded-xl p-3" style={{ backgroundColor: `${ACCENT.listening}12` }}>
              <p className="text-caption font-bold mb-1" style={{ color: ACCENT.listening }}>{t('explanation')}</p>
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
  const router = useRouter();
  const t = useTranslations('practice.listening.result');
  const tCommon = useTranslations('practice.common');
  const { data: session, isLoading } = useListeningSession(id);
  const [showTranscript, setShowTranscript] = useState(false);
  const [filter, setFilter] = useState<'all' | 'wrong' | 'correct'>('all');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <IconLoader size={32} style={{ color: ACCENT.listening }} />
          <p style={{ color: 'var(--theme-text-muted)' }}>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-10 text-center">
        <p className="mb-4" style={{ color: 'var(--theme-text-muted)' }}>{t('notFound')}</p>
        <Link href="/practice-test/listening" className="text-sm font-semibold" style={{ color: ACCENT.listening }}>
          {t('backToList')}
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
    { key: 'all', label: t('tabAll') },
    { key: 'wrong', label: t('tabWrong') },
    { key: 'correct', label: t('tabCorrect') },
  ];

  return (
    <div className="max-w-360 mx-auto px-4 py-6">
      <PageHeader
        backHref="/practice-test/listening"
        title={t('title')}
        accent="listening"
        right={
          <span className="px-3 py-1 rounded-xl text-xs font-bold"
            style={{ backgroundColor: `${ACCENT.listening}1A`, color: ACCENT.listening }}>
            {session.cefrLevel}
          </span>
        }
      />

      <div className="rounded-2xl border mb-5 overflow-hidden"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <div className="px-5 pt-4 pb-3 border-b text-center" style={{ borderColor: 'var(--theme-border)' }}>
          <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {t('sessionTitle', { title: session.title })}
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

      <div className="mb-5">
        <InsightsPanel insights={coalesceInsights({ insights: session.insights })} />
      </div>

      <div className="rounded-2xl border mb-5 overflow-hidden"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <button onClick={() => setShowTranscript(v => !v)}
          className="w-full flex items-center justify-between p-4 text-left"
          style={{ color: 'var(--theme-text-primary)' }}>
          <div className="flex items-center gap-2">
            <IconVolume2 size={16} style={{ color: ACCENT.listening }} />
            <span className="text-sm font-bold">{t('transcriptToggle')}</span>
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
              style={{ color: ACCENT.listening }}>
              <IconVolume2 size={13} style={{ color: ACCENT.listening }} /> {t('transcriptListenAgain')}
            </button>
            <p className="text-body leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--theme-text-primary)' }}>
              {session.transcript}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-body font-bold uppercase tracking-wider mb-1"
          style={{ color: 'var(--theme-text-muted)' }}>
          {t('reviewTitle')}
        </h3>

        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={filter === tab.key
                ? { background: GRADIENT.listening, color: 'white', boxShadow: `0 2px 8px ${ACCENT.listening}40` }
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
            <p className="text-sm">{t('noQuestions')}</p>
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

      <FixedActionBar columns={2}>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border-2 transition-all hover:bg-black/5"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', backgroundColor: 'var(--theme-bg-card)' }}
          onClick={() => {
            const score = total > 0 ? Math.round((correct / total) * 100) : 0;
            navigator.share?.({ title: tCommon('shareTitle'), text: t('shareText', { score }) }).catch(() => {});
          }}>
          <IconShare size={16} /> {t('share')}
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 shadow-lg"
          style={{ background: GRADIENT.listening, boxShadow: `0 8px 24px ${ACCENT.listening}40` }}
          onClick={() => router.push('/practice-test/listening/new')}>
          <IconSparkles size={16} /> {t('newSession')}
        </button>
      </FixedActionBar>
    </div>
  );
}
