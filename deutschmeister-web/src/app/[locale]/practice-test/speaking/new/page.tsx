'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useGenerateFreeSpeaking } from '@/hooks/useFreeSpeaking';
import { QuotaPaywall } from '@/components/subscription/QuotaPaywall';
import { QuotaBanner } from '@/components/subscription/QuotaBanner';
import { PageHeader } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

function IconLoader({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}

const LEVELS = ['A1', 'A2', 'B1'];

const TOPIC_KEYS = [
  'sich_vorstellen',
  'alltag',
  'wohnen',
  'arbeit',
  'familie',
  'reisen',
  'einkaufen',
  'gesundheit',
  'meinung',
] as const;

export default function FreeSpeakingNewPage() {
  const router = useRouter();
  const t = useTranslations('practice.speaking.setup');
  const [cefrLevel, setCefrLevel] = useState('B1');
  const [topicType, setTopicType] = useState<typeof TOPIC_KEYS[number]>('sich_vorstellen');
  const [errorMsg, setErrorMsg] = useState('');

  const generateMut = useGenerateFreeSpeaking();

  const handleGenerate = async () => {
    setErrorMsg('');
    try {
      const session = await generateMut.mutateAsync({ cefrLevel, topicType });
      router.push(`/practice-test/speaking/${session.id}`);
    } catch {
      setErrorMsg(t('generateError'));
    }
  };

  return (
    <QuotaPaywall feature="freeSpeaking">
    <div className="py-6">
      <QuotaBanner feature="freeSpeaking" label={t('quotaLabel')} featureContext="speaking-new" />

      <PageHeader
        backHref="/practice-test/speaking"
        title={t('title')}
        subtitle={t('subtitle')}
        accent="xp"
      />

      {/* Step 1: Level */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          {t('stepLevel')}
        </p>
        <div className="flex gap-2">
          {LEVELS.map(lvl => (
            <button key={lvl} onClick={() => setCefrLevel(lvl)}
              className="flex-1 py-3 rounded-2xl border-2 font-bold text-[15px] transition-all"
              style={cefrLevel === lvl
                ? { borderColor: ACCENT.xp, backgroundColor: `${ACCENT.xp}1A`, color: ACCENT.xp }
                : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)', backgroundColor: 'transparent' }}>
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Topic */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          {t('stepTopic')}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TOPIC_KEYS.map(key => (
            <button key={key} onClick={() => setTopicType(key)}
              className="p-3 rounded-xl border-2 text-left transition-all"
              style={topicType === key
                ? { borderColor: ACCENT.xp, backgroundColor: `${ACCENT.xp}14` }
                : { borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
              <p className="text-body font-bold" style={{ color: topicType === key ? ACCENT.xp : 'var(--theme-text-primary)' }}>
                {t(`topics.${key}.de` as 'topics.sich_vorstellen.de')}
              </p>
              <p className="text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                {t(`topics.${key}.vi` as 'topics.sich_vorstellen.vi')}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Info note */}
      <div className="rounded-xl p-3 mb-5 text-xs"
        style={{ backgroundColor: `${ACCENT.xp}0F`, borderLeft: `3px solid ${ACCENT.xp}66`, color: 'var(--theme-text-muted)' }}>
        {t('info')}
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl text-body mb-4" style={{ backgroundColor: `${STATUS.danger}14`, color: STATUS.danger }}>
          {errorMsg}
        </div>
      )}

      <button onClick={handleGenerate}
        disabled={generateMut.isPending}
        className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        style={{ background: GRADIENT.speaking, boxShadow: `0 4px 12px ${ACCENT.xp}4D` }}>
        {generateMut.isPending ? (
          <><IconLoader size={18} /> {t('generating')}</>
        ) : (
          t('generate')
        )}
      </button>
    </div>
    </QuotaPaywall>
  );
}
