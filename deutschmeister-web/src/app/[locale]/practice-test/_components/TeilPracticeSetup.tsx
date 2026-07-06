'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { EXAM_PROVIDERS, VISIBLE_LEVELS, providerLevels, coerceLevel } from '@/config/examProviders';
import { SetupSection } from './createSetup';
import { TeilStrategyPanel } from './TeilStrategyPanel';
import type { StrategySkill } from '../_data/teil-strategies';

export interface TeilPreset {
  examType?: string;
  cefrLevel?: string;
  teilNumber?: number;
}

/**
 * Reads a single-Teil practice preset from the URL — the deep-link target the
 * Exam Readiness recommendations use:
 *   /practice-test/<skill>/new?mode=teil&examType=GOETHE&level=B1&teil=3
 * `presetMode` is 'teil' when the link asked for Teil mode, else null.
 */
export function useTeilPresetFromQuery(): { presetMode: 'teil' | null; initial: TeilPreset } {
  const searchParams = useSearchParams();
  const presetMode = searchParams.get('mode') === 'teil' ? ('teil' as const) : null;
  const teilRaw = Number(searchParams.get('teil'));
  return {
    presetMode,
    initial: {
      examType: searchParams.get('examType') ?? undefined,
      cefrLevel: searchParams.get('level') ?? undefined,
      teilNumber: Number.isInteger(teilRaw) && teilRaw >= 1 ? teilRaw : undefined,
    },
  };
}

type IconProps = { size?: number; style?: React.CSSProperties };
function IconLoader({ size = 16, style }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconCheck({ size = 16, style }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="20 6 9 17 4 12" /></svg>;
}

type DisplayInfo = { teile: number; structure: string[] };
type DisplayMap = Record<string, Record<string, DisplayInfo>>;

/**
 * Shared "practise a single exam Teil" setup used inside the free-practice
 * setup screens (reading / listening / writing / speaking). The learner picks
 * a certificate + level + one Teil; we generate just that Teil via the exam
 * single-Teil backend and open it in the standard exam answering UI.
 */
export function TeilPracticeSetup({
  displayMap,
  isPending,
  onGenerate,
  answerHref,
  initial,
  skill,
}: {
  displayMap: DisplayMap;
  isPending: boolean;
  onGenerate: (data: { examType: string; cefrLevel: string; teilNumber: number }) => Promise<{ id: string }>;
  answerHref: (id: string) => string;
  initial?: TeilPreset;
  /** When set, the preview column also shows the strategy of the chosen Teil. */
  skill?: StrategySkill;
}) {
  const router = useRouter();
  const tSetup = useTranslations('practice.examCommon.setup');
  const initialExamType = initial?.examType && displayMap[initial.examType] ? initial.examType : 'GOETHE';
  const initialLevel = initial?.cefrLevel && displayMap[initialExamType]?.[initial.cefrLevel]
    ? initial.cefrLevel
    : coerceLevel(initialExamType, 'B1');
  const [examType, setExamType] = useState<string>(initialExamType);
  const [cefrLevel, setCefrLevel] = useState<string>(initialLevel);
  const [teilNumber, setTeilNumber] = useState<number>(() => {
    const max = displayMap[initialExamType]?.[initialLevel]?.structure.length ?? 1;
    const wanted = initial?.teilNumber ?? 1;
    return wanted >= 1 && wanted <= max ? wanted : 1;
  });
  const [errorMsg, setErrorMsg] = useState('');

  const examInfo = displayMap[examType]?.[cefrLevel];
  const ready = !!examInfo && teilNumber >= 1 && teilNumber <= examInfo.structure.length;

  const selectProvider = (id: string) => {
    setExamType(id);
    setCefrLevel((cur) => coerceLevel(id, cur));
    setTeilNumber(1);
  };

  const selectLevel = (lvl: string) => {
    setCefrLevel(lvl);
    setTeilNumber(1);
  };

  const handleGenerate = async () => {
    if (!ready || isPending) return;
    setErrorMsg('');
    try {
      const session = await onGenerate({ examType, cefrLevel, teilNumber });
      router.push(answerHref(session.id));
    } catch {
      setErrorMsg(tSetup('errorCreate'));
    }
  };

  return (
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
                <button key={lvl} onClick={() => !unsupported && selectLevel(lvl)} disabled={unsupported}
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

        {/* 3 · Teil */}
        <SetupSection n={3} label={tSetup('teilSelectLabel')}>
          {examInfo ? (
            <div className="grid grid-cols-1 gap-2">
              {examInfo.structure.map((s, i) => {
                const num = i + 1;
                const on = teilNumber === num;
                return (
                  <button key={i} onClick={() => setTeilNumber(num)}
                    className="flex items-start gap-2 rounded-md border p-3 text-left transition-transform hover:-translate-y-0.5"
                    style={on
                      ? { background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderColor: 'var(--accent)' }
                      : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                    <span className="mono shrink-0 rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold" style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}>{tSetup('teilLine', { i: num })}</span>
                    <span className="pt-0.5 text-caption" style={{ color: on ? 'var(--accent)' : 'var(--theme-text-secondary)' }}>{s}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border p-3 text-center text-caption" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>{tSetup('naBadge')}</div>
          )}
        </SetupSection>
      </div>

      {/* ── Preview column (sticky on desktop) ── */}
      <div className="flex flex-col gap-3.5 lg:sticky lg:top-6">
        <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{tSetup('previewLabel')}</div>

        <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', boxShadow: 'var(--v2-shadow-card-hover)' }}>
          <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--theme-border)', background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="mono rounded-[5px] px-2 py-0.5 text-[10.5px] font-bold" style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)' }}>{cefrLevel}</span>
              <span className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>{examType}</span>
            </div>
            <div className="text-lead font-bold" style={{ color: 'var(--theme-text-primary)' }}>{examType} {cefrLevel} — {tSetup('teilLine', { i: teilNumber })}</div>
          </div>
          {ready && examInfo ? (
            <div className="p-4 text-[12.5px]" style={{ color: 'var(--theme-text-secondary)' }}>{examInfo.structure[teilNumber - 1]}</div>
          ) : (
            <div className="p-4 text-center text-caption" style={{ color: 'var(--theme-text-muted)' }}>{tSetup('naBadge')}</div>
          )}
        </div>

        {/* Strategy preview for the selected Teil (only where content exists) */}
        {skill && ready && (
          <TeilStrategyPanel examType={examType} cefrLevel={cefrLevel} skill={skill} teilNumber={teilNumber} defaultOpen />
        )}

        <button onClick={handleGenerate} disabled={!ready || isPending}
          className={`flex h-13 items-center justify-center gap-2.5 rounded-[13px] text-[15px] font-bold transition-transform ${ready && !isPending ? 'hover:-translate-y-0.5 active:scale-95' : 'cursor-not-allowed'}`}
          style={ready
            ? { background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 6px 18px color-mix(in srgb, var(--accent) 40%, transparent)' }
            : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
          {isPending ? <><IconLoader size={17} /> {tSetup('creating')}</> : <><IconCheck size={17} /> {tSetup('createExam')}</>}
        </button>
        {errorMsg && <p className="text-center text-caption" style={{ color: 'var(--danger)' }}>{errorMsg}</p>}
      </div>
    </div>
  );
}
