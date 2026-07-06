'use client';

import { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useWritingTopics, useGeneratePrompt } from '@/hooks/useWriting';
import { useGenerateExamWriting } from '@/hooks/useExamWriting';
import { EXAM_WRITING_DISPLAY } from '@/lib/examConfig';
import { QuotaPaywall } from '@/components/subscription/QuotaPaywall';
import { QuotaBanner } from '@/components/subscription/QuotaBanner';
import { SetupSection, PromptToken } from '../../_components/createSetup';
import { TeilPracticeSetup, useTeilPresetFromQuery } from '../../_components/TeilPracticeSetup';
import { IconChevronLeft, IconLoader, IconCheck, IconSparkles, IconPenLine } from '../icons';

const LEVELS = [
  { id: 'A1', descKey: 'levelDescA1' },
  { id: 'A2', descKey: 'levelDescA2' },
  { id: 'B1', descKey: 'levelDescB1' },
  { id: 'B2', descKey: 'levelDescB2' },
] as const;

export default function NewWritingPage() {
  const t = useTranslations('practice.writing.setup');
  const tHub = useTranslations('practice.common.hub');
  const tCommon = useTranslations('practice.examCommon.setup');
  const router = useRouter();

  const teilPreset = useTeilPresetFromQuery();
  const [mode, setMode] = useState<'topic' | 'teil'>(teilPreset.presetMode ?? 'topic');
  const examGenMut = useGenerateExamWriting();

  const [level, setLevel] = useState('A2');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [writingType, setWritingType] = useState('');
  const [wordCountIdx, setWordCountIdx] = useState(0);

  const { data: suggestions, isLoading } = useWritingTopics(level);
  const generateMutation = useGeneratePrompt();

  const effectiveWritingType = writingType || suggestions?.writingTypes[0]?.value || '';
  const currentTypeObj = suggestions?.writingTypes.find((wt) => wt.value === effectiveWritingType);
  const selectedTopicObj = suggestions?.topics.find((tp) => tp.topic === selectedTopic);
  const topicLabel = customTopic.trim() || selectedTopicObj?.labelDe || '';
  const wordCount = suggestions?.wordCountSuggestions[wordCountIdx] ?? suggestions?.wordCountSuggestions[0];
  const finalTopic = customTopic.trim() || selectedTopic;
  const ready = !!finalTopic && !!effectiveWritingType && !!wordCount;

  const resetForLevel = (l: string) => { setLevel(l); setSelectedTopic(''); setCustomTopic(''); setWritingType(''); setWordCountIdx(0); };

  const handleGenerate = async () => {
    if (!ready || !wordCount || generateMutation.isPending) return;
    try {
      const session = await generateMutation.mutateAsync({
        topic: finalTopic,
        cefrLevel: level,
        writingType: effectiveWritingType,
        wordCountMin: wordCount.min,
        wordCountMax: wordCount.max,
      });
      router.push(`/practice-test/writing/${session.id}`);
    } catch { /* handled below via isError */ }
  };

  return (
    <QuotaPaywall feature="writing">
      <div className="mx-auto max-w-360 px-4 py-6 sm:px-6">
        <QuotaBanner feature="writing" label={t('quotaLabel')} featureContext="writing-new" />

        {/* Back */}
        <Link href="/practice-test/writing" className="mb-4 inline-flex items-center gap-1 text-caption font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
          <IconChevronLeft size={16} /> {tHub('back')}
        </Link>

        {/* Hero */}
        <header className="mb-5 flex items-center gap-3.5">
          <div className="v2-icongrad-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px]"
            style={{ color: 'var(--accent-on)', boxShadow: '0 8px 20px color-mix(in srgb, var(--accent) 35%, transparent)' }}>
            <IconPenLine size={24} />
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
            displayMap={EXAM_WRITING_DISPLAY}
            isPending={examGenMut.isPending}
            onGenerate={(d) => examGenMut.mutateAsync(d)}
            answerHref={(id) => `/practice-test/writing/exam/${id}`}
            initial={teilPreset.initial}
            skill="writing"
          />
        ) : (
        <>
        {/* Live prompt sentence */}
        <div className="v2-hero-accent mb-6 rounded-2xl px-5 py-4 text-[15px] leading-loose"
          style={{ border: '1px solid color-mix(in srgb, var(--accent) 28%, transparent)', color: 'var(--theme-text-secondary)' }}>
          {t('promptWrite')} <PromptToken on color="var(--violet)" label={currentTypeObj?.labelDe || '…'} /> ·{' '}
          {t('promptLevel')} <PromptToken on mono color="var(--accent)" label={level} /> ·{' '}
          {t('promptLength')} <PromptToken on mono color="var(--der)" label={wordCount?.label || '…'} /> ·{' '}
          {t('promptTopic')} <PromptToken on={!!topicLabel} color="var(--warn)" label={topicLabel || t('notSelected')} />.
        </div>

        {/* Config + preview */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          {/* ── Config column ── */}
          <div className="flex flex-col gap-6">
            {/* 1 · CEFR level */}
            <SetupSection n={1} label={t('stepLevel')}>
              <div className="grid grid-cols-4 gap-2">
                {LEVELS.map((l) => {
                  const on = level === l.id;
                  return (
                    <button key={l.id} onClick={() => resetForLevel(l.id)}
                      className="rounded-md border px-2 py-3 text-center transition-transform hover:-translate-y-0.5"
                      style={on
                        ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 4px 12px color-mix(in srgb, var(--accent) 38%, transparent)' }
                        : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                      <div className="mono text-lead font-bold">{l.id}</div>
                      <div className="mt-0.5 text-[9px] leading-tight" style={{ opacity: on ? 0.9 : 0.7 }}>{t(l.descKey as 'levelDescA1')}</div>
                    </button>
                  );
                })}
              </div>
            </SetupSection>

            {/* 2 · Topic */}
            <SetupSection n={2} label={t('stepTopic')}>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-22 animate-pulse rounded-md" style={{ background: 'var(--theme-bg-secondary)' }} />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {suggestions?.topics.map((tp) => {
                      const on = selectedTopic === tp.topic && !customTopic.trim();
                      return (
                        <button key={tp.topic} onClick={() => { setSelectedTopic(tp.topic); setCustomTopic(''); }}
                          className="relative rounded-md border p-3 text-center transition-transform hover:-translate-y-0.5"
                          style={on
                            ? { background: 'color-mix(in srgb, var(--accent) 14%, transparent)', borderColor: 'var(--accent)' }
                            : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                          {on && (
                            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full" style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
                              <IconCheck size={9} />
                            </span>
                          )}
                          <div className="text-2xl">{tp.icon}</div>
                          <div className="mt-1.5 truncate text-caption font-bold" style={{ color: on ? 'var(--accent)' : 'var(--theme-text-primary)' }}>{tp.labelDe}</div>
                          <div className="truncate text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>{tp.labelVi}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2.5 flex h-12 items-center gap-2.5 rounded-[11px] border px-3.5"
                    style={{ background: 'var(--theme-bg-card)', borderColor: customTopic.trim() ? 'var(--accent)' : 'var(--theme-border)' }}>
                    <IconPenLine size={15} style={{ color: customTopic.trim() ? 'var(--accent)' : 'var(--theme-text-muted)' }} />
                    <input value={customTopic} onChange={(e) => { setCustomTopic(e.target.value); if (e.target.value.trim()) setSelectedTopic(''); }}
                      placeholder={t('customTopicPlaceholder')}
                      className="h-full flex-1 border-0 bg-transparent text-[13.5px] outline-none" style={{ color: 'var(--theme-text-primary)' }} />
                  </div>
                </>
              )}
            </SetupSection>

            {/* 3 · Writing type */}
            <SetupSection n={3} label={t('stepWritingType')}>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {suggestions?.writingTypes.map((wt) => {
                  const on = effectiveWritingType === wt.value;
                  return (
                    <button key={wt.value} onClick={() => setWritingType(wt.value)}
                      className="flex items-center gap-2.5 rounded-[11px] border p-3 text-left transition-transform hover:-translate-y-0.5"
                      style={on
                        ? { background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderColor: 'var(--accent)' }
                        : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                      <span className="shrink-0 text-lg">{wt.icon}</span>
                      <div className="min-w-0">
                        <div className="truncate text-caption font-bold" style={{ color: 'var(--theme-text-primary)' }}>{wt.labelDe}</div>
                        <div className="truncate text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>{wt.labelVi}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </SetupSection>

            {/* 4 · Word count */}
            <SetupSection n={4} label={t('stepWordCount')}>
              <div className="flex flex-wrap gap-2">
                {suggestions?.wordCountSuggestions.map((wc, idx) => {
                  const on = wordCountIdx === idx;
                  return (
                    <button key={idx} onClick={() => setWordCountIdx(idx)}
                      className="mono rounded-md border-[1.5px] px-4 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5"
                      style={on
                        ? { background: 'color-mix(in srgb, var(--accent) 14%, transparent)', borderColor: 'var(--accent)', color: 'var(--accent)' }
                        : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                      {wc.label}
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
                  <span className="text-base">{currentTypeObj?.icon ?? '✍️'}</span>
                  <span className="mono rounded-[5px] px-2 py-0.5 text-[10.5px] font-bold" style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)' }}>{level}</span>
                  <span className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>{currentTypeObj?.labelDe ?? ''}</span>
                </div>
                <div className="text-lead font-bold" style={{ color: topicLabel ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)' }}>
                  {topicLabel ? t('previewTitle', { topic: topicLabel }) : t('previewPlaceholder')}
                </div>
                {wordCount && <div className="mt-1 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{wordCount.label}</div>}
              </div>
              <div className="flex flex-col gap-2.5 p-4">
                {[96, 88, 92, 64].map((w, i) => (
                  <div key={i} className={`h-2 rounded ${ready ? 'animate-pulse' : ''}`}
                    style={{ width: `${w}%`, background: 'var(--theme-bg-secondary)', opacity: ready ? 1 : 0.5 }} />
                ))}
                <div className="mt-2 rounded-md border border-dashed p-3" style={{ borderColor: 'var(--theme-border)' }}>
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>{t('previewAnswerHint')}</div>
                  <div className="flex flex-col gap-1.5">
                    <div className="h-1.75 w-full rounded" style={{ background: 'var(--theme-bg-secondary)' }} />
                    <div className="h-1.75 w-11/12 rounded" style={{ background: 'var(--theme-bg-secondary)' }} />
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleGenerate} disabled={!ready || generateMutation.isPending}
              className={`flex h-13 items-center justify-center gap-2.5 rounded-[13px] text-[15px] font-bold transition-transform ${ready && !generateMutation.isPending ? 'hover:-translate-y-0.5 active:scale-95' : 'cursor-not-allowed'}`}
              style={ready
                ? { background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 6px 18px color-mix(in srgb, var(--accent) 40%, transparent)' }
                : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
              {generateMutation.isPending ? <><IconLoader size={17} /> {t('generating')}</> : <><IconSparkles size={17} /> {t('generate')}</>}
            </button>
            {!ready && <div className="-mt-1 text-center text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>{t('chooseTopicHint')}</div>}
            {generateMutation.isError && <p className="text-center text-caption" style={{ color: 'var(--danger)' }}>{t('generateError')}</p>}
          </div>
        </div>
        </>
        )}
      </div>
    </QuotaPaywall>
  );
}
