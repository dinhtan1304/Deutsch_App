'use client';

import { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  IconPenLine, IconHeadphones, IconBookOpen, IconMic,
  IconArrowRight, IconZap, IconGraduationCap, IconTarget,
} from '@/components/ui/Icons';
import { ACCENT, GRADIENT, type AccentKey } from '@/lib/tokens';
import { AppPageShell, SectionHeader, SurfaceCard } from '@/components/ui';
import { ChooseExam } from './_sections/ChooseExam';

type SkillKey = 'reading' | 'listening' | 'writing' | 'speaking';
type AiKey = 'roleplay' | 'pronunciation' | 'dictation';

type PracticeCard = {
  i18nKey: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: AccentKey;
};

const skillCards: { key: SkillKey; href: string; icon: PracticeCard['icon']; accent: AccentKey }[] = [
  { key: 'reading',   href: '/practice-test/reading',   icon: IconBookOpen,  accent: 'reading' },
  { key: 'listening', href: '/practice-test/listening', icon: IconHeadphones, accent: 'listening' },
  { key: 'writing',   href: '/practice-test/writing',   icon: IconPenLine,    accent: 'writing' },
  { key: 'speaking',  href: '/practice-test/speaking',  icon: IconMic,        accent: 'speaking' },
];

const aiCards: { key: AiKey; href: string; icon: PracticeCard['icon']; accent: AccentKey }[] = [
  { key: 'roleplay',      href: '/practice-test/roleplay',      icon: IconZap,        accent: 'examWriting' },
  { key: 'pronunciation', href: '/practice-test/pronunciation', icon: IconMic,        accent: 'listening' },
  { key: 'dictation',     href: '/practice-test/dictation',     icon: IconHeadphones, accent: 'dictation' },
];

const quickStarts: { key: 'skill' | 'exam' | 'ai'; href: string; icon: ReactNode; accent: AccentKey }[] = [
  { key: 'skill', href: '#practice-skills', icon: <IconTarget size={18} />,        accent: 'writing' },
  { key: 'exam',  href: '#exam-practice',   icon: <IconGraduationCap size={18} />, accent: 'xp' },
  { key: 'ai',    href: '#ai-support',      icon: <IconMic size={18} />,           accent: 'listening' },
];

function iconGradient(accent: AccentKey) {
  const map: Partial<Record<AccentKey, string>> = {
    brand: GRADIENT.brand,
    reading: GRADIENT.reading,
    listening: GRADIENT.listening,
    writing: GRADIENT.writing,
    speaking: GRADIENT.speaking,
    examWriting: GRADIENT.examWriting,
    dictation: GRADIENT.dictation,
    xp: GRADIENT.xp,
  };
  return map[accent] ?? GRADIENT.brand;
}

function QuickStartCard({ item }: { item: typeof quickStarts[number] }) {
  const t = useTranslations('practice.landing.quickStart');
  const title = t(`${item.key}.title` as 'skill.title');
  const subtitle = t(`${item.key}.subtitle` as 'skill.subtitle');
  return (
    <a href={item.href} className="block">
      <SurfaceCard variant="interactive" accent={item.accent} className="h-full">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: iconGradient(item.accent) }}
          >
            {item.icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {title}
            </h3>
            <p className="mt-0.5 text-caption leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
              {subtitle}
            </p>
          </div>
        </div>
      </SurfaceCard>
    </a>
  );
}

function PracticeActionCard({
  card,
  titleDe,
  title,
  description,
  locked,
  onLockedClick,
}: {
  card: { href: string; icon: PracticeCard['icon']; accent: AccentKey };
  titleDe: string;
  title: string;
  description: string;
  locked?: boolean;
  onLockedClick?: () => void;
}) {
  const t = useTranslations('practice.landing.cta');
  const Icon = card.icon;
  const accentColor = ACCENT[card.accent];
  const body = (
    <SurfaceCard
      variant={locked ? 'locked' : 'interactive'}
      accent={card.accent}
      className="relative flex h-full flex-col"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-soft"
          style={{ background: iconGradient(card.accent) }}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-caption font-bold" style={{ color: accentColor }}>
            {titleDe}
          </p>
          <h3 className="mt-0.5 text-h3 font-extrabold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>
            {title}
          </h3>
        </div>
      </div>
      <p className="mt-4 flex-1 text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
        {description}
      </p>
      <div className="mt-5 inline-flex items-center gap-2 text-body font-bold" style={{ color: accentColor }}>
        {locked ? t('viewPremium') : t('start')} <IconArrowRight size={16} />
      </div>
    </SurfaceCard>
  );

  if (locked) {
    return (
      <button type="button" onClick={onLockedClick} className="h-full w-full text-left">
        {body}
      </button>
    );
  }

  return (
    <Link href={card.href} className="block h-full">
      {body}
    </Link>
  );
}

function SkillCardGrid({ locked, onLockedClick }: { locked?: boolean; onLockedClick?: () => void }) {
  const t = useTranslations('practice.landing.skills');
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {skillCards.map((card) => (
        <PracticeActionCard
          key={card.href}
          card={card}
          titleDe={t(`${card.key}.titleDe` as 'reading.titleDe')}
          title={t(`${card.key}.title` as 'reading.title')}
          description={t(`${card.key}.description` as 'reading.description')}
          locked={locked}
          onLockedClick={onLockedClick}
        />
      ))}
    </div>
  );
}

function AiCardGrid() {
  const t = useTranslations('practice.landing.ai');
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {aiCards.map((card) => (
        <PracticeActionCard
          key={card.href}
          card={card}
          titleDe={t(`${card.key}.titleDe` as 'roleplay.titleDe')}
          title={t(`${card.key}.title` as 'roleplay.title')}
          description={t(`${card.key}.description` as 'roleplay.description')}
        />
      ))}
    </div>
  );
}

function Section({
  id,
  title,
  subtitle,
  icon,
  accent,
  badge,
  extraBadge,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  accent: AccentKey;
  badge?: string;
  extraBadge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <SectionHeader title={title} subtitle={subtitle} icon={icon} accent={accent} badge={badge} extraBadge={extraBadge} />
      {children}
    </section>
  );
}

export default function PracticeTestPage() {
  const t = useTranslations('practice.landing');

  return (
    <AppPageShell
      title={t('title')}
      subtitle={t('subtitle')}
      icon={<IconGraduationCap size={22} />}
      accent="writing"
      maxWidth="wide"
    >
      <div className="space-y-10">
        <section>
          <SectionHeader
            title={t('quickStart.title')}
            subtitle={t('quickStart.subtitle')}
            icon={<IconZap size={18} />}
            accent="writing"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {quickStarts.map((item) => <QuickStartCard key={item.href} item={item} />)}
          </div>
        </section>

        <Section
          id="practice-skills"
          title={t('skills.title')}
          subtitle={t('skills.subtitle')}
          icon={<IconTarget size={18} />}
          accent="reading"
        >
          <SkillCardGrid />
        </Section>

        <Section
          id="ai-support"
          title={t('ai.title')}
          subtitle={t('ai.subtitle')}
          icon={<IconMic size={18} />}
          accent="listening"
        >
          <AiCardGrid />
        </Section>

        <Section
          id="exam-practice"
          title={t('exam.title')}
          subtitle={t('exam.subtitleUnlocked')}
          icon={<IconGraduationCap size={18} />}
          accent="xp"
          badge={t('exam.badge')}
        >
          <ChooseExam />
          <Link href="/practice-test/huong-dan-b1" className="block">
            <SurfaceCard variant="interactive" accent="examWriting">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[11px] text-white" style={{ background: GRADIENT.examWriting }}>
                    <IconBookOpen size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-h3 font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                      {t('guideB1Card.title')}
                    </h3>
                    <p className="mt-1 text-body leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                      {t('guideB1Card.description')}
                    </p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[11px] px-5 py-3 text-body font-bold text-white" style={{ background: GRADIENT.examWriting }}>
                  {t('guideB1Card.cta')} <IconArrowRight size={16} />
                </span>
              </div>
            </SurfaceCard>
          </Link>
        </Section>
      </div>
    </AppPageShell>
  );
}
