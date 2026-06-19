'use client';

import { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useGenerateFreeSpeaking } from '@/hooks/useFreeSpeaking';
import { useGenerateExamSpeaking } from '@/hooks/useExamSpeaking';
import { EXAM_SPEAKING_DISPLAY } from '@/lib/examConfig';
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
function IconMic({ size = 16, style }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><line x1="12" y1="19" x2="12" y2="22" /></svg>;
}

const LEVELS = [
  { id: 'A1', descKey: 'levelDescA1' },
  { id: 'A2', descKey: 'levelDescA2' },
  { id: 'B1', descKey: 'levelDescB1' },
] as const;

const TOPIC_KEYS = [
  'sich_vorstellen', 'alltag', 'wohnen', 'arbeit', 'familie', 'reisen', 'einkaufen', 'gesundheit', 'meinung',
] as const;

export default function FreeSpeakingNewPage() {
  const t = useTranslations('practice.speaking.setup');
  const tHub = useTranslations('practice.common.hub');
  const tCommon = useTranslations('practice.examCommon.setup');
  const router = useRouter();
  const generateMut = useGenerateFreeSpeaking();
  const examGenMut = useGenerateExamSpeaking();

  const [mode, setMode] = useState<'topic' | 'teil'>('topic');
  const [cefrLevel, setCefrLevel] = useState('B1');
  const [topicType, setTopicType] = useState<typeof TOPIC_KEYS[number]>('sich_vorstellen');
  const loading = generateMut.isPending;

  const topicDe = t(`topics.${topicType}.de` as 'topics.sich_vorstellen.de');
  const topicVi = t(`topics.${topicType}.vi` as 'topics.sich_vorstellen.vi');

  const handleGenerate = async () => {
    if (loading) return;
    try {
      const session = await generateMut.mutateAsync({ cefrLevel, topicType });
      router.push(`/practice-test/speaking/${session.id}`);
    } catch { /* handled below via isError */ }
  };

  return (
    <QuotaPaywall feature="freeSpeaking">
      <div className="mx-auto max-w-360 px-4 py-6 sm:px-6">
        <QuotaBanner feature="freeSpeaking" label={t('quotaLabel')} featureContext="speaking-new" />

        {/* Back */}
        <Link href="/practice-test/speaking" className="mb-4 inline-flex items-center gap-1 text-caption font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
          <IconChevronLeft size={16} /> {tHub('back')}
        </Link>

        {/* Hero */}
        <header className="mb-5 flex items-center gap-3.5">
          <div className="v2-icongrad-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px]"
            style={{ color: 'var(--accent-on)', boxShadow: '0 8px 20px color-mix(in srgb, var(--accent) 35%, transparent)' }}>
            <IconMic size={24} />
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
            displayMap={EXAM_SPEAKING_DISPLAY as Record<string, Record<string, { teile: number; structure: string[] }>>}
            isPending={examGenMut.isPending}
            onGenerate={(d) => examGenMut.mutateAsync(d)}
            answerHref={(id) => `/practice-test/speaking/exam/${id}`}
          />
        ) : (
        <>
        {/* Live prompt sentence */}
        <div className="v2-hero-accent mb-6 rounded-2xl px-5 py-4 text-[15px] leading-loose"
          style={{ border: '1px solid color-mix(in srgb, var(--accent) 28%, transparent)', color: 'var(--theme-text-secondary)' }}>
          {t('promptSpeak')} <PromptToken on color="var(--accent)" label={topicDe} /> ·{' '}
          {t('promptLevel')} <PromptToken on mono color="var(--violet)" label={cefrLevel} />.
        </div>

        {/* Config + preview */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          {/* ── Config column ── */}
          <div className="flex flex-col gap-6">
            {/* 1 · Level */}
            <SetupSection n={1} label={t('stepLevel')}>
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map((l) => {
                  const on = cefrLevel === l.id;
                  return (
                    <button key={l.id} onClick={() => setCefrLevel(l.id)}
                      className="rounded-md border px-3 py-3 text-left transition-transform hover:-translate-y-0.5"
                      style={on
                        ? { background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderColor: 'var(--accent)' }
                        : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                      <div className="mono text-lead font-bold" style={{ color: on ? 'var(--accent)' : 'var(--theme-text-primary)' }}>{l.id}</div>
                      <div className="mt-1 text-[10px] leading-tight" style={{ color: 'var(--theme-text-muted)' }}>{t(l.descKey as 'levelDescA1')}</div>
                    </button>
                  );
                })}
              </div>
            </SetupSection>

            {/* 2 · Topic */}
            <SetupSection n={2} label={t('stepTopic')}>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {TOPIC_KEYS.map((key) => {
                  const on = topicType === key;
                  return (
                    <button key={key} onClick={() => setTopicType(key)}
                      className="relative rounded-md border p-3 text-left transition-transform hover:-translate-y-0.5"
                      style={on
                        ? { background: 'color-mix(in srgb, var(--accent) 14%, transparent)', borderColor: 'var(--accent)' }
                        : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                      {on && (
                        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full" style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
                          <IconCheck size={9} />
                        </span>
                      )}
                      <div className="truncate text-body font-bold" style={{ color: on ? 'var(--accent)' : 'var(--theme-text-primary)' }}>{t(`topics.${key}.de` as 'topics.sich_vorstellen.de')}</div>
                      <div className="mt-0.5 truncate text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>{t(`topics.${key}.vi` as 'topics.sich_vorstellen.vi')}</div>
                    </button>
                  );
                })}
              </div>
            </SetupSection>

            {/* Info note */}
            <div className="rounded-md p-3 text-[11.5px] leading-relaxed"
              style={{ background: 'color-mix(in srgb, var(--accent) 7%, transparent)', borderLeft: '3px solid color-mix(in srgb, var(--accent) 55%, transparent)', color: 'var(--theme-text-muted)' }}>
              {t('info')}
            </div>
          </div>

          {/* ── Preview column (sticky on desktop) ── */}
          <div className="flex flex-col gap-3.5 lg:sticky lg:top-6">
            <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{t('previewLabel')}</div>

            <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', boxShadow: 'var(--v2-shadow-card-hover)' }}>
              <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--theme-border)', background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="text-base">🎤</span>
                  <span className="mono rounded-[5px] px-2 py-0.5 text-[10.5px] font-bold" style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)' }}>{cefrLevel}</span>
                  <span className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>{topicDe}</span>
                </div>
                <div className="text-lead font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('previewTitle', { topic: topicVi })}</div>
              </div>
              <div className="p-4">
                {/* Faux prompt question */}
                <div className="mb-4 flex flex-col gap-1.5">
                  <div className="h-1.75 w-full rounded" style={{ background: 'var(--theme-bg-secondary)' }} />
                  <div className="h-1.75 w-10/12 rounded" style={{ background: 'var(--theme-bg-secondary)' }} />
                  <div className="h-1.75 w-7/12 rounded" style={{ background: 'var(--theme-bg-secondary)' }} />
                </div>
                {/* Record hint */}
                <div className="flex items-center gap-3 rounded-md border border-dashed p-3" style={{ borderColor: 'var(--theme-border)' }}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
                    <IconMic size={16} />
                  </span>
                  <span className="text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>{t('previewRecordHint')}</span>
                </div>
              </div>
            </div>

            <button onClick={handleGenerate} disabled={loading}
              className={`flex h-13 items-center justify-center gap-2.5 rounded-[13px] text-[15px] font-bold transition-transform ${loading ? 'cursor-not-allowed' : 'hover:-translate-y-0.5 active:scale-95'}`}
              style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 6px 18px color-mix(in srgb, var(--accent) 40%, transparent)', opacity: loading ? 0.7 : 1 }}>
              {loading ? <><IconLoader size={17} /> {t('generating')}</> : <><IconMic size={17} /> {t('generate')}</>}
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
