'use client';

import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useTranslations, useFormatter } from 'next-intl';
import { useMockExamState } from '@/hooks/useMockExam';
import { MockSkill } from '@/lib/api/mockExam';
import {
  IconTrophy, IconBookOpen, IconHeadphones, IconPenLine, IconMic,
  IconChevronLeft, IconPlus,
} from '@/components/ui/Icons';
import { ACCENT } from '@/lib/tokens';
import { GridSkeleton } from '@/components/ui';

const SKILL_META: Record<MockSkill, {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
  route: string;
}> = {
  reading: { icon: IconBookOpen, color: ACCENT.reading, route: 'reading' },
  listening: { icon: IconHeadphones, color: ACCENT.listening, route: 'listening' },
  writing: { icon: IconPenLine, color: ACCENT.writing, route: 'writing' },
  speaking: { icon: IconMic, color: ACCENT.speaking, route: 'speaking' },
};

export default function MockExamResultPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('practice.mockExam.result');
  const tCockpit = useTranslations('practice.mockExam.cockpit');
  const tHub = useTranslations('practice.common.hub');
  const formatter = useFormatter();

  const { data: state, isLoading } = useMockExamState(id);

  if (isLoading || !state) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <GridSkeleton cols={1} count={4} height="h-20" gap="gap-3" />
      </div>
    );
  }

  // Not finalised yet → send the user back to the cockpit.
  if (!state.result) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p className="mb-5 text-body" style={{ color: 'var(--theme-text-muted)' }}>{t('notFinished')}</p>
        <Link href={`/practice-test/mock-exam/${state.id}`}
          className="inline-flex h-11 items-center gap-2 rounded-md px-6 text-body font-bold"
          style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
          {t('goCockpit')}
        </Link>
      </div>
    );
  }

  const result = state.result;
  const passed = result.overall === 'BESTANDEN';
  const verdictColor = passed ? 'var(--success)' : 'var(--danger)';
  const sessionIdBySkill = Object.fromEntries(state.modules.map((m) => [m.skill, m.sessionId]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link href="/practice-test/mock-exam" className="mb-4 inline-flex items-center gap-1 text-caption font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
        <IconChevronLeft size={16} /> {tHub('back')}
      </Link>

      {/* Zeugnis card */}
      <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', boxShadow: 'var(--v2-shadow-card-hover)' }}>
        {/* Header */}
        <div className="px-6 py-6 text-center" style={{ borderBottom: '1px solid var(--theme-border)', background: `color-mix(in srgb, ${verdictColor} 8%, transparent)` }}>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: `color-mix(in srgb, ${verdictColor} 16%, transparent)`, color: verdictColor }}>
            <IconTrophy size={28} />
          </div>
          <h1 className="text-h2 font-extrabold" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>
            {t('title', { examType: state.examType, cefrLevel: state.cefrLevel })}
          </h1>
          {state.completedAt && (
            <p className="mt-1 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
              {t('subtitle', { date: formatter.dateTime(new Date(state.completedAt), { dateStyle: 'long' }) })}
            </p>
          )}
          <div className="mt-4 inline-flex items-center gap-3 rounded-[13px] px-5 py-2.5"
            style={{ background: `color-mix(in srgb, ${verdictColor} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${verdictColor} 35%, transparent)` }}>
            <span className="text-h3 font-extrabold uppercase" style={{ color: verdictColor, letterSpacing: '.06em' }}>
              {passed ? t('bestanden') : t('nichtBestanden')}
            </span>
            {result.gradeLabel && (
              <span className="mono rounded-[6px] px-2 py-0.5 text-caption font-bold" style={{ background: `color-mix(in srgb, ${verdictColor} 18%, transparent)`, color: verdictColor }}>
                {result.gradeLabel}
              </span>
            )}
          </div>
        </div>

        {/* Module rows with 60% pass line */}
        <div className="p-5 sm:p-6">
          <div className="mb-2 grid grid-cols-[1fr_auto_auto] gap-3 px-1 text-[10px] font-bold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>
            <span>{t('colModule')}</span>
            <span className="text-right">{t('colScore')}</span>
            <span className="w-16 text-right">{t('colResult')}</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {result.modules.map((mod) => {
              const meta = SKILL_META[mod.skill];
              const Icon = meta.icon;
              const modColor = mod.pass ? 'var(--success)' : 'var(--danger)';
              const sessionId = sessionIdBySkill[mod.skill];
              const detailHref = sessionId ? `/practice-test/${meta.route}/exam/${sessionId}/result` : null;
              const pct = Math.max(0, Math.min(100, mod.scorePercent));
              return (
                <div key={mod.skill} className="rounded-[11px] border p-3.5" style={{ background: 'var(--theme-bg-tertiary)', borderColor: 'var(--theme-border)' }}>
                  <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Icon size={17} style={{ color: meta.color, flexShrink: 0 }} />
                      <span className="truncate text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                        {tCockpit(`module.${mod.skill}` as Parameters<typeof tCockpit>[0])}
                      </span>
                    </span>
                    <span className="mono text-lead font-extrabold" style={{ color: modColor }}>
                      {Math.round(mod.scorePercent)}<span className="text-[11px] opacity-70">/100</span>
                    </span>
                    <span className="w-16 text-right text-[11px] font-bold uppercase" style={{ color: modColor, letterSpacing: '.04em' }}>
                      {mod.pass ? t('pass') : t('fail')}
                    </span>
                  </div>
                  {/* progress bar with 60% threshold mark */}
                  <div className="relative mt-2.5 h-2 overflow-hidden rounded-full" style={{ background: 'var(--theme-bg-secondary)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: modColor }} />
                    <div className="absolute top-0 h-full w-0.5" style={{ left: `${result.passThreshold}%`, background: 'var(--theme-text-muted)', opacity: 0.6 }} />
                  </div>
                  {detailHref && (
                    <div className="mt-2 text-right">
                      <Link href={detailHref} className="text-[11px] font-semibold transition-opacity hover:opacity-70" style={{ color: meta.color }}>
                        {t('viewDetail')} →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overall + rule note */}
          <div className="mt-4 flex items-center justify-between rounded-[11px] border px-4 py-3" style={{ background: `color-mix(in srgb, ${verdictColor} 7%, transparent)`, borderColor: `color-mix(in srgb, ${verdictColor} 25%, transparent)` }}>
            <span className="text-body font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>{t('overallLabel')}</span>
            <span className="mono text-h3 font-extrabold" style={{ color: verdictColor }}>{Math.round(result.overallPercent)}%</span>
          </div>
          <p className="mt-2.5 text-[11.5px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
            {result.rule === 'PER_MODULE_60' ? t('ruleNotePerModule') : t('ruleNoteTotal')} · {t('thresholdLine')}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link href="/practice-test/mock-exam/new"
          className="inline-flex h-11 items-center gap-2 rounded-md px-5 text-caption font-bold transition-transform hover:-translate-y-0.5 active:scale-95"
          style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 6px 18px color-mix(in srgb, var(--accent) 40%, transparent)' }}>
          <IconPlus size={16} /> {t('tryAgain')}
        </Link>
        <Link href="/practice-test/mock-exam"
          className="inline-flex h-11 items-center gap-2 rounded-md px-5 text-caption font-bold"
          style={{ background: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}>
          {t('backToList')}
        </Link>
      </div>
    </div>
  );
}
