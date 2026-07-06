'use client';

import { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useStartMockExam } from '@/hooks/useMockExam';
import {
  EXAM_READING_DISPLAY,
  EXAM_LISTENING_DISPLAY,
  EXAM_WRITING_DISPLAY,
  EXAM_SPEAKING_DISPLAY,
} from '@/lib/examConfig';
import { EXAM_PROVIDERS, VISIBLE_LEVELS, providerLevels, coerceLevel } from '@/config/examProviders';
import { SetupSection } from '../../_components/createSetup';
import {
  IconTrophy, IconBookOpen, IconHeadphones, IconPenLine, IconMic,
  IconChevronLeft, IconLoader, IconCheck,
} from '@/components/ui/Icons';
import { ACCENT } from '@/lib/tokens';

type SkillKey = 'reading' | 'listening' | 'writing' | 'speaking';

const SKILL_META: {
  key: SkillKey;
  display: Record<string, Record<string, { timeMin: number }>>;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
}[] = [
  { key: 'reading', display: EXAM_READING_DISPLAY, icon: IconBookOpen, color: ACCENT.reading },
  { key: 'listening', display: EXAM_LISTENING_DISPLAY, icon: IconHeadphones, color: ACCENT.listening },
  { key: 'writing', display: EXAM_WRITING_DISPLAY, icon: IconPenLine, color: ACCENT.writing },
  { key: 'speaking', display: EXAM_SPEAKING_DISPLAY, icon: IconMic, color: ACCENT.speaking },
];

export default function MockExamNewPage() {
  const router = useRouter();
  const t = useTranslations('practice.mockExam.new');
  const tCockpit = useTranslations('practice.mockExam.cockpit');
  const tSetup = useTranslations('practice.examCommon.setup');
  const tHub = useTranslations('practice.common.hub');
  const [examType, setExamType] = useState<string>('GOETHE');
  const [cefrLevel, setCefrLevel] = useState<string>('B1');
  const [includeSpeaking, setIncludeSpeaking] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const startMut = useStartMockExam();

  const skills = SKILL_META.filter((s) => includeSpeaking || s.key !== 'speaking');
  // The sitting is only offered when every included module has a display
  // config for this provider/level (mirrors the backend validation).
  const ready = skills.every((s) => !!s.display[examType]?.[cefrLevel]);
  const totalMin = ready
    ? skills.reduce((sum, s) => sum + (s.display[examType]?.[cefrLevel]?.timeMin ?? 0), 0)
    : 0;
  const perModuleRule = examType === 'GOETHE' || examType === 'OESD';

  const selectProvider = (id: string) => {
    setExamType(id);
    setCefrLevel((cur) => coerceLevel(id, cur));
  };

  const handleStart = async () => {
    if (!ready || startMut.isPending) return;
    setErrorMsg('');
    try {
      const state = await startMut.mutateAsync({ examType, cefrLevel, includeSpeaking });
      router.push(`/practice-test/mock-exam/${state.id}`);
    } catch {
      setErrorMsg(t('errorCreate'));
    }
  };

  return (
    <div className="mx-auto max-w-360 px-4 py-6 sm:px-6">
      <Link href="/practice-test/mock-exam" className="mb-4 inline-flex items-center gap-1 text-caption font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
        <IconChevronLeft size={16} /> {tHub('back')}
      </Link>

      <header className="mb-5 flex items-center gap-3.5">
        <div className="v2-icongrad-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px]"
          style={{ color: 'var(--accent-on)', boxShadow: '0 8px 20px color-mix(in srgb, var(--accent) 35%, transparent)' }}>
          <IconTrophy size={24} />
        </div>
        <div className="min-w-0">
          <h1 className="text-h1 font-extrabold leading-tight" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{t('pageTitle')}</h1>
          <p className="mt-0.5 text-body" style={{ color: 'var(--theme-text-secondary)' }}>{t('pageSubtitle')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        {/* ── Config column ── */}
        <div className="flex flex-col gap-6">
          {/* 1 · Exam type */}
          <SetupSection n={1} label={tSetup('examTypeLabel')}>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {EXAM_PROVIDERS.map((et) => {
                const on = examType === et.id;
                return (
                  <button key={et.id} onClick={() => selectProvider(et.id)}
                    className="rounded-md border p-3.5 text-left transition-transform hover:-translate-y-0.5"
                    style={on
                      ? { background: `color-mix(in srgb, ${et.color} 12%, transparent)`, borderColor: et.color }
                      : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                    <div className="text-body font-bold" style={{ color: on ? et.color : 'var(--theme-text-primary)' }}>{tSetup(et.labelKey as Parameters<typeof tSetup>[0])}</div>
                    <div className="mt-0.5 text-[10.5px] leading-tight" style={{ color: 'var(--theme-text-muted)' }}>{tSetup(et.descKey as Parameters<typeof tSetup>[0])}</div>
                  </button>
                );
              })}
            </div>
          </SetupSection>

          {/* 2 · Level */}
          <SetupSection n={2} label={tSetup('levelLabel')}>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${VISIBLE_LEVELS.length}, minmax(0, 1fr))` }}>
              {VISIBLE_LEVELS.map((lvl) => {
                const unsupported = !providerLevels(examType).includes(lvl);
                const on = cefrLevel === lvl && !unsupported;
                return (
                  <button key={lvl} onClick={() => !unsupported && setCefrLevel(lvl)} disabled={unsupported}
                    className="rounded-md border px-2 py-3 text-center transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed"
                    style={on
                      ? { background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderColor: 'var(--accent)' }
                      : unsupported
                        ? { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', opacity: 0.4 }
                        : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                    <div className="mono text-lead font-bold" style={{ color: on ? 'var(--accent)' : 'var(--theme-text-primary)' }}>{lvl}</div>
                    {unsupported && <div className="text-[9px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{tSetup('naBadge')}</div>}
                  </button>
                );
              })}
            </div>
          </SetupSection>

          {/* 3 · Speaking toggle */}
          <SetupSection n={3} label={t('speakingLabel')}>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {[
                { on: true, label: t('speakingOn') },
                { on: false, label: t('speakingOff') },
              ].map((opt) => {
                const active = includeSpeaking === opt.on;
                return (
                  <button key={String(opt.on)} onClick={() => setIncludeSpeaking(opt.on)}
                    className="rounded-md border p-3.5 text-left transition-transform hover:-translate-y-0.5"
                    style={active
                      ? { background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderColor: 'var(--accent)' }
                      : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                    <div className="text-body font-bold" style={{ color: active ? 'var(--accent)' : 'var(--theme-text-primary)' }}>{opt.label}</div>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>{t('speakingHint')}</p>
          </SetupSection>
        </div>

        {/* ── Preview column ── */}
        <div className="flex flex-col gap-3.5 lg:sticky lg:top-6">
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{tSetup('previewLabel')}</div>

          <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', boxShadow: 'var(--v2-shadow-card-hover)' }}>
            <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--theme-border)', background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}>
              <div className="mb-1.5 flex items-center gap-2">
                <IconTrophy size={16} style={{ color: 'var(--accent)' }} />
                <span className="mono rounded-[5px] px-2 py-0.5 text-[10.5px] font-bold" style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)' }}>{cefrLevel}</span>
                <span className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>{examType}</span>
              </div>
              <div className="text-lead font-bold" style={{ color: 'var(--theme-text-primary)' }}>{tCockpit('title', { examType, cefrLevel })}</div>
            </div>

            {ready ? (
              <div className="p-4">
                {/* Modules with per-module time */}
                <div className="space-y-1.5">
                  {skills.map((s, i) => {
                    const Icon = s.icon;
                    const info = s.display[examType]?.[cefrLevel];
                    return (
                      <div key={s.key} className="flex items-center gap-2.5 rounded-md border px-3 py-2" style={{ background: 'var(--theme-bg-tertiary)', borderColor: 'var(--theme-border)' }}>
                        <span className="mono text-[10px] font-bold" style={{ color: 'var(--theme-text-muted)' }}>{i + 1}</span>
                        <Icon size={15} style={{ color: s.color }} />
                        <span className="flex-1 text-caption font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                          {tCockpit(`module.${s.key}` as Parameters<typeof tCockpit>[0])}
                        </span>
                        <span className="mono text-[11px] font-bold" style={{ color: 'var(--theme-text-muted)' }}>
                          {tCockpit('minutes', { count: info?.timeMin ?? 0 })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Total time + rule */}
                <div className="mt-3 flex items-center justify-between rounded-md border px-3 py-2.5" style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)' }}>
                  <span className="text-caption font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>{t('totalTime')}</span>
                  <span className="mono text-lead font-extrabold" style={{ color: 'var(--accent)' }}>{tCockpit('minutes', { count: totalMin })}</span>
                </div>
                <p className="mt-2.5 text-[11.5px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                  {perModuleRule ? t('ruleGoethe') : t('ruleTelc')}
                </p>
              </div>
            ) : (
              <div className="p-4 text-center text-caption" style={{ color: 'var(--theme-text-muted)' }}>{tSetup('naBadge')}</div>
            )}
          </div>

          <button onClick={handleStart} disabled={!ready || startMut.isPending}
            className={`flex h-13 items-center justify-center gap-2.5 rounded-[13px] text-[15px] font-bold transition-transform ${ready && !startMut.isPending ? 'hover:-translate-y-0.5 active:scale-95' : 'cursor-not-allowed'}`}
            style={ready
              ? { background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 6px 18px color-mix(in srgb, var(--accent) 40%, transparent)' }
              : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
            {startMut.isPending ? <><IconLoader size={17} /> {t('loadingLong')}</> : <><IconCheck size={17} /> {t('start')}</>}
          </button>
          {startMut.isPending && <div className="-mt-1 text-center text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>{t('loadingHint')}</div>}
          {errorMsg && <p className="text-center text-caption" style={{ color: 'var(--danger)' }}>{errorMsg}</p>}
        </div>
      </div>
    </div>
  );
}
