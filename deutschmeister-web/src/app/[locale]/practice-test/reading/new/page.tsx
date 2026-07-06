'use client';

import { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useReadingTopics, useGenerateReading } from '@/hooks/useReading';
import { useGenerateExamReading } from '@/hooks/useExamReading';
import { EXAM_READING_DISPLAY } from '@/lib/examConfig';
import { QuotaPaywall } from '@/components/subscription/QuotaPaywall';
import { QuotaBanner } from '@/components/subscription/QuotaBanner';
import { SetupSection, PromptToken } from '../../_components/createSetup';
import { TeilPracticeSetup, useTeilPresetFromQuery } from '../../_components/TeilPracticeSetup';
import { IconSparkles, IconChevronLeft, IconLoader, IconCheck } from '../icons';

type LengthId = 'short' | 'medium' | 'long';

const LEVELS = [
  { id: 'A1', descKey: 'levelDescA1' },
  { id: 'A2', descKey: 'levelDescA2' },
  { id: 'B1', descKey: 'levelDescB1' },
  { id: 'B2', descKey: 'levelDescB2' },
] as const;

const LENGTHS: { id: LengthId; words: number; mins: number; labelKey: string }[] = [
  { id: 'short', words: 150, mins: 1, labelKey: 'lengthShort' },
  { id: 'medium', words: 350, mins: 2, labelKey: 'lengthMedium' },
  { id: 'long', words: 600, mins: 4, labelKey: 'lengthLong' },
];

const QUESTION_COUNTS = [3, 4, 5, 6, 7, 8];

function IconEdit({ size = 15, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export default function NewReadingPage() {
  const t = useTranslations('practice.reading.setup');
  const tType = useTranslations('practice.reading.list');
  const tHub = useTranslations('practice.common.hub');
  const tCommon = useTranslations('practice.examCommon.setup');
  const router = useRouter();

  const teilPreset = useTeilPresetFromQuery();
  const [mode, setMode] = useState<'topic' | 'teil'>(teilPreset.presetMode ?? 'topic');
  const examGenMut = useGenerateExamReading();

  const [level, setLevel] = useState('A2');
  const [length, setLength] = useState<LengthId>('medium');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [textType, setTextType] = useState('');
  const [questionCount, setQuestionCount] = useState(5);

  const { data: suggestions, isLoading } = useReadingTopics(level);
  const generateMutation = useGenerateReading();

  const effectiveTextType = textType || suggestions?.textTypes[0]?.value || '';
  const currentTypeObj = suggestions?.textTypes.find((tt) => tt.value === effectiveTextType);
  const selectedTopicObj = suggestions?.topics.find((tp) => tp.topic === selectedTopic);
  const topicLabel = customTopic.trim() || selectedTopicObj?.labelDe || '';
  const lenObj = LENGTHS.find((l) => l.id === length)!;
  const lengthLabel = t(lenObj.labelKey as 'lengthMedium');
  const typeShort = effectiveTextType ? tType(`textTypes.${effectiveTextType}` as 'textTypes.brief') : '';
  const finalTopic = customTopic.trim() || selectedTopic;
  const ready = !!finalTopic && !!effectiveTextType;

  const handleGenerate = async () => {
    if (!ready || generateMutation.isPending) return;
    try {
      const session = await generateMutation.mutateAsync({
        cefrLevel: level,
        topic: finalTopic,
        textType: effectiveTextType,
        questionCount,
        length,
      });
      router.push(`/practice-test/reading/${session.id}`);
    } catch { /* handled below via isError */ }
  };

  return (
    <QuotaPaywall feature="reading">
      <div className="mx-auto max-w-360 px-4 py-6 sm:px-6">
        <QuotaBanner feature="reading" label={t('quotaLabel')} featureContext="reading-new" />

        {/* Back */}
        <Link href="/practice-test/reading" className="mb-4 inline-flex items-center gap-1 text-caption font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
          <IconChevronLeft size={16} /> {tHub('back')}
        </Link>

        {/* Hero */}
        <header className="mb-5 flex items-center gap-3.5">
          <div className="v2-icongrad-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px]"
            style={{ color: 'var(--accent-on)', boxShadow: '0 8px 20px color-mix(in srgb, var(--accent) 35%, transparent)' }}>
            <IconSparkles size={24} />
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
            displayMap={EXAM_READING_DISPLAY}
            isPending={examGenMut.isPending}
            onGenerate={(d) => examGenMut.mutateAsync(d)}
            answerHref={(id) => `/practice-test/reading/exam/${id}`}
            initial={teilPreset.initial}
            skill="reading"
          />
        ) : (
        <>
        {/* Live prompt sentence */}
        <div className="v2-hero-accent mb-6 rounded-2xl px-5 py-4 text-[15px] leading-loose"
          style={{ border: '1px solid color-mix(in srgb, var(--accent) 28%, transparent)', color: 'var(--theme-text-secondary)' }}>
          {t('promptWrite')} <PromptToken on color="var(--der)" label={typeShort || '…'} /> ·{' '}
          {t('promptLevel')} <PromptToken on mono color="var(--accent)" label={level} /> ·{' '}
          {t('promptLength')} <PromptToken on color="var(--violet)" label={lengthLabel} /> ·{' '}
          {t('promptTopic')} <PromptToken on={!!topicLabel} color="var(--warn)" label={topicLabel || t('notSelected')} /> ·{' '}
          {t('promptWith')} <PromptToken on mono color="var(--cyan)" label={t('questionsShort', { count: questionCount })} />.
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
                    <button key={l.id} onClick={() => { setLevel(l.id); setSelectedTopic(''); setCustomTopic(''); setTextType(''); }}
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

            {/* 2 · Length */}
            <SetupSection n={2} label={t('stepLength')}>
              <div className="grid grid-cols-3 gap-2">
                {LENGTHS.map((l) => {
                  const on = length === l.id;
                  return (
                    <button key={l.id} onClick={() => setLength(l.id)}
                      className="flex items-center justify-between rounded-md border px-3.5 py-3 transition-transform hover:-translate-y-0.5"
                      style={on
                        ? { background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderColor: 'var(--accent)' }
                        : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                      <span className="text-[13.5px] font-bold" style={{ color: on ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)' }}>{t(l.labelKey as 'lengthMedium')}</span>
                      <span className="mono text-[11px]" style={{ color: on ? 'var(--accent)' : 'var(--theme-text-muted)' }}>{t('wordsApprox', { count: l.words })}</span>
                    </button>
                  );
                })}
              </div>
            </SetupSection>

            {/* 3 · Topic */}
            <SetupSection n={3} label={t('stepTopic')}>
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
                    <IconEdit size={15} style={{ color: customTopic.trim() ? 'var(--accent)' : 'var(--theme-text-muted)' }} />
                    <input value={customTopic} onChange={(e) => { setCustomTopic(e.target.value); if (e.target.value.trim()) setSelectedTopic(''); }}
                      placeholder={t('customTopicPlaceholder')}
                      className="h-full flex-1 border-0 bg-transparent text-[13.5px] outline-none" style={{ color: 'var(--theme-text-primary)' }} />
                  </div>
                </>
              )}
            </SetupSection>

            {/* 4 · Text type */}
            <SetupSection n={4} label={t('stepTextType')}>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {suggestions?.textTypes.map((tt) => {
                  const on = effectiveTextType === tt.value;
                  return (
                    <button key={tt.value} onClick={() => setTextType(tt.value)}
                      className="flex items-center gap-2.5 rounded-[11px] border p-3 text-left transition-transform hover:-translate-y-0.5"
                      style={on
                        ? { background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderColor: 'var(--accent)' }
                        : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                      <span className="shrink-0 text-lg">{tt.icon}</span>
                      <div className="min-w-0">
                        <div className="truncate text-caption font-bold" style={{ color: 'var(--theme-text-primary)' }}>{tt.labelDe}</div>
                        <div className="truncate text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>{tType(`textTypes.${tt.value}` as 'textTypes.brief')}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </SetupSection>

            {/* 5 · Question count */}
            <SetupSection n={5} label={t('stepQuestionCount')}>
              <div className="flex flex-wrap gap-2">
                {QUESTION_COUNTS.map((n) => {
                  const on = questionCount === n;
                  return (
                    <button key={n} onClick={() => setQuestionCount(n)}
                      className="mono h-12 w-12 rounded-md border-[1.5px] text-[15px] font-bold transition-transform hover:-translate-y-0.5"
                      style={on
                        ? { background: 'color-mix(in srgb, var(--accent) 14%, transparent)', borderColor: 'var(--accent)', color: 'var(--accent)' }
                        : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                      {n}
                    </button>
                  );
                })}
              </div>
            </SetupSection>
          </div>

          {/* ── Preview column (sticky on desktop) ── */}
          <div className="flex flex-col gap-3.5 lg:sticky lg:top-6">
            <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{t('previewLabel')}</div>

            {/* Document mockup */}
            <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', boxShadow: 'var(--v2-shadow-card-hover)' }}>
              <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--theme-border)', background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="text-base">{currentTypeObj?.icon ?? '📄'}</span>
                  <span className="mono rounded-[5px] px-2 py-0.5 text-[10.5px] font-bold" style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)' }}>{level}</span>
                  <span className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>{typeShort}</span>
                </div>
                <div className="text-[15px] font-bold" style={{ color: topicLabel ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)' }}>
                  {topicLabel ? t('previewTitle', { topic: topicLabel }) : t('previewPlaceholder')}
                </div>
                <div className="mt-1 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                  {t('wordsApprox', { count: lenObj.words })} · {t('readingTime', { count: lenObj.mins })} · {t('questionsShort', { count: questionCount })}
                </div>
              </div>
              <div className="flex flex-col gap-2.5 p-4">
                {[100, 92, 96, 70, 88, 60].map((w, i) => (
                  <div key={i} className={`h-2 rounded ${ready ? 'animate-pulse' : ''}`}
                    style={{ width: `${w}%`, background: 'var(--theme-bg-secondary)', opacity: ready ? 1 : 0.5 }} />
                ))}
                <div className="mt-2 flex items-start gap-2 border-t pt-3" style={{ borderColor: 'var(--theme-border)' }}>
                  <span className="mono flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px] text-[10px] font-bold" style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)', color: 'var(--accent)' }}>1</span>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="h-1.75 w-4/5 rounded" style={{ background: 'var(--theme-bg-secondary)' }} />
                    <div className="grid grid-cols-2 gap-1.5">
                      {[0, 1, 2, 3].map((i) => <div key={i} className="h-4.5 rounded-md border" style={{ background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)' }} />)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Generate */}
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
