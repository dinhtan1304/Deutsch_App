'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useGenerateListening } from '@/hooks/useListening';
import { QuotaPaywall } from '@/components/subscription/QuotaPaywall';
import { QuotaBanner } from '@/components/subscription/QuotaBanner';
import { PageHeader } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

function IconLoader({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}

const LEVEL_IDS = ['A1', 'A2', 'B1'] as const;
const SCRIPT_TYPE_IDS = ['dialogue', 'monologue', 'announcement', 'interview', 'radio'] as const;
const SCRIPT_TYPE_EMOJIS: Record<typeof SCRIPT_TYPE_IDS[number], string> = {
  dialogue: '💬',
  monologue: '🎙️',
  announcement: '📢',
  interview: '🎤',
  radio: '📻',
};

export default function NewListeningPage() {
  const router = useRouter();
  const t = useTranslations('practice.listening.setup');
  const generateMut = useGenerateListening();
  const [level, setLevel] = useState<typeof LEVEL_IDS[number]>('A2');
  const [scriptType, setScriptType] = useState<typeof SCRIPT_TYPE_IDS[number]>('dialogue');
  const [error, setError] = useState('');
  const loading = generateMut.isPending;

  const handleGenerate = async () => {
    setError('');
    try {
      const session = await generateMut.mutateAsync({ cefrLevel: level, scriptType });
      router.push(`/practice-test/listening/${session.id}`);
    } catch {
      setError(t('generateError'));
    }
  };

  return (
    <QuotaPaywall feature="listening">
    <div className="py-6 max-w-lg mx-auto">
      <QuotaBanner feature="listening" label={t('quotaLabel')} featureContext="listening-new" />

      <PageHeader
        backHref="/practice-test/listening"
        title={t('title')}
        subtitle={t('subtitle')}
        accent="listening"
      />

      <div className="rounded-2xl border p-5 mb-4" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <p className="text-body font-bold mb-3 uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>{t('stepLevel')}</p>
        <div className="grid grid-cols-3 gap-2">
          {LEVEL_IDS.map(l => {
            const sel = level === l;
            return (
              <button key={l} onClick={() => setLevel(l)}
                className="p-3 rounded-xl border-2 text-left transition-all"
                style={sel
                  ? { borderColor: ACCENT.listening, backgroundColor: `${ACCENT.listening}14` }
                  : { borderColor: 'var(--theme-border)', backgroundColor: 'transparent' }}>
                <p className="text-[15px] font-extrabold mb-0.5" style={{ color: sel ? ACCENT.listening : 'var(--theme-text-primary)' }}>{l}</p>
                <p className="text-caption leading-tight" style={{ color: 'var(--theme-text-muted)' }}>{t(`levels.${l}` as 'levels.A1')}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border p-5 mb-5" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <p className="text-body font-bold mb-3 uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>{t('stepScriptType')}</p>
        <div className="space-y-2">
          {SCRIPT_TYPE_IDS.map(st => {
            const sel = scriptType === st;
            return (
              <button key={st} onClick={() => setScriptType(st)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all"
                style={sel
                  ? { borderColor: ACCENT.listening, backgroundColor: `${ACCENT.listening}14` }
                  : { borderColor: 'var(--theme-border)', backgroundColor: 'transparent' }}>
                <span className="text-title">{SCRIPT_TYPE_EMOJIS[st]}</span>
                <div>
                  <p className="text-body font-bold" style={{ color: sel ? ACCENT.listening : 'var(--theme-text-primary)' }}>{t(`scriptTypes.${st}.label` as 'scriptTypes.dialogue.label')}</p>
                  <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t(`scriptTypes.${st}.desc` as 'scriptTypes.dialogue.desc')}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-body mb-3 text-center" style={{ color: STATUS.danger }}>{error}</p>}

      <button onClick={handleGenerate} disabled={loading}
        className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:scale-100"
        style={{ background: GRADIENT.listening }}>
        {loading ? <><IconLoader size={18} /> {t('generating')}</> : t('generate')}
      </button>
    </div>
    </QuotaPaywall>
  );
}
