'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useMockExamState, useAdvanceMockExam, useFinishMockExam, useAbandonMockExam } from '@/hooks/useMockExam';
import { MockModuleView, MockSkill } from '@/lib/api/mockExam';
import {
  EXAM_READING_DISPLAY, EXAM_LISTENING_DISPLAY, EXAM_WRITING_DISPLAY, EXAM_SPEAKING_DISPLAY,
} from '@/lib/examConfig';
import {
  IconTrophy, IconBookOpen, IconHeadphones, IconPenLine, IconMic,
  IconChevronLeft, IconLoader, IconCheck, IconLock, IconClock,
} from '@/components/ui/Icons';
import { ACCENT } from '@/lib/tokens';
import { GridSkeleton } from '@/components/ui';

const SKILL_META: Record<MockSkill, {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
  display: Record<string, Record<string, { timeMin: number }>>;
  route: string;
}> = {
  reading: { icon: IconBookOpen, color: ACCENT.reading, display: EXAM_READING_DISPLAY, route: 'reading' },
  listening: { icon: IconHeadphones, color: ACCENT.listening, display: EXAM_LISTENING_DISPLAY, route: 'listening' },
  writing: { icon: IconPenLine, color: ACCENT.writing, display: EXAM_WRITING_DISPLAY, route: 'writing' },
  speaking: { icon: IconMic, color: ACCENT.speaking, display: EXAM_SPEAKING_DISPLAY, route: 'speaking' },
};

function StatusChip({ status }: { status: MockModuleView['status'] }) {
  const t = useTranslations('practice.mockExam.cockpit');
  const meta = {
    PENDING: { label: t('statusPending'), color: 'var(--theme-text-muted)' },
    ACTIVE: { label: t('statusActive'), color: 'var(--warn)' },
    GRADING: { label: t('statusGrading'), color: 'var(--violet)' },
    DONE: { label: t('statusDone'), color: 'var(--success)' },
  }[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase"
      style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color, letterSpacing: '.04em' }}>
      <span className="h-1 w-1 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

export default function MockExamCockpitPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('practice.mockExam.cockpit');
  const tHub = useTranslations('practice.common.hub');

  const { data: state, isLoading } = useMockExamState(id);
  const advanceMut = useAdvanceMockExam();
  const finishMut = useFinishMockExam();
  const abandonMut = useAbandonMockExam();
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmAbandon, setConfirmAbandon] = useState(false);

  if (isLoading || !state) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <GridSkeleton cols={1} count={4} height="h-20" gap="gap-3" />
      </div>
    );
  }

  const doneCount = state.modules.filter((m) => m.status === 'DONE' || m.status === 'GRADING').length;
  const hasGrading = state.modules.some((m) => m.status === 'GRADING');

  const handleAdvance = async () => {
    if (advanceMut.isPending) return;
    setErrorMsg('');
    try {
      await advanceMut.mutateAsync(state.id);
    } catch {
      setErrorMsg(t('errorAdvance'));
    }
  };

  const handleFinish = async () => {
    if (finishMut.isPending) return;
    try {
      await finishMut.mutateAsync(state.id);
      router.push(`/practice-test/mock-exam/${state.id}/result`);
    } catch { /* state stays, user can retry */ }
  };

  const handleAbandon = async () => {
    try {
      await abandonMut.mutateAsync(state.id);
      router.push('/practice-test/mock-exam');
    } catch { /* ignore */ }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link href="/practice-test/mock-exam" className="mb-4 inline-flex items-center gap-1 text-caption font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
        <IconChevronLeft size={16} /> {tHub('back')}
      </Link>

      {/* Hero */}
      <header className="mb-6 flex items-start gap-3.5">
        <div className="v2-icongrad-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px]"
          style={{ color: 'var(--accent-on)', boxShadow: '0 8px 20px color-mix(in srgb, var(--accent) 35%, transparent)' }}>
          <IconTrophy size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>{t('eyebrow')}</div>
          <h1 className="text-h2 font-extrabold leading-tight" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>
            {t('title', { examType: state.examType, cefrLevel: state.cefrLevel })}
          </h1>
          <p className="mt-1 text-caption leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{t('subtitle')}</p>
        </div>
        <span className="mono shrink-0 rounded-[7px] px-2.5 py-1 text-caption font-bold"
          style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}>
          {t('progress', { done: doneCount, total: state.modules.length })}
        </span>
      </header>

      {/* Module stepper */}
      <div className="flex flex-col gap-3">
        {state.modules.map((mod, i) => {
          const meta = SKILL_META[mod.skill];
          const Icon = meta.icon;
          const info = meta.display[state.examType]?.[state.cefrLevel];
          const isNextPending = mod.status === 'PENDING' && state.canAdvance &&
            state.modules.findIndex((m) => m.status === 'PENDING') === i;
          const dimmed = mod.status === 'PENDING' && !isNextPending;

          return (
            <article key={mod.skill}
              className="flex flex-wrap items-center gap-3 rounded-[13px] border p-4"
              style={{
                background: 'var(--theme-bg-card)',
                borderColor: mod.status === 'ACTIVE' ? meta.color : 'var(--theme-border)',
                opacity: dimmed ? 0.55 : 1,
              }}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
                style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}>
                {mod.status === 'PENDING' ? <IconLock size={18} /> : <Icon size={19} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="mono text-[10px] font-bold" style={{ color: 'var(--theme-text-muted)' }}>{i + 1}</span>
                  <h3 className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                    {t(`module.${mod.skill}` as Parameters<typeof t>[0])}
                  </h3>
                  <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                    {t(`moduleVi.${mod.skill}` as Parameters<typeof t>[0])}
                  </span>
                </div>
                <div className="mt-0.5 inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                  <IconClock size={11} /> {t('minutes', { count: info?.timeMin ?? 0 })}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <StatusChip status={mod.status} />
                {mod.status === 'ACTIVE' && mod.sessionId && (
                  <Link href={`/practice-test/${meta.route}/exam/${mod.sessionId}?mock=${state.id}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] px-3.5 text-caption font-bold text-white transition-transform hover:-translate-y-0.5 active:scale-95"
                    style={{ background: meta.color, boxShadow: `0 4px 12px color-mix(in srgb, ${meta.color} 35%, transparent)` }}>
                    {t('enter')}
                  </Link>
                )}
                {isNextPending && (
                  <button onClick={handleAdvance} disabled={advanceMut.isPending}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] px-3.5 text-caption font-bold transition-transform enabled:hover:-translate-y-0.5 enabled:active:scale-95 disabled:opacity-60"
                    style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
                    {advanceMut.isPending ? <><IconLoader size={14} /> {t('advanceLoading')}</> : t('advance')}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {advanceMut.isPending && (
        <p className="mt-3 text-center text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>{t('advanceHint')}</p>
      )}
      {errorMsg && <p className="mt-3 text-center text-caption" style={{ color: 'var(--danger)' }}>{errorMsg}</p>}

      {/* Footer actions */}
      <div className="mt-6 flex flex-col gap-3">
        {state.status === 'COMPLETED' ? (
          <Link href={`/practice-test/mock-exam/${state.id}/result`}
            className="flex h-13 items-center justify-center gap-2.5 rounded-[13px] text-[15px] font-bold transition-transform hover:-translate-y-0.5 active:scale-95"
            style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 6px 18px color-mix(in srgb, var(--accent) 40%, transparent)' }}>
            <IconTrophy size={17} /> {t('viewResult')}
          </Link>
        ) : state.allGraded ? (
          <button onClick={handleFinish} disabled={finishMut.isPending}
            className="flex h-13 items-center justify-center gap-2.5 rounded-[13px] text-[15px] font-bold text-white transition-transform enabled:hover:-translate-y-0.5 enabled:active:scale-95 disabled:opacity-60"
            style={{ background: 'var(--success)', boxShadow: '0 6px 18px color-mix(in srgb, var(--success) 40%, transparent)' }}>
            {finishMut.isPending ? <IconLoader size={17} /> : <IconCheck size={17} />} {t('finish')}
          </button>
        ) : hasGrading && !state.canAdvance ? (
          <div className="flex items-center justify-center gap-2 rounded-[13px] border border-dashed px-4 py-4 text-caption" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
            <IconLoader size={15} /> {t('finishWait')}
          </div>
        ) : null}

        {state.status === 'IN_PROGRESS' && (
          confirmAbandon ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[13px] p-4"
              style={{ border: '1px solid color-mix(in srgb, var(--danger) 40%, transparent)', background: 'color-mix(in srgb, var(--danger) 6%, transparent)' }}>
              <p className="text-caption" style={{ color: 'var(--theme-text-secondary)' }}>{t('confirmAbandon')}</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmAbandon(false)} className="rounded-[8px] px-3.5 py-2 text-caption font-bold"
                  style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                  {tHub('back')}
                </button>
                <button onClick={handleAbandon} className="rounded-[8px] px-3.5 py-2 text-caption font-bold text-white" style={{ background: 'var(--danger)' }}>
                  {t('abandon')}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmAbandon(true)}
              className="self-center text-caption font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--theme-text-muted)' }}>
              {t('abandon')}
            </button>
          )
        )}
      </div>
    </div>
  );
}
