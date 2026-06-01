'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { IconGamepad, IconBook, IconBookOpen, IconGraduationCap, IconArrowRight } from '@/components/ui/Icons';

const ACTIONS = [
  { href: '/games', labelKey: 'gamesLabel', subKey: 'gamesSub', icon: IconGamepad, color: 'var(--accent)' },
  { href: '/words', labelKey: 'dictLabel', subKey: 'dictSub', icon: IconBook, color: 'var(--success)' },
  { href: '/grammar', labelKey: 'grammarLabel', subKey: 'grammarSub', icon: IconBookOpen, color: 'var(--violet)' },
  { href: '/practice-test', labelKey: 'examLabel', subKey: 'examSub', icon: IconGraduationCap, color: 'var(--streak)' },
] as const;

export function ProfileQuickActions() {
  const t = useTranslations('progress.profile.quickActions');
  return (
    <div className="rounded-lg border p-5"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <h2 className="mb-4 text-h3 font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
        {t('title')}
      </h2>
      <div className="grid grid-cols-2 gap-2.5">
        {ACTIONS.map((qa, i) => {
          const QaIcon = qa.icon;
          return (
            <Link key={i} href={qa.href}
              className="word-card-v2 flex items-center gap-3 rounded-[11px] border p-3.5"
              style={{ ...({ '--card-accent': qa.color } as React.CSSProperties), background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)' }}>
              <span className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-[10px]"
                style={{ background: `color-mix(in srgb, ${qa.color} 16%, transparent)`, color: qa.color }}>
                <QaIcon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>{t(qa.labelKey)}</div>
                <div className="mt-0.5 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{t(qa.subKey)}</div>
              </div>
              <IconArrowRight size={14} style={{ color: 'var(--theme-text-muted)' }} className="shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
