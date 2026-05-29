'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { GRADIENT, ACCENT, STATUS } from '@/lib/tokens';
import { IconGamepad, IconBook, IconBookOpen, IconGraduationCap, IconArrowRight } from '@/components/ui/Icons';

const ACTIONS = [
  { href: '/games', labelKey: 'gamesLabel', subKey: 'gamesSub', icon: IconGamepad, gradient: GRADIENT.action, shadow: `${ACCENT.srs}47` },
  { href: '/words', labelKey: 'dictLabel', subKey: 'dictSub', icon: IconBook, gradient: GRADIENT.reading, shadow: `${STATUS.success}47` },
  { href: '/grammar', labelKey: 'grammarLabel', subKey: 'grammarSub', icon: IconBookOpen, gradient: GRADIENT.history, shadow: `${ACCENT.vocab}47` },
  { href: '/practice-test', labelKey: 'examLabel', subKey: 'examSub', icon: IconGraduationCap, gradient: GRADIENT.speaking, shadow: `${ACCENT.xp}47` },
] as const;

export function ProfileQuickActions() {
  const t = useTranslations('progress.profile.quickActions');
  return (
    <div className="rounded-2xl border p-5"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <h2 className="text-[15px] font-bold mb-4" style={{ color: 'var(--theme-text-primary)' }}>
        {t('title')}
      </h2>
      <div className="grid grid-cols-2 gap-2.5">
        {ACTIONS.map((qa, i) => {
          const QaIcon = qa.icon;
          return (
            <Link key={i} href={qa.href}
              className="flex flex-col gap-2 p-3.5 rounded-xl text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: qa.gradient, boxShadow: `0 4px 12px ${qa.shadow}` }}>
              <QaIcon size={20} style={{ color: 'white' }} />
              <div>
                <div className="text-body font-bold leading-tight">{t(qa.labelKey)}</div>
                <div className="text-caption opacity-75 mt-0.5">{t(qa.subKey)}</div>
              </div>
              <div className="flex justify-end">
                <IconArrowRight size={14} style={{ color: 'white', opacity: 0.6 }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
