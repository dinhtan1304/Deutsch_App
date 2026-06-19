'use client';

import { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useGenerateListening } from '@/hooks/useListening';
import { useGenerateExamListening } from '@/hooks/useExamListening';
import { EXAM_LISTENING_DISPLAY } from '@/lib/examConfig';
import { QuotaPaywall } from '@/components/subscription/QuotaPaywall';
import { QuotaBanner } from '@/components/subscription/QuotaBanner';
import { SetupSection, PromptToken } from '../../_components/createSetup';
import { TeilPracticeSetup } from '../../_components/TeilPracticeSetup';

type IconProps = { size?: number; style?: React.CSSProperties };
function IconChevronLeft({ size = 16, style }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconLoader({ size = 16, style }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconCheck({ size = 16, style }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="20 6 9 17 4 12" /></svg>;
}
function IconHeadphones({ size = 16, style }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a9 9 0 0 1 18 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" /></svg>;
}
function IconPlay({ size = 14, style }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block', ...style }}><polygon points="6 3 20 12 6 21 6 3" /></svg>;
}

const LEVEL_IDS = ['A1', 'A2', 'B1'] as const;
const SCRIPT_TYPE_IDS = ['dialogue', 'monologue', 'announcement', 'interview', 'radio'] as const;
const SCRIPT_TYPE_EMOJIS: Record<typeof SCRIPT_TYPE_IDS[number], string> = {
  dialogue: '💬', monologue: '🎙️', announcement: '📢', interview: '🎤', radio: '📻',
};
// Deterministic waveform heights (%) for the preview mock.
const WAVE = Array.from({ length: 32 }, (_, i) => 24 + Math.abs(Math.sin(i * 0.9)) * 70);

export default function NewListeningPage() {
  const t = useTranslations('practice.listening.setup');
  const tHub = useTranslations('practice.common.hub');
  const tCommon = useTranslations('practice.examCommon.setup');
  const router = useRouter();
  const generateMut = useGenerateListening();
  const examGenMut = useGenerateExamListening();

  const [mode, setMode] = useState<'topic' | 'teil'>('topic');
  const [level, setLevel] = useState<typeof LEVEL_IDS[number]>('A2');
  const [scriptType, setScriptType] = useState<typeof SCRIPT_TYPE_IDS[number]>('dialogue');
  const loading = generateMut.isPending;

  const typeLabel = t(`scriptTypes.${scriptType}.label` as 'scriptTypes.dialogue.label');
  const typeDesc = t(`scriptTypes.${scriptType}.desc` as 'scriptTypes.dialogue.desc');

  const handleGenerate = async () => {
    if (loading) return;
    try {
      const session = await generateMut.mutateAsync({ cefrLevel: level, scriptType });
      router.push(`/practice-test/listening/${session.id}`);
    } catch { /* handled below via isError */ }
  };

  return (
    <QuotaPaywall feature="listening">
      <div className="mx-auto max-w-360 px-4 py-6 sm:px-6">
        <QuotaBanner feature="listening" label={t('quotaLabel')} featureContext="listening-new" />

        {/* Back */}
        <Link href="/practice-test/listening" className="mb-4 inline-flex items-center gap-1 text-caption font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
          <IconChevronLeft size={16} /> {tHub('back')}
        </Link>

        {/* Hero */}
        <header className="mb-5 flex items-center gap-3.5">
          <div className="v2-icongrad-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px]"
            style={{ color: 'var(--accent-on)', boxShadow: '0 8px 20px color-mix(in srgb, var(--accent) 35%, transparent)' }}>
            <IconHeadphones size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="text-h1 font-extrabold leading-tight" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{t('title')}</h1>
            <p className="mt-0.5 text-body" style={{ color: 'var(--theme-text-secondary)' }}>{t('subtitle')}</p>
          </div>
        </header>

        {/* Mode toggle: topic-based vs single exam Teil */}
        <div className="mb-6 inline-flex rounded-[11px] border p-1" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
          {(['topic', 'teil'] as const).map((m) => {
            const on = mode === m;
            return (
              <button key={m} onClick={() => setMode(m)} className="rounded-[8px] px-4 py-2 text-caption font-bold transition-colors"
                style={on ? { background: 'var(--accent)', color: 'var(--accent-on)' } : { color: 'var(--theme-text-secondary)' }}>
                {m === 'topic' ? tCommon('modeByTopic') : tCommon('modeByTeil')}
              </button>
            );
          })}
        </div>

        {mode === 'teil' ? (
          <TeilPracticeSetup
            displayMap={EXAM_LISTENING_DISPLAY}
            isPending={examGenMut.isPending}
            onGenerate={(d) => examGenMut.mutateAsync(d)}
            answerHref={(id) => `/practice-test/listening/exam/${id}`}
          />
        ) : (
        <>
        {/* Live prompt sentence */}
        <div className="v2-hero-accent mb-6 rounded-2xl px-5 py-4 text-[15px] leading-loose"
          style={{ border: '1px solid color-mix(in srgb, var(--accent) 28%, transparent)', color: 'var(--theme-text-secondary)' }}>
          {t('promptListen')} <PromptToken on color="var(--accent)" label={typeDesc} /> ·{' '}
          {t('promptLevel')} <PromptToken on mono color="var(--violet)" label={level} />.
        </div>

        {/* Config + preview */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          {/* ── Config column ── */}
          <div className="flex flex-col gap-6">
            {/* 1 · Level */}
            <SetupSection n={1} label={t('stepLevel')}>
              <div className="grid grid-cols-3 gap-2">
                {LEVEL_IDS.map((l) => {
                  const on = level === l;
                  return (
                    <button key={l} onClick={() => setLevel(l)}
                      className="rounded-md border px-3 py-3 text-left transition-transform hover:-translate-y-0.5"
                      style={on
                        ? { background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderColor: 'var(--accent)' }
                        : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                      <div className="mono text-lead font-bold" style={{ color: on ? 'var(--accent)' : 'var(--theme-text-primary)' }}>{l}</div>
                      <div className="mt-1 text-[10px] leading-tight" style={{ color: 'var(--theme-text-muted)' }}>{t(`levels.${l}` as 'levels.A1')}</div>
                    </button>
                  );
                })}
              </div>
            </SetupSection>

            {/* 2 · Script type */}
            <SetupSection n={2} label={t('stepScriptType')}>
              <div className="flex flex-col gap-2">
                {SCRIPT_TYPE_IDS.map((st) => {
                  const on = scriptType === st;
                  return (
                    <button key={st} onClick={() => setScriptType(st)}
                      className="flex items-center gap-3 rounded-md border p-3 text-left transition-transform hover:-translate-y-0.5"
                      style={on
                        ? { background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderColor: 'var(--accent)' }
                        : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-lg"
                        style={{ background: on ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'var(--theme-bg-tertiary)' }}>{SCRIPT_TYPE_EMOJIS[st]}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-body font-bold" style={{ color: on ? 'var(--accent)' : 'var(--theme-text-primary)' }}>{t(`scriptTypes.${st}.label` as 'scriptTypes.dialogue.label')}</div>
                        <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{t(`scriptTypes.${st}.desc` as 'scriptTypes.dialogue.desc')}</div>
                      </div>
                      {on && (
                        <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
                          <IconCheck size={10} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </SetupSection>
          </div>

          {/* ── Preview column (sticky on desktop) ── */}
          <div className="flex flex-col gap-3.5 lg:sticky lg:top-6">
            <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{t('previewLabel')}</div>

            <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', boxShadow: 'var(--v2-shadow-card-hover)' }}>
              <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--theme-border)', background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="text-base">{SCRIPT_TYPE_EMOJIS[scriptType]}</span>
                  <span className="mono rounded-[5px] px-2 py-0.5 text-[10.5px] font-bold" style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)' }}>{level}</span>
                  <span className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>{typeLabel}</span>
                </div>
                <div className="text-lead font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('previewTitle', { type: typeDesc })}</div>
                <div className="mt-1 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{t(`levels.${level}` as 'levels.A1')}</div>
              </div>
              <div className="p-4">
                {/* Audio bar mock */}
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
                    <IconPlay size={13} />
                  </span>
                  <div className="flex h-8 flex-1 items-center gap-0.5">
                    {WAVE.map((h, i) => (
                      <span key={i} className="flex-1 rounded-xs" style={{ height: `${h}%`, background: i < 10 ? 'var(--accent)' : 'var(--theme-bg-secondary)' }} />
                    ))}
                  </div>
                </div>
                {/* Faux questions */}
                {[90, 78, 66].map((w, i) => (
                  <div key={i} className="mb-2.5 flex items-center gap-2">
                    <span className="mono flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px] text-[10px] font-bold" style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)', color: 'var(--accent)' }}>{i + 1}</span>
                    <span className="h-1.75 rounded" style={{ width: `${w}%`, background: 'var(--theme-bg-secondary)' }} />
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleGenerate} disabled={loading}
              className={`flex h-13 items-center justify-center gap-2.5 rounded-[13px] text-[15px] font-bold transition-transform ${loading ? 'cursor-not-allowed' : 'hover:-translate-y-0.5 active:scale-95'}`}
              style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 6px 18px color-mix(in srgb, var(--accent) 40%, transparent)', opacity: loading ? 0.7 : 1 }}>
              {loading ? <><IconLoader size={17} /> {t('generating')}</> : <><IconHeadphones size={17} /> {t('generate')}</>}
            </button>
            {generateMut.isError && <p className="text-center text-caption" style={{ color: 'var(--danger)' }}>{t('generateError')}</p>}
          </div>
        </div>
        </>
        )}
      </div>
    </QuotaPaywall>
  );
}
