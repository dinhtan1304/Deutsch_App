'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, Button } from '@/components/ui';
import { ACCENT, GRADIENT } from '@/lib/tokens';

const RULE_ICONS = ['🤝', '🛡️', '🚫', '🎙️', '🏷️', '🐞', '⚠️', '🔒'] as const;

export default function CommunityRulesPage() {
  const t = useTranslations('vocabulary.community');
  const rules = RULE_ICONS.map((icon, i) => ({
    icon,
    title: t(`rule${i + 1}Title` as 'rule1Title'),
    body: t(`rule${i + 1}Body` as 'rule1Body'),
  }));
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div
        className="rounded-2xl p-6 sm:p-8 mb-6 text-white shadow-lifted"
        style={{ background: GRADIENT.vocab }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            📜
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              {t('rulesTitle')}
            </h1>
            <p className="text-body mt-1 opacity-90">
              {t('rulesSubtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {rules.map((r, i) => (
          <Card key={i}>
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: 'rgba(139,92,246,.12)' }}
              >
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="font-semibold mb-1"
                  style={{ color: 'var(--theme-text-primary)' }}
                >
                  {i + 1}. {r.title}
                </div>
                <div
                  className="text-body"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  {r.body}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div
        className="rounded-xl p-4 mb-6"
        style={{
          background: 'rgba(59,130,246,.08)',
          border: '1px solid rgba(59,130,246,.25)',
        }}
      >
        <div
          className="text-caption font-semibold mb-1"
          style={{ color: ACCENT.srs }}
        >
          {t('rulesBetaTitle')}
        </div>
        <div
          className="text-body"
          style={{ color: 'var(--theme-text-secondary)' }}
        >
          {t('rulesBetaBody')}
        </div>
      </div>

      <div
        className="text-caption text-center"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        {t('rulesUpdated')}
      </div>

      <div className="flex flex-wrap gap-3 justify-center mt-6">
        <Link href="/arena">
          <Button variant="primary" style={{ background: GRADIENT.vocab }}>
            {t('rulesEnterArena')}
          </Button>
        </Link>
        <Link href="/practice-test/speaking-rooms">
          <Button variant="outline">{t('rulesEnterSpeaking')}</Button>
        </Link>
      </div>
    </div>
  );
}
