'use client';

import Link from 'next/link';
import { IconArrowLeft } from '@/components/ui/Icons';
import { GuideHeader } from '../_sections/GuideHeader';
import { ExamStructure, type ExamTab } from '../_sections/ExamStructure';
import { RoadmapB1 } from '../_sections/RoadmapB1';
import { SkillGuide } from '../_sections/SkillGuide';
import { GrammarVocab } from '../_sections/GrammarVocab';
import { B1Faq } from '../_sections/B1Faq';
import { B1FinalCta } from '../_sections/B1FinalCta';

export function GuideContent({ initialTab }: { initialTab: ExamTab }) {
  return (
    <div className="py-6 max-w-7xl mx-auto px-4">
      <Link
        href="/practice-test"
        className="inline-flex items-center gap-2 text-body font-semibold mb-4 transition-colors hover:opacity-80"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        <IconArrowLeft size={14} />
        Quay lại Luyện thi & kỹ năng
      </Link>

      <GuideHeader />
      <ExamStructure initialTab={initialTab} />
      <RoadmapB1 />
      <SkillGuide />
      <GrammarVocab />
      <B1Faq />
      <B1FinalCta />
    </div>
  );
}
