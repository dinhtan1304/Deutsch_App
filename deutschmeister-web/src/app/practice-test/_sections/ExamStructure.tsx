'use client';
/* eslint-disable no-restricted-syntax */

import { useState } from 'react';
import Link from 'next/link';
import {
  IconBookOpen, IconHeadphones, IconPenLine, IconMic, IconLightbulb,
  IconArrowRight, IconClock, IconTarget, IconList,
} from '@/components/ui/Icons';
import { GRADIENT } from '@/lib/tokens';
import { examStructureGoethe, examStructureTelc, type SkillDetail, type SkillKey } from '../_data/b1-content';

const SKILL_ICON: Record<SkillKey, React.ComponentType<{ size?: number; className?: string }>> = {
  lesen: IconBookOpen,
  hoeren: IconHeadphones,
  sprachbausteine: IconList,
  schreiben: IconPenLine,
  sprechen: IconMic,
};

export type ExamTab = 'goethe' | 'telc';

export function ExamStructure({ initialTab = 'goethe' }: { initialTab?: ExamTab }) {
  const [tab, setTab] = useState<ExamTab>(initialTab);
  const skills = tab === 'goethe' ? examStructureGoethe : examStructureTelc;

  return (
    <section id="cau-truc-de" className="mb-12 scroll-mt-20">
      <div className="mb-5">
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          Cấu trúc đề thi
        </h3>
        <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
          Chi tiết từng kỹ năng, thời gian, số Teile và mẹo làm bài.
        </p>
      </div>

      {/* Tabs */}
      <div
        className="inline-flex rounded-xl p-1 mb-5"
        style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
        role="tablist"
        aria-label="Chọn loại đề thi"
      >
        {(['goethe', 'telc'] as ExamTab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-body font-bold transition-all"
            style={{
              background: tab === t ? GRADIENT.brand : 'transparent',
              color: tab === t ? '#fff' : 'var(--theme-text-secondary)',
            }}
          >
            {t === 'goethe' ? 'Goethe B1' : 'TELC B1'}
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
  const Icon = SKILL_ICON[skill.key];

  return (
    <details
      className="group rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        border: '1px solid var(--theme-border)',
      }}
    >
      <summary
        className="flex items-center gap-4 p-4 cursor-pointer list-none"
        style={{ color: 'var(--theme-text-primary)' }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: GRADIENT[skill.gradient] }}
        >
          <Icon size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-h3 font-black">{skill.title}</span>
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
          className="flex items-start gap-2 p-3 rounded-xl mb-4"
          style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
        >
          <IconLightbulb size={16} style={{ color: 'var(--theme-text-muted)', marginTop: 2 }} />
          <p className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>{skill.tip}</p>
        </div>
        <Link
          href={skill.practiceHref}
          className="inline-flex items-center gap-2 text-body font-bold"
          style={{ color: 'var(--theme-text-primary)' }}
        >
          Luyện kỹ năng này ngay
          <IconArrowRight size={14} />
        </Link>
      </div>
    </details>
  );
}
