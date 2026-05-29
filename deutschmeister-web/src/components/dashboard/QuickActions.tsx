'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ACCENT, GRADIENT } from '@/lib/tokens';
import {
  IconLayers, IconBook,
  IconBrain, IconArrowRight, IconZap, IconGraduationCap, IconRotateCcw,
} from '@/components/ui/Icons';

interface QuickActionsProps {
  wordsToReview: number;
}

// Visual config; label + description come from dashboard.quickActions.actions.<key>.
type ActionKey = 'topics' | 'dictionary' | 'practice' | 'srs';
const actions: Array<{ key: ActionKey; icon: typeof IconLayers; href: string; gradient: string; iconBg: string; accent: string }> = [
  { key: 'topics',     icon: IconLayers,          href: '/topics',         gradient: GRADIENT.vocabBg,     iconBg: GRADIENT.vocab,         accent: ACCENT.vocab },
  { key: 'dictionary', icon: IconBook,            href: '/words',          gradient: GRADIENT.xpBg,        iconBg: GRADIENT.xpLight,       accent: ACCENT.xp },
  { key: 'practice',   icon: IconGraduationCap,   href: '/practice-test',  gradient: GRADIENT.listeningBg, iconBg: GRADIENT.pronunciation, accent: ACCENT.listening },
  { key: 'srs',        icon: IconRotateCcw,       href: '/srs',            gradient: GRADIENT.cyanBg,      iconBg: GRADIENT.cyanSky,       accent: ACCENT.cyan },
];

export function QuickActions({ wordsToReview }: QuickActionsProps) {
  const t = useTranslations('dashboard.quickActions');
  return (
    <div
      className="p-5 rounded-card border shadow-card flex flex-col h-full"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: GRADIENT.xpBright }}>
          <IconZap size={15} className="text-white" />
        </div>
        <h3 className="text-title font-bold m-0" style={{ color: 'var(--theme-text-primary)' }}>
          {t('title')}
        </h3>
      </div>

      {/* Review reminder */}
      {wordsToReview > 0 && (
        <Link
          href="/srs"
          className="group flex items-center gap-3 p-4 rounded-xl mb-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
          style={{ background: GRADIENT.xpReverse }}
        >
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0
            transition-transform duration-300 group-hover:scale-110">
            <IconBrain size={22} className="text-white" />
          </div>
          <div className="flex-1 text-white min-w-0">
            <div className="font-bold text-[15px] truncate">{t('reviewNow')}</div>
            <div className="text-[12.5px] opacity-85 truncate">
              {t('reviewCount', { count: wordsToReview })}
            </div>
          </div>
          <IconArrowRight size={20} className="text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 shrink-0" />
        </Link>
      )}

      {/* Action grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 mt-auto">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.key}
              href={action.href}
              className="group flex items-center gap-3 p-3 rounded-xl
                transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md border border-transparent hover:border-black/5 dark:hover:border-white/5"
              style={{ background: action.gradient }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                  shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                style={{ background: action.iconBg }}
              >
                <Icon size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-body font-semibold truncate" style={{ color: action.accent }}>
                  {t(`actions.${action.key}.label` as 'actions.topics.label')}
                </div>
                <div className="text-[11px] leading-tight opacity-80" style={{ color: 'var(--theme-text-muted)' }}>
                  {t(`actions.${action.key}.description` as 'actions.topics.description')}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}