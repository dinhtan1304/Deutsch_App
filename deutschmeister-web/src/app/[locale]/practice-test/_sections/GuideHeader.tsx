import { useTranslations } from 'next-intl';
import { IconBookOpen, IconGraduationCap, IconRocket, IconList, IconLightbulb } from '@/components/ui/Icons';
import { GRADIENT } from '@/lib/tokens';

const ANCHORS = [
  { href: '#chon-chung-chi', key: 'navChooseExam', icon: IconGraduationCap },
  { href: '#cau-truc-de', key: 'navStructure', icon: IconBookOpen },
  { href: '#lo-trinh', key: 'navRoadmap', icon: IconRocket },
  { href: '#cam-nang', key: 'navSkills', icon: IconLightbulb },
  { href: '#faq', key: 'navFaq', icon: IconList },
] as const;

export function GuideHeader() {
  const t = useTranslations('practice.guideB1.header');
  return (
    <section id="huong-dan-b1" className="mt-16 mb-8 scroll-mt-20">
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: GRADIENT.examWriting }}
        >
          <IconBookOpen size={24} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {t('title')}
          </h2>
          <p className="text-body mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            {t('subtitle')}
          </p>
        </div>
      </div>

      <nav aria-label={t('navAria')} className="flex flex-wrap gap-2">
        {ANCHORS.map(({ href, key, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-body font-semibold transition-colors hover:opacity-90"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              color: 'var(--theme-text-secondary)',
              border: '1px solid var(--theme-border)',
            }}
          >
            <Icon size={14} />
            {t(key)}
          </a>
        ))}
      </nav>
    </section>
  );
}
