'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  IconBookOpen, IconHeadphones, IconPenLine, IconMic, IconLightbulb,
  IconArrowRight, IconClock, IconTarget, IconList,
} from '@/components/ui/Icons';
import { ACCENT } from '@/lib/tokens';
import { examStructureGoethe, examStructureTelc, type SkillDetail, type SkillKey } from '../_data/b1-content';

const SKILL_ICON: Record<SkillKey, React.ComponentType<{ size?: number; className?: string }>> = {
  lesen: IconBookOpen,
  hoeren: IconHeadphones,
  sprachbausteine: IconList,
  schreiben: IconPenLine,
  sprechen: IconMic,
};

const SKILL_COLOR: Record<SkillKey, string> = {
  lesen: ACCENT.reading,
  hoeren: ACCENT.listening,
  sprachbausteine: ACCENT.vocab,
  schreiben: ACCENT.writing,
  sprechen: ACCENT.speaking,
};

export type ExamTab = 'goethe' | 'telc' | 'osd';

const TAB_LABEL: Record<ExamTab, string> = { goethe: 'Goethe B1', telc: 'TELC B1', osd: 'ÖSD B1' };

export function ExamStructure({ initialTab = 'goethe' }: { initialTab?: ExamTab }) {
  const t = useTranslations('practice.guideB1.structure');
  const [tab, setTab] = useState<ExamTab>(initialTab);
  // ÖSD B1 is co-developed with Goethe and shares its structure.
  const skills = tab === 'telc' ? examStructureTelc : examStructureGoethe;

  return (
    <section id="cau-truc-de" className="mb-12 scroll-mt-20">
      <div className="mb-5">
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          {t('title')}
        </h3>
        <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
          {t('subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div
        className="inline-flex rounded-xl p-1 mb-5"
        style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
        role="tablist"
        aria-label={t('tabAria')}
      >
        {(['goethe', 'telc', 'osd'] as ExamTab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-body font-bold transition-all"
            style={{
              background: tab === t ? 'var(--accent)' : 'transparent',
              color: tab === t ? 'var(--accent-on)' : 'var(--theme-text-secondary)',
            }}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {skills.map((skill) => (
          <SkillCard key={`${tab}-${skill.key}`} skill={skill} />
        ))}
      </div>
    </section>
  );
}

function SkillCard({ skill }: { skill: SkillDetail }) {
  const t = useTranslations('practice.guideB1.structure');
  const Icon = SKILL_ICON[skill.key];

  return (
    <details
      className="word-card-v2 group rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        border: '1px solid var(--theme-border)',
        ['--card-accent' as string]: SKILL_COLOR[skill.key],
      } as React.CSSProperties}
    >
      <summary
        className="flex items-center gap-4 p-4 cursor-pointer list-none"
        style={{ color: 'var(--theme-text-primary)' }}
      >
        <div
          className="w-11 h-11 rounded-[11px] flex items-center justify-center shrink-0"
          style={{ background: `color-mix(in srgb, ${SKILL_COLOR[skill.key]} 16%, transparent)`, color: SKILL_COLOR[skill.key] }}
        >
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-h3 font-bold">{skill.title}</span>
            <span className="text-caption font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
              · {skill.titleDe}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1 text-caption" style={{ color: 'var(--theme-text-secondary)' }}>
              <IconClock size={12} /> {skill.duration}
            </span>
            {skill.points && (
              <span className="inline-flex items-center gap-1 text-caption" style={{ color: 'var(--theme-text-secondary)' }}>
                <IconTarget size={12} /> {skill.points}
              </span>
            )}
          </div>
        </div>
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="transition-transform group-open:rotate-180 shrink-0"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>

      <div className="px-4 pb-4 pt-1" style={{ color: 'var(--theme-text-secondary)' }}>
        <p className="text-body mb-3" style={{ lineHeight: 1.7 }}>{skill.summary}</p>
        <p className="text-body mb-4" style={{ lineHeight: 1.7 }}>{skill.parts}</p>
        <div
          className="word-card-v2 flex items-start gap-2 p-3 rounded-[11px] mb-4"
          style={{ background: 'color-mix(in srgb, var(--warn) 9%, transparent)', border: '1px solid color-mix(in srgb, var(--warn) 26%, transparent)', ['--card-accent' as string]: 'var(--warn)' } as React.CSSProperties}
        >
          <IconLightbulb size={16} style={{ color: 'var(--warn)', marginTop: 2 }} />
          <p className="text-body font-medium" style={{ color: 'var(--warn)' }}>{skill.tip}</p>
        </div>
        <Link
          href={skill.practiceHref}
          className="inline-flex items-center gap-2 text-body font-bold"
          style={{ color: 'var(--theme-text-primary)' }}
        >
          {t('practiceCta')}
          <IconArrowRight size={14} />
        </Link>
      </div>
    </details>
  );
}
