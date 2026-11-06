'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Card } from '@/components/ui';
import { IconLock, IconSparkles } from '@/components/ui/Icons';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { useModelAnswer } from '@/hooks/useWriting';
import { useExamModelAnswer } from '@/hooks/useExamWriting';
import { useHasExamAccess } from '@/hooks/useSubscription';
import { ACCENT } from '@/lib/tokens';

interface Props {
  sessionId: string;
  /** Set for exam writing (one model answer per Teil); omit for free practice. */
  teil?: number;
  className?: string;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Musterlösung for a graded writing task. Collapsed by default and only asks
 * the API (one AI generation per task, then cached) when the learner opens it.
 * Same Premium gate as the server (premium / lifetime / exam bundle).
 */
export function ModelAnswerPanel({ sessionId, teil, className }: Props) {
  const t = useTranslations('practice.modelAnswer');
  const hasAccess = useHasExamAccess();
  const [open, setOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const isExam = teil !== undefined;
  const practice = useModelAnswer(sessionId, open && hasAccess && !isExam);
  const exam = useExamModelAnswer(sessionId, teil ?? 0, open && hasAccess && isExam);
  const { data, isFetching, isError } = isExam ? exam : practice;

  // Highlight the reusable phrases inside the text (longest first so a short
  // phrase never splits a longer one).
  const parts = useMemo(() => {
    if (!data?.text) return [];
    const phrases = [...data.keyPhrases].filter(Boolean).sort((a, b) => b.length - a.length);
    if (phrases.length === 0) return [{ text: data.text, key: false }];
    const re = new RegExp(`(${phrases.map(escapeRegExp).join('|')})`, 'g');
    return data.text.split(re).filter(Boolean).map((text) => ({ text, key: phrases.includes(text) }));
  }, [data]);

  return (
    <Card variant="bordered" className={`p-4 ${className ?? ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconSparkles size={16} style={{ color: ACCENT.writing }} />
          <h3 className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
            {t('title')}
          </h3>
        </div>
        {!hasAccess ? (
          <Button size="sm" variant="outline" onClick={() => setUpgradeOpen(true)}>
            <IconLock size={14} /> {t('premiumOnly')}
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
            {open ? t('hide') : t('show')}
          </Button>
        )}
      </div>

      {open && hasAccess && (
        <div className="mt-4">
          {isFetching && !data && (
            <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>{t('loading')}</p>
          )}
          {isError && !data && (
            <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>{t('error')}</p>
          )}
          {data && (
            <>
              <p className="text-body leading-relaxed whitespace-pre-line" style={{ color: 'var(--theme-text-primary)' }}>
                {parts.map((part, i) =>
                  part.key ? (
                    <mark key={i} className="rounded-sm px-0.5"
                      style={{ background: `color-mix(in srgb, ${ACCENT.writing} 16%, transparent)`, color: 'inherit' }}>
                      {part.text}
                    </mark>
                  ) : (
                    <span key={i}>{part.text}</span>
                  ),
                )}
              </p>
              <p className="text-caption mt-2" style={{ color: 'var(--theme-text-muted)' }}>
                {t('wordCount', { n: data.wordCount })}
              </p>

              {data.structureNotes.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-caption font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                    {t('structure')}
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {data.structureNotes.map((note, i) => (
                      <li key={i} className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-caption mt-4" style={{ color: 'var(--theme-text-muted)' }}>{t('disclaimer')}</p>
            </>
          )}
        </div>
      )}

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} featureContext={t('title')} />
    </Card>
  );
}
