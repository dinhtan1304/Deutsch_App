'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useExamReadiness } from '@/hooks/useExamReadiness';
import { ReadinessSkill } from '@/lib/api/examReadiness';
import { EXAM_PROVIDERS, VISIBLE_LEVELS, providerLevels, coerceLevel } from '@/config/examProviders';
import { PracticePageShell, GridSkeleton } from '@/components/ui';
import {
  IconTarget, IconTrophy, IconBookOpen, IconHeadphones, IconPenLine, IconMic,
  IconClock, IconArrowRight,
} from '@/components/ui/Icons';
import { ACCENT } from '@/lib/tokens';

const SKILL_META: Record<ReadinessSkill, {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
  examHref: string;
}> = {
  reading: { icon: IconBookOpen, color: ACCENT.reading, examHref: '/practice-test/reading/exam/new' },
  listening: { icon: IconHeadphones, color: ACCENT.listening, examHref: '/practice-test/listening/exam/new' },
  writing: { icon: IconPenLine, color: ACCENT.writing, examHref: '/practice-test/writing/exam/new' },
  speaking: { icon: IconMic, color: ACCENT.speaking, examHref: '/practice-test/speaking/exam/new' },
};

const gaugeColor = (s: number) => (s >= 60 ? 'var(--success)' : s >= 40 ? 'var(--warn)' : 'var(--danger)');
const accColor = (a: number) => (a >= 60 ? (a >= 80 ? 'var(--success)' : 'var(--warn)') : 'var(--danger)');

/** SVG half-donut gauge: 0–100 with the 60% pass mark tick. */
function ReadinessGauge({ score }: { score: number }) {
  const t = useTranslations('practice.readiness');
  const clamped = Math.max(0, Math.min(100, score));
  const R = 70;
  const C = Math.PI * R; // half circumference
  const color = gaugeColor(clamped);
  return (
    <div className="relative mx-auto w-full max-w-56">
      <svg viewBox="0 0 180 100" className="w-full">
        <path d="M 20 95 A 70 70 0 0 1 160 95" fill="none" stroke="var(--theme-bg-secondary)" strokeWidth="14" strokeLinecap="round" />
        <path d="M 20 95 A 70 70 0 0 1 160 95" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * C} ${C}`} />
        {/* 60% pass tick */}
        <line
          x1={90 + (R - 12) * Math.cos(Math.PI * (1 - 0.6))} y1={95 - (R - 12) * Math.sin(Math.PI * (1 - 0.6))}
          x2={90 + (R + 12) * Math.cos(Math.PI * (1 - 0.6))} y2={95 - (R + 12) * Math.sin(Math.PI * (1 - 0.6))}
          stroke="var(--theme-text-muted)" strokeWidth="2" opacity="0.6" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="mono text-[34px] font-extrabold leading-none" style={{ color, letterSpacing: '-.03em' }}>{clamped}</div>
        <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.08em' }}>{t('gaugeLabel')}</div>
      </div>
    </div>
  );
}

export default function ExamReadinessPage() {
  const t = useTranslations('practice.readiness');
  const tSetup = useTranslations('practice.examCommon.setup');
  const [examType, setExamType] = useState('GOETHE');
  const [cefrLevel, setCefrLevel] = useState('B1');

  const { data, isLoading } = useExamReadiness(examType, cefrLevel);
  const hasData = !!data && data.skills.some((s) => s.attempts > 0);

  const selectProvider = (id: string) => {
    setExamType(id);
    setCefrLevel((cur) => coerceLevel(id, cur));
  };

  return (
    <PracticePageShell
      backHref="/practice-test"
      title={t('title')}
      subtitle={t('subtitle')}
      accent="premium"
      icon={<IconTarget size={22} />}
      className="pb-16"
    >
      {/* Provider + level picker */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {EXAM_PROVIDERS.map((p) => {
          const on = examType === p.id;
          return (
            <button key={p.id} onClick={() => selectProvider(p.id)}
              className="rounded-[8px] border px-3 py-1.5 text-caption font-bold transition-colors"
              style={on
                ? { background: `color-mix(in srgb, ${p.color} 14%, transparent)`, borderColor: p.color, color: p.color }
                : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
              {tSetup(p.labelKey as Parameters<typeof tSetup>[0])}
            </button>
          );
        })}
        <span className="mx-1 h-5 w-px" style={{ background: 'var(--theme-border)' }} />
        {VISIBLE_LEVELS.map((lvl) => {
          const unsupported = !providerLevels(examType).includes(lvl);
          const on = cefrLevel === lvl && !unsupported;
          return (
            <button key={lvl} onClick={() => !unsupported && setCefrLevel(lvl)} disabled={unsupported}
              className="mono rounded-[8px] border px-2.5 py-1.5 text-caption font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-35"
              style={on
                ? { background: 'color-mix(in srgb, var(--accent) 14%, transparent)', borderColor: 'var(--accent)', color: 'var(--accent)' }
                : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
              {lvl}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <GridSkeleton cols={2} count={4} height="h-32" gap="gap-4" />
      ) : !data || !hasData ? (
        <div className="rounded-2xl border border-dashed py-20 text-center" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
            <IconTarget size={30} style={{ color: 'var(--accent)' }} />
          </div>
          <p className="mx-auto mb-6 max-w-sm text-body" style={{ color: 'var(--theme-text-muted)' }}>
            {t('empty', { examType, cefrLevel })}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/practice-test/reading/exam/new"
              className="inline-flex h-11 items-center gap-2 rounded-md px-5 text-caption font-bold transition-transform hover:-translate-y-0.5 active:scale-95"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 6px 18px color-mix(in srgb, var(--accent) 40%, transparent)' }}>
              {t('startFirst')} <IconArrowRight size={14} />
            </Link>
            <Link href="/practice-test/mock-exam/new"
              className="inline-flex h-11 items-center gap-2 rounded-md px-5 text-caption font-bold"
              style={{ background: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}>
              <IconTrophy size={15} /> {t('mockCta')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.6fr]">
          {/* ── Left: gauge + exam date ── */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border p-5 text-center" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
              <ReadinessGauge score={data.readinessScore} />
              <p className="mx-auto mt-3 max-w-60 text-[11.5px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{t('gaugeHint')}</p>
            </div>

            {/* Exam date countdown */}
            <div className="flex items-center gap-3 rounded-2xl border p-4" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
                style={{ background: 'color-mix(in srgb, var(--warn) 16%, transparent)', color: 'var(--warn)' }}>
                <IconClock size={19} />
              </div>
              {data.studyPlan?.daysLeft != null ? (
                <span className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                  {t('daysLeft', { count: data.studyPlan.daysLeft })}
                </span>
              ) : (
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
                  <span className="text-body" style={{ color: 'var(--theme-text-muted)' }}>{t('noPlan')}</span>
                  <Link href="/study-plan" className="text-caption font-bold transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
                    {t('noPlanCta')} →
                  </Link>
                </div>
              )}
            </div>

            {/* Mock exam CTA */}
            <Link href="/practice-test/mock-exam/new"
              className="flex h-12 items-center justify-center gap-2 rounded-[13px] text-body font-bold transition-transform hover:-translate-y-0.5 active:scale-95"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 6px 18px color-mix(in srgb, var(--accent) 40%, transparent)' }}>
              <IconTrophy size={17} /> {t('mockCta')}
            </Link>
          </div>

          {/* ── Right: per-skill bars + Teil heatmap + recommendations ── */}
          <div className="flex flex-col gap-4">
            {/* Per skill */}
            <div className="rounded-2xl border p-5" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
              <h2 className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('skillsTitle')}</h2>
              <p className="mb-4 text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>{t('skillsHint', { window: 5 })}</p>
              <div className="flex flex-col gap-3.5">
                {data.skills.map((s) => {
                  const meta = SKILL_META[s.skill];
                  const Icon = meta.icon;
                  const val = s.recentAvg;
                  const barColor = val === null ? 'var(--theme-text-muted)' : accColor(val);
                  return (
                    <div key={s.skill}>
                      <div className="mb-1.5 flex items-center gap-2">
                        <Icon size={15} style={{ color: meta.color }} />
                        <span className="text-caption font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                          {t(`skillNames.${s.skill}` as Parameters<typeof t>[0])}
                        </span>
                        <span className="text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>
                          {s.attempts > 0 ? t('attempts', { count: s.attempts }) : t('noData')}
                        </span>
                        <span className="flex-1" />
                        {val !== null ? (
                          <span className="mono text-body font-extrabold" style={{ color: barColor }}>{Math.round(val)}%</span>
                        ) : (
                          <Link href={meta.examHref} className="text-[11px] font-bold transition-opacity hover:opacity-70" style={{ color: meta.color }}>
                            {t('practiceNow')} →
                          </Link>
                        )}
                      </div>
                      <div className="relative h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--theme-bg-secondary)' }}>
                        {val !== null && <div className="h-full rounded-full" style={{ width: `${Math.min(100, val)}%`, background: barColor }} />}
                        <div className="absolute top-0 h-full w-0.5" style={{ left: `${data.passThreshold}%`, background: 'var(--theme-text-muted)', opacity: 0.55 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Teil heatmap */}
            {data.teils.length > 0 && (
              <div className="rounded-2xl border p-5" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                <h2 className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('teilTitle')}</h2>
                <p className="mb-3.5 text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>{t('teilHint')}</p>
                <div className="flex flex-wrap gap-2">
                  {data.teils.map((ta) => {
                    const c = accColor(ta.accuracy);
                    const meta = SKILL_META[ta.skill];
                    const Icon = meta.icon;
                    return (
                      <span key={`${ta.skill}-${ta.teil}`}
                        className="inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1.5"
                        style={{ background: `color-mix(in srgb, ${c} 10%, transparent)`, borderColor: `color-mix(in srgb, ${c} 32%, transparent)` }}>
                        <Icon size={12} style={{ color: meta.color }} />
                        <span className="mono text-[11px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>T{ta.teil}</span>
                        <span className="mono text-[11px] font-extrabold" style={{ color: c }}>{Math.round(ta.accuracy)}%</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {data.recommendations.length > 0 && (
              <div className="rounded-2xl border p-5" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                <h2 className="mb-3.5 text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('recTitle')}</h2>
                <div className="flex flex-col gap-2.5">
                  {data.recommendations.map((rec) => {
                    const meta = SKILL_META[rec.skill];
                    const Icon = meta.icon;
                    const c = accColor(rec.accuracy);
                    return (
                      <Link key={`${rec.skill}-${rec.teil}`} href={rec.href}
                        className="flex items-center gap-3 rounded-[11px] border p-3 transition-transform hover:-translate-y-0.5"
                        style={{ background: 'var(--theme-bg-tertiary)', borderColor: 'var(--theme-border)' }}>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]"
                          style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}>
                          <Icon size={17} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-caption font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                            {t(`skillNames.${rec.skill}` as Parameters<typeof t>[0])} · Teil {rec.teil}
                          </div>
                          <div className="mono text-[11px]" style={{ color: c }}>{rec.accuracy}%</div>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold" style={{ color: meta.color }}>
                          {t('recCta')} <IconArrowRight size={12} />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PracticePageShell>
  );
}
